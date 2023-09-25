import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D
from combocurve.science.forecast_models.shared.prob_shared import prob_dtype, one_seg_arps_para_candidates
from combocurve.science.forecast_models.shared.segment_shared import arps_para_2_seg
from scipy.optimize import NonlinearConstraint


class model_arps_wp(model_parent):
    def __init__(self):
        self.model_name = 'arps_wp'
        self.model_p_name = ['D_eff', 'b']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first', 'q_peak']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': True, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'  ##dca_plugin_extension
        self.prob_para = ['D_eff', 'b']
        self.prob_para_direction = {'D_eff': 1, 'b': -1}
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ################################################################ deterministic
    def func(self, t, p, p_fixed):
        [D_eff, b] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        t_peak = t_first + minus_t_peak_t_first
        ret_list = np.zeros(t.shape)
        D = arps_D_eff_2_D(D_eff, b)
        range_1 = (t >= t_peak)
        ret_list[range_1] = pred_arps(t[range_1], t_peak, q_peak, D, b)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        minus_t_peak_t_first = t_peak - t_first
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]
        p_fixed = [t_first, minus_t_peak_t_first, q_peak]
        p_range = [(1e-6, 1 - 1e-6), (1e-5, 10)]
        return p_fixed, p_range, transformed_data

    ##################################################################### ml
    def ml_adjust_P_dict(self, ap_data, det, t_peak, use_para_dict, ret_P_dict):
        D_eff_range = use_para_dict['D_eff']
        [P10_D_eff, P10_b] = ret_P_dict['P10']['p']
        [P50_D_eff, P50_b] = ret_P_dict['P50']['p']
        [P90_D_eff, P90_b] = ret_P_dict['P90']['p']
        if ap_data.shape[0] <= 1:
            D_eff_dif = [P90_D_eff - P50_D_eff, P50_D_eff - P10_D_eff]
            max_D_eff_dif = np.min([np.max(D_eff_dif), 0.2])
            P50_D_eff_adjust = P50_D_eff
            P10_D_eff_adjust = self.make_D1_eff_in_range(P50_D_eff_adjust - max_D_eff_dif, D_eff_range)
            P90_D_eff_adjust = self.make_D1_eff_in_range(P50_D_eff_adjust + max_D_eff_dif, D_eff_range)
        else:
            use_para_dict['b'] = [P50_b, P50_b]
            det_range = det.get_range(self.model_name, use_para_dict, 8)
            best_fit_p, best_fit_p_fixed = det.get_params(ap_data,
                                                          t_peak,
                                                          8,
                                                          model_name=self.model_name,
                                                          ranges=det_range)
            [best_fit_D_eff, best_fit_b] = best_fit_p
            ####
            dif = best_fit_D_eff - P50_D_eff
            P50_D_eff_adjust = best_fit_D_eff
            P10_D_eff_adjust = self.make_D1_eff_in_range(P10_D_eff + dif, D_eff_range)
            P90_D_eff_adjust = self.make_D1_eff_in_range(P90_D_eff + dif, D_eff_range)

        ret_P_dict['P50']['p'][0] = P50_D_eff_adjust
        ret_P_dict['P10']['p'][0] = P10_D_eff_adjust
        ret_P_dict['P90']['p'][0] = P90_D_eff_adjust
        return ret_P_dict

    ##################################################################### prob
    def generate_para_candidates(self, p, p_fixed, para_dict, num):
        prob_para = para_dict['prob_para']
        n_para = len(prob_para)
        sample_num = int(np.power(num, 1 / n_para))
        [D_eff, b] = p
        return one_seg_arps_para_candidates(prob_para, D_eff, b, para_dict, sample_num)

    def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
        D_eff = p_table[:, 0]
        b = p_table[:, 1]
        D = arps_D_eff_2_D(D_eff, b)
        t_first = p_fixed_table[:, 0]
        minus_t_peak_t_first = p_fixed_table[:, 1]
        q_peak = p_fixed_table[:, 2]
        t_peak = t_first + minus_t_peak_t_first
        #################
        t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
        ####
        D_mat = np.concatenate([D.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        b_mat = np.concatenate([b.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        ###
        range_1 = (t_mat >= t_peak_mat)
        ###
        ret = np.zeros(t_mat.shape, dtype=prob_dtype)
        ###
        ret[range_1] = q_peak_mat[range_1] * np.power(
            1 + b_mat[range_1] * D_mat[range_1] * (t_mat[range_1] - t_peak_mat[range_1]), -1 / b_mat[range_1])
        #        ret[ret<q_final] = 0
        return ret

    def non_linear_constraints(self, p, p_fixed, para_dict, level):
        #skip the constraint logic for now
        return True, None

        D_range = [arps_D_eff_2_D(para_dict['D_eff'][i], para_dict['b'][i]) for i in range(2)]
        D = arps_D_eff_2_D(p[0], p[1])

        if level == "lower":  ## 50 -> 30 -> 10, new range will be [D_range[0], D],
            ## if D <= D_range[0], then we should use the current result
            if D <= D_range[0]:
                return False, None
            lower_bound = D_range[0]
            upper_bound = D
        else:
            if D >= D_range[1]:
                return False, None
            lower_bound = D
            upper_bound = D_range[1]

        def get_D(x):
            if x[0] >= 0.9999 or x[1] >= 10:
                return 1e30
            elif x[0] <= 0:
                return 1e-30

            return arps_D_eff_2_D(x[0], x[1])

        non_linear_constraints = NonlinearConstraint(get_D, lower_bound, upper_bound, keep_feasible=True)
        return True, non_linear_constraints

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
        [D_eff, b] = p
        D = arps_D_eff_2_D(D_eff, b)
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        t_peak = t_first + minus_t_peak_t_first
        return arps_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak)


################################################################### Penalization, moved to parent_model for simplicity
################################################################### TC
# def TC_set_before_peak(self, p, p_fixed):
# def TC_set_after_peak(self, p, p_fixed):
# def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, TC_model, p2_seg_para):
# def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
