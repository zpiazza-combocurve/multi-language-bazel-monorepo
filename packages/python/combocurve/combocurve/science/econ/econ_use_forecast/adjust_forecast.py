import copy
from dateutil.relativedelta import relativedelta
from datetime import datetime

from combocurve.science.econ.general_functions import (has_segments, py_date_to_index, date_str_to_index, PHASES,
                                                       index_to_py_date)
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.core_function.helper import check_leap_year

MULTI_SEG = MultipleSegments()


class RiskingModelError(Exception):
    expected = True


def _validate_month_day(start_year, start_month, new_year, new_month, start_day, end_day):
    '''
        Validate and process day in month. For example, the date range 30-31 in Jan. should be
        translated as 27-28 in Feb (in a non-leap year); the date range 1-31 in May should be
        translated as 1-30 in June.
    '''
    # produce days in month list by year
    old_year_day_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    new_year_day_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if check_leap_year(start_year):
        old_year_day_in_month[2] = 29
    if check_leap_year(new_year):
        new_year_day_in_month[2] = 29

    # adjust new start and end day if needed
    if start_day > new_year_day_in_month[new_month]:
        new_start_day = start_day - (old_year_day_in_month[start_month] - new_year_day_in_month[new_month])
        new_end_day = end_day - (old_year_day_in_month[start_month] - new_year_day_in_month[new_month])
    elif end_day > new_year_day_in_month[new_month]:
        new_start_day = max(1, start_day - (old_year_day_in_month[start_month] - new_year_day_in_month[new_month]))
        new_end_day = end_day - (old_year_day_in_month[start_month] - new_year_day_in_month[new_month])
    else:
        return start_day, end_day

    return new_start_day, new_end_day


