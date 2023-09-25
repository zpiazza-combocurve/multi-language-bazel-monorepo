import copy
import numpy as np
from combocurve.science.econ.general_functions import get_discount_key, FORECAST_PARAMS_ONE_LINER_KEYS
from combocurve.services.econ.econ_columns import (BASIC_HEADER, SUGGESTED_HEADER, OTHER_HEADER, QUALIFIER_NAME_HEADER,
                                                   WELL_COUNT_HEADER)
from combocurve.science.econ.general_functions import date_str_format_change
from combocurve.science.econ.group_econ.additional_columns import GROUP_ECON_COLUMNS, GROUP_ECON_COLUMN_FIELDS
from combocurve.shared.parquet_types import to_date
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES


def get_discount_column_name_map(discount_table):
    first_pct_str = get_discount_key(discount_table['first_discount'], 1)
    second_pct_str = get_discount_key(discount_table['second_discount'], 1)
    return {
        'first_discount_cash_flow': f'{first_pct_str} Discount Cash Flow',
        'second_discount_cash_flow': f'{second_pct_str} Discount Cash Flow',
        'afit_first_discount_cash_flow': f'{first_pct_str} After Income Tax Discount Cash Flow',
        'afit_second_discount_cash_flow': f'{second_pct_str} After Income Tax Discount Cash Flow',
        'first_discounted_capex': f'{first_pct_str} Discount Total Net CAPEX',
        'second_discounted_capex': f'{second_pct_str} Discount Total Net CAPEX',
        'first_discount_net_income': f'{first_pct_str} Discount Net Operating Income',
        'second_discount_net_income': f'{second_pct_str} Discount Net Operating Income',
    }


def update_discount_col_name(general_options, column_fields):
    # flexible discount column name
    disc_col_name_dict = get_discount_column_name_map(general_options['discount_table'])

    # update col name
    for key in disc_col_name_dict.keys():
        column_fields[key]['label'] = disc_col_name_dict[key]


