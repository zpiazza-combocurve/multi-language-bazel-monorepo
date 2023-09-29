from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.forecast.context import ForecastContext
from combocurve.utils.logging import add_to_logging_metadata


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(ForecastContext)
@task()
def handle(request, **kwargs):
    context = kwargs['context']
    params = request.json

    try:
        fType = params.get('fType')
        if fType == 'probabilistic':
            return context.forecast_service.forecast(params)
        elif fType == 'deterministic':
            return context.deterministic_forecast_service.forecast(params)
        else:
            raise Exception('Invalid Forecast Type')
    except Exception as e:
        add_to_logging_metadata({'auto_forecast': params})
        raise e
