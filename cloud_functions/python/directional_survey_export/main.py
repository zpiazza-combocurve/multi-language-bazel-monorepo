from cloud_functions.directional_survey_export.context import DirectionalSurveyExportContext
from combocurve.shared.decorators import filter_warnings
from combocurve.shared.params import require_params
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.utils.task_decorator import task
from combocurve.utils.routes import log_cloud_function_crashes
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db


@log_cloud_function_crashes
@filter_warnings
@with_db
@with_shared_db
@with_context(DirectionalSurveyExportContext)
@task()
def handle(request, context: DirectionalSurveyExportContext):
    params = require_params(request.json, ['wellIds', 'headers', 'batch_index', 'task_id'])

    file_name_generator = BatchFileNameGenerator(f'directional-survey-export-{params["task_id"]}',
                                                 params['batch_index'])

    return context.directional_survey_export_service.export_directional_surveys(params['wellIds'], params['headers'],
                                                                                file_name_generator)
