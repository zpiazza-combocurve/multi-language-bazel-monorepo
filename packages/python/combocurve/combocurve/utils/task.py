from datetime import datetime

BATCH_TIMEOUT = 6 * 60


def _from_iso_str(date_str):
    return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")


def seconds_ago(date):
    if type(date) == str:
        date = _from_iso_str(date)
    return int((datetime.utcnow() - date).total_seconds())


def _get_processed_batches(task):
    return [batch for batch in task['batches'] if batch['processed'] > 0]


def _has_ended(batch):
    if batch['end'] is not None:
        return True
    if batch['start'] is None:
        return False
    return seconds_ago(batch['start']) > BATCH_TIMEOUT


def is_clear(task):
    return all(_has_ended(batch) for batch in _get_processed_batches(task))


_FAILURE_THRESHOLD_RATIO = 0.5

_FAILURE_THRESHOLD_MAX = 10


def is_over_failure_threshold(task, failed):
    progress = task['progress']
    failure_count = progress['failed'] + (1 if failed else 0)
    failure_rate = failure_count / progress['total']
    return failure_rate > _FAILURE_THRESHOLD_RATIO or failure_count > _FAILURE_THRESHOLD_MAX


def is_last(task):
    return all(_has_ended(batch) for batch in task['batches'])


def was_batch_repeated(task, batch_index):
    return task['batches'][batch_index]['processed'] > 1


def format_id(id):
    if id is None:
        return 'null'
    return f'ObjectId("{str(id)}")'


def format_date(date):
    if not isinstance(date, datetime):
        return date
    return date.isoformat() + 'Z'  # this assumes all datetimes are in UTC


def get_basic_task_data(task):
    return {
        'task_id': format_id(task['_id']),
        'kind': task['kind'],
        'kind_id': format_id(task['kindId']),
        'user_id': format_id(task.get('user')),
        'queue_name': task.get('queueName', 'N/A'),
        'supervisor_job_name': task.get('supervisorJobName')
    }


def get_task_data(task):
    basic_data = get_basic_task_data(task)
    clean_up_state = task.get('cleanUp')

    return {
        **basic_data, 'created_at': format_date(task['createdAt']),
        'pending_at': format_date(task.get('pendingAt')),
        'last_start_at': format_date(task.get('mostRecentStart')),
        'last_end_at': format_date(task.get('mostRecentEnd')),
        'clean_up_request_at': format_date(task.get('cleanUpAt', 'N/A')),
        'clean_up_start_at': format_date(clean_up_state['start'] if clean_up_state else 'N/A'),
        'total_count': task['progress']['total'],
        'started_count': sum([1 if batch['start'] else 0 for batch in task['batches']]),
        'ended_count': sum([1 if batch['end'] else 0 for batch in task['batches']]),
        'success_count': task['progress']['complete'],
        'retried_count': sum([1 if batch['processed'] > 1 else 0 for batch in task['batches']])
    }


def get_print_summary(task):
    data = get_task_data(task)

    return '\n'.join([
        '================================ TASK SUMMARY ================================',
        f'Task.................{data["task_id"]}',
        f'Kind.................{data["kind_id"]} <{data["kind"]}>',
        f'User.................{data["user_id"]}',
        f'Queue................{data["queue_name"]}',
        f'Supervisor Job.......{data["supervisor_job_name"]}',
        '',
        f'Created..............{data["created_at"]}',
        f'Pending..............{data["pending_at"]}',
        f'Last Batch Start.....{data["last_start_at"]}',
        f'Last Batch End.......{data["last_end_at"]}',
        f'Clean Up Request.....{data["clean_up_request_at"]}',
        f'Clean Up Start.......{data["clean_up_start_at"]}',
        '',
        f'Total................{data["total_count"]}',
        f'Started..............{data["started_count"]} (-{data["total_count"] - data["started_count"]})',
        f'Ended................{data["ended_count"]} (-{data["total_count"] - data["ended_count"]})',
        f'..Successful.........{data["success_count"]} (-{data["ended_count"] - data["success_count"]})',
        f'Retried..............{data["retried_count"]}',
        '==============================================================================',
    ])
