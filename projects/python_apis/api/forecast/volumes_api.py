from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context

from combocurve.shared.params import require_params

volumes_api = Blueprint('volumes_api', __name__)


@volumes_api.route('/get_volumes', methods=['POST'])
@complete_routing
@with_api_context
def get_neighbor_wells(**kwargs):
    context = kwargs['context']

    export_service_params = require_params(request.json, ['forecast_id', 'forecast_type', 'wells'])
    settings = request.json.get('settings', {})

    return context.forecast_export_service.export_forecast_to_json(**export_service_params, settings=settings)
