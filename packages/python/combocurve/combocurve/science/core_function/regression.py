import numpy as np


class Loess(object):
    ### A class implementing the loess "local regression" smoother

    @staticmethod
    def normalize_array(array):
        if array.shape[0] == 0:
            return array, None, None
        min_val = np.min(array)
        max_val = np.max(array)
        if min_val == max_val:
            return np.ones_like(array) * 0.5, 0.5, 0.5
        else:
            return (array - min_val) / (max_val - min_val), min_val, max_val

    def __init__(self, xx, yy, degree=1):
        self.n_xx, self.min_xx, self.max_xx = self.normalize_array(xx)
        if self.min_xx == self.max_xx:
            raise DataError
        self.n_yy, self.min_yy, self.max_yy = self.normalize_array(yy)
        self.degree = degree

    @staticmethod
    def tricubic(x):
        return np.power(1.0 - np.power(np.abs(x), 3), 3)

    @staticmethod
    def get_min_range(distances, window):
        min_idx = np.argmin(distances)
        n = len(distances)
        if min_idx == 0:
            return np.arange(0, window)
        if min_idx == n - 1:
            return np.arange(n - window, n)

        min_range = [min_idx]
        while len(min_range) < window:
            i0 = min_range[0]
            i1 = min_range[-1]
            if i0 == 0:
                min_range.append(i1 + 1)
            elif i1 == n - 1:
                min_range.insert(0, i0 - 1)
            elif distances[i0 - 1] < distances[i1 + 1]:
                min_range.insert(0, i0 - 1)
            else:
                min_range.append(i1 + 1)
        return np.array(min_range)

    def get_weights(self, distances, min_range):
        max_distance = np.max(distances[min_range])
        weights = self.tricubic(distances[min_range] / max_distance)
        return weights

    def normalize_x(self, value):
        if self.max_xx == self.min_xx:
            return np.ones_like(value) * 0.5
        else:
            return (value - self.min_xx) / (self.max_xx - self.min_xx)

    def denormalize_y(self, value):
        return value * (self.max_yy - self.min_yy) + self.min_yy

    def estimate(self, x, window, use_matrix=False, degree=1):
        # Slower implementation, included for readability

        n_x = self.normalize_x(x)
        distances = np.abs(self.n_xx - n_x)
        min_range = self.get_min_range(distances, window)
        weights = self.get_weights(distances, min_range)

        if use_matrix or degree > 1:
            wm = np.multiply(np.eye(window), weights)
            xm = np.ones((window, degree + 1))

            xp = np.array([[np.power(n_x, p)] for p in range(degree + 1)])
            for i in range(1, degree + 1):
                xm[:, i] = np.power(self.n_xx[min_range], i)

            ym = self.n_yy[min_range]
            xmt_wm = np.transpose(xm) @ wm
            beta = np.linalg.pinv(xmt_wm @ xm) @ xmt_wm @ ym
            y = (beta @ xp)[0]
        else:
            xx = self.n_xx[min_range]
            yy = self.n_yy[min_range]
            sum_weight = np.sum(weights)
            sum_weight_x = np.dot(xx, weights)
            sum_weight_y = np.dot(yy, weights)
            sum_weight_x2 = np.dot(np.multiply(xx, xx), weights)
            sum_weight_xy = np.dot(np.multiply(xx, yy), weights)

            mean_x = sum_weight_x / sum_weight
            mean_y = sum_weight_y / sum_weight

            b = (sum_weight_xy - mean_x * mean_y * sum_weight) / \
                (sum_weight_x2 - mean_x * mean_x * sum_weight)
            a = mean_y - b * mean_x
            y = a + b * n_x
        return self.denormalize_y(y)

    def find_nearest(self, check_arr):
        m = len(self.n_xx)
        n = len(check_arr)

        i = j = 0
        ret = []
        while i < m - 1:
            if abs(self.n_xx[i] - check_arr[j]) > abs(self.n_xx[i + 1] - check_arr[j]):
                i += 1
            else:
                break

        cur_dif = abs(self.n_xx[i] - check_arr[j])
        ret = []
        while i < m - 1:
            next_dif = np.abs(self.n_xx[i + 1] - check_arr[j])
            if next_dif < cur_dif:
                cur_dif = next_dif
                i += 1
            else:
                ret += [i]
                j += 1
                if j < n:
                    cur_dif = np.abs(self.n_xx[i] - check_arr[j])
                else:
                    break

        while len(ret) < n:
            ret += [m - 1 for _ in range(n - len(ret))]

        return np.array(ret)

    def estimate_arr(self, x_arr, window, degree=1):
        # Faster implementation that smooths all values in an array

        n_x_arr = self.normalize_x(x_arr)
        n_outputs = x_arr.shape[0]
        m = len(self.n_xx)

        if 2 * window >= m:
            closest_indexes = np.tile(np.arange(m), (n_outputs, 1))
        else:
            closest_index = self.find_nearest(n_x_arr)
            lower_bound = closest_index - window
            upper_bound = closest_index + window

            upper_bound[lower_bound < 0] -= lower_bound[lower_bound < 0]
            lower_bound[lower_bound < 0] = 0
            lower_bound[upper_bound >= m] -= (upper_bound[upper_bound >= m] - (m - 1))
            closest_indexes = np.tile(np.arange(2 * window + 1), (n_outputs, 1)) + lower_bound.reshape(-1, 1)

        closest_n_xx = self.n_xx[closest_indexes]
        closest_distances_arr = np.abs(closest_n_xx - n_x_arr.reshape(-1, 1))
        closest_sort_idx = np.argsort(closest_distances_arr, axis=1)

        sub_nearest_indexes = closest_sort_idx[:, :window]
        rows = np.ones_like(sub_nearest_indexes) * np.arange(closest_indexes.shape[0]).reshape(-1, 1)
        min_range_arr = closest_indexes[rows, sub_nearest_indexes]
        min_range_distances_arr = closest_distances_arr[rows, sub_nearest_indexes]

        W_2d = self.tricubic(min_range_distances_arr / np.max(min_range_distances_arr, axis=1).reshape(-1, 1))
        # Prevent singular matrices
        low_data_mask = ((W_2d > 0).sum(axis=1)) < 2
        W_2d[low_data_mask] += 1e-10
        W = np.reshape(W_2d, [W_2d.shape[0], 1, W_2d.shape[-1]])

        x = self.n_xx[min_range_arr]
        y = self.n_yy[min_range_arr].reshape(n_outputs, -1, 1)
        x_pred = n_x_arr.reshape(n_outputs, 1)

        X = np.stack([np.ones_like(x)] + [x**i for i in range(1, degree + 1)], axis=2)
        X_pred = np.stack([np.ones_like(x_pred)] + [x_pred**i for i in range(1, degree + 1)], axis=2)
        X_T = X.transpose([0, 2, 1]) * W

        beta = np.linalg.solve(X_T @ X, X_T @ y)

        return self.denormalize_y((X_pred @ beta).reshape(-1))


class Error(Exception):
    # Base class for errors in this module
    pass


class DataError(Error):
    # Exception raised when there are not multiple x-values
    def __init__(self):
        self.message = 'Need at least 2 distinct x-values to generate regression.'
