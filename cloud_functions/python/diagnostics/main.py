from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.diagnostics.context import DiagnosticContext
from combocurve.utils.logging import add_to_logging_metadata


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(DiagnosticContext)
@task()
def handle(request, **kwargs):
    context = kwargs['context']
    params = request.json
    try:
        return context.diagnostic_service.diagnose(params)
    except Exception:
        diagnostics_data = {
            'forecast_id': params.get('forecast_id'),
            'wells': params.get('wells'),
            'phase_settings': params.get('phase_settings')
        }
        add_to_logging_metadata({'diagnostics': diagnostics_data})
        raise Exception('Something went wrong')
