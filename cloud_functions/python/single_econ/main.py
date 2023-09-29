from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.shared.params import require_params
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.single_econ.context import SingleEconContext
from combocurve.services.job_service.econ_job_service import create_and_wait_on_k8s_job, create_and_wait_on_local_job


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(SingleEconContext)
@task()
def handle(request, **kwargs):
    context = kwargs['context']
    request_body = request.json
    headers = request.headers
    params = require_params(request_body, ['batch_index', 'run_id', 'assignment_ids', 'is_ghg'])

    run_id = params['run_id']

    if params['is_ghg']:
        run = context.carbon_service.get_run(run_id)
        # remove assignment_ids because this contains all ids in run and is not needed as env variable in k8s
        request_body.pop('assignment_ids', None)
        if __debug__:
            create_and_wait_on_local_job(request_body, headers)
        else:
            create_and_wait_on_k8s_job(request_body, headers, run)

    else:
        run = context.econ_service.get_run(run_id)
        params['ghg_run_id'] = request_body.get('ghg_run_id')

        batch_outputs = context.econ_service.batch_econ(run, params)

        context.econ_service.write_one_liner_to_db(run, batch_outputs)
        context.econ_service.write_batch_files_to_cloud(run, params, batch_outputs)
