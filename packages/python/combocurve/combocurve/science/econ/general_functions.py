import datetime
import numpy as np
from dateutil.relativedelta import relativedelta

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.date import index_from_date_str, date_from_index, parse_date_str

PHASES = ['oil', 'gas', 'water']

RISKING_PHASES = ['oil', 'gas', 'ngl', 'drip_condensate', 'water']

CAPEX_CATEGORY = [
    "drilling",
    "completion",
    "legal",
    "pad",
    "facilities",
    "artificial_lift",
    "workover",
    "leasehold",
    "development",
    "pipelines",
    "exploration",
    "waterline",
    "appraisal",
    "other_investment",
    "abandonment",
    "salvage",
]

FORECAST_PARAMS_ONE_LINER_KEYS = [
    'oil_p10_first_segment',
    'oil_p10_last_segment',
    'oil_p50_first_segment',
    'oil_p50_last_segment',
    'oil_p90_first_segment',
    'oil_p90_last_segment',
    'oil_best_fit_first_segment',
    'oil_best_fit_last_segment',
    'oil_assigned_p_series_first_segment',
    'oil_assigned_p_series_last_segment',
    #
    'gas_p10_first_segment',
    'gas_p10_last_segment',
    'gas_p50_first_segment',
    'gas_p50_last_segment',
    'gas_p90_first_segment',
    'gas_p90_last_segment',
    'gas_best_fit_first_segment',
    'gas_best_fit_last_segment',
    'gas_assigned_p_series_first_segment',
    'gas_assigned_p_series_last_segment',
    #
    'water_p10_first_segment',
    'water_p10_last_segment',
    'water_p50_first_segment',
    'water_p50_last_segment',
    'water_p90_first_segment',
    'water_p90_last_segment',
    'water_best_fit_first_segment',
    'water_best_fit_last_segment',
    'water_assigned_p_series_first_segment',
    'water_assigned_p_series_last_segment',
]

FORECAST_PARAMS_DETAIL_COLUMNS = {
    'segment_type': {
        'db_key': 'name',
        'label': 'Type',
    },
    'start_date': {
        'db_key': 'start_idx',
        'label': 'Start Date',
    },
    'end_date': {
        'db_key': 'end_idx',
        'label': 'End Date',
    },
    'q_start': {
        'db_key': 'q_start',
        'label': 'q Start',
    },
    'q_end': {
        'db_key': 'q_end',
        'label': 'q End',
    },
    'di_eff_sec': {
        'db_key': 'D_eff',
        'label': 'Di Eff-Sec',
    },
    'd1_nominal': {
        'db_key': 'D',
        'label': 'Di Nominal',
    },
    'b': {
        'db_key': 'b',
        'label': 'b',
    },
    'realized_d_sw_eff_sec': {
        'db_key': 'realized_D_eff_sw',
        'label': 'Realized D Sw-Eff-Sec',
    },
    'sw_date': {
        'db_key': 'sw_idx',
        'label': 'Sw-Date',
    }
}

EUR_ONE_LINER_KEYS = [
    'oil_well_head_eur',
    'gas_well_head_eur',
    'water_well_head_eur',
    'oil_shrunk_eur',
    'gas_shrunk_eur',
    'ngl_shrunk_eur',
    'drip_condensate_shrunk_eur',
]


# get date as format of datetime.date
def get_py_date(date_input):
    if type(date_input) == datetime.date:
        return date_input
    if type(date_input) == datetime.datetime:
        return date_input.date()
    if type(date_input) == str:
        return parse_date_str(date_input)
    raise Exception('Can not handle this date format')


'''
    production data helpers for economics
'''


def has_phase_production(production_data, phase):
    return production_data[phase] is not None


def has_production(production_data):
    return (has_phase_production(production_data, 'oil') or has_phase_production(production_data, 'gas')
            or has_phase_production(production_data, 'water'))


'''
    forecast data helpers for economics
'''


def has_segments(pct_p_dict):
    return 'segments' in pct_p_dict and bool(pct_p_dict['segments'])


def has_phase_pct_seg(phase_forecast_data, pct_key):
    return 'P_dict' in phase_forecast_data and pct_key in phase_forecast_data['P_dict'] and has_segments(
        phase_forecast_data['P_dict'][pct_key])


def has_phase_forecast(forecast_data, phase):
    return forecast_data[phase] is not None


def has_forecast(forecast_data):
    return (has_phase_forecast(forecast_data, 'oil') or has_phase_forecast(forecast_data, 'gas')
            or has_phase_forecast(forecast_data, 'water'))


def create_empty_forecast():
    return {'oil': None, 'gas': None, 'water': None}


def date_str_format_change(input_date_str, output_type='D'):
    # input has format '2019-12-06'; output has format '12/06/2019'
    date_list = input_date_str.split('-')
    year = date_list[0]
    month = date_list[1]
    day = date_list[2]
    if output_type == 'D':
        return f'{month}/{day}/{year}'
    elif output_type == 'M':
        return f'{month}/{year}'


def index_to_py_date(index_of_date):
    return date_from_index(int(index_of_date))


def py_date_to_index(date):
    return (date - datetime.date(1900, 1, 1)).days


def date_str_to_index(date_str):
    # input_date format: '2000-01-01'
    return index_from_date_str(date_str)


def get_assumption(assumptions, assumption_key):
    if assumption_key not in assumptions:
        assumptions[assumption_key] = get_default(assumption_key)
    return assumptions[assumption_key]


def get_discount_key(rate_pct, multi=100):
    rate_pct = multi * rate_pct
    rate_pct_rounded = round(rate_pct)

    if abs(rate_pct - rate_pct_rounded) < 1e-5:
        return str(rate_pct_rounded) + '%'
    else:
        return str(rate_pct) + '%'


def validate_forecast_data(forecast_data):
    forecast_type = forecast_data['forecastType']
    if forecast_type == 'ratio':
        if ('ratio' in forecast_data and 'segments' in forecast_data['ratio']
                and len(forecast_data['ratio']['segments'])):
            return True
    elif 'P_dict' in forecast_data:
        for pct_key in forecast_data['P_dict']:
            if has_phase_pct_seg(forecast_data, pct_key):
                return True

    return False


def adjust_array_zero(input_array, input_t, return_t):
    output_array = input_array
    # extend start
    if input_t[0] > return_t[0]:
        output_array = np.append(np.repeat(0, int(input_t[0] - return_t[0])), output_array)
        input_t = np.append(np.arange(return_t[0], input_t[0]), input_t)
    # extend end
    if input_t[-1] < return_t[-1]:
        output_array = np.append(output_array, np.repeat(0, int(return_t[-1] - input_t[-1])))
        input_t = np.append(input_t, np.arange(input_t[-1] + 1, return_t[-1] + 1))
    # cut output_array
    output_array = output_array[(input_t >= return_t[0]) & (input_t <= return_t[-1])]
    return output_array


def last_day_of_month(py_date):
    return py_date + relativedelta(months=1, days=-1)