class PostProcess:
    """Static methods

    To be exported to other modules including big_query, get_nested_econ_result, econ_service and
    econ_file_service.
    """
    @staticmethod
    def unit_to_multiplier(unit):
        ignored_units = [
            'BBL', 'MCF', '$', '$/BBL', '$/MCF', 'BBL/FT', 'x', 'years', 'months', 'CF/BBL', 'MBTU/MCF', 'MCF/FT'
        ]
        if unit in ignored_units or unit is None or unit == '':
            multiplier = 1
        elif unit in ['MBBL', 'MMCF', 'M$']:
            multiplier = 1 / 1000
        elif unit in ['MMBBL', 'BCF', 'MM$']:
            multiplier = 1 / 1000000
        elif unit == '%':
            multiplier = 100
        elif unit == 'BBL/MMCF':
            multiplier = 1000
        elif unit == 'GAL':
            multiplier = 42
        elif unit == 'MGAL':
            multiplier = 42 / 1000
        elif unit == 'MMGAL':
            multiplier = 42 / 1000000
        else:
            # unit is not known to the function
            multiplier = 1

        return multiplier

    @staticmethod
    def get_unit(reporting_units, this_display_template):
        if 'unit_key' in this_display_template.keys():
            this_unit = reporting_units[this_display_template['unit_key']]
        else:
            this_unit = this_display_template['unit']

        return this_unit

    @staticmethod
    def get_total(value_list, method, unit, additional):
        multiplier = PostProcess.unit_to_multiplier(unit)
        total = 0
        if method is None:
            total = np.sum(value_list)
        elif method == 'divide':
            if np.sum(additional['denominator']) != 0:
                total = (np.sum(additional['numerator']) / np.sum(additional['denominator'])) * multiplier
            else:
                total = np.mean(value_list)
        elif method == 'average':
            weights = additional.get('weight', None)
            if weights is None or np.sum(weights) == 0:
                # calculate sample mean instead
                total = np.mean(value_list)
            else:
                total = np.average(value_list, axis=None, weights=weights)
        return float(total)

    @staticmethod
    def get_nested_output_paras(output_params):
        # used in generate res cat group sum nested format
        columns = output_params['columns']
        column_fields = output_params['columnFields']
        general_options = output_params['generalOptions']

        ## reporting_unit
        # TODO: merge 3 duplicated adding unit logic in this file
        reporting_units = copy.copy(general_options['reporting_units'])
        reporting_units['oil_price'] = '$/BBL'
        reporting_units['gas_price'] = '$/MCF'
        reporting_units['ngl_price'] = '$/BBL'
        reporting_units['drip_condensate_price'] = '$/BBL'
        reporting_units['boe'] = reporting_units['oil']
        reporting_units['mcfe'] = reporting_units['gas']

        ## report_period
        report_period = general_options['main_options']['reporting_period']
        if report_period == 'fiscal':
            fiscal = general_options['main_options']['fiscal']
        else:
            fiscal = '0-11'

        ## disc_col_name
        disc_col_name_dict = get_discount_column_name_map(general_options['discount_table'])

        ## unit_dict, name_dict and ignore_columns
        unit_dict = {}
        name_dict = {}
        reliance_key_set = set()

        selected_columns_key_list = []

        for col in columns:
            this_col_key = col['key']
            this_display_template = column_fields[this_col_key]

            if this_col_key == 'date':
                continue

            if PostProcess.skip_col(col):
                continue

            # reliance
            if 'reliance' in this_display_template.keys():
                method = this_display_template['reliance'].get('method', 'divide')
                for reliance_key in this_display_template['reliance'].keys():
                    if this_display_template['reliance'][reliance_key] == method:
                        continue
                    else:
                        rel_col = this_display_template['reliance'][reliance_key]
                        unit_dict[rel_col] = PostProcess.get_unit(reporting_units, column_fields[rel_col])
                        reliance_key_set.update([rel_col])

            ## unit and name
            if 'unit_key' in this_display_template.keys():
                this_unit = reporting_units[this_display_template['unit_key']]
            else:
                this_unit = this_display_template['unit']

            if this_col_key in disc_col_name_dict.keys():
                this_name = disc_col_name_dict[this_col_key]
            else:
                this_name = this_display_template['label']

            unit_dict[this_col_key] = this_unit
            name_dict[this_col_key] = this_name

            ## selected_columns
            if col['selected_options']['monthly'] is True:
                selected_columns_key_list.append(this_col_key)

            if col['selected_options']['aggregate'] is True:
                agg_key = 'cum_' + this_col_key
                unit_dict[agg_key] = this_unit
                name_dict[agg_key] = 'Cum ' + this_name

        # well count columns
        for k in WELL_COUNT_HEADER:
            unit_dict[k] = ''
            name_dict[k] = WELL_COUNT_HEADER[k]

        ignore_columns = []
        for key in reliance_key_set:
            if key not in selected_columns_key_list:
                ignore_columns.append(key)

        nested_output_paras = {
            'unit_dict': unit_dict,
            'name_dict': name_dict,
            'ignore_columns': ignore_columns,
            'fiscal': fiscal
        }

        return nested_output_paras

    @staticmethod
    def get_col_number(columns, general_options):
        ## main_options
        main_options = general_options['main_options']
        if main_options['income_tax'] == 'no':
            have_income_tax = False
        else:
            have_income_tax = True

        selected_key_list = []

        for col in columns:
            this_col_key = col['key']

            if PostProcess.skip_col(col):
                continue

            if not have_income_tax:
                if this_col_key in [
                        'depreciation', 'taxable_income', 'state_income_tax', 'federal_income_tax',
                        'after_income_tax_cash_flow'
                ]:
                    continue

            ## selected_columns
            if col['selected_options']['monthly'] is True:
                selected_key_list.append(this_col_key)

            if col['selected_options']['aggregate'] is True:
                agg_key = 'cum_' + this_col_key
                selected_key_list.append(agg_key)

        return len(selected_key_list) + 1  # + 1 for date column

    # TODO: refactor this function, it no longer needed for header generation (which moved to custom CSV logic)
    @staticmethod
    def get_econ_file_header(columns,
                             column_fields,
                             general_options,
                             group_by_cols,
                             suggested_headers=False,
                             include_cum=True):
        ## reporting_unit
        reporting_units = copy.copy(general_options['reporting_units'])
        reporting_units['oil_price'] = '$/BBL'
        reporting_units['gas_price'] = '$/MCF'
        reporting_units['ngl_price'] = '$/BBL'
        reporting_units['drip_condensate_price'] = '$/BBL'
        reporting_units['boe'] = reporting_units['oil']
        reporting_units['mcfe'] = reporting_units['gas']

        ## main_options
        main_options = general_options['main_options']
        if main_options['income_tax'] == 'no':
            have_income_tax = False
        else:
            have_income_tax = True

        ## disount table
        discount_table = general_options['discount_table']
        first_pct_str = get_discount_key(discount_table['first_discount'], 1)
        second_pct_str = get_discount_key(discount_table['second_discount'], 1)
        disc_col_name_dict = {
            'first_discount_cash_flow': first_pct_str + ' Discount Cash Flow',
            'second_discount_cash_flow': second_pct_str + ' Discount Cash Flow',
        }

        discount_rate_list = [x['discount_table'] for x in discount_table['rows']]
        for i in range(len(discount_rate_list)):
            this_pct_str = get_discount_key(discount_rate_list[i])
            disc_col_name_dict[f'discount_table_cash_flow_{i+1}'] = this_pct_str + ' Discount Cash Flow'

        ## update col name
        for key in disc_col_name_dict.keys():
            column_fields[key]['label'] = disc_col_name_dict[key]

        unit_dict = {}
        name_dict = {}
        reliance_key_set = set()

        selected_key_list = []  # selected either monthly or cum
        cum_col_key_list = []  # selected cum (no matter if selected monthly)
        cum_col_additional_keys = []  # selected cum but not monthly

        for col in columns:
            this_col_key = col['key']
            this_display_template = column_fields[this_col_key]

            if PostProcess.skip_col(col):
                continue

            if not have_income_tax:
                if this_col_key in [
                        'depreciation', 'taxable_income', 'after_income_tax_cash_flow', 'afit_first_discount_cash_flow',
                        'afit_second_discount_cash_flow', 'tangible_depreciation', 'intangible_depreciation',
                        'depletion', 'tangible_depletion', 'intangible_depletion', 'percentage_depletion',
                        'total_deductions', 'state_tax_rate', 'federal_tax_rate', 'state_income_tax',
                        'federal_income_tax'
                ]:
                    continue

            ## unit and name
            this_unit = PostProcess.get_unit(reporting_units, this_display_template)
            this_name = this_display_template['label']

            unit_dict[this_col_key] = this_unit
            name_dict[this_col_key] = this_name

            # reliance
            if 'reliance' in this_display_template.keys():
                method = this_display_template['reliance'].get('method', 'divide')
                for reliance_key in this_display_template['reliance'].keys():
                    if this_display_template['reliance'][reliance_key] == method:
                        continue
                    else:
                        rel_col = this_display_template['reliance'][reliance_key]
                        unit_dict[rel_col] = PostProcess.get_unit(reporting_units, column_fields[rel_col])
                        reliance_key_set.update([rel_col])

            ## selected_columns
            if col['selected_options']['monthly'] is True:
                selected_key_list.append(this_col_key)

            if col['selected_options']['aggregate'] is True and include_cum:
                cum_col_key_list.append(this_col_key)
                if col['selected_options']['monthly'] is False:
                    selected_key_list.append(this_col_key)  # be careful with this, not monthly but cum will be added
                    cum_col_additional_keys.append(this_col_key)

        additional_key_list = []  # not selected monthly, but need in calculation
        for key in reliance_key_set:
            if key not in set(selected_key_list) - set(cum_col_additional_keys):  # need to remove key added by cum cols
                additional_key_list.append(key)

        header = list(BASIC_HEADER.values())

        if suggested_headers:
            header += list(SUGGESTED_HEADER.values())

        header += list(OTHER_HEADER.values())

        group_header = ['Project Name', 'Scenario Name', 'User Name', 'Combo Name'] + list(
            QUALIFIER_NAME_HEADER.values()) + ['Created At', *group_by_cols, 'Group', 'Date'] + list(
                WELL_COUNT_HEADER.values())

        for k in selected_key_list:
            if k not in cum_col_additional_keys:
                # header
                this_name = name_dict[k]
                this_unit = unit_dict[k]
                this_header = f'{this_name} ({this_unit})' if this_unit else this_name
                header.append(this_header)
                group_header.append(this_header)
            # add its cumulative sum column to header as well
            if k in cum_col_key_list:
                this_name = 'Cum ' + name_dict[k]
                this_unit = unit_dict[k]
                this_header = f'{this_name} ({this_unit})' if this_unit else this_name
                header.append(this_header)
                group_header.append(this_header)

        return header, group_header, selected_key_list, additional_key_list, cum_col_key_list, cum_col_additional_keys

    @staticmethod
    def skip_col(col):  # skip column logic for monthly result
        if sum(col['selected_options'].values()) == 0:
            # if no column is selected
            return True

        if col['selected_options']['one_liner'] is True and sum(col['selected_options'].values()) == 1:
            # if only one liner is selected
            return True

        return False

    @staticmethod
    def get_processed_econ_outputs(
        well_input,
        time_list,
        columns,
        column_fields,
        all_column_dict,
        reporting_units,
        apply_unit=True,
        add_group_econ_cols=False,
    ):
        """Return the processed data to controller

        Organizes the raw outputs from econ calculation and computes additional metrics
        """
        all_keys = set(all_column_dict.keys())

        unit_dict = {}
        name_dict = {}
        reliance_key_set = set()

        selected_flat_output = {'date': all_column_dict['date']}
        all_flat_output = {'date': all_column_dict['date']}

        one_liner = {}
        all_one_liner = {}

        one_liner_order = 1

        if add_group_econ_cols:
            columns = columns + GROUP_ECON_COLUMNS
            column_fields = {**column_fields, **GROUP_ECON_COLUMN_FIELDS}

        for col in columns:
            this_col_key = col['key']
            this_display_template = column_fields[this_col_key]

            if this_col_key not in all_keys or this_col_key == 'date':
                continue

            ## unit and name
            this_unit = PostProcess.get_unit(reporting_units, this_display_template)
            this_name = this_display_template['label']

            unit_dict[this_col_key] = this_unit
            name_dict[this_col_key] = this_name

            # reliance
            method, additional, this_reliance_dict = PostProcess.handle_reliance(this_display_template, all_column_dict)
            reliance_key_set.update(this_reliance_dict)

            if apply_unit:
                this_multiplier = PostProcess.unit_to_multiplier(this_unit)
            else:
                this_multiplier = 1

            ## monthly columns
            if this_display_template['options']['monthly'] is True:

                all_flat_output[this_col_key] = np.multiply(all_column_dict[this_col_key], this_multiplier).tolist()

                if col['selected_options']['monthly'] is True:
                    selected_flat_output[this_col_key] = all_flat_output[this_col_key]

            if col['selected_options']['aggregate'] is True:
                agg_key = 'cum_' + this_col_key
                unit_dict[agg_key] = this_unit
                name_dict[agg_key] = 'Cum ' + this_name
                selected_flat_output[agg_key] = np.multiply(np.cumsum(all_column_dict[this_col_key]),
                                                            this_multiplier).tolist()

            ## selected one liner
            if this_display_template['options']['one_liner'] is True:
                this_value = all_column_dict[this_col_key]
                # for columns which have one liner
                if this_display_template['options']['monthly'] is True:
                    this_value = all_flat_output[this_col_key]
                else:
                    # for one-liner only columns
                    if this_display_template['type'] == 'number':
                        this_value = this_multiplier * this_value if this_value is not None else None

                if this_col_key in FORECAST_PARAMS_ONE_LINER_KEYS:  # special handle for forecast parameters
                    for elem in this_value:
                        all_one_liner[elem['key']] = elem
                        if col['selected_options']['one_liner'] is True:
                            elem['order'] = one_liner_order
                            one_liner[elem['key']] = elem
                            one_liner_order += 1
                    continue

                if isinstance(this_value, (np.ndarray, list)):  # for the columns that have both monthly and one liner
                    this_value = PostProcess.get_total(this_value, method, this_unit, additional)

                if this_value not in [None, float('inf'), float('-inf')] and type(this_value) is not str:
                    # convert numpy type to py type
                    if np.isnan(this_value):
                        this_value = None
                    else:
                        this_value = int(this_value) if int(this_value) == this_value else float(this_value)

                this_one_liner = {
                    'key': this_col_key,
                    'name': this_name,
                    'unit': this_unit,
                    'type': this_display_template['type'],
                    'value': this_value,
                }

                all_one_liner[this_col_key] = this_one_liner

                if col['selected_options']['one_liner'] is True:
                    this_one_liner['order'] = one_liner_order
                    one_liner[this_col_key] = this_one_liner
                    one_liner_order += 1

        ignore_columns = []
        for key in reliance_key_set:
            if key not in selected_flat_output.keys():
                this_multiplier = PostProcess.unit_to_multiplier(unit_dict[key])
                selected_flat_output[key] = np.multiply(all_column_dict[key], this_multiplier).tolist()
                ignore_columns.append(key)

        PostProcess.add_only_bg_cols(time_list, all_column_dict, all_flat_output)

        PostProcess.add_only_bg_one_liner(all_column_dict, all_one_liner)

        # report_period
        report_period = well_input['general_option_model']['main_options']['reporting_period']
        if report_period == 'fiscal':
            fiscal = well_input['general_option_model']['main_options']['fiscal']
        else:
            fiscal = '0-11'
            # add well count columns to all_flat_output (will be used in res cat group sum)

        nested_output_paras = {
            'unit_dict': unit_dict,
            'name_dict': name_dict,
            'ignore_columns': ignore_columns,
            'fiscal': fiscal
        }

        return (selected_flat_output, all_flat_output, one_liner, all_one_liner, nested_output_paras)

    @staticmethod
    def get_disc_col_names(discount_name):
        first_pct_str = discount_name['first_discount']
        second_pct_str = discount_name['second_discount']
        discount_table_list = discount_name['discount_table']

        disc_col_name_dict = {
            'first_discount_cash_flow': first_pct_str + ' Discount Cash Flow',
            'second_discount_cash_flow': second_pct_str + ' Discount Cash Flow',
            'first_discount_roi': first_pct_str + ' Discount ROI w/ Discounted CAPEX',
            'second_discount_roi': second_pct_str + ' Discount ROI w/ Discounted CAPEX',
            'first_discount_roi_undiscounted_capex': first_pct_str + ' Discount ROI w/ Undiscounted CAPEX',
            'second_discount_roi_undiscounted_capex': second_pct_str + ' Discount ROI w/ Undiscounted CAPEX',
            'first_discounted_capex': first_pct_str + ' Discount Total Net CAPEX',
            'second_discounted_capex': second_pct_str + ' Discount Total Net CAPEX',
            'first_discount_net_income': first_pct_str + ' Discount Net Operating Income',
            'second_discount_net_income': second_pct_str + ' Discount Net Operating Income',
            'first_discount_payout': first_pct_str + ' Discount Payout Date',
            'second_discount_payout': second_pct_str + ' Discount Payout Date',
            'first_discount_payout_duration': first_pct_str + ' Discount Payout Duration',
            'second_discount_payout_duration': second_pct_str + ' Discount Payout Duration',

            #AFIT
            'afit_first_discount_cash_flow': first_pct_str + ' After Income Tax Discount Cash Flow',
            'afit_second_discount_cash_flow': second_pct_str + ' After Income Tax Discount Cash Flow',
            'afit_first_discount_roi': first_pct_str + ' After Income Tax Discount ROI w/ Discounted CAPEX',
            'afit_second_discount_roi': second_pct_str + ' After Income Tax Discount ROI w/ Discounted CAPEX',
            'afit_first_discount_roi_undiscounted_capex':
            first_pct_str + ' After Income Tax Discount ROI w/ Undiscounted CAPEX',
            'afit_second_discount_roi_undiscounted_capex':
            second_pct_str + ' After Income Tax Discount ROI w/ Undiscounted CAPEX',
            'afit_first_discount_payout': first_pct_str + ' After Income Tax Discount Payout Date',
            'afit_second_discount_payout': second_pct_str + ' After Income Tax Discount Payout Date',
            'afit_first_discount_payout_duration': first_pct_str + ' After Income Tax Discount Payout Duration',
            'afit_second_discount_payout_duration': second_pct_str + ' After Income Tax Discount Payout Duration',
        }
        for i in range(len(discount_table_list)):
            this_pct_str = discount_table_list[i]
            disc_col_name_dict[f'discount_table_cash_flow_{i+1}'] = this_pct_str + ' Discount Cash Flow'
            disc_col_name_dict[f'afit_discount_table_cash_flow_{i+1}'] = 'AFIT ' + this_pct_str + ' Discount Cash Flow'

        return disc_col_name_dict

    @staticmethod
    def negative_cf(bfit_cf, date_array):
        neg_flag_array = np.array(bfit_cf) < 0

        start_idx_list = []
        end_idx_list = []
        consec_neg_list = []

        neg_flag_len = len(neg_flag_array)

        for i, v in enumerate(neg_flag_array):
            # start index
            if i == 0:
                if v == 1:
                    start_idx_list.append(i)
            else:
                if v == 1 and neg_flag_array[i - 1] == 0:
                    start_idx_list.append(i)
            # end index
            if i == neg_flag_len - 1:
                if v == 1:
                    end_idx_list.append(i)
            else:
                if v == 1 and neg_flag_array[i + 1] == 0:
                    end_idx_list.append(i)

        for i in range(len(start_idx_list)):
            start_idx = start_idx_list[i]
            end_idx = end_idx_list[i]
            if start_idx < end_idx:
                consec_neg_list.append([start_idx, end_idx])

        consec_neg = None
        first_consec_neg = None
        last_consec_neg = None
        consec_neg_count = 0

        if len(consec_neg_list) > 0:

            consec_neg = ''
            for i, period in enumerate(consec_neg_list):
                period_start = date_str_format_change(date_array[period[0]], 'M')
                period_end = date_str_format_change(date_array[period[-1]], 'M')
                neg_period = f'{period_start} - {period_end}'

                if i == len(consec_neg_list) - 1:
                    consec_neg += neg_period
                else:
                    consec_neg += neg_period + ', '

                consec_neg_count += period[-1] - period[0] + 1

            first_consec_neg = date_str_format_change(date_array[consec_neg_list[0][0]], 'M')
            last_consec_neg = date_str_format_change(date_array[consec_neg_list[-1][-1]], 'M')

        total_neg = int(sum(neg_flag_array))

        neg_cf_dict = {
            'consecutive_negative_cash_flow_months': consec_neg,
            'first_consecutive_negative_cash_flow_month': first_consec_neg,
            'last_consecutive_negative_cash_flow_month': last_consec_neg,
            'consecutive_negative_cash_flow_month_count': consec_neg_count,
            'total_negative_cash_flow_month_count': total_neg
        }

        return neg_cf_dict

    @staticmethod
    def add_only_bg_cols(time_list, all_column_dict, all_flat_output):
        total_len = len(time_list)

        # well count
        for key in WELL_COUNT_HEADER.keys():
            all_flat_output[key] = all_column_dict[key]

        # one liner columns
        for p in ALL_PHASES:
            field_key = f'{p}_start_using_forecast_date'
            this_start = all_column_dict.get(field_key)
            if this_start:
                start_components = this_start.split('/')
                this_start = f'{start_components[2]}-{start_components[0]}-{start_components[1]}'
                all_flat_output[field_key] = [this_start] * total_len

        all_flat_output['econ_first_production_date'] = [to_date(all_column_dict['econ_first_production_date'])
                                                         ] * total_len
        all_flat_output['gor'] = [all_column_dict.get('gor')] * total_len
        all_flat_output['wor'] = [all_column_dict.get('wor')] * total_len
        all_flat_output['water_cut'] = [all_column_dict.get('water_cut')] * total_len
        all_flat_output['reversion_date'] = [all_column_dict.get('reversion_date')] * total_len

    @staticmethod
    def add_only_bg_one_liner(all_column_dict, all_one_liner):
        # well count
        for key in WELL_COUNT_HEADER.keys():
            all_one_liner[key] = {
                'key': key,
                'value': max(all_column_dict[key]),
            }

    @staticmethod
    def handle_reliance(display_template, all_column_dict):
        method = None
        additional = {}
        this_reliance_dict = set()
        if 'reliance' in display_template.keys():
            method = display_template['reliance'].get('method', 'divide')
            for reliance_key in display_template['reliance'].keys():
                if display_template['reliance'][reliance_key] == method:
                    continue
                else:
                    additional[reliance_key] = all_column_dict[display_template['reliance'][reliance_key]]
                    this_reliance_dict.update([display_template['reliance'][reliance_key]])

        return method, additional, this_reliance_dict
