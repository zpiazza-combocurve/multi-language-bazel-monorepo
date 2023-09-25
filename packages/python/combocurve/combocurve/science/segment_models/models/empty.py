from typing import Union
import numpy as np
from copy import deepcopy

from ..shared.segment_parent import SegmentParent


class EmptySegment(SegmentParent):
    def predict(self, raw_t):
        t = np.array(raw_t)
        return np.zeros(t.shape)

    def integral(self, left_idx, right_idx):
        return 0

    def arr_integral(self, left_idx, right_idx_arr):
        return np.zeros(len(right_idx_arr))

    def inverse_integral(self, integral, left_idx):
        return left_idx

    def arr_inverse_integral(self, integral_arr, left_idx):
        return left_idx * np.ones(len(integral_arr))

    def slope(self, slope_idx_s):
        return np.zeros(len(slope_idx_s))

    def cut(self, cut_idx):
        this_name = 'empty'
        seg_start = self.segment['start_idx']
        seg_end = self.segment['end_idx']
        use_cut_idx = int(cut_idx)
        ## first_segment
        first_segment = self.get_default_template(this_name)
        first_segment['start_idx'] = seg_start
        first_segment['end_idx'] = use_cut_idx - 1
        first_segment['q_start'] = 0
        first_segment['q_end'] = 0
        ## second segment
        second_segment = self.get_default_template(this_name)
        second_segment['start_idx'] = use_cut_idx
        second_segment['end_idx'] = seg_end
        second_segment['q_start'] = 0
        second_segment['q_end'] = 0

        return first_segment, second_segment

    @staticmethod
    def fill(segment_to_be_filled: dict[str, Union[str, float, int]]):
        """method of calculating additional fields in the Segment object based on current fields.

        Args:
            segment_to_be_filled (dict[str, Any]): current segment

        Returns:
            dict[str, Any]: current segment fields + {'q_start', q_end'}
        """
        ret = deepcopy(segment_to_be_filled)

        ret['q_start'] = 0
        ret['q_end'] = 0

        return ret

    def get_rate_scaled_fields(self):
        return []
