import logging
import math
import requests
from datetime import datetime
from bson.objectid import ObjectId
from pymongo import ReturnDocument

from .exceptions import get_exception_info
from .constants import DEFAULT_USER_NOTIFICATION_ERROR
from .task import get_task_data, get_basic_task_data


def _log(message, extra=None, level=logging.INFO):
    logging.log(level, message, extra=extra if extra is not None else {})


def _log_error(message, exception, extra_data=None, level=logging.ERROR):
    metadata = extra_data or {}
    error_info = get_exception_info(exception)
    metadata = {**metadata, 'error': error_info}
    _log(message, {'metadata': metadata}, level)


def _task_log(task, message, exception=None, full_data=False, level=None):
    task_data = get_task_data(task) if full_data else get_basic_task_data(task)
    full_message = f'task_id: {task_data["task_id"]} - {message}'
    metadata = {'task_details': task_data}

    if not exception:
        _log(full_message, {'metadata': metadata}, level or logging.INFO)
        return

    _log_error(full_message, exception, metadata, level or logging.ERROR)


def _has_method(instance, name):
    attr = getattr(instance, name, None)
    return callable(attr)


class TaskService(object):
    '''
        Task life-cycle operations
    '''
    def __init__(self, context):
        self.context = context
        '''
            context:
                + queues_collection
                + notifications_collection
                + tasks_collection
                + tasks_client
                + pusher_client
                + scheduler_client
                + get_queue_name()
        '''

    def get_by_id(self, task_id):
        '''
            Retrieves a task document by its _id
        '''
        try:
            return self.context.tasks_collection.find_one({'_id': ObjectId(task_id)})
        except Exception as e:
            _log_error(f'task_id: {task_id} - Failed to retrieve task', e)
            raise e

    def purge_queue(self, task):
        '''
            Clears all tasks in this queue
        '''
        queue_name = self.get_queue_name(task)
        try:
            self.context.tasks_client.purge_queue(queue_name)
        except Exception as e:
            _task_log(task, 'Failed to purge queue', exception=e)
            raise e

    def count_tasks_in_queue(self, task):
        '''
            Gets the current amount of tasks in this queue
        '''
        queue_name = self.get_queue_name(task)
        try:
            return self.context.tasks_client.count_tasks(queue_name)
        except Exception as e:
            _task_log(task, 'Failed to get count of tasks in queue', exception=e, level=logging.WARNING)
            raise e

    def finish(self, task, exception, message=None):
        '''
            Executes all steps required to finish a task
        '''
        success = exception is None
        updated_task = self._move_to_finished(task, success)

        if updated_task is None:
            # the task was moved to finished by somebody else
            return

        result_description = 'Success' if success else 'Fail'
        _task_log(updated_task, f'Task result: {result_description}', exception, full_data=True)

        self._save_result_and_push_final_message(updated_task, exception, message)

        try:
            self._release_queue(updated_task)
        except Exception as e:
            _task_log(updated_task, 'Failed to release queue', exception=e)

        dependent_kinds = self._check_dependent(updated_task, success)
        self._check_queued(updated_task, dependent_kinds)
        self._delete_supervisor_job(updated_task)

    def _move_to_finished(self, task, success):
        '''
            Updates the task state to `complete` or `failed`
        '''
        try:
            query = {'_id': task['_id'], 'status': task['status']}
            update = {'$set': {'finishedAt': datetime.utcnow(), 'status': 'complete' if success else 'failed'}}
            return self.context.tasks_collection.find_one_and_update(query,
                                                                     update,
                                                                     return_document=ReturnDocument.AFTER)
        except Exception as e:
            _task_log(task, 'Failed to move task to finished', exception=e)
            raise e

    def _save_result_and_push_final_message(self, task, exception, completed_message=None):
        notification_update = {'updatedAt': datetime.utcnow()}
        if exception:
            error_info = get_exception_info(exception)
            user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
            notification_update['status'] = 'failed'
            notification_update['description'] = user_error
            notification_update['extra.error'] = user_error
        else:
            if task['kind'] == 'econ-report-by-well':
                notification_update['status'] = 'queued'
                notification_update['description'] = completed_message
            elif task['kind'] == 'file-import' and completed_message in ['aries', 'phdwin']:
                notification_update['status'] = 'pending'
            else:
                notification_update['status'] = 'complete'
                notification_update['extra.output'] = completed_message
        try:
            self.context.notification_service.update_notification_with_notifying_target(
                task['progress']['emitter'], notification_update)
        except Exception as e:
            _task_log(task, 'Failed to update notification or send Pusher message', exception=e)

    def _check_queued_for_kind(self, kind):
        subdomain = self.context.tenant_info['subdomain']
        requests.get('https://' + subdomain + '.combocurve.com/api/task/check-pending-tasks/' + kind)

    def _check_queued(self, task, dependent_kinds):
        '''
            Requests a check for queued tasks that could be run next
        '''
        try:
            # determine the union of the kinds for the dependent tasks and the kind for the current task
            kinds_to_check = list(set(dependent_kinds + [task['kind']]))
            for kind in kinds_to_check:
                self._check_queued_for_kind(kind)
        except Exception as e:
            _task_log(task, 'Failed to trigger queued tasks', exception=e)

    def _check_dependent(self, task, success):
        '''
            To be called when a task finishes to update the status of other tasks that may depend on the finished task.
            It returns a list of the distinct task kinds for the dependent tasks.
        '''
        try:
            # tasks that are currently waiting for this task
            dependent_query = {'status': 'awaiting_dependency', 'dependency': task['_id']}

            # distinct task kinds that are currently waiting for this task
            dependent_kinds = self.context.tasks_collection.distinct('kind', dependent_query)

            # move the tasks waiting to `queued` or `canceled`, depending on whether the current task succeeded or not
            if success:
                dependent_update = {'$set': {'status': 'queued'}}
            else:
                self.context.notification_service.update_notification_with_notifying_target(
                    task['progress']['emitter'], {'status': 'failed'})
                dependent_update = {'$set': {'status': 'canceled', 'canceledAt': datetime.utcnow()}}
                self._cancel_econ_after_failed_carbon(dependent_query)
            self.context.tasks_collection.update_many(dependent_query, dependent_update)
            return dependent_kinds

        except Exception as e:
            _task_log(task, 'Failed to trigger waiting tasks', exception=e)

    def _cancel_econ_after_failed_carbon(self, dependent_query):
        dependent_task = self.context.tasks_collection.find_one(dependent_query)
        if dependent_task and dependent_task['kind'] == 'economics':
            self.context.econ_runs_collection.update_one({'_id': dependent_task['kindId']}, {'$set': {
                    'status': 'failed',
            }})
            self.context.notification_service.update_notification_with_notifying_target(
                    dependent_task['progress']['emitter'], {'status': 'failed', 'extra.error': 'Carbon Run Failed'})

    def _release_queue(self, task):
        '''
            Releases the queue used for this task
        '''
        queue_name = self.get_queue_name(task)
        return self.context.queues_collection.update_one(
            {'name': queue_name}, {'$set': {
                'assigned': False,
                'updatedAt': datetime.utcnow(),
            }})

    def _delete_supervisor_job(self, task):
        '''
            Deletes the Cloud Scheduler job created to monitor this task
        '''
        job_name = task.get('supervisorJobName')
        if job_name is not None:
            try:
                self.context.scheduler_client.delete_job(job_name)
            except Exception as e:
                _task_log(task, 'Failed to delete scheduler job', exception=e)

    def update_task(self, task_id, update):
        try:
            return self.context.tasks_collection.find_one_and_update({'_id': ObjectId(task_id)},
                                                                     update,
                                                                     return_document=ReturnDocument.AFTER)
        except Exception as e:
            _log_error(f'task_id: {task_id} - Failed to update task', e)
            raise e

    def update_batch_started(self, task_id, batch_index):
        '''
            Updates the current task to mark the current batch as started
        '''
        update = {
            '$inc': {
                f'batches.{batch_index}.processed': 1
            },
            '$set': {
                'mostRecentStart': datetime.utcnow(),
                f'batches.{batch_index}.start': datetime.utcnow()
            }
        }
        return self.update_task(task_id, update)

    def update_batch_ended(self, task_id, batch_index, success, abort):
        '''
            Updates the current task to mark the current batch as ended
        '''
        status = 'complete' if success else 'failed'
        progress_path = f'progress.{status}'
        update = {
            '$inc': {
                progress_path: 1,
            },
            '$set': {
                'mostRecentEnd': datetime.utcnow(),
                f'batches.{batch_index}.end': datetime.utcnow(),
            }
        }
        if abort:
            update['$inc']['aborted'] = 1
        return self.update_task(task_id, update)

    def update_clean_up_started(self, task_id, set_request_date=False):
        '''
            Updates the current task to set the clean up state as started
        '''
        update = {
            '$inc': {
                'cleanUp.processed': 1
            },
            '$set': {
                'cleanUp.start': datetime.utcnow(),
            },
        }
        if set_request_date:
            update['$set']['cleanUpAt'] = datetime.utcnow()
        return self.update_task(task_id, update)

    def push_progress_message(self, task):
        '''
            Triggers a pusher message to update the current task progress
        '''
        progress = task['progress']
        emitter = progress['emitter']
        initial_progress = progress['initial']
        end_progress = progress['end']
        total = progress['total']
        done = progress['complete'] + progress['failed']

        if done % progress['denom'] == 0:
            channel_info = self.get_channel_info(task)
            try:
                self.context.pusher_client.trigger_from_channel_info(
                    channel_info, {
                        '_id': emitter,
                        'progress': math.ceil(initial_progress + (end_progress - initial_progress) * done / total)
                    })
            except Exception as e:
                _task_log(task, 'Failed to send Pusher message', e, logging.WARNING)

    def get_channel_info(self, task):
        '''
            Gets the information for the pusher channel that should be used for this task
        '''
        return task['progress']['channel']

    def get_queue_name(self, task):
        '''
            Returns the Cloud Tasks queue name used for this task
        '''
        if _has_method(self.context, 'get_queue_name'):
            return self.context.get_queue_name(task)
        return task.get('queueName')

    def is_queue_empty(self, task):
        '''
            Returns whether the Cloud Tasks queue for this task is empty
        '''
        queue = self.get_queue_name(task)
        count = self.context.tasks_client.count_tasks(queue)
        return count == 0
