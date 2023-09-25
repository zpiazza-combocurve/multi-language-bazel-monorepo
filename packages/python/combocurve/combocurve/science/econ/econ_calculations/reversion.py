import copy
import datetime
from typing import Optional

import numpy as np
from calendar import monthrange
from dateutil.relativedelta import relativedelta
from combocurve.science.econ.helpers import date_to_t
from combocurve.science.econ.general_functions import get_py_date, adjust_array_zero
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.shared.econ_tools.econ_model_tools import CriteriaEnum, OwnershipEnum
from combocurve.science.econ.econ_calculations.discount import (get_num_period, get_cum_days, phdwin_discount)
from combocurve.science.econ.econ_calculations.well_result import (econ_result_for_group_volume_cutoff,
                                                                   econ_result_for_group_cf_cutoff)


class ReversionError(Exception):
    expected = True


WELL_HEAD = 'well_head'

NO_REVERSION = 'no_reversion'
VOLUME_REVERSION = 'volume_reversion'
DATE_REVERSION = 'date_reversion'
MONEY_REVERSION = 'money_reversion'

OWNERSHIP = OwnershipEnum.OWNERSHIP.value
WI = OwnershipEnum.WI.value
ORIGINAL_OWNERSHIP = OwnershipEnum.ORIGINAL_OWNERSHIP.value
NRI = OwnershipEnum.NRI.value
LEASE_NRI = OwnershipEnum.LEASE_NRI.value
NPI = OwnershipEnum.NPI.value
NPI_TYPE = OwnershipEnum.NPI_TYPE.value

VOLUME_REVERSION_KEYS = ['well_head_oil_cum', 'well_head_gas_cum', 'well_head_boe_cum']
DATE_REVERSION_KEYS = [
    'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
    'offset_to_end_history', 'date'
]
MONEY_REVERSION_KEYS = {'irr', 'payout_with_investment', 'payout_without_investment', 'roi_undisc'}


def pct_to_decimal(pct):
    return pct / 100


def get_phase_ownership_value(one_ownership_model, phase, ownership_key):
    if one_ownership_model[f'{phase}_{OWNERSHIP}'].get(ownership_key, '') != '':
        # the get here is due to reversion phase ownership will miss lease_net_revenue_interest key
        return pct_to_decimal(one_ownership_model[f'{phase}_{OWNERSHIP}'][ownership_key])
    else:
        return pct_to_decimal(one_ownership_model[ORIGINAL_OWNERSHIP][ownership_key])


def get_reversion_tied_to_date(reversion_model, date_dict):
    reversion_tied_to = reversion_model.get('reversion_tied_to', {'as_of': None})
    if 'date' in reversion_tied_to:
        return get_py_date(reversion_tied_to['date'])
    elif 'fpd' in reversion_tied_to:
        return date_dict['first_production_date']
    else:
        # as of date
        return date_dict['as_of_date']


def get_earliest_tied_to_date(ownership_model, date_dict):
    earliest_tied_to_date = date_dict['first_production_date']

    for key, item in ownership_model.items():
        if 'reversion' in key:
            tied_to_date = get_reversion_tied_to_date(item, date_dict)

            if tied_to_date < earliest_tied_to_date:
                earliest_tied_to_date = tied_to_date

    return min(date_dict['cf_start_date'], earliest_tied_to_date)


