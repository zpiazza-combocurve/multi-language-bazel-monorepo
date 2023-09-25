import numpy as np
import polars as pl
from joblib import Parallel, delayed

from combocurve.services.econ.econ_output_service import build_monthly_one_liner_base_columns
from combocurve.services.econ.econ_aggregation import (group_aggregation, group_aggregation_for_allocation)

from combocurve.science.econ.well import group_economics_final_well
from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.science.econ.econ_input.well_input import get_unecon_capex
from combocurve.science.econ.econ_use_forecast.use_forecast import get_date
from combocurve.science.econ.econ_output.econ_output_data import group_econ_data_from_well_result
from combocurve.science.econ.general_functions import get_assumption, get_py_date, last_day_of_month
from combocurve.science.econ.embedded_lookup_table.conversion_factory import ConversionFactory
from combocurve.science.econ.econ_use_forecast.use_forecast import get_fpd_from_source, WellHeaderError

from combocurve.science.econ.econ_calculations.cutoff import cutoff_results
from combocurve.science.econ.econ_calculations.capex import get_capex_params_with_dates
from combocurve.science.econ.econ_calculations.reversion import final_ownership_and_reversion_dates
from combocurve.science.econ.econ_calculations.factory import (group_level_calculation_function,
                                                               group_level_calculation_function_for_group_case)

from combocurve.science.econ.group_econ.schema import GROUP_PL_DF_SCHEMA
from combocurve.science.econ.group_econ.group_econ_query import DEFAULT_COMBO_NAME
from combocurve.science.econ.group_econ.allocation import allocate_to_wells, ALLOCATION_RESULT_KEY
from combocurve.science.econ.group_econ.group_case import create_group_case, GROUP_CASE_INPUT_KEY, GROUP_CASE_RESULT_KEY
from combocurve.science.econ.group_econ.group_econ_defaults import (GROUP_INDEPENDENT, CANNOT_EXCEED_GROUP,
                                                                    get_one_group_setting, get_allocation_bool,
                                                                    get_group_ecl_option)
from combocurve.science.econ.group_econ.general_functions import (ECON_GROUP, GROSS_CALCULATION, filter_group_df,
                                                                  cut_group_df, extend_group_df)

from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.contexts import with_feature_flag_context


def batch_outputs_to_pldf(individual_batch_outputs, group_settings, run_data, from_cutoff=False):
    if len(individual_batch_outputs) == 0:
        flat_monthly_rows = []
    else:
        # individual_batch_outputs has all well error will also result in flat_monthly_rows = []
        all_monthly_rows = Parallel(n_jobs=len(individual_batch_outputs))(
            delayed(get_monthly_rows)(batch_output, group_settings, run_data, from_cutoff)
            for batch_output in individual_batch_outputs)
        flat_monthly_rows = [item for sublist in all_monthly_rows for item in sublist]

    if len(flat_monthly_rows) > 0:
        all_df = pl.from_dicts(flat_monthly_rows,
                               infer_schema_length=len(flat_monthly_rows)).select(GROUP_PL_DF_SCHEMA.keys())
    else:
        all_df = pl.DataFrame(schema=GROUP_PL_DF_SCHEMA)

    return all_df


def get_well_result_pldfs(individual_batch_outputs, group_settings, run_data):
    well_result_df = batch_outputs_to_pldf(individual_batch_outputs, group_settings, run_data)
    gross_well_result_df = batch_outputs_to_pldf(individual_batch_outputs, group_settings, run_data, True)
    return well_result_df, gross_well_result_df


def get_monthly_rows(batch_outputs, group_settings, run_data, from_cutoff):
    monthly_rows = []
    for combo in batch_outputs:
        for output in combo['outputs']:
            if output.get('error') is None:  # skip well with error
                rows = build_monthly_rows(output, combo['combo'], group_settings, run_data, from_cutoff)
                '''
                the append method will auto create new column if 'rows' has more columns than 'monthly_rows'
                this can happen for example: the first well error out (less cols) but the second well not (all cols)
                '''
                monthly_rows += rows
    return monthly_rows


