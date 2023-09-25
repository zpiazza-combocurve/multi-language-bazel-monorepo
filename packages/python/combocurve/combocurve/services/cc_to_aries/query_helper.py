from bson import ObjectId
from dateutil.relativedelta import relativedelta
import numpy as np
import pandas as pd
from copy import deepcopy
import datetime

from combocurve.services.cc_to_aries.general_functions import (get_py_date, has_forecast, has_phase_production,
                                                               index_to_py_date)

from combocurve.services.econ.econ_and_roll_up_batch_query import (
    _batch_get_forecast_data,
    get_tc_lookup_forecast_data,
    _get_phase_freq_econ,
)
from combocurve.science.econ.general_functions import validate_forecast_data
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES

from combocurve.dal.client import DAL
from combocurve.dal.stubs import production_from_response

QUERY_DOC_LIMIT = 480000  # daily data: 12 month * 4000 wells

CC_TO_ARIES_WELL_PROJECTION = {
    '_id': 1,
    'well_name': 1,
    'well_number': 1,
    'inptID': 1,
    'aries_id': 1,
    'phdwin_id': 1,
    'chosenID': 1,
    'api10': 1,
    'api12': 1,
    'api14': 1,
    'true_vertical_depth': 1,
    'perf_lateral_length': 1,
    'total_prop_weight': 1,
    'primary_product': 1,
    'first_prod_date': 1,
}


class DateProcessError(Exception):
    expected = True


BASE_DATE_NP = np.datetime64('1900-01-01')

DEFAULT_P_SERIES = {
    'percentile': 'P50',
    'rounding': 'up',
}


class QueryError(Exception):
    expected = True


def create_empty_forecast():
    return {'oil': None, 'gas': None, 'water': None}


def get_monthly_daily_dict(context, sort_well_ids, sort_forecasts, phases, well_data_freq=None, include_production=[]):
    sort_phase_freq, daily_batch, month_batch = _get_phase_freq_econ(sort_well_ids, sort_forecasts, phases,
                                                                     well_data_freq)

    if 'daily' in include_production:
        daily_batch = set(daily_batch + sort_well_ids)

    if 'monthly' in include_production:
        month_batch = set(month_batch + sort_well_ids)

    dal: DAL = context.dal
    daily_production_dict = {}
    monthly_daily_dict = {}
    if len(daily_batch) > 0:
        daily_production_response = dal.daily_production.fetch_by_well(wells=[str(well_id) for well_id in daily_batch])
        daily_production_dict = get_production_data_from_dal_fetch(daily_production_response, phases)
    if len(month_batch) > 0:
        monthly_production_response = dal.monthly_production.fetch_by_well(
            wells=[str(well_id) for well_id in month_batch])
        monthly_production_dict = get_production_data_from_dal_fetch(monthly_production_response, phases)

    daily_prod_count = sum_index_lengths(daily_production_dict)
    if daily_prod_count > QUERY_DOC_LIMIT:
        daily_production_dict = {}
        raise QueryError(
            'Daily Data too large to be loaded, please use Monthly in Data Resolution and unselect Daily in Include Production Data (only for scenario export)'  # noqa E501
        )

    monthly_daily_dict = {'daily': daily_production_dict, 'monthly': monthly_production_dict}

    return sort_phase_freq, monthly_daily_dict


def _batch_get_production(
    context,
    sort_well_forecast_pair,
    sort_forecasts,
    phases,
    data_resolution,
    include_production,
    user_id,
    notification_id,
    progress_range,
):
    sort_well_ids = [i['well'] for i in sort_well_forecast_pair]

    well_data_freq = [data_resolution] * len(sort_well_ids)
    sort_phase_freq, monthly_daily_dict = get_monthly_daily_dict(
        context,
        sort_well_ids,
        sort_forecasts,
        phases,
        well_data_freq,
        include_production,
    )

    context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
        '_id': notification_id,
        'progress': (progress_range[-1] + progress_range[0]) / 2
    })

    output = []
    for i, freq in enumerate(sort_phase_freq):
        this_well_id = sort_well_ids[i]

        this_well_prod = {}
        for phase in freq:
            phase_freq = freq[phase]
            if this_well_id in monthly_daily_dict[phase_freq]:

                flat_index = monthly_daily_dict[phase_freq][this_well_id]['index']

                if len(flat_index) == 0:
                    this_well_prod[phase] = None
                    continue

                flat_value = monthly_daily_dict[phase_freq][this_well_id][phase]

                this_well_prod[phase] = {'index': flat_index, 'value': flat_value, 'data_freq': phase_freq}
            else:
                this_well_prod[phase] = None

        output.append(this_well_prod)

    return output, monthly_daily_dict


