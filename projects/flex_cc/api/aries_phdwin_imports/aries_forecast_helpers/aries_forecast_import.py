import pandas as pd
import numpy as np
from bson.objectid import ObjectId

from api.aries_phdwin_imports.error import ErrorReport
from api.aries_phdwin_imports.mdb_extract import AriesDataExtraction
from api.aries_phdwin_imports.helpers import (check_for_required_cols, convert_arps_exp_to_modified_arps,
                                              forecast_validity_check, str_join)
from api.aries_phdwin_imports.aries_import_helpers import (change_double_quote_to_previous_keyword,
                                                           convert_pd_series_to_int, get_header_index,
                                                           convert_array_column_dtype_to_int, extract_df_row_value,
                                                           FORECAST_DEFAULT_BASE_DATE)
from api.aries_phdwin_imports.aries_forecast_helpers.forecast_import_helpers import (
    read_parameters_convert_to_segment_obj, read_list_method_convert_to_segment_obj,
    read_parameters_convert_to_segment_obj_ratio, convert_ratio_expression_to_rate_expressions, update_param_dic,
    forecast_formating_isolate, forecast_formating_isolate_ratio, get_cums_value, add_spd_method_if_required,
    identify_keyword_repitition)
from combocurve.shared.aries_import_enums import PhaseEnum

CHOSEN_ID_COL_INDEX = 0
PHASE_COL_INDEX = 1


def order_df_based_on_section_and_sequence(df, headers):
    current_headers = headers[:df.shape[1]]
    df = pd.DataFrame(df, columns=current_headers)
    df['SECTION'] = convert_pd_series_to_int(df['SECTION'])
    df['SEQUENCE'] = convert_pd_series_to_int(df['SEQUENCE'])
    return np.array(df.sort_values(by=['SECTION', 'SEQUENCE']))


