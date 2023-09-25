from functools import wraps
from contextlib import contextmanager

from combocurve.utils.tenant import get_tenant_info, TenantInfo
from combocurve.utils.database import set_connected_db, clear_connected_db
from combocurve.shared.database import get_db, disconnect_db


@contextmanager
def _open_connection(tenant_info: TenantInfo):
    """
        A ContextManager to provide a block with a db connection and automatically close it after the block is executed
        Fork from combocurve.utils.database.open_connection but for MongoEngine
    """
    db_connection_string = tenant_info['db_connection_string']
    db_name = tenant_info['db_name']

    db = get_db(db_name, db_connection_string)

    set_connected_db(db)

    try:
        yield db
    finally:
        disconnect_db(db_name)
        clear_connected_db()


def with_db(handler):
    """
        A decorator to initialize a db connection before executing a cloud function request handler
        and to automatically close it after the handler returns or raises and exception
        Fork from combocurve.utils.with_db_decorator.with_db but for MongoEngine
    """
    @wraps(handler)
    def decorated(request, *argv, **kwargs):
        tenant_info = get_tenant_info(request.headers)
        with _open_connection(tenant_info):
            return handler(request, *argv, **kwargs)

    return decorated
