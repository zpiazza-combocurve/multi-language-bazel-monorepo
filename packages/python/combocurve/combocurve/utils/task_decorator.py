import logging
from datetime import datetime
from functools import wraps
from flask import jsonify

from .exceptions import get_exception_info
from .logging import add_to_logging_metadata
from .task import was_batch_repeated, is_last, is_over_failure_threshold, is_clear, format_id, get_basic_task_data


def _call_failable(fn, *args, **kwargs):
    try:
        ret = fn(*args, **kwargs)
        return None, ret
    except Exception as ex:
        return ex, None


def _log(message, extra=None, level=logging.INFO):
    logging.log(level, message, extra=extra if extra is not None else {})


def _get_error_info_from_status(http_status, message='An error occurred'):
    if 200 <= http_status < 400:
        return None
    expected = 400 <= http_status < 500
    return {'message': message, 'expected': expected}


class TaskCall(object):
    def __init__(self, handler, request, *args, **kwargs):
        self.handler = handler
        self.request = request

        self.params = request.json
        self.role = self.params.get('role', 'batch')

        self.args = args
        self.kwargs = kwargs

        self.context = kwargs['context']

    def _get_cloud_task_id(self):
        return self.request.headers.get('X-Cloudtasks-Taskname')

    def _configure_logging(self):
        task_id = format_id(self.params['task_id'])
        batch_index = self.params.get('batch_index', '<last>')
        cloud_task_id = self._get_cloud_task_id()
        task_data = {'task_id': task_id, 'batch_index': batch_index, 'cloud_task_id': cloud_task_id}

        add_to_logging_metadata({'task': task_data})

    def _batch_log(self, task, message, error_info=None):
        task_id = self.params['task_id']
        batch_index = self.params.get('batch_index', '<last>')

        if task is None:
            progress_text = '?'
        else:
            progress = task['progress']
            total = progress['total']
            done = progress['complete'] + progress['failed']
            progress_text = f'{done}/{total}'
        prefix = f'task_id: {format_id(task_id)}, batch_index: {batch_index} [{progress_text}]'
        self._task_log(f'{prefix} - {message}', task, error_info)

    def _task_log(self, message, task=None, error_info=None):
        tenant = self.context.tenant_info['subdomain']
        full_message = f'{tenant} / {message}'

        metadata = {}
        if task is not None:
            metadata.update({'task_details': get_basic_task_data(task)})

        if not error_info:
            _log(full_message, {'metadata': metadata})
            return

        metadata.update({'error': error_info})
        level = logging.WARNING if error_info.get('expected') else logging.ERROR
        _log(full_message, {'metadata': metadata}, level)

    def _respond_with_message(self, task, message, status=200):
        self._batch_log(task, message)
        self._task_log(f'Ended: Cloud Tasks TASK_ID: {self._get_cloud_task_id()}',
                       error_info=_get_error_info_from_status(status, message))
        return jsonify({'message': message}), status

    def _respond_with_body(self, task, body, status=200):
        self._task_log(f'Ended: Cloud Tasks TASK_ID: {self._get_cloud_task_id()}',
                       error_info=_get_error_info_from_status(status))
        return jsonify(body), status

    def handle(self):

        self._configure_logging()

        self._task_log(f'Started: Cloud Tasks TASK_ID: {self._get_cloud_task_id()}')

        if type(self.params.get('task_id')) != str:
            return self._respond_with_message(None, 'Missing or invalid `task_id` provided', 400)

        if self.role == 'batch':
            return self._handle_batch()

        if self.role == 'clean_up':
            clean_up_reason = self.params.get('clean_up_reason')
            return self._handle_clean_up(exception=Exception(clean_up_reason) if clean_up_reason else None)

        return self._respond_with_message(None, f'Invalid `role` provided: "{self.role}"', 400)

    def _handle_batch(self):
        '''
            Handles the execution of a batch
        '''

        task_id = self.params['task_id']
        batch_index = self.params['batch_index']

        task_service = self.context.task_service

        task = task_service.update_batch_started(task_id, batch_index)

        if task is None:
            return self._respond_with_message(None, 'Task already finished, returning (pre)')

        if was_batch_repeated(task, batch_index):
            return self._respond_with_message(task, 'Batch was already processed, returning (pre)')

        if task['aborted'] > 0:
            self._batch_log(task, 'Task was aborted, returning (pre)')
            return self._exit(task, end_batch=batch_index)

        self._batch_log(task, 'Executing handler...')
        (exception, body) = _call_failable(self.handler, self.request, *self.args, **self.kwargs)

        if exception:
            error_info = get_exception_info(exception)
            self._batch_log(task, f'Handler failed: {error_info["message"]}', error_info)
            body = {'error': error_info}
        else:
            self._batch_log(task, 'Handler succeeded')

        failures_exceeded = is_over_failure_threshold(task, failed=exception is not None)

        task = task_service.update_batch_ended(task_id, batch_index, success=exception is None, abort=failures_exceeded)

        if task is None:
            return self._respond_with_message(task, 'Task already finished, returning (post)')

        if task['aborted'] > 1:
            self._batch_log(task, 'Task was aborted, returning (post)')
            return self._exit(task)

        if failures_exceeded:
            self._batch_log(task, 'Failure threshold exceeded, aborting (post)')

            try:
                tasks_in_queue = task_service.count_tasks_in_queue(task)
            except Exception:
                # if getting tasks count fails for some reason, we will still try to purge
                tasks_in_queue = None

            if tasks_in_queue != 0:
                task_in_que_text = 'N/A' if tasks_in_queue is None else tasks_in_queue
                self._batch_log(task, f'Purging {task_in_que_text} remaining tasks in queue.')
                task_service.purge_queue(task)
            else:
                self._batch_log(task, 'No further tasks in queue.')

            return self._exit(task)

        if is_last(task):
            return self._handle_clean_up(task, self_requested=True)

        task_service.push_progress_message(task)

        return self._respond_with_body(task, body if body else {'message': 'Ok'})

    def _handle_clean_up(self, task=None, exception=None, self_requested=False):
        '''
            Handles the execution of the clean up and triggers finishing steps
        '''

        task_id = self.params['task_id']

        task_service = self.context.task_service

        task = task_service.update_clean_up_started(task_id, self_requested)

        if task is None:
            return self._respond_with_message(None, 'Task already finished, returning (clean up)')

        clean_up_state = task.get('cleanUp')
        if clean_up_state is None:
            # old task: this check can be removed on the release after the next one
            pass
        elif clean_up_state['processed'] > 1:
            return self._respond_with_message(task, 'Clean up already processed, returning')

        self._batch_log(task, 'Executing clean up...')
        (cleanup_exception, cleanup_message) = _call_failable(self.context.clean_up, task, exception is None)
        self._batch_log(task, 'Clean up failed' if cleanup_exception else 'Clean up succeeded')
        task_service.finish(task, cleanup_exception or exception, cleanup_message)

        return self._respond_with_body(task, {'message': 'Ok'})

    def _exit(self, task, end_batch=None):
        '''
            Procedure to execute when task has been aborted
        '''
        if end_batch is not None:
            update = {
                '$set': {
                    f'batches.{end_batch}.end': datetime.utcnow(),
                }
            }
            self.context.task_service.update_task(task['_id'], update)
        if is_clear(task):
            return self._handle_clean_up(task, exception=Exception('Task was aborted'), self_requested=True)
        return self._respond_with_message(task, 'Task is not clear, can not finish')


class _TaskDecorator(object):
    '''
        A decorator to wrap cloud function handlers to add error handling and progress reporting
    '''

    def __call__(self, handler):
        @wraps(handler)
        def decorated(request, *args, **kwargs):
            '''
            kwargs:
                + context
            context:
                + tenant_info:
                    + subdomain: str
                + tasks_collection: PyMongoCollection<'tasks'>
                + notifications_collection: PyMongoCollection<'notifications'>
                + tasks_client: TasksClient
                + pusher_client: PusherClient
                + clean_up()
            request.json:
                + task_id: string
                + role?: 'batch' | 'clean_up'
                + batch_index?: number
            '''

            call = TaskCall(handler, request, *args, **kwargs)
            return call.handle()

        return decorated


task = _TaskDecorator
