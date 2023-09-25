import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D
from combocurve.science.forecast_models.shared.segment_shared import arps_inc_para_2_seg


class model_arps_inc(model_parent):
    def __init__(self):
        self.model_name = 'arps_inc'
        self.model_p_name = ['q_first', 'D_eff', 'b']  #dca_plugin
        self.model_p_fixed_name = ['t_first']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': True}
        self.default_transform_type = 'not_change'
        self.prob_para = ['D_eff', 'b']
        self.prob_para_direction = {'D_eff': 1, 'b': -1}
        self.TC_c8_para_name = ['q_first', 'D_eff', 'b']  #type curve
        self.TC_set_s = {'after_peak': self.TC_set_after_peak, 'before_peak': self.TC_set_before_peak}

    ################################################################ deterministic
    def func(self, t, p, p_fixed):
        [q_first, D_eff, b] = p
        [t_first] = p_fixed

        ret_list = np.zeros(t.shape)
        D = arps_D_eff_2_D(D_eff, b)
        range_1 = (t >= t_first)
        ret_list[range_1] = pred_arps(t[range_1], t_first, q_first, D, b)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)
        t_first = data[0, 0]
        p_fixed = [t_first]
        p_range = [(np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2), (1e-6 - 10000, -1e-6), (-10, -1e-5)]
        return p_fixed, p_range, transformed_data

    ##################################################################### ml not in use
    ##################################################################### prob

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
        [q_first, D_eff, b] = p
        D = arps_D_eff_2_D(D_eff, b)
        [t_first] = p_fixed

        return arps_inc_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_first, q_first)

    ##################################################################### TC
    def TC_set_before_peak(self, p, p_fixed):
        return p, p_fixed

    def TC_set_after_peak(self, p, p_fixed):
        return p, p_fixed

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        return p, p_fixed

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        return self.p2seg(this_p, this_p_fixed, p2_seg_para)

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        return self.arps_inc_reach(p, p_fixed, target_eur, p2seg_para, reach_para)
