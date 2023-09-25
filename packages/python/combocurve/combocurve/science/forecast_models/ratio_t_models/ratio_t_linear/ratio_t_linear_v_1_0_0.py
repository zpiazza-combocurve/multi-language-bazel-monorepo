import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_linear, linear_k_2_D_eff
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_ratio_t_linear(model_parent):
    def __init__(self):
        self.model_name = 'ratio_t_linear'
        self.model_p_name = ['q_start', 'q_end_data']  #dca_plugin
        self.model_p_fixed_name = ['t_first', 't_end_data']  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = None
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ######################################################################################## deterministic
    def func(self, t, p, p_fixed):
        [q_start, q_end_data] = p
        [t_first, t_end_data] = p_fixed
        ret = np.zeros(t.shape)
        range_1 = (t >= t_first)
        k = (q_end_data - q_start) / (t_end_data - t_first)
        ret[range_1] = pred_linear(t[range_1], q_start, t_first, k)

        return ret

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t0, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t0)
        t_first = data[0, 0]
        t_end_data = transformed_data[-1, 0]

        p_fixed = [t_first, t_end_data]
        q_range = (np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2)
        p_range = [q_range, q_range]
        return p_fixed, p_range, transformed_data

    ########################################################################################### prob

    ############################################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_end_life):
        ret = {'t_end_life': t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']

        [q0, q_end_data] = p
        [t_first, t_end_data] = p_fixed
        k = (q_end_data - q0) / (t_end_data - t_first)

        t_q_end = float('inf')
        if k < 0:
            t_q_end = int(np.floor(-q0 / k) + t_first)

        t_shut = np.min([np.max([t_end_data, t_end_life]), t_q_end])
        t_shut = np.max([t_shut, t_first])  ## make sure this segment end is at least segment start

        q_shut = pred_linear(t_shut, q0, t_first, k)
        D_eff = linear_k_2_D_eff(k, q0)

        this_seg = multi_seg.get_segment_template('linear')
        this_seg['q_start'] = q0
        this_seg['q_end'] = q_shut
        this_seg['start_idx'] = t_first
        this_seg['end_idx'] = t_shut
        this_seg['k'] = k
        this_seg['D_eff'] = D_eff

        if k > 0:
            this_seg['slope'] = 1
        elif k == 0:
            this_seg['slope'] = 0
        else:
            this_seg['slope'] = -1
        return [this_seg]

    ################################################################################# TC
