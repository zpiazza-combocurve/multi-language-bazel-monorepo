from combocurve.science.econ.econ_calculations.factory import (
    CalculationFactory,
    calculation_function_on_queue,
    CALCULATIONS,
    GROUP_CALCULATIONS,
)
from combocurve.science.econ.econ_input.well_input import WellInput
from combocurve.science.econ.econ_calculations.well_result import WellResult
from combocurve.science.econ.econ_output.well_output import WellOutput
from combocurve.science.econ.econ_calculations.reversion import final_ownership_and_reversion_dates
from combocurve.science.econ.econ_calculations.cutoff import cutoff_results

from combocurve.science.econ.econ_calculations.breakeven import breakeven_results
from combocurve.science.econ.econ_input.econ_input_error_warning import process_warning_message
from combocurve.science.network_module.one_well_emission import one_well_emission
from combocurve.science.network_module.network import Network
from combocurve.shared.constants import OIL_STR, GAS_STR, WATER_STR

from typing import Callable, Optional


def ghg(raw_well_input):
    well_input = WellInput(raw_well_input)
    well = Well(well_input, is_fiscal_month=False)
    # date_dict in well_input is updated
    monthly_econ_results = well.well_result_dict()

    # need date_dict and unecon_bool to make sure emissions are only included from As Of to Cutoff
    date_dict = monthly_econ_results['date_dict']
    unecon_bool = monthly_econ_results['unecon_bool']

    well_head_volume = monthly_econ_results['volume']

    well_data = {
        'date': well_head_volume['oil']['date'],
        'oil': well_head_volume['oil']['well_head'],
        'gas': well_head_volume['gas']['well_head'],
        'water': well_head_volume['water']['well_head'],
        'boe': well_head_volume['boe']['well_head']['total']
    }
    well_id_str = str(well_input.well_id)

    # need schedule and well header info for drilling/completion emission calcs
    schedule = well_input.schedule
    well_header_info = well_input.well_header_info

    ## append wellhead_volume information
    well_head_emission = []
    for phase in [OIL_STR, GAS_STR, WATER_STR]:
        arr = well_data[phase]
        well_head_emission += [{
            'well_id': well_id_str,
            'node_id': None,
            'node_type': None,
            'emission_type': None,
            'product_type': 'product',
            'product': f'wh_{phase}',
            'value': float(v),
            'date': well_data['date'][i]
        } for i, v in enumerate(arr)]

    network_emission = []
    if well_input.network:
        well_info = {
            'well_id': well_id_str,
            'well_data': well_data,
            'date_dict': date_dict,
            'schedule': schedule,
            'well_header_info': well_header_info,
            'unecon_bool': unecon_bool
        }

        network_emission = Network(well_input.network).calculate_one_well(well_info)

    top_down_emission = []
    if well_input.emission:
        top_down_emission = one_well_emission(well_id_str, well_data, well_input.emission, date_dict, unecon_bool)

    return well_head_emission + network_emission + top_down_emission


def economics(raw_well_input,
              incremental_index,
              base_case_flat_log,
              is_fiscal_month=False,
              feature_flags: Optional[dict[str, bool]] = None):
    well_input = WellInput(raw_well_input, feature_flags=feature_flags)
    well = Well(well_input, is_fiscal_month, feature_flags)
    well_result_dict = well.well_result_dict()
    breakeven_dict, breakeven_unit_dict = well.well_breakeven_results()
    well_output = WellOutput(well_input, well_result_dict, well.well_input.date_dict, feature_flags=feature_flags)
    (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras,
     flat_econ_log) = well_output.full_econ_output(breakeven_dict, breakeven_unit_dict, incremental_index,
                                                   base_case_flat_log, is_fiscal_month)
    warning_message = well.warning_message()

    return (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras, warning_message,
            flat_econ_log, well.well_input.date_dict['cut_off_date'])


def group_economics_individual_well(raw_well_input, incremental_index, base_case_flat_log, is_fiscal_month=False):
    well_input = WellInput(raw_well_input)
    well = Well(well_input, is_fiscal_month)
    well_result_dict = well.group_econ_individual_well_result_dict()

    # TODO: remove redundant one liner calculation which will be done in 'group_economics_final_well'
    breakeven_dict, breakeven_unit_dict = well.well_breakeven_results()

    well_output = WellOutput(well_input, well_result_dict, well.well_input.date_dict)
    (_, all_flat_output, _, all_one_liner, _, _) = well_output.full_econ_output(
        breakeven_dict,
        breakeven_unit_dict,
        incremental_index,
        base_case_flat_log,
        is_fiscal_month,
        apply_unit=False,
        add_group_econ_cols=True,
    )
    original_cutoff_info = well.original_cutoff_info
    original_well_result_params = well.well_result_params

    one_liner_well_count = {
        'gross_well_count': all_one_liner['gross_well_count']['value'],
        'wi_well_count': all_one_liner['wi_well_count']['value'],
        'nri_well_count': all_one_liner['nri_well_count']['value'],
    }

    return original_cutoff_info, original_well_result_params, all_flat_output, well_input, well_result_dict[
        'time'], one_liner_well_count


