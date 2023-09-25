import logging
from typing import Optional

from bson import ObjectId

from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.services.feature_flags.feature_flags_service import evaluate_boolean_flag, LaunchDarklyContext, \
    ContextType
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.logging import add_to_logging_metadata
from combocurve.science.econ.general_functions import get_assumption
from combocurve.science.econ.post_process import PostProcess
from combocurve.science.econ.get_nested_econ_result import get_nested_output
from combocurve.services.econ.econ_result_aggregation import get_one_well_grouped_sum_df
from combocurve.services.econ.econ_input_batch import get_econ_batch_input, get_single_well_econ_input
from combocurve.services.econ.econ_input_tc import get_econ_input_tc
from combocurve.services.econ.csv_export import generate_default_csv_export_settings
from combocurve.services.econ.econ_output_fields import (ECON_PRMS_RESOURCES_CLASS, ECON_PRMS_RESERVES_CATEGORY,
                                                         ECON_PRMS_RESERVES_SUB_CATEGORY, PRMS_RESOURCES_CLASS,
                                                         PRMS_RESERVES_CATEGORY, PRMS_RESERVES_SUB_CATEGORY)
from combocurve.science.econ.well import economics, ghg, group_economics_individual_well
from combocurve.services.econ_v10.input import econ_inputs

UNGROUPED = 'ungrouped'


def combo_batch_econ(run, params, combo_econ_inputs, combo_inc_inputs, feature_flags: Optional[dict[str, bool]] = None):
    batch_index = params['batch_index']
    batch_size = run['batchSize']
    output_params = run['outputParams']
    is_fiscal_month = output_params.get("prodAnalyticsType", 'calendar') == 'daysOn'

    combo_outputs = []

    index = 0
    for well_input in combo_econ_inputs:
        reserves_category = get_assumption(well_input['assumptions'], 'reserves_category')['reserves_category']
        base_ret = {
            'well': well_input['well'],
            'well_index': get_well_index(batch_index, batch_size, index),
            'incremental_name': '',
            'incremental_index': 0,
            'reserves_category': {
                ECON_PRMS_RESOURCES_CLASS: reserves_category[PRMS_RESOURCES_CLASS],
                ECON_PRMS_RESERVES_CATEGORY: reserves_category[PRMS_RESERVES_CATEGORY],
                ECON_PRMS_RESERVES_SUB_CATEGORY: reserves_category[PRMS_RESERVES_SUB_CATEGORY]
            }
        }

        try:
            if params['is_ghg']:
                emission_nodes = ghg(well_input)
                ret = {
                    **base_ret,
                    'emission_nodes': emission_nodes,
                }
            else:
                (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras, warning_message,
                 _, _) = economics(well_input, 0, None, is_fiscal_month, feature_flags=feature_flags)
                ret = {
                    **base_ret,
                    'flat_output': selected_flat_output,
                    'one_liner': one_liner,
                    # these two are all columns that need to be written to bq
                    'all_flat_output': all_flat_output,
                    'all_one_liner': all_one_liner,
                    'nested_output_paras': nested_output_paras,
                    'warning': warning_message,
                    'econ_group': UNGROUPED,
                }

            combo_outputs.append(ret)

        except Exception as e:
            calculation_error = get_exception_info(e)
            col_number = None

            if params['is_ghg']:
                add_to_logging_metadata({'ghg_run': params, 'error': e})

            else:
                columns = well_input['columns']
                general_options = output_params['generalOptions']
                col_number = PostProcess.get_col_number(columns, general_options)

                if not calculation_error['expected']:
                    logging.error('econ batch calculation error', extra={'metadata': calculation_error})

            combo_outputs.append({
                **base_ret,
                'error': calculation_error,
                'col_number': col_number,
            })

        index += 1

    for base_input, inc_input in combo_inc_inputs:
        reserves_category = get_assumption(inc_input['assumptions'], 'reserves_category')['reserves_category']
        incremental_name = get_incremental_name(inc_input['well']['well_name'], 1)
        base_ret = {
            'well': inc_input['well'],
            'well_index': get_well_index(batch_index, batch_size, index),
            'incremental_name': incremental_name,
            'incremental_index': 1,
            'reserves_category': {
                ECON_PRMS_RESOURCES_CLASS: reserves_category[PRMS_RESOURCES_CLASS],
                ECON_PRMS_RESERVES_CATEGORY: reserves_category[PRMS_RESERVES_CATEGORY],
                ECON_PRMS_RESERVES_SUB_CATEGORY: reserves_category[PRMS_RESERVES_SUB_CATEGORY]
            }
        }
        (_, _, _, _, _, _, base_case_flat_log, _) = economics(base_input,
                                                              0,
                                                              None,
                                                              is_fiscal_month,
                                                              feature_flags=feature_flags)
        (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras, warning_message, _,
         _) = economics(inc_input, 1, base_case_flat_log, is_fiscal_month, feature_flags=feature_flags)
        ret = {
            **base_ret,
            'flat_output': selected_flat_output,
            'one_liner': one_liner,
            # these two are all columns that need to be written to bq
            'all_flat_output': all_flat_output,
            'all_one_liner': all_one_liner,
            'nested_output_paras': nested_output_paras,
            'warning': warning_message,
            'econ_group': UNGROUPED,
        }
        combo_outputs.append(ret)
        index += 1

    return combo_outputs


