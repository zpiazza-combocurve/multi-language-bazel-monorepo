from functools import wraps

from .tenant import get_tenant_info
from .database import open_connection


def with_db(handler):
    """
        A decorator to initialize a db connection before executing a cloud function request handler
        and to automatically close it after the handler returns or raises and exception
    """
    @wraps(handler)
    def decorated(request, *argv, **kwargs):
        tenant_info = get_tenant_info(request.headers)
        with open_connection(tenant_info):
            return handler(request, *argv, **kwargs)

    return decorated