def build_monthly_rows(output, combo, group_settings, run_data, from_cutoff):
    '''
        Returns multiple rows with the schema for the monthly table in BigQuery
    '''
    base = build_monthly_one_liner_base_columns(output, combo, run_data)
    base[ECON_GROUP] = output[ECON_GROUP]  # all output should have ECON_GROUP field

    # TODO: group case doesn't consider combo now, always use default, change after combo implemented
    one_group_setting = get_one_group_setting(group_settings, base[ECON_GROUP], DEFAULT_COMBO_NAME)
    ecl_link = get_group_ecl_option(one_group_setting.get('properties', {}))
    cut = ecl_link in [GROUP_INDEPENDENT, CANNOT_EXCEED_GROUP]

    # cut date is first day of cutoff month + 1 month
    cut_date_str = (np.datetime64(output['original_cutoff_info']['cutoff_date'], 'M')
                    + 1).astype('datetime64[D]').astype('str')

    if 'error' in output:
        '''
        return a list of dict also make append to whole df work
        '''
        return [base]
    else:
        if from_cutoff and output['original_cutoff_info']['cutoff_well_result'] is not None:
            data_dict = group_econ_data_from_well_result(output['original_cutoff_info']['cutoff_well_result'],
                                                         output[ECON_GROUP], combo['name'])
        else:
            data_dict = output['all_flat_output']

        data = np.array(list(data_dict.values()), dtype='O')
        date_array = data_dict['date']

        if cut_date_str in date_array:
            cut_index = list(date_array).index(cut_date_str)
        else:
            cut_index = None

        if cut:
            well_unecon_bool = output['original_cutoff_info']['unecon_bool']
            if well_unecon_bool:  # for unecon well and meet 'cut' condition, skip well for allocation
                return []
            if cut_index is not None:
                data = data[:, :cut_index]

        keys = data_dict.keys()
        num_rows = data.shape[1]
        records = []
        for row_idx in range(num_rows):
            row_dict = dict(zip(keys, data[:, row_idx]))
            row_dict.update(base)
            records.append(row_dict)

        return records


def batch_econ_final(batch, is_fiscal_month):
    for combo in batch:
        for well_output in combo['outputs']:
            if well_output.get('error') is None:  # skip well with error
                well_output_update = group_economics_final_well(
                    well_output['well_input'],
                    well_output.get('group_params'),
                    well_output['original_well_result_params'],
                    well_output['original_cutoff_info'],
                    is_fiscal_month,
                )
                well_output.update(well_output_update)
    return batch


def get_group_date_dict(group_df, dates_model):
    # FPD set to be first date of by well aggregation result
    fpd = get_py_date(group_df['date'][0])
    end_econ_date = last_day_of_month(get_py_date(group_df['date'][-1]))

    dates_setting = dates_model['dates_setting']
    as_of_date = get_date(dates_setting['as_of_date'], fpd, fpd)
    discount_date = get_date(dates_setting['discount_date'], fpd, fpd)

    date_dict = {
        'cf_start_date': fpd,  # srtart date in econ report
        'cf_end_date': end_econ_date,  # end date in econ report
        'cut_off_date': end_econ_date,  # end of producing
        'as_of_date': as_of_date,  # start of producing
        'volume_start_date': fpd,
        'first_production_date': fpd,
        'first_segment_date': fpd,
        'end_history_date': fpd,
        'discount_date': discount_date,
        'original_discount_date': discount_date,
    }
    return date_dict


def update_group_date_dict(updated_group_df, initial_date_dict, cutoff_date=None, cf_end_date=None):
    df_start_date = get_py_date(updated_group_df['date'][0])
    if cutoff_date is None:
        df_end_date = last_day_of_month(get_py_date(updated_group_df['date'][-1]))
    else:
        df_end_date = cutoff_date

    updated_date_dict = {
        **initial_date_dict, 'cf_start_date': df_start_date,
        'cf_end_date': cf_end_date or df_end_date,
        'cut_off_date': df_end_date
    }

    return updated_date_dict


