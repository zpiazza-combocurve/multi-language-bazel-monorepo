import numpy as np
import pandas as pd
import copy
from combocurve.science.optimization_module.optimizers import optimizers
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.core_function.setting_parameters import error_type
from combocurve.science.forecast_models.shared.prob_shared import prob_dtype
from combocurve.science.core_function.error_funcs import mat_errorfunc_s, errorfunc_s
from combocurve.science.core_function.transformation_instances import transform_s
from combocurve.science.segment_models.shared.helper import arps_D_eff_2_D, arps_D_2_D_eff


class get_prob:
    def __init__(self, random_seed=1):
        self.optimizer = 'my_differential_evolution'
        self.random_seed = random_seed
        self.random_seeds = []
        self.data_freq = None

    def get_optimization_para_dict(self):
        return {"seed": self.random_seed, 'random_seeds': self.random_seeds}

    def set_optimizer(self, optimizer):
        self.optimizer = optimizer

    def set_seed(self, random_seed):
        self.random_seed = random_seed

    def set_seeds(self, random_seeds):
        self.random_seeds = random_seeds

    def set_freq(self, data_freq):
        self.data_freq = data_freq

    def para_parse(self, p, p_fixed, para_candidates, model_name):
        p_name = mm.models[model_name].model_p_name
        p_fixed_name = mm.models[model_name].model_p_fixed_name
        para_table = pd.DataFrame([np.concatenate([p, p_fixed])] * para_candidates.shape[0],
                                  columns=p_name + p_fixed_name)

        for name in para_candidates.columns:
            para_table[name] = para_candidates[name]

        p_table = np.array(para_table[p_name])
        p_fixed_table = np.array(para_table[p_fixed_name])
        return p_table, p_fixed_table

    def keep_ratio_filter(self,
                          model_name,
                          transformed_data,
                          p_table,
                          p_fixed_table,
                          para_dict,
                          end_data_idx,
                          well_life_idx,
                          loss_type=error_type):
        this_model = mm.models[model_name]
        transformed_data = transformed_data.astype(prob_dtype)
        time_span = transformed_data[-1, 0] - transformed_data[0, 0]
        data_mask_75 = transformed_data[:, 0] >= int(time_span * 0.25) + transformed_data[0, 0]
        truncated_data = transformed_data[data_mask_75]

        t_pred = truncated_data[:, 0]
        n = t_pred.shape[0]
        pred = this_model.pred_para_candidates(t_pred, p_table, p_fixed_table, para_dict, end_data_idx, well_life_idx)
        comp = np.stack([truncated_data[:, 1]] * p_table.shape[0], axis=0)

        penalization_params = this_model.get_penalize_params(para_dict)
        penalize_func = this_model.get_penalize_prob(truncated_data, penalization_params)

        err = penalize_func(mat_errorfunc_s[loss_type](comp, pred, axis=1), p_table, p_fixed_table)
        sort_idx = np.argsort(err)
        keep_ratio_list_1 = np.arange(0.01, 1, 0.01)
        percentile_num = [10, 90]

        compare_ratio = 9

        def find_best_ratio(keep_ratio_list):
            keep_num = (keep_ratio_list * pred.shape[0]).astype(int)
            scores = np.ones((2, keep_num.shape[0])) * 100
            comp_2 = np.stack([truncated_data[:, 1]] * 2, axis=0)
            percent_lower = np.zeros((2, keep_num.shape[0]))
            for i, num in enumerate(keep_num):
                this_idx = sort_idx[:num]
                this_pred = pred[this_idx, :]
                curve_s = np.percentile(this_pred, percentile_num, axis=0)
                percent_lower[:, i] = np.mean((comp_2 <= curve_s), axis=1)
                scores[:, i] = np.abs((percent_lower[:, i] - np.array([compare_ratio, 100 - compare_ratio]) / 100))
                # print(keep_ratio_list[i], np.sum(scores[:, i]))

                if (percent_lower[0, i] == 0) | (percent_lower[1, i] == 1):
                    break
                if n > 10:
                    if (percent_lower[0, i] <= compare_ratio / 200) | (percent_lower[1, i] >= 1 - compare_ratio / 200):
                        break

            return keep_ratio_list[np.argmin(np.sum(scores, axis=0))]

        # ratio_1 = find_best_ratio(keep_ratio_list_1)

        # keep_ratio_list_2 = np.arange(ratio_1 - 0.04, ratio_1 + 0.05, 0.01)
        ratio_2 = find_best_ratio(keep_ratio_list_1)
        use_ratio = ratio_2 * para_dict['dispersion']
        if use_ratio > 1:
            use_ratio = 1
        use_num = int(pred.shape[0] * use_ratio)
        use_num = max(min(p_table.shape[0], 10), use_num)

        return p_table[sort_idx[:use_num], :], p_fixed_table[sort_idx[:use_num], :]

    #entry point
    def get_percentile(self, filtered_data, model_name, t_peak, p_best, p_fixed_best, para_candidates, well_life_idx,
                       para_dict):
        this_model = mm.models[model_name]
        penalization_params = this_model.get_penalize_params(para_dict)
        para_fit = this_model.generate_para_fit(para_dict)
        ##### generate filtered_data table
        p_table, p_fixed_table = self.para_parse(p_best, p_fixed_best, para_candidates, model_name)
        transformed_data = transform_s['after_peak_only'][self.data_freq](filtered_data, t_peak)
        p_table, p_fixed_table = self.keep_ratio_filter(model_name, transformed_data, p_table, p_fixed_table, para_dict,
                                                        filtered_data[-1, 0], well_life_idx)

        # t_right = np.min([filtered_data[-1, 0] + 2000, t_peak + 3000])
        t_right = np.min([filtered_data[-1, 0] + 2000])
        t_pred = np.arange(t_peak, t_right, 30)
        q_pred = this_model.pred_para_candidates(t_pred, p_table, p_fixed_table, para_dict, filtered_data[-1, 0],
                                                 well_life_idx)
        ##### generate p50 fit
        p50_q = np.percentile(q_pred, 50, axis=0)
        p50_data = np.stack([t_pred, p50_q], axis=1)
        p50_fit = self._get_para(p50_data, p_best, p_fixed_best, model_name, para_dict, penalization_params)
        p50_p = copy.deepcopy(p_best)
        p50_p_fixed = copy.deepcopy(p_fixed_best)
        for i, v in enumerate(para_fit):
            p50_p[v['ind']] = p50_fit[i]

        ######################### fit other percentiles
        percentile_data = {}
        for perc in para_dict['percentile']:
            this_perc = 100 - perc
            this_name = 'P' + str(perc)
            percentile_data[this_name] = np.percentile(q_pred, this_perc, axis=0)

        ret_dict = self.fit_all_series(t_pred, percentile_data, para_dict, p50_p, p50_p_fixed, para_fit)

        ret_dict['best'] = {'p': p_best, 'p_fixed': p_fixed_best}
        return ret_dict

    def fit_all_series(self, t_pred, percentile_data, para_dict, p50_p, p50_p_fixed, para_fit):  # noqa: C901
        ret_dict = {}
        ret_dict['P50'] = {'p': p50_p, 'p_fixed': p50_p_fixed}
        percentile = para_dict['percentile']
        model_name = para_dict['model_name']
        this_model = mm.models[model_name]
        penalization_params = this_model.get_penalize_params(para_dict)

        lower_bracket = []
        upper_bracket = []
        for i in np.sort(percentile):
            if i < 50:
                lower_bracket += [i]
            elif i > 50:
                upper_bracket += [i]

        ## deal with lower_bracket
        lower_para_dict = copy.deepcopy(para_dict)
        for i, v in enumerate(para_fit):
            this_para_name = v['name']
            this_direction = this_model.prob_para_direction[this_para_name]
            this_rep = lower_para_dict[this_para_name]
            if this_direction > 0:  # replace the upper bound
                this_rep[1] = p50_p[v['ind']]

            else:  # replace the lower bound
                this_rep[0] = p50_p[v['ind']]
            lower_para_dict[this_para_name] = this_rep

        for this_perc in lower_bracket[::-1]:  ## 50 -> 30 -> 10
            ### fit first
            this_name = 'P' + str(this_perc)
            this_perc_q = percentile_data[this_name]
            this_data = np.stack([t_pred, this_perc_q], axis=1)
            feasible, nlc_lower = this_model.non_linear_constraints(p50_p, p50_p_fixed, lower_para_dict, "lower")
            this_p = copy.deepcopy(p50_p)
            if feasible:
                this_perc_fit = self._get_para(this_data,
                                               p50_p,
                                               p50_p_fixed,
                                               model_name,
                                               lower_para_dict,
                                               penalization_params,
                                               constraint=nlc_lower)

                for i, v in enumerate(para_fit):
                    this_p[v['ind']] = this_perc_fit[i]

            ret_dict[this_name] = {'p': this_p, 'p_fixed': copy.deepcopy(p50_p_fixed)}
            ### update the lower_para_dict
            for i, v in enumerate(para_fit):
                this_para_name = v['name']
                this_direction = this_model.prob_para_direction[this_para_name]
                this_rep = lower_para_dict[this_para_name]
                if this_direction > 0:  # replace the upper bound
                    this_rep[1] = this_p[v['ind']]

                else:  # replace the lower bound
                    this_rep[0] = this_p[v['ind']]
                lower_para_dict[this_para_name] = this_rep

        ## deal with upper_bracket
        upper_para_dict = copy.deepcopy(para_dict)
        for i, v in enumerate(para_fit):
            this_para_name = v['name']
            this_direction = this_model.prob_para_direction[this_para_name]
            this_rep = upper_para_dict[this_para_name]
            if this_direction > 0:  # replace the lower bound
                this_rep[0] = p50_p[v['ind']]

            else:  # replace the upper bound
                this_rep[1] = p50_p[v['ind']]
            upper_para_dict[this_para_name] = this_rep

        for this_perc in upper_bracket:  ## 50 -> 70 -> 90
            ### fit first
            this_name = 'P' + str(this_perc)
            this_perc_q = percentile_data[this_name]
            this_data = np.stack([t_pred, this_perc_q], axis=1)
            feasible, nlc_upper = this_model.non_linear_constraints(p50_p, p50_p_fixed, upper_para_dict, "upper")
            this_p = copy.deepcopy(p50_p)
            if feasible:
                this_perc_fit = self._get_para(this_data,
                                               p50_p,
                                               p50_p_fixed,
                                               model_name,
                                               upper_para_dict,
                                               penalization_params,
                                               constraint=nlc_upper)

                for i, v in enumerate(para_fit):
                    this_p[v['ind']] = this_perc_fit[i]

            ret_dict[this_name] = {'p': this_p, 'p_fixed': copy.deepcopy(p50_p_fixed)}
            ### update the upper_para_dict
            for i, v in enumerate(para_fit):
                this_para_name = v['name']
                this_direction = this_model.prob_para_direction[this_para_name]
                this_rep = upper_para_dict[this_para_name]
                if this_direction > 0:  # replace the lower bound
                    this_rep[0] = this_p[v['ind']]
                else:  # replace the upper bound
                    this_rep[1] = this_p[v['ind']]
                upper_para_dict[this_para_name] = this_rep

        if model_name in ['arps_modified_wp', 'arps_wp']:
            self.avoid_P_series_intersection(ret_dict, para_dict)

        final_ret_dict = {}
        for p in percentile:
            this_p_name = 'P' + str(p)
            final_ret_dict[this_p_name] = ret_dict[this_p_name]
        return final_ret_dict

    def avoid_P_series_intersection(self, percentile_data, para_dict):
        D_eff_range = para_dict['D_eff']
        P50_Di = arps_D_eff_2_D(percentile_data['P50']['p'][0], percentile_data['P50']['p'][1])
        P50_b = percentile_data['P50']['p'][1]

        # P50 -> P10
        P10_Di = arps_D_eff_2_D(percentile_data['P10']['p'][0], percentile_data['P10']['p'][1])
        if P10_Di > P50_Di:
            P10_b = percentile_data['P10']['p'][1]
            new_P10_Deff = arps_D_2_D_eff(P50_Di, P10_b)
            if new_P10_Deff < D_eff_range[0] or new_P10_Deff > D_eff_range[1]:
                P10_b = P50_b
                new_P10_Deff = percentile_data['P50']['p'][0]
            percentile_data['P10']['p'][0], percentile_data['P10']['p'][1] = new_P10_Deff, P10_b

        #P50 -> P90
        P90_Di = arps_D_eff_2_D(percentile_data['P90']['p'][0], percentile_data['P90']['p'][1])
        if P90_Di < P50_Di:
            P90_b = percentile_data['P90']['p'][1]
            new_P90_Deff = arps_D_2_D_eff(P50_Di, P90_b)
            if new_P90_Deff < D_eff_range[0] or new_P90_Deff > D_eff_range[1]:
                P90_b = P50_b
                new_P90_Deff = percentile_data['P50']['p'][0]
            percentile_data['P90']['p'][0], percentile_data['P90']['p'][1] = new_P90_Deff, P90_b

    def _get_para(self,
                  data,
                  p_benchmark,
                  p_fixed_benchmark,
                  model_name,
                  use_para_dict,
                  penalization_params,
                  constraint=None):
        prob_para = use_para_dict['prob_para']
        this_model = mm.models[model_name]
        para_fit = this_model.generate_para_fit(use_para_dict)
        this_range = []
        for name in list(this_model.prob_para_direction.keys()):
            if name in prob_para:
                this_range += [use_para_dict[name]]

        penalize_func = this_model.get_penalize(data, penalization_params)
        args = (data, penalize_func, p_benchmark, p_fixed_benchmark, para_fit, model_name)
        optimization_para_dict = self.get_optimization_para_dict()
        optimization_para_dict.update({'args': args, 'bounds': this_range})
        if constraint:
            optimization_para_dict.update({'constraints': (constraint)})

        result = optimizers[self.optimizer](self.alpha, optimization_para_dict)
        return result.x

    def alpha(self, x, *args):
        data, penalize_func, p_benchmark, p_fixed_benchmark, para_fit, model_name = args
        this_p = copy.deepcopy(p_benchmark)
        this_p_fixed = copy.deepcopy(p_fixed_benchmark)
        for i in range(len(para_fit)):
            this_p[para_fit[i]['ind']] = x[i]

        pred = mm.models[model_name].predict(data[:, 0], this_p, this_p_fixed)
        err = errorfunc_s[error_type](pred, data[:, 1])
        return penalize_func(err, this_p, this_p_fixed)
