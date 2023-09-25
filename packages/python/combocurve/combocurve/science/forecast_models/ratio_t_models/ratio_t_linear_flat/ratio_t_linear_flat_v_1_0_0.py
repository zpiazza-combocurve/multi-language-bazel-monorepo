import numpy as np
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import pred_linear, linear_k_2_D_eff
from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_ratio_t_linear_flat(model_parent):
    def __init__(self):
        self.model_name = 'ratio_t_linear_flat'
        self.model_p_name = ['q_start', 'q_end', 't_linear_duration']
        self.model_p_fixed_name = ['t_first']
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': False}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = None
        self.TC_c8_para_name = None  #type curve
        self.TC_set_s = None

    ######################################################################################## deterministic
    def func(self, t, p, p_fixed):
        [q_start, q_end, t_linear_duration] = p
        [t_first] = p_fixed
        ret = np.zeros(t.shape)
        t_linear_end = t_first + t_linear_duration
        range_1 = (t >= t_first) & (t <= t_linear_end)
        range_2 = t > t_linear_end
        if t_linear_end - t_first == 0:
            k = 0
        else:
            k = (q_end - q_start) / (t_linear_end - t_first)
        ret[range_1] = pred_linear(t[range_1], q_start, t_first, k)
        ret[range_2] = q_end

        return ret

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t0, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t0)
        t_first = data[0, 0]

        p_fixed = [t_first]
        q_range = (np.min(data[:, 1]) / 2, np.max(data[:, 1]) * 2)
        p_range = [q_range, q_range, (0, data[-1, 0] - data[0, 0])]
        return p_fixed, p_range, transformed_data

    ########################################################################################### prob

    ############################################################################### convert to segments
    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {'t_end_data': t_end_data_t_end_life['t_end_data'], 't_end_life': t_end_data_t_end_life['t_end_life']}
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        t_end_data = p2seg_dict['t_end_data']

        [q_start, q_end, t_linear_duration] = p
        [t_first] = p_fixed

        t_linear_end = t_linear_duration + t_first

        if t_linear_end - t_first == 0:
            k = 0
        else:
            k = (q_end - q_start) / (t_linear_end - t_first)

        t_linear_end = int(t_linear_end)
        q_end = pred_linear(t_linear_end, q_start, t_first, k)
        D_eff = linear_k_2_D_eff(k, q_start)

        t_shut = np.max([t_end_data, t_end_life, t_linear_end + 1])

        #linear
        this_seg = multi_seg.get_segment_template('linear')
        this_seg['q_start'] = q_start
        this_seg['q_end'] = q_end
        this_seg['start_idx'] = t_first
        this_seg['end_idx'] = t_linear_end
        this_seg['k'] = k
        this_seg['D_eff'] = D_eff
        if k > 0:
            this_seg['slope'] = 1
        elif k == 0:
            this_seg['slope'] = 0
        else:
            this_seg['slope'] = -1

        #flat
        second_seg = multi_seg.get_segment_template('flat')
        second_seg['start_idx'] = t_linear_end + 1
        second_seg['end_idx'] = t_shut
        second_seg['q_start'] = q_end
        second_seg['q_end'] = q_end
        second_seg['c'] = q_end

        ret = [this_seg, second_seg]

        return ret
