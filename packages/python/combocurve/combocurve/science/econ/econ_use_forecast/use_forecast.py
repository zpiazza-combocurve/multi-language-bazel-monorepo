# import time
import copy
import datetime
import numpy as np
from calendar import monthrange
from dateutil.relativedelta import relativedelta
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.general_functions import (
    get_py_date,
    has_forecast,
    has_production,
    has_phase_production,
    index_to_py_date,
    py_date_to_index,
    has_segments,
    has_phase_pct_seg,
    PHASES,
)
from combocurve.science.econ.helpers import BASE_DATE_NP
from combocurve.science.segment_models.shared.helper import sum_forecast_by_month
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults

from typing import List

WH_KEY = 'first_prod_date'

multi_seg = MultipleSegments()


class WellHeaderError(Exception):
    expected = True


class PSeriesError(Exception):
    expected = True


class ForecastError(Exception):
    expected = True


def get_pct_key_by_phase(pct_key, forecast_data):
    # here need to make sure the each phase's pct_key has forecast segment length larger tha 0
    if pct_key not in ['P10', 'P50', 'P90', 'best']:
        raise PSeriesError(f'Invalid P Series: {pct_key}')

    pct_key_by_phase = {'oil': None, 'gas': None, 'water': None}
    p_series_warning = ''

    for phase in PHASES:
        phase_forecast_data = forecast_data.get(phase)

        if phase_forecast_data is None:
            continue

        forecast_type = phase_forecast_data['forecastType']

        if forecast_type == 'ratio':
            if 'ratio' in phase_forecast_data and has_segments(phase_forecast_data['ratio']):
                pct_key_by_phase[phase] = 'not_needed'
            else:
                forecast_data[phase] = None
                p_series_warning += f'{phase} ratio forecast does not have segments; '
        else:
            phase_p_dict = phase_forecast_data['P_dict']
            phase_p_series_list = phase_p_dict.keys()

            if forecast_type == 'rate':
                if 'best' in phase_p_series_list and has_segments(phase_p_dict['best']):
                    pct_key_by_phase[phase] = 'best'
                else:
                    forecast_data[phase] = None
                    p_series_warning += f'{phase} dterministic forecast does not have best fit; '
            else:
                # probabilistic forecast
                if pct_key in phase_p_series_list and has_segments(phase_p_dict[pct_key]):
                    pct_key_by_phase[phase] = pct_key
                elif 'best' in phase_p_series_list and has_segments(phase_p_dict['best']):
                    pct_key_by_phase[phase] = 'best'
                    p_series_warning += f'{phase} selected p series ({pct_key}) does not exist, use best fit instead; '
                elif 'P50' in phase_p_series_list and has_segments(phase_p_dict['P50']):
                    pct_key_by_phase[phase] = 'P50'
                    p_series_warning += f'{phase} selected p series ({pct_key}) does not exist, use P50 instead; '
                else:
                    forecast_data[phase] = None
                    p_series_warning += f'{phase} forecast has neither the selected P series, nor best fit nor P50, treated as no {phase} forecast; '  # noqa E501

    if p_series_warning == '':
        p_series_warning = None
    elif p_series_warning[-2:] == '; ':
        p_series_warning = p_series_warning[:-2]

    return pct_key_by_phase, forecast_data, p_series_warning


def validate_main_phase(forecast_data, main_phase, phase_pct_key):
    phase_forecast = forecast_data[main_phase]
    if phase_forecast and phase_forecast['forecastType'] != 'ratio' and has_segments(
            phase_forecast['P_dict'][phase_pct_key]):
        return True
    else:
        return False


def get_main_phase(forecast_data, well_header_info, pct_key_by_phase):
    if not has_forecast(forecast_data):
        return None

    main_phase = None

    if 'primary_product' in well_header_info.keys() and well_header_info['primary_product'] is not None:
        main_phase = well_header_info['primary_product'].lower()
        #
        if main_phase == 'g':
            main_phase = 'gas'
        if main_phase == 'o':
            main_phase = 'oil'
        #
        if main_phase in ['oil', 'gas'] and validate_main_phase(forecast_data, main_phase,
                                                                pct_key_by_phase[main_phase]):
            return main_phase
        else:
            main_phase = None

    for phase in PHASES:
        if validate_main_phase(forecast_data, phase, pct_key_by_phase[phase]):
            main_phase = phase
            break

    return main_phase