def get_initial_ownership_params(initial_ownership_model, date_dict, earliest_tied_to_date=None):
    '''
    in order to cover volume reversion before cf_start_date
    ownership_start_date should be the earliest of look back date in future
    '''
    if earliest_tied_to_date:
        ownership_start_date = earliest_tied_to_date
    else:
        ownership_start_date = date_dict['cf_start_date']

    t_ownership_start_date = date_to_t(ownership_start_date, date_dict['first_production_date'])
    t_ownership_end_date = date_to_t(date_dict['cf_end_date'], date_dict['first_production_date'])

    if t_ownership_end_date < t_ownership_start_date:
        # can happen when well life is 0
        t_ownership_end_date = t_ownership_start_date

    t_ownership = np.arange(t_ownership_start_date, t_ownership_end_date + 1)
    ownership_params = {NPI_TYPE: initial_ownership_model[NPI_TYPE], ORIGINAL_OWNERSHIP: {}}
    ownership_params[WI] = np.repeat(pct_to_decimal(initial_ownership_model[WI]), len(t_ownership))
    ownership_params[NPI] = np.repeat(pct_to_decimal(initial_ownership_model[NPI]), len(t_ownership))

    ownership_params[ORIGINAL_OWNERSHIP][NRI] = np.repeat(
        pct_to_decimal(initial_ownership_model[ORIGINAL_OWNERSHIP][NRI]), len(t_ownership))
    ownership_params[ORIGINAL_OWNERSHIP][LEASE_NRI] = np.repeat(
        pct_to_decimal(initial_ownership_model[ORIGINAL_OWNERSHIP][LEASE_NRI]), len(t_ownership))

    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        phase_ownership = {}
        for key in [NRI, LEASE_NRI]:
            ownership_value = get_phase_ownership_value(initial_ownership_model, phase, key)
            phase_ownership[key] = np.repeat(ownership_value, len(t_ownership))

        ownership_params[f'{phase}_{OWNERSHIP}'] = phase_ownership

    return ownership_params, t_ownership


def get_reversion_key(reversion_model):
    key_intersection = list({*DATE_REVERSION_KEYS, *MONEY_REVERSION_KEYS, *VOLUME_REVERSION_KEYS, NO_REVERSION}
                            & set(reversion_model.keys()))
    if len(key_intersection) == 1:
        return key_intersection[0]
    else:
        raise ReversionError('Unexpected reversion type')


def final_ownership_and_reversion_dates(econ_calc_func,
                                        well_input,
                                        well_result=None,
                                        feature_flags: Optional[dict[str, bool]] = None):
    '''
    well_result will be used in group Econ reversion calculation
    '''
    if well_result is None:
        well_result = {}
    if feature_flags is None:
        feature_flags = {}
    rev_dates_detail = []
    ownership_model = well_input['ownership_model'][OWNERSHIP]

    # compute original ownership_params and t_ownership
    initial_ownership_model = ownership_model[OwnershipEnum.INITIAL_OWNERSHIP.value]
    earliest_tied_to_date = get_earliest_tied_to_date(ownership_model, well_input['date_dict'])
    ownership_params, t_ownership = get_initial_ownership_params(initial_ownership_model, well_input['date_dict'],
                                                                 earliest_tied_to_date)

    if well_input['date_dict']['cf_end_date'] < well_input['date_dict']['cf_start_date']:
        # can happen when well life is 0, no need consider reversion
        return ownership_params, t_ownership, rev_dates_detail

    reversion_list = [
        ownership_model[reversion_key] for reversion_key in ownership_model
        if reversion_key != OwnershipEnum.INITIAL_OWNERSHIP.value
    ]
    previous_reversion_model = initial_ownership_model

    for this_reversion_model in reversion_list:
        reversion_key = get_reversion_key(this_reversion_model)

        if reversion_key == NO_REVERSION:
            continue

        rev_well_input = copy.copy(well_input)

        if reversion_key in MONEY_REVERSION_KEYS:
            rev_date_dict = copy.deepcopy(rev_well_input['date_dict'])
            rev_date_dict['as_of_date'] = get_reversion_tied_to_date(this_reversion_model, rev_date_dict)
            rev_date_dict['cf_start_date'] = rev_date_dict['as_of_date']

            # set CF prior to as of date as 'no' when calculating reversion
            rev_well_input.update({
                'date_dict': rev_date_dict,
                'dates_setting': {
                    **rev_well_input['dates_setting'], 'cash_flow_prior_to_as_of_date': 'no'
                },
            })

            econ_result = money_reversion_econ_result(econ_calc_func,
                                                      rev_well_input,
                                                      well_result,
                                                      this_reversion_model,
                                                      ownership_params,
                                                      rev_dates_detail,
                                                      t_ownership,
                                                      feature_flags=feature_flags)
            ownership_params, rev_dates_detail = apply_money_reversion(econ_result, rev_well_input, reversion_key,
                                                                       this_reversion_model, previous_reversion_model,
                                                                       ownership_params, rev_dates_detail, t_ownership)
        elif reversion_key in VOLUME_REVERSION_KEYS:
            # cum volume calculation start from FPD
            # update as_of_date will also make cf_start_date been updated, single_econ: get_capex_params_with_dates
            rev_date_dict = copy.deepcopy(rev_well_input['date_dict'])
            rev_date_dict['as_of_date'] = rev_date_dict['first_production_date']
            rev_date_dict['cf_start_date'] = rev_date_dict['first_production_date']
            rev_well_input.update({'date_dict': rev_date_dict})

            econ_result = volume_reversion_econ_result(econ_calc_func,
                                                       rev_well_input,
                                                       well_result,
                                                       ownership_params,
                                                       t_ownership,
                                                       feature_flags=feature_flags)
            ownership_params, rev_dates_detail = apply_volume_reversion(econ_result, rev_well_input, reversion_key,
                                                                        this_reversion_model, previous_reversion_model,
                                                                        ownership_params, rev_dates_detail, t_ownership)

        elif reversion_key in DATE_REVERSION_KEYS:
            ownership_params, rev_dates_detail = apply_date_reversion(reversion_key, this_reversion_model,
                                                                      previous_reversion_model,
                                                                      rev_well_input['date_dict'], ownership_params,
                                                                      rev_dates_detail, t_ownership)

        previous_reversion_model = this_reversion_model  # update previous_reversion_model for next run

    return ownership_params, t_ownership, rev_dates_detail


