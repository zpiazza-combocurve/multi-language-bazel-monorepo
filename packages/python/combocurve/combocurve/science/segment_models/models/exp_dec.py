from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent
from ..shared.helper import pred_exp, slope_exp, integral_exp, inverse_integral_exp, exp_D_eff_2_D


class ExpDecSegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        start_idx = self.segment['start_idx']
        q_start = self.segment['q_start']
        D = self.segment['D']
        return pred_exp(t, start_idx, q_start, D)

    def integral(self, left_idx, right_idx):
        start_idx = self.segment['start_idx']
        D = self.segment['D']
        q_start = self.segment['q_start']
        return integral_exp(left_idx, right_idx, start_idx, q_start, D)

    def arr_integral(self, left_idx, right_idx_arr):
        return self.integral(left_idx, right_idx_arr)

    def inverse_integral(self, integral, left_idx):
        start_idx = self.segment['start_idx']
        D = self.segment['D']
        q_start = self.segment['q_start']
        return inverse_integral_exp(integral, left_idx, start_idx, q_start, D)

    def arr_inverse_integral(self, integral_arr, left_idx):
        return self.inverse_integral(integral_arr, left_idx)

    def slope(self, slope_idx_s):
        use_t_s = np.array(slope_idx_s)
        q_start = self.segment['q_start']
        D = self.segment['D']
        start_idx = self.segment['start_idx']
        return slope_exp(use_t_s, start_idx, q_start, D)

    def cut(self, cut_idx):
        this_name = 'exp_dec'
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        q_end = self.segment['q_end']
        D_eff = self.segment['D_eff']
        D = self.segment['D']
        use_cut_idx = int(cut_idx)
        q_connect = self.predict([use_cut_idx - 1, use_cut_idx])
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['D_eff'] = D_eff
        first_segment['D'] = D
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = q_start
        first_segment['q_end'] = q_connect[0]
        ## second segment
        second_segment = self.get_default_template(this_name)
        second_segment['D_eff'] = D_eff
        second_segment['D'] = D
        second_segment['start_idx'] = use_cut_idx
        second_segment['end_idx'] = seg_end
        second_segment['q_start'] = q_connect[1]
        second_segment['q_end'] = q_end

        return first_segment, second_segment

    @staticmethod
    def fill(segment_to_be_filled: dict[str, Union[str, float, int]]):
        """method of calculating additional fields in the Segment object based on current fields.

        Args:
            segment_to_be_filled (dict[str, Any]): {'start_idx', 'q_start', 'end_idx', 'b', 'D_eff'}

        Returns:
            dict[str, Any]: {'start_idx', 'q_start', 'end_idx', 'b', 'D_eff', 'q_end', 'D'}
        """

        ret = deepcopy(segment_to_be_filled)

        end_idx = ret['end_idx']
        start_idx = ret['start_idx']
        q_start = ret['q_start']

        D = exp_D_eff_2_D(ret['D_eff'])
        q_end = pred_exp(end_idx, start_idx, q_start, D)

        ret['q_end'] = float(q_end)
        ret['D'] = float(D)

        return ret
