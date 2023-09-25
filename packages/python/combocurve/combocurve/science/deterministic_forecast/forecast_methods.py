from copy import copy
import numpy as np
from typing import Any
from combocurve.science.core_function.skeleton_dca import get_dca
from combocurve.science.core_function.skeleton_filter import ZERO_THRESHOLD, filtering
from combocurve.science.deterministic_forecast.templates import EMPTY_P_SEGS, EMPTY_RATIO, return_template
from combocurve.science.forecast.auto_forecast_warnings import RATE_TO_EUR_WARNING, LowDataErrorType
from combocurve.science.forecast.auto_forecast_warnings import NO_WARNING
from combocurve.science.forecast.auto_forecast_warnings import eur_match_fail
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.forecast.automatic_classifiers import dap_classifier, get_idx
from combocurve.science.forecast.automatic_segmentation import get_peaks
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.shared.date import date_from_index, days_from_1900, last_day_of_month
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.utils.constants import DAYS_IN_YEAR


def deterministic_rate_forecast(filtered_data: np.ndarray,
                                t_peak: int,
                                t_first: int,
                                t_end_data: int,
                                t_end_life: int,
                                model_name: str,
                                data_freq: str,
                                optimizer=None,
                                **model_specific_params: Any) -> dict:
    # Filtered data is of shape (n, 3), where n is the number of data points, first column
    # is index values, second column is production values, and third column is weights.
    # Expects enough nonzero data to form a fit. Other cases are handled in forecast_body.
    det = get_dca()
    det.set_freq(data_freq)
    if optimizer is not None:
        det.set_optimizer(optimizer)
    ranges = det.get_range(model_name, model_specific_params, None)
    penalization_params = mm.models[model_name].get_penalize_params(model_specific_params)
    p, p_fixed = det.get_params(data=filtered_data,
                                t_peak=t_peak,
                                label=None,
                                model_name=model_name,
                                ranges=ranges,
                                penalization_params=penalization_params,
                                using_weight=True)
    this_model = mm.models[model_name]
    p2seg_dict = this_model.get_p2seg_dict(model_specific_params, {
        't_first': t_first,
        't_end_data': t_end_data,
        't_end_life': t_end_life
    })
    best_segs = this_model.p2seg(p, p_fixed, p2seg_dict)
    # TODO: Need to fix in each models p2seg to ensure floats so that we don't have to make a second pass here.
    for seg in best_segs:
        for k, v in seg.items():
            if type(v) != str:
                seg[k] = float(v)
    P_dict = EMPTY_P_SEGS
    P_dict['best'].update([('segments', best_segs)])
    forecast_out = return_template(P_dict=P_dict, data_freq=data_freq)
    return forecast_out


def ratio_forecast(filtered_data: np.ndarray, model_name: str, t_first: int, t_end_data: int, t_end_life: int,
                   base_phase: str, data_freq: str, **model_specific_params: Any) -> dict:
    det = get_dca()
    det.set_freq(data_freq)
    t_peak = filtered_data[0, 0]
    update_range = det.get_range(model_name, model_specific_params, None)
    p, p_fixed = det.get_params(filtered_data,
                                t_peak,
                                label=None,
                                model_name=model_name,
                                ranges=update_range,
                                using_weight=True)
    p2seg_dict = mm.models[model_name].get_p2seg_dict(model_specific_params, {
        't_first': t_first,
        't_end_data': t_end_data,
        't_end_life': t_end_life
    })
    segs = mm.models[model_name].p2seg(p, p_fixed, p2seg_dict)
    # TODO: Need to fix in each models p2seg to ensure floats so that we don't have to make a second pass here.
    for seg in segs:
        for k, v in seg.items():
            if type(v) != str:
                seg[k] = float(v)
    ratio = EMPTY_RATIO
    ratio.update([('segments', segs), ('basePhase', base_phase), ('x', 'time')])
    forecast_out = return_template(P_dict={}, forecastType='ratio', ratio=ratio, data_freq=data_freq)

    return forecast_out


def little_data_forecast(warning_message: LowDataErrorType = LowDataErrorType.DEFAULT) -> dict:
    # Just gives warning, does not update forecast
    warning_body = {'status': True, 'message': warning_message.value}
    ret = return_template(None, None, None, None, warning_body, None, None, None)
    return ret


