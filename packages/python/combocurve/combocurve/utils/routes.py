import logging
import time
from functools import wraps, partial

from flask import request as flask_request, jsonify

from .exceptions import get_exception_info
from .logging import reset_logging_metadata


def complete_routing(handler=None, *, formatter=jsonify):
    '''
        A decorator to add error handling to Flask route handlers
    '''

    if handler is None:
        return partial(complete_routing, formatter=formatter)

    @wraps(handler)
    def decorated(*args, **kwargs):
        try:
            handler_with_logs = log_request_error(request=flask_request)(handler)
            ret = handler_with_logs(*args, **kwargs)
            return formatter(ret), 200
        except Exception as e:
            error_info = get_exception_info(e)
            status = 400 if error_info['expected'] else 500
            return formatter({'error': error_info}), status

    return decorated


def complete_routing_cf(handler=None, *, formatter=jsonify):
    '''
        A decorator to add error handling to Cloud Functions
    '''

    if handler is None:
        return partial(complete_routing_cf, formatter=formatter)

    @wraps(handler)
    def decorated(request, *argv, **kwargs):
        try:
            handler_with_logs = log_request_error(request=request)(handler)
            ret = handler_with_logs(request, *argv, **kwargs)
            return formatter(ret), 200
        except Exception as e:
            error_info = get_exception_info(e)
            status = 400 if error_info['expected'] else 500
            return formatter({'error': error_info}), status

    return decorated


def log_cloud_function_crashes(handler):
    '''
        A decorator to log uncaught exceptions on Cloud Functions
        See this issue: https://issuetracker.google.com/issues/155215191
    '''
    @wraps(handler)
    def decorated(request, *argv, **kwargs):
        handler_with_logs = log_request_error(request=request)(handler)
        try:
            return handler_with_logs(request, *argv, **kwargs)
        except Exception as e:
            time.sleep(30)
            raise e

    return decorated


def log_request_error(handler=None, *, request=None):
    if handler is None:
        return partial(log_request_error, request=request)

    @wraps(handler)
    def decorated(*args, **kwargs):
        start = time.time()
        try:
            reset_logging_metadata()  # do it also at the start of the request just in case
            return handler(*args, **kwargs)
        except Exception as e:
            duration = time.time() - start

            error_info = get_exception_info(e)
            status = 400 if error_info['expected'] else 500

            log_message = error_info['message']
            log_extra = {
                'metadata': {
                    'error': error_info
                },
                'http_request': _get_request_info(status, duration, request)
            }
            if error_info['expected']:
                logging.warning(log_message, extra=log_extra)
            else:
                logging.error(log_message, extra=log_extra)

            raise e
        finally:
            reset_logging_metadata()

    return decorated


def _get_request_info(status, duration, request=None):
    request_info = {
        'status': status,
        'latency': f'{round(duration, 9)}s',
    }
    if request is not None:
        request_info.update({
            'requestMethod': getattr(request, 'method', None),
            'requestUrl': getattr(request, 'url', None),
            'userAgent': getattr(getattr(request, 'user_agent', None), 'string', None),
            'remoteIp': getattr(request, 'remote_addr', None),
            'serverIp': getattr(request, 'origin', None),
            'referer': getattr(request, 'referrer', None),
            'protocol': getattr(request, 'environ', {}).get('SERVER_PROTOCOL')
        })
    return request_info
