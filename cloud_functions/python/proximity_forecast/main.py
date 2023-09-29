from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.proximity_forecast.context import ProximityForecastContext
from combocurve.utils.logging import add_to_logging_metadata


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(ProximityForecastContext)
@task()
def handle(request, **kwargs):
    context: ProximityForecastContext = kwargs['context']
    params = request.json

    try:
        # run entry point to service
        return context.proximity_forecast_service.proximity_on_the_grid(params)
    except Exception as e:
        add_to_logging_metadata({'proximity_forecast': params})
        raise e
