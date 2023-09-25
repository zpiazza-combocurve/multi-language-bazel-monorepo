import numpy as np

from combocurve.science.econ.helpers import BASE_DATE_NP
from combocurve.shared.date import idx_to_days_in_month
from ....utils.constants import DAYS_IN_YEAR


def my_bisect(f, a, b, tol=2e-6):
    cur_pair = np.array([a, b])

    cur_val = f(cur_pair)
    if np.prod(cur_val) > 0:
        raise Exception('bisect 2 side should have different sign')
    elif np.prod(cur_val) == 0:
        return cur_pair[np.argwhere(cur_val == 0)[0, 0]]
    else:
        negative_0_bool = int(cur_val[0] < 0)
        new_x = np.mean(cur_pair)
        new_val = f(new_x)
        i = 0
        while np.abs(new_val) >= tol:
            i += 1
            if i == 90:
                break
            if new_val < 0:
                cur_pair[1 - negative_0_bool] = new_x
            else:
                cur_pair[negative_0_bool] = new_x
            new_x = np.mean(cur_pair)
            new_val = f(new_x)
        return new_x


def cast_to_dtype(x, target_type):
    '''
    Helper function to cast objects to a target data type.

    Params:
        x:            value to convert.  Generally a single scalar, or an iterable
        target_type:  target data type.  `float` or `int` are probably the easiest use cases.

    Examples:
        ```
        # y_var can either be a single scalar or a np.array of values
        y_var = 5
        y_var = np.array([10, 20, 17])

        floaty_y_var = cast_to_dtype(y_var, float)
        # returns either 5.0 or np.array([10. , 20. , 17.])
        ```
    '''
    if np.ndim(x):
        return np.asarray(x).astype(target_type)
    else:
        return target_type(x)


def pred_exp(t, t0, q0, D_exp):
    return q0 * np.exp(-D_exp * (t - t0))


def pred_arps(t, t0, q0, D, b):
    return q0 * np.power(1 + b * D * (t - t0), -1 / b)


def pred_arps_modified(t, t0, t_sw, q0, q_sw, D, b, D_exp):
    '''
    Predict the values of the modified arps curve as specified by the parameters.

    Params:
        t (number or np.array): values to predict on
        t0: start index of m.arps curve
        t_sw: switch index of m.arps curve
        q0: initial rate of m.arps curve
        q_sw: rate of curve at index t_sw
        D: `D` param of curve
        b: `b` param of curve
        D_exp: exponential decline of curve

    Returns:
        Predicted rates (same shape as `t`)
    '''
    if np.isscalar(t):
        if t >= t_sw:
            return pred_exp(t, t_sw, q_sw, D_exp)
        else:
            return pred_arps(t, t0, q0, D, b)
    else:
        ret_array = np.zeros(t.shape)
        range_arps = (t < t_sw)
        range_exp = (t >= t_sw)

        ret_array[range_arps] = pred_arps(t[range_arps], t0, q0, D, b)
        ret_array[range_exp] = pred_exp(t[range_exp], t_sw, q_sw, D_exp)
        return ret_array


def pred_linear(t, q0, t0, k):
    return k * (t - t0) + q0


def slope_exp(t, t0, q0, D_exp):
    return -D_exp * q0 * np.exp(-D_exp * (t - t0))


def slope_arps(t, t0, q0, D, b):
    return -q0 * D * np.power(1 + b * D * (t - t0), -(1 / b + 1))


def integral_exp(left_idx, right_idx, t0, q0, D_exp):
    if D_exp == 0:
        ret = q0 * (right_idx - left_idx)
    else:
        ret = -q0 / D_exp * (np.exp(-D_exp * (right_idx - t0)) - np.exp(-D_exp * (left_idx - t0)))

    return ret


def integral_arps(left_idx, right_idx, t0, q0, D, b):
    if b != 1:
        q_left = pred_arps(left_idx, t0, q0, D, b)
        q_right = pred_arps(right_idx, t0, q0, D, b)
        ret = np.power(cast_to_dtype(q0, float), b) / (1 - b) / D * (np.power(cast_to_dtype(q_left, float), 1 - b)
                                                                     - np.power(cast_to_dtype(q_right, float), 1 - b))
    else:
        ret = q0 / D * (np.log(1 + D * (right_idx - t0)) - np.log(1 + D * (left_idx - t0)))
    return ret


def inverse_integral_exp(integral, left_idx, t0, q0, D_exp):
    if D_exp == 0:
        ret = integral / q0 + left_idx
    else:
        ret = -np.log(np.exp(-D_exp * (left_idx - t0)) - integral * D_exp / q0) / D_exp + t0
    return ret


