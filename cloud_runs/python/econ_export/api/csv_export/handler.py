from combocurve.utils.scheduler_decorator import single_run_schedule_job
from combocurve.utils.with_db_decorator import with_db
from combocurve.utils.with_shared_db_decorator import with_shared_db
from combocurve.cloud.concurrent.with_context_decorator import with_context
from combocurve.utils.constants import (DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED,
                                        TASK_STATUS_RUNNING)
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME
from cloud_runs.econ_export.context import EconExportContext
from cloud_runs.econ_export.api.csv_export.handle_cashflow import handle_cashflow
from cloud_runs.econ_export.api.csv_export.handle_one_liner import handle_one_liner
from combocurve.services.econ.econ_columns import CSV_FAKE_ECON_COLUMNS

import logging

NOTIFICATION_MAPPER = {
    'oneLiner': 'Well Oneliner Cash Flow (CSV)',
    'cashflow-csv': 'Well Cash Flow (CSV)',
    'cashflow-pdf': 'Well Cash Flow (PDF)',
    'cashflow-agg-csv': 'Aggregate Cash Flow (CSV)',
    'cashflow-agg-pdf': 'Aggregate Cash Flow (PDF)',
}


def notify_progress_wrapper(context, user_id, notification_id):
    def notify_progress(progress: int):
        context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    return notify_progress


class ExternalApiParamsError(Exception):
    expected = True


def update_output_column_type(output_columns):
    for col in output_columns:
        if col['key'] in CSV_FAKE_ECON_COLUMNS:
            col['keyType'] = 'header'
    return output_columns


@with_db
@with_shared_db
@with_context(EconExportContext)
@single_run_schedule_job
def csv_export_handler(request, context: EconExportContext):
    body = request.json
    run_id = body.get('econRun')
    user_id = body.get('userId')
    project_id = body.get('project')
    notification_id = body.get('notificationId')
    report_type = body.get('reportType')
    notification_title = NOTIFICATION_MAPPER[report_type]
    run_specs = context.econ_service.get_run(run_id)

    context.notification_service.update_notification_with_notifying_target(
        notification_id, {
            'status': TASK_STATUS_RUNNING,
            'description': f'Generating {notification_title} ...'
        })
    notify_progress = notify_progress_wrapper(context, user_id, notification_id)
    notify_progress(progress=20)

    try:
        output_columns = update_output_column_type([col.dict() for col in body.get('columns')])

        handle_func = handle_cashflow if 'cashflow' in report_type else handle_one_liner
        gcp_name = handle_func(
            context=context,
            export_params={
                'run_specs': run_specs,
                'output_columns': output_columns,
                'report_type': report_type,
                'cashflow_report': body.get('cashFlowReport'),
            },
            notify_progress=notify_progress,
        )

        notify_progress(progress=100)
        file_info = {'gcpName': gcp_name, 'name': f'{body.get("fileName", "Economics")}.csv', 'type': 'application/csv'}
        context.notification_service.update_notification_with_notifying_target(
            notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': f'{notification_title} successfully generated!',
                'extra.output': {
                    'file': file_info,
                    'runId': run_id
                }
            })

        context.file_service.create_file_from_gcp_name(gcp_name=gcp_name, user_id=user_id, project_id=project_id)

        return gcp_name

    except Exception as e:
        error_info = get_exception_info(e)
        logging.error(f'Generate {notification_title} failed!, {error_info}', extra={'metadata': {'error': error_info}})
        user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
        context.notification_service.update_notification_with_notifying_target(notification_id, {
            'status': TASK_STATUS_FAILED,
            'description': user_error,
            'extra.error': user_error
        })
