import logging
from threading import Thread

from flask import Blueprint, request

from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import (DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED,
                                        TASK_STATUS_RUNNING)
from combocurve.utils.routes import complete_routing
from api.decorators import with_context
from combocurve.shared.econ_report.econ_report import (
    AGGREGATE,
    build_econ_report,
    build_single_well_econ_report,
    build_tc_econ_report,
)
from combocurve.shared.helpers import jsonify

economics = Blueprint('economics', __name__)


@economics.route('/gen-econ-report', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def gen_econ_report(context):

    # redirect this to cloud run

    req = request.json

    user_id = req['userId']
    econ_run_id = req['econRun']
    report_type = AGGREGATE if req['reportType'] == 'reservesGroup' else 'by_well'
    file_name = req.get('fileName', 'Economics Report')
    notification_id = req.get('notificationId')
    bfit_report = req.get('bfitReport')
    afit_report = req.get('afitReport')
    time_zone = req.get('timeZone')

    def econ_report(context, user_id, econ_run_id, file_name, report_type, notification_id, bfit_report, afit_report,
                    time_zone):
        try:
            context.notification_service.update_notification_with_notifying_target(
                notification_id, {
                    'status': TASK_STATUS_RUNNING,
                    'description': 'Generating Aggregation yearly PDF report...'
                })

            file_info = build_econ_report(context, econ_run_id, report_type, user_id, file_name, notification_id,
                                          bfit_report, afit_report, time_zone)

            context.notification_service.update_notification_with_notifying_target(
                notification_id, {
                    'status': TASK_STATUS_COMPLETED,
                    'description': 'Aggregation yearly PDF report successfully generated',
                    'extra.output': {
                        'file': file_info,
                        'runId': econ_run_id
                    }
                })
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error('Generate Aggregate PDF file failed', extra={'metadata': error_info})
            user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
            context.notification_service.update_notification_with_notifying_target(notification_id, {
                'status': TASK_STATUS_FAILED,
                'description': user_error,
                'extra.error': user_error
            })

    thread_input = {
        'context': context,
        'user_id': user_id,
        'econ_run_id': econ_run_id,
        'report_type': report_type,
        'file_name': file_name,
        'notification_id': notification_id,
        'bfit_report': bfit_report,
        'afit_report': afit_report,
        'time_zone': time_zone
    }

    thread = Thread(target=econ_report, kwargs=(thread_input))
    thread.start()

    return 'started'


@economics.route('/gen-single-well-econ-report', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def gen_single_well_econ_report(context):
    req = request.json

    user_id = req['userId']
    well_id = req['wellId']
    scenario_id = req['scenarioId']
    project_id = req['projectId']
    monthly = req['monthly']
    one_liner = req['oneLiner']
    file_name = req.get('fileName', 'Economics Report')
    time_zone = req.get('timeZone')
    general_options_id = req.get('generalOptions')

    try:
        file_info = build_single_well_econ_report(context, monthly, one_liner, user_id, well_id, scenario_id,
                                                  project_id, file_name, time_zone, general_options_id)
    except Exception as e:
        error_info = get_exception_info(e)
        logging.error('Generate single well econ PDF report failed', extra={'metadata': {'error': error_info}})
        file_info = {'error': error_info}

    return file_info


@economics.route('/gen-tc-econ-report', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def gen_tc_econ_report(context):
    req = request.json

    user_id = req['userId']
    monthly = req['monthly']
    one_liner = req['oneLiner']
    type_curve_id = req['typeCurveId']
    file_name = req.get('fileName', 'Economics Report')
    time_zone = req.get('timeZone')

    try:
        file_info = build_tc_econ_report(context, monthly, one_liner, type_curve_id, file_name, user_id, time_zone)
    except Exception as e:
        error_info = get_exception_info(e)
        logging.error('Generate TC econ PDF file failed', extra={'metadata': error_info})
        file_info = {'error': error_info}

    return file_info
