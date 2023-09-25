import os
from io import BytesIO

from mongoengine.errors import NotUniqueError
from google.api_core.retry import Retry
from google.cloud.storage import Blob
from google.cloud.exceptions import NotFound

from combocurve.shared.google_auth import get_credentials_with_token


class FileNameError(Exception):
    expected = True


_has_gac = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') is not None


def _sign_url(blob, options):
    if _has_gac:
        explicit_credentials = {}
    else:
        credentials = get_credentials_with_token()
        explicit_credentials = {
            'service_account_email': credentials.service_account_email,
            'access_token': credentials.token
        }
    return blob.generate_signed_url(**options, **explicit_credentials)


class FileService(object):
    def __init__(self, context):
        self.context = context
        self._storage_bucket = self.context.google_services.storage_bucket

    def create_file(self, file_data):
        if 'bSize' not in file_data:
            blob = self._storage_bucket.blob(file_data['gcpName'])
            blob.reload()
            file_data['bSize'] = blob.size
        if 'mbSize' not in file_data:
            file_data['mbSize'] = file_data['bSize'] / (1 << 20)

        try:
            return self.context.file_model(
                name=file_data['name'] if 'name' in file_data else None,
                gcpName=file_data['gcpName'] if 'gcpName' in file_data else None,
                type=file_data['type'] if 'type' in file_data else None,
                bSize=file_data['bSize'] if 'bSize' in file_data else None,
                mbSize=file_data['mbSize'] if 'mbSize' in file_data else None,
                createdBy=file_data['user'] if 'user' in file_data else None,
                project=file_data['project'] if 'project' in file_data else None).save().to_mongo().to_dict()
        except NotUniqueError:
            raise FileNameError('File name already exists')

    def get_url(self, gcp_name, options):
        blob = self._storage_bucket.blob(gcp_name)
        return _sign_url(blob, options)

    def get_bucket_files(self):
        return [blob.name for blob in self._storage_bucket.list_blobs()]

    def download_file(self, gcp_name, download_name=None):
        return self._storage_bucket.blob(gcp_name).download_to_filename(
            download_name if download_name is not None else gcp_name)

    def download_to_memory(self, gcp_name):
        buffer = BytesIO()
        try:
            self._storage_bucket.blob(gcp_name).download_to_file(buffer)
        except NotFound:
            raise MissingFile(f"File {gcp_name} not found.")
        return buffer

    def get_actual_file_size(self, gcp_name):
        blob = self._storage_bucket.get_blob(gcp_name)
        if blob is None:
            raise MissingFile(f"File {gcp_name} not found.")
        return blob.size

    def get_file(self, id):
        return self.context.file_model.objects.get(id=id)

    def get_files(self, ids):
        return self.context.file_model.objects(id__in=ids)

    def upload_file(self, file, file_data, user_id=None, project_id=None):
        blob = Blob(file_data['gcpName'], self._storage_bucket)
        blob.upload_from_file(file, content_type=file_data['type'])
        if user_id is not None:
            file_data['user'] = user_id
        if project_id is not None:
            file_data['project'] = project_id
        return self.create_file(file_data)

    def upload_file_from_string(self, string_data, file_data, user_id=None, project_id=None):
        blob = Blob(file_data['gcpName'], self._storage_bucket)
        # upload_from_string can take bytes or string, can use io.StringIO().getvalue() or io.BytesIO().getvalue()
        blob.upload_from_string(string_data, content_type=file_data['type'])
        if user_id is not None:
            file_data['user'] = user_id
        if project_id is not None:
            file_data['project'] = project_id
        return self.create_file(file_data)

    def upload_file_from_path(self, file_path, file_data, user_id=None, project_id=None):
        blob = Blob(file_data['gcpName'], self._storage_bucket)
        blob.upload_from_filename(file_path, content_type=file_data['type'])
        if user_id is not None:
            file_data['user'] = user_id
        if project_id is not None:
            file_data['project'] = project_id
        return self.create_file(file_data)

    @Retry(deadline=30)
    def delete_file(self, gcp_name):
        try:
            self._storage_bucket.blob(gcp_name).delete()
        except NotFound:
            pass

        return self.context.file_model.objects(gcpName=gcp_name).delete()


class MissingFile(Exception):
    expected = True