def get_fpd_from_source(dates_setting, well_header_info, production_data, forecast_data, pct_key_by_phase):
    fpd_sources = dates_setting.get('fpd_source_hierarchy', EconModelDefaults.fpd_source_hierarchy())
    fpd = None
    use_forecast_schedule_when_no_prod = True if fpd_sources.get('use_forecast_schedule_when_no_prod',
                                                                 'yes') == 'yes' else False
    is_fpd_linked_to_another_well = False
    for key, date_dict in fpd_sources.items():
        if key == 'use_forecast_schedule_when_no_prod':
            continue
        date = next(iter(date_dict))
        value = date_dict[date]
        # continue if a source is not used
        if date == 'not_used':
            continue
        elif date == 'date':
            fpd = get_py_date(value)
        elif date == 'production_data':
            fpd = get_production_fpd(production_data)
        elif date == 'forecast':
            fpd = get_forecast_fpd(forecast_data, pct_key_by_phase)
        elif date == 'well_header':
            fpd = get_well_header_fpd(well_header_info, has_production(production_data),
                                      use_forecast_schedule_when_no_prod, forecast_data, pct_key_by_phase)
        elif date == 'link_to_wells_ecl':
            fpd = get_py_date(value)
            is_fpd_linked_to_another_well = value
        # break if fpd is found
        if fpd is not None:
            break
    # raise error if no fpd is found
    if fpd is None:
        raise WellHeaderError('No available first production day.')

    return fpd, is_fpd_linked_to_another_well


def get_well_header_fpd(well_header_info, has_production, use_forecast_schedule_when_no_prod, forecast_data,
                        pct_key_by_phase):
    if WH_KEY in well_header_info and well_header_info[WH_KEY] is not None:
        if use_forecast_schedule_when_no_prod and not has_production:
            return get_forecast_fpd(forecast_data, pct_key_by_phase)
        else:
            return get_py_date(well_header_info[WH_KEY])
    else:
        return None


def get_production_fpd(production_data):
    # production
    for phase in PHASES:
        if has_phase_production(production_data, phase):
            data_freq = production_data[phase]['data_freq']
            if data_freq == 'daily':
                return index_to_py_date(production_data[phase]['index'][0])
            else:
                # monthly start index will be 15th of that month but actally it is 1st of that month
                return index_to_py_date(production_data[phase]['index'][0]).replace(day=1)
    return None


def get_forecast_fpd(forecast_data, pct_key_by_phase):
    min_fpd_idx = None

    # instead of use start date of main phase, find earliest forecast start idx of all phases
    for phase, phase_forecast in forecast_data.items():
        phase_pct_key = pct_key_by_phase.get(phase)
        if phase_forecast and phase_pct_key and has_phase_pct_seg(phase_forecast, phase_pct_key):
            phase_start_idx = phase_forecast['P_dict'][phase_pct_key]['segments'][0]['start_idx']
            if min_fpd_idx is None or phase_start_idx < min_fpd_idx:
                min_fpd_idx = phase_start_idx

    if min_fpd_idx is not None:
        return index_to_py_date(min_fpd_idx)
    else:
        return None


def get_main_phase_date(forecast_data, main_phase, pct_key_by_phase, date_type='start'):
    ret_date = None
    ret_index = None

    if has_forecast(forecast_data) and main_phase is not None:
        phase_pct_key = pct_key_by_phase[main_phase]
        seg_idx = 0 if date_type == 'start' else -1
        key = f'{date_type}_idx'
        ret_index = forecast_data[main_phase]['P_dict'][phase_pct_key]['segments'][seg_idx][key]
        ret_date = index_to_py_date(ret_index)

    return ret_date, ret_index


