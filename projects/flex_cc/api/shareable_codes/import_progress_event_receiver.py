from typing import Optional

from api.archive.abstract_progress_event_receiver import AbstractProgressEventReceiver
from api.archive.archive_progress_event_receiver import get_archive_progress_weights
from api.archive.restore_progress_event_receiver import get_restore_progress_weights

from combocurve.shared.progress_notifier import WeightedProgressNotifier
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED


def get_import_progress_weights(context):
    return {**get_archive_progress_weights(context), **get_restore_progress_weights(context)}


class ImportProgressEventReceiver(AbstractProgressEventReceiver):
    progress_notifier: Optional[WeightedProgressNotifier]

    def __init__(self, context, user_id: str, notification_id: str):
        self.context = context
        self.user_id = user_id
        self.notification_id = notification_id

        progress_weights = get_import_progress_weights(self.context)
        self.progress_notifier = WeightedProgressNotifier(progress_weights, self.context.pusher, self.notification_id,
                                                          self.context.subdomain, self.user_id)

    def init(self, project_name: str):
        # do nothing, it will be called twice
        pass

    def end(self, results):
        # do nothing, it will be called twice
        pass

    def error(self, error):
        error_info = get_exception_info(error)
        user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
        self.context.notification_service.update_notification_with_notifying_target(self.notification_id, {
            'status': TASK_STATUS_FAILED,
            'description': user_error,
            'extra.error': user_error
        })

    def progress(self, name: str, progress):
        self.progress_notifier.add_partial_progress(name, progress)

    def finish(self, new_project_name):
        self.context.notification_service.update_notification_with_notifying_target(
            self.notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Imported "{new_project_name}"'
            })
