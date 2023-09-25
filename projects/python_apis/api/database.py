'''
    Database connection utilities for App Engine endpoints
'''
import logging

from pymongo import MongoClient

_db_client_cache = {}


def get_db(tenant_info):
    db_connection_string = tenant_info['db_connection_string']
    db_name = tenant_info['db_name']

    client = _db_client_cache.get(db_connection_string)

    if client is None:
        logging.info(f'api.connection.open: db_name: {db_name}')  # noqa
        client = MongoClient(db_connection_string)
        _db_client_cache[db_connection_string] = client
    return client[db_name]
