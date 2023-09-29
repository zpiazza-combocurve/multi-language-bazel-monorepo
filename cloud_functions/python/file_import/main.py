from combocurve.cloud.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.file_import.context import FileImportCFContext
from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(FileImportCFContext)
@task()
def handle(request, context: FileImportCFContext):
    body = request.json

    service = context.file_import_db_service

    data = service.get_data_from_batch_name(body.get('batch_name'))

    service.import_to_db(body, data)
    return "ok"