def extend_group_df_and_date_dict(group_df, initial_date_dict, dates_setting, well_header_info, capex_model):
    '''
    extend group df for cf prior to as of date
    '''
    date_dict_update, _, _, _ = get_capex_params_with_dates(dates_setting,
                                                            initial_date_dict,
                                                            capex_model,
                                                            shut_in_params={},
                                                            schedule={},
                                                            well_header_info=well_header_info)
    cf_prior_as_of_date_bool = dates_setting.get('cash_flow_prior_to_as_of_date', 'no') == 'yes'

    if date_dict_update['cf_start_date'] < initial_date_dict['cf_start_date']:
        initial_date_dict.update({
            'cf_start_date': date_dict_update['cf_start_date'],
            'discount_date': date_dict_update['discount_date']
        })

        group_df = extend_group_df(group_df, date_dict_update['cf_start_date'], None)

    return group_df, initial_date_dict, cf_prior_as_of_date_bool


def group_cutoff(gross_group_df, well_input_dict, well_result_dict, initial_date_dict, cf_prior_as_of_date_bool,
                 one_group_settings, no_wells_in_group):
    if get_group_ecl_option(one_group_settings.get('properties', {})) == GROUP_INDEPENDENT and not no_wells_in_group:
        return last_day_of_month(get_py_date(gross_group_df['date'][-1])), False

    updated_gross_group_df = gross_group_df
    if not cf_prior_as_of_date_bool:
        # group cutoff start from as of date, crop group_df
        updated_gross_group_df = cut_group_df(gross_group_df, initial_date_dict['as_of_date'])
    else:
        # handle CF prior to as of date for gross_group_df
        updated_gross_group_df = extend_group_df(gross_group_df, initial_date_dict['cf_start_date'], None)

    cutoff_date_dict = update_group_date_dict(updated_gross_group_df, initial_date_dict)

    cutoff_well_input = {
        **well_input_dict,
        'date_dict': cutoff_date_dict,
        'group_df': updated_gross_group_df,
    }

    return cutoff_results(group_level_calculation_function, cutoff_well_input, well_result_dict)


def set_group_unecon_input(well_input_dict):
    default_expenses = get_default('expenses')
    conversion_factory = ConversionFactory()
    expense_converter = conversion_factory.converter('expense')()
    (fixed_expense_model, variable_expense_model, disposal_expense_model,
     ghg_expense_model) = expense_converter.incorporate_embedded(default_expenses)

    default_production_taxes = get_default('production_taxes')

    well_input_dict.update({
        'variable_expense_model': variable_expense_model,
        'fixed_expense_model': fixed_expense_model,
        'disposal_expense_model': disposal_expense_model,
        'ghg_expense_model': ghg_expense_model,
        'severance_tax_model': default_production_taxes['severance_tax'],
        'ad_valorem_tax_model': default_production_taxes['ad_valorem_tax'],
        'capex_model': {
            'other_capex': get_unecon_capex(well_input_dict['cut_off_model'], well_input_dict['capex_model'])
        }
    })


def group_result_for_group_case(well_input_dict, well_result_dict, initial_date_dict, cutoff_date, unecon_bool,
                                cf_prior_as_of_date_bool, rev_dates_detail):
    '''
    well result that start from as of date to cutoff date, for create group case
    '''
    capex_date_dict = {**initial_date_dict, 'cut_off_date': cutoff_date}
    date_dict_update, _, _, _ = get_capex_params_with_dates(well_input_dict['dates_setting'],
                                                            capex_date_dict,
                                                            well_input_dict['capex_model'],
                                                            shut_in_params={},
                                                            schedule={},
                                                            is_complete=True,
                                                            well_header_info=well_input_dict['well_header_info'])
    cf_end_date = date_dict_update['cf_end_date']

    df_start_date = None if cf_prior_as_of_date_bool else initial_date_dict['as_of_date']
    if unecon_bool:
        number_of_years = 1 / 12
        updated_group_df = add_rows_to_empty_group_df(well_input_dict['group_df'], cutoff_date, number_of_years)
        set_group_unecon_input(well_input_dict)
    else:
        updated_group_df = cut_group_df(well_input_dict['group_df'], df_start_date, cutoff_date)

    # extend group_df from cutoff_date to cf_end_date with 0
    if cf_end_date > cutoff_date:
        updated_group_df = extend_group_df(updated_group_df, None, date_dict_update['cf_end_date'])

    date_dict = update_group_date_dict(updated_group_df, initial_date_dict, cutoff_date, cf_end_date)
    # used in full_econ_output
    date_dict.update({
        'rev_dates': [r['date'] for r in rev_dates_detail],  #  TODO: also saved in well_result_dict, be consistent
        'start_using_forecast': {},
    })

    well_input_dict = {
        **well_input_dict,
        'date_dict': date_dict,
        'group_df': updated_group_df,
    }

    return well_input_dict, group_level_calculation_function_for_group_case(well_input_dict, well_result_dict)


