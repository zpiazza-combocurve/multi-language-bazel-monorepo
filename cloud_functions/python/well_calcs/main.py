from combocurve.cloud.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.well_calcs.context import WellCalcsContext
from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes


class WellCalcsParamsError(Exception):
    expected = True


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(WellCalcsContext)
@task()
def handle(request, context):
    body = request.json
    service = context.well_calcs_service

    try:
        wells_ids = body['wells']
    except KeyError as error:
        missing_key = error.args[0]
        raise WellCalcsParamsError(f'Missing required parameter {missing_key}')

    service.update_well_calcs(wells_ids)

    return "ok"
