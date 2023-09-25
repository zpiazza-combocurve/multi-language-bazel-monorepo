import numpy as np
from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.escalation import get_escalation_model
from combocurve.shared.econ_tools.econ_model_tools import FIXED_EXP_KEYS
from combocurve.science.econ.econ_model_rows_process import rate_rows_process, rows_process_with_escalation
import copy


class Expense:

    def _pct_of_rev(self, exp_param, unit, revenue_dict, ownership, deal_term):
        exp = exp_param / 100  # param will be percentage on FE
        if any(product in unit for product in ['oil', 'gas', 'ngl', 'drip_condensate']):
            product = unit[7:-4]
            exp = np.multiply(revenue_dict[product]['ownership'][ownership], exp) * deal_term
        elif 'total_rev' in unit:
            exp = np.multiply(exp,
                              (revenue_dict['oil']['ownership'][ownership] + revenue_dict['gas']['ownership'][ownership]
                               + revenue_dict['ngl']['ownership'][ownership]
                               + revenue_dict['drip_condensate']['ownership'][ownership])) * deal_term
        return exp


class FixedExpense(EconCalculation, Expense):

    def __init__(self, date_dict, shut_in_params, fixed_expense_model):
        self.shut_in_params = shut_in_params
        self.date_dict = date_dict
        self.fixed_expense_model = fixed_expense_model

    def _get_fixed_expense_param(self, date_dict, shut_in_params, ownership_volume_dict, well_count):
        fixed_exp_params = []

        for model in self.fixed_expense_model:
            fixed_expenses_py = self._fixed_expenses_pre(model, date_dict, shut_in_params, ownership_volume_dict,
                                                         well_count)

            for key in fixed_expenses_py['fixed_expenses'].keys():
                fixed_exp_params.append({
                    'category': key,  # use category to be consistent with advanced view FE, key is fixed expenses
                    'values': fixed_expenses_py['fixed_expenses'][key],
                    'conditions': fixed_expenses_py['fixed_conditions'][key],
                })

        return fixed_exp_params

    def _fixed_expenses_pre(self, fixed_expenses_input, date_dict, shut_in_params, ownership_volumes, well_count):
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        fixed_conditions = {}
        fixed_expenses = {}

        for key in FIXED_EXP_KEYS:

            one_fixed_expenses = copy.deepcopy(fixed_expenses_input[key])

            rows = one_fixed_expenses['rows']
            row_keys = rows[0].keys()
            value_key = 'fixed_expense_per_well' if 'fixed_expense_per_well' in row_keys else 'fixed_expense'

            # escalation
            escalation_input = get_escalation_model(one_fixed_expenses)
            one_fixed_expenses['escalation_model'] = None

            if self._intersect_with_rate_row_keys(row_keys):
                criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
                rate_type = one_fixed_expenses.get('rate_type', 'gross_well_head')
                rows_cal_method = one_fixed_expenses.get('rows_calculation_method', 'non_monotonic')
                total_fixed_expenses = rate_rows_process(
                    rows,
                    value_key,
                    criteria_key,
                    rate_type,
                    rows_cal_method,
                    ownership_volumes,
                    date_dict,
                )
            else:
                total_fixed_expenses, escalation_params = rows_process_with_escalation(
                    rows,
                    date_dict,
                    fpd,
                    cf_start_date,
                    cf_end_date,
                    value_key,
                    escalation=escalation_input,
                )
                one_fixed_expenses['escalation_model'] = escalation_params

            if 'fixed_expense_per_well' in row_keys:
                total_fixed_expenses *= well_count['gross_well_count']

            fixed_conditions[key] = one_fixed_expenses
            fixed_expenses[key] = total_fixed_expenses

        # shut in
        if shut_in_params:
            multiplier = self._get_shut_in_multiplier(cf_start_date, cf_end_date, shut_in_params)
            for key in FIXED_EXP_KEYS:
                fixed_expenses[key] = fixed_expenses[key] * multiplier

        return {
            'fixed_conditions': fixed_conditions,
            'fixed_expenses': fixed_expenses,
        }

    def _get_shut_in_multiplier(self, cf_start_date, cf_end_date, shut_in_params):
        daily_idx = (np.arange(np.datetime64(cf_start_date),
                               np.datetime64(cf_end_date) + 1) - np.datetime64('1900-01-01')).astype(int)
        fixed_exp_daily_flag = np.ones(len(daily_idx))

        for p in shut_in_params:
            phase_shut_in = shut_in_params[p]
            for s in phase_shut_in:
                if s['fixed_expense'] == 'yes':
                    continue
                else:
                    fixed_exp_daily_flag[(daily_idx >= s['start_idx']) & (daily_idx <= s['end_idx'])] = 0

        monthly_idx = np.arange(np.datetime64(cf_start_date),
                                np.datetime64(cf_end_date) + 1).astype('datetime64[M]').astype(int)
        unique_month = np.unique(monthly_idx)

        if len(fixed_exp_daily_flag) == sum(fixed_exp_daily_flag):  # all 1, no need adjust fixed expense
            return np.ones(len(unique_month))

        multiplier = []
        for m in unique_month:
            this_month_daily_flag = fixed_exp_daily_flag[monthly_idx == m]
            multiplier.append(sum(this_month_daily_flag) / len(this_month_daily_flag))
        return multiplier

    def result(self, ownership_volume_dict, ownership_dict_by_phase, t_all, well_count):
        combined_fixed_expenses = []

        for single_exp_params in self._get_fixed_expense_param(self.date_dict, self.shut_in_params,
                                                               ownership_volume_dict, well_count):
            combined_fixed_expenses.append(
                self._calculate_single_expense(single_exp_params, self.date_dict, t_all, ownership_dict_by_phase))

        return {'fixed_expenses': combined_fixed_expenses}

    def _calculate_single_expense(self, single_exp_params, date_dict, t_all, ownership_dict_by_phase):
        conditions = single_exp_params['conditions']

        # fixed escalation
        total_fixed_expense = self._apply_escalation(single_exp_params['values'], conditions['escalation_model'])

        # fixed cap
        fixed_cap = conditions['cap']
        if fixed_cap != '':
            total_fixed_expense[total_fixed_expense > float(fixed_cap)] = float(fixed_cap)

        fixed_deal_term = conditions['deal_terms']
        if fixed_deal_term == '' or fixed_deal_term is None:
            fixed_deal_term = 1

        # fixed expense
        fixed_ownership = conditions["calculation"]
        fixed_ownership_percent = ownership_dict_by_phase['original'][fixed_ownership]

        multiplier = self._crop_by_month_fraction(t_all, date_dict['first_production_date'], date_dict['cut_off_date'],
                                                  date_dict['cf_start_date'], date_dict['cf_end_date'],
                                                  conditions['stop_at_econ_limit'], conditions['expense_before_fpd'])

        total_fixed_expense = np.multiply(total_fixed_expense, multiplier)

        fixed_expense = np.multiply(np.multiply(total_fixed_expense, fixed_ownership_percent), fixed_deal_term)

        return {
            'category': single_exp_params['category'],
            'values': fixed_expense,
            'affect_econ_limit': conditions['affect_econ_limit'],
            'deduct_before_severance_tax': conditions['deduct_before_severance_tax'],
            'deduct_before_ad_val_tax': conditions['deduct_before_ad_val_tax']
        }


