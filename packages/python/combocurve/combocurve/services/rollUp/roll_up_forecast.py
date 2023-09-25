from bson import ObjectId
import numpy as np
from combocurve.science.econ.general_functions import create_empty_forecast
from combocurve.services.econ.econ_and_roll_up_batch_query import _batch_get_production


def _batch_get_wells(db, well_ids):
    return list(db['wells'].find({'_id': {'$in': well_ids}}).sort('_id', 1))


def roll_up_forecast_batch_input(context, params):

    forecast_id = ObjectId(params['forecast_id'])
    p_series = params['p_series']

    well_ids = [ObjectId(id) for id in params['well_ids']]
    well_ids.sort()

    db = context.db
    wells = _batch_get_wells(db, well_ids)
    well_forecasts = _get_well_forecasts(context, forecast_id, well_ids)
    grouped_data = _batch_get_production(context, well_ids, well_forecasts, ['oil', 'gas', 'water'])

    batch_input = []

    for i in range(len(well_ids)):

        one_input = {
            'production_data': grouped_data[i],
            'forecast_data': well_forecasts[i],
            'p_series': p_series,
            'well': wells[i],
            'assumptions': {},
            'schedule': {}
        }

        batch_input.append(one_input)

    return batch_input


def _get_well_forecasts(context, forecast_id, well_ids):

    forecast_data = _batch_get_forecast_data(context, forecast_id, well_ids)

    if len(forecast_data) == 0:
        return [create_empty_forecast()] * len(well_ids)

    forecast_data_array = np.array(forecast_data)
    well_id_array = np.array([d['well'] for d in forecast_data])

    sort_forecasts = []
    for well_id in well_ids:
        this_forecast_list = forecast_data_array[well_id_array == well_id]
        this_forecast = {d['phase']: d for d in this_forecast_list}
        for phase in ['oil', 'gas', 'water']:
            if phase not in this_forecast.keys():
                this_forecast[phase] = None
        sort_forecasts += [this_forecast]
    return sort_forecasts


def _batch_get_forecast_data(context, forecast_id, well_ids):
    project_dict = {
        '_id': 0,
        'well': 1,
        'phase': 1,
        'P_dict': 1,
        'forecast': 1,
        'typeCurve': 1,
        'forecasted': 1,
        'data_freq': 1,
        'ratio': 1,
        'forecastType': 1,
        'forecastSubType': 1,
    }

    unique_forecast_list = list(context.forecasts_collection.find({'_id': forecast_id}, {'type': 1}))

    if len(unique_forecast_list) == 0:
        return []

    forecast_type = unique_forecast_list[0]['type']
    match = {'forecast': ObjectId(forecast_id), 'well': {'$in': well_ids}, 'phase': {'$in': ['oil', 'gas', 'water']}}

    if forecast_type == 'deterministic':
        dete_forecast_data_list = list(context.deterministic_forecast_datas_collection.find(match, project_dict))
        return dete_forecast_data_list
    else:
        prob_forecast_data_list = list(context.forecast_datas_collection.find(match, project_dict))

        return prob_forecast_data_list
