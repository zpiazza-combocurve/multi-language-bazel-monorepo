import io
import csv
import copy
import datetime
import numpy as np
import pandas as pd
from bson import ObjectId
from pymongo import InsertOne, UpdateOne
from pymongo.errors import OperationFailure
from pyexcelerate import Workbook, Style
from typing import Optional
from api.cc_to_cc.helper import name_generator, str_to_display, display_to_str
from api.cc_to_cc.ownership_reversion import ownership_model_import
from api.cc_to_cc.reserves_category import reserves_category_import
from api.cc_to_cc.expenses import expenses_import
from api.cc_to_cc.capex import capex_import
from api.cc_to_cc.stream_properties import stream_properties_import
from api.cc_to_cc.dates import dates_import
from api.cc_to_cc.pricing import pricing_import
from api.cc_to_cc.differentials import differentials_import
from api.cc_to_cc.risking import risking_import
from api.cc_to_cc.production_taxes import production_taxes_import
from api.cc_to_cc.escalation import escalation_import
from api.cc_to_cc.carbon.carbon_import import carbon_import
from api.cc_to_cc.assumption_export import df_replace_null_with_none
from api.cc_to_cc.helper import str_or_none, log_missing_field, update_facility_name
from api.cc_to_cc.fluid_model import fluid_model_import
from api.cc_to_cc.emission import emission_import
from api.cc_to_cc.file_headers import (ASSUMP_HEADER, MODEL_TYPE_UNIQUE, MODEL_TYPE_PROJECT, MODEL_TYPE_LOOKUP,
                                       MODEL_TYPE_NOT_ASSIGNED, INPT_ID, INCREMENTAL_INDEX, ColumnName, PROD_TAX_KEY,
                                       DIFFERENTIALS_KEY, OWNERSHIP_KEY, CAPEX_KEY, RISKING_KEY, EXPENSES_KEY,
                                       FLUID_MODEL_KEY, EMISSION_KEY, CARBON_IMPORT_KEYS, FLUID_MODEL_NODE_KEYS,
                                       get_assumption_empty_row, OPTIONAL_CARBON_HEADERS, CARBON_WELL_HEADERS)
from combocurve.science.network_module.nodes.shared.utils import (NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY,
                                                                  FACILITY_EDGES_KEY, WELL_GROUP_WELLS_KEY)
from combocurve.shared.helpers import clean_up_str
from combocurve.shared.econ_tools.econ_to_options import ECON_TO_OPTIONS_DICT
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED

SCENARIO_MAX_WELL_NUMBER = 50000

MAX_SHEET_ROWS = 1000000

ASSUMP_KEY_NAME_DICT = {
    'ownership_reversion': 'Ownership and Reversion',
    'reserves_category': 'Reserves Category',
    'expenses': 'Expenses',
    'capex': 'CAPEX',
    'stream_properties': 'Stream Properties',
    'dates': 'Dates',
    'pricing': 'Pricing',
    'differentials': 'Differentials',
    'risking': 'Risking',
    'production_taxes': 'Production Taxes',
    'escalation': 'Escalation',
    FLUID_MODEL_KEY: 'Fluid Model',
    EMISSION_KEY: 'Emission',
}

IMPORT_FUNC_DICT = {
    'ownership_reversion': ownership_model_import,
    'reserves_category': reserves_category_import,
    'expenses': expenses_import,
    'capex': capex_import,
    'stream_properties': stream_properties_import,
    'dates': dates_import,
    'pricing': pricing_import,
    'differentials': differentials_import,
    'risking': risking_import,
    'production_taxes': production_taxes_import,
    'escalation': escalation_import,
    FLUID_MODEL_KEY: fluid_model_import,
    EMISSION_KEY: emission_import,
}


def get_qualifier_path(field, qualifier_key):
    return '%s.%s' % (field, qualifier_key)


class ImportError(Exception):
    expected = True


