from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db

from combocurve.shared.requests import extract_parameters

from combocurve.cloud.with_db_decorator import with_db
from cloud_functions.econ_well_calcs.context import EconWellCalcsContext


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(EconWellCalcsContext)
@task()
def handle(request, context):
    body = request.json
    service = context.well_calcs_service

    [econ_run_id, well_ids] = extract_parameters(body, ['econ_run_id', 'well_ids'], required=True)
    [combo_name] = extract_parameters(body, ['combo_name'], required=False)

    service.update_econ_well_calcs(econ_run_id, well_ids, combo_name)

    return "ok"
