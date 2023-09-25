import datetime
from typing import Optional

import numpy as np
from dateutil.relativedelta import relativedelta

from combocurve.science.econ.helpers import date_to_t
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.general_functions import get_py_date
from combocurve.science.econ.econ_calculations.reversion import get_gross_ownership
from combocurve.science.econ.econ_calculations.discount import (
    get_discounted_capex,
    get_num_period,
    get_cum_days,
    phdwin_discount,
)
from combocurve.science.econ.econ_calculations.well_result import (
    econ_result_for_group_volume_cutoff,
    econ_result_for_group_cf_cutoff,
)


class CutOffError(Exception):
    expected = True


NO_CUT_OFF = 'no_cut_off'
DATE_CUT_OFF_KEYS = ['date', 'years_from_as_of']
VOLUME_CUT_OFF_KEYS = ['oil_rate', 'gas_rate', 'water_rate']
CF_CUT_OFF_KEYS = [
    'first_negative_cash_flow',
    'max_cum_cash_flow',
    'last_positive_cash_flow',
]
NUM_DAYS_IN_YEAR = 365


def apply_min_cut_off(
    real_cut_off,
    t_real_cut_off,
    unecon_bool,
    min_cut_off,
    fpd,
    as_of_date,
    end_hist_date,
    max_econ_life_date,
):
    min_date = None

    if 'none' not in min_cut_off:
        # process of min_cut_off
        if 'date' in min_cut_off:
            min_date_input = get_py_date(min_cut_off['date'])
            if min_date_input > as_of_date:
                min_date = min_date_input
        elif 'as_of' in min_cut_off:
            offset_months = min_cut_off['as_of']
            if offset_months > 0:
                min_date = as_of_date + relativedelta(months=offset_months, days=-1)
        elif 'end_hist' in min_cut_off:
            if end_hist_date > as_of_date:
                min_date = end_hist_date

    if min_date is not None:
        min_date = min(min_date, max_econ_life_date)

        t_min_date = date_to_t(min_date, fpd)
        if unecon_bool is False:
            if real_cut_off < min_date:
                return min_date, t_min_date, False
            else:
                return real_cut_off, t_real_cut_off, False
        else:
            return min_date, t_min_date, False

    return real_cut_off, t_real_cut_off, unecon_bool


def get_first_negative_with_tolerance(cf, tolerance):
    '''
    get first negative index with tolerance number of consecutive negative
    '''
    positive_index = cf >= 0
    cut_off_index = len(positive_index) - 1
    for i in range(len(positive_index)):
        if not positive_index[i]:  # when this cf less than 0, check a number of numbers after it
            period = positive_index[i:i + tolerance + 1]
            if sum(period) == 0:
                cut_off_index = i - 1
                break

    cut_off_before_date_range = True if cut_off_index < 0 else False

    return max(cut_off_index, 0), cut_off_before_date_range, None


def get_cut_off_key(cut_off_model):
    key_intersection = list({*DATE_CUT_OFF_KEYS, *VOLUME_CUT_OFF_KEYS, *CF_CUT_OFF_KEYS, NO_CUT_OFF}
                            & set(cut_off_model.keys()))
    if len(key_intersection) == 1:
        return key_intersection[0]
    else:
        raise CutOffError('Unexpected cutoff type')


def cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=False, feature_flags=None):
    '''
    well_result need to have ownership_params, t_ownership, rev_dates_detail
    '''
    date_dict = well_input['date_dict']
    cut_off_model = well_input['cut_off_model']
    as_of_date = date_dict['as_of_date']
    fpd = date_dict['first_production_date']

    # the last day of the ehd's month, since it was changed to the
    # first day of the month following ehd for processing models
    end_history_date = date_dict['end_history_date'] + relativedelta(days=-1)

    # cf end date should be as_of_date + max econ life at this moment
    max_econ_life_date = date_dict['cf_end_date']
    # cut off date is as of date and unecon_bool is True if fpd or as of date is before max econ life date
    if max_econ_life_date < fpd or max_econ_life_date < as_of_date:
        if return_cutoff_well_result:
            return as_of_date, True, None
        else:
            return as_of_date, True

    cut_off_key = get_cut_off_key(cut_off_model)

    t_max_econ_life_date = date_to_t(max_econ_life_date, fpd)
    econ_calc_results = econ_results_for_adjusted_ownership(well_input, well_result, econ_calc_func, feature_flags)
    econ_results = calculate_econ_results(econ_calc_results, cut_off_key)

    if cut_off_key == NO_CUT_OFF:
        real_cut_off_date = max_econ_life_date
        t_real_cut_off_date = t_max_econ_life_date
    else:
        real_cut_off_date, t_real_cut_off_date = apply_cutoff(cut_off_model, date_dict, cut_off_key, well_input,
                                                              econ_results)

    unecon_bool = real_cut_off_date <= date_dict['cf_start_date']
    if unecon_bool or real_cut_off_date > max_econ_life_date:
        real_cut_off_date, t_real_cut_off_date = adjust_cutoff(real_cut_off_date, date_dict, max_econ_life_date,
                                                               t_max_econ_life_date)

    # handle min_life
    min_cut_off = cut_off_model.get('min_cut_off', {'none': ''})
    real_cut_off_date, t_real_cut_off_date, unecon_bool = apply_min_cut_off(
        real_cut_off_date,
        t_real_cut_off_date,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_history_date,
        max_econ_life_date,
    )
    if return_cutoff_well_result:
        return real_cut_off_date, unecon_bool, econ_results
    else:
        return real_cut_off_date, unecon_bool


