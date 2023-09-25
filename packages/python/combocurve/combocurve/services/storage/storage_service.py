from typing import IO
from io import StringIO, BytesIO

from google.cloud.storage import Blob

from combocurve.utils.storage import batch_delete_with_retry, combine_storage_files
from combocurve.shared.collections import split_in_chunks


class StorageService:
    def __init__(self, context):
        self.context = context

    def _get_bucket(self, bucket_name):
        return self.context.cloud_storage_client.client.bucket(bucket_name)

    def write_from_file(self, bucket: str, file_name: str, file: IO):
        file.seek(0)
        blob = self._get_bucket(bucket).blob(file_name)
        blob.upload_from_file(file)
        return blob

    def write_from_string(self, bucket: str, file_name: str, data: str):
        blob = self._get_bucket(bucket).blob(file_name)
        blob.upload_from_string(data)
        return blob

    def _download_as_text(self, blob: Blob):
        text = blob.download_as_text()
        return StringIO(text)

    def _download_as_binary(self, blob: Blob):
        data = blob.download_as_bytes()
        return BytesIO(data)

    def read_to_file(self, bucket: str, file_name: str, as_text=True):
        blob = self._get_bucket(bucket).blob(file_name)
        return self._download_as_text(blob) if as_text else self._download_as_binary(blob)

    def exists(self, bucket: str, file_name: str):
        return self._get_bucket(bucket).blob(file_name).exists()

    def bulk_delete(self, bucket: str, prefix: str):
        blobs = self._get_bucket(bucket).list_blobs(prefix=prefix)
        for batch in split_in_chunks(blobs, 100):
            batch_delete_with_retry(self.context.cloud_storage_client.client, batch)

    def merge_files(self,
                    bucket: str,
                    prefix: str,
                    suffix: str,
                    header_file: str,
                    content_type='text/csv',
                    extension='.csv'):
        storage_bucket = self._get_bucket(bucket)
        header_blob = storage_bucket.blob(header_file)
        return combine_storage_files(
            self.context.cloud_storage_client.client,
            storage_bucket,
            prefix,
            suffix,
            content_type,
            header_blob,
            extension,
        )

    def move_file(self, source_bucket: str, destination_bucket: str, file_name: str, new_file_name: str = None):
        if new_file_name is None:
            new_file_name = file_name

        src_bucket = self._get_bucket(source_bucket)
        dest_bucket = self._get_bucket(destination_bucket)

        src_blob = src_bucket.blob(file_name)
        dst_blob = dest_bucket.blob(new_file_name)

        rewrite_token = ''
        while rewrite_token is not None:
            rewrite_token, _, _ = dst_blob.rewrite(src_blob, token=rewrite_token)

        src_blob.delete()

        return dst_blob

    def read_all_to_open_files(self, bucket: str, prefix: str, as_text=True):
        blobs = self._get_bucket(bucket).list_blobs(prefix=prefix)
        download_fn = self._download_as_text if as_text else self._download_as_binary
        return (download_fn(b) for b in blobs)

    def read_all_to_managed_files(self, bucket: str, prefix: str, as_text=True):
        for file in self.read_all_to_open_files(bucket, prefix, as_text):
            with file as managed_file:
                yield managed_file