def apply_date_reversion(
    reversion_key,
    this_reversion_model,
    previous_reversion_model,
    date_dict,
    ownership_params,
    rev_dates_detail,
    t_ownership,
):
    # reversion based on as of date
    if reversion_key == CriteriaEnum.offset_to_as_of_date.name:
        aod = date_dict['as_of_date']
        delta_month = this_reversion_model[CriteriaEnum.offset_to_as_of_date.name]
        if int(delta_month) == delta_month:
            this_rev_date = aod + relativedelta(months=delta_month)
        else:
            delta_month_int = int(delta_month)
            delta_day = int((delta_month - delta_month_int) * DAYS_IN_MONTH)
            this_rev_date = aod + relativedelta(months=delta_month_int) + relativedelta(days=delta_day)
    # reversion based on arbitrary date
    elif reversion_key == 'date':
        this_rev_date = get_py_date(this_reversion_model['date'])
    else:
        ReversionError('Wrong Date Reversion Criteria!')

    fpd = date_dict['first_production_date']
    t_reversion = date_to_t(this_rev_date, fpd)
    after_reversion_bools = (t_ownership >= t_reversion)

    # mid_month reversion
    if t_reversion < t_ownership[0]:
        reversion_index = 0
        pre_rev_date_prop = 0
    elif np.any(after_reversion_bools):
        reversion_index = np.argmax(after_reversion_bools)
        pre_rev_date_prop = (this_rev_date.day - 1) / monthrange(this_rev_date.year, this_rev_date.month)[1]
    else:
        # reversion doesn't happen, set rev_date to None to skip update reversion result
        this_rev_date = None
        t_reversion = None
        reversion_index = None
        pre_rev_date_prop = None

    new_ownership_params, new_rev_dates_detail = get_new_ownership_outputs(
        reversion_key, ownership_params, this_reversion_model, previous_reversion_model, rev_dates_detail,
        this_rev_date, t_reversion, after_reversion_bools, reversion_index, pre_rev_date_prop)

    return new_ownership_params, new_rev_dates_detail


def get_gross_ownership(ownership_params):
    gross_ownership_params = copy.deepcopy(ownership_params)
    gross_ownership_params[WI] = np.ones(len(gross_ownership_params[WI]))
    for key in ['original_ownership', 'oil_ownership', 'gas_ownership', 'ngl_ownership', 'drip_condensate_ownership']:
        gross_ownership_params[key][NRI] = gross_ownership_params[key][LEASE_NRI]
    return gross_ownership_params