def get_after_prod_idx(phase_prod):
    phase_data_freq = phase_prod['data_freq']
    if phase_data_freq == 'monthly':
        # monthly data end at 15th, after_prod_idx will be the 1st of next month
        last_data_month = (int(phase_prod['index'][-1]) + BASE_DATE_NP).astype('datetime64[M]').astype(datetime.date)
        end_prod_date = last_data_month + relativedelta(months=+1, days=-1)
        after_prod_idx = py_date_to_index(end_prod_date + relativedelta(days=+1))
    else:
        # daily data end at any date, so the month it ends may need to combine production and forecast
        end_prod_date = index_to_py_date(int(phase_prod['index'][-1]))
        after_prod_idx = int(phase_prod['index'][-1]) + 1
    return after_prod_idx


def get_end_prod_date(production_data, fpd):
    end_prod_date = fpd

    for phase in PHASES:
        phase_prod = production_data.get(phase)
        if phase_prod is None:
            continue

        phase_after_prod_idx = get_after_prod_idx(phase_prod)
        phase_after_prod_date = index_to_py_date(phase_after_prod_idx)

        if phase_after_prod_date > end_prod_date:
            end_prod_date = phase_after_prod_date

    return end_prod_date


# function that contains logic of actual or forecast
def get_start_pred_index(
    phase_actual_forecast,
    phase_forecast,
    pct_key,
    default_start_pred_index,
    volume_start_index,
    ignore_forecast_index,
):

    if phase_forecast is None:
        start_pred_index = default_start_pred_index
    else:
        if phase_actual_forecast == 'never':
            start_pred_index = default_start_pred_index
        else:
            actual_forecast_index = py_date_to_index(phase_actual_forecast)
            phase_forecast_type = phase_forecast['forecastType']
            if phase_forecast_type == 'ratio':
                forecast_start_index = int(phase_forecast['ratio']['segments'][0]['start_idx'])
            else:
                forecast_start_index = int(phase_forecast['P_dict'][pct_key]['segments'][0]['start_idx'])

            if actual_forecast_index < forecast_start_index:
                start_pred_index = forecast_start_index
            elif forecast_start_index <= actual_forecast_index < default_start_pred_index:
                start_pred_index = actual_forecast_index
            else:
                start_pred_index = default_start_pred_index

    if start_pred_index < volume_start_index:
        start_pred_index = volume_start_index

    if ignore_forecast_index and ignore_forecast_index > start_pred_index:
        start_pred_index = ignore_forecast_index

    return start_pred_index


def generate_forecast_volumes(idx_array, forecast_data_dict, phase, phase_pct_key, phase_risk, forecast_end_date,
                              risk_date_dict):
    phase_data_dict = forecast_data_dict[phase]
    forecast_type = phase_data_dict['forecastType']

    forecast_datas = np.zeros(len(idx_array))

    if forecast_end_date is not None:
        forecast_end_idx = py_date_to_index(forecast_end_date)
        before_forecast_end = idx_array <= forecast_end_idx
        need_forecast_idxs = idx_array[before_forecast_end]
        zero_idxs = idx_array[np.invert(before_forecast_end)]
    else:
        need_forecast_idxs = idx_array
        zero_idxs = np.array([])

    if forecast_type == 'ratio':
        ratio_dict = phase_data_dict['ratio']

        ratio_seg = ratio_dict['segments']

        try:
            base_phase = ratio_dict['basePhase']
        except Exception:
            ForecastError(f'basePhase not found for ratio forecast: {phase}')

        base_phase_data_dict = forecast_data_dict.get(base_phase)

        base_phase_seg = []

        if base_phase_data_dict is not None:
            base_phase_forecast_type = base_phase_data_dict['forecastType']
            if base_phase_forecast_type == 'rate':
                if has_phase_pct_seg(base_phase_data_dict, 'best'):
                    base_phase_seg = base_phase_data_dict['P_dict']['best']['segments']

        forecast_datas = np.concatenate((multi_seg.predict_time_ratio(need_forecast_idxs, ratio_seg,
                                                                      base_phase_seg), np.zeros(len(zero_idxs))))

    else:
        forecast_seg = phase_data_dict['P_dict'][phase_pct_key]['segments']
        forecast_datas = np.concatenate((multi_seg.predict(need_forecast_idxs, forecast_seg), np.zeros(len(zero_idxs))))

    if phase_risk is not None:
        monthly_risk = PreProcess.phase_risk_pre(phase_risk, risk_date_dict, index_to_py_date(idx_array[0]),
                                                 index_to_py_date(idx_array[-1]))
        daily_risk = PreProcess.monthly_list_to_daily(monthly_risk, index_to_py_date(idx_array[0]),
                                                      index_to_py_date(idx_array[-1]))
        forecast_datas = np.multiply(forecast_datas, daily_risk)

    return forecast_datas


