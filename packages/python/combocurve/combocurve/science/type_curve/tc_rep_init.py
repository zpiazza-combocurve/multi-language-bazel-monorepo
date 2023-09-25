from typing import Dict, List
import numpy as np
from combocurve.science.type_curve.tc_rep_init_helper import (WellValidationCriteriaEnum, check_has_data,
                                                              get_forecast_type, check_has_forecast_new,
                                                              get_has_data_result, get_plot_data_main_phase,
                                                              get_plot_data_ratio_phase, get_well_valid)
from combocurve.science.multiple_phase_forecast_utils.forecast_function_store import ForecastFunctionStore


######################################## has data
###### if tcType == 'rate': oil/gas/water, has_daily/has_monthly
###### if tcType == 'ratio': oil/gas/water/ratio1/ratio2, has_daily/has_monthly
## has_data
######################################## has forecast
######################################## forecast
###### forecast data_freq: oil / gas / water
###### forecastType: oil / gas /water
## has_forecast
########################################
###### data: {'oil': {'daily': {'index':, 'value':, 'align_offset':}, 'monthly':{}}, 'gas', 'water', 'ratio1', 'ratio2'}
###### if has daily and has monthly, keep both
###### if only has daily, monthly will be replaced with daily aggregation
###### if only has monthly, daily will be directly monthly data
def rep_init(tc_rep_input_data, items, header_items) -> List[Dict]:  # noqa: C901
    TC_document = tc_rep_input_data['TC']
    tcType = TC_document['tcType']  #rate or ratio
    TC_forecast_parent_type = tc_rep_input_data['TC_forecast_parent_type']  #deterministic or prob
    forecast_series = tc_rep_input_data['forecast_series']  #best
    forecast_data_map = tc_rep_input_data['forecast_data_map']
    TC_basePhase = TC_document['basePhase']
    phaseType_s = TC_document['phaseType']
    data_freq_preference = TC_document.get('resolutionPreference', 'forecast')
    well_validation_mode = TC_document.get('wellValidationCriteria', 'must_have_prod_and_forecast')
    try:
        well_validation_criteria = WellValidationCriteriaEnum[well_validation_mode]
    except KeyError:
        well_validation_criteria = WellValidationCriteriaEnum.must_have_prod_and_forecast

    phases = ['oil', 'gas', 'water']
    data_freq_s = ['daily', 'monthly']
    if tcType == 'rate':
        ratio_phases = []
    else:
        ratio_phases = [phase for phase in phases if phase != TC_basePhase]

    ratio_items = list(map(lambda x: x + '/' + TC_basePhase, ratio_phases))
    has_data_items = phases + ratio_items

    well_data_s = tc_rep_input_data['well_data_s']
    ret = []
    for well_data in well_data_s:
        well_id = str(well_data['header'].pop('_id'))
        well_production = well_data.pop('production')
        well_forecast_info = {phase: {} for phase in phases}
        well_forecast_per_phase_datas = forecast_data_map.get(well_id, {})

        forecast_func_store = ForecastFunctionStore(well_forecast_per_phase_datas, TC_forecast_parent_type)

        ##### forecast
        for phase in phases:
            phase_forecast = well_forecast_per_phase_datas.get(phase, {})
            well_forecast_info[phase]['forecast_data_freq'] = phase_forecast.get('data_freq', 'monthly')
            well_forecast_info[phase]['forecast_type'] = get_forecast_type(phase_forecast, TC_forecast_parent_type)

        for phase in phases:
            well_forecast_info[phase]['has_forecast'] = check_has_forecast_new(TC_forecast_parent_type, forecast_series,
                                                                               well_forecast_per_phase_datas, phase,
                                                                               phaseType_s, TC_basePhase)

        #### convert data
        for data_freq in data_freq_s:
            well_production[data_freq]['index'] = np.array(well_production[data_freq]['index'], dtype=int)
            for phase in phases:
                well_production[data_freq][phase] = np.array(well_production[data_freq][phase], dtype=float)

            for phase in ratio_phases:
                target_phase_arr = well_production[data_freq][phase]
                base_phase_arr = well_production[data_freq][TC_basePhase]
                ratio_arr = np.zeros(target_phase_arr.shape) * np.nan
                invalid_mask = np.isnan(target_phase_arr) | np.isnan(base_phase_arr) | (base_phase_arr == 0)
                valid_mask = ~invalid_mask
                ratio_arr[valid_mask] = target_phase_arr[valid_mask] / base_phase_arr[valid_mask]
                well_production[data_freq][phase + '/' + TC_basePhase] = ratio_arr

        #### has_data_intermdiate
        well_data_info = {phase: {} for phase in has_data_items}
        for data_freq in data_freq_s:
            for item in has_data_items:
                well_data_info[item]['has_' + data_freq] = check_has_data(well_production[data_freq][item])

        ### has_data_result
        per_phase_data_freq_preference = {}
        well_has_data_result = {}
        resolved_resolution = {}
        for phase in phases:
            data_freq_preference_ = data_freq_preference

            if not well_forecast_info[phase]['has_forecast'] and data_freq_preference == 'forecast':
                data_freq_preference_ = 'daily_preference'

            per_phase_data_freq_preference[phase] = data_freq_preference_

            phase_has_data, phase_resolved_resolution = get_has_data_result(phaseType_s, well_forecast_info,
                                                                            well_data_info, phase, TC_basePhase,
                                                                            data_freq_preference_)
            well_has_data_result[phase] = phase_has_data
            resolved_resolution[phase] = phase_resolved_resolution

        for phase in phases:
            well_data_info[phase]['has_data'] = well_has_data_result[phase]

        ### get production data
        if ('monthly_production' in items) or ('daily_production' in items):
            well_output_production = {phase: {'monthly': {}, 'daily': {}} for phase in has_data_items}
            for item in phases:
                well_output_production[item] = get_plot_data_main_phase(item, well_production, well_data_info)

            for phase in ratio_phases:
                item = phase + '/' + TC_basePhase
                well_output_production[item] = get_plot_data_ratio_phase(phase, TC_basePhase, well_production,
                                                                         well_data_info)

        #### eur
        eur = {}
        for phase in phases:
            eur_data_freq = resolved_resolution[phase]
            eur[phase] = forecast_func_store.phase_eur(phase,
                                                       well_production[eur_data_freq],
                                                       eur_data_freq,
                                                       P_series=forecast_series)

        #### Peak Rate
        peak_rate = {}
        for phase in phases:
            peak_rate_resolution = resolved_resolution[phase]
            peak_rate[phase] = forecast_func_store.phase_peak_rate(phase,
                                                                   well_production[peak_rate_resolution],
                                                                   peak_rate_resolution,
                                                                   phaseType_s[phase],
                                                                   P_series=forecast_series)

        #### assign
        well_valid = {
            phase: get_well_valid(well_validation_criteria, well_forecast_info[phase]['has_forecast'],
                                  well_data_info[phase]['has_data'])
            for phase in ['oil', 'gas', 'water']
        }

        well_ret = {'well_id': well_id, 'valid': well_valid, 'resolved_resolution': resolved_resolution}

        if 'header' in items:
            well_ret['header'] = {header_item: well_data['header'].get(header_item) for header_item in header_items}

        if 'forecast_info' in items:
            well_ret['forecast_info'] = well_forecast_info

        if 'data_info' in items:
            well_ret['data_info'] = well_data_info

        for k in ['monthly', 'daily']:
            if (k + '_production') in items:
                well_ret[k + '_production'] = {phase: prod[k] for phase, prod in well_output_production.items()}

        if 'eur' in items:
            well_ret['eur'] = eur

        if 'peak_rate' in items:
            well_ret['peak_rate'] = peak_rate

        ret += [well_ret]

    return ret
