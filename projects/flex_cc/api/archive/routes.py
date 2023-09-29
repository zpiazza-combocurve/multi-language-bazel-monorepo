from flask import Blueprint, request

from combocurve.utils.routes import complete_routing
from combocurve.shared.helpers import jsonify
from combocurve.shared.requests import extract_parameters
from api.decorators import with_context
from api.context import Context

archive = Blueprint('archive', __name__)


@archive.route('/archive/<project_id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def archive_project(project_id, context: Context):
    body = request.json
    [user, notification_id, version] = extract_parameters(body, ['user', 'notificationId', 'version'], required=True)
    [time_zone] = extract_parameters(body, ['timeZone'], required=False)
    archived_project_id = context.archive_service.archive_project(project_id, user, notification_id, version, time_zone)
    return {'id': archived_project_id}


@archive.route('/restore/<archived_project_id>', methods=['POST'])
@complete_routing(formatter=jsonify)
@with_context
def restore_project(archived_project_id, context: Context):
    body = request.json
    [user, notification_id, restore_to_version] = extract_parameters(body,
                                                                     ['user', 'notificationId', 'restoreToVersion'],
                                                                     required=True)
    restored_project_id = context.archive_service.restore_project(archived_project_id, user, notification_id,
                                                                  restore_to_version)
    return {'id': restored_project_id}