def update_expense_to_gross(expenses_model):
    # variable expense
    for phase in expenses_model['variable_expenses'].values():
        if phase != 'original':
            for cat in phase.values():
                cat['calculation'] = GROSS_CALCULATION

    # fixed exp
    for fixed_exp in expenses_model['fixed_expenses'].values():
        if fixed_exp != 'original':
            fixed_exp['calculation'] = GROSS_CALCULATION

    # water disposal
    expenses_model['water_disposal']['calculation'] = GROSS_CALCULATION


def update_prod_tax_to_gross(production_taxes_model):
    # severance tax
    production_taxes_model['severance_tax']['calculation'] = GROSS_CALCULATION

    # ad_valorem tax
    production_taxes_model['ad_valorem_tax']['calculation'] = GROSS_CALCULATION


def update_capex_to_gross(capex_model):
    for capex in capex_model['other_capex']['rows']:
        capex['calculation'] = 'net'  # net for capex means the input value is net, and will not be multiplied by WI


def get_econ_models(one_group_settings):
    group_assumptions = one_group_settings.get('assumptions', {})

    dates_model = get_assumption(group_assumptions, 'dates')
    ownership_model = get_assumption(group_assumptions, 'ownership_reversion')
    expenses_model = get_assumption(group_assumptions, 'expenses')
    production_taxes_model = get_assumption(group_assumptions, 'production_taxes')
    capex_model = get_assumption(group_assumptions, 'capex')
    general_option_model = get_assumption(group_assumptions, 'general_options')
    risk_model = get_assumption(group_assumptions, 'risking')

    allocation_bool = get_allocation_bool(one_group_settings.get('properties', {}))
    allocation_basis = one_group_settings.get('properties', {}).get('allocation', {}).get('basis', 'net')

    if allocation_bool and allocation_basis == 'gross':
        '''
        when allocation basis is gross, pass in gross (100% WI) group level assumption
        and multiple by well WI when allocate
        check `allocate` function for the second part of the logic
        '''
        update_expense_to_gross(expenses_model)
        update_prod_tax_to_gross(production_taxes_model)
        update_capex_to_gross(capex_model)

    return (general_option_model, dates_model, ownership_model, expenses_model, production_taxes_model, capex_model,
            risk_model)


def add_rows_to_empty_group_df(group_df, group_fpd, max_econ_life):
    df_schema = group_df.schema
    data = {}

    num_of_months = int(max_econ_life * 12)
    date_array = (np.arange(num_of_months) + np.datetime64(group_fpd, 'M')).astype('datetime64[D]').astype(str)

    for col in df_schema:
        if col == 'date':
            data[col] = date_array
        elif GROUP_PL_DF_SCHEMA[col] == pl.Float64:
            data[col] = np.zeros(len(date_array))
        else:
            data[col] = np.repeat('', len(date_array))

    new_group_df = pl.DataFrame(data, schema=GROUP_PL_DF_SCHEMA)

    return new_group_df


