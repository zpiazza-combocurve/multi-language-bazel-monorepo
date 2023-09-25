from copy import copy
from enum import Enum
from typing import Callable, Dict
import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.science.type_curve.TC_helper import get_ratio_without_warning
from combocurve.science.multiple_phase_forecast_utils.forecast_function_store import ForecastFunctionStore

date_0 = np.datetime64('1900-01-01')
multi_seg = MultipleSegments()

#########


def check_has_data(np_array):
    ret = False
    if (np_array.shape[0] > 0):
        invalid_mask = np.isnan(np_array) | np.isinf(np_array) | (np_array == 0)
        ret = not invalid_mask.all()
    return ret


##############
def get_forecast_type(forecast_document, TC_forecast_parent_type):
    if forecast_document is None or forecast_document.get('forecastType') is None:
        return 'not_forecasted'

    forecastType = str(forecast_document['forecastType'])
    if forecastType == 'not_forecasted':
        return 'not_forecasted'

    if TC_forecast_parent_type == 'probabilistic':
        return 'rate;' + forecastType

    ret = forecastType + ';' + str(forecast_document.get('forecastSubType'))
    if forecastType == 'ratio':
        ret += ';' + str(forecast_document.get('ratio', {}).get('basePhase'))

    return ret


## NOTE: this new check does not care about forecast_type or forecast_sub_type, but just focus on checking all nans
## difference between this and check_has_data is check_has_data does not allow for all 0 case, or mix of 0's and nan's
## which is allowed in has_forecast
def check_has_forecast_new(TC_forecast_parent_type, forecast_series, well_forecast_per_phase_datas, phase, phaseType_s,
                           TC_basePhase):
    forecast_func_store = ForecastFunctionStore(well_forecast_per_phase_datas, TC_forecast_parent_type)
    if phaseType_s[phase] == 'rate':
        check_segments = copy(forecast_func_store.get_phase_segments(phase, forecast_series))
        # NOTE: It's possible that we'll use a ratio well as background for a rate based type curve.
        # Need to check if we have data for the ratio well's base, too.
        if well_forecast_per_phase_datas.get(phase, {}).get('forecastType') == 'ratio':
            well_base_phase = well_forecast_per_phase_datas[phase].get('ratio', {}).get('basePhase')
            check_segments += forecast_func_store.get_phase_segments(well_base_phase, forecast_series)
    else:
        check_segments = forecast_func_store.get_phase_segments(
            phase, forecast_series) + forecast_func_store.get_phase_segments(TC_basePhase, forecast_series)

    check_idxes = []  ## NOTE: if this value is too large or too small, we might be in trouble
    for seg in check_segments:
        check_idxes += [seg['start_idx'], seg['end_idx']]

    if len(check_idxes) == 0:  ## no forecast segments
        return False

    if phaseType_s[phase] == 'rate':
        pred = forecast_func_store.predict(check_idxes, phase, forecast_series, np.nan)
    else:
        pred = forecast_func_store.predict_ratio(check_idxes, phase, TC_basePhase, forecast_series, np.nan)

    return check_has_data(pred)


def check_has_forecast(TC_forecast_parent_type, well_forecast_info, phaseType, target_phase, base_phase,
                       phase_segment_s):
    target_type = well_forecast_info[target_phase]['forecast_type']
    if len(phase_segment_s[target_phase]['segments']) == 0:
        return False
    if base_phase is not None:
        base_type = well_forecast_info[base_phase].get('forecast_type')
    else:
        base_type = None

    if TC_forecast_parent_type == 'probabilistic':
        exclude_type_s = ['not_forecasted', 'rate;type_curve', 'rate;None']
        ret = target_type not in exclude_type_s
        if phaseType == 'rate':
            return ret

        return ret and (base_type not in exclude_type_s)

    target_type_s = target_type.split(';')
    if target_type_s[0] == 'not_forecasted':
        return False

    if phaseType == 'rate':
        exclude_type_s = ['ratio']
        exclude_subTypes = ['type_curve']
        return (target_type_s[0] not in exclude_type_s) and (target_type_s[1] not in exclude_subTypes)

    if len(phase_segment_s[base_phase]['segments']) == 0:
        return False

    base_type_s = base_type.split(';')
    if (base_type_s[0] in ['ratio', 'not_forecasted']):
        return False

    if (base_type_s[1] in ['type_curve']):
        return False

    ret = (target_type_s[1] != 'type_curve')
    if target_type_s[0] == 'ratio':
        return ret and (target_type_s[2] == base_phase)

    return ret and (target_type_s[0] != 'not_forecasted')