def money_reversion_econ_result(
    econ_calc_func,
    well_input,
    well_result,
    this_reversion_model,
    ownership_params,
    rev_dates_detail,
    t_ownership,
    feature_flags: Optional[dict[str, bool]] = None,
):
    if feature_flags is None:
        feature_flags = {}
    updated_well_result = {**well_result, 't_ownership': t_ownership, 'rev_dates_detail': rev_dates_detail}

    this_balance = this_reversion_model['balance']
    if this_balance == 'net':
        updated_well_result['ownership_params'] = ownership_params
    else:
        # gross based on 100% wi and use lease_nri as nri
        gross_ownership_params = get_gross_ownership(ownership_params)
        updated_well_result['ownership_params'] = gross_ownership_params

    # HACK if well_result is not empty, it is from group Econ
    econ_calc_result = econ_calc_func(well_input, updated_well_result, feature_flags=feature_flags)
    if len(well_result) == 0:
        econ_result = econ_calc_result.simple_econ_result()
    else:
        econ_result = econ_result_for_group_cf_cutoff(econ_calc_result)

    return econ_result


def apply_money_reversion(
    econ_result,
    well_input,
    reversion_key,
    this_reversion_model,
    previous_reversion_model,
    ownership_params,
    rev_dates_detail,
    t_ownership,
):
    monthly_econ_t = econ_result['time']
    monthly_econ_date = econ_result['py_date']
    bfit_cf_dict = econ_result['bfit_cf']

    bfit_cf = bfit_cf_dict['bfit_cf']
    capex = bfit_cf_dict['capex']

    rev_param_keys = this_reversion_model.keys()

    # bfit_cf benefit
    this_npi_include = this_reversion_model['include_net_profit_interest']
    total_benifit = np.zeros(len(bfit_cf))
    if this_npi_include == 'no':
        total_benifit = total_benifit - bfit_cf_dict['net_profit']
    if reversion_key == OwnershipEnum.PAYOUT_WITHOUT_INVESTMENT.value:
        total_benifit = total_benifit + capex
    bfit_cf_adj = bfit_cf + total_benifit

    # cumulative cash flow
    if reversion_key == 'irr':
        disc_rate = this_reversion_model['irr'] / 100

        # discount bfit
        disc_date = get_py_date(well_input['date_dict']['discount_date'])
        discount_table = well_input['general_option_model']['discount_table']
        disc_method = discount_table['discount_method']
        cash_acc_time = discount_table['cash_accrual_time']

        num_period = get_num_period(disc_method)

        discount_index, discount_cum_days = get_cum_days(monthly_econ_date, disc_date, cash_acc_time)

        multipliers = np.ones(len(monthly_econ_date))
        multipliers[discount_index] = phdwin_discount(disc_rate, num_period, discount_cum_days)
        disc_cf = np.multiply(bfit_cf_adj, multipliers)
        disc_cf = adjust_array_zero(disc_cf, monthly_econ_t, t_ownership)

        cum_cf = np.cumsum(disc_cf)
        rev_threshold = 0

    elif 'roi_undisc' in rev_param_keys:
        rev_threshold = this_reversion_model['roi_undisc']

        total_rev = bfit_cf_dict['total_net_revenue']
        total_expense = bfit_cf_dict['expense']
        total_prod_tax = bfit_cf_dict['production_tax']

        cum_numerator = np.cumsum(total_rev - total_expense - total_prod_tax)
        cum_denominator = np.cumsum(capex)
        cum_denominator[cum_denominator == 0] = 1  # this 1 here is to avoid devide by zero
        cum_cf = np.divide(cum_numerator, cum_denominator)
        cum_cf = adjust_array_zero(cum_cf, monthly_econ_t, t_ownership)

    else:
        # payout (with or without investment)
        bfit_cf_adj = adjust_array_zero(bfit_cf_adj, monthly_econ_t, t_ownership)
        cum_cf = np.cumsum(bfit_cf_adj)
        rev_threshold = this_reversion_model[reversion_key]

    revert_immediately_1 = (reversion_key == OwnershipEnum.PAYOUT_WITHOUT_INVESTMENT.value) and (rev_threshold == 0)
    revert_immediately_2 = (reversion_key == OwnershipEnum.PAYOUT_WITH_INVESTMENT.value) and (sum(capex)
                                                                                              == 0) and (rev_threshold
                                                                                                         == 0)

    if revert_immediately_1 or revert_immediately_2:
        # PO 0 will revert at beginning of CF
        after_reversion_bools = np.full(len(cum_cf), True)
    else:
        # >= may cause issue when rev_threshold is 0
        after_reversion_bools = (cum_cf > rev_threshold)

    # TODO: The logic below seems unnecessary due to reversion calculation start from the earliest possible date
    if t_ownership[0] < monthly_econ_t[0]:
        # reversion should not happen before as of date
        after_reversion_bools[t_ownership < monthly_econ_t[0]] = False

    if np.all(~after_reversion_bools):
        reversion_index = None
        this_rev_date = None
        t_reversion = None
        pre_rev_date_prop = None
    else:
        reversion_index = np.argmax(after_reversion_bools)

        if reversion_index == 0:
            delta_to_threshold = rev_threshold
            rev_month_value = cum_cf[0]
        else:
            delta_to_threshold = rev_threshold - cum_cf[reversion_index - 1]
            rev_month_value = cum_cf[reversion_index] - cum_cf[reversion_index - 1]

        pre_rev_prop = delta_to_threshold / rev_month_value if rev_month_value > 0 else 0
        rev_month = adjust_array_zero(monthly_econ_date, monthly_econ_t, t_ownership)[reversion_index]
        num_days = monthrange(rev_month.year, rev_month.month)[1]
        rev_day = np.floor(num_days * pre_rev_prop) + 1

        this_rev_date = rev_month.replace(day=int(rev_day))
        t_reversion = date_to_t(this_rev_date, well_input['date_dict']['first_production_date'])
        pre_rev_date_prop = (rev_day - 1) / num_days

    if reversion_index is not None:
        # the following 2 rows prevent new CAPEX spent make ownership change back to pre reversion
        after_reversion_bools = np.full(len(after_reversion_bools), False)
        after_reversion_bools[reversion_index:] = True

    new_ownership_params, new_rev_dates_detail = get_new_ownership_outputs(
        reversion_key, ownership_params, this_reversion_model, previous_reversion_model, rev_dates_detail,
        this_rev_date, t_reversion, after_reversion_bools, reversion_index, pre_rev_date_prop)

    return new_ownership_params, new_rev_dates_detail


