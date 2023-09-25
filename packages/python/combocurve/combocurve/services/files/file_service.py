from typing import Optional
from bson import ObjectId
from google.cloud.storage import Blob

BYTES_IN_MEBIBYTE = (1 << 20)


class FileService:
    def __init__(self, context):
        self.context = context

    def create_file(self, blob: Blob, user: Optional[ObjectId] = None, project: Optional[ObjectId] = None):
        res = self.context.files_collection.insert_one({
            'name': blob.name,
            'gcpName': blob.name,
            'type': blob.content_type,
            'bSize': blob.size,
            'mbSize': blob.size / BYTES_IN_MEBIBYTE,
            'createdBy': user,
            'project': project,
        })
        return res.inserted_id

    def upload_file_from_string(self, string_data, file_data, user_id=None, project_id=None):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_data['name'])

        # upload_from_string can take bytes or string, can use io.StringIO().getvalue() or io.BytesIO().getvalue()
        blob.upload_from_string(string_data, content_type=file_data['type'])
        return self.create_file(blob, user_id, project_id)

    def create_file_from_gcp_name(self, gcp_name, user_id=None, project_id=None):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.get_blob(gcp_name)
        return self.create_file(blob, user_id, project_id)
