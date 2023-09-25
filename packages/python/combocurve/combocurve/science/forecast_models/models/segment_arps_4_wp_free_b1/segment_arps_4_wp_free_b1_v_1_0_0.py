import numpy as np
from copy import deepcopy
from combocurve.science.forecast_models.shared.parent_model import model_segment_arps_4_parent
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D, arps_D_2_D_eff
from combocurve.science.forecast_models.shared.deterministic_shared import det_pred_segment_arps_4
from combocurve.science.forecast_models.shared.segment_shared import segment_arps_4_paras2seg


class model_segment_arps_4_wp_free_b1(model_segment_arps_4_parent):
    def __init__(self):
        self.model_name = 'segment_arps_4_wp_free_b1'
        self.model_p_name = ['q0', 'D1_eff', 'b1', 'minus_t_elf_t_peak', 'b2', 'D2_eff']
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first', 'minus_t_peak_t0', 'q_peak']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': True}
        self.default_transform_type = 'not_change'
        self.prob_para_direction = None
        self.TC_c8_para_name = ['q_peak', 'b1', 'D1_eff', 'b2']
        self.TC_set_s = {'after_peak': self.TC_set_after_peak, 'before_peak': self.TC_set_before_peak}

        self._segments = [
            {
                'p': [
                    "q0",
                ],
                'transform_type': 'before_peak_only',
            },
            {
                'p': [
                    "D1_eff",
                    "b1",
                    "minus_t_elf_t_peak",
                    "b2",
                    "D2_eff",
                ],
                'transform_type': 'after_peak_only',
            },
        ]

    def func(self, t, p, p_fixed):
        [q0, D1_eff, b1, minus_t_elf_t_peak, b2, D2_eff] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0, q_peak] = p_fixed
        t0 = t_first + minus_t0_t_first
        t_peak = t0 + minus_t_peak_t0
        t_elf = t_peak + minus_t_elf_t_peak
        D1 = arps_D_eff_2_D(D1_eff, b1)
        D2 = arps_D_eff_2_D(D2_eff, b2)

        #q2 = pred_arps(t_elf, t_peak, q_peak, D1, b1)
        ## TODO: need to replace this by the function defined in cc-utils
        #D2 = q_peak / q2 * D1 * np.power(1 + b1 * D1 * (t_elf - t_peak), -(1 / b1 + 1))

        return det_pred_segment_arps_4(t, t0, q0, t_peak, q_peak, b1, D1, t_elf, b2, D2)

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t0 = data[data[:, 1] > 0, 0][0]
        t_first = data[0, 0]
        t_peak = t_peak
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]
        p_fixed = np.array([t_first, t0 - t_first, t_peak - t0, q_peak])

        q0_left = 1e-2
        if q0_left > q_peak:
            q0_left = np.min(transformed_data[:, 1])

        p_range = [(q0_left, q_peak), (1e-5, 1 - 1e-5), (1e-5, 2), (0, np.max(transformed_data[:, 0]) - t_peak),
                   (1e-5, 2), (1e-5, 1 - 1e-5)]
        return p_fixed, p_range, transformed_data

    ############################################################################# prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):

    ############################################################################# convert to semgnets
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
        ### @parameter p2seg_dict: 't_end_life', 'q_final', 'D_lim_eff', 't_end_data'
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        ### make sure the time index are all in order
        [q0, D1_eff, b1, minus_t_elf_t_peak, b2, D2_eff] = p
        [start_idx, minus_t0_t_start, minus_t_peak_t0, q_peak] = p_fixed
        t0 = start_idx + np.max([0, minus_t0_t_start])
        t_peak = t0 + np.max([0, minus_t_peak_t0])
        t_elf = t_peak + np.max([1, minus_t_elf_t_peak])

        D1 = arps_D_eff_2_D(D1_eff, b1)
        D2 = arps_D_eff_2_D(D2_eff, b2)
        t1_end = int(np.floor(t_elf))
        q_elf = pred_arps(t_elf, t_peak, q_peak, D1, b1)
        ## TODO: need to replace this by the function defined in cc-utils
        D_elf = q_peak / q_elf * D1 * np.power(1 + b1 * D1 * (t_elf - t_peak), -(1 / b1 + 1))

        t2_start = t1_end + 1
        end_data_idx = np.max([p2seg_dict['t_end_data'], t2_start])
        life_idx = np.max([end_data_idx, t_end_life])
        q2_start = pred_arps(t2_start, t_elf, q_elf, D_elf, b2)
        #D2 = arps_get_D_delta(D_elf, b2, t2_start - t_elf)

        return segment_arps_4_paras2seg(start_idx, t_end_life, q_final, D_lim_eff, end_data_idx, life_idx, enforce_sw,
                                        t0, q0, t_peak, q_peak, D1_eff, b1, t1_end, D2, b2, t2_start, q2_start)

    def TC_set_before_peak(self, p, p_fixed):
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)
        [t_first, minus_t0_t_first, minus_t_peak_t0, q_peak] = p_fixed
        ret_p[1] = 0.99

        ret_p[3] = 60

        ret_p[2] = 1.1
        ret_p[4] = 1.1

        t0 = t_first + minus_t0_t_first
        t_peak = t0 + minus_t_peak_t0
        t_elf = t_peak + ret_p[3]
        D1 = arps_D_eff_2_D(ret_p[1], ret_p[2])
        q2 = pred_arps(t_elf, t_peak, q_peak, D1, ret_p[2])
        D2 = q_peak / q2 * D1 * np.power(1 + ret_p[2] * D1 * (t_elf - t_peak), -(1 / ret_p[2] + 1))
        ret_p[5] = arps_D_2_D_eff(D2, ret_p[4])

        return ret_p, ret_p_fixed

    def TC_set_after_peak(self, p, p_fixed):
        return self.segment_arps_4_wp_set_after_peak(p, p_fixed)

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        return self.segment_arps_4_wp_buildup(p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit)

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        return self.exp_plus_dec_cum_p2seg(para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict,
                                           p2_seg_para)

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        return self.exp_plus_dec_reach(p, p_fixed, target_eur, p2seg_para, reach_para)
