import copy
import numpy as np
from typing import Callable
from datetime import datetime, date

from combocurve.science.econ.group_econ.parameter_allocation import (allocate_fixed_expense, allocate_production_tax,
                                                                     allocate_variable_expenses,
                                                                     allocate_water_disposals, allocate_capex_model)
from combocurve.science.econ.group_econ.group_econ_query import DEFAULT_COMBO_NAME
from combocurve.science.econ.group_econ.group_econ_defaults import (GROUP_INDEPENDENT, CANNOT_EXCEED_GROUP,
                                                                    MUST_BE_GROUP, get_group_properties,
                                                                    get_allocation_info, get_allocation_method,
                                                                    get_one_group_setting, get_group_ecl_option)
from combocurve.science.econ.group_econ.general_functions import ECON_GROUP, filter_group_df, cut_group_df

ALLOCATION_RESULT_KEY = 'group_well_result_dict_for_allocation'
ZERO_GROUP_WELL_COUNT = {
    'gross_well_count': 0,
    'wi_well_count': 0,
    'nri_well_count': 0,
}


def find_cropping_indices(well_date_list, group_date_list, cutoff_date):
    '''
    group_end_idx is used for crop array, which need to cutoff index + 1
    well_date_list and group_date_list are both list with date strings

    crop group_date_list to the range from start of well_date_list to cutoff_date
    the corresponding crop index for well are (0, group_end_idx - group_start_idx)
    '''
    # group_date_list empty if all wells are unecon
    if not len(group_date_list):
        return 0, 1

    start_date = datetime.fromisoformat(well_date_list[0]).date()
    group_start_date = datetime.fromisoformat(group_date_list[0]).date()

    # well cutoff date can't beyond well's last date
    cutoff_date = min(cutoff_date, datetime.fromisoformat(well_date_list[-1]).date())

    if start_date == cutoff_date or start_date < group_start_date:
        '''
        start_date < group_start_date can happen when well is unecon but it has CF prior to as of date
        '''
        return 0, 1  # unecon case

    group_date_list = np.array([datetime.fromisoformat(d).date() for d in group_date_list])

    group_start_idx = np.where(group_date_list == start_date)[0][0]
    if cutoff_date.year == group_date_list[-1].year and cutoff_date.month == group_date_list[-1].month:
        # cutoff date is last day of last month
        group_end_idx = len(group_date_list)
        return group_start_idx, group_end_idx

    # find first day of next month
    if cutoff_date.month == 12:
        cutoff_date_in_month = date(cutoff_date.year + 1, 1, 1)
    else:
        cutoff_date_in_month = date(cutoff_date.year, cutoff_date.month + 1, 1)
    group_end_idx = np.where(group_date_list == cutoff_date_in_month)[0][0]

    return group_start_idx, group_end_idx


def crop_well_values(well_values, group_start_idx, group_end_idx):
    # well start idx is always 0
    well_end_idx = group_end_idx - group_start_idx
    cropped_well_values = well_values[:well_end_idx]
    if well_end_idx > len(well_values):
        cropped_well_values = cropped_well_values + [0] * (well_end_idx - len(well_values))
    cropped_well_values = np.array(cropped_well_values)
    cropped_well_values[cropped_well_values < 0] = 0  # negative won't get allocation

    return cropped_well_values


def get_remaining_list(input_list):
    ret_list = [np.nan] * len(input_list)
    for i in range(len(input_list)):
        ret_list[i] = sum(input_list[i:])
    return ret_list


def get_annual_list(input_list, size=12):
    ret_list = []
    input_list = np.array(input_list)
    split_array = np.split(input_list, np.arange(size, len(input_list), size))
    for chunk in split_array:
        ret_list += [sum(chunk)] * len(chunk)
    return ret_list