def volume_reversion_econ_result(econ_calc_func,
                                 well_input,
                                 well_result,
                                 ownership_params,
                                 t_ownership,
                                 feature_flags: Optional[dict[str, float]] = None):
    updated_well_result = {
        **well_result,
        'ownership_params': ownership_params,
        't_ownership': t_ownership,
        'rev_dates_detail': []  # no need reversion details for volume reversion
    }

    # HACK if well_result is not empty, it is from group Econ
    econ_calc_result = econ_calc_func(well_input, updated_well_result, feature_flags=feature_flags)
    if len(well_result) == 0:
        econ_result = econ_calc_result.simple_econ_result()
    else:
        econ_result = econ_result_for_group_volume_cutoff(econ_calc_result)

    return econ_result


def apply_volume_reversion(
    econ_result,
    well_input,
    reversion_key,
    this_reversion_model,
    previous_reversion_model,
    ownership_params,
    rev_dates_detail,
    t_ownership,
):
    monthly_econ_t = econ_result['time']
    monthly_econ_date = econ_result['py_date']
    econ_monthly_volume = econ_result['volume']
    econ_daily_volume = econ_result['daily_wh_volume']

    this_balance = this_reversion_model['balance']

    volume_phase = None
    for phase in ['oil', 'gas', 'boe']:
        if phase in reversion_key:
            volume_phase = phase

    if volume_phase is None:
        raise ReversionError('Wrong Volume Reversion Criteria!')
    elif volume_phase in ['oil', 'gas']:
        if this_balance == 'net':
            wh_volume = econ_monthly_volume[volume_phase][OWNERSHIP][WELL_HEAD]['nri']
        else:
            wh_volume = econ_monthly_volume[volume_phase][WELL_HEAD]

        # daily
        this_daily = econ_daily_volume.get(volume_phase, {}).get('value', [])
        daily_index = econ_daily_volume.get(volume_phase, {}).get('index', [])
        this_nri = ownership_params[f'{volume_phase}_{OWNERSHIP}'][NRI]

    else:
        # boe
        if this_balance == 'net':
            wh_volume = econ_monthly_volume['boe'][WELL_HEAD]['nri']
        else:
            wh_volume = econ_monthly_volume['boe'][WELL_HEAD]['total']

        # daily
        oil_daily = econ_daily_volume.get('oil', {}).get('value', [])
        oil_index = econ_daily_volume.get('oil', {}).get('index', [])
        gas_daily = econ_daily_volume.get('gas', {}).get('value', [])
        gas_index = econ_daily_volume.get('gas', {}).get('index', [])

        daily_index, oil_inter_ind, gas_inter_ind = np.intersect1d(oil_index, gas_index, return_indices=True)
        oil_daily_adj = oil_daily[oil_inter_ind] if oil_inter_ind.size else 0
        gas_daily_adj = gas_daily[gas_inter_ind] if gas_inter_ind.size else 0
        if this_balance == 'net':
            this_daily = {
                'oil': oil_daily_adj,
                'gas': gas_daily_adj / well_input['general_option_model']['boe_conversion']['wet_gas']
            }
        else:
            this_daily = oil_daily_adj + gas_daily_adj / well_input['general_option_model']['boe_conversion']['wet_gas']
        this_nri = {'oil': ownership_params[f'oil_{OWNERSHIP}'][NRI], 'gas': ownership_params[f'gas_{OWNERSHIP}'][NRI]}

    rev_threshold = this_reversion_model[reversion_key]

    wh_volume = adjust_array_zero(wh_volume, monthly_econ_t, t_ownership)
    wh_volume_cum = np.cumsum(wh_volume)

    after_reversion_bools = (wh_volume_cum >= rev_threshold)

    # mid_month reversion
    if np.all(~after_reversion_bools):
        this_rev_date = None
        t_reversion = None
        after_reversion_bools = None
        reversion_index = None
        pre_rev_date_prop = None
    else:
        reversion_index = np.argmax(after_reversion_bools)
        rev_month = adjust_array_zero(monthly_econ_date, monthly_econ_t, t_ownership)[reversion_index]

        num_days = monthrange(rev_month.year, rev_month.month)[1]

        if reversion_index == 0:
            delta_to_threshold = rev_threshold
            rev_month_value = wh_volume_cum[0]
        else:
            delta_to_threshold = rev_threshold - wh_volume_cum[reversion_index - 1]
            rev_month_value = wh_volume_cum[reversion_index] - wh_volume_cum[reversion_index - 1]

        rev_month_start = np.datetime64(rev_month)
        rev_month_end = (rev_month_start.astype('datetime64[M]') + 1).astype('datetime64[D]') - 1
        rev_month_start_index = (rev_month_start - np.datetime64('1900-01-01')).astype('int')
        rev_month_end_index = (rev_month_end - np.datetime64('1900-01-01')).astype('int')

        fpd_daily_index = (np.datetime64(well_input['date_dict']['first_production_date'])
                           - np.datetime64('1900-01-01')).astype('int')
        rev_month_start_index = max(fpd_daily_index, rev_month_start_index)

        if len(daily_index) and rev_month_start_index >= daily_index[0] and rev_month_end_index <= daily_index[-1]:
            # daily resolution
            month_range_index = (daily_index >= rev_month_start_index) & (daily_index <= rev_month_end_index)

            if this_balance == 'net':
                if isinstance(this_daily, dict):
                    # this is for boe only
                    oil_nri_daily = np.multiply(this_daily['oil'][month_range_index], this_nri['oil'][reversion_index])
                    gas_nri_daily = np.multiply(this_daily['gas'][month_range_index], this_nri['gas'][reversion_index])
                    this_month_daily = oil_nri_daily + gas_nri_daily
                else:
                    this_month_daily = np.multiply(this_daily[month_range_index], this_nri[reversion_index])
            else:
                this_month_daily = this_daily[month_range_index]

            this_month_daily_cumsum = np.cumsum(this_month_daily)
            rev_date_index = int(
                daily_index[month_range_index][np.argmax(this_month_daily_cumsum > delta_to_threshold)])
            this_rev_date = (np.datetime64('1900-01-01') + rev_date_index).astype(datetime.date)
        else:
            # monthly resolution
            pre_rev_prop = delta_to_threshold / rev_month_value
            rev_date_day = np.floor(num_days * pre_rev_prop) + 1
            this_rev_date = rev_month.replace(day=int(rev_date_day))

        t_reversion = date_to_t(this_rev_date, well_input['date_dict']['first_production_date'])
        pre_rev_date_prop = (this_rev_date.day - 1) / num_days

    new_ownership_params, new_rev_dates_detail = get_new_ownership_outputs(
        reversion_key, ownership_params, this_reversion_model, previous_reversion_model, rev_dates_detail,
        this_rev_date, t_reversion, after_reversion_bools, reversion_index, pre_rev_date_prop)

    return new_ownership_params, new_rev_dates_detail


