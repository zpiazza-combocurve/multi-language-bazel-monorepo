import numpy as np
from typing import Any, Dict, Union
from combocurve.science.core_function.skeleton_filter import ZERO_THRESHOLD
from combocurve.shared.date import index_today
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.core_function.transformation_instances import transform_s
from combocurve.science.core_function.helper import shift_idx

# Deprecated. We now forecast everything that has at least one data point after peak
# CLASS_THRESHOLDS = {'daily': np.array([8, 16]), 'monthly': np.array([40, 100])}
# DAP_CLASSES = {0: 'low', 1: 'mid', 2: 'high'}
DAP_EXISTS_LABELS = ('enough_to_forecast', 'too_little_to_forecast')
LOW_DATA_THRESHOLDS = {'daily': 32, 'monthly': 3}
FIXED_PEAK_DECLINE_MODELS = [
    'arps_modified_wp', 'arps_modified_fulford', 'arps_wp', 'arps_fulford', 'exp_wp', 'arps_exp_dec',
    'arps_linear_flow_fulford', 'segment_arps_4_wp'
]

# Mapping w/ old label system:
# 'shutin' is label 11.
# 'zero_or_empty' is label 1.
# 'one_nonzero' is label 2.
# 'low' and 'use_max_peak' is label 3.
# 'mid' and 'use_max_peak' is label 4.
# 'high' and 'use_max_peak' is label 8.
# 'low' and not 'use_max_peak' is label 5.
# 'mid' and not 'use_max_peak' is label 6.
# 'high' and not 'use_max_peak' is label 10.
# There has never been label 7 or 9.
# 'fit_ratio' is required to fit ratio. Never had a specific label.


def dap_classifier(filtered_data: np.ndarray,
                   raw_data: np.ndarray,
                   t_peak: int,
                   t_max: int,
                   data_freq: str,
                   is_shutin: bool,
                   forecast_type: str,
                   model_name: str,
                   low_data_threshold: int = None,
                   use_low_data_forecast: bool = True,
                   use_minimum_data: bool = False,
                   short_prod_threshold: int = 0,
                   **_) -> Dict[str, Union[str, bool]]:
    # Classify data based on the number of data points after the peak.
    # Returns the following classifications:
    # 'dap_cat:
    #     'shutin': Generate shutin forecast.
    #     'fit_ratio': ratio is always fit from first peak. Just check we have > 1 data point.
    #     'zero_or_empty': No data at all
    #     'only_peak': Peak found, but no data afterward
    #     'low_data_forecast': At least 1 data point after peak, up to low data thresholds.
    #     'enough_to_forecast': At least enough data after peak to generate forecast.
    #     'too_little_to_forecast': Anything else. Shouldn't happen.
    # 'use_max_peak': True or False indicates whether t_peak is the true maximum of filtered_data.
    thresh = max(1, low_data_threshold
                 ) if low_data_threshold is not None and low_data_threshold != '' else LOW_DATA_THRESHOLDS[data_freq]
    if t_peak is not None:
        q_peak = float(filtered_data[filtered_data[:, 0] == t_peak, 1])
        n_dap = (filtered_data[filtered_data[:, 0] >= t_peak, 1] > 0).sum()
    if use_minimum_data and raw_data.shape[0] < short_prod_threshold:
        dap_cat = 'too_little_to_forecast'
        use_max_peak = t_peak == t_max
    elif is_shutin or (t_peak is not None and model_name in FIXED_PEAK_DECLINE_MODELS and q_peak < ZERO_THRESHOLD):
        dap_cat = 'shutin'
        use_max_peak = None
    elif forecast_type == 'ratio' and filtered_data.shape[0] > 1:
        dap_cat = 'fit_ratio'
        use_max_peak = None
    elif t_peak is None or forecast_type == 'ratio':
        dap_cat = 'zero_or_empty'
        use_max_peak = None
    elif n_dap == 1:
        if use_low_data_forecast:
            dap_cat = 'only_peak'
            use_max_peak = None
        else:
            dap_cat = 'too_little_to_forecast'
            use_max_peak = t_peak == t_max
    elif n_dap <= thresh:
        if use_low_data_forecast:
            dap_cat = 'low_data_forecast'
            use_max_peak = None
        else:
            dap_cat = 'enough_to_forecast'
            use_max_peak = t_peak == t_max
    elif n_dap > thresh:
        dap_cat = 'enough_to_forecast'
        use_max_peak = t_peak == t_max
    else:
        dap_cat = 'too_little_to_forecast'
        use_max_peak = t_peak == t_max

    return {'dap_cat': dap_cat, 'use_max_peak': use_max_peak}


def get_idx(data: np.ndarray, filtered_data: np.ndarray, model_name: str, data_freq: str,
            dap_class: Dict[str, Union[str, bool]], t_peak: int, well_life_dict: Dict[str, str],
            **ignored_kwargs: Any) -> Dict[str, int]:
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
    if filtered_data.size > 0:
        t_first = filtered_data[0, 0]
        best_t_first = t_first
    else:  ## not possible
        t_first = best_t_first = index_today()

    ### get t_first_valid_data
    if dap_class['dap_cat'] in DAP_EXISTS_LABELS and t_peak is not None:
        this_trans_type = mm.models[model_name].default_transform_type
        clean_data = transform_s[this_trans_type][data_freq](filtered_data, t_peak)
        if clean_data.shape[0] == 0:  ## no forecast or flat/zero, does not need t_first, we give it for consistency
            t_first_valid_data = t_first
        else:
            t_first_valid_data = clean_data[0, 0]
    else:
        t_first_valid_data = t_first

    #### get_t_end_life
    if well_life_dict['well_life_method'] == 'fixed_date':
        t_end_life = well_life_dict['fixed_date']
    else:
        if data.shape[0] > 0:
            if well_life_dict['well_life_method'] == 'duration_from_first_data':
                t_begin = data[0, 0]
            elif well_life_dict['well_life_method'] == 'duration_from_last_data':
                t_begin = data[-1, 0] + 1
            elif well_life_dict['well_life_method'] == 'duration_from_today':
                t_begin = index_today()
        else:
            t_begin = t_first

        t_end_life = shift_idx(t_begin, well_life_dict['num'], well_life_dict['unit'])
        # Should make sure that the end of life is no earlier than the end of production data.
        if data.shape[0] > 0:
            t_end_life = max(data[-1, 0], t_end_life)
    #### get_t_end_data
    if filtered_data.shape[0] > 0:
        t_end_data = filtered_data[-1, 0]
    else:
        t_end_data = t_first

    # Should no longer be necessary since we're enforcing t_end_life to be no earlier than end of production,
    # but we'll keep it here just in case.
    if t_end_life < t_end_data:
        t_end_life = t_end_data
    #########
    ret['t_first'] = t_first
    ret['best_t_first'] = best_t_first
    ret['t_first_valid_data'] = t_first_valid_data
    ret['t_end_data'] = t_end_data
    ret['t_end_life'] = t_end_life
    return ret
