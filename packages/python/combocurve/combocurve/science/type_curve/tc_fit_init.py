import numpy as np
from combocurve.science.type_curve.TC_helper import get_ratio_without_warning
from combocurve.science.core_function.helper import shift_idx
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.multiple_phase_forecast_utils.forecast_function_store import ForecastFunctionStore
from copy import deepcopy
from functools import partial

DATE0 = np.datetime64('1900-01-01')
MAX_DAILY_LIMIT = 2000
multi_seg = MultipleSegments()


class tc_init:
    def analysis(self, input_dict):
        ## input
        well_list = input_dict['well_list']
        target_phase = input_dict['target_phase']
        phaseType = input_dict['phaseType']
        base_phase = input_dict['base_phase']
        forecast_series = input_dict['forecast_series']
        resolved_resolution = input_dict['resolved_resolution']
        forecast_parent_type = input_dict['forecast_parent_type']
        data_info = input_dict['data_info']
        forecast_info = input_dict['forecast_info']
        eur_info = input_dict['eur_info']

        ## some conversion
        init_para_dict = input_dict['init_para_dict']
        tc_target_data_freq = init_para_dict['TC_target_data_freq']
        TC_life = init_para_dict['TC_life']
        num_month = 12 * TC_life

        ## loop
        target_information_s = []
        ratio_information_s = []
        well_fpd_month_s = []
        eur_list = []
        for well in well_list:
            # check for branch
            well_str = well['well']
            has_data = data_info.get(well_str, {}).get(target_phase, {}).get('has_data', False)
            has_forecast = forecast_info.get(well_str, {}).get(target_phase, {}).get('has_forecast', False)
            data_key = 'has' if has_data else 'no'
            forecast_key = 'has' if has_forecast else 'no'
            branch_key = f"{data_key}_data_and_{forecast_key}_forecast"

            well_branch = well_analysis_branches.get(branch_key)
            target_information, ratio_information, fpd_month = well_branch(well, phaseType, target_phase, base_phase,
                                                                           num_month, resolved_resolution,
                                                                           forecast_series, forecast_parent_type,
                                                                           tc_target_data_freq)
            target_information['header'] = {'well_id': well_str}
            ratio_information['header'] = {'well_id': well_str}
            target_information_s += [target_information]
            ratio_information_s += [ratio_information]
            well_fpd_month_s += [fpd_month]
            eur_list += [eur_info.get(well_str, {}).get(target_phase, 0)]

        ratio_init = {
            'well_information_s': ratio_information_s,
            'cum_dict': None,
            'eur': None,
            'data_freq': tc_target_data_freq
        }
        target_init = {
            'well_information_s': target_information_s,
            'cum_dict': self.get_cum_info(well_fpd_month_s, num_month),
            'eur': eur_list,
            'data_freq': tc_target_data_freq
        }
        if phaseType == 'rate':
            return target_init
        else:
            return {'target_phase': target_init, 'ratio': ratio_init}

    def get_cum_info(self, well_start_month_s, num_month):
        n_wells = len(well_start_month_s)
        if n_wells == 0:
            return {'idx': [], 'cum_subind': []}
        well_start_month_s = np.array([np.datetime64("NaT") if x is None else x for x in well_start_month_s])
        min_month = np.nanmin(well_start_month_s)
        max_month = np.nanmax(well_start_month_s)
        if np.isnat(max_month):  ## array length should match with well_information_s
            return {'idx': [], 'cum_subind': [[None, None] * n_wells]}

        month_arr = np.arange(min_month, max_month + num_month)
        idx_arr = ((month_arr.astype('datetime64[D]') - np.datetime64('1900-01-01')).astype(int) + 14).tolist()

        cum_subind = []
        for start_month in well_start_month_s:
            if np.isnat(start_month):
                cum_subind += [[None, None]]
            else:
                left = int(start_month - min_month)
                cum_subind += [[left, left + num_month]]

        # cum_subind_left = (well_start_month_s - min_month).astype(int)
        # cum_subind = np.stack([cum_subind_left, cum_subind_left + num_month], axis=1)
        return {'idx': idx_arr, 'cum_subind': cum_subind}
        # min_month = np.min(well_start_month_s)
        # max_month = np.max(well_start_month_s)
        # month_arr = np.arange(min_month, max_month + num_month)
        # idx_arr = (month_arr.astype('datetime64[D]') - np.datetime64('1900-01-01')).astype(int) + 14
        # cum_subind_left = (well_start_month_s - min_month).astype(int)
        # cum_subind = np.stack([cum_subind_left, cum_subind_left + num_month], axis=1)
        # return {'idx': idx_arr, 'cum_subind': cum_subind}

    def T2_update_indexes(self, well_info):
        for k, v in well_info['indexes'].items():
            for kk, vv in v.items():
                if vv is not None:
                    v[kk] = int(vv)

    def T2_monthly(self, ana_result):
        ana_result['eur'] = np.array(ana_result['eur']).astype(float).tolist()
        # cum_dict = ana_result['cum_dict']
        # cum_dict['idx'] = np.array(cum_dict['idx'], dtype=int).tolist()
        # cum_dict['cum_subind'] = np.array(cum_dict['cum_subind'], dtype=int).tolist()

        max_len = max(
            (len(w['monthly_prod']) for w in ana_result['well_information_s'] if w['monthly_prod'] is not None),
            default=0)
        for well_info in ana_result['well_information_s']:
            self.T2_update_indexes(well_info)
            if well_info['monthly_prod'] is not None:
                well_monthly_prod = np.array(well_info['monthly_prod'])
                well_monthly_prod = np.where(np.isnan(well_monthly_prod), None, well_monthly_prod)
                well_info['monthly_prod'] = well_monthly_prod.tolist()
                well_info['days_in_month_arr'] = np.array(well_info['days_in_month_arr']).tolist()
                well_info['data_month_start_idx'] = np.array(well_info['data_month_start_idx']).tolist()
            else:
                well_info['monthly_prod'] = [None] * max_len

        return ana_result

    def T2_daily(self, ana_result):
        ana_result['eur'] = np.array(ana_result['eur']).astype(float).tolist()
        # cum_dict = ana_result['cum_dict']
        # cum_dict['idx'] = np.array(cum_dict['idx'], dtype=int).tolist()
        # cum_dict['cum_subind'] = np.array(cum_dict['cum_subind'], dtype=int).tolist()

        for well_info in ana_result['well_information_s']:
            self.T2_update_indexes(well_info)
            if well_info['monthly_prod'] is not None:
                well_info['data'] = np.where(np.isnan(well_info['data']), None, well_info['data']).tolist()
                well_monthly_prod = np.array(well_info['monthly_prod'])
                well_monthly_prod = np.where(np.isnan(well_monthly_prod), None, well_monthly_prod)
                well_info['monthly_prod'] = well_monthly_prod.tolist()
                well_info['days_in_month_arr'] = np.array(well_info['days_in_month_arr']).tolist()
                well_info['data_month_start_idx'] = np.array(well_info['data_month_start_idx']).tolist()
            else:
                well_info['monthly_prod'] = [None]

        return ana_result

    def T2_ratio_monthly(self, ana_result):
        ### target_phase
        target_phase = ana_result['target_phase']
        target_phase['eur'] = np.array(target_phase['eur']).astype(float).tolist()
        # cum_dict = target_phase['cum_dict']
        # cum_dict['idx'] = np.array(cum_dict['idx'], dtype=int).tolist()
        # cum_dict['cum_subind'] = np.array(cum_dict['cum_subind'], dtype=int).tolist()
        for well_info in target_phase['well_information_s']:
            self.T2_update_indexes(well_info)
            if well_info['monthly_prod'] is not None:
                well_monthly_prod = np.array(well_info['monthly_prod'])
                well_monthly_prod = np.where(np.isnan(well_monthly_prod), None, well_monthly_prod)
                well_info['monthly_prod'] = well_monthly_prod.tolist()
                well_info['days_in_month_arr'] = np.array(well_info['days_in_month_arr']).tolist()
                well_info['data_month_start_idx'] = np.array(well_info['data_month_start_idx']).tolist()
            else:
                well_info['monthly_prod'] = [None]

        ### ratio
        ratio = ana_result['ratio']
        for well_info in ratio['well_information_s']:
            self.T2_update_indexes(well_info)
            if well_info['monthly_prod'] is not None:
                well_monthly_prod = np.array(well_info['monthly_prod'])
                well_monthly_prod = np.where(np.isnan(well_monthly_prod), None, well_monthly_prod)
                well_info['monthly_prod'] = well_monthly_prod.tolist()
                well_info['days_in_month_arr'] = np.array(well_info['days_in_month_arr']).tolist()
                well_info['data_month_start_idx'] = np.array(well_info['data_month_start_idx']).tolist()
            else:
                well_info['monthly_prod'] = [None]

        return ana_result

    def T2_ratio_daily(self, ana_result):
        ### target_phase
        target_phase = ana_result['target_phase']
        target_phase['eur'] = np.array(target_phase['eur']).astype(float).tolist()
        # cum_dict = target_phase['cum_dict']
        # cum_dict['idx'] = np.array(cum_dict['idx'], dtype=int).tolist()
        # cum_dict['cum_subind'] = np.array(cum_dict['cum_subind'], dtype=int).tolist()
        for key in ['target_phase', 'ratio']:
            for well_info in ana_result[key]['well_information_s']:
                self.T2_update_indexes(well_info)
                if well_info['monthly_prod'] is not None:
                    well_info['data'] = np.where(np.isnan(well_info['data']), None, well_info['data']).tolist()
                    well_monthly_prod = np.array(well_info['monthly_prod'])
                    well_monthly_prod = np.where(np.isnan(well_monthly_prod), None, well_monthly_prod)
                    well_info['monthly_prod'] = well_monthly_prod.tolist()
                    well_info['days_in_month_arr'] = np.array(well_info['days_in_month_arr']).tolist()
                    well_info['data_month_start_idx'] = np.array(well_info['data_month_start_idx']).tolist()
                else:
                    well_info['monthly_prod'] = [None]

        return ana_result

    def body(self, input_dict):
        init_para_dict = input_dict['init_para_dict']
        phaseType = input_dict['phaseType']
        tc_target_data_freq = init_para_dict.get('TC_target_data_freq')
        ana_result = self.analysis(input_dict)
        if tc_target_data_freq == 'daily':
            if phaseType == 'rate':
                return self.T2_daily(ana_result)
            elif phaseType == 'ratio':
                return self.T2_ratio_daily(ana_result)
        else:
            if phaseType == 'rate':
                return self.T2_monthly(ana_result)
            elif phaseType == 'ratio':
                return self.T2_ratio_monthly(ana_result)


