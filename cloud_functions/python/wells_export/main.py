from combocurve.services.wells_export.wells_export_service import BATCH_FILE_NAME_MAIN_PREFIX
from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes

from cloud_functions.wells_export.context import WellsExportContext
from combocurve.shared.decorators import filter_warnings
from combocurve.shared.params import require_params
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(WellsExportContext)
@task()
def handle(request, context: WellsExportContext):
    params = require_params(request.json, ['wellIds', 'batch_index'])
    file_name_generator = BatchFileNameGenerator(BATCH_FILE_NAME_MAIN_PREFIX, params['batch_index'])
    return context.wells_export_service.export_wells(params['wellIds'], request.json.get('projectId', None),
                                                     file_name_generator)
