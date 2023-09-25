from datetime import date
from typing import Any, AnyStr, Dict, Iterable, List, Tuple
import numpy as np
import pandas as pd
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.core_function.helper import my_round_to_decimal
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.shared.constants import DAYS_IN_MONTH, DEFAULT_UNIT_TEMPLATE, MONTHLY_UNIT_TEMPLATE, PHASES, PROB_SERIES
from combocurve.services.type_curve.tc_normalization_data_models import NORMALIZATION_FACTORS
from bson import ObjectId

DEFAULT_BACKGROUND_DATA_RESULT = {'idx': [], 'data': [], 'data_part_idx': []}
DEFAULT_DAILY_RANGE = {'align': [-1000, 999], 'noalign': [0, 1999]}

multi_seg = MultipleSegments()

DISPLAYED_PHASES = {'oil': 'Oil', 'gas': 'Gas', 'water': 'Water'}
DISPLAYED_SERIES = {'best': 'Best', 'P10': 'P10', 'P50': 'P50', 'P90': 'P90'}
DISPLAYED_AVE = {
    'average': 'Wells Average',
    'aveNoFst': 'Wells Average No Forecast',
    'p50': 'Wells P50',
    'p50NoFst': 'Wells P50 No Forecast',
    'count': 'Well Count',
}


def update_min_and_max(val, min_and_max):
    if val is None:
        return
    low, high = min_and_max
    if low is None or val < low:
        min_and_max[0] = val
    if high is None or val > high:
        min_and_max[1] = val


def get_default_q_peak_bounds(q_peak: float, resolution: str = "monthly") -> tuple[float, float]:
    '''
    Returns the default bounds for q_peak.

    Args:
        q_peak: The q_peak value.
    Returns:
        tuple[float, float]:The default bounds for q_peak.
    '''
    if resolution == "monthly":
        return (q_peak, q_peak * 1.5)
    else:
        return (0.9 * q_peak, 1.1 * q_peak)


def get_shift_base_segments(base_segments: List[Dict[str, Any]], ratio_start_idx: int):
    '''Shifts base segments to start at the same time as ratio segments.'''
    if len(base_segments) == 0:
        return base_segments
    delta_t = ratio_start_idx - base_segments[0]['start_idx']
    return multi_seg.shift_segments_idx(base_segments, delta_t)


def generate_background_average_data(background_volumes: np.ndarray,
                                     prod_indices: List[List],
                                     convert_monthly: bool = False) -> Dict[str, np.ndarray]:
    if background_volumes.size != 0:
        n_wells, n_volumes = background_volumes.shape
    else:
        return {k: np.array([], dtype=float) for k in DISPLAYED_AVE.keys()}
    prod_mask = get_prod_data_mask(prod_indices, n_volumes, n_wells)
    ret = {}
    ret['average'] = np.nanmean(background_volumes, axis=0)
    ret['p50'] = np.nanmedian(background_volumes, axis=0)
    prod_only_data = np.ma.masked_array(background_volumes, ~prod_mask | np.isnan(background_volumes))
    ret['aveNoFst'] = np.ma.average(prod_only_data, axis=0)
    ret['p50NoFst'] = np.ma.median(prod_only_data, axis=0)

    if convert_monthly:
        for key in ret:
            ret[key] = ret[key] * DAYS_IN_MONTH

    ret['count'] = np.sum(prod_mask, axis=0)

    return ret


def get_prod_data_mask(prod_indices: List[List], n_volumes: int, n_wells: int):
    prod_data_mask = np.zeros((n_wells, n_volumes), dtype=bool)

    for i in range(n_wells):
        [prod_start, prod_end, has_prod] = prod_indices[i]
        if has_prod:
            prod_data_mask[i, prod_start:prod_end] = True

    return prod_data_mask


def percentile_ranks(values: Iterable):
    '''Generates an array of the percentile ranks of each entry amongst values.
    In: percentile_ranks((0, 3, 2))
    Out: array([0.33333333, 1., 0.66666667])
    '''
    if not isinstance(values, np.ndarray):
        try:
            values = np.array(values)
        except TypeError as e:
            raise e('Cannot coerce input into np.ndarray.')
    if len(values.shape) > 1:
        raise ValueError('Can only compute percentiles of 1-D array-like.')
    sorted_indices = np.argsort(values)
    # Funky, but petro engineers have percentiles backward.
    percentile_ranks = 1 - np.arange(values.shape[0]) / values.shape[0]
    ret = np.empty_like(percentile_ranks)
    ret[sorted_indices] = percentile_ranks
    return ret