def has_data_and_has_forecast(well, phaseType, target_phase, base_phase, num_month, resolved_resolution,
                              forecast_series, forecast_parent_type, tc_target_data_freq):
    well_str = well['well']
    well_data_freq = resolved_resolution[well_str][target_phase]
    well_data = well[well_data_freq]
    well_prod = {
        'idx': well_data['index'],
        'target_phase': well_data[target_phase],
        'base_phase': well_data.get(base_phase)
    }

    target_predict, base_predict, _ = get_support_funcs(well.get('forecast'), forecast_parent_type, forecast_series,
                                                        phaseType, target_phase, base_phase)

    prod_idx = np.array(well_prod['idx'], dtype=int)
    fpd_month = (DATE0 + prod_idx[0]).astype('datetime64[M]')

    prod_data, rate_indexes, ratio_indexes = prepare_production_data(well_prod, phaseType, well_data_freq,
                                                                     tc_target_data_freq, num_month, target_predict,
                                                                     base_predict)
    forecast_data = prepare_forecast_data(well_prod, phaseType, well_data_freq, tc_target_data_freq, num_month,
                                          target_predict, base_predict)
    ####
    target_information, ratio_information = get_target_ratio_info(phaseType, tc_target_data_freq, num_month, fpd_month,
                                                                  prod_data, forecast_data, rate_indexes, ratio_indexes)
    target_information['has_production'] = True
    ratio_information['has_production'] = True
    return target_information, ratio_information, fpd_month