def get_allocation_ratios(well_values, reference_values, reference_values_for_remaining, allocation_bool,
                          allocation_timing, unecon_bool):
    if allocation_bool and not unecon_bool:
        if allocation_timing == 'remaining':
            '''
            for allocate by remaining, reference value need to be the whole array (for summing up the remaining)
            instead of cut at well's ECL like other allocation
            '''
            allocation_ratios = np.nan_to_num(
                np.divide(get_remaining_list(well_values),
                          get_remaining_list(reference_values_for_remaining)[:len(well_values)]))
        elif allocation_timing == 'annual':
            allocation_ratios = np.nan_to_num(np.divide(get_annual_list(well_values),
                                                        get_annual_list(reference_values)))
        else:
            allocation_ratios = np.nan_to_num(np.divide(well_values, reference_values))
    else:
        allocation_ratios = np.zeros(len(well_values))

    return allocation_ratios


def allocate(
    well_date_list,
    well_t_all,
    well_values,
    well_ownership,
    allocation_date_list,
    reference_values,
    cutoff_date,
    unecon_bool,
    original_well_result_params,
    group_result,
    allocation_bool,
    allocation_basis,
    allocation_timing,
    allocate_by_well_count=False,
    allocate_by_well_count_capex_ratio=0,
):
    allocated_group_params = {
        'final_cutoff_date': cutoff_date,
        'rev_dates_detail': original_well_result_params['rev_dates_detail'],
        'unecon_bool': unecon_bool,
        'is_complete': True,
        # ownership t_list doesn't need to be consistent with well's t_list
        't_ownership': original_well_result_params['t_ownership'],
        'ownership_params': original_well_result_params['ownership_params'],
    }

    # crop both values to same length and date range
    allocation_start_idx, allocation_end_idx = find_cropping_indices(well_date_list, allocation_date_list, cutoff_date)
    cropped_reference_values = reference_values[allocation_start_idx:allocation_end_idx]
    reference_values_for_remaining = reference_values[allocation_start_idx:]

    cropped_well_values = crop_well_values(well_values, allocation_start_idx, allocation_end_idx)
    allocation_ratios = get_allocation_ratios(cropped_well_values, cropped_reference_values,
                                              reference_values_for_remaining, allocation_bool, allocation_timing,
                                              unecon_bool)
    allocation_ratios_tax = allocation_ratios

    # CAPEX is allocated based on total amount over the life of well, but for allocate by well count, it uses monthly
    capex_well_ratio = 0  # for 1. no allocation, 2. unecon
    if allocation_bool and not unecon_bool:
        if allocate_by_well_count:
            capex_well_ratio = allocate_by_well_count_capex_ratio
        else:
            capex_well_ratio = sum(cropped_well_values) / sum(reference_values) if sum(reference_values) > 0 else 0

    allocation_ratio_capex = np.repeat(capex_well_ratio, len(cropped_well_values))

    if allocation_bool and allocation_basis == 'gross' and not unecon_bool:
        '''
        when allocation basis is gross, pass in gross (100% WI) group level assumption
        and multiple by well WI when allocate (for tax multiply well NRI)
        check `get_econ_models` in `one_group_calculation` function for the first part of the logic
        '''
        cropped_well_wi = crop_well_values(well_ownership['wi'], allocation_start_idx, allocation_end_idx)
        cropped_well_nri = crop_well_values(well_ownership['nri'], allocation_start_idx,
                                            allocation_end_idx)  # for production tax

        # the order for the following calculation matters allocation_ratios_tax need to be calculated first
        allocation_ratios_tax = np.multiply(allocation_ratios, cropped_well_nri)
        allocation_ratios = np.multiply(allocation_ratios, cropped_well_wi)
        allocation_ratio_capex = np.multiply(allocation_ratio_capex, cropped_well_wi)

    # crop group params, allocate group params to well by allocation_ratios and add to allocated_group_params
    '''
    start_idx and end_idx are used to crop group result
    allocation_start_idx and allocation_end_idx are used to crop allocation df
    group result date range can be different with allocation df due to CF prior to as of date
    '''
    group_start_idx, group_end_idx = find_cropping_indices(well_date_list,
                                                           group_result[ALLOCATION_RESULT_KEY]['date_list'].astype(str),
                                                           cutoff_date)
    # fixed expense
    group_fixed_expenses = group_result[ALLOCATION_RESULT_KEY]['fixed_expenses']
    allocated_group_params['group_fixed_expenses'] = allocate_fixed_expense(group_start_idx, group_end_idx,
                                                                            allocation_ratios, group_fixed_expenses)
    # variable expense
    group_variable_expenses = group_result[ALLOCATION_RESULT_KEY]['variable_expenses']
    allocated_group_params['group_variable_expenses'] = allocate_variable_expenses(group_start_idx, group_end_idx,
                                                                                   allocation_ratios,
                                                                                   group_variable_expenses)
    # water disposal
    group_water_disposals = group_result[ALLOCATION_RESULT_KEY]['water_disposal']
    allocated_group_params['group_water_disposals'] = allocate_water_disposals(group_start_idx, group_end_idx,
                                                                               allocation_ratios, group_water_disposals)
    # production tax
    group_production_tax_dict = group_result[ALLOCATION_RESULT_KEY]['production_tax_dict']
    allocated_group_params['group_production_tax_dict'] = allocate_production_tax(group_start_idx, group_end_idx,
                                                                                  allocation_ratios_tax,
                                                                                  group_production_tax_dict)
    # capex
    if allocation_bool:
        allocated_group_params['allocated_group_capex_model'] = allocate_capex_model(
            group_start_idx,
            group_end_idx,
            allocation_ratio_capex,
            group_result[ALLOCATION_RESULT_KEY]['capex_dict'],
            group_result[ALLOCATION_RESULT_KEY]['all_capex'],
        )
    else:
        allocated_group_params['allocated_group_capex_model'] = []

    # group params start date
    allocated_group_params['t_allocation'] = well_t_all[0:allocation_end_idx - allocation_start_idx]

    return allocated_group_params


