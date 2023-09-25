import numpy as np
from combocurve.science.core_function.helper import linear_fit
from combocurve.science.core_function.class_transformation import transformation
from combocurve.science.core_function.skeleton_dca import get_dca
from combocurve.science.forecast_models.model_manager import mm
from copy import deepcopy
trans = transformation()
det = get_dca()
det.set_freq('monthly')
det.set_seed(1)
det.set_errortype('mpe')


def find_end_flat(data, t_peak):
    q_peak = data[np.argwhere(data[:, 0] == t_peak)[0, 0], 1]
    if data.shape[0] <= 2:
        return t_peak
    else:
        max_len = int(data.shape[0] / 2)
        this_peak = t_peak
        for use_length in np.arange(max_len, 1, -1):
            use_data = data[:use_length, :]
            fit_x = use_data[:, 0] - t_peak
            fit_y = use_data[:, 1] - q_peak
            left_data = data[use_length:(use_length + 10), :]
            k = np.sum(fit_x * fit_y) / np.sum(fit_x * fit_x)
            pred = k * (left_data[:, 0] - t_peak) + q_peak
            lower_ratio = np.mean(left_data[:, 1] < pred)

            if lower_ratio >= 0.8 or np.all(left_data[:5, 1] < pred[:5]):
                idx = use_length - 1
                ap_data = data[idx:, :]
                this_peak = ap_data[np.argmax(ap_data[:, 1]), 0]

                break

        if this_peak == t_peak:
            return this_peak
        else:
            return find_end_flat(ap_data, this_peak)


def detect_new_trend(all_data, t_peak):
    data_on_right = all_data[all_data[:, 0] > t_peak, :]
    if data_on_right.shape[0] < 3:
        ret = t_peak
    else:
        k, b = linear_fit(data_on_right[:3, :])
        pred = t_peak * k + b
        if pred - all_data[all_data[:, 0] == t_peak, 1] < -0.07:
            ret = data_on_right[np.argmax(data_on_right[:, 1]), 0]
        else:
            ret = t_peak
    return ret


def find_inflection(data, t_peak):
    ap_data = data[data[:, 0] >= t_peak, :]
    if ap_data.shape[0] >= 5:
        this_p, this_p_fixed = det.get_params(ap_data, t_peak, 8, 'arps_wp')
        pred = mm.models['arps_wp'].predict(ap_data[:, 0], this_p, this_p_fixed)
        error = ap_data[:, 1] - pred
        ### check for criteria 1
        ### consecutive decrement has at least 4 points, and the final difference is larger than 0.1
        n_points = 1
        dif = 0
        this_val = error[-1]
        for i in range(error.shape[0] - 2, -1, -1):
            if error[i] > this_val:
                this_val = error[i]
                n_points += 1
                dif = this_val - error[-1]
            else:
                break
        criteria_1 = (n_points >= 4) and (dif > 0.1)
        ###############
        ### check for criteria 2
        ### more than 5 last points fall below the fit
        thres = 0
        last_5_errors = error[(-5):]
        if last_5_errors.shape[0] < 5:
            criteria_2 = False
        else:
            criteria_2 = np.all(last_5_errors < thres)

        #################
        ### check for criteria 3
        ### within last 5 there is only one point above the prediction,
        ### delete this point and see if last 5 points are all above the prediction
        if ap_data.shape[0] < 6:
            criteria_3 = False
        else:
            last_6th_error = error[-6]
            if (np.sum(last_5_errors < thres) == 4) and last_6th_error < thres:
                criteria_3 = True
            else:
                criteria_3 = False

    else:
        criteria_1 = False
        criteria_2 = False
        criteria_3 = False

    def search_criteria_2(ap_data, error, start_point):
        #### go from the point where is above 0, and backward until a peak in error is met
        for i in range(start_point, -1, -1):
            if error[i] > thres:
                break

        for j in range(i, -1, -1):
            if error[j] <= error[j + 1]:
                j += 1
                break
        ret = ap_data[j, 0]
        return ret

    if criteria_1:
        ### return the highest point
        ret = ap_data[-n_points, 0]
    else:
        if criteria_2:
            ret = search_criteria_2(ap_data, error, error.shape[0] - 5)
        else:
            if criteria_3:
                ret = search_criteria_2(ap_data, error, error.shape[0] - 6)
            else:
                ret = t_peak

    return ret


