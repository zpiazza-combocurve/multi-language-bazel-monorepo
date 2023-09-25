from copy import deepcopy
from combocurve.shared.constants import BASE_TIME_NPDATETIME64, DAYS_IN_MONTH
from combocurve.science.core_function.regression import Loess
import numpy as np


class transformation:
    def __init__(self):
        self.filter = filters()
        self.modifier = modifiers()
        self.op_func = {
            'remove_exception': self.filter,
            'density_outlier': self.filter,
            'moving_outlier': self.filter,
            'normalize': self.modifier,
            'group': self.modifier,
            'add': self.modifier,
            'log': self.modifier
        }

    def apply(self, data, ops, para_dict_s):
        last_data = deepcopy(data)
        for idx, op in enumerate(ops):
            this_dict = para_dict_s[idx]
            last_data = self.op_func[op].apply(last_data, op, this_dict)

        return last_data


class filters:
    def __init__(self):
        self.ops = {
            'remove_exception': self.remove_exception,
            'density_outlier': self.density_outlier,
            'moving_outlier': self.moving_outlier,
            'smoothed_outlier': self.smoothed_outlier
        }

    def apply(self, data, op, para_dict, return_idx=False):
        ret_idx = self.ops[op](data, **para_dict)
        if return_idx:
            return ret_idx
        elif len(ret_idx) == 0:
            return np.zeros((0, data.shape[1]))
        else:
            return data[ret_idx, :]

    def remove_exception(self, data, exceptions):
        ### default parameters:
        ##################################### daily
        ### @ exceptions = [0]
        ##################################### monthly
        ### @ exceptions = [0]
        check_mat = np.zeros((data.shape[0], len(exceptions)), dtype=bool)
        for i, ecpt in enumerate(exceptions):
            check_mat[:, i] = (data[:, 1] != ecpt)

        check_arr = np.all(check_mat, axis=1)
        return check_arr

    def density_outlier(self, data, dens_dist, dens_ratio, max_remove_ratio=0.2):
        ## normalize happens inside
        ## default_hyperparameter:
        # #####################################3daily
        # @dens_dist = 0.02
        # @dens_ratio = 0.1
        # ###################################### monthly
        # not determined
        mod = modifiers()
        normalize_data = mod.normalize(data, cols=[0, 1], normalize_range=[0, 1])

        n = data.shape[0]

        if n < 10:
            return np.ones(n, dtype=bool)
        else:
            valid_len = int(n * dens_dist)
            if valid_len < 10:
                valid_len = n
            density_count = np.zeros(n)
            num_point_in_dens_dist = 2 * valid_len
            multiplier = np.ones(n)
            for i in range(n):
                this_cor = normalize_data[i, :]
                left_range = max([0, i - valid_len])
                right_range = min([n, i + valid_len])
                this_compare = normalize_data[left_range:right_range]
                density_count[i] = (np.sqrt(np.square(this_compare - this_cor).sum(axis=1)) < dens_dist).sum() - 1
                multiplier[i] = this_compare.shape[0] / num_point_in_dens_dist
            if np.sum(density_count) == 0:
                return np.ones(n, dtype=bool)
            else:
                normalize_density = density_count / np.max(density_count)
                normalize_density = normalize_density / multiplier

                ret_arr = normalize_density > dens_ratio

                if (~ret_arr).mean() > max_remove_ratio:
                    keep_ind = np.argsort(normalize_density)[int(max_remove_ratio * n):][::-1]
                    ret_arr = np.zeros(n, dtype=bool)
                    ret_arr[keep_ind] = True

            return ret_arr

    def moving_outlier(self, data, dens_dist):
        # normalize happens inside
        # default_hyperparameter:
        # ###################################### daily
        # @dens_dist = 0.14
        # ###################################### monthly
        # not determined
        mod = modifiers()
        normalize_data = mod.normalize(data, cols=[0, 1], normalize_range=[0, 1])

        para_thres = -1 * dens_dist
        n = normalize_data.shape[0]
        rate = normalize_data[:, 1]

        if n < 5:
            return np.array([True for i in range(n)])
        else:
            ret = [True]
            for i in range(1, n - 1):
                if i == 1:
                    d1 = rate[i] - rate[i - 1]
                    d2 = rate[i] - rate[i + 1]
                    d3 = rate[i] - rate[i + 2]
                    diff = np.array([d1, d2, d3])
                    cond = sum(diff < para_thres)
                    ret.append(False) if cond == 3 else ret.append(True)
                elif i == (n - 2):
                    d1 = rate[i] - rate[i - 2]
                    d2 = rate[i] - rate[i - 1]
                    d3 = rate[i] - rate[i + 1]
                    diff = np.array([d1, d2, d3])
                    cond = sum(diff < para_thres)
                    ret.append(False) if cond == 3 else ret.append(True)
                else:
                    d1 = rate[i] - rate[i - 2]
                    d2 = rate[i] - rate[i - 1]
                    d3 = rate[i] - rate[i + 1]
                    d4 = rate[i] - rate[i + 2]
                    diff = np.array([d1, d2, d3, d4])
                    cond = sum(diff < para_thres)
                    ret.append(False) if cond >= 3 else ret.append(True)

            ret.append(True)
            ret_arr = np.array(ret)

        return ret_arr

    def smoothed_outlier(self, data, window, thresholds, is_daily=False):
        ## normalize happens inside
        ## default_hyperparameter:
        # ###################################### daily
        # @window = 100
        # @thresholds = [[99, 80, 0.01], [95, 80, 0.006]]
        # ###################################### monthly
        # @window = 10
        # @thresholds = [[99, 80, 0.01], [95, 80, 0.006]]
        mod = modifiers()

        # Remove zeros and convert to log scale
        zero_mask = data[:, 1] < 0.01
        non_zero_data = data[~zero_mask, :].astype(np.float64)
        non_zero_data[:, 1] = np.log(non_zero_data[:, 1])
        n = non_zero_data.shape[0]

        # Don't filter on relatively short time series
        if n < 2 * window:
            return np.ones(data.shape[0], dtype='bool')

        # Don't filter on rampup period
        starting_index = 0
        while (non_zero_data[starting_index, 1] < non_zero_data[starting_index + 1, 1]):
            if (starting_index + 1) > n / 10:
                break
            starting_index += 1

        scaled_log = mod.normalize(non_zero_data[starting_index:, :], cols=[0, 1], normalize_range=[0, 1])[:, 0:2]

        ret_arr = np.ones(n - starting_index, dtype='bool')

        for threshold in thresholds:
            if is_daily:
                smoothed_log = self.daily_smooth_data(scaled_log[:, 0], scaled_log[ret_arr], window)
            else:
                smoothed_log = self.smooth_data(scaled_log[:, 0], scaled_log[ret_arr], window)

            errors = np.power(np.exp(scaled_log[:, 1] - smoothed_log[:, 1]) - 1, 2)

            ret_arr = (ret_arr & ((errors <= np.percentile(errors, threshold[0]))
                                  | (errors - np.percentile(errors, threshold[1]) <= threshold[2])))

        ret_arr = np.concatenate((np.ones(starting_index, dtype='bool'), ret_arr))
        zero_mask[~zero_mask] = ret_arr
        return zero_mask

    def smooth_data(self, x_array, data, window):
        # A helper function for smoothed_outlier
        x = data[:, 0]
        y = data[:, 1]
        smoother = Loess(x, y)
        win = min(window, len(data[:, 0]))
        tail = int(np.ceil(len(x_array) * 0.9))
        smoothed_start = smoother.estimate_arr(x_array[:tail], win, degree=1)
        smoothed_tail = smoother.estimate_arr(x_array[tail:], win, degree=2)
        smoothed_y = np.concatenate((smoothed_start, smoothed_tail))

        return np.transpose([np.array(x_array), np.array(smoothed_y)])

    def daily_smooth_data(self, x_array, data, window):
        # A helper function for smoothed_outlier
        smoother = Loess(data[:, 0], data[:, 1])
        win = min(window, data.shape[0])

        x_head = np.reshape(x_array[:-(x_array.shape[0] % 10 + 20)], (-1, 10))
        x_tail = x_array[-(x_array.shape[0] % 10 + 20):]

        smoothed_sample = smoother.estimate_arr(x_head[:, 0], win, degree=1)
        smoothed_tail = smoother.estimate_arr(x_tail, win, degree=2)

        if smoothed_sample.shape[0] > 1:
            slopes = (smoothed_sample[1:] - smoothed_sample[:-1]) / (x_head[1:, 0] - x_head[:-1, 0])
            slopes = np.concatenate((slopes, np.array([smoothed_tail[0] - smoothed_sample[-1]])))
        else:
            slopes = np.array([smoothed_tail[0] - smoothed_sample[-1]])

        slopes = np.reshape(slopes, (-1, 1))
        smoothed_sample = np.reshape(smoothed_sample, (-1, 1))
        smoothed_head = smoothed_sample + slopes * (x_head - x_head[:, 0:1])
        smoothed_y = np.concatenate((smoothed_head.flatten(), smoothed_tail))

        return np.transpose([np.array(x_array), smoothed_y])


