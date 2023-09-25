### fit percentiles
from typing import Any, AnyStr, Dict, List
import numpy as np
from combocurve.science.optimization_module.optimizers import optimizers
from combocurve.science.core_function.setting_parameters import cum_error_type
from combocurve.science.core_function.skeleton_dca import RegressionType, get_dca
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.core_function.helper import jsonify_segments, my_round_to_decimal
from combocurve.science.type_curve.TC_helper import classify, get_cum_data, get_eur_data, get_aligned_prod_data
from combocurve.science.forecast_models.model_manager import mm, RATE_CUM_MODEL_MAPPING
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.shared.constants import DAYS_IN_MONTH, DAYS_IN_YEAR
from combocurve.science.forecast_models.ratio_t_models.ratio_t_arps_inc import model_ratio_t_arps_inc
from copy import deepcopy
import datetime

multi_seg = MultipleSegments()

ARPS_INC_ADJUST_DATA_IDX_THRES = 1000

Segment = Dict[AnyStr, Any]


class fit_tc:
    def __init__(self, context):
        self.optimizer = 'my_differential_evolution'
        self.random_seed = None
        self.random_seeds = []
        self.maxite = 5
        self.losses = {'cum': self.cum, 'sum': self.sum}
        self.type_curve_service: TypeCurveService = context.type_curve_service

    def get_optimization_para_dict(self):
        return {"seed": self.random_seed, 'random_seeds': self.random_seeds, 'maxiter': self.maxite}

    def set_optimizer(self, optimizer):
        self.optimizer = optimizer

    def set_seed(self, random_seed):
        self.random_seed = random_seed

    def set_seeds(self, random_seeds):
        self.random_seeds = random_seeds

    def set_maxite(self, maxite):
        self.maxite = maxite

    def T1_percentile(self, fit_percentile_input):  # noqa: C901
        ret = {}
        phaseType = fit_percentile_input['phaseType']
        fit_para = fit_percentile_input['fit_para']
        p1_range = fit_para['p1_range']
        data_source = fit_para['data']
        bg_data = fit_percentile_input['init_data']['background_data']

        TC_para_dict = fit_percentile_input['TC_para_dict']
        buildup_dict = TC_para_dict['buildup']

        if fit_para['fit_complexity'] == 'simple':
            ret['optimizer'] = 'my_differential_evolution'
        elif fit_para['fit_complexity'] == 'complex':
            ret['optimizer'] = 'repeated_differential_evolution'

        #####################
        np_bg_data = np.array(bg_data['data'], dtype=float)
        np_bg_idx = np.array(bg_data['idx'])

        def get_slice_range(check_data):
            if data_source == 'align':
                idx_0_INDEX = np.argwhere(np_bg_idx == 0)[0, 0]
                peak_ind = idx_0_INDEX
            else:
                peak_ind = np.nanargmax(check_data)
            peak_idx = np_bg_idx[peak_ind]

            ################
            slice_range_left = (np_bg_idx < p1_range[0]).sum()
            slice_range_right = (np_bg_idx <= p1_range[1]).sum()

            if slice_range_left < 0:
                slice_range_left = 0

            if phaseType == 'rate':
                if buildup_dict['apply']:
                    slice_range_left = (np_bg_idx < peak_idx - buildup_dict['days']).sum()

                if slice_range_right <= peak_ind + 3:
                    slice_range_right = peak_ind + 3

                if peak_ind < slice_range_left:
                    use_peak_ind = 0
                else:
                    use_peak_ind = peak_ind - slice_range_left
            else:
                use_peak_ind = 0
            return slice_range_left, slice_range_right, use_peak_ind

        perc_data = np.nanpercentile(np_bg_data, fit_para['TC_percentile'], axis=0)
        P50_idx = np.argwhere(np.array(fit_para['TC_percentile']) == 50)[0, 0]

        perc_slice_range_left, perc_slice_range_right, perc_use_peak_ind = get_slice_range(perc_data[P50_idx, :])
        perc_use_data = perc_data[:, perc_slice_range_left:perc_slice_range_right]
        perc_use_idx_vec = np_bg_idx[perc_slice_range_left:perc_slice_range_right]
        # perc_align_data = np.zeros(perc_use_data.shape)
        # align perc_use_data
        best_fit_method = fit_percentile_input['best_fit_method']
        if phaseType == 'rate':
            perc_use = {'idx': perc_use_idx_vec, 'data': perc_use_data, 'peak_ind': perc_use_peak_ind}
            use_data = {'perc': perc_use}
            ################
            if best_fit_method == 'average':
                average_data = np.nanmean(np_bg_data, axis=0)
                average_slice_range_left, average_slice_range_right, average_use_peak_ind = get_slice_range(
                    average_data)

                average_use_data = average_data[average_slice_range_left:average_slice_range_right]
                average_use_idx_vec = np_bg_idx[average_slice_range_left:average_slice_range_right]
                average_use = {'idx': average_use_idx_vec, 'data': average_use_data, 'peak_ind': average_use_peak_ind}
                use_data['average'] = average_use
        else:
            perc_use = {'idx': perc_use_idx_vec, 'data': perc_use_data, 'peak_ind': 0}
            use_data = {'perc': perc_use}
            average_data = np.nanmean(np_bg_data, axis=0)
            average_use_data = average_data[perc_slice_range_left:perc_slice_range_right]
            average_use = {'idx': perc_use_idx_vec, 'data': average_use_data, 'peak_ind': 0}
            use_data['average'] = average_use

        ret['best_fit_method'] = best_fit_method
        ret['best_fit_range'] = fit_percentile_input['best_fit_range']
        ret['perc_sliced_data_mat'] = np_bg_data[:, perc_slice_range_left:perc_slice_range_right]
        ret['use_data'] = use_data
        if phaseType == 'ratio':
            ret['TC_model'] = 'ratio_t_' + TC_para_dict['TC_model']
        else:
            ret['TC_model'] = TC_para_dict['TC_model']

        ret['TC_percentile'] = fit_para['TC_percentile']
        ret['TC_para_dict'] = TC_para_dict

        ret['eur'] = np.array(fit_percentile_input['init_data']['eur'])
        ret['data_source'] = data_source
        ret['phaseType'] = phaseType
        ret['buildup'] = buildup_dict

        return ret

    def fit_time_slice(self, T1_ret):  # noqa: C901
        #T1_ret = T1(fit_percentile_input)
        phaseType = T1_ret['phaseType']
        optimizer = T1_ret['optimizer']
        TC_percentile = T1_ret['TC_percentile']
        TC_model = T1_ret['TC_model']
        TC_para_dict = T1_ret['TC_para_dict']
        percentile_names = ['P' + str(100 - p) for p in TC_percentile]
        use_data = T1_ret['use_data']
        best_fit_method = T1_ret['best_fit_method']
        buildup_dict = T1_ret['buildup']
        eur_list = T1_ret['eur']
        regression_type = RegressionType[str(T1_ret['regression_type']).upper()]
        target_eur = np.nanpercentile(eur_list, TC_percentile)
        target_eur = {p_name: target_eur[i] for (i, p_name) in enumerate(percentile_names)}

        resolution = T1_ret.get('resolution')

        isFitRate = phaseType == 'rate'
        isCumRegression = regression_type == RegressionType.CUM

        def get_p2seg_dict(t_first):
            t_end_life = int(np.ceil(t_first + DAYS_IN_YEAR * TC_para_dict['well_life'] - 1))
            p2seg_dict = {
                't_first': t_first,
                't_end_data': t_first - 10,
                't_end_life': t_end_life,
                'q_final': TC_para_dict['q_final'],
                'D_lim_eff': TC_para_dict['D_lim_eff'],
                'enforce_sw': False,
                'minus_t_decline_t_0': TC_para_dict.get('minus_t_decline_t_0'),
            }
            return p2seg_dict

        ######################### percentiles
        perc_data = use_data['perc']['data']
        perc_idx = use_data['perc']['idx']
        perc_peak_ind = use_data['perc']['peak_ind']

        perc_data_dict = {}
        for i, p_name in enumerate(percentile_names):
            this_value = perc_data[i, :]
            ## HACK: make sure the first index and peak are kept and treating others 0's as nan
            is_first_value_0 = this_value[0] == 0
            is_peak_0 = this_value[perc_peak_ind] == 0

            this_value[this_value == 0] = np.nan
            if is_first_value_0:
                this_value[0] = 0
            if is_peak_0:
                this_value[perc_peak_ind] = 0
            nan_mask = np.isnan(this_value)
            this_data = np.stack([perc_idx, this_value], axis=1)[~nan_mask, :]
            perc_data_dict[p_name] = this_data

        perc_series_data_conditions, _, _ = classify(perc_data_dict, percentile_names)
        benchmark_name = 'P50'
        perc_t_peak = perc_idx[perc_peak_ind]

        if buildup_dict['apply']:
            perc_t_first = perc_t_peak - buildup_dict['days']
        else:
            perc_t_first = perc_idx[0]
        perc_p2seg_dict = get_p2seg_dict(perc_t_first)

        det = get_dca()
        det.set_freq('monthly')
        det.set_seed(2)
        det.set_seeds([1, 2, 3])
        det.set_optimizer(optimizer)
        det.set_maxite(self.maxite)
        label = 8

        if isCumRegression:
            det.set_errortype(cum_error_type)

        det_range = det.get_range(TC_model, TC_para_dict, label)
        orig_fit = {}

        def get_orig_fit(series_data_condition, raw_fit_data, TC_model_name, t_peak, raw_buildup_dict, p2seg_dict):
            buildup_dict = deepcopy(raw_buildup_dict)

            # Most models can have a buildup, some models can't
            can_have_buildup = True
            if TC_model_name in ['flat_arps_modified']:  # Done this way so more non-buildup models can be added.
                can_have_buildup = False

            # These models don't have peaks, so we set the `series_data_condition` to 'good'
            if TC_model_name in ['flat_arps_modified']:  # Done this way so more non-peaked models can be added.
                series_data_condition = 'good'

            ### changes here to make sure the fit starts from peak, and also all percentiles has the same start_point
            if buildup_dict['apply'] is False:
                buildup_dict['apply'] = True
                buildup_dict['days'] = t_peak - raw_fit_data[0, 0]

            fit_data = deepcopy(raw_fit_data)
            if isFitRate:
                if isCumRegression and resolution == 'monthly':
                    # Get the corresponding cum model from the model mapping
                    TC_model_name = RATE_CUM_MODEL_MAPPING.get(TC_model_name, TC_model_name)

                if series_data_condition == 'good':
                    this_model_name = TC_model_name
                    this_p, this_p_fixed = det.get_params(fit_data,
                                                          t_peak,
                                                          label,
                                                          TC_model_name,
                                                          resolution=resolution,
                                                          ranges=det_range,
                                                          p2seg_dict=p2seg_dict,
                                                          regression_type=regression_type)
                elif series_data_condition in ['after_peak', 'before_peak']:
                    this_model_name = TC_model_name
                    this_p, this_p_fixed = det.get_params(fit_data,
                                                          t_peak,
                                                          label,
                                                          TC_model_name,
                                                          resolution=resolution,
                                                          ranges=det_range,
                                                          p2seg_dict=p2seg_dict,
                                                          regression_type=regression_type)
                    this_p, this_p_fixed = mm.models[TC_model_name].TC_set_s[series_data_condition](this_p,
                                                                                                    this_p_fixed)
                elif series_data_condition in ['flat', 'zero']:
                    this_model_name = 'flat'
                    this_p = [fit_data[0, 1]]
                    this_p_fixed = [fit_data[0, 0]]

                if can_have_buildup:
                    this_p, this_p_fixed = mm.models[this_model_name].TC_buildup(this_p, this_p_fixed, t_peak,
                                                                                 buildup_dict)
            else:
                this_model_name = TC_model_name
                this_p, this_p_fixed = det.get_params(fit_data,
                                                      t_peak,
                                                      label,
                                                      TC_model_name,
                                                      resolution=resolution,
                                                      ranges=det_range,
                                                      p2seg_dict=p2seg_dict)

            this_seg = mm.models[this_model_name].p2seg(this_p, this_p_fixed, p2seg_dict)
            return {'p': this_p, 'p_fixed': this_p_fixed, 'model_name': this_model_name, 'orig_seg': this_seg}

        for i, p_name in enumerate(percentile_names):
            this_condition = perc_series_data_conditions[p_name]
            this_data = perc_data_dict[p_name]
            this_fit = get_orig_fit(this_condition, this_data, TC_model, perc_t_peak, buildup_dict, perc_p2seg_dict)
            orig_fit[p_name] = this_fit

            ### match eur
            this_target = target_eur[p_name]
            if isFitRate:
                this_mat_seg = mm.models[this_fit['model_name']].TC_reach_eur(this_fit['p'], this_fit['p_fixed'],
                                                                              this_target, perc_p2seg_dict)
            else:
                this_mat_seg = []

            orig_fit[p_name]['match_eur_seg'] = this_mat_seg

        ######!!!!!!!!!!!!!!!!!!!!!!! best_fit
        if best_fit_method == 'average':
            average_idx = use_data['average']['idx']
            average_value = use_data['average']['data']
            average_peak_ind = use_data['average']['peak_ind']
            average_t_peak = average_idx[average_peak_ind]

            ## HACK: make sure the first index is kept and treating others 0's as nan
            is_average_value_first_value_0 = average_value[0] == 0
            average_value[average_value == 0] = np.nan
            if is_average_value_first_value_0:
                average_value[0] = 0
            average_nan_mask = np.isnan(average_value)
            average_data = np.stack([average_idx, average_value], axis=1)[~average_nan_mask, :]
            average_data_dict = {'average': average_data}
            average_series_data_conditions, _, _ = classify(average_data_dict, ['average'])
            if buildup_dict['apply']:
                average_t_first = average_t_peak - buildup_dict['days']
            else:
                average_t_first = average_idx[0]
            average_p2seg_dict = get_p2seg_dict(average_t_first)
            this_fit = get_orig_fit(average_series_data_conditions['average'], average_data, TC_model, average_t_peak,
                                    buildup_dict, average_p2seg_dict)
            orig_fit['average'] = this_fit

            average_eur = np.nanmean(eur_list)
            if isFitRate:
                average_mat_seg = mm.models[this_fit['model_name']].TC_reach_eur(this_fit['p'], this_fit['p_fixed'],
                                                                                 average_eur, average_p2seg_dict)
            else:
                average_mat_seg = []

            orig_fit['average']['match_eur_seg'] = average_mat_seg

        ######
        benchmark_orig_fit = orig_fit[benchmark_name]
        ################ check if crossing
        ## BIG HACK, T_T, check slack thread: https://insidepetroleum.slack.com/archives/C02NARURH62/p1651682958451519
        TC_life = TC_para_dict['well_life']
        entire_pred_t = np.arange(perc_t_first, perc_t_first + TC_life * 365, 30, dtype=int)
        final_pred_mat = np.zeros((len(TC_percentile), entire_pred_t.shape[0]))
        if isFitRate or (not isFitRate and TC_model == model_ratio_t_arps_inc().model_name):
            for i in range(len(TC_percentile)):
                this_name = percentile_names[i]
                this_segments = orig_fit[this_name]['match_eur_seg'] if isFitRate else orig_fit[this_name]['orig_seg']
                this_pred = multi_seg.predict(entire_pred_t, this_segments)
                final_pred_mat[i, :] = this_pred
            cp_base = np.arange(len(TC_percentile))
            check = np.apply_along_axis(lambda x: np.argsort(x) == cp_base, 0, final_pred_mat)

            if not np.all(check):
                for p_name in percentile_names:
                    if p_name != benchmark_name:
                        if isFitRate:
                            this_target_eur = target_eur[p_name]
                            this_seg = mm.models[benchmark_orig_fit['model_name']].TC_reach_eur(
                                benchmark_orig_fit['p'], benchmark_orig_fit['p_fixed'], this_target_eur,
                                perc_p2seg_dict)

                            orig_fit[p_name]['match_eur_seg'] = this_seg
                        else:
                            cur_p_idx, cur_p_value = perc_data_dict[p_name][:, 0], perc_data_dict[p_name][:, 1]
                            benchmark_idx, benchmark_value = perc_data_dict[benchmark_name][:, 0], perc_data_dict[
                                benchmark_name][:, 1]
                            scale_ratio = np.nanmean(
                                cur_p_value[cur_p_idx <= ARPS_INC_ADJUST_DATA_IDX_THRES]) / np.nanmean(
                                    benchmark_value[benchmark_idx <= ARPS_INC_ADJUST_DATA_IDX_THRES])
                            orig_fit[p_name]['orig_seg'] = multi_seg.scale_segments_q(
                                orig_fit[benchmark_name]['orig_seg'], scale_ratio)

        return {
            'fit': orig_fit,
            'benchmark_name': benchmark_name,
            'data_mat': T1_ret['perc_sliced_data_mat'],
            'peak_ind': perc_peak_ind,
            't_peak': perc_t_peak
        }

    def T1_cum(self, fit_percentile_input):
        ret = {}
        TC_para_dict = fit_percentile_input['TC_para_dict']
        ret['TC_model'] = TC_para_dict['TC_model']
        ret['TC_para_dict'] = TC_para_dict
        init_data = fit_percentile_input['init_data']
        cum_dict = init_data['cum_dict']
        ret['cum_dict'] = cum_dict

        if fit_percentile_input['best_fit_method'] == 'collect_prod':
            target = 'sum'
        elif fit_percentile_input['best_fit_method'] == 'collect_cum':
            target = 'cum'
        else:
            target = None
        ret['target'] = target
        best_range = fit_percentile_input['best_fit_range']
        cum_idx = cum_dict['idx']
        compare_range_left = (np.array(cum_idx) <= best_range[0]).sum()
        compare_range_right = (np.array(cum_idx) <= best_range[1]).sum()
        ret['compare_range'] = [compare_range_left, compare_range_right]
        ret['buildup'] = TC_para_dict['buildup']

        ret['best_fit_q_peak'] = fit_percentile_input['best_fit_q_peak']
        return ret

    def fit_cum(self, T1_ret, percentile_fit):  # noqa: C901
        # Ensure that the seeds are set
        self.set_seed(1)
        self.set_seeds([1, 2, 3])

        ######################### class initialization
        ##### cum_related
        cum_subind = np.array(T1_ret['cum_dict']['cum_subind'])
        target_name = T1_ret['target']
        if target_name is None:
            return None
        else:
            det = get_dca()
            det.set_freq('monthly')
            det.set_seed(1)

            target = np.array(T1_ret['cum_dict'][target_name])
            ### generate cum_vecind
            n_wells = cum_subind.shape[0]
            cum_length = target.shape[0]
            cum_vecind = np.zeros(n_wells * cum_length, dtype=bool)
            for i in range(cum_subind.shape[0]):
                cum_vecind[(i * cum_length + cum_subind[i, 0]):(i * cum_length + cum_subind[i, 1])] = True
            ##### TC_para_dict
            TC_para_dict = T1_ret['TC_para_dict']
            ##### fit_para
            data_mat = percentile_fit['data_mat']
            peak_ind = percentile_fit['peak_ind']
            compare_range = T1_ret['compare_range']
            benchmark_name = percentile_fit['benchmark_name']
            benchmark_fit = percentile_fit['fit'][benchmark_name]
            benchmark_p = benchmark_fit['p']
            benchmark_p_fixed = benchmark_fit['p_fixed']
            benchmark_model_name = benchmark_fit['model_name']
            ##### generate cum_pred_t_vec
            cum_pred_t_vec = np.arange(cum_subind[0, 1] - cum_subind[0, 0], dtype=float)
            cum_pred_t_vec = my_round_to_decimal(cum_pred_t_vec * DAYS_IN_MONTH, 0) + benchmark_p_fixed[0] + 15

            ######################### analysis
            start_idx = benchmark_p_fixed[0]
            start_date = datetime.date(1900, 1, 1) + datetime.timedelta(int(start_idx))
            start_year = start_date.year
            end_year = start_year + TC_para_dict['well_life']
            end_date = datetime.date(end_year, start_date.month, start_date.day)
            t_end_life = (end_date - datetime.date(1900, 1, 1)).days

            para_insert_list = []
            this_range = []
            ## for final optimization, and move after benchmark is generated
            best_fit_q_peak = T1_ret['best_fit_q_peak']
            q_peak_method = best_fit_q_peak['method']
            if q_peak_method == 'default':
                TC_para_dict['q_peak'] = [
                    np.nanpercentile(data_mat[:, peak_ind], 10) + 1,
                    np.nanpercentile(data_mat[:, peak_ind], 90) + 1
                ]
            elif q_peak_method == 'absolute_range':
                TC_para_dict['q_peak'] = best_fit_q_peak['range']
            elif q_peak_method == 'percentile_range':
                TC_para_dict['q_peak'] = [
                    np.nanpercentile(data_mat[:, peak_ind], best_fit_q_peak['range'][0]),
                    np.nanpercentile(data_mat[:, peak_ind], best_fit_q_peak['range'][1])
                ]
            elif q_peak_method == 'P50':
                P50_peak = np.nanpercentile(data_mat[:, peak_ind], 50)
                TC_para_dict['q_peak'] = [P50_peak, P50_peak]
            elif q_peak_method == 'average':
                average_peak = np.nanmean(data_mat[:, peak_ind])
                TC_para_dict['q_peak'] = [average_peak, average_peak]

            if TC_para_dict['q_peak'][0] < 1e-2:
                TC_para_dict['q_peak'][0] += 1e-2
                TC_para_dict['q_peak'][1] += 1e-2

            # c8_para_names is a list of variables that should change when generating a sum/cum fit.
            # c8_para_names = {
            #     'segment_arps_4_wp': ['q_peak', 'D1_eff', 'b2'],
            #     'segment_arps_4_wp_free_slope': ['q_peak', 'D1_eff', 'b2', 'D2_eff'],
            #     'segment_arps_4_wp_free_b1': ['q_peak', 'b1', 'D1_eff', 'b2'],
            #     'flat': ['c'],
            #     'exp_arps_modified_wp': ['q_peak', 'D', 'b'],
            #     'flat_arps_modified': ['q0', 'D', 'b2'],
            # }
            benchmark_model_instance = mm.models[benchmark_model_name]
            TC_para_name = benchmark_model_instance.TC_c8_para_name
            ## adjust the TC_para_name if 'flat' is chosen
            if benchmark_model_name == 'flat':
                TC_para_dict['c'] = [0, np.nanmax(data_mat)]

            # add additional q0 parameter to the paradict for flat_arps_modified:
            if benchmark_model_name == 'flat_arps_modified':
                TC_para_dict['q0'] = [0, np.nanmax(data_mat)]

            benchmark_model_instance = mm.models[benchmark_model_name]
            for para in TC_para_name:
                this_range += [tuple(TC_para_dict[para])]
                this_dict = {}
                if para in benchmark_model_instance.model_p_name:
                    this_dict['part'] = 'p'
                    for i, name in enumerate(benchmark_model_instance.model_p_name):
                        if name == para:
                            this_dict['ind'] = i
                else:
                    this_dict['part'] = 'p_fixed'
                    for i, name in enumerate(benchmark_model_instance.model_p_fixed_name):
                        if name == para:
                            this_dict['ind'] = i

                para_insert_list += [this_dict]

            p2_seg_para = {
                't_first': benchmark_p_fixed[0],
                't_end_data': benchmark_p_fixed[0],
                't_end_life': t_end_life,
                'q_final': TC_para_dict['q_final'],
                'D_lim_eff': TC_para_dict['D_lim_eff'],
                'enforce_sw': False
            }

            args = (compare_range, benchmark_p, benchmark_p_fixed, benchmark_model_name, para_insert_list,
                    cum_pred_t_vec, target, cum_vecind, p2_seg_para, T1_ret['buildup'], percentile_fit['t_peak'])
            optimization_para_dict = self.get_optimization_para_dict()
            optimization_para_dict.update({'args': args, 'bounds': this_range})
            result = optimizers[self.optimizer](self.losses[target_name], optimization_para_dict)
            this_para = result.x
            this_p = deepcopy(benchmark_p)
            this_p_fixed = deepcopy(benchmark_p_fixed)
            this_segments = benchmark_model_instance.TC_cum_p2seg(this_para, this_p, this_p_fixed, para_insert_list,
                                                                  percentile_fit['t_peak'], T1_ret['buildup'],
                                                                  p2_seg_para)
            return this_segments

    def cum(self, para, *args):
        compare_range, benchmark_p, benchmark_p_fixed, TC_model, para_insert_list, cum_pred_t_vec, target, cum_vecind, p2_seg_para, buildup_dict, t_peak = args  # noqa: E501
        nr = int(cum_vecind.shape[0] / target.shape[0])
        this_p = deepcopy(benchmark_p)
        this_p_fixed = deepcopy(benchmark_p_fixed)
        this_segments = mm.models[TC_model].TC_cum_p2seg(para, this_p, this_p_fixed, para_insert_list, t_peak,
                                                         buildup_dict, p2_seg_para)

        this_pred = multi_seg.predict(cum_pred_t_vec, this_segments)
        #######################
        this_pred_rep = np.tile(this_pred, nr)
        this_pred_vec = np.zeros(cum_vecind.shape)
        this_pred_vec[cum_vecind] = this_pred_rep
        this_pred_mat = this_pred_vec.reshape((nr, -1))
        this_cum = np.nancumsum(np.nansum(this_pred_mat, axis=0))
        loss = np.nanmean(
            np.abs(target[compare_range[0]:compare_range[1]] - this_cum[compare_range[0]:compare_range[1]]))

        return loss

    def sum(self, para, *args):
        compare_range, benchmark_p, benchmark_p_fixed, TC_model, para_insert_list, cum_pred_t_vec, target, cum_vecind, p2_seg_para, buildup_dict, t_peak = args  # noqa: E501
        nr = int(cum_vecind.shape[0] / target.shape[0])
        this_p = deepcopy(benchmark_p)
        this_p_fixed = deepcopy(benchmark_p_fixed)
        this_segments = mm.models[TC_model].TC_cum_p2seg(para, this_p, this_p_fixed, para_insert_list, t_peak,
                                                         buildup_dict, p2_seg_para)

        this_pred = multi_seg.predict(cum_pred_t_vec, this_segments)
        #######################
        this_pred_rep = np.tile(this_pred, nr)
        this_pred_vec = np.zeros(cum_vecind.shape)
        this_pred_vec[cum_vecind] = this_pred_rep
        this_pred_mat = this_pred_vec.reshape((nr, -1))
        this_sum = np.nansum(this_pred_mat, axis=0)
        loss = np.nanmean(
            np.abs(target[compare_range[0]:compare_range[1]] - this_sum[compare_range[0]:compare_range[1]]))

        return loss

    def body(self, fit_percentile_input):
        phase_enabled_dict: Dict[AnyStr, bool] = fit_percentile_input['phases']
        enabled_phases: List[AnyStr] = [p for p, f in phase_enabled_dict.items() if f]
        sorted_enabled_phases: List[AnyStr] = sorted(
            enabled_phases,  # Put Rate phases first
            key=lambda p: fit_percentile_input[p]['phaseType'] == 'ratio')

        ret: Dict[AnyStr, Dict] = {}

        regression_type = fit_percentile_input.get('regressionType', 'rate')

        for phase in sorted_enabled_phases:
            phase_parameters = fit_percentile_input[phase]
            phase_type = phase_parameters['phaseType']
            base_phase = phase_parameters.get('basePhase')
            fit_params = phase_parameters['fit_para']
            alignment = fit_params['data']

            if phase_type == 'ratio':
                # If we are fitting a ratio phase, and the base phase is being run in the same batch
                if base_phase in sorted_enabled_phases:
                    base_phase_series_key = phase_parameters['basePhaseSeries']
                    # Always checking `before` rather than `after`, because there is no Match EUR on ratio phases.
                    if ret[base_phase]['collect_cum'] is not None:
                        base_segs: List[Segment] = ret[base_phase]['collect_cum']['segments']
                    elif ret[base_phase]['collect_prod'] is not None:
                        base_segs: List[Segment] = ret[base_phase]['collect_prod']['segments']
                    elif base_phase_series_key == 'best':
                        base_segs: List[Segment] = ret[base_phase]['average']['before']['segments']
                    else:
                        base_segs: List[Segment] = ret[base_phase]['percentile']['before'][base_phase_series_key][
                            'segments']
                    # TODO: Make sure you set the new base phase segments here.
                    phase_parameters['basePhaseSegments'] = base_segs

            # ================================================================================

            if data_gen_params := phase_parameters.get('data_gen_params'):
                calculated_background_data = self.type_curve_service.tc_fit_init({**data_gen_params, 'phase': phase})
                normalization_array = np.array(phase_parameters['normalization'])
                eur_normalization = np.array(phase_parameters['eur_normalization'])
                prepared_parameter_dict = {
                    **phase_parameters,
                    'init_data': {
                        'eur':
                        get_eur_data(calculated_background_data, eur_normalization),
                        'cum_dict': {
                            **calculated_background_data['cum_dict'],
                            **get_cum_data(calculated_background_data, normalization_array),
                        },
                        'background_data':
                        get_aligned_prod_data(calculated_background_data, phase_type == 'rate', normalization_array,
                                              alignment),
                    },
                    'resolution': data_gen_params['init_para_dict']['TC_target_data_freq'],
                }
            else:
                prepared_parameter_dict = phase_parameters

            T1_percentile_ret = self.T1_percentile(prepared_parameter_dict)
            T1_percentile_ret['regression_type'] = regression_type
            T1_percentile_ret['resolution'] = prepared_parameter_dict['resolution']

            percentile_ret = self.fit_time_slice(T1_percentile_ret)
            percentiles = prepared_parameter_dict['fit_para']['TC_percentile']
            percentile_names = ['P' + str(p) for p in percentiles]

            percentile_fit = percentile_ret['fit']
            phase_ret = {
                'percentile': {
                    'before': {},
                    'after': {}
                },
                'average': None,
                'collect_prod': None,
                'collect_cum': None,
            }
            ####
            before_dict = {}
            after_dict = {}
            for p_name in percentile_names:
                before_dict[p_name] = {'segments': jsonify_segments(percentile_fit[p_name]['orig_seg'])}
                after_dict[p_name] = {'segments': jsonify_segments(percentile_fit[p_name]['match_eur_seg'])}
            phase_ret['percentile']['before'] = before_dict
            phase_ret['percentile']['after'] = after_dict

            if prepared_parameter_dict['best_fit_method'] == 'average':
                phase_ret['average'] = {
                    'before': {
                        'segments': jsonify_segments(percentile_fit['average']['orig_seg'])
                    },
                    'after': {
                        'segments': jsonify_segments(percentile_fit['average']['match_eur_seg'])
                    }
                }
            elif prepared_parameter_dict['best_fit_method'] == 'collect_prod':
                T1_cum_ret = self.T1_cum(prepared_parameter_dict)
                cum_fit_ret = self.fit_cum(T1_cum_ret, percentile_ret)
                phase_ret['collect_prod'] = {'segments': jsonify_segments(cum_fit_ret)}
            elif prepared_parameter_dict['best_fit_method'] == 'collect_cum':
                T1_cum_ret = self.T1_cum(prepared_parameter_dict)
                cum_fit_ret = self.fit_cum(T1_cum_ret, percentile_ret)
                phase_ret['collect_cum'] = {'segments': jsonify_segments(cum_fit_ret)}

            ret[phase] = phase_ret

        return ret
