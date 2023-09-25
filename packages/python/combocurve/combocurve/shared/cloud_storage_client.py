from google.cloud import storage


class CloudStorageClient(object):
    def __init__(self):
        self.client = storage.Client()
