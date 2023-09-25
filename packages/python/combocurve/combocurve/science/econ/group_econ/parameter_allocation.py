import copy
import numpy as np


def allocate_fixed_expense(start_idx, end_idx, allocation_ratios, group_fixed_expenses):
    allocated_fixed_expenses = []
    for expense in group_fixed_expenses:
        allocated_fixed_expenses.append(
            recursively_create_new_params(start_idx, end_idx, allocation_ratios, expense, {}))
    return allocated_fixed_expenses


def allocate_variable_expenses(start_idx, end_idx, allocation_ratios, group_variable_expenses):
    allocated_variable_expenses = []
    for expense in group_variable_expenses:
        allocated_variable_expenses.append(
            recursively_create_new_params(start_idx, end_idx, allocation_ratios, expense, {}))
    return allocated_variable_expenses


def allocate_water_disposals(start_idx, end_idx, allocation_ratios, group_water_disposals):
    allocated_water_disposals = []
    for expense in group_water_disposals:
        allocated_water_disposals.append(
            recursively_create_new_params(start_idx, end_idx, allocation_ratios, expense, {}))
    return allocated_water_disposals


def allocate_production_tax(start_idx, end_idx, allocation_ratios, group_production_tax):
    allocated_production_tax = recursively_create_new_params(start_idx, end_idx, allocation_ratios,
                                                             group_production_tax, {})
    return allocated_production_tax


def find_one_capex_allocation_ratio(
    allocation_ratio_capex,
    allocation_ratio_idx_range,
    capex_index,
):
    if capex_index in allocation_ratio_idx_range:
        this_allocation_ratio = allocation_ratio_capex[np.where(allocation_ratio_idx_range == capex_index)[0][0]]
    elif capex_index < allocation_ratio_idx_range[0]:
        this_allocation_ratio = allocation_ratio_capex[0]
    else:
        this_allocation_ratio = allocation_ratio_capex[-1]

    return this_allocation_ratio


def allocate_capex_model(group_start_idx, group_end_idx, allocation_ratio_capex, group_capex, group_all_capex):
    allocated_capex_models = []

    allocation_ratio_index = group_capex['time'][group_start_idx:group_end_idx]

    capex_detail = group_capex['capex_detail']
    for capex in capex_detail:
        capex_date = capex['date']

        original_capex_model_list = [model for model in group_all_capex if model['date'] == capex_date]
        if len(original_capex_model_list) == 0:
            continue

        capex_index = capex['index']
        this_allocation_ratio = find_one_capex_allocation_ratio(allocation_ratio_capex, allocation_ratio_index,
                                                                capex_index)

        original_capex_model = copy.deepcopy(original_capex_model_list[0])
        # divide 1000 to revert to model unit M$ from calculation unit $
        original_capex_model['from_group'] = True
        original_capex_model['tangible'] = capex['tangible'] * this_allocation_ratio / 1000
        original_capex_model['intangible'] = capex['intangible'] * this_allocation_ratio / 1000
        original_capex_model['gross_tangible'] = capex['gross_tangible'] * this_allocation_ratio / 1000
        original_capex_model['gross_intangible'] = capex['gross_intangible'] * this_allocation_ratio / 1000
        original_capex_model['calculation'] = 'net'  # for allocation, always bring in as net
        original_capex_model['deal_terms'] = 1  # deal term already considered on group level
        allocated_capex_models.append(original_capex_model)

    return allocated_capex_models


def crop_ownership_params(start_idx, end_idx, initial_ownership_params):
    allocation_ratios = np.ones(end_idx - start_idx)
    cropped_ownership_params = recursively_create_new_params(start_idx, end_idx, allocation_ratios,
                                                             initial_ownership_params, {})
    return cropped_ownership_params


def recursively_create_new_params(start_idx, end_idx, allocation_ratios, original_dict, new_dict):
    for key, value in original_dict.items():
        if type(value) == dict:
            new_dict[key] = recursively_create_new_params(start_idx, end_idx, allocation_ratios, value, {})
        elif key in ['time']:
            new_value = value[start_idx:end_idx]  # crop without applying multipliers
            if end_idx > len(value):
                new_value = np.concatenate(
                    (new_value, np.arange(value[-1] + 1, value[-1] + end_idx - start_idx - len(new_value) + 1)))
            new_dict[key] = new_value
        elif type(value) == np.ndarray:
            new_value = np.nan_to_num(value[start_idx:end_idx] * allocation_ratios)
            if end_idx > len(value):
                new_value = np.concatenate((value[start_idx:end_idx], np.zeros(end_idx - len(value))))
            new_dict[key] = new_value
        else:
            new_dict[key] = value
    return new_dict
