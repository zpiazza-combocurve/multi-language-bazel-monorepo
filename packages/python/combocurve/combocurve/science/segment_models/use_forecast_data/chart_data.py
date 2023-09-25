import numpy as np
from ..multiple_segments import MultipleSegments
from .find_and_calc_valid import DataFinderAndCalculator
from ....utils.constants import DAYS_IN_MONTH

multi_seg = MultipleSegments()

PHASES = ['oil', 'gas', 'water']
BASE_TIME = np.datetime64('1900-01-01')

MIN_DATA_IDX = -100000


def create_chart_data(well_data, daily_custom_fields=[], monthly_custom_fields=[]):  # noqa: C901

    all_items = {'oil', 'gas', 'water', 'oil/gas', 'gas/oil', 'oil/water', 'water/oil', 'gas/water', 'water/gas'}

    monthly_production = well_data.get('monthly_production')
    monthly_values = None
    monthly_valid = monthly_production is not None and len(monthly_production['index']) > 0
    if monthly_valid:
        monthly_fields = ['index'] + PHASES
        monthly_production_np = {field: np.array(monthly_production[field], dtype=float) for field in monthly_fields}
        monthly_calc = DataFinderAndCalculator(all_columns=all_items,
                                               start={'oil', 'gas', 'water'},
                                               initial_values=monthly_production_np)
        monthly_calc.get_all_valid()
        monthly_calc.fill_values()
        monthly_values = monthly_calc.values

        ## date and cumulative
        monthly_index = monthly_values['index'].astype(int)
        monthly_values['time'] = BASE_TIME + monthly_index

        for phase in PHASES:
            this_production = np.stack([monthly_index, monthly_values[phase]], axis=1).astype(float)
            monthly_values['cumsum_' + phase] = multi_seg.cum_from_t(monthly_index, this_production, [], 'monthly')

        if monthly_custom_fields:
            for field in monthly_custom_fields:
                monthly_values[field] = np.array(monthly_production[field]).astype('float') / DAYS_IN_MONTH

    daily_production = well_data.get('daily_production')
    daily_values = None
    daily_valid = (daily_production is not None) and len(daily_production['index']) > 0
    if daily_valid:
        daily_fields = [
            'index', 'bottom_hole_pressure', 'gas_lift_injection_pressure', 'tubing_head_pressure', 'flowline_pressure',
            'casing_head_pressure', 'vessel_separator_pressure'
        ] + PHASES
        daily_production_np = {field: np.array(daily_production[field], dtype=float) for field in daily_fields}

        daily_calc = DataFinderAndCalculator(all_columns=all_items,
                                             start={'oil', 'gas', 'water'},
                                             initial_values=daily_production_np)
        daily_calc.get_all_valid()
        daily_calc.fill_values()
        daily_values = daily_calc.values

        ## date and cumulative
        daily_index = daily_values['index'].astype(int)
        daily_values['time'] = BASE_TIME + daily_index

        for phase in PHASES:
            this_production = np.stack([daily_index, daily_values[phase]], axis=1).astype(float)
            daily_values['cumsum_' + phase] = multi_seg.cum_from_t(daily_index, this_production, [], 'daily')

        if daily_custom_fields:
            for field in daily_custom_fields:
                daily_values[field] = daily_production[field]
    #####
    # get_idx_arr
    start_end_idx_set = set()
    forecast_values = None

    forecast_data = well_data.get('forecast_data')
    forecast_valid = forecast_data is not None

    forecast_phase_info = {}
    valid_start = set()
    if forecast_valid:
        for phase in PHASES:
            phase_data = forecast_data[phase]
            segments, base_phase = extract_segments_from_phase_data(phase_data)
            forecast_phase_info[phase] = {
                'type': phase_data['forecastType'],
                'segments': segments,
                'base_phase': base_phase,
                'data_freq': phase_data['data_freq']
            }
            if len(segments) > 0:
                if forecast_phase_info[phase]['type'] == 'ratio':
                    valid_start.add(phase + '/' + base_phase)
                else:
                    valid_start.add(phase)

            for seg in segments:
                start_end_idx_set.add(int(seg['start_idx']))
                start_end_idx_set.add(int(seg['end_idx']))

        forecast_valid = len(start_end_idx_set) > 0

    if forecast_valid:
        min_idx = min(start_end_idx_set)
        max_idx = max(start_end_idx_set)
        time_set = set(range(min_idx, max_idx, 30))
        time_set = time_set.union(start_end_idx_set)
        time_arr = list(time_set)
        time_arr.sort()
        np_time_arr = np.array(time_arr, dtype=float)
        init_forecast_calc = {'index': np_time_arr}
        for phase in PHASES:
            phase_type = forecast_phase_info[phase]['type']
            phase_segments = forecast_phase_info[phase]['segments']
            base_phase = forecast_phase_info[phase]['base_phase']
            this_pred = multi_seg.predict(np_time_arr, phase_segments, to_fill=np.nan)
            if phase_type == 'ratio':
                init_forecast_calc[phase + '/' + base_phase] = this_pred
            else:
                init_forecast_calc[phase] = this_pred

        forecast_calc = DataFinderAndCalculator(all_columns=all_items,
                                                start=valid_start,
                                                initial_values=init_forecast_calc)
        forecast_calc.get_all_valid()
        forecast_calc.fill_values()
        forecast_values = forecast_calc.values
        ## date and cumulative
        forecast_index = forecast_values['index'].astype(int)
        forecast_values['time'] = BASE_TIME + forecast_index

        for phase in PHASES:
            phase_info = forecast_phase_info[phase]
            if phase_info['data_freq'] == 'monthly' and monthly_valid:
                this_production = np.stack([monthly_values['index'], monthly_values[phase]], axis=1).astype(float)
            elif phase_info['data_freq'] == 'daily' and daily_valid:
                this_production = np.stack([daily_values['index'], daily_values[phase]], axis=1).astype(float)
            else:
                this_production = np.zeros(shape=(0, 2))

            if phase_info['type'] == 'ratio':
                base_phase = phase_info['base_phase']
                base_phase_info = forecast_phase_info[base_phase]
                if base_phase_info['type'] == 'ratio':
                    forecast_phase_cum = multi_seg.cum_from_t(forecast_index, this_production, [],
                                                              phase_info['data_freq'])
                else:
                    forecast_phase_cum = multi_seg.cum_from_t_ratio(forecast_index, this_production,
                                                                    phase_info['segments'], base_phase_info['segments'],
                                                                    phase_info['data_freq'])
            else:
                forecast_phase_cum = multi_seg.cum_from_t(forecast_index, this_production, phase_info['segments'],
                                                          phase_info['data_freq'])
            forecast_values['cumsum_' + phase] = forecast_phase_cum
    ##################################### append relative_idx, date
    if monthly_valid or daily_valid or forecast_valid:
        min_monthly_index = min_daily_index = min_forecast_index = 100000000
        if monthly_valid:
            min_monthly_index = int(monthly_values['index'][0])

        if daily_valid:
            min_daily_index = int(daily_values['index'][0])

        if forecast_valid:
            min_forecast_index = int(forecast_values['index'][0])

        min_index = min(min_monthly_index, min_daily_index, min_forecast_index)
        if monthly_valid:
            monthly_values['relative_idx'] = monthly_values['index'] - min_index

        if daily_valid:
            daily_values['relative_idx'] = daily_values['index'] - min_index

        if forecast_valid:
            forecast_values['relative_idx'] = forecast_values['index'] - min_index

    if monthly_valid:  ## TODO: should be replaced by the unit system in the future
        for phase in PHASES:
            monthly_values[phase] = monthly_values[phase] / DAYS_IN_MONTH

    return {'daily': daily_values, 'monthly': monthly_values, 'forecast': forecast_values}


