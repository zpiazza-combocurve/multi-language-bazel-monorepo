from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent


class FlatSegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        q_start = self.segment['q_start']
        ret = np.ones(t.shape) * q_start
        return ret

    def integral(self, left_idx, right_idx):
        q_start = self.segment['q_start']
        return q_start * (right_idx - left_idx)

    def arr_integral(self, left_idx, right_idx_arr):
        return self.integral(left_idx, right_idx_arr)

    def inverse_integral(self, integral, left_idx):
        q_start = self.segment['q_start']
        ret = integral / q_start + left_idx
        return ret

    def arr_inverse_integral(self, integral_arr, left_idx):
        return self.inverse_integral(integral_arr, left_idx)

    def slope(self, slope_idx_s):
        return np.zeros(len(slope_idx_s))

    def cut(self, cut_idx):
        this_name = 'flat'
        seg_start = self.segment['start_idx']
        q_start = self.segment['q_start']
        seg_end = self.segment['end_idx']
        use_cut_idx = int(cut_idx)
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = q_start
        first_segment['q_end'] = q_start
        first_segment['c'] = q_start
        ## second segment
        second_segment = self.get_default_template(this_name)
        second_segment['start_idx'] = use_cut_idx
        second_segment['end_idx'] = seg_end
        second_segment['q_start'] = q_start
        second_segment['q_end'] = q_start
        second_segment['c'] = q_start

        return first_segment, second_segment

    @staticmethod
    def fill(segment_to_be_filled: dict[str, Union[str, float, int]]):
        """method of calculating additional fields in the Segment object based on current fields.

        Args:
            segment_to_be_filled (dict[str, Any]): {'start_idx', 'q_start', 'end_idx'}

        Returns:
            dict[str, Any]: {'start_idx', 'q_start', 'end_idx', 'q_end', 'c'}
        """
        # segment_to_be_filled = {'start_idx', 'q_start', 'end_idx'}
        ret = deepcopy(segment_to_be_filled)

        ret['q_end'] = ret['q_start']
        ret['c'] = ret['q_start']

        return ret

    def get_rate_scaled_fields(self):
        fields = super().get_rate_scaled_fields()
        fields.append('c')
        return fields
