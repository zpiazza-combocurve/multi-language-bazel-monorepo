import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_exp, exp_D_2_D_eff, exp_get_D
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_ratio_t_exp(model_parent):
    def __init__(self):
        self.model_name = 'ratio_t_exp'
        self.model_p_name = ['q0', 'q_end_data']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first', 'minus_t_end_data_t0']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = None
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ######################################################################################## deterministic
    def func(self, t, p, p_fixed):
        [q0, q_end_data] = p
        [t_first, minus_t0_t_first, minus_t_end_data_t0] = p_fixed
        t0 = t_first + minus_t0_t_first
        t_end_data = t0 + minus_t_end_data_t0
        D = exp_get_D(t0, q0, t_end_data, q_end_data)
        ret_list = np.zeros(t.shape)
        range_1 = (t >= t0)
        ret_list[range_1] = pred_exp(t[range_1], t0, q0, D)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t0, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t0)
        t_first = data[0, 0]
        t_end_data = transformed_data[-1, 0]
        minus_t0_t_first = t0 - t_first
        minus_t_end_data_t0 = t_end_data - t0
        p_fixed = [t_first, minus_t0_t_first, minus_t_end_data_t0]
        p_range = [(np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2), (np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2)]
        return p_fixed, p_range, transformed_data

    ########################################################################################### prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):

    ############################################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_end_life):
        ret = {'t_end_life': t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        ##
        [q0, q_end_data] = p
        [t_first, minus_t0_t_first, minus_t_end_data_t0] = p_fixed
        t0 = t_first + minus_t0_t_first
        t_end_data = t0 + minus_t_end_data_t0
        D = exp_get_D(t0, q0, t_end_data, q_end_data)
        D_eff = exp_D_2_D_eff(D)
        t_shut = np.max([t_end_data, t_end_life])
        t_shut = np.max([t_shut, t0])  ## make sure this segment end is at least segment start_idx
        q_shut = pred_exp(t_shut, t0, q0, D)
        if D > 0:
            this_seg = multi_seg.get_segment_template('exp_dec')
        else:
            this_seg = multi_seg.get_segment_template('exp_inc')
        this_seg['q_start'] = q0
        this_seg['q_end'] = q_shut
        this_seg['start_idx'] = t0
        this_seg['end_idx'] = t_shut
        this_seg['D'] = D
        this_seg['D_eff'] = D_eff
        return [this_seg]

    ################################################################################# TC
    # def TC_set_before_peak(self, p, p_fixed):

    # def TC_set_after_peak(self, p, p_fixed):

    # def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):

    # def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, TC_model, p2_seg_para):

    # def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
