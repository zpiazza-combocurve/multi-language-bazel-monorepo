import io
import logging
from typing import Any
import pandas as pd
import numpy as np
import datetime
import dateutil
from bson import ObjectId

from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.production.production_service import ProductionService
from pyexcelerate import Workbook

from combocurve.shared.helpers import clean_up_str, remove_parentheses
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED
from combocurve.shared.forecast_tools.segment_plugin import templates, get_template
from combocurve.shared.forecast_tools.forecast_segments_check import check_forecast_segments
from api.forecast_mass_edit.phdwin_helper import convert_phdwin_forecast_to_cc, phdwin_to_cc_column_name_dict
from api.forecast_mass_edit.helpers import clean_series_name
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.date import get_current_time
from combocurve.services.files.file_helpers import make_file_os_safe
from combocurve.services.cc_to_aries.general_functions import truncate_inpt_id
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN_DECLINE, PHASES
from combocurve.science.segment_models.shared.helper import (arps_D_2_D_eff, exp_D_2_D_eff, linear_D_eff_2_k, my_bisect,
                                                             linear_get_k, linear_k_2_D_eff, arps_get_D, exp_get_D)

multi_seg = MultipleSegments()
ERROR_COL = 'Error'
SEGMENT = 'Segment'
SERIES = 'Series'
END_DATE = 'End Date'
START_DATE = 'Start Date'

MAX_SEG_YEARS = 100

D_LABEL = 'Di Eff-Sec'
D_SW_LABEL = 'Realized D Sw-Eff-Sec'
Q_START_LABEL = 'q Start'
Q_END_LABEL = 'q End'

FORECAST_MAX_WELL_NUMBER = 25000

IDENTIFIER_MAP_REVERSE = {
    'Chosen ID': 'chosenID',
    'INPT ID': 'inptID',
    'API 10': 'api10',
    'ARIES ID': 'aries_id',
    'API 14': 'api14',
    'PHDwin ID': 'phdwin_id',
    'API 12': 'api12'
}

IDENTIFIER_MAP = {
    'chosenID': 'Chosen ID',
    'inptID': 'INPT ID',
    'api10': 'API 10',
    'aries_id': 'ARIES ID',
    'api14': 'API 14',
    'phdwin_id': 'PHDwin ID',
    'api12': 'API 12'
}


class ForecastImportError(Exception):
    expected = True


def get_date_as_index(input_dict, key, error_list, row_index):
    error_dict = {'error_message': f'{key} is not a date', 'row_index': row_index}
    input_date = input_dict.get(key)
    if input_date is None:
        error_list.append(error_dict)
        return None
    else:
        try:
            if type(input_date) in [int, float]:
                if np.isnan(input_date):
                    error_list.append(error_dict)
                    return None
                date_index = int(input_date) - 2
            else:
                try:
                    np_date = np.datetime64(pd.to_datetime(input_date), 'D')
                except pd.errors.OutOfBoundsDatetime:
                    np_date = np.datetime64(pd.to_datetime(pd.Timestamp.max), 'D')
                date_index = (np_date - np.datetime64('1900-01-01')).astype(int).item()
            return date_index
        except Exception:
            error_list.append(error_dict)
            return None


def get_number(input_dict, key, error_list, row_index):
    error_dict = {'error_message': f'{key} is not a number', 'row_index': row_index}
    num = input_dict.get(key)
    if num is None:
        error_list.append(error_dict)
        return None
    else:
        try:
            ret_float = float(num)
            if np.isnan(ret_float):
                error_list.append(error_dict)
                return None
            else:
                return ret_float
        except Exception:
            error_list.append(error_dict)
            return None


def _get_eur_data(phase: str, phase_forecast_type: str, well_id: ObjectId, base_phase: str,
                  updated_rate_segs: dict[tuple[str, str], Any],
                  well_phase_forecast_data_dict: dict[tuple[str, str], Any], db_segments: dict[str, Any]):
    if phase_forecast_type == 'ratio':
        if (well_id, base_phase) in updated_rate_segs:
            base_segs = updated_rate_segs[(well_id, base_phase)]
        else:
            base_segs = well_phase_forecast_data_dict.get(
                (well_id, base_phase)).get('P_dict', {}).get('best', {}).get('segments', [])
    else:
        updated_rate_segs[(well_id, phase)] = db_segments.get('best', [])
        base_segs = None
    return base_segs


