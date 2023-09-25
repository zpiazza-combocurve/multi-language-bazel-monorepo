import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_exp, exp_D_eff_2_D
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_ratio_t_exp_incline(model_parent):
    def __init__(self):
        self.model_name = 'ratio_t_exp_incline'
        self.model_p_name = ['D_eff', 'q0']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 'minus_t0_t_first']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': True, 'type_curve': False}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = None
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ######################################################################################## deterministic
    def func(self, t, p, p_fixed):
        [D_eff, q0] = p
        [t_first, minus_t0_t_first] = p_fixed
        D = exp_D_eff_2_D(D_eff)
        t0 = t_first + minus_t0_t_first
        ret_list = np.zeros(t.shape)

        range_1 = (t >= t0)
        ret_list[range_1] = pred_exp(t[range_1], t0, q0, D)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t0, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t0)
        t_first = data[0, 0]
        minus_t0_t_first = t0 - t_first

        p_fixed = [t_first, minus_t0_t_first]
        p_range = [(-100, -1e-5), (np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2)]
        return p_fixed, p_range, transformed_data

    # ########################################################################################### prob

    ############################################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {'t_end_data': t_end_data_t_end_life['t_end_data'], 't_end_life': t_end_data_t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):

        t_end_life = p2seg_dict['t_end_life']
        t_end_data = p2seg_dict['t_end_data']

        ##
        [D_eff, q0] = p
        [t_first, minus_t0_t_first] = p_fixed
        t0 = t_first + minus_t0_t_first
        D = exp_D_eff_2_D(D_eff)

        t_shut = np.max([t_end_data, t_end_life])
        t_shut = np.max([t_shut, t0])  ## make sure this segment end is at least segment start
        q_shut = pred_exp(t_shut, t0, q0, D)

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
