import copy
import numpy as np
from dateutil.relativedelta import relativedelta

from combocurve.science.econ.helpers import date_to_t
from combocurve.science.econ.general_functions import get_py_date

ESCALATION_MODEL = 'escalation_model'


class EscalationError(Exception):
    expected = True


ENTIRE_WELL_LIFE = 'entire_well_life'
ECON_LIMIT = 'Econ Limit'
DOLLAR_PER_YEAR = 'dollar_per_year'
PCT_PER_YEAR = 'pct_per_year'

PCT_MULTIPLIER = 1 / 100
MONTHS_IN_YEAR = 12


def get_escalation_model(econ_model):
    return econ_model[ESCALATION_MODEL][ESCALATION_MODEL] if econ_model[ESCALATION_MODEL] != 'none' and econ_model[
        ESCALATION_MODEL] is not None else None


def process_econ_model(econ_model_rows, cf_start_date, cf_end_date):
    first_row = econ_model_rows[0]

    if ENTIRE_WELL_LIFE in list(first_row):
        start_date = cf_start_date
        end_date = cf_end_date
        first_row['dates'] = {'start_date': start_date, 'end_date': end_date}
        return [first_row]

    for i, r in enumerate(econ_model_rows):
        start_date = get_py_date(r['dates']['start_date'])
        if i == len(econ_model_rows) - 1:
            # the end_date will be 'Econ Limit', so we need to process it to a date
            if cf_end_date >= start_date:
                end_date = cf_end_date
            else:
                # end at the last day of the month of start
                end_date = (start_date + relativedelta(months=1)).replace(day=1) + relativedelta(days=-1)
        else:
            end_date = get_py_date(r['dates']['end_date'])

        r['dates'] = {'start_date': start_date, 'end_date': end_date}

    return econ_model_rows


def add_date_to_escalation_rows(escalation_rows, model_start_date):
    first_row = escalation_rows[0]
    keys = first_row.keys()

    if ENTIRE_WELL_LIFE in keys:
        first_row['dates'] = {
            'start_date': model_start_date,
            'end_date': ECON_LIMIT,
        }
        return [first_row]

    for i, r in enumerate(escalation_rows):
        if 'month_period' in keys:
            month_period = r['month_period']
            start_date = (model_start_date + relativedelta(months=month_period['start'] - 1)).replace(day=1)
            if i == len(escalation_rows) - 1:
                end_date = ECON_LIMIT
            else:
                end_date = (model_start_date
                            + relativedelta(months=month_period['end'])).replace(day=1) + relativedelta(days=-1)
        else:
            dates = r['dates']
            start_date = get_py_date(dates['start_date'])
            if i < len(escalation_rows) - 1:
                end_date = get_py_date(dates['end_date'])
            elif i == len(escalation_rows) - 1:
                end_date = ECON_LIMIT

        r['dates'] = {
            'start_date': start_date,
            'end_date': end_date,
        }

    return escalation_rows


def compound_year_to_month(pct_per_year):
    return (1 + pct_per_year)**(1 / MONTHS_IN_YEAR) - 1


