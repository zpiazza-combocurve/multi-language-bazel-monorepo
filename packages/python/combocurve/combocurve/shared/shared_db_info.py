from .secret_manager import SecretManager
from .mongodb import build_connection_string

def _get_shared_db_info(gcp_primary_project_id):
    secret_manager = SecretManager(gcp_primary_project_id)
    username = secret_manager.access_secret('dbUsername')
    password = secret_manager.access_secret('dbPassword')
    cluster = secret_manager.access_secret('dbCluster')
    database = secret_manager.access_secret('dbName')

    connection_string = build_connection_string(username=username,
                                                password=password,
                                                cluster=cluster,
                                                database=database)

    return connection_string, database


def get_shared_db_tenant_info(gcp_primary_project_id):
    connection_string, database = _get_shared_db_info(gcp_primary_project_id)
    return {
        'shared_db_connection_string': connection_string,
        'shared_db_name': database,
    }
