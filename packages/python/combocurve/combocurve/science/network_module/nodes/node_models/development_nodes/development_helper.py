import pandas as pd
import datetime
from combocurve.shared.date import index_from_date_str, days_from_1900
from combocurve.science.econ.pre_process import header_idx_to_dates, schedule_idx_to_dates

_MIN_DATE_IDX = -100000

ADJUSTMENT_CRITERIA = ['FPD', 'duration']


def expand_ghg_data_dict_to_list(data_dict):
    ret = []
    for data in data_dict.values():
        ret += data
    return ret


def get_activity_dates(activity_params, first_production_date, schedule_dates, header_dates):
    """Get start and end dates for a well prep activity
    """
    start_date = None
    end_date = None

    for ref in ['start', 'end']:
        criteria = activity_params[f'{ref}_criteria']
        value = activity_params[f'{ref}_value']
        option = activity_params.get(f'{ref}_criteria_option')

        ref_dates = {
            'FPD': first_production_date,
            'headers': header_dates.get(option),
            'schedule': schedule_dates.get(option),
            'duration': start_date
        }
        _date = ref_dates[criteria]
        # update and assign _date if it exists
        if _date:
            if criteria in ADJUSTMENT_CRITERIA:
                adjustment = {'FPD': value, 'duration': value - 1}
                _date += datetime.timedelta(days=adjustment[criteria])
            if ref == 'start':
                start_date = _date
            else:
                end_date = _date
    return start_date, end_date


def get_start_end_date(activity_params, date_dict, schedule_dates, header_dates):

    # get FPD from date_dict or date_dict or well_data
    first_production_date = date_dict['first_production_date']

    start_date, end_date = get_activity_dates(activity_params, first_production_date, schedule_dates, header_dates)
    return start_date, end_date


def get_month_map(activity_params, date_dict, schedule_dates, header_dates):
    """Create a dictionary for number of days in each month over which an activity occurs
    """

    as_of_date = date_dict['as_of_date']
    cut_off_date = date_dict['cut_off_date']

    start_date, end_date = get_start_end_date(activity_params, date_dict, schedule_dates, header_dates)
    month_map = {}
    ## TODO: optimize this using numpy vertorization
    ## count number of days in each month from start_date to end_date, if the day is between as_of_date & cut_off_date
    # skip date range calculation if start and/or end date is None
    if start_date and end_date:
        # get number of months
        date_range = pd.date_range(start_date, end_date)
        for date in date_range:
            # only include dates on or after As Of and on or before Cutoff
            if date >= as_of_date and date <= cut_off_date:
                key = datetime.date(date.year, date.month, 1)
                if key in month_map:
                    month_map[key] += 1
                else:
                    month_map[key] = 1
    return month_map


def choose_start_date_window_params(rows, well_info):
    date_dict, schedule, well_header_info = well_info['date_dict'], well_info['schedule'], well_info['well_header_info']
    n_rows = len(rows)
    cur_start_idx = _MIN_DATE_IDX
    cut_off_idx = days_from_1900(date_dict['cut_off_date'])
    for i, row_params in enumerate(rows):
        if i < n_rows - 1:
            next_row_date = index_from_date_str(rows[i + 1]['start_date_window'])
            date_range = [cur_start_idx, next_row_date - 1]
            cur_start_idx = next_row_date
        else:
            date_range = [cur_start_idx, cut_off_idx]

        if date_range[0] <= date_range[1]:
            header_dates = header_idx_to_dates(well_header_info)
            schedule_dates = schedule_idx_to_dates(schedule)
            row_start_date, row_end_date = get_start_end_date(row_params, date_dict, schedule_dates, header_dates)
            if row_start_date and row_end_date and (date_range[0] <= days_from_1900(row_start_date) <= date_range[1]):
                return row_params, schedule_dates, header_dates

    return None, None, None
