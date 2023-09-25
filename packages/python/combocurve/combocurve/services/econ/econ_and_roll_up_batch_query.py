import datetime
from copy import deepcopy
import numpy as np
import pandas as pd
import logging
from bson import ObjectId

from combocurve.science.econ.general_functions import has_phase_forecast, create_empty_forecast, validate_forecast_data
from combocurve.science.econ.helpers import BASE_DATE_NP
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.science.econ.general_functions import py_date_to_index
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES
from combocurve.dal.stubs import DailyProduction, MonthlyProduction, production_from_response
from combocurve.dal.client import DAL
from typing import Union

DEFAULT_P_SERIES = 'P50'
DEFAULT_DATE = '1900-01-01'
DEFAULT_ASSUMPTION = {
    'dates': {
        'dates_setting': {
            'max_well_life': None,
            'as_of_date': {
                'date': DEFAULT_DATE
            },
            'discount_date': {
                'date': DEFAULT_DATE
            }
        }
    }
}


def get_p_series(assignment):
    return assignment['forecast_p_series'] if assignment.get('forecast_p_series') else DEFAULT_P_SERIES


def _get_phase_freq_econ(sort_well_ids, sort_forecasts, phases, well_data_freq):
    daily_batch = []
    month_batch = []
    sort_phase_freq = []
    if well_data_freq is None:
        well_data_freq = ['same_as_forecast'] * len(sort_well_ids)

    for i in range(len(sort_well_ids)):
        this_phase_freq = {}

        if well_data_freq[i] == 'daily':
            for phase in phases:
                this_phase_freq[phase] = 'daily'
            daily_batch.append(sort_well_ids[i])

        elif well_data_freq[i] == 'monthly':
            for phase in phases:
                this_phase_freq[phase] = 'monthly'
            month_batch.append(sort_well_ids[i])

        elif well_data_freq[i] == 'same_as_forecast':
            this_forecast = sort_forecasts[i]
            daily_bool = False
            month_bool = False

            for phase in phases:
                if has_phase_forecast(this_forecast, phase):
                    this_phase_freq[phase] = this_forecast[phase]['data_freq'] if 'data_freq' in this_forecast[
                        phase].keys() else 'monthly'
                    if this_phase_freq[phase] == 'monthly':
                        month_bool = True
                    elif this_phase_freq[phase] == 'daily':
                        daily_bool = True
                else:
                    this_phase_freq[phase] = 'monthly'
                    month_bool = True

            if (daily_bool):
                daily_batch.append(sort_well_ids[i])
            if (month_bool):
                month_batch.append(sort_well_ids[i])

        sort_phase_freq.append(this_phase_freq)

    return sort_phase_freq, daily_batch, month_batch


