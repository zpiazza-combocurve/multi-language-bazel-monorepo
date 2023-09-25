import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import (exp_D_eff_2_D, pred_arps, pred_exp,
                                                             arps_get_idx_from_D_new, arps_get_D_delta, exp_D_2_D_eff,
                                                             arps_D_eff_2_D)
from combocurve.science.forecast_models.shared.segment_shared import arps_modified_para2seg
from combocurve.science.core_function.error_funcs import mean_residual_normal_ll
from combocurve.science.core_function.penalization import b_prior_penalty


class model_arps_modified_fp_fulford(model_parent):
    def __init__(self):
        self.model_name = 'arps_modified_fp_fulford'
        self.model_p_name = ['D_eff', 'b', 'q_peak']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'  ##dca_plugin_extension
        self.prob_para = ['D_eff', 'b']
        self.prob_para_direction = {'D_eff': 1, 'b': -1}
        self.TC_c8_para_name = None
        self.TC_set_s = None

    ###################################################################################### deterministic fit
    def func(self, t, p, p_fixed):
        [D_eff, b, q_peak] = p
        [t_first, minus_t_peak_t_first] = p_fixed

        t_peak = t_first + minus_t_peak_t_first
        D = arps_D_eff_2_D(D_eff, b)
        ret_list = np.zeros(t.shape)

        range_1 = (t >= t_peak)
        ret_list[range_1] = pred_arps(t[range_1], t_peak, q_peak, D, b)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        minus_t_peak_t_first = t_peak - t_first

        p_fixed = [t_first, minus_t_peak_t_first]
        p_range = [(1e-6, 1 - 1e-6), (1e-5, 10), (np.min(data[:, 1]), np.max(data[:, 1]) * 2)]
        return p_fixed, p_range, transformed_data

    ###################################################################################### convert to segments

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
        end_data_idx = p2seg_dict['t_end_data']
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']

        [D_eff, b, q_peak] = p
        [t_first, minus_t_peak_t_first] = p_fixed
        D = arps_D_eff_2_D(D_eff, b)
        t_peak = t_first + minus_t_peak_t_first
        return arps_modified_para2seg(end_data_idx, t_end_life, q_final, D_lim_eff, enforce_sw, D, b, t_peak, q_peak)

    ################################################################### match eur functions

    def get_match_eur_candidates(self, para_dict, p2seg_dict, filtered_data):

        num_vec_b = max(int((para_dict['b'][1] - para_dict['b'][0]) / 0.05), 1)
        vec_b = np.linspace(para_dict['b'][0], para_dict['b'][1], num=num_vec_b)
        num_vec_D_eff = max(int((para_dict['D_eff'][1] - para_dict['D_eff'][0]) / 0.01), 1)
        vec_D_eff = np.linspace(para_dict['D_eff'][0], para_dict['D_eff'][1], num=num_vec_D_eff)

        vec_q_peak_range = max(int(np.max(filtered_data[:, 1]) * 1.1 - np.min(filtered_data[:, 1]) * 0.9), 15)
        num_vec_q_peak = min(100, vec_q_peak_range)

        vec_q_peak = np.exp(
            np.linspace(np.log(np.min(filtered_data[:, 1]) * 0.9 + 0.1),
                        np.log(np.max(filtered_data[:, 1]) * 1.1 + 0.1),
                        num=num_vec_q_peak))

        [b_matrix, D_eff_matrix, q_peak_matrix] = np.meshgrid(vec_b, vec_D_eff, vec_q_peak)
        b = b_matrix.flatten()
        D_eff = D_eff_matrix.flatten()
        q_peak = q_peak_matrix.flatten()

        return [D_eff, b, q_peak]

    def calc_eurs(self, left_idx, right_idx, t_peak, q_peak, p_candidates, p2seg_dict):
        end_data_idx = p2seg_dict['t_end_data']
        t_end_life = p2seg_dict['t_end_life']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']

        life_idx = np.max([end_data_idx, t_end_life])

        D_eff = p_candidates[0]
        b = p_candidates[1]
        q_peak = p_candidates[2]

        length = b.shape[0]
        D_lim = exp_D_eff_2_D(D_lim_eff)

        sw_idx = np.zeros(length)
        D_exp = np.zeros(length)
        D_exp_eff = np.zeros(length)
        D_sw = np.zeros(length)
        D_lim_mask = (D_lim == 0) | (D_lim_eff == 0)
        sw_idx[D_lim_mask] = sw_idx[D_lim_mask] + 300000 + life_idx

        if enforce_sw:
            idx_last = t_peak
        else:
            idx_last = np.max([end_data_idx, t_peak])

        D = arps_D_eff_2_D(D_eff, b)
        D_last = arps_get_D_delta(D, b, idx_last - t_peak)

        D_last_D_lim_mask = (D_last > D_lim) & ~D_lim_mask
        sw_idx[D_last_D_lim_mask] = arps_get_idx_from_D_new(t_peak, D, D_lim, b)[D_last_D_lim_mask]
        sw_idx[~D_last_D_lim_mask] = idx_last

        D_sw[~D_lim_mask] = arps_get_D_delta(D, b, sw_idx - t_peak)[~D_lim_mask]
        D_exp = D_sw
        D_exp_eff[~D_lim_mask] = exp_D_2_D_eff(D_exp)[~D_lim_mask]
        q_sw = pred_arps(sw_idx, t_peak, q_peak, D, b)

        ret = np.zeros(length)

        arps_idx_0 = np.minimum(left_idx, sw_idx)
        arps_idx_1 = np.minimum(right_idx, sw_idx)
        arps_idx_mask = arps_idx_0 < arps_idx_1
        arps_q_0 = pred_arps(arps_idx_0, t_peak, q_peak, D, b)
        arps_q_1 = pred_arps(arps_idx_1, t_peak, q_peak, D, b)
        b_mask = b != 1

        ## TODO: need to replace this by the function defined in cc-utils
        ret[arps_idx_mask & b_mask] += (np.power(q_peak, b) / (1 - b) / D *
                                        (np.power(arps_q_0, 1 - b) - np.power(arps_q_1, 1 - b)))[arps_idx_mask & b_mask]
        ret[arps_idx_mask
            & ~b_mask] += (
                q_peak / D *
                (np.log(1 + D * (arps_idx_1 - t_peak)) - np.log(1 + D * (arps_idx_0 - t_peak))))[arps_idx_mask
                                                                                                 & ~b_mask]

        exp_idx_0 = np.maximum(left_idx, sw_idx)
        exp_idx_1 = np.maximum(right_idx, sw_idx)
        exp_idx_mask = exp_idx_0 < exp_idx_1

        def f_exp(x):
            return q_sw * np.exp(-D_exp * (x - sw_idx))

        ## TODO: need to replace this by the function defined in cc-utils
        ret[exp_idx_mask] += ((pred_exp(exp_idx_0, sw_idx, q_sw, D_exp) - pred_exp(exp_idx_1, sw_idx, q_sw, D_exp))
                              / D_exp)[exp_idx_mask]

        return ret

    def get_fit_from_eurs(self, eurs_combo, data, t_peak, q_peak, para_dict, b_prior=None, b_strength='Low'):
        compare_mask = data[:, 0] >= t_peak
        compare_x = data[compare_mask, 0]
        fit_errors = []

        # Unnecessary w/ Fulford method.
        # data_points = data.shape[0]

        # if data.shape[0] > 0:
        #     time_range = data[-1][0] - data[0][0]
        # else:
        #     time_range = 0

        for pair in eurs_combo:
            this_D_eff = pair[1]
            this_b = pair[2]
            this_q_peak = pair[3]
            this_p = [this_D_eff, this_b, this_q_peak]
            this_p_fixed = [t_peak, 0]

            plt_y = self.predict(compare_x, this_p, this_p_fixed)
            # We're moving to the Fulford method w/ b priors.
            # error = errorfunc_s[error_type](data[compare_mask, 1], plt_y)
            # error = b_penalty_quartic(error, this_p, this_p_fixed, 1, para_dict['b'], data_points, time_range)
            error = mean_residual_normal_ll(data[compare_mask, 1], plt_y)
            if b_prior is None:
                b_prior = sum(para_dict['b']) / len(para_dict['b'])
            error += b_prior_penalty(p=pair,
                                     b_idx=2,
                                     b_range=para_dict['b'],
                                     b_prior=b_prior,
                                     b_strength=b_strength,
                                     is_fixed_peak=False)
            fit_errors.append(error)

        best_index = np.argmin(fit_errors)
        best_eur, best_D_eff, best_b, best_q_peak = eurs_combo[best_index, :]
        best_p = [best_D_eff, best_b, best_q_peak]
        best_p_fixed = [t_peak, 0]
        return best_eur, best_p, best_p_fixed
