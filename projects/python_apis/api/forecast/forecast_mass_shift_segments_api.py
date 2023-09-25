from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context

forecast_mass_shift_segments_api = Blueprint('forecast_mass_shift_segments_api', __name__)


@forecast_mass_shift_segments_api.route('/forecast/mass-shift-segments', methods=['POST'])
@complete_routing
@with_api_context
def forecast(**kwargs):
    context = kwargs['context']
    params = request.json

    context.mass_shift_segments_service.mass_shift_segments(params)
    return 'success'