def inverse_integral_arps(integral, left_idx, t0, q0, D, b):
    if b != 1:
        q_left = pred_arps(left_idx, t0, q0, D, b)
        A = np.power(q_left, 1 - b) - integral * (1 - b) * D / np.power(q0, b)
        q_rights = np.power(A, 1 / (1 - b))
        ret = (np.power(q0 / q_rights, b) - 1) / b / D + t0
    else:
        A = (integral * D / q0) + np.log(1 + D * (left_idx - t0))
        ret = (np.exp(A) - 1) / D + t0
    return ret


def arps_D_eff_2_D(D_eff, b):
    D = (np.power(1 - D_eff, -b) - 1) / DAYS_IN_YEAR / b
    return D


def arps_D_2_D_eff(D, b):
    D_eff = 1 - np.power(1 + D * DAYS_IN_YEAR * b, -1 / b)
    return D_eff


def exp_D_eff_2_D(D_eff):
    D = -np.log(1 - D_eff) / DAYS_IN_YEAR
    return D


def exp_D_2_D_eff(D):
    D_eff = 1 - np.exp(-DAYS_IN_YEAR * D)
    return D_eff


def linear_D_eff_2_k(D_eff, q_start):
    return (-D_eff * q_start) / DAYS_IN_YEAR


def linear_k_2_D_eff(k, q_start):
    return -k * DAYS_IN_YEAR / q_start


def arps_get_D_delta(D, b, delta_t):
    return D / (1 + b * D * delta_t)


def arps_get_idx_from_D_new(start_idx, D, D_new, b):
    return (D / D_new - 1) / (b * D) + start_idx


def arps_get_t_end_from_q_end(start_idx, q_start, D, b, q_end):
    return start_idx + (np.power(q_start / q_end, b) - 1) / b / D


def linear_get_t_end_from_q_end(start_idx, q_start, k, q_end):
    return start_idx + (q_end - q_start) / k


def arps_modified_get_t_end_from_q_end(start_idx, q_start, D, b, sw_idx, D_exp, q_end):
    q_sw = pred_arps(sw_idx, start_idx, q_start, D, b)
    if q_end >= q_sw:
        return np.floor(arps_get_t_end_from_q_end(start_idx, q_start, D, b, q_end))
    else:
        return np.floor(exp_get_t_end_from_q_end(sw_idx, q_sw, D_exp, q_end))


def exp_get_t_end_from_q_end(start_idx, q_start, D, q_end):
    return start_idx + np.log(q_start / q_end) / D


def arps_get_D(start_idx, q_start, end_idx, q_end, b):
    return (np.power(q_start / q_end, b) - 1) / b / (end_idx - start_idx)


def exp_get_D(start_idx, q_start, end_idx, q_end):
    denominator = 0.001 if end_idx == start_idx else (end_idx - start_idx)
    q_start = 0.0001 if q_start == 0 else q_start

    return -np.log(q_end / q_start) / denominator


def linear_get_k(start_idx, q_start, end_idx, q_end):
    return (q_end - q_start) / (end_idx - start_idx)


def arps_modified_get_D(q_start, q_end, b, start_idx, end_idx, target_D_eff_sw):
    delta_t = end_idx - start_idx
    target_D_sw = exp_D_eff_2_D(target_D_eff_sw)

    pure_arps_D = arps_get_D(start_idx, q_start, end_idx, q_end, b)
    pure_arps_D_end = arps_get_D_delta(pure_arps_D, b, delta_t)

    if (pure_arps_D_end >= target_D_sw):
        return pure_arps_D

    pure_exp_D = exp_get_D(start_idx, q_start, end_idx, q_end)

    if (pure_exp_D < target_D_sw):
        raise Exception('Can not reach target D switch')
    else:
        right_boundary = min(1 / b / target_D_sw - 0.0001, end_idx - start_idx)

        def D_t1(t1):
            return arps_get_D_delta(target_D_sw, b, -t1)

        def f_t1(t1):
            return np.log(q_start / q_end) - np.log(1 + b * D_t1(t1) * t1) / b - target_D_sw * (delta_t - t1)

        t1 = my_bisect(f_t1, 0, right_boundary)
        return D_t1(t1)