def _batch_get_production(context, sort_well_ids, sort_forecasts, phases, well_data_freq=None):
    sort_phase_freq, daily_batch, month_batch = _get_phase_freq_econ(sort_well_ids, sort_forecasts, phases,
                                                                     well_data_freq)
    dal: DAL = context.dal
    daily_production_dict = get_production_data_from_dal(
        production_service_stub=dal.daily_production,
        well_ids=daily_batch,
        phases=phases,
    )
    monthly_production_dict = get_production_data_from_dal(
        production_service_stub=dal.monthly_production,
        well_ids=month_batch,
        phases=phases,
    )

    monthly_daily_dict = {'daily': daily_production_dict, 'monthly': monthly_production_dict}

    has_daily_monthly = {'daily': list(daily_production_dict.keys()), 'monthly': list(monthly_production_dict.keys())}
    output = []
    for i, freq in enumerate(sort_phase_freq):
        this_well_id = sort_well_ids[i]

        this_well_prod = {}
        for phase in freq:
            phase_freq = freq[phase]
            if this_well_id in has_daily_monthly[phase_freq]:

                flat_index_w_none = np.array(
                    monthly_daily_dict[phase_freq][this_well_id]['index']).reshape(-1).astype(int)
                flat_value_w_none = np.array(monthly_daily_dict[phase_freq][this_well_id][phase]).reshape(-1)

                filter_index = flat_index_w_none != None  # noqa: E711

                flat_index = flat_index_w_none[filter_index].tolist()

                if len(flat_index) == 0:
                    this_well_prod[phase] = None
                    continue

                flat_value = flat_value_w_none[filter_index].tolist()

                # fill in missing dates with 0 production
                if phase_freq == 'daily':
                    all_index = np.arange(flat_index[0], flat_index[-1] + 1)
                    all_value = np.zeros(len(all_index))
                    mask = flat_index - np.int64(flat_index[0])
                    all_value[mask] = flat_value
                    flat_value = list(all_value)
                    flat_index = list(all_index)
                else:
                    start_month = (np.datetime64('1900-01-01') + flat_index[0]).astype('datetime64[M]')
                    end_month = (np.datetime64('1900-01-01') + flat_index[-1]).astype('datetime64[M]')
                    monthly_dates = np.arange(start_month, end_month + 1).astype(datetime.datetime)
                    # set day in month to 15th
                    monthly_dates = list(map(lambda date: date.replace(day=15), monthly_dates))
                    month_index = list(map(py_date_to_index, monthly_dates))
                    flat_index = set(flat_index)
                    flat_value = [flat_value.pop(0) if index in flat_index else 0 for index in month_index]
                    flat_value = [value if value is not None else 0 for value in flat_value]
                    flat_index = list(month_index)

                this_well_prod[phase] = {'index': flat_index, 'value': flat_value, 'data_freq': phase_freq}
            else:
                this_well_prod[phase] = None

        output.append(this_well_prod)

    return output


def _batch_get_forecast_data(context, batch_assignment_df):
    project_dict = {
        '_id': 0,
        'well': 1,
        'phase': 1,
        'P_dict': 1,
        'forecast': 1,
        'forecasted': 1,
        'data_freq': 1,
        'ratio': 1,
        'forecastType': 1,
        'forecastSubType': 1,
        'typeCurve': 1,
    }
    # need well + forecast to query forecast data document
    forecast_well_combination = batch_assignment_df[['well', 'forecast']].to_dict('records')
    forecast_well_combination = [cb for cb in forecast_well_combination if type(cb['forecast']) != dict]

    forecast_id_list = [cb['forecast'] for cb in forecast_well_combination if type(cb['forecast']) != dict]
    unique_forecast_list = list(
        context.forecasts_collection.find({'_id': {
            '$in': forecast_id_list
        }}, {
            'type': 1,
            'name': 1
        }))

    if len(unique_forecast_list) == 0:
        return [], {}

    forecast_dict = {f['_id']: f for f in unique_forecast_list}
    dete_forecast_well_combination = []
    prob_forecast_well_combination = []

    for cb in forecast_well_combination:
        if cb['forecast'] == 'not_valid' or cb['forecast'] not in forecast_dict:
            continue
        parent_type = forecast_dict[cb['forecast']]['type']
        if parent_type == 'deterministic':
            dete_forecast_well_combination.append(cb)
        else:
            prob_forecast_well_combination.append(cb)

    if dete_forecast_well_combination:
        dete_forecast_data_list = list(
            context.deterministic_forecast_datas_collection.find({'$or': dete_forecast_well_combination}, project_dict))
    else:
        dete_forecast_data_list = []

    if prob_forecast_well_combination:
        prob_forecast_data_list = list(
            context.forecast_datas_collection.find({'$or': prob_forecast_well_combination}, project_dict))
    else:
        prob_forecast_data_list = []

    forecast_data_list = dete_forecast_data_list + prob_forecast_data_list

    return forecast_data_list, forecast_dict


