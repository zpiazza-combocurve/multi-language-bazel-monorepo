from bson.objectid import ObjectId

from combocurve.services.econ.econ_and_roll_up_batch_query import econ_batch_input
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.exceptions import get_exception_info
import pandas as pd


def has_value(object, key):
    return key in object and not object[key] is None


def get_default_columns(fields):
    relevant_keys = list(filter(lambda key: 'category' in fields[key], fields.keys()))
    return list(map(lambda key: {'key': key, 'selected_options': fields[key]['default_options']}, relevant_keys))


def prepare_assignment_ids(context, scenario_id, assignment_ids):
    '''
    add base case assignment_id if only incremental case is selected
    '''
    updated_assignment_ids = [ObjectId(_id) for _id in assignment_ids]
    pipeline = [{
        '$match': {
            '_id': {
                '$in': updated_assignment_ids
            }
        }
    }, {
        '$group': {
            '_id': '$well',
            'count': {
                '$sum': 1
            },
            'selected_index': {
                '$push': '$index'
            }
        }
    }]
    incremental_info_by_well = list(context.scenario_well_assignments_collection.aggregate(pipeline))

    for item in incremental_info_by_well:
        well_id = item['_id']
        well_assigment_counts = item['count']
        well_selected_index = item['selected_index']

        if 0 not in well_selected_index and len(well_selected_index) == well_assigment_counts:
            based_case_assignment = context.scenario_well_assignments_collection.find_one(
                {
                    'scenario': ObjectId(scenario_id),
                    'well': ObjectId(well_id),
                    'index': {
                        '$exists': False
                    }
                }, {'_id': 1})
            updated_assignment_ids.append(based_case_assignment['_id'])
            item['need_base_phase'] = False
        else:
            item['need_base_phase'] = True

    incremental_info_by_well = {item['_id']: item for item in incremental_info_by_well}

    return updated_assignment_ids, incremental_info_by_well


def get_nested_inputs(econ_inputs, combos, incremental_info_by_well):
    # get well_ids
    first_combo_name = combos[0]['name']
    first_combo_well_ids = [i['well']['_id'] for i in econ_inputs if i['combo_name'] == first_combo_name]
    well_ids = list(set(first_combo_well_ids))
    well_ids.sort()

    nested_econ_inputs = {}
    for combo in combos:
        combo_name = combo['name']
        nested_econ_inputs[combo_name] = {}
        for well_id in well_ids:
            nested_econ_inputs[combo_name][well_id] = {}

    for input_ in econ_inputs:
        combo_name = input_['combo_name']
        well_id = input_['well']['_id']
        incremental_index = input_['incremental_index']
        nested_econ_inputs[combo_name][well_id][incremental_index] = input_
        if incremental_index == 0:
            nested_econ_inputs[combo_name][well_id][incremental_index]['need_base_case'] = incremental_info_by_well[
                well_id]['need_base_phase']

    return nested_econ_inputs


def run_econ_for_independent_well(
    context,
    project_id,
    scenario_id,
    independent_well_assignment_id,
    combos,
):
    error_message = None
    result = {}
    try:
        result = context.econ_service.single_well_econ({
            'project_id': project_id,
            'scenario_id': scenario_id,
            'assignment_ids': [independent_well_assignment_id],
            'combos': combos,
            'columns': None,
            'column_fields': {},
        })
    except Exception as e:
        error_message = get_exception_info(e)['message']
    return result, f'{combos[0]["name"]}: {error_message}'