def no_data_and_has_forecast(well, phaseType, target_phase, base_phase, num_month, resolved_resolution, forecast_series,
                             forecast_parent_type, tc_target_data_freq):
    ## nothing needs adjustment for this line, since all they are forecast related stuff
    target_predict, base_predict, get_phase_segments = get_support_funcs(well.get('forecast'), forecast_parent_type,
                                                                         forecast_series, phaseType, target_phase,
                                                                         base_phase)

    ## we need to get the first forecast_data
    forecast_segments = get_phase_segments(target_phase)
    forecast_start_idx = int(forecast_segments[0]['start_idx'])
    fpd_month = (DATE0 + forecast_start_idx).astype(
        'datetime64[M]')  ## I should use forecast_segments start to get this

    # prod_data, rate_indexes, ratio_indexes = prepare_production_data(well_prod, phaseType, well_data_freq,
    #                                                                  tc_target_data_freq, num_month, target_predict,
    #                                                                  base_predict)
    # we do not need any of those, and actually, they might need to be generated using forecast information
    # let's hard code result out

    # index_template = {'month': None, 'day': None, 'idx': None}
    # we need to fill in 3 fields, month should be 0, 'day' should be ?, 'idx' should be?
    # I want to look at an example of has production to get the idea

    ## first_data, and last_data should be hard coded

    ## maximum data should be the month that has the maximum data

    ## monthly result does not care about 'day' and 'idx'

    ## daily result need day and idx
    ## when well's data is monthly, **guess: first_data.idx should be the start of that month, and last_data.idx should
    ## be the end of some month, maximum.idx should be the 15th of maximum month
    ## when well's data is daily, **: first_data.idx is the start of daily data, last_data.idx is the end of daily data,
    ## maximum.idx, should be the idx of maximum's months' maximum daily data

    is_return_monthly = tc_target_data_freq == 'monthly'

    forecast_first_month = (forecast_start_idx + DATE0).astype('datetime64[M]')
    forecast_last_month = forecast_first_month + num_month - 1
    first_month_start_idx = (forecast_first_month.astype('datetime64[D]') - DATE0).astype(int)
    end_month_end_idx = ((forecast_last_month + 1).astype('datetime64[D]') - 1 - DATE0).astype(int)

    pred_daily_indexes = np.arange(first_month_start_idx, end_month_end_idx + 1)
    # first couple of days should be nan
    target_daily = target_predict(pred_daily_indexes)  ## [0,0,0, 1,2,3, ... 0,0,0], [nan, nan, nan, 1,2,3, 0,0,0]
    base_daily = base_predict(pred_daily_indexes)

    first_day = forecast_start_idx - pred_daily_indexes[0]
    target_daily[:first_day] = np.nan
    base_daily[:first_day] = np.nan
    ratio_daily = get_ratio_without_warning(target_daily, base_daily)

    #### group sums
    index = pred_daily_indexes
    index_date = pred_daily_indexes + DATE0
    data = target_daily
    month_idx = index_date.astype("datetime64[M]").astype(int)  ## we are using 1970-01-01 as 0 index this line
    month_idx_groups = np.unique(month_idx)

    target_month_sum = np.array([np.nansum(data[month_idx == unq]) for unq in month_idx_groups], dtype=float)
    base_month_sum = np.array([np.nansum(base_daily[month_idx == unq]) for unq in month_idx_groups], dtype=float)
    ratio_monthly = get_ratio_without_warning(target_month_sum, base_month_sum)

    #### first
    first_month = 0
    first_idx = forecast_start_idx  ## equivalent to index[first_day]
    #### last
    last_month = num_month - 1
    last_day = ((forecast_last_month + 1).astype('datetime64[D]') - 1
                - forecast_last_month.astype('datetime64[D]')).astype(int)  ## number of days in last month - 1
    last_idx = end_month_end_idx
    #### max
    month_argmax = np.argmax(target_month_sum)
    month_max = month_idx_groups[month_argmax]  ## maximum month offset from 1970
    daily_argmax_within_max_month = np.argmax(data[month_idx == month_max])
    ####

    MONTH0_1970 = np.datetime64('1970-01')
    month_groups = MONTH0_1970 + month_idx_groups
    days_in_month_arr = ((month_groups + 1).astype("datetime64[D]") - month_groups.astype('datetime64[D]')).astype(int)
    data_month_start_idx = (month_groups.astype('datetime64[D]') - DATE0).astype(int)

    #########
    # const well_last_month_INDEX = indexes.last_data.month; // relative INDEX, this can be the last month, 720(719)
    # const well_start_idx = indexes.first_data.idx; // real date of first data,
    #                                         in this case it should be forecast first segment's start_idx
    # const well_maximum_idx = indexes.maximum_data.idx; // maximum_idx, we generate this from backend
    # const well_last_idx = indexes.last_data.idx; // last day idx in forecast_start_month + 720
    # const well_end_idx = // end of last month
    #  	data_month_start_idx[data_month_start_idx.length - 1] + days_in_month_arr[days_in_month_arr.length - 1];
    # const well_first_day = indexes.first_data.day // forecast's first day

    rate_indexes = {
        ## this  is going to be information of forecast's, we do not use this to mark no data
        ## use target_information['has_prodeuction'] directly
        'first_data': {
            'month': first_month,  ## None
            'day': None if is_return_monthly else first_day,
            'idx': None if is_return_monthly else first_idx
        },
        'last_data': {
            'month': last_month,
            'day': None if is_return_monthly else last_day,
            'idx': None if is_return_monthly else last_idx
        },
        'maximum_data': {
            'month': month_argmax,
            'day': None if is_return_monthly else daily_argmax_within_max_month,
            'idx': None if is_return_monthly else index[month_idx == month_max][daily_argmax_within_max_month],
        }
    }
    rate_daily_slice_right = int(rate_indexes['maximum_data']['month'] * 31) + 100 + MAX_DAILY_LIMIT
    target_information = {
        'has_production': False,
        'data': None if is_return_monthly else target_daily[:rate_daily_slice_right],
        'monthly_prod': target_month_sum / days_in_month_arr,
        'days_in_month_arr': days_in_month_arr,
        'data_month_start_idx': data_month_start_idx,
        'indexes': rate_indexes
    }

    ratio_information = {}
    if phaseType == 'ratio':
        ratio_daily_slice_right = int(rate_indexes['maximum_data']['month'] * 31) + 100 + MAX_DAILY_LIMIT
        ratio_information = {
            **target_information,
            'data': None if is_return_monthly else ratio_daily[:ratio_daily_slice_right],
            'monthly_prod': ratio_monthly,
        }

    return target_information, ratio_information, fpd_month