def _get_sort_forecasts(context, assignment_df, sort_well_forecast_pair, user_id, notification_id, progress_range):
    if 'forecast' not in list(assignment_df):
        return [create_empty_forecast()] * len(sort_well_forecast_pair)

    forecast_dict = {}
    forecast_data, forecast_dict = _batch_get_forecast_data(context, assignment_df)

    tc_lookup_forecast_data, well_lookup_to_tc = get_tc_lookup_forecast_data(context, assignment_df)
    forecast_dict.update(well_lookup_to_tc)

    if len(forecast_data) == 0 and len(tc_lookup_forecast_data) == 0:
        return [create_empty_forecast()] * len(sort_well_forecast_pair)

    forecast_data_array = np.array(forecast_data)
    well_id_array = np.array([d['well'] for d in forecast_data])
    forecast_id_array = np.array([d['forecast'] for d in forecast_data])

    prog_start = progress_range[0]
    prog_end = progress_range[1]

    sort_forecasts = []
    for i, pair in enumerate(sort_well_forecast_pair):
        well_id = pair['well']
        forecast = pair['forecast']

        if type(forecast) == dict:  # tc lookup
            tc_lookup_id = pair['forecast']['tcLookup']
            forecast_p_series = pair['forecast_p_series']
            this_forecast_list = [
                f for f in tc_lookup_forecast_data if (f['tc_lookup_id'] == tc_lookup_id and f['well_id'] == well_id
                                                       and f['forecast_p_series'] == forecast_p_series)
            ]
        else:
            this_forecast_list = forecast_data_array[(well_id_array == well_id) & (forecast_id_array == forecast)]

        this_forecast = {d['phase']: d for d in this_forecast_list}

        for phase in ALL_PHASES:
            if phase not in this_forecast.keys():
                this_forecast[phase] = None
            elif not validate_forecast_data(this_forecast[phase]):
                this_forecast[phase] = None
        sort_forecasts += [this_forecast]

        if (i + 1) % 50 == 0:
            well_prog = prog_start + round((prog_end - prog_start) * (i + 1) / len(sort_well_forecast_pair))
            context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
                '_id': notification_id,
                'progress': well_prog
            })

    return sort_forecasts


def get_production_data_from_dal_fetch(fetch_by_well_response, phases):
    """
        Retrieve production data from a DAL fetch.

        Args:
            fetch_by_well_response (iterable): An iterable of FetchByWell responses.
            phases (list): A list of strings representing the different production phases to retrieve.

        Returns:
            dict: A dictionary where the keys are well IDs and the values are dictionaries containing production
                  data for each well.
            Each well dictionary contains the following keys:
                - '_id': The well ID.
                - 'index': A list of integers representing the production dates.
                - For each production phase in 'phases', a list of floats representing the production values for that
                  phase.
            The 'index' list and each production phase list are sorted by date in ascending order.
    """
    production_dict = {}
    for well_response in fetch_by_well_response:
        well_id = ObjectId(getattr(well_response, 'well'))
        production_dict[well_id] = production_from_response(well_response, field_list=phases)

    return production_dict


def get_production_pipeline(wells, phases=["oil", "gas", "water"], filter={}):
    match = deepcopy(filter)
    match['well'] = {'$in': list(map(lambda well: ObjectId(well), wells))}
    pipeline = [{'$match': match}]
    project = {'well': 1, 'index': 1, 'startIndex': 1}
    group_phases = {'_id': '$well', 'index': {'$push': '$index'}}
    for phase in phases:
        project[phase] = 1
        group_phases[phase] = {'$push': '$' + phase}
    pipeline.append({'$project': project})
    pipeline.append({'$sort': {'startIndex': 1}})
    pipeline.append({'$group': group_phases})
    pipeline.append({'$sort': {'_id': 1}})
    return pipeline


def sum_index_lengths(d: dict):
    total_length = 0
    for _, entry in d.items():
        total_length += len(entry["index"])
    return total_length


