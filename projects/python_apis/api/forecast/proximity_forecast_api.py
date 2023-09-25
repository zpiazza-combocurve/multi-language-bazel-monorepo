from typing import AnyStr, TYPE_CHECKING

from bson import ObjectId
from bson.json_util import dumps
from flask import request, Blueprint
from flask.wrappers import Response

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata
from combocurve.services.proximity_forecast.proximity_forecast_service import ProximityForecastService

proximity_forecast_api = Blueprint('proximity_forecast_api', __name__)

if TYPE_CHECKING:
    from api.context import APIContext


## used in getting the background data
@proximity_forecast_api.route('/get_proximity_well_tc_fit_data', methods=['POST'])
@complete_routing
@with_api_context
def get_proximity_well_tc_fit_data(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        proximity_forecast_service: ProximityForecastService = context.proximity_forecast_service

        # Need to ensure the base phase is unset for 'rate' type segments, otherwise
        #  we can get an error on the TC side.
        if params['phase_type'] == 'rate':
            params['base_phase'] = None

        ret = proximity_forecast_service.prepare_manual_proximity_info(params)
        return ret
    except Exception as e:
        add_to_logging_metadata({'get_proximity_well_tc_fit_data': params})
        raise e


## used in normalization page
@proximity_forecast_api.route('/get_proximity_well_data', methods=['POST'])
@with_api_context
def get_proximity_well_data(**kwargs):
    context = kwargs['context']
    params = request.json

    proximity_forecast_service: ProximityForecastService = context.proximity_forecast_service

    try:
        ret = proximity_forecast_service.proximity_rep_init(params)
        a = Response(response=dumps(ret), status=200, mimetype="application/json")
        return a
    except Exception as e:
        add_to_logging_metadata({'params': params})
        raise e


## used in fit page
@proximity_forecast_api.route('/generate_proximity_fits', methods=['POST'])
@with_api_context
def generate_proximity_fits(**kwargs):
    context = kwargs['context']
    params = request.json

    proximity_service: ProximityForecastService = context.proximity_forecast_service

    try:
        proximity_fits = proximity_service.generate_proximity_fits(params)

        return proximity_fits
    except Exception as e:
        add_to_logging_metadata({'params': params})
        raise e


## used in forecast grid page
@proximity_forecast_api.route('/proximity_pipeline', methods=['POST'])
@with_api_context
def proximity_pipeline(**kwargs):
    context = kwargs['context']
    params = request.json

    proximity_service: ProximityForecastService = context.proximity_forecast_service
    # print(params)

    try:
        proximity_fits = proximity_service.proximity_on_the_grid(params)

        return proximity_fits
    except Exception as e:
        add_to_logging_metadata({'params': params})
        raise e


# Used to generate rawBackgroundData for showing proximity info on grid.
@proximity_forecast_api.route('/generate_background_data', methods=['POST'])
@with_api_context
def generate_background_data(**kwargs):
    context: 'APIContext' = kwargs['context']
    params = request.json

    proximity_service = context.proximity_forecast_service

    try:
        forecast = ObjectId(params['forecast'])
        well = ObjectId(params['well'])
        phases: list[AnyStr] = params['phases']

        result = {}

        for phase in phases:
            proximity_fits, _ = proximity_service.generate_proximity_bg_data(forecast, well, phase)
            result[phase] = proximity_fits

        return result

    except Exception as e:
        add_to_logging_metadata({'params': params})
        raise e


@proximity_forecast_api.route('/warmup_proximity_cache', methods=['POST'])
@with_api_context
def warmup_proximity_cache(**kwargs):
    context: 'APIContext' = kwargs['context']
    params = request.json

    proximity_service = context.proximity_forecast_service

    try:
        redis_key = proximity_service.prepare_cached_candidate_well_data(params)
        return redis_key
    except Exception as e:
        add_to_logging_metadata({'endpoint': 'proximity/warmup_proximity_cache', 'params': params})
        raise e
