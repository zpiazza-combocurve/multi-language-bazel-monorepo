from flask import Blueprint, request
from api.decorators import with_context
from threading import Thread
from combocurve.shared.helpers import update_error_description_and_log_error
from combocurve.utils.constants import TASK_STATUS_FAILED
from combocurve.utils.exceptions import get_exception_info
from api.forecast_mass_edit.shared import adjust_segments
from combocurve.services.proximity_forecast.proximity_forecast_export import ProximityForecastExportService

forecast_mass_edit = Blueprint('forecast_mass_edit', __name__)


@forecast_mass_edit.route('/forecast-import', methods=['POST'])
@with_context
def forecast_import(context):
    req = request.json
    p_req = {
        'file_id': req['fileId'],
        'forecast_name': req['forecastName'],
        'data_freq': req['dataFreq'],
        'forecast_id': req['forecastId'],
        'user_id': req['userId'],
        'source': req['source'],
        'notification_id': req['notificationId'],
    }

    def forecast_import_thread(p_req):
        notification_id = p_req['notification_id']
        forecast_name = p_req['forecast_name']

        try:
            context.forecast_mass_edit_service.forecast_import_with_check(p_req)
        except Exception as e:
            # Change this internally log the error
            error_info = get_exception_info(e)
            error = f'Failed: {forecast_name}'
            error = update_error_description_and_log_error(error_info, error)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=forecast_import_thread, args=(p_req, ))
    thread.start()

    return 'started'


@forecast_mass_edit.route('/forecast-import-aries', methods=['POST'])
@with_context
def forecast_import_aries(context):
    req = request.json
    p_req = {
        'file_id': req['fileId'],
        'forecast_name': req['forecastName'],
        'data_freq': req['dataFreq'],
        'forecast_id': req['forecastId'],
        'user_id': req['userId'],
        'source': req['source'],
        'notification_id': req['notificationId'],
        'well_identifier': req['well_identifier'],
    }

    def forecast_import_aries_thread(p_req):
        notification_id = p_req['notification_id']
        forecast_name = p_req['forecast_name']

        try:
            context.forecast_import_aries_service.forecast_import_aries(p_req)
        except Exception as e:
            # Change this internally log the error
            error_info = get_exception_info(e)
            error = f'Failed: {forecast_name}'
            error = update_error_description_and_log_error(error_info, error)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=forecast_import_aries_thread, args=(p_req, ))
    thread.start()

    return 'started'


@forecast_mass_edit.route('/forecast-export', methods=['POST'])
@with_context
def forecast_export(context):
    req = request.json
    p_req = {
        'forecasts_wells_map': req.get('forecastsWellsMap'),
        'phase': req.get('phase', ['oil', 'gas', 'water']),
        'series': req.get('series', ['best']),
        'adjust_segment': req.get('adjust_segment', False),
        'start_date': req.get('start_date', {
            'oil': None,
            'gas': None,
            'water': None
        })
    }
    try:
        file_id = context.forecast_export_service.export_forecast_data_params(p_req)
        description = 'Forecast export complete'

        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Forecast export failed'
        description = update_error_description_and_log_error(error_info, description)

        return {'success': False, 'file_id': None, 'error_info': error_info}


@forecast_mass_edit.route('/mosaic-export', methods=['POST'])
@with_context
def mosaic_forecast_export(context):
    req = request.json
    p_req = {
        'phase': req.get('phase', ['oil', 'gas', 'water']),
        'series': req.get('series', ['best']),
        'forecasts_wells_map': req.get('forecastsWellsMap'),
        'entity_name': req.get('entityOption', 'well_name'),
        'user_id': req.get('userId'),
        'forecast_id': req.get('forecast')
    }

    try:
        file_id = context.mosaic_forecast_export_service.mosaic_forecast_data_params(p_req)
        description = 'Forecast export complete'
        return {'success': True, 'file_id': file_id, 'error_info': None}
    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Mosaic Forecast export failed'
        description = update_error_description_and_log_error(error_info, description)
        return {'success': False, 'file_id': None, 'error_info': error_info}


@forecast_mass_edit.route('/forecast-export-external', methods=['POST'])
@with_context
def forecast_export_external():
    req = request.json
    segments_list = req.get('segments'),

    #[[{},{},..], [{},{},..], [{},{},..],...]
    try:
        ret = [adjust_segments(segments) for segments in segments_list]
        description = 'Forecast export complete'
        return {'success': True, 'segments': ret, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Forecast export failed'
        description = update_error_description_and_log_error(error_info, description)

        return {'success': False, 'segments': None, 'error_info': error_info}


@forecast_mass_edit.route('/forecast-single-well-export', methods=['POST'])
@with_context
def forecast_single_well_export(context):
    req = request.json

    try:
        file_id = context.forecast_single_well_export.single_well_export(req)
        description = 'Forecast single well export complete'

        return {'success': True, 'file_id': file_id, 'error_info': None}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Forecast single well export failed'
        description = update_error_description_and_log_error(error_info, description)

        return {'success': False, 'file_id': None, 'error_info': error_info}


## used in forecast grid page for single well proximity forecast export
@forecast_mass_edit.route('/proximity_forecast_export', methods=['POST'])
@with_context
def proximity_forecast_export(context):
    params = request.json

    p_req = {
        'well_id': params['well_id'],
        'forecast_id': params['forecast_id'],
    }

    try:
        proximity_export = ProximityForecastExportService(context, **p_req)
        file_id = proximity_export.proximity_export_pipeline()
        return {'success': True, 'file_id': file_id}

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Proximity forecast export failed'
        description = update_error_description_and_log_error(error_info, description)
        return {'success': False, 'error_message': description}
