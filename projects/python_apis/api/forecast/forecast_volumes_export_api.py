from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.shared.params import require_params

forecast_volumes_export_api = Blueprint('forecast_volumes_export_api', __name__)


@forecast_volumes_export_api.route('/forecast/forecast-volumes-export', methods=['POST'])
@complete_routing
@with_api_context
def forecast_volumes_export(**kwargs):
    context = kwargs['context']

    export_params = require_params(request.json, ['forecast_id', 'forecasts_wells_map', 'forecast_type'])
    settings = request.json.get('settings', {})

    try:
        file_id = context.forecast_export_service.export_volumes_proximity(**export_params, settings=settings)
        return {'success': True, 'file_id': file_id}
    except Exception:
        return {'success': False, 'file_id': None}
