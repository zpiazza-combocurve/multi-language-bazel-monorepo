import numpy as np
import datetime

from combocurve.science.econ.econ_model_rows_process import rows_process
from combocurve.science.econ.econ_calculations.calculation import EconCalculation

TCJA_START = datetime.date(year=2018, month=1, day=1)

DDA_COLUMNS = [
    'depreciation', 'tangible_depreciation', 'intangible_depreciation', 'depletion', 'tangible_depletion',
    'intangible_depletion', 'total_deductions', 'percentage_depletion', 'tax_credit'
]

TCJA_BONUS_SCHEDULE = {
    datetime.date(2027, 1, 1): 0,
    datetime.date(2026, 1, 1): 20,
    datetime.date(2025, 1, 1): 40,
    datetime.date(2024, 1, 1): 60,
    datetime.date(2023, 1, 1): 80,
    datetime.date(2018, 1, 1): 100,
    datetime.date(2012, 1, 1): 50,
    datetime.date(2010, 9, 1): 100,
    datetime.date(2010, 1, 1): 0,
    datetime.date(2008, 1, 1): 50
}


class BeforeIncomeTaxCashFlow(EconCalculation):
    # before income tax cash flow
    def result(
        self,
        revenue_dict,
        fixed_expenses,
        variable_expenses,
        water_disposal,
        carbon_expenses,
        production_tax_dict,
        capex_dict,
        npi,
        t_all,
    ):
        bfit_cf = np.zeros(len(t_all))
        bfit_dict = {'time': t_all}

        total_nr = np.zeros(len(t_all))
        total_gr = np.zeros(len(t_all))
        for key in revenue_dict:
            if key != 'time' and key != 'compositionals':
                total_nr = np.add(total_nr, revenue_dict[key]['net_revenue'])
                total_gr = np.add(total_gr, revenue_dict[key]['gross_revenue'])
            elif key == 'compositionals':
                # TODO: Work on aligning the phases with the comps volumes/prices.
                comp_phase = "ngl"
                for comp in revenue_dict.get(key, {}).get(comp_phase, {}):
                    comp_dict = revenue_dict.get(key, {}).get(comp_phase, {}).get(comp, {})
                    if not comp_dict:
                        continue
                    total_nr = np.add(total_nr, comp_dict['net_revenue'])
                    total_gr = np.add(total_gr, comp_dict['gross_revenue'])

        total_expense = np.zeros(len(t_all))
        for fixed_expense in fixed_expenses:
            total_expense = np.add(total_expense, fixed_expense['values'])
        for variable_expense in variable_expenses:
            total_expense = np.add(total_expense, variable_expense['values'])
        for disposal in water_disposal:
            total_expense = np.add(total_expense, disposal['values'])
        for ghg_expense in carbon_expenses:
            total_expense = np.add(total_expense, ghg_expense['values'])

        bfit_dict['total_net_revenue'] = total_nr
        bfit_dict['total_gross_revenue'] = total_gr
        bfit_dict['expense'] = total_expense
        bfit_dict['production_tax'] = production_tax_dict['total_production_tax']
        bfit_dict['capex'] = capex_dict['total_capex']

        total_np = bfit_dict['total_net_revenue'] - bfit_dict['expense'] - bfit_dict['production_tax']

        # net profit
        net_profit = np.zeros(len(total_nr))
        key = list(npi.keys())[0]
        if key == 'expense':
            net_profit[total_np > 0] = total_np[total_np > 0] * (-npi[key][total_np > 0])
        elif key == 'revenue':
            net_profit[total_np > 0] = total_np[total_np > 0] * (npi[key][total_np > 0])
        bfit_dict['net_profit'] = net_profit

        bfit_dict['net_income'] = total_np + net_profit

        if key == 'expense':
            bfit_cf = (total_np - bfit_dict['capex']) + net_profit
        elif key == 'revenue':
            bfit_cf = net_profit
        bfit_dict['bfit_cf'] = bfit_cf

        return {'bfit_cf_dict': bfit_dict}


