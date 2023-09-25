from combocurve.shared.database import get_db
from combocurve.utils.db_info import DbInfo


class ConcurrentBaseContext:
    '''
        Base context class including db initialization.

        For services with instances that handle multiple concurrent requests potentially from different tenants,
        i.e., App Engine and Cloud Run services.
        Added with the idea of DRYing similar implementations we have across our codebase.

        Based on https://github.com/insidepetroleum/flex-combocurve/blob/master/shared/db_context.py
    '''
    def __init__(self, db_info: DbInfo):
        self.db_info = db_info

        db_name = self.db_info['db_name']
        db_connection_string = self.db_info['db_connection_string']

        self.db = get_db(db_name, db_connection_string)
