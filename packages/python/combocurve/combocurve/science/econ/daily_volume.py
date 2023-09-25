# import time
import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.econ.general_functions import (
    get_py_date,
    py_date_to_index,
    index_to_py_date,
    has_phase_pct_seg,
    has_phase_production,
    PHASES,
)
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.science.econ.helpers import BASE_DATE_NP, days_in_month
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.econ_use_forecast.use_forecast import (get_pct_key_by_phase, get_main_phase,
                                                                    get_main_phase_date, get_after_prod_idx)

MULTI_SEGMENT = MultipleSegments()

def get_start_pred_index(
    phase_actual_forecast,
    phase_forecast,
    pct_key,
    phase_prod,
):
    '''
    return None when phase forecast is None
    w/o logic related to ignore forecast prior to date, that should be handled seperately
    logic especially target when there is overlapping between prod and forecast
    after_prod_idx is end prod idx + 1
    '''
    if phase_forecast is None:
        return None

    # forecast start
    phase_forecast_type = phase_forecast['forecastType']
    if phase_forecast_type == 'ratio':
        forecast_start_index = int(phase_forecast['ratio']['segments'][0]['start_idx'])
    else:
        forecast_start_index = int(phase_forecast['P_dict'][pct_key]['segments'][0]['start_idx'])

    # production end
    if phase_prod is None:
        after_prod_idx = forecast_start_index
    else:
        after_prod_idx = get_after_prod_idx(phase_prod)

    # no overlapping:
    if forecast_start_index >= after_prod_idx:
        return forecast_start_index

    # use production if has
    if phase_actual_forecast == 'never':
        return after_prod_idx

    actual_forecast_index = py_date_to_index(phase_actual_forecast)

    # has overlapping: forecast_start_index < after_prod_idx
    if actual_forecast_index < forecast_start_index:
        start_pred_index = forecast_start_index
    elif forecast_start_index <= actual_forecast_index < after_prod_idx:
        start_pred_index = actual_forecast_index
    else:
        start_pred_index = after_prod_idx

    return start_pred_index


def get_phase_forecast_range(
    phase,
    production_data,
    forecast_data,
    actual_forecast_dict,
    pct_key_by_phase,
    start_idx,
    end_idx,
    start_consider_forecast_idx=None,
    forecast_end_idx=None,
):

    if start_consider_forecast_idx is None:
        start_consider_forecast_idx = start_idx
    if forecast_end_idx is None:
        forecast_end_idx = end_idx

    phase_prod = production_data[phase]
    phase_forecast = forecast_data[phase]
    phase_actual_forecast = actual_forecast_dict[phase]
    phase_pct_key = pct_key_by_phase[phase]

    if start_consider_forecast_idx > forecast_end_idx:
        return None

    phase_start_pred_idx = get_start_pred_index(
        phase_actual_forecast,
        phase_forecast,
        phase_pct_key,
        phase_prod,
    )

    if phase_start_pred_idx is None:  # no forecast
        return None

    phase_use_forecast_start = max([phase_start_pred_idx, start_idx, start_consider_forecast_idx])
    phase_use_forecast_end = min([end_idx, forecast_end_idx])

    if phase_use_forecast_start <= phase_use_forecast_end:
        return {
            'start': phase_use_forecast_start,
            'end': phase_use_forecast_end,
        }

    return None


def get_daily_forecast(start_idx, end_idx, forecast_data, phase, phase_pct_key, phase_risk=None, risk_date_dict=None):
    idx_array = np.arange(start_idx, end_idx + 1)
    daily_forecast = np.zeros(len(idx_array))

    phase_forecast = forecast_data.get(phase)
    if phase_forecast is None:
        return daily_forecast

    forecast_type = phase_forecast['forecastType']

    if forecast_type == 'ratio':
        ratio_dict = phase_forecast['ratio']
        ratio_seg = ratio_dict['segments']

        base_phase = ratio_dict.get('basePhase')
        base_phase_data_dict = None

        if base_phase:
            base_phase_data_dict = forecast_data.get(base_phase)

        base_phase_seg = []

        if base_phase_data_dict is not None:
            base_phase_forecast_type = base_phase_data_dict['forecastType']
            if base_phase_forecast_type == 'rate':
                if has_phase_pct_seg(base_phase_data_dict, 'best'):
                    base_phase_seg = base_phase_data_dict['P_dict']['best']['segments']

        daily_forecast = MULTI_SEGMENT.predict_time_ratio(idx_array, ratio_seg, base_phase_seg)

    else:
        forecast_seg = []

        if has_phase_pct_seg(phase_forecast, phase_pct_key):
            forecast_seg = phase_forecast['P_dict'][phase_pct_key]['segments']

        daily_forecast = MULTI_SEGMENT.predict(idx_array, forecast_seg)

    if phase_risk is not None:
        phase_start_date = index_to_py_date(start_idx)
        phase_end_date = index_to_py_date(end_idx)

        this_phase_risk = PreProcess.phase_risk_daily_pre(phase_risk, risk_date_dict, phase_start_date, phase_end_date)
        daily_forecast = np.multiply(daily_forecast, this_phase_risk)

    return idx_array, daily_forecast


