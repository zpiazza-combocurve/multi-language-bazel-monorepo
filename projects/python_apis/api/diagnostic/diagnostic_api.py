from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context

diagnostic_api = Blueprint('diagnostic_api', __name__)


@diagnostic_api.route('/diagnostics', methods=['POST'])
@complete_routing
@with_api_context
def diagnostics(**kwargs):
    context = kwargs['context']
    params = request.json
    output = context.diagnostic_service.diagnose(params)
    return output