class VariableExpense(EconCalculation, Expense):

    def __init__(self, date_dict, btu_content_dict, variable_expense_model):
        self.date_dict = date_dict
        self.btu_content_dict = btu_content_dict
        self.variable_expense_model = variable_expense_model

    def result(self, ownership_volume_dict, revenue_dict):
        var_expenses = []

        for single_exp_params in self._get_variable_expense_param(ownership_volume_dict, self.date_dict):
            var_expenses.append(self._calculate_single_expense(single_exp_params, ownership_volume_dict, revenue_dict))

        return {'variable_expenses': var_expenses}

    def _get_variable_expense_param(self, ownership_volume_dict, date_dict):
        variable_exp_params = []

        for model in self.variable_expense_model:
            variable_expenses_py = self._variable_expenses_pre(model, date_dict, ownership_volume_dict)

            for key in variable_expenses_py['variable_expenses']:
                for category in variable_expenses_py['variable_expenses'][key]:
                    variable_exp_params.append({
                        'category': category,
                        'key': key,
                        'values': variable_expenses_py['variable_expenses'][key][category],
                        'units': variable_expenses_py['variable_unit'][key][category],
                        'conditions': variable_expenses_py['variable_conditions'][key][category],
                        'escalation': variable_expenses_py['variable_escalation'][key][category]
                    })

        return variable_exp_params

    def _variable_expenses_pre(self, var_expenses_input_dic, date_dict, ownership_volumes):
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        variable_unit = {}
        variable_expenses = {}
        variable_conditions = {}
        variable_escalation = {}

        for key in var_expenses_input_dic:
            if key == 'type_model':  # this key been added for distinguish embedded lookup model and original model
                continue

            variable_unit[key] = {}
            variable_expenses[key] = {}
            variable_conditions[key] = {}
            variable_escalation[key] = {}

            for item in var_expenses_input_dic[key]:
                phase_cat_var_exp = copy.deepcopy(var_expenses_input_dic[key][item])

                rows = phase_cat_var_exp['rows']
                if len(rows) == 0:
                    continue

                # conditions
                variable_conditions[key][item] = phase_cat_var_exp

                # escalation
                variable_escalation[key][item] = None
                escalation_input = get_escalation_model(phase_cat_var_exp)

                # unit and variable_expenses
                row_keys = rows[0].keys()

                value_key = None
                if 'unit_cost' in row_keys:
                    # keep unit_cost for old version of exp model
                    variable_unit[key][item] = 'dollar_per_bbl'
                    value_key = 'unit_cost'
                else:
                    for v_key in self.EXP_UNIT_KEYS:
                        if v_key in row_keys:
                            variable_unit[key][item] = v_key
                            value_key = v_key

                if self._intersect_with_rate_row_keys(row_keys):
                    criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
                    rate_type = phase_cat_var_exp.get('rate_type', 'gross_well_head')
                    rows_cal_method = phase_cat_var_exp.get('rows_calculation_method', 'non_monotonic')
                    variable_expenses[key][item] = rate_rows_process(
                        rows,
                        value_key,
                        criteria_key,
                        rate_type,
                        rows_cal_method,
                        ownership_volumes,
                        date_dict,
                    )
                else:
                    variable_expenses[key][item], variable_escalation[key][item] = rows_process_with_escalation(
                        rows,
                        date_dict,
                        fpd,
                        cf_start_date,
                        cf_end_date,
                        value_key,
                        escalation=escalation_input,
                    )

        return {
            'variable_conditions': variable_conditions,
            'variable_expenses': variable_expenses,
            'variable_unit': variable_unit,
            'variable_escalation': variable_escalation
        }

    def _calculate_single_expense(self, single_exp_params, ownership_volume_dict, revenue_dict):
        ownership = single_exp_params['conditions']['calculation']
        this_v_para = single_exp_params['values']

        # deal term
        this_deal_term = single_exp_params['conditions']['deal_terms']
        if this_deal_term == '' or this_deal_term is None:
            this_deal_term = 1

        # unit
        this_unit = single_exp_params['units']

        if 'pct' in this_unit:  # process % of revenue
            this_v_para = self._pct_of_rev(this_v_para, this_unit, revenue_dict, ownership, this_deal_term)

            return {
                'key': single_exp_params['key'],
                'category': single_exp_params['category'],
                'values': this_v_para,
                'affect_econ_limit': single_exp_params['conditions']['affect_econ_limit'],
                'deduct_before_severance_tax': single_exp_params['conditions']['deduct_before_severance_tax'],
                'deduct_before_ad_val_tax': single_exp_params['conditions']['deduct_before_ad_val_tax']
            }

        # escalation
        this_escalation = single_exp_params['escalation']
        this_v_para = self._apply_escalation(this_v_para, this_escalation)
        # cap
        this_cap = single_exp_params['conditions']['cap']
        if this_cap != '':
            this_v_para[this_v_para > float(this_cap)] = float(this_cap)
        if single_exp_params['key'] in ['oil', 'gas']:
            # oil and gas
            this_shrinkage = single_exp_params['conditions']['shrinkage_condition']
            if this_shrinkage == 'unshrunk':
                if single_exp_params['key'] == 'gas':
                    if this_unit == 'dollar_per_mmbtu':
                        this_v_para = np.multiply(this_v_para, self.btu_content_dict['unshrunk_gas'])
                this_v_para = np.multiply(ownership_volume_dict['unshrunk'][single_exp_params['key']][ownership],
                                          this_v_para) * this_deal_term
            elif this_shrinkage == 'shrunk':
                if single_exp_params['key'] == 'gas':
                    if this_unit == 'dollar_per_mmbtu':
                        this_v_para = np.multiply(this_v_para, self.btu_content_dict['shrunk_gas'])
                this_v_para = np.multiply(ownership_volume_dict['sales'][single_exp_params['key']][ownership],
                                          this_v_para) * this_deal_term

        elif single_exp_params['key'] in ['ngl', 'drip_condensate'
                                          ] and single_exp_params['key'] in ownership_volume_dict['sales']:
            # ngl and drip condensate
            this_v_para = np.multiply(ownership_volume_dict['sales'][single_exp_params['key']][ownership],
                                      this_v_para) * this_deal_term
        elif single_exp_params['key'] == 'other':
            # other variable expense
            this_v_para = np.multiply(ownership_volume_dict['boe']['sales_boe']['boe_' + ownership],
                                      this_v_para) * this_deal_term

        return {
            'key': single_exp_params['key'],
            'category': single_exp_params['category'],
            'values': this_v_para,
            'affect_econ_limit': single_exp_params['conditions']['affect_econ_limit'],
            'deduct_before_severance_tax': single_exp_params['conditions']['deduct_before_severance_tax'],
            'deduct_before_ad_val_tax': single_exp_params['conditions']['deduct_before_ad_val_tax']
        }