class AfterIncomeTaxCashFlow(EconCalculation):
    # after income tax cash flow
    def __init__(self, date_dict, general_option_model, primary_product):
        self.date_dict = date_dict
        self.primary_product = primary_product
        self.general_option_model = general_option_model

    def result(self, bfit_cf_dict, all_capex, ownership_dict_by_phase, ownership_volume_dict, npi,
               unadjusted_wh_volume):
        """Calculates overall AFIT parameters and results

        Args:
            bfit_cf_dict (dict): BFIT parameters
            all_capex (list): CAPEX parameters
            income_tax_params (dict): monthly income tax (state and federal) rates
            ownership_dict (dict): various ownership values for each product
            npi (dict): monthly NPI values
            primary_product (WellInput): processed input containing well and model properties
            ownership_volume_dict (dict): contains various volumes for different calculations and products
            unadjusted_wh_volume (dict): original production values without any truncation

        Returns:
            dict: AFIT parameters and cashflow values
        """
        # state tax parameter is the first element of income tax parameter, federal tax parameter is the second.

        income_tax_params = self._get_income_tax_params(self.date_dict)
        state_tax_param = income_tax_params['state_income_tax']
        federal_tax_param = income_tax_params['federal_income_tax']

        gross_revenue = bfit_cf_dict['total_gross_revenue']
        net_revenue = bfit_cf_dict['total_net_revenue']

        volume_t = bfit_cf_dict['time']
        bfit_cf = bfit_cf_dict['bfit_cf']

        data_bfit_cf = np.array([volume_t, bfit_cf]).transpose()

        afit_dict = {'time': volume_t, 'bfit_cf': bfit_cf}

        npi_type = list(npi.keys())[0]
        if npi_type == 'revenue':
            t_len = len(volume_t)

            for column in DDA_COLUMNS:
                afit_dict[column] = np.zeros(t_len)
            afit_dict['taxable_income'] = bfit_cf_dict['bfit_cf']
            taxable_income = bfit_cf_dict['bfit_cf']

        else:
            all_depre = self._calculate_dda(data_bfit_cf, all_capex, ownership_dict_by_phase, self.primary_product,
                                            ownership_volume_dict, gross_revenue, net_revenue, unadjusted_wh_volume,
                                            self.date_dict)

            afit_dict.update(all_depre)

            as_of_date = self.date_dict['as_of_date']
            carry_forward = self._get_carry_forward()

            taxable_income = self._calculate_taxable_income(bfit_cf_dict, all_depre['total_deductions'], as_of_date,
                                                            carry_forward)
            afit_dict['taxable_income'] = taxable_income

        # state tax with different tax rate based on taxable income
        state_income_tax = self._calculate_income_tax(taxable_income, state_tax_param)
        afit_dict['state_income_tax'] = state_income_tax
        afit_dict['state_tax_rate'] = state_tax_param

        # federal tax with different tax rate based on taxable income (after state tax)
        ti_afst = taxable_income - state_income_tax

        federal_income_tax = self._calculate_income_tax(ti_afst, federal_tax_param)
        afit_dict['federal_income_tax'] = federal_income_tax
        afit_dict['federal_tax_rate'] = federal_tax_param

        # afit cash flow
        afit_cf = bfit_cf - state_income_tax - federal_income_tax
        afit_cf += afit_dict['tax_credit']
        afit_dict['afit_cf'] = afit_cf

        return {'afit_cf_dict': afit_dict}

    def _get_income_tax_params(self, date_dict):
        return self._income_tax_pre(self.general_option_model['income_tax'], date_dict)

    def _income_tax_pre(self, income_tax_input, date_dict):
        income_tax_params = {}
        for key in ['state_income_tax', 'federal_income_tax']:
            monthly_para = rows_process(income_tax_input[key]['rows'], date_dict, date_dict['first_production_date'],
                                        date_dict['cf_start_date'], date_dict['cf_end_date'], 'multiplier')
            income_tax_params[key] = np.divide(monthly_para, 100)
        return income_tax_params

    def _get_fifteen_percent(self):
        return self.general_option_model['income_tax'].get('fifteen_depletion', 'no')

    def _get_carry_forward(self):
        return self.general_option_model['income_tax'].get('carry_forward', 'no')

    def _depreciation(self, one_capex, volume_t, volume_wi, all_depre):
        """Calculates depreciation from this CAPEX (investment) and adds to total depreciation

        Args:
            one_capex (dict): details of current investment
            volume_t (ndarray): time index series that starts from as of date to last economic event
            volume_wi (ndarray): working interest time series
            all_t (ndarray): time index series that starts from FPD to last economic event
            all_depre (ndarray): current depreciation before considering this investment

        Raises:
            Exception: If CAPEX calculation is neither net or gross

        Returns:
            ndarray: the sum of all_depre and current CAPEX's depreciation
        """
        # calculate the depreciation of each tangible capex
        this_depre_para_yearly = one_capex['depreciation_model']['depreciation_model']
        if this_depre_para_yearly == 'none':
            return
        remaining_months = 13 - one_capex['date'].month
        this_tan_monthly, this_intan_monthly = self._depreciation_pre(this_depre_para_yearly['depreciation'],
                                                                      remaining_months)

        # deal_term
        if one_capex['deal_terms'] == '' or one_capex['deal_terms'] is None:
            this_deal_term = 1
        else:
            this_deal_term = one_capex['deal_terms']

        # get tangible based on wi
        if one_capex['calculation'] == 'gross':
            this_gross_tangible = one_capex['tangible']
            this_gross_intangible = one_capex['intangible']
            if isinstance(volume_wi, np.ndarray):
                this_t = one_capex['time']
                if this_t in volume_t:
                    this_wi = volume_wi[volume_t == this_t]
                else:
                    if this_t < volume_t[0]:
                        this_wi = volume_wi[0]
                    elif this_t > volume_t[-1]:
                        this_wi = volume_wi[-1]
            else:
                this_wi = volume_wi
        elif one_capex['calculation'] == 'net':
            this_gross_tangible = one_capex['tangible']
            this_gross_intangible = one_capex['intangible']
            this_wi = 1
        else:
            raise Exception('CAPEX calculation neither net nor gross!', None)

        tax_credit = np.zeros(len(volume_t))
        if this_depre_para_yearly.get('tax_credit'):
            tax_credit[int(one_capex['time']
                           - volume_t[0])] = this_depre_para_yearly['tax_credit'] * one_capex['tangible'] / 100

        this_wi_tangible = this_gross_tangible * this_wi * this_deal_term
        this_wi_intangible = this_gross_intangible * this_wi * this_deal_term

        # Bonus Depreciation
        tan_bonus, intan_bonus = 0, 0
        if this_depre_para_yearly.get('tcja_bonus') == 'yes':
            for date, bonus in TCJA_BONUS_SCHEDULE.items():
                if one_capex['date'] >= date:
                    tan_bonus = bonus
                    break

        if this_depre_para_yearly.get('bonus_depreciation'):
            bonuses = list(this_depre_para_yearly['bonus_depreciation']['rows'][0].values())
            tan_bonus = min(100, tan_bonus + bonuses[0])
            intan_bonus = min(100, intan_bonus + bonuses[1])
        #
        tan_depre = np.multiply(this_wi_tangible, this_tan_monthly) * (1 - tan_bonus / 100)
        intan_depre = np.multiply(this_wi_intangible, this_intan_monthly) * (1 - intan_bonus / 100)

        tan_depre[:remaining_months] += this_wi_tangible * tan_bonus / 100 / remaining_months
        intan_depre[:remaining_months] += this_wi_intangible * intan_bonus / 100 / remaining_months

        if one_capex['time'] in volume_t:
            pad_begin = np.argwhere(volume_t == one_capex['time'])[0][0]
        else:
            pad_begin = 0
            pre_slice = int(volume_t[0] - one_capex['time'])
            tan_depre = tan_depre[pre_slice:]
            intan_depre = intan_depre[pre_slice:]

        if len(tan_depre) > len(volume_t) - pad_begin:
            end_aggregation = np.sum(tan_depre[len(volume_t) - 1 - pad_begin:])
            tan_depre = tan_depre[:len(volume_t) - pad_begin]
            tan_depre[-1] = end_aggregation

            end_aggregation = np.sum(intan_depre[len(volume_t) - 1 - pad_begin:])
            intan_depre = intan_depre[:len(volume_t) - pad_begin]
            intan_depre[-1] = end_aggregation

            pad_end = 0
        elif len(tan_depre) == len(volume_t):
            pad_end = 0
        else:
            pad_end = len(volume_t) - len(tan_depre) - pad_begin

        all_depre['depreciation'] += np.pad(tan_depre + intan_depre, (pad_begin, pad_end))
        all_depre['tangible_depreciation'] += np.pad(tan_depre, (pad_begin, pad_end))
        all_depre['intangible_depreciation'] += np.pad(intan_depre, (pad_begin, pad_end))
        all_depre['tax_credit'] += tax_credit

        return all_depre

    def _depletion(self, one_capex, volume_t, volume_wi, all_deple, primary_product, ownership_volume_dict,
                   unadjusted_wh_volume, date_dict):
        """Calculates depreciation from this CAPEX (investment) and adds to total depreciation

        Args:
            one_capex (dict): details of current investment
            volume_t (ndarray): time index series that starts from as of date to last economic event
            volume_wi (ndarray): working interest time series
            all_deple (ndarray): current depletion before considering this investment
            primary_product (primary_product): object containing details about well
            ownership_volume_dict (dict): collection of various volumes by phase, type, ownership
            unadjusted_wh_volume (dict): collection of total wellhead volumes by phase

        Raises:
            Exception: If CAPEX calculation is neither net or gross

        Returns:
            ndarray: the sum of all_depre and current CAPEX's depletion
        """

        this_depre_para_yearly = one_capex['depreciation_model']['depreciation_model']
        if this_depre_para_yearly == 'none':
            return

        this_tan_monthly, this_intan_monthly = self._depletion_pre(this_depre_para_yearly['tangible_depletion_model'],
                                                                   this_depre_para_yearly['intangible_depletion_model'],
                                                                   primary_product, ownership_volume_dict, volume_t,
                                                                   one_capex['time'], unadjusted_wh_volume, date_dict)
        # deal_term
        if one_capex['deal_terms'] == '' or one_capex['deal_terms'] is None:
            this_deal_term = 1
        else:
            this_deal_term = one_capex['deal_terms']
        # get tangible based on wi
        #
        if one_capex['calculation'] == 'gross':
            this_gross_tangible = one_capex['tangible']
            this_gross_intangible = one_capex['intangible']
            if isinstance(volume_wi, np.ndarray):
                this_t = one_capex['time']
                if this_t in volume_t:
                    this_wi = volume_wi[volume_t == this_t]
                else:
                    if this_t < volume_t[0]:
                        this_wi = volume_wi[0]
                    elif this_t > volume_t[-1]:
                        this_wi = volume_wi[-1]
            else:
                this_wi = volume_wi
        elif one_capex['calculation'] == 'net':
            this_gross_tangible = one_capex['tangible']
            this_gross_intangible = one_capex['intangible']
            this_wi = 1
        else:
            raise Exception('CAPEX calculation neither net nor gross!', None)

        depreciation_model = one_capex['depreciation_model']['depreciation_model']
        if depreciation_model.get('tangible_immediate_depletion'):
            tangible_immediate = this_gross_tangible * depreciation_model['tangible_immediate_depletion'] / 100
        else:
            tangible_immediate = 0
        if depreciation_model.get('intangible_immediate_depletion'):
            intangible_immediate = this_gross_intangible * depreciation_model['intangible_immediate_depletion'] / 100
        else:
            intangible_immediate = 0

        this_wi_tangible = (this_gross_tangible - tangible_immediate) * this_wi * this_deal_term
        this_wi_intangible = (this_gross_intangible - intangible_immediate) * this_wi * this_deal_term

        tan_depre = np.multiply(this_wi_tangible, this_tan_monthly)
        intan_depre = np.multiply(this_wi_intangible, this_intan_monthly)

        tan_depre[int(one_capex['time'] - volume_t[0])] += tangible_immediate
        intan_depre[int(one_capex['time'] - volume_t[0])] += intangible_immediate

        all_deple['depletion'] += tan_depre + intan_depre
        all_deple['tangible_depletion'] += tan_depre
        all_deple['intangible_depletion'] += intan_depre

        return all_deple

    # dda
    def _calculate_dda(self, data_bfit_cf, all_capex, ownership_dict_by_phase, primary_product, ownership_volume_dict,
                       gross_revenue, net_revenue, unadjusted_wh_volume, date_dict):
        """Takes in all CAPEX (investments) and calculates cumulative depreciation from all investments

        Args:
            data_bfit_cf (ndarray): time series of before income tax cash flow
            all_capex (list of dict): details of all investments
            ownership_dict (dict of dicts): ownership values for each phase
            primary_product (primary_product): object containing details about well
            ownership_volume_dict (dict): collection of various volumes by phase, type, ownership
            gross_revenue (ndarray): time series of gross revenue
            net_revenue (ndarray): time series of gross revenue
            unadjusted_wh_volume (dict): original production values without any truncation

        Returns:
            ndarray: depreciation time series
        """
        volume_t = data_bfit_cf[:, 0]
        volume_wi = ownership_dict_by_phase['original']['wi']
        # if t_cut_off_date before 0 (t_fpd) then depreciation never happens.

        if data_bfit_cf[-1, 0] <= 0:
            t_len = len(volume_t)
            empty_depre = dict()

            for column in DDA_COLUMNS:
                empty_depre[column] = np.zeros(t_len)

            return empty_depre

        all_depre = {
            'depreciation': np.zeros(len(volume_t)),
            'tangible_depreciation': np.zeros(len(volume_t)),
            'intangible_depreciation': np.zeros(len(volume_t)),
            'tax_credit': np.zeros(len(volume_t))
        }

        all_deple = {
            'depletion': np.zeros(len(volume_t)),
            'tangible_depletion': np.zeros(len(volume_t)),
            'intangible_depletion': np.zeros(len(volume_t)),
        }

        # calculate the depreciation of each tangible capex
        for one_capex in all_capex:
            if one_capex['depreciation_model'] == 'none':  # when dd&a model not assigned
                continue
            else:
                depreciation_model = one_capex['depreciation_model']['depreciation_model']
                if depreciation_model['depreciation_or_depletion'] == 'depreciation':
                    all_depre = self._depreciation(one_capex, volume_t, volume_wi, all_depre)

                elif depreciation_model['depreciation_or_depletion'] == 'depletion':
                    all_deple = self._depletion(one_capex, volume_t, volume_wi, all_deple, primary_product,
                                                ownership_volume_dict, unadjusted_wh_volume, date_dict)

        all_depre.update(all_deple)

        all_depre['total_deductions'] = np.sum([all_depre['depreciation'], all_depre['depletion']], axis=0)

        percentage_depletion = np.zeros(len(gross_revenue))
        if self._get_fifteen_percent() == 'yes':
            percentage_depletion = np.empty([len(gross_revenue)])

            for i in range(len(gross_revenue)):
                if net_revenue[i] <= gross_revenue[i] * .15:
                    percentage_depletion[i] = max(0, net_revenue[i])
                else:
                    percentage_depletion[i] = gross_revenue[i] * .15

        all_depre['percentage_depletion'] = percentage_depletion

        all_depre['total_deductions'] = np.maximum(percentage_depletion, all_depre['total_deductions'])

        return all_depre

    def _calculate_taxable_income(self, bfit_cf_log, all_depre, as_of_date, carry_forward):
        """Takes BFIT CF and total depreciation and calculates taxable income with carry forward

        Args:
            bfit_cf_log (dict): contains various economic timeseries
            all_depre (ndarray): total depreciation
            as_of_date (datetime.date): reporting date
            carry_forward (string): 'yes' if carrying forward, 'no' if taking negative income tax

        Returns:
            ndarray: time series of taxable income
        """

        bf_capex_cf = bfit_cf_log['bfit_cf'] + bfit_cf_log['capex']
        theo_ti = bf_capex_cf - all_depre

        if carry_forward == "yes":
            carry_forward_array = []
            taxable_income = []
            deduction_t = []

            for i in range(len(theo_ti)):
                if 0 in deduction_t:
                    carry_forward_array = carry_forward_array[1:]
                    deduction_t = deduction_t[1:]

                if theo_ti[i] >= 0:
                    this_ti_params = self._carry_forward(carry_forward_array, theo_ti[i], deduction_t, theo_ti[i])
                    carry_forward_array, this_ti, deduction_t = this_ti_params
                    taxable_income.append(this_ti)
                else:
                    if as_of_date >= TCJA_START:
                        carry_forward_array = np.append(carry_forward_array, -1 * theo_ti[i])
                        deduction_t.append(np.nan)
                    else:
                        carry_forward_array.append(-1 * theo_ti[i])
                        deduction_t.append(12 * 20 + 1)

                    taxable_income.append(0)
                deduction_t = [i - 1 for i in deduction_t]
                if as_of_date.month == 12:
                    as_of_date.replace(year=as_of_date.year + 1)
                    as_of_date.replace(month=1)
                else:
                    as_of_date.replace(month=as_of_date.month + 1)

            if len(carry_forward_array) > 0:
                taxable_income[-1] -= sum(carry_forward_array)
            taxable_income = np.asarray(taxable_income)

        else:
            taxable_income = theo_ti

        return taxable_income

    def _carry_forward(self, carry_forward_array, cash_flow, deduction_t, original_cf):
        """_summary_

        Args:
            carry_forward_array (list): contains all negative cashflow deemed used for future tax offset
            cash_flow (float): current undeducted portion of cashflow that can be taxed
            deduction_t (_type_): months left until expiry corresponding to the losses in carry_forward_array
            original_cf (float): original cashflow placeholder for calculations

        Returns:
            (list, float, list):
                remaining carry forward values for deduction,
                after-deduction cashflow remaining for taxation,
                months left until expiry corresponding to remaining carry forward values
        """
        if len(carry_forward_array) == 0:
            return carry_forward_array, cash_flow, deduction_t
        elif np.isnan(deduction_t[0]):
            if original_cf * .2 >= cash_flow - carry_forward_array[0]:
                carry_forward_array[0] -= (cash_flow - original_cf * .2)
                cash_flow = original_cf * .2
                return carry_forward_array, cash_flow, deduction_t
            else:
                cash_flow -= carry_forward_array[0]
                return self._carry_forward(carry_forward_array[1:], cash_flow, deduction_t[1:], original_cf)
        else:
            if cash_flow < carry_forward_array[0]:
                carry_forward_array[0] -= cash_flow
                cash_flow = 0
                return carry_forward_array, cash_flow, deduction_t
            else:
                cash_flow -= carry_forward_array[0]
                return self._carry_forward(carry_forward_array[1:], cash_flow, deduction_t[1:], original_cf)

    def _calculate_income_tax(self, taxable_income, monthly_tax_rate):
        """_summary_

        Args:
            taxable_income (ndarray): taxable income time series
            monthly_tax_rate (ndarray): tax rate time series

        Returns:
            ndarray: tax value time series
        """
        return np.multiply(taxable_income, monthly_tax_rate)

    ## depletion
    def _depletion_pre_helper(self, depletion_model, primary_product, ownership_volume_dict, volume_t, capex_t,
                              unadjusted_wh_volume, date_dict):
        '''Calculates monthly depletion rates depending on type of depletion model

        Args:
            depletion_model (str): type of depletion for this CAPEX
            primary_product (primary_product): object containing details about well
            ownership_volume_dict (dict): collection of various volumes by phase, type, ownership
            volume_t (ndarray): time index series that starts from as of date to last economic event
            capex_t (int): time index of current CAPEX
            unadjusted_wh_volume (dict): original production values without any truncation

        Returns:
            ndarray: depletion rate time series
        '''
        if capex_t < volume_t[0]:
            capex_t = volume_t[0]

        capex_t = int(capex_t)

        if depletion_model == 'unit_of_production_major':
            major_phase = primary_product
            if major_phase in ['oil', 'gas', 'water']:
                production = ownership_volume_dict['well_head'][major_phase]['100_pct_wi']
                production = production[volume_t >= capex_t]

                if len(unadjusted_wh_volume) == 0:
                    depletion_para = np.array([1])
                else:
                    this_wh_vol = np.sum(unadjusted_wh_volume[major_phase][max(0, capex_t):])
                    depletion_para = np.divide(
                        production,
                        this_wh_vol,
                        where=(this_wh_vol != 0),
                        out=np.ones(len(production)),
                    )

            else:
                production = ownership_volume_dict['well_head']['oil']['100_pct_wi']
                production = production[volume_t >= capex_t]

                if len(unadjusted_wh_volume) == 0:
                    depletion_para = np.array([1])
                else:
                    depletion_para = np.divide(production, np.sum(unadjusted_wh_volume['oil'][max(0, capex_t):]))

            depletion_para = np.pad(depletion_para, (int(capex_t - volume_t[0]), 0))

            return depletion_para

        if depletion_model == 'unit_of_production_BOE':
            production = ownership_volume_dict['boe']['well_head_boe']['total']
            production = production[volume_t >= capex_t]

            if len(unadjusted_wh_volume) == 0:
                depletion_para = np.array([1])
            else:
                oil_volume = np.sum(unadjusted_wh_volume['oil'][max(0, int(capex_t - volume_t[0])):])
                gas_volume = np.sum(unadjusted_wh_volume['gas'][max(0, int(capex_t - volume_t[0])):])

                depletion_para = np.divide(production, oil_volume + gas_volume / 6)

            depletion_para = np.pad(depletion_para, (int(capex_t - volume_t[0]), 0))

            return depletion_para

        if depletion_model == 'ecl':
            depletion_para = np.zeros(len(volume_t))
            depletion_para[-1] = 1
            return depletion_para

        if depletion_model == 'never':
            depletion_para = np.zeros(len(volume_t))
            return depletion_para

        if depletion_model == 'fpd':
            depletion_para = np.zeros(len(volume_t))

            if 0 in volume_t:
                depletion_para[volume_t == 0] = 1
            else:
                depletion_para[0] = 1

            return depletion_para

    def _depletion_pre(self, tangible_depletion_model, intangible_depletion_model, primary_product,
                       ownership_volume_dict, volume_t, capex_t, unadjusted_wh_volume, date_dict):
        '''Combines both tangible and intangible depletion rates together

        Args:
            tangible_depletion_model (_type_): type of depletion for this CAPEX's tangible portion
            intangible_depletion_model (_type_): type of depletion for this CAPEX's intangible portion
            primary_product (primary_product): object containing details about well
            ownership_volume_dict (dict): collection of various volumes by phase, type, ownership
            volume_t (ndarray): time index series that starts from as of date to last economic event
            capex_t (int): time index of current CAPEX
            unadjusted_wh_volume (dict): original production values without any truncation

        Returns:
            ndarray: investment tangible depletion rate time series
            ndarray: investment intangible depletion rate time series
        '''

        tangible_depletion_para = self._depletion_pre_helper(tangible_depletion_model, primary_product,
                                                             ownership_volume_dict, volume_t, capex_t,
                                                             unadjusted_wh_volume, date_dict)

        intangible_depletion_para = self._depletion_pre_helper(intangible_depletion_model, primary_product,
                                                               ownership_volume_dict, volume_t, capex_t,
                                                               unadjusted_wh_volume, date_dict)

        return tangible_depletion_para, intangible_depletion_para

    ## depreciation
    def _depreciation_pre(self, this_depre_para_yearly, remaining_months):
        '''Converts yearly depreciation rates to monthly rates

        Args:
            this_depre_para_yearly (dict): time series of yearly depreciation rates
            remaining months (int): remaining months in the first year of depreciation

        Returns:
            ndarray: tangible depreciation monthly rates
            ndarray: intangible depreciation monthly rates
        '''
        # First Year Depreciation
        yearly_factors = this_depre_para_yearly['rows']
        tan_para = np.repeat([yearly_factors[0]['tan_factor'] / (100 * remaining_months)], remaining_months)
        intan_para = np.repeat([yearly_factors[0]['intan_factor'] / (100 * remaining_months)], remaining_months)

        # Middle Years Depreciation
        for i in range(1, len(yearly_factors) - 1):
            this_row = yearly_factors[i]
            tan_para = np.append(tan_para, np.repeat(this_row['tan_factor'] / (100 * 12), 12))
            intan_para = np.append(intan_para, np.repeat(this_row['intan_factor'] / (100 * 12), 12))

        # Final Year 6 Month Depreciation
        tan_para = np.append(tan_para, np.repeat(yearly_factors[-1]['tan_factor'] / (100 * 6), 6))
        intan_para = np.append(intan_para, np.repeat(yearly_factors[-1]['intan_factor'] / (100 * 6), 6))

        return tan_para, intan_para