def fill_missing_data_daily(daily_index, daily_volume):
    start_idx = daily_index[0]
    end_idx = daily_index[-1]

    full_index = np.arange(start_idx, end_idx + 1)
    full_volume = np.zeros(len(full_index))

    fill_in = (np.array(daily_index) - start_idx).astype(int)
    full_volume[fill_in] = daily_volume

    return full_index, full_volume


def process_prod_data(phase_prod_data):
    '''
    when dealing with monthly date,
    the data index will be the daily index of 15th of that month,
    including the logic of processing missing month
    '''
    data_freq = phase_prod_data['data_freq']
    prod_index = np.array(phase_prod_data['index'], dtype=int)
    prod_volume = np.array(phase_prod_data['value'])

    if data_freq == 'daily':
        return fill_missing_data_daily(prod_index, prod_volume)
    else:
        first_day_indices = prod_index - 14  # index is 15th day of month
        first_day_dates = (BASE_DATE_NP + prod_index).astype('datetime64[M]')

        number_of_day_in_month = days_in_month(first_day_dates)

        daily_index = []
        for i in range(len(first_day_indices)):
            daily_index.extend(list(range(first_day_indices[i], first_day_indices[i] + number_of_day_in_month[i])))
        daily_index = np.array(daily_index)
        daily_volume = np.repeat(prod_volume / number_of_day_in_month, number_of_day_in_month)

    return fill_missing_data_daily(daily_index, daily_volume)


def get_daily_production(start_idx, end_idx, phase_prod_data, phase_risk, risk_prod, risk_date_dict):
    idx_array = np.arange(start_idx, end_idx + 1)

    if phase_prod_data is None:
        return idx_array, np.zeros(len(idx_array))

    data_idx, data_volume = process_prod_data(phase_prod_data)
    daily_prod = PreProcess.adjust_array(data_volume, data_idx, idx_array, 0)

    if risk_prod == 'yes' and phase_risk is not None:
        phase_start_date = index_to_py_date(start_idx)
        phase_end_date = index_to_py_date(end_idx)

        this_phase_risk = PreProcess.phase_risk_daily_pre(phase_risk, risk_date_dict, phase_start_date, phase_end_date)
        daily_prod = np.multiply(daily_prod, this_phase_risk)

    return idx_array, daily_prod


def get_phase_daily(
    phase,
    start_idx,
    end_idx,
    forecast_range,
    forecast_data,
    phase_pct_key,
    phase_prod,
    phase_risk,
    risk_prod,
    risk_date_dict,
):
    '''
    forecast_range should be between start_idx and end_idx
    '''
    if forecast_range is None:
        # all production
        ret_idx, ret_vol = get_daily_production(start_idx, end_idx, phase_prod, phase_risk, risk_prod, risk_date_dict)
    else:
        forecast_start = forecast_range['start']
        forecast_end = forecast_range['end']

        if forecast_start < start_idx or forecast_end > end_idx:
            raise Exception('Forecast range should be within start_idx and end_idx')

        if forecast_start == start_idx:
            # all forecast
            forecast_idx, forecast_vol = get_daily_forecast(
                forecast_start,
                forecast_end,
                forecast_data,
                phase,
                phase_pct_key,
                phase_risk,
                risk_date_dict,
            )

            after_forecast_idx = np.arange(forecast_end + 1, end_idx + 1)
            after_forecast_vol = np.zeros(len(after_forecast_idx))

            ret_idx = np.concatenate((forecast_idx, after_forecast_idx))
            ret_vol = np.concatenate((forecast_vol, after_forecast_vol))

        else:
            # combine production and forecast
            prod_idx, prod_vol = get_daily_production(start_idx, forecast_start - 1, phase_prod, phase_risk, risk_prod,
                                                      risk_date_dict)

            forecast_idx, forecast_vol = get_daily_forecast(
                forecast_start,
                forecast_end,
                forecast_data,
                phase,
                phase_pct_key,
                phase_risk,
                risk_date_dict,
            )

            after_forecast_idx = np.arange(forecast_end + 1, end_idx + 1)
            after_forecast_vol = np.zeros(len(after_forecast_idx))

            ret_idx = np.concatenate((prod_idx, forecast_idx, after_forecast_idx))
            ret_vol = np.concatenate((prod_vol, forecast_vol, after_forecast_vol))

    return ret_idx, ret_vol
