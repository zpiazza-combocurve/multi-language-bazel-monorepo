from copy import copy
import numpy as np
from typing import Any, List, Tuple
from combocurve.shared.date import index_today
from combocurve.science.core_function.skeleton_peak import peak, default_para, last_para_dict_s
from combocurve.science.core_function.skeleton_peak_new import last_peak


def get_peaks(filtered_data: np.ndarray, entire_data: np.ndarray, raw_data: np.ndarray, data_freq: str,
              idx_range: List[int], flat_forecast_thres: int, peak_preference: str, peak_sensitivity: str,
              **ignored_kwargs: Any) -> Tuple[int, int, bool, bool]:
    # Segment data based on user's peak preference. Returns
    # t_peak: index of peak used for forecast fit
    # t_max: index of largest peak in filtered_data
    # first_peak: bool of whether t_peak is the first peak index in filtered_data

    t_peak = first_peak = t_max = None

    # Check for flat or empty
    shutin_check_idx = index_today() - flat_forecast_thres
    is_shutin = False
    if raw_data.shape[0] > 1:
        check_data = raw_data[raw_data[:, 0] >= shutin_check_idx, :]
        is_shutin = check_data.shape[0] == 0 or (check_data[:, 1] == 0).all() or (filtered_data[:, 1] == 0).all()

    if not is_shutin and not (filtered_data[:, 1] == 0).all():
        ## here we have at least 1 non-0 data
        ### get peaks
        p = peak()

        cp_default_para = copy(default_para)
        cp_default_para[data_freq]['last_para_dict'] = last_para_dict_s[data_freq][peak_sensitivity]

        peaks_mask_data = p.find(filtered_data, cp_default_para[data_freq])
        if data_freq == 'monthly' and peak_preference == 'auto':
            month_last_peak, _ = last_peak(entire_data, filtered_data, idx_range)
            peaks_mask_data['auto'] = month_last_peak
        else:
            peaks_mask_data['auto'] = peaks_mask_data['last']
        t_max = peaks_mask_data['max']
        t_peak = peaks_mask_data[peak_preference]
        first_peak = t_peak == peaks_mask_data['first']

    return t_peak, t_max, first_peak, is_shutin
