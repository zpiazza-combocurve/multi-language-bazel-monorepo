import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
multi_seg = MultipleSegments()


class func4:
    def T1(self, T1_ret):
        return T1_ret

    def analysis(self, T1_out):
        raw_data = T1_out['raw_data']
        raw_data[np.isnan(raw_data)] = 0
        para_dict = T1_out['para_dict']
        is_deterministic = T1_out['is_deterministic']
        t_end_data = T1_out['t_end_data']
        t_end_life = T1_out['t_end_life']

        percentile = para_dict['percentile']
        percentile_name = ['P' + str(perc) for perc in percentile]

        last_v = raw_data[-1, 1]
        use_i = 0
        for i in range(raw_data.shape[0]):
            this_i = raw_data.shape[0] - i - 1
            this_v = raw_data[this_i, 1]
            if this_v != last_v:
                use_i = this_i + 1
                break

        t_first = raw_data[use_i, 0]
        t_last = np.max([t_end_data, t_end_life])

        segment_type = 'empty'
        this_seg = multi_seg.get_segment_template(segment_type)
        this_seg['start_idx'] = t_first
        this_seg['end_idx'] = t_last
        this_seg['q_start'] = 0
        this_seg['q_end'] = 0

        ret_segments = [this_seg]
        P_dict = {}
        P_dict['best'] = {'segments': ret_segments, 'diagnostics': {}}
        warning = {'status': False, 'message': ''}
        if is_deterministic:
            return {
                'P_dict': P_dict,
                'forecastType': 'rate',
                'forecastSubType': 'flat/zero',
                'warning': warning,
                'ratio': {
                    'segments': [],
                    'diagnostics': {},
                    'basePhase': None,
                    'x': None,
                }
            }
        for perc_name in percentile_name:
            P_dict[perc_name] = {'segments': ret_segments, 'diagnostics': {}}

        return {'P_dict': P_dict, 'forecastType': 'flat/zero', 'warning': warning}

    def T2(self, ana_out):
        for k, v in ana_out['P_dict'].items():
            for elem in v['segments']:
                for kk, vv in elem.items():
                    if type(vv) != str:
                        elem[kk] = float(vv)

        return ana_out

    def body(self, T1_ret):
        return self.T2(self.analysis(self.T1(T1_ret)))