def allocate_by_oil_volume(flat_output, original_well_result_params, well_t_all, group_result, cutoff_date, unecon_bool,
                           allocation_df, group_properties):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['gross_oil_well_head_volume'])
        well_values = flat_output['gross_oil_well_head_volume']
    else:
        reference_values = np.array(allocation_df['net_oil_well_head_volume'])
        well_values = flat_output['net_oil_well_head_volume']

    well_date_list = flat_output['date']

    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
    )
    return allocated_group_params


def allocate_by_gas_volume(flat_output, original_well_result_params, well_t_all, group_result, cutoff_date, unecon_bool,
                           allocation_df, group_properties):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['gross_gas_well_head_volume'])
        well_values = flat_output['gross_gas_well_head_volume']
    else:
        reference_values = np.array(allocation_df['net_gas_well_head_volume'])
        well_values = flat_output['net_gas_well_head_volume']

    well_date_list = flat_output['date']
    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
    )
    return allocated_group_params


def allocate_by_boe(flat_output, original_well_result_params, well_t_all, group_result, cutoff_date, unecon_bool,
                    allocation_df, group_properties):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['gross_boe_well_head_volume'])
        well_values = flat_output['gross_boe_well_head_volume']
    else:
        reference_values = np.array(allocation_df['net_boe_well_head_volume'])
        well_values = flat_output['net_boe_well_head_volume']

    well_date_list = flat_output['date']
    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
    )
    return allocated_group_params


def allocate_by_well_count(
    flat_output,
    original_well_result_params,
    well_t_all,
    group_result,
    cutoff_date,
    unecon_bool,
    allocation_df,
    group_properties,
    well_one_liner_well_count,
    group_well_count,
):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_timing == 'remaining':  # to match PHDWin well count remaining calculation
        allocation_timing = 'monthly'

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['gross_well_count'])
        well_values = flat_output['gross_well_count']
        capex_ratio = well_one_liner_well_count['gross_well_count'] / group_well_count['gross_well_count']
    else:
        reference_values = np.array(allocation_df['wi_well_count'])
        well_values = flat_output['wi_well_count']
        capex_ratio = well_one_liner_well_count['wi_well_count'] / group_well_count['wi_well_count']

    well_date_list = flat_output['date']
    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
        allocate_by_well_count=True,
        allocate_by_well_count_capex_ratio=capex_ratio,
    )
    return allocated_group_params