def linear_extrapolate_from_2_points(left_point: Iterable, right_point: Iterable, target_t: float) -> float:
    left_t, left_v = left_point
    right_t, right_v = right_point
    if left_v is None:
        left_v = 0.0
    if right_v is None:
        right_v = 0.0
    if left_t >= right_t:
        raise ValueError('left start should be strictly less than right start')
    slope = (right_v - left_v) / (right_t - left_t)
    return left_v + (target_t - left_t) * slope


def cum_between_points(left_point: Iterable, right_point: Iterable, calculate_between: Iterable) -> float:
    '''Calculate the cumulative values between 2 times, given 2 reference points using the trapezoid rule.

    Inputs:
    -------
    - `left_point: Iterable`, (x,y) pair of the left point
    - `right_point: Iterable`, (x,y) pair of the right point
    - `calculate_between: Iterable`, two time values (t1, t2) between which to compute the cum.

    Outputs:
    --------
    - `float`, the cum between t1 and t2 INCLUSIVE.
    '''
    left_t, left_v = left_point
    right_t, right_v = right_point
    cum_start, cum_end = calculate_between

    left_v = 0.0 if left_v is None or np.isnan(left_v) else left_v
    right_v = 0.0 if right_v is None or np.isnan(right_v) else right_v
    lp = (left_t, left_v)
    rp = (right_t, right_v)

    if left_t >= right_t:
        raise ValueError('Left start should be strictly less than right start')
    if cum_start > cum_end:
        raise ValueError('Cum start should be less than or equal to cum end')

    cum_start_v = linear_extrapolate_from_2_points(lp, rp, cum_start)
    cum_end_v = linear_extrapolate_from_2_points(lp, rp, cum_end)
    return (cum_start_v + cum_end_v) * (cum_end - cum_start + 1) / 2


def discrete_data_self_cum(time_arr: Iterable, value_arr: Iterable, cum_start_time: float) -> List[float]:
    '''Calculate cumulative at each time value in a discrete data set.

    Inputs:
    -------
    - `time_arr: Iterable`, 1-D iterable of timestamps.
    - `vaue_arr: Iterable`, 1-D iterable of same shape as `time_arr` containing values.
    - `cum_start_time: float`, time after which to start calculating cums.

    Outputs:
    --------
    - `List[float]`, List of same length as `tim_arr` containing cum-values. Cum-values include the cum at
    the corresponding time stamp.
    '''
    all_cums = []
    cur_cum = 0.0
    for i, t in enumerate(time_arr):
        if t < cum_start_time:
            all_cums.append(0.0)
            continue
        # Deal with first point edge-case.
        if i == 0:
            if len(time_arr) >= 2:
                this_cum = cum_between_points((time_arr[0], value_arr[1]), (time_arr[1], value_arr[1]),
                                              (cum_start_time, time_arr[0]))
            else:
                this_cum = (time_arr[0] - cum_start_time + 1) * value_arr[0]
        # Deal with first t after cum_start_time
        elif time_arr[i - 1] < cum_start_time:
            this_cum = cum_between_points((time_arr[i - 1], value_arr[i - 1]), (time_arr[i], value_arr[i]),
                                          (cum_start_time, time_arr[i]))
        # Generic case
        else:
            this_cum = cum_between_points((time_arr[i - 1], value_arr[i - 1]), (time_arr[i], value_arr[i]),
                                          (time_arr[i - 1] + 1, time_arr[i]))
        cur_cum += this_cum
        all_cums.append(cur_cum)
    return all_cums


