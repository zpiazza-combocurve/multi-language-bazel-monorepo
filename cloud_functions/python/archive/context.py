import logging

from combocurve.dal.client import DAL
from combocurve.shared.config import ENVIRONMENT
from combocurve.shared.db_context import DbContext
from combocurve.utils.db_info import DbInfo
from combocurve.utils.logging import setup_cloud_logging, config_tenant_logging, AppType
from cloud_functions.archive.google_cloud import GoogleServices


class ArchiveCFContext(DbContext):

    def __init__(self, tenant_info):
        self.tenant_info = tenant_info

        db_info: DbInfo = {
            'db_cluster': tenant_info['db_cluster'],
            'db_name': tenant_info['db_name'],
            'db_password': tenant_info['db_password'],
            'db_username': tenant_info['db_username'],
            'db_connection_string': tenant_info['db_connection_string']
        }

        super().__init__(db_info)
        self.subdomain = tenant_info['subdomain']
        self.google_services = GoogleServices()
        self.dal = DAL.connect(tenant_info['subdomain'], tenant_info['headers']['inpt-dal-url'])

        # logging
        if ENVIRONMENT != 'development' or not __debug__:
            setup_cloud_logging(logger_name='archive-cloud-function',
                                app_type=AppType.CLOUD_FUNCTION,
                                min_level=logging.DEBUG)
            config_tenant_logging(tenant_info, use_as_default=True, app_type=AppType.CLOUD_FUNCTION)

    def clean_up(self, task, success):
        pass
