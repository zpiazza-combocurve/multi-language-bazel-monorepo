import logging

from combocurve.utils.exceptions import get_exception_info


def log_error(error: Exception, base_message: str = '{}'):
    error_info = get_exception_info(error)
    try:
        message = base_message.format(error_info['message'])
    except (KeyError, IndexError):
        message = base_message
    logging.error(message, extra={'metadata': {'error': error_info}})