def forecast_indices(date_list: List[datetime.date], forecast_month):
    #convert numpy.datetime64 to datetime.date
    start, end = forecast_month[0].astype(datetime.date), forecast_month[-1].astype(datetime.date)
    start_index = next(i for i, date in enumerate(date_list) if date >= start)
    last_index = next(i for i, date in enumerate(date_list) if date >= end) + 1
    return start_index, last_index


# only forecast
def only_forecast(date_list, forecast_daily_index, forecast_data_dict, phase, phase_pct_key, phase_risk,
                  forecast_end_date, risk_date_dict):
    ## add forecast to phase_volume
    phase_forecast = generate_forecast_volumes(forecast_daily_index, forecast_data_dict, phase, phase_pct_key,
                                               phase_risk, forecast_end_date, risk_date_dict)

    phase_ret_daily = {'index': forecast_daily_index, 'value': phase_forecast}

    forecast_monthly_volume, forecast_month = sum_forecast_by_month(phase_forecast, forecast_daily_index)

    phase_ret_monthly = np.zeros(len(date_list))
    start, end = forecast_indices(date_list, forecast_month)

    phase_ret_monthly[start:end] = forecast_monthly_volume

    return phase_ret_monthly, phase_ret_daily


def prod_prepare(phase_prod_data, stop_daily_index=None, start_daily_index=None, forecast_daily_index=[]):
    '''
    start index is used for FPD cut production in month
    end index is used for actual or forecast (combine production and forecast within the month of switch)
    note: the cutoff (for example use date cutoff to cut in middle of month) is not handled in here
    '''

    data_freq = phase_prod_data['data_freq']
    prod_index = np.array(phase_prod_data['index'], dtype=int)
    '''
    phase_prod_data['value'] has dtype as int, which will cause the multiple first and last element with float
    rounded to int, convert it to float to avoid this
    '''
    prod_volume = np.array(phase_prod_data['value'], dtype=float)

    if data_freq == 'monthly':
        # monthly
        prod_monthly_volume = prod_volume
        prod_month_index = (BASE_DATE_NP + prod_index).astype('datetime64[M]').astype('int')

        if start_daily_index is not None:
            start_monthly_index = (BASE_DATE_NP + start_daily_index).astype('datetime64[M]').astype('int')
            start_date = index_to_py_date(start_daily_index)

        if stop_daily_index is not None:
            stop_monthly_index = (BASE_DATE_NP + stop_daily_index).astype('datetime64[M]').astype('int')
            stop_date = index_to_py_date(stop_daily_index)
        '''
        use start_daily_index to cut monthly production only when start is after first production data month
        we don't cut first production month due to the volume maybe already counted from FPD
        '''
        if (start_daily_index is not None and start_monthly_index in prod_month_index
                and start_monthly_index > prod_month_index[0]):
            # start index
            if (stop_daily_index is not None and stop_monthly_index in prod_month_index
                    and start_daily_index <= stop_daily_index):
                # consider both start index and end index
                monthly_used_idex = (prod_month_index >= start_monthly_index) & (prod_month_index <= stop_monthly_index)
                prod_month_index = prod_month_index[monthly_used_idex]
                prod_monthly_volume = prod_monthly_volume[monthly_used_idex]

                if start_monthly_index == stop_monthly_index:
                    # start and end at same month
                    days_in_month = monthrange(stop_date.year, stop_date.month)[1]
                    days_prop = (stop_date.day - start_date.day + 1) / days_in_month

                    # guaranteed to be last index due to index filter above
                    prod_monthly_volume[-1] = prod_monthly_volume[-1] * days_prop
                else:
                    # end month after start month
                    days_in_start_month = monthrange(start_date.year, start_date.month)[1]
                    start_month_days_prop = (days_in_start_month - start_date.day + 1) / days_in_start_month
                    # guaranteed to be first index due to index filter above
                    prod_monthly_volume[0] = prod_monthly_volume[0] * start_month_days_prop

                    days_in_stop_month = monthrange(stop_date.year, stop_date.month)[1]
                    stop_month_days_prop = stop_date.day / days_in_stop_month
                    # guaranteed to be last index due to index filter above
                    prod_monthly_volume[-1] = prod_monthly_volume[-1] * stop_month_days_prop

            elif start_monthly_index >= prod_month_index[0]:
                # only consider start index
                monthly_used_idex = prod_month_index >= start_monthly_index
                prod_month_index = prod_month_index[monthly_used_idex]
                prod_monthly_volume = prod_monthly_volume[monthly_used_idex]

                days_in_start_month = monthrange(start_date.year, start_date.month)[1]
                start_month_days_prop = (days_in_start_month - start_date.day + 1) / days_in_start_month
                prod_monthly_volume[0] = prod_monthly_volume[0] * start_month_days_prop

        elif stop_daily_index is not None and stop_monthly_index in prod_month_index:
            # only consider stop index
            days_in_stop_month = monthrange(stop_date.year, stop_date.month)[1]
            stop_month_days_prop = stop_date.day / days_in_stop_month

            monthly_used_idex = prod_month_index <= stop_monthly_index
            prod_month_index = prod_month_index[monthly_used_idex]
            prod_monthly_volume = prod_monthly_volume[monthly_used_idex]

            # guaranteed to be last index due to index filter above
            prod_monthly_volume[-1] = prod_monthly_volume[-1] * stop_month_days_prop

        # daily
        phase_ret_daily = {
            'index': np.zeros([len(forecast_daily_index)]),
            'value': np.zeros([len(forecast_daily_index)]),
        }

    else:
        # daily
        '''
        trim production between start_index and stop_index
        '''
        if stop_daily_index is not None and start_daily_index is not None and start_daily_index < stop_daily_index:
            used_index = (start_daily_index <= prod_index) & (prod_index <= stop_daily_index)
        elif stop_daily_index is not None:
            used_index = prod_index <= stop_daily_index
        elif start_daily_index:
            used_index = start_daily_index <= prod_index
        else:
            used_index = np.repeat(True, len(prod_index))

        original_daily_index = prod_index[used_index]
        original_prod_volume = prod_volume[used_index]

        if original_daily_index.size != 0:
            original_month_index = (BASE_DATE_NP + original_daily_index).astype('datetime64[M]').astype('int')
            prod_monthly_volume = np.bincount(original_month_index - np.min(original_month_index),
                                              weights=original_prod_volume)
            prod_month_index = np.unique(original_month_index)
        else:
            prod_monthly_volume = np.array([])
            prod_month_index = np.array([], dtype=int)

        # daily
        daily_index = np.arange(prod_index[0], prod_index[-1] + 1 + len(forecast_daily_index))
        daily_prod = np.zeros(len(daily_index))
        daily_fill_index = (np.array(prod_index) - prod_index[0]).astype(int)
        daily_prod[daily_fill_index] = prod_volume
        phase_ret_daily = {
            'index': daily_index,
            'value': daily_prod,
        }

    return prod_monthly_volume, prod_month_index, phase_ret_daily