def adjust_cutoff(real_cut_off_date, date_dict, max_econ_life_date, t_max_econ_life_date):
    '''
    can happen in all 3 type of cut off:
    date: input date before cf start date
    cf: when well has cum cf less than 0
    volume: all volume less than cut off volume
    '''
    unecon_bool = real_cut_off_date <= date_dict['cf_start_date']

    if unecon_bool:
        # when unecon, the real_cut_off_date will set to as of date
        real_cut_off_date = date_dict['as_of_date']
        t_real_cut_off_date = date_to_t(date_dict['as_of_date'], date_dict['first_production_date'])

    # cutoff date should always before max econ life
    if real_cut_off_date > max_econ_life_date:
        real_cut_off_date = date_dict['cf_end_date']
        t_real_cut_off_date = t_max_econ_life_date

    return real_cut_off_date, t_real_cut_off_date


def econ_results_for_adjusted_ownership(well_input,
                                        well_result,
                                        econ_calc_func,
                                        feature_flags: Optional[dict[str, bool]] = None):
    # adjust ownership for cut off calculation, set the working interest to be 100% and nri to be lease_nri
    gross_ownership_params = get_gross_ownership(well_result['ownership_params'])
    cutoff_well_result = {**well_result, 'ownership_params': gross_ownership_params}

    return econ_calc_func(well_input, cutoff_well_result, feature_flags=feature_flags)


def calculate_econ_results(econ_calc_results, cut_off_key):
    if type(econ_calc_results) is dict:
        if cut_off_key in VOLUME_CUT_OFF_KEYS:
            return econ_result_for_group_volume_cutoff(econ_calc_results)
        elif cut_off_key in CF_CUT_OFF_KEYS:
            return econ_result_for_group_cf_cutoff(econ_calc_results)
    else:
        return econ_calc_results.simple_econ_result()


def apply_cutoff(cut_off_model, date_dict, cut_off_key, well_input, econ_results):
    if cut_off_key in DATE_CUT_OFF_KEYS:
        real_cut_off_date, t_real_cut_off_date = apply_date_cutoff(cut_off_model, date_dict)

    elif cut_off_key in VOLUME_CUT_OFF_KEYS:
        real_cut_off_date, t_real_cut_off_date = apply_volume_cutoff(cut_off_model, cut_off_key, date_dict,
                                                                     econ_results)

    elif cut_off_key in CF_CUT_OFF_KEYS:
        econ_limit_delay = cut_off_model.get('econ_limit_delay', 0)
        real_cut_off_date, t_real_cut_off_date = apply_cf_cutoff(cut_off_model, cut_off_key, well_input, econ_results,
                                                                 econ_limit_delay)

    return real_cut_off_date, t_real_cut_off_date


def apply_date_cutoff(cut_off_model, date_dict):
    if 'date' in cut_off_model.keys():
        real_cut_off_date = get_py_date(cut_off_model['date'])
    elif 'years_from_as_of' in cut_off_model.keys():
        as_of_date = date_dict['as_of_date']
        real_cut_off_date = as_of_date + datetime.timedelta(days=int(cut_off_model['years_from_as_of']
                                                                     * NUM_DAYS_IN_YEAR))
    else:
        raise CutOffError('Invalid date cutoff option')

    t_real_cut_off_date = date_to_t(real_cut_off_date, date_dict['first_production_date'])

    return real_cut_off_date, t_real_cut_off_date