def cum_from_discrete_data(time_arr: List, value_arr: List, cum_start_time: float,
                           cum_time_arr: Iterable) -> Dict[str, List[float]]:
    '''Calculate cumulative value from discrete points, given rates at other points. Uses trapezoid rule to
    approximate cums.

    Inputs:
    -------
    - `time_arr: List`, The times of the known rates.
    - `value_arr: List`, The known rates, same length as `time_arr`.
    - `cum_start_time: float`, The time from which to start calculating cums.
    - `cum_time_arr: Iterable`, The times at which to compute the cums.

    Output:
    -------
    - `Dict[str, List[float]]`, Outputs a dict of list with the following keys:
        - `'cum'`: An array of the cum values at each index in `cum_time_arr`.
        - `'rate'`: An array of the rate values (using linear interpolation) at each index in `cum_time_arr`.
    '''
    tick_cum = discrete_data_self_cum(time_arr, value_arr, cum_start_time)
    cur_tick_idx = -1
    # Note this format differs from main. In Python it's easier to deal with dicts of lists ass opposed
    # to arrays of objects in JS.
    all_cums = {'cum': [], 'rate': []}
    for t in cum_time_arr:
        if t < cum_start_time:
            all_cums['cum'].append(0.0)
            all_cums['rate'].append(0.0)
            continue
        # Deal with case where cum_time_arr is past the end of time_arr.
        if t >= time_arr[-1]:
            all_cums['cum'].append(tick_cum[-1])
            if t == time_arr[-1]:
                all_cums['rate'].append(value_arr[-1])
            else:
                all_cums['rate'].append(None)
            continue
        # Find cur_tick_idx so that time_arr[cur_tick_idx] <= t < time_arr[cur_tick_idx+1].
        while time_arr[cur_tick_idx + 1] <= t:
            cur_tick_idx += 1
        # Here time_arr[0] > t. Assume rate is flat beforehand.
        if cur_tick_idx == -1:
            all_cums['cum'].append((t - cum_start_time + 1) * value_arr[0])
            all_cums['rate'].append(value_arr[0])
        # We just started, so the whole interval time_arr interval isn't included in cum.
        elif time_arr[cur_tick_idx] <= cum_start_time and cum_start_time < time_arr[cur_tick_idx + 1]:
            left_point = (time_arr[cur_tick_idx], value_arr[cur_tick_idx])
            right_point = (time_arr[cur_tick_idx + 1], value_arr[cur_tick_idx + 1])
            this_cum = cum_between_points(left_point, right_point, (cum_start_time, t))
            all_cums['cum'].append(this_cum)
            all_cums['rate'].append(linear_extrapolate_from_2_points(left_point, right_point, t))
        elif time_arr[cur_tick_idx] == t:
            all_cums['cum'].append(tick_cum[cur_tick_idx])
            all_cums['rate'].append(value_arr[cur_tick_idx])
        else:
            left_point = (time_arr[cur_tick_idx], value_arr[cur_tick_idx])
            right_point = (time_arr[cur_tick_idx + 1], value_arr[cur_tick_idx + 1])
            this_cum = tick_cum[cur_tick_idx] + cum_between_points(left_point, right_point,
                                                                   (time_arr[cur_tick_idx] + 1, t))
            all_cums['cum'].append(this_cum)
            all_cums['rate'].append(linear_extrapolate_from_2_points(left_point, right_point, t))
    return all_cums


def get_phase_fits(
    fits: Dict[str, Dict[str, Any]],
    time: Iterable,
    base_phase: str = None,
    base_series: str = 'best',
) -> Dict[Tuple[str, str], np.ndarray]:
    '''Returns all TC predictions for all phases and all series.
    Inputs:
    -------
    - `fits: Dict[str, Dict[str, Any]]`: A dict of raw fit documents from the `type-curve-fits` collection keyed on
    phase.
    - `base_phase_series: Union[str, NoneType]`: The base phase for the type curve.
    - `time: Iterable`: An 1-D list of time stamps at which to make the predictions. The first value will be considered
    the start date of the type curve.

    Outputs:
    --------
    `Dict[Tuple[str,str], np.ndarray]`: The output predictions in the form `{(phase, series) : <predictions>}`.
    '''
    fit_data = {}
    start_time = time[0]
    if base_phase is not None:
        base_segments = fits.get(base_phase, {}).get('P_dict', {}).get(base_series, {}).get('segments', [])
    for phase, fit in fits.items():
        fit_type = fit['fitType']
        if fit_type == 'ratio':
            if len(base_segments) == 0:
                continue
        P_dict = fit['P_dict'] if fit_type == 'rate' else fit['ratio_P_dict']
        for series in P_dict:
            segments = P_dict[series].get('segments', [])
            if len(segments) == 0:
                continue
            shifted_segments = get_shift_segments(segments, start_time)
            if fit_type == 'ratio':
                shifted_base_segments = get_shift_segments(base_segments, start_time)
            if fit_type == 'rate':
                preds = multi_seg.predict(time, shifted_segments)
            else:
                preds = multi_seg.predict_time_ratio(time, shifted_segments, shifted_base_segments)
            fit_data[(phase, series)] = preds
    return fit_data


def generate_tc_volumes_table(dates: List[date], phase_fits: Dict[Tuple[str, str], np.ndarray],
                              resolution: str) -> pd.DataFrame:
    '''Build a data table for type curve csv export.
    Inputs:
    -------
    - `dates: List[date]` A list of the dates for each volume in `phase_fits`. Should be the same length as the arrays
    in `phase_fits`.
    - `phase_fits: Dict[Tuple[str, str], np.ndarray]` The output from `get_phase_fits`. A dictionary of type curve
    volumes keyed on `(phase, series)`.
    - `resolution: str` The `'daily'|'monthly'` resolution of the data.

    Output:
    -------
    `pd.DataFrame` A DataFrame ready for export with formatted headings and data in columns.
    '''
    res_units = {'daily': DEFAULT_UNIT_TEMPLATE, 'monthly': MONTHLY_UNIT_TEMPLATE}
    tc_volumes_sheet = {'Date': dates}
    for phase in PHASES:
        for series in PROB_SERIES:
            phase_label = f'{DISPLAYED_PHASES[phase]} {DISPLAYED_SERIES[series]} ({res_units[resolution][phase]})'
            tc_volumes_sheet[phase_label] = phase_fits.get((phase, series), '')
    return pd.DataFrame(tc_volumes_sheet)


