import numpy as np
from combocurve.science.optimization_module.optimizers import optimizers
from combocurve.science.core_function.transformation_instances import transform_s
from combocurve.science.segment_models.shared.helper import pred_arps, arps_D_eff_2_D
from combocurve.science.core_function.skeleton_dca import get_dca


class get_no_data:
    def __init__(self, random_seed=1):
        self.data_freq = None
        self.base_modelname = 'segment_arps_4_wp'

        self.optimizer = 'my_differential_evolution'
        self.random_seed = 1
        self.random_seeds = []

    def get_optimization_para_dict(self):
        return {"seed": self.random_seed, 'random_seeds': self.random_seeds}

    def set_seed(self, random_seed):
        self.random_seed = random_seed

    def set_seeds(self, random_seeds):
        self.random_seeds = random_seeds

    def set_optimizer(self, optimizer):
        self.optimizer = optimizer

    def set_freq(self, data_freq):
        self.data_freq = data_freq

    def get_range(self, para_dict, label):
        ret = [(0.01, 0.99)]
        if 'D1_eff' in para_dict.keys():
            ret[0] = tuple(para_dict['D1_eff'])

        return ret

    def get_paras(self, data, t_peak, label, para_dict):
        ################ q0 of label > 3 is a problem, should be calculated using optimization

        data_freq = self.data_freq
        peak_idx = t_peak
        this_range = self.get_range(para_dict, label)
        no0_data = data[data[:, 1] > 0, :]
        if no0_data.shape[0] > 0:
            t0 = no0_data[0, 0]
        else:
            t0 = None
        data_filter = transform_s['not_change'][data_freq](data, peak_idx)
        data_ap = transform_s['after_peak_only'][data_freq](data, peak_idx)

        model_name = para_dict['model_name']
        if model_name in ['exp_free_peak', 'arps_modified_free_peak']:
            det = get_dca()
            det.set_freq(data_freq)
            update_range = det.get_range(model_name, para_dict, 8)
            this_p, this_p_fixed = det.get_params(data, t_peak, 8, model_name=model_name, ranges=update_range)
            model_q_peak = this_p[-1]

        ret_dict = dict()
        if label == 1:
            return ret_dict
        elif label == 2:
            ret_dict['best_q0'] = data_filter[0, 1]
            ret_dict['best_minus_t0_t_first'] = t0 - data[0, 0]
        elif label in [3, 5]:
            if model_name in ['exp_free_peak', 'arps_modified_free_peak']:
                q_peak = model_q_peak
            else:
                q_peak = data_ap[0, 1]
            ret_dict['best_q0'] = data_filter[0, 1]
            ret_dict['best_minus_t0_t_first'] = t0 - data[0, 0]
            ret_dict['best_q_peak'] = q_peak
            ret_dict['best_minus_t_peak_t0'] = peak_idx - data_filter[0, 0]
        elif label in [4, 6]:
            if model_name in ['exp_free_peak', 'arps_modified_free_peak']:
                q_peak = model_q_peak
            else:
                q_peak = data_ap[0, 1]
            b1 = 2

            def alpha(p, *args):
                D1_eff = p
                D1 = arps_D_eff_2_D(D1_eff, b1)
                trans_data, q_peak, t_peak = args
                t = trans_data[:, 0]
                y_true = trans_data[:, 1]
                pred = pred_arps(t, t_peak, q_peak, D1, b1)
                return np.mean(np.abs(y_true - pred))

            arg = data_ap, q_peak, peak_idx
            optimization_para_dict = self.get_optimization_para_dict()
            optimization_para_dict.update({'args': arg, 'bounds': this_range, 'popsize': 15})
            result = optimizers[self.optimizer](alpha, optimization_para_dict)
            ret_dict['best_q0'] = data_filter[0, 1]
            ret_dict['best_minus_t0_t_first'] = t0 - data[0, 0]
            ret_dict['best_q_peak'] = q_peak
            ret_dict['best_minus_t_peak_t0'] = peak_idx - data_filter[0, 0]
            best_D1_eff = result.x[0]

            ret_dict['best_D1'] = arps_D_eff_2_D(best_D1_eff, b1)
            ret_dict['est_D1_eff'] = best_D1_eff

        return ret_dict