def has_data_and_no_forecast(well, phaseType, target_phase, base_phase, num_month, resolved_resolution, forecast_series,
                             forecast_parent_type, tc_target_data_freq):
    well_str = well['well']
    well_data_freq = resolved_resolution[well_str][target_phase]
    well_data = well[well_data_freq]
    well_prod = {
        'idx': well_data['index'],
        'target_phase': well_data[target_phase],
        'base_phase': well_data.get(base_phase)
    }

    def target_predict(t):
        return np.ones(len(t)) * np.nan

    base_predict = target_predict

    prod_idx = np.array(well_prod['idx'], dtype=int)
    fpd_month = (DATE0 + prod_idx[0]).astype('datetime64[M]')

    # target_prod_value = np.array(well_prod['target_phase'], dtype=float)
    # target_cum_data = np.nansum(target_prod_value)

    prod_data, rate_indexes, ratio_indexes = prepare_production_data(well_prod, phaseType, well_data_freq,
                                                                     tc_target_data_freq, num_month, target_predict,
                                                                     base_predict)
    forecast_data = prepare_forecast_data(well_prod, phaseType, well_data_freq, tc_target_data_freq, num_month,
                                          target_predict, base_predict)
    ####
    target_information, ratio_information = get_target_ratio_info(phaseType, tc_target_data_freq, num_month, fpd_month,
                                                                  prod_data, forecast_data, rate_indexes, ratio_indexes)
    target_information['has_production'] = True
    ratio_information['has_production'] = True
    return target_information, ratio_information, fpd_month