def generate_well_volumes_table(
    phase: str,
    index: List[int],
    averages: Dict[str, np.ndarray],
    volumes: List[List[float]],
    well_names: List[str],
    well_numbers: List[str],
    resolution: str = 'monthly',
) -> pd.DataFrame:
    '''Build a data table of background wells for type curve csv export.
    Inputs:
    -------
    - `phase: str` The phase for this data table, one of `'oil'|'gas'|'water'`.
    - `index: List[in]` A list of months, generally 1, 2, ..., 720.
    - `averages: Dict[str, np.ndarray]` The average data, same as output of `generate_background_average_data`.
    - `volumes: List[List[float]]` The well volumes generated by `get_noalign_monthly_resolution`.
    - `well_names: List[str]` The name of the well, a list in same order as `volumes`. If none exists will be `None`.
    - `well_number: List[str]` The number of the well, a list in same order as `volumes`. If none exists will be `None`.
    - `resolution: str` The resolution used to generate data, default is monthly

    Output:
    -------
    `pd.DataFrame` A DataFrame ready for export with formatted headings and data in columns.
    '''
    if resolution == 'monthly':
        well_sheet = {'Month In': index}
        well_sheet['Phase'] = [f'{DISPLAYED_PHASES[phase]} ({MONTHLY_UNIT_TEMPLATE[phase]})' for _ in index]
        well_sheet.update([[v, averages[k]] for k, v in DISPLAYED_AVE.items()])
    else:
        well_sheet = {'Day In': index}
        well_sheet['Phase'] = [f'{DISPLAYED_PHASES[phase]} ({DEFAULT_UNIT_TEMPLATE[phase]})' for _ in index]
        well_sheet.update([[v, averages[k]] for k, v in DISPLAYED_AVE.items()])

    columns_loc = len(well_sheet)
    sheet = pd.DataFrame(well_sheet)
    for i, vol in enumerate(volumes):
        name = well_names[i] if well_names[i] is not None else ''
        numb = well_numbers[i] if well_numbers[i] is not None else ''
        heading = f'{name} {numb}'
        sheet.insert(columns_loc, heading, vol, allow_duplicates=True)
        columns_loc += 1
    clean_sheet = sheet.fillna('')
    return clean_sheet


def get_shift_segments(segments: List[Dict[str, Any]], start_time: int):
    '''Shift tc segments to start at start_time.'''
    try:
        shifted = multi_seg.shift_segments_idx(segments, start_time - segments[0]['start_idx'])
        return shifted
    except IndexError as e:
        raise Exception('There are no segments') from e
    except KeyError as e:
        raise Exception('The segment has no start_date') from e


def get_ratio_without_warning(target_arr, base_arr):
    ratio_value = np.zeros(target_arr.shape, dtype=float) * np.nan
    invalid_mask = np.isnan(target_arr) | np.isnan(base_arr) | (base_arr == 0)
    ratio_value[~invalid_mask] = target_arr[~invalid_mask] / base_arr[~invalid_mask]
    return ratio_value


def ratio_predict(raw_t, ratio_segments, base_TC_segments):
    np_t = np.array(raw_t)
    if (len(ratio_segments) == 0) or (len(base_TC_segments) == 0):
        return np.zeros(np_t.shape)
    else:
        delta_t = ratio_segments[0]['start_idx'] - base_TC_segments[0]['start_idx']
        align_base_TC_segments = multi_seg.shift_segments_idx(base_TC_segments, delta_t)

        return multi_seg.predict_time_ratio(np_t, ratio_segments, align_base_TC_segments)


def ratio_eur(ratio_segments, base_TC_segments):
    if (len(ratio_segments) == 0) or (len(base_TC_segments) == 0):
        return 0
    else:
        delta_t = ratio_segments[0]['start_idx'] - base_TC_segments[0]['start_idx']
        align_base_TC_segments = multi_seg.shift_segments_idx(base_TC_segments, delta_t)

        return multi_seg.ratio_eur_interval(0, ratio_segments[0]['start_idx'] - 100, ratio_segments[0]['start_idx'],
                                            ratio_segments[-1]['end_idx'], ratio_segments, align_base_TC_segments,
                                            'daily')


