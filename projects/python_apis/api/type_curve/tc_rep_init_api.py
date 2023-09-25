import json
from flask import Blueprint, request, Response

from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata
from combocurve.services.proximity_forecast.proximity_forecast_service import ProximityForecastService

tc_rep_init_api = Blueprint('tc_rep_init_api', __name__)


@tc_rep_init_api.route('/init-tc-rep', methods=['POST'])
@with_api_context
def run(**kwargs):
    context = kwargs['context']
    req = request.json

    try:
        ret = context.type_curve_service.tc_rep_init(req)
        a = Response(response=json.dumps(ret), status=200, mimetype="application/json")
        return a, 200

    except Exception as e:
        tc_data = {'tc_id': req.get('tc_id'), 'items': req.get('items')}
        add_to_logging_metadata({'type_curve': tc_data})
        raise e


@tc_rep_init_api.route('/init-prox-rep', methods=['POST'])
@with_api_context
def run_prox_rep(**kwargs):
    context = kwargs['context']
    req = request.json

    try:
        proximity_forecast_service: ProximityForecastService = context.proximity_forecast_service
        ret = proximity_forecast_service.proximity_rep_init(req)
        a = Response(response=json.dumps(ret), status=200, mimetype="application/json")
        return a, 200

    except Exception as e:
        tc_data = {'tc_id': req.get('tc_id'), 'items': req.get('items')}
        add_to_logging_metadata({'type_curve': tc_data})
        raise e
