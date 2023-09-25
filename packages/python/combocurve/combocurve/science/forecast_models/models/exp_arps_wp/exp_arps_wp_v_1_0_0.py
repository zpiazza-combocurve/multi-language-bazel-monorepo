import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_arps, pred_exp, exp_get_D, exp_D_2_D_eff
#from combocurve.science.forecast_models.shared.prob_shared import prob_dtype, one_seg_arps_para_candidates
from combocurve.science.forecast_models.shared.segment_shared import get_exp_inc_seg, arps_para_2_seg


class model_exp_arps_wp(model_parent):
    def __init__(self):
        self.model_name = 'exp_arps_wp'
        self.model_p_name = ['q0', 'D', 'b']
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first', 'minus_t_peak_t0', 'q_peak']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'not_change'
        self.prob_para = ['D', 'b']
        self.prob_para_direction = {'D': 1, 'b': -1}
        self.TC_c8_para_name = None
        self.TC_set_s = None

        self._segments = [
            {
                'p': [
                    "q0",
                ],
                'transform_type': 'before_peak_only',
            },
            {
                'p': [
                    "D",
                    "b",
                ],
                'transform_type': 'after_peak_only',
            },
        ]

    ############################################################################################## deterministic
    def func(self, t, p, p_fixed):
        [q0, D, b] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0, q_peak] = p_fixed

        t0 = t_first + minus_t0_t_first
        t_peak = t0 + minus_t_peak_t0

        ret_list = np.zeros(t.shape)
        range_0 = (t < t_peak)
        range_1 = (t >= t_peak)

        if t_peak == t0:
            D0 = -1
        else:
            D0 = exp_get_D(t0, q0, t_peak, q_peak)

        ret_list[range_0] = pred_exp(t[range_0], t0, q0, D0)
        ret_list[range_1] = pred_arps(t[range_1], t_peak, q_peak, D, b)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t0 = data[data[:, 1] > 0, 0][0]
        t_first = data[0, 0]
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]

        p_fixed = [t_first, t0 - t_first, t_peak - t0, q_peak]

        q0_left = 1e-2
        if q0_left > q_peak:
            q0_left = np.min(transformed_data[:, 1])

        p_range = [(q0_left, q_peak), (1e-6, 10), (1e-5, 10)]
        return p_fixed, p_range, transformed_data

    ########################################################################################### prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):
    #     prob_para = para_dict['prob_para']
    #     n_para = len(prob_para)
    #     sample_num = int(np.power(num, 1 / n_para))
    #     [q0, D, b] = p
    #     return one_seg_arps_para_candidates(prob_para, D, b, para_dict, sample_num)

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
    #     D = p_table[:, 1]
    #     b = p_table[:, 2]
    #     t_first = p_fixed_table[:, 0]
    #     minus_t0_t_first = p_fixed_table[:, 1]
    #     minus_t_peak_t0 = p_fixed_table[:, 2]
    #     q_peak = p_fixed_table[:, 3]
    #     t0 = t_first + minus_t0_t_first
    #     t_peak = t0 + minus_t_peak_t0

    #     ################
    #     t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
    #     ##############
    #     D_mat = np.concatenate([D.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    #     b_mat = np.concatenate([b.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    #     t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    #     q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    #     ###
    #     range_1 = (t_mat >= t_peak_mat)
    #     ###
    #     ret = np.zeros(t_mat.shape, dtype=prob_dtype)
    #     ###
    #     ret[range_1] = q_peak_mat[range_1] * np.power(
    #         1 + b_mat[range_1] * D_mat[range_1] * (t_mat[range_1] - t_peak_mat[range_1]), -1 / b_mat[range_1])
    #     return ret

    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {
            't_end_data': t_end_data_t_end_life['t_end_data'],
            't_end_life': t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final']
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        t_end_data = p2seg_dict['t_end_data']
        q_final = p2seg_dict['q_final']
        #######
        [q0, D, b] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0, q_peak] = p_fixed
        ####### exp
        t0 = t_first + np.max([0, minus_t0_t_first])
        t_peak = t0 + np.max([0, minus_t_peak_t0])

        ret = []
        if t_peak > t0:
            D0 = exp_get_D(t0, q0, t_peak, q_peak)
            D0_eff = exp_D_2_D_eff(D0)
            ret += [get_exp_inc_seg(t0, t_peak, q0, D0, D0_eff)]

        ##### arps part
        arps_seg = arps_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak)
        ret += arps_seg
        return ret

    # def TC_set_before_peak(self, p, p_fixed):

    # def TC_set_after_peak(self, p, p_fixed):

    # def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):

    # def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