def classify(percentile_data_dict, p_names):
    ret = {}
    for this_name in p_names:
        this_arr = percentile_data_dict[this_name][:, 1]
        this_clean = this_arr[this_arr > 0]
        if this_clean.shape[0] == 0:
            ret[this_name] = 'zero'
        elif this_clean.shape[0] == 1:
            ret[this_name] = 'before_peak'
        else:
            if (this_clean == this_clean[0]).all():
                ret[this_name] = 'flat'
            else:
                t_peak = np.argmax(this_clean)
                ap_data = this_clean[t_peak:]
                bp_data = this_clean[:t_peak]
                has_ap = False
                has_bp = False
                if ap_data.shape[0] > 1:
                    has_ap = True

                if bp_data.shape[0] >= 1:
                    has_bp = True

                if has_ap and has_bp:
                    ret[this_name] = 'good'
                elif (not has_ap) and (has_bp):
                    ret[this_name] = 'before_peak'
                elif has_ap and (not has_bp):
                    ret[this_name] = 'after_peak'
                else:
                    ret[this_name] = 'zero'
    ordering = [
        'P50_good', 'P10_good', 'average_good', 'P50_after_peak', 'P10_after_peak', 'average_after_peak',
        'P50_before_peak', 'P10_before_peak', 'average_before_peak', 'P90_good', 'P90_after_peak', 'P90_before_peak',
        'flat/zero'
    ]
    this_ret_class = [k + '_' + v for k, v in ret.items()]
    for order in ordering:
        if order in this_ret_class:
            break

    if order == 'flat/zero':
        benchmark_series = 'P50'
        peak_ind = 0
    else:
        benchmark_series = order.split('_')[0]
        peak_ind = np.argmax(percentile_data_dict[benchmark_series][:, 1])

    return ret, benchmark_series, peak_ind


def get_align_daily_resolution(well_information_s, daily_range):
    if len(well_information_s) == 0:
        return DEFAULT_BACKGROUND_DATA_RESULT

    num_month = max(len(w['monthly_prod']) for w in well_information_s)
    well_month_INDEX_s = list(map(lambda x: x['indexes']['maximum_data']['month'], well_information_s))
    bp_month = max(well_month_INDEX_s)
    ap_month = num_month - min(well_month_INDEX_s) - 1
    bp_idx = [my_round_to_decimal((i + 1) * (-DAYS_IN_MONTH)) for i in range(bp_month)][::-1]
    ap_idx = [my_round_to_decimal((i + 1) * DAYS_IN_MONTH) for i in range(ap_month)]

    align_month_idx = bp_idx + [0] + ap_idx
    align_n_col = len(align_month_idx)

    n_leading = None
    n_following = None

    for i in range(len(align_month_idx)):
        if align_month_idx[i] >= daily_range[0]:
            n_leading = i
            break

    for i in range(len(align_month_idx)):
        if align_month_idx[align_n_col - i - 1] <= daily_range[1]:
            n_following = i
            break

    n_middle = daily_range[1] - daily_range[0] + 1
    leading_idx = align_month_idx[:n_leading]
    middle_idx = (np.arange(n_middle) + daily_range[0]).tolist()
    following_idx = align_month_idx[(align_n_col - n_following):]
    idx_arr = leading_idx + middle_idx + following_idx

    align_data = []
    data_part_idx = []
    for i, well in enumerate(well_information_s):
        data = well['data']
        data_month_start_idx = well['data_month_start_idx']
        days_in_month_arr = well['days_in_month_arr']
        indexes = well['indexes']
        monthly_prod = well['monthly_prod']

        well_maximum_month_INDEX = indexes['maximum_data']['month']
        well_last_month_INDEX = indexes['last_data']['month']
        well_start_idx = indexes['first_data']['idx']
        well_maximum_idx = indexes['maximum_data']['idx']
        well_last_idx = indexes['last_data']['idx']
        well_end_idx = data_month_start_idx[len(data_month_start_idx) - 1] + days_in_month_arr[-1]

        well_first_day = indexes['first_data']['day']

        align_month_start_idx = data_month_start_idx[0] - well_maximum_idx
        align_start_idx = well_start_idx - well_maximum_idx
        align_last_idx = well_last_idx - well_maximum_idx
        align_end_idx = well_end_idx - well_maximum_idx

        data_part_left = None
        following_value = None
        leading_value = None
        middle_left_INDEX = None
        middle_right_INDEX = None
        middle_value = None
        n_month_data = None
        if daily_range[0] <= align_start_idx:
            leading_value = [None for _ in range(n_leading)]
            middle_value = [None for _ in range(align_start_idx - daily_range[0])]
            data_part_left = n_leading + (align_start_idx - daily_range[0])
            middle_left_INDEX = align_start_idx - align_month_start_idx
        else:
            n_leading_None = bp_month - well_maximum_month_INDEX
            data_part_left = n_leading_None
            n_month_data = n_leading - n_leading_None
            leading_value = [None for _ in range(n_leading_None)] + monthly_prod[:n_month_data]
            middle_value = []
            middle_left_INDEX = well_first_day + (daily_range[0] - align_start_idx)

        if daily_range[1] >= align_end_idx:
            following_value = [None for _ in range(n_following)]
            middle_right_INDEX = align_end_idx - align_month_start_idx
            middle_value += data[middle_left_INDEX:(middle_right_INDEX
                                                    + 1)] + [None for _ in range(daily_range[1] - align_end_idx)]
        else:
            middle_right_INDEX = daily_range[1] - align_month_start_idx
            middle_value += data[middle_left_INDEX:(middle_right_INDEX + 1)]
            n_following_None = ap_month - (num_month - 1 - well_maximum_month_INDEX)
            n_month = n_following - n_following_None
            following_value = monthly_prod[(num_month - n_month):] + [None for _ in range(n_following_None)]

        align_well_last_month_INDEX = well_last_month_INDEX - well_maximum_month_INDEX
        align_last_month_idx = my_round_to_decimal(DAYS_IN_MONTH * align_well_last_month_INDEX)

        data_part_right = None
        if align_last_idx < daily_range[0]:
            if align_last_month_idx <= leading_idx[len(leading_idx) - 1]:
                data_part_right = bp_month + 1 + align_well_last_month_INDEX
            else:
                data_part_right = n_leading

        elif align_last_idx > daily_range[1]:
            if n_following == 0:
                data_part_right = n_leading + n_middle
            elif align_last_month_idx >= following_idx[0]:
                data_part_right = len(idx_arr) - (ap_month - align_well_last_month_INDEX)
            else:
                data_part_right = n_leading + n_middle
        else:
            data_part_right = n_leading + (align_last_idx - daily_range[0]) + 1

        data_part_idx.append([data_part_left, data_part_right, well['has_production']])
        value_arr = leading_value + middle_value + following_value
        align_data.append(value_arr)

    # In rare cases, data have different lengths.
    ret = _ensure_rows_equal_length({'idx': idx_arr, 'data': align_data, 'data_part_idx': data_part_idx})
    return ret