def _calculate_shut_in_dates(dates, method, period):
    '''
        Create a list of shut-in dates from repeat-based rows.
    '''
    dates_list = []
    start_year, start_month, start_day = dates['start_date'].split('-')
    end_year, end_month, end_day = dates['end_date'].split('-')

    # process dates depending on repeat method
    if method == 'yearly':
        if start_year != end_year:
            raise (RiskingModelError('Illegal date range for yearly repeater'))
        for elapsed_years in range(period):
            new_year = int(start_year) + elapsed_years
            # validate start and end date to handle Feb. 29th as start or end date
            new_start_day, _ = _validate_month_day(int(start_year), int(start_month), new_year, int(start_month),
                                                   int(start_day), int(end_day))
            _, new_end_day = _validate_month_day(int(start_year), int(end_month), new_year, int(end_month),
                                                 int(start_day), int(end_day))
            new_start_date = datetime(year=new_year, month=int(start_month), day=new_start_day).strftime('%Y-%m-%d')
            new_end_date = datetime(year=new_year, month=int(end_month), day=new_end_day).strftime('%Y-%m-%d')
            dates_list.append({'start_date': new_start_date, 'end_date': new_end_date})
    elif method == 'monthly':
        if start_month != end_month or start_year != end_year:
            raise (RiskingModelError('Illegal date range for monthly repeater'))
        for elapsed_months in range(period):
            # calculate year and month-in-year
            if ((int(start_month) + elapsed_months) % 12) == 0:
                new_month = 12
                elapsed_years = ((int(start_month) + elapsed_months) // 12) - 1
            else:
                elapsed_years = (int(start_month) + elapsed_months) // 12
                new_month = (int(start_month) + elapsed_months) % 12
            new_year = int(start_year) + elapsed_years
            # validate new dates
            new_start_day, new_end_day = _validate_month_day(int(start_year), int(start_month), new_year, new_month,
                                                             int(start_day), int(end_day))
            new_start_date = datetime(year=new_year, month=new_month, day=new_start_day).strftime('%Y-%m-%d')
            new_end_date = datetime(year=new_year, month=new_month, day=new_end_day).strftime('%Y-%m-%d')
            dates_list.append({'start_date': new_start_date, 'end_date': new_end_date})

    return dates_list


def _calculate_scale_post_shut_in_end_dates(scale_end_date, shutin_end_date, method, period):
    '''
        Create a list of scale post shut-in dates from repeat-based rows.
    '''
    dates_list = []
    shutin_end_year, shutin_end_month, shutin_end_day = shutin_end_date.split('-')
    scale_end_date = datetime.strptime(scale_end_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    scale_end_year, scale_end_month, scale_end_day = scale_end_date.year, scale_end_date.month, scale_end_date.day

    # process dates depending on repeat method
    if method == 'yearly':
        if int(shutin_end_year) != scale_end_year:
            raise (RiskingModelError('Illegal date range for yearly repeater'))
        for elapsed_years in range(period):
            new_year = int(scale_end_year) + elapsed_years
            # validate start and end date to handle Feb. 29th as start or end date
            _, new_end_day = _validate_month_day(int(shutin_end_year), int(scale_end_month), new_year,
                                                 int(scale_end_month), int(shutin_end_day), int(scale_end_day))
            new_end_date = datetime(year=new_year, month=int(scale_end_month), day=new_end_day).strftime('%Y-%m-%d')
            dates_list.append(new_end_date)
    elif method == 'monthly':
        if int(shutin_end_month) != scale_end_month or int(shutin_end_year) != scale_end_year:
            raise (RiskingModelError('Illegal date range for monthly repeater'))
        for elapsed_months in range(period):
            # calculate year and month-in-year
            if ((int(shutin_end_month) + elapsed_months) % 12) == 0:
                new_month = 12
                elapsed_years = ((int(shutin_end_month) + elapsed_months) // 12) - 1
            else:
                elapsed_years = (int(shutin_end_month) + elapsed_months) // 12
                new_month = (int(shutin_end_month) + elapsed_months) % 12
            new_year = int(shutin_end_year) + elapsed_years
            # validate new dates
            _, new_end_day = _validate_month_day(int(shutin_end_year), int(shutin_end_month), new_year, new_month,
                                                 int(shutin_end_day), int(scale_end_day))
            new_end_date = datetime(year=new_year, month=new_month, day=new_end_day).strftime('%Y-%m-%d')
            dates_list.append(new_end_date)

    return dates_list


def _parse_shut_in_row(row):
    '''
        Pass a period-based shut-in rows as it is, or process a repeat-based shut-in row
        and return a list of period-based shut-in rows.
    '''
    rows = []
    method = row.get('repeat_range_of_dates', 'no_repeat')
    if method == 'no_repeat' or 'offset_to_as_of_date' in row.keys():
        return [row]
    else:
        dates_list = _calculate_shut_in_dates(row['dates'], method, row.get('total_occurrences', 1))

        scale_ends = []
        scale_type = 'scale_post_shut_in_end_criteria'
        if scale_type in row.keys() and row.get(scale_type) == 'dates':
            scale_ends = _calculate_scale_post_shut_in_end_dates(
                row['scale_post_shut_in_end'],
                row['dates']['end_date'],
                method,
                row.get('total_occurrences', 1),
            )

        for i, dates in enumerate(dates_list):
            # create a new row and append to rows from original row with changed dates setting
            new_row = dict(zip(row.keys(), list(map(lambda key: row[key] if key != 'dates' else dates, row.keys()))))

            if scale_ends:
                keys = new_row.keys()
                scale_end = scale_ends[i]
                scale_val = 'scale_post_shut_in_end'
                new_row = dict(zip(keys, list(map(lambda key: new_row[key] if key != scale_val else scale_end, keys))))

            rows.append(new_row)

    return rows


def add_shut_in(input_forecast_data, shut_in_period, as_of_date, cut_off_date):
    forecast_data = copy.deepcopy(input_forecast_data)

    shut_in_rows = shut_in_period['rows']

    phase_list_dict = {
        'all': PHASES,
        'oil': ['oil'],
        'gas': ['gas'],
        'water': ['water'],
    }

    shut_in_params = {'oil': [], 'gas': [], 'water': []}

    # process repeater rows
    nested_shut_in_rows = list(map(_parse_shut_in_row, shut_in_rows))
    shut_in_rows = [row for list_rows in nested_shut_in_rows for row in list_rows]

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

        # scale post shut-in
        scale_duration_type = 'scale_post_shut_in_end_criteria'
        scale_duration_value = 'scale_post_shut_in_end'
        if scale_duration_type not in rr.keys() or rr[scale_duration_type] == 'econ_limit':
            rr['scale_post_shut_in_end_idx'] = py_date_to_index(cut_off_date)
        elif rr[scale_duration_type] == 'dates':
            rr['scale_post_shut_in_end_idx'] = date_str_to_index(rr[scale_duration_value])
        elif rr[scale_duration_type] == 'offset_to_as_of_date':
            if rr['unit'] == 'day':
                rr['scale_post_shut_in_end_idx'] = rr['end_idx'] + rr[scale_duration_value]
            elif rr['unit'] == 'month':
                rr['scale_post_shut_in_end_idx'] = py_date_to_index(
                    index_to_py_date(rr['end_idx']) + relativedelta(months=int(rr[scale_duration_value]), days=-1))

        if scale_duration_type in rr.keys() and scale_duration_value in rr.keys():
            rr.pop(scale_duration_type)
            rr.pop(scale_duration_value)

        for p in r_phase_list:
            shut_in_params[p].append(rr)

    # order shut_in_params by start_idx:
    for p in shut_in_params:
        shut_in_params[p] = sorted(shut_in_params[p], key=lambda k: k['start_idx'])

    # update forecast_data
    for phase in PHASES:
        if forecast_data[phase]:
            phase_forecast = forecast_data[phase]
            phase_shut_in = shut_in_params[phase]
            phase_forecast_type = phase_forecast['forecastType']
            if phase_forecast_type == 'ratio':
                continue
            if len(phase_shut_in) > 0:
                for pct_key in ['P10', 'P50', 'P90', 'best']:
                    # modified all p series due to one liner need all
                    if pct_key in phase_forecast['P_dict']:
                        new_segments = MULTI_SEG.apply_shutin(
                            phase_shut_in,
                            phase_forecast['P_dict'][pct_key]['segments'],
                            {'stack_multiplier': True},
                        )
                        phase_forecast['P_dict'][pct_key]['segments'] = new_segments

    return forecast_data, shut_in_params


def shut_in_update(shut_in_params, start_pred_dict):
    # only keep shut in period after forecast is used
    if shut_in_params is None:
        return None

    shut_in_params_modified = {}

    shut_in_totoal_len = 0
    for p in shut_in_params:
        phase_shut_in_modified = []
        phase_strat_pred_idx = py_date_to_index(start_pred_dict[p]) if start_pred_dict[p] is not None else None
        if phase_strat_pred_idx is not None:
            phase_shut_in = shut_in_params[p]
            for s in phase_shut_in:
                s_copy = copy.deepcopy(s)
                if s['end_idx'] < phase_strat_pred_idx:
                    continue
                else:
                    if s['start_idx'] < phase_strat_pred_idx:
                        s_copy['start_idx'] = phase_strat_pred_idx
                    phase_shut_in_modified.append(s_copy)

        shut_in_params_modified[p] = phase_shut_in_modified
        shut_in_totoal_len += len(phase_shut_in_modified)

    if shut_in_totoal_len == 0:
        return None
    else:
        return shut_in_params_modified


def adjust_segment(segments, forecast_start_index):
    origin_forecast_start_index = segments[0]['start_idx']
    index_delta = int(forecast_start_index) - origin_forecast_start_index

    for seg in segments:
        seg['start_idx'] = seg['start_idx'] + index_delta
        seg['end_idx'] = seg['end_idx'] + index_delta
        if seg['name'] == 'arps_modified':
            seg['sw_idx'] = seg['sw_idx'] + index_delta


def adjust_forecast_start(forecast_params, forecast_start_index):
    updated_forecast_params = copy.deepcopy(forecast_params)
    for phase in updated_forecast_params:
        phase_forecast = updated_forecast_params.get(phase)

        if not phase_forecast:
            continue

        forecast_type = phase_forecast['forecastType']
        if forecast_type == 'ratio':
            ratio_seg = phase_forecast['ratio']['segments']
            adjust_segment(ratio_seg, forecast_start_index)

        else:
            for p in phase_forecast['P_dict']:
                if has_segments(phase_forecast['P_dict'][p]):
                    p_seg = phase_forecast['P_dict'][p]['segments']
                    adjust_segment(p_seg, forecast_start_index)

    return updated_forecast_params
