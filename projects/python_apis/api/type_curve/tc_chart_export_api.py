from flask import Blueprint, request
from api.decorators import with_api_context
from combocurve.shared.helpers import update_error_description_and_log_error
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.logging import add_to_logging_metadata
from combocurve.utils.routes import complete_routing

tc_chart_export_api = Blueprint('tc_chart_export_api', __name__)


@tc_chart_export_api.route('/tc-chart-export', methods=['POST'])
@complete_routing
@with_api_context
def tc_chart_export(context):
    params = request.json
    add_to_logging_metadata({'tc_chart': params})

    try:
        file_id = context.tc_chart_export_service.export_charts(**params)

        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'TypeCurve chart export failed'
        description = update_error_description_and_log_error(error_info, description)
        add_to_logging_metadata({'typecurve export': params})

        return {'success': False, 'file_id': None, 'error_info': error_info}