class AriesForecastImport(AriesDataExtraction):
    def pre_process(self):
        # forecast data
        self.forecasts_dic = {}
        self.forecast_datas_dic = {}
        self.ratio_forecast_datas_dic = {}
        self.forecast_datas_params_dic = {}
        self.forecast_name_to_dataid = {}
        self.well_forecasts_dic = {}
        self.forecast_other_phase = set()
        self.segment_qend = None

        self.log_report = ErrorReport()

        self.enddate_dic = {}
        self.use_end_date = False
        self.dates_1_base_date = FORECAST_DEFAULT_BASE_DATE
        self.dates_1_life = 100
        self.max_date_index = (np.datetime64(pd.to_datetime(pd.Timestamp.max), 'D')
                               - np.datetime64('1900-01-01')).astype(int).item()

    def aries_forecast_import_parameters(self, df):  # noqa C901
        accepted_phases = ['OIL', 'GAS', 'WTR']
        error_log = []
        required_columns = ['PROPNUM', 'SECTION', 'SEQUENCE', 'QUALIFIER', 'KEYWORD', 'EXPRESSION']
        """
        Input (Pandas DataFrame): Pandas Data Frame of ARIES forecast lines
        Columns Required: PROPNUM, SECTION, SEQUENCE, QUALIFIER, KEYWORD AND EXPRESSION
        """
        try:
            header_cols = [str(column).upper() for column in df.columns]
            forecast_array = np.array(df)
            column_check_passed, missing_column = check_for_required_cols(header_cols, required_columns)

            if not column_check_passed:
                message = f'REQUIRED COLUMN {missing_column} is missing, Cannot Perform Import'
                error_log.append({'message': message, "chosen_id": None, 'aries_row': None})
                return pd.DataFrame([]), error_log, False

            (propnum_index, section_index, sequence_index, qualifier_col_index, keyword_index,
             expression_index) = get_header_index(required_columns, header_cols)

            # TODO PROPNUM FORMATTING REQUIRED
            forecast_array = convert_array_column_dtype_to_int(forecast_array, section_index)
            forecast_array = convert_array_column_dtype_to_int(forecast_array, sequence_index)
            forecast_array = forecast_array[forecast_array[:, section_index] == 4]

            ls_propnum = np.unique(forecast_array[:, propnum_index])
        except Exception:
            return pd.DataFrame([]), error_log, False

        mock_id = ObjectId()
        for chosen_id in ls_propnum:
            selected_df = forecast_array[forecast_array[:, propnum_index] == chosen_id]

            selected_df = order_df_based_on_section_and_sequence(selected_df, header_cols)
            selected_df, header_cols = change_double_quote_to_previous_keyword(selected_df, header_cols)

            (propnum_index, section_index, qualifier_index, sequence_index, keyword_index,
             keyword_mark_index) = get_header_index(
                 ['PROPNUM', 'SECTION', 'QUALIFIER', 'SEQUENCE', 'KEYWORD', 'keyword_mark'], header_cols)
            repeat_forecast_keyword = {}
            check_rate_forecast_dict = {
                'oil_rate_forecast': False,
                'gas_rate_forecast': False,
                'water_rate_forecast': False
            }
            self.total_prev_mu_dict = {PhaseEnum.oil.value: 0, PhaseEnum.gas.value: 0, PhaseEnum.water.value: 0}

            for i in range(selected_df.shape[0]):
                try:
                    propnum, keyword, section, qualifier, expression, original_keyword = extract_df_row_value(
                        i, [
                            propnum_index, keyword_mark_index, section_index, qualifier_index, expression_index,
                            keyword_index
                        ], selected_df)

                    if str(keyword).strip().upper() == 'TEXT' or keyword.startswith('*'):
                        continue

                    ls_expression = [string.strip() for string in str(expression).strip().split()]

                    use_keyword = keyword if '/' not in keyword else keyword.split('/')[0]
                    use_original_keyword = use_keyword if original_keyword != '"' else original_keyword
                    forecast_repitition_identified = identify_keyword_repitition(use_keyword, use_original_keyword, i,
                                                                                 repeat_forecast_keyword)
                    if forecast_repitition_identified:
                        continue

                    if keyword == 'START':
                        start_date = self.read_start(ls_expression, propnum, None, None, None)

                    elif keyword == 'CUMS':
                        get_cums_value(ls_expression, self.total_prev_mu_dict)

                    elif 'CUR/' in keyword:
                        continue

                    elif '/' in keyword:
                        phase, base = keyword.strip().split('/')
                        if all(item in accepted_phases for item in [phase, base]):
                            if ls_expression[-1] != 'TIME':
                                continue
                            phase = 'WATER' if phase == 'WTR' else phase
                            base = 'WATER' if base == 'WTR' else base

                            ls_segment_obj, ls_param_dic = read_parameters_convert_to_segment_obj_ratio(
                                self, ls_expression, start_date, qualifier, propnum, keyword, section, None,
                                self.dates_1_life, self.dates_1_base_date, self.max_date_index,
                                self.forecast_datas_params_dic, self.log_report)

                            if f'{phase.lower()}_rate_forecast' in check_rate_forecast_dict:
                                if check_rate_forecast_dict[f'{phase.lower()}_rate_forecast']:
                                    base_segments = self.forecast_datas_dic[(
                                        qualifier, propnum)]['data'][base.lower()]['P_dict']['best']['segments']
                                    ls_expressions = convert_ratio_expression_to_rate_expressions(
                                        ls_segment_obj, base_segments, phase, self.segment_conversion)

                                    for expression in ls_expressions:
                                        ls_segment_obj, ls_param_dic, use_nl = read_parameters_convert_to_segment_obj(
                                            self,
                                            expression,
                                            start_date,
                                            qualifier,
                                            propnum,
                                            phase,
                                            None,
                                            None,
                                            self.forecast_datas_params_dic,
                                            self.dates_1_base_date,
                                            self.dates_1_life,
                                            self.max_date_index,
                                            self.log_report,
                                            forecast_side_import=True)
                                        update_param_dic(propnum, None, qualifier, phase, ls_param_dic,
                                                         self.forecast_datas_params_dic, self.get_default_format)
                                        # start processing the segment_obj (follow phdwins procedure)
                                        for segment_obj in ls_segment_obj:
                                            forecast_formating_isolate(None, qualifier, propnum, segment_obj, keyword,
                                                                       mock_id, self.get_default_format,
                                                                       self.forecasts_dic, self.forecast_datas_dic)
                                        continue

                            update_param_dic(propnum, None, qualifier, phase, ls_param_dic,
                                             self.forecast_datas_params_dic, self.get_default_format)
                            for segment_obj in ls_segment_obj:
                                forecast_formating_isolate_ratio(None, qualifier, propnum, segment_obj, keyword,
                                                                 mock_id, self.get_default_format, self.forecasts_dic,
                                                                 self.forecast_datas_dic)
                    elif keyword in accepted_phases:
                        keyword = 'WATER' if keyword == 'WTR' else keyword

                        if '#' in str(ls_expression[-1]):
                            ls_segment_obj, ls_param_dic = read_list_method_convert_to_segment_obj(
                                ls_expression,
                                start_date,
                                qualifier,
                                propnum,
                                keyword,
                                None,
                                section,
                                self.dates_1_life,
                                self.max_date_index,
                                self.forecast_datas_params_dic,
                                self.get_default_format,
                                forecast_side_import=True)
                        else:
                            ls_expression = add_spd_method_if_required(ls_expression)
                            ls_segment_obj, ls_param_dic, use_nl = read_parameters_convert_to_segment_obj(
                                self,
                                ls_expression,
                                start_date,
                                qualifier,
                                propnum,
                                keyword,
                                section,
                                None,
                                self.forecast_datas_params_dic,
                                self.dates_1_base_date,
                                self.dates_1_life,
                                self.max_date_index,
                                self.log_report,
                                forecast_side_import=True)

                            update_param_dic(propnum, None, qualifier, keyword, ls_param_dic,
                                             self.forecast_datas_params_dic, self.get_default_format)

                        for segment_obj in ls_segment_obj:
                            forecast_formating_isolate(None, qualifier, propnum, segment_obj, keyword, mock_id,
                                                       self.get_default_format, self.forecasts_dic,
                                                       self.forecast_datas_dic)
                except Exception:
                    error_log.append({
                        'message': 'COULD NOT PROCESS FORECAST LINE',
                        'aries_row': str_join(ls_expression),
                        'chosen_id': propnum
                    })

        try:
            forecast_datas_ls = convert_arps_exp_to_modified_arps(self.forecast_datas_dic)
            forecast_datas_ls = list(self.forecast_datas_dic.values())
            formated_forecast_document = self.forecast_datas_format_v2_to_v3(forecast_datas_ls)
            formated_forecast_document = forecast_validity_check(formated_forecast_document)

            forecast_df, error_log = convert_forecast_document_to_df(formated_forecast_document, error_log)
        except Exception:
            return pd.DataFrame([]), error_log, False
        return forecast_df, error_log, forecast_df.shape[0] != 0


