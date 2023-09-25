import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_exp, exp_D_eff_2_D
from combocurve.science.forecast_models.shared.prob_shared import prob_dtype
from combocurve.science.forecast_models.shared.segment_shared import exp_para_2_seg

ZERO_THRESHOLD = 1e-10


class model_exp_wp(model_parent):
    def __init__(self):
        self.model_name = 'exp_wp'
        self.model_p_name = ['D_eff']
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first', 'q_peak']
        self.registration = {'rate': True, 'probabilistic': True, 'type_curve': True}
        self.default_transform_type = 'after_peak_only'
        self.prob_para_direction = {'D_eff': 1}
        self.prob_para = ['D_eff']
        self.TC_c8_para_name = None
        self.TC_set_s = None

    ############################################################################# determinisitc
    def func(self, t, p, p_fixed):
        [D_eff] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        D = exp_D_eff_2_D(D_eff)
        t_peak = t_first + minus_t_peak_t_first
        ret_list = np.zeros(t.shape)

        range_1 = (t >= t_peak)
        nonzero_q_peak = max(ZERO_THRESHOLD, q_peak)
        ret_list[range_1] = pred_exp(t[range_1], t_peak, nonzero_q_peak, D)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        minus_t_peak_t_first = t_peak - t_first
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]
        p_fixed = [t_first, minus_t_peak_t_first, q_peak]
        p_range = [(1e-5, 1 - 1e-5)]
        return p_fixed, p_range, transformed_data

    ############################################################################################# ml
    def ml_adjust_P_dict(self, ap_data, det, t_peak, use_para_dict, ret_P_dict):
        D_eff_range = use_para_dict['D_eff']
        D_idx = 0
        D_eff_dif = [
            ret_P_dict['P90']['p'][D_idx] - ret_P_dict['P50']['p'][D_idx],
            ret_P_dict['P50']['p'][D_idx] - ret_P_dict['P10']['p'][D_idx]
        ]
        max_D_eff_dif = np.min([np.max(D_eff_dif), 0.2])
        if ap_data.shape[0] > 1:

            det_range = det.get_range(self.model_name, use_para_dict, 8)
            best_fit_p, best_fit_p_fixed = det.get_params(ap_data,
                                                          t_peak,
                                                          8,
                                                          model_name=self.model_name,
                                                          ranges=det_range)
            best_fit_D_eff = best_fit_p[0]
            ret_P_dict['P50']['p'][0] = best_fit_D_eff

        ret_P_dict['P10']['p'][0] = self.make_D1_eff_in_range(ret_P_dict['P50']['p'][0] - max_D_eff_dif, D_eff_range)
        ret_P_dict['P90']['p'][0] = self.make_D1_eff_in_range(ret_P_dict['P50']['p'][0] + max_D_eff_dif, D_eff_range)
        return ret_P_dict

    ############################################################################################# prob
    def generate_para_candidates(self, p, p_fixed, para_dict, num):
        return self.single_exp_dec_para_candidates(p, p_fixed, para_dict, num)

    def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
        D_eff = p_table[:, 0]
        D = exp_D_eff_2_D(D_eff)
        t_first = p_fixed_table[:, 0]
        minus_t_peak_t_first = p_fixed_table[:, 1]
        q_peak = p_fixed_table[:, 2]
        t_peak = t_first + minus_t_peak_t_first
        #################
        t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
        ####
        D_mat = np.concatenate([D.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        ###
        range_1 = (t_mat >= t_peak_mat)
        ###
        ret = np.zeros(t_mat.shape, dtype=prob_dtype)
        ###
        ret[range_1] = q_peak_mat[range_1] * np.exp(-D_mat[range_1] * (t_mat[range_1] - t_peak_mat[range_1]))
        #        ret[ret<q_final] = 0
        return ret

    def non_linear_constraints(self, p, p_fixed, para_dict, level):
        return True, None

    ################################################################# convert to segments
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

        ##
        [D_eff] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        t_peak = t_first + minus_t_peak_t_first
        nonzero_q_peak = max(ZERO_THRESHOLD, q_peak)
        return exp_para_2_seg(t_end_life, t_end_data, q_final, D_eff, t_peak, nonzero_q_peak)

    ###################################################################### TC
    # def TC_set_before_peak(self, p, p_fixed):

    # def TC_set_after_peak(self, p, p_fixed):

    # def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):

    # def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, TC_model, p2_seg_para):

    # def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
