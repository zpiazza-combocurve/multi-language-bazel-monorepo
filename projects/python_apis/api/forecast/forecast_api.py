from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

forecast_api = Blueprint('forecast_api', __name__)


@forecast_api.route('/forecast/calc-eur', methods=['POST'])
@complete_routing
@with_api_context
def calc_eur(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        forecast = params.get("forecast")
        well = params.get("well")
        phase = params.get("phase")
        is_deterministic = params.get("is_deterministic")
        segments = params.get("segments")
        return context.forecast_service.generate_eur(forecast, well, phase, is_deterministic, segments)
    except Exception as e:
        add_to_logging_metadata({'auto_forecast': params})
        raise e


@forecast_api.route('/forecast', methods=['POST'])
@complete_routing
@with_api_context
def forecast(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        fType = params.get('fType')
        if fType == 'probabilistic':
            return context.forecast_service.forecast(params)
        elif fType == 'deterministic':
            return context.deterministic_forecast_service.forecast(params)
        else:
            raise Exception('Invalid Forecast Type')
    except Exception as e:
        add_to_logging_metadata({'auto_forecast': params})
        raise e
