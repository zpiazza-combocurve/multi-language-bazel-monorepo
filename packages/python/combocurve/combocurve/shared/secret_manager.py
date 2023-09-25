from google.cloud import secretmanager


class SecretManager:
    def __init__(self, project: str):
        self._project = project
        self._client = secretmanager.SecretManagerServiceClient()

    def _get_name(self, secret_id: str, version_id: str):
        return f'projects/{self._project}/secrets/{secret_id}/versions/{version_id}'

    def access_secret(self, secret_id: str, version_id: str = 'latest'):
        name = self._get_name(secret_id, version_id)
        response = self._client.access_secret_version(request={'name': name})
        return response.payload.data.decode('UTF-8')