## this function provides some data that is hard to work with
def no_data_and_no_forecast(well, phaseType, target_phase, base_phase, num_month, resolved_resolution, forecast_series,
                            forecast_parent_type, tc_target_data_freq):
    rate_indexes = {
        'first_data': {
            'month': -1,  ## None
            'day': None,
            'idx': None
        },
        'last_data': {
            'month': -1,  ## None
            'day': None,
            'idx': None
        },
        'maximum_data': {
            'month': -1,
            'day': None,
            'idx': None,
        }
    }

    target_information = {
        'has_production': False,
        'data': None,
        'monthly_prod': None,
        'days_in_month_arr': None,
        'data_month_start_idx': None,
        'indexes': rate_indexes
    }

    ratio_information = target_information
    return target_information, ratio_information, None


well_analysis_branches = {
    'has_data_and_has_forecast': has_data_and_has_forecast,
    'no_data_and_has_forecast': no_data_and_has_forecast,
    'has_data_and_no_forecast': has_data_and_no_forecast,
    'no_data_and_no_forecast': no_data_and_no_forecast
}


def get_support_funcs(well_phase_forecasts,
                      forecast_parent_type,
                      forecast_series,
                      phaseType,
                      target_phase,
                      base_phase=None):
    function_stores = ForecastFunctionStore(well_phase_forecasts, forecast_parent_type)

    if phaseType == 'rate':
        use_base_phase = None
    else:
        use_base_phase = base_phase

    return (partial(function_stores.predict, **{
        'phase': target_phase,
        'P_series': forecast_series
    }), partial(function_stores.predict, **{
        'phase': use_base_phase,
        'P_series': forecast_series
    }), partial(function_stores.get_phase_segments, **{'P_series': forecast_series}))


def convert_monthly_to_daily(fill_value, days_in_month_arr):
    ret_val_mat = np.tile(fill_value.reshape(-1, 1) / days_in_month_arr.reshape(-1, 1), (1, 31))
    ret_val_mask = np.ones(ret_val_mat.shape, dtype=bool)
    for i, n_day in enumerate(days_in_month_arr):
        ret_val_mask[i, :(31 - n_day)] = False
    return ret_val_mat[ret_val_mask]


def convert_daily_to_monthly(fill_value, days_in_month_arr):
    nonnan_mask = ~np.isnan(fill_value)
    cum_value = np.nancumsum(fill_value)
    cum_nonnan = np.cumsum(nonnan_mask)
    index = np.cumsum(days_in_month_arr) - 1
    ret = np.zeros(days_in_month_arr.shape[0])
    month_cum = np.concatenate([[0], cum_value[index]])
    ret = (month_cum[1:] - month_cum[:(-1)])
    month_nonnan = np.concatenate([[0], cum_nonnan[index]])

    ret[(month_nonnan[1:] - month_nonnan[:(-1)]) == 0] = np.nan
    return ret


