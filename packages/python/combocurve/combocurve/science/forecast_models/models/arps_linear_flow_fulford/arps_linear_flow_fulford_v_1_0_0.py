from typing import List, Union
import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.forecast_models.shared.segment_shared import arps_modified_para2seg, arps_para_2_seg
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D, arps_get_D_delta

E = np.exp(1)


class model_arps_linear_flow_fulford(model_parent):
    '''Class that implements linear flow (arps w/ b=2) followed by M arps, w/ interpolated arps between.'''
    def __init__(self):
        self.model_name = 'arps_linear_flow_fulford'
        self.model_p_name = ['D_eff', 'minus_t_elf_t_peak', 'b2']
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first', 'q_peak']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'

    def func(self, t: Union[list, np.ndarray], p: List[float], p_fixed: List[float]) -> float:
        [D_eff, minus_t_elf_t_peak, b2] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        t_peak = t_first + minus_t_peak_t_first
        b0 = 2.0
        D0 = arps_D_eff_2_D(D_eff, b0)

        # First arps segment lasts from t_peak til t1, then we start a transient segment.

        # From Fulford's decision.
        b1 = b0 - ((b0 - b2) / E)
        # Make sure second segment is at least 1 larger than first segment.
        t1 = max(t_peak + 1, t_peak + np.round(minus_t_elf_t_peak * (E - 1.0)))

        q1 = pred_arps(t1, t_peak, q_peak, D0, b0)
        D1 = arps_get_D_delta(D0, b0, t1 - t_peak)

        # Transient segment ends at t2, then we start a final M arps segment.

        # From Fulford's decision.
        t2 = max(t1 + 1, t_peak + np.round(minus_t_elf_t_peak * (E + 1.0)))

        q2 = pred_arps(t2, t1, q1, D1, b1)
        D2 = arps_get_D_delta(D1, b1, t2 - t1)

        ret = np.zeros_like(t, dtype='float')
        range0 = (t_peak <= t) & (t < t1)
        range1 = (t1 <= t) & (t < t2)
        range3 = t >= t2
        ret[range0] = pred_arps(t[range0], t_peak, q_peak, D0, b0)
        ret[range1] = pred_arps(t[range1], t1, q1, D1, b1)
        ret[range3] = pred_arps(t[range3], t2, q2, D2, b2)

        return ret

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]
        p_fixed = np.array([t_first, t_peak - t_first, q_peak])

        p_range = [(1e-5, 1 - 1e-5), (0, transformed_data[-1, 0] - t_peak), (1e-5, 2)]
        return p_fixed, p_range, transformed_data

    ############################################################# convert to segments
    def get_p2seg_dict(self, para_dict, t_first_t_end_data_t_end_life):
        ret = {
            't_first': t_first_t_end_data_t_end_life['t_first'],
            't_end_data': t_first_t_end_data_t_end_life['t_end_data'],
            't_end_life': t_first_t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final'],
            'D_lim_eff': para_dict['D_lim_eff'],
            'enforce_sw': para_dict['enforce_sw']
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = int(p2seg_dict['t_end_life'])

        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        # Follows predict method, w/ modifications for safety of time index.
        [D_eff, minus_t_elf_t_peak, b2] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed

        # Enforce time stamps are integers.
        t_first = int(t_first)
        minus_t_peak_t_first = int(minus_t_peak_t_first)

        t_peak: int = t_first + max(0, minus_t_peak_t_first)
        b0 = 2.0
        D0 = arps_D_eff_2_D(D_eff, b0)

        t1: int = max(t_peak + 2, t_peak + np.round(minus_t_elf_t_peak * (E - 1.0)))
        t0_end: int = t1 - 1
        q0_end = pred_arps(t0_end, t_peak, q_peak, D0, b0)
        b1 = b0 - ((b0 - b2) / E)
        q1 = pred_arps(t1, t_peak, q_peak, D0, b0)
        D1 = arps_get_D_delta(D0, b0, t1 - t_peak)

        t2: int = max(t1 + 2, t_peak + np.round(minus_t_elf_t_peak * (E + 1.0)))
        t1_end: int = t2 - 1
        q1_end = pred_arps(t1_end, t1, q1, D1, b1)
        q2 = pred_arps(t2, t1, q1, D1, b1)
        D2 = arps_get_D_delta(D1, b1, t2 - t1)
        end_data_idx: int = max(p2seg_dict['t_end_data'], t2)
        life_idx: int = max(end_data_idx, t_end_life)

        first_seg = arps_para_2_seg(t0_end, t0_end, q0_end, D0, b0, t_peak, q_peak)
        second_seg = arps_para_2_seg(t1_end, t1_end, q1_end, D1, b1, t1, q1)
        third_seg = arps_modified_para2seg(end_data_idx, life_idx, q_final, D_lim_eff, enforce_sw, D2, b2, t2, q2)

        return first_seg + second_seg + third_seg
