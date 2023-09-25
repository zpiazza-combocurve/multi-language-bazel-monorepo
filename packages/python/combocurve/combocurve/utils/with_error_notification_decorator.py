from typing import Union
from functools import wraps

from bson import ObjectId

from combocurve.utils.exceptions import get_exception_info
from combocurve.services.notification_service import NotificationService


def with_error_notification(notification_service: NotificationService, notification_id: Union[ObjectId, str]):
    """
        Decorator for updating a notification to failed for any uncaught exception. The exception is then re-raised.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_info = get_exception_info(e)
                notification_service.update_notification_with_notifying_target(
                    notification_id, {
                        'status': 'failed',
                        'extra.error': error_info['message'] if error_info['expected'] else 'Failed. Please, try again.'
                    })
                raise
        return wrapper

    return decorator
