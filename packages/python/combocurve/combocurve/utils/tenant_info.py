from typing import TypedDict


class TenantInfo(TypedDict):
    db_cluster: str
    db_connection_string: str
    db_name: str
    db_password: str
    db_username: str

    archive_storage_bucket: str
    batch_storage_bucket: str
    big_query_dataset: str
    econ_storage_bucket: str
    file_storage_bucket: str
    import_queue: str
    pusher_app_id: str
    pusher_cluster: str
    pusher_key: str
    pusher_secret: str
    subdomain: str
    redis_host: str
    redis_port: str

    mapbox_token: str

    headers: str