# TODO make these part of code shared by econ and roll up
def cc_aries_batch_input(
    context,
    scenario_id,
    assignment_ids,
    assumption_keys,
    data_resolution,
    include_production,
    user_id,
    notification_id,
    progress_range,
):
    scenario_id = ObjectId(scenario_id)

    assignments = context.scenario_well_assignments_service.get_assignments(scenario_id, assignment_ids,
                                                                            assumption_keys, True)

    general_options = context.scenario_page_query_service.get_general_options(scenario_id)
    if not general_options:
        raise QueryError('Missing General Options')

    assignment_df = pd.DataFrame(assignments).fillna('not_valid')
    df_cols = list(assignment_df)

    need_schedule = True if 'schedule' in assumption_keys else False

    if 'well' not in df_cols:
        raise QueryError('Can not fetch well information')

    pair_cols = ['well']

    if 'forecast' in df_cols:
        pair_cols.append('forecast')
        pair_cols.append('forecast_p_series')

    if need_schedule and 'schedule' in df_cols:
        pair_cols.append('schedule')

    sort_well_forecast_pair = assignment_df[pair_cols].to_dict('record')

    total_progress = progress_range[1] - progress_range[0]

    ## forecast
    fore_prog_range = [progress_range[0], progress_range[0] + total_progress / 3]
    sort_forecasts = _get_sort_forecasts(
        context,
        assignment_df,
        sort_well_forecast_pair,
        user_id,
        notification_id,
        fore_prog_range,
    )

    ## production
    prod_prog_range = [progress_range[0] + total_progress / 3, progress_range[0] + (2 * total_progress) / 3]
    grouped_data, monthly_daily_dict = _batch_get_production(
        context,
        sort_well_forecast_pair,
        sort_forecasts,
        ALL_PHASES,
        data_resolution,
        include_production,
        user_id,
        notification_id,
        prod_prog_range,
    )

    ## assumptions
    pusher_info = {
        'user_id': user_id,
        'notification_id': notification_id,
        'progress_range': [progress_range[0] + (2 * total_progress) / 3, progress_range[1]],
    }
    sort_econ_function, assumption_selection_idx = context.scenario_page_query_service.get_sort_econ_function(
        assignment_df,
        assumption_keys,
        pusher_info,
    )

    ## schedule
    if need_schedule:
        sort_schedules = context.scenario_page_query_service.get_sort_schedules(assignment_df, sort_well_forecast_pair)

    batch_input = []

    for i in range(len(sort_well_forecast_pair)):
        ass = {'general_options': general_options}
        assignment = assignments[i]

        well_header_info = assignment['well_header_info']
        incremental_index = assignment['incremental_index']

        for name in assumption_selection_idx.columns:
            idx = deepcopy(assumption_selection_idx[name].iloc[i])
            if idx >= 0:
                ass[name] = sort_econ_function[idx]

        one_input = {
            'production_data':
            grouped_data[i],
            'forecast_data':
            sort_forecasts[i],
            'p_series':
            (assignment['forecast_p_series'] if assignment['forecast_p_series'] != 'not_valid' else DEFAULT_P_SERIES),
            'well':
            well_header_info,
            'incremental_index':
            incremental_index,
            'assumptions':
            ass,
            'assignment':
            assignment.get('_id')
        }

        if need_schedule:
            one_input['schedule'] = sort_schedules[i]

        batch_input.append(one_input)

    return batch_input, monthly_daily_dict


def index_to_date(index_of_date):
    return datetime.date(1900, 1, 1) + datetime.timedelta(int(index_of_date))


def get_date(date_dict, fpd, fsd):
    if 'date' in date_dict:
        return get_py_date(date_dict['date'])
    if 'fpd' in date_dict:
        return fpd
    if 'maj_seg' in date_dict:
        return fsd


def process_dates_setting(dates_setting, fpd, fsd):
    max_econ_life = dates_setting['max_well_life']
    #
    as_of_date_dict = dates_setting['as_of_date']
    discount_date_dict = dates_setting['discount_date']
    #
    as_of_date = get_date(as_of_date_dict, fpd, fsd)
    discount_date = get_date(discount_date_dict, fpd, fsd)

    return as_of_date, discount_date, max_econ_life


