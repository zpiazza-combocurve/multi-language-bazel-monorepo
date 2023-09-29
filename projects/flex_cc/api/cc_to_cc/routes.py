from threading import Thread

from flask import Blueprint, request

from combocurve.utils.constants import DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.routes import complete_routing
from combocurve.shared.econ_tools.econ_to_options import ECON_TO_OPTIONS_DICT
from combocurve.shared.helpers import jsonify, update_error_description_and_log_error
from combocurve.shared.requests import MissingParameterError, extract_parameters
from api.decorators import with_context


class MissingParamsError(Exception):
    expected = True


cc_to_cc = Blueprint('cc_to_cc', __name__)


@cc_to_cc.route('/cc-to-cc-export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def cc_to_cc_export(context):
    req = request.json
    p_req = {
        'assumption_key': req.get('assumptionKey'),
        'assumption_name': req.get('assumptionName'),
        'scenario_id': req.get('scenarioId'),
        'scenario_name': req.get('scenarioName'),
        'table_headers': req.get('tableHeaders'),
        'header_fields': req.get('headFields'),
        'user_id': req.get('userId'),
        'assignment_ids': req.get('selectedAssignmentIds'),
        'include_default': req.get('includeDefault'),
        'notification_id': req.get('notificationId'),
    }

    def export(
        assumption_key,
        assumption_name,
        scenario_id,
        scenario_name,
        table_headers,
        header_fields,
        user_id,
        assignment_ids,
        include_default,
        notification_id,
    ):
        try:
            gcp_name = context.cc_to_cc_service.assumption_export(
                assumption_key,
                scenario_id,
                table_headers,
                header_fields,
                user_id,
                assignment_ids,
                include_default,
                notification_id,
            )

            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'title': f'CC Export to CSV - {scenario_name}',
                'description': f'Export complete: {assumption_name} of {scenario_name}',
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{scenario_name}_{assumption_name}.csv'
                    }
                }
            }

        except Exception as e:
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {assumption_name} of {scenario_name}'
            error = update_error_description_and_log_error(error_info, error, extra)
            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}

        finally:
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=export, kwargs=(p_req))
    thread.start()

    return 'started'


@cc_to_cc.route('/cc-to-cc-multi-export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def cc_to_cc_multi_export(context):
    req = request.json

    try:
        p_req = {
            'scenario_id': req['scenarioId'],
            'scenario_name': req['scenarioName'],
            'table_headers': req['tableHeaders'],
            'header_fields': req.get('headFields'),
            'user_id': req['userId'],
            'columns': req['columns'],
            'assignment_ids': req.get('selectedAssignmentIds'),
            'notification_id': req['notificationId'],
            'file_type': req.get('fileType', 'excel'),
        }
    except Exception:
        raise MissingParamsError('Missing input parameter(s)')

    def export(
        scenario_id,
        scenario_name,
        table_headers,
        header_fields,
        user_id,
        assignment_ids,
        columns,
        file_type,
        notification_id,
    ):
        try:
            gcp_name = context.cc_to_cc_service.assumption_multi_export(
                scenario_id,
                table_headers,
                header_fields,
                columns,
                file_type,
                user_id,
                assignment_ids,
                notification_id,
            )
            ext = 'zip' if '.zip' in gcp_name else 'xlsx'

            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Export complete: "{scenario_name}"',
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{scenario_name}_assumptions.{ext}'
                    }
                }
            }
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

        except Exception as e:
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {scenario_name}'
            error = update_error_description_and_log_error(error_info, error, extra)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=export, kwargs=(p_req))
    thread.start()

    return 'started'


