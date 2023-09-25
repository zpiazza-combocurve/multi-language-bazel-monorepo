from typing import TypedDict

class GCPBuckets(TypedDict):
    file_storage_bucket: str
    batch_storage_bucket: str
    econ_storage_bucket: str
    archive_storage_bucket: str
