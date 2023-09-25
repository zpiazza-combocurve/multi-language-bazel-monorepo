import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import (pred_arps, pred_exp, exp_D_eff_2_D, arps_D_eff_2_D,
                                                             arps_get_D_delta)
from combocurve.science.forecast_models.shared.segment_shared import arps_modified_para2seg, exp_para_2_seg


class model_exp_dec_arps_modified_free_peak_different(model_parent):
    def __init__(self):
        self.model_name = 'exp_dec_arps_modified_free_peak_different'
        self.model_p_name = ['D_eff_exp', 'q_peak', 'minus_t1_t_peak', 'b', 'D_eff_arps']
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'
        self.prob_para_direction = {'D_eff': 1, 'b': -1}
        self.prob_para = ['D_eff', 'b']
        self.TC_c8_para_name = None
        self.TC_set_s = None

    ###################################################################################### deterministic fit
    def func(self, t, p, p_fixed):
        [D_eff_exp, q_peak, minus_t1_t_peak, b, D_eff_arps] = p
        [t_first, minus_t_peak_t_first] = p_fixed

        t_peak = t_first + minus_t_peak_t_first
        t1 = t_peak + minus_t1_t_peak
        D_exp = exp_D_eff_2_D(D_eff_exp)
        D_arps = arps_D_eff_2_D(D_eff_arps, b)
        q1 = pred_exp(t1, t_peak, q_peak, D_exp)
        ret_list = np.zeros(t.shape)

        range_0 = (t >= t_peak) & (t < t1)
        range_1 = (t >= t1)
        ret_list[range_0] = pred_exp(t[range_0], t_peak, q_peak, D_exp)
        ret_list[range_1] = pred_arps(t[range_1], t1, q1, D_arps, b)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        t_last = data[-1, 0]
        minus_t_peak_t_first = t_peak - t_first

        p_fixed = [t_first, minus_t_peak_t_first]
        p_range = [(1e-6, 1 - 1e-6), (np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2), (0, t_last - t_first),
                   (1e-5, 10), (1e-6, 1 - 1e-6)]
        return p_fixed, p_range, transformed_data

    ##################################################################### ml not in use

    ################################################################# convert to segments
    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {
            't_end_data': t_end_data_t_end_life['t_end_data'],
            't_end_life': t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final'],
            'D_lim_eff': para_dict['D_lim_eff'],
            'enforce_sw': para_dict['enforce_sw']
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        ####
        t_end_data = p2seg_dict['t_end_data']
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']

        [D_eff_exp, q_peak, minus_t1_t_peak, b, D_eff_arps] = p
        [t_first, minus_t_peak_t_first] = p_fixed

        D_exp = exp_D_eff_2_D(D_eff_exp)
        D_arps = arps_D_eff_2_D(D_eff_arps, b)

        t_peak = t_first + minus_t_peak_t_first
        t1 = t_peak + minus_t1_t_peak
        q1 = pred_exp(t1, t_peak, q_peak, D_exp)

        t1_end = int(np.floor(t1))
        q1_end = pred_exp(t1_end, t_peak, q_peak, D_exp)
        t2_start = t1_end + 1
        q2_start = pred_arps(t2_start, t1, q1, D_arps, b)

        D_arps_t2_start = arps_get_D_delta(D_arps, b, t2_start - t1)

        first_seg = exp_para_2_seg(t1_end, t1_end, q1_end, D_eff_exp, t_peak, q_peak)
        second_seg = arps_modified_para2seg(t_end_data, t_end_life, q_final, D_lim_eff, enforce_sw, D_arps_t2_start, b,
                                            t2_start, q2_start)

        return first_seg + second_seg
