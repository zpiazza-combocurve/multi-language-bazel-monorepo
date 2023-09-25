import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from copy import deepcopy
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_flat(model_parent):
    def __init__(self):
        self.model_name = 'flat'
        self.model_p_name = ['c']
        self.model_p_fixed_name = ['t_first']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': True}
        self.default_transform_type = 'not_change'
        self.prob_para_direction = None
        self.TC_c8_para_name = ['c']
        self.TC_set_s = None  ### explicitly defined in body of fit TC

    def func(self, t, p, p_fixed):
        ret = np.ones(t.shape)
        range_0 = (t < p_fixed[0])
        range_1 = (t > p_fixed[0])
        ret[range_0] = 0
        ret[range_1] = p[0]
        return ret

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        p_fixed = [data[0, 0]]
        p_range = [(np.min(data[:, 1]), np.max(data[:, 1]))]
        transformed_data = data
        return p_fixed, p_range, transformed_data

    ####################################################################################### prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):

    ######################################################################################## convert to segments
    def get_p2seg_dict(self, para_dict, t_first_t_end_life):
        ret = {'t_first': t_first_t_end_life['t_first'], 't_end_life': t_first_t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        flat_seg = multi_seg.get_segment_template('flat')
        flat_seg['start_idx'] = p_fixed[0]
        flat_seg['end_idx'] = np.max([t_end_life, p_fixed[0]])  ## make sure this segment end is at least segment start
        flat_seg['q_start'] = p[0]
        flat_seg['q_end'] = p[0]
        flat_seg['c'] = p[0]
        ret = [flat_seg]
        return ret

    ########################################################################################## TC
    # def TC_set_before_peak(self, p, p_fixed):

    # def TC_set_after_peak(self, p, p_fixed):

    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)

        if buildup_dict['apply']:
            t0 = t_peak - buildup_dict['days']
            ret_p_fixed = [t0]

        return ret_p, ret_p_fixed

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        for i in range(len(para_insert_list)):
            if para_insert_list[i]['part'] == 'p':
                this_p[para_insert_list[i]['ind']] = para[i]
            else:
                this_p_fixed[para_insert_list[i]['ind']] = para[i]

        this_segments = self.p2seg(this_p, this_p_fixed, p2_seg_para)
        return this_segments

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        this_p = deepcopy(p)
        this_p_fixed = deepcopy(p_fixed)
        start_idx = p2seg_para['t_first']
        t_end_life = p2seg_para['t_end_life']
        time = (t_end_life - start_idx + 1)
        this_p[0] = target_eur / time
        new_seg = self.p2seg(this_p, this_p_fixed, p2seg_para)
        return new_seg
