import numpy as np
import pickle
from combocurve.science.econ.econ_output.well_output import WellOutput
from combocurve.science.econ.econ_calculations.well_result import econ_result_for_group_case
from combocurve.science.econ.group_econ.group_econ_query import DEFAULT_COMBO_NAME
from combocurve.science.econ.group_econ.group_econ_defaults import get_allocation_bool

GROUP_CASE_INPUT_KEY = 'group_well_input_dict_for_group_case'
GROUP_CASE_RESULT_KEY = 'group_well_result_dict_for_group_case'

GROUP_RESULT_NEEDED_KEYS = ['expense', 'capex', 'production_tax', 'bfit_cf', 'bfit_disc', 'well_count']

GROUP_RES_CAT = {
    'econ_prms_resources_class': 'reserves',
    'econ_prms_reserves_category': 'proved',
    'econ_prms_reserves_sub_category': 'producing'
}


def recursively_create_empty_result_dict(original_dict, new_dict, group_date_list, group_time_list):
    for key, value in original_dict.items():
        if key == 'date':
            new_dict[key] = group_date_list
        elif key == 'time':
            new_dict[key] = group_time_list
        elif type(value) == dict:
            new_dict[key] = recursively_create_empty_result_dict(value, {}, group_date_list, group_time_list)
        elif type(value) == list:
            if value == []:
                new_dict[key] = []
            else:
                if type(value[0]) in [int, float]:
                    new_dict[key] = [0] * len(group_date_list)
                elif type(value[0]) == dict:
                    new_dict[key] = [
                        recursively_create_empty_result_dict(v, {}, group_date_list, group_time_list) for v in value
                    ]
                else:
                    new_dict[key] = value
        elif type(value) == np.ndarray:
            # zero out everything
            new_dict[key] = np.zeros(len(group_date_list)) if value.dtype in [np.int64, np.float64] else np.array(
                [None] * len(group_date_list))
        elif type(value) in [float, int]:
            new_dict[key] = 0
        else:
            new_dict[key] = value
    return new_dict


def recursively_create_group_input_dict(original_dict, group_dict, new_dict):
    for key, value in original_dict.items():
        if key in group_dict:
            if type(value) == dict and 'model' not in key:
                new_dict[key] = recursively_create_group_input_dict(value, group_dict[key], {})
            else:
                new_dict[key] = group_dict[key]
        else:
            new_dict[key] = original_dict[key]
    return new_dict


def update_group_result(empty_group_dict, group_dict, combo_group_setting):
    # add well count to result, not in pickle
    empty_group_dict['well_count'] = group_dict['well_count']

    if get_allocation_bool(combo_group_setting.get('properties', {})):
        # if allocate, group case is empty
        return empty_group_dict

    ret = {k: empty_group_dict[k] for k in empty_group_dict if k not in GROUP_RESULT_NEEDED_KEYS}
    ret.update({k: group_dict[k] for k in GROUP_RESULT_NEEDED_KEYS})
    # group case not calculating carbon expense for now
    ret['expense']['ghg_expense'] = empty_group_dict['expense']['ghg_expense']
    ret['expense']['total']['ghg_expense'] = empty_group_dict['expense']['total']['ghg_expense']
    return ret


def group_output_template(combo_group_setting, group_output):
    group_well_overwrite = {
        'group_id': combo_group_setting['group_id'],
        '_id': combo_group_setting['group_id'],  # needed for write to biquery
    }
    group_well = combo_group_setting['well']
    group_well.update(group_well_overwrite)
    return {
        'well': group_well,
        'well_index': 1,
        'econ_group': combo_group_setting['econ_group'],
        'incremental_name': '',
        'incremental_index': 0,
        'is_group_case': True,
        'reserves_category': GROUP_RES_CAT,
        **group_output
    }


def create_group_case(group_settings, result_by_combo_by_group: list):
    all_combo_group_outputs = []
    for combo_group in result_by_combo_by_group.values():
        # combo_group has result for the same combo, get the combo info from the first group
        combo_group_outputs = {'combo': list(combo_group.values())[0]['combo'], 'outputs': []}

        filehandler = open('combocurve/science/econ/group_econ/group_result_template.pickle', 'rb')
        well_result_template = pickle.load(filehandler)
        filehandler.close()

        for econ_group, group_result in combo_group.items():
            if econ_group == 'ungrouped':
                continue

            combo_group_setting = group_settings[econ_group][DEFAULT_COMBO_NAME]  # always use default combo for now
            if 'error' in group_result:
                combo_group_outputs['outputs'].append(
                    group_output_template(combo_group_setting, {'error': group_result['error']}))
                continue

            group_well_input_dict = group_result[GROUP_CASE_INPUT_KEY]

            group_well_result_dict = group_result[GROUP_CASE_RESULT_KEY]
            group_econ_result_dict = econ_result_for_group_case(group_well_result_dict)
            empty_group_econ_result_dict = recursively_create_empty_result_dict(well_result_template, {},
                                                                                group_econ_result_dict['date'],
                                                                                group_econ_result_dict['time'])
            final_group_econ_result_dict = update_group_result(empty_group_econ_result_dict, group_econ_result_dict,
                                                               combo_group_setting)

            well_output = WellOutput(group_well_input_dict, final_group_econ_result_dict,
                                     group_well_input_dict['date_dict'])
            (
                selected_flat_output,
                all_flat_output,
                one_liner,
                all_one_liner,
                nested_output_paras,
                _,
            ) = well_output.full_econ_output(
                breakeven_dict={},
                breakeven_unit_dict={},
                incremental_index=0,
                base_case_flat_log={},
                is_fiscal_month=False,
                apply_unit=True,
                add_group_econ_cols=False,
                is_group_case=True,
            )
            group_output = {
                'flat_output': selected_flat_output,
                'one_liner': one_liner,
                'all_flat_output': all_flat_output,
                'all_one_liner': all_one_liner,
                'nested_output_paras': nested_output_paras,
                'warning': None,
            }
            combo_group_outputs['outputs'].append(group_output_template(combo_group_setting, group_output))
        all_combo_group_outputs.append(combo_group_outputs)
    return all_combo_group_outputs