def update_econ_input_for_ecl_linked_wells(
    assignment_ids,
    econ_inputs,
    context,
    project_id,
    scenario_id,
    combos,
):
    assignment_ids = populate_assignment_ids_with_econ_inputs(
        context,
        project_id,
        scenario_id,
        econ_inputs,
        assignment_ids,
    )
    wells_df = pd.DataFrame(
        columns=['wellAssignmentId', 'cutOffDate', 'linkToWellsEclWellId', 'errorMessage', 'comboName'])

    # process for cut off date
    for assignment_id, econ_input in zip(assignment_ids, econ_inputs):
        if 'link_to_wells_ecl' not in econ_input.get('assumptions', {}).get('dates', {}).get('cut_off', {}):
            continue
        combo_name = econ_input['combo_name']
        link_to_wells_ecl_well_id = econ_input['assumptions']['dates']['cut_off']['link_to_wells_ecl_well_id']
        if wells_df.loc[(wells_df.linkToWellsEclWellId == link_to_wells_ecl_well_id)
                        & (wells_df.comboName == combo_name)].empty:
            row_index = len(wells_df)
            warning_message = []
            independent_well_assignment_id, warning_message = get_independent_cutoff_date(
                context,
                project_id,
                scenario_id,
                combos,
                assignment_id,
                link_to_wells_ecl_well_id,
                inpt_id=econ_input['assumptions']['dates']['cut_off']['link_to_wells_ecl'],
                dependency_depth=1,
                warning_message=warning_message,
            )
            if warning_message:
                econ_input['assumptions']['dates']['cut_off'].update(
                    {'link_to_wells_ecl_error': ' AND '.join(warning_message)})
                continue

            wells_df.loc[row_index, ['comboName', 'linkToWellsEclWellId']] = [combo_name, link_to_wells_ecl_well_id]

            if wells_df.loc[(wells_df.wellAssignmentId == independent_well_assignment_id)
                            & (wells_df.comboName == combo_name)].empty:
                # run econ for independent well
                result, error_message = run_econ_for_independent_well(
                    context=context,
                    project_id=project_id,
                    scenario_id=scenario_id,
                    independent_well_assignment_id=independent_well_assignment_id,
                    combos=[item for item in combos if item['name'] == combo_name],
                )
                wells_df.loc[row_index, ['errorMessage', 'cutOffDate', 'wellAssignmentId']] = [
                    error_message, result.get('cut_off_date'), independent_well_assignment_id
                ]
            else:
                wells_df.loc[row_index, ['errorMessage', 'cutOffDate', 'wellAssignmentId']] = wells_df.loc[
                    (wells_df.wellAssignmentId == independent_well_assignment_id) & (wells_df.comboName == combo_name),
                    ['errorMessage', 'cutOffDate', 'wellAssignmentId']].iloc[0]

        # update date assumption for the linked well
        linked_well = wells_df.loc[(wells_df.linkToWellsEclWellId == link_to_wells_ecl_well_id)
                                   & (wells_df.comboName == combo_name)].iloc[0]
        if linked_well.cutOffDate is not None:
            econ_input['assumptions']['dates']['cut_off'].update({'date': str(linked_well.cutOffDate)})
        else:
            econ_input['assumptions']['dates']['cut_off'].update({'link_to_wells_ecl_error': linked_well.errorMessage})

    # process for fpd
    for assignment_id, econ_input in zip(assignment_ids, econ_inputs):

        default_fpd_source_hierarchy = {
            'first_fpd_source': {},
            'second_fpd_source': {},
            'third_fpd_source': {},
            'fourth_fpd_source': {},
        }
        fpd_source_hierarchy = econ_input.get('assumptions',
                                              {}).get('dates', {}).get('dates_setting',
                                                                       {}).get('fpd_source_hierarchy',
                                                                               default_fpd_source_hierarchy)
        fpd_sources = [
            fpd_source_hierarchy['first_fpd_source'],
            fpd_source_hierarchy['second_fpd_source'],
            fpd_source_hierarchy['third_fpd_source'],
            fpd_source_hierarchy['fourth_fpd_source'],
        ]
        is_fpd_sources_linked = ['link_to_wells_ecl' in fpd_source for fpd_source in fpd_sources]
        if not any(is_fpd_sources_linked):
            continue
        combo_name = econ_input['combo_name']

        mapper = {
            0: 'first_fpd_source',
            1: 'second_fpd_source',
            2: 'third_fpd_source',
            3: 'fourth_fpd_source',
        }
        linked_fpd_source = mapper[is_fpd_sources_linked.index(True)]

        link_to_wells_ecl_well_id = fpd_source_hierarchy[linked_fpd_source]['link_to_wells_ecl_well_id']

        if wells_df.loc[(wells_df.linkToWellsEclWellId == link_to_wells_ecl_well_id)
                        & (wells_df.comboName == combo_name)].empty:
            row_index = len(wells_df)
            warning_message = []
            independent_well_assignment_id, warning_message = get_independent_cutoff_date(
                context,
                project_id,
                scenario_id,
                combos,
                assignment_id,
                link_to_wells_ecl_well_id,
                inpt_id=fpd_source_hierarchy[linked_fpd_source]['link_to_wells_ecl'],
                dependency_depth=1,
                warning_message=warning_message,
            )
            if warning_message:
                fpd_source_hierarchy[linked_fpd_source].update(
                    {'link_to_wells_ecl_error': ' AND '.join(warning_message)})
                continue

            wells_df.loc[row_index, ['comboName', 'linkToWellsEclWellId']] = [combo_name, link_to_wells_ecl_well_id]

            if wells_df.loc[(wells_df.wellAssignmentId == independent_well_assignment_id)
                            & (wells_df.comboName == combo_name)].empty:
                # run econ for independent well
                result, error_message = run_econ_for_independent_well(
                    context=context,
                    project_id=project_id,
                    scenario_id=scenario_id,
                    independent_well_assignment_id=independent_well_assignment_id,
                    combos=[item for item in combos if item['name'] == combo_name],
                )
                wells_df.loc[row_index, ['errorMessage', 'cutOffDate', 'wellAssignmentId']] = [
                    error_message, result.get('cut_off_date'), independent_well_assignment_id
                ]
            else:
                wells_df.loc[row_index, ['errorMessage', 'cutOffDate', 'wellAssignmentId']] = wells_df.loc[
                    (wells_df.wellAssignmentId == independent_well_assignment_id) & (wells_df.comboName == combo_name),
                    ['errorMessage', 'cutOffDate', 'wellAssignmentId']].iloc[0]

        # update date assumption for the linked well
        linked_well = wells_df.loc[(wells_df.linkToWellsEclWellId == link_to_wells_ecl_well_id)
                                   & (wells_df.comboName == combo_name)].iloc[0]

        for key in ['link_to_wells_ecl', 'link_to_wells_ecl_well_id']:
            fpd_source_hierarchy[linked_fpd_source].pop(key, None)

        if linked_well.cutOffDate is not None:
            fpd_source_hierarchy[linked_fpd_source].update({'link_to_wells_ecl': str(linked_well.cutOffDate)})
        else:
            fpd_source_hierarchy[linked_fpd_source].update({'link_to_wells_ecl_error': linked_well.errorMessage})

    return econ_inputs