def group_economics_final_well(
    well_input,
    group_params,
    original_well_result_params,
    original_cutoff_info,
    is_fiscal_month=False,
):
    # update well_input capex model:
    if group_params:
        well_input['capex_model']['other_capex']['rows'] += group_params.get('allocated_group_capex_model', [])

    well = Well(well_input, is_fiscal_month)
    well_result_dict = well.group_econ_final_well_result_dict(group_params, original_well_result_params,
                                                              original_cutoff_info)
    breakeven_dict, breakeven_unit_dict = well.well_breakeven_results()
    well_output = WellOutput(well.well_input, well_result_dict, well.well_input.date_dict)
    (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras,
     _) = well_output.full_econ_output(breakeven_dict, breakeven_unit_dict, 0, None, is_fiscal_month)
    warning_message = well.warning_message()

    return {
        'well_result_dict': well_result_dict,
        'flat_output': selected_flat_output,
        'one_liner': one_liner,
        'all_flat_output': all_flat_output,
        'all_one_liner': all_one_liner,
        'nested_output_paras': nested_output_paras,
        'warning': warning_message,
    }


class Well:
    def __init__(self, well_input: WellInput, is_fiscal_month: bool, feature_flags: Optional[dict[str, bool]] = None):
        self.is_fiscal_month = is_fiscal_month
        self.well_input = well_input
        self.well_result_params = {}
        self.feature_flags = feature_flags
        self.simple_econ: Callable = self.simple_econ_func()

    def warning_message(self):
        warning_list = self.well_input.warning_list
        warning_message = process_warning_message(warning_list)
        return warning_message

    def simple_econ_func(self):
        '''Return a function that executes all calculations in a queue of EconCalculation objects, based on the queue
        specified in the create_queue method.
        '''
        calculation_factory = CalculationFactory(CALCULATIONS)
        income_tax = self.well_input.tax_option

        calculation_queue = calculation_factory.econ_calculation_queue(self.is_fiscal_month, income_tax)

        return calculation_function_on_queue(calculation_queue, WellResult)

    def group_simple_econ_func(self):
        '''Return a function that executes all calculations in a queue of EconCalculation objects, based on the queue
        specified in the create_queue method.
        '''
        calculation_factory = CalculationFactory(GROUP_CALCULATIONS)
        income_tax = self.well_input.tax_option

        calculation_queue = calculation_factory.econ_calculation_queue(self.is_fiscal_month, income_tax)

        return calculation_function_on_queue(calculation_queue, WellResult)

    def calculate_reversion(self):
        (ownership_params, t_ownership,
         rev_dates_detail) = final_ownership_and_reversion_dates(self.simple_econ,
                                                                 self.well_input,
                                                                 feature_flags=self.feature_flags)

        self.well_result_params['ownership_params'] = ownership_params
        self.well_result_params['t_ownership'] = t_ownership
        self.well_result_params['rev_dates_detail'] = rev_dates_detail

        # save it elsewhere in the future
        self.well_input['date_dict']['rev_dates'] = [r['date'] for r in rev_dates_detail]

    def calculate_cutoff(self):
        (cutoff_date, unecon_bool) = cutoff_results(self.simple_econ,
                                                    self.well_input,
                                                    self.well_result_params,
                                                    feature_flags=self.feature_flags)

        self.well_result_params['unecon_bool'] = unecon_bool
        self.well_input.ecl_capex_update_date_dict(cutoff_date, unecon_bool)

    def calculate_group_econ_individual_cutoff(self):
        # calculate original cutoff
        (cutoff_date, unecon_bool, cutoff_well_result) = cutoff_results(self.simple_econ, self.well_input,
                                                                        self.well_result_params, True)

        self.original_cutoff_info = {
            'cutoff_date': cutoff_date,
            'unecon_bool': unecon_bool,
            'cutoff_well_result': cutoff_well_result
        }

        # let well run with no cutoff for future cutoff adjustment related to group settings
        self.well_result_params['unecon_bool'] = False
        self.well_input.ecl_capex_update_date_dict(self.well_input.date_dict['cf_end_date'], False)

    def well_result_dict(self):
        '''Calculates economics and save results to self.well_result
        '''
        self.calculate_reversion()
        self.calculate_cutoff()
        self.well_result_params['is_complete'] = True

        self.well_result: WellResult = self.simple_econ(
            self.well_input, self.well_result_params, self.feature_flags)  # will cause bug when using self.simple_econ
        return self.well_result.simple_econ_result()

    # for group Econ 1st by well run
    def group_econ_individual_well_result_dict(self):
        self.calculate_reversion()
        self.calculate_group_econ_individual_cutoff()
        self.well_result_params['is_complete'] = True

        self.group_econ_individual_well_result: WellResult = self.simple_econ(self.well_input, self.well_result_params)
        return self.group_econ_individual_well_result.simple_econ_result()

    def group_econ_final_well_result_dict(self, group_params, original_well_result_params, original_cutoff_info):
        if group_params is not None:
            group_econ_func: Callable = self.group_simple_econ_func()
            self.well_result_params.update({
                **group_params,
                'unecon_bool': group_params['unecon_bool'],
            })
            # update cf start date due to capex prior to as of date maybe allocated
            self.well_input.date_dict = self.well_input._start_extended_date_dict(self.well_input.date_dict)
            # update econ life using original cutoff date and group ecl
            self.well_input.ecl_capex_update_date_dict(group_params['final_cutoff_date'], group_params['unecon_bool'])
        else:
            group_econ_func: Callable = self.simple_econ_func()
            self.well_result_params.update({
                **original_well_result_params,
                'unecon_bool':
                original_cutoff_info['unecon_bool'],
            })
            self.well_input.ecl_capex_update_date_dict(original_cutoff_info['cutoff_date'],
                                                       original_cutoff_info['unecon_bool'])
        self.group_econ_final_well_result: WellResult = group_econ_func(self.well_input, self.well_result_params)
        return self.group_econ_final_well_result.simple_econ_result()

    def well_breakeven_results(self):
        breakeven_dict, breakeven_unit_dict = breakeven_results(self.simple_econ, self.well_input,
                                                                self.well_result_params['unecon_bool'])
        return breakeven_dict, breakeven_unit_dict
