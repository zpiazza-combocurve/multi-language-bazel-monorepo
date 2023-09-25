import copy
import datetime
import numpy as np
from dateutil.relativedelta import relativedelta


def date_str_to_index(date_str):
    # input_date format: '2000-01-01'
    return (np.datetime64(date_str) - np.datetime64('1900-01-01')).astype(int)


def py_date_to_index(date):
    return (date - datetime.date(1900, 1, 1)).days


def process_shut_in(shut_in_input, as_of_date):
    shut_in_rows = shut_in_input['rows']

    phase_list_dict = {
        'all': ['oil', 'gas', 'water'],
        'oil': ['oil'],
        'gas': ['gas'],
        'water': ['water'],
    }

    shut_in_params = {'oil': [], 'gas': [], 'water': []}

    for r in shut_in_rows:
        rr = copy.deepcopy(r)

        r_phase_list = phase_list_dict[rr['phase']]
        rr.pop('phase')

        if 'dates' in rr.keys():
            dates = rr['dates']
            rr['start_idx'] = date_str_to_index(dates['start_date'])
            rr['end_idx'] = date_str_to_index(dates['end_date'])
            rr.pop('dates')
        elif 'offset_to_as_of_date' in rr.keys():
            as_of_range = rr['offset_to_as_of_date']
            unit = rr['unit']
            as_of_index = py_date_to_index(as_of_date)
            if unit == 'day':
                rr['start_idx'] = as_of_index + as_of_range['start']
                rr['end_idx'] = as_of_index + as_of_range['end']
            else:
                rr['start_idx'] = py_date_to_index(as_of_date + relativedelta(months=int(as_of_range['start']) - 1))
                rr['end_idx'] = py_date_to_index(as_of_date + relativedelta(months=int(as_of_range['end']), days=-1))
            rr.pop('offset_to_as_of_date')

        for p in r_phase_list:
            shut_in_params[p].append(rr)

    # order shut_in_params by start_idx:
    for p in shut_in_params:
        shut_in_params[p] = sorted(shut_in_params[p], key=lambda k: k['start_idx'])

    return shut_in_params