def get_tc_lookup_forecast_data(context, assignment_df, project_headers_data=None):
    forecast_well_combination = assignment_df[['well', 'forecast', 'forecast_p_series']].to_dict('records')
    well_lookup_pairs = [cb for cb in forecast_well_combination if type(cb['forecast']) == dict]

    if len(well_lookup_pairs) == 0:
        return [], {}

    tc_lookup_to_wells = {}  # dict of sets
    for lookup in well_lookup_pairs:
        well_id = lookup['well']
        lookup_id = lookup['forecast']['tcLookup']
        p_series = lookup['forecast_p_series']

        if lookup_id not in tc_lookup_to_wells:
            tc_lookup_to_wells[lookup_id] = {}

        if p_series in tc_lookup_to_wells[lookup_id]:
            tc_lookup_to_wells[lookup_id][p_series].add(well_id)
        else:
            tc_lookup_to_wells[lookup_id][p_series] = {well_id}

    tc_lookup_forecast_datas = []
    tc_ids = set()
    well_lookup_to_tc = {}
    well_lookup_to_tc_setting = {}
    # evaluate lookup table by lookup_id
    for lookup_id, series_dict in tc_lookup_to_wells.items():
        for p, wells in series_dict.items():

            apply_params = {
                'apply_normalization': False,
                'data_freq': 'monthly',
                'forecast_id': ObjectId(),
                'fpd_source': 'fixed',
                'lookup_table_id_str': str(lookup_id),
                'phase': 'all',
                'scheduling_id': None,
                'series': p,
                'well_ids': list(wells),
                'risk_factor': {
                    'oil': 1,
                    'gas': 1,
                    'water': 1,
                },
                'fixed_date':  # .item() convert np int to python int
                (np.datetime64(datetime.datetime.now()).astype('datetime64[D]') - BASE_DATE_NP).astype(int).item(),
            }

            # update_list is a list of mongo db operation, econ will always generate result as deterministic forecast
            update_list, _ = context.type_curve_apply_service._apply_tc_using_lookup_table(
                apply_params,
                project_headers_data,
                econ=True,
                update_eur=False,
            )

            # construct forecast data from update_list
            for update in update_list:
                data = update._doc['$set']
                well_and_phase = update._filter
                tc_apply_settings = data['typeCurveApplySetting']

                forecast_type = data.get('forecastType')
                if forecast_type is None:
                    continue
                tc_id = data['typeCurve']
                tc_ids.add(tc_id)

                forecast_data = {
                    'well_id': well_and_phase['well'],
                    'phase': well_and_phase['phase'],
                    'tc_lookup_id': lookup_id,
                    'forecastType': forecast_type,
                    'forecast_p_series': p,
                    'typeCurve': tc_id,
                    'forecastSubType': 'typecurve'
                }
                if forecast_type == 'ratio':
                    forecast_data[forecast_type] = {
                        'segments': data['ratio.segments'],
                        'basePhase': data['ratio.basePhase']
                    }
                else:
                    forecast_data['P_dict'] = {'best': {'segments': data['P_dict.best.segments']}}

                if not (forecast_data['well_id'], lookup_id) in well_lookup_to_tc_setting:
                    # initialize dic to save apply tc settings
                    well_lookup_to_tc_setting[(forecast_data['well_id'], lookup_id)] = {
                        'oil_tc_risking': 1,
                        'gas_tc_risking': 1,
                        'water_tc_risking': 1,
                        'apply_normalization': False,
                    }

                # save tc lookup riskFactor and applyNormalization settings
                phase = well_and_phase['phase']
                well_lookup_to_tc_setting[(forecast_data['well_id'],
                                           lookup_id)][phase + '_tc_risking'] = tc_apply_settings['riskFactor']
                # applyNormalization is the same for all phases
                well_lookup_to_tc_setting[(forecast_data['well_id'],
                                           lookup_id)]['apply_normalization'] = tc_apply_settings['applyNormalization']

                well_lookup_to_tc[(forecast_data['well_id'], lookup_id)] = tc_id
                tc_lookup_forecast_datas.append(forecast_data)

    type_curves = context.type_curves_collection.find({'_id': {'$in': list(tc_ids)}}, {'name': 1})
    tc_id_to_name = {i['_id']: i['name'] for i in type_curves}
    for key in well_lookup_to_tc.keys():
        well_lookup_to_tc[key] = {'tc_name': tc_id_to_name.get(well_lookup_to_tc[key])}
        well_lookup_to_tc[key].update(well_lookup_to_tc_setting[key])
    return tc_lookup_forecast_datas, well_lookup_to_tc


