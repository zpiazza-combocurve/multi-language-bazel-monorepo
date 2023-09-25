from copy import deepcopy
import numpy as np
from combocurve.science.core_function.skeleton_peak import peak, default_para, last_para_dict_s
from combocurve.science.core_function.skeleton_peak_new import last_peak

### remove the DAP_error threshold case, use hardset days only
# This is now totally removed. If there is one data point after the peak, either monthly or daily, we forecast.
# class_dict = {'daily': {'CFD': 10, 'DAP': [8, 16]}, 'monthly': {'CFD': 50, 'DAP': [40, 100]}}


class classification:
    def __init__(self, data_freq):
        self.data_freq = data_freq

    def set_freq(self, data_freq):
        self.data_freq = data_freq

    def classify(self, filtered_data, entire_data, raw_data, idx_range, para_dict):
        # 1. check flat
        # 2. check for class 1: no valid data point(all 0's and not reaching flat thres)
        # 3. check for class 2: has 1 valid data point, and number of trailing 0's is less than the flat thres

        #### check for flat/empty
        flat_thres = para_dict['flat_forecast_thres']

        raw_data[np.isnan(raw_data)] = 0

        shutin_check_idx = (np.datetime64('today') - np.datetime64('1900-01-01')).astype(int) - flat_thres

        is_shutin = False
        if raw_data.shape[0] > 1:
            check_data = raw_data[raw_data[:, 0] >= shutin_check_idx, :]
            is_shutin = check_data.shape[0] == 0 or (check_data[:, 1] == 0).all()

        if is_shutin:
            label = 11
            peak_idx = None
            first_peak = None
        else:
            #### check for class 1:
            if np.all(filtered_data[:, 1] == 0):
                label = 1
                peak_idx = None
                first_peak = None
            else:
                ## here we have at least 1 non-0 data
                ### get peaks
                peak_preference = para_dict['peak_preference']
                peak_sens = para_dict['peak_sensitivity']
                p = peak()

                cp_default_para = deepcopy(default_para)
                cp_default_para[self.data_freq]['last_para_dict'] = last_para_dict_s[self.data_freq][peak_sens]

                peaks_mask_data = p.find(filtered_data, cp_default_para[self.data_freq])
                if self.data_freq == 'monthly':
                    month_last_peak, use_data = last_peak(entire_data, filtered_data, idx_range)
                    peaks_mask_data['auto'] = month_last_peak
                else:
                    peaks_mask_data['auto'] = peaks_mask_data['last']
                max_peak = peaks_mask_data['max']
                peak_idx = peaks_mask_data[peak_preference]
                first_peak = peak_idx == peaks_mask_data['first']
                if (filtered_data[filtered_data[:, 0] >= peak_idx, 1] > 0).sum() > 1:
                    if peak_idx == max_peak:
                        label = 8
                    else:
                        label = 10
                else:
                    label = 2
        return peak_idx, label, first_peak

        # No longer separating by labels. If there is one point after peak we forecast w/ regression,
        # otherwise we give a low data warning and don't forecast.
        #        ### labels
        #        if np.sum(filtered_data[:, 1] != 0) == 1:
        #            label = 2
        #        else:
        #            label_branching = {
        #                'DAP_0_max_peak_True': 3,
        #                'DAP_1_max_peak_True': 4,
        #                'DAP_2_max_peak_True': 8,
        #                'DAP_0_max_peak_False': 5,
        #                'DAP_1_max_peak_False': 6,
        #                'DAP_2_max_peak_False': 10
        #            }
        #            DAP = filtered_data[-1, 0] - peak_idx
        #            DAP_thres = class_dict[self.data_freq]['DAP']
        #
        #            DAP_cat = (DAP > np.array(DAP_thres)).sum()
        #            use_max_peak = (peak_idx == max_peak)
        #            this_str = 'DAP_' + str(DAP_cat) + '_max_peak_' + str(use_max_peak)
        #            label = label_branching[this_str]
        #
        # return peak_idx, label, first_peak