def allocate_by_revenue(flat_output, original_well_result_params, well_t_all, group_result, cutoff_date, unecon_bool,
                        allocation_df, group_properties):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['total_100_pct_wi_revenue'])
        well_values = flat_output['total_100_pct_wi_revenue']
    else:
        reference_values = np.array(allocation_df['total_revenue'])
        well_values = flat_output['total_revenue']

    well_date_list = flat_output['date']
    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
    )
    return allocated_group_params


def allocate_by_income(flat_output, original_well_result_params, well_t_all, group_result, cutoff_date, unecon_bool,
                       allocation_df, group_properties):
    allocation_method_type, allocation_bool, allocation_basis, allocation_timing = get_allocation_info(group_properties)

    if allocation_method_type == 'gross':
        reference_values = np.array(allocation_df['net_income'])
        well_values = flat_output['net_income']
    else:
        reference_values = np.array(allocation_df['net_income'])
        well_values = flat_output['net_income']

    well_date_list = flat_output['date']
    well_ownership = {
        'wi': flat_output['wi_oil'],  # use oil wi for well wi for now, pass out original wi in future
        'nri': flat_output['nri_oil']  # use oil nri for well nri for now, pass out original nri in future
    }

    allocated_group_params = allocate(
        well_date_list,
        well_t_all,
        well_values,
        well_ownership,
        allocation_df['date'].to_list(),
        reference_values,
        cutoff_date,
        unecon_bool,
        original_well_result_params,
        group_result,
        allocation_bool,
        allocation_basis,
        allocation_timing,
    )
    return allocated_group_params


ALLOCATION_FUNCTIONS = {
    'gas-volume': allocate_by_gas_volume,
    'oil-volume': allocate_by_oil_volume,
    'boe': allocate_by_boe,
    'well-count': allocate_by_well_count,
    'revenue': allocate_by_revenue,
    'income': allocate_by_income,
}


def allocate_one_well(
    flat_output,
    original_cutoff_info,
    original_well_result_params,
    original_cf_start_date,
    well_t_all,
    well_one_liner_well_count,
    group_properties,
    group_result,
    allocation_df,
    group_well_count,
):
    '''
    if not allocate, still need to use a allocation function to run through the pipeline,
    the result will be same for each allocation function, use well-count as default
    '''
    allocation_method = get_allocation_method(group_properties)
    allocation_function: Callable = ALLOCATION_FUNCTIONS[allocation_method]

    group_ecl = group_result['group_cutoff'].get('cutoff_date')
    original_cutoff_date = original_cutoff_info['cutoff_date']
    cutoff_date = original_cutoff_date
    ecl_link = get_group_ecl_option(group_properties)

    if group_properties['econLimit'] == CANNOT_EXCEED_GROUP:
        cutoff_date = min(original_cutoff_date, group_ecl)
    elif group_properties['econLimit'] == MUST_BE_GROUP:
        cutoff_date = group_ecl

    # group cutoff earlier than well start date, make well unecon
    if cutoff_date <= original_cf_start_date:
        updated_well_unecon_bool = True
    else:
        unecon_bool = original_cutoff_info['unecon_bool']
        updated_well_unecon_bool = update_unecon_bool(unecon_bool, ecl_link)

    # cut group_allocation_df to group cutoff date for remaining allocation basis and capex allocation
    allocation_df = cut_group_df(allocation_df, max_date=group_ecl)

    if allocation_method == 'well-count':
        allocated_group_params = allocation_function(
            flat_output,
            original_well_result_params,
            well_t_all,
            group_result,
            cutoff_date,
            updated_well_unecon_bool,
            allocation_df,
            group_properties,
            well_one_liner_well_count,
            group_well_count,
        )
    else:
        allocated_group_params = allocation_function(
            flat_output,
            original_well_result_params,
            well_t_all,
            group_result,
            cutoff_date,
            updated_well_unecon_bool,
            allocation_df,
            group_properties,
        )

    return allocated_group_params