def get_independent_cutoff_date(
    context,
    project_id,
    scenario_id,
    combos,
    assignment_id,
    independent_well_id,
    inpt_id,
    dependency_depth=1,
    max_dependency_depth=5,
    warning_message=[],
):

    # check max dependency
    if dependency_depth > max_dependency_depth:
        warning_message.append(f'dependency depth is higher than the max ({max_dependency_depth})')
        return None, warning_message

    # independent well assignment_id
    filters = {'project': ObjectId(project_id), 'scenario': ObjectId(scenario_id), 'well': independent_well_id}
    independent_wells_df = pd.DataFrame(context.scenario_well_assignments_collection.find(filters, {'_id', 'index'}))

    if independent_wells_df.empty:
        warning_message.append(f'INPT ID ({inpt_id}) is not in the scenario wells')
        return None, warning_message

    # check circular dependency
    if not independent_wells_df.loc[independent_wells_df['_id'] == assignment_id].empty:
        warning_message.append(f'circular dependency found (INPT ID = {inpt_id})')
        return None, warning_message

    # get parent well assignment id
    if 'index' not in independent_wells_df.columns:
        independent_wells_df['index'] = None
    if independent_wells_df.loc[independent_wells_df['index'].isnull(), '_id'].empty:
        warning_message.append(f'base well for INPT ID = {inpt_id} not found')
        return None, warning_message
    independent_well_assignment_id = independent_wells_df.loc[independent_wells_df['index'].isnull(), '_id'].values[0]

    # get `dates` assumption for independent well
    dates_id = context.scenario_well_assignments_service.get_assignments_with_combos(
        assignment_ids=[independent_well_assignment_id],
        project_id=project_id,
        assumption_keys=['dates'],
        combos=combos,
    )[0][0]['dates']

    filters = {'project': ObjectId(project_id), 'assumptionKey': 'dates', '_id': dates_id}
    dates_assumption = list(context.assumptions_collection.find(filters, {'econ_function'}))[0]

    # check if the `dates` is independent
    if 'link_to_wells_ecl' in dates_assumption['econ_function']['cut_off']:
        independent_well_assignment_id, warning_message = get_independent_cutoff_date(
            context,
            project_id,
            scenario_id,
            combos,
            assignment_id,
            dates_assumption['econ_function']['cut_off']['link_to_wells_ecl_well_id'],
            inpt_id=dates_assumption['econ_function']['cut_off']['link_to_wells_ecl'],
            dependency_depth=dependency_depth + 1,
            warning_message=warning_message)
    return independent_well_assignment_id, warning_message