def match_eur_forecast(raw_data: np.ndarray,
                       filtered_data: np.ndarray,
                       target_eur: float,
                       rest_eur: float,
                       error_percentage: float,
                       model_name: str,
                       data_freq: str,
                       cur_phase: str,
                       t_first: int,
                       t_end_data: int,
                       t_end_life: int,
                       t_peak: int,
                       b_prior: float = None,
                       b_strength: str = 'Low',
                       **model_specific_params: Any) -> dict:

    best_segs = []
    warning = NO_WARNING
    forecastType = 'rate'
    forecasted = True
    forecastSubType = 'automatic'
    P_dict = {}
    ratio = {
        'segments': [],
        'diagnostics': {},
        'basePhase': None,
        'x': None,
    }

    this_model = mm.models[model_name]
    p_candidates = this_model.get_match_eur_candidates(model_specific_params, None, filtered_data)
    end_data_idx = raw_data[-1, 0]
    # For monthly, data ends on last day of month.
    if data_freq == 'monthly':
        end_data_idx = days_from_1900(last_day_of_month(date_from_index(end_data_idx)))

    left_idx = end_data_idx + 1
    right_idx = t_end_life
    q_peak = filtered_data[filtered_data[:, 0] == t_peak, 1]
    p2seg_dict = this_model.get_p2seg_dict(model_specific_params, {'t_end_data': t_end_data, 't_end_life': t_end_life})
    vec_eurs = this_model.calc_eurs(left_idx, right_idx, t_peak, q_peak, p_candidates, p2seg_dict)

    eurs_combo = np.stack((np.abs(vec_eurs - rest_eur), *p_candidates), axis=1)
    eurs_combo = eurs_combo[abs(eurs_combo[:, 0]).argsort()]

    # For large search spaces, only take the top 5%
    if eurs_combo.shape[0] >= 500:
        eurs_combo = eurs_combo[:int(eurs_combo.shape[0] * 0.05), :]
    eurs_mask = eurs_combo[:, 0] <= target_eur * error_percentage

    # Potentially expand window to try to match EUR.
    new_error = copy(error_percentage)
    threshold_is_met = eurs_mask.sum() > 0
    while not threshold_is_met and new_error < error_percentage + 1:
        new_error += 0.05
        eurs_mask = eurs_combo[:, 0] <= target_eur * new_error
        threshold_is_met = eurs_mask.sum() > 0

    if not threshold_is_met:
        # Couldn't get EUR within a reasonable threshold, just find best fit amongst the EURs.
        eurs_mask[...] = True
    eurs_combo = eurs_combo[eurs_mask]
    _, best_p, best_p_fixed = this_model.get_fit_from_eurs(eurs_combo, filtered_data, t_peak, q_peak,
                                                           model_specific_params, b_prior, b_strength)
    best_segs = this_model.p2seg(best_p, best_p_fixed, p2seg_dict)
    # TODO: Need to fix in each models p2seg to ensure floats so that we don't have to make a second pass here.
    for seg in best_segs:
        for k, v in seg.items():
            if type(v) != str:
                seg[k] = float(v)

    if new_error > error_percentage:
        warning = eur_match_fail(target_eur, error_percentage, cur_phase)
    P_dict = {'best': {'segments': best_segs, 'diagnostics': {}}}
    ret = return_template(P_dict=P_dict,
                          forecasted=forecasted,
                          forecastType=forecastType,
                          forecastSubType=forecastSubType,
                          warning=warning,
                          ratio=ratio,
                          data_freq=data_freq)

    # Need to also return raw parameters for low_data_forecast below.
    return ret, best_p, best_p_fixed


