from typing import Any, Dict
from bson.objectid import ObjectId
import numpy as np
import math
from datetime import date, timedelta
from combocurve.science.core_function.helper import shift_idx
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.constants import BASE_TIME_NPDATETIME64, Q_MAX, Q_MIN
from combocurve.science.segment_models.shared.helper import (arps_modified_get_t_end_from_q_end,
                                                             exp_get_t_end_from_q_end, arps_get_t_end_from_q_end,
                                                             linear_get_t_end_from_q_end)

from combocurve.shared.batch_runner_with_notification import batch_updates_with_progress
from collections import defaultdict
from combocurve.shared.constants import DATE_IDX_LARGE, PHASES

multi_seg = MultipleSegments()


def shift_date_monthly(date, shift_num):
    if not date:
        return date
    else:
        new_date_idx = (np.datetime64(date, 'M').astype('datetime64[D]')
                        - BASE_TIME_NPDATETIME64).astype(int) + shift_num
    return new_date_idx


def get_end_idx_from_q_end(segment, segment_name, q_end, end_idx):

    if segment_name in ['empty', 'flat']:
        return end_idx
    elif segment_name in ['exp_inc', 'exp_dec']:
        this_end_idx = exp_get_t_end_from_q_end(segment['start_idx'], segment['q_start'], segment['D'], q_end)
    elif segment_name in ['arps', 'arps_inc']:
        this_end_idx = arps_get_t_end_from_q_end(segment['start_idx'], segment['q_start'], segment['D'], segment['b'],
                                                 q_end)
    elif segment_name == 'arps_modified':
        this_end_idx = arps_modified_get_t_end_from_q_end(segment['start_idx'], segment['q_start'], segment['D'],
                                                          segment['b'], segment['sw_idx'], segment['D_exp'], q_end)

    elif segment_name == 'linear':
        if segment['k'] == 0:
            this_end_idx = segment['end_idx']
        else:
            this_end_idx = linear_get_t_end_from_q_end(segment['start_idx'], segment['q_start'], segment['k'], q_end)

    if not math.isinf(this_end_idx) and this_end_idx <= DATE_IDX_LARGE:
        return int(np.floor(this_end_idx))
    else:
        return "End index is out of range."


def update_warning_message(forecast_updater, forecast_id, well_id, phase, warning_message):
    warning = {'status': True, 'message': warning_message}

    update = forecast_updater.get_update_body(
        well_id=well_id,
        forecast_id=forecast_id,
        phase=phase,
        warning=warning,
    )

    return update


