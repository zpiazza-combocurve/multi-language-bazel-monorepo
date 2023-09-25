from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent
from ..shared.helper import (pred_arps, slope_arps, slope_exp, arps_get_D_delta, arps_D_2_D_eff, pred_exp,
                             integral_arps, integral_exp, inverse_integral_arps, inverse_integral_exp, arps_D_eff_2_D,
                             arps_sw)


class ArpsModifiedSegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        start_idx = self.segment['start_idx']
        sw_idx = self.segment['sw_idx']

        q_start = self.segment['q_start']
        b = self.segment['b']
        D = self.segment['D']

        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']

        ret = np.zeros(t.shape)
        range_1 = t <= sw_idx
        range_2 = t > sw_idx
        ret[range_1] = pred_arps(t[range_1], start_idx, q_start, D, b)
        ret[range_2] = pred_exp(t[range_2], sw_idx, q_sw, D_exp)
        return ret

    def integral(self, left_idx, right_idx):
        D = self.segment['D']
        b = self.segment['b']
        sw_idx = self.segment['sw_idx']
        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']
        q_sw = self.segment['q_sw']

        ret = 0
        arps_idx_s = [min(left_idx, sw_idx), min(right_idx, sw_idx)]
        if arps_idx_s[0] < arps_idx_s[1]:
            ret += integral_arps(arps_idx_s[0], arps_idx_s[1], start_idx, q_start, D, b)

        exp_idx_s = [max(left_idx, sw_idx), max(right_idx, sw_idx)]
        if exp_idx_s[0] < exp_idx_s[1]:
            ret += integral_exp(exp_idx_s[0], exp_idx_s[1], sw_idx, q_sw, D_exp)

        return ret

    def arr_integral(self, left_idx, right_idx_arr):
        D = self.segment['D']
        b = self.segment['b']
        sw_idx = self.segment['sw_idx']
        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']
        q_sw = self.segment['q_sw']

        ret = np.zeros(right_idx_arr.shape)
        arps_idx_0 = np.min([left_idx, sw_idx])
        arps_idx_1_arr = np.min(np.array([right_idx_arr, np.ones(right_idx_arr.shape) * sw_idx]), axis=0)
        arps_idx_mask = arps_idx_0 < arps_idx_1_arr
        ret[arps_idx_mask] += integral_arps(arps_idx_0, arps_idx_1_arr[arps_idx_mask], start_idx, q_start, D, b)

        exp_idx_0 = np.max([left_idx, sw_idx])
        exp_idx_1_arr = np.max(np.array([right_idx_arr, np.ones(right_idx_arr.shape) * sw_idx]), axis=0)
        exp_idx_mask = exp_idx_0 < exp_idx_1_arr

        ret[exp_idx_mask] += integral_exp(exp_idx_0, exp_idx_1_arr[exp_idx_mask], sw_idx, q_sw, D_exp)
        return ret

    def inverse_integral(self, integral, left_idx):
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']
        D = self.segment['D']
        b = self.segment['b']

        sw_idx = self.segment['sw_idx']
        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']

        if left_idx < sw_idx:
            thres = integral_arps(left_idx, sw_idx, start_idx, q_start, D, b)
            if integral < thres:
                ret = inverse_integral_arps(integral, left_idx, start_idx, q_start, D, b)
            else:
                ret = inverse_integral_exp(integral - thres, sw_idx, sw_idx, q_sw, D_exp)
        else:
            ret = inverse_integral_exp(integral, left_idx, sw_idx, q_sw, D_exp)

        return ret

    def arr_inverse_integral(self, integral_arr, left_idx):
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']
        D = self.segment['D']
        b = self.segment['b']

        sw_idx = self.segment['sw_idx']
        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']

        ret = np.zeros(integral_arr.shape)
        if left_idx < sw_idx:
            thres = integral_arps(left_idx, sw_idx, start_idx, q_start, D, b)
            arps_mask = integral_arr < thres
            ret[arps_mask] = inverse_integral_arps(integral_arr[arps_mask], left_idx, start_idx, q_start, D, b)

            exp_mask = integral_arr >= thres
            ret[exp_mask] = inverse_integral_exp(integral_arr[exp_mask] - thres, sw_idx, sw_idx, q_sw, D_exp)
        else:
            ret = inverse_integral_exp(integral_arr, sw_idx, sw_idx, q_sw, D_exp)

        return ret

    def slope(self, slope_idx_s):
        use_t_s = np.array(slope_idx_s)
        start_idx = self.segment['start_idx']
        q_start = self.segment['q_start']
        D = self.segment['D']
        b = self.segment['b']
        sw_idx = self.segment['sw_idx']
        q_sw = self.segment['q_sw']
        D_exp = self.segment['D_exp']
        part_1_mask = use_t_s <= sw_idx
        part_2_mask = use_t_s > sw_idx
        ret = np.zeros(use_t_s.shape)
        ret[part_1_mask] = slope_arps(use_t_s[part_1_mask], start_idx, q_start, D, b)
        ret[part_2_mask] = slope_exp(use_t_s[part_2_mask], sw_idx, q_sw, D_exp)
        return ret

    def cut(self, cut_idx):
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        q_end = self.segment['q_end']
        D_eff = self.segment['D_eff']
        D = self.segment['D']
        b = self.segment['b']
        sw_idx = self.segment['sw_idx']
        D_exp_eff = self.segment['D_exp_eff']
        D_exp = self.segment['D_exp']
        use_cut_idx = int(cut_idx)
        q_connect = self.predict([use_cut_idx - 1, use_cut_idx])
        ## first_segment
        if use_cut_idx - 1 <= sw_idx:
            first_segment = self.get_default_template('arps')
            first_segment['D_eff'] = D_eff
            first_segment['D'] = D
            first_segment['b'] = b
            first_segment['start_idx'] = seg_start
            first_segment['end_idx'] = use_cut_idx - 1
            first_segment['q_start'] = q_start
            first_segment['q_end'] = q_connect[0]
        else:
            first_segment = deepcopy(self.segment)
            first_segment['end_idx'] = use_cut_idx - 1
            first_segment['q_end'] = q_connect[0]
        ## second segment
        if use_cut_idx >= sw_idx:
            second_segment = self.get_default_template('exp_dec')
            second_segment['D_eff'] = D_exp_eff
            second_segment['D'] = D_exp
            second_segment['start_idx'] = use_cut_idx
            second_segment['end_idx'] = seg_end
            second_segment['q_start'] = q_connect[1]
            second_segment['q_end'] = q_end
        else:
            second_segment = self.get_default_template('arps_modified')
            new_D = arps_get_D_delta(D, b, use_cut_idx - seg_start)
            new_D_eff = arps_D_2_D_eff(new_D, b)

            second_segment = deepcopy(self.segment)
            second_segment['q_start'] = q_connect[1]
            second_segment['start_idx'] = use_cut_idx
            second_segment['D'] = new_D
            second_segment['D_eff'] = new_D_eff

        return first_segment, second_segment

    @staticmethod
    def fill(segment_to_be_filled: dict[str, Union[str, float, int]]):
        """method of calculating additional fields in the Segment object based on current fields.

        Args:
            segment_to_be_filled (dict[str, Any]): {'start_idx', 'end_idx', 'q_start', 'b', 'D_eff', 'target_D_eff_sw'}

        Returns:
            dict[str, Any]: {'end_idx', 'q_end', 'D', 'realized_D_eff_sw', 'sw_idx', 'q_sw', 'D_exp_eff', 'D_exp'}
        """
        ## segment_to_be_filled = {'start_idx', 'end_idx', 'q_start', 'b', 'D_eff', 'target_D_eff_sw'}
        ## to be filled {'end_idx', 'q_end', 'D', 'realized_D_eff_sw', 'sw_idx', 'q_sw', 'D_exp_eff', 'D_exp'}
        ## here we use arps_modified_wp to simplify logic, in the future arps_modified should use this
        start_idx = segment_to_be_filled['start_idx']
        end_idx = segment_to_be_filled['end_idx']
        q_peak = segment_to_be_filled['q_start']
        b = segment_to_be_filled['b']
        D_eff = segment_to_be_filled['D_eff']
        D = arps_D_eff_2_D(D_eff, b)

        D_lim_eff = segment_to_be_filled['target_D_eff_sw']

        sw_idx, realized_D_eff_sw, D_exp, D_exp_eff = arps_sw(q_peak, b, D, D_lim_eff, start_idx, start_idx, end_idx,
                                                              True)

        q_sw = pred_arps(sw_idx, start_idx, q_peak, D, b)

        if end_idx > sw_idx:
            q_end = pred_exp(end_idx, sw_idx, q_sw, D_exp)
        else:
            q_end = pred_arps(end_idx, start_idx, q_peak, D, b)

        ret = deepcopy(segment_to_be_filled)
        ret['end_idx'] = int(end_idx)
        ret['q_end'] = float(q_end)
        ret['D'] = float(D)
        ret['realized_D_eff_sw'] = float(realized_D_eff_sw)
        ret['sw_idx'] = float(sw_idx)
        ret['q_sw'] = float(q_sw)
        ret['D_exp_eff'] = float(D_exp_eff)
        ret['D_exp'] = float(D_exp)
        return ret

    def get_rate_scaled_fields(self):
        fields = super().get_rate_scaled_fields()
        fields.append('q_sw')
        return fields

    def get_idx_shift_fields(self):
        fields = super().get_idx_shift_fields()
        fields.append('sw_idx')
        return fields
