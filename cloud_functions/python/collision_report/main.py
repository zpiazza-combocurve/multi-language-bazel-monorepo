from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes

from combocurve.shared.decorators import filter_warnings
from combocurve.shared.params import require_params
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.collision_report.context import CollisionReportContext


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(CollisionReportContext)
@task()
def handle(request, context: CollisionReportContext):
    params = require_params(request.json, ['collisions', 'batch_index', 'task_id'])
    single_wells = request.json.get('singleWells', False)
    file_name_generator = BatchFileNameGenerator(f'collision-report-{params["task_id"]}', params['batch_index'])
    return context.collision_report_service.generate_report_batch(params['collisions'], file_name_generator,
                                                                  single_wells)