def get_new_ownership_outputs(reversion_key, ownership_params, this_reversion_model, previous_reversion_model,
                              rev_dates_detail, this_rev_date, t_reversion, after_reversion_bools, reversion_index,
                              pre_rev_date_prop):
    if reversion_index is not None:
        reversion_detail = {
            'before': ownership_params[WI][-1],
            'after': pct_to_decimal(this_reversion_model[WI]),
            'date': this_rev_date,
            't': t_reversion,
            'rev_key': reversion_key,
            'pre_rev_params': previous_reversion_model,
            'cur_rev_params': this_reversion_model
        }

        new_rev_dates_detail = rev_dates_detail + [reversion_detail]
        new_ownership_params = update_ownership_params(ownership_params, after_reversion_bools, reversion_index,
                                                       pre_rev_date_prop, new_rev_dates_detail)

    else:
        new_ownership_params = ownership_params
        new_rev_dates_detail = rev_dates_detail

    return new_ownership_params, new_rev_dates_detail


def apply_single_reversion(current_ownership_list, reversion_ownership, after_reversion_bools, reversion_index,
                           pre_rev_date_prop):
    updated_ownership_list = copy.copy(current_ownership_list)

    current_ownership = current_ownership_list[-1]
    rev_combined = pre_rev_date_prop * current_ownership + (1 - pre_rev_date_prop) * reversion_ownership

    updated_ownership_list[after_reversion_bools] = reversion_ownership
    updated_ownership_list[reversion_index] = rev_combined

    return updated_ownership_list


