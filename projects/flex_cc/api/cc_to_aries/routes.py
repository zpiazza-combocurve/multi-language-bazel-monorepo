import logging
from threading import Thread

from bson import ObjectId
from flask import Blueprint, request

from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_FAILED
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.routes import complete_routing
from combocurve.shared.helpers import get_value, jsonify, update_error_description_and_log_error
from combocurve.services.cc_to_aries.cc_to_aries_service import PROD_ROWS_LIMIT
from api.decorators import with_context
from combocurve.shared.contexts import current_context

cc_to_aries = Blueprint('export', __name__)


@cc_to_aries.route('/export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def export_to_aries(context):
    req = request.json
    p_req = {
        'user_id': get_value(req, 'userId'),
        'notification_id': get_value(req, 'notificationId'),
        'scenario_id': get_value(req, 'scenarioId'),
        'assignment_ids': get_value(req, 'selectedAssignmentIds'),
        'aries_setting': {
            'selected_id_key': get_value(req, 'selectedIdKey'),
            'seg_end': get_value(req, 'endingCondition'),
            'forecast_unit': get_value(req, 'forecastUnit'),
            'forecast_to_life': get_value(req, 'toLife'),
            'data_resolution': get_value(req, 'dataResolution', 'same_as_forecast'),
            'file_format': get_value(req, 'exportFileFormat'),
            'include_zero_forecast': get_value(req, 'includeZeroForecast', False),
            'forecast_history_match': get_value(req, 'forecastHistoryMatch', False),
            'forecast_start_to_latest_prod': get_value(req, 'forecastStartToLatestProd', False),
            'same_as_forecasts_months_number': get_value(req, 'sameAsForecastMonthsNumber', None),
            'include_production': get_value(req, 'includeProduction', []),
            'sidefile': get_value(req, 'sidefile', False),
            'output_cums': get_value(req, 'outputCums', True),
        }
    }

    def export(scenario_id, user_id, notification_id, assignment_ids, aries_setting, cur_context):
        current_context.set(cur_context)
        scenario = context.scenario_service.get_scenario(ObjectId(scenario_id))
        scenario_name = scenario['name']
        try:
            gcp_name, missing_table = context.cc_to_aries_service.export_to_aries(scenario_id, user_id, notification_id,
                                                                                  assignment_ids, aries_setting)

            description = f'Exported "{scenario_name}"'

            if len(missing_table) > 0:
                description += f' {get_missing_table_description(missing_table)}'

            file_format = aries_setting['file_format']

            ext = 'zip' if file_format == 'csv' else 'accdb'

            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'description': description,
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{scenario_name} Aries export.{ext}'
                    }
                }
            }

        except Exception as e:
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {scenario_name}'
            error = update_error_description_and_log_error(error_info, error, extra)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}

        finally:
            context.notification_service.update_notification_with_notifying_target(p_req['notification_id'],
                                                                                   notification_update)

    p_req['cur_context'] = current_context.get()
    thread = Thread(target=export, kwargs=(p_req))
    thread.start()

    return 'started'


@cc_to_aries.route('/forecast-export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def forecast_export(context):
    def xto_log(message):
        if context.tenant_info['subdomain'] != 'xto':
            return
        logging.info(message)

    xto_log('enter route')

    req = request.json
    p_req = {
        'user_id': get_value(req, 'userId'),
        'notification_id': get_value(req, 'notificationId'),
        'forecast_id': get_value(req, 'forecastId'),
        'forecast_name': get_value(req, 'forecastName'),
        'wells': get_value(req, 'wells'),
        'aries_setting': {
            'pct_key': get_value(req, 'pSeries'),
            'start_date': get_value(req, 'startDate'),
            'selected_id_key': get_value(req, 'selectedIdKey'),
            'seg_end': get_value(req, 'endingCondition'),
            'forecast_unit': get_value(req, 'forecastUnit'),
            'forecast_to_life': get_value(req, 'toLife'),
            'data_resolution': get_value(req, 'dataResolution'),
            'include_zero_forecast': get_value(req, 'includeZeroForecast', False),
            'forecast_start_to_latest_prod': get_value(req, 'forecastStartToLatestProd', False),
            'forecast_history_match': get_value(req, 'forecastHistoryMatch', False),
            'output_cums': get_value(req, 'outputCums'),
        }
    }

    def forecast_export(
        notification_id,
        user_id,
        forecast_id,
        forecast_name,
        wells,
        aries_setting,
    ):
        try:
            gcp_name = context.cc_to_aries_service.forecast_export_to_aries(
                forecast_id,
                wells,
                user_id,
                notification_id,
                aries_setting,
                xto_log,
            )

            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Forecast export to Aries complete: {forecast_name}',
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{forecast_name}_Forecast_Aries_Format.zip'
                    }
                }
            }

            xto_log('request succeed')

        except Exception as e:
            error_info = get_exception_info(e)
            error = f'Failed: {forecast_name}'
            error = update_error_description_and_log_error(error_info, error)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}

            gcp_name = None
            xto_log('request failed')

        finally:
            context.notification_service.update_notification_with_notifying_target(p_req['notification_id'],
                                                                                   notification_update)

    xto_log('enter thread')

    pusher_info = {
        'subdomain': context.subdomain,
        'user_id': p_req['user_id'],
        'notification_id': p_req['notification_id'],
    }
    xto_log(f'pusher info: {pusher_info}')

    thread = Thread(target=forecast_export, kwargs=(p_req))
    thread.start()

    return 'start'


@cc_to_aries.route('/forecast-export-rest-api', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def forecast_export_rest_api(context):
    req = request.json

    # required inputs
    forecast_id = req['forecastId']
    wells = req['wells']

    # process the date format to be 'yyyy-mm-dd'
    input_start_date = get_value(req, 'startDate', None)
    if input_start_date:
        input_start_date = input_start_date[:10]

    # other inputs
    aries_setting = {
        'pct_key': get_value(req, 'pSeries', 'best'),
        'start_date': input_start_date,
        'selected_id_key': get_value(req, 'selectedIdKey', 'chosenID'),
        'seg_end': get_value(req, 'endingCondition', 'years'),
        'forecast_unit': get_value(req, 'forecastUnit', 'per_day'),
        'forecast_to_life': get_value(req, 'toLife', 'no'),
        'data_resolution': get_value(req, 'dataResolution', 'same_as_forecast'),
        'include_zero_forecast': get_value(req, 'includeZeroForecast', False),
        'forecast_start_to_latest_prod': get_value(req, 'forecastStartToLatestProd', False),
        'forecast_history_match': get_value(req, 'forecastHistoryMatch', False),
        'output_cums': get_value(req, 'outputCums'),
    }

    result = []
    if (wells):
        result = context.cc_to_aries_service.forecast_export_to_aries_rest_api(
            forecast_id,
            wells,
            aries_setting,
        )

    return result


def get_missing_table_description(missing_tables):
    tables = f'{" and ".join(missing_tables)}'
    return f'({tables} not exported, exceeded size limit of {PROD_ROWS_LIMIT} rows)'
