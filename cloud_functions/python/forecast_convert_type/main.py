from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.forecast_convert_type.context import ForecastConvertTypeContext
from combocurve.utils.logging import add_to_logging_metadata


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(ForecastConvertTypeContext)
@task()
def handle(request, **kwargs):
    params = request.json
    context = kwargs['context']
    add_to_logging_metadata({'forecast_trivial_python': params})
    return context.forecast_conversion_service.convert(params)
