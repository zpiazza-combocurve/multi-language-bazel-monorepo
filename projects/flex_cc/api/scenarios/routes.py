from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from combocurve.shared.helpers import jsonify
from api.decorators import with_context
from combocurve.shared.requests import extract_parameters

scenarios = Blueprint('scenarios', __name__)


@scenarios.route('/export-with-lookup', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def export_with_lookup(context):
    body = request.json
    params = ['scenario', 'selectedAssignmentIds', 'assumptionKeys', 'wellHeaders', 'user', 'notificationId', 'project']
    [scenario, assignment_ids, assumption_keys, well_headers, user_id, notification_id,
     project] = extract_parameters(body, params, required=True)

    return context.scenarios_service.export_with_lookup(scenario, assignment_ids, assumption_keys, well_headers,
                                                        user_id, project, notification_id)
