import logging
import json
from datetime import datetime, timedelta
import requests
from google.api_core.retry import Retry, if_exception_type

from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.task import is_clear, seconds_ago, BATCH_TIMEOUT
from combocurve.shared.google_auth import get_auth_headers

_WAIT_AFTER_PURGE = 60  # seconds: time to wait after purging a task queue to attempt to finish the task

_START_TIMEOUT = BATCH_TIMEOUT  # seconds: maximum time to wait for a pending task to have its first batch started

_PROGRESS_TIMEOUT = BATCH_TIMEOUT  # seconds: maximum time to wait for a task to have new batches started or ended

_CHECK_INTERVAL = 60  # seconds: how far in the future to reschedule the next check

_CLEAN_UP_START_TIMEOUT = 120  # seconds: maximum time to wait for the clean up phase to start after requested

_CLEAN_UP_TIMEOUT = 540  # seconds: maximum time to wait the clean up phase to end after started

_CLEAN_UP_CHECK_INTERVAL = 60  # seconds: time to wait until the next check when task is on the clean up phase


def _seconds_from_now(seconds):
    return datetime.utcnow() + timedelta(seconds=seconds)


def _to_cron_format(dt):
    return '%d %d %d %d *' % (dt.minute, dt.hour, dt.day, dt.month)


def _log(message, extra=None, level=logging.INFO):
    logging.log(level, message, extra=extra if extra is not None else {})


def _supervisor_log(task_id, message, exception=None):
    formatted_task_id = f'ObjectId("{str(task_id)}")'
    full_message = f'task_id: {formatted_task_id} - {message}'
    metadata = {'task': {'task_id': formatted_task_id}}

    if not exception:
        _log(full_message, {'metadata': metadata})
        return

    error_info = get_exception_info(exception)
    metadata['error'] = error_info
    _log(full_message, {'metadata': metadata}, logging.ERROR)


def _was_clean_up_requested(task):
    return task.get('cleanUpAt') is not None


def _check_clean_up_stall(task):
    requested = task['cleanUpAt']
    clean_up_state = task['cleanUp']
    start = clean_up_state['start']
    end = clean_up_state['end']

    if end is not None:
        # won't really happen with current implementation, since tasks get deleted immediately after clean up
        return False, 'Clean up ended'
    if start is None:
        return seconds_ago(requested) > _CLEAN_UP_START_TIMEOUT, 'Time out waiting for clean up phase to start'
    return seconds_ago(start) > _CLEAN_UP_TIMEOUT, 'Time out waiting for clean up phase to end'


def _check_batch_stall(task):
    most_recent_start = task.get('mostRecentStart')
    most_recent_end = task.get('mostRecentEnd')
    pending_at = task.get('pendingAt')

    # 1 - no batch has started
    if most_recent_start is None:
        if pending_at is None:
            return True, 'Invalid task with "pendingAt" not set'
        return seconds_ago(pending_at) > _START_TIMEOUT, 'Time out waiting for the first batch to start'
    # 2 - no batch has ended
    if most_recent_end is None:
        return seconds_ago(most_recent_start) > _PROGRESS_TIMEOUT, 'Time out waiting for remaining batches to start/end'
    # 3 - some batch has ended
    updated_ago = min(seconds_ago(most_recent_start), seconds_ago(most_recent_end))
    return updated_ago > _PROGRESS_TIMEOUT, 'Time out waiting for remaining batches to start/end'


@Retry(predicate=if_exception_type(requests.HTTPError), deadline=60 * 4)  # 4 min deadline in seconds
def _sync_clean_up(url, headers, body):
    response = requests.post(url, headers=headers, json=body)
    if not response.ok:
        response.raise_for_status()


def _add_fresh_auth(headers, url):
    AUTH_HEADERS = {'Authorization', 'authorization'}
    no_auth_headers = {key: value for (key, value) in headers.items() if key not in AUTH_HEADERS}
    fresh_auth_headers = get_auth_headers(url)
    return {**no_auth_headers, **fresh_auth_headers}


class SupervisorService(object):
    def __init__(self, context):
        self.context = context

    def _reschedule_job(self, task, delay):
        try:
            task_id = task['_id']
            next_time = _seconds_from_now(delay)
            new_schedule = _to_cron_format(next_time)
            job = {'name': task['supervisorJobName'], 'schedule': new_schedule}
            self.context.scheduler_client.update_job(job, ['schedule'])
            _supervisor_log(task_id, f'Next check rescheduled for {next_time.isoformat()}')
        except Exception as e:
            _supervisor_log(task_id, 'Next check reschedule failed:', e)

    def _async_clean_up(self, task, url, headers, body):
        queue = self.context.task_service.get_queue_name(task)
        self.context.tasks_client.add_task(queue=queue,
                                           url=url,
                                           method='POST',
                                           payload=json.dumps(body),
                                           headers=headers)

    def _econ_clean_up(self, task, reason):
        run_id = task['kindId']
        self.context.econ_runs_collection.update_one({'_id': run_id}, {'$set': {
            'status': 'failed',
        }})
        self.context.task_service.finish(task, Exception(reason))

    def _request_clean_up(self, task, reason):
        try:
            task_id = task['_id']
            task_kind = task['kind']

            self.context.tasks_collection.update_one({'_id': task_id}, {'$set': {'cleanUpAt': datetime.utcnow()}})

            if task_kind == 'economics':
                self._econ_clean_up(task, reason)
            else:
                url = self._get_function_path(task)
                headers = _add_fresh_auth(self.context.tenant_info['headers'], url)
                body = {'task_id': str(task_id), 'role': 'clean_up', 'clean_up_reason': reason}

                _sync_clean_up(url, headers, body)

            _supervisor_log(task_id, 'Clean up done synchronously')
        except Exception as e:
            _supervisor_log(task_id, 'Clean up request failed:', e)

    def _get_function_path(self, task):
        SPECIAL_CASES = {
            'economics': 'single_econ',
        }
        kind = task['kind']
        path = SPECIAL_CASES.get(kind, kind.replace('-', '_'))
        return '{}/{}'.format(self.context.cloud_functions_url, path)

    def check(self, task_id):
        '''
            scenarios:
            - task doesn't exist: task already finished
            - task is "stalled":
                - some batches timedout
                - some tasks were not delivered
            - task is aborted: task was set to be aborted
            - task is making progress normally
        '''
        task_service = self.context.task_service

        task = task_service.get_by_id(task_id)

        if task is None:
            _supervisor_log(task_id, 'Task already finished')
            return

        if _was_clean_up_requested(task):
            clean_up_stalled, details = _check_clean_up_stall(task)
            if clean_up_stalled:
                task_service.finish(task, Exception(details))
            else:
                self._reschedule_job(task, _CLEAN_UP_CHECK_INTERVAL)
            return

        stalled, details = _check_batch_stall(task)
        if stalled:
            message = f'Task is stalled: {details}'
            _supervisor_log(task_id, message)
            if task_service.is_queue_empty(task):
                _supervisor_log(task_id, 'Queue is empty')
                self._request_clean_up(task, message)
            else:
                _supervisor_log(task_id, 'Queue is not empty, purging')
                task_service.purge_queue(task)
                self._reschedule_job(task, _WAIT_AFTER_PURGE)
            return

        if task['aborted'] > 0:
            message = 'Task was aborted'
            _supervisor_log(task_id, message)
            if is_clear(task):
                self._request_clean_up(task, message)
            _supervisor_log(task_id, 'Task is not clear, can not finish')

        # still making progress or waiting to finish: reschedule next check
        self._reschedule_job(task, _CHECK_INTERVAL)