class GroupBeforeIncomeTaxCashFlow(EconCalculation):
    # group before income tax cash flow
    def __init__(
        self,
        group_df,
    ):
        self.group_df = group_df

    def result(
        self,
        revenue_dict,
        fixed_expenses,
        variable_expenses,
        water_disposal,
        carbon_expenses,
        production_tax_dict,
        capex_dict,
        npi,
        t_all,
    ):

        bfit_cf = np.zeros(len(t_all))
        bfit_dict = {'time': t_all}

        total_nr = np.zeros(len(t_all))
        total_gr = np.zeros(len(t_all))
        for key in revenue_dict:
            if key != 'time':
                total_nr = np.add(total_nr, revenue_dict[key]['net_revenue'])
                total_gr = np.add(total_gr, revenue_dict[key]['gross_revenue'])

        total_expense = np.zeros(len(t_all))
        for expenses in [fixed_expenses, variable_expenses, water_disposal, carbon_expenses]:
            for one_expense in expenses:
                total_expense = np.add(total_expense, one_expense['values'])

        bfit_dict['total_net_revenue'] = total_nr
        bfit_dict['total_gross_revenue'] = total_gr

        # add up group and aggregation expense, tax and capex
        bfit_dict['expense'] = total_expense + self.group_df['total_expense'].to_numpy()
        bfit_dict['production_tax'] = production_tax_dict['total_production_tax'] + self.group_df[
            'total_production_tax'].to_numpy()
        bfit_dict['capex'] = capex_dict['total_capex'] + self.group_df['total_capex'].to_numpy()

        total_np = bfit_dict['total_net_revenue'] - bfit_dict['expense'] - bfit_dict['production_tax']

        # net profit
        net_profit = np.zeros(len(total_nr))
        key = list(npi.keys())[0]
        if key == 'expense':
            net_profit[total_np > 0] = total_np[total_np > 0] * (-npi[key][total_np > 0])
        elif key == 'revenue':
            net_profit[total_np > 0] = total_np[total_np > 0] * (npi[key][total_np > 0])
        bfit_dict['net_profit'] = net_profit

        # net_income
        bfit_dict['net_income'] = total_np + net_profit

        # bfit_cf
        if key == 'expense':
            bfit_cf = (total_np - bfit_dict['capex']) + net_profit
        elif key == 'revenue':
            bfit_cf = net_profit
        bfit_dict['bfit_cf'] = bfit_cf

        return {'bfit_cf_dict': bfit_dict}


