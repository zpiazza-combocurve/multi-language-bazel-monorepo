from mongoengine import get_db


def get_session_collection(db_name):
    return get_db(db_name)['sessions']