# only production
def only_production(date_list, prod_data, volume_start_index=None):
    prod_monthly_volume, prod_month_index, phase_ret_daily = prod_prepare(prod_data,
                                                                          start_daily_index=volume_start_index)

    phase_ret_monthly = np.zeros(len(date_list))
    fpd_month_index = np.datetime64(date_list[0]).astype('datetime64[M]').astype('int')
    lpd_month_index = np.datetime64(date_list[-1]).astype('datetime64[M]').astype('int')

    used_prod_bool = (prod_month_index <= lpd_month_index) & (prod_month_index >= fpd_month_index)
    prod_fill_index = prod_month_index[used_prod_bool] - fpd_month_index

    # add production data to phase_ret_monthly
    phase_ret_monthly[prod_fill_index] = np.array(prod_monthly_volume)[used_prod_bool]

    # here the daily prod list is not cutted, it might be over the range of monthly array
    return phase_ret_monthly, phase_ret_daily


# production and forecast
def both_production_forecast(date_list, phase_prod_data, forecast_daily_index, forecast_data_dict, phase, phase_pct_key,
                             phase_risk, forecast_end_date, volume_start_index, risk_date_dict):
    phase_ret_monthly = np.zeros(len(date_list))
    # add production data to phase_ret_monthly
    fpd_month_index = np.datetime64(date_list[0]).astype('datetime64[M]').astype('int')

    lpd_daily_index = forecast_daily_index[0] - 1
    lpd_month_index = (BASE_DATE_NP + lpd_daily_index).astype('datetime64[M]').astype('int')
    prod_monthly_volume, prod_month_index, phase_ret_daily = prod_prepare(phase_prod_data, lpd_daily_index,
                                                                          volume_start_index, forecast_daily_index)

    used_prod_bool = (prod_month_index <= lpd_month_index) & (prod_month_index >= fpd_month_index)
    prod_fill_index = prod_month_index[used_prod_bool] - fpd_month_index

    phase_ret_monthly[prod_fill_index] = np.array(prod_monthly_volume)[used_prod_bool]

    # add forecast to phase_ret_monthly
    phase_forecast_result = generate_forecast_volumes(forecast_daily_index, forecast_data_dict, phase, phase_pct_key,
                                                      phase_risk, forecast_end_date, risk_date_dict)

    grouped_volume, forecast_month = sum_forecast_by_month(phase_forecast_result, forecast_daily_index)

    monthly_forecast_start_index = np.datetime64(forecast_month[0], 'M').astype(int) - fpd_month_index

    if len(prod_fill_index) > 0 and monthly_forecast_start_index == prod_fill_index[-1]:
        # prod_fill_index can be empty array
        phase_ret_monthly[monthly_forecast_start_index] += grouped_volume[0]
        phase_ret_monthly[monthly_forecast_start_index + 1:] = grouped_volume[1:]
    else:
        phase_ret_monthly[monthly_forecast_start_index:] = grouped_volume

    # add forecast to phase_ret_daily (this need to be changed in future, can't append directly)
    forecast_start_idx = len(forecast_daily_index)
    phase_ret_daily['index'][-forecast_start_idx:] = forecast_daily_index
    phase_ret_daily['value'][-forecast_start_idx:] = phase_forecast_result

    return phase_ret_monthly, phase_ret_daily