class EconCalculationError(Exception):
    expected = True


def get_well_index(batch_index, batch_size, index):
    return batch_index * batch_size + index + 1


def get_group_name(well_assignment_id, assignment_ids_by_group):
    for econ_group, group_assignment_ids in assignment_ids_by_group.items():
        if well_assignment_id in group_assignment_ids:
            return econ_group
    return UNGROUPED


def get_incremental_name(well_name, incremental_index):
    return well_name if incremental_index == 0 else well_name + f' inc{incremental_index}'


def _check_comp_econ_flag_enabled(organization_name) -> bool:
    """A wrapper for checking if compositional economics feature flag is enabled for an organization"""
    if not organization_name:
        return False
    context = LaunchDarklyContext(context_name=organization_name, context_type=ContextType.organization)
    return evaluate_boolean_flag(EnabledFeatureFlags.roll_out_compositional_economics, context)


class EconService(object):
    def __init__(self, context):
        self.context = context

    def get_run(self, run_id):
        return self.context.econ_runs_collection.find_one({'_id': ObjectId(run_id)})

    def batch_outputs_when_query_error(self, batch_index, batch_size, assignment_ids, output_params, error):
        batch_outputs = []
        query_error = get_exception_info(error)

        if not query_error['expected']:
            logging.error('econ batch query error', extra={'metadata': query_error})

        pipeline = [{
            '$match': {
                '_id': {
                    '$in': [ObjectId(_id) for _id in assignment_ids]
                }
            }
        }, {
            '$lookup': {
                'from': 'wells',
                'localField': 'well',
                'foreignField': '_id',
                'as': 'well'
            }
        }, {
            '$unwind': '$well'
        }, {
            '$sort': {
                'well._id': 1,
                'index': 1
            }
        }]

        assignments = list(self.context.scenario_well_assignments_collection.aggregate(pipeline))

        combos = output_params['combos']
        columns = output_params['columns']
        general_options = output_params['generalOptions']
        col_number = PostProcess.get_col_number(columns, general_options)

        for combo in combos:
            combo_outputs = []
            for index, assignment in enumerate(assignments):
                incremental_index = assignment.get('index', 0)
                well_header = assignment['well']

                if well_header.get('well_name'):
                    incremental_name = get_incremental_name(well_header['well_name'], incremental_index)
                else:
                    incremental_name = None

                combo_outputs.append({
                    'well': well_header,
                    'well_index': get_well_index(batch_index, batch_size, index),
                    'incremental_name': incremental_name,
                    'incremental_index': incremental_index,
                    'error': query_error,
                    'col_number': col_number,
                    'reserves_category': {
                        ECON_PRMS_RESOURCES_CLASS: '',
                        ECON_PRMS_RESERVES_CATEGORY: '',
                        ECON_PRMS_RESERVES_SUB_CATEGORY: ''
                    },
                })

            combo_batch_outputs = {'combo': combo, 'outputs': combo_outputs}
            batch_outputs.append(combo_batch_outputs)

        return batch_outputs

    def batch_econ(self, run, params):
        assignment_ids = params['assignment_ids']
        # TODO: drop assignment id from params
        return self.batch_econ_on_ids(assignment_ids, run, params)

    def batch_econ_on_ids(self, assignment_ids, run, params):

        batch_index = params['batch_index']
        ghg_id = params.get('ghg_run_id')

        batch_size = run['batchSize']
        scenario_id = str(run['scenario'])
        project_id = str(run['project'])
        output_params = run['outputParams']

        combos = output_params['combos']

        # Db name should match org name, so we can use it to check if comp econ is enabled for that org
        feature_flags = {
            EnabledFeatureFlags.roll_out_compositional_economics:
            _check_comp_econ_flag_enabled(self.context.tenant_info.get('db_name'))
        }

        # column settings are not needed when is ghg, pass in as empty objects
        columns = output_params.get('columns', [])
        column_fields = output_params.get('columnFields', {})

        try:
            inputs_by_combo, inc_inputs_by_combo = econ_inputs(self.context, scenario_id, assignment_ids, combos,
                                                               columns, column_fields, ghg_id, project_id)
        except Exception as e:
            batch_outputs = self.batch_outputs_when_query_error(batch_index, batch_size, assignment_ids, output_params,
                                                                e)
            return batch_outputs

        batch_outputs = []

        for combo in combos:
            combo_name = combo['name']

            combo_econ_inputs = inputs_by_combo[combo_name]
            combo_inc_inputs = inc_inputs_by_combo[combo_name]

            combo_outputs = combo_batch_econ(run, params, combo_econ_inputs, combo_inc_inputs, feature_flags)

            batch_outputs.append({'combo': combo, 'outputs': combo_outputs})

        return batch_outputs

    def group_econ_on_ids_individual(self, assignment_ids, run, params, assignment_ids_by_group):
        batch_index = params['batch_index']

        batch_size = run['batchSize']
        scenario_id = str(run['scenario'])
        project_id = str(run['project'])
        output_params = run['outputParams']

        is_fiscal_month = output_params.get("prodAnalyticsType", 'calendar') == 'daysOn'

        combos = output_params['combos']

        # column settings are not needed when is ghg, pass in as None
        columns = output_params.get('columns')
        column_fields = output_params.get('columnFields')

        try:
            nested_econ_inputs = get_econ_batch_input(self.context, scenario_id, assignment_ids, combos, columns,
                                                      column_fields, None, project_id)
        except Exception as e:
            batch_outputs = self.batch_outputs_when_query_error(batch_index, batch_size, assignment_ids, output_params,
                                                                e)
            return batch_outputs

        batch_outputs = []

        for combo in combos:
            combo_name = combo['name']

            combo_econ_inputs = nested_econ_inputs[combo_name]
            combo_outputs = []

            index = 0
            for well_inputs in combo_econ_inputs.values():
                base_case_flat_log = None
                for incremental_index, input_ in well_inputs.items():
                    if input_['well'].get('well_name'):
                        incremental_name = get_incremental_name(input_['well']['well_name'], incremental_index)
                    else:
                        incremental_name = None

                    reserves_category = get_assumption(input_['assumptions'], 'reserves_category')['reserves_category']

                    base_ret = {
                        'well': input_['well'],
                        'well_index': get_well_index(batch_index, batch_size, index),
                        'incremental_name': incremental_name,
                        'incremental_index': incremental_index,
                        'reserves_category': {
                            ECON_PRMS_RESOURCES_CLASS: reserves_category[PRMS_RESOURCES_CLASS],
                            ECON_PRMS_RESERVES_CATEGORY: reserves_category[PRMS_RESERVES_CATEGORY],
                            ECON_PRMS_RESERVES_SUB_CATEGORY: reserves_category[PRMS_RESERVES_SUB_CATEGORY]
                        }
                    }

                    econ_group = get_group_name(input_['assignment_id'], assignment_ids_by_group)

                    try:
                        if not input_['need_base_case'] or incremental_index > 0:  # skip incremental case for now
                            continue

                        (
                            original_cutoff_info,
                            original_well_result_params,
                            all_flat_output,
                            well_input,
                            t_all,
                            one_liner_well_count,
                        ) = group_economics_individual_well(
                            input_,
                            incremental_index,
                            base_case_flat_log,
                            is_fiscal_month,
                        )

                        ret = {
                            **base_ret,
                            'well_input': well_input,
                            'original_well_result_params': original_well_result_params,
                            'original_cutoff_info': original_cutoff_info,
                            'all_flat_output': all_flat_output,
                            't_all': t_all,
                            'one_liner_well_count': one_liner_well_count,
                            'warning': None,
                            'econ_group': econ_group,
                            'assignment_id': input_['assignment_id'],  # used to filter selected assignments
                        }

                        combo_outputs.append(ret)

                    except Exception as e:
                        calculation_error = get_exception_info(e)
                        col_number = None

                        columns = input_['columns']
                        general_options = output_params['generalOptions']
                        col_number = PostProcess.get_col_number(columns, general_options)

                        if not calculation_error['expected']:
                            logging.error('econ batch calculation error', extra={'metadata': calculation_error})

                        combo_outputs.append({
                            **base_ret,
                            'error': calculation_error,
                            'col_number': col_number,
                        })

                    index += 1

            combo_batch_outputs = {'combo': combo, 'outputs': combo_outputs}
            batch_outputs.append(combo_batch_outputs)

        return batch_outputs

    def write_one_liner_to_db(self, run, batch_outputs):

        run_oid = run['_id']
        scenario_oid = run['scenario']
        project_oid = run['project']
        user_oid = run['user']

        datas = []
        for combo_batch_outputs in batch_outputs:
            outputs = combo_batch_outputs['outputs']
            combo = combo_batch_outputs['combo']
            combo_name = combo['name']

            for each in outputs:
                error = each.get('error')
                well_header = each['well']

                data = {
                    'reservesCategory': each['reserves_category'],
                    'incrementalIndex': each['incremental_index'],
                    'project': project_oid,
                    'run': run_oid,
                    'scenario': scenario_oid,
                    'user': user_oid,
                    'comboName': combo_name,
                }

                if well_header.get('group_id') is not None:
                    data['well'] = None
                    data['group'] = ObjectId(well_header['group_id'])
                else:
                    data['well'] = ObjectId(well_header['_id'])
                    data['group'] = None

                if error:
                    data['error'] = error
                    data['oneLinerData'] = None
                else:
                    data['oneLinerData'] = each['one_liner']

                datas.append(data)

        self.context.econ_runs_datas_collection.insert_many(datas)

    def get_run_data(self, run):
        output_params = run['outputParams']
        return {
            'run_date': run['runDate'],
            'run_id': str(run['_id']),
            'project_id': str(run['project']),
            'user_id': str(run['user']),
            'scenario_id': str(run['scenario']),
            'project_name': output_params['projectName'],
            'scenario_name': output_params['scenarioName'],
            'user_name': output_params['userName'],
            'general_options_name': output_params['generalOptionsName']
        }

    def get_local_df(self, run, batch_outputs):
        '''
            return local df for aggregation
            used in sync econ run
        '''
        run_data = self.get_run_data(run)
        well_header_df = self.context.econ_output_service.get_well_header_df(batch_outputs, run_data)
        monthly_df = self.context.econ_output_service.get_monthly_df(batch_outputs, run_data)
        metadata_df = self.context.econ_output_service.get_metadata_df(run_data)
        return monthly_df, well_header_df, metadata_df

    def write_batch_files_to_cloud(self, run, params, batch_outputs):
        '''
            write econ results to cloud storage
            used in batch(async) econ run
        '''
        run_data = self.get_run_data(run)
        batch_index = params['batch_index']
        self.context.econ_output_service.write_econ_files(batch_outputs, batch_index, run_data)

    def upload_results_to_table(self, run, batch_outputs):
        '''
            write econ results to big Query table with stream insert
            used in sync econ run
        '''
        run_data = self.get_run_data(run)
        self.context.econ_output_service.write_well_header_to_table(batch_outputs, run_data)
        self.context.econ_output_service.write_one_liner_to_table(batch_outputs, run_data)
        self.context.econ_output_service.write_monthly_to_table(batch_outputs, run_data)

    def process_and_upload_group_batch_outputs(self, run, group_batch_outputs):

        run_data = self.get_run_data(run)

        monthly_pldf, header_pldf, one_liner_pldf, metadata_pldf = self.context.econ_output_service.get_group_dfs(
            group_batch_outputs, run_data)

        # output to bigquery
        self.context.econ_output_service.write_group_econ_files(0, run_data, monthly_pldf, header_pldf, one_liner_pldf)
        self.write_econ_metadata(run)

        drop_cols = ['run_date_right', 'created_at_right']

        # TODO: check if really need to join metadata table
        ungrouped_pldf = monthly_pldf.join(metadata_pldf, on=['run_id'], how='left')
        ungrouped_pldf = ungrouped_pldf.drop(drop_cols)  # drop_in_place can only take 1 column as input

        ungrouped_pldf = ungrouped_pldf.join(header_pldf, on=['run_id', 'well_id'], how='left')
        ungrouped_pldf = ungrouped_pldf.drop(drop_cols)

        return ungrouped_pldf

    def write_econ_metadata(self, run):
        run_data = self.get_run_data(run)
        self.context.econ_output_service.write_metadata(run_data)

    def update_output_groups_db(self, run_id, output_groups):
        update = {'$set': {'status': 'complete', 'outputGroups': output_groups}}
        self.context.econ_runs_collection.update_one({'_id': run_id}, update)

    def upload_group_aggregation(self, run, aggregated_df, display_df):

        run_id = run['_id']
        run_date = run['runDate']
        self.context.econ_output_service.write_aggregation_result_to_table(aggregated_df, run_id, run_date, False)
        combos_res_cat_groups = self.context.econ_file_service.generate_one_well_grouped_sum(run, display_df)
        output_groups = next(iter(combos_res_cat_groups.values()))
        return output_groups

    def clean_up(self, run, aggregate, batch_outputs=None):
        run_id = run['_id']
        run_id_str = str(run_id)
        run_date = run['runDate']
        num_wells = len(run['scenarioWellAssignments'])

        # write meta data
        self.write_econ_metadata(run)
        output_groups = None

        # generate the results locally and write the results to aggregation table
        if aggregate and num_wells == 1 and batch_outputs is not None:
            monthly_df, well_header_df, metadata_df = self.get_local_df(run, batch_outputs)
            group_result_df = get_one_well_grouped_sum_df(monthly_df, well_header_df, metadata_df)
            # upload the result to aggregation table
            self.context.econ_output_service.write_aggregation_result_to_table(group_result_df, run_id, run_date)
            # get the output groups by combo
            combos_res_cat_groups = self.context.econ_file_service.generate_one_well_grouped_sum(run, group_result_df)
            output_groups = next(iter(combos_res_cat_groups.values()))

        elif aggregate:
            # aggregate results in bigquery and query from aggregation table
            combos_res_cat_groups = self.context.econ_file_service.generate_grouped_sum(run_id_str)
            output_groups = next(iter(combos_res_cat_groups.values()))

        self.update_output_groups_db(run_id, output_groups)

    def type_curve_econ(self, params):
        econ_input = get_econ_input_tc(self.context, params)

        # Db name should match org name, so we can use it to check if comp econ is enabled for that org
        feature_flags = {
            EnabledFeatureFlags.roll_out_compositional_economics:
            _check_comp_econ_flag_enabled(self.context.tenant_info.get('db_name'))
        }

        selected_flat_output, _, one_liner, _, nested_output_paras, _, _, _ = economics(econ_input,
                                                                                        0,
                                                                                        None,
                                                                                        feature_flags=feature_flags)
        nested_output = get_nested_output(selected_flat_output, nested_output_paras)
        return {'nested_output': nested_output, 'one_liner': one_liner}

    def single_well_econ(self, params):
        scenario_id = params['scenario_id']
        project_id = params['project_id']
        assignment_ids = params['assignment_ids']
        combos = params['combos']
        columns = params['columns']
        column_fields = params['column_fields']
        # Db name should match org name, so we can use it to check if comp econ is enabled for that org
        feature_flags = {
            EnabledFeatureFlags.roll_out_compositional_economics:
            _check_comp_econ_flag_enabled(self.context.tenant_info.get('db_name'))
        }

        econ_inputs = get_single_well_econ_input(self.context, scenario_id, project_id, assignment_ids, combos, columns,
                                                 column_fields)

        base_case_input = [i for i in econ_inputs if i['incremental_index'] == 0][0]

        if len(econ_inputs) > 1:  # base case
            inc_case_input = [i for i in econ_inputs if i['incremental_index'] != 0][0]
            try:
                _, _, _, _, _, _, base_case_flat_econ_log, _ = economics(base_case_input,
                                                                         0,
                                                                         None,
                                                                         feature_flags=feature_flags)
            except Exception:
                raise EconCalculationError('Base well errors out, run econ on base well for detailed information')

            selected_flat_output, _, one_liner, _, nested_output_paras, _, _, cut_off_date = economics(
                inc_case_input, 1, base_case_flat_econ_log, feature_flags=feature_flags)
        else:
            selected_flat_output, _, one_liner, _, nested_output_paras, _, _, cut_off_date = economics(
                base_case_input, 0, None, feature_flags=feature_flags)

        nested_output = get_nested_output(selected_flat_output, nested_output_paras)

        return {'output': nested_output, 'one_liner': one_liner, 'cut_off_date': cut_off_date}

    def default_csv_export_settings(self, params):
        run_id = params['run_id']
        scenario_table_headers = params['wellHeaders']
        run = self.get_run(run_id)

        settings = generate_default_csv_export_settings(self.context, run, scenario_table_headers)

        return settings