class modifiers:
    def __init__(self):
        self.ops = {
            'normalize': self.normalize,
            'group': self.group,
            'add': self.add,
            'log': self.log,
            'moving_average': self.moving_average
        }

    def apply(self, data, op, para_dict):
        ## will always return data
        return self.ops[op](data, **para_dict)

    def add(self, data, num):
        ret_data = deepcopy(data)
        ret_data[:, 1] = ret_data[:, 1] + num
        return ret_data

    def log(self, data):
        ret_data = deepcopy(data)
        ret_data[:, 1] = np.log(ret_data[:, 1])
        return ret_data

    def normalize(self, data, normalize_range, cols):
        ## default_parameter
        ########################################## daily
        # @normalize_range = [0,1]
        # @cols = [0,1], col0 and col1
        ########################################## monthly
        # @normalize_range = [0,1]
        # @cols = [0,1], col0 and col1
        a, b = normalize_range
        ret_data = deepcopy(data)
        if ret_data.shape[0] == 0:
            return ret_data
        for i in cols:
            this_col = data[:, i]
            if len(set(this_col)) == 1:
                ret_data[:, i] = np.ones(ret_data.shape[0]) * 0.5
            else:
                ret_data[:, i] = (this_col - np.min(this_col)) / (np.max(this_col) - np.min(this_col)) * (b - a) + a

        return ret_data

    def group(self, data, groupdays):
        ## default parameters
        ########################################### daily
        # @groupdays = 7
        ########################################### monthly
        # @groupdays = 1 ## not recommended, should remove group function for monthly data
        ret_data = np.zeros((0, data.shape[1]))
        if data.shape[0] == 0:
            return ret_data
        else:
            date_dif = data[-1, 0] - data[0, 0] + 1
            max_ite = int(np.ceil(date_dif / groupdays))
            for i in range(max_ite):
                this_t_range = [data[0, 0] + groupdays * i, data[0, 0] + groupdays * (i + 1)]
                this_range = (data[:, 0] >= this_t_range[0]) & (data[:, 0] < this_t_range[1])
                this_group_data = data[this_range, :]
                if this_group_data.shape[0] == 0:
                    continue
                else:
                    this_row = np.mean(this_group_data, axis=0).reshape(1, -1)
                    ret_data = np.concatenate([ret_data, this_row], axis=0)
            return ret_data

    def moving_average(self, data: np.ndarray, n_days: int, data_freq: str) -> np.ndarray:
        # data.shape == (n, 2)
        # Returns another np.ndarray of shape == (n,2), where each value
        # is replaced by the average of the previous n_days number of days of data
        if data.shape[0] < 2:
            return data

        indices = data[:, 0].astype(int)
        n_days = int(n_days)
        if data_freq == 'monthly':
            # Convert indices and n_days to monthly.
            indices = (indices.astype('timedelta64[D]') + BASE_TIME_NPDATETIME64).astype('datetime64[M]').astype(int)
            n_days = round(n_days / DAYS_IN_MONTH)
        # Possible there's nothing to convolve w/ for monthly, even with n_days > 0
        if n_days < 1:
            return data
        filled_indices = np.arange(indices[0], indices[-1] + 1)
        vals_mask = indices - indices[0]
        # Zero fill missing productions.
        filled_vals = np.zeros_like(filled_indices, dtype=float)
        filled_vals[vals_mask] = data[:, 1]

        if len(filled_vals) >= n_days:
            kernel = np.ones(n_days, dtype=float) / n_days
            late_values = np.convolve(filled_vals, kernel, mode='valid')
        else:
            late_values = []

        # Fix early values.
        first_values = []
        running_sum = float(0)
        for i in range(min(n_days - 1, len(filled_vals))):
            running_sum += filled_vals[i]
            first_values.append(running_sum / (i + 1))
        smoothed_vals = np.concatenate([first_values, late_values])
        smoothed_data = np.stack([data[:, 0], smoothed_vals[vals_mask]], axis=1)
        return smoothed_data