class ForecastImport:
    def __init__(self, context):
        self.context = context

    def forecast_import_upsert(self, query, body):
        return self.context.cc_to_cc_imports_model.objects(**query).update_one(
            upsert=True,
            full_result=True,
            **body,
            **query,
        )

    def delete_forecast_import(self, _id):
        return self.context.cc_to_cc_imports_model.objects(id=_id).delete()

    def get_chosen_inpt_id_dict(self, forecast):
        well_oids = forecast['wells']
        forecast_wells = self.context.well_service.get_wells_batch(well_oids, {"_id": 1, "chosenID": 1, "inptID": 1})
        chosen_inpt_id_dict = {}
        # duplicate_chosen_id = []
        for value in forecast_wells:
            if chosen_inpt_id_dict.get(value['chosenID']) is None:
                chosen_inpt_id_dict[value['chosenID']] = [value['inptID']]
            else:
                chosen_inpt_id_dict[value['chosenID']].append(value['inptID'])
        final_chosen_inpt_id_dict = {
            value: chosen_inpt_id_dict[value][-1]
            for value in chosen_inpt_id_dict if len(chosen_inpt_id_dict[value]) == 1
        }

        # duplicate_chosen_id = [key for key in chosen_inpt_id_dict if key not in final_chosen_inpt_id_dict]

        return final_chosen_inpt_id_dict

    def check_file_header(self, df_header, required_header):
        missing_headers = []
        for h in required_header:
            if h not in df_header:
                missing_headers.append(h)

        if missing_headers:
            error_message_str = 'Missing header(s): ' + ', '.join(missing_headers)

            raise ForecastImportError(error_message_str)

    @staticmethod
    def check_d_eff(d_eff, seg_type, phase_error_list, row_idx):
        if d_eff is None:
            phase_error_list.append({'error_message': 'Di Eff-Sec is not a number', 'row_index': row_idx})
            return
        if seg_type in ['arps', 'arps_modified', 'exp_dec'] and (d_eff <= 0 or d_eff >= 100):
            phase_error_list.append({
                'error_message': 'Di Eff-Sec should be larger than 0 and less than 100',
                'row_index': row_idx
            })
        elif seg_type in ['exp_inc', 'arps_inc'] and d_eff >= 0:
            # d_eff < 0
            phase_error_list.append({'error_message': 'Di Eff-Sec should be less than 0', 'row_index': row_idx})

    @staticmethod
    def check_b(b, seg_type, phase_error_list, row_idx):
        if b is None:
            return
        if seg_type == 'arps_inc':
            # b < 0
            if b >= 0:
                phase_error_list.append({'error_message': 'b should be less than 0', 'row_index': row_idx})
        else:
            # b > 0
            if b <= 0:
                phase_error_list.append({'error_message': 'b should be larger than 0', 'row_index': row_idx})

    def process_forecast_segements(self, segment_list, phase_error_list, db_segments, data_freq):
        prev_seg_end_idx = None
        prev_seg_template = None

        for i, seg in enumerate(segment_list):
            seg_type = clean_up_str(seg['Segment Type'])
            series_type = clean_up_str(seg[SERIES])
            series_type = clean_series_name(series_type)

            if seg_type == 'shut_in':
                seg_type = 'empty'

            if seg_type in templates and seg_type != 'common':
                seg_template = get_template(seg_type)
            else:
                phase_error_list.append({'error_message': 'Segment Type invalid', 'row_index': i})
                continue

            seg_template['name'] = seg_type

            # common
            if prev_seg_end_idx:
                start_idx = prev_seg_end_idx + 1
            else:
                start_idx = get_date_as_index(seg, START_DATE, phase_error_list, i)
            end_idx = get_date_as_index(seg, END_DATE, phase_error_list, i)

            seg_template['start_idx'] = start_idx
            seg_template['end_idx'] = end_idx

            if start_idx and end_idx and end_idx < start_idx:
                phase_error_list.append({'error_message': 'End Date should larger than Start Date', 'row_index': i})

            if prev_seg_end_idx is not None:
                if start_idx != prev_seg_end_idx + 1:
                    phase_error_list.append({
                        'error_message': 'Start Date is not 1 day after previous End Date',
                        'row_index': i
                    })
            prev_seg_end_idx = end_idx

            # q_start
            if seg_type != 'empty':
                q_start = get_number(seg, Q_START_LABEL, phase_error_list, i)
                seg_template['q_start'] = q_start
                if (q_start is not None) and (q_start <= 0):
                    phase_error_list.append({'error_message': 'q Start should be larger than 0', 'row_index': i})

            # b
            if seg_type in ['arps', 'arps_inc', 'arps_modified']:
                b = get_number(seg, 'b', phase_error_list, i)
                seg_template['b'] = b
                self.check_b(b, seg_type, phase_error_list, i)
            else:
                b = None

            # target_D_eff_sw
            if seg_type == 'arps_modified':
                target_D_eff_sw = get_number(seg, D_SW_LABEL, phase_error_list, i)  # noqa N806
                # convert D_eff from % to frac
                seg_template['target_D_eff_sw'] = target_D_eff_sw / 100 if target_D_eff_sw else target_D_eff_sw
                # 0 < target_D_eff_sw < 100
                if target_D_eff_sw and (target_D_eff_sw <= 0 or target_D_eff_sw >= 100):
                    phase_error_list.append({
                        'error_message': 'D Sw-Eff-Sec should be larger than 0, less than 1',
                        'row_index': i
                    })

            # D_eff
            if seg_type in ['arps', 'arps_inc', 'arps_modified', 'exp_inc', 'exp_dec', 'linear']:
                if seg_type == 'linear':
                    d_eff = self.calc_linear_d_eff(seg, D_LABEL, phase_error_list, i, start_idx, end_idx)  # noqa N806
                else:
                    d_eff = get_number(seg, D_LABEL, phase_error_list, i)  # noqa N806
                if not d_eff and len(phase_error_list) >= 1:
                    phase_error_list.pop()
                    d_eff = self.calc_d_eff_two_points(seg_type, seg, start_idx, end_idx, q_start, b, d_eff)
                    if not d_eff and len(segment_list) <= 2 and i == len(segment_list) - 1:
                        d_eff = self.auto_calculate_d_eff(seg_type, seg, seg_template, d_eff, phase_error_list, i,
                                                          data_freq, prev_seg_template)  # noqa N806
                    elif seg_type == 'arps_modified':
                        phase_error_list.append({
                            'error_message':
                            'Auto-calculating Di can not be performed for the provided forecast segments.',
                            'row_index': i
                        })

                if d_eff == 0:  # if D is 0, make this segment flat
                    seg_type = 'flat'
                    seg_template = get_template(seg_type)
                    seg_template['start_idx'] = start_idx
                    seg_template['end_idx'] = end_idx
                    seg_template['q_start'] = q_start
                else:
                    seg_template['D_eff'] = d_eff / 100 if d_eff else d_eff  # convert D_eff from % to frac
                    self.check_d_eff(d_eff, seg_type, phase_error_list, i)

            seg_template = MultipleSegments.fill_segment(seg_template, seg_type, phase_error_list)
            prev_seg_template = seg_template
            self.db_segments_p_series(db_segments, series_type, seg_template)

    def calc_d_eff_two_points(self, seg_type, seg, start_idx, end_idx, q_start, b, original_d_eff):
        if seg_type not in ['arps', 'arps_inc', 'exp_inc', 'exp_dec']:
            return original_d_eff
        try:
            q_end = get_number(seg, Q_END_LABEL, [], 0)
            if q_end <= 0 or not q_end:
                return None
            if seg_type in ['arps', 'arps_inc']:
                arps_d = arps_get_D(start_idx, q_start, end_idx, q_end, b)
                arps_d_eff = arps_D_2_D_eff(arps_d, b)
                return arps_d_eff * 100
            elif seg_type in ['exp_inc', 'exp_dec']:
                exp_d = exp_get_D(start_idx, q_start, end_idx, q_end)
                exp_d_eff = exp_D_2_D_eff(exp_d)
                return exp_d_eff * 100
        except Exception:
            return original_d_eff

    def calc_linear_d_eff(self, seg, label, phase_error_list, i, start_idx, end_idx):
        d_eff_original = None
        try:
            q_start = float(seg['q Start'])
            q_end = float(seg['q End'])
            d_eff_original = get_number(seg, label, phase_error_list, i) / 100
            k_original = linear_D_eff_2_k(d_eff_original, q_start)

            calc_q_end = k_original * (end_idx - start_idx) + q_start

            if calc_q_end >= 0:
                return d_eff_original * 100
            else:
                k = linear_get_k(start_idx, q_start, end_idx, q_end)
                d_eff = linear_k_2_D_eff(k, q_start) * 100
                return d_eff

        except Exception:
            if d_eff_original:
                return d_eff_original * 100
            else:
                phase_error_list.append({'error_message': 'No D Eff-sec available for linear segment', 'row_index': i})
                return d_eff_original

    def get_info_for_d_eff_calc(self, seg, data_freq, phase_error_list, row_index, prev_seg_template=None):
        valid = True
        eur = get_number(seg, 'EUR', phase_error_list, row_index)

        if not prev_seg_template:
            if data_freq == 'monthly':
                cum_data = get_number(seg, 'Monthly Cum', [], 0)
                end_data_idx = get_date_as_index(seg, 'Last Prod Date Monthly', [], 0)

            else:
                cum_data = get_number(seg, 'Daily Cum', [], 0)
                end_data_idx = get_date_as_index(seg, 'Last Prod Date Daily', [], 0)

        if prev_seg_template:
            left_idx = prev_seg_template['start_idx']
            right_idx = prev_seg_template['end_idx']
            cum_data = multi_seg.eur(0, left_idx - 100, left_idx, right_idx, [prev_seg_template], data_freq) / 1000
            end_data_idx = None

        if not cum_data:
            cum_data = 0

        if phase_error_list:
            valid = False
            ret = None
        else:
            ret = {'eur': eur, 'end_data_idx': end_data_idx, 'cum_data': cum_data * 1000}

        return valid, ret

    def auto_calculate_d_eff(self,
                             seg_type,
                             seg,
                             seg_template,
                             d_eff,
                             phase_error_list,
                             row_index,
                             data_freq,
                             prev_seg_template=None):

        if seg_type != 'arps_modified' or phase_error_list:
            return d_eff

        else:
            valid, eur_calc_info = self.get_info_for_d_eff_calc(seg, data_freq, phase_error_list, row_index,
                                                                prev_seg_template)
            calculated_d_eff = None

            if valid:

                def calc_eur(d_eff):
                    seg_template['D_eff'] = d_eff
                    this_segment_template = MultipleSegments.fill_segment(seg_template, seg_type, phase_error_list)
                    left_idx = this_segment_template['start_idx']
                    right_idx = this_segment_template['end_idx']
                    end_data_idx = eur_calc_info['end_data_idx'] if eur_calc_info['end_data_idx'] else left_idx - 100
                    return multi_seg.eur(eur_calc_info['cum_data'], end_data_idx, left_idx, right_idx,
                                         [this_segment_template], data_freq) - eur_calc_info['eur'] * 1000

                def bisect_d_eff(values):
                    if type(values) == np.ndarray:
                        v1 = calc_eur(values[0])
                        v2 = calc_eur(values[1])
                        return np.array([v1, v2])
                    else:
                        return calc_eur(values)

                try:
                    calculated_d_eff = my_bisect(bisect_d_eff, D_EFF_MIN_DECLINE, D_EFF_MAX, 1e-5)  # noqa N806
                except Exception as e:
                    phase_error_list.append({
                        'error_message': 'No Di can reach the current EUR',
                        'row_index': row_index
                    })
                    calculated_d_eff = None
                    error_info = get_exception_info(e)
                    logging.error(error_info['message'], extra={'metadata': error_info})

            return calculated_d_eff * 100 if calculated_d_eff else None

    def db_segments_p_series(self, db_segments, series_type, seg_template):
        if series_type not in db_segments:
            db_segments[series_type] = [seg_template]
        else:
            db_segments[series_type].append(seg_template)

    def query_forecast_data(self, forecast_id, forecast_parent_type):
        project_dict = {
            '_id': 0,
            'well': 1,
            'phase': 1,
            'P_dict': 1,
            'forecast': 1,
            'forecasted': 1,
            'data_freq': 1,
            'ratio': 1,
            'forecastType': 1,
        }

        if forecast_parent_type == 'deterministic':
            forecast_data_list = list(
                self.context.deterministic_forecast_datas_collection.find({'forecast': forecast_id}, project_dict))
        else:
            forecast_data_list = list(
                self.context.forecast_datas_collection.find({'forecast': forecast_id}, project_dict))

        well_phase_forecast_data_dict = {(d['well'], d['phase']): d for d in forecast_data_list}

        return well_phase_forecast_data_dict

    def check_forecast_data_info(self, forecast_parent_type, forecast_first_row, phase_error_list,
                                 sorted_phase_forecast_df):
        phase_forecast_type = None
        base_phase = None
        phase_p_series = None

        if forecast_parent_type == 'deterministic':
            phase_p_series = ['best']
            phase_forecast_type = clean_up_str(forecast_first_row['Type'])
            if phase_forecast_type not in ['ratio', 'rate']:
                phase_error_list.append({
                    'error_message': 'Deterministic forecast Type must be ratio or rate (case insensitive)',
                    'row_index': 0
                })
            else:
                if phase_forecast_type == 'ratio':
                    base_phase = clean_up_str(forecast_first_row['Base Phase'])
                    if base_phase not in ['oil', 'gas', 'water']:
                        phase_error_list.append({'error_message': 'Base Phase not valid', 'row_index': 0})
        else:
            raw_phase_p_series = sorted_phase_forecast_df[SERIES].unique().tolist()
            phase_p_series = set()
            for p_series in raw_phase_p_series:
                cleaned_p_series = clean_up_str(p_series)
                if cleaned_p_series not in ['p10', 'p50', 'p90', 'best']:
                    phase_error_list.append({'error_message': 'Series not valid', 'row_index': 0})
                else:
                    if cleaned_p_series in ['p10', 'p50', 'p90']:
                        cleaned_p_series = cleaned_p_series[0].upper() + cleaned_p_series[1:]
                phase_p_series.add(cleaned_p_series)

        return phase_forecast_type, base_phase, phase_p_series

    def append_to_error_df(self, error_df, forecast_df, error_list):
        error_col = [''] * forecast_df.shape[0]
        for error in error_list:
            error_index = error['row_index']
            error_message = error['error_message']
            if error_col[error_index] == '':
                error_col[error_index] += error_message
            else:
                error_col[error_index] += '; ' + error_message

        forecast_df[ERROR_COL] = error_col

        error_df = error_df.append(forecast_df)

        return error_df

    def append_to_bw_list(self, db_segments, forecast_datas_bw_list, forecast_id, well_id, phase, data_freq,
                          forecast_parent_type, original_forecasted, phase_forecast_type, base_phase, phase_p_series,
                          user_id, cum, last_prod_idx, base_segs):
        p_dict = None
        ratio = None
        if forecast_parent_type == 'deterministic':
            forecast_service: DeterministicForecastService = self.context.deterministic_forecast_service
            if phase_forecast_type == 'ratio':
                forecast_type = 'ratio'
                ratio = {'basePhase': base_phase, 'segments': db_segments['best']}
            else:
                forecast_type = 'rate'
                p_dict = {'best': {'segments': db_segments['best']}}

        else:
            forecast_service: ForecastService = self.context.forecast_service
            p_dict = {}
            for p_series in phase_p_series:
                p_dict['p_series'] = {'segments': db_segments[p_series]}
                forecast_type = 'imported'
            if not original_forecasted or original_forecasted == 'not_forecasted':
                sorted_p_series = sorted(list(phase_p_series))
                for p in ['P10', 'P50', 'P90', 'best']:
                    if p in phase_p_series:
                        continue
                    p_dict[p] = {'segments': db_segments[sorted_p_series[-1]]}

        update_info = {
            'well_id': well_id,
            'forecast_id': forecast_id,
            'phase': phase,
            'user': user_id,
            'P_dict': p_dict,
            'forecasted': True,
            'forecastType': forecast_type,
            'forecastSubType': 'imported',
            'ratio': ratio,
            'data_freq': data_freq,
            'calc_eur': True,
            'cum': cum,
            'last_prod_idx': last_prod_idx,
            'base_segs': base_segs
        }

        write_data = forecast_service.get_update_body(**update_info)
        forecast_datas_bw_list.append(write_data)

    def get_forecast_df(self, file_id, forecast, source):
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        excel_bytes = self.context.file_service.download_to_memory(file_gcp_name)
        excel_bytes.seek(0)

        if '.xlsx' in file_gcp_name:
            forecast_df = pd.read_excel(excel_bytes, index_col=None, dtype='object', engine='openpyxl')
        elif '.xls' in file_gcp_name:
            forecast_df = pd.read_excel(excel_bytes, index_col=None, dtype='object', engine='xlrd')
        elif '.csv' in file_gcp_name:
            try:
                forecast_df = pd.read_csv(excel_bytes, index_col=None, dtype='object', encoding='utf-8')
            except Exception:
                excel_bytes = self.context.file_service.download_to_memory(file_gcp_name)
                excel_bytes.seek(0)
                forecast_df = pd.read_csv(excel_bytes, index_col=None, dtype='object', encoding='latin1')
        else:
            raise ForecastImportError('Can only accept file with ".xlsx", ".xls" or ".csv" extension.')
        excel_bytes.close()

        forecast_df = forecast_df.dropna(how='all')  # drop row when all cols are nan

        if source == 'phdWin':
            # check for required columns
            self.check_file_header(forecast_df.columns, phdwin_to_cc_column_name_dict.keys())

            chosen_inpt_id_dict = self.get_chosen_inpt_id_dict(forecast)
            forecast_df = convert_phdwin_forecast_to_cc(forecast_df, chosen_inpt_id_dict)

        forecast_parent_type = forecast['type']
        if forecast_parent_type == 'deterministic':
            forecast_df[SERIES] = 'best'

        return forecast_df

    def get_first_forecast_df(self, phase_forecast_df):
        phase_forecast_df[SEGMENT] = phase_forecast_df[SEGMENT].astype('int', errors='ignore')
        segment_col = phase_forecast_df[SEGMENT]
        if len(segment_col.unique()) == len(segment_col):
            return phase_forecast_df
        else:
            segment_col = segment_col.to_list()
            seg_filter = [False] * len(segment_col)
            for idx, s in enumerate(segment_col):
                if idx == 0 or s > segment_col[idx - 1]:
                    seg_filter[idx] = True
                else:
                    break
            return phase_forecast_df.iloc[seg_filter]

    def segments(self, sorted_phase_forecast_df, phase_error_list):
        if len(sorted_phase_forecast_df) == 1:
            # if only 1 segment update EndDate if too large or not valid
            def read_date(input_date):
                try:
                    ret_date = pd.to_datetime(input_date)
                except (pd.errors.OutOfBoundsDatetime, dateutil.parser._parser.ParserError):
                    ret_date = None

                return ret_date

            start_date = read_date(sorted_phase_forecast_df.iloc[0][START_DATE])
            end_date = read_date(sorted_phase_forecast_df.iloc[0][END_DATE])

            if start_date and not end_date:
                end_date = start_date + pd.offsets.DateOffset(years=MAX_SEG_YEARS)
                sorted_phase_forecast_df.iloc[0, sorted_phase_forecast_df.columns.get_loc(END_DATE)] = end_date

        try:
            segment_list = sorted_phase_forecast_df.to_dict('records')
        except pd.errors.OutOfBoundsDatetime:
            segment_list = []
            phase_error_list.append({'error_message': 'Dates need to be less than 4/11/2262', 'row_index': 0})

        return segment_list

    def upload_to_storage(self, error_df, project_id, forecast_id, user_id):
        gcp_name = None

        # upload error report to cloud storage
        if not error_df.empty:
            excel_buffer = io.BytesIO()
            error_df.to_excel(excel_buffer, index=False)
            run_date = datetime.datetime.utcnow()

            gcp_name = f'forecast-import-error--{str(forecast_id)}--{run_date.isoformat()}.xlsx'
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            self.upload_file_buffer(excel_buffer,
                                    gcp_name,
                                    gcp_name,
                                    content_type,
                                    user_id=user_id,
                                    project_id=project_id)

        return gcp_name

    def upload_file_buffer(self, buffer, gcp_name, file_name, content_type, user_id=None, project_id=None):
        file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': user_id}

        self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=file_info,
            user_id=user_id,
            project_id=project_id,
        )

    def get_required_headers(self, forecast_parent_type, identifier):
        required_header = [
            identifier, 'Phase', SEGMENT, 'Segment Type', START_DATE, END_DATE, Q_START_LABEL, D_LABEL, 'b', D_SW_LABEL
        ]

        if forecast_parent_type == 'deterministic':
            required_header += ['Type', 'Base Phase']
        else:
            required_header += [SERIES]

        return required_header

    def export_aries_error_log(self, params, project_id, aries_error_log, forecast_error_df=None):
        file_name = None
        if aries_error_log:
            forecast_id = params.get('forecast_id')
            user_id = params.get('user_id')
            current_time = get_current_time(tz=params.get('time_zone', 'US/Central'))
            aries_parameters_dict = {'chosen_id': [], 'aries_row': [], 'message': []}

            for log in aries_error_log:
                for key in log:
                    aries_parameters_dict[key].append(log[key])

            wb = Workbook()
            file_buffer = io.BytesIO()
            file_name = make_file_os_safe(
                f'forecast-aries-import-error--{str(forecast_id)}--{current_time.strftime("%Y-%m-%d-%H-%M-%S-%f")}')
            file_name = file_name + '.xlsx'
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            wb.new_sheet('Aries Import Errors',
                         data=[['Chosen ID', 'Aries Row', 'Error Message']]
                         + pd.DataFrame(aries_parameters_dict).values.tolist())

            if forecast_error_df is not None and not forecast_error_df.empty:
                wb.new_sheet('CC Import Errors',
                             data=[forecast_error_df.columns.tolist()] + forecast_error_df.values.tolist())
            wb.save(file_buffer)
            self.upload_file_buffer(file_buffer,
                                    file_name,
                                    file_name,
                                    content_type,
                                    user_id=user_id,
                                    project_id=project_id)

        return file_name

    def format_well_identifier(self, well_identifier, source, identifier_type):
        if source == 'aries' and identifier_type == 'inptID':
            well_identifier = truncate_inpt_id(well_identifier)

        return well_identifier

    def remove_wells_without_identifier(self, forecast_wells, identifier_type):
        ret = []
        for well in forecast_wells:
            if identifier_type in well:
                ret.append(well)

        if not ret:
            raise ForecastImportError('Missing selected well identifiers for all wells.')

        return ret

    def forecast_import(self, import_input, aries_error_log=None, aries_import_df=None):
        forecast_id = ObjectId(import_input.get('forecast_id'))
        file_id = import_input.get('file_id')
        user_id = import_input.get('user_id')
        notification_id = import_input.get('notification_id')
        data_freq = import_input.get('data_freq', 'monthly')
        source = import_input.get('source', 'cc')
        forecast = self.context.db['forecasts'].find_one({'_id': forecast_id})
        identifier_type = import_input.get('well_identifier', 'inptID')

        if aries_import_df is False:
            return self.export_aries_error_log(import_input, forecast['project'], aries_error_log)
        elif aries_import_df is None:
            forecast_df = self.get_forecast_df(file_id, forecast, source)
        else:
            forecast_df = aries_import_df

        forecast_df = forecast_df.rename(remove_parentheses, axis='columns')

        forecast_parent_type = forecast['type']
        forecast_wells = self.context.well_service.get_wells_batch(forecast['wells'], {'_id': 1, identifier_type: 1})
        forecast_wells = self.remove_wells_without_identifier(forecast_wells, identifier_type)
        identifier_to_well_id = {
            self.format_well_identifier(i[identifier_type], source, identifier_type): i['_id']
            for i in forecast_wells
        }

        required_header = self.get_required_headers(forecast_parent_type, IDENTIFIER_MAP[identifier_type])
        well_phase_forecast_data_dict = self.query_forecast_data(forecast_id, forecast_parent_type)

        df_header = forecast_df.columns
        self.check_file_header(df_header, required_header)

        if ERROR_COL in df_header:
            forecast_df = forecast_df.drop(ERROR_COL, axis=1)

        forecast_datas_bw_list = []

        self._update_user_progress(user_id, notification_id, 5)

        error_df = pd.DataFrame(columns=list(forecast_df.columns) + [ERROR_COL])

        inpt_ids = forecast_df[IDENTIFIER_MAP[identifier_type]].unique().tolist()

        # get rid of wells not in forecast otherwise we may end up processing way more wells that may cuase issue
        if len(inpt_ids) > FORECAST_MAX_WELL_NUMBER:
            inpt_ids = [i for i in inpt_ids if i in identifier_to_well_id]

        if data_freq == 'daily':
            daily_wells = [str(identifier_to_well_id[i]) for i in inpt_ids if i in identifier_to_well_id]
            monthly_wells = []
        else:
            daily_wells = []
            monthly_wells = [str(identifier_to_well_id[i]) for i in inpt_ids if i in identifier_to_well_id]
        prod_service: ProductionService = self.context.production_service
        cums_and_last_prods = prod_service.get_cums_and_last_prods(daily_wells, monthly_wells, PHASES)

        update_freq = max(len(inpt_ids) // 20, 1)
        for idx, identifier in enumerate(inpt_ids):
            well_forecast_df = forecast_df[forecast_df[IDENTIFIER_MAP[identifier_type]] == identifier]

            if identifier not in identifier_to_well_id:
                n_rows = well_forecast_df.shape[0]
                well_forecast_df[ERROR_COL] = ['Well not in forecast'] + [None] * (n_rows - 1)
                error_df = error_df.append(well_forecast_df)
                continue

            well_id = identifier_to_well_id[identifier]

            well_forecast_df['Phase'] = well_forecast_df['Phase'].apply(clean_up_str)
            well_forecast_df['Type'] = well_forecast_df['Type'].apply(clean_up_str)
            rate_phases = well_forecast_df.loc[well_forecast_df['Type'] == 'rate', 'Phase'].unique().tolist()
            ratio_phases = well_forecast_df.loc[well_forecast_df['Type'] == 'ratio', 'Phase'].unique().tolist()
            updated_rate_segs = {}
            phase_list = rate_phases + ratio_phases

            for phase in phase_list:
                db_segments = {}
                phase_error_list = []

                phase_forecast_df = well_forecast_df[well_forecast_df['Phase'] == phase]
                sorted_phase_forecast_df = phase_forecast_df.sort_values(by=[SEGMENT])

                if phase not in ['oil', 'gas', 'water']:
                    phase_error_list.append({'error_message': 'Phase must be one of oil, gas or water', 'row_index': 0})
                    error_df = self.append_to_error_df(error_df, sorted_phase_forecast_df, phase_error_list)
                    continue

                well_id = identifier_to_well_id[identifier]
                well_phase_forecast_data = well_phase_forecast_data_dict.get((well_id, phase))

                if not well_phase_forecast_data:
                    continue

                original_forecasted = well_phase_forecast_data.get('forecastType')

                forecast_first_row = sorted_phase_forecast_df.iloc[0]
                phase_forecast_type, base_phase, phase_p_series = self.check_forecast_data_info(
                    forecast_parent_type, forecast_first_row, phase_error_list, sorted_phase_forecast_df)

                for series in phase_p_series:
                    sub_df = sorted_phase_forecast_df[sorted_phase_forecast_df[SERIES] == series]
                    sub_df = self.get_first_forecast_df(sub_df)
                    segment_list = sub_df.sort_values(by=[SEGMENT])

                    segment_list = self.segments(segment_list, phase_error_list)
                    self.process_forecast_segements(segment_list, phase_error_list, db_segments, data_freq)

                # check segments
                if not phase_error_list:
                    error_idx = 0
                    for key in db_segments:
                        segments_valid_bool, _ = check_forecast_segments(db_segments[key])
                        if not segments_valid_bool:
                            phase_error_list.append({
                                'error_message': 'Phase segments failed to pass the check',
                                'row_index': error_idx
                            })
                        error_idx += len(db_segments[key])

                # write error message to forecast_df
                if phase_error_list:
                    error_df = self.append_to_error_df(error_df, sorted_phase_forecast_df, phase_error_list)
                else:
                    # append bw_list if no error
                    cum = cums_and_last_prods[data_freq][str(well_id)][phase]
                    last_prod_idx = cums_and_last_prods[data_freq][str(well_id)]['last_prod']
                    base_segs = _get_eur_data(phase, phase_forecast_type, well_id, base_phase, updated_rate_segs,
                                              well_phase_forecast_data_dict, db_segments)

                    self.append_to_bw_list(
                        db_segments,
                        forecast_datas_bw_list,
                        forecast_id,
                        well_id,
                        phase,
                        data_freq,
                        forecast_parent_type,
                        original_forecasted,
                        phase_forecast_type,
                        base_phase,
                        phase_p_series,
                        user_id,
                        cum,
                        last_prod_idx,
                        base_segs,
                    )

            # update progress bar
            if idx % update_freq == 0:
                well_prog = 5 + round(85 * (idx + 1) / len(inpt_ids))
                self._update_user_progress(user_id, notification_id, well_prog)

        # update forecast_data documents
        if forecast_parent_type == 'deterministic':
            forecast_service: DeterministicForecastService = self.context.deterministic_forecast_service
        else:
            forecast_service: ForecastService = self.context.forecast_service
        forecast_service.write_forecast_data_to_db(forecast_datas_bw_list)

        self._update_user_progress(user_id, notification_id, 99)

        if aries_error_log:
            gcp_name = self.export_aries_error_log(import_input,
                                                   forecast['project'],
                                                   aries_error_log,
                                                   forecast_error_df=error_df)
        else:
            # upload cc error report to cloud storage
            gcp_name = self.upload_to_storage(error_df, forecast['project'], forecast_id, user_id)

        return gcp_name

    def forecast_import_with_check(self, import_input, aries_error_log=None, aries_import_df=None):
        forecast_id = import_input.get('forecast_id')
        file_id = import_input.get('file_id')
        user_id = import_input.get('user_id')
        notification_id = import_input.get('notification_id')
        forecast_name = import_input.get('forecast_name')

        upsert_query = {'forecastId': ObjectId(forecast_id)}
        upsert_body = {
            'userId': ObjectId(user_id),
            'fileId': ObjectId(file_id),
            'inc__lock': 1,
        }

        error_report_gcp_name = None

        upsert_result = self.forecast_import_upsert(upsert_query, upsert_body)
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        description = ''
        status = TASK_STATUS_FAILED

        try:
            if upsert_result.upserted_id:
                try:
                    error_report_gcp_name = self.forecast_import(import_input,
                                                                 aries_error_log=aries_error_log,
                                                                 aries_import_df=aries_import_df)
                    if error_report_gcp_name:
                        description = f'Forecast: {forecast_name} import finished with error(s)'
                    else:
                        description = f'Forecast: {forecast_name} import finished'
                    status = TASK_STATUS_COMPLETED
                except Exception as e:
                    description = 'Error happened during forecast import'
                    raise e
                finally:
                    self.delete_forecast_import(upsert_result.upserted_id)
            else:
                description = f'Another user is importing to forecast: {forecast_name}, please try again later'
                raise ForecastImportError(description)
        finally:
            self.context.file_service.delete_file(file_gcp_name)

            notification_update = {
                'title': f'Forecast Import - {forecast_name}',
                'description': description,
                'status': status,
                'extra.output': {
                    'file': {
                        'gcpName': error_report_gcp_name,
                        'name': 'error_log.xlsx'
                    }
                }
            }

            self.context.notification_service.update_notification_with_notifying_target(
                notification_id, notification_update)

    def _update_user_progress(self, user_id, notification_id, progress):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })
