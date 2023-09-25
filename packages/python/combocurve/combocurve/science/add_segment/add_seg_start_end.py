import datetime
import numpy as np
from combocurve.science.core_function.helper import shift_idx
from combocurve.science.segment_models.shared.helper import arps_get_t_end_from_q_end, exp_get_t_end_from_q_end


def absolute_start(start_setting, well_PD, series_forecast):
    start_idx = start_setting.get('absolute_idx_start')
    if start_idx is None:
        success = False
        warning = 'Absolute start date is not provided'
        ret = None
    else:
        success = True
        warning = ''
        ret = start_idx
    return success, warning, ret


def relative_start(start_setting, well_PD, series_forecast_segments):
    relative_benchmark = start_setting['relative_benchmark_start']
    relative_unit = start_setting['relative_unit_start']
    relative_num = start_setting['relative_num_start']
    if relative_benchmark in ['FPD', 'FPD_monthly', 'FPD_daily', 'EPD_monthly', 'EPD_daily']:
        well_PD_map = {
            'FPD': 'first_prod_date',
            'FPD_monthly': 'first_prod_date_monthly_calc',
            'FPD_daily': 'first_prod_date_daily_calc',
            'EPD_monthly': 'last_prod_date_monthly',
            'EPD_daily': 'last_prod_date_daily'
        }

        benchmark_item = well_PD_map.get(relative_benchmark)
        if benchmark_item is None:
            benchmark_idx = None
        else:
            benchmark_idx = well_PD.get(benchmark_item)
            if type(benchmark_idx) in [datetime.date, datetime.datetime]:
                benchmark_idx = (np.datetime64(benchmark_idx).astype('datetime64[D]')
                                 - np.datetime64('1900-01-01')).astype(int)
            else:
                benchmark_idx = None
    elif relative_benchmark in ['first_seg_start', 'first_seg_end', 'last_seg_start', 'last_seg_end']:
        if len(series_forecast_segments) == 0:
            benchmark_idx = None
        else:
            forecast_words = relative_benchmark.split('_')
            seg_idx_word = forecast_words[0]
            seg_idx = {'first': 0, 'last': -1}.get(seg_idx_word)
            seg_item_word = forecast_words[2] + '_idx'
            benchmark_idx = series_forecast_segments[seg_idx][seg_item_word]
    else:
        benchmark_idx = None

    ## apply relative duration
    if benchmark_idx is None:
        success = False
        warning = 'The benchmark {} does not exist for this well'.format(relative_benchmark)
        ret = None
    else:
        success = True
        warning = ''
        ret = shift_idx(benchmark_idx, relative_num, relative_unit)

    return success, warning, ret


get_start = {'absolute': absolute_start, 'relative': relative_start}


def absolute_get_end(end_setting, well_PD, added_seg, series_forecasts):
    success = True
    warning = ''
    return success, warning, end_setting.get('absolute_idx_end')


def duration_get_end(end_setting, well_PD, added_seg, series_forecasts):
    success = True
    warning = ''

    start_idx = added_seg['start_idx']
    duration_unit = end_setting['duration_unit']
    duration_num = end_setting['duration_num']
    end_idx = shift_idx(start_idx, duration_num, duration_unit)
    return success, warning, end_idx - 1


def well_life_get_end(end_setting, well_PD, added_seg, series_forecasts):
    success = False
    warning = ''
    check_order = ['first_prod_date_monthly_calc', 'first_prod_date_daily_calc', 'first_prod_date']
    FPD = None
    for order in check_order:
        if well_PD[order] is not None:
            FPD = well_PD[order]
            break
    if (FPD is None) and (len(series_forecasts) > 0):
        FPD = datetime.date(1900, 1, 1) + datetime.timedelta(days=int(series_forecasts[0]['start_idx']))

    if type(FPD) not in [datetime.datetime, datetime.date]:
        success = False
        warning = 'Can not find valid FPD for this well, thus can not calcualte well_life'
        ret = None
    else:
        success = True
        warning = ''
        FPD_idx = (np.datetime64(FPD).astype('datetime64[D]') - np.datetime64('1900-01-01')).astype(int)
        well_life = end_setting['well_life']
        end_idx = shift_idx(FPD_idx, well_life, 'year')
        ret = end_idx - 1

    return success, warning, ret


def q_final_get_end(end_setting, well_PD, added_seg, series_forecasts):
    success = False
    warning = ''
    q_final = end_setting['q_final']
    seg_name = added_seg['name']
    if seg_name in ['flat', 'shutin']:
        success = False
        warning = 'Added segment is {}, apply q_final does not work for them.'.format(added_seg['name'])
        ret = None
    else:
        success, warning, ret = apply_q_final[seg_name](added_seg, q_final)

    return success, warning, ret


def get_end(end_method, end_setting, well_PD, added_seg, series_forecasts):
    success, warning, ret = get_end_s[end_method](end_setting, well_PD, added_seg, series_forecasts)
    if success:
        if ret < added_seg['start_idx']:
            success = False
            warning = 'End date of the segment is before start date of the segment.'
            ret = None
    return success, warning, ret


get_end_s = {
    'absolute': absolute_get_end,
    'duration': duration_get_end,
    'well_life': well_life_get_end,
    'q_final': q_final_get_end
}


#############
def q_final_exp_inc(segment, q_final):
    q_start = segment['q_start']
    if q_final < q_start:
        success = False
        warning = ('q_final is smaller than q_start.'
                   + ' Can not apply q_final to get duration of exponential inclining segment.')
        ret = None
    else:
        success = True
        warning = ''
        D = segment['D']
        ret = int(exp_get_t_end_from_q_end(segment['start_idx'], q_start, D, q_final))

    return success, warning, ret


def q_final_exp_dec(segment, q_final):
    q_start = segment['q_start']
    if q_final > q_start:
        success = False
        warning = ('q_final is larger than q_start.'
                   + ' Can not apply q_final to get duration of exponential declining segment.')
        ret = None
    else:
        success = True
        warning = ''
        D = segment['D']
        ret = int(exp_get_t_end_from_q_end(segment['start_idx'], q_start, D, q_final))

    return success, warning, ret


def q_final_arps(segment, q_final):
    q_start = segment['q_start']
    if q_final > q_start:
        success = False
        warning = 'q_final is larger than q_start. Can not apply q_final to get duration of arps segment.'
        ret = None
    else:
        success = True
        warning = ''
        D = segment['D']
        b = segment['b']
        ret = int(arps_get_t_end_from_q_end(segment['start_idx'], q_start, D, b, q_final))

    return success, warning, ret


def q_final_arps_modified(segment, q_final):
    q_start = segment['q_start']
    if q_final > q_start:
        success = False
        warning = 'q_final is larger than q_start. Can not apply q_final to get duration of modified arps segment.'
        ret = None
    else:
        success = True
        warning = ''
        q_sw = segment['q_sw']
        if q_final >= q_sw:
            D = segment['D']
            b = segment['b']
            ret = int(arps_get_t_end_from_q_end(segment['start_idx'], q_start, D, b, q_final))
        else:
            D_exp = segment['D_exp']
            q_sw = segment['q_sw']
            ret = int(exp_get_t_end_from_q_end(segment['sw_idx'], q_sw, D_exp, q_final))

    return success, warning, ret


apply_q_final = {
    'exp_inc': q_final_exp_inc,
    'exp_dec': q_final_exp_dec,
    'arps': q_final_arps,
    'arps_modified': q_final_arps_modified
}