class WaterDisposalExpense(EconCalculation, Expense):

    def __init__(self, date_dict, disposal_expense_model):
        self.date_dict = date_dict
        self.disposal_expense_model = disposal_expense_model

    def result(self, ownership_volume_dict, revenue_dict):
        water_disp = []

        for single_exp_params in self._get_water_disposal_expense_param(self.date_dict, ownership_volume_dict):
            water_disp.append(self._calculate_single_expense(single_exp_params, revenue_dict, ownership_volume_dict))

        return {'water_disposal': water_disp}

    def _get_water_disposal_expense_param(self, date_dict, ownership_volume_dict):
        water_disposal_params = []

        for model in self.disposal_expense_model:
            water_disposal_py = self._water_disposal_pre(model, date_dict, ownership_volume_dict)

            water_disposal_params.append({
                'values': water_disposal_py['water_price'],
                'conditions': water_disposal_py['water_conditions'],
                'unit': water_disposal_py['water_unit']
            })

        return water_disposal_params

    def _water_disposal_pre(self, water_dis_input, date_dict, ownership_volumes):
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        water_conditions = copy.deepcopy(water_dis_input)

        water_rows = water_dis_input['rows']

        row_keys = water_rows[0].keys()

        value_key = None
        water_unit = None

        if 'unit_cost' in row_keys:
            # keep unit_cost for old version of exp model
            value_key = 'unit_cost'
            water_unit = 'dollar_per_bbl'
        else:
            for w_key in self.EXP_UNIT_KEYS:
                if w_key in row_keys:
                    value_key = w_key
                    water_unit = w_key

        # escalation
        escalation_input = get_escalation_model(water_conditions)
        water_conditions['escalation_model'] = None

        if self._intersect_with_rate_row_keys(row_keys):
            criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
            rate_type = water_conditions.get('rate_type', 'gross_well_head')
            rows_cal_method = water_conditions.get('rows_calculation_method', 'non_monotonic')
            water_monthly_exp = rate_rows_process(
                water_rows,
                value_key,
                criteria_key,
                rate_type,
                rows_cal_method,
                ownership_volumes,
                date_dict,
            )
        else:
            water_monthly_exp, water_monthly_esca = rows_process_with_escalation(
                water_rows,
                date_dict,
                fpd,
                cf_start_date,
                cf_end_date,
                value_key,
                escalation=escalation_input,
            )
            water_conditions['escalation_model'] = water_monthly_esca

        return {'water_conditions': water_conditions, 'water_price': water_monthly_exp, 'water_unit': water_unit}

    def _calculate_single_expense(self, single_exp_params, revenue_dict, ownership_volume_dict):
        if 'water' in ownership_volume_dict['sales'].keys():
            # ownership
            water_ownership = single_exp_params['conditions']['calculation']

            # water disposal deal_term
            water_deal_term = single_exp_params['conditions']['deal_terms']
            if water_deal_term == '' or water_deal_term is None:
                water_deal_term = 1

            this_v_para = single_exp_params['values']
            ownership = single_exp_params['conditions']['calculation']
            if 'pct' in single_exp_params['unit']:
                water_disp_value = self._pct_of_rev(this_v_para, single_exp_params['unit'], revenue_dict, ownership,
                                                    water_deal_term)

            elif 'per' in single_exp_params['unit']:
                # water disposal escalation
                water_escalation = single_exp_params['conditions']['escalation_model']
                this_v_para = self._apply_escalation(this_v_para, water_escalation)

                # water disposal cap
                water_cap = single_exp_params['conditions']['cap']
                if water_cap != '':
                    this_v_para[this_v_para > float(water_cap)] = float(water_cap)

                water_disp_value = np.multiply(
                    np.multiply(ownership_volume_dict['sales']['water'][water_ownership], this_v_para), water_deal_term)

        else:
            water_disp_value = np.zeros(len(ownership_volume_dict['sales']['time']))

        return {
            'values': water_disp_value,
            'affect_econ_limit': single_exp_params['conditions']['affect_econ_limit'],
            'deduct_before_severance_tax': single_exp_params['conditions']['deduct_before_severance_tax'],
            'deduct_before_ad_val_tax': single_exp_params['conditions']['deduct_before_ad_val_tax']
        }