def _get_sort_forecasts(context, assignment_df, sort_well_forecast_pair, project_headers_data=None):
    if 'forecast' not in list(assignment_df):
        return [create_empty_forecast()] * len(sort_well_forecast_pair)

    forecast_dict = {}
    forecast_data, forecast_dict = _batch_get_forecast_data(context, assignment_df)

    tc_lookup_forecast_data, well_lookup_to_tc = get_tc_lookup_forecast_data(context, assignment_df,
                                                                             project_headers_data)
    forecast_dict.update(well_lookup_to_tc)

    if len(forecast_data) == 0 and len(tc_lookup_forecast_data) == 0:
        return [create_empty_forecast()] * len(sort_well_forecast_pair), {}

    forecast_data_array = np.array(forecast_data)
    well_id_array = np.array([d['well'] for d in forecast_data])
    forecast_id_array = np.array([d['forecast'] for d in forecast_data])

    sort_forecasts = []
    for pair in sort_well_forecast_pair:
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

    return sort_forecasts, forecast_dict


def _get_well_dates_freq(sort_econ_function, assumption_selection_idx):
    well_dates_freq = []
    for i in range(len(assumption_selection_idx)):
        ass_index = assumption_selection_idx.dates[i]
        if ass_index == -1:
            this_dates_freq = EconModelDefaults.production_data_resolution
        else:
            this_dates_freq = sort_econ_function[ass_index].get('dates_setting',
                                                                {}).get('production_data_resolution',
                                                                        EconModelDefaults.production_data_resolution)
        well_dates_freq.append(this_dates_freq)
    return well_dates_freq


def ghg_aggregation(ghg_df):
    dates = pd.date_range(min(ghg_df['date']), max(ghg_df['date']), freq='MS')
    dates_str = dates.strftime("%Y-%b").tolist()
    date_index = {dates_str[i]: i for i in range(len(dates))}

    bq_to_econ_mapping = {'co2': 'CO2', 'ch4': 'C1', 'n2o': 'N2O', 'co2e': 'CO2e'}

    ghg_production = {
        'dates': dates.to_numpy().astype('datetime64[M]'),
        'co2': np.zeros(len(dates)),
        'ch4': np.zeros(len(dates)),
        'n2o': np.zeros(len(dates)),
        'co2e': np.zeros(len(dates)),
    }

    ghg_df['date'] = ghg_df['date'].apply(lambda x: x.strftime("%Y-%b"))
    ghg_df['value'] = ghg_df['value'].apply(float)

    ghg_df_group_by_product = ghg_df.groupby('product')
    comp_values = ghg_df_group_by_product['value'].apply(list).to_dict()
    comp_dates = ghg_df_group_by_product['date'].apply(list).to_dict()

    for comp in ghg_production:
        if comp == 'dates' or bq_to_econ_mapping[comp] not in comp_values:
            # ghg product may be missing
            continue

        this_values = np.array(comp_values[bq_to_econ_mapping[comp]])
        this_indices = np.array([date_index[date] for date in comp_dates[bq_to_econ_mapping[comp]]])
        for (index, value) in zip(this_indices, this_values):
            ghg_production[comp][index] = ghg_production[comp][index] + value

    ghg_production['co2e'] = ghg_production['co2e'] + ghg_production[
        'co2'] + ghg_production['ch4'] * 25 + ghg_production['n2o'] * 298

    return ghg_production


