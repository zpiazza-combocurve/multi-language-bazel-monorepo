import numpy as np
from combocurve.science.core_function.helper import append_weight_to_fit_data
import combocurve.science.deterministic_forecast.forecast_methods as forecast_methods
from combocurve.science.forecast.auto_forecast_warnings import (MATCH_EUR_TOO_LOW, MATCH_EUR_SHUTIN_WARNING,
                                                                LowDataErrorType)
from combocurve.science.forecast.automatic_segmentation import get_peaks
from combocurve.science.forecast.automatic_classifiers import dap_classifier, get_idx
from combocurve.science.core_function.skeleton_filter import ZERO_THRESHOLD, filtering
from combocurve.science.core_function.helper import convert_daily_use_actual_days

MATCH_EUR_AVAILABLE = [
    'arps_modified_wp', 'arps_modified_free_peak', 'arps_modified_fulford', 'arps_modified_fp_fulford'
]


def apply_forecast(  # noqa: C901
        index: np.ndarray,
        target_values: np.ndarray,
        forecast_type: str,
        data_freq: str,
        model_name: str,
        cur_phase: str,
        is_deterministic: bool,
        percentile: list = None,  # Probabilistic
        base_values: np.ndarray = None,  # Ratio
        base_phase: str = None,  # Ratio
        target_eur: float = None,  # Match EUR
        error_percentage: float = None,  # Match EUR
        **forecast_settings) -> dict:
    # We are only forecasting one phase at a time. Parsing of data from front
    # end is taken care of in the service.
    # index is 1-d array of production dates.
    # target_values is 1-d array of production values.
    # base_values is only used in ratio, a 1-d array of base production values.
    # forecast settings are all of the settings, including model specific parameters.

    # Data prep and cleaning.
    if forecast_type == 'ratio':
        raw_values = target_values / base_values
    else:
        raw_values = target_values
    raw_data = np.stack((index, raw_values), axis=1).astype(float)
    raw_data[raw_data[:, 1] < 0, 1] = 0
    if forecast_type == 'match_eur':
        cum_data = np.nansum(raw_data[:, 1])
        rest_eur = target_eur - cum_data
    if data_freq == 'monthly' and forecast_type != 'ratio':
        convert_daily_use_actual_days(raw_data)
    dne_mask = np.isnan(raw_data[:, 1]) | np.isinf(raw_data[:, 1])
    data_wo_none = raw_data[~dne_mask, :]
    raw_data[np.isnan(raw_data)] = 0
    data_wo_none = append_weight_to_fit_data(data_wo_none, forecast_settings)
    filtered_data, idx_range = filtering(data_freq).body(data_wo_none, forecast_settings)

    # Segmentation
    if forecast_type == 'ratio':
        forecast_settings['peak_preference'] = 'start_point'
        forecast_settings['peak_sensitivity'] = 'low'
    t_peak, t_max, first_peak, is_shutin = get_peaks(filtered_data, data_wo_none, raw_data, data_freq, idx_range,
                                                     **forecast_settings)

    # Classification
    dap_class = dap_classifier(filtered_data, raw_data, t_peak, t_max, data_freq, is_shutin, forecast_type, model_name,
                               **forecast_settings)
    first_and_last_indices = get_idx(raw_data, filtered_data, model_name, data_freq, dap_class, t_peak,
                                     **forecast_settings)
    t_end_data = first_and_last_indices['t_end_data']
    t_end_life = first_and_last_indices['t_end_life']
    t_first = first_and_last_indices['t_first']

    # Set the low-data error message
    low_data_warning_message = LowDataErrorType.DEFAULT
    if raw_data.shape[0] == 0:  # Check that we have any data of selected resolution
        if data_freq == 'monthly':
            low_data_warning_message = LowDataErrorType.NO_MONTHLY
        else:
            low_data_warning_message = LowDataErrorType.NO_DAILY
    elif filtered_data.shape[0] <= 1:  # Check that we have at least 2 datapoints after filtering
        low_data_warning_message = LowDataErrorType.FILTERED
    # Check that we have at least 1 data point after the peak
    elif t_peak and filtered_data[filtered_data[:, 0] > t_peak].shape[0] == 0:
        low_data_warning_message = LowDataErrorType.PEAKS

    # Branch into individual forecasters.

    # Deterministic rate forecast.
    if forecast_type == 'rate':

        # Standard rate forecast.
        if dap_class['dap_cat'] == 'enough_to_forecast' or (dap_class['dap_cat'] == 'low_data_forecast'
                                                            and model_name not in MATCH_EUR_AVAILABLE):
            return forecast_methods.deterministic_rate_forecast(filtered_data, t_peak, t_first, t_end_data, t_end_life,
                                                                model_name, data_freq, **forecast_settings)

        # Forecast shut-in.
        elif dap_class['dap_cat'] == 'shutin':
            return forecast_methods.shutin_forecast(raw_data, t_end_data, t_end_life, is_deterministic, False, None,
                                                    data_freq, percentile)

        # Match EUR w/ <=3 data points.
        elif (dap_class['dap_cat'] == 'low_data_forecast'
              or dap_class['dap_cat'] == 'only_peak') and model_name in MATCH_EUR_AVAILABLE:
            return forecast_methods.low_data_rate_forecast(filtered_data, data_wo_none, raw_data, cur_phase, t_end_data,
                                                           t_end_life, t_peak, t_first, dap_class, model_name,
                                                           data_freq, **forecast_settings)
        # Otherwise too little data to forecast.
        else:
            return forecast_methods.little_data_forecast(low_data_warning_message)

    # Deterministic ratio forecast.
    if forecast_type == 'ratio':

        # Standard ratio forecast.
        if dap_class['dap_cat'] == 'fit_ratio':
            return forecast_methods.ratio_forecast(filtered_data, model_name, t_first, t_end_data, t_end_life,
                                                   base_phase, data_freq, **forecast_settings)

        # Shutin ratio forecast.
        elif dap_class['dap_cat'] == 'shutin':
            return forecast_methods.shutin_forecast(raw_data, t_end_data, t_end_life, is_deterministic, True,
                                                    base_phase, data_freq, percentile)
        # Otherwise too little data to forecast.
        else:
            return forecast_methods.little_data_forecast(low_data_warning_message)

    # Match EUR forecast.
    if forecast_type == 'match_eur':

        # Standard match EUR forecast.
        if abs(rest_eur) > ZERO_THRESHOLD and dap_class['dap_cat'] in [
                'enough_to_forecast', 'low_data_forecast', 'only_peak'
        ]:
            ret, _, _ = forecast_methods.match_eur_forecast(raw_data=raw_data,
                                                            filtered_data=filtered_data,
                                                            target_eur=target_eur,
                                                            rest_eur=rest_eur,
                                                            error_percentage=error_percentage,
                                                            model_name=model_name,
                                                            data_freq=data_freq,
                                                            cur_phase=cur_phase,
                                                            t_first=t_first,
                                                            t_end_data=t_end_data,
                                                            t_end_life=t_end_life,
                                                            t_peak=t_peak,
                                                            **forecast_settings)
            return ret

        # No prior forecast or EUR lower than cumulative production. Use regular rate forecast.
        elif abs(rest_eur) <= ZERO_THRESHOLD and dap_class['dap_cat'] == 'enough_to_forecast':
            update_body = forecast_methods.deterministic_rate_forecast(filtered_data, t_peak, t_first, t_end_data,
                                                                       t_end_life, model_name, data_freq,
                                                                       **forecast_settings)
            update_body['warning'] = MATCH_EUR_TOO_LOW
            return update_body

        # No prior forecast or EUR lower than cumulative production. Use regular rate forecast.
        elif abs(rest_eur) <= ZERO_THRESHOLD and (dap_class['dap_cat'] == 'low_data_forecast'
                                                  or dap_class['dap_cat'] == 'only_peak'):
            update_body = forecast_methods.low_data_rate_forecast(filtered_data, data_wo_none, raw_data, cur_phase,
                                                                  t_end_data, t_end_life, t_peak, t_first, dap_class,
                                                                  model_name, data_freq, **forecast_settings)
            update_body['warning'] = MATCH_EUR_TOO_LOW
            return update_body

        # Forecast shut-in.
        elif dap_class['dap_cat'] == 'shutin':
            update_body = forecast_methods.shutin_forecast(raw_data, t_end_data, t_end_life, is_deterministic, False,
                                                           None, data_freq, percentile)
            update_body['warning'] = MATCH_EUR_SHUTIN_WARNING
            return update_body

        # Otherwise too little data to forecast.
        else:
            return forecast_methods.little_data_forecast(low_data_warning_message)
