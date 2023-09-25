import numpy as np
from combocurve.science.core_function.skeleton_prob import get_prob
from combocurve.science.forecast_models.model_manager import mm


class func3:
    def T1(self, f1_ret):
        return f1_ret

    def analysis(self, T1_out):
        data_freq = T1_out['data_freq']
        filtered_data = T1_out['filtered_data']
        t_peak = T1_out['t_peak']
        best_p = T1_out['fit']['p']
        best_p_fixed = T1_out['fit']['p_fixed']
        para_dict = T1_out['para_dict']
        model_name = para_dict['model_name']
        t_end_life = T1_out['t_end_life']

        this_model = mm.models[model_name]
        np.random.seed(1)

        para_candidates = this_model.generate_para_candidates(best_p, best_p_fixed, para_dict, 1000)
        prob = get_prob()
        prob.set_freq(data_freq)
        prob.set_seed(1)

        P_dict = prob.get_percentile(filtered_data, model_name, t_peak, best_p, best_p_fixed, para_candidates,
                                     t_end_life, para_dict)

        p2seg_dict = this_model.get_p2seg_dict(para_dict, T1_out)

        if T1_out['first_peak']:
            plot_idx = T1_out['t_first_valid_data']
        else:
            plot_idx = T1_out['t_peak']

        ret_dict = {}
        for k, v in P_dict.items():
            this_segs = this_model.p2seg(v['p'], v['p_fixed'], p2seg_dict)
            ret_segs = []
            for this_seg in this_segs:
                if this_seg['end_idx'] >= plot_idx:
                    ret_segs += [this_seg]
            ret_dict[k] = {'segments': ret_segs, 'diagnostics': {}}

        return {
            'P_dict': ret_dict,
            'forecastType': 'prob',
            'warning': {
                'status': False,
                'message': ''
            },
            'p2seg_dict': p2seg_dict
        }

    def T2(self, ana_out):
        P_dict = ana_out['P_dict']
        for k, v in P_dict.items():
            for elem in v['segments']:
                for kk, vv in elem.items():
                    if type(vv) != str:
                        elem[kk] = float(vv)

        for k, v in ana_out['p2seg_dict'].items():
            ana_out['p2seg_dict'][k] = float(v)

        return ana_out

    def body(self, f1_ret):
        T1_output = self.T1(f1_ret)
        T1_out = self.analysis(T1_output)
        return self.T2(T1_out)