def econ_batch_input(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id=None):
    # this assignments here should be already sorted by well id
    assignments, project_headers_data = context.scenario_well_assignments_service.get_assignments_with_combos(
        assignment_ids,
        project_id,
        assumption_keys,
        combos,
    )

    general_options = context.scenario_page_query_service.get_general_options(scenario_id, assignment_ids)

    assignment_df = pd.DataFrame(assignments).fillna('not_valid')

    need_schedule = True if 'schedule' in assumption_keys else False

    headers = ['well', 'well_header_info', 'incremental_index', 'forecast', 'forecast_p_series', 'combo_name']
    if need_schedule:
        sort_well_combo_pair = assignment_df[headers + ['schedule']].to_dict('records')
    else:
        sort_well_combo_pair = assignment_df[headers].to_dict('records')

    ## assumptions
    sort_econ_function, assumption_selection_idx = context.scenario_page_query_service.get_sort_econ_function(
        assignment_df, assumption_keys)

    ## forecast
    sort_forecasts, forecast_dict = _get_sort_forecasts(context, assignment_df, sort_well_combo_pair,
                                                        project_headers_data)

    ## production
    sort_well_ids = [i['well'] for i in sort_well_combo_pair]
    well_dates_freq = _get_well_dates_freq(sort_econ_function, assumption_selection_idx)
    grouped_data = _batch_get_production(context, sort_well_ids, sort_forecasts, ALL_PHASES, well_dates_freq)

    ## schedule
    if need_schedule:
        sort_schedules = context.scenario_page_query_service.get_sort_schedules(assignment_df, sort_well_combo_pair)

    networks = context.scenario_page_query_service.get_networks(assignment_df)

    batch_input = []

    if ghg_id:
        ghg_run = context.ghg_runs_collection.find_one({'_id': ObjectId(ghg_id)}, {'createdAt': 1})
        run_at = str(ghg_run['createdAt'].date())

        ghg_columns = 'combo_name, well_id, incremental_index, product, date, value, unit'
        ghg_dataset = context.carbon_service._get_report_table_path()
        # tuple has ,) when only has 1 element
        batch_wells = str(tuple(str(well) for well in sort_well_ids)).replace(',)', ')')

        # the streams needed from ghg all have product_type = 'ghg'
        ghg_production_df = context.big_query_client.get_query_df(
            f"SELECT {ghg_columns} FROM {ghg_dataset} WHERE run_id = '{ghg_id}' AND DATE(run_at) = '{run_at}' AND well_id in {batch_wells} AND product_type = 'ghg'"  # noqa: E501
        )
    else:
        ghg_production_df = pd.DataFrame

    for i in range(len(sort_well_combo_pair)):
        # global headers + project custom headers
        well_header_info = {
            **sort_well_combo_pair[i]['well_header_info'],
            **project_headers_data.get(sort_well_combo_pair[i]['well'], {})
        }

        incremental_index = sort_well_combo_pair[i]['incremental_index']
        combo_name = sort_well_combo_pair[i]['combo_name']
        forecast_id = sort_well_combo_pair[i]['forecast']
        oil_tc_risking = None
        gas_tc_risking = None
        water_tc_risking = None
        apply_normalization = None
        forecast_name = None
        if type(forecast_id) != dict:
            forecast_name = (forecast_dict.get(forecast_id, {})).get('name')
        else:
            well_tc_info = forecast_dict.get((sort_well_combo_pair[i]['well'], forecast_id['tcLookup']), {})
            forecast_name = well_tc_info.get('tc_name')
            oil_tc_risking = well_tc_info.get('oil_tc_risking')
            gas_tc_risking = well_tc_info.get('gas_tc_risking')
            water_tc_risking = well_tc_info.get('water_tc_risking')
            apply_normalization = well_tc_info.get('apply_normalization')
        if general_options is not None:
            ass = {'general_options': general_options}
        else:
            ass = {}
        for name in assumption_selection_idx.columns:
            idx = assumption_selection_idx[name].iloc[i]
            if idx >= 0:
                ass[name] = deepcopy(sort_econ_function[idx])

        if ghg_production_df.empty:
            ghg_production = None
        else:
            # need to wrap the 2 column filters with () in order to use &
            # TODO: incremental_index usage in carbon might be off
            cur_ghg_df = ghg_production_df[(ghg_production_df['well_id'] == str(well_header_info['_id']))
                                           & (ghg_production_df['combo_name'] == combo_name) &
                                           (ghg_production_df['incremental_index'] == incremental_index)]
            if cur_ghg_df.empty:
                ghg_production = None
            else:
                ghg_production = ghg_aggregation(cur_ghg_df)

        p_series = get_p_series(assignments[i])
        network_key = (str(well_header_info['_id']), incremental_index, combo_name)
        one_input = {
            'assignment_id': assignment_df['assignment_id'].iloc[i],
            'production_data': grouped_data[i],
            'forecast_data': sort_forecasts[i],
            'p_series': p_series,
            'well': well_header_info,
            'incremental_index': incremental_index,
            'combo_name': combo_name,
            'assumptions': ass,
            'forecast_name': forecast_name,
            'oil_tc_risking': oil_tc_risking,
            'gas_tc_risking': gas_tc_risking,
            'water_tc_risking': water_tc_risking,
            'apply_normalization': apply_normalization,
            'network': networks.get(network_key),
            'ghg': ghg_production
        }

        if need_schedule:
            one_input['schedule'] = sort_schedules[i]

        batch_input.append(one_input)

    context.embedded_lookup_table_service.fill_in_embedded_lookup(batch_input)

    context.scenario_page_query_service.fill_in_elu_escalation_and_depreciation(batch_input)

    return batch_input