def arps_modified_switch(start_idx, b, D, target_D_eff_sw):
    if (target_D_eff_sw == 0):
        return {
            'realized_D_eff_sw': 0,
            'sw_idx': start_idx + 300000,
            'D_exp': 0,
            'D_exp_eff': 0,
        }
    target_D_sw = exp_D_eff_2_D(target_D_eff_sw)
    if (target_D_sw >= D):
        return {
            'realized_D_eff_sw': exp_D_2_D_eff(D),
            'sw_idx': start_idx,
            'D_exp': D,
            'D_exp_eff': exp_D_2_D_eff(D),
        }

    return {
        'realized_D_eff_sw': target_D_eff_sw,
        'sw_idx': arps_get_idx_from_D_new(start_idx, D, target_D_sw, b),
        'D_exp': target_D_sw,
        'D_exp_eff': target_D_eff_sw,
    }


def arps_sw(q_start, b, D, D_lim_eff, start_idx, end_data_idx, t_end_life, enforce_sw):  ### sw_idx is integer alwasy
    D_lim = exp_D_eff_2_D(D_lim_eff)
    if D_lim_eff == 0 or D_lim == 0:
        sw_idx = t_end_life + 300000
        D_exp = 0
        D_exp_eff = 0
        D_sw = 0
    else:
        if enforce_sw:
            idx_last = start_idx
        else:
            idx_last = np.max([end_data_idx, start_idx])
        D_last = arps_get_D_delta(D, b, idx_last - start_idx)

        if D_last > D_lim:
            sw_idx = arps_get_idx_from_D_new(start_idx, D, D_lim, b)
        else:
            sw_idx = idx_last

        D_sw = arps_get_D_delta(D, b, sw_idx - start_idx)
        D_exp = D_sw
        D_exp_eff = exp_D_2_D_eff(D_exp)

    realized_D_eff_sw = D_exp_eff

    return sw_idx, realized_D_eff_sw, D_exp, D_exp_eff


def sum_forecast_by_month(volume, daily_index):
    forecast_month_start = (BASE_DATE_NP + daily_index[0]).astype('datetime64[M]')
    forecast_month_end = (BASE_DATE_NP + daily_index[-1]).astype('datetime64[M]')
    unique_forecast_month = np.arange(forecast_month_start, forecast_month_end + 1)

    month_start = (unique_forecast_month.astype('datetime64[D]') - BASE_DATE_NP).astype(int)
    month_end = ((unique_forecast_month + 1).astype('datetime64[D]') - BASE_DATE_NP).astype(int) - 1

    month_start[0] = daily_index[0]
    month_end[-1] = daily_index[-1]

    month_end = month_end - month_start[0]
    month_start = month_start - month_start[0]

    cum_sum = np.cumsum(volume)
    cum_sum = np.concatenate([[0], cum_sum])

    grouped_volume = cum_sum[month_end + 1] - cum_sum[month_start]

    return grouped_volume, unique_forecast_month


def sum_forecast_by_month_relative(volumes: np.array, daily_index: np.array, monthly_index: np.array) -> np.array:
    '''
    Given forecast volumes and daily index, returns the sum of volumes by month.

    Args:
        volumes (np.array): array of daily volumes
        daily_index (np.array): array of daily index
        monthly_index (np.array): array of monthly index

    Returns:
        np.array: array of monthly volumes
    '''
    monthly_bins = np.digitize(daily_index, monthly_index)
    grouped_volumes = np.histogram(monthly_bins, weights=volumes, bins=len(monthly_index))[0]
    return grouped_volumes


def calculate_true_monthly_cum(transformed_data: np.array) -> np.array:
    '''
    Given transformed data, returns the true monthly cumulative volumes.

    Args:
        transformed_data (np.array): 2d array of transformed data

    Returns:
        np.array: array of true monthly cumulative volumes
    '''
    first_t = transformed_data[0, 0]
    last_t = transformed_data[-1, 0]

    volume_durations = np.diff(transformed_data[:, 0]).astype(int)

    daily_volumes = np.repeat(transformed_data[:-1, 1], volume_durations)
    # Concatenate the final value for usage with summing function
    daily_volumes = np.concatenate((daily_volumes, [transformed_data[-1, 1]]))

    daily_timesteps = np.arange(first_t, last_t + 1)

    cum_true = sum_forecast_by_month_relative(daily_volumes, daily_timesteps, transformed_data[:, 0])
    return cum_true


def linear_get_q(k, D_eff):
    return -(DAYS_IN_YEAR * k) / D_eff


def convert_monthly_to_daily(idx: np.ndarray, volumes: np.ndarray):
    '''Given monthly forecast volumes, converts to daily by dividing by
    correct number of days in month.
    '''
    vol = np.array(volumes, dtype=float)
    i = np.array(idx)
    return vol / idx_to_days_in_month(i).astype(float)