def one_group_calculation(group_df, gross_group_df, group_settings, econ_group, outputParams):
    # TODO: group case doesn't consider combo now, always use default, change after combo implemented
    one_group_settings = get_one_group_setting(group_settings, econ_group, DEFAULT_COMBO_NAME)

    (general_option_model, dates_model, ownership_model, expenses_model, production_taxes_model, capex_model,
     risk_model) = get_econ_models(one_group_settings)

    # for embedded lookup table
    conversion_factory = ConversionFactory()
    expense_converter = conversion_factory.converter('expense')()
    (fixed_expense_model, variable_expense_model, disposal_expense_model,
     ghg_expense_model) = expense_converter.incorporate_embedded(expenses_model)
    capex_converter = conversion_factory.converter('CAPEX')()
    capex_model = capex_converter.incorporate_embedded(capex_model)

    well_header_info = one_group_settings.get('well', {})
    dates_setting = dates_model['dates_setting']

    no_wells_in_group = False
    if group_df.is_empty():
        try:
            none_by_phase = {'oil': None, 'gas': None, 'water': None}
            group_fpd, _ = get_fpd_from_source(dates_setting, well_header_info, none_by_phase, none_by_phase, {})
            group_df = add_rows_to_empty_group_df(group_df, group_fpd, dates_setting['max_well_life'])
            gross_group_df = group_df.clone()
            no_wells_in_group = True
        except WellHeaderError as e:
            fpd_error = get_exception_info(e)
            return {'error': fpd_error}

    initial_date_dict = get_group_date_dict(group_df, dates_model)

    # handle CF prior to as of date
    group_df, initial_date_dict, cf_prior_as_of_date_bool = extend_group_df_and_date_dict(
        group_df,
        initial_date_dict,
        dates_setting,
        well_header_info,
        capex_model,
    )

    well_input_dict = {
        'group_df': group_df,
        'date_dict': initial_date_dict,
        'shut_in_params': {},
        'btu_content_dict': {
            'unshrunk_gas': 1000,
            'shrunk_gas': 1000,
        },
        'ownership_model': ownership_model,
        'variable_expense_model': variable_expense_model,
        'fixed_expense_model': fixed_expense_model,
        'disposal_expense_model': disposal_expense_model,
        'ghg_expense_model': ghg_expense_model,
        'severance_tax_model': production_taxes_model['severance_tax'],
        'ad_valorem_tax_model': production_taxes_model['ad_valorem_tax'],
        'general_option_model': general_option_model,
        'boe_conversion_dict': general_option_model['boe_conversion'],
        'well_header_info': well_header_info,
        'schedule': {},  #  used in tax and capex calculation
        'dates_setting': dates_setting,
        'cut_off_model': dates_model['cut_off'],
        'capex_model': capex_model,
        # params for full_econ_output
        'columns': outputParams['columns'],
        'column_fields': outputParams['columnFields'],
        'stream_property_model': {
            'btu_content': {
                'shrunk_gas': 1000,
                'unshrunk_gas': 1000,
            },
            'yields': {
                "ngl": {
                    "rows": [{
                        "yield": 0,
                        "entire_well_life": "Flat",
                        "unshrunk_gas": "Unshrunk Gas"
                    }]
                },
                "drip_condensate": {
                    "rows": [{
                        "yield": 0,
                        "entire_well_life": "Flat",
                        "unshrunk_gas": "Unshrunk Gas"
                    }]
                }
            }
        },
        'risk_model': risk_model,  # needed for well count calculation
        'ownership_reversion_model_name': ownership_model.get('name', None),
        'differentials_model_name': None,
        'production_taxes_model_name': production_taxes_model.get('name', None),
        'capex_model_name': capex_model.get('name', None),
        'expenses_model_name': expenses_model.get('name', None),
        'stream_properties_model_name': None,
        'dates_model_name': dates_model.get('name', None),
        'pricing_model_name': None,
        'risking_model_name': None,
        'forecast_name': None,
    }

    # create shared well_result_dict for different group calculation, pass in a copy to each calculation
    well_result_dict = {
        'carbon_expenses': [],  # not calculating carbon expenses for now, needed in tax calculation
        'price': {},  # for prod tax PAIF, not allowing group price for now
        'is_complete': True,  # used in capex calculation
    }

    # get ownership params
    ownership_params, t_ownership, rev_dates_detail = final_ownership_and_reversion_dates(
        group_level_calculation_function, well_input_dict, {**well_result_dict})

    well_result_dict.update({
        'ownership_params': ownership_params,
        't_ownership': t_ownership,
        'rev_dates_detail': rev_dates_detail,  # used in capex calculation
    })

    # cutoff calculation based on gross aggregation well result
    cutoff_date, unecon_bool = group_cutoff(
        gross_group_df,
        well_input_dict,
        {
            **well_result_dict,
            'is_complete': False,  # is_complete need to be false when calculating cutoff
        },
        initial_date_dict,
        cf_prior_as_of_date_bool,
        one_group_settings,
        no_wells_in_group)
    '''
    well result that based on full range of group_df for allocation use (allocation can go beyond group ecl)
    calculate_bfit is False due to allocation don't need bift result
    and CAPEX after ECL will make capex array have different length than other arrays,
    but CAPEX allocation can handle that
    '''
    well_result_dict_for_allocation = group_level_calculation_function(well_input_dict, {**well_result_dict},
                                                                       calculate_bfit=False)

    # well result for group case
    well_input_dict_for_group_case, well_result_dict_for_group_case = group_result_for_group_case(
        well_input_dict,
        {**well_result_dict},
        initial_date_dict,
        cutoff_date,
        unecon_bool,
        cf_prior_as_of_date_bool,
        rev_dates_detail,
    )

    return {
        'group_cutoff': {
            'cutoff_date': cutoff_date,
            'unecon_bool': unecon_bool,
        },
        ALLOCATION_RESULT_KEY: well_result_dict_for_allocation,
        GROUP_CASE_INPUT_KEY: well_input_dict_for_group_case,
        GROUP_CASE_RESULT_KEY: well_result_dict_for_group_case,
    }