def get_date(date_dict, fpd, fsd):
    if 'date' in date_dict:
        return get_py_date(date_dict['date'])
    if 'fpd' in date_dict:
        return fpd
    if 'maj_seg' in date_dict:
        return fsd
    if 'dynamic' in date_dict:
        dynamic_date_option = date_dict['dynamic']['value']
        today = datetime.date.today()
        if dynamic_date_option == 'first_of_next_month':
            return datetime.date(today.year + (today.month + 1 > 12), (today.month + 1) % 12, 1)
        elif dynamic_date_option == 'first_of_next_year':
            return datetime.date(today.year + 1, 1, 1)
        else:
            raise Exception('Invalid dynamic date option')


def process_dates_setting(dates_setting, fpd, fsd):
    max_econ_life = dates_setting['max_well_life']

    as_of_date_dict = dates_setting['as_of_date']
    discount_date_dict = dates_setting['discount_date']

    as_of_date = get_date(as_of_date_dict, fpd, fsd)
    discount_date = get_date(discount_date_dict, fpd, fsd)

    return as_of_date, discount_date, max_econ_life


def process_phase_forecast(phase_prod, forecast_data, phase_actual_forecast, risking, phase_pct_key, date_list, phase,
                           end_econ_index, ignore_forecast_index, total_num_months, date_dict):

    # dates
    fpd = date_dict['first_production_date']
    volume_start_date = date_dict['volume_start_date']  # for overriding volume start in rollUp
    forecast_end_date = date_dict['side_phase_end_date']

    # default daily and monthly and end_prod_date
    phase_ret_daily = {'index': np.array([]), 'value': np.array([])}
    phase_ret_monthly = np.repeat(0, total_num_months)
    pre_risk_phase_ret_monthly = np.repeat(0, total_num_months)

    # construct risk date dict
    risk_date_dict = {
        'first_production_date': fpd,
        'as_of_date': date_dict['as_of_date'],
        'first_segment_date': date_dict['first_segment_date'],
        'end_history_date': date_dict['end_history_date']
    }

    if phase_prod is not None:
        default_start_pred_index = get_after_prod_idx(phase_prod)
        volume_start_index = py_date_to_index(volume_start_date)
        phase_start_pred_index = get_start_pred_index(
            phase_actual_forecast,
            forecast_data[phase],
            phase_pct_key,
            default_start_pred_index,
            volume_start_index,
            ignore_forecast_index,
        )

        monthly_risk = PreProcess.phase_risk_pre(risking, risk_date_dict, index_to_py_date(phase_prod['index'][0]),
                                                 index_to_py_date(phase_prod['index'][-1]))

        # risk for production
        if risking.get('risk_prod', 'yes') == 'yes':
            risked_phase_prod = copy.deepcopy(phase_prod)
            if phase_prod['data_freq'] == 'monthly':
                risked_phase_prod['value'] = np.multiply(phase_prod['value'], monthly_risk)
            else:
                daily_risk = PreProcess.monthly_list_to_daily(monthly_risk, index_to_py_date(phase_prod['index'][0]),
                                                              index_to_py_date(phase_prod['index'][-1]))
                risked_phase_prod['value'] = np.multiply(phase_prod['value'], daily_risk)
        else:
            risked_phase_prod = phase_prod

        forecast_daily_index = np.arange(phase_start_pred_index, end_econ_index + 1)

        if (end_econ_index < phase_start_pred_index) or forecast_data[phase] is None:
            # only using production
            phase_ret_monthly, phase_ret_daily = only_production(date_list, risked_phase_prod, volume_start_index)
            pre_risk_phase_ret_monthly, _ = only_production(date_list, phase_prod, volume_start_index)
        elif volume_start_index == phase_start_pred_index:  # not using production data even it exists
            phase_ret_monthly, phase_ret_daily = only_forecast(date_list, forecast_daily_index, forecast_data, phase,
                                                               phase_pct_key, risking, forecast_end_date,
                                                               risk_date_dict)
            pre_risk_phase_ret_monthly, _ = only_forecast(date_list, forecast_daily_index, forecast_data, phase,
                                                          phase_pct_key, EconModelDefaults.phase_risking,
                                                          forecast_end_date, risk_date_dict)
        else:
            phase_ret_monthly, phase_ret_daily = both_production_forecast(date_list, risked_phase_prod,
                                                                          forecast_daily_index, forecast_data, phase,
                                                                          phase_pct_key, risking, forecast_end_date,
                                                                          volume_start_index, risk_date_dict)
            pre_risk_phase_ret_monthly, _ = both_production_forecast(date_list, phase_prod, forecast_daily_index,
                                                                     forecast_data, phase, phase_pct_key,
                                                                     EconModelDefaults.phase_risking, forecast_end_date,
                                                                     volume_start_index, risk_date_dict)

    elif phase_prod is None and forecast_data[phase] is not None:
        default_start_pred_index = py_date_to_index(volume_start_date)  # use forecast from fpd, consist with date_list

        if ignore_forecast_index and ignore_forecast_index > default_start_pred_index:
            default_start_pred_index = ignore_forecast_index

        # forecast_daily_index for daily return
        if default_start_pred_index <= end_econ_index:
            forecast_daily_index = np.arange(default_start_pred_index, end_econ_index + 1)
            phase_ret_monthly, phase_ret_daily = only_forecast(date_list, forecast_daily_index, forecast_data, phase,
                                                               phase_pct_key, risking, forecast_end_date,
                                                               risk_date_dict)
            pre_risk_phase_ret_monthly, _ = only_forecast(date_list, forecast_daily_index, forecast_data, phase,
                                                          phase_pct_key, EconModelDefaults.phase_risking,
                                                          forecast_end_date, risk_date_dict)

    return pre_risk_phase_ret_monthly, phase_ret_daily, phase_ret_monthly


