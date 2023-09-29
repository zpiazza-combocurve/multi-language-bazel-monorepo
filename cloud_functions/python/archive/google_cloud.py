from google.cloud import storage


class GoogleServices:
    def __init__(self):
        self.storage_client = storage.Client()
