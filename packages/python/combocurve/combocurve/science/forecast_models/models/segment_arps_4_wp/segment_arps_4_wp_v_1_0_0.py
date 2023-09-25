import numpy as np
import pandas as pd
from combocurve.science.forecast_models.shared.parent_model import model_segment_arps_4_parent
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D, arps_get_D_delta
from combocurve.science.forecast_models.shared.deterministic_shared import det_pred_segment_arps_4
from combocurve.science.forecast_models.shared.prob_shared import prob_dtype, generate_edge_heavy_flat_distribution
from combocurve.science.forecast_models.shared.segment_shared import segment_arps_4_paras2seg


class model_segment_arps_4_wp(model_segment_arps_4_parent):
    def __init__(self):
        self.model_name = 'segment_arps_4_wp'
        self.model_p_name = ['q0', 'D1_eff', 'minus_t_elf_t_peak', 'b2']
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first', 'minus_t_peak_t0', 'q_peak']
        self.registration = {'rate': True, 'probabilistic': True, 'type_curve': True}
        self.default_transform_type = 'not_change'
        self.prob_para = ['D1_eff', 'b2']
        self.prob_para_direction = {'D1_eff': 1, 'b2': -1}
        self.TC_c8_para_name = ['q_peak', 'D1_eff', 'b2']
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
                    "minus_t_elf_t_peak",
                    "b2",
                ],
                'transform_type': 'after_peak_only',
            },
        ]

    def func(self, t, p, p_fixed):
        [q0, D1_eff, minus_t_elf_t_peak, b2] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0, q_peak] = p_fixed
        t0 = t_first + minus_t0_t_first
        t_peak = t0 + minus_t_peak_t0
        t_elf = t_peak + minus_t_elf_t_peak
        b1 = 2
        D1 = arps_D_eff_2_D(D1_eff, b1)

        q2 = pred_arps(t_elf, t_peak, q_peak, D1, b1)
        ## TODO: need to replace this by the function defined in cc-utils
        D2 = q_peak / q2 * D1 * np.power(1 + b1 * D1 * (t_elf - t_peak), -(1 / b1 + 1))
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

        p_range = [(q0_left, q_peak), (1e-5, 1 - 1e-5), (0, np.max(transformed_data[:, 0]) - t_peak), (1e-5, 2)]
        return p_fixed, p_range, transformed_data

    ####################################################################################### ml
    def ml_adjust_P_dict(self, ap_data, det, t_peak, use_para_dict, ret_P_dict):
        D_eff_range = use_para_dict['D1_eff']
        D_idx = 1
        Linear_idx = 2
        if ap_data.shape[0] >= 1:
            [q0, D1_eff, minus_t_elf_t_peak, b2] = ret_P_dict['P50']['p']
            use_para_dict['q0'] = [q0, q0]
            minus_t_elf_t_peak_range = use_para_dict.get('minus_t_elf_t_peak')
            if minus_t_elf_t_peak_range and (minus_t_elf_t_peak < minus_t_elf_t_peak_range[0]
                                             or minus_t_elf_t_peak > minus_t_elf_t_peak_range[1]):
                use_para_dict['minus_t_elf_t_peak'] = minus_t_elf_t_peak_range
            else:
                use_para_dict['minus_t_elf_t_peak'] = [minus_t_elf_t_peak, minus_t_elf_t_peak]
            use_para_dict['b2'] = [b2, b2]
            det_range = det.get_range(self.model_name, use_para_dict, 8)
            best_fit_p, best_fit_p_fixed = det.get_params(ap_data,
                                                          t_peak,
                                                          8,
                                                          model_name=self.model_name,
                                                          ranges=det_range)
            best_fit_D_eff = best_fit_p[D_idx]
            orig_P50_D_eff = ret_P_dict['P50']['p'][D_idx]
            dif = best_fit_D_eff - orig_P50_D_eff
            ret_P_dict['P50']['p'][D_idx] = best_fit_D_eff
            ret_P_dict['P10']['p'][D_idx] = self.make_D1_eff_in_range(ret_P_dict['P10']['p'][D_idx] + dif, D_eff_range)
            ret_P_dict['P90']['p'][D_idx] = self.make_D1_eff_in_range(ret_P_dict['P90']['p'][D_idx] + dif, D_eff_range)

            ret_P_dict['P50']['p'][Linear_idx] = best_fit_p[Linear_idx]
            ret_P_dict['P10']['p'][Linear_idx] = best_fit_p[Linear_idx]
            ret_P_dict['P90']['p'][Linear_idx] = best_fit_p[Linear_idx]
        return ret_P_dict

    ####################################################################################### prob
    def generate_para_candidates(self, p, p_fixed, para_dict, num):
        prob_para = para_dict['prob_para']
        para_fit = self.generate_para_fit(para_dict)
        n_para = len(prob_para)
        sample_num = int(np.power(num, 1 / n_para))
        ret_dict = {}

        for i, name in enumerate(prob_para):
            p_ind = para_fit[i]['ind']
            this_para = p[p_ind]

            # this_para_paras = generate_flat_distribution(para_dict[name], this_para, num)
            this_para_paras = generate_edge_heavy_flat_distribution(para_dict[name], this_para, sample_num)
            ret_dict[para_fit[i]['name']] = this_para_paras
        # return pd.DataFrame(ret_dict)[prob_para]
        store_list = []
        for name in prob_para:
            store_list += [ret_dict[name]]

        mesh_items = np.meshgrid(*store_list)
        ret = {}
        for i, name in enumerate(prob_para):
            ret[name] = mesh_items[i].flatten()
        return pd.DataFrame(ret)[prob_para]

    def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
        ###
        D1_eff = p_table[:, 1]
        b1 = 2
        D1 = arps_D_eff_2_D(D1_eff, b1)
        minus_t_elf_t_peak = p_table[:, 2]
        b2 = p_table[:, 3]
        t_first = p_fixed_table[:, 0]
        minus_t0_t_first = p_fixed_table[:, 1]
        minus_t_peak_t0 = p_fixed_table[:, 2]
        q_peak = p_fixed_table[:, 3]
        t0 = t_first + minus_t0_t_first
        t_peak = t0 + minus_t_peak_t0
        t_elf = t_peak + minus_t_elf_t_peak
        #################

        q_elf = pred_arps(t_elf, t_peak, q_peak, D1, b1)
        ## TODO: need to replace this by the function defined in cc-utils
        D2 = q_peak / q_elf * D1 * np.power(1 + b1 * D1 * (t_elf - t_peak), -(1 / b1 + 1))
        ################
        t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
        ####
        D1_mat = np.concatenate([D1.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        t_elf_mat = np.concatenate([t_elf.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        q_elf_mat = np.concatenate([q_elf.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        b2_mat = np.concatenate([b2.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        D2_mat = np.concatenate([D2.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
        ###
        range_1 = (t_mat >= t_peak_mat) & (t_mat < t_elf_mat)
        range_2 = (t_mat >= t_elf_mat)
        ###
        ret = np.zeros(t_mat.shape, dtype=prob_dtype)
        ###
        ret[range_1] = pred_arps(t_mat[range_1], t_peak_mat[range_1], q_peak_mat[range_1], D1_mat[range_1], b1)
        ret[range_2] = pred_arps(t_mat[range_2], t_elf_mat[range_2], q_elf_mat[range_2], D2_mat[range_2],
                                 b2_mat[range_2])

        return ret

    def non_linear_constraints(self, p, p_fixed, para_dict, level):
        return True, None

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
        t_end_life = p2seg_dict['t_end_life']

        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        ### make sure the time index are all in order
        [q0, D1_eff, minus_t_elf_t_peak, b2] = p
        [start_idx, minus_t0_t_start, minus_t_peak_t0, q_peak] = p_fixed
        t0 = start_idx + np.max([0, minus_t0_t_start])
        t_peak = t0 + np.max([0, minus_t_peak_t0])
        t_elf = t_peak + np.max([1, minus_t_elf_t_peak])
        b1 = 2
        D1 = arps_D_eff_2_D(D1_eff, b1)
        t1_end = int(np.floor(t_elf))
        q_elf = pred_arps(t_elf, t_peak, q_peak, D1, b1)
        D_elf = arps_get_D_delta(D1, b1, t_elf - t_peak)

        t2_start = t1_end + 1
        end_data_idx = np.max([p2seg_dict['t_end_data'], t2_start])
        life_idx = np.max([end_data_idx, t_end_life])
        q2_start = pred_arps(t2_start, t_elf, q_elf, D_elf, b2)
        D2 = arps_get_D_delta(D_elf, b2, t2_start - t_elf)

        return segment_arps_4_paras2seg(start_idx, t_end_life, q_final, D_lim_eff, end_data_idx, life_idx, enforce_sw,
                                        t0, q0, t_peak, q_peak, D1_eff, b1, t1_end, D2, b2, t2_start, q2_start)

    ########################################################################################## TC
    def TC_set_before_peak(self, p, p_fixed):
        return self.segment_arps_4_wp_set_before_peak(p, p_fixed)

    def TC_set_after_peak(self, p, p_fixed):
        return self.segment_arps_4_wp_set_after_peak(p, p_fixed)

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        return self.segment_arps_4_wp_buildup(p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit)

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        return self.exp_plus_dec_cum_p2seg(para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict,
                                           p2_seg_para)

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        return self.exp_plus_dec_reach(p, p_fixed, target_eur, p2seg_para, reach_para)
