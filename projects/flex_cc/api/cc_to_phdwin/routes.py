from flask import Blueprint, request
from threading import Thread

from bson import ObjectId
from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_FAILED
from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.helpers import get_value, update_error_description_and_log_error
from combocurve.utils.routes import complete_routing
from api.decorators import with_context

cc_to_phdwin = Blueprint('cc-phdwin-export', __name__)


@cc_to_phdwin.route('/export', methods=['POST'])
@complete_routing(formatter=lambda x: x)
@with_context
def export_to_phdwin(context):
    req = request.json
    p_req = {
        "user_id": get_value(req, 'userId'),
        "notification_id": get_value(req, "notificationId"),
        'scenario_id': get_value(req, "scenarioId"),
        "assignment_ids": get_value(req, "selectedAssignmentIds"),
        'chosen_key': get_value(req, 'phdwinIdentifierOption'),
        'selected_assumptions': get_value(req, "columns")
    }

    def export(user_id, notification_id, scenario_id, assignment_ids, chosen_key, selected_assumptions):
        scenario = context.scenario_service.get_scenario(ObjectId(scenario_id))
        scenario_name = scenario['name']
        try:
            gcp_name = context.cc_to_phdwin_service.export_to_phdwin(scenario_id, user_id, notification_id,
                                                                     assignment_ids, chosen_key, selected_assumptions)

            description = f'Exported {scenario_name}'

            ext = 'zip'

            notification_update = {
                'status': TASK_STATUS_COMPLETED,
                'description': description,
                'extra.output': {
                    'file': {
                        'gcpName': gcp_name,
                        'name': f'{scenario_name} Phdwin export.{ext}'
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

    thread = Thread(target=export, kwargs=(p_req))
    thread.start()

    return 'started'
