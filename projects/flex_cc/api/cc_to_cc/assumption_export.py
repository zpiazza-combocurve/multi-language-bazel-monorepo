from bson import ObjectId
import io
import csv
import datetime
import pandas as pd
from zipfile import ZipFile, ZIP_DEFLATED
from pyexcelerate import Workbook, Style
from copy import deepcopy

from api.cc_to_cc.ownership_reversion import ownership_model_export
from api.cc_to_cc.reserves_category import reserves_category_export
from api.cc_to_cc.expenses import expenses_export
from api.cc_to_cc.capex import capex_export, prob_capex_export
from api.cc_to_cc.stream_properties import stream_properties_export
from api.cc_to_cc.dates import dates_export
from api.cc_to_cc.pricing import pricing_export
from api.cc_to_cc.differentials import differentials_export
from api.cc_to_cc.production_taxes import production_taxes
from api.cc_to_cc.risking import risking_export
from api.cc_to_cc.escalation import escalation_export
from api.cc_to_cc.carbon.carbon_export import carbon_export
from api.cc_to_cc.helper import str_to_display, insert_new_name_col
from api.cc_to_cc.fluid_model import fluid_model_export
from api.cc_to_cc.emission import emission_export

from api.cc_to_cc.file_headers import (FIXED_HEADER, ASSUMP_HEADER, MODEL_TYPE_LOOKUP, MODEL_TYPE_NOT_ASSIGNED,
                                       PRICING_KEY, DIFFERENTIALS_KEY, PROD_TAX_KEY, RISKING_KEY, ESCALATION_KEY,
                                       CAPEX_KEY, EXPENSES_KEY, FLUID_MODEL_KEY, EMISSION_KEY, ColumnName,
                                       ProbCapexFields, EMPTY_CARBON_EXPORT_DICT, CARBON_WELL_HEADERS,
                                       get_assumption_empty_row)

from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.shared.np_helpers import get_well_order_by_names
from combocurve.shared.date import py_date_change_time_zone, py_date_to_str_with_time_zone

EXPORT_FUNC_DICT = {
    'ownership_reversion': ownership_model_export,
    'reserves_category': reserves_category_export,
    'expenses': expenses_export,
    ColumnName.capex.name: capex_export,
    'stream_properties': stream_properties_export,
    'dates': dates_export,
    PRICING_KEY: pricing_export,
    DIFFERENTIALS_KEY: differentials_export,
    PROD_TAX_KEY: production_taxes,
    RISKING_KEY: risking_export,
    ESCALATION_KEY: escalation_export,
    FLUID_MODEL_KEY: fluid_model_export,
    EMISSION_KEY: emission_export,
}

MAX_SHEET_ROWS = 1000000


class ExportError(Exception):
    expected = True


def df_replace_null_with_none(df):
    '''
    to make null values (None, np.nan) be consistent with None
    '''
    return df.where(pd.notnull(df), None)