class MassModifyWellLifeService(object):
    def __init__(self, context):
        self.context = context

    # params = {
    #     'forecast_id': '5ebc8b90fd48b1001274eef7',
    #     'oil/gas/water': {
    #         'well_life_dict': {
    #             'well_life_method': "duration_from_first_data",
    #             'num': 60,
    #             'unit': "year",
    #             "fixed_date": "2021-06-21T19:00:01.141Z"
    #         },
    #         'q_final': 0.2
    #     },
    #     'wells': ["5ebc8b71fd48b1001274eef3"],
    #     'same_well_life': 'oil' or 'gas' or 'water' or 'primary_product' or 'independent',
    # }

    def _get_forecast_data(self, forecast_id, phases, wells):
        deterministic_forecast_pipeline = [{
            '$match': {
                'forecast': ObjectId(forecast_id),
                'well': {
                    '$in': list(map(lambda well: ObjectId(well), wells))
                },
                'phase': {
                    '$in': phases
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'well': 1,
                'phase': 1,
                'forecastType': 1,
                'data_freq': 1,
                'ratio': 1,
                'P_dict': 1,
            }
        }]

        deterministic_forecast_datas = list(
            self.context.deterministic_forecast_datas_collection.aggregate(deterministic_forecast_pipeline))

        wells_forecast = defaultdict(dict)

        for d in deterministic_forecast_datas:
            wells_forecast[str(d['well'])][d['phase']] = d

        return wells_forecast

    def _get_wells_info(self, wells):
        wells_pipeline = [{
            '$match': {
                '_id': {
                    '$in': list(map(lambda well: ObjectId(well), wells))
                }
            }
        }, {
            '$project': {
                '_id': 1,
                'first_prod_date': 1,
                'last_prod_date_monthly': 1,
                'last_prod_date_daily': 1,
                'first_prod_date_daily_calc': 1,
                'first_prod_date_monthly_calc': 1,
                'primary_product': 1,
            }
        }]

        well_headers = list(self.context.wells_collection.aggregate(wells_pipeline))
        well_dict = {}

        for well in well_headers:
            well_dict[str(well['_id'])] = {
                'first_prod_date': well.get('first_prod_date'),
                'last_prod_date_monthly': well.get('last_prod_date_monthly'),
                'last_prod_date_daily': well.get('last_prod_date_daily'),
                'first_prod_date_daily_calc': well.get('first_prod_date_daily_calc'),
                'first_prod_date_monthly_calc': well.get('first_prod_date_monthly_calc'),
                'primary_product': well.get('primary_product'),
            }

        return well_dict

    def _get_cums_and_last_prods(self, wells_forecast: Dict[str, Dict[str, Dict[str, Any]]]):
        daily_wells = []
        monthly_wells = []
        for well_id, forecast_data in wells_forecast.items():
            is_daily = False
            is_monthly = False
            for phase_forecast in forecast_data.values():
                is_daily = is_daily or phase_forecast['data_freq'] == 'daily'
                is_monthly = is_monthly or phase_forecast['data_freq'] == 'monthly'
            if is_daily:
                daily_wells.append(well_id)
            if is_monthly:
                monthly_wells.append(well_id)
        return self.context.production_service.get_cums_and_last_prods(daily_wells, monthly_wells, PHASES)

    def _get_t_end_idx(self, well, phase, data_freq, phase_segments, well_info, well_life_dict, wells_end_idx_dict):

        num = well_life_dict['num']
        unit = well_life_dict['unit']

        if well_life_dict['well_life_method'] == 'fixed_date':
            wells_end_idx_dict[well][phase]['t_end_idx'] = well_life_dict['fixed_date']
            t_begin = 'fixed_date'
        elif well_life_dict['well_life_method'] == 'duration_from_first_data':
            t_begin = well_info['first_prod_date']
            if not t_begin and data_freq == 'monthly':
                t_begin = well_info['first_prod_date_monthly_calc']
            elif not t_begin:
                t_begin = well_info['first_prod_date_daily_calc']
            if t_begin:
                if data_freq == 'monthly':
                    t_begin = shift_date_monthly(t_begin, 14)
                else:
                    t_begin = (np.datetime64(t_begin, 'D') - BASE_TIME_NPDATETIME64).astype(int)

        elif well_life_dict['well_life_method'] == 'duration_from_last_data':
            if data_freq == 'monthly':
                t_begin = well_info['last_prod_date_monthly']
            else:
                t_begin = well_info['last_prod_date_daily']
            if t_begin:
                t_begin = t_begin + timedelta(1)
                if data_freq == 'monthly':
                    t_begin = shift_date_monthly(t_begin, 14)
                else:
                    t_begin = (np.datetime64(t_begin, 'D') - BASE_TIME_NPDATETIME64).astype(int)
        elif well_life_dict['well_life_method'] == 'duration_from_today':
            today = np.datetime64(date.today())
            t_begin = (today - BASE_TIME_NPDATETIME64).astype(int)

        elif well_life_dict['well_life_method'] == 'forecast_start_date':
            t_begin = phase_segments[0].get('start_idx')

        if not t_begin:
            wells_end_idx_dict[well][phase]['valid_end_idx'] = 'First/Last production Date is missing.'
        elif well_life_dict['well_life_method'] != 'fixed_date':

            shift_t_end_life = shift_idx(t_begin, num, unit)
            wells_end_idx_dict[well][phase]['t_end_idx'] = shift_t_end_life

    def get_end_idx_well_life(self, params, well, phase, wells_forecast, wells_info, wells_end_idx_dict):

        phase_forecast = wells_forecast.get(well, {}).get(phase, {})
        phase_forecast_type = phase_forecast.get('forecastType')

        if phase_forecast_type == 'rate':
            phase_segments = phase_forecast.get('P_dict', {}).get('best', {}).get('segments')
        elif phase_forecast_type == 'ratio':
            phase_segments = phase_forecast.get('ratio', {}).get('segments')
        else:
            phase_segments = None

        if not phase_segments:
            wells_end_idx_dict[well][phase]['valid_end_idx'] = 'No forecast data.'
        else:
            well_info = wells_info[well]
            data_freq = phase_forecast['data_freq']
            well_life_dict = params[phase]['well_life_dict']
            self._get_t_end_idx(well, phase, data_freq, phase_segments, well_info, well_life_dict, wells_end_idx_dict)

    def get_end_idx_q_final(self, params, well, phase, wells_info, wells_forecast, wells_end_idx_dict):
        valid_end_idx_check = wells_end_idx_dict.get(well, {}).get(phase, {}).get('valid_end_idx')
        if valid_end_idx_check:
            return

        phase_forecast = wells_forecast[well][phase]
        phase_forecast_type = phase_forecast['forecastType']

        if phase_forecast_type == 'rate':
            phase_segments = phase_forecast.get('P_dict', {}).get('best', {}).get('segments')
        else:
            phase_segments = phase_forecast.get('ratio', {}).get('segments')

        q_final = params[phase]['q_final']
        segment_slope = phase_segments[-1].get('slope', -1)
        segment_name = phase_segments[-1]['name']

        if segment_slope == 1:
            t_end_life = get_end_idx_from_q_end(phase_segments[-1], segment_name, min(max(q_final, Q_MIN), Q_MAX),
                                                phase_segments[-1]['end_idx'])
        elif segment_slope == -1:
            t_end_life = get_end_idx_from_q_end(phase_segments[-1], segment_name, max(q_final, Q_MIN),
                                                phase_segments[-1]['end_idx'])
        else:
            t_end_life = 'No valid end index from q final.'

        if type(t_end_life) != str and t_end_life <= phase_segments[0]['start_idx']:
            t_end_life = 'No valid end index from q final.'

        wells_end_idx_dict[well][phase]['q_final_end_idx'] = t_end_life

    def get_end_idx_final(self, well, phase, wells_end_idx_dict):
        valid_end_idx_check = wells_end_idx_dict[well][phase].get('valid_end_idx')

        if type(valid_end_idx_check) != str:
            t_end_idx = wells_end_idx_dict[well][phase].get('t_end_idx')
            q_final_end_idx = wells_end_idx_dict[well][phase].get('q_final_end_idx')

            valid_t = type(t_end_idx) != str
            valid_q = type(q_final_end_idx) != str

            if valid_t and valid_q:
                wells_end_idx_dict[well][phase]['valid_end_idx'] = min(t_end_idx, q_final_end_idx, DATE_IDX_LARGE)
            elif valid_t:
                wells_end_idx_dict[well][phase]['valid_end_idx'] = t_end_idx
            elif valid_q:
                wells_end_idx_dict[well][phase]['valid_end_idx'] = q_final_end_idx
            else:
                wells_end_idx_dict[well][phase]['valid_end_idx'] = 'No valid end index.'

    def apply_same_well_life_info(self, params, well, phase, wells_info, wells_end_idx_dict):
        same_well_life = params['same_well_life']

        if same_well_life == 'primary_product':
            well_primary_product = wells_info[well].get('primary_product')
            # Comes in as 'Oil', 'Gas', or 'Water', so we need to convert to lowercase.
            if well_primary_product is not None:
                well_primary_product = well_primary_product.lower()
            if (not well_primary_product) or (well_primary_product not in PHASES):
                well_primary_product = 'oil'
        else:
            well_primary_product = same_well_life

        if same_well_life == 'independent' or not well_primary_product:
            return
        else:
            for well in wells_end_idx_dict:
                primary_product_idx = wells_end_idx_dict[well][well_primary_product]
                for phase in wells_end_idx_dict[well]:
                    wells_end_idx_dict[well][phase] = primary_product_idx

    def change_forecast_segment_end_date(self, end_idx, q_final, segments, last_segment_only=False):
        if not segments:
            return segments, 'No forecast data.'

        need_cut = segments[-1].get('end_idx') > end_idx
        need_extend = segments[-1].get('end_idx') < end_idx

        current_date = BASE_TIME_NPDATETIME64 + int(end_idx)
        msg = f'Applied well life on {current_date} is before the forecast start date, so keep the forecast as is.'

        if end_idx < segments[0].get('start_idx'):
            return segments, msg
        for i, seg in enumerate(segments):
            this_start = seg.get('start_idx')
            this_end = seg.get('end_idx')

            if this_start <= end_idx <= this_end:
                cut_segment_idx = i
                break

        new_segment = []
        if need_cut:
            if last_segment_only and cut_segment_idx != len(segments) - 1:
                return segments, 'Change only last segment option is selected, so keep the forecast as is.'

            new_q_end = float(multi_seg.predict([end_idx], [segments[cut_segment_idx]])[0])
            new_segment += segments[:cut_segment_idx + 1]
            new_segment[cut_segment_idx]['end_idx'] = int(end_idx)
            new_segment[cut_segment_idx]['q_end'] = float(new_q_end)

            return new_segment, ''
        elif need_extend:
            segments[-1]['end_idx'] = int(end_idx)
            new_q_end = float(multi_seg.predict([end_idx], [segments[-1]])[0])
            segments[-1]['q_end'] = float(new_q_end)

        return segments, ''

    def mass_modify_well_life(self, params):
        forecast_id = params['forecast_id']
        wells = params['wells']

        last_segment_only = params.get('last_segment_only', False)

        wells_forecast = self._get_forecast_data(forecast_id, PHASES, wells)
        wells_info = self._get_wells_info(wells)
        cums_and_last_prods = self._get_cums_and_last_prods(wells_forecast)
        '''
        'well1': {
            'oil':{'t_end_idx': 20, 'q_final_end_idx':30, 'valid_end_idx':20}
            'gas':{'t_end_idx': 20, 'q_final_end_idx':30}
            'water': {'t_end_idx': 20, 'q_final_end_idx':30}
        }
        '''
        wells_end_idx_dict = defaultdict(lambda: defaultdict(dict))

        for well in wells:
            for phase in PHASES:
                self.get_end_idx_well_life(params, well, phase, wells_forecast, wells_info, wells_end_idx_dict)
                self.get_end_idx_q_final(params, well, phase, wells_info, wells_forecast, wells_end_idx_dict)
                self.get_end_idx_final(well, phase, wells_end_idx_dict)
                self.apply_same_well_life_info(params, well, phase, wells_info, wells_end_idx_dict)

        forecast_updater = self.context.deterministic_forecast_service

        def update_generator(well):
            updates = []
            phase_forecasts = wells_forecast[well]
            rate_forecasts = []
            ratio_forecasts = []
            for phase, forecast_data in phase_forecasts.items():
                if forecast_data['forecastType'] == 'rate':
                    rate_forecasts.append(phase)
                else:
                    ratio_forecasts.append(phase)
            for phase in rate_forecasts + ratio_forecasts:
                forecast_datas = phase_forecasts[phase]
                final_end_idx = wells_end_idx_dict.get(well, {}).get(phase, {}).get('valid_end_idx')

                if type(final_end_idx) == str:
                    update = update_warning_message(forecast_updater, ObjectId(forecast_id), ObjectId(well), phase,
                                                    final_end_idx)
                else:
                    warning = None
                    forecast_type = forecast_datas['forecastType']
                    if forecast_type == 'rate':
                        forecast_segments = forecast_datas['P_dict'].get('best', {}).get('segments')

                    else:
                        forecast_segments = forecast_datas['ratio'].get('segments')

                    changed_forecast_segments, warning_message = self.change_forecast_segment_end_date(
                        final_end_idx, params[phase]['q_final'], forecast_segments, last_segment_only)

                    P_dict = {}
                    ratio = {}
                    if forecast_type == 'rate':
                        P_dict['best'] = {'segments': changed_forecast_segments}
                        forecast_datas['P_dict']['best']['segments'] = changed_forecast_segments
                    else:
                        ratio['segments'] = changed_forecast_segments
                        forecast_datas['ratio']['segments'] = changed_forecast_segments

                    if warning_message:
                        warning = {'status': True, 'message': warning_message}
                    else:
                        warning = {'status': False, 'message': None}

                    data_freq = forecast_datas['data_freq']
                    cum = cums_and_last_prods[data_freq][well][phase]
                    last_prod_idx = cums_and_last_prods[data_freq][well]['last_prod']
                    base_segs = None
                    forecast_type = forecast_datas['forecastType']
                    if forecast_type == 'ratio':
                        base_phase = forecast_datas['ratio']['basePhase']
                        base_segs = phase_forecasts[base_phase]['P_dict'].get('best', {}).get('segments', [])

                    update = forecast_updater.get_update_body(well_id=ObjectId(well),
                                                              forecast_id=ObjectId(forecast_id),
                                                              forecastType=forecast_type,
                                                              data_freq=data_freq,
                                                              phase=phase,
                                                              warning=warning,
                                                              P_dict=P_dict,
                                                              ratio=ratio,
                                                              calc_eur=True,
                                                              cum=cum,
                                                              last_prod_idx=last_prod_idx,
                                                              base_segs=base_segs)

                updates.append(update)

            return updates

        batch_updates_with_progress(context=self.context,
                                    batch_count=params.get('batch_count'),
                                    data_iterator=wells_forecast,
                                    update_generator=update_generator,
                                    db_updater=self.context.deterministic_forecast_service.write_forecast_data_to_db,
                                    notification_id=params.get('notification_id'),
                                    user_id=params.get('user_id'))
