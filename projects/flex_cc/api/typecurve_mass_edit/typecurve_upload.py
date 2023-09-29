import io
import pandas as pd
import numpy as np
import collections
import datetime
from copy import deepcopy
from bson import ObjectId
from pymongo import UpdateOne, InsertOne
from combocurve.shared.helpers import clean_up_str
from combocurve.shared.forecast_tools.segment_plugin import templates, get_template
from combocurve.shared.forecast_tools.forecast_segments_check import check_forecast_segments
from api.typecurve_mass_edit.typecurve_normalization_import import TypeCurveNormalization
from api.typecurve_mass_edit.typecurve_import_wells import TypecurveUploadWells
from api.forecast_mass_edit.forecast_import import ForecastImport
from api.forecast_mass_edit.helpers import clean_series_name

from combocurve.science.segment_models.multiple_segments import MultipleSegments

DAYS_IN_YEAR = 365.25

TypeCurveFitSchema = {
    'adjusted': False,
    'align': 'align',
    'normalize': False,
    'fitType': None,
    'P_dict': {},
    'ratio_P_dict': {
        'P10': {
            'segments': [],
            'diagnostics': {},
            'basePhase': None,
            'x': 'time'
        },
        'P50': {
            'segments': [],
            'diagnostics': {},
            'basePhase': None,
            'x': 'time'
        },
        'P90': {
            'segments': [],
            'diagnostics': {},
            'basePhase': None,
            'x': 'time'
        },
        'best': {
            'segments': [],
            'diagnostics': {},
            'basePhase': None,
            'x': 'time'
        },
    },
    'phase': 'oil',
    'settings': {},
    'typeCurve': None,
    'regressionType': 'rate'
}

TypeCurveSchema = {
    'basePhase': 'oil',
    'createdBy': None,  ##fill in user
    'expireAt': None,
    'fitted': False,
    'forecast': None,  ##need to change the schema setting
    'forecastSeries': 'best',
    'name': None,  ##fill in typecurve name
    'normalizations': [],
    'phaseType': {
        'oil': 'rate',
        'gas': 'rate',
        'water': 'rate',
    },
    'project': None,  ##fill in project Id
    'tcType': 'ratio',  ##rate or ratio
    'wells': [],
    'wellsAdded': False,
    'wellsRemoved': False,
    'fits': {
        'oil': None,
        'gas': None,
        'water': None,
    },
    'copiedFrom': None,
    'headers': {
        'first_prod_date': None,
        'perf_lateral_length': None,
        'true_vertical_depth': None,
        'total_prop_weight': None,
    },
    'pSeries': 'P50',
    'assumptions': {
        'capex': None,
        'dates': None,
        'risking': None,
        'expenses': None,
        'escalation': None,
        'depreciation': None,
        'general_options': None,
        'production_taxes': None,
        'production_vs_fit': None,
        'stream_properties': None,
        'ownership_reversion': None,
        'pricing': None,
        'differentials': None,
    },
    'activeUmbrellas': {},
    'regressionType': 'rate'
}

TypeCurveWellAssignmentsSchema = {"typeCurve": None, "well": None, "oil": True, "gas": True, "water": True}


class TypeCurveImportError(Exception):
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
                np_date = np.datetime64(pd.to_datetime(input_date), 'D')
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


TypeCurveFormattedNames = {
    "Rep Well INPT ID": 'inptID',
    "Rep Well API10": 'api10',
    "Rep Well API12": 'api12',
    "Rep Well API14": 'api14',
    "Rep Well List Chosen ID": 'chosenID',
    "Rep Well List Aries ID": 'aries_id',
    "Rep Well List PHDwin ID": 'phdwin_id',
    'Normalization Type': 'normalization_type',
    'Slope': 'slope',
    'Intercept': 'intercept',
    'Coefficient': 'coefficient',
    'Exponent': 'exponent',
    'x Axis': 'x_label',
    'y Axis': 'y_label',
    'Start of Period (Day)': 'Start Index',
    'End of Period (Day)': 'End Index',
    'Start Day': 'Start Index',
    'End Day': 'End Index',
    'q Start (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)': 'q Start',
    'q End (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)': 'q End',
    'Normalization': 'Toggle Normalize',
    'Resolution': 'Toggle Daily',
    'Fit Type': 'Type',
}

TypeCurveFormattedNamesReverse = {
    'inptID': ['Rep Well INPT ID'],
    'api10': ['Rep Well API10'],
    'api12': ['Rep Well API12'],
    'api14': ['Rep Well API14'],
    'chosenID': ['Rep Well List Chosen ID'],
    'aries_id': ['Rep Well List Aries ID'],
    'phdwin_id': ['Rep Well List PHDwin ID'],
    'normalization_type': ['Normalization Type'],
    'slope': ['Slope'],
    'intercept': ['Intercept'],
    'coefficient': ['Coefficient'],
    'exponent': ['Exponent'],
    'x_label': ['x Axis'],
    'y_label': ['y Axis'],
    'Start Index': ['Start Day', 'Start of Period (Day)'],
    'End Index': ['End Day', 'End of Period (Day)'],
    'q Start': ['q Start (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)'],
    'q End': ['q End (BBL/D, MCF/D, BBL/MCF, MCF/BBL, BBL/BBL)'],
    'Toggle Normalize': ['Toggle Normalize', 'Normalization'],
    'Toggle Daily': ['Toggle Daily', 'Resolution'],
    'Type': ['Type', 'Fit Type'],
}