class AssumptionImport:
    def __init__(self, context):
        self.context = context

    def validate_header(self,
                        header: list,
                        assumption_key: str,
                        scenario_header=False,
                        optional_headers=[]) -> Optional[list]:
        default_headers = ASSUMP_HEADER[assumption_key].copy()

        always_optional = [
            ColumnName.createdAt.value, ColumnName.createdBy.value, ColumnName.updatedAt.value,
            ColumnName.updatedBy.value
        ]
        # try:  # remove updated at from required header list if exists
        #     required_header.remove(ColumnName.updatedAt.value)
        # except ValueError:
        #     pass

        header_adj = [h.strip() for h in header]

        basic_headers = [ColumnName.model_type.value, ColumnName.model_name.value]
        if scenario_header:
            basic_headers += [INPT_ID, INCREMENTAL_INDEX]

        # for h in basic_headers:
        #     if h not in header_adj:
        #         missing_headers.append(h)
        required_headers = set(default_headers + basic_headers) - set(always_optional + optional_headers)
        missing_headers = list(required_headers - set(header_adj))

        if missing_headers:
            raise ImportError('Missing required column(s): ' + ', '.join(missing_headers))
        return list(required_headers)

    def fill_in_optional_missing_columns(self, data_df, assumption_key):
        cols = data_df.columns

        if assumption_key == PROD_TAX_KEY:
            for col in [
                    ColumnName.production_taxes_state.value, ColumnName.start_date.value,
                    ColumnName.shrinkage_condition.value, ColumnName.escalation_model_1.value,
                    ColumnName.escalation_model_2.value
            ]:
                if col not in cols:
                    data_df.loc[:, col] = None

        elif assumption_key == DIFFERENTIALS_KEY:
            if ColumnName.escalation_model.value not in data_df.columns:
                data_df.loc[:, ColumnName.escalation_model.value] = None

        elif assumption_key == OWNERSHIP_KEY:
            if ColumnName.reversion_tied_to.value not in data_df.columns:
                data_df.loc[:, ColumnName.reversion_tied_to.value] = None

        elif assumption_key == RISKING_KEY:
            if ColumnName.scale_post_shut_in_end_criteria.value not in cols:
                data_df.loc[:, ColumnName.scale_post_shut_in_end_criteria.value] = 'Econ Limit'
            if ColumnName.scale_post_shut_in_end.value not in cols:
                data_df.loc[:, ColumnName.scale_post_shut_in_end.value] = ' '

        elif assumption_key in [CAPEX_KEY, EXPENSES_KEY]:
            if ColumnName.embedded_lookup_table.value not in cols:
                data_df.loc[:, ColumnName.embedded_lookup_table.value] = None

        return data_df

    def change_old_header_to_new_header(self, df, assumption_key):
        if assumption_key == CAPEX_KEY:
            mapper = {col: 'Value' for col in df.filter(regex=r'(?i)\s*days\s*[(]date[)]\s*').columns}
            df.rename(columns=mapper, inplace=True)
        if assumption_key == RISKING_KEY:
            if 'Scale Post Shut-in' in df.columns:
                df.rename(columns={'Scale Post Shut-in': 'Scale Post Shut-in Factor'}, inplace=True)
        return df

    def cast_name_cols_to_string(self, df: pd.DataFrame, header: list, additional_name_cols=[]) -> pd.DataFrame:
        potential_name_cols = [
            ColumnName.model_name.value,
            ColumnName.embedded_lookup_table.value,
            ColumnName.escalation_model.value,
            ColumnName.escalation_model_1.value,
            ColumnName.escalation_model_2.value,
            'Depreciation',
        ]
        # get the name cols that are in the header
        name_cols = list(set(header) & set(potential_name_cols + additional_name_cols))
        for name_col in name_cols:
            df[name_col] = df[name_col].apply(str_or_none, null_response=None)

        return df

    def write_error_log(self, csv_writer, well_array, error_list):
        current_error = well_array.tolist()
        for e in error_list:
            error_message = e['error_message']
            row_index = e['row_index']
            current_error[row_index].append(error_message)

        for r in current_error:
            csv_writer.writerow(r)

        self.has_error = True

    def write_error_log_in_df(self, df_error, well_array, error_list):
        current_error = well_array.tolist()
        for e in error_list:
            error_message = e['error_message']
            row_index = e['row_index']
            current_error[row_index].append(error_message)
        for r in current_error:
            df_error = pd.concat([df_error, pd.DataFrame([r], columns=df_error.columns[0:len(r)])], axis=0)

        return df_error

    def get_project_wells_df(self, project_id, projection={'wells.inptID': 1}):
        try:
            return pd.DataFrame(
                list(
                    self.context.project_collection.aggregate([{
                        '$project': {
                            '_id': 1,
                            'wells': 1
                        }
                    }, {
                        '$match': {
                            '_id': project_id
                        }
                    }, {
                        '$lookup': {
                            'from': 'wells',
                            'localField': 'wells',
                            'foreignField': '_id',
                            'as': 'wells'
                        }
                    }, {
                        '$project': {
                            'wells._id': 1,
                            **projection
                        }
                    }]))[0]['wells'])

        except OperationFailure:
            wells = list(self.context.project_collection.find({'_id': project_id}, {'wells': 1}))

            project_wells = list(self.context.wells_collection.find({'_id': {'$in': wells[0]['wells']}}, {'inptID': 1}))
            return pd.DataFrame(project_wells)

    def _get_escalation_name_mapping(self, project_id):
        # trim leading and ending space, importer will trim it when read from CSV file
        escalation_model_list = self.context.assumption_service.get_escalation_models(project_id)
        return {d['name'].strip(): d for d in escalation_model_list}

    def _get_depreciation_name_mapping(self, project_id):
        # trim leading and ending space, importer will trim it when read from CSV file
        depreciation_model_list = self.context.assumption_service.get_depreciation_models(project_id)
        return {d['name'].strip(): d for d in depreciation_model_list}

    def _get_unique_column(self, data_array, headers, column_name):
        col_idx = headers.index(column_name)
        col = data_array[:, col_idx]
        col = col[col != None]  # noqa E711
        _, unique_idx = np.unique(col, return_index=True)
        return col_idx, col[np.sort(unique_idx)].tolist()

    @staticmethod
    def _get_error_csv_writer(headers):
        header_row = headers + ['Error Message']
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer, quoting=csv.QUOTE_NONNUMERIC)
        csv_writer.writerow(header_row)
        return csv_buffer, csv_writer

    @staticmethod
    def _write_empty_cells_error(data_array, col_name_idx, csv_writer):
        empty_cell_array = data_array[data_array[:, col_name_idx] == None, :].tolist()  # noqa flake8(E711)
        if len(empty_cell_array) > 0:
            for r in empty_cell_array:
                r.append('No model name')
                csv_writer.writerow(r)
            return True
        return False

    def get_econ_function(
        self,
        assumption_key,
        well_array,
        header,
        esca_name_dict,
        depre_name_dict,
        custom_headers,
        project_wells_df,
        df_project_elt,
    ):
        if assumption_key == CAPEX_KEY:
            unique_econ, error_list = IMPORT_FUNC_DICT[assumption_key](
                well_array,
                header,
                esca_name_dict,
                depre_name_dict,
                df_project_elt,
                custom_headers,
            )
        elif assumption_key == EXPENSES_KEY:
            unique_econ, error_list = IMPORT_FUNC_DICT[assumption_key](
                well_array,
                header,
                esca_name_dict,
                df_project_elt,
            )
        elif assumption_key in ['pricing', EXPENSES_KEY, DIFFERENTIALS_KEY, PROD_TAX_KEY, EMISSION_KEY]:
            unique_econ, error_list = IMPORT_FUNC_DICT[assumption_key](well_array, header, esca_name_dict)
        elif assumption_key == 'dates':
            unique_econ, error_list = IMPORT_FUNC_DICT[assumption_key](well_array, header, project_wells_df)
        else:
            unique_econ, error_list = IMPORT_FUNC_DICT[assumption_key](well_array, header)

        return unique_econ, error_list

    def _create_base_model_document(
        self,
        model_econ,
        assumption_key,
        model_name,
        project_id,
        custom_headers,
        is_unique=False,
    ):
        document = {}

        if 'embeddedLookupTables' in model_econ:
            document['embeddedLookupTables'] = model_econ.get('embeddedLookupTables', [])
            model_econ.pop('embeddedLookupTables')

        if assumption_key == PROD_TAX_KEY:
            esca_name_dict = self._get_escalation_name_mapping(project_id)
            esca_name_dict = {str(value['_id']): key for key, value in esca_name_dict.items()}
            options = ECON_TO_OPTIONS_DICT[assumption_key](model_econ, esca_name_dict)
        elif assumption_key == CAPEX_KEY:
            options = ECON_TO_OPTIONS_DICT[assumption_key](model_econ, custom_headers)
        elif assumption_key in [FLUID_MODEL_KEY, EMISSION_KEY]:
            options = None
        else:
            options = ECON_TO_OPTIONS_DICT[assumption_key](model_econ)

        document['name'] = model_name
        document['assumptionKey'] = assumption_key
        document['assumptionName'] = ASSUMP_KEY_NAME_DICT[assumption_key]
        document['unique'] = is_unique
        document['project'] = ObjectId(project_id)

        document['econ_function'] = model_econ
        document['options'] = options if options else None

        return document

    def create_unique_model_document(self, unique_econ, assumption_key, project_id, scenario_id, well_id, user_id,
                                     gen_assump_name, custom_headers):
        unique_document = self._create_base_model_document(
            unique_econ,
            assumption_key,
            next(gen_assump_name),
            project_id,
            custom_headers,
            is_unique=True,
        )

        this_unique_id = ObjectId()
        unique_document['_id'] = this_unique_id

        unique_document['well'] = well_id
        unique_document['scenario'] = ObjectId(scenario_id)

        unique_document['createdBy'] = ObjectId(user_id)
        unique_document['lastUpdatedBy'] = ObjectId(user_id)

        unique_document['createdAt'] = datetime.datetime.utcnow()
        unique_document['updatedAt'] = datetime.datetime.utcnow()

        return unique_document

    def update_assignment(
        self,
        assign_bw_list,
        assumption_key,
        qualifier_key,
        scenario_id,
        well_id,
        incremental_index,
        assump_id,
        model_type='model',
    ):
        qua_path = get_qualifier_path(assumption_key, qualifier_key)
        field_path = qua_path + '.' + model_type

        match_condition = {'well': well_id, 'scenario': ObjectId(scenario_id)}
        if incremental_index == 0:
            match_condition['index'] = None
        else:
            match_condition['index'] = incremental_index

        if model_type == 'model':
            unset_field = f'{qua_path}.lookup'
        else:
            unset_field = f'{qua_path}.model'

        update_dict = {
            '$unset': {
                unset_field: ''
            },
            '$set': {
                field_path: assump_id,
                'updatedAt': datetime.datetime.utcnow()
            }
        }

        assign_bw_list.append(UpdateOne(match_condition, update_dict))

    def load_file_to_df(self, file_gcp_name):
        file_blob = self.context.google_services.storage_bucket.get_blob(file_gcp_name)

        if not file_blob:
            raise ImportError('Updated file not found, try refresh the page and import again')

        if not any(item in file_blob.content_type for item in ["csv", "spreadsheet", "excel"]):
            raise ImportError('Input file is not CSV/Excel format')

        buffer = self.context.file_service.download_to_memory(file_gcp_name)
        buffer.seek(0)
        try:
            if "csv" in file_blob.content_type:
                df = pd.read_csv(buffer, float_precision='round_trip')
            else:
                df = pd.read_excel(buffer)
        except Exception:
            raise ImportError('Failed to read CSV/Excel file')

        # drop columns with no header
        df = df.loc[:, ~df.columns.str.contains('^Unnamed|Error')].copy()

        # drop API 14 column as it is not used
        df.drop(columns=["API 14"], inplace=True, errors="ignore")

        # drop empty rows
        df.dropna(axis=0, how="all", inplace=True)

        return df.replace({np.nan: None})

    def load_file_to_df_with_sheet_name(self, file_gcp_name, sheet_name, import_type='assumption'):
        file_blob = self.context.google_services.storage_bucket.get_blob(file_gcp_name)

        if not file_blob:
            raise ImportError("Uploaded file not found, try refresh the page and import again")
        if not any(item in file_blob.content_type for item in ["spreadsheet", "excel"]):
            raise ImportError("Input file is not Excel format")

        buffer = self.context.file_service.download_to_memory(file_gcp_name)

        buffer.seek(0)
        try:
            df = pd.read_excel(buffer, sheet_name=sheet_name)
        except Exception:
            raise ImportError(f"Failed to read Excel or {import_type} name {sheet_name} doesn't exist in Excel sheets")

        # drop columns with no header
        df = df.loc[:, ~df.columns.str.contains('^Unnamed|Error')].copy()

        if import_type == 'assumption':
            df.drop(columns=["API 14"], inplace=True, errors="ignore")

        # drop empty rows
        df.dropna(axis=0, how="all", inplace=True)

        return df.replace({np.nan: None})

    def get_project_embedded_lookup_tables(self, project_id: ObjectId, assumption_key: str):
        if assumption_key in [EXPENSES_KEY, CAPEX_KEY]:
            return pd.DataFrame(
                self.context.embedded_lookup_tables_collection.find(
                    {
                        'project': project_id,
                        'assumptionKey': assumption_key,
                    }, {
                        '_id': 1,
                        'name': 1,
                    })).rename(columns={'_id': 'id'})
        return None

    def assumption_import(self, import_input, data_df):  # noqa: C901
        assumption_key = import_input.get('assumption_key')
        scenario_id = import_input.get('scenario_id')
        user_id = import_input.get('user_id')
        qualifier_key = import_input.get('qualifier_key')
        all_unique = import_input.get('all_unique')
        time_zone = import_input.get('time_zone')
        notification_id = import_input.get('notification_id')
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')

        ## add missing optional columns
        data_df = self.fill_in_optional_missing_columns(data_df, assumption_key).copy()

        ## change old headers to new ones (for old csv files)
        data_df = self.change_old_header_to_new_header(data_df, assumption_key).copy()

        header = list(data_df.columns)
        _ = self.validate_header(header, assumption_key, True)

        if INCREMENTAL_INDEX in header:
            data_df[INCREMENTAL_INDEX].replace([None], 0, inplace=True)

        data_df = self.cast_name_cols_to_string(data_df, header)

        data_array = data_df.values

        ## query
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']
        active_qualifier = scenario['columns'][assumption_key]['activeQualifier']
        new_qualifier = active_qualifier != qualifier_key

        # get embedded lookup tables in project
        df_project_elt = self.get_project_embedded_lookup_tables(project_id=project_id, assumption_key=assumption_key)

        # project_model_list
        project_model_list = self.context.assumption_service.get_project_models(project_id, assumption_key)
        project_model_name_to_id = {d['name']: d['_id'] for d in project_model_list}

        # project wells IDs and inpt IDs
        project_wells_df = self.get_project_wells_df(project_id)

        # project_lookup_list
        project_lookup_list = self.context.lookup_tables_collection.find({'project': project_id}, {'name': 1})
        project_lookup_name_to_id = {d['name']: d['_id'] for d in project_lookup_list}

        esca_name_dict = self._get_escalation_name_mapping(project_id)
        depre_name_dict = self._get_depreciation_name_mapping(project_id)

        # assignments
        scenario_assignment_list = list(
            self.context.scenario_well_assignments_service.get_assignments(
                scenario_id=scenario_id,
                assumption_keys=[assumption_key],
                fetch_lookup=False,
                query_sort=False,
            ))

        inpt_id_incremental_assign_dict = {}
        for assignment in scenario_assignment_list:
            inpt_id_incremental_pair = (assignment['well_header_info']['inptID'], assignment.get('index', 0))
            inpt_id_incremental_assign_dict[inpt_id_incremental_pair] = {
                'assignment': assignment[assumption_key] if assumption_key in assignment.keys() else None,
                'well_id': assignment['well']
            }

        assign_bw_list = []
        assumption_bw_list = []

        # get col_idx
        model_type_col_idx = header.index(ColumnName.model_type.value)
        model_name_col_idx = header.index(ColumnName.model_name.value)
        incremental_index_col_idx = header.index(INCREMENTAL_INDEX)
        inpt_id_col_idx, inpt_id_list = self._get_unique_column(data_array, header, column_name=INPT_ID)

        # error buffer
        header_row = header + ['Error Message']
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer, quoting=csv.QUOTE_NONNUMERIC)
        csv_writer.writerow(header_row)
        self.has_error = False

        self._update_user_progress(user_id, notification_id, 10)

        # add error message for rows don't have inpt_id
        no_inpt_id_array = data_array[data_array[:, inpt_id_col_idx] == None, :].tolist()  # noqa flake8(E711)
        if len(no_inpt_id_array) > 0:
            for r in no_inpt_id_array:
                r.append('No INPT ID')
                csv_writer.writerow(r)
            self.has_error = True

        ## process
        # assumption process
        gen_assump_name = name_generator(time_zone)

        # get rid of wells not in forecast otherwise we may end up processing way more wells that may cause issue
        if len(inpt_id_list) > SCENARIO_MAX_WELL_NUMBER:
            scenario_inpt_ids = [i[0] for i in inpt_id_incremental_assign_dict]
            inpt_id_list = [i for i in inpt_id_list if i in scenario_inpt_ids]

        update_freq = max(len(inpt_id_list) // 20, 1)

        for idx, inpt_id in enumerate(inpt_id_list):
            well_inc_array = data_array[data_array[:, inpt_id_col_idx] == inpt_id, :]
            well_unique_inc_idx = np.unique(well_inc_array[:, incremental_index_col_idx])

            for incremental_index in well_unique_inc_idx:
                inpt_id_incremental_pair = (inpt_id, incremental_index)
                well_array = well_inc_array[well_inc_array[:, incremental_index_col_idx] == incremental_index, :]

                if inpt_id_incremental_pair not in inpt_id_incremental_assign_dict:
                    error_list = [{'error_message': 'Well (incremental) not in scenario!', 'row_index': 0}]
                    self.write_error_log(csv_writer, well_array, error_list)
                    continue

                origin_assigned_id = inpt_id_incremental_assign_dict[inpt_id_incremental_pair]['assignment']
                well_id = inpt_id_incremental_assign_dict[inpt_id_incremental_pair]['well_id']

                import_model_type = clean_up_str(well_array[0, model_type_col_idx])
                if import_model_type not in [
                        MODEL_TYPE_UNIQUE, MODEL_TYPE_PROJECT, MODEL_TYPE_LOOKUP, MODEL_TYPE_NOT_ASSIGNED
                ]:
                    error_list = [{'error_message': 'Invalid model type', 'row_index': 0}]
                    self.write_error_log(csv_writer, well_array, error_list)
                    continue
                elif import_model_type == MODEL_TYPE_NOT_ASSIGNED:
                    continue

                import_model_name = well_array[0, model_name_col_idx]

                if import_model_type == MODEL_TYPE_LOOKUP:
                    if import_model_name in project_lookup_name_to_id:
                        import_model_id = project_lookup_name_to_id[import_model_name]

                        if new_qualifier or (import_model_id != origin_assigned_id):
                            self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id, well_id,
                                                   incremental_index, import_model_id, 'lookup')
                    else:
                        error_list = [{
                            'error_message': f'Lookup name: {import_model_name} does not exist!',
                            'row_index': 0
                        }]
                        self.write_error_log(csv_writer, well_array, error_list)
                else:
                    if (not all_unique) and (import_model_type == MODEL_TYPE_PROJECT):
                        # handle project model
                        if import_model_name in project_model_name_to_id:
                            import_model_id = project_model_name_to_id[import_model_name]

                            if new_qualifier or (import_model_id != origin_assigned_id):
                                self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id,
                                                       well_id, incremental_index, import_model_id, 'model')
                        else:
                            error_list = [{
                                'error_message': f'Model name: {import_model_name} does not exist!',
                                'row_index': 0
                            }]
                            self.write_error_log(csv_writer, well_array, error_list)
                    else:
                        # handle unique model
                        unique_econ, error_list = self.get_econ_function(
                            assumption_key,
                            well_array,
                            header,
                            esca_name_dict,
                            depre_name_dict,
                            custom_headers,
                            project_wells_df,
                            df_project_elt,
                        )

                        if len(error_list) > 0:
                            self.write_error_log(csv_writer, well_array, error_list)
                        else:
                            # create new unique model
                            unique_document = self.create_unique_model_document(
                                unique_econ,
                                assumption_key,
                                project_id,
                                scenario_id,
                                well_id,
                                user_id,
                                gen_assump_name,
                                custom_headers,
                            )

                            assumption_bw_list.append(InsertOne(unique_document))

                            self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id, well_id,
                                                   incremental_index, unique_document['_id'])

            # update progress bar
            if idx % update_freq == 0:
                well_prog = 10 + round(89 * (idx + 1) / len(inpt_id_list))
                self._update_user_progress(user_id, notification_id, well_prog)

        # write to db
        if len(assign_bw_list) > 0:
            self.context.scenario_well_assignments_service.assignment_bulk_write(assign_bw_list)
        if len(assumption_bw_list) > 0:
            self.context.assumption_service.assumption_bulk_write(assumption_bw_list)

        self._update_user_progress(user_id, notification_id, 99)

        # upload error report to cloud storage
        if self.has_error:
            project_id = scenario['project']
            run_date = datetime.datetime.utcnow()

            gcp_name = f'cc-cc-import-error--{str(scenario_id)}--{assumption_key}--{run_date.isoformat()}.csv'
            content_type = 'application/CSV'
            csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}

            self.context.file_service.upload_file_from_string(
                string_data=csv_buffer.getvalue(),
                file_data=csv_file_info,
                project_id=project_id,
            )
        else:
            gcp_name = None

        return gcp_name

    def assumption_multi_import(self, import_input, scenario, data_df):  # noqa: C901
        assumption_key = import_input.get('assumption_key')
        scenario_id = import_input.get('scenario_id')
        user_id = import_input.get('user_id')
        qualifier_key = import_input.get('qualifier_key')
        all_unique = import_input.get('all_unique')
        time_zone = import_input.get('time_zone')
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')

        ## add missing optional columns
        data_df = self.fill_in_optional_missing_columns(data_df, assumption_key).copy()

        ## change old headers to new ones (for old csv files)
        data_df = self.change_old_header_to_new_header(data_df, assumption_key).copy()

        header = list(data_df.columns)
        _ = self.validate_header(header, assumption_key, True)

        if INCREMENTAL_INDEX in header:
            data_df[INCREMENTAL_INDEX].replace([None], 0, inplace=True)

        data_df = self.cast_name_cols_to_string(data_df, header)

        data_array = data_df.values

        project_id = scenario['project']
        active_qualifier = scenario['columns'][assumption_key]['activeQualifier']
        new_qualifier = active_qualifier != qualifier_key

        # get embedded lookup tables in project
        df_project_elt = self.get_project_embedded_lookup_tables(project_id=project_id, assumption_key=assumption_key)

        # project_model_list
        project_model_list = self.context.assumption_service.get_project_models(project_id, assumption_key)
        project_model_name_to_id = {d['name']: d['_id'] for d in project_model_list}

        # project wells IDs and inpt IDs
        project_wells_df = self.get_project_wells_df(project_id)

        # project_lookup_list
        project_lookup_list = self.context.lookup_tables_collection.find({'project': project_id}, {'name': 1})
        project_lookup_name_to_id = {d['name']: d['_id'] for d in project_lookup_list}

        esca_name_dict = self._get_escalation_name_mapping(project_id)
        depre_name_dict = self._get_depreciation_name_mapping(project_id)

        # assignments
        scenario_assignment_list = list(
            self.context.scenario_well_assignments_service.get_assignments(
                scenario_id=scenario_id,
                assumption_keys=[assumption_key],
                fetch_lookup=False,
                query_sort=False,
            ))

        inpt_id_incremental_assign_dict = {}
        for assignment in scenario_assignment_list:
            inpt_id_incremental_pair = (assignment['well_header_info']['inptID'], assignment.get('index', 0))
            inpt_id_incremental_assign_dict[inpt_id_incremental_pair] = {
                'assignment': assignment[assumption_key] if assumption_key in assignment.keys() else None,
                'well_id': assignment['well']
            }

        assign_bw_list = []
        assumption_bw_list = []

        # get col_idx
        model_type_col_idx = header.index(ColumnName.model_type.value)
        model_name_col_idx = header.index(ColumnName.model_name.value)
        incremental_index_col_idx = header.index(INCREMENTAL_INDEX)
        inpt_id_col_idx, inpt_id_list = self._get_unique_column(data_array, header, column_name=INPT_ID)

        # error buffer
        header_row = header + ['Error Message']
        df_error = pd.DataFrame(columns=header_row)

        # add error message for rows don't have inpt_id
        no_inpt_id_array = data_array[data_array[:, inpt_id_col_idx] == None, :].tolist()  # noqa flake8(E711)
        if len(no_inpt_id_array) > 0:
            for r in no_inpt_id_array:
                r.append('No INPT ID')
                df_error = pd.concat([df_error, pd.DataFrame([r], columns=df_error.columns[0:len(r)])], axis=0)

        ## process
        # assumption process
        gen_assump_name = name_generator(time_zone)

        # get rid of wells not in forecast otherwise we may end up processing way more wells that may cause issue
        if len(inpt_id_list) > SCENARIO_MAX_WELL_NUMBER:
            scenario_inpt_ids = [i[0] for i in inpt_id_incremental_assign_dict]
            inpt_id_list = [i for i in inpt_id_list if i in scenario_inpt_ids]

        for idx, inpt_id in enumerate(inpt_id_list):
            well_inc_array = data_array[data_array[:, inpt_id_col_idx] == inpt_id, :]
            well_unique_inc_idx = np.unique(well_inc_array[:, incremental_index_col_idx])

            for incremental_index in well_unique_inc_idx:
                inpt_id_incremental_pair = (inpt_id, incremental_index)
                well_array = well_inc_array[well_inc_array[:, incremental_index_col_idx] == incremental_index, :]

                if inpt_id_incremental_pair not in inpt_id_incremental_assign_dict:
                    error_list = [{'error_message': 'Well (incremental) not in scenario!', 'row_index': 0}]
                    df_error = self.write_error_log_in_df(df_error, well_array, error_list)
                    continue

                origin_assigned_id = inpt_id_incremental_assign_dict[inpt_id_incremental_pair]['assignment']
                well_id = inpt_id_incremental_assign_dict[inpt_id_incremental_pair]['well_id']

                import_model_type = clean_up_str(well_array[0, model_type_col_idx])
                if import_model_type not in [
                        MODEL_TYPE_UNIQUE, MODEL_TYPE_PROJECT, MODEL_TYPE_LOOKUP, MODEL_TYPE_NOT_ASSIGNED
                ]:
                    error_list = [{'error_message': 'Invalid model type', 'row_index': 0}]
                    df_error = self.write_error_log_in_df(df_error, well_array, error_list)
                    continue
                elif import_model_type == MODEL_TYPE_NOT_ASSIGNED:
                    continue

                import_model_name = well_array[0, model_name_col_idx]

                if import_model_type == MODEL_TYPE_LOOKUP:
                    if import_model_name in project_lookup_name_to_id:
                        import_model_id = project_lookup_name_to_id[import_model_name]

                        if new_qualifier or (import_model_id != origin_assigned_id):
                            self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id, well_id,
                                                   incremental_index, import_model_id, 'lookup')
                    else:
                        error_list = [{
                            'error_message': f'Lookup name: {import_model_name} does not exist!',
                            'row_index': 0
                        }]
                        df_error = self.write_error_log_in_df(df_error, well_array, error_list)
                else:
                    if (not all_unique) and (import_model_type == MODEL_TYPE_PROJECT):
                        # handle project model
                        if import_model_name in project_model_name_to_id:
                            import_model_id = project_model_name_to_id[import_model_name]

                            if new_qualifier or (import_model_id != origin_assigned_id):
                                self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id,
                                                       well_id, incremental_index, import_model_id, 'model')
                        else:
                            error_list = [{
                                'error_message': f'Model name: {import_model_name} does not exist!',
                                'row_index': 0
                            }]
                            df_error = self.write_error_log_in_df(df_error, well_array, error_list)
                    else:
                        # handle unique model
                        unique_econ, error_list = self.get_econ_function(
                            assumption_key,
                            well_array,
                            header,
                            esca_name_dict,
                            depre_name_dict,
                            custom_headers,
                            project_wells_df,
                            df_project_elt,
                        )

                        if len(error_list) > 0:
                            df_error = self.write_error_log_in_df(df_error, well_array, error_list)
                        else:
                            # create new unique model
                            unique_document = self.create_unique_model_document(
                                unique_econ,
                                assumption_key,
                                project_id,
                                scenario_id,
                                well_id,
                                user_id,
                                gen_assump_name,
                                custom_headers,
                            )

                            assumption_bw_list.append(InsertOne(unique_document))

                            self.update_assignment(assign_bw_list, assumption_key, qualifier_key, scenario_id, well_id,
                                                   incremental_index, unique_document['_id'])

        # write to db
        if len(assign_bw_list) > 0:
            self.context.scenario_well_assignments_service.assignment_bulk_write(assign_bw_list)
        if len(assumption_bw_list) > 0:
            self.context.assumption_service.assumption_bulk_write(assumption_bw_list)

        return df_error

    def assumption_import_with_check(
        self,
        assumption_key,
        scenario_id,
        user_id,
        file_id,
        qualifier_key,
        all_unique,
        time_zone,
        notification_id,
    ):
        upsert_query = {
            'scenarioId': scenario_id,
            'assumptionKey': assumption_key,
        }
        upsert_body = {
            'userId': user_id,
            'fileId': file_id,
            'qualifierKey': qualifier_key,
            'inc__lock': 1,
        }

        error_report_gcp_name = None

        upsert_result = self.context.cc_to_cc_service.cc_to_cc_import_upsert(upsert_query, upsert_body)
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        import_input = {
            'assumption_key': assumption_key,
            'scenario_id': scenario_id,
            'user_id': user_id,
            'qualifier_key': qualifier_key,
            'all_unique': all_unique,
            'time_zone': time_zone,
            'notification_id': notification_id,
        }

        try:
            if upsert_result.upserted_id:
                try:
                    ## load file from google cloud to pandas dataframe
                    data_df = self.load_file_to_df(file_gcp_name)

                    error_report_gcp_name = self.assumption_import(import_input, data_df)
                    if error_report_gcp_name:
                        description = f'{ASSUMP_KEY_NAME_DICT[assumption_key]} import finished with error(s)'
                    else:
                        description = f'{ASSUMP_KEY_NAME_DICT[assumption_key]} import finished without errors'
                    status = TASK_STATUS_COMPLETED
                except Exception as e:
                    description = 'Error happened during import'
                    status = TASK_STATUS_FAILED
                    raise e
                finally:
                    self.context.cc_to_cc_service.delete_cc_to_cc_import(upsert_result.upserted_id)

            else:
                description = f'Another user is importing to {ASSUMP_KEY_NAME_DICT[assumption_key]} of this scenario, please try again later'  # noqa
                status = TASK_STATUS_FAILED
                raise ImportError(description)
        finally:
            self.context.file_service.delete_file(file_gcp_name)

            notification_update = {
                'title': f'CSV Import - {ASSUMP_KEY_NAME_DICT[assumption_key]}',
                'description': description,
                'status': status,
                'extra.output': {
                    'file': {
                        'gcpName': error_report_gcp_name,
                        'name': 'error_log.csv'
                    }
                }
            }

        self.context.notification_service.update_notification_with_notifying_target(notification_id,
                                                                                    notification_update)

    def assumption_multi_import_with_check(self, user_id, notification_id, scenario_id, scenario_name, file_id,
                                           time_zone, assumptions):
        upsert_query = {'scenarioId': scenario_id}
        upsert_body = {'userId': user_id, 'fileId': file_id, 'inc__lock': 1}

        all_status = []
        description = None
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        # error file management
        run_date = datetime.datetime.utcnow().isoformat()
        error_file_name = f'cc-cc-mass-import-error--{str(scenario_id)}--{run_date}.xlsx'
        error_file_info = {
            'gcpName': error_file_name,
            'type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'name': error_file_name,
            'user': user_id
        }
        file_buffer = io.BytesIO()
        wb = Workbook()

        # query scenario
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']

        # lock all assumptions for the user
        upsert_result = []
        for item in assumptions:
            upsert_query["assumptionKey"] = item.get("assumptionKey")
            upsert_body["qualifierKey"] = item.get("qualifierKey")
            mongo_result = self.context.cc_to_cc_service.cc_to_cc_import_upsert(upsert_query, upsert_body)
            upsert_result.append({
                "result": mongo_result,
                "banned": mongo_result.upserted_id is None,
                "assumptionKey": item.get("assumptionKey")
            })

        # progress bar management
        progress_percentage = 20
        self._update_user_progress(user_id, notification_id, 20)

        try:
            if any([item.get("banned") for item in upsert_result]):
                description = 'Another user is importing to this scenario, please try again later'
                raise ImportError(description)

            all_status = []
            for idx, item in enumerate(assumptions):
                assumption_name = ASSUMP_KEY_NAME_DICT.get(item.get("assumptionKey"))
                import_input = {
                    "assumption_key": item.get("assumptionKey"),
                    "scenario_id": scenario_id,
                    "user_id": user_id,
                    "qualifier_key": item.get("qualifierKey"),
                    "all_unique": item.get("allUnique"),
                    "time_zone": time_zone,
                    "notification_id": notification_id
                }
                try:
                    ## load file from google cloud to pandas dataframe
                    data_df = self.load_file_to_df_with_sheet_name(file_gcp_name, assumption_name)

                    is_error = False
                    df_error = self.assumption_multi_import(import_input, scenario, data_df)
                    if not df_error.empty:
                        is_error = True
                        df_error.fillna('', inplace=True)
                        wb.new_sheet(assumption_name, data=[df_error.columns.tolist()] + df_error.values.tolist())
                    all_status.append({
                        "name": assumption_name,
                        "status": TASK_STATUS_COMPLETED,
                        "isError": is_error,
                    })
                except Exception:
                    all_status.append({
                        "name": assumption_name,
                        "status": TASK_STATUS_FAILED,
                        "isError": False,
                    })
                finally:
                    upsert_delete = [
                        val["result"] for val in upsert_result if val["assumptionKey"] == item["assumptionKey"]
                    ][0]
                    self.context.cc_to_cc_service.delete_cc_to_cc_import(upsert_delete.upserted_id)
                    # update progress bar
                    if idx != len(assumptions) - 1:
                        progress_percentage += 80 // len(assumptions)
                        self._update_user_progress(user_id, notification_id, progress_percentage)
                    else:
                        self._update_user_progress(user_id, notification_id, 100)
        finally:
            self.context.file_service.delete_file(file_gcp_name)

            # notifications
            if description is not None:
                note = {
                    "description": description,
                    "status": TASK_STATUS_FAILED,
                }
                self.context.notification_service.update_notification_with_notifying_target(notification_id, note)
            else:
                title = f"EXCEL Import - {', '.join([item['name'] for item in all_status])}"

                if any([item["status"] == TASK_STATUS_FAILED for item in all_status]):
                    failed_assum = ", ".join([itm["name"] for itm in all_status if itm["status"] == TASK_STATUS_FAILED])
                    note = {
                        "title": f"{title}",
                        "description": f"Error happened during import of {failed_assum}",
                        "status": TASK_STATUS_FAILED,
                    }
                else:
                    if any([item["isError"] for item in all_status]):
                        #  upload errors to cloud storage
                        wb.save(file_buffer)
                        self.context.file_service.upload_file_from_string(
                            string_data=file_buffer.getvalue(),
                            file_data=error_file_info,
                            project_id=project_id,
                        )

                        last_failed_assumption = [item for item in all_status if item["isError"]][-1]
                        note = {
                            "title": f"{title}",
                            "description": f"Error happened during import of {last_failed_assumption.get('name')}",
                            "status": TASK_STATUS_COMPLETED,
                            "extra.output": {
                                "file": {
                                    "gcpName": error_file_name,
                                    "name": "error_log.xlsx"
                                }
                            }
                        }
                    else:
                        note = {
                            "title": f"{title}",
                            "description": "All import(s) finished without error",
                            "status": TASK_STATUS_COMPLETED
                        }
                self.context.notification_service.update_notification_with_notifying_target(notification_id, note)

    def _upload_error_csv(self, gcp_name, user_id, project_id, csv_buffer):
        content_type = 'application/CSV'
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=csv_buffer.getvalue(),
            file_data=csv_file_info,
            project_id=project_id,
        )

    def get_new_model_name(self, data, old_name, assumption_key, project_id, row_idx, col_idx, error_list):
        new_model_name = str_or_none(data[row_idx, col_idx], null_response=None)
        new_model_name = new_model_name.strip() if new_model_name is not None else None

        if (new_model_name == old_name):
            return old_name, error_list

        count = self.context.assumptions_collection.count({
            'project': ObjectId(project_id),
            'assumptionKey': assumption_key,
            'name': new_model_name
        })
        if (count):
            error_list.append({
                'error_message':
                f'Model with name `{new_model_name}` and category `{assumption_key}` already exists in this project',
                'row_index': 0
            })
            new_model_name = None

        return new_model_name, error_list

    def econ_models_import(self, assumption_key, user_id, project_id, file_gcp_name):
        data_df = self.load_file_to_df(file_gcp_name)
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')

        ## add missing optional columns
        data_df = self.fill_in_optional_missing_columns(data_df, assumption_key).copy()

        # get embedded lookup tables in project
        df_project_elt = self.get_project_embedded_lookup_tables(
            project_id=ObjectId(project_id),
            assumption_key=assumption_key,
        )

        ## change old headers to new ones (for old csv files)
        data_df = self.change_old_header_to_new_header(data_df, assumption_key).copy()

        # project wells IDs and inpt IDs
        project_wells_df = self.get_project_wells_df(ObjectId(project_id))

        header = list(data_df.columns)
        if ColumnName.model_type.value not in header:
            header += ColumnName.model_type.value
        required_headers = self.validate_header(header, assumption_key)

        data_df.drop_duplicates(subset=required_headers, keep="first", inplace=True, ignore_index=True)

        data_df = self.cast_name_cols_to_string(data_df, header)

        data_array = data_df.values

        esca_name_dict = self._get_escalation_name_mapping(project_id)
        depre_name_dict = self._get_depreciation_name_mapping(project_id)

        model_name_col_idx, model_name_list = self._get_unique_column(
            data_array,
            header,
            column_name=ColumnName.model_name.value,
        )

        try:
            new_model_name_col_idx = [h.strip() for h in header].index(ColumnName.new_model_name.value)
        except ValueError:
            new_model_name_col_idx = None

        csv_buffer, csv_writer = self._get_error_csv_writer(header)
        self.has_error = self._write_empty_cells_error(data_array, model_name_col_idx, csv_writer)

        assumption_bw_list = []

        for model_name in model_name_list:
            models_rows_ocurrences = data_array[:, model_name_col_idx] == model_name
            model_array = copy.deepcopy(data_array[models_rows_ocurrences, :])
            model_econ, error_list = self.get_econ_function(
                assumption_key,
                model_array,
                header,
                esca_name_dict,
                depre_name_dict,
                custom_headers,
                project_wells_df,
                df_project_elt,
            )

            first_row_idx = np.where(models_rows_ocurrences)[0][0]
            new_model_name = None
            if (new_model_name_col_idx):
                new_model_name, error_list = self.get_new_model_name(data_array, model_name, assumption_key, project_id,
                                                                     first_row_idx, new_model_name_col_idx, error_list)

            if len(error_list) > 0:
                self.write_error_log(csv_writer, model_array, error_list)
            else:
                name = new_model_name or model_name
                doc = self._create_base_model_document(model_econ, assumption_key, name, project_id, custom_headers)

                user_object_id = ObjectId(user_id)
                doc['lastUpdatedBy'] = user_object_id
                now = datetime.datetime.utcnow()
                doc['updatedAt'] = now

                assumption_bw_list.append(
                    UpdateOne(
                        filter={
                            'project': ObjectId(project_id),
                            'assumptionKey': assumption_key,
                            'name': model_name,
                        },
                        update={
                            '$set': doc,
                            '$setOnInsert': {
                                'createdAt': now,
                                'createdBy': user_object_id
                            }
                        },
                        upsert=True,
                    ))

        if len(assumption_bw_list) > 0:
            self.context.assumption_service.assumption_bulk_write(assumption_bw_list)

        if self.has_error:
            run_date = datetime.datetime.utcnow()
            gcp_name = f'cc-cc-import-error--{assumption_key}--{run_date.isoformat()}.csv'
            file_object = self._upload_error_csv(gcp_name, user_id, project_id, csv_buffer)
            file_id = str(file_object.get('_id'))
        else:
            file_id = None

        return file_id

    def econ_models_import_with_check(self, assumption_key, user_id, project_id, file_id):
        upsert_query = {'projectId': ObjectId(project_id), 'assumptionKey': assumption_key}
        upsert_body = {
            'userId': ObjectId(user_id),
            'fileId': ObjectId(file_id),
            'inc__lock': 1,
        }
        error_report_file_id = None

        upsert_result = self.context.cc_to_cc_service.cc_to_cc_import_upsert(upsert_query, upsert_body)
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        try:
            if upsert_result.upserted_id:
                try:
                    error_report_file_id = self.econ_models_import(assumption_key, user_id, project_id, file_gcp_name)
                    if error_report_file_id:
                        description = 'Econ models import finished with error(s)'
                    else:
                        description = 'Econ models import finished successfully'
                except Exception as e:
                    description = 'Error happened during econ models import'
                    raise e
                finally:
                    self.context.cc_to_cc_service.delete_cc_to_cc_import(upsert_result.upserted_id)

            else:
                description = f'Another user is importing {ASSUMP_KEY_NAME_DICT[assumption_key]} models, please \
                     try again later'

                raise ImportError(description)
        finally:
            self.context.file_service.delete_file(file_gcp_name)

        return error_report_file_id

    def _update_user_progress(self, user_id, notification_id, progress):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    def carbon_models_import(self, user_id: str, project_id: str, file_gcp_name: str, well_id: str,
                             overwrite_models: bool) -> tuple[Optional[str], list[str]]:
        """ Prepares and imports carbon models from an Excel file uploaded to GCS. The steps are:
        * Transform the Excel file into a dictionary of pandas DataFrames
        * Check that all required sheets and all required headers on each sheet are present
        * Query assumptions collection for fluid models
        * Import valid facilities
        * Query facilities collection for valid facilities to import into networks
        * Query well collection for valid wells to import into networks
        * Import valid networks
        * Call self.carbon_import_error to append errors to the imported Excel file and upload it to GCS
        """
        # initialize import dicts
        carbon_import_dict = {}  # {Sheet Name: pd.DataFrame}
        carbon_import_errors = {key: [] for key in CARBON_IMPORT_KEYS}
        port_id_dict = {}  # {user-defined Facility Edge ID: internal UUID}
        adj_fac_name_map = {}  # {facility_name: facility_name_1}
        ## load file from google cloud to pandas dataframe for each sheet
        for key in CARBON_IMPORT_KEYS:
            sheet_name = str_to_display(key, '_')
            data_df = self.load_file_to_df_with_sheet_name(file_gcp_name, sheet_name, 'carbon')
            header = list(data_df.columns)

            optional_headers = OPTIONAL_CARBON_HEADERS.get(key, [])
            if key == WELL_GROUP_WELLS_KEY:
                optional_headers += [well_header for well_header in CARBON_WELL_HEADERS if well_header is not well_id]
            required_headers = self.validate_header(header, key, optional_headers=optional_headers)
            data_df.drop_duplicates(subset=required_headers, keep="first", inplace=True, ignore_index=True)

            # check for missing Network or Facility Name
            if key in [NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY, FACILITY_EDGES_KEY]:
                if key in [NETWORK_KEY, NETWORK_EDGES_KEY]:
                    collection_name = ColumnName.network_name.value
                    collection_new_name = ColumnName.new_network_name.value
                else:
                    collection_name = ColumnName.facility_name.value
                    collection_new_name = ColumnName.new_facility_name.value
                missing_id_df = data_df.loc[data_df[collection_name].isnull(), :]
                log_missing_field(error_list=carbon_import_errors[key], input_df=missing_id_df, field=collection_name)

                data_df[collection_name] = data_df[collection_name].apply(str_or_none, null_response=None)

                if key in [NETWORK_KEY, FACILITY_KEY]:
                    data_df[ColumnName.model_id.value] = data_df[ColumnName.model_id.value].apply(str_or_none,
                                                                                                  null_response=None)
                    if collection_new_name in data_df.columns:
                        data_df[collection_new_name] = data_df[collection_new_name].apply(str_or_none,
                                                                                          null_response=None)
            # check for missing model ids on node sheets
            else:
                if key == WELL_GROUP_WELLS_KEY:
                    model_id_key = ColumnName.well_group_id.value
                else:
                    model_id_key = ColumnName.model_id.value
                missing_id_df = data_df.loc[data_df[model_id_key].isnull(), :]
                log_missing_field(error_list=carbon_import_errors[key], input_df=missing_id_df, field=model_id_key)

                data_df[model_id_key] = data_df[model_id_key].apply(str_or_none, null_response=None)

            if key in FLUID_MODEL_NODE_KEYS:
                data_df[ColumnName.fluid_model.value] = data_df[ColumnName.fluid_model.value].apply(str_or_none,
                                                                                                    null_response=None)
            carbon_import_dict[key] = data_df
        # get fluid models
        fluid_model_df = pd.DataFrame(columns=['_id', 'name'])
        fluid_model_df = pd.concat([
            fluid_model_df,
            pd.DataFrame(
                list(
                    self.context.assumptions_collection.find(
                        {
                            'project': ObjectId(project_id),
                            'assumptionKey': 'fluid_model'
                        }, {'name': 1})))
        ])
        # check for facilities to import
        facility_df = carbon_import_dict.get(FACILITY_KEY, pd.DataFrame())
        overwritten_facility_ids = []
        if facility_df.empty:
            overwritten_facilities = facilities_w_error = set()
        else:
            (facility_bw_list, port_id_dict, facilities_w_error, adj_fac_name_map,
             overwritten_facilities) = carbon_import(carbon_import_dict=carbon_import_dict,
                                                     user_id=user_id,
                                                     project_id=project_id,
                                                     collection=FACILITY_KEY,
                                                     fluid_model_df=fluid_model_df,
                                                     carbon_import_errors=carbon_import_errors,
                                                     existing_names=set(
                                                         self.context.facilities_collection.distinct(
                                                             'name', {'project': ObjectId(project_id)})),
                                                     overwrite_models=overwrite_models)

            if len(facility_bw_list) > 0:
                self.context.carbon_service.facility_bulk_write(facility_bw_list)

        # check for networks to import
        network_df = carbon_import_dict.get(NETWORK_KEY, pd.DataFrame()).copy()
        empty_fac_df = pd.DataFrame(columns=['_id', 'name', 'inputs', 'outputs'])
        if network_df.empty:
            networks_w_error = set()
            overwritten_facility_df = pd.concat([
                empty_fac_df,
                self.context.carbon_service.get_facility_df(project_id,
                                                            list(overwritten_facilities),
                                                            projection={
                                                                'name': 1,
                                                                'inputs': 1,
                                                                'outputs': 1
                                                            })
            ])
            overwritten_facility_ids = overwritten_facility_df['_id'].apply(str).tolist()

        else:
            #check for facilities in networks
            network_df['Model ID'] = network_df['Model ID'].apply(update_facility_name, name_map=adj_fac_name_map)
            facility_names = network_df.loc[network_df['Node Type'].apply(display_to_str) == FACILITY_KEY,
                                            'Model ID'].unique()
            carbon_import_dict.update({NETWORK_KEY: network_df})
            # filter out facilities that had errors
            clean_facilities = set(facility_names) - set(facilities_w_error)
            affected_facilities = clean_facilities.union(overwritten_facilities)
            fac_in_net_df = empty_fac_df
            if len(affected_facilities) > 0:
                affected_facility_df = self.context.carbon_service.get_facility_df(project_id,
                                                                                   list(affected_facilities),
                                                                                   projection={
                                                                                       'name': 1,
                                                                                       'inputs': 1,
                                                                                       'outputs': 1
                                                                                   })
                clean_facilities_df = affected_facility_df.loc[affected_facility_df['name'].isin(clean_facilities), :]
                overwritten_facility_ids = affected_facility_df.loc[
                    affected_facility_df['name'].isin(overwritten_facilities), '_id'].apply(str).tolist()
                fac_in_net_df = pd.concat([fac_in_net_df, clean_facilities_df])

            # get wells to import
            import_wells_df = carbon_import_dict.get(WELL_GROUP_WELLS_KEY,
                                                     pd.DataFrame([get_assumption_empty_row(WELL_GROUP_WELLS_KEY)]))
            # filter to relevant columns
            well_id_display_name = getattr(ColumnName, well_id).value
            import_wells_df = import_wells_df[[ColumnName.well_group_id.value,
                                               well_id_display_name]].rename(columns={well_id_display_name: well_id})
            # check for valid entries
            valid_wells_df = import_wells_df.dropna()
            # try to cast well_id column to str dtype and rename to match field in db
            # this applies mostly for API10/12/14 that Excel might read as a float with a decimal
            try:
                valid_wells_df[well_id] = valid_wells_df[well_id].astype(float).astype(int).astype(str)
            except ValueError:
                pass
            if not valid_wells_df.empty:
                # get wells in project
                well_id_projection = {f'wells.{well_id}': 1}
                project_wells_df = self.get_project_wells_df(ObjectId(project_id), well_id_projection)
                filtered_wells_df = valid_wells_df.join(project_wells_df.set_index(well_id), on=well_id, how='inner')
            else:
                filtered_wells_df = pd.DataFrame(columns=list(valid_wells_df.columns) + ['_id'])
            missing_wells_df = import_wells_df.drop(list(filtered_wells_df.index))
            network_bw_list, _, networks_w_error, _, _ = carbon_import(
                carbon_import_dict=carbon_import_dict,
                user_id=user_id,
                project_id=project_id,
                collection=NETWORK_KEY,
                fluid_model_df=fluid_model_df,
                carbon_import_errors=carbon_import_errors,
                existing_names=set(self.context.networks_collection.distinct('name',
                                                                             {'project': ObjectId(project_id)})),
                fac_in_net_df=fac_in_net_df,
                import_wells_df=filtered_wells_df,
                missing_wells_df=missing_wells_df,
                port_id_dict=port_id_dict,
            )

            if len(network_bw_list) > 0:
                self.context.carbon_service.network_bulk_write(network_bw_list)

        # handle errors
        if len(facilities_w_error) > 0 or len(networks_w_error) > 0:
            error_file_id = self.create_carbon_error_file(carbon_import_dict, carbon_import_errors, project_id, user_id,
                                                          adj_fac_name_map)

        else:
            error_file_id = None

        return error_file_id, overwritten_facility_ids

    def create_carbon_error_file(self, carbon_import_dict: dict, carbon_import_errors: dict, project_id: str,
                                 user_id: str, adj_fac_name_map: dict) -> str:
        """ Creates error file for carbon import by merging errors for each row, appending to the dataframe and writing
        to an Excel file. The result is a file with the same content that was imported plus any error messages. The
        Excel file is loaded to GCS and the file_id is returned.
        """
        # initialize error file
        file_buffer = io.BytesIO()
        wb = Workbook()
        for model_key, model_df in carbon_import_dict.items():
            if model_key == NETWORK_KEY and adj_fac_name_map:
                # undo update to facility names so user gets same names back in error file
                rev_fac_name_map = {v: k for k, v in adj_fac_name_map.items()}
                model_df['Model ID'] = model_df['Model ID'].apply(update_facility_name, name_map=rev_fac_name_map)
            model_name = str_to_display(model_key, '_')
            # get error list for df
            error_list = carbon_import_errors[model_key]
            # merge errors for each row
            error_list_merged = []
            for row_index in set([item['row_index'] for item in error_list]):
                row_index_errors = [item for item in error_list if item['row_index'] == row_index]
                error_list_merged.append({
                    'error_message':
                    '. '.join([item['error_message'] for item in row_index_errors]),
                    'row_index':
                    row_index,
                })
            header_row = list(model_df.columns) + ['Error Message']
            df_error = pd.DataFrame(columns=header_row)
            df = self.write_error_log_in_df(df_error, model_df.values, error_list_merged)
            # convert all columns to objects so that NaN values in numeric columns are converted to None (new in pd 1.3)
            df = df.astype(object)
            df = df_replace_null_with_none(df)
            df_cols = df.shape[1]

            ws = wb.new_sheet(model_name, data=[df.columns] + df.values.tolist())
            # autofit columns
            ws.set_col_style(range(1, df_cols + 1), Style(size=-1))
        run_date = datetime.datetime.utcnow()
        error_file_name = f'cc-cc-import-error--networks--{run_date.isoformat()}.xlsx'
        wb.save(file_buffer)
        error_file_info = {
            'gcpName': error_file_name,
            'type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'name': error_file_name
        }
        file_object = self.context.file_service.upload_file_from_string(
            string_data=file_buffer.getvalue(),
            file_data=error_file_info,
            user_id=user_id,
            project_id=project_id,
        )
        error_file_id = str(file_object.get('_id'))

        return error_file_id

    def carbon_models_import_with_check(self, user_id: str, project_id: str, file_id: str, identifier: str,
                                        overwrite_models: bool) -> tuple[Optional[str], list[str]]:
        """ Checks if another user is importing carbon models by upserting a doc to the cc_to_cc collection. If the doc
        exists, it means another user is importing carbon models and an error message is returned. If the doc does not
        exist, it is created and the carbon models import is started. The doc is deleted after the import is finished.
        """
        upsert_query = {'projectId': ObjectId(project_id), 'assumptionKey': 'network'}
        upsert_body = {
            'userId': ObjectId(user_id),
            'fileId': ObjectId(file_id),
            'inc__lock': 1,
        }
        error_report_file_id = None

        upsert_result = self.context.cc_to_cc_service.cc_to_cc_import_upsert(upsert_query, upsert_body)
        file_gcp_name = self.context.file_service.get_file(file_id)['gcpName']

        try:
            if upsert_result.upserted_id:
                try:
                    error_report_file_id, overwritten_facility_ids = self.carbon_models_import(
                        user_id, project_id, file_gcp_name, identifier, overwrite_models)
                except Exception as e:
                    raise e
                finally:
                    self.context.cc_to_cc_service.delete_cc_to_cc_import(upsert_result.upserted_id)

            else:
                description = 'Another user is importing carbon models, please try again later'

                raise ImportError(description)
        finally:
            self.context.file_service.delete_file(file_gcp_name)
        return error_report_file_id, overwritten_facility_ids
