from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

forecast_mass_modify_well_life_api = Blueprint('forecast_mass_modify_well_life_api', __name__)


@forecast_mass_modify_well_life_api.route('/forecast/mass-modify-well-life', methods=['POST'])
@complete_routing
@with_api_context
def forecast(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        context.mass_modify_well_life_service.mass_modify_well_life(params)
        return 'success'
    except Exception as e:
        add_to_logging_metadata({'auto_forecast': params})
        raise e