def process_groups(group_agg_pldf, gross_group_agg_pldf, group_settings, outputParams, used_groups):
    result_by_combo_by_group = {}
    combos = outputParams['combos']

    for combo in combos:
        combo_name = combo['name']
        if combo_name not in result_by_combo_by_group:
            result_by_combo_by_group[combo_name] = {}
        for econ_group in used_groups:
            group_df = filter_group_df(group_agg_pldf, combo_name, econ_group)
            gross_group_pldf = filter_group_df(gross_group_agg_pldf, combo_name, econ_group)

            result_by_combo_by_group[combo_name][econ_group] = {'combo': combo}
            result_by_combo_by_group[combo_name][econ_group].update(
                one_group_calculation(group_df, gross_group_pldf, group_settings, econ_group, outputParams))

    return result_by_combo_by_group


def group_calculation(individual_well_batch_outputs, group_settings, run_data, is_fiscal_month, outputParams,
                      used_groups, tenant_info):
    well_pldf, gross_well_pldf = get_well_result_pldfs(individual_well_batch_outputs, group_settings,
                                                       run_data)

    group_agg_pldf = group_aggregation(well_pldf)
    gross_group_agg_pldf = group_aggregation(gross_well_pldf)

    allocation_df = group_aggregation_for_allocation(well_pldf)
    result_by_combo_by_group = process_groups(group_agg_pldf, gross_group_agg_pldf, group_settings, outputParams,
                                              used_groups)

    allocate_to_wells(result_by_combo_by_group, individual_well_batch_outputs, group_settings, allocation_df)

    if len(individual_well_batch_outputs) == 0:
        final_batch_outputs = []
    else:
        final_batch_outputs = Parallel(n_jobs=len(individual_well_batch_outputs))(
            delayed(with_feature_flag_context)(batch_econ_final, tenant_info, batch_output, is_fiscal_month)
            for batch_output in individual_well_batch_outputs)

    final_batch_outputs.append(create_group_case(group_settings, result_by_combo_by_group))

    return final_batch_outputs