def get_noalign_daily_resolution(well_information_s, daily_range):
    if len(well_information_s) == 0:
        return DEFAULT_BACKGROUND_DATA_RESULT

    num_month = max(len(w['monthly_prod']) for w in well_information_s)
    noalign_data = []

    monthly_idx = [my_round_to_decimal(i * DAYS_IN_MONTH) for i in range(num_month)]
    n_leading = 0

    for i in range(num_month):
        if monthly_idx[i] >= daily_range[0]:
            n_leading = i
            break

    n_following = 0
    for i in range(num_month):
        if monthly_idx[num_month - 1 - i] <= daily_range[1]:
            n_following = i
            break

    leading_idx = monthly_idx[:n_leading]

    middle_idx = [i + daily_range[0] for i in range(daily_range[1] - daily_range[0] + 1)]
    following_idx = monthly_idx[(num_month - n_following):]
    idx_arr = leading_idx + middle_idx + following_idx

    data_part_idx = []
    for i, well in enumerate(well_information_s):
        data = well['data']
        indexes = well['indexes']
        monthly_prod = well['monthly_prod']

        fpd_INDEX = indexes['first_data']['day']
        middle_daily_values = data[(daily_range[0] + fpd_INDEX):(daily_range[1] + fpd_INDEX + 1)]
        leading_value = monthly_prod[:n_leading]
        following_value = monthly_prod[(num_month - n_following):len(monthly_prod)]

        value_arr = leading_value + middle_daily_values + following_value

        noalign_data.append(value_arr)

        lpd_month_INDEX = indexes['last_data']['month']
        lpd_idx = indexes['last_data']['idx']
        fpd_idx = indexes['first_data']['idx']

        data_part_right = None
        if lpd_month_INDEX + 1 <= n_leading:
            data_part_right = lpd_month_INDEX + 1
        elif num_month - lpd_month_INDEX <= n_following:
            data_part_right = len(idx_arr) - (num_month - lpd_month_INDEX) + 1
        else:
            data_part_right = n_leading + (lpd_idx - fpd_idx - daily_range[0]) + 1

        data_part_idx.append([0, data_part_right, well['has_production']])

    # In rare cases, data have different lengths.
    ret = _ensure_rows_equal_length({'idx': idx_arr, 'data': noalign_data, 'data_part_idx': data_part_idx})
    return ret