basic_trans_ops = ['remove_exception', 'add', 'log', 'density_outlier']

basic_trans_para_dict_s = [{'exceptions': [0]}, {'num': 0.1}, {}, {'dens_dist': 0.2, 'dens_ratio': 0.08}]


def get_local_slope_seg(slope_data, use_data, n, up_thres=1, up_valid_num=2):  # noqa: C901
    ### the result of this will be the start and end of incline parts
    ### however, for the convenience of all next operations, the
    storage = []
    for i in range(slope_data.shape[0]):
        left = np.max([0, i - n + 1])
        right = i + n
        seg_data = slope_data[left:right, :]  ## create range that is of length 2 * n
        this_store = np.zeros(n)
        for j in range(seg_data.shape[0] - n + 1):  ## calculate all n + 1 subsegments with length n
            X = np.stack([np.ones(n), seg_data[j:(j + n), 0]], axis=1)
            Y = seg_data[j:(j + n), 1].reshape(-1, 1)
            A = np.matmul(X.transpose(), X)
            B = np.matmul(X.transpose(), Y)
            beta = np.linalg.solve(A, B)
            slope = np.arctan(beta[1, 0]) / np.pi * 180
            if slope > 15:
                this_store[j] = 1
            elif slope > -15:
                this_store[j] = 0
            else:
                this_store[j] = -1

        storage += [this_store]

    status_sum = np.array(storage).sum(axis=1)
    status = status_sum >= up_thres
    valid_sep = np.zeros(status_sum.shape)
    for i in range(status_sum.shape[0]):
        left = np.max([0, i - 1])
        valid_sep[i] = np.sum(status[left:(i + 2)]) >= up_valid_num

    ## find the start and end idx of incline segments
    slope_seg_start_idx = []
    slope_seg_end_idx = []
    wait_for_break = False
    for i in range(valid_sep.shape[0] - 1, 0, -1):
        if wait_for_break and valid_sep[i]:
            continue
        elif wait_for_break and not valid_sep[i]:
            slope_seg_start_idx += [i + 1]
            wait_for_break = False


#            last_seg_idx = i + 1
        elif not wait_for_break and valid_sep[i]:
            slope_seg_end_idx += [i]
            wait_for_break = True
        else:
            continue

    ############## extend the local slope bound to the outer most place
    for i in range(len(slope_seg_start_idx)):
        this_right = slope_seg_end_idx[i]

        cur_right = this_right
        while cur_right < use_data.shape[0] - 1:
            if use_data[cur_right + 1, 1] > use_data[cur_right, 1]:
                cur_right = cur_right + 1
            else:
                break

        slope_seg_end_idx[i] = cur_right
    ########  if the current incline segment, does not satisfy certain criteria, we drop them
    if use_data.shape[0] >= 4:
        minus_len = use_data[-4, 0]
    else:
        minus_len = use_data[0, 0]

    minus = np.max([use_data[-1, 0] - minus_len, int(np.ceil((use_data[-1, 0] - use_data[0, 0]) * 0.3))])
    limit = use_data[-1, 0] - minus
    modified_slope_seg_start = []
    modified_slope_seg_end = []
    thres_n = 6
    thres_x_perc = 0.1
    thres_y_perc = 0.1
    for i, idx in enumerate(slope_seg_start_idx):
        this_left = slope_seg_start_idx[i]
        this_right = slope_seg_end_idx[i]
        #        print(this_left, this_right)
        if use_data[this_right, 0] >= limit:
            this_range_data = use_data[this_left:(this_right + 1), :]
            this_n = this_range_data.shape[0]
            this_x_perc = (this_range_data[-1, 0] - this_range_data[0, 0]) / (use_data[-1, 0] - use_data[0, 0])
            this_y_perc = np.max(this_range_data[:, 1]) - np.min(this_range_data[:, 1])
            if this_n >= thres_n or this_x_perc >= thres_x_perc or this_y_perc >= thres_y_perc:
                modified_slope_seg_start += [this_left]
                modified_slope_seg_end += [this_right]
            else:
                continue
        else:
            modified_slope_seg_start += [this_left]

    if 0 not in modified_slope_seg_start:
        modified_slope_seg_start += [0]

    return modified_slope_seg_start