def prepare_production_data(well_prod, phaseType, well_data_freq, tc_target_data_freq, num_month, target_predict,
                            base_predict):
    ### should consider the last few days, filled in by forecast by90
    prod_idx = np.array(well_prod['idx'], dtype=int)
    start_idx = prod_idx[0]
    target_prod = np.array(well_prod['target_phase'], dtype=float)
    if phaseType == 'ratio':
        base_prod = np.array(well_prod['base_phase'], dtype=float)

    ### fill in missing values
    ## when this well's data is daily data, and to generate monthly data,
    ##  we are filling the missing days in last month by forecast
    ## I think this idea is going to be the same for when we do not have production
    ## *** so when we do not have production, it's likely we need to sumup all the month to
    ## get the production in that month
    if well_data_freq == 'daily':
        end_data_idx = prod_idx[-1]
        end_data_end_month_idx = (((DATE0 + end_data_idx).astype('datetime64[M]') + 1).astype('datetime64[D]') - 1
                                  - DATE0).astype(int)
        if end_data_idx < end_data_end_month_idx:
            fillin_idx = np.arange(end_data_idx + 1, end_data_end_month_idx + 1)
            fillin_target = target_predict(fillin_idx)
            fillin_base = base_predict(fillin_idx)
            prod_idx = np.concatenate([prod_idx, fillin_idx])
            target_prod = np.concatenate([target_prod, fillin_target])
            if phaseType == 'ratio':
                base_prod = np.concatenate([base_prod, fillin_base])

    ### cut data off at the specified life of well
    data_limit_idx = ((DATE0 + shift_idx(start_idx, num_month, 'month')).astype('datetime64[M]').astype('datetime64[D]')
                      - DATE0 - 1).astype(int)
    use_data_mask = prod_idx <= data_limit_idx
    prod_idx = prod_idx[use_data_mask]
    target_prod = target_prod[use_data_mask]
    if phaseType == 'ratio':
        base_prod = base_prod[use_data_mask]

    ###
    ret = {
        'daily': {
            'idx': [],
            'target_phase': [],
            'ratio': []
        },
        'monthly': {
            'idx': [],
            'target_phase': [],
            'ratio': []
        }
    }
    index_template = {'month': None, 'day': None, 'idx': None}
    rate_indexes = {
        'first_data': index_template,
        'last_data': deepcopy(index_template),
        'maximum_data': deepcopy(index_template)
    }

    def update_monthly_rate_indexes():
        rate_indexes['first_data']['month'] = 0
        rate_indexes['last_data']['month'] = fill_month_arr.shape[0] - 1
        if phaseType == 'rate':
            rate_indexes['maximum_data']['month'] = maximum_month_INDEX
        else:
            ratio_indexes['maximum_data']['month'] = ratio_maximum_month_INDEX

    ratio_indexes = deepcopy(rate_indexes)
    ### calcualte shared information
    start_month = (DATE0 + prod_idx[0]).astype('datetime64[M]')
    end_month = (DATE0 + prod_idx[-1]).astype('datetime64[M]')
    month_arr = (DATE0 + prod_idx).astype('datetime64[M]')

    fill_month_arr = np.arange(start_month, end_month + 1)
    month_start_idx_arr = (fill_month_arr.astype('datetime64[D]') - DATE0).astype(int)
    month_end_idx_arr = ((fill_month_arr + 1).astype('datetime64[D]') - 1 - DATE0).astype(int)
    days_in_month_arr = (month_end_idx_arr - month_start_idx_arr + 1)

    monthly_idx = (fill_month_arr.astype('datetime64[D]') - DATE0 + 14).astype(int)
    daily_idx = np.arange(month_start_idx_arr[0], month_end_idx_arr[-1] + 1)
    if well_data_freq == 'monthly':
        fill_INDEX = (month_arr - month_arr[0]).astype(int)
        monthly_target = np.zeros(fill_month_arr.shape) * np.nan
        monthly_target[fill_INDEX] = target_prod
        maximum_month_INDEX = np.nanargmax(monthly_target)

        ret['monthly']['idx'] = monthly_idx
        ret['monthly']['target_phase'] = monthly_target / days_in_month_arr

        if phaseType == 'ratio':
            monthly_base = np.zeros(fill_month_arr.shape) * np.nan
            monthly_base[fill_INDEX] = base_prod
            ret['monthly']['ratio'] = get_ratio_without_warning(monthly_target, monthly_base)
            ratio_maximum_month_INDEX = np.nanargmax(ret['monthly']['ratio'])

        if tc_target_data_freq == 'monthly':
            update_monthly_rate_indexes()
        else:
            daily_target = convert_monthly_to_daily(monthly_target, days_in_month_arr)
            ret['daily']['idx'] = daily_idx
            ret['daily']['target_phase'] = daily_target

            rate_indexes['first_data'] = {'month': 0, 'day': 0, 'idx': daily_idx[0]}
            rate_indexes['last_data'] = {
                'month': fill_month_arr.shape[0],
                'day': days_in_month_arr[-1] - 1,
                'idx': daily_idx[-1]
            }
            daily_left = np.sum(days_in_month_arr[:maximum_month_INDEX], dtype=int)
            maximum_day_INDEX = 14
            rate_indexes['maximum_data'] = {
                'month': maximum_month_INDEX,
                'day': maximum_day_INDEX,
                'idx': daily_idx[daily_left + 14]
            }
            if phaseType == 'ratio':
                daily_base = convert_monthly_to_daily(monthly_base, days_in_month_arr)
                ret['daily']['ratio'] = get_ratio_without_warning(daily_target, daily_base)
                ratio_daily_left = np.sum(days_in_month_arr[:ratio_maximum_month_INDEX], dtype=int)
                ratio_maximum_day_INDEX = 14
                ratio_indexes['maximum_data'] = {
                    'month': ratio_maximum_month_INDEX,
                    'day': ratio_maximum_day_INDEX,
                    'idx': daily_idx[ratio_daily_left + 14]
                }
    else:
        fill_INDEX = prod_idx - daily_idx[0]
        daily_target = np.zeros(daily_idx.shape) * np.nan
        daily_target[fill_INDEX] = target_prod
        monthly_target = convert_daily_to_monthly(daily_target, days_in_month_arr)
        maximum_month_INDEX = np.nanargmax(monthly_target)

        ret['monthly']['idx'] = monthly_idx
        ret['monthly']['target_phase'] = monthly_target / days_in_month_arr

        if phaseType == 'ratio':
            daily_base = np.zeros(daily_idx.shape) * np.nan
            daily_base[fill_INDEX] = base_prod
            monthly_base = convert_daily_to_monthly(daily_base, days_in_month_arr)
            ret['monthly']['ratio'] = get_ratio_without_warning(monthly_target, monthly_base)
            # np.nanargmax can crash in edge cases when monthly ratio is [NaN] (CC-24418)
            try:
                ratio_maximum_month_INDEX = np.nanargmax(ret['monthly']['ratio'])
            except ValueError:
                ratio_maximum_month_INDEX = 0

        if tc_target_data_freq == 'monthly':
            update_monthly_rate_indexes()
        else:
            ret['daily']['idx'] = daily_idx
            ret['daily']['target_phase'] = daily_target

            rate_indexes['first_data'] = {'month': 0, 'day': prod_idx[0] - daily_idx[0], 'idx': prod_idx[0]}
            rate_indexes['last_data'] = {
                'month': fill_month_arr.shape[0] - 1,
                'day': prod_idx[-1] - month_start_idx_arr[-1],
                'idx': prod_idx[-1]
            }
            daily_left = np.sum(days_in_month_arr[:maximum_month_INDEX], dtype=int)
            daily_right = np.sum(days_in_month_arr[:(maximum_month_INDEX + 1)], dtype=int)
            maximum_day_INDEX = np.nanargmax(daily_target[daily_left:daily_right])
            rate_indexes['maximum_data'] = {
                'month': maximum_month_INDEX,
                'day': maximum_day_INDEX,
                'idx': daily_idx[daily_left + maximum_day_INDEX]
            }
            if phaseType == 'ratio':
                ret['daily']['ratio'] = get_ratio_without_warning(daily_target, daily_base)
                ratio_daily_left = np.sum(days_in_month_arr[:ratio_maximum_month_INDEX], dtype=int)
                ratio_daily_right = np.sum(days_in_month_arr[:(ratio_maximum_month_INDEX + 1)], dtype=int)
                # np.nanargmax can crash in edge cases when monthly ratio is [NaN] (CC-24418)
                try:
                    ratio_maximum_day_INDEX = np.nanargmax(ret['daily']['ratio'][ratio_daily_left:ratio_daily_right])
                except ValueError:
                    ratio_maximum_day_INDEX = 0
                # ratio_indexes['maximum_data'] = {
                #     'month': ratio_maximum_month_INDEX,
                #     'day': ratio_maximum_day_INDEX,
                #     'idx': daily_idx[ratio_daily_left + ratio_maximum_day_INDEX]
                # }

    ratio_indexes['first_data'] = rate_indexes['first_data']
    ratio_indexes['last_data'] = rate_indexes['last_data']
    return ret, rate_indexes, ratio_indexes