def _get_base_phase_segments(well_data, base_phase_key, series='best'):
    return well_data['forecast_data'][base_phase_key].get('P_dict', {}).get(series, {}).get('segments', [])


def get_eur(well_data, forecast_phase, forecast_series, monthly_cum, daily_cum):
    data_freq = forecast_phase['data_freq']
    forecast_type = forecast_phase['forecastType']

    cum = daily_cum if data_freq == 'daily' else monthly_cum

    production_key = {'monthly': 'monthly_production', 'daily': 'daily_production'}[data_freq]
    production_indexes = well_data.get(production_key, {}).get('index', [])
    end_idx = production_indexes[-1] if len(production_indexes) else MIN_DATA_IDX

    segments = forecast_series.get('segments', [])
    left_idx = segments[0]['start_idx'] if len(segments) else end_idx
    right_idx = segments[-1]['end_idx'] if len(segments) else 0

    if forecast_type == 'ratio':
        base_segments = _get_base_phase_segments(well_data, forecast_series['basePhase'])
        return multi_seg.ratio_eur_interval(cum, end_idx, left_idx, right_idx, segments, base_segments, data_freq)
    else:
        return multi_seg.eur(cum, end_idx, left_idx, right_idx, segments, data_freq)


def extract_segments_from_phase_data(phase_data, series='best'):
    if phase_data.get('forecastType') == 'ratio':
        if phase_data.get('ratio') is not None and type(phase_data['ratio'].get('segments')) is list:
            segments = phase_data['ratio']['segments']
            base_phase = phase_data['ratio']['basePhase']
        else:
            segments = []
            base_phase = None
    else:
        if phase_data.get('P_dict') is not None and phase_data['P_dict'].get(series) is not None and type(
                phase_data['P_dict'][series].get('segments')) is list:
            segments = phase_data['P_dict'][series]['segments']
        else:
            segments = []
        base_phase = None
    return segments, base_phase
