import numpy as np
from combocurve.science.core_function.class_transformation import transformation, modifiers
from combocurve.science.core_function.helper import get_peak_idx, round_idx_to_valid
from combocurve.science.core_function.error_funcs import errorfunc_s


class peak:
    def __init__(self, peak_dict=None):
        self.days_thres = 100

    def find(self, data, peak_para_dict):  # noqa: C901
        ## parameter:
        ## @preference: ['max', 'end_flat', 'last']
        ## @data_type : 'daily', might need extra tuning if weekly

        ## para_dict:
        ## daily:
        ## @ef_para_dict = {'alpha': [1, 1], 'k' : 5, 'perc_list' : [0.25, 0.2, 0.15, 0.1, 0.05, 0.03], 'method': 'rmse}
        ## @last_para_dict = {' left_window' : 70, 'weight_range' : [1.1, 1.7]}
        ## @first_para_dict = {' right_window' : 70, 'weight_range' : [1.1, 1.7]}

        ## monthly:
        ## @ef_para_dict = {'alpha': [0.02, 0.02], 'k' : 5, 'perc_list' : [0.25, 0.2, 0.15, 0.1, 0.05, 0.03],
        #                   'method': 'none'}
        ## @last_para_dict = {' left_window' : 100, 'weight_range' : [1.1, 1.7]}
        ## @first_para_dict = {' right_window' : 100, 'weight_range' : [1.1, 1.7]}

        ## output:
        ## exit_flag and t of the peak
        ## exit_flag: -1: not determined, 0: break, 1: succeed, 2: no data at all, 3: data lower than the threshold,
        ## 4: clean_data lower than threshold, 5: no clean data, 6: clean data flat

        ## case 2,5,6: t_peak = None
        ef_para_dict = peak_para_dict['ef_para_dict']
        last_para_dict = peak_para_dict['last_para_dict']
        first_para_dict = peak_para_dict['first_para_dict']
        trans_ops = peak_para_dict['trans_ops']
        trans_para_dict_s = peak_para_dict['trans_para_dict_s']
        #        data_type = peak_para_dict['data_type']
        clean_data_thres = peak_para_dict['clean_data_thres']
        conflict_honor = peak_para_dict['conflict_honor']
        fit_window_dict = peak_para_dict['fit_window_dict']

        ret = {'exit_flag': -1, 'max': None, 'end_flat': None, 'last': None, 'first': None, 'start_point': None}

        # clean_data = data
        no0_mask = data[:, 1] > 0
        no0_data = data[no0_mask, :]

        if no0_data.shape[0] > 0:
            ret['start_point'] = data[0, 0]
        else:
            ret['start_point'] = no0_data[0, 0]

        if data.shape[0] == 0:
            ret['exit_flag'] = 2
        elif (data[-1, 0] - data[0, 0]) < self.days_thres:
            ret['exit_flag'] = 3
            this_peak_idx = get_peak_idx(data)
            this_peak_idx = round_idx_to_valid(this_peak_idx, data)
            ret['max'] = this_peak_idx
            ret['end_flat'] = this_peak_idx
            ret['last'] = this_peak_idx
            ret['first'] = this_peak_idx
        else:
            trans = transformation()
            transformed_data = trans.apply(data, trans_ops, trans_para_dict_s)
            ## clean data here is different from the clean data used for fit
            ## convert it to fit clean data is necessary
            n_clean = transformed_data.shape[0]
            if n_clean == 0:
                transformed_data = trans.apply(data, ['remove_exception'], [{'exceptions': [0]}])
                n_clean = transformed_data.shape[0]

            if n_clean == 0:
                ret['exit_flag'] = 5
            elif np.all(transformed_data[:, 1] == transformed_data[0, 1]):
                ret['exit_flag'] = 6
                this_peak_idx = get_peak_idx(transformed_data)
                this_peak_idx = round_idx_to_valid(this_peak_idx, data)
                ret['max'] = this_peak_idx
                ret['end_flat'] = this_peak_idx
                ret['last'] = this_peak_idx
                ret['first'] = this_peak_idx
            elif n_clean <= clean_data_thres:
                ret['exit_flag'] = 4
                this_peak_idx = get_peak_idx(transformed_data)
                this_peak_idx = round_idx_to_valid(this_peak_idx, data)
                ret['max'] = this_peak_idx
                ret['end_flat'] = this_peak_idx
                ret['last'] = this_peak_idx
                ret['first'] = this_peak_idx
            else:
                ret['exit_flag'] = 1
                max_ind = np.nanargmax(data[:, 1])  ### max_ind changes here
                max_peak = data[max_ind, 0]
                ret['max'] = self.find_truemax(data, max_peak, fit_window_dict['peaks'])
                end_flat_peak = self.find_endflat(transformed_data, ef_para_dict)
                if end_flat_peak == max_peak:
                    ret['end_flat'] = ret['max']
                else:
                    ret['end_flat'] = self.find_truemax(data, end_flat_peak, fit_window_dict['end_flat'])
                last_peak = self.find_last(transformed_data, last_para_dict)
                ret['last'] = self.find_truemax(data, last_peak, fit_window_dict['peaks'])
                first_peak = self.find_first(transformed_data, first_para_dict)
                ret['first'] = self.find_truemax(data, first_peak, fit_window_dict['peaks'])
                for key in ['max', 'end_flat', 'last', 'first']:
                    ret[key] = round_idx_to_valid(ret[key], data)

        if ret['exit_flag'] in [2, 5, 6]:
            return ret
        else:
            if (ret['max'] > ret['end_flat']) | (ret['end_flat'] - ret['max'] < 30):
                ret['end_flat'] = ret['max']

            if ret['end_flat'] > ret['last']:
                if (ret['last'] == ret['max']) | (conflict_honor == 'end_flat'):
                    ret['last'] = ret['end_flat']
                elif conflict_honor == 'last':
                    ret['end_flat'] = ret['last']
            return ret

    def find_truemax(self, data, peak, time_window):
        ## input:
        ## @data: original data
        ## @peak: the peak find by different find() functions, (max, first, last peak)
        ## @fit_para_dict: @time window: defines the range of time within which to find the true max

        ## output:
        ## The true max of max/first/last peak

        time_window = time_window
        peak_mask = (data[:, 0] < (peak + time_window)) & (data[:, 0] >= (peak - time_window))
        peak_data = data[peak_mask, :]
        max_ind = np.argmax(peak_data[:, 1])
        return peak_data[max_ind, 0]

    def find_endflat(self, data, ef_para_dict):
        ## input:
        ## @data: clean_data
        ## @ef_para_dict:
        ## daily:
        ## ef_para_dict = {'alpha': [1,1 ], 'k' : 5, 'perc_list' : [0.25, 0.2, 0.15, 0.1, 0.05, 0.03], 'method': 'rmse'}
        ## monthly:
        ## ef_para_dict = {'alpha': [0.02, 0.02], 'k' : 5, 'perc_list' : [0.25, 0.2, 0.15, 0.1, 0.05, 0.03],
        #                  'method': 'none'}

        ## output:
        ## The end_flat found in clean_data then mapped to orginal data

        alpha = ef_para_dict['alpha']
        alpha_upper = alpha[0]
        alpha_lower = alpha[1]
        k = ef_para_dict['k']
        perc_list = ef_para_dict['perc_list']
        method = ef_para_dict['method']

        mod = modifiers()
        normalize_data = mod.apply(data, 'normalize', {'cols': [0, 1], 'normalize_range': [0, 1]})

        max_ind = np.argmax(normalize_data[:, 1])
        sign = 0

        for perc in perc_list:
            this_perc_range = [normalize_data[max_ind, 0], normalize_data[max_ind, 0] + perc]
            this_perc_mask = (normalize_data[:, 0] < this_perc_range[1]) & (normalize_data[:, 0] >= this_perc_range[0])
            this_perc_data = normalize_data[this_perc_mask, :]

            if this_perc_data.shape[0] > 1:
                Y = this_perc_data[:, 1].reshape(-1, 1)
                X = this_perc_data[:, 0].reshape(-1, 1)
                X = np.concatenate([np.ones(X.shape), X], axis=1)
                A = np.linalg.inv(np.matmul(X.transpose(), X))
                B = np.matmul(X.transpose(), Y)
                beta = np.matmul(A, B)
            else:
                this_y = this_perc_data[0, 1]
                beta = np.array([[this_y], [0]])

            fit_t = normalize_data[this_perc_mask, 0].reshape(-1, 1)
            fit_X = np.concatenate([np.ones(fit_t.shape), fit_t], axis=1)
            fit_v = np.matmul(fit_X, beta)
            fit_true_Y = normalize_data[this_perc_mask, 1].reshape(-1, 1)

            bound_width_upper = errorfunc_s[method](fit_true_Y, fit_v) * alpha_upper
            bound_width_lower = errorfunc_s[method](fit_true_Y, fit_v) * alpha_lower

            check_mask = normalize_data[:, 0] > this_perc_range[0]  # after the maximum
            pred_t = normalize_data[check_mask, 0].reshape(-1, 1)
            pred_X = np.concatenate([np.ones(pred_t.shape), pred_t], axis=1)
            pred_v = np.matmul(pred_X, beta)
            pred_true_Y = normalize_data[check_mask, 1].reshape(-1, 1)
            if pred_true_Y.shape[0] == 0:
                ratio = 0
            else:
                ratio = np.mean(pred_v + bound_width_upper > pred_true_Y)

            if ratio > 0.85:
                sign = 1
                break

        # mae_err = np.mean(np.abs(Y - np.matmul(X,beta)))
        lower_bound = pred_v - bound_width_lower

        if sign == 1:
            for i in range(pred_t.shape[0]):
                if np.all(pred_true_Y[i:(i + k)] < lower_bound[i:(i + k)]):
                    break
            check_real_t = data[check_mask, 0]
            #            t_after_break = check_real_t[i:]
            #            ind_max_after_break = np.argmax(pred_true_Y[i:])
            #            end_flat = t_after_break[ind_max_after_break]
            if i != 0:
                end_flat = check_real_t[i - 1]
            else:
                end_flat = data[max_ind, 0]

        else:
            end_flat = data[max_ind, 0]

        return end_flat

    def find_last(self, data, last_para_dict):
        ## input:
        ## @data: clean_data
        ## @last_para_dict:
        ## daily:
        ## @last_para_dict = {'left_window' : 70, 'weight_range' : [1.1, 1.7]}
        ## monthly:
        ## @last_para_dict = {'left_window' : 100, 'weight_range' : [1.1, 1.7]}

        ## output:
        ## The last_peak found in clean_data then mapped to orginal data

        left_window = last_para_dict['left_window']
        weight_range = last_para_dict['weight_range']
        min_w = weight_range[0]
        max_w = weight_range[1]
        rate = data[:, 1]
        t = data[:, 0]
        max_ind = np.argmax(rate)
        max_q = np.max(rate)

        def weight(this_q):
            return min_w + (max_w - min_w) * ((max_q - this_q) / max_q)**2

        for idx in np.arange(data.shape[0])[::-1]:
            this_q = rate[idx]
            left_cands = np.argwhere((-left_window < (t - t[idx])) & ((t - t[idx]) < 0)).reshape(-1, )
            rest_cands = np.argwhere(0 < (t - t[idx])).reshape(-1, )
            if (left_cands.shape[0] == 0):
                cond_1 = True
                cond_2 = True
            else:
                cond_1 = np.all((rate[left_cands] < rate[idx]))
                cond_2 = (rate[idx] > weight(this_q) * np.mean(rate[left_cands]))
            cond_1_2 = cond_1 & cond_2
            if (rest_cands.shape[0] == 0):
                cond_3 = True
            else:
                cond_3 = np.all(rate[rest_cands] < rate[idx])
            if (cond_1_2 & cond_3) | (idx == max_ind):  ## go to maximum peak at most
                break
            elif (cond_1_2 & (1 - cond_3)):
                idx = rest_cands[np.argmax(rate[rest_cands])]
                break

        return t[idx]

    def find_first(self, data, first_para_dict):
        ## input:
        ## @data: clean_data
        ## @first_para_dict:
        ## daily:
        ## @first_para_dict = {'right_window' : 70, 'weight_range' : [1.1, 1.7]}
        ## monthly:
        ## @first_para_dict = {'right_window' : 100, 'weight_range' : [1.1, 1.7]}

        ## output:
        ## The first_peak found in clean_data then mapped to orginal data

        right_window = first_para_dict['left_window']
        weight_range = first_para_dict['weight_range']
        min_w = weight_range[0]
        max_w = weight_range[1]
        rate = data[:, 1]
        t = data[:, 0]
        max_ind = np.argmax(rate)
        max_q = np.max(rate)

        def weight(this_q):
            return min_w + (max_w - min_w) * ((max_q - this_q) / max_q)**2

        for idx in np.arange(data.shape[0])[::1]:
            this_q = rate[idx]
            right_cands = np.argwhere(((t - t[idx]) < right_window) & ((t - t[idx]) > 0)).reshape(-1, )
            rest_cands = np.argwhere((t - t[idx]) < 0).reshape(-1, )
            if (right_cands.shape[0] == 0):
                cond_1 = True
                cond_2 = True
            else:
                cond_1 = np.all((rate[right_cands] < rate[idx]))
                cond_2 = (rate[idx] > weight(this_q) * np.mean(rate[right_cands]))
            cond_1_2 = cond_1 & cond_2
            if (rest_cands.shape[0] == 0):
                cond_3 = True
            else:
                cond_3 = np.all(rate[rest_cands] < rate[idx])
            if (cond_1_2 & cond_3) | (idx == max_ind):  ## go to maximum peak at most
                break
            elif (cond_1_2 & (1 - cond_3)):
                idx = rest_cands[np.argmax(rate[rest_cands])]
                break

        return t[idx]


