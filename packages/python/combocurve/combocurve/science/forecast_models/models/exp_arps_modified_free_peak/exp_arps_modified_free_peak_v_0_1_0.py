import numpy as np
from copy import deepcopy
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (exp_D_eff_2_D, pred_arps, pred_exp, exp_D_2_D_eff,
                                                             arps_D_eff_2_D, exp_get_D)
from combocurve.science.forecast_models.shared.segment_shared import get_exp_inc_seg, arps_modified_para2seg
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN

multi_seg = MultipleSegments()


class model_exp_arps_modified_free_peak(model_parent):
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
                    "q0",
                ],
                'transform_type': 'before_peak_only',
            },
            {
                'p': [
                    "D",
                    "b",
                    "q_peak",
                ],
                'transform_type': 'after_peak_only',
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

        p_range = [(q0_left, q_peak), (1e-6, 10), (1e-5, 10), (0.25 * q_peak, 100 * q_peak)]
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
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)
        b = 1.1
        ret_p[2] = b
        D_eff = 0.99
        D = arps_D_eff_2_D(D_eff, b)
        ret_p[1] = D
        return ret_p, ret_p_fixed

    def TC_set_after_peak(self, p, p_fixed):
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)
        ret_p[0] = 1e-7
        ret_p_fixed[1] = 0
        ret_p_fixed[2] = p_fixed[1] + p_fixed[2]
        return ret_p, ret_p_fixed

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        isExp = True
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)
        if sum(p_fixed[:]) != t_peak:
            raise Exception('t_peak does not match fit result')
        if buildup_dict['apply']:
            q_peak = p[3]
            t0 = t_peak - buildup_dict['days']
            if buildup_dict['apply_ratio']:
                q0 = q_peak * buildup_dict['buildup_ratio']
            else:
                q0 = p[0]
                buildup_time = p_fixed[1] + p_fixed[2]
                if buildup_time == 0:
                    q0 = q_peak
                else:
                    if isExp:
                        D0 = np.log(q_peak / q0) / buildup_time
                        q0 = q_peak * np.exp(-D0 * buildup_dict['days'])
                    else:
                        b0 = p[5]
                        D0 = (np.power(q0 / q_peak, b0) - 1) / b0 / buildup_time
                        q0 = q_peak * np.power(1 + b0 * D0 * buildup_dict['days'], 1 / b0)
            ret_p[0] = q0
            ret_p_fixed[0] = t0
            ret_p_fixed[1] = 0
            ret_p_fixed[2] = buildup_dict['days']

        if raito_in_cum_fit:
            ret_p[0] = ret_p_fixed[3] * raito_in_cum_fit

        return ret_p, ret_p_fixed

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        build_ratio = this_p[0] / this_p[3]
        for i in range(len(para_insert_list)):
            if para_insert_list[i]['part'] == 'p':
                this_p[para_insert_list[i]['ind']] = para[i]
            else:
                this_p_fixed[para_insert_list[i]['ind']] = para[i]

        this_p, this_p_fixed = self.TC_buildup(this_p, this_p_fixed, t_peak, buildup_dict, build_ratio)
        return self.p2seg(this_p, this_p_fixed, p2_seg_para)

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        orig_seg = self.p2seg(p, p_fixed, p2seg_para)
        start_idx = p2seg_para['t_first']
        t_end_life = p2seg_para['t_end_life']
        t_end_data = p2seg_para['t_end_data']
        orig_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, orig_seg, 'daily')
        if target_eur == 0:
            this_segments = [multi_seg.get_segment_template('flat')]
            this_segments[0]['start_idx'] = start_idx
            this_segments[0]['end_idx'] = t_end_life
            this_segments[0]['c'] = 0
            this_eur = 0
        else:
            this_multiplier = target_eur / orig_eur
            this_range = [np.min([this_multiplier, 1]), np.max([this_multiplier, 1])]
            for i in range(reach_para['step']):
                this_candidates = np.linspace(this_range[0], this_range[1], reach_para['lin_num'])
                this_cal_eur = np.zeros(this_candidates.shape)
                for j in range(this_candidates.shape[0]):
                    this_multiplier = this_candidates[j]
                    this_p = deepcopy(p)
                    this_p_fixed = deepcopy(p_fixed)
                    this_p[0] = this_p[0] * this_multiplier
                    this_p[3] = this_p[3] * this_multiplier
                    this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)
                    this_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, this_segments, 'daily')
                    this_cal_eur[j] = this_eur

                this_eur_dif = this_cal_eur - target_eur
                pos_idx = np.argwhere(this_eur_dif >= 0).reshape(-1, )
                neg_idx = np.argwhere(this_eur_dif < 0).reshape(-1, )
                if pos_idx.shape[0] > 0 and neg_idx.shape[0] > 0:
                    next_cand_idx = [neg_idx[-1], pos_idx[0]]
                    next_cand = this_candidates[next_cand_idx]
                else:
                    this_eur_dif = np.abs(this_cal_eur - target_eur)
                    next_cand = this_candidates[np.argsort(this_eur_dif)[0:2]]
                this_range = [np.min(next_cand), np.max(next_cand)]

            final_multiplier = this_candidates[np.argmin(np.abs(this_eur_dif))]
            this_p = deepcopy(p)
            this_p_fixed = deepcopy(p_fixed)
            this_p[0] = this_p[0] * final_multiplier
            this_p[3] = this_p[3] * final_multiplier
            this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)
            this_eur = multi_seg.eur(0, start_idx - 10, start_idx, t_end_life, this_segments, 'daily')
        return this_segments