def get_herald(use_data):
    peak_point_mask = (np.triu(use_data[:, 1].reshape(-1, 1) - use_data[:, 1].reshape(1, -1)) > -0.001).all(axis=1)

    for i in range(use_data.shape[0]):
        if not peak_point_mask[i]:
            if peak_point_mask[i - 1] and peak_point_mask[i + 1]:
                peak_point_mask[i] = True
    segment_start = []
    cur_status = False
    for i in range(use_data.shape[0]):
        if not cur_status and peak_point_mask[i]:
            cur_status = True
            segment_start += [i]
        elif cur_status and not peak_point_mask[i]:
            cur_status = False

    return segment_start


def check_filter(well_prod):
    well_prod = well_prod[~np.isnan(well_prod).any(axis=1), :]  ## remove nan rows
    well_prod[well_prod[:, 1] < 0, 1] = 0  ## change <0 data to 0
    basic_data = trans.apply(well_prod, basic_trans_ops, basic_trans_para_dict_s)
    t_peak = basic_data[np.argmax(basic_data[:, 1]), 0]
    ap_data = basic_data[basic_data[:, 0] >= t_peak, :]

    target_points = 50
    groupdays = int((ap_data.shape[0] / target_points) * (ap_data[-1, 0] - ap_data[0, 0]))
    if ap_data.shape[0] > 80:
        reshape_trans_ops = ['group', 'normalize']
        reshape_trans_para_dict_s = [{'groupdays': groupdays}, {'normalize_range': [0.2, 1.2], 'cols': [1]}]
    else:
        reshape_trans_ops = ['normalize']
        reshape_trans_para_dict_s = [{'normalize_range': [0.2, 1.2], 'cols': [1]}]

    use_data = trans.apply(ap_data, reshape_trans_ops, reshape_trans_para_dict_s)
    return use_data


