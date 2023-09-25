from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent
from ..shared.helper import pred_linear, linear_D_eff_2_k


class LinearSegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        start_idx = self.segment['start_idx']
        q_start = self.segment['q_start']
        k = self.segment['k']

        return pred_linear(t, q_start, start_idx, k)

    def integral(self, left_idx, right_idx):
        t0 = self.segment['start_idx']
        q0 = self.segment['q_start']
        k = self.segment['k']

        if k == 0:
            ret = q0 * (right_idx - left_idx)
        else:
            ret = 0.5 * k * (right_idx * right_idx - left_idx * left_idx) + (q0 - k * t0) * (right_idx - left_idx)
        return ret

    def arr_integral(self, left_idx, right_idx_arr):
        return self.integral(left_idx, right_idx_arr)

    def inverse_integral(self, integral, left_idx):
        t0 = self.segment['start_idx']
        q0 = self.segment['q_start']
        k = self.segment['k']
        if k == 0:
            ret = integral / q0 + left_idx
        else:
            ret = t0 - q0 / k + np.sqrt(t0 * t0 - 2 * t0 * q0 / k + q0 * q0 / (k * k) + left_idx * left_idx
                                        - 2 * left_idx * t0 + 2 * left_idx * q0 / k + 2 * integral / k)
        return ret

    def arr_inverse_integral(self, integral_arr, left_idx):
        return self.inverse_integral(integral_arr, left_idx)

    def slope(self, slope_idx_s):
        k = self.segment['k']
        return np.ones(len(slope_idx_s)) * k

    def cut(self, cut_idx):
        this_name = 'linear'
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        q_end = self.segment['q_end']
        k = self.segment['k']

        use_cut_idx = int(cut_idx)
        q_connect = self.predict([use_cut_idx - 1, use_cut_idx])
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['k'] = k
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = q_start
        first_segment['q_end'] = q_connect[0]
        ## second segment
        second_segment = self.get_default_template(this_name)
        second_segment['k'] = k
        second_segment['start_idx'] = use_cut_idx
        second_segment['end_idx'] = seg_end
        second_segment['q_start'] = q_connect[1]
        second_segment['q_end'] = q_end

        return first_segment, second_segment

    @staticmethod
    def fill(segment_to_be_filled: dict[str, Union[str, float, int]]):
        """method of calculating additional fields in the Segment object based on current fields.

        Args:
            segment_to_be_filled (dict[str, Any]): current segment

        Returns:
            dict[str, Any]: current segment fields + {'k', 'q_end', 'slope'}
        """
        ret = deepcopy(segment_to_be_filled)

        end_idx = ret['end_idx']
        start_idx = ret['start_idx']
        q_start = ret['q_start']
        q_end = ret.get('q_end')

        if ret.get('D_eff'):
            k = linear_D_eff_2_k(ret['D_eff'], q_start)
        else:
            if end_idx - start_idx > 0:
                k = (q_end - q_start) / (end_idx - start_idx)
            else:
                k = 0

        ret['k'] = k
        ret['q_end'] = k * (end_idx - start_idx) + q_start
        ret['slope'] = 1 if k > 0 else -1

        return ret

    def get_rate_scaled_fields(self):
        fields = super().get_rate_scaled_fields()
        fields.append('k')
        return fields