def fill_in_escalation_values(
    row_esca_values,
    row_t,
    fill_in_t_start,
    fill_in_t_end,
    row_value,
    value_key,
    esca_freq,
    cal_method,
):
    fill_in_idx = (row_t >= fill_in_t_start) & (row_t <= fill_in_t_end)
    fill_in_len = fill_in_t_end - fill_in_t_start + 1
    after_fill_in_range_idx = row_t > fill_in_t_end
    start_from_first = fill_in_t_start == row_t[0]

    if start_from_first:
        initial_value = row_esca_values[0]
    else:
        initial_value = row_esca_values[row_t == fill_in_t_start - 1][0]

    if esca_freq == 'monthly':
        if start_from_first:
            # start from 0 because first month is unescalated (same as Aries)
            number_of_months = np.arange(fill_in_len)
        else:
            # start from 1
            number_of_months = np.arange(1, fill_in_len + 1)
    elif esca_freq == 'yearly':
        if start_from_first:
            # first year is unescalated
            number_of_years = np.arange(fill_in_len) // 12
        else:
            number_of_years = np.arange(fill_in_len) // 12 + 1

    if value_key == DOLLAR_PER_YEAR:
        dollar_per_year = row_value
        dollar_per_month = dollar_per_year / MONTHS_IN_YEAR
        if esca_freq == 'monthly':
            fill_in_values = initial_value + dollar_per_month * number_of_months
        elif esca_freq == 'yearly':
            fill_in_values = initial_value + dollar_per_year * number_of_years
        else:
            # constant
            fill_in_values = np.repeat(dollar_per_month, fill_in_len)
    else:
        # pct_per_year
        pct_per_year = row_value * PCT_MULTIPLIER
        if esca_freq == 'monthly':
            if cal_method == 'compound':
                pct_per_month = compound_year_to_month(pct_per_year)
                fill_in_values = initial_value * np.power(1 + pct_per_month, number_of_months)
            else:
                pct_per_month = pct_per_year / MONTHS_IN_YEAR
                fill_in_values = initial_value * (1 + pct_per_month * number_of_months)
        elif esca_freq == 'yearly':
            if cal_method == 'compound':
                fill_in_values = initial_value * np.power(1 + pct_per_year, number_of_years)
            else:
                fill_in_values = initial_value * (1 + pct_per_year * number_of_years)
        else:
            # constant
            pct_per_month = pct_per_year / MONTHS_IN_YEAR
            fill_in_values = np.repeat(1 + pct_per_month, fill_in_len)

    row_esca_values[fill_in_idx] = fill_in_values
    # extend the latest escalation parameter to end of the row
    if fill_in_t_end < row_t[-1]:
        row_esca_values[after_fill_in_range_idx] = fill_in_values[-1]

    return row_esca_values


def calculate_escalation_per_month(dates, escalation_model, fpd):
    esca_freq = escalation_model.get('escalation_frequency', 'monthly')
    cal_method = escalation_model.get('calculation_method', 'compound')
    esca_rows = escalation_model.get('rows', [])

    start_date = get_py_date(dates['start_date'])
    end_date = get_py_date(dates['end_date'])

    t_start = date_to_t(start_date, fpd)
    t_end = date_to_t(end_date, fpd)

    row_t = np.arange(t_start, t_end + 1)

    esca_row_keys = list(esca_rows[0].keys())
    value_key = list(set(esca_row_keys) & set([DOLLAR_PER_YEAR, PCT_PER_YEAR]))[0]

    if value_key == DOLLAR_PER_YEAR:
        row_esca_values = np.zeros(len(row_t))
    elif value_key == PCT_PER_YEAR:
        row_esca_values = np.ones(len(row_t))
    else:
        raise EscalationError('Escalation value key is wrong')

    for i, esca_row in enumerate(esca_rows):
        row_dates = esca_row['dates']
        row_value = esca_row[value_key]

        esca_t_start = date_to_t(get_py_date(row_dates['start_date']), fpd)

        if t_end < esca_t_start:
            continue

        if i == len(esca_rows) - 1:
            esca_t_end = t_end
        else:
            esca_t_end = date_to_t(get_py_date(row_dates['end_date']), fpd)

        if t_start > esca_t_end:
            continue

        fill_in_t_start = max(t_start, esca_t_start)
        fill_in_t_end = min(t_end, esca_t_end)

        row_esca_values = fill_in_escalation_values(
            row_esca_values,
            row_t,
            fill_in_t_start,
            fill_in_t_end,
            row_value,
            value_key,
            esca_freq,
            cal_method,
        )

    return row_t, row_esca_values


def process_escalation_model(econ_model_rows, escalation_model_input, cf_start_date, cf_end_date, fpd):
    # the escalation_model_input can be shared by multiple wells, the process operation will modify it
    escalation_model = copy.deepcopy(escalation_model_input)

    esca_rows = escalation_model.get('rows', [])

    esca_row_keys = list(esca_rows[0].keys())
    if DOLLAR_PER_YEAR in esca_row_keys:
        esca_type = 'add'
        base_value = 0
    elif PCT_PER_YEAR in esca_row_keys:
        esca_type = 'multiply'
        base_value = 1

    # cf_end_date is guaranteed to be covered (CC last row goes to econ limit), but the not start_date
    econ_model_rows = process_econ_model(econ_model_rows, cf_start_date, cf_end_date)

    escalation_model['rows'] = add_date_to_escalation_rows(esca_rows, econ_model_rows[0]['dates']['start_date'])

    t_before_cut = np.array([])
    values_before_cut = np.array([])

    for econ_model_row in econ_model_rows:
        row_t, row_esca_values = calculate_escalation_per_month(econ_model_row['dates'], escalation_model, fpd)
        t_before_cut = np.append(t_before_cut, row_t)
        values_before_cut = np.append(values_before_cut, row_esca_values)

    cf_start_t = date_to_t(cf_start_date, fpd)
    cf_end_t = date_to_t(cf_end_date, fpd)

    if cf_start_t < t_before_cut[0]:
        add_t = np.arange(cf_start_t, t_before_cut[0])
        add_values = np.repeat(base_value, len(add_t))
        t_before_cut = np.append(add_t, t_before_cut)
        values_before_cut = np.append(add_values, values_before_cut)

    esca_values = values_before_cut[(t_before_cut >= cf_start_t) & (t_before_cut <= cf_end_t)]

    return {'escalation_type': esca_type, 'escalation_values': esca_values}


