import numpy as np
import datetime
import pytz
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.constants import DAYS_IN_YEAR, DAYS_IN_MONTH, BASE_TIME_NPDATETIME64
from combocurve.science.core_function.helper import get_number_of_days_month, get_year_num, get_month_num

multi_seg = MultipleSegments()


def nan_predict(t):
    return np.zeros(len(t)) * np.nan


def eur_raw(cum_data, end_data_idx, data_freq, left_idx=None, right_idx=None, num_year=None):
    return cum_data


def extract_forecast_funcs(forecast_data, phase, sery):  # noqa: C901
    ### segments, predict, eur
    phase_forecastType = forecast_data[phase]['forecastType']
    data_freq = forecast_data[phase]['data_freq']

    def get_first_day_of_monthly(data_freq, index):
        if data_freq == 'daily':
            return index

        target_month = (np.datetime64('1900-01-01') + int(index)).astype('datetime64[M]')
        target_index = (target_month.astype('datetime64[D]') - np.datetime64('1900-01-01')).astype(int)

        return target_index

    if phase_forecastType == 'ratio':
        phase_ratio = forecast_data[phase]['ratio']
        ratio_segments = phase_ratio.get('segments')
        if not ratio_segments:
            return {'segments': [], 'predict': nan_predict, 'eur': eur_raw, 'eur_year': eur_raw, 'data_freq': data_freq}

        phase_segments = [{'name': 'ratio', 'b': ratio_segments[0].get('b'), 'D_eff': ratio_segments[0].get('D_eff')}]

        base_phase = phase_ratio['basePhase']
        base_phase_forecastType = forecast_data[base_phase]['forecastType']
        if base_phase_forecastType != 'rate':
            phase_segments[0].update({'start_idx': 1, 'end_idx': 0})
            return {
                'segments': phase_segments,
                'predict': nan_predict,
                'eur': eur_raw,
                'eur_year': eur_raw,
                'data_freq': data_freq
            }

        if not (forecast_data[base_phase]['P_dict'].get('best')
                and forecast_data[base_phase]['P_dict']['best'].get('segments')):
            phase_segments[0].update({'start_idx': 1, 'end_idx': 0})
            return {
                'segments': phase_segments,
                'predict': nan_predict,
                'eur': eur_raw,
                'eur_year': eur_raw,
                'data_freq': data_freq
            }
        base_segments = forecast_data[base_phase]['P_dict']['best']['segments']

        left_idx = base_segments[0]['start_idx']
        right_idx = base_segments[-1]['end_idx']

        if data_freq == 'daily':

            def phase_predict(t):
                return multi_seg.predict_time_ratio(t, ratio_segments, base_segments)
        else:

            def phase_predict(t):
                return multi_seg.predict_monthly_time_ratio(t, ratio_segments, base_segments)

        def phase_eur(cum_data, end_data_idx, data_freq, left_idx=left_idx, right_idx=right_idx):
            return multi_seg.ratio_eur_interval(cum_data, end_data_idx, left_idx, right_idx, ratio_segments,
                                                base_segments, data_freq)

        def phase_eur_year(cum_data, end_data_idx, data_freq, left_idx, num_year):
            left_idx = get_first_day_of_monthly(data_freq, left_idx)
            return multi_seg.ratio_eur_interval(cum_data, end_data_idx, left_idx,
                                                int(left_idx + num_year * DAYS_IN_YEAR - 1), ratio_segments,
                                                base_segments, data_freq)

        start_idx = np.max([base_segments[0]['start_idx'], ratio_segments[0]['start_idx']])
        end_idx = np.min([base_segments[-1]['end_idx'], ratio_segments[-1]['end_idx']])

        ratio_q_i = multi_seg.predict([start_idx], ratio_segments) * multi_seg.predict([start_idx], base_segments)
        ratio_q_end = multi_seg.predict([end_idx], ratio_segments) * multi_seg.predict([end_idx], base_segments)

        phase_segments[0].update({
            'start_idx': start_idx,
            'end_idx': end_idx,
            'ratio_q_i': ratio_q_i,
            'ratio_q_end': ratio_q_end
        })
    else:
        phase_P_dict = forecast_data[phase]['P_dict']
        if not (phase_P_dict.get(sery) and phase_P_dict[sery].get('segments')):
            phase_segments = []
        else:
            phase_segments = phase_P_dict[sery]['segments']

        if data_freq == 'daily':

            def phase_predict(t):
                return multi_seg.predict(t, phase_segments)
        else:

            def phase_predict(t):
                return multi_seg.predict_monthly_volumes(t, phase_segments)

        if len(phase_segments) > 0:
            left_idx = phase_segments[0]['start_idx']
            right_idx = phase_segments[-1]['end_idx']

            def phase_eur(cum_data, end_data_idx, data_freq, left_idx=left_idx, right_idx=right_idx):
                return multi_seg.eur(cum_data, end_data_idx, left_idx, right_idx, phase_segments, data_freq)

            def phase_eur_year(cum_data, end_data_idx, data_freq, left_idx, num_year):
                left_idx = get_first_day_of_monthly(data_freq, left_idx)
                return multi_seg.eur(cum_data, end_data_idx, left_idx, int(left_idx + num_year * DAYS_IN_YEAR - 1),
                                     phase_segments, data_freq)
        else:
            phase_eur = eur_raw
            phase_eur_year = eur_raw

    return {
        'segments': phase_segments,
        'predict': phase_predict,
        'eur': phase_eur,
        'eur_year': phase_eur_year,
        'data_freq': forecast_data[phase]['data_freq']
    }


