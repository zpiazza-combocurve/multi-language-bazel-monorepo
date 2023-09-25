import logging
from functools import wraps

from combocurve.utils.exceptions import get_exception_info


def single_run_schedule_job(handler):
    """
        A decorator to delete a scheduler job after it finishes, even if there is an error.
        Requires a context with an attribute `scheduler_client` of type `combocurve.utils.scheduler.SchedulerClient`.
    """
    @wraps(handler)
    def decorated(request, context, *argv, **kwargs):
        try:
            return handler(request, context, *argv, **kwargs)
        finally:
            job_id = request.json.get('jobId')
            if job_id:
                try:
                    job_name = context.scheduler_client.get_job_name(job_id)
                    context.scheduler_client.delete_job(job_name)
                except Exception as e:
                    error_info = get_exception_info(e)
                    log_message = error_info['message']
                    log_extra = {
                        'metadata': {
                            'error': error_info
                        },
                    }
                    logging.error(log_message, extra=log_extra)

    return decorated
