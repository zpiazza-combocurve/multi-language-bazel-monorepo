from flask import request, Blueprint

from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata

mass_adjust_terminal_decline_api = Blueprint('mass_adjust_terminal_decline_api', __name__)


@mass_adjust_terminal_decline_api.route('/forecast/mass-adjust-terminal-decline', methods=['POST'])
@complete_routing
@with_api_context
def forecast(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        context.mass_adjust_terminal_decline_service.adjust(params)
        return 'success'
    except Exception as e:
        add_to_logging_metadata({'mass_adjust_terminal_decline': params})
        raise e
