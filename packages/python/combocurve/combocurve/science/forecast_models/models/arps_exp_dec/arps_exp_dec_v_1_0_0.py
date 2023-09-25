import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import (pred_arps, pred_exp, arps_get_t_end_from_q_end,
                                                             arps_D_eff_2_D, exp_get_t_end_from_q_end, arps_sw)
from combocurve.science.forecast_models.shared.segment_shared import arps_para_2_seg
from scipy.optimize import NonlinearConstraint
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_arps_exp_dec(model_parent):
    def __init__(self):
        self.model_name = 'arps_exp_dec'
        self.model_p_name = ['D_eff', 'b', 'D_lim_eff']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first', 'q_peak']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'  ##dca_plugin_extension
        self.prob_para_direction = {'D_eff': 1, 'b': -1}
        self.prob_para = ['D_eff', 'b']
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ###################################################################################### deterministic fit
    def func(self, t, p, p_fixed):
        [D_eff, b, D_lim_eff] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed

        t_peak = t_first + minus_t_peak_t_first
        D = arps_D_eff_2_D(D_eff, b)
        sw_idx, realized_D_eff_sw, D_exp, D_exp_eff = arps_sw(0, b, D, D_lim_eff, t_peak, 0, 0, True)
        q_sw = pred_arps(sw_idx, t_peak, q_peak, D, b)

        ret_list = np.zeros(t.shape)
        range_0 = (t >= t_peak) & (t < sw_idx)
        range_1 = (t >= sw_idx)
        ret_list[range_0] = pred_arps(t[range_0], t_peak, q_peak, D, b)
        ret_list[range_1] = pred_exp(t[range_1], sw_idx, q_sw, D_exp)

        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        minus_t_peak_t_first = t_peak - t_first
        q_peak = transformed_data[np.argwhere(transformed_data[:, 0] == t_peak)[0, 0], 1]
        p_fixed = [t_first, minus_t_peak_t_first, q_peak]
        p_range = [(1e-6, 1 - 1e-6), (1e-5, 10), (0.01, 0.99)]
        return p_fixed, p_range, transformed_data

    ##################################################################### ml

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
        non_linear_constraints = NonlinearConstraint(lambda x: arps_D_eff_2_D(x[0], x[1]),
                                                     lower_bound,
                                                     upper_bound,
                                                     keep_feasible=True)
        return True, non_linear_constraints

    ################################################################# convert to segments
    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {
            't_end_data': t_end_data_t_end_life['t_end_data'],
            't_end_life': t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final'],
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        ####
        t_end_data = p2seg_dict['t_end_data']
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']

        [D_eff, b, D_lim_eff] = p
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed

        D = arps_D_eff_2_D(D_eff, b)
        t_peak = t_first + max(minus_t_peak_t_first, 0)
        sw_idx, realized_D_eff_sw, D_exp, D_exp_eff = arps_sw(0, b, D, D_lim_eff, t_peak, t_end_data,
                                                              np.max([t_end_data, t_end_life]), True)

        q_sw = pred_arps(sw_idx, t_peak, q_peak, D, b)
        q_end_data = pred_arps(t_end_data, t_peak, q_peak, D, b)

        if q_final >= q_end_data:
            t_final = t_end_data
        else:
            if q_final >= q_sw:
                t_final = int(np.floor(arps_get_t_end_from_q_end(t_peak, q_peak, D, b, q_final)))
            else:
                t_final = int(np.floor(exp_get_t_end_from_q_end(sw_idx, q_sw, D_exp, q_final)))

        t_shut = np.min([t_end_life, t_final])
        t_shut = np.max([t_shut, t_peak])  ## make sure this segment end is at least segment start

        t1_end = int(sw_idx)
        q1_end = pred_arps(t1_end, t_peak, q_peak, D, b)

        t2_start = t1_end + 1
        q2_start = pred_exp(t2_start, sw_idx, q_sw, D_exp)

        if t_shut <= t1_end:
            q_end = pred_arps(t_shut, t_peak, q_peak, D, b)
            first_seg = arps_para_2_seg(t_shut, t_shut, q_end, D, b, t_peak, q_peak)
            return first_seg
        else:
            q_end = pred_exp(t_shut, sw_idx, q_sw, D_exp)
            first_seg = arps_para_2_seg(t1_end, t1_end, q1_end, D, b, t_peak, q_peak)
            #second_seg = exp_para_2_seg(t_shut, t_shut, q_end, D_exp_eff, t2_start, q2_start)
            exp_seg = multi_seg.get_segment_template('exp_dec')
            exp_seg['start_idx'] = t2_start
            exp_seg['end_idx'] = t_shut
            exp_seg['q_start'] = q2_start
            exp_seg['D'] = D_exp
            exp_seg['D_eff'] = D_exp_eff
            exp_seg['q_end'] = q_end
            return first_seg + [exp_seg]