def get_pct_key_by_phase(pct_key, forecast_data):
    # here need to make sure the each phase's pct_key has forecast segment length larger tha 0
    if pct_key not in ['P10', 'P50', 'P90', 'best']:
        raise DateProcessError(f'Invalid P-Series: {pct_key}')

    pct_key_by_phase = {'oil': None, 'gas': None, 'water': None}

    for phase in forecast_data.keys():
        phase_forecast_data = forecast_data.get(phase)

        if phase_forecast_data is None:
            continue

        forecast_type = phase_forecast_data['forecastType']

        if forecast_type == 'ratio':
            pct_key_by_phase[phase] = 'not_needed'
        else:
            phase_p_dict = phase_forecast_data['P_dict']
            phase_p_series_list = phase_p_dict.keys()

            if forecast_type == 'rate':
                if 'best' in phase_p_series_list and has_segments(phase_p_dict['best']):
                    pct_key_by_phase[phase] = 'best'
                else:
                    phase_forecast_data = None
            else:
                # probabilistic forecast
                if pct_key in phase_p_series_list and has_segments(phase_p_dict[pct_key]):
                    pct_key_by_phase[phase] = pct_key
                elif 'best' in phase_p_series_list and has_segments(phase_p_dict['best']):
                    pct_key_by_phase[phase] = 'best'
                elif 'P50' in phase_p_series_list and has_segments(phase_p_dict['P50']):
                    pct_key_by_phase[phase] = 'P50'
                else:
                    phase_forecast_data = None

    return pct_key_by_phase


def has_segments(pct_p_dict):
    return 'segments' in pct_p_dict and bool(pct_p_dict['segments'])


def validate_main_phase(forecast_data, main_phase, phase_pct_key):
    phase_forecast = forecast_data[main_phase]
    if phase_forecast and phase_forecast['forecastType'] != 'ratio' and phase_pct_key in phase_forecast[
            'P_dict'] and has_segments(phase_forecast['P_dict'][phase_pct_key]):
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

    if pct_key_by_phase['oil'] and validate_main_phase(forecast_data, 'oil', pct_key_by_phase['oil']):
        main_phase = 'oil'
    elif pct_key_by_phase['gas'] and validate_main_phase(forecast_data, 'gas', pct_key_by_phase['gas']):
        main_phase = 'gas'

    return main_phase


def update_start_date_production_date(start_date, production_dict, frequency, by_phase):
    start_date_dict = {}
    if by_phase:
        for phase in ['oil', 'gas', 'water']:
            start_date_dict = update_start_dict_with_last_prod_by_phase_freq(start_date, production_dict, phase,
                                                                             frequency)
    else:
        start_date_dict = update_start_date_dict_with_last_prod(start_date, production_dict, frequency)

    return start_date_dict


def update_start_date_dict_with_last_prod(start_date, production_dict, frequency):
    resolution_dict = production_dict.get(f'{frequency}_dict')

    if resolution_dict is not None:
        index_ls = resolution_dict.get('index', [])
        if len(index_ls) > 0:
            last_prod_date = index_to_py_date(index_ls[-1])
            last_prod_date = last_prod_date + relativedelta(months=1)
            last_prod_date = datetime.date(last_prod_date.year, last_prod_date.month, 1)
            last_prod_date = last_prod_date.strftime('%Y-%m-%d')
            return {'oil': last_prod_date, 'gas': last_prod_date, 'water': last_prod_date}

    return {'oil': start_date, 'gas': start_date, 'water': start_date}


def update_start_dict_with_last_prod_by_phase_freq(start_date, production_dict, phase, frequency):
    start_date_dict = {}
    resolution_dict = production_dict.get(f'{frequency}_dict')
    if resolution_dict is not None:
        index_ls = resolution_dict.get('index')
        phase_val_ls = resolution_dict.get(phase)
        last_index = None
        for i in range(len(phase_val_ls) - 1, -1, -1):
            if phase_val_ls[i] is not None:
                last_index = i
                break
        if last_index is not None:
            last_date = index_to_py_date(index_ls[last_index])
            last_date = last_date + relativedelta(months=1)
            last_date = datetime.date(last_date.year, last_date.month, 1)
            last_date = last_date.strftime('%Y-%m-%d')

        else:
            start_date_dict[phase] = start_date
    else:
        start_date_dict[phase] = start_date
    return start_date_dict


