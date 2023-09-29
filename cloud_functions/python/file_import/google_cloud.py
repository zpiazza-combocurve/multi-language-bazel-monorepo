from google.cloud import storage


class GoogleServices:
    def __init__(self, batch_bucket_name):
        self.storage_client = storage.Client()
        self.storage_batches_bucket = self.storage_client.get_bucket(batch_bucket_name)