def allocate_one_batch(result_by_combo_by_group, one_batch_output, group_settings, allocation_df,
                       well_count_by_combo_by_group):
    for combo_output in one_batch_output:
        combo_name = combo_output['combo']['name']
        combo_group_result = result_by_combo_by_group[combo_name]
        for well in combo_output['outputs']:
            # skip well with error
            if well.get('error') is not None or combo_group_result.get(well[ECON_GROUP], {}).get('error') is not None:
                continue

            econ_group = well[ECON_GROUP]
            group_result = combo_group_result[econ_group]
            group_allocation_df = filter_group_df(allocation_df, combo_name, econ_group)

            allocated_group_params = allocate_one_well(
                well['all_flat_output'],
                well['original_cutoff_info'],
                well['original_well_result_params'],
                well['well_input'].date_dict['cf_start_date'],
                well['t_all'],
                well['one_liner_well_count'],
                # TODO: group case doesn't consider combo now, always use default, change after combo implemented
                get_group_properties(group_settings, econ_group, DEFAULT_COMBO_NAME),
                group_result,
                group_allocation_df,
                well_count_by_combo_by_group.get(combo_name, {}).get(econ_group, ZERO_GROUP_WELL_COUNT))

            well['group_params'] = allocated_group_params


def allocate_to_wells(result_by_combo_by_group, individual_well_batch_outputs, group_settings, allocation_df):
    '''
    add allocation result as 'group_params' to individual_well_batch_outputs
    '''
    well_count_by_combo_by_group = get_well_count_by_combo_by_group(individual_well_batch_outputs, group_settings)
    for batch in individual_well_batch_outputs:
        allocate_one_batch(result_by_combo_by_group, batch, group_settings, allocation_df, well_count_by_combo_by_group)


def update_unecon_bool(independent_well_unecon_bool, ecl_link):
    if independent_well_unecon_bool:
        if ecl_link in [GROUP_INDEPENDENT, CANNOT_EXCEED_GROUP]:
            return True
    return False


def get_well_count_by_combo_by_group(individual_well_batch_outputs, group_settings):
    well_count_by_combo_by_group = {}

    for batch in individual_well_batch_outputs:
        for combo in batch:
            combo_name = combo['combo']['name']
            if combo_name not in well_count_by_combo_by_group:
                well_count_by_combo_by_group[combo_name] = {}

            outputs = combo['outputs']
            for well_output in outputs:
                if well_output.get('error') is not None:
                    continue

                econ_group = well_output[ECON_GROUP]  # all output should have ECON_GROUP field
                well_unecon_bool = well_output['original_cutoff_info']['unecon_bool']

                one_group_setting = get_one_group_setting(group_settings, econ_group, DEFAULT_COMBO_NAME)
                ecl_link = get_group_ecl_option(one_group_setting)
                updated_well_unecon_bool = update_unecon_bool(well_unecon_bool, ecl_link)

                one_liner_well_count = copy.deepcopy(well_output['one_liner_well_count'])

                if updated_well_unecon_bool:
                    one_liner_well_count = {k: 0 for k in one_liner_well_count}

                if econ_group in well_count_by_combo_by_group[combo_name]:
                    for key in one_liner_well_count:
                        well_count_by_combo_by_group[combo_name][econ_group][key] += one_liner_well_count[key]
                else:
                    well_count_by_combo_by_group[combo_name][econ_group] = one_liner_well_count

    return well_count_by_combo_by_group