def shutin_forecast(data_wo_none: np.ndarray,
                    t_end_data: int,
                    t_end_life: int,
                    is_deterministic: bool,
                    is_ratio: bool,
                    base_phase: str,
                    data_freq: str,
                    percentile: list = None) -> dict:

    if percentile is not None:
        percentile_name = ['P' + str(perc) for perc in percentile]
    multi_seg = MultipleSegments()

    # Find longest last flat section.
    last_v = data_wo_none[-1, 1]
    use_i = 0
    for i in range(data_wo_none.shape[0]):
        this_i = data_wo_none.shape[0] - i - 1
        this_v = data_wo_none[this_i, 1]
        if this_v != last_v:
            use_i = this_i + 1
            break

    t_first = data_wo_none[use_i, 0]
    t_last = np.max([t_end_data, t_end_life])

    this_seg = multi_seg.get_segment_template('empty')
    this_seg['start_idx'] = float(t_first)
    this_seg['end_idx'] = float(t_last)
    this_seg['q_start'] = float(0)
    this_seg['q_end'] = float(0)

    ret_segments = [this_seg]
    if not is_ratio:
        P_dict = {}
        P_dict['best'] = {'segments': ret_segments, 'diagnostics': {}}
        if is_deterministic:
            return return_template(P_dict=P_dict, forecastSubType='flat/zero', data_freq=data_freq)
        # Else probabilistic.
        for perc_name in percentile_name:
            P_dict[perc_name] = {'segments': ret_segments, 'diagnostics': {}}
        return return_template(P_dict=P_dict, forecastSubType='flat/zero', data_freq=data_freq)
    else:
        ratio = EMPTY_RATIO
        ratio.update([('segments', ret_segments), ('basePhase', base_phase), ('x', 'time')])
        return return_template(forecastType='ratio', forecastSubType='flat/zero', ratio=ratio, data_freq=data_freq)


#################################################### Hybrid methods ####################################################


