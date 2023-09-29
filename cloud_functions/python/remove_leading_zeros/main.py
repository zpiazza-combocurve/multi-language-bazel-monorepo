from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db

from combocurve.shared.requests import extract_parameters

from combocurve.cloud.with_db_decorator import with_db
from cloud_functions.remove_leading_zeros.context import RemoveLeadingZerosContext


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(RemoveLeadingZerosContext)
@task()
def handle(request, context):
    body = request.json
    service = context.remove_leading_zeros_service
    [well_ids] = extract_parameters(body, ['well_ids'], required=True)
    service.remove_leading_zeros(well_ids, 'monthly')
    service.remove_leading_zeros(well_ids, 'daily')

    return "ok"
