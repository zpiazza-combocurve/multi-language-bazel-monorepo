import numpy as np
from copy import deepcopy
from datetime import date
from combocurve.science.core_function.setting_parameters import BASE_TIME

ERROR_MESSAGE_SHIFT_UNIT_INVALID = ("`shift_unit` invalid, must be one of 'year'|'month'|'day'")

weekday_mapping = {'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6}
holiday_details = {
    'new_year': {
        'type': 'date',
        'target_month': 0,
        'target_day': 0
    },
    'martin_luther_king': {
        'type': 'weekday',
        'target_month': 0,
        'target_week_rank': 2,
        'target_weekday_str': 'Mon'
    },
    'memorial': {
        'type': 'weekday',
        'target_month': 4,
        'target_week_rank': -1,
        'target_weekday_str': 'Mon'
    },
    'independence': {
        'type': 'date',
        'target_month': 6,
        'target_day': 3
    },
    'labor': {
        'type': 'weekday',
        'target_month': 8,
        'target_week_rank': 0,
        'target_weekday_str': 'Mon'
    },
    'thanks_giving': {
        'type': 'weekday',
        'target_month': 10,
        'target_week_rank': 3,
        'target_weekday_str': 'Thu'
    },
    'christmas': {
        'type': 'date',
        'target_month': 11,
        'target_day': 24
    }
}


def get_weekday_holiday_mask(date_arr, target_month_num, target_week_rank, target_weekday):
    month_arr = date_arr.astype('datetime64[M]')
    month_num_arr = (month_arr - month_arr.astype('datetime64[Y]').astype('datetime64[M]')).astype(int)
    date_idx = date_arr.astype(int)
    weekday_arr = (date_idx - 4) % 7

    valid_mask = (month_num_arr == target_month_num) & (weekday_arr == target_weekday)

    use_date = date_arr[valid_mask]

    use_month_arr = month_arr[valid_mask]
    use_week_arr_idx = use_date.astype('datetime64[W]').astype(int)
    if target_weekday < 3:
        use_week_arr_idx += 1

    if target_week_rank >= 0:
        use_month_start_week_arr = use_month_arr.astype('datetime64[W]').astype(int)
        use_month_start_day_arr = (use_month_arr.astype('datetime64[D]').astype(int) - 4) % 7
        use_month_start_week_arr_plus_1_mask = use_month_start_day_arr < 3
        use_month_start_week_arr[use_month_start_week_arr_plus_1_mask] += 1
        start_week_contain_target = use_month_start_day_arr <= target_weekday

        use_week_rank_idx = use_week_arr_idx - use_month_start_week_arr
        use_holiday_mask = (target_week_rank == (use_week_rank_idx + start_week_contain_target - 1))
    else:
        use_month_end_week_arr = ((use_month_arr + 1).astype('datetime64[D]') - 1).astype('datetime64[W]').astype(int)
        use_month_end_day_arr = (((use_month_arr + 1).astype('datetime64[D]') - 1).astype(int) - 4) % 7
        use_month_end_week_arr_plus_1_mask = use_month_end_day_arr < 3
        use_month_end_week_arr[use_month_end_week_arr_plus_1_mask] += 1
        end_week_contain_target = use_month_end_day_arr >= target_weekday
        use_week_rank_idx = use_week_arr_idx - use_month_end_week_arr
        use_holiday_mask = ((target_week_rank + end_week_contain_target) == use_week_rank_idx)

    ret_mask = np.zeros(month_arr.shape[0], dtype=bool)
    ret_mask[valid_mask] = use_holiday_mask
    return ret_mask


def get_date_holiday_mask(date_arr, target_month_num, target_day_num):
    month_arr = date_arr.astype('datetime64[M]')
    month_num_arr = (month_arr - month_arr.astype('datetime64[Y]').astype('datetime64[M]')).astype(int)
    day_num_arr = (date_arr - month_arr.astype('datetime64[D]')).astype(int)
    return (month_num_arr == target_month_num) & (day_num_arr == target_day_num)


def get_holiday_mask(date_arr, holiday_name):
    holiday_detail = holiday_details[holiday_name]
    if holiday_detail['type'] == 'weekday':
        target_weekday = weekday_mapping[holiday_detail['target_weekday_str']]
        target_month_num = holiday_detail['target_month']
        target_week_rank = holiday_detail['target_week_rank']
        return get_weekday_holiday_mask(date_arr, target_month_num, target_week_rank, target_weekday)
    else:
        target_month_num = holiday_detail['target_month']
        target_day = holiday_detail['target_day']
        return get_date_holiday_mask(date_arr, target_month_num, target_day)


def check_flat(data, flat_thres):
    if data.shape[0] <= 1:
        return False
    else:
        last_val = data[-1, 1]
        for i in range(data.shape[0] - 1, -1, -1):
            if (data[i, 1] != last_val):
                return False
            else:
                if (data[-1, 0] - data[i, 0]) >= flat_thres:
                    return True
                else:
                    continue
        if i == 0:
            return False


def get_peak_idx(data):
    if data.shape[0] == 0:
        raise Exception('can not get peak from empty data')
    else:
        this_idx = np.argwhere(data[:, 1] == np.max(data[:, 1])).reshape(-1, )
        use_index = data[this_idx, 0]
        return np.max(use_index)


## reason for this function: python internal: round(730.5) = 730, but we need 731
def my_round_to_decimal(val, decimal=0):
    multiplier = 10**decimal
    if type(val) in [np.ndarray, list]:
        np_val = np.array(val, dtype=float)
        use_arr = np_val * multiplier
        use_base = np_val.astype(int)
        ret = np_val.astype(int)
        use_dif = use_arr - use_base
        ret[use_dif >= 0.5] = ret[use_dif >= 0.5] + 1
        return ret / multiplier
    else:
        use_val = val * multiplier
        rem = use_val - int(use_val)
        sign = 1 if val >= 0 else -1
        if abs(rem) > 0.5 or np.isclose(abs(rem), 0.5):
            ret = (int(use_val) + sign) / multiplier
        else:
            ret = int(use_val) / multiplier

        return ret if decimal > 0 else int(ret)


def round_idx_to_valid(t_peak, raw_data):
    no0_data = raw_data[raw_data[:, 1] > 0, :]
    if no0_data.shape[0] > 0:

        abs_dif = np.abs(no0_data[:, 0] - t_peak)
        ret_idx = np.argmin(abs_dif)
        return no0_data[ret_idx, 0]
    else:
        t_peak


def linear_fit(data):  ### k, b
    if data.shape[0] == 0:
        raise Exception('linear fit data not enough')
    elif data.shape[0] == 1:
        return 0, data[0, 1]
    else:
        X = np.stack([np.ones(data.shape[0]), data[:, 0]], axis=1)
        Y = data[:, 1].reshape(-1, 1)
        A = np.matmul(X.transpose(), X)
        B = np.matmul(X.transpose(), Y)
        para = np.linalg.solve(A, B)
        return para[1, 0], para[0, 0]


def jsonify_segments(segments):
    ret = deepcopy(segments)
    for seg in ret:
        for k, v in seg.items():
            if type(v) is not str and v is not None:
                seg[k] = float(v)
    return ret


def dict_2_obj(dictionary):
    class dict_obj(dict):
        def __init__(self, dictionary):
            for k, v in dictionary.items():
                setattr(self, k, v)

    return dict_obj(dictionary)


def check_leap_year(year):
    if year % 4 == 0:
        if year % 100 == 0:
            if year % 400 == 0:
                ret = True
            else:
                ret = False
        else:
            ret = True
    else:
        ret = False

    return ret


def get_number_of_days_month(month, year):
    if not month or not year:
        return 0

    month = int(month)
    year = int(year)
    ret = 0
    month_30_days = set([4, 6, 9, 11])

    if month == 2:
        leap_year = check_leap_year(year)

        if leap_year:
            ret = 29
        else:
            ret = 28

    elif month in month_30_days:
        ret = 30
    else:
        ret = 31

    return ret


def get_year_num(np_datetime64):
    return 1970 + np_datetime64.astype('datetime64[Y]').astype(int)


def get_month_num(np_datetime64):
    return (np_datetime64.astype('datetime64[M]')
            - np_datetime64.astype('datetime64[Y]').astype('datetime64[M]')).astype(int) + 1


def shift_idx(orig_idx, shift_num, shift_unit):
    num_float = shift_num - int(shift_num)
    num_int = int(shift_num)
    if num_float > 0:
        if shift_unit == 'year':
            rem_unit = 'month'
            rem_num = int(num_float * 12)
            return shift_idx(shift_idx(orig_idx, num_int, shift_unit), rem_num, rem_unit)
        elif shift_unit == 'month':
            rem_unit = 'day'
            rem_num = int(num_float * 30.4375)
            return shift_idx(shift_idx(orig_idx, num_int, shift_unit), rem_num, rem_unit)
        elif shift_unit == 'day':
            return shift_idx(orig_idx, num_int, shift_unit)

    ## if shift = 0, return orig_idx
    orig_date = BASE_TIME + int(orig_idx)
    # orig_year_idx = orig_date.astype('datetime64[Y]')
    orig_month_idx = orig_date.astype('datetime64[M]')
    orig_day_idx = orig_date.astype('datetime64[D]')

    def get_year_num(np_datetime64):
        return 1970 + np_datetime64.astype('datetime64[Y]').astype(int)

    def get_month_num(np_datetime64):
        return (np_datetime64.astype('datetime64[M]')
                - np_datetime64.astype('datetime64[Y]').astype('datetime64[M]')).astype(int) + 1

    def get_day_num(np_datetime64):
        return (np_datetime64.astype('datetime64[D]')
                - np_datetime64.astype('datetime64[M]').astype('datetime64[D]')).astype(int) + 1

    orig_year_num = get_year_num(orig_date)
    orig_month_num = get_month_num(orig_date)
    orig_day_num = get_day_num(orig_date)
    if shift_unit == 'year':
        shift_year_num = orig_year_num + num_int
        shift_month_num = orig_month_num
        shift_day_num = orig_day_num
    elif shift_unit == 'month':
        shift_month_idx = orig_month_idx + num_int
        shift_year_num = get_year_num(shift_month_idx)
        shift_month_num = get_month_num(shift_month_idx)
        shift_day_num = orig_day_num
    elif shift_unit == 'day':
        shift_day_idx = orig_day_idx + num_int
        shift_year_num = get_year_num(shift_day_idx)
        shift_month_num = get_month_num(shift_day_idx)
        shift_day_num = get_day_num(shift_day_idx)
    else:
        raise ValueError(ERROR_MESSAGE_SHIFT_UNIT_INVALID)

    # Limit shift year num between 1 and 5000.
    shift_year_num = int(np.clip(shift_year_num, 1, 5000))

    # Cannot exceed the number of days in the month.
    days_in_shift_month = get_number_of_days_month(shift_month_num, shift_year_num)
    shift_day_num = min(shift_day_num, days_in_shift_month)

    shift_date = np.datetime64(date(shift_year_num, shift_month_num, shift_day_num))
    return (shift_date - BASE_TIME).astype(int)


def parse_time_new(data, time_dict):  # noqa, C901
    # time_dict = {'mode': , 'unit': , 'absolute_range': , 'num_range'}
    # mode: absolute_range, all, last
    # unit: only applys to last, can be 'day', 'month', 'year', 'percent'
    # range: only applys to last and absolute_range, should be integer range [a, b]
    # e.g. unit = month, num_range = [3,10],
    # data that is between the last 3rd month and last 10th month, including the 3rd month and 10th month
    #
    # e.g. unit = percent, num_range = [1, 1]
    # the data is separated into 100 pieces, this will give the last 1 piece to the user
    #
    # e.g. mode: absolute_range, range = [0, 100] , idx=10000 is '1900-04-11'
    # will return data that is between BASE_TIME to '1900-04-11', including these 2 dates

    mode = time_dict['mode']
    unit = time_dict['unit']
    num_range = time_dict['num_range']
    absolute_range = time_dict['absolute_range']
    if absolute_range is not None:
        if type(absolute_range[0]) == str:
            absolute_range[0] = (np.datetime64(absolute_range[0][:10]) - BASE_TIME).astype(int)

        if type(absolute_range[1]) == str:
            absolute_range[1] = (np.datetime64(absolute_range[1][:10]) - BASE_TIME).astype(int)

        if absolute_range[0] is None:
            absolute_range[0] = -100000

        if absolute_range[1] is None:
            absolute_range[1] = 100000

        if absolute_range[1] < absolute_range[0]:
            absolute_range[0] = absolute_range[1]

    if data.shape[0] == 0:
        if absolute_range is None:
            ret = [-100000, 100000]
        else:
            ret = absolute_range
    else:
        clean_data_mask = (data[:, 1] > 0) & (~np.isnan(data[:, 1]))
        clean_data = data[clean_data_mask, :]
        if clean_data.shape[0] > 0:
            first_idx = int(clean_data[0, 0])
            last_idx = int(clean_data[-1, 0])
        else:
            first_idx = int(data[0, 0])
            last_idx = int(data[-1, 0])

        def absolute_range_branch():
            return absolute_range

        def all_branch():
            return [data[0, 0], data[-1, 0]]

        def first_branch():
            first_date = BASE_TIME + first_idx
            first_month = first_date.astype('datetime64[M]')
            first_year = first_date.astype('datetime64[Y]')
            if unit == 'day':
                left_idx = shift_idx(first_idx - 1, num_range[0], unit)
                right_idx = shift_idx(first_idx - 1, num_range[1], unit)
            elif unit == 'month':
                first_month_start_idx = (first_month.astype('datetime64[D]') - BASE_TIME).astype(int)
                left_idx = shift_idx(first_month_start_idx, num_range[0] - 1, unit)
                right_idx = shift_idx(first_month_start_idx, num_range[1], unit)
            elif unit == 'year':
                first_year_start_idx = (first_year.astype('datetime64[D]') - BASE_TIME).astype(int)
                left_idx = shift_idx(first_year_start_idx, num_range[0] - 1, unit)
                right_idx = shift_idx(first_year_start_idx, num_range[1], unit)
            elif unit == 'percent':
                dif = data[-1, 0] - data[0, 0]
                percent_dif = dif / 100
                left_idx = first_idx + int((num_range[0] - 1) * percent_dif)
                right_idx = first_idx + int(num_range[1] * percent_dif)
            return [left_idx, right_idx]

        def last_branch():
            last_date = np.datetime64('1900-01-01') + last_idx
            last_month = last_date.astype('datetime64[M]')
            next_month = last_month + 1
            last_year = last_date.astype('datetime64[Y]')
            next_year = last_year + 1
            if unit == 'day':
                left_idx = shift_idx(last_idx + 1, -num_range[1], unit)
                right_idx = shift_idx(last_idx + 1, -num_range[0], unit)
            elif unit == 'month':
                next_month_start_idx = (next_month.astype('datetime64[D]') - BASE_TIME).astype(int)
                left_idx = shift_idx(next_month_start_idx, -num_range[1], unit)
                right_idx = shift_idx(next_month_start_idx, -(num_range[0] - 1), unit) - 1
            elif unit == 'year':
                next_year_start_idx = (next_year.astype('datetime64[D]') - BASE_TIME).astype(int)
                left_idx = shift_idx(next_year_start_idx, -num_range[1], unit)
                right_idx = shift_idx(next_year_start_idx, -(num_range[0] - 1), unit) - 1
            elif unit == 'percent':
                dif = data[-1, 0] - data[0, 0]
                percent_dif = dif / 100
                left_idx = last_idx - int(num_range[1] * percent_dif)
                right_idx = last_idx - int((num_range[0] - 1) * percent_dif)
            return [left_idx, right_idx]

        ret = {
            'absolute_range': absolute_range_branch,
            'all': all_branch,
            'first': first_branch,
            'last': last_branch
        }.get(mode)()
    return ret


def append_weight_to_fit_data(data, para_dict):
    weight_dict = para_dict['weight_dict']
    weight_arr = np.ones((data.shape[0], 1))
    if weight_dict['mode'] != 'all':
        # Weighting 'all' data does nothing to change fit. Front-end might pass stale values, so just stick
        # with a weight of 1 if the mode is 'all'.
        data_range = parse_time_new(data, weight_dict)
        mask = (data_range[0] <= data[:, 0]) & (data[:, 0] <= data_range[1])
        weight_arr[mask] = weight_dict['value']
    return np.concatenate([data, weight_arr], axis=1)


def convert_daily_use_actual_days(data: np.ndarray) -> np.ndarray:
    index = data[:, 0]

    if index is not None:
        start_month = (BASE_TIME + int(index[0])).astype('datetime64[M]')
        end_month = (BASE_TIME + int(index[-1])).astype('datetime64[M]')

        fill_month_arr = np.arange(start_month, end_month + 1)
        month_start_idx_arr = (fill_month_arr.astype('datetime64[D]') - BASE_TIME).astype(int)
        month_end_idx_arr = ((fill_month_arr + 1).astype('datetime64[D]') - 1 - BASE_TIME).astype(int)
        days_in_month_arr = (month_end_idx_arr - month_start_idx_arr + 1)

        if len(data[:, 1]) == len(days_in_month_arr):
            data[:, 1] = data[:, 1] / days_in_month_arr
        else:
            data[:, 1] = data[:, 1] / get_days_in_month_from_monthly_index(data[:, 0])


def get_days_in_month_from_monthly_index(monthly_index: np.ndarray) -> np.ndarray:
    """
    Calculate days in monthly array from the monthly index array, the monthly index array can be incontinuous

    Args:
        monthly_index: a monthly index from a well

    Returns:
        days_in_month_array: the days in month array generated from the monthly index array
    """

    monthly_arr = (np.array(monthly_index, dtype=int) + BASE_TIME).astype('datetime64[M]')

    month_start_idx_arr = (monthly_arr.astype('datetime64[D]') - BASE_TIME).astype(int)
    month_end_idx_arr = ((monthly_arr + 1).astype('datetime64[D]') - 1 - BASE_TIME).astype(int)
    days_in_month_arr = (month_end_idx_arr - month_start_idx_arr + 1)

    return days_in_month_arr