item_lists = {
    'header': ['LL', 'Prop', 'Fluid'],
    'forecast': [
        'qi', 'eur', 'ti', 'q_end', 'forecast_end_date', 'b', 'D_eff', 'cum', 'realized_D_eff_sw',
        'forecast_resolution', 'forecast_start_date', 'eur1', 'eur3', 'eur5', 'production_data_count',
        'forecast_data_count', 'well_life', 'last_1_month_prod_avg', 'last_3_month_prod_avg', 'qi_peak_monthly',
        'qi_peak_daily', 'time_to_qi_peak_monthly', 'time_to_qi_peak_daily'
    ],
    'error': ['rmse', 'r2', 'mae', 'avg_diff', 'median_ra', 'median_abs_ra', 'cum_diff',
              'cum_diff_percentage']  # more can be added
}


def build_default_items():
    items = []
    forecast_self = item_lists['forecast']
    for name in forecast_self:
        items += [{'preceding': {'category': 'forecast', 'key': name}, 'posterior': None, 'operation': 'self'}]

    items += [{
        'preceding': {
            'category': 'forecast',
            'key': 'eur'
        },
        'posterior': {
            'category': 'forecast',
            'key': 'cum'
        },
        'operation': '-'
    }]
    divider_list = item_lists['header']
    for numerator in ['qi', 'eur']:
        for divider in divider_list:
            items += [{
                'preceding': {
                    'category': 'forecast',
                    'key': numerator
                },
                'posterior': {
                    'category': 'header',
                    'key': divider
                },
                'operation': '/'
            }]
    err_list = item_lists['error']
    for err in err_list:
        items += [{'preceding': {'category': 'error', 'key': err}, 'posterior': None, 'operation': 'self'}]

    item_names = []
    for item in items:
        this_pre_key = item['preceding']['key']
        this_op = item['operation']
        if this_op == 'self':
            this_name = this_pre_key
        else:
            this_post_key = item['posterior']['key']
            this_name = this_pre_key + this_op + this_post_key

        item_names += [this_name]
    return items, item_names


def get_well_life(production_data, forecast_data):
    segments = forecast_data['segments']
    first_production_date = last_production_date = 0

    if production_data.shape[0]:
        first_production_date = production_data[0][0]
        last_production_date = production_data[-1][0]

    end_idx = 0
    if segments:
        end_idx = segments[-1]['end_idx']

    well_life = (max(end_idx, last_production_date) - first_production_date) / DAYS_IN_YEAR

    return float(round(well_life, 2))


