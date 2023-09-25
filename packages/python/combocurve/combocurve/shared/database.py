from mongoengine import connect, disconnect, register_connection, DEFAULT_CONNECTION_NAME
from pymongo import MongoClient
from pymongo.database import Database


def get_db(db_name, connection_string) -> Database:
    try:
        # disconnecting the alias first lets us rotate passwords and avoid an error where the same alias
        # is used with a different connection string. If the alias is not yet used this is a no-op
        disconnect(alias=db_name)
        client: MongoClient = connect(db=db_name, alias=db_name, host=connection_string)

        # mongoengine needs a default connection (see https://github.com/MongoEngine/mongoengine/issues/604),
        # so the last connection created is also registered as default
        register_connection(DEFAULT_CONNECTION_NAME, db_name, host=connection_string)

        return client[db_name]
    except Exception as e:
        raise e


def disconnect_db(db_name):
    disconnect(alias=db_name)
