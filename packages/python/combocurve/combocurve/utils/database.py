"""
    Database connection utilities for Cloud Functions endpoints only
"""
from contextlib import contextmanager
from pymongo import MongoClient
from .tenant_info import TenantInfo

_db = None


@contextmanager
def open_connection(tenant_info: TenantInfo):
    """
        A ContextManager to provide a block with a db connection and automatically close it after the block is executed
    """
    global _db

    db_connection_string = tenant_info['db_connection_string']
    db_name = tenant_info['db_name']

    client = MongoClient(db_connection_string)
    _db = client[db_name]

    try:
        yield _db
    finally:
        client.close()
        _db = None


def get_connected_db():
    global _db
    return _db


def set_connected_db(db):
    '''
        Allows to set a db which connection was opened in a different way, ie: by MongoEngine
    '''
    global _db
    _db = db


def clear_connected_db():
    '''
        Allows to clear a db which connection was closed in a different way, ie: by MongoEngine
    '''
    global _db
    _db = None
