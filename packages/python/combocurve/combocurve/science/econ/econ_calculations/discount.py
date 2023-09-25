import copy
import numpy as np
from scipy import optimize

DAYS_IN_YEAR = 365.25
MONTH_IN_YEAR = 12
IRR_MONTHLY_MAX = 10000

DISC_METHOD_PERIODS = {
    'yearly': 1,
    'quarterly': 4,
    'monthly': 12,
    'daily': 365,
}


def get_num_period(disc_method):
    num_period = None
    try:
        num_period = DISC_METHOD_PERIODS[disc_method]
    except KeyError:
        raise Exception('Discount Method Error!', None)

    return num_period


def get_cum_days(dates, disc_date, cash_accrual_time):
    # cum_days is the difference of days of each month between discount date
    cum_days = []

    for date in dates:
        if date.month == 12:
            cum_days.append((date.replace(month=1, year=date.year + 1) - disc_date).days)
        else:
            cum_days.append((date.replace(month=date.month + 1) - disc_date).days)

    cum_days = np.asarray(cum_days)

    # get the index of cash flow that need to be discount
    discount_index = cum_days > 0
    discount_cum_days = cum_days[discount_index]

    # cash actual time
    if cash_accrual_time == 'mid_month':
        discount_cum_days = discount_cum_days - 15
    elif cash_accrual_time != 'end_month':
        raise Exception('Cash Accrual Time Error!', None)

    return discount_index, discount_cum_days


def phdwin_discount(discount_rate, num_period, cum_days):
    return np.power(1 + discount_rate / num_period, -np.divide(cum_days, DAYS_IN_YEAR / num_period))


def npv(disc_rate, cf, num_period, discount_index, discount_cum_days):
    # npv start from discount date with different discount method
    multipliers = np.ones(len(cf))
    multipliers[discount_index] = phdwin_discount(disc_rate, num_period, discount_cum_days)

    disc_cf = np.multiply(cf, multipliers)

    return np.sum(disc_cf)


def phdwin_discount_derivative(disc_rate, num_period, cum_days):
    return -(cum_days / DAYS_IN_YEAR) * np.power(1 + disc_rate / num_period,
                                                 -(1 + np.divide(cum_days, DAYS_IN_YEAR / num_period)))


def npv_derivative(disc_rate, cf, num_period, discount_index, cum_days):
    cf_after_disc_dates = cf[discount_index]
    multipliers = phdwin_discount_derivative(disc_rate, num_period, cum_days)

    derivatives = np.multiply(cf_after_disc_dates, multipliers)

    return np.sum(derivatives)


def discounted_roi(cfs,
                   npi=None,
                   disc_rate=None,
                   num_period=None,
                   discount_index=None,
                   discount_cum_days=None,
                   discounted_capex=None):
    total_rev = cfs['total_revenue']
    total_expense = cfs['total_expense']
    total_prod_tax = cfs['total_production_tax']
    total_capex = cfs['total_capex']
    roi = None
    if npi is None:
        npi = np.zeros(len(total_rev))
    if np.sum(total_capex) > 0:
        if disc_rate is None:
            roi = ((np.sum(total_rev) - np.sum(total_expense) - np.sum(total_prod_tax) + np.sum(npi))
                   / np.sum(total_capex))
        else:
            disc_total_expense = npv(disc_rate, total_expense, num_period, discount_index, discount_cum_days)
            disc_total_prod_tax = npv(disc_rate, total_prod_tax, num_period, discount_index, discount_cum_days)
            disc_total_rev = npv(disc_rate, total_rev, num_period, discount_index, discount_cum_days)
            disc_npi = npv(disc_rate, npi, num_period, discount_index, discount_cum_days)
            if discounted_capex is not None:
                roi = ((disc_total_rev - disc_total_expense - disc_total_prod_tax + disc_npi)
                       / np.sum(discounted_capex))
            else:
                roi = ((disc_total_rev - disc_total_expense - disc_total_prod_tax + disc_npi) / np.sum(total_capex))

    if roi in [np.inf, -np.inf]:
        roi = None

    return roi


def afit_discounted_roi(cfs,
                        disc_rate=None,
                        num_period=None,
                        discount_index=None,
                        discount_cum_days=None,
                        discounted_capex=None):
    total_afit_cf = cfs['after_income_tax_cash_flow']
    total_capex = cfs['total_capex']
    roi = None
    if np.sum(total_capex) > 0:
        if disc_rate is None:
            roi = np.sum(total_afit_cf + total_capex) / np.sum(total_capex)
        else:
            disc_total_rev = npv(disc_rate, total_afit_cf + total_capex, num_period, discount_index, discount_cum_days)
            if discounted_capex is not None:
                roi = disc_total_rev / np.sum(discounted_capex)
            else:
                roi = disc_total_rev / np.sum(total_capex)

    if roi in [np.inf, -np.inf]:
        roi = None

    return roi


def irr(cf, num_period, discount_index, discount_cum_days):
    if np.sum(cf) < 0 or np.sum(cf >= 0) == len(cf):
        irr_monthly = None
    else:
        try:
            irr_monthly = optimize.newton(
                npv,
                0.1,
                npv_derivative,
                args=(cf, num_period, discount_index, discount_cum_days),
            )
            if abs(irr_monthly) > IRR_MONTHLY_MAX:
                raise Exception('The absolute value of IRR is too large')
        except Exception:
            irr_monthly = None

    return irr_monthly if irr_monthly else irr_monthly


def get_discounted_capex(capex_disc_input, disc_date, num_period, rate):
    total_capex = capex_disc_input['total_capex']
    capex_detail = capex_disc_input['capex_detail']
    t_capex = capex_disc_input['time']

    discounted_capex_detail = copy.deepcopy(capex_detail)

    # capex discount
    discounted_capex = np.zeros(len(total_capex))

    for capex in discounted_capex_detail:
        this_t = capex['index']
        this_date = capex['date']
        this_value = capex['total']

        this_capex_location = t_capex == this_t

        if this_date <= disc_date:
            capex['discounted_total'] = this_value
        else:
            delta_days = (this_date - disc_date).days
            capex_disc_rate = phdwin_discount(rate, num_period, [delta_days])[0]
            capex['discounted_total'] = this_value * capex_disc_rate

        discounted_capex[this_capex_location] += capex['discounted_total']

    return discounted_capex, discounted_capex_detail


def get_discounted_capex_no_copy(capex_disc_input, disc_date, num_period, rate):
    total_capex = capex_disc_input['total_capex']
    capex_detail = capex_disc_input['capex_detail']
    t_capex = capex_disc_input['time']

    # capex discount
    discounted_capex = np.zeros(len(total_capex))

    for capex in capex_detail:
        this_t = capex['index']
        this_date = capex['date']
        this_value = capex['total']

        this_capex_location = this_t - t_capex[0]

        if this_date <= disc_date:
            discounted_total = this_value
        else:
            delta_days = (this_date - disc_date).days
            capex_disc_rate = (1 + rate / num_period)**(-delta_days / DAYS_IN_YEAR * num_period)
            discounted_total = this_value * capex_disc_rate

        discounted_capex[this_capex_location] += discounted_total

    return discounted_capex