def last_peak(entire_data, filtered_data, data_range):  # noqa: C901
    # make sure at least one point
    orig_well_prod = deepcopy(entire_data)
    orig_well_prod = orig_well_prod[~np.isnan(orig_well_prod).any(axis=1), :]  ## remove nan rows
    orig_well_prod[orig_well_prod[:, 1] < 0, 1] = 0  ## change <0 data to 0
    basic_data = trans.apply(orig_well_prod, basic_trans_ops, basic_trans_para_dict_s)
    last = None
    ret_data = None
    ###
    if basic_data.shape[0] == 0:
        last = orig_well_prod[0, 0]
        ret_data = basic_data
    else:
        t_peak = basic_data[np.argmax(basic_data[:, 1]), 0]
        ap_data = basic_data[basic_data[:, 0] >= t_peak, :]

        target_points = 50
        groupdays = int((ap_data[-1, 0] - ap_data[0, 0]) / target_points)
        if ap_data.shape[0] > 80:
            reshape_trans_ops = ['group', 'normalize']
            reshape_trans_para_dict_s = [{'groupdays': groupdays}, {'normalize_range': [0.2, 1.2], 'cols': [1]}]
        else:
            reshape_trans_ops = ['normalize']
            reshape_trans_para_dict_s = [{'normalize_range': [0.2, 1.2], 'cols': [1]}]

        use_data = trans.apply(ap_data, reshape_trans_ops, reshape_trans_para_dict_s)
        if use_data.shape[0] == 0:
            last = orig_well_prod[0, 0]
            ret_data = use_data
        else:
            if use_data.shape[0] <= 50:
                n = 3
            else:
                n = 4
            slope_data = trans.apply(use_data, ['normalize'], [{'normalize_range': [0, 1], 'cols': [0, 1]}])
            ####################   local slope
            qualified_inc_seg_start_index = get_local_slope_seg(slope_data, use_data, n)
            #################################  herald, get start index of all the heralds
            segment_start = get_herald(use_data)

            peaks = []
            cur_max_peak = None
            for i in range(len(segment_start) - 1, -1, -1):  ### detect all end of flat points after all the heralds
                p = segment_start[i]

                if i < len(segment_start) - 1:
                    this_seg_data = use_data[segment_start[i]:segment_start[i + 1], :]
                else:
                    this_seg_data = use_data[segment_start[i]:, :]

                this_end_flat = find_end_flat(this_seg_data, use_data[p, 0])
                this_peak_val = use_data[use_data[:, 0] == this_end_flat, 1]
                if cur_max_peak is None:
                    cur_max_peak = this_peak_val
                    peaks += [this_end_flat]
                else:
                    if this_peak_val > cur_max_peak:
                        cur_max_peak = this_peak_val
                        peaks += [this_end_flat]
                    else:
                        continue

            peaks = np.sort(np.array(peaks))
            limit = 120
            peak_limit = entire_data[-1, 0] - limit
            if entire_data.shape[0] > 5:
                peak_limit = min(peak_limit, entire_data[-5, 0])
            peaks = peaks[peaks <= peak_limit]
            ### go from last incline start to first incline point, to see if there is any valid peaks entry point after
            ### that point, if there is, then we go from there
            if len(peaks) > 0:
                ret = peaks[0]
            else:
                ret = use_data[0, 0]

            ### update ret
            for last_seg_idx in qualified_inc_seg_start_index:
                last_seg_start = use_data[last_seg_idx, 0]
                valid_peaks = peaks[peaks >= last_seg_start]
                if valid_peaks.shape[0] > 0:
                    ret = valid_peaks[0]
                    break

            ##### check if this point is start of a new trend
            cur_ret = ret
            for i in range(10):  ## loop it 10 times should already give a good result
                this_end_flat = find_end_flat(use_data[use_data[:, 0] >= cur_ret, :], cur_ret)
                this_new_trend = detect_new_trend(use_data, cur_ret)
                this_inflection = find_inflection(use_data, cur_ret)
                this_cand = np.array([this_end_flat, this_new_trend, this_inflection])
                this_cand = this_cand[this_cand <= peak_limit]
                if np.all(this_cand == cur_ret):
                    break
                else:
                    use_cand = this_cand[this_cand > cur_ret]
                    cur_ret = np.min(use_cand)

            #### check if this peak exist in the real data
            peak_cands_mask = (orig_well_prod[:, 0] >= cur_ret - groupdays / 2) & (orig_well_prod[:, 0] <=
                                                                                   cur_ret + 100)
            peak_cands = orig_well_prod[peak_cands_mask, :]
            if peak_cands.shape[0] > 0:
                ret_peak = peak_cands[np.argmax(peak_cands[:, 1]), 0]
            else:
                ret_peak = orig_well_prod[np.argmax(orig_well_prod[-10:, 1]), 0]
            last = ret_peak
            ret_data = use_data
    ########  check if last is among filtered_data
    if last < data_range[0] or last > data_range[1]:
        last = filtered_data[np.argmax(filtered_data[:, 1]), 0]
        ret_data = filtered_data
    elif np.all(filtered_data[:, 0] != last):
        neighbor_dist = np.abs(filtered_data[:, 0] - last)
        last = filtered_data[np.argmin(neighbor_dist), 0]

    return last, ret_data
