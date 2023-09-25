import numpy as np
from combocurve.science.core_function.setting_parameters import error_power
from typing import Optional, Union

LOG2PI = np.log(2 * np.pi)


###################################################################### error functions
def mse(y_true, y_pred, weight=None):
    if weight is None:
        return np.mean(np.square(y_true - y_pred))
    else:
        return np.mean(np.square(y_true - y_pred) * weight)


def normal_ll(y: Union[np.ndarray, float, int], mu: float, sigma: float) -> float:
    '''The log likelihood function for a sequence of IID normal random variables.'''
    if isinstance(y, np.ndarray):
        n = y.shape[0]
    else:
        n = 1
    return 0.5 * (n * LOG2PI + np.sum(np.power((y - mu) / sigma, 2))) + n * np.log(sigma)


def mean_residual_normal_ll(y_true: np.ndarray, y_pred: np.ndarray, weight: float = None) -> float:
    '''The loss function for the Fulford method.'''
    # We're essentially assuming the residual's true distribution is IID normal w/ mean = 0 and sigma = 0.05.
    sigma = 0.05
    if weight is not None:
        resid = (np.log(y_true) - np.log(y_pred)) * weight
    else:
        resid = np.log(y_true) - np.log(y_pred)
    # I think we're dividing by n for numerics, so that large amounts of data doesn't cause this function to samp
    # the likelihood estimates of the priors.
    n = resid.shape[0]
    return normal_ll(resid, 0, sigma) / n


def rmse(y_true, y_pred, weight=None):
    return np.sqrt(mse(y_true, y_pred, weight))


def mae(y_true, y_pred, weight=None):
    if weight is None:
        return np.mean(np.abs(y_true - y_pred))
    else:
        return np.mean(np.abs(y_true - y_pred) * weight)


def mpe(y_true, y_pred, weight=None):
    if weight is None:
        return np.mean(np.power(np.abs(y_true - y_pred), error_power))
    else:
        return np.mean(np.power(np.abs(y_true - y_pred), error_power) * weight)


def mean_ra(y_true, y_pred, weight=None):
    ave = (y_true + y_pred) / 2
    if np.all(ave == 0):
        if np.all(np.abs(y_pred - y_true) == 0):
            return 0
        else:
            return 2
    else:
        valid_range = ave != 0
        if weight is None:
            return np.mean((y_true[valid_range] - y_pred[valid_range]) / ave[valid_range])
        else:
            return np.mean((y_true[valid_range] - y_pred[valid_range]) * weight / ave[valid_range])


def median_ra(y_true, y_pred, weight=None):
    ave = (y_true + y_pred) / 2
    if np.all(ave == 0):
        if np.all(np.abs(y_pred - y_true) == 0):
            return 0
        else:
            return 2
    else:
        valid_range = ave != 0
        if weight is None:
            return np.median((y_true[valid_range] - y_pred[valid_range]) / ave[valid_range])
        else:
            return np.median((y_true[valid_range] - y_pred[valid_range]) * weight / ave[valid_range])


def median_abs_ra(y_true, y_pred, weight=None):
    ave = (y_true + y_pred) / 2
    if np.all(ave == 0):
        if np.all(np.abs(y_pred - y_true) == 0):
            return 0
        else:
            return 2
    else:
        valid_range = ave != 0
        if weight is None:
            return np.median(np.abs(y_true[valid_range] - y_pred[valid_range]) / ave[valid_range])
        else:
            return np.median(np.abs(y_true[valid_range] - y_pred[valid_range]) * weight / ave[valid_range])


def r2(y_true, y_pred):
    if np.sum(np.square(y_true - np.mean(y_true))) == 0:
        if (y_pred == y_true).all():
            return 1
        else:
            return 0
    else:
        ret = 1 - np.sum(np.square(y_true - y_pred)) / np.sum(np.square(y_true - np.mean(y_true)))
        if ret < 0:
            ret = 0
        return ret


def cum_diff(y_true, y_pred):
    return np.nansum(y_true - y_pred)


def cum_diff_percentage(y_true, y_pred):
    true_cum = np.nansum(y_true)
    pred_cum = np.nansum(y_pred)
    return (true_cum - pred_cum) / true_cum


def avg_diff(y_true, y_pred):
    return np.average(y_true - y_pred)


def log_mpe_add_eps(y_true, y_pred, weight=None):
    eps = 0.1
    max_val = min(np.max(y_true), np.max(y_pred))
    if max_val < 1000 * eps:
        eps = max_val / 1000

    log_y_true = np.log(y_true + eps)
    log_y_pred = np.log(y_pred + eps)
    return mpe(log_y_true, log_y_pred, weight)