def single_reversion_in_month(ownership_params, current_reversion_model, after_reversion_bools, reversion_index,
                              pre_rev_date_prop):
    ret_ownership_params = copy.copy(ownership_params)
    for key in ownership_params:
        if key == NPI_TYPE:
            continue

        if OWNERSHIP in key:
            # ownership per phase
            for sub_key in ownership_params[key]:
                # nri and lease_nri
                current_ownership_list = ownership_params[key][sub_key]
                reversion_ownership = get_phase_ownership_value(current_reversion_model,
                                                                key.replace(f'_{OWNERSHIP}', ''), sub_key)
                updated_ownership_list = apply_single_reversion(current_ownership_list, reversion_ownership,
                                                                after_reversion_bools, reversion_index,
                                                                pre_rev_date_prop)
                ret_ownership_params[key][sub_key] = updated_ownership_list
        else:
            # wi and npi
            current_ownership_list = ownership_params[key]
            reversion_ownership = pct_to_decimal(current_reversion_model[key])
            updated_ownership_list = apply_single_reversion(current_ownership_list, reversion_ownership,
                                                            after_reversion_bools, reversion_index, pre_rev_date_prop)
            ret_ownership_params[key] = updated_ownership_list

    return ret_ownership_params


def apply_multi_reversion(revs_in_same_month, nested_keys, current_ownership_list, reversion_ownership,
                          after_reversion_bools, reversion_index):
    updated_ownership_list = copy.copy(current_ownership_list)

    rev_combined = 0

    month_of_reversion = revs_in_same_month[0]['date']  # the day doesn't matter, only year and month
    total_days = monthrange(month_of_reversion.year, month_of_reversion.month)[1]
    used_days = 0

    for reversion_info in revs_in_same_month:
        # for each reversion, add the ownership before it to rev_combined
        rev_date = reversion_info['date']
        prior_rev_own_model = reversion_info['pre_rev_params']

        # get ownership before reversion
        if len(nested_keys) == 1:
            prior_rev_own_value = pct_to_decimal(prior_rev_own_model[nested_keys[0]])
        else:
            phase_key, sub_key = nested_keys
            prior_rev_own_value = get_phase_ownership_value(prior_rev_own_model, phase_key.replace(f'_{OWNERSHIP}', ''),
                                                            sub_key)

        this_rev_period = rev_date.day - 1 - used_days
        used_days += this_rev_period

        rev_combined += this_rev_period * prior_rev_own_value / total_days

    # after last reversion
    remain_days = total_days - used_days
    rev_combined += remain_days * reversion_ownership / total_days

    updated_ownership_list[after_reversion_bools] = reversion_ownership
    updated_ownership_list[reversion_index] = rev_combined

    return updated_ownership_list