def prepare_forecast_data(well_prod, phaseType, well_data_freq, tc_target_data_freq, num_month, target_predict,
                          base_predict):
    prod_idx = np.array(well_prod['idx'], dtype=int)
    start_idx = prod_idx[0]
    data_limit_idx = ((DATE0 + shift_idx(start_idx, num_month, 'month')).astype('datetime64[M]').astype('datetime64[D]')
                      - DATE0 - 1).astype(int)
    use_data_mask = prod_idx <= data_limit_idx
    prod_idx = prod_idx[use_data_mask]

    start_data_idx = prod_idx[0]
    end_data_idx = prod_idx[-1]
    data_start_month = (DATE0 + start_data_idx).astype('datetime64[M]')
    data_end_month = (DATE0 + end_data_idx).astype('datetime64[M]')
    forecast_end_month = data_start_month + num_month - 1
    forecast_start_month = data_end_month + 1

    ret = {
        'daily': {
            'idx': [],
            'target_phase': [],
            'ratio': []
        },
        'monthly': {
            'idx': [],
            'target_phase': [],
            'ratio': []
        }
    }
    if forecast_end_month >= forecast_start_month:
        monthly_idx = (np.arange(forecast_start_month, forecast_end_month + 1).astype('datetime64[D]')
                       - DATE0).astype(int) + 14

        monthly_target = target_predict(monthly_idx)
        ret['monthly']['idx'] = monthly_idx
        ret['monthly']['target_phase'] = monthly_target
        if phaseType == 'ratio':
            monthly_base = base_predict(monthly_idx)
            ret['monthly']['ratio'] = get_ratio_without_warning(monthly_target, monthly_base)

        if tc_target_data_freq == 'daily':
            forecast_start_month_start_idx = (forecast_start_month.astype('datetime64[D]') - DATE0).astype(int)
            forecast_end_month_end_idx = ((forecast_end_month + 1).astype('datetime64[D]') - 1 - DATE0).astype(int)
            daily_idx = np.arange(forecast_start_month_start_idx, forecast_end_month_end_idx + 1)
            daily_target = target_predict(daily_idx)
            ret['daily']['idx'] = daily_idx
            ret['daily']['target_phase'] = daily_target
            if phaseType == 'ratio':
                daily_base = base_predict(daily_idx)
                ret['daily']['ratio'] = get_ratio_without_warning(daily_target, daily_base)

    return ret


