from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_FAILED, TASK_STATUS_RUNNING
from combocurve.shared.requests import extract_parameters
from combocurve.shared.helpers import jsonify
from combocurve.shared.progress_notifier import ProgressNotifier
from combocurve.utils.routes import complete_routing_cf
from combocurve.utils.scheduler_decorator import single_run_schedule_job
from combocurve.cloud.concurrent.with_context_decorator import with_context
from cloud_runs.merge_pdf.context import MergePdfContext


class ExternalApiParamsError(Exception):
    expected = True


@complete_routing_cf(formatter=jsonify)
@with_context(MergePdfContext)
@single_run_schedule_job
def handle(request, context: MergePdfContext):
    [
        batches_prefix,
        file_name,
        gcp_name,
        user_id,
        delete_batches,
        notification_id,
		project_id
    ] = extract_parameters(request.json,
                           ['batchesPrefix', 'fileName', 'gcpName', 'userId', 'deleteBatches', 'notificationId', 'projectId'],
                           required=True)

    progress_notifier = ProgressNotifier(context.pusher, notification_id, context.tenant, user_id)
    context.notification_service.update_notification_with_notifying_target(notification_id, {
        'status': TASK_STATUS_RUNNING,
        'description': 'Building report file...'
    })

    try:
        file_info = context.merge_pdf_service.merge(batches_prefix, file_name, gcp_name, user_id, project_id, delete_batches,
                                                    progress_notifier)

        context.notification_service.update_notification_with_notifying_target(
            notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': 'By well yearly PDF report successfully generated',
                'extra.output': {
                    'file': file_info
                }
            })
    except Exception as e:
        context.notification_service.update_notification_with_notifying_target(notification_id, {
            'status': TASK_STATUS_FAILED,
            'description': 'Failed'
        })
        raise e