def _check_preference(data_freq_preference, check_key, well_data_info):
    if data_freq_preference == 'monthly_preference':
        if well_data_info[check_key]['has_monthly']:
            return True, 'monthly'
        if well_data_info[check_key]['has_daily']:
            return True, 'daily'
        return False, 'monthly'
    else:
        if well_data_info[check_key]['has_daily']:
            return True, 'daily'
        if well_data_info[check_key]['has_monthly']:
            return True, 'monthly'
        return False, 'daily'


def _check_has_data_for_phase_key(data_freq_preference, phase_key, well_data_info, target_phase_forecast_data_freq):
    ## 3 phases + 2 ratios(optional)
    if data_freq_preference == 'forecast':
        return well_data_info[phase_key]['has_' + target_phase_forecast_data_freq], target_phase_forecast_data_freq

    if data_freq_preference in ['monthly_only', 'daily_only']:
        check_freq = data_freq_preference.split('_')[0]
        return well_data_info[phase_key]['has_' + check_freq], check_freq
    else:
        return _check_preference(data_freq_preference, phase_key, well_data_info)


def get_has_data_result(
    phaseType_s,
    well_forecast_info,
    well_data_info,
    phase,
    basePhase,
    data_freq_preference,
):
    phaseType = phaseType_s[phase]
    target_phase_forecast_data_freq = well_forecast_info[phase]['forecast_data_freq']
    if phaseType == 'rate':
        return _check_has_data_for_phase_key(data_freq_preference, phase, well_data_info,
                                             target_phase_forecast_data_freq)

    return _check_has_data_for_phase_key(data_freq_preference, phase + '/' + basePhase, well_data_info,
                                         target_phase_forecast_data_freq)


def convert_daily_to_monthly(original_idx_arr, value):
    left_idx = original_idx_arr[0]
    left_date = left_idx + date_0
    left_month = left_date.astype('datetime64[M]')
    left_month_start_idx = (left_month.astype('datetime64[D]') - date_0).astype(int)

    right_idx = original_idx_arr[-1]
    right_date = right_idx + date_0
    right_month = right_date.astype('datetime64[M]')
    right_month_end_idx = ((right_month + 1).astype('datetime64[D]') - date_0 - 1).astype(int)

    month_arr = np.arange(left_month, right_month + 1)

    idx_arr = np.arange(left_month_start_idx, right_month_end_idx + 1, dtype=int)
    value_arr = np.zeros(idx_arr.shape, dtype=float) * np.nan
    value_arr[original_idx_arr - left_month_start_idx] = value

    nonnan_arr = ~np.isnan(value_arr)
    ####
    month_end_idx_arr = ((month_arr + 1).astype('datetime64[D]') - date_0).astype(int) - 1
    month_end_INDEX = month_end_idx_arr - left_month_start_idx
    cumsum_value = np.nancumsum(value_arr)
    cumsum_nonnan = np.nancumsum(nonnan_arr)
    ####
    month_end_cumsum_value = np.concatenate([[0], cumsum_value[month_end_INDEX]])
    month_end_cumsum_nonnan = np.concatenate([[0], cumsum_nonnan[month_end_INDEX]])
    ####
    monthly_value = (month_end_cumsum_value[1:] - month_end_cumsum_value[0:(-1)])
    monthly_value[(month_end_cumsum_nonnan[1:] - month_end_cumsum_nonnan[0:(-1)]) == 0] = np.nan

    ####
    monthly_index = (month_arr.astype('datetime64[D]') - date_0).astype(int) + 14
    ####
    # maximum_monthly_INDEX = np.nanargmax(monthly_value)
    # maximum_month = month_arr[maximum_monthly_INDEX]
    # maximum_month_start_idx = (maximum_month.astype('datetime64[D]') - date_0).astype(int)
    # maximum_month_end_idx = ((maximum_month + 1).astype('datetime64[D]') - date_0).astype(int) - 1

    # before_maximum_month_start_mask = original_idx_arr < maximum_month_start_idx
    # before_maximum_month_n = np.sum(before_maximum_month_start_mask)
    # maximum_month_original_value = value[(~before_maximum_month_start_mask)
    #                                      & (original_idx_arr <= maximum_month_end_idx)]
    # maximum_daily_INDEX = np.nanargmax(maximum_month_original_value) + before_maximum_month_n
    # return monthly_index, monthly_value, maximum_monthly_INDEX, maximum_daily_INDEX
    return monthly_index, monthly_value


