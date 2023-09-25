import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D
from combocurve.science.forecast_models.shared.segment_shared import arps_para_2_seg


class model_arps_fulford(model_parent):
    def __init__(self):
        self.model_name = 'arps_fulford'
        self.model_p_name = ['D_eff', 'b']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t_peak_t_first', 'q_peak']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'after_peak_only'  ##dca_plugin_extension

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

    ########################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {
            't_end_data': t_end_data_t_end_life['t_end_data'],
            't_end_life': t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final']
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        # Enforce time stamps are integers.
        t_end_life = int(p2seg_dict['t_end_life'])
        t_end_data = int(p2seg_dict['t_end_data'])
        q_final = p2seg_dict['q_final']
        ##
        [D_eff, b] = p
        D = arps_D_eff_2_D(D_eff, b)
        [t_first, minus_t_peak_t_first, q_peak] = p_fixed
        # Enforce time stampes are integers.
        t_first = int(t_first)
        minus_t_peak_t_first = int(minus_t_peak_t_first)

        t_peak = t_first + minus_t_peak_t_first
        return arps_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak)
