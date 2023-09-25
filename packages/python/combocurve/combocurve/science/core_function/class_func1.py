import numpy as np
from datetime import date
from copy import deepcopy
from combocurve.science.core_function.skeleton_classify_new import classification
from combocurve.science.core_function.skeleton_dca import get_dca
from combocurve.science.core_function.skeleton_no_data import get_no_data
from combocurve.science.core_function.helper import shift_idx, append_weight_to_fit_data
from combocurve.science.core_function.skeleton_filter import filtering
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.core_function.transformation_instances import transform_s

date_0 = np.datetime64('1900-01-01')


class func1:
    def T1(self, well_phase):
        analysis_data = np.array([well_phase['data']['idx'], well_phase['data']['value']], dtype='float').transpose()
        para_dict = well_phase['para_dict']

        return {'para_dict': para_dict, 'analysis_data': analysis_data, 'data_freq': well_phase['data_freq']}

    def analysis(self, T1_out):
        data_freq = T1_out['data_freq']
        classifier = classification(data_freq)
        det = get_dca()
        det.set_freq(data_freq)
        no_data = get_no_data()
        no_data.set_freq(data_freq)

        para_dict = T1_out['para_dict']
        model_name = para_dict['model_name']
        data = T1_out['analysis_data']
        data_wo_none = data[~np.isnan(data).any(axis=1), :]
        data_wo_none = append_weight_to_fit_data(data_wo_none, para_dict)
        filtered_data, time_range = filtering(data_freq).body(data_wo_none, para_dict)
        t_peak, label, first_peak = classifier.classify(filtered_data, data_wo_none, data, time_range, para_dict)
        ret = self.get_idx(data, filtered_data, para_dict, data_freq, label, t_peak, det)
        ret['t_peak'] = t_peak
        ret['label'] = label
        ret['first_peak'] = first_peak
        ret['filtered_data'] = filtered_data
        ret['entire_data'] = data_wo_none
        ret['raw_data'] = data
        if (7 <= label) & (label <= 10):
            update_range = det.get_range(model_name, para_dict, label)
            penalization_params = mm.models[para_dict['model_name']].get_penalize_params(para_dict)
            this_p, this_p_fixed = det.get_params(filtered_data,
                                                  t_peak,
                                                  label,
                                                  model_name=model_name,
                                                  ranges=update_range,
                                                  penalization_params=penalization_params,
                                                  using_weight=True)
            ret['fit'] = {'p': this_p, 'p_fixed': this_p_fixed}
            goto = 3

        # This is currently impossible to reach. If we allow it, it will cause errors since ML was removed.
        elif (3 <= label) & (label <= 6):
            ret['fit'] = {}
            goto = 2

        elif (1 <= label) & (label <= 2):
            ret['fit'] = {}
            goto = 5
        elif (11 <= label) & (label <= 12):
            ret['fit'] = {}
            goto = 4

        ret['goto'] = goto
        ret['data_freq'] = data_freq
        ret['para_dict'] = para_dict
        return ret

    def T2(self, analysis_out):
        label = analysis_out['label']
        ### index
        analysis_out['best_t_first'] = float(analysis_out['best_t_first'])
        analysis_out['t_first'] = float(analysis_out['t_first'])
        analysis_out['t_first_valid_data'] = float(analysis_out['t_first_valid_data'])
        analysis_out['label'] = float(analysis_out['label'])
        analysis_out['t_end_data'] = float(analysis_out['t_end_data'])
        if analysis_out['first_peak'] is not None:
            analysis_out['first_peak'] = float(analysis_out['first_peak'])

        analysis_out['t_end_life'] = float(analysis_out['t_end_life'])
        if (3 <= label) & (label <= 10):
            analysis_out['t_peak'] = float(analysis_out['t_peak'])

        if (7 <= label) & (label <= 10):
            for k, v in analysis_out['fit'].items():
                analysis_out['fit'][k] = list(map(float, v))
        elif (3 <= label) & (label <= 6):
            for k, v in analysis_out['fit'].items():
                analysis_out['fit'][k] = float(v)

        return analysis_out

    def body(self, input_well_phase):
        well_phase = deepcopy(input_well_phase)
        T1_out = self.T1(well_phase)
        ana_out = self.analysis(T1_out)
        return ana_out

    def get_idx(self, data, filtered_data, para_dict, data_freq, label, t_peak, det):
        # t_first: t_first used in func4 only
        # best_t_first = t_first, used in func2 only
        # t_first_valid_data: used in func2 and func3, when the selected peak is the first peak, use as plot_idx
        # t_end_data: end of data, if no first data, use t_first
        # t_end_life

        #### Question
        # Q1: why there is t_first and best_t_first?
        # A1: t_first === best_t_first, for 2 different use places, syntax of func2 should be "p_name" + "para_name"
        ret = {}

        ### get t_first and best_t_first, t_first = best_t_first
        if filtered_data.shape[0] > 0:
            t_first = filtered_data[0, 0]
            best_t_first = t_first
        else:  ## not possible
            today = np.datetime64(date.today())
            t_first = (today - date_0).astype(int)
            best_t_first = t_first

        ### get t_first_valid_data
        if (label >= 3) and (label <= 10):
            model_name = para_dict['model_name']
            this_trans_type = mm.models[model_name].default_transform_type
            clean_data = transform_s[this_trans_type][data_freq](filtered_data, t_peak)
            if clean_data.shape[0] == 0:  ## no forecast or flat/zero, does not need t_first, we give it for consistency
                t_first_valid_data = t_first
            else:
                t_first_valid_data = clean_data[0, 0]
        else:
            t_first_valid_data = t_first

        #### get_t_end_life
        well_life_dict = para_dict['well_life_dict']
        if well_life_dict['well_life_method'] == 'fixed_date':
            t_end_life = well_life_dict['fixed_date']
        else:
            if data.shape[0] > 0:
                if well_life_dict['well_life_method'] == 'duration_from_first_data':
                    t_begin = data[0, 0]
                elif well_life_dict['well_life_method'] == 'duration_from_last_data':
                    t_begin = data[-1, 0] + 1
                elif well_life_dict['well_life_method'] == 'duration_from_today':
                    today = np.datetime64(date.today())
                    t_begin = (today - date_0).astype(int)
            else:
                t_begin = t_first

            t_end_life = shift_idx(t_begin, well_life_dict['num'], well_life_dict['unit'])
        #### get_t_end_data
        if filtered_data.shape[0] > 0:
            t_end_data = filtered_data[-1, 0]
        else:
            t_end_data = t_first

        if t_end_life < t_end_data:
            t_end_life = t_end_data
        #########
        ret['t_first'] = t_first
        ret['best_t_first'] = best_t_first
        ret['t_first_valid_data'] = t_first_valid_data
        ret['t_end_data'] = t_end_data
        ret['t_end_life'] = t_end_life
        return ret