def get_plot_data_main_phase(item, well_production, well_data_info):
    monthly_index = well_production['monthly']['index']
    item_monthly_data = well_production['monthly'][item]
    daily_index = well_production['daily']['index']
    item_daily_data = well_production['daily'][item]
    item_has_monthly = well_data_info[item]['has_monthly']
    item_has_daily = well_data_info[item]['has_daily']

    daily_cumsum_multiplier = 1
    monthly_cumsum_multiplier = 1
    if item_has_monthly and item_has_daily:
        item_daily_index = daily_index - daily_index[0]
        item_daily_value = item_daily_data

        item_monthly_index = monthly_index - monthly_index[0]
        item_monthly_value = item_monthly_data
    elif (not item_has_daily) and item_has_monthly:
        item_monthly_index = item_daily_index = monthly_index - monthly_index[0]
        item_monthly_value = item_monthly_data
        item_daily_value = item_monthly_data / DAYS_IN_MONTH
        daily_cumsum_multiplier = DAYS_IN_MONTH
    elif item_has_daily and (not item_has_monthly):
        item_daily_index = daily_index - daily_index[0]
        item_daily_value = item_daily_data

        item_monthly_index, item_monthly_value = convert_daily_to_monthly(daily_index, item_daily_data)
        item_monthly_index = item_monthly_index - item_monthly_index[0]
    else:
        item_monthly_index = np.array([])
        item_monthly_value = np.array([])
        item_daily_index = np.array([])
        item_daily_value = np.array([])

    if (not item_has_daily) and (not item_has_monthly):
        item_align_daily_offset = 0
        item_align_monthly_offset = 0
    else:
        item_maximum_daily_INDEX = np.nanargmax(item_daily_value)
        item_maximum_monthly_INDEX = np.nanargmax(item_monthly_value)
        item_align_daily_offset = int(item_daily_index[item_maximum_daily_INDEX])
        item_align_monthly_offset = int(item_monthly_index[item_maximum_monthly_INDEX])

    this_item = {
        'monthly': {
            'index': item_monthly_index.tolist(),
            'value': np.where(np.isnan(item_monthly_value), None, item_monthly_value).tolist(),
            'align_offset': item_align_monthly_offset,
            'cumsum_multiplier': monthly_cumsum_multiplier
        },
        'daily': {
            'index': item_daily_index.tolist(),
            'value': np.where(np.isnan(item_daily_value), None, item_daily_value).tolist(),
            'align_offset': item_align_daily_offset,
            'cumsum_multiplier': daily_cumsum_multiplier
        }
    }
    return this_item