def apply_volume_cutoff(cut_off_model, cut_off_key, date_dict, econ_results):
    fpd = date_dict['first_production_date']

    this_cut_off = cut_off_model[cut_off_key]
    prod_key = cut_off_key.replace('_rate', '')
    dates = econ_results.get('py_date')

    this_wh = np.array(econ_results['volume'][prod_key]['well_head'])
    if econ_results.get('daily_wh_volume'):
        this_wh_daily = np.array(econ_results['daily_wh_volume'][prod_key]['value'])
        daily_index = np.array(econ_results['daily_wh_volume'][prod_key]['index'])
    else:
        this_wh_daily = np.array([])
        daily_index = np.array([])
    daily_indicate_array = this_wh_daily < this_cut_off

    real_cut_off_date = volume_cutoff_date(daily_indicate_array, daily_index, this_wh, this_cut_off, dates)

    t_real_cut_off_date = date_to_t(real_cut_off_date, fpd)

    return real_cut_off_date, t_real_cut_off_date


def volume_cutoff_date(daily_indicate_array, daily_index, this_wh, this_cut_off, dates):
    '''
        currently there is a bug with daily volume reversion
        daily_indicate_array[-1] is True will never be True due to daily_indicate_array has numpy bool type
        should do:  bool(daily_indicate_array[-1]) is True
        fix this in major release due to this will change people's number
        (https://github.com/insidepetroleum/python-combocurve/pull/2308)

    if (len(daily_indicate_array) > 0 and np.sum(daily_indicate_array) > 0
            and np.sum(daily_indicate_array) < len(daily_indicate_array) and daily_indicate_array[-1]):
        # use daily resolution for cut off based on production
        real_cut_off_daily_index = daily_index[(len(daily_indicate_array) - 1)
                                               - np.argmin(np.flip(daily_indicate_array))]
        real_cut_off_date = (np.datetime64('1900-01-01') + real_cut_off_daily_index).astype(datetime.date)
    '''
    if 1 == 2:
        pass
    else:
        # use monthly resolution for cut off based on production
        indicate_array = this_wh < this_cut_off * 30.4375

        if np.sum(indicate_array) == 0 or indicate_array[-1] is False:
            # if no volume less than cut off rate, set cut off date as last day of month of cf end date
            real_cut_off_date = (dates[-1] + relativedelta(months=1) - datetime.timedelta(1))
        elif np.sum(indicate_array) == len(indicate_array):
            # # uneconomic case: all volume less than cut off rate, set cut off date 1 day before cf start date
            real_cut_off_date = dates[0] - datetime.timedelta(1)
        else:
            real_cut_off_monthly_index = (len(indicate_array) - 1) - np.argmin(np.flip(indicate_array))
            # last day of cut off month
            real_cut_off_date = (dates[real_cut_off_monthly_index] + relativedelta(months=1) - datetime.timedelta(1))

    return real_cut_off_date


def if_cf_cutoff_unecon(
    cf_after_deduct,
    include_capex,
    cut_off_index,
    econ_results,
    discounted_capex_detail=None,
):
    cf_cutoff_unecon = False

    cut_off_absolute_index = econ_results['time'][cut_off_index]
    if cut_off_absolute_index < 0:
        return True

    cf_after_deduct_to_cut_off = cf_after_deduct[:cut_off_index + 1]
    capex_detail = discounted_capex_detail if discounted_capex_detail else econ_results['capex']['capex_detail']

    # only include capex in after_cutoff_capex_sum if after_econ_limit is yes and index larger than cutoff index
    # c['index'] is absolute index that fpd is 0, cut_off_index in relative index of econ result array
    after_cutoff_capex_sum = sum([
        c['discounted_total'] if discounted_capex_detail else c['total'] for c in capex_detail
        if c['index'] > cut_off_absolute_index and c['after_econ_limit'] == 'yes'
    ])

    if sum(cf_after_deduct_to_cut_off) < 0:  # cum CF until cutoff < 0
        cf_cutoff_unecon = True
    elif include_capex == 'yes':  # even cum CF until cutoff < 0, capex after cutoff make the overall sum negative
        if sum(cf_after_deduct_to_cut_off) - after_cutoff_capex_sum < 0:
            cf_cutoff_unecon = True
    return cf_cutoff_unecon


def cf_after_expense_deduction(include_capex, econ_results):
    cf_before_deduction = econ_results['bfit_cf']['bfit_cf']
    ecl_deduct = np.zeros(len(cf_before_deduction))

    expenses = ['var', 'fixed', 'water', 'ghg']

    for exp_type in expenses:
        for expense in econ_results['expense'][exp_type + '_expense']:
            if expense['affect_econ_limit'] == 'no':
                ecl_deduct += expense['values']
    # deduct capex
    if include_capex == 'no':
        ecl_deduct += econ_results['bfit_cf']['capex']

    return cf_before_deduction + ecl_deduct


