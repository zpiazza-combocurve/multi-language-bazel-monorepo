"""
    Utility to extract tenant info from request headers
"""
from .tenant_info import TenantInfo

TENANT_HEADER_MAPPINGS = [('db_connection_string', 'inpt-db-connection-string'),
                          ('db_name', 'inpt-db-name'),
                          ('db_username', 'inpt-db-username'),
                          ('db_password', 'inpt-db-password'),
                          ('db_cluster', 'inpt-db-cluster'),
                          ('pusher_app_id', 'inpt-pusher-app-id'),
                          ('pusher_key', 'inpt-pusher-key'),
                          ('pusher_secret', 'inpt-pusher-secret'),
                          ('pusher_cluster', 'inpt-pusher-cluster'),
                          ('econ_storage_bucket', 'inpt-econ-storage-bucket'),
                          ('big_query_dataset', 'inpt-big-query-dataset'),
                          ('subdomain', 'subdomain'),
                          ('file_storage_bucket', 'inpt-file-storage-bucket'),
                          ('batch_storage_bucket', 'inpt-batch-storage-bucket'),
                          ('archive_storage_bucket', 'inpt-archive-storage-bucket'),
                          ('import_queue', 'inpt-import-queue'),
                          ('shared_db_connection_string', 'inpt-shared-db-connection-string'),
                          ('shared_db_name', 'inpt-shared-db-name'),
                          ('redis_host', 'inpt-redis-host'),
                          ('redis_port', 'inpt-redis-port'),
                          ('mapbox_token', 'inpt-mapbox-token')]  # yapf: disable


class MissingTenantHeadersError(Exception):
    expected = True


def warn_missing_info(tenant_info):
    missing = [key for key in tenant_info if tenant_info[key] is None]
    message = 'Missing tenant info: ' + ', '.join(missing) if len(missing) > 0 else ''
    if message:
        print(message)  # noqa: T001


def get_tenant_info(headers) -> TenantInfo:
    tenant_info = {dest_key: headers.get(source_key) for (dest_key, source_key) in TENANT_HEADER_MAPPINGS}
    tenant_info['headers'] = headers
    warn_missing_info(tenant_info)
    return tenant_info