def get_plot_data_ratio_phase(phase, basePhase, well_production, well_data_info):
    ratio_item = phase + '/' + basePhase
    monthly_index = well_production['monthly']['index']
    item_monthly_data = well_production['monthly'][ratio_item]
    daily_index = well_production['daily']['index']
    item_daily_data = well_production['daily'][ratio_item]
    item_has_monthly = well_data_info[ratio_item]['has_monthly']
    item_has_daily = well_data_info[ratio_item]['has_daily']

    if item_has_monthly and item_has_daily:
        item_daily_index = daily_index - daily_index[0]
        item_daily_value = item_daily_data
        item_monthly_index = monthly_index - monthly_index[0]
        item_monthly_value = item_monthly_data
    elif (not item_has_daily) and item_has_monthly:
        item_monthly_index = item_daily_index = monthly_index - monthly_index[0]
        item_monthly_value = item_daily_value = item_monthly_data
    elif item_has_daily and (not item_has_monthly):
        item_daily_index = daily_index - daily_index[0]
        item_daily_value = item_daily_data

        item_monthly_index, phase_monthly_data = convert_daily_to_monthly(daily_index, well_production['daily'][phase])
        _, basePhase_monthly_data = convert_daily_to_monthly(daily_index, well_production['daily'][basePhase])
        item_monthly_value = get_ratio_without_warning(phase_monthly_data, basePhase_monthly_data)
        item_monthly_index = item_monthly_index - item_monthly_index[0]
    else:
        item_monthly_index = np.array([])
        item_monthly_value = np.array([])
        item_daily_index = np.array([])
        item_daily_value = np.array([])

    if (not item_has_daily) and (not item_has_monthly):
        item_align_daily_offset = 0
        item_align_monthly_offset = 0
    else:
        item_maximum_daily_INDEX = np.nanargmax(item_daily_value)
        item_maximum_monthly_INDEX = np.nanargmax(item_monthly_value)
        item_align_daily_offset = int(item_daily_index[item_maximum_daily_INDEX])
        item_align_monthly_offset = int(item_monthly_index[item_maximum_monthly_INDEX])

    this_item = {
        'monthly': {
            'index': item_monthly_index.tolist(),
            'value': np.where(np.isnan(item_monthly_value), None, item_monthly_value).tolist(),
            'align_offset': item_align_monthly_offset,
            'cumsum_multiplier': 1
        },
        'daily': {
            'index': item_daily_index.tolist(),
            'value': np.where(np.isnan(item_daily_value), None, item_daily_value).tolist(),
            'align_offset': item_align_daily_offset,
            'cumsum_multiplier': 1
        }
    }
    return this_item


def get_preferred_resolution_well(per_phase_data_freq_preference, well_data_info, well_forecast_info):
    ret = {}
    for phase in per_phase_data_freq_preference.keys():
        data_freq_preference = per_phase_data_freq_preference[phase]

        if data_freq_preference in ['monthly_only', 'daily_only']:
            ret[phase] = data_freq_preference.split('_')[0]
        elif data_freq_preference in ['monthly_preference', 'daily_preference']:
            if data_freq_preference == 'monthly_preference':
                ret[phase] = 'monthly' if well_data_info[phase]['has_monthly'] else 'daily'
            else:
                ret[phase] = 'daily' if well_data_info[phase]['has_daily'] else 'monthly'
        else:
            if phase in ['oil', 'gas', 'water']:
                ret[phase] = well_forecast_info[phase]['forecast_data_freq']
            else:
                target_phase, base_phase = phase.split('/')
                if well_forecast_info[target_phase] == 'monthly' and well_forecast_info[base_phase] == 'monthly':
                    ret[phase] = 'monthly'
                else:
                    ret[phase] = 'daily'
    return ret


# The only 4 (currently) possible values for the well validation criteria
class WellValidationCriteriaEnum(Enum):
    must_have_prod_and_forecast = 'must_have_prod_and_forecast'
    must_have_prod = 'must_have_prod'
    must_have_forecast = 'must_have_forecast'
    either_have_prod_or_forecast = 'either_have_prod_or_forecast'


def get_well_valid(well_validation_criteria: WellValidationCriteriaEnum, has_forecast: bool, has_data: bool) -> bool:
    # Create a dispatcher to handle the logic.
    validation_callbacks: Dict[WellValidationCriteriaEnum, Callable[[bool, bool], bool]] = {
        WellValidationCriteriaEnum.must_have_prod_and_forecast: (lambda f, d: f and d),
        WellValidationCriteriaEnum.must_have_prod: (lambda f, d: d),
        WellValidationCriteriaEnum.must_have_forecast: (lambda f, d: f),
        WellValidationCriteriaEnum.either_have_prod_or_forecast: (lambda f, d: f or d),
    }

    if well_validation_criteria not in validation_callbacks.keys():
        # Not sure how you got here, this is just a sanity check.
        return False
    else:
        # There is no `get` function for Enums to provide a default value, so do a sanity check first
        return validation_callbacks[well_validation_criteria](has_forecast, has_data)
