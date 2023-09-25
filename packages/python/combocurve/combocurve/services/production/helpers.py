from itertools import groupby
from typing import Any, Dict, List, Tuple
from bson.objectid import ObjectId
from copy import deepcopy
import numpy as np


def get_production_pipeline(wells, fields=["oil", "gas", "water"], filter={}, default_array=None):
    match = deepcopy(filter)
    match['well'] = {'$in': list(map(lambda well: ObjectId(well), wells))}
    pipeline = [{'$match': match}]

    project = {'well': 1, 'index': 1, 'startIndex': 1}
    groupFields = {'_id': '$well', 'index': {'$push': '$index'}}
    for field in fields:
        project[field] = 1
        if default_array:
            groupFields[field] = {'$push': {'$ifNull': [f'${field}', default_array]}}
        else:
            groupFields[field] = {'$push': f'${field}'}

    pipeline.append({'$project': project})
    pipeline.append({'$sort': {'startIndex': 1}})
    pipeline.append({'$group': groupFields})
    pipeline.append({'$sort': {'_id': 1}})
    return pipeline


def flatten_production(data, fields=["oil", "gas", "water"]):
    output = {'_id': data['_id']}
    index_w_none = np.array(data['index']).reshape(-1)
    filter_index = index_w_none != None  # noqa: E711

    output['index'] = index_w_none[filter_index].tolist()
    for field in fields:
        flatten_field = np.array(data[field]).reshape(-1)
        if (flatten_field.shape != filter_index.shape):
            output[field] = [None] * np.sum(filter_index)
        else:
            output[field] = flatten_field[filter_index].tolist()

    return output


def group_forecasts_by_well(deterministic_forecast_datas: List[Dict]) -> List[List[Dict]]:
    """
    Return a list of lists, where the internal lists contained the original forecast-datas grouped by well.

    Specifically due to ratio phases, services need to process data in per-well batches. Moreover, due to ratio phases,
    rate phases must be processed first.

    Params:
        deterministic_forecast_datas: List of forecast data objects

    Returns:
        Same forecast data objects, grouped by well.  Within each group, the forecast-datas should
        be sorted so that all rate phases come before ratio phases.
    """
    def sort_rate_ratio(forecast_document):
        forecast_type = forecast_document['forecastType']
        if forecast_type == 'rate':
            return 0
        elif forecast_type == 'ratio':
            return 1
        elif forecast_type == 'not_forecasted':
            return 2
        else:
            raise ValueError('forecastType must be one of "rate", "ratio" or "not_forecasted".')

    def get_well_id(forecast_document):
        return str(forecast_document['well'])

    sorted_by_well = sorted(deterministic_forecast_datas, key=lambda x: (get_well_id(x), sort_rate_ratio(x)))

    well_data_batches = [list(g) for _, g in groupby(sorted_by_well, get_well_id)]
    return well_data_batches


def get_daily_monthly_wells(well_data_batches: List[List[Dict[str, Any]]],
                            phases: List[str]) -> Tuple[List[str], List[str]]:
    """Return ids of wells with at least one daily or monthly phase, respectively.

    Params:
        `well_data_batches`: Forecast-datas objects, grouped by well.

    Returns:
        `daily_wells, monthly_wells`: Lists containing the ids, as strings, of wells. If the well has at least one
            phase that uses daily data, it appears in daily_wells, similar to monthly_wells. Thus, a given well might
            appear in both lists if, e.g., oil is a monthly phase and gas is a daily phase.
    """
    daily_wells = []
    monthly_wells = []
    for well_group in well_data_batches:
        if len(well_group) == 0:
            continue
        is_daily = False
        is_monthly = False
        well_id = str(well_group[0]['well'])
        for phase_data in well_group:
            if phase_data['phase'] not in phases:
                continue
            is_daily = is_daily or phase_data['data_freq'] == 'daily'
            is_monthly = is_monthly or phase_data['data_freq'] == 'monthly'
        if is_daily:
            daily_wells.append(well_id)
        if is_monthly:
            monthly_wells.append(well_id)
    return daily_wells, monthly_wells
