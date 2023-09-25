from typing import Optional

from combocurve.science.econ.econ_output.econ_output_data import flatten_econ_log
from combocurve.science.econ.incremental import econ_log_subtraction
from combocurve.science.econ.general_functions import date_str_format_change
from combocurve.science.econ.econ_calculations.summary import get_all_summaries
from combocurve.science.econ.econ_calculations.discounted_cashflow import DISCOUNT_TABLE_CF_PREFIX
from combocurve.science.econ.post_process import PostProcess
import copy

NPI_REV_NON_ZERO_FIELDS = [
    'date',
    'gross_oil_well_head_volume',
    'gross_gas_well_head_volume',
    'gross_boe_well_head_volume',
    'gross_mcfe_well_head_volume',
    'gross_mcfe_sales_volume',
    'gross_water_well_head_volume',
    'gross_oil_sales_volume',
    'gross_gas_sales_volume',
    'gross_ngl_sales_volume',
    'gross_drip_condensate_sales_volume',
    'gross_boe_sales_volume',
    'oil_price',
    'gas_price',
    'ngl_price',
    'drip_condensate_price',
    'net_profit',
    'before_income_tax_cash_flow',
    'first_discount_cash_flow',
    'second_discount_cash_flow',
    'afit_first_discount_cash_flow',
    'afit_second_discount_cash_flow',
    'depreciation',
    'taxable_income',
    'state_income_tax',
    'federal_income_tax',
    'after_income_tax_cash_flow',
    'gross_well_count',
    'wi_well_count',
    'nri_well_count',
]


class WellOutput():
    def __init__(self,
                 well_input,
                 simple_econ_output: dict,
                 date_dict: dict,
                 feature_flags: Optional[dict[str, bool]] = None):
        # TODO: take in well_result and save it in a better form
        self.well_input = well_input
        self.monthly_econ_result = simple_econ_output
        self.date_dict = date_dict
        self.feature_flags = feature_flags

    def full_econ_output(
        self,
        breakeven_dict,
        breakeven_unit_dict,
        incremental_index,
        base_case_flat_log,
        is_fiscal_month,
        apply_unit=True,
        add_group_econ_cols=False,
        is_group_case: bool = False,
    ):

        flat_econ_log = flatten_econ_log(self.monthly_econ_result)
        columns = self.well_input['columns']
        column_fields = self.well_input['column_fields']
        reporting_units = copy.copy(self.well_input['general_option_model']['reporting_units'])

        # process column fields
        all_log_discount_name = self.monthly_econ_result['bfit_disc']['discount_name']
        disc_col_name_dict = PostProcess.get_disc_col_names(all_log_discount_name)
        for key in disc_col_name_dict.keys():
            if key in column_fields:
                column_fields[key]['label'] = disc_col_name_dict[key]
            else:
                column_fields.update({key: {'label': disc_col_name_dict[key]}})

        # add additional reporting unit
        reporting_units['oil_price'] = '$/BBL'
        reporting_units['gas_price'] = '$/MCF'
        reporting_units['ngl_price'] = '$/BBL'
        reporting_units['drip_condensate_price'] = '$/BBL'
        reporting_units['boe'] = reporting_units['oil']
        reporting_units['mcfe'] = reporting_units['gas']

        # handle incremental
        if incremental_index > 0 and base_case_flat_log:
            flat_econ_log = econ_log_subtraction(flat_econ_log, base_case_flat_log)

        # convert econ results to columns in a flat dictionary, and calculate one-liner with some additional columns
        unecon_bool = self.monthly_econ_result['unecon_bool']
        all_column_dict = self.calculate_additional_econ_result(breakeven_dict, flat_econ_log, is_fiscal_month,
                                                                unecon_bool, is_group_case)
        reporting_units.update(breakeven_unit_dict)

        # calculate total values and convert units for the final econ results
        time_list = self.monthly_econ_result['time']
        (selected_flat_output, all_flat_output, one_liner, all_one_liner,
         nested_output_paras) = PostProcess.get_processed_econ_outputs(self.well_input, time_list, columns,
                                                                       column_fields, all_column_dict, reporting_units,
                                                                       apply_unit, add_group_econ_cols)

        return (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras, flat_econ_log)

    def calculate_additional_econ_result(
        self,
        breakeven_dict,
        flat_econ_log: dict,
        is_fiscal_month: bool,
        unecon_bool: bool,
        is_group_case: bool = False,
    ):
        '''
        currently it is only used for calculating breakeven, but we will move all post process calculation here
        '''
        # flatten nested econ result
        all_column_dict = {**flat_econ_log}

        bfit_cf = flat_econ_log['before_income_tax_cash_flow']
        date_array = flat_econ_log['date']

        npi_type = (self.well_input['ownership_model']['ownership']['initial_ownership']['net_profit_interest_type'])

        # TODO: define this constant elsewhere
        if npi_type == 'revenue':
            for key in all_column_dict.keys():
                if key not in NPI_REV_NON_ZERO_FIELDS and DISCOUNT_TABLE_CF_PREFIX not in key:
                    all_column_dict[key] = [0] * len(all_column_dict[key])

        all_column_dict = {key: list(value) for (key, value) in all_column_dict.items()}

        # add breakeven
        all_column_dict.update(breakeven_dict)

        rev_dates = [date_str_format_change(str(d)) for d in self.date_dict['rev_dates']]
        all_column_dict['reversion_date'] = ', '.join(rev_dates) if rev_dates else None

        # BTU content
        # we used MMBTU/MCF in calculation
        all_column_dict['unshrunk_gas_btu'] = self.well_input['stream_property_model']['btu_content']['unshrunk_gas']
        all_column_dict['shrunk_gas_btu'] = self.well_input['stream_property_model']['btu_content']['shrunk_gas']

        # discount table
        for key in all_column_dict:
            if DISCOUNT_TABLE_CF_PREFIX in key:
                all_column_dict[key] = sum(all_column_dict[key])

        # negative cf
        neg_cf_dict = PostProcess.negative_cf(bfit_cf, date_array)
        for key in neg_cf_dict.keys():
            all_column_dict[key] = neg_cf_dict[key]

        additional_columns = get_all_summaries(self.date_dict,
                                               self.well_input,
                                               flat_econ_log,
                                               is_fiscal_month,
                                               unecon_bool,
                                               is_group_case,
                                               feature_flags=self.feature_flags)
        all_column_dict.update(additional_columns)

        return all_column_dict