## per well per phase

# para_dict = {
#     'b2': [1e-05, 2],
#     'D1_eff': [1e-05, 0.99],
#     'D_lim_eff': 0.06,
#     'q_final': 2,
#     'dispersion': 1,
#     'peak_preference': 'max',
#     'peak_sensitivity': 'mid',
#     'ML_data_thres': 0,
#     'flat_forecast_thres': 60,
#     'time_dict': {
#         'mode': 'all',
#         'unit': 'month',
#         'num': 3,
#         'range': ['2019-07-12T00:15:25.814Z', '2019-07-12T00:15:25.814Z']
#     },
#     completely replaces well_life
#     'well_life_dict': {
#         'well_life_method': 'duration_from_first_data', 'duration_from_last_data',
#                             'duration_from_today', 'fixed_date' 4 options
#         'unit': 'month', 'year', 'day', removed when well_life_method === 'fixed_date'
#         'num': 12312, min: 1 max: Infinity; num is date when well_life_method === 'fixed_date',
#                                otherwise num is duration
#     },
#     'D1': [2.7397671238261103e-08, 13.697260273972578],
#     'model_name': 'segment_arps_4_wp',
#     'apply_prob': True,
#     'percentile': [10, 50, 90],
#     'prob_para': ['D1', 'b2']
# }

# well_phase_info = {
#  'well_id' : '123',
#  'phase' : 'oil',
#  'data_freq' : 'daily',
#  'data' : {
#            'idx' : [0],
#            'value' : [2908]
#            },
#  'para_dict' : para_dict
#  }
