import copy
import pandas as pd
from combocurve.services.scenario_well_assignments_service import fetch_lookup_table

GROUP_ASSUMPTIONS = ['dates', 'ownership_reversion', 'expenses', 'capex', 'production_taxes']

DEFAULT_COMBO_NAME = 'default'
COMBOS = [{
    'name': DEFAULT_COMBO_NAME,
}]

# currently group assignment are all under `default` qualifier
QUALIFIER_PROJECTION = {assumption_key: {'default': 1} for assumption_key in GROUP_ASSUMPTIONS}


def get_assignment_ids_by_group(econ_groups_collection, scenario_oid):
    econ_groups_query_projection = {
        **QUALIFIER_PROJECTION,
        'well': 1,
        'properties': 1,
        'assignments': 1,
        'name': 1,
    }

    econ_groups = list(econ_groups_collection.find({'scenario': scenario_oid}, econ_groups_query_projection))
    assignment_ids_by_group = {}
    for econ_group in econ_groups:
        assignment_ids_by_group[econ_group['name']] = econ_group['assignments']
    return assignment_ids_by_group, econ_groups


def get_group_assignments_with_combo(group_assignments, lookup_table_service):
    for assignment in group_assignments:
        assignment['well_header_info'] = assignment['well']  # in order to reuse fetch_lookup_table
        assignment['group'] = assignment['_id']
        assignment['well'] = assignment['_id']  # in order to reuse by well query logic

    group_assignments = fetch_lookup_table(lookup_table_service, group_assignments)

    group_assignments_with_combo = []
    for group in group_assignments:
        # TODO: change to use actual combo when combo implemented for group case
        for combo in COMBOS:
            group_combo_input = {
                'group_id': group['group'],
                'econ_group': group['name'],
                'well': group['well_header_info'],
                'properties': group['properties'],
                'assignments': group['assignments'],
                'combo_name': combo['name'],
            }

            for field in GROUP_ASSUMPTIONS:
                # TODO: change to use actual qualifier from combo when combo implemented for group case
                group_combo_input[field] = group[field].get('default')

            group_assignments_with_combo.append(group_combo_input)

    return group_assignments_with_combo


def group_econ_query(context, scenario_oid, econ_groups):
    general_options = context.scenario_page_query_service.get_general_options(scenario_oid)

    # query econ groups from db
    group_assignments_with_combo = get_group_assignments_with_combo(econ_groups, context.lookup_table_service)

    assignment_df = pd.DataFrame(group_assignments_with_combo).fillna('not_valid')

    # query used assumptions from db
    sort_econ_function, assumption_selection_idx = context.scenario_page_query_service.get_sort_econ_function(
        assignment_df, GROUP_ASSUMPTIONS)

    # put assumption details into each group
    group_settings_list = []
    for i, assignment in enumerate(group_assignments_with_combo):
        # fill in assumptions
        assumptions = {} if general_options is None else {'general_options': general_options}

        for name in assumption_selection_idx.columns:
            idx = assumption_selection_idx[name].iloc[i]
            if idx >= 0:
                assumptions[name] = copy.deepcopy(sort_econ_function[idx])

        one_group = {
            key: assignment[key]
            for key in ['group_id', 'econ_group', 'well', 'properties', 'assignments', 'combo_name']
        }
        one_group['well']['_id'] = assignment['group_id']
        one_group['assumptions'] = assumptions
        group_settings_list.append(one_group)

    # embedded lookup
    context.embedded_lookup_table_service.fill_in_embedded_lookup(group_settings_list)
    context.scenario_page_query_service.fill_in_elu_escalation_and_depreciation(group_settings_list)

    # reformat group_settings_list to nested dict
    group_settings = {}
    for g in group_settings_list:
        econ_group = g['econ_group']
        if econ_group not in group_settings:
            group_settings[econ_group] = {}
        group_settings[econ_group][g['combo_name']] = g

    return group_settings
