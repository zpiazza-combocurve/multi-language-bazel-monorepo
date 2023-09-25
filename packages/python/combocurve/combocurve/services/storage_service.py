from typing import IO
from io import StringIO, BytesIO

from google.cloud.storage import Blob

from combocurve.utils.storage import batch_delete_with_retry
from combocurve.shared.collections import split_in_chunks


class StorageService:
    def __init__(self, context):
        self.context = context

    def _get_bucket(self, bucket_name):
        return self.context.google_services.storage_client.bucket(bucket_name)

    def write_from_file(self, bucket: str, file_name: str, file: IO, content_type='text/plain'):
        file.seek(0)
        blob = self._get_bucket(bucket).blob(file_name)
        blob.upload_from_file(file, content_type=content_type)
        return blob

    def write_from_string(self, bucket: str, file_name: str, data: str, content_type='text/plain'):
        blob = self._get_bucket(bucket).blob(file_name)
        blob.upload_from_string(data, content_type=content_type)
        return blob

    def read_as_string(self, bucket: str, file_name: str):
        blob = self._get_bucket(bucket).blob(file_name)
        return blob.download_as_text()

    def _download_as_text(self, blob: Blob):
        text = blob.download_as_text()
        return StringIO(text)

    def _download_as_binary(self, blob: Blob):
        data = blob.download_as_bytes()
        return BytesIO(data)

    def bulk_delete(self, bucket: str, prefix: str):
        blobs = self._get_bucket(bucket).list_blobs(prefix=prefix)
        for batch in split_in_chunks(blobs, 100):
            batch_delete_with_retry(self.context.google_services.storage_client, batch)

    def read_all_to_open_files(self, bucket: str, prefix: str, as_text=True):
        blobs = self._get_bucket(bucket).list_blobs(prefix=prefix)
        download_fn = self._download_as_text if as_text else self._download_as_binary
        return (download_fn(b) for b in blobs)

    def read_all_to_open_files_with_count(self, bucket: str, prefix: str, as_text=True):
        blobs = list(self._get_bucket(bucket).list_blobs(prefix=prefix))
        download_fn = self._download_as_text if as_text else self._download_as_binary
        return (download_fn(b) for b in blobs), len(blobs)
