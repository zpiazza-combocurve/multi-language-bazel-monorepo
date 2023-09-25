from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

forecast_mass_add_last_segment_api = Blueprint('forecast_mass_add_last_segment_api', __name__)


@forecast_mass_add_last_segment_api.route('/forecast/mass-add-last-segment', methods=['POST'])
@complete_routing
@with_api_context
def forecast(**kwargs):
    context = kwargs['context']
    params = request.json

    forecast_data = {
        'forecast_id': params.get('forecast_id'),
        'wells': params.get('wells'),
        'setting': params.get('setting')
    }
    add_to_logging_metadata({'forecast': forecast_data})

    output = context.add_last_segment_service.add_segment(params)
    return output
