from typing import List, Iterable
from io import TextIOBase, StringIO, BytesIO, TextIOWrapper

from bson import ObjectId
from bson.json_util import dumps, loads
from pymongo.collection import Collection
from google.api_core.exceptions import NotFound

from combocurve.shared.gcp_buckets import GCPBuckets
from combocurve.shared.helpers import split_in_chunks
from combocurve.utils.storage import batch_delete_with_retry

# 100 is the max recommended calls in a single batch request for GCS batches
# https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch
_DELETE_BLOBS_BATCH_SIZE = 100

GCS_TIMEOUT = 300  # 5 mn (default of 1mn)


class ArchiveStoreService:
    def __init__(self, storage_client, gcp_buckets: GCPBuckets):
        self.storage_client = storage_client
        self.gcp_buckets = gcp_buckets

    def store_docs_to_file(self, collection: Collection, file: TextIOBase, query=None):
        query = {} if query is None else query
        docs = collection.find(query)
        self._write_lines(file, docs)

    def store_production_dal_rows_to_file(self, file: TextIOBase, rows):
        self._write_lines(file, rows)

    def store_docs_to_gcs(self, collection: Collection, file_name: str, query=None):
        self._store_to_gcs(file_name, lambda file: self.store_docs_to_file(collection, file, query))

    def store_production_dal_rows_to_gcs(self, file_name: str, rows):
        self._store_to_gcs(file_name, lambda file: self.store_production_dal_rows_to_file(file, rows))

    def store_ids_to_file(self, ids: List[ObjectId], file: TextIOBase):
        file.writelines(str(id) + '\n' for id in ids)

    def store_ids_to_gcs(self, ids: List[ObjectId], file_name: str):
        self._store_to_gcs(file_name, lambda file: self.store_ids_to_file(ids, file))

    def load_docs_from_file(self, file: TextIOBase) -> Iterable[dict]:
        return (loads(line) for line in file)

    def load_docs_from_gcs(self, file_name: str) -> List[dict]:
        return self._load_from_file(file_name, lambda file: list(self.load_docs_from_file(file)))

    def load_ids_from_file(self, file: TextIOBase) -> Iterable[ObjectId]:
        return (ObjectId(line.strip()) for line in file)

    def load_ids_from_gcs(self, file_name) -> List[ObjectId]:
        try:
            return self._load_from_file(file_name, lambda file: list(self.load_ids_from_file(file)))
        except NotFound:
            # this usually happens if new collections were added after the project was
            # archived so the file for that collection doesn't exist in google storage
            return []

    def _write_lines(self, file: TextIOBase, rows):
        file.writelines(dumps(row, separators=(',', ':')) + '\n' for row in rows)

    def _store_to_gcs(self, file_name: str, writer):
        bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])
        with StringIO() as buffer:
            writer(buffer)
            buffer.seek(0)
            bucket.blob(file_name).upload_from_file(buffer, timeout=GCS_TIMEOUT)

    def _load_from_file(self, file_name: str, reader):
        bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])
        with BytesIO() as buffer:
            bucket.blob(file_name).download_to_file(buffer)
            buffer.seek(0)
            text_file = TextIOWrapper(buffer)
            return reader(text_file)

    @staticmethod
    def _delete_blobs_by_batch(blobs, bucket):
        for batch in split_in_chunks(blobs, _DELETE_BLOBS_BATCH_SIZE):
            batch_delete_with_retry(bucket.client, batch)

    def delete_gcs_directory(self, directory_name: str):
        bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])
        blobs = bucket.client.list_blobs(bucket, prefix=directory_name)
        self._delete_blobs_by_batch(blobs, bucket)

    def delete_gcs_files(self, file_names: List[str], bucket_name: str):
        bucket = self.storage_client.get_bucket(bucket_name)
        blobs = (bucket.blob(f) for f in file_names)
        self._delete_blobs_by_batch(blobs, bucket)

    def list_files(self, prefix, exclude=set()) -> Iterable[str]:
        bucket = self.storage_client.get_bucket(self.gcp_buckets['archive_storage_bucket'])
        blobs = bucket.client.list_blobs(bucket, prefix=prefix)
        return (b.name for b in blobs if b.name not in exclude)

    def copy_blob(self, blob_name, source_storage_bucket, new_blob_name, target_storage_bucket):
        if source_storage_bucket.blob(blob_name).exists():
            source_blob = source_storage_bucket.blob(blob_name)
            source_storage_bucket.copy_blob(source_blob, target_storage_bucket, new_blob_name)
