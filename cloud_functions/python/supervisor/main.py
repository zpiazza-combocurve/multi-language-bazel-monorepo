from flask import jsonify

from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.supervisor.context import SupervisorContext


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(SupervisorContext)
def handle(request, **kwargs):
    context = kwargs['context']
    params = request.get_json(force=True)

    task_id = params['task_id']
    context.supervisor_service.check(task_id)
    return jsonify({'message': 'Checked'}), 200
