from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes

from cloud_functions.production_data_export.context import ProductionDataExportContext
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
@with_context(ProductionDataExportContext)
@task()
def handle(request, context: ProductionDataExportContext):
    params = require_params(request.json, ['wellIds', 'headers', 'batch_index'])
    file_name_generator = BatchFileNameGenerator('production-export-data', params['batch_index'])
    settings = request.json.get('settings', {})
    return context.production_data_export_service.export_production_data(params['wellIds'], params['headers'],
                                                                         file_name_generator, settings)