def apply_escalation(values, escalation_params):
    if escalation_params is None:
        return values

    escalation_type = escalation_params['escalation_type']
    escalation_values = escalation_params['escalation_values']

    if escalation_type == 'add':
        return values + escalation_values
    else:
        # multiply
        return values * escalation_values


def apply_negative_offset_capex_escalation(escalation_model, capex_date, offset_date):
    esca_freq = escalation_model.get('escalation_frequency', 'monthly')
    cal_method = escalation_model.get('calculation_method', 'compound')
    esca_rows = escalation_model.get('rows', [])

    esca_row_keys = list(esca_rows[0].keys())
    if DOLLAR_PER_YEAR in esca_row_keys:
        esca_type = 'add'
    elif PCT_PER_YEAR in esca_row_keys:
        esca_type = 'multiply'

    if len(esca_rows) == 0:
        return None

    first_escalation_row = esca_rows[0]

    esca_row_keys = list(first_escalation_row.keys())
    value_key = list(set(esca_row_keys) & set([DOLLAR_PER_YEAR, PCT_PER_YEAR]))[0]
    esca_rate = first_escalation_row[value_key]

    number_of_months = date_to_t(capex_date, offset_date)  # the offset date is unescalation (0 index)
    number_of_years = number_of_months // 12  #  number_of_months is negative and -1 // 12 = -1

    if value_key == DOLLAR_PER_YEAR:
        dollar_per_year = esca_rate
        dollar_per_month = dollar_per_year / MONTHS_IN_YEAR
        if esca_freq == 'monthly':
            capex_esca_rate = dollar_per_month * number_of_months
        elif esca_freq == 'yearly':
            capex_esca_rate = dollar_per_year * number_of_years
        else:
            # constant
            capex_esca_rate = dollar_per_month
    else:
        # pct_per_year
        pct_per_year = esca_rate * PCT_MULTIPLIER
        if esca_freq == 'monthly':
            if cal_method == 'compound':
                pct_per_month = compound_year_to_month(pct_per_year)
                capex_esca_rate = np.power(1 + pct_per_month, number_of_months)
            else:
                pct_per_month = pct_per_year / MONTHS_IN_YEAR
                capex_esca_rate = 1 + pct_per_month * number_of_months
        elif esca_freq == 'yearly':
            if cal_method == 'compound':
                capex_esca_rate = np.power(1 + pct_per_year, number_of_years)
            else:
                capex_esca_rate = 1 + pct_per_year * number_of_years
        else:
            # constant
            pct_per_month = pct_per_year / MONTHS_IN_YEAR
            capex_esca_rate = 1 + pct_per_month

    return {'type': esca_type, 'value': capex_esca_rate}


def capex_escalation(one_capex_row, fpd):
    offset_date = one_capex_row['offset_date']
    capex_date = one_capex_row['date']

    escalation_model = get_escalation_model(one_capex_row)

    # if offset_date missing, use the first start_date in escalation model as offset_date
    if not offset_date and escalation_model:
        first_esca_row = escalation_model['rows'][0]
        if 'dates' in first_esca_row:
            offset_date = get_py_date(first_esca_row['dates']['start_date'])

    if not offset_date or not escalation_model:
        return None

    econ_model_rows = [{'dates': {'start_date': offset_date, 'end_date': 'Econ Limit'}}]

    if offset_date < capex_date:
        cf_start_date = offset_date
        cf_end_date = capex_date

        result = process_escalation_model(econ_model_rows, escalation_model, cf_start_date, cf_end_date, fpd)

        return {'type': result['escalation_type'], 'value': result['escalation_values'][-1]}

    else:  # capex date before escalation start date, use the first segment of escalation model
        return apply_negative_offset_capex_escalation(escalation_model, capex_date, offset_date)