class GroupCaseBeforeIncomeTaxCashFlow(EconCalculation):
    # group case before income tax cash flow
    def result(
        self,
        fixed_expenses,
        variable_expenses,
        water_disposal,
        carbon_expenses,
        production_tax_dict,
        capex_dict,
        npi,
        t_all,
    ):

        bfit_cf = np.zeros(len(t_all))
        bfit_dict = {'time': t_all}

        # no revenue for group case
        total_nr = np.zeros(len(t_all))
        total_gr = np.zeros(len(t_all))

        total_expense = np.zeros(len(t_all))
        for expenses in [fixed_expenses, variable_expenses, water_disposal, carbon_expenses]:
            for one_expense in expenses:
                total_expense = np.add(total_expense, one_expense['values'])

        bfit_dict['total_net_revenue'] = total_nr
        bfit_dict['total_gross_revenue'] = total_gr

        # add up group and aggregation expense, tax and capex
        bfit_dict['expense'] = total_expense
        bfit_dict['production_tax'] = production_tax_dict['total_production_tax']
        bfit_dict['capex'] = capex_dict['total_capex']

        total_np = bfit_dict['total_net_revenue'] - bfit_dict['expense'] - bfit_dict['production_tax']

        # net profit
        net_profit = np.zeros(len(total_nr))
        key = list(npi.keys())[0]
        if key == 'expense':
            net_profit[total_np > 0] = total_np[total_np > 0] * (-npi[key][total_np > 0])
        elif key == 'revenue':
            net_profit[total_np > 0] = total_np[total_np > 0] * (npi[key][total_np > 0])
        bfit_dict['net_profit'] = net_profit

        # net_income
        bfit_dict['net_income'] = total_np + net_profit

        # bfit_cf
        if key == 'expense':
            bfit_cf = (total_np - bfit_dict['capex']) + net_profit
        elif key == 'revenue':
            bfit_cf = net_profit
        bfit_dict['bfit_cf'] = bfit_cf

        return {'bfit_cf_dict': bfit_dict}