def get_noalign_monthly_resolution(well_information_s, daily_range=None):
    if len(well_information_s) == 0:
        return DEFAULT_BACKGROUND_DATA_RESULT

    num_month = max(len(w['monthly_prod']) for w in well_information_s)
    noalign_data = []
    data_part_idx = []
    days_in_month_arr = []
    idx_arr = [my_round_to_decimal(DAYS_IN_MONTH * i) for i in range(num_month)]

    for well in well_information_s:
        noalign_data.append(well['monthly_prod'])
        this_data_part_idx = [0, well['indexes']['last_data']['month'] + 1, well['has_production']]
        data_part_idx.append(this_data_part_idx)

        this_days_in_month_arr = replace_forecast_days_in_month(this_data_part_idx, well['days_in_month_arr'])
        days_in_month_arr.append(this_days_in_month_arr)

    # In rare cases, data have different lengths.
    ret = _ensure_rows_equal_length({
        'idx': idx_arr,
        'data': noalign_data,
        'data_part_idx': data_part_idx,
        'days_in_month_arr': days_in_month_arr
    })
    return ret


def get_align_monthly_resolution(well_information_s, daily_range=None):
    if len(well_information_s) == 0:
        return DEFAULT_BACKGROUND_DATA_RESULT

    num_month = max(len(w['monthly_prod']) for w in well_information_s)
    well_month_INDEX_s = list(map(lambda x: x['indexes']['maximum_data']['month'], well_information_s))

    bp_month = max(well_month_INDEX_s)

    ap_month = num_month - min(well_month_INDEX_s) - 1

    bp_idx = [my_round_to_decimal((i + 1) * (-DAYS_IN_MONTH)) for i in range(bp_month)][::-1]
    ap_idx = [my_round_to_decimal((i + 1) * DAYS_IN_MONTH) for i in range(ap_month)]

    align_month_idx = bp_idx + [0] + ap_idx
    align_n_col = len(align_month_idx)

    align_data = []
    data_part_idx = []
    days_in_month_arr = []
    for well in well_information_s:
        this_data = well['monthly_prod']
        indexes = well['indexes']
        delta = bp_month - indexes['maximum_data']['month']
        this_left_range = indexes['first_data']['month'] + delta
        this_range = [this_left_range, this_left_range + num_month]

        this_align_data = [None for _ in range(this_range[0])]
        this_following_data = [None for _ in range(align_n_col - this_range[0] - num_month)]
        this_days_in_month_arr = this_align_data + well['days_in_month_arr'] + this_following_data
        this_align_data += this_data + this_following_data
        align_data.append(this_align_data)
        this_data_part_idx = [this_left_range, indexes['last_data']['month'] + 1 + delta, well['has_production']]
        data_part_idx.append(this_data_part_idx)
        this_days_in_month_arr = replace_forecast_days_in_month(this_data_part_idx, this_days_in_month_arr)
        days_in_month_arr.append(this_days_in_month_arr)
    # In rare cases, data have different lengths.
    ret = _ensure_rows_equal_length({
        'idx': align_month_idx,
        'data': align_data,
        'data_part_idx': data_part_idx,
        'days_in_month_arr': days_in_month_arr
    })
    return ret


def get_rep_wells_from_rep_init(context, tc_id, rep_data):
    well_ids = []

    for rep_well in rep_data:
        well_ids.append(ObjectId(rep_well['well_id']))

    TC_well_assignments = list(
        context.type_curve_well_assignments_collection.aggregate([
            {
                '$match': {
                    'typeCurve': ObjectId(tc_id),
                    'well': {
                        '$in': well_ids
                    }
                }
            },
            {
                '$sort': {
                    'well': 1
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'oil': 1,
                    'gas': 1,
                    'water': 1,
                    'well': 1,
                }
            },
        ]))

    TC_well_assignments_map = {}
    for assignment in TC_well_assignments:
        TC_well_assignments_map[str(assignment['well'])] = assignment

    for i in range(len(rep_data)):
        rep_data[i]['rep'] = {
            phase: rep_data[i]['valid'][phase] and TC_well_assignments_map[rep_data[i]['well_id']][phase]
            for phase in PHASES
        }


def moving_average(a: np.array, n: int = 3) -> np.array:
    '''
    Determine the moving-average for an array, with a window size of `n`.

    Params:
        a (np.array): the array to find the moving average of
        n (int): The window size of the moving average.
    Returns:
        An array with the moving average of `a`.
    '''
    kernel = np.full(n, 1 / n, dtype=np.float64)
    return np.convolve(a, kernel, mode='valid')


def _ensure_rows_equal_length(init_data: Dict) -> Dict:
    """
    Takes in some TC data, and ensures that all rows have a length equal to
    the index list length.

    Expected input is a dict with an `idx` key and a `data` key.

    Args:
        init_data (Dict): Dictionary containing `idx` and `data` keys

    Returns:
        Dict: a copy of the input, with all data rows being of length `len(idx)`
    """
    idx_arr = init_data['idx']
    data = init_data['data']
    data = [(d + ([None] * (len(idx_arr) - len(d)))) for d in data]
    return {**init_data, 'data': data}