def get_last_positive_cashflow(cf_after_deduct):
    '''
        Returned variables are:
            cut_off_index
            cut_off_before_date_range
            discounted_capex_detail
    '''
    positive_index = (cf_after_deduct) > 0
    if sum(positive_index) == 0:
        return 0, True, None
    else:
        positive_index_rev = positive_index[::-1]  # reverse positive_index to find first positive
        max_index = np.argmax(positive_index_rev)
        return max(len(positive_index) - max_index - 1, 0), False, None


def max_cum_cf_cutoff_index(cut_off_discount, well_input, dates, include_capex, econ_results, cf_after_deduct):
    discounted_capex_detail = None
    if cut_off_discount:
        disc_rate = float(cut_off_discount) / 100
        disc_para = PreProcess.discount_pre(well_input['general_option_model']['discount_table'])
        disc_method = disc_para['disc_method']
        cash_accrual_time = disc_para['cash_accrual_time']
        disc_date = get_py_date(well_input['date_dict']['discount_date'])

        discount_index, discount_cum_days = get_cum_days(dates, disc_date, cash_accrual_time)

        num_period = get_num_period(disc_method)
        disc_rates = np.ones(len(dates))
        disc_rates[discount_index] = phdwin_discount(disc_rate, num_period, discount_cum_days)

        if include_capex == 'no':
            cf_after_deduct = np.multiply(cf_after_deduct, disc_rates)
        else:
            # need to discount capex seperately on daily basis to make it consistent with other part of econ
            capex_log = econ_results['capex']
            capex_disc_input = {
                'capex_detail': capex_log['capex_detail'],
                'total_capex': capex_log['total_capex'],
                'time': capex_log['time'],
            }
            cf_before_capex = cf_after_deduct + capex_log['total_capex']
            discounted_capex, discounted_capex_detail = get_discounted_capex(capex_disc_input, disc_date, num_period,
                                                                             disc_rate)
            cf_after_deduct = (np.multiply(cf_before_capex, disc_rates) - discounted_capex)

    cum_bfit = np.cumsum(cf_after_deduct)
    return np.argmax(cum_bfit), False, discounted_capex_detail


def calculate_real_cutoff_date(
    cutoff_details,
    econ_limit_delay,
    dates,
    cf_after_deduct,
    include_capex,
    econ_results,
    fpd,
):
    cut_off_index, cut_off_before_date_range, discounted_capex_detail = cutoff_details
    if econ_limit_delay != 0:
        # handle ECL delay, if ECL delay > 0, well will always run
        delay_months = (econ_limit_delay - 1 if cut_off_before_date_range else econ_limit_delay)
        real_cut_off_date = (dates[cut_off_index] + relativedelta(months=1 + delay_months) - datetime.timedelta(1))
    else:
        # if include_capex is yes, need to consider capex after econ limit when decide if well is unecon
        cf_cutoff_unecon = if_cf_cutoff_unecon(
            cf_after_deduct,
            include_capex,
            cut_off_index,
            econ_results,
            discounted_capex_detail,
        )
        if cf_cutoff_unecon:
            # uneconomic case, set cut off date 1 day before cf start date
            real_cut_off_date = dates[0] - datetime.timedelta(1)
        else:
            real_cut_off_date = (dates[cut_off_index] + relativedelta(months=1) - datetime.timedelta(1))

    return real_cut_off_date, date_to_t(real_cut_off_date, fpd)


def apply_cf_cutoff(cut_off_model, cut_off_key, well_input, econ_results, econ_limit_delay=None):
    include_capex = cut_off_model.get('include_capex', 'no')
    cut_off_discount = cut_off_model.get('discount', 0)
    consecutive_negative = cut_off_model.get('consecutive_negative', 0)
    fpd = well_input['date_dict']['first_production_date']

    dates = econ_results['py_date']

    cf_after_deduct = cf_after_expense_deduction(include_capex, econ_results)

    if cut_off_key == 'max_cum_cash_flow':
        cutoff_details = max_cum_cf_cutoff_index(cut_off_discount, well_input, dates, include_capex, econ_results,
                                                 cf_after_deduct)
    elif cut_off_key == 'first_negative_cash_flow':
        cutoff_details = get_first_negative_with_tolerance(cf_after_deduct, consecutive_negative)
    elif cut_off_key == 'last_positive_cash_flow':
        cutoff_details = get_last_positive_cashflow(cf_after_deduct)
    else:
        raise CutOffError('Invalid cutoff criteria', None)

    return calculate_real_cutoff_date(
        cutoff_details,
        econ_limit_delay,
        dates,
        cf_after_deduct,
        include_capex,
        econ_results,
        fpd,
    )