def cum_log_mpe_add_eps(y_true: np.ndarray, y_pred: np.ndarray, weight: Optional[np.ndarray] = None) -> np.float64:
    """
    Calculate the error between true and predicted values using the cums.
        1. Take cumsum of `y_true` and `y_pred`.
        2. Take log of cumsums.
        3. Calculate MPE of logs.

    Args:
        y_true (np.ndarray): the true data values to regress onto
        y_pred (np.ndarray): the predicted values from the regression
        weight (Optional[np.ndarray]): weights for calculating error.

    Returns:
        np.float64: the error for use in regression.
    """
    true_cumsum = np.nancumsum(y_true)
    pred_cumsum = np.nancumsum(y_pred)

    eps = 0.1
    max_val = np.max(y_true)
    if max_val < 1000 * eps:
        eps = max_val / 1000

    log_y_true = np.log(true_cumsum + eps)
    log_y_pred = np.log(pred_cumsum + eps)
    return mpe(log_y_true, log_y_pred, weight)


def cum_mpe(y_true: np.ndarray, y_pred: np.ndarray, weight: Optional[np.ndarray] = None) -> np.float64:
    """
    Calculate the error between true and predicted values using the cums.
        1. Take cumsum of `y_true` and `y_pred`.
        3. Calculate MPE of cumsums.

    Args:
        y_true (np.ndarray): the true data values to regress onto
        y_pred (np.ndarray): the predicted values from the regression
        weight (Optional[np.ndarray]): weights for calculating error.

    Returns:
        np.float64: the error for use in regression.
    """
    true_cumsum = np.nancumsum(y_true)
    pred_cumsum = np.nancumsum(y_pred)

    return mpe(true_cumsum, pred_cumsum, weight)


def cum_pe(y_true, y_pred, weight=None):
    if weight is None:
        return np.nancumsum(np.power(np.abs(y_true - y_pred), error_power))
    else:
        return np.nancumsum(np.power(np.abs(y_true - y_pred), error_power) * weight)


def mean_cum_pe(y_true, y_pred, weight=None):
    return np.mean(cum_pe(y_true, y_pred, weight))


def log_mpe(y_true, y_pred, weight=None):
    log_y_true = np.log(y_true)
    log_y_pred = np.log(y_pred)
    return mpe(log_y_true, log_y_pred, weight)


def none(y_true, y_pred, weight=None):
    return 1


errorfunc_s = {
    'mse': mse,
    'rmse': rmse,
    'mae': mae,
    'mpe': mpe,
    'mean_ra': mean_ra,
    'median_ra': median_ra,
    'median_abs_ra': median_abs_ra,
    'r2': r2,
    'cum_diff': cum_diff,
    'cum_diff_percentage': cum_diff_percentage,
    'avg_diff': avg_diff,
    'log_mpe_add_eps': log_mpe_add_eps,
    'log_mpe': log_mpe,
    'none': none,
    'mean_residual_normal_ll': mean_residual_normal_ll,
    'cum_log_mpe_add_eps': cum_log_mpe_add_eps,
    'cum_mpe': cum_mpe,
    'cum_pe': cum_pe,
    'mean_cum_pe': mean_cum_pe,
}


def mat_mse(y_true, y_pred, axis):
    return np.mean(np.square(y_true - y_pred), axis=axis)


def mat_rmse(y_true, y_pred, axis):
    return np.sqrt(np.mean(np.square(y_true - y_pred), axis=axis))


def mat_mae(y_true, y_pred, axis):
    return np.mean(np.abs(y_true - y_pred), axis=axis)


def mat_mpe(y_true, y_pred, axis):
    return np.mean(np.power(np.abs(y_true - y_pred), error_power), axis=axis)


def mat_ra(y_true, y_pred, axis):
    ave = (y_true + y_pred) / 2
    return np.mean(np.abs(y_true - y_pred) / ave, axis=axis)


def mat_r2(y_true, y_pred, axis):
    ret = np.zeros(y_true.shape[axis])

    denom_vec = np.sum(np.square(y_true - np.mean(y_true)), axis=axis)
    num_vec = np.sum(np.square(y_true - y_pred), axis=axis)
    denom_valid_range = (denom_vec == 0)
    denom_invalid_range = np.logical_not(denom_valid_range)

    num_good_range = (num_vec == 0)
    num_bad_range = np.logical(num_good_range)

    range_1 = denom_invalid_range & num_good_range
    range_2 = denom_invalid_range & num_bad_range
    range_3 = denom_valid_range
    ret[range_1] = 1
    ret[range_2] = 0
    ret[range_3] = 1 - num_vec / denom_vec
    ret[ret < 0] = 0

    return ret


def mat_log_mpe_add_eps(y_true, y_pred, axis):
    log_y_true = np.log(y_true + 0.1)
    log_y_pred = np.log(y_pred + 0.1)
    return mat_mpe(log_y_true, log_y_pred, axis)


def mat_log_mpe(y_true, y_pred, axis):
    log_y_true = np.log(y_true)
    log_y_pred = np.log(y_pred)
    return mat_mpe(log_y_true, log_y_pred, axis)


def mat_none(y_true, y_pred, axis):
    return np.ones(y_true.shape[axis])


mat_errorfunc_s = {
    'mse': mat_mse,
    'rmse': mat_rmse,
    'mae': mat_mae,
    'mpe': mat_mpe,
    'ra': mat_ra,
    'r2': mat_r2,
    'log_mpe_add_eps': mat_log_mpe_add_eps,
    'log_mpe': mat_log_mpe,
    'none': mat_none
}
