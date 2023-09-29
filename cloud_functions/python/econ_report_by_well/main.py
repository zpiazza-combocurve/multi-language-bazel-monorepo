from combocurve.utils.routes import log_cloud_function_crashes

from combocurve.utils.with_context_decorator import with_context
from combocurve.utils.with_shared_db_decorator import with_shared_db
from combocurve.utils.task_decorator import task
from combocurve.shared.requests import extract_parameters
from combocurve.cloud.with_db_decorator import with_db
from cloud_functions.econ_report_by_well.context import EconReportByWellCFContext


@log_cloud_function_crashes
@with_db
@with_shared_db
@with_context(EconReportByWellCFContext)
@task()
def handle(request, context: EconReportByWellCFContext):
    body = request.json

    [econ_run_id, wells, batch_index, bfit_report,
     afit_report] = extract_parameters(body,
                                       ['econRunId', 'wells', 'batch_index', 'bfitReportExport', 'afitReportExport'],
                                       required=True)
    [time_zone] = extract_parameters(body, ['timeZone'], required=False)

    return context.by_well_report_service.generate_batch_report(econ_run_id, wells, batch_index, bfit_report,
                                                                afit_report, time_zone)
