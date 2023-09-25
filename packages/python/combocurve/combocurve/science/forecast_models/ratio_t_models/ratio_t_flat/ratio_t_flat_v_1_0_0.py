import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_ratio_t_flat(model_parent):
    def __init__(self):
        self.model_name = 'ratio_t_flat'
        self.model_p_name = ['c']
        self.model_p_fixed_name = ['t_first']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'not_change'  ###not sure
        self.prob_para_direction = None
        self.TC_c8_para_name = None
        self.TC_set_s = None

    ######################################################################################## deterministic
    def func(self, t, p, p_fixed):
        ret = np.ones(t.shape)
        range_0 = (t < p_fixed[0])
        range_1 = (t >= p_fixed[0])
        ret[range_0] = 0
        ret[range_1] = p[0]
        return ret

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t0, transformation, p2seg_dict=None):
        p_fixed = [data[0, 0]]
        p_range = [(np.min(data[:, 1]), np.max(data[:, 1]))]
        transformed_data = data
        return p_fixed, p_range, transformed_data

    ########################################################################################### prob

    ############################################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_first_t_end_life):
        ret = {'t_first': t_first_t_end_life['t_first'], 't_end_life': t_first_t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']

        this_seg = multi_seg.get_segment_template('flat')
        this_seg['start_idx'] = p_fixed[0]
        this_seg['end_idx'] = np.max([t_end_life, p_fixed[0]])  ## make sure this segment end is at least segment start

        this_seg['q_start'] = p[0]
        this_seg['q_end'] = p[0]
        this_seg['c'] = p[0]
        return [this_seg]

    ################################################################################# TC
