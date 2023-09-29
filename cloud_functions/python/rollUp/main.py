from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.shared.decorators import filter_warnings
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from cloud_functions.rollUp.context import RollUpContext
from combocurve.utils.logging import add_to_logging_metadata


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(RollUpContext)
@task()
def handle(request, **kwargs):
    context = kwargs['context']
    params = request.json
    params['groups'] = params.get('headers')

    rollup_data = {
        'scenario_id': params.get('scenario_id'),
        'forecast_id': params.get('forecast_id'),
        'wells': params.get('well_ids'),
        'assignment_ids': params.get('assignment_ids'),
        'dates': params.get('dates'),
        'headers': params.get('headers')
    }
    add_to_logging_metadata({'rollup': rollup_data})

    context.roll_up_service.roll_up(params)