def multiple_reversions_in_month(ownership_params, revs_in_same_month, current_reversion_model, after_reversion_bools,
                                 reversion_index):
    ret_ownership_params = copy.copy(ownership_params)

    for key in ownership_params:
        if key == NPI_TYPE:
            continue
        if OWNERSHIP in key:
            # ownership per phase
            for sub_key in ownership_params[key]:
                current_ownership_list = ownership_params[key][sub_key]
                reversion_ownership = get_phase_ownership_value(current_reversion_model,
                                                                key.replace(f'_{OWNERSHIP}', ''), sub_key)
                ret_ownership_params[key][sub_key] = apply_multi_reversion(revs_in_same_month, [key, sub_key],
                                                                           current_ownership_list, reversion_ownership,
                                                                           after_reversion_bools, reversion_index)
        else:
            # wi and npi
            current_ownership_list = ownership_params[key]
            reversion_ownership = pct_to_decimal(current_reversion_model[key])
            ret_ownership_params[key] = apply_multi_reversion(revs_in_same_month, [key], current_ownership_list,
                                                              reversion_ownership, after_reversion_bools,
                                                              reversion_index)

    return ret_ownership_params


def update_ownership_params(ownership_params, after_reversion_bools, reversion_index, pre_rev_date_prop,
                            rev_dates_detail):
    # the current reversion is the last one
    current_reversion_details = rev_dates_detail[-1]
    t_current_rev = current_reversion_details['t']
    current_reversion_model = current_reversion_details['cur_rev_params']

    revs_in_same_month = []
    '''
    to take care of multiple reversion happens in same month
    '''
    for rev in rev_dates_detail:
        this_rev_idx = rev['t']
        if this_rev_idx == t_current_rev:
            revs_in_same_month.append(rev)

    if len(revs_in_same_month) > 1:
        ret_ownership_params = multiple_reversions_in_month(ownership_params, revs_in_same_month,
                                                            current_reversion_model, after_reversion_bools,
                                                            reversion_index)
    else:
        ret_ownership_params = single_reversion_in_month(ownership_params, current_reversion_model,
                                                         after_reversion_bools, reversion_index, pre_rev_date_prop)

    return ret_ownership_params