def get_cum_data(calculated_background_data: Dict, normalization: np.ndarray) -> Dict:
    """
        Recreates some of the cumulative data that is present on the frontend.
        This is basically a translation of getCumData in daily_helpers.js

        Args:
            calculated_background_data (Dict): Contains the calculated bg data
            normalization (np.ndarray): The normalization array for these wells

        Returns:
            Dict: A dictionary containing the sum/cum data for the bg data passed to the function.
        """
    idx = calculated_background_data['cum_dict']['idx']
    cum_subind = calculated_background_data['cum_dict']['cum_subind']
    ret = {'sum': [], 'cum': []}

    if len(idx) == 0 or len(cum_subind) == 0:
        return ret

    data = calculated_background_data['monthly_prod']['data']
    mat = np.zeros((len(cum_subind), len(idx)), dtype=float)
    for i, well in enumerate(data):
        left_idx, right_idx = cum_subind[i]
        if left_idx is not None and right_idx is not None:
            mat[i][left_idx:right_idx] = np.array(well, dtype=float)

    normalization_dict = tc_normalization_array_converter(normalization)
    mat = TypeCurveNormalizationService().apply_normalization_multipliers(mat, normalization_dict)
    ret['sum'] = np.nansum(mat, axis=0)
    ret['cum'] = ret['sum'].cumsum()
    return ret


def get_aligned_prod_data(
    calculated_background_data: Dict,
    is_rate: bool,
    normalization_array: np.ndarray,
    alignment: AnyStr,
) -> Dict:
    """
    Function that replicates `getProdData` on the frontend, selects the correctly aligned data from
    calculated_background_data, normalizes, and returns it.

    Args:
        calculated_background_data (Dict): Contains the calculated bg data
        is_rate (bool): True if the phase is rate, False for ratio
        normalization_array (np.ndarray): The normalization array for these wells
        alignment (AnyStr): "align" | "noalign"

    Returns:
        Dict: Normalized production data with specified alignment
    """
    align_data = calculated_background_data['align']
    no_align_data = calculated_background_data['noalign']
    original = {'align': align_data, 'noalign': no_align_data}
    normalization_array_dict = tc_normalization_array_converter(normalization_array)

    if not is_rate:
        return original['noalign']
    normalizer = TypeCurveNormalizationService().apply_normalization_multipliers
    if alignment == 'align':
        return {
            **align_data,
            'data': normalizer(np.array(align_data['data'], dtype=float), normalization_array_dict).tolist(),
        }
    else:
        return {
            **no_align_data,
            'data':
            normalizer(np.array(no_align_data['data'], dtype=float), normalization_array_dict).tolist(),
        }


def tc_normalization_array_converter(normalization_array: np.ndarray) -> dict[str, np.ndarray]:
    """
    Convert numpy normalization multipliers to the dictionary format

    Args:
        multipliers: the normalization multipliers in numpy ndarray format

    Returns:
        dictionary: the normalization multipliers in dictionary format
    """
    n = len(normalization_array)
    organized_mults = {norm_factor: np.ones(n, dtype=float) for norm_factor in NORMALIZATION_FACTORS}
    if isinstance(normalization_array, np.ndarray) and normalization_array.shape[1] == 2:
        for i in range(n):
            multiplier = normalization_array[i]
            organized_mults['eur'][i] = multiplier[0]
            organized_mults['qPeak'][i] = multiplier[1]
    else:
        raise TypeError('This type is not currently supported. See doc string.')

    return organized_mults


def get_eur_data(calculated_background_data, normalization_array):
    # TODO: This will work, can be made faster, but need to check that the right mults are coming in.

    eur_data = calculated_background_data['eur']
    ret = eur_data
    if len(eur_data) == len(normalization_array):
        ret = [
            x if x is None or normalization_array[i] is None else x * normalization_array[i]
            for i, x in enumerate(eur_data)
        ]
    return ret


def calc_tc_eur(P_dict: dict[str, Any]) -> dict[str, float]:
    '''Generates eur for a type-curve, which, by definition, has no cum-data.

    Args:
        P_dict: The tc P_dict.

    Return:
        dict[str, flaot]: A dict keyed on 'best', 'P10', 'P50', 'P90' containing the eurs.
    '''
    eurs = {}
    for series, fit in P_dict.items():
        segs = fit['segments']
        if len(segs) == 0:
            eurs[series] = 0.0
        else:
            left_idx = segs[0]['start_idx']
            right_idx = segs[-1]['end_idx']
            eur = MultipleSegments.eur_precise(0.0, left_idx - 1, left_idx, right_idx, segs, 'daily')
            eurs[series] = eur
    return eurs


def replace_forecast_days_in_month(idx: list, days_in_month_arr: list):
    if idx and len(idx) == 3:
        for i in range(idx[1] + 1, len(days_in_month_arr)):
            days_in_month_arr[i] = DAYS_IN_MONTH

    return days_in_month_arr
