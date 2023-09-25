from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent
from ..shared.helper import (pred_arps, slope_arps, arps_get_D_delta, arps_D_2_D_eff, integral_arps,
                             inverse_integral_arps, arps_D_eff_2_D)


class ArpsSegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        start_idx = self.segment['start_idx']
        b = self.segment['b']
        D = self.segment['D']
        q_start = self.segment['q_start']
        return pred_arps(t, start_idx, q_start, D, b)

    def integral(self, left_idx, right_idx):
        b = self.segment['b']
        D = self.segment['D']
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']

        return integral_arps(left_idx, right_idx, start_idx, q_start, D, b)

    def arr_integral(self, left_idx, right_idx_arr):
        return self.integral(left_idx, right_idx_arr)

    def inverse_integral(self, integral, left_idx):
        b = self.segment['b']
        D = self.segment['D']
        q_start = self.segment['q_start']
        start_idx = self.segment['start_idx']
        return inverse_integral_arps(integral, left_idx, start_idx, q_start, D, b)

    def arr_inverse_integral(self, integral_arr, left_idx):
        return self.inverse_integral(integral_arr, left_idx)

    def slope(self, slope_idx_s):
        use_t_s = np.array(slope_idx_s)
        q_start = self.segment['q_start']
        D = self.segment['D']
        b = self.segment['b']
        start_idx = self.segment['start_idx']
        return slope_arps(use_t_s, start_idx, q_start, D, b)

    def cut(self, cut_idx):
        this_name = 'arps'
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        q_end = self.segment['q_end']
        D_eff = self.segment['D_eff']
        D = self.segment['D']
        b = self.segment['b']
        use_cut_idx = int(cut_idx)
        q_connect = self.predict([use_cut_idx - 1, use_cut_idx])
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['D_eff'] = D_eff
        first_segment['D'] = D
        first_segment['b'] = b
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = q_start
        first_segment['q_end'] = q_connect[0]
        ## second segment
        new_D = arps_get_D_delta(D, b, use_cut_idx - seg_start)
        new_D_eff = arps_D_2_D_eff(new_D, b)
        second_segment = self.get_default_template(this_name)
        second_segment['D_eff'] = new_D_eff
        second_segment['D'] = new_D
        second_segment['b'] = b
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
        # segment_to_be_filled = {'start_idx', 'q_start', 'end_idx', 'b', 'D_eff'}
        ret = deepcopy(segment_to_be_filled)

        end_idx = ret['end_idx']
        start_idx = ret['start_idx']
        q_start = ret['q_start']
        D_eff = segment_to_be_filled['D_eff']
        b = segment_to_be_filled['b']

        D = arps_D_eff_2_D(D_eff, b)
        q_end = pred_arps(end_idx, start_idx, q_start, D, b)

        ret['q_end'] = float(q_end)
        ret['D'] = float(D)

        return ret