#Booleans and nan are also considered as numbers
#An additional check after isNumber will rule out those cases
def isNumber(value):
    try:
        value + 1
    except TypeError:
        return False
    else:
        return True


def check_diag_number(this_diag):
    for key in this_diag:
        if isNumber(this_diag[key]) and this_diag[key] > 1e15:
            this_diag[key] = 1e15

    return this_diag


def get_last_months_prod_avg(phase_data, phase_data_freq):
    last_1_month_prod_avg = float(
        np.nanmean(phase_data[phase_data[:, 0] >= (phase_data[-1, 0] - DAYS_IN_MONTH + 1)][:, 1]))
    last_3_month_prod_avg = float(
        np.nanmean(phase_data[phase_data[:, 0] >= (phase_data[-1, 0] - DAYS_IN_MONTH * 3 + 1)][:, 1]))

    if phase_data_freq == 'monthly' and phase_data.size > 0:
        number_of_days_1_month = 0
        number_of_days_3_month = 0
        for data in phase_data[-3:, :]:
            if not np.isnan(data[1]):
                number_of_days_3_month += get_number_of_days_month(get_month_num(BASE_TIME_NPDATETIME64 + int(data[0])),
                                                                   get_year_num(BASE_TIME_NPDATETIME64 + int(data[0])))

        if not np.isnan(phase_data[-1, :][1]):
            number_of_days_1_month += get_number_of_days_month(
                get_month_num(BASE_TIME_NPDATETIME64 + int(phase_data[-1, :][0])),
                get_year_num(BASE_TIME_NPDATETIME64 + int(phase_data[-1, :][0])))

        if number_of_days_3_month > 0:
            last_3_month_prod_avg = np.nansum(phase_data[-3:, 1]) / number_of_days_3_month
        if number_of_days_1_month > 0:
            last_1_month_prod_avg = np.nansum(phase_data[-1, 1]) / number_of_days_1_month

    return float(last_1_month_prod_avg), float(last_3_month_prod_avg)


def limit_percentage_range(num):
    if num == 0:
        return num
    elif not num or not np.isfinite(num):
        return None
    elif num < -1:
        return -1
    elif num > 1:
        return 1
    else:
        return num


def get_q_peak_items(all_items, diag_data, phase):
    phase_prod_data_monthly = np.array(diag_data.get('monthly_production', {}).get(phase), dtype=float)
    phase_prod_data_daily = np.array(diag_data.get('daily_production', {}).get(phase), dtype=float)

    if 'monthly_production' not in diag_data or np.isnan(phase_prod_data_monthly).all():
        all_items['qi_peak_monthly'] = None
        all_items['time_to_qi_peak_monthly'] = None
    else:
        argmax_idx = np.nanargmax(phase_prod_data_monthly)
        all_items['qi_peak_monthly'] = phase_prod_data_monthly[argmax_idx]
        all_items['time_to_qi_peak_monthly'] = diag_data['monthly_production']['index'][argmax_idx] - diag_data[
            'monthly_production']['index'][0] + 1

    if 'daily_production' not in diag_data or np.isnan(phase_prod_data_daily).all():
        all_items['qi_peak_daily'] = None
        all_items['time_to_qi_peak_daily'] = None
    else:
        argmax_idx = np.nanargmax(phase_prod_data_daily)
        all_items['qi_peak_daily'] = phase_prod_data_daily[argmax_idx]
        all_items['time_to_qi_peak_daily'] = diag_data['daily_production']['index'][argmax_idx] - diag_data[
            'daily_production']['index'][0] + 1


def get_cst_time():
    dt_utc = datetime.datetime.now(tz=pytz.utc)
    dt_utc = dt_utc.astimezone(pytz.timezone('US/Central'))

    return dt_utc