REGRESSION_TYPE = {'cum': 'cum', 'rate': 'rate', 'legacy': 'rate', 'standard': 'cum', 'cumulative': 'cum'}


class TypecurveUpload:
    def __init__(self, context):
        self.context = context

    def typecurve_import_upsert(self, query, body):
        return self.context.cc_to_cc_imports_model.objects(**query).update_one(
            upsert=True,
            full_result=True,
            **body,
            **query,
        )

    def delete_forecast_import(self, _id):
        return self.context.cc_to_cc_imports_model.objects(id=_id).delete()

    def check_file_header(self, df_header, required_header, rename_dict):
        missing_headers = []
        for h in required_header:
            if h not in df_header:
                if h in rename_dict:
                    missing_headers.append(rename_dict[h][-1])
                else:
                    missing_headers.append(h)

        if missing_headers:
            error_message_str = 'Missing header(s): ' + ', '.join(missing_headers)

            raise TypeCurveImportError(error_message_str)

    def get_tc_id(self, all_tc_names, tcs_dict):
        tc_names_ids = {}

        for tc_name in all_tc_names:
            if tc_name not in tcs_dict:
                tc_names_ids[tc_name] = ObjectId()
            else:
                tc_names_ids[tc_name] = tcs_dict[tc_name]

        return tc_names_ids

    def check_phase(self, phase, phase_error_list):
        if phase not in ['oil', 'gas', 'water']:
            phase_error_list.append({'error_message': 'Phase must be one of oil, gas or water', 'row_index': 0})

    def build_error_df(self, typecurve_df):
        if 'Error' not in list(typecurve_df.columns) and 'Warning' not in list(typecurve_df.columns):
            error_df = pd.DataFrame(columns=list(typecurve_df.columns) + ['Error', 'Warning'])
        elif 'Warning' not in list(typecurve_df.columns):
            error_df = pd.DataFrame(columns=list(typecurve_df.columns) + ['Warning'])
        elif 'Error' not in list(typecurve_df.columns):
            this_columns = list(typecurve_df.columns)
            this_columns.remove('Warning')
            error_df = pd.DataFrame(columns=this_columns + ['Error', 'Warning'])
        else:
            error_df = pd.DataFrame(columns=list(typecurve_df.columns))
        return error_df

    def get_exist_tc_names(self, file_tcs, tcs_in_project, exist_tc_names, exist_tc_ids, not_exist_tc_names):
        for tc in file_tcs:
            if tc in tcs_in_project:
                exist_tc_names.append(tc)
                exist_tc_ids.append(tcs_in_project[tc])
            else:
                not_exist_tc_names.append(tc)

    def typecurve_df_formatting(self, typecurve_df, chosen_identifier, d_eff_percentage, realized_d_eff_percentage):
        #remove leading and tailing spaces
        columns = ['TC Name', 'Phase', 'Type', 'Segment Type', 'Series']

        for c in columns:
            typecurve_df[c] = typecurve_df[c].astype(str)
            typecurve_df[c] = typecurve_df[c].str.lstrip()
            if c == 'Phase':
                typecurve_df[c] = typecurve_df[c].str.lower()

        if 'normalization_type' in typecurve_df.columns:
            for index, row in typecurve_df.dropna(subset=['normalization_type']).iterrows():
                if row['normalization_type']:
                    typecurve_df._set_value(index, 'normalization_type', str(row['normalization_type']).strip())

        typecurve_df['Series'].replace('Best', 'best', inplace=True)
        typecurve_df['Series'].replace('p10', 'P10', inplace=True)
        typecurve_df['Series'].replace('p50', 'P50', inplace=True)
        typecurve_df['Series'].replace('p90', 'P90', inplace=True)

        typecurve_df['Di Eff-Sec'] = typecurve_df['Di Eff-Sec'].astype('float')
        typecurve_df['Realized D Sw-Eff-Sec'] = typecurve_df['Realized D Sw-Eff-Sec'].astype('float')

        for index, row in typecurve_df.iterrows():
            d_eff = row["Di Eff-Sec"]
            realized_d_eff = row["Realized D Sw-Eff-Sec"]
            if d_eff_percentage and d_eff and (type(d_eff) == int or type(d_eff) == float):
                typecurve_df.at[index, 'Di Eff-Sec'] = d_eff / 100
            if realized_d_eff_percentage and realized_d_eff and (type(realized_d_eff) == int
                                                                 or type(realized_d_eff) == float):
                typecurve_df.at[index, 'Realized D Sw-Eff-Sec'] = realized_d_eff / 100

        typecurve_df.replace('shut_in', 'empty', inplace=True)

    def rename_columns(self, typecurve_df, formatted):

        if formatted:
            for k, v in TypeCurveFormattedNames.items():
                if k in typecurve_df.columns:
                    typecurve_df.rename(columns={k: v}, inplace=True)
        else:
            for k, v in TypeCurveFormattedNamesReverse.items():
                if k in typecurve_df.columns:
                    typecurve_df.rename(columns={k: v[-1]}, inplace=True)

        return typecurve_df

    def typecurve_import(self, p_req):
        file_id = p_req['file_id']
        user_id = p_req['user_id']
        project_id = p_req['project_id']
        forecast_id = p_req['forecast_id']
        chosen_identifier = p_req['identifier']
        #chosen_identifier = 'api14'

        # load file from google cloud to pandas
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']
        excel_bytes = self.context.file_service.download_to_memory(file_gcp_name)
        excel_bytes.seek(0)
        typecurve_df = pd.read_csv(excel_bytes, index_col=None)

        if 'TC Name' in typecurve_df:
            typecurve_df = typecurve_df[typecurve_df['TC Name'].notnull()]

        tc_normalization_import = TypeCurveNormalization(self.context)
        tc_import_wells = TypecurveUploadWells(self.context)

        customerized_headers = tc_normalization_import.update_df_custom_headers(typecurve_df)

        project_tcs = list(
            self.context.type_curves_collection.aggregate([{
                '$match': {
                    'project': ObjectId(project_id)
                }
            }, {
                '$project': {
                    'name': 1,
                    'forecast': {
                        '$ifNull': ["$forecast", "undefined"]
                    },
                    'regressionType': 1,
                }
            }]))

        tcs_in_project = {}
        tcs_name_forecast = {}
        tcs_regression_type = {}
        for project_tc in project_tcs:
            tcs_in_project[project_tc['name']] = str(project_tc['_id'])
            tcs_name_forecast[project_tc['name']] = project_tc['forecast']
            tcs_regression_type[str(project_tc['_id'])] = REGRESSION_TYPE.get(
                clean_up_str(project_tc.get('regressionType', 'rate')), 'rate')

        #make those columns all require for the first version
        required_header = [
            'TC Name', 'Phase', 'Type', 'Segment', 'Segment Type', 'Start Index', 'End Index', 'q Start', 'Di Eff-Sec',
            'b', 'Realized D Sw-Eff-Sec', 'Base Phase', 'Series', 'Align Peak', 'Toggle Normalize', 'Toggle Daily'
        ]

        normalization_header = ['normalization_type', 'slope', 'intercept', 'x_label', 'y_label']

        typecurve_df.columns = typecurve_df.columns.str.strip()
        df_header = typecurve_df.columns
        d_eff_percentage = "Di Eff-Sec %" in df_header
        realized_d_eff_percentage = "Realized D Sw-Eff-Sec %" in df_header

        typecurve_df = typecurve_df.rename(columns={
            "Di Eff-Sec %": "Di Eff-Sec",
            "Realized D Sw-Eff-Sec %": "Realized D Sw-Eff-Sec"
        })

        typecurve_df = self.rename_columns(typecurve_df, True)
        df_header = typecurve_df.columns
        tc_normalization_import.check_normaliztion_header(typecurve_df, required_header, normalization_header)
        tc_import_wells.check_identifier_header(typecurve_df, chosen_identifier)
        self.check_file_header(df_header, required_header, TypeCurveFormattedNamesReverse)
        error_df = self.build_error_df(typecurve_df)
        self.typecurve_df_formatting(typecurve_df, chosen_identifier, d_eff_percentage, realized_d_eff_percentage)

        exist_tc_names = []
        exist_tc_ids = []
        not_exist_tc_names = []
        file_tcs = typecurve_df['TC Name'].unique().tolist()

        self.get_exist_tc_names(file_tcs, tcs_in_project, exist_tc_names, exist_tc_ids, not_exist_tc_names)
        num_of_exist_tcs = len(exist_tc_names)
        all_tc_names = exist_tc_names + not_exist_tc_names

        tc_names_ids_dict = self.get_tc_id(all_tc_names, tcs_in_project)

        tc_identifiers = tc_import_wells.get_tc_identifiers(typecurve_df, tc_names_ids_dict, chosen_identifier)
        tc_well_list_result, unmatched_wells, overlimit_wells = tc_import_wells.get_well_identifiers_from_forecast(
            forecast_id, chosen_identifier, tc_identifiers, tcs_name_forecast, tc_names_ids_dict)

        tc_datas_bw_list = []
        tc_collections_update = []
        tc_datas_bw_list_update = []
        tc_collections_record = []
        update_tc_normalizations = []
        tc_well_assigments_collection_update = []
        insert_to_tc_well_assigments_memo = set()
        get_new_normalizations = collections.defaultdict(set)

        for idx, tc_name in enumerate(all_tc_names):
            tc_fit_df = typecurve_df[typecurve_df['TC Name'] == tc_name]
            tc_error_list = []
            legal_tc, this_base_phase, _ = self.check_one_tc(tc_fit_df, tc_error_list)

            if legal_tc:
                phase_list = tc_fit_df['Phase'].unique().tolist()
                #tc_fit_types = tc_fit_df['Type'].unique().tolist()
                tc_id = tc_names_ids_dict[tc_name]

                for raw_phase in phase_list:
                    phase = clean_up_str(raw_phase)
                    db_segments = {}
                    phase_error_list = []

                    self.check_phase(phase, phase_error_list)
                    phase_fit_df = tc_fit_df[tc_fit_df['Phase'] == phase]
                    legal_segment, this_phase_series = self.check_phase_series(phase_fit_df, phase_error_list)
                    (
                        legal_normalization,
                        has_normalization,
                        x_chain,
                        y_chain,
                        base_key,
                    ) = tc_normalization_import.check_tc_n_phase(phase_fit_df, customerized_headers, phase_error_list)

                    if legal_segment and legal_normalization:
                        self.get_new_normalization_tc_phase(has_normalization, tc_id, phase, get_new_normalizations,
                                                            phase_fit_df)

                        phase_fit_type = clean_up_str(phase_fit_df.iloc[0]['Type'])
                        if tc_id in tcs_regression_type:
                            phase_regression_type = tcs_regression_type[tc_id]
                        else:
                            phase_regression_type = REGRESSION_TYPE.get(
                                clean_up_str(phase_fit_df.iloc[0].get('Regression Type', 'rate')), 'rate')

                        series_idx = 0
                        for series in this_phase_series:
                            segment_list = phase_fit_df[phase_fit_df['Series'] == series].to_dict('records')
                            segment_list.sort(key=lambda x: x['Segment'])
                            self.process_tc_segments(segment_list, phase_error_list, db_segments, series_idx)
                            series_idx += len(segment_list)

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

                        # write error message to tc_df
                    if phase_error_list:
                        error_df = self.append_to_error_df(error_df, phase_fit_df, phase_error_list)
                    else:
                        # append bw_list if no error
                        this_forecast = self.get_this_tc_target_forecast(tc_name, forecast_id, tcs_name_forecast)
                        wells_flag = False
                        if this_forecast in tc_well_list_result and ObjectId(
                                tc_id) in tc_well_list_result[this_forecast]:
                            wells = tc_well_list_result[this_forecast][ObjectId(tc_id)]
                            wells_flag = True

                        else:
                            wells = []
                            wells_flag = False

                        error_df = self.get_unmatched_wells_append_to_error_df(tc_id, unmatched_wells, overlimit_wells,
                                                                               error_df, phase_fit_df, phase_error_list,
                                                                               wells_flag)
                        if idx < num_of_exist_tcs:
                            #update existing tc documents
                            self.append_to_bw_list(db_segments, tc_datas_bw_list, project_id, tc_id, phase,
                                                   phase_fit_type, phase_regression_type, this_base_phase,
                                                   this_phase_series, phase_fit_df, tc_datas_bw_list_update,
                                                   tc_collections_update, wells, tc_well_assigments_collection_update,
                                                   insert_to_tc_well_assigments_memo)

                        else:
                            #create new tc documents
                            if not self.get_tc(tc_id) and (tc_name not in tc_collections_record):
                                self.insert_to_tc_collection(tc_name, this_base_phase, user_id, project_id, tc_id,
                                                             forecast_id, phase_regression_type, tc_collections_update,
                                                             tc_collections_record, wells,
                                                             tc_well_assigments_collection_update,
                                                             insert_to_tc_well_assigments_memo)

                            self.insert_to_tc_fit_collection(db_segments, project_id, tc_id, phase_fit_df, phase,
                                                             phase_fit_type, phase_regression_type, this_base_phase,
                                                             this_phase_series, tc_datas_bw_list,
                                                             tc_datas_bw_list_update)
                        tc_normalization_import.update_normalization_collection(has_normalization, phase_fit_df, phase,
                                                                                tc_id, x_chain, y_chain, base_key,
                                                                                update_tc_normalizations)

            else:
                error_df = self.append_to_error_df(error_df, tc_fit_df, tc_error_list)

        self.tc_bulk_writes(tc_collections_update, tc_datas_bw_list_update, tc_datas_bw_list, update_tc_normalizations,
                            tc_well_assigments_collection_update)

        error_df = self.rename_columns(error_df, False)
        has_error = False
        self.get_tc_ids_with_forecast(all_tc_names, tcs_name_forecast, forecast_id, get_new_normalizations)
        tc_normalization_import.get_new_normalization_multipliers(get_new_normalizations)
        # upload error report to cloud storage
        if not error_df.empty:
            excel_buffer = io.StringIO()
            error_df.to_csv(excel_buffer, index=False)
            excel_buffer_value = excel_buffer.getvalue()
            run_date = datetime.datetime.utcnow()

            gcp_name = f'Typecurve-import-error--{str(project_id)}--{run_date.isoformat()}.csv'
            content_type = 'application/CSV'
            file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}

            file_object = self.context.file_service.upload_file_from_string(
                string_data=excel_buffer_value,
                file_data=file_info,
                project_id=project_id,
            )
            file_id = str(file_object.get('_id'))
            has_error = not error_df['Error'].dropna().empty
        else:
            file_id = None

        return file_id, has_error

    def get_tc_ids_with_forecast(self, all_tc_names, tcs_name_forecast, forecast_id, get_new_normalizations):
        tcs_with_forecast = set()
        for name in all_tc_names:
            if name in tcs_name_forecast and tcs_name_forecast[name] != 'undefined':
                tcs_with_forecast.add(str(tcs_name_forecast[name]))

        for tc in list(get_new_normalizations):
            if tc in tcs_with_forecast or forecast_id:
                continue
            else:
                get_new_normalizations.pop(tc, None)

    def get_new_normalization_tc_phase(self, has_normalization, tc_id, phase, get_new_normalizations, phase_fit_df):
        if has_normalization:
            n_type = phase_fit_df['normalization_type'].dropna().unique().tolist()
            n_type = [nt for nt in n_type if nt][0]
            if n_type != 'no_normalization':
                get_new_normalizations[str(tc_id)].add(phase)

    def get_unmatched_wells_append_to_error_df(self, tc_id, unmatched_wells, overlimit_wells, error_df, phase_fit_df,
                                               phase_error_list, wells):
        tc_unmatched_wells = unmatched_wells[ObjectId(tc_id)]
        tc_overlimit_wells = overlimit_wells[ObjectId(tc_id)]
        if wells and (tc_unmatched_wells or tc_overlimit_wells):
            unmatched_wells_message = ','.join(map(str, tc_unmatched_wells))
            message2 = ','.join(map(str, tc_overlimit_wells))
            error_message = ''
            if unmatched_wells_message:
                error_message += f'Unmatched identifiers : {unmatched_wells_message}. '
            if message2:
                error_message += f'More than 500 wells imported, only the first 500 wells are kept. Left: {message2}'

            phase_error_list.append({'error_message': error_message, 'row_index': 0})

            error_df = self.append_to_error_df(error_df, phase_fit_df, phase_error_list, True)

        return error_df

    def get_this_tc_target_forecast(self, tc_name, forecast_id, tcs_name_forecast):
        if not forecast_id:
            return 'undefined'

        if tc_name in tcs_name_forecast:
            return tcs_name_forecast[tc_name]

        return ObjectId(forecast_id)

    def check_phase_series(self, phase_df, error_message):
        series = phase_df['Series'].unique().tolist()
        for s in series:
            if s not in ['best', 'P10', 'P50', 'P90', 'p10', 'p50', 'p90']:
                error_message.append({'error_message': 'Series must be one of best, P10, P50 and P90', 'row_index': 0})
                return (False, None)
            this_series = phase_df[phase_df['Series'] == s]
            segment = this_series['Segment'].tolist()
            if not self.segment_check(segment):
                error_message.append({'error_message': 'Segments must start with 1 and in sequence.', 'row_index': 0})
                return (False, None)
        return (True, series)

    def segment_check(self, segment):
        segment.sort()
        if 1 not in segment:
            return False
        for i in range(1, len(segment)):
            if segment[i] - segment[i - 1] != 1:
                return False
        return True

    def tc_bulk_writes(self, tc_collections_update, tc_datas_bw_list_update, tc_datas_bw_list, update_tc_normalizations,
                       tc_well_assigments_collection_update):
        if len(tc_collections_update) > 0:
            self.context.type_curves_collection.bulk_write(tc_collections_update)
        if len(tc_datas_bw_list_update) > 0:
            self.context.type_curves_collection.bulk_write(tc_datas_bw_list_update)
        if len(tc_datas_bw_list) > 0:
            self.context.type_curve_fits_collection.bulk_write(tc_datas_bw_list)
        if len(update_tc_normalizations) > 0:
            self.context.tc_normalization_service.bulk_normalizations_update(update_tc_normalizations, True)
        if len(tc_well_assigments_collection_update) > 0:
            self.context.type_curve_well_assignments_collection.bulk_write(tc_well_assigments_collection_update)

    def check_one_tc(self, tc, error_message):

        tc_types = []
        for this_type in tc['Type'].unique().tolist():
            this_type = clean_up_str(this_type)

            if this_type not in ['ratio', 'rate']:
                error_message.append({
                    'error_message': 'TypeCurve Type must be ratio or rate (case insensitive)',
                    'row_index': 0
                })
                return (False, None, None)

            tc_types.append(this_type)

        if 'ratio' not in tc_types:
            return (True, 'oil', 'rate')
        phase_dict = {'oil': [], 'gas': [], 'water': []}

        for index, row in tc.iterrows():
            this_base_phase = clean_up_str(row['Base Phase'])
            if clean_up_str(row['Type']) == 'ratio':
                if not phase_dict[row['Phase']]:
                    phase_dict[row['Phase']] = row['Base Phase']
                elif this_base_phase not in ['oil', 'gas', 'water']:
                    error_message.append({
                        'error_message': 'Base Phase must be one of oil, gas or water',
                        'row_index': 0
                    })
                    return (False, None, None)
                elif this_base_phase not in phase_dict[row['Phase']]:
                    error_message.append({'error_message': 'Base Phase must be unique for one Phase', 'row_index': 0})
                    return (False, None, None)

        num = 0
        base_phase = []
        for phase in phase_dict:
            if phase_dict[phase]:
                num += 1
                if phase_dict[phase] not in base_phase:
                    base_phase.append(phase_dict[phase])

        if len(base_phase) > 1 or num >= 3:
            error_message.append({'error_message': 'Each TC can only have one unique Base Phase', 'row_index': 0})
            return (False, None, None)

        return (True, base_phase[0], 'ratio')

    def insert_to_tc_collection(self, tc_name, base_phase, user_id, project_id, tc_id, forecast_id,
                                phase_regression_type, tc_collections_update, tc_collections_record, wells,
                                tc_well_assigments_collection_update, insert_to_tc_well_assigments_memo):
        tc_collections_record.append(tc_name)
        this_time = datetime.datetime.utcnow()
        tc_record = deepcopy(TypeCurveSchema)
        tc_record['name'] = tc_name
        tc_record['_id'] = ObjectId(tc_id)
        tc_record['basePhase'] = base_phase
        tc_record['createdBy'] = ObjectId(user_id)
        tc_record['createdAt'] = this_time
        tc_record['updatedAt'] = this_time
        tc_record['project'] = ObjectId(project_id)
        tc_record['forecast'] = ObjectId(forecast_id) if forecast_id else None
        tc_record['regressionType'] = phase_regression_type
        tc_record['wells'] = wells if wells else []

        tc_collections_update += [InsertOne(tc_record)]

        if wells and tc_id not in insert_to_tc_well_assigments_memo:
            insert_to_tc_well_assigments_memo.add(tc_id)
            self.insert_to_tc_well_assigments(tc_id, wells, tc_well_assigments_collection_update)

    def insert_to_tc_well_assigments(self, tc_id, wells, tc_well_assigments_collection_update):

        for well in wells:
            tc_well_assigment = deepcopy(TypeCurveWellAssignmentsSchema)
            tc_well_assigment['typeCurve'] = ObjectId(tc_id)
            tc_well_assigment['well'] = well

            tc_well_assigments_collection_update += [InsertOne(deepcopy(tc_well_assigment))]

    def insert_to_tc_fit_collection(self, db_segments, project_id, tc_id, phase_fit_df, phase, phase_fit_type,
                                    phase_regression_type, base_phase, phase_p_series, tc_datas_bw_list,
                                    tc_datas_bw_list_update):

        tc_fit_id = ObjectId()
        tc_fit_record = deepcopy(TypeCurveFitSchema)
        self.get_align_normalize_resolution_info_for_fit(phase_fit_df, tc_fit_record)
        tc_fit_record['fitType'] = phase_fit_type
        tc_fit_record['regressionType'] = phase_regression_type
        tc_fit_record['_id'] = tc_fit_id
        tc_fit_record['phase'] = phase
        tc_fit_record['typeCurve'] = ObjectId(tc_id)
        set_value = {f'fits.{phase}': ObjectId(tc_fit_id)}

        fill_in_p_series_dict = self.fill_in_phase_p_series(phase_p_series)

        if phase_fit_type == 'ratio':
            for s in ['P10', 'P50', 'P90', 'best']:
                fill_in_series = fill_in_p_series_dict[s]
                tc_fit_record['ratio_P_dict'][s] = {
                    'segments': db_segments[fill_in_series],
                    'basePhase': base_phase,
                }
            set_value['basePhase'] = base_phase
            set_value['tcType'] = 'ratio'
        else:
            for s in ['P10', 'P50', 'P90', 'best']:
                fill_in_series = fill_in_p_series_dict[s]
                tc_fit_record['P_dict'][s] = {'segments': db_segments[fill_in_series]}

        #insert this tc fit
        tc_datas_bw_list += [InsertOne(tc_fit_record)]

        set_value['updatedAt'] = datetime.datetime.utcnow()
        set_value['fitted'] = True
        set_value[f'phaseType.{phase}'] = phase_fit_type

        match = {'_id': ObjectId(tc_id)}

        tc_datas_bw_list_update += [UpdateOne(match, {'$set': set_value})]

    def get_tc_fit(self, tc_id, phase):
        tc_fit = list(self.context.type_curve_fits_collection.find({'typeCurve': ObjectId(tc_id), 'phase': phase}))
        if tc_fit:
            return (True, tc_fit[0]['fitType'])
        else:
            return (False, None)

    def get_tc(self, tc_id):
        tc = list(self.context.type_curves_collection.find({'_id': ObjectId(tc_id)}))
        return True if tc else False

    def append_to_error_df(self, error_df, tc_df, error_list, warning=False):
        error_col = [''] * tc_df.shape[0]
        for error in error_list:
            error_index = error['row_index']
            error_message = error['error_message']
            if error_col[error_index] == '':
                error_col[error_index] += error_message
            else:
                error_col[error_index] += '; ' + error_message

        if not warning:
            tc_df['Error'] = error_col
        else:
            tc_df['Warning'] = error_col

        error_df = error_df.append(tc_df)

        return error_df

    def fill_in_phase_p_series(self, phase_p_series):
        fill_in_dict = {'best': 'best', 'P10': 'P10', 'P50': 'P50', 'P90': 'P90'}
        fill_in_series = None

        if len(phase_p_series) == 1:
            for key in fill_in_dict:
                fill_in_dict[key] = phase_p_series[0]
        elif len(phase_p_series) < 4:
            for s in ['P90', 'P10', 'P50', 'best']:
                if s in phase_p_series:
                    fill_in_series = s

            for s in ['P90', 'P10', 'P50', 'best']:
                if s not in phase_p_series:
                    fill_in_dict[s] = fill_in_series

        return fill_in_dict

    def append_to_bw_list(self, db_segments, tc_datas_bw_list, project_id, tc_id, phase, phase_fit_type,
                          phase_regression_type, base_phase, phase_p_series, phase_fit_df, tc_datas_bw_list_update,
                          tc_collections_update, wells, tc_well_assigments_collection_update,
                          insert_to_tc_well_assigments_memo):

        has_tc_fit, tc_fit_type_in_db = self.get_tc_fit(tc_id, phase)
        if has_tc_fit:
            update_filter_dict = {'typeCurve': ObjectId(tc_id), 'phase': phase}
            set_dict = {'regressionType': phase_regression_type}
            set_tc_collection = {'regressionType': phase_regression_type}

            self.get_align_normalize_resolution_info_for_fit(phase_fit_df, set_dict)

            if tc_fit_type_in_db == phase_fit_type:
                for series in phase_p_series:
                    if phase_fit_type == 'ratio':
                        set_dict['fitType'] = 'ratio'
                        set_dict[f'ratio_P_dict.{series}.segments'] = db_segments[series]
                        set_dict[f'ratio_P_dict.{series}.basePhase'] = base_phase

                    else:
                        set_dict[f'P_dict.{series}.segments'] = db_segments[series]
                        set_dict['fitType'] = 'rate'
            else:

                fill_in_p_series_dict = self.fill_in_phase_p_series(phase_p_series)

                if phase_fit_type == 'ratio':
                    set_dict['fitType'] = 'ratio'
                    set_dict['ratio_P_dict'] = {}
                    for s in ['P10', 'P50', 'P90', 'best']:
                        fill_in_series = fill_in_p_series_dict[s]
                        set_dict['ratio_P_dict'][s] = {
                            'segments': db_segments[fill_in_series],
                            'basePhase': base_phase,
                        }

                    set_tc_collection['tcType'] = 'ratio'
                    set_tc_collection[f'phaseType.{phase}'] = 'ratio'
                    set_tc_collection['basePhase'] = base_phase

                else:
                    set_dict['fitType'] = 'rate'
                    set_dict['P_dict'] = {}
                    set_tc_collection[f'phaseType.{phase}'] = 'rate'
                    for s in ['P10', 'P50', 'P90', 'best']:
                        fill_in_series = fill_in_p_series_dict[s]
                        set_dict['P_dict'][s] = {'segments': db_segments[fill_in_series]}

            if wells and tc_id not in insert_to_tc_well_assigments_memo:
                insert_to_tc_well_assigments_memo.add(tc_id)
                set_tc_collection['wells'] = wells
                self.delete_old_tc_wells(tc_id)
                self.insert_to_tc_well_assigments(tc_id, wells, tc_well_assigments_collection_update)

            #update existing type curve documents
            update_tc_dict = UpdateOne({'_id': ObjectId(tc_id)}, {'$set': set_tc_collection})
            tc_collections_update.append(update_tc_dict)

            #update existing type curve fits documents
            update_dict = UpdateOne(update_filter_dict, {'$set': set_dict})
            tc_datas_bw_list.append(update_dict)
        else:
            #insert new type curve fits
            self.insert_to_tc_fit_collection(db_segments, project_id, tc_id, phase_fit_df, phase, phase_fit_type,
                                             phase_regression_type, base_phase, phase_p_series, tc_datas_bw_list,
                                             tc_datas_bw_list_update)

    def get_align_normalize_resolution_info_for_fit(self, phase_fit_df, curr_dict):
        align = phase_fit_df['Align Peak'].unique().tolist()
        toggle_normalize = phase_fit_df['Toggle Normalize'].unique().tolist()
        toggle_daily = phase_fit_df['Toggle Daily'].unique().tolist()

        if align and align[0] in ['align', 'noalign']:
            curr_dict['align'] = align[0]

        if toggle_normalize and toggle_normalize[0] in ['no', 'No', 'FALSE', 'false', 'False', False]:
            curr_dict['normalize'] = False
        elif toggle_normalize and toggle_normalize[0] in ['yes', 'Yes', 'TRUE', 'true', 'True', True]:
            curr_dict['normalize'] = True

        if toggle_daily and toggle_daily[0] in ['Monthly', 'monthly']:
            curr_dict['resolution'] = 'monthly'
        elif toggle_daily and toggle_daily[0] in ['Daily', 'daily']:
            curr_dict['resolution'] = 'daily'

    def delete_old_tc_wells(self, tc_id):
        query = {'typeCurve': ObjectId(tc_id)}
        self.context.type_curve_well_assignments_collection.delete_many(query)
        self.context.type_curve_normalization_wells_collection.delete_many(query)

    def process_tc_q_start_q_end(self, seg_type, seg, i, seg_template, phase_error_list):
        q_start = None
        q_end = None
        # q_start
        if seg_type != 'empty':
            q_start = get_number(seg, 'q Start', phase_error_list, i)
            seg_template['q_start'] = q_start
            if (q_start is not None) and (q_start <= 0):
                phase_error_list.append({'error_message': 'q Start should be larger than 0', 'row_index': i})

        if seg_type == 'linear':
            q_end = get_number(seg, 'q End', phase_error_list, i)
            seg_template['q_end'] = q_end
            if q_end and q_end < 0:
                phase_error_list.append({'error_message': 'q End should be larger than 0', 'row_index': i})

        return q_start, q_end

    def process_linear_d_eff(self, seg_type, seg_template, q_start, q_end, start_idx, end_idx):
        if seg_type == 'linear':
            if end_idx - start_idx > 0:
                k = (q_end - q_start) / (end_idx - start_idx)
            else:
                k = 0
            d_eff_linear = -k * DAYS_IN_YEAR / q_start
            seg_template['D_eff'] = d_eff_linear

    def check_start_end_idx(self, start_idx, end_idx, phase_error_list, i):
        if not phase_error_list:
            if start_idx % 1 == 0 and end_idx % 1 == 0:
                return
            else:
                phase_error_list.append({
                    'error_message': 'Start Index and End Index should be integer.',
                    'row_index': i
                })

    def process_tc_segments(self, segment_list, phase_error_list, db_segments, series_idx):
        prev_seg_end_idx = None

        for i, seg in enumerate(segment_list):
            i += series_idx
            seg_type = clean_up_str(seg['Segment Type'])
            series_type = clean_up_str(seg['Series'])
            series_type = clean_series_name(series_type)

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
                start_idx = get_number(seg, 'Start Index', phase_error_list, i)
            end_idx = get_number(seg, 'End Index', phase_error_list, i)
            self.check_start_end_idx(start_idx, end_idx, phase_error_list, i)
            seg_template['start_idx'] = start_idx
            seg_template['end_idx'] = end_idx

            if start_idx and end_idx and end_idx < start_idx:
                phase_error_list.append({
                    'error_message': 'End Index should be larger than Start Index',
                    'row_index': i
                })

            if prev_seg_end_idx is not None:
                if start_idx != prev_seg_end_idx + 1:
                    phase_error_list.append({
                        'error_message': 'Start Index is not 1 day after previous End Index',
                        'row_index': i
                    })
            prev_seg_end_idx = end_idx

            # q_start and q_end
            q_start, q_end = self.process_tc_q_start_q_end(seg_type, seg, i, seg_template, phase_error_list)
            if not phase_error_list:
                self.process_linear_d_eff(seg_type, seg_template, q_start, q_end, start_idx, end_idx)

            # D_eff
            if seg_type in ['arps', 'arps_inc', 'arps_modified', 'exp_inc', 'exp_dec']:
                D_eff = get_number(seg, 'Di Eff-Sec', phase_error_list, i)  # noqa N806
                if D_eff == 0:
                    seg_type = 'flat'
                    seg_template = get_template(seg_type)
                    seg_template['start_idx'] = start_idx
                    seg_template['end_idx'] = end_idx
                    seg_template['q_start'] = q_start
                else:
                    seg_template['D_eff'] = D_eff
                    ForecastImport.check_d_eff(D_eff, seg_type, phase_error_list, i)

            # b
            if seg_type in ['arps', 'arps_inc', 'arps_modified']:
                b = get_number(seg, 'b', phase_error_list, i)
                seg_template['b'] = b
                ForecastImport.check_b(D_eff, seg_type, phase_error_list, i)

            # target_D_eff_sw
            if seg_type == 'arps_modified':
                target_D_eff_sw = get_number(seg, 'Realized D Sw-Eff-Sec', phase_error_list, i)  # noqa N806
                seg_template['target_D_eff_sw'] = target_D_eff_sw
                # 0 < target_D_eff_sw < 1
                if target_D_eff_sw and D_eff and (target_D_eff_sw <= 0 or target_D_eff_sw >= 1):
                    phase_error_list.append({
                        'error_message': 'D Sw-Eff-Sec should be larger than 0, less than 1',
                        'row_index': i
                    })

            seg_template = MultipleSegments.fill_segment(seg_template, seg_type, phase_error_list)
            if series_type not in db_segments:
                db_segments[series_type] = [seg_template]
            else:
                db_segments[series_type].append(seg_template)

    def check_tc_fit_info(self, forecast_first_row, phase_error_list):
        phase_forecast_type = None
        base_phase = None
        phase_p_series = None

        phase_forecast_type = clean_up_str(forecast_first_row['Type'])
        if phase_forecast_type not in ['ratio', 'rate']:
            phase_error_list.append({
                'error_message': 'TypeCurve Fit Type must be ratio or rate (case insensitive)',
                'row_index': 0
            })

        if phase_forecast_type == 'ratio':
            base_phase = clean_up_str(forecast_first_row['Base Phase'])
            if base_phase not in ['oil', 'gas', 'water']:
                phase_error_list.append({'error_message': 'Base Phase not valid', 'row_index': 0})

        phase_p_series = clean_up_str(forecast_first_row['Series'])
        if phase_p_series not in ['p10', 'p50', 'p90', 'best']:
            phase_error_list.append({'error_message': 'Series not valid', 'row_index': 0})
        else:
            if phase_p_series in ['p10', 'p50', 'p90']:
                phase_p_series = phase_p_series[0].upper() + phase_p_series[1:]

        return phase_forecast_type, base_phase, phase_p_series

    def upload(self, p_req):
        file_id = p_req['file_id']
        user_id = p_req['user_id']
        project_id = p_req['project_id']

        upsert_query = {'projectId': ObjectId(project_id), 'importType': 'typeCurve'}
        upsert_body = {
            'userId': ObjectId(user_id),
            'fileId': ObjectId(file_id),
            'inc__lock': 1,
        }
        error_report_gcp_name = None
        has_error = False

        upsert_result = self.typecurve_import_upsert(upsert_query, upsert_body)
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        try:
            if upsert_result.upserted_id:
                try:
                    error_report_gcp_name, has_error = self.typecurve_import(p_req)
                    if error_report_gcp_name:
                        description = 'Type Curve import finished with errors or warnings.'
                    else:
                        description = 'Type Curve import finished'
                except Exception as e:
                    description = 'Error happened during Type Curve import'
                    raise e
                finally:
                    self.delete_forecast_import(upsert_result.upserted_id)

            else:
                description = 'Another user is importing typecurve to the project, please try again later'
                raise TypeCurveImportError(description)
        finally:
            self.context.file_service.delete_file(file_gcp_name)

        return error_report_gcp_name, has_error
