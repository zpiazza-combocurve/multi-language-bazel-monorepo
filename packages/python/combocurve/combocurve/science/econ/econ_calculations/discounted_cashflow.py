from combocurve.science.econ.econ_calculations.calculation import EconCalculation
import numpy as np
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.econ_calculations.discount import (get_num_period, get_cum_days, phdwin_discount,
                                                                get_discounted_capex_no_copy)
from combocurve.science.econ.general_functions import get_discount_key

DISCOUNT_TABLE_CF_PREFIX = 'discount_table_cash_flow'


class DiscountedCashflow:
    def _get_monthly_discounted_dict(self, date_list, cf_dict, capex_dict, date_dict, capex_daily_discount=True):
        disc_para, disc_date = self._get_disc_date_and_params(date_dict)

        np.seterr(under='warn')

        disc_method = disc_para['disc_method']
        cash_accrual_time = disc_para['cash_accrual_time']
        disc_rate = disc_para['disc_rate']
        one_line_rows = disc_para['one_line_rows']

        date = date_list
        cf = cf_dict

        num_period = get_num_period(disc_method)
        discount_index, discount_cum_days = get_cum_days(date, disc_date, cash_accrual_time)

        # initialize log
        discounted_cf_dict = {'detail_cf': {'date': date, 'cf': cf}, 'npv': {}}

        # discount name
        discounted_cf_dict['discount_name'] = {}
        discounted_cf_dict['discount_name']['first_discount'] = get_discount_key(disc_rate[0])
        discounted_cf_dict['discount_name']['second_discount'] = get_discount_key(disc_rate[1])
        discounted_cf_dict['discount_name']['discount_table'] = []
        for rate in one_line_rows:
            discounted_cf_dict['discount_name']['discount_table'].append(get_discount_key(rate))

        discount_rates = {
            'detail_cf': {
                'key_prefix': 'disc_cf',
                'rates': disc_rate
            },
            'npv': {
                'key_prefix': DISCOUNT_TABLE_CF_PREFIX,
                'rates': one_line_rows
            }
        }

        # discount calculation
        if capex_dict is None:
            for key, discount_info in discount_rates.items():
                key_prefix = discount_info['key_prefix']
                rates = discount_info['rates']
                for i, rate in enumerate(rates):
                    disc_rate_list = np.ones(len(date))
                    disc_rate_list[discount_index] = phdwin_discount(rate, num_period, discount_cum_days)
                    disc_cf = np.multiply(cf, disc_rate_list)
                    discounted_cf_dict[key][f'{key_prefix}_{i+1}'] = disc_cf
        else:
            total_capex = capex_dict['total_capex']
            cf_bf_capex = cf + total_capex

            for key, discount_info in discount_rates.items():
                key_prefix = discount_info['key_prefix']
                rates = discount_info['rates']
                for i, rate in enumerate(rates):
                    disc_rate_list = np.ones(len(date))
                    disc_rate_list[discount_index] = phdwin_discount(rate, num_period, discount_cum_days)
                    discounted_net_income = np.multiply(cf_bf_capex, disc_rate_list)

                    if capex_daily_discount:
                        discounted_capex = get_discounted_capex_no_copy(capex_dict, disc_date, num_period, rate)
                    else:
                        discounted_capex = np.multiply(capex_dict['total_capex'], disc_rate_list)

                    # log discounted capex
                    if key_prefix == 'disc_cf' and i == 0:
                        discounted_cf_dict['first_discounted_capex'] = discounted_capex
                        discounted_cf_dict['first_discount_net_income'] = discounted_net_income

                    if key_prefix == 'disc_cf' and i == 1:
                        discounted_cf_dict['second_discounted_capex'] = discounted_capex
                        discounted_cf_dict['second_discount_net_income'] = discounted_net_income

                    discounted_cf_dict[key][f'{key_prefix}_{i+1}'] = discounted_net_income - discounted_capex
        return discounted_cf_dict

    def _get_disc_date_and_params(self, date_dict):
        discount_table = self.general_option_model['discount_table']
        disc_para = PreProcess.discount_pre(discount_table)

        return disc_para, date_dict['discount_date']


class BeforeIncomeTaxDiscountedCashflow(EconCalculation, DiscountedCashflow):
    def __init__(self, date_dict, general_option_model):
        self.date_dict = date_dict
        self.general_option_model = general_option_model

    def result(self, date_list, bfit_cf_dict, capex_dict):
        return {
            'discounted_bfit_cf_dict':
            self._get_monthly_discounted_dict(date_list, bfit_cf_dict['bfit_cf'], capex_dict, self.date_dict)
        }


class GroupBeforeIncomeTaxDiscountedCashflow(EconCalculation, DiscountedCashflow):
    '''
    Group discount calculation need to discount capex by monthly now due to group capex_detail not passed to well level
    '''
    def __init__(self, date_dict, general_option_model):
        self.date_dict = date_dict
        self.general_option_model = general_option_model

    def result(self, date_list, bfit_cf_dict, capex_dict):
        return {
            'discounted_bfit_cf_dict':
            self._get_monthly_discounted_dict(
                date_list,
                bfit_cf_dict['bfit_cf'],
                capex_dict,
                self.date_dict,
                capex_daily_discount=False,
            )
        }


class AfterIncomeTaxDiscountedCashflow(EconCalculation, DiscountedCashflow):
    def __init__(self, date_dict, general_option_model):
        self.general_option_model = general_option_model
        self.date_dict = date_dict

    def result(self, date_list, afit_cf_dict, capex_dict):
        return {
            'discounted_afit_cf_dict':
            self._get_monthly_discounted_dict(date_list, afit_cf_dict['afit_cf'], capex_dict, self.date_dict)
        }


class GroupAfterIncomeTaxDiscountedCashflow(EconCalculation, DiscountedCashflow):
    '''
    Group discount calculation need to discount capex by monthly now due to group capex_detail not passed to well level
    '''
    def __init__(self, date_dict, general_option_model):
        self.general_option_model = general_option_model
        self.date_dict = date_dict

    def result(self, date_list, afit_cf_dict, capex_dict):
        return {
            'discounted_afit_cf_dict':
            self._get_monthly_discounted_dict(
                date_list,
                afit_cf_dict['afit_cf'],
                capex_dict,
                self.date_dict,
                capex_daily_discount=False,
            )
        }
