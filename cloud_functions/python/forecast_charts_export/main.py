from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.shared.params import require_params
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.forecast_charts_export.context import ForecastChartsExportContext


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(ForecastChartsExportContext)
@task()
def handle(request, context: ForecastChartsExportContext):
    file_name_params = require_params(request.json, ['forecast_export_id', 'batch_index'])
    charts_service_params = require_params(request.json, ['forecast_id', 'forecast_type', 'wells'])
    settings = request.json.get('settings', {})

    prefix = file_name_params['forecast_export_id']
    index = file_name_params['batch_index']
    file_name_gen = BatchFileNameGenerator(prefix, index)

    return context.forecast_charts_service.export_forecast_charts(**charts_service_params,
                                                                  settings=settings,
                                                                  file_name_generator=file_name_gen)
