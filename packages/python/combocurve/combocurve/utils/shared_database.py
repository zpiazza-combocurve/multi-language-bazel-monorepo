from contextlib import contextmanager
from pymongo import MongoClient

_shared_db_client = None


def get_connected_shared_db(tenant_info):
    global _shared_db_client

    db_connection_string = tenant_info['shared_db_connection_string']
    db_name = tenant_info['shared_db_name']

    if _shared_db_client is None:
        _shared_db_client = MongoClient(db_connection_string)

    return _shared_db_client[db_name]


def close_connection():
    global _shared_db_client
    if _shared_db_client:
        _shared_db_client.close()
        _shared_db_client = None


@contextmanager
def open_connection(tenant_info):
    '''
        A ContextManager to provide a block with a shared db connection and automatically close it after the
        block is executed
    '''
    try:
        yield get_connected_shared_db(tenant_info)
    finally:
        close_connection()
