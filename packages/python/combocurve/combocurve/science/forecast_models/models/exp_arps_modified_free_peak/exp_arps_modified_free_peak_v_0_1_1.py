import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_segment_arps_4_parent
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (exp_D_eff_2_D, pred_arps, pred_exp, exp_D_2_D_eff,
                                                             arps_D_eff_2_D, exp_get_D)
from combocurve.science.forecast_models.shared.segment_shared import get_exp_inc_seg, arps_modified_para2seg
from combocurve.science.type_curve.TC_helper import get_default_q_peak_bounds
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN

multi_seg = MultipleSegments()


class model_exp_arps_modified_free_peak(model_segment_arps_4_parent):
    def __init__(self):
        self.model_name = 'exp_arps_modified_free_peak'
        self.model_p_name = ['q0', 'D', 'b', 'q_peak']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first', 'minus_t_peak_t0']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': True}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = {'D': 1, 'b': -1}
        self.prob_para = ['D', 'b']
        self.TC_c8_para_name = ['q_peak', 'D', 'b']
        self.TC_set_s = {'after_peak': self.TC_set_after_peak, 'before_peak': self.TC_set_before_peak}

        self._segments = [
            {
                'p': [
                    "D",
                    "b",
                    "q_peak",
                ],
                'transform_type': 'after_peak_only',
            },
            {
                'p': [
                    "q0",
                ],
                'transform_type': 'before_peak_wp',
            },
        ]

    ######################################################## determinisitc
    def func(self, t, p, p_fixed):
        [q0, D, b, q_peak] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0] = p_fixed

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

        p_fixed = [t_first, t0 - t_first, t_peak - t0]

        q0_left = 1e-2
        if q0_left > q_peak:
            q0_left = np.min(transformed_data[:, 1])

        p_range = [
            (q0_left, q_peak),
            (1e-6, 10),
            (1e-5, 10),
            get_default_q_peak_bounds(q_peak),
        ]
        return p_fixed, p_range, transformed_data

    ######################################################################## prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):
    #     prob_para = para_dict['prob_para']
    #     n_para = len(prob_para)
    #     sample_num = int(np.power(num, 1 / n_para))
    #     [q0, D, b] = p
    #     return one_seg_arps_para_candidates(prob_para, D, b, para_dict, sample_num)

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
    #     pred_exp_arps_wp_para_candidates(t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life)

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
        end_data_idx = p2seg_dict['t_end_data']
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        #######
        [q0, D, b, q_peak] = p
        [t_first, minus_t0_t_first, minus_t_peak_t0] = p_fixed
        ####### exp
        t0 = t_first + np.max([0, minus_t0_t_first])
        t_peak = t0 + np.max([0, minus_t_peak_t0])

        ret = []
        if t_peak > t0:
            D0 = exp_get_D(t0, q0, t_peak, q_peak)
            D0_eff = exp_D_2_D_eff(D0)

            # Ensure that the decline for the exponential portion doesn't shoot off to infinity
            adjusted_D0_eff = False

            if D0_eff > D_EFF_MAX:
                D0_eff = D_EFF_MAX
                adjusted_D0_eff = True
            elif D0_eff < D_EFF_MIN:
                D0_eff = D_EFF_MIN
                adjusted_D0_eff = True

            # Recalculate the D0 and q0 if new effective decline rate.
            if adjusted_D0_eff:
                D0 = exp_D_eff_2_D(D0_eff)
                q0 = pred_exp(t0, t_peak, q_peak, D0)

            ret += [get_exp_inc_seg(t0, t_peak, q0, D0, D0_eff)]

        ##### arps part

        arps_modified_seg = arps_modified_para2seg(end_data_idx, t_end_life, q_final, D_lim_eff, enforce_sw, D, b,
                                                   t_peak, q_peak)
        ret += arps_modified_seg
        return ret

    ######################################################################################### TC

    def TC_set_before_peak(self, p, p_fixed):
        b = 1.1
        ret_p, ret_p_fixed = self.set_parameter(p, p_fixed, 'b', b)
        D_eff = 0.99
        D = arps_D_eff_2_D(D_eff, b)
        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'D', D)
        return ret_p, ret_p_fixed

    def TC_set_after_peak(self, p, p_fixed):
        ret_p, ret_p_fixed = self.deepcopy_parameters(p, p_fixed)

        original_parameters = self.get_parameters_as_dict(p, p_fixed)
        original_minus_t0_t_first = original_parameters['minus_t0_t_first']
        original_minus_t_peak_t0 = original_parameters['minus_t_peak_t0']
        original_minus_t_peak_t_first = original_minus_t0_t_first + original_minus_t_peak_t0

        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'q0', 1e-7)
        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'minus_t0_t_first', 0)
        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'minus_t_peak_t0', original_minus_t_peak_t_first)

        return ret_p, ret_p_fixed

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        return self.segment_arps_4_wp_buildup(p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit)

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        return self.exp_plus_dec_cum_p2seg(
            para,
            this_p,
            this_p_fixed,
            para_insert_list,
            t_peak,
            buildup_dict,
            p2_seg_para,
        )

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        return self.exp_plus_dec_reach(p, p_fixed, target_eur, p2seg_para, reach_para)
