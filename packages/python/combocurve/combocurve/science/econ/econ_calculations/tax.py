import numpy as np
from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.escalation import get_escalation_model
from combocurve.science.econ.econ_model_rows_process import (rate_rows_process, rows_process_with_escalation,
                                                             rows_process)
import copy
from combocurve.science.econ.helpers import date_to_t
from combocurve.science.econ.general_functions import index_to_py_date
import pandas as pd

# ref (reporting year 2021): https://www.act13-reporting.puc.pa.gov/Modules/Disbursements/FeeSchedule.aspx
PENNSYLVANIA_IMPACT_FEE = pd.DataFrame([[43200 / 12, 48700 / 12, 54000 / 12, 59400 / 12, 64900 / 12],
                                        [32400 / 12, 37800 / 12, 43200 / 12, 48700 / 12, 59400 / 12],
                                        [27100 / 12, 32400 / 12, 32400 / 12, 43200 / 12, 54000 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [10900 / 12, 16200 / 12, 21600 / 12, 21600 / 12, 21600 / 12],
                                        [5300 / 12, 5300 / 12, 10900 / 12, 10900 / 12, 10900 / 12],
                                        [5300 / 12, 5300 / 12, 10900 / 12, 10900 / 12, 10900 / 12],
                                        [5300 / 12, 5300 / 12, 10900 / 12, 10900 / 12, 10900 / 12],
                                        [5300 / 12, 5300 / 12, 10900 / 12, 10900 / 12, 10900 / 12],
                                        [5300 / 12, 5300 / 12, 10900 / 12, 10900 / 12, 10900 / 12]],
                                       columns=[['0-2.25', '2.26-2.99', '3-4.99', '5-5.99', '6-9999.99']])


class TaxDeduct(EconCalculation):
    def result(self, fixed_expenses, variable_expenses, water_disposal, carbon_expenses, ownership_volume_dict):

        t = ownership_volume_dict['sales']['time']

        se_deduct = {
            'oil': np.zeros(len(t)),
            'gas': np.zeros(len(t)),
            'ngl': np.zeros(len(t)),
            'drip_condensate': np.zeros(len(t))
        }
        ad_deduct = np.zeros(len(t))
        # variable expenses
        for var_exp in variable_expenses:
            key = var_exp['key']
            # severance (separate by phase)
            if var_exp['deduct_before_severance_tax'] == 'yes':
                # the default is 'no' and do nothing
                se_deduct[key] = se_deduct[key] + var_exp['values']
            # ad+val tax (only one column)
            if var_exp['deduct_before_ad_val_tax'] == 'yes':
                # the default is 'no' and do nothing
                ad_deduct = ad_deduct + var_exp['values']
        # ad_deduct fixed expense
        for ghg_expense in carbon_expenses:
            if ghg_expense['deduct_before_ad_val_tax'] == 'yes':
                ad_deduct = ad_deduct + ghg_expense['values']
        # ad_deduct ghg expense
        for fixed_exp in fixed_expenses:
            if fixed_exp['deduct_before_ad_val_tax'] == 'yes':
                ad_deduct = ad_deduct + fixed_exp['values']
        # ad_deduct water disposal
        for water_disp in water_disposal:
            if water_disp['deduct_before_ad_val_tax'] == 'yes':
                ad_deduct = ad_deduct + water_disp['values']

        return {'se_deduct': se_deduct, 'ad_deduct': ad_deduct}


class ProductionTax(EconCalculation):
    def __init__(
        self,
        date_dict,
        severance_tax_model,
        ad_valorem_tax_model,
        well_header_info,
        schedule,
    ):
        self.pa_impact_fee = PENNSYLVANIA_IMPACT_FEE
        self.date_dict = date_dict
        self.severance_tax_model = severance_tax_model
        self.ad_valorem_tax_model = ad_valorem_tax_model
        self.well_header_info = well_header_info
        self.schedule = schedule

    def result(
        self,
        revenue_dict,
        ownership_volume_dict,
        ownership_dict_by_phase,
        se_deduct,
        ad_deduct,
        price,
        t_all,
    ):
        severance_tax_params = self._severance_tax_pre(self.severance_tax_model, self.date_dict, ownership_volume_dict)
        ad_valorem_tax_params = self._ad_valorem_tax_pre(self.ad_valorem_tax_model, self.date_dict,
                                                         ownership_volume_dict,
                                                         self.severance_tax_model.get("state", None), price, t_all,
                                                         self.schedule, self.well_header_info)
        ad_valorem_tax_params.update({"state": self.severance_tax_model.get("state", None)})

        production_tax_dict = self.calculate_production_tax(revenue_dict, ownership_volume_dict,
                                                            ownership_dict_by_phase, se_deduct, ad_deduct,
                                                            severance_tax_params, ad_valorem_tax_params, self.date_dict)
        return {'production_tax_dict': production_tax_dict}

    def calculate_production_tax(self, revenue_dict, ownership_volume_dict, ownership_dict_by_phase, se_deduct,
                                 ad_deduct, severance_tax_params, ad_valorem_tax_params, date_dict):
        t_all = ownership_volume_dict['sales']['time']
        lpd = date_dict['cut_off_date']
        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        production_tax_dict = {}

        self.multiplier = self._crop_by_month_fraction(t_all, fpd, lpd, cf_start_date, cf_end_date)

        ## severance tax
        # unit can be '%_of_revenue', '%_of_production' ($/boe, $/bbl, $/mcf) or '$/month'
        total_sev_tax, severance_tax_dict = self.calculate_severance_tax(revenue_dict, ownership_volume_dict,
                                                                         severance_tax_params, ownership_dict_by_phase,
                                                                         se_deduct)

        ## ad valorem tax
        # unit can be '%_of_total_revenue', '$/boe' or '$/month'
        ad_tax = self._calculate_ad_valorem_tax(ownership_volume_dict, ad_valorem_tax_params, revenue_dict, ad_deduct,
                                                total_sev_tax, ownership_dict_by_phase)

        ## total production tax
        total_production_tax = np.add(total_sev_tax, ad_tax)

        production_tax_dict = {
            'time': t_all,
            **severance_tax_dict,
            'ad_valorem_tax': ad_tax,
            'total_production_tax': total_production_tax,
        }

        return production_tax_dict

    def calculate_severance_tax(self, revenue_dict, ownership_volume_dict, severance_tax_params,
                                ownership_dict_by_phase, se_deduct):
        t_all = ownership_volume_dict['sales']['time']
        total_sev_tax = np.zeros(len(t_all))
        se_tax_dict = {}
        if len(severance_tax_params) == 0:
            for key in revenue_dict:
                se_tax_dict[key + '_severance_tax'] = np.zeros(len(t_all))
            return total_sev_tax, se_tax_dict

        se_tax_rate = severance_tax_params['se_tax_rate']
        se_tax_unit = severance_tax_params['se_tax_unit']
        se_tax_escalation = severance_tax_params["se_tax_escalation"]
        se_ownership = severance_tax_params['calculation']
        shrinkage_condition = severance_tax_params.get("shrinkage_condition")
        mapper = {
            "oil": {
                "shrunk": "sales",
                "unshrunk": "unshrunk"
            },
            "gas": {
                "shrunk": "sales",
                "unshrunk": "unshrunk"
            },
            "ngl": {
                "shrunk": "sales",
                "unshrunk": "sales"
            },
            "drip_condensate": {
                "shrunk": "sales",
                "unshrunk": "sales"
            }
        }

        for key in revenue_dict.keys():
            if key == "compositionals":
                # TODO: add severance tax for compositionals - and adjust the comp_phase if needed
                comp_phase = "ngl"
                for comp in revenue_dict.get(key, {}).get(comp_phase, []):
                    se_tax_dict[key + '_' + comp_phase + '_' + comp + '_severance_tax'] = np.zeros(len(t_all))
                continue

            this_se_unit = se_tax_unit[key]
            this_se_rate = se_tax_rate[key]
            this_se_escalation = se_tax_escalation[key]

            # severance tax benifit
            this_se_deduct = se_deduct[key]

            this_se_revenue = revenue_dict[key]["ownership"][se_ownership]

            # volume for severance tax
            this_sev_tax_volume = ownership_volume_dict[mapper.get(key).get(shrinkage_condition)][key][se_ownership]

            this_se_tax = np.zeros(len(t_all))
            for i in range(len(this_se_unit)):
                unit = this_se_unit[i]
                rate = this_se_rate[i]
                escalation_params = this_se_escalation[i]
                if unit == 'pct_of_revenue':
                    # based on net revenue
                    this_se_tax = this_se_tax + np.multiply(np.subtract(this_se_revenue, this_se_deduct), rate)
                elif unit in ['pct_of_production', 'dollar_per_bbl', 'dollar_per_mcf']:
                    # based on net volume
                    if unit != 'pct_of_production':
                        rate = self._apply_escalation(rate, escalation_params)
                    this_se_tax = this_se_tax + np.multiply(this_sev_tax_volume, rate)
                # the se_tax is a fixed number
                elif unit == 'dollar_per_month':
                    # the number is based on gross volume, we should multiply by wi or nri
                    rate = self._apply_escalation(rate, escalation_params)
                    ownership_ratio = ownership_dict_by_phase[key][se_ownership]

                    this_fixed_sev_tax = np.multiply(rate, ownership_ratio)

                    if self.multiplier is not None:
                        this_fixed_sev_tax = np.multiply(this_fixed_sev_tax, self.multiplier)

                    this_se_tax = this_se_tax + this_fixed_sev_tax

            se_tax_dict[key + '_severance_tax'] = this_se_tax
            total_sev_tax = np.add(total_sev_tax, this_se_tax)

        return total_sev_tax, se_tax_dict

    def _calculate_ad_valorem_tax(self, ownership_volume_dict, ad_valorem_tax_params, revenue_dict, ad_deduct,
                                  total_sev_tax, ownership_dict_by_phase):
        t_all = ownership_volume_dict['sales']['time']
        if ad_valorem_tax_params.get("state") is None:
            state = ad_valorem_tax_params.get("state")
        else:
            state = ad_valorem_tax_params.get("state").lower()
        ad_tax = np.zeros(len(t_all))
        ad_revenue = np.zeros(len(t_all))
        if len(ad_valorem_tax_params) == 0:
            return ad_tax

        ad_tax_rate = ad_valorem_tax_params['ad_tax_rate']
        ad_tax_unit = ad_valorem_tax_params['ad_tax_unit']
        ad_tax_escalation = ad_valorem_tax_params["ad_tax_escalation"]
        ad_ownership = ad_valorem_tax_params['calculation']
        ad_tax_deduct_se_tax = ad_valorem_tax_params['deduct_severance_tax']
        shrinkage_condition = ad_valorem_tax_params.get("shrinkage_condition")

        for key in revenue_dict.keys():
            if key == "compositionals":
                # TODO add ad valorem tax for compositionals
                continue
            ad_revenue += revenue_dict[key]["ownership"][ad_ownership]

        mapper = {"shrunk": "sales", "unshrunk": "unshrunk"}

        for i in range(len(ad_tax_unit)):
            unit = ad_tax_unit[i]
            rate = ad_tax_rate[i]
            escalation_params = ad_tax_escalation[i]
            if unit == 'pct_of_revenue':
                if ad_tax_deduct_se_tax == 'yes':
                    ad_tax = ad_tax + np.multiply(np.subtract(np.subtract(ad_revenue, ad_deduct), total_sev_tax), rate)
                else:
                    ad_tax = ad_tax + np.multiply(np.subtract(ad_revenue, ad_deduct), rate)
            elif unit in ['pct_of_production', 'dollar_per_boe']:
                if unit == 'dollar_per_boe':
                    rate = self._apply_escalation(rate, escalation_params)
                ad_delta = np.multiply(
                    ownership_volume_dict['boe'][f"{mapper.get(shrinkage_condition)}_boe"][ad_ownership], rate)
                ad_tax = ad_tax + ad_delta

            elif unit == 'dollar_per_month':
                rate = self._apply_escalation(rate, escalation_params)
                ad_delta = np.multiply(ownership_dict_by_phase['original'][ad_ownership], rate)
                if not (state is not None and ("pennsylvania vertical" in state or "pennsylvania horizontal" in state)):
                    if self.multiplier is not None:
                        ad_delta = np.multiply(ad_delta, self.multiplier)
                ad_tax = ad_tax + ad_delta

        ad_tax[ad_tax < 0] = 0

        return ad_tax

    def _severance_tax_pre(self, severance_tax_model, date_dict, ownership_volumes):
        if len(severance_tax_model) == 0:
            return {}

        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        all_value_key = ['dollar_per_month', 'dollar_per_bbl', 'dollar_per_mcf', 'pct_of_production', 'pct_of_revenue']
        se_tax_output = {
            'shrinkage_condition': severance_tax_model.get('shrinkage_condition', 'shrunk'),
            'calculation': severance_tax_model['calculation'],
            'se_tax_rate': {},
            'se_tax_unit': {},
            'se_tax_escalation': {}
        }

        rate_type = severance_tax_model.get('rate_type', 'gross_well_head')
        rows_cal_method = severance_tax_model.get('rows_calculation_method', 'non_monotonic')

        mapper = {'escalation_model_1': 'severance_tax', 'escalation_model_2': 'severance_tax_2'}
        for key in ['oil', 'gas', 'ngl', 'drip_condensate']:

            this_se_tax_rate = []
            this_se_tax_unit = []
            this_se_tax_escalation = []

            for esc_model in ['escalation_model_1', 'escalation_model_2']:
                rows = severance_tax_model[key]['escalation_model'].get(mapper[esc_model], [])

                if len(rows) == 0:
                    continue

                escalation_input = get_escalation_model(
                    {'escalation_model': severance_tax_model[key]['escalation_model'][esc_model]})

                phase_row_keys = rows[0].keys()

                for value_key in phase_row_keys:
                    if value_key in all_value_key:
                        multiplier = 0.01 if value_key in ['pct_of_production', 'pct_of_revenue'] else 1

                        if set(phase_row_keys) & set(self.RATE_ROW_KEYS):
                            criteria_key = list(set(phase_row_keys) & set(self.RATE_ROW_KEYS))[0]
                            one_se_tax_rate = rate_rows_process(copy.deepcopy(rows), value_key, criteria_key, rate_type,
                                                                rows_cal_method, ownership_volumes, date_dict)
                            # ignore escalation if criteria is rate
                            esc_param = None
                        else:
                            one_se_tax_rate, esc_param = rows_process_with_escalation(copy.deepcopy(rows),
                                                                                      date_dict,
                                                                                      fpd,
                                                                                      cf_start_date,
                                                                                      cf_end_date,
                                                                                      value_key,
                                                                                      extend_value=0,
                                                                                      escalation=escalation_input)

                        one_se_tax_rate = np.multiply(one_se_tax_rate, multiplier)
                        this_se_tax_unit.append(value_key)
                        this_se_tax_rate.append(one_se_tax_rate)
                        this_se_tax_escalation.append(esc_param)

            se_tax_output['se_tax_unit'][key] = this_se_tax_unit
            se_tax_output['se_tax_rate'][key] = this_se_tax_rate
            se_tax_output['se_tax_escalation'][key] = this_se_tax_escalation

        return se_tax_output

    def _ad_valorem_tax_pre(self, ad_valorem_tax_model, date_dict, ownership_volumes, state, price, t_list, schedule,
                            well_header_info):
        if len(ad_valorem_tax_model) == 0:
            return {}

        fpd = date_dict['first_production_date']
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']

        ad_tax_rate = []
        ad_tax_unit = []
        ad_tax_escalation = []
        ad_return = {
            'deduct_severance_tax': ad_valorem_tax_model['deduct_severance_tax'],
            'shrinkage_condition': ad_valorem_tax_model.get('shrinkage_condition', 'shrunk'),
            'calculation': ad_valorem_tax_model.get('calculation')
        }

        # if state is Pennsylvania (simple Pennsylvania is the same as other states)
        if state is not None and ('pennsylvania vertical' in state.lower()
                                  or 'pennsylvania horizontal' in state.lower()) and bool(price):
            ad_return.update({'ad_tax_escalation': [None, None]})
            key = 'dollar_per_month'
            p_if = self.pa_impact_fee.iloc[:10] * 0.2 if 'vertical' in state.lower() else self.pa_impact_fee
            p_if_monthly = p_if.iloc[np.repeat(np.arange(len(p_if)), 12)].reset_index(drop=True)

            ad_start_date = ad_valorem_tax_model.get('start_date', 'fpd')
            t_start = 0
            if ad_start_date == 'spud date from headers' and well_header_info.get('spud_date') is not None:
                t_start = date_to_t(well_header_info.get('spud_date'), fpd)
            elif ad_start_date == 'spud date from schedule' and schedule.get('spudWorkStart') is not None:
                t_start = date_to_t(index_to_py_date(schedule.get('spudWorkStart')), fpd)

            rows_pa = []
            if t_start not in t_list:
                if t_start > t_list[-1]:
                    rows_pa = [{'dollar_per_month': 0, 'offset_to_fpd': {'start': t_list[-1], 'end': t_list[-1]}}]
                    ad_tax_rate.append(rows_process(rows_pa, date_dict, fpd, cf_start_date, cf_end_date, key))
                    ad_tax_unit.append(key)
                    ad_return.update({'ad_tax_rate': ad_tax_rate, 'ad_tax_unit': ad_tax_unit})
                    return ad_return
                else:
                    offset = t_list[0] - t_start
                    p_if_monthly = p_if_monthly.iloc[offset:].reset_index(drop=True)
                    t_start = t_list[0]
            t_start_index = np.where(t_list == t_start)[0][0]

            t_end = min(t_start + len(p_if_monthly) - 1, t_list[-1])
            if t_end in t_list:
                t_end_index = np.where(t_list == t_end)[0][0]
            else:
                rows_pa = [{'dollar_per_month': 0, 'offset_to_fpd': {'start': t_list[-1], 'end': t_list[-1]}}]
                ad_tax_rate.append(rows_process(rows_pa, date_dict, fpd, cf_start_date, cf_end_date, key))
                ad_tax_unit.append(key)
                ad_return.update({'ad_tax_rate': ad_tax_rate, 'ad_tax_unit': ad_tax_unit})
                return ad_return

            t_list_if = t_list[t_start_index:t_end_index + 1]
            gas_price_if = np.round(price.get('price_dict').get('gas')[t_start_index:t_end_index + 1], 2)

            p_if_monthly = p_if_monthly.iloc[0:len(t_list_if)]
            df_tax_rate = pd.DataFrame(np.zeros(len(p_if_monthly)), columns=['rate'])
            for col in p_if_monthly.columns:
                bounds = [float(item) for item in col[0].split('-')]
                filter = (gas_price_if >= bounds[0]) & (gas_price_if <= bounds[1])
                df_tax_rate.loc[filter, 'rate'] = p_if_monthly.loc[filter, col]

            rows_pa = [{
                'dollar_per_month': df_tax_rate.loc[i, 'rate'],
                'offset_to_fpd': {
                    'start': item + 1,
                    'end': item + 1
                }
            } for i, item in enumerate(t_list_if)]

            ad_tax_rate.append(rows_process(rows_pa, date_dict, fpd, cf_start_date, cf_end_date, key))
            if t_end < t_list[-1]:
                ad_tax_rate[0][t_end_index + 1:] = 0

            ad_tax_unit.append(key)
            ad_return.update({'ad_tax_rate': ad_tax_rate, 'ad_tax_unit': ad_tax_unit})
            return ad_return

        # if state is any state other than Pennsylvania
        rate_type = ad_valorem_tax_model.get('rate_type', 'gross_well_head')
        rows_cal_method = ad_valorem_tax_model.get('rows_calculation_method', 'non_monotonic')
        mapper = {'escalation_model_1': 'ad_valorem_tax', 'escalation_model_2': 'ad_valorem_tax_2'}

        for esc_model in ['escalation_model_1', 'escalation_model_2']:
            rows = ad_valorem_tax_model['escalation_model'].get(mapper[esc_model], [])

            if len(rows) == 0:
                continue

            escalation_input = get_escalation_model(
                {'escalation_model': ad_valorem_tax_model['escalation_model'][esc_model]})
            row_keys = rows[0].keys()

            for key in row_keys:
                if key not in ['dollar_per_month', 'dollar_per_boe', 'pct_of_production', 'pct_of_revenue']:
                    continue

                multiplier = 0.01 if key in ['pct_of_production', 'pct_of_revenue'] else 1

                if self._intersect_with_rate_row_keys(row_keys):
                    criteria_key = list(self._intersect_with_rate_row_keys(row_keys))[0]
                    one_ad_tax_rate = rate_rows_process(
                        rows,
                        key,
                        criteria_key,
                        rate_type,
                        rows_cal_method,
                        ownership_volumes,
                        date_dict,
                    )
                    ad_tax_rate.append(np.multiply(one_ad_tax_rate, multiplier))
                    ad_tax_unit.append(key)
                    ad_tax_escalation.append(None)
                    continue

                one_ad_tax_rate, esc_param = rows_process_with_escalation(copy.deepcopy(rows),
                                                                          date_dict,
                                                                          fpd,
                                                                          cf_start_date,
                                                                          cf_end_date,
                                                                          key,
                                                                          extend_value=0,
                                                                          escalation=escalation_input)
                ad_tax_rate.append(np.multiply(one_ad_tax_rate, multiplier))
                ad_tax_unit.append(key)
                ad_tax_escalation.append(esc_param)
        ad_return.update({
            'ad_tax_rate': ad_tax_rate,
            'ad_tax_unit': ad_tax_unit,
            'ad_tax_escalation': ad_tax_escalation
        })
        return ad_return