def combine_prod_forecast_simple(phase_prod, forecast_data_dict, risking, phase, phase_pct_key, fpd_index,
                                 end_econ_index, forecast_end_date, date_dict):

    phase_forecast = forecast_data_dict[phase]

    fpd = index_to_py_date(fpd_index)
    end_econ_date = index_to_py_date(end_econ_index)
    total_num_months = (end_econ_date.year - fpd.year) * 12 + end_econ_date.month - fpd.month + 1
    date_list = (np.arange(total_num_months) + np.datetime64(fpd, 'M')).tolist()

    if phase_prod is not None:
        phase_data_freq = phase_prod['data_freq']

        # risk for production
        monthly_risk = PreProcess.phase_risk_pre(risking[phase], date_dict, index_to_py_date(phase_prod['index'][0]),
                                                 index_to_py_date(phase_prod['index'][-1]))
        risked_phase_prod = copy.deepcopy(phase_prod)
        if phase_data_freq == 'monthly':
            # risk for monthly production
            if risking.get('risk_prod', 'yes') == 'yes':
                risked_phase_prod['value'] = np.multiply(phase_prod['value'], monthly_risk)
            # monthly data end at 15th, default_start_pred_index will be the 1st of next month
            last_data_month = (int(phase_prod['index'][-1]) + BASE_DATE_NP).astype('datetime64[M]').astype(
                datetime.date)
            end_prod_date = last_data_month + relativedelta(months=+1, days=-1)
            start_pred_index = py_date_to_index(end_prod_date + relativedelta(days=+1))
        else:
            # daily data end at any date, so the month it ends may need to combine production and forecast
            start_pred_index = int(phase_prod['index'][-1]) + 1
            # risk for daily production
            daily_risk = PreProcess.monthly_list_to_daily(monthly_risk, index_to_py_date(phase_prod['index'][0]),
                                                          index_to_py_date(phase_prod['index'][-1]))
            if risking.get('risk_prod', 'yes') == 'yes':
                risked_phase_prod['value'] = np.multiply(phase_prod['value'], daily_risk)

        if (end_econ_index < start_pred_index) or phase_forecast is None:
            # only using production
            ret_phase_monthly, _ = only_production(date_list, risked_phase_prod, fpd_index)
            last_month_prop = end_econ_date.day / monthrange(end_econ_date.year, end_econ_date.month)[1]
            ret_phase_monthly[-1] = ret_phase_monthly[-1] * last_month_prop
        else:
            forecast_daily_index = np.arange(start_pred_index, end_econ_index + 1)
            ret_phase_monthly, _ = both_production_forecast(date_list, risked_phase_prod, forecast_daily_index,
                                                            forecast_data_dict, phase, phase_pct_key, risking[phase],
                                                            forecast_end_date, fpd_index, date_dict)

    elif phase_prod is None and phase_forecast is not None:
        # forecast_daily_index for daily return
        forecast_daily_index = np.arange(py_date_to_index(fpd), end_econ_index + 1)
        ret_phase_monthly, _ = only_forecast(date_list, forecast_daily_index, forecast_data_dict, phase, phase_pct_key,
                                             risking[phase], forecast_end_date, date_dict)
    else:
        ret_phase_monthly = np.repeat(0, total_num_months)

    return ret_phase_monthly