def populate_assignment_ids_with_econ_inputs(context, project_id, scenario_id, econ_inputs, assignment_ids):
    well_ids = [econ_input['well']['_id'] for econ_input in econ_inputs]
    df_well_info = pd.DataFrame(
        list(
            context.scenario_well_assignments_collection.find(
                {
                    'project': ObjectId(project_id),
                    'scenario': ObjectId(scenario_id),
                    '_id': {
                        '$in': assignment_ids,
                    },
                    'well': {
                        '$in': well_ids
                    }
                }, {
                    '_id': 1,
                    'well': 1
                })))
    updated_assignment_ids = []
    for econ_input in econ_inputs:
        well_id = econ_input['well']['_id']
        updated_assignment_ids.append(df_well_info.loc[df_well_info.well == well_id, '_id'].iloc[0])
    return updated_assignment_ids


def get_econ_batch_input(context, scenario_id, assignment_ids, combos, columns, column_fields, ghg_id, project_id=None):
    updated_assignment_ids, incremental_info_by_well = prepare_assignment_ids(context, scenario_id, assignment_ids)

    econ_inputs = econ_batch_input(context, ObjectId(scenario_id), updated_assignment_ids,
                                   [*ASSUMPTION_FIELDS, 'schedule', 'network'], combos, ghg_id, project_id)

    # check for dependent cut off dates models
    econ_inputs = update_econ_input_for_ecl_linked_wells(
        updated_assignment_ids,
        econ_inputs,
        context,
        project_id,
        scenario_id,
        combos,
    )

    # column_fields will be None when is_ghg
    if column_fields:
        columns = columns if columns and len(columns) else get_default_columns(column_fields)
    for one_input in econ_inputs:
        one_input['columns_fields'] = column_fields
        one_input['columns'] = columns

    nested_econ_inputs = get_nested_inputs(econ_inputs, combos, incremental_info_by_well)

    return nested_econ_inputs


def get_single_well_econ_input(context, scenario_id, project_id, assignment_ids, combos, columns, column_fields):
    updated_assignment_ids, _ = prepare_assignment_ids(context, scenario_id, assignment_ids)

    econ_inputs = econ_batch_input(context, ObjectId(scenario_id), updated_assignment_ids,
                                   [*ASSUMPTION_FIELDS, 'schedule', 'network'], combos, None, project_id)

    # check for dependent cut off dates models
    econ_inputs = update_econ_input_for_ecl_linked_wells(
        updated_assignment_ids,
        econ_inputs,
        context,
        project_id,
        scenario_id,
        combos,
    )

    for econ_input in econ_inputs:
        econ_input['columns_fields'] = column_fields
        econ_input['columns'] = columns if columns and len(columns) else get_default_columns(column_fields)

    return econ_inputs