@cc_to_cc.route('/econ-models-export', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def econ_models_export(context):
    req = request.json
    [
        assumptions,
        user_id,
        project_id,
    ] = extract_parameters(req, ['assumptions', 'userId', 'projectId'], required=True)

    try:
        file_id = context.cc_to_cc_service.econ_models_export(assumptions, user_id, project_id)
        description = 'Econ models export complete'

        return {
            'success': True,
            'file_id': file_id,
            'message': description,
            'error_info': None,
        }

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Econ models export failed'
        description = update_error_description_and_log_error(error_info, description)

        return {'success': False, 'file_id': None, 'message': description, 'error_info': error_info}


@cc_to_cc.route('/cc-to-cc-import', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def cc_to_cc_import(context):
    req = request.json
    p_req = {
        'user_id': req['userId'],
        'notification_id': req['notificationId'],
        'assumption_name': req['assumptionName'],
        'assumption_key': req['assumptionKey'],
        'scenario_id': req['scenarioId'],
        'file_id': req['fileId'],
        'qualifier_key': req['qualifierKey'],
        'all_unique': req['allUnique'],
        'time_zone': req.get('timeZone')
    }

    def cc_import(
        user_id,
        notification_id,
        assumption_name,
        assumption_key,
        scenario_id,
        file_id,
        qualifier_key,
        all_unique,
        time_zone,
    ):
        try:
            context.cc_to_cc_service.assumption_import_with_check(  # noqa
                assumption_key,
                scenario_id,
                user_id,
                file_id,
                qualifier_key,
                all_unique,
                time_zone,
                notification_id,
            )
        except Exception as e:
            # Change this internally log the error
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {assumption_name}'
            error = update_error_description_and_log_error(error_info, error, extra)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=cc_import, kwargs=(p_req))
    thread.start()

    return 'started'


@cc_to_cc.route('/cc-to-cc-multi-import', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def cc_to_cc_multi_import(context):
    req = request.json
    p_req = {
        "user_id": req["userId"],
        "notification_id": req["notificationId"],
        "scenario_id": req['scenarioId'],
        'scenario_name': req['scenarioName'],
        "file_id": req["fileId"],
        "time_zone": req["timeZone"],
        "assumptions": req["assumptions"]
    }

    def multi_import(user_id, notification_id, scenario_id, scenario_name, file_id, time_zone, assumptions):
        try:
            context.cc_to_cc_service.assumption_multi_import_with_check(user_id, notification_id, scenario_id,
                                                                        scenario_name, file_id, time_zone, assumptions)
        except Exception as e:
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {scenario_name}'
            error = update_error_description_and_log_error(error_info, error, extra)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=multi_import, kwargs=(p_req))
    thread.start()

    return "started"


@cc_to_cc.route('/econ-models-import', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def econ_models_import(context):
    req = request.json
    [assumption_key, user_id, project_id, file_id] = extract_parameters(
        req,
        ['assumptionKey', 'userId', 'projectId', 'fileId'],
        required=True,
    )

    try:
        file_id = context.cc_to_cc_service.econ_models_import_with_check(
            assumption_key,
            user_id,
            project_id,
            file_id,
        )
        description = 'Econ models import complete'
        return {
            'success': True,
            'file_id': file_id,
            'message': description,
            'error_info': None,
        }

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Econ models import failed'
        description = update_error_description_and_log_error(error_info, description)
        return {
            'success': False,
            'file_id': file_id,
            'message': description,
            'error_info': error_info,
        }


@cc_to_cc.route('/schedule-order-import', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def schedule_order_import(context):
    body = request.json

    try:
        thread_input = {
            'schedule_id': body['scheduleId'],
            'file_id': body['fileId'],
            'schedule_name': body['scheduleName'],
            'notification_id': body['notificationId']
        }
    except KeyError as e:
        raise MissingParameterError(*e.args)

    def imort_order(schedule_id, file_id, schedule_name, notification_id):
        try:
            context.cc_to_cc_service.import_schedule_order(schedule_id, file_id)

            context.notification_service.update_notification_with_notifying_target(
                notification_id, {
                    'status': TASK_STATUS_COMPLETED,
                    'description': f'Imported to "{schedule_name}"',
                })
        except Exception as e:
            error_info = get_exception_info(e)
            user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
            context.notification_service.update_notification_with_notifying_target(notification_id, {
                'status': TASK_STATUS_FAILED,
                'description': user_error,
                'extra.error': user_error
            })

    thread = Thread(target=imort_order, kwargs=(thread_input))
    thread.start()

    return 'started'


@cc_to_cc.route('/econ-function-to-option', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def econ_function_to_option(context):
    req = request.json

    [assumption_key, econ_functions] = extract_parameters(
        req,
        ['assumption_key', 'econ_functions'],
        required=True,
    )

    convert_func = ECON_TO_OPTIONS_DICT[assumption_key]
    return [convert_func(econ_function) for econ_function in econ_functions]


@cc_to_cc.route('/generate-probabilistic-inputs', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def gen_prod_inputs(context):
    req = request.json

    try:
        p_req = {
            'user_id': req['userId'],
            'scenario_id': req['scenarioId'],
            'scenario_name': req['scenarioName'],
            'notification_id': req['notificationId'],
            'trials': req['trials'],
            'file_type': req['type'],
            'assignment_ids': req['selectedAssignmentIds'],
            'header_fields': req['headFields'],
            'time_zone': req['timeZone']
        }
    except Exception:
        raise MissingParamsError('Missing input parameter(s)')

    def export(
        user_id,
        scenario_id,
        scenario_name,
        notification_id,
        trials,
        file_type,
        assignment_ids,
        header_fields,
        time_zone,
    ):
        try:
            gcp_name = context.cc_to_cc_service.generate_prob_inputs(
                user_id,
                scenario_id,
                notification_id,
                trials,
                file_type,
                assignment_ids,
                header_fields,
                time_zone,
            )
            ext = 'csv' if '.csv' in gcp_name else 'xlsx'
            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Export complete: "{scenario_name}"',
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{scenario_name}_assumptions.{ext}'
                    }
                }
            }
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

        except Exception as e:
            error_info = get_exception_info(e)
            extra = {
                'tenant_name': context.subdomain,
                'scenario_id': scenario_id,
            }

            error = f'Failed: {scenario_name}'
            error = update_error_description_and_log_error(error_info, error, extra)

            notification_update = {'status': TASK_STATUS_FAILED, 'description': error, 'extra.error': error}
            context.notification_service.update_notification_with_notifying_target(notification_id, notification_update)

    thread = Thread(target=export, kwargs=(p_req))
    thread.start()

    return 'started'


@cc_to_cc.route('/carbon-models-export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def carbon_models_export(context):
    req = request.json
    [
        networks,
        user_id,
        project_id,
    ] = extract_parameters(req, ['networks', 'userId', 'projectId'], required=True)

    try:
        file_id = context.cc_to_cc_service.carbon_models_export(networks, user_id, project_id)
        description = 'Carbon models export complete'

        return {
            'success': True,
            'fileId': file_id,
            'message': description,
            'error_info': None,
        }

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Carbon models export failed'
        description = update_error_description_and_log_error(error_info, description)

        return {'success': False, 'fileId': None, 'message': description, 'error_info': error_info}


@cc_to_cc.route('/carbon-models-import', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def carbon_models_import(context):
    req = request.json
    [user_id, project_id, file_id, identifier, overwrite_str] = extract_parameters(
        req,
        ['userId', 'projectId', 'fileId', 'identifier', 'overwrite'],
        required=True,
    )
    overwrite_models: bool = overwrite_str == 'overwrite'
    error_file_id = None
    success = False
    try:
        error_file_id, overwritten_facility_ids = context.cc_to_cc_service.carbon_models_import_with_check(
            user_id,
            project_id,
            file_id,
            identifier,
            overwrite_models,
        )
        if error_file_id:
            description = 'Carbon models import finished with error(s)'
        else:
            description = 'Carbon models import finished successfully'
            success = True
        return {
            'success': success,
            'fileId': error_file_id,
            'message': description,
            'errorInfo': None,
            'facilityIds': overwritten_facility_ids,
        }

    except Exception as e:
        error_info = get_exception_info(e)
        description = 'Carbon models import failed'
        description = update_error_description_and_log_error(error_info, description)
        return {
            'success': success,
            'fileId': error_file_id,
            'message': description,
            'errorInfo': error_info,
            'facilityIds': [],
        }
