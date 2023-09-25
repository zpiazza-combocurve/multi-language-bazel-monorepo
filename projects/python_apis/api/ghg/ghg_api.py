from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

ghg_api = Blueprint('ghg_api', __name__)


@ghg_api.route('/download-ghg', methods=['POST'])
@complete_routing
@with_api_context
def ghg(**kwargs):
    context = kwargs['context']
    params = request.json
    try:
        return context.carbon_service.download_ghg_run_to_csv(params)
    except Exception as e:
        add_to_logging_metadata({'ghg_download': params, 'error': e})
        raise e
