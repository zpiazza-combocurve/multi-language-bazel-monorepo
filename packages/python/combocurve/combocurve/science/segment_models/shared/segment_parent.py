from typing import Any, Dict, Optional, Sequence, Union
import numpy as np

common_template = {'start_idx': 0, 'end_idx': 31}

exp_inc_template = {'name': 'exp_inc', 'slope': 1, 'D_eff': -0.5, 'D': -0.67, 'q_start': 1, 'q_end': 1200}

exp_dec_template = {'name': 'exp_dec', 'slope': -1, 'D_eff': 0.5, 'D': 0.67, 'q_start': 1200, 'q_end': 1}

arps_template = {'name': 'arps', 'slope': -1, 'b': 2, 'D_eff': 0.5, 'D': 0.67, 'q_start': 1200, 'q_end': 1}

arps_inc_template = {'name': 'arps_inc', 'slope': 1, 'b': -2, 'D_eff': -0.5, 'D': -0.67, 'q_start': 1, 'q_end': 1200}

arps_modified_template = {
    'name': 'arps_modified',
    'q_start': 1200,
    'q_end': 1,
    'slope': -1,
    'D_eff': 0.5,
    'D': 0.67,
    'b': 2,
    'target_D_eff_sw': 0.06,
    'realized_D_eff_sw': 0.06,
    'sw_idx': 21.1,
    'q_sw': 1230,
    'D_exp_eff': 0.06,
    'D_exp': 0.012
}

flat_template = {'name': 'flat', 'slope': 0, 'c': 123, 'q_start': 123, 'q_end': 123}

empty_template = {'name': 'empty', 'slope': 0, 'q_start': 0, 'q_end': 0}

linear_template = {'name': 'linear', 'slope': 0, 'q_start': 1, 'q_end': 100, 'k': 1, 'D_eff': 0.5}

templates = {
    'exp_inc': exp_inc_template,
    'exp_dec': exp_dec_template,
    'arps': arps_template,
    'arps_inc': arps_inc_template,
    'arps_modified': arps_modified_template,
    'flat': flat_template,
    'empty': empty_template,
    'linear': linear_template
}


class SegmentParent(object):
    def __init__(self, segment=None):
        self.segment: Optional[Dict[str, Any]] = segment

    def predict(self, raw_t: Union[float, int, np.ndarray, list]):
        """
        method for getting production rate (q_t) of the input time point(s)

        Args:
            raw_t (Union[float, list]): time values
        Returns:
            q_t (np.ndarray) : production rate(s)
        """
        pass

    def integral(self, left_idx: int, right_idx: int):
        """
        method of getting the cumulative production within a time window

        Args:
            left_idx (int): start time of the time window
            right_idx (int): end time of the time window
        Returns:
            float: cumulative production
        """
        pass

    def arr_integral(self, left_idx: int, right_idx_arr: Sequence[int]):
        """method of getting cumulative production for a list of windows starting from the same time
        Args:
            left_idx (int): start time of the windows
            right_idx_arr (Iterable[int]): end times of the windows

        Returns:
            cumulative productions (float)
        """
        pass

    def inverse_integral(self, integral: float, left_idx: int) -> float:
        """
        Method of getting the time value that reaches a cumulative production starting from
        the input starting time

        Args:
            integral (float): cumulative production since the input start time
            left_idx (int): start time

        Returns:
            float: time that reaches the cumulative production
        """
        pass

    def arr_inverse_integral(self, integral_arr: Sequence[float], left_idx: int) -> Sequence[float]:
        """
        method of getting the time values for a series of cumulative productions starting
        from the input starting time.

        Args:
            integral_arr (Sequence[float]): cumulative productions since the input start time
            left_idx (int): start time

        Returns:
            Sequence[float]: time values that reach the cumulative productions
        """
        pass

    def slope(self, slope_idx_s: Union[Sequence[int], int]):
        """
        method of getting the first-order derivative of the production rate.

        Args:
            slope_idx_s (Union[Sequence[int], int]): time indices at which to compute the slope

        Returns:
            Sequence[float]: slope(s) at the given time(s) (Sequence[float])
        """
        pass

    def cut(self, cut_idx: Union[int, float]):
        """
        method of separating the current segment into two segments at cut_idx

        Args:
            cut_idx (Union[int, float]): time to separate the segment

        Returns:
            (first_segment, second_segment) : two dict that store the segment info
        """
        pass

    def get_current_segment(self):
        """returns the current segment

        Returns:
            Dict[str, Any]: Segment object stored as a dictionary
        """
        return self.segment

    def get_default_template(self, name):
        """method of getting the Segment object template for input model name

        Args:
            name (str): model name

        Returns:
            Dict[str, Any]: The dictionary template for current model
        """
        return {**templates[name], **common_template}

    def get_rate_scaled_fields(self):
        '''Returns fields that must be scaled when applying a rate multiplier to the segment.'''
        return ['q_start', 'q_end']

    def get_idx_shift_fields(self):
        '''Returns fields that must be incremented when applying an index shift to the segment.'''
        return ['start_idx', 'end_idx']
