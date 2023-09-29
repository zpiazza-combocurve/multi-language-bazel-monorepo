from google.cloud import storage

_storage_client = None


class GoogleServices:
    def __init__(self, file_bucket_name):
        global _storage_client

        if _storage_client is None:
            _storage_client = storage.Client()
        self.storage_client = _storage_client
        self.storage_bucket = self.storage_client.get_bucket(file_bucket_name)