def use_last_prod_date_as_forecast_start_date(start_date, production_dict, data_resolution, by_phase=False):
    if data_resolution in ['daily', 'monthly']:
        start_date_dict = update_start_date_production_date(start_date, production_dict, data_resolution, by_phase)
    else:
        phase_freq = production_dict.get('phase_freq')
        if phase_freq is not None:
            if by_phase:
                for phase in ['oil', 'gas', 'water']:
                    frequency = phase_freq.get(phase)
                    start_date_dict = update_start_dict_with_last_prod_by_phase_freq(
                        start_date, production_dict, phase, frequency)
            else:
                set_last_index = False
                for phase in ['oil', 'gas', 'water']:
                    frequency = phase_freq.get(phase)
                    resolution_dict = production_dict.get(f'{frequency}_dict')
                    last_index = 0
                    if resolution_dict is not None:
                        set_last_index = True
                        index_ls = resolution_dict.get('index')
                        last_index = index_ls[-1] if index_ls[-1] > last_index else last_index
                if set_last_index:
                    last_prod_date = index_to_py_date(last_index)
                    last_prod_date = last_prod_date + relativedelta(months=1)
                    last_prod_date = datetime.date(last_prod_date.year, last_prod_date.month, 1)
                    last_prod_date = last_prod_date.strftime('%Y-%m-%d')
                    start_date_dict = {'oil': last_prod_date, 'gas': last_prod_date, 'water': last_prod_date}
                else:
                    start_date_dict = {'oil': start_date, 'gas': start_date, 'water': start_date}

        else:
            return {'oil': start_date, 'gas': start_date, 'water': start_date}
    return start_date_dict


def get_end_of_historic_production(asof_date, phase, production_data):
    '''
    Inputs:
        asof_date (str): ASOF or effective date
        phase (str): User selected major phase
        production_data (dictionary): Production data dictionary containing dates (key: index) and rates (key: value)

    Output:
        eoh_date (str): end of historic production date of main_phase
    '''
    eoh_date = None
    if phase and has_phase_production(production_data, phase):
        phase_prod_dict = production_data.get(phase)
        if phase_prod_dict is not None:
            eoh_date = index_to_py_date(phase_prod_dict['index'][-1])

    if eoh_date is None:
        pd_eoh_date = (pd.to_datetime(asof_date) + pd.DateOffset(days=-1))
        eoh_date = datetime.date(year=pd_eoh_date.year, month=pd_eoh_date.month, day=pd_eoh_date.day)
    return eoh_date


def get_fsg(forecast_data, main_phase, fpd, pct_key_by_phase):
    if has_forecast(forecast_data) and main_phase is not None:
        phase_pct_key = pct_key_by_phase[main_phase]
        fsd = (BASE_DATE_NP
               + int(forecast_data[main_phase]['P_dict'][phase_pct_key]['segments'][0]['start_idx'])).astype(
                   datetime.date)
    else:
        fsd = fpd

    return fsd


def get_forecast_data(context, forecast_id, sort_well_ids):
    forecast = context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)})
    forecast_parent_type = forecast['type']

    filter_dict = {'forecast': ObjectId(forecast_id), 'forecasted': True, 'well': {'$in': sort_well_ids}}

    push_fields = {
        'phase': '$phase',
        'P_dict': '$P_dict',
        'forecasted': '$forecasted',
        'data_freq': '$data_freq',
        'ratio': '$ratio',
        'forecastType': '$forecastType',
    }

    pipeline = [{'$match': filter_dict}, {'$group': {'_id': '$well', 'data': {'$push': push_fields}}}]

    if forecast_parent_type == 'deterministic':
        data_collection = context.deterministic_forecast_datas_collection
    else:
        data_collection = context.forecast_datas_collection

    forecast_datas = list(data_collection.aggregate(pipeline, allowDiskUse=True))
    forecast_id_to_data = {d['_id']: d['data'] for d in forecast_datas}

    sort_forecasts = []
    for well_id in sort_well_ids:
        this_forecast_list = forecast_id_to_data.get(well_id, [])
        this_forecast = {d['phase']: d for d in this_forecast_list}
        for phase in ALL_PHASES:
            if phase not in this_forecast.keys():
                this_forecast[phase] = None
        sort_forecasts += [this_forecast]

    return sort_forecasts