def roll_up_batch_input(context, scenario_id, assignment_ids, assumption_keys):
    # this assignments here should be already sorted by well id
    assignments = context.scenario_well_assignments_service.get_assignments(scenario_id, assignment_ids,
                                                                            assumption_keys, True)

    general_options = context.scenario_page_query_service.get_general_options(scenario_id)

    assignment_df = pd.DataFrame(assignments).fillna('not_valid')

    need_schedule = True if 'schedule' in assumption_keys else False

    pair_cols = ['well', 'forecast', 'forecast_p_series']
    if need_schedule:
        pair_cols += ['schedule']

    sort_well_forecast_pair = assignment_df[pair_cols].to_dict('records')

    ## assumptions
    sort_econ_function, assumption_selection_idx = context.scenario_page_query_service.get_sort_econ_function(
        assignment_df, assumption_keys)

    ## forecast
    sort_forecasts, _ = _get_sort_forecasts(context, assignment_df, sort_well_forecast_pair)

    ## production
    grouped_data = _batch_get_production(context, [i['well'] for i in sort_well_forecast_pair], sort_forecasts,
                                         ALL_PHASES)

    ## schedule
    if need_schedule:
        sort_schedules = context.scenario_page_query_service.get_sort_schedules(assignment_df, sort_well_forecast_pair)

    batch_input = []

    for i in range(len(sort_well_forecast_pair)):
        assignment = assignments[i]
        well_header_info = assignment['well_header_info']
        incremental_index = assignment['incremental_index']

        if general_options is not None:
            ass = {'general_options': general_options}
        else:
            ass = DEFAULT_ASSUMPTION

        for name in assumption_selection_idx.columns:
            idx = assumption_selection_idx[name].iloc[i]
            if idx >= 0:
                ass[name] = deepcopy(sort_econ_function[idx])

        p_series = get_p_series(assignments[i])

        one_input = {
            'production_data': grouped_data[i],
            'forecast_data': sort_forecasts[i],
            'p_series': p_series,
            'well': well_header_info,
            'incremental_index': incremental_index,
            'assumptions': ass
        }

        if need_schedule:
            one_input['schedule'] = sort_schedules[i]

        batch_input.append(one_input)

    return batch_input


def get_production_data_from_dal(
    production_service_stub: Union[DailyProduction, MonthlyProduction],
    well_ids: list,
    phases: list,
) -> dict:
    '''
    The fetch response is an itrable of production data that is sorted by well, date. Therefore, we only need to iterate
    through the response once to construct the by well production dictionary.
    '''
    production_dict = {}
    if not well_ids:
        return production_dict

    fetch_response = production_service_stub.fetch_by_well(wells=[str(well_id) for well_id in well_ids])

    try:
        for well_response in fetch_response:
            well_id = ObjectId(getattr(well_response, 'well'))
            production_dict[well_id] = production_from_response(well_response, field_list=phases)

    except Exception:
        fetch_response.details()
        logging.warning(str(fetch_response))

    return production_dict