class AssumptionExport(object):
    # assumption export
    def __init__(self, context):
        self.context = context

    def get_incremental_name(self, assign):
        well_name = assign['well_header_info'].get('well_name', '')
        incremental_index = assign.get('index', 0)
        if incremental_index == 0:
            return well_name
        else:
            return f'{well_name} inc{incremental_index}'

    def timestamp(self, dt, timezone='UTC'):
        date = str(dt.date())
        time = str(dt.time())[0:8]
        return f'{date} {time} {timezone}'

    def process_well_head_value(self, well_head_value):
        if isinstance(well_head_value, datetime.datetime):
            return well_head_value.date().strftime('%m/%d/%Y')
        if isinstance(well_head_value, ObjectId):
            return str(well_head_value)
        else:
            return well_head_value

    def _escalation_id_to_name(self, project_id):
        escalation_model_list = self.context.assumption_service.get_escalation_models(project_id)
        return {str(d['_id']): d['name'] for d in escalation_model_list}

    def _depreciation_id_to_name(self, project_id):
        depreciation_model_list = self.context.assumption_service.get_depreciation_models(project_id)
        return {str(d['_id']): d['name'] for d in depreciation_model_list}

    def assumption_and_lookup_query(self, well_assignment_list, assumption_key):
        assump_assignments = [
            assign[assumption_key] for assign in well_assignment_list if assumption_key in assign.keys()
        ]

        assump_ids = [a['model'] for a in assump_assignments if 'model' in a]
        assump_list = self.context.assumption_service.get_assumptions_batch(
            list(set([ObjectId(_id) for _id in assump_ids])))
        assump_dict = {d['_id']: d for d in assump_list}

        lookup_ids = [a['lookup'] for a in assump_assignments if 'lookup' in a]
        lookup_list = self.context.lookup_tables_collection.find(
            {'_id': {
                '$in': [ObjectId(_id) for _id in lookup_ids]
            }}, {'name': 1})
        lookup_dict = {d['_id']: d for d in lookup_list}

        return assump_dict, lookup_dict

    def get_common_dict(self, well_info, used_header_name, special_header_dict, well_header_map_rev):
        common_dict = {}

        for name in used_header_name:
            if name in special_header_dict:
                common_dict[name] = special_header_dict[name]
            else:
                well_header_key = well_header_map_rev[name]
                value = well_info.get(well_header_key)
                common_dict[name] = self.process_well_head_value(value)

        return common_dict

    def get_one_model_rows(
        self,
        assign,
        assumption_key,
        assump_dict,
        lookup_dict,
        include_default,
        common_dict,
        esca_id_to_name,
        depre_id_to_name,
        custom_headers,
        df_project_elt,
    ):

        if assumption_key in assign:
            col_assign = assign[assumption_key]
            if 'model' in col_assign and col_assign['model'] and ObjectId(col_assign['model']) in assump_dict:
                assump_detail = assump_dict[ObjectId(col_assign['model'])]
                if assumption_key in [PRICING_KEY, DIFFERENTIALS_KEY, PROD_TAX_KEY]:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, esca_id_to_name, include_default)
                elif assumption_key == CAPEX_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](
                        assump_detail,
                        esca_id_to_name,
                        depre_id_to_name,
                        df_project_elt,
                        custom_headers,
                    )
                elif assumption_key == EXPENSES_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](
                        assump_detail,
                        esca_id_to_name,
                        df_project_elt,
                        include_default,
                    )

                elif assumption_key in ['stream_properties']:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, include_default)
                elif assumption_key == EMISSION_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, esca_id_to_name)
                else:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail)

                return [{**common_dict, **row} for row in assump_flat_list]
            elif 'lookup' in col_assign and col_assign['lookup'] and ObjectId(col_assign['lookup']) in lookup_dict:
                look_up_name = lookup_dict[ObjectId(col_assign['lookup'])]['name']
                return ([{
                    **common_dict,
                    ColumnName.model_type.value: MODEL_TYPE_LOOKUP,
                    ColumnName.model_name.value: look_up_name,
                }])

            else:
                return ([{**common_dict, ColumnName.model_type.value: MODEL_TYPE_NOT_ASSIGNED}])

        else:
            return ([{**common_dict, ColumnName.model_type.value: MODEL_TYPE_NOT_ASSIGNED}])

    def get_prob_capex_rows(
        self,
        assign,
        assumption_key,
        assump_dict,
        lookup_dict,
        common_dict,
        trials,
    ):
        no_assigned_dict = {
            **common_dict,
            ColumnName.model_type.value: MODEL_TYPE_NOT_ASSIGNED,
            ProbCapexFields.prob_capex.value: False,
        }

        if assumption_key in assign:
            col_assign = assign[assumption_key]
            if 'model' in col_assign and col_assign['model'] and ObjectId(col_assign['model']) in assump_dict:
                assump_detail = assump_dict[ObjectId(col_assign['model'])]
                assump_flat_list = prob_capex_export(assump_detail, trials)

                return [{**common_dict, **row} for row in assump_flat_list]
            elif 'lookup' in col_assign and col_assign['lookup'] and ObjectId(col_assign['lookup']) in lookup_dict:
                look_up_name = lookup_dict[ObjectId(col_assign['lookup'])]['name']
                return ([{
                    **common_dict,
                    ColumnName.model_type.value: MODEL_TYPE_LOOKUP,
                    ColumnName.model_name.value: look_up_name,
                    ProbCapexFields.prob_capex.value: False,
                }])

            else:
                return [no_assigned_dict]

        else:
            return [no_assigned_dict]

    def upload_file_buffer(self, buffer, gcp_name, content_type, user_id, project_id):
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': gcp_name, 'user': user_id}

        return self.context.file_service.upload_file_from_string(
            string_data=buffer.getvalue(),
            file_data=csv_file_info,
            user_id=user_id,
            project_id=project_id,
        )

    def get_project_embedded_lookup_tables(self, project_id: ObjectId, assumption_key: str):
        if assumption_key in [CAPEX_KEY, EXPENSES_KEY]:
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

    def assumption_export(
        self,
        assumption_key,
        scenario_id,
        table_headers,
        header_fields,
        user_id,
        assignment_ids,
        include_default,
        notification_id,
    ):
        # query
        well_assignment_list = self.context.scenario_well_assignments_service.get_assignments(
            scenario_id,
            assignment_ids=assignment_ids,
            assumption_keys=[assumption_key],
            fetch_lookup=False,
            query_sort=False,
        )
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')

        assump_dict, lookup_dict = self.assumption_and_lookup_query(well_assignment_list, assumption_key)

        self._update_user_progress(user_id, notification_id, 20)

        # csv buffer
        well_header_map_rev = {v: k for k, v in header_fields.items()}
        selected_header_name = [header_fields[k] for k in table_headers if header_fields[k] not in FIXED_HEADER]
        used_header_name = FIXED_HEADER + selected_header_name
        header_row = used_header_name + ASSUMP_HEADER[assumption_key]

        csv_buffer = io.StringIO()
        csv_writer = csv.DictWriter(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, fieldnames=header_row)
        csv_writer.writeheader()

        run_date = datetime.datetime.utcnow()
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']
        project = self.context.project_collection.find_one({'_id': project_id})
        qualifier_key = scenario['columns'][assumption_key]['activeQualifier']
        qualifier_name = scenario['columns'][assumption_key]['qualifiers'][qualifier_key]['name']

        special_header_dict = {
            'Created At': self.timestamp(run_date),
            'Project Name': project['name'],
            'Scenario Name': scenario['name'],
            'Qualifier Name': qualifier_name,
        }

        # embedded lookup tables
        df_project_elt = self.get_project_embedded_lookup_tables(
            project_id=project_id,
            assumption_key=assumption_key,
        )

        # sort well by name
        well_names = [self.get_incremental_name(assign) for assign in well_assignment_list]
        well_order_list = get_well_order_by_names(well_names)

        # syntax conversion
        all_rows = []

        esca_id_to_name = self._escalation_id_to_name(project_id)
        depre_id_to_name = self._depreciation_id_to_name(project_id)

        ## syntax conversion
        assign_len = len(well_assignment_list)
        for index, well_order in enumerate(well_order_list, start=1):
            assign = well_assignment_list[well_order]
            well_info = assign['well_header_info']

            special_header_dict['Index'] = index
            special_header_dict['Incremental Index'] = assign.get('index', 0)

            common_dict = self.get_common_dict(well_info, used_header_name, special_header_dict, well_header_map_rev)

            all_rows += self.get_one_model_rows(
                assign,
                assumption_key,
                assump_dict,
                lookup_dict,
                include_default,
                common_dict,
                esca_id_to_name,
                depre_id_to_name,
                custom_headers,
                df_project_elt,
            )

            # update progress bar
            update_freq = max(round(assign_len / 5), 1)
            if index % update_freq == 0:
                well_prog = 20 + round(74 * index / assign_len)
                self._update_user_progress(user_id, notification_id, well_prog)

        # write all rows buffer
        csv_writer.writerows(all_rows)

        #  upload to cloud storage
        gcp_name = f'cc-cc-export--{str(scenario_id)}--{assumption_key}--{run_date.isoformat()}.csv'
        content_type = 'application/CSV'
        self.upload_file_buffer(csv_buffer, gcp_name, content_type, user_id, project_id)

        self._update_user_progress(user_id, notification_id, 99)

        return gcp_name

    def assumption_multi_export(
        self,
        scenario_id,
        table_headers,
        header_fields,
        columns,
        file_type,
        user_id,
        assignment_ids,
        notification_id,
    ):
        well_assignment_list = self.context.scenario_well_assignments_service.get_assignments(
            scenario_id,
            assignment_ids=assignment_ids,
            assumption_keys=[c['assumptionKey'] for c in columns],
            fetch_lookup=False,
            query_sort=False,
        )
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')

        # well headers
        well_header_map_rev = {v: k for k, v in header_fields.items()}
        selected_header_name = [header_fields[k] for k in table_headers if header_fields[k] not in FIXED_HEADER]
        used_header_name = FIXED_HEADER + selected_header_name

        self._update_user_progress(user_id, notification_id, 10)

        run_date = datetime.datetime.utcnow()
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']
        project = self.context.project_collection.find_one({'_id': project_id})

        special_header_dict = {
            'Created At': self.timestamp(run_date),
            'Project Name': project['name'],
            'Scenario Name': scenario['name'],
        }

        # sort well by name
        well_names = [self.get_incremental_name(assign) for assign in well_assignment_list]
        well_order_list = get_well_order_by_names(well_names)

        file_buffer = io.BytesIO()

        if file_type == 'excel':
            file_extension = 'xlsx'
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            wb = Workbook()
        else:
            # zip of csv
            file_extension = 'zip'
            content_type = 'application/zip'
            open_file = ZipFile(file_buffer, mode="w", compression=ZIP_DEFLATED)

        esca_id_to_name = self._escalation_id_to_name(project_id)
        depre_id_to_name = self._depreciation_id_to_name(project_id)

        for col_index, col in enumerate(columns):
            assumption_key = col.get('assumptionKey')
            include_default = col.get('includeDefault')

            qualifier_key = scenario['columns'][assumption_key]['activeQualifier']
            qualifier_name = scenario['columns'][assumption_key]['qualifiers'][qualifier_key]['name']
            special_header_dict['Qualifier Name'] = qualifier_name

            # query
            assump_dict, lookup_dict = self.assumption_and_lookup_query(well_assignment_list, assumption_key)

            # embedded lookup tables
            df_project_elt = self.get_project_embedded_lookup_tables(
                project_id=project_id,
                assumption_key=assumption_key,
            )

            # syntax conversion
            all_rows = []
            for index, well_order in enumerate(well_order_list, start=1):
                assign = well_assignment_list[well_order]
                well_info = assign['well_header_info']

                special_header_dict['Index'] = index
                special_header_dict['Incremental Index'] = assign.get('index', 0)

                common_dict = self.get_common_dict(well_info, used_header_name, special_header_dict,
                                                   well_header_map_rev)

                all_rows += self.get_one_model_rows(
                    assign,
                    assumption_key,
                    assump_dict,
                    lookup_dict,
                    include_default,
                    common_dict,
                    esca_id_to_name,
                    depre_id_to_name,
                    custom_headers,
                    df_project_elt,
                )

            assumption_name = col.get('assumptionName')

            header_row = used_header_name + ASSUMP_HEADER[assumption_key]
            if file_type == 'excel':
                df = df_replace_null_with_none(pd.DataFrame(all_rows, dtype='object'))

                df_rows = df.shape[0]
                if df_rows > MAX_SHEET_ROWS:
                    raise ExportError(
                        f'{assumption_name} has {df_rows} rows, larger than maximum {MAX_SHEET_ROWS}, try with less wells'  # noqa E501
                    )

                wb.new_sheet(assumption_name, data=[header_row] + df.values.tolist())
            else:
                # zip of csv
                csv_buffer = io.StringIO()
                csv_writer = csv.DictWriter(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, fieldnames=header_row)
                csv_writer.writeheader()
                csv_writer.writerows(all_rows)
                open_file.writestr(f'{assumption_name}.csv', csv_buffer.getvalue())

            # update progress
            col_progress = 10 + round(84 * (col_index + 1) / len(columns))
            self._update_user_progress(user_id, notification_id, col_progress)

        if file_type == 'excel':
            # save the excel file will take a long time
            wb.save(file_buffer)
        else:
            # zip of csv
            open_file.close()

        #  upload to cloud storage
        gcp_name = f'cc-cc-export--{str(scenario_id)}--assumptions--{run_date.isoformat()}.{file_extension}'
        self.upload_file_buffer(file_buffer, gcp_name, content_type, user_id, project_id)
        self._update_user_progress(user_id, notification_id, 99)
        return gcp_name

    def econ_models_export(self, assumptions, user_id, project_id):
        custom_headers = self.context.custom_fields_service.get_custom_fields('wells')
        run_date = datetime.datetime.utcnow()
        project = self.context.project_collection.find_one({'_id': ObjectId(project_id)})
        special_header_dict = {
            'Created At': self.timestamp(run_date),
            'Project Name': project['name'],
        }
        extra_headers = ['Index'] + list(special_header_dict.keys())

        esca_id_to_name = self._escalation_id_to_name(project_id)
        depre_id_to_name = self._depreciation_id_to_name(project_id)

        zip_csv_dict = {}
        for assumption in assumptions:
            assumption_key = assumption.get('assumptionKey')
            include_default = assumption.get('includeDefault')
            assumption_name = assumption.get('assumptionName')

            # embedded lookup tables
            df_project_elt = self.get_project_embedded_lookup_tables(
                project_id=ObjectId(project_id),
                assumption_key=assumption_key,
            )

            assump_list = list(
                self.context.assumptions_collection.find({
                    'assumptionKey': assumption_key,
                    'project': ObjectId(project_id),
                    'unique': False
                }))

            assump_dict = {d['_id']: d for d in assump_list}

            header_row = extra_headers + ASSUMP_HEADER[assumption_key]
            model_name_index = header_row.index(ColumnName.model_name.value)
            header_row.insert(model_name_index + 1, ColumnName.new_model_name.value)
            csv_buffer = io.StringIO()
            csv_writer = csv.DictWriter(csv_buffer, quoting=csv.QUOTE_NONNUMERIC, fieldnames=header_row)
            csv_writer.writeheader()

            assumption_index = 1
            for assump_detail in assump_dict.values():
                common_dict = {}

                for name in extra_headers:
                    if name == 'Index':
                        common_dict[name] = assumption_index
                    elif name in ['Project Name', 'Scenario Name', 'Qualifier Name', 'Created At']:
                        common_dict[name] = special_header_dict[name]

                if assumption_key in [PRICING_KEY, DIFFERENTIALS_KEY, PROD_TAX_KEY]:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, esca_id_to_name, include_default)
                elif assumption_key == EXPENSES_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](
                        assump_detail,
                        esca_id_to_name,
                        df_project_elt,
                        include_default,
                    )
                elif assumption_key == CAPEX_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](
                        assump_detail,
                        esca_id_to_name,
                        depre_id_to_name,
                        df_project_elt,
                        custom_headers,
                    )

                elif assumption_key in ['stream_properties']:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, include_default)
                elif assumption_key == EMISSION_KEY:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail, esca_id_to_name)
                else:
                    assump_flat_list = EXPORT_FUNC_DICT[assumption_key](assump_detail)

                if assump_flat_list:
                    for row in assump_flat_list:
                        model = {**common_dict, **row}
                        csv_writer.writerow(model)
                    assumption_index += 1

            zip_csv_dict[assumption_key] = {'csv_buffer': csv_buffer, 'assumption_name': assumption_name}

        zip_buffer = io.BytesIO()
        with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            for key in zip_csv_dict:
                csv_buffer = zip_csv_dict[key]['csv_buffer']
                assumption_name = zip_csv_dict[key]['assumption_name']
                zf.writestr(f'{assumption_name}.csv', csv_buffer.getvalue())

        gcp_name = f'cc-cc-export-econ-models--{run_date.isoformat()}.zip'
        content_type = 'application/zip'
        file_object = self.upload_file_buffer(zip_buffer, gcp_name, content_type, user_id, project_id)

        return str(file_object.get('_id'))

    def _update_user_progress(self, user_id, notification_id, progress):
        self.context.pusher.trigger_user_channel(self.context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    def generate_prob_inputs(
        self,
        user_id,
        scenario_id,
        notification_id,
        trials,
        file_type,
        assignment_ids,
        header_fields,
        time_zone,
    ):
        assumption_key = 'capex'  # only for capex for now
        assumption_name = assumption_key.upper()

        # query
        well_assignment_list = self.context.scenario_well_assignments_service.get_assignments(
            scenario_id,
            assignment_ids=assignment_ids,
            assumption_keys=[assumption_key],
            fetch_lookup=False,
            query_sort=False,
        )

        assump_dict, lookup_dict = self.assumption_and_lookup_query(well_assignment_list, assumption_key)

        self._update_user_progress(user_id, notification_id, 20)

        # csv buffer
        well_header_map_rev = {v: k for k, v in header_fields.items()}
        well_header_map_rev['Well ID'] = '_id'
        used_header_name = [
            'Well ID',
            'API 14',
            'Chosen ID',
            'Well Name',
            'Incremental Index',
            'Well Number',
            #
            'Project Name',
            'Scenario Name',
            'Qualifier Name',
            'Created At',
        ]

        header_row = used_header_name + [
            ColumnName.model_type.value, ColumnName.model_name.value, ProbCapexFields.prob_capex.value,
            ColumnName.category.value, ProbCapexFields.trial_number.value, ProbCapexFields.value_m_dollar.value,
            ProbCapexFields.seed.value, ProbCapexFields.error_message.value
        ]

        run_date = datetime.datetime.utcnow()
        scenario = self.context.scenario_service.get_scenario(ObjectId(scenario_id))
        project_id = scenario['project']
        project = self.context.project_collection.find_one({'_id': project_id})
        qualifier_key = scenario['columns'][assumption_key]['activeQualifier']
        qualifier_name = scenario['columns'][assumption_key]['qualifiers'][qualifier_key]['name']

        special_header_dict = {
            'Created At': py_date_to_str_with_time_zone(py_date_change_time_zone(run_date, time_zone)),
            'Project Name': project['name'],
            'Scenario Name': scenario['name'],
            'Qualifier Name': qualifier_name,
        }

        # sort well by name
        well_names = [self.get_incremental_name(assign) for assign in well_assignment_list]
        well_order_list = get_well_order_by_names(well_names)

        # syntax conversion
        all_rows = []

        ## syntax conversion
        assign_len = len(well_assignment_list)
        for index, well_order in enumerate(well_order_list, start=1):
            assign = well_assignment_list[well_order]
            well_info = assign['well_header_info']

            special_header_dict['Incremental Index'] = assign.get('index', 0)

            common_dict = self.get_common_dict(well_info, used_header_name, special_header_dict, well_header_map_rev)

            all_rows += self.get_prob_capex_rows(
                assign,
                assumption_key,
                assump_dict,
                lookup_dict,
                common_dict,
                trials,
            )

            # update progress bar
            update_freq = max(round(assign_len / 5), 1)
            if index % update_freq == 0:
                well_prog = 20 + round(74 * index / assign_len)
                self._update_user_progress(user_id, notification_id, well_prog)

        if file_type == 'excel':
            file_buffer = io.BytesIO()
            file_extension = 'xlsx'
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            wb = Workbook()
            df = df_replace_null_with_none(pd.DataFrame(all_rows, dtype='object'))

            df_rows = df.shape[0]
            if df_rows > MAX_SHEET_ROWS:
                raise ExportError(
                    f'{assumption_name} has {df_rows} rows, larger than maximum {MAX_SHEET_ROWS}, try with less wells')

            wb.new_sheet(assumption_name, data=[header_row] + df.values.tolist())
            wb.save(file_buffer)
        else:
            # csv
            file_buffer = io.StringIO()
            file_extension = 'csv'
            content_type = 'application/CSV'
            csv_writer = csv.DictWriter(file_buffer, quoting=csv.QUOTE_NONNUMERIC, fieldnames=header_row)
            csv_writer.writeheader()
            csv_writer.writerows(all_rows)

        #  upload to cloud storage
        gcp_name = f'generate-probabilistic-inputs--{str(scenario_id)}--{assumption_key}--{run_date.isoformat()}.{file_extension}'  # noqa E501
        self.upload_file_buffer(file_buffer, gcp_name, content_type, user_id, project_id)

        self._update_user_progress(user_id, notification_id, 99)

        return gcp_name

    def carbon_models_export(self, network_ids: list, user_id: str, project_id: str) -> str:
        """ Exports carbon models for given networks to Excel file and uploads it to cloud storage.
        """
        # start from empty export dict
        carbon_export_dict = deepcopy(EMPTY_CARBON_EXPORT_DICT)
        run_date = datetime.datetime.utcnow()
        project = self.context.project_collection.find_one({'_id': ObjectId(project_id)}, {'name': True})
        networks = self.context.carbon_service.get_networks_list([ObjectId(_id) for _id in network_ids])
        facility_set = set()
        well_set = set()
        for network in networks:
            wells = network['wells']
            well_set.update(wells)
        # get map of well headers for wells in networks
        projection = {header: True for header in CARBON_WELL_HEADERS}
        well_list = list(
            self.context.wells_collection.find({'_id': {
                '$in': [ObjectId(_id) for _id in well_set]
            }}, projection))
        wells_map = {v['_id']: v for v in well_list}

        # TODO: Add extra headers to export (project name, created at, created by, new name)
        # special_header_dict = {
        #     'Project Name': project['name'],
        # }

        file_buffer = io.BytesIO()
        file_extension = 'xlsx'
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        wb = Workbook()

        for network_idx, network in enumerate(networks):
            # call carbon_export function
            carbon_export_dict, facility_set = carbon_export(network, carbon_export_dict, wells_map, facility_set)

            # TODO: update progress?
            # network_progress = 10 + round(84 * (network_idx + 1) / len(networks))
            # self._update_user_progress(user_id, notification_id, network_progress)

        for model_key, model_rows in carbon_export_dict.items():
            sheet_name = str_to_display(model_key, '_')
            project_name = project['name']
            if not model_rows:
                # include unused models so user has a template for importing
                model_rows = [get_assumption_empty_row(model_key)]
                project_name = ''
            df = df_replace_null_with_none(pd.DataFrame(model_rows, dtype='object'))
            df.insert(0, 'Project Name', project_name)
            insert_new_name_col(df, model_key)
            df_rows = df.shape[0]
            df_cols = df.shape[1]
            if df_rows > MAX_SHEET_ROWS:
                raise ExportError(
                    f'{sheet_name} has {df_rows} rows, larger than maximum {MAX_SHEET_ROWS}, try with fewer networks')

            ws = wb.new_sheet(sheet_name, data=[df.columns] + df.values.tolist())
            # autofit columns
            ws.set_col_style(range(1, df_cols + 1), Style(size=-1))
        # save the excel file will take a long time
        wb.save(file_buffer)

        #  upload to cloud storage
        gcp_name = f'cc-cc-export--{str(project_id)}--networks--{run_date.isoformat()}.{file_extension}'
        file_object = self.upload_file_buffer(file_buffer, gcp_name, content_type, user_id, project_id)
        # self._update_user_progress(user_id, notification_id, 99)
        return str(file_object.get('_id'))