class CarbonExpense(EconCalculation, Expense):

    def __init__(self, date_dict, ghg_expense_model):
        self.date_dict = date_dict
        self.ghg_expense_model = ghg_expense_model

    def _get_carbon_expense_param(self, date_dict):
        carbon_exp_params = []

        for model in self.ghg_expense_model:
            carbon_expenses_py = self._carbon_expenses_pre(model, date_dict)
            carbon_exp_params.append({
                'values': carbon_expenses_py['carbon_expenses_price'],
                'conditions': carbon_expenses_py['carbon_expenses_conditions'],
                'unit': carbon_expenses_py['carbon_expenses_unit']
            })
        return carbon_exp_params

    def _carbon_expenses_pre(self, carbon_expenses_input, date_dict):
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        carbon_expenses_conditions = dict()
        carbon_expenses_monthly_exp = dict()
        carbon_expenses_unit = dict()

        for comp in carbon_expenses_input:
            if comp in ('category', 'type_model'):
                continue
            this_ghg = carbon_expenses_input[comp]
            carbon_expenses_conditions[comp] = copy.deepcopy(this_ghg)

            carbon_expenses_rows = this_ghg['rows']

            value_key = 'carbon_expense'
            carbon_expenses_unit[comp] = '$/MT'

            # escalation
            escalation_input = get_escalation_model(carbon_expenses_conditions[comp])
            carbon_expenses_conditions[comp]['escalation_model'] = None

            carbon_expenses_monthly_exp[comp], carbon_expenses_monthly_esca = rows_process_with_escalation(
                carbon_expenses_rows,
                date_dict,
                fpd,
                cf_start_date,
                cf_end_date,
                value_key,
                escalation=escalation_input,
            )
            carbon_expenses_conditions[comp]['escalation_model'] = carbon_expenses_monthly_esca

        return {
            'carbon_expenses_conditions': carbon_expenses_conditions,
            'carbon_expenses_price': carbon_expenses_monthly_exp,
            'carbon_expenses_unit': carbon_expenses_unit
        }

    def result(self, carbon_ownership_mass_dict):
        ghg_exp = []
        for single_exp_params in self._get_carbon_expense_param(self.date_dict):
            for comp in carbon_ownership_mass_dict:
                if comp in {'category', 'dates'}:
                    continue
                ghg_exp.append(self._calculate_single_expense(single_exp_params, comp, carbon_ownership_mass_dict))

        return {'carbon_expenses': ghg_exp}

    def _calculate_single_expense(self, single_exp_params, comp, carbon_ownership_mass_dict):
        this_ghg = carbon_ownership_mass_dict[comp]
        this_condition = single_exp_params['conditions'][comp]
        this_price = single_exp_params['values'][comp]
        this_unit = single_exp_params['unit'][comp]
        # ownership
        ghg_ownership = this_condition['calculation']

        # ghg disposal deal_term
        ghg_deal_term = this_condition['deal_terms']
        if ghg_deal_term == '' or ghg_deal_term is None:
            ghg_deal_term = 1

        this_v_para = this_price
        if '/' in this_unit:
            # ghg disposal escalation
            ghg_escalation = this_condition['escalation_model']
            this_v_para = self._apply_escalation(this_v_para, ghg_escalation)

            # ghg disposal cap
            ghg_cap = this_condition['cap']
            if ghg_cap != '':
                this_v_para[this_v_para > float(ghg_cap)] = float(ghg_cap)

            return {
                'category': comp,
                'values': np.multiply(np.multiply(this_ghg[ghg_ownership], this_v_para), ghg_deal_term),
                'affect_econ_limit': single_exp_params['conditions'][comp]['affect_econ_limit'],
                'deduct_before_severance_tax': single_exp_params['conditions'][comp]['deduct_before_severance_tax'],
                'deduct_before_ad_val_tax': single_exp_params['conditions'][comp]['deduct_before_ad_val_tax']
            }