def low_data_rate_forecast(filtered_data: np.ndarray, data_wo_none: np.ndarray, raw_data: np.ndarray, cur_phase: str,
                           t_end_data: int, t_end_life: int, t_peak: int, t_first: int, dap_class: dict,
                           model_name: str, data_freq: str, **forecast_settings) -> dict:
    # Refilter data w/ relaxed settings
    new_settings = copy(forecast_settings)
    new_settings['internal_filter'] = 'high'
    new_model_name = _convert_match_eur_to_free_peak(model_name) if data_freq == 'daily' else model_name
    # Forecast from 5 years prior to end of user supplied forecast range
    end_of_trend = filtered_data[-1, 0]
    start_of_trend = int(end_of_trend - DAYS_IN_YEAR * 5)
    new_settings['time_dict'] = {
        'mode': 'absolute_range',
        'absolute_range': [start_of_trend, end_of_trend],
        'num_range': None,
        'unit': None
    }
    new_settings['valid_idx'] = None
    new_filtered_data, new_idx_range = filtering(data_freq).body(data_wo_none, new_settings)
    new_t_peak, new_t_max, _, is_shutin = get_peaks(new_filtered_data, data_wo_none, raw_data, data_freq, new_idx_range,
                                                    **new_settings)
    new_dap_class = dap_classifier(new_filtered_data, raw_data, new_t_peak, new_t_max, data_freq, is_shutin, 'rate',
                                   new_model_name, **forecast_settings)
    if new_dap_class['dap_cat'] != 'enough_to_forecast':
        # Dreaming of getting some sort of overall trend.
        new_model_name = _convert_match_eur_to_free_peak(model_name)
        new_settings['peak_preference'] = 'start_point'
        new_settings['remove_0'] = True
        new_filtered_data, new_idx_range = filtering(data_freq).body(data_wo_none, new_settings)
        new_t_peak, new_t_max, _, is_shutin = get_peaks(new_filtered_data, data_wo_none, raw_data, data_freq,
                                                        new_idx_range, **new_settings)
        new_dap_class = dap_classifier(new_filtered_data, raw_data, new_t_peak, new_t_max, data_freq, is_shutin, 'rate',
                                       new_model_name, **forecast_settings)

    first_and_last_indices = get_idx(raw_data, new_filtered_data, new_model_name, data_freq, new_dap_class, new_t_peak,
                                     **new_settings)
    new_t_end_data = first_and_last_indices['t_end_data']
    new_t_end_life = first_and_last_indices['t_end_life']
    new_t_first = first_and_last_indices['t_first']
    if new_t_end_data >= new_t_end_life:
        # Possible that well life is already over. So that we can get a forecast, extend the well life of the overall
        # trend. We'll keep the well life for the generated forecast as is.
        new_t_end_life = max(new_t_end_data + round(DAYS_IN_YEAR * 10), new_t_end_life)
    if new_dap_class['dap_cat'] in ['enough_to_forecast', 'low_data_forecast']:
        # Make extended forecast and find EUR. Can user quicker optimizer since we only need long trend fit.
        extended_forecast = deterministic_rate_forecast(new_filtered_data, new_t_peak, new_t_first, new_t_end_data,
                                                        new_t_end_life, new_model_name, data_freq, **new_settings)
        cum_data = np.sum(raw_data[:, 1], dtype=float)
        # In forecast_body_v2, we already scaled down to monthly, need to scale back up to daily.
        if data_freq == 'monthly':
            cum_data *= DAYS_IN_MONTH
        extended_forecast_segments = extended_forecast['P_dict']['best']['segments']
        eur = MultipleSegments().eur(cum_data, raw_data[-1, 0], extended_forecast_segments[0]['start_idx'] - 100,
                                     extended_forecast_segments[-1]['end_idx'], extended_forecast_segments, data_freq)
        # Use this eur along w/ old forecast settings to make a match EUR forecast
        rest_eur = eur - cum_data
    else:
        # In this case the only nonzero value we found in the entire range was the peak. We'll assume
        # we're in the low production case below. We set rest_eur as 1% of total.
        cum_data = np.sum(raw_data[:, 1], dtype=float) * DAYS_IN_MONTH
        eur = cum_data * 1.01
        rest_eur = eur - cum_data
        extended_forecast_segments = [{}]
    if abs(rest_eur) <= ZERO_THRESHOLD:
        # In this case forecast to overall trend ends before the end of the production data. This happens at very
        # low level productions. We'll give the eur a nominal bump, then forecast to that so that we have some
        # segments to show.
        eur *= 1.01
        rest_eur = eur - cum_data
    if abs(rest_eur) > ZERO_THRESHOLD:
        error_percentage = 0.05
        # Get a b_prior. Take from middle of range if it doesn't exsit.
        if 'b_prior' not in forecast_settings and 'b' in extended_forecast_segments[0]:
            forecast_settings['b_prior'] = extended_forecast_segments[0]['b']

        match_eur_ret, best_p, best_p_fixed = match_eur_forecast(raw_data=raw_data,
                                                                 filtered_data=filtered_data,
                                                                 target_eur=eur,
                                                                 rest_eur=rest_eur,
                                                                 error_percentage=error_percentage,
                                                                 model_name=model_name,
                                                                 data_freq=data_freq,
                                                                 cur_phase=cur_phase,
                                                                 t_first=t_first,
                                                                 t_end_data=t_end_data,
                                                                 t_end_life=new_t_end_life,
                                                                 t_peak=t_peak,
                                                                 **forecast_settings)
        # We'll just use the decline parameters from match_eur_forecast. Other's will be gotten from p2seg.
        this_model = mm.models[model_name]
        p2seg_dict = this_model.get_p2seg_dict(forecast_settings, {'t_end_data': t_end_data, 't_end_life': t_end_life})
        best_segs = this_model.p2seg(best_p, best_p_fixed, p2seg_dict)
        # TODO: Need to fix in each models p2seg to ensure floats so that we don't have to make a second pass here.
        for seg in best_segs:
            for k, v in seg.items():
                if type(v) != str:
                    seg[k] = float(v)
        P_dict = {'best': {'segments': best_segs, 'diagnostics': {}}}
        ret = return_template(P_dict=P_dict, data_freq=data_freq)
        if match_eur_ret['warning']['status']:
            ret['warning'] = RATE_TO_EUR_WARNING
    elif dap_class['dap_cat'] == 'low_data_forecast':
        # Just do a standard rate forecast.
        ret = deterministic_rate_forecast(filtered_data=filtered_data,
                                          t_peak=t_peak,
                                          t_first=t_first,
                                          t_end_data=t_end_data,
                                          t_end_life=t_end_life,
                                          model_name=model_name,
                                          data_freq=data_freq,
                                          **forecast_settings)
    else:
        # Abandon ship!
        ret = little_data_forecast()

    return ret


def _convert_match_eur_to_free_peak(model_name: str) -> str:
    '''Converts model to free peak version. Needs to be updated if match EUR models change.'''
    if 'fulford' in model_name:
        return 'arps_modified_fp_fulford'
    elif model_name == 'arps_modified_wp':
        return 'arps_modified_free_peak'
    else:
        # Just spit back model_name to prevent errors if this doesn't get updated.
        return model_name