default_para = {}

default_para['daily'] = {
    'ef_para_dict': {
        'alpha': [1, 1],
        'k': 5,
        'perc_list': [0.25, 0.2, 0.15, 0.1, 0.05, 0.03, 0.0001],
        'method': 'rmse'
    },
    'last_para_dict': {
        'left_window': 70,
        'weight_range': [1.1, 1.7]
    },
    'first_para_dict': {
        'left_window': 70,
        'weight_range': [1.1, 1.7]
    },
    'trans_ops': ['remove_exception', 'group'],
    'trans_para_dict_s': [{
        'exceptions': [0]
    }, {
        'groupdays': 7
    }],
    # 'trans_ops': ['remove_exception', 'density_outlier', 'group', 'moving_outlier'],
    # 'trans_para_dict_s': [{
    #     'exceptions': [0]
    # }, {
    #     'dens_dist': 0.02,
    #     'dens_ratio': 0.08
    # }, {
    #     'groupdays': 7
    # }, {
    #     'dens_dist': 0.1,
    # }],
    'clean_data_thres': 5,
    'conflict_honor': 'end_flat',
    'fit_window_dict': {
        'peaks': 30,
        'end_flat': 3
    }
}

default_para['monthly'] = {
    'ef_para_dict': {
        'alpha': [0.02, 0.02],
        'k': 5,
        'perc_list': [0.25, 0.2, 0.15, 0.1, 0.05, 0.03, 0.0001],
        'method': "none"
    },
    'last_para_dict': {
        'left_window': 100,
        'weight_range': [1.1, 1.7]
    },
    'first_para_dict': {
        'left_window': 70,
        'weight_range': [1.1, 1.7]
    },
    'trans_ops': ['remove_exception'],
    'trans_para_dict_s': [{
        'exceptions': [0]
    }],
    # 'trans_ops': ['remove_exception', 'density_outlier'],
    # 'trans_para_dict_s': [{
    #     'exceptions': [0]
    # }, {
    #     'dens_dist': 0.05,
    #     'dens_ratio': 0.08
    # }],
    'clean_data_thres': 1,
    'conflict_honor': 'last',
    'fit_window_dict': {
        'peaks': 50,
        'end_flat': 5
    }
}

last_para_dict_s = {
    'daily': {
        'low': {
            'left_window': 200,
            'weight_range': [1.2, 1.8]
        },
        'mid': {
            'left_window': 140,
            'weight_range': [1.1, 1.8]
        },
        'high': {
            'left_window': 70,
            'weight_range': [1.1, 1.7]
        }
    },
    'monthly': {
        'low': {
            'left_window': 300,
            'weight_range': [1.2, 1.8]
        },
        'mid': {
            'left_window': 200,
            'weight_range': [1.1, 1.8]
        },
        'high': {
            'left_window': 100,
            'weight_range': [1.1, 1.7]
        }
    }
}
