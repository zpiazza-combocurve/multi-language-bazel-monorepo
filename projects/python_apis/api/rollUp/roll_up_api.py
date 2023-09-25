from flask import Blueprint, request
from combocurve.utils.routes import complete_routing
from combocurve.utils.exceptions import get_exception_info
from api.decorators import with_api_context
from combocurve.utils.logging import add_to_logging_metadata
import logging

roll_up_api = Blueprint('rollUp', __name__)


@roll_up_api.route('/rollUp-export', methods=['POST'])
@complete_routing
@with_api_context
def roll_up_export(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        file_id = context.roll_up_export_service.roll_up_export_big_query(params)
        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        logging.error(error_info['message'], extra={'metadata': error_info})
        return {'success': False, 'file_id': None, 'error_info': error_info}


@roll_up_api.route('/rollUp', methods=['POST'])
@complete_routing
@with_api_context
def roll_up_generate(**kwargs):
    context = kwargs['context']
    params = request.json
    params['groups'] = params.get('headers')
    params['is_api'] = True

    rollup_data = {
        'scenario_id': params.get('scenario_id'),
        'forecast_id': params.get('forecast_id'),
        'wells': params.get('well_ids'),
        'assignment_ids': params.get('assignment_ids'),
        'dates': params.get('dates'),
        'headers': params.get('headers')
    }
    try:
        context.roll_up_service.roll_up(params)

        return params['run_id']

    except Exception as e:
        add_to_logging_metadata({'auto_forecast': rollup_data})
        raise e
