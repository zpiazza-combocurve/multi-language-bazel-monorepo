from contextlib import contextmanager
from os.path import dirname, abspath, join

import yaml

from combocurve.shared.db_context import DbContext
from combocurve.services.data_import.import_service import ImportService
from combocurve.dal.client import DAL


class DevContext(DbContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info)
        self.subdomain = tenant_info['db_name']

        # services
        self.import_service = ImportService(self)
        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])


@contextmanager
def open_context():
    """
    A Context Manager to build a context instance for development and automatically close the db connection

    dev_tenant.yaml
        db_cluster: ''
        db_connection_string: ''
        db_name: ''
        db_password: ''
        db_username: ''

    Examples:
        from dev_context import open_context
        with open_context() as context:
            # your code to do stuff with context
    """
    dir_path = dirname(abspath(__file__))

    with open(join(dir_path, 'dev_tenant.yaml'), 'r') as stream:
        tenant_info = yaml.full_load(stream)

    dev_context = None

    try:
        dev_context = DevContext(tenant_info)
        yield dev_context
    finally:
        if dev_context:
            dev_context.db.client.close()


if __name__ == '__main__':
    with open_context() as context:
        # print(context.db_info['db_name'])
        pass