def convert_forecast_document_to_df(doc, error_log):
    forecast_headers = [
        'Chosen ID', 'Phase', 'Type', 'Base Phase', 'Segment', 'Segment Type', 'Start Date', 'End Date', 'q Start',
        'q End', 'Di Eff-Sec', 'b', 'Realized D Sw-Eff-Sec', 'Sw-Date'
    ]

    final_df = np.array([])
    remove_well_phase = set()
    for forecast_phase in doc:
        try:
            chosen_id, phase = None, None
            chosen_id = forecast_phase.get('well')
            phase = forecast_phase.get('phase')
            forecast_type = forecast_phase.get('forecastType')

            if forecast_type != 'ratio':
                segments = forecast_phase['P_dict']['best']['segments']
                base_phase = np.nan
            else:
                segments = forecast_phase['ratio']['segments']
                base_phase = forecast_phase['ratio']['basePhase']

            if len(segments) > 0:
                for idx, segment in enumerate(segments):
                    try:
                        start_idx = segment.get('start_idx')
                        end_idx = segment.get('end_idx')

                        start_date = pd.to_datetime(np.datetime64('1900-01-01')
                                                    + int(float(start_idx))).strftime('%m/%d/%Y')
                        end_date = pd.to_datetime(np.datetime64('1900-01-01')
                                                  + int(float(end_idx))).strftime('%m/%d/%Y')

                        q_start = segment.get('q_start')
                        q_end = segment.get('q_end')

                        try:
                            di_eff = round(float(segment.get('D_eff')) * 100, 2)
                        except (ValueError, TypeError):
                            di_eff = np.nan

                        b = segment.get('b') if segment.get('b') is not None else np.nan
                        segment_type = segment.get('name')
                        if segment_type == 'arps_modified':
                            d_eff_sw = round(float(segment.get('realized_D_eff_sw')) * 100, 2)
                            sw_idx = segment.get('sw_idx')
                            sw_date = pd.to_datetime(np.datetime64('1900-01-01') + sw_idx).strftime('%m/%d/%Y')
                        else:
                            d_eff_sw = np.nan
                            sw_date = np.nan
                        row = [
                            chosen_id, phase, forecast_type, base_phase, idx + 1, segment_type, start_date, end_date,
                            q_start, q_end, di_eff, b, d_eff_sw, sw_date
                        ]
                        if final_df.size == 0:
                            final_df = np.array([row])
                        else:
                            final_df = np.vstack((final_df, row))
                    except Exception:
                        remove_well_phase.add((chosen_id, phase))
                        break
        except Exception:
            remove_well_phase.add((chosen_id, phase))
            continue

    for chosen_id, phase in remove_well_phase:
        error_log.append({
            'message': f'Error Processing {str(phase).upper()} for {chosen_id}',
            'aries_row': "",
            'chosen_id': chosen_id
        })
        final_df = final_df[~((final_df[:, CHOSEN_ID_COL_INDEX] == chosen_id) &
                              (final_df[:, PHASE_COL_INDEX] == phase))]

    return pd.DataFrame(final_df, columns=forecast_headers), error_log


# HOW TO USE
# aries_forecast_param_obj = AriesForecastImport(user_id, None, None, None, parallel_dic)
# aries_forecast_param_obj.pre_process()
# document = aries_forecast_param_obj.aries_forecast_import_parameters(df)