def get_target_ratio_info(phaseType, tc_target_data_freq, num_month, fpd_month, prod_data, forecast_data, rate_indexes,
                          ratio_indexes):
    monthly_target = np.concatenate([prod_data['monthly']['target_phase'], forecast_data['monthly']['target_phase']])
    if phaseType == 'ratio':
        monthly_ratio = np.concatenate([prod_data['monthly']['ratio'], forecast_data['monthly']['ratio']])
    end_month = fpd_month + num_month - 1
    month_arr = np.arange(fpd_month, end_month + 1)
    days_in_month_arr = ((month_arr + 1).astype('datetime64[D]') - month_arr.astype('datetime64[D]')).astype(int)
    data_month_start_idx = (month_arr.astype('datetime64[D]') - DATE0).astype(int)
    if tc_target_data_freq == 'daily':
        rate_data = np.concatenate([prod_data['daily']['target_phase'], forecast_data['daily']['target_phase']])
        if phaseType == 'rate':
            daily_slice_right = int(rate_indexes['maximum_data']['month'] * 31) + 100 + MAX_DAILY_LIMIT
            target_information = {
                'data': rate_data[:daily_slice_right],
                'monthly_prod': monthly_target,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': rate_indexes
            }
            ratio_information = {}
        else:
            daily_slice_right = MAX_DAILY_LIMIT + 100
            target_information = {
                'data': rate_data[:daily_slice_right],
                'monthly_prod': monthly_target,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': rate_indexes
            }

            ret_ratio_data = np.concatenate([prod_data['daily']['ratio'],
                                             forecast_data['daily']['ratio']])[:daily_slice_right]
            ratio_information = {
                'data': ret_ratio_data,
                'monthly_prod': monthly_ratio,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': ratio_indexes
            }
    else:
        if phaseType == 'rate':
            target_information = {
                'data': None,
                'monthly_prod': monthly_target,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': rate_indexes
            }
            ratio_information = {}
        else:
            target_information = {
                'data': None,
                'monthly_prod': monthly_target,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': rate_indexes
            }
            ratio_information = {
                'data': None,
                'monthly_prod': monthly_ratio,
                'days_in_month_arr': days_in_month_arr,
                'data_month_start_idx': data_month_start_idx,
                'indexes': ratio_indexes
            }
    return target_information, ratio_information
