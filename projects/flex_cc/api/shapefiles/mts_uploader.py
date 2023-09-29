from time import sleep
from io import BufferedIOBase
from typing import TYPE_CHECKING
from collections.abc import Iterable

import requests

from .utils import (MAPBOX_STATUS_CHECK_DELAY, MAPBOX_UPLOAD_CHECK_RETRIES, MAPBOX_UPLOAD_RETRIES,
                    MAPBOX_UPLOAD_RETRY_DELAY, with_retry)

if TYPE_CHECKING:
    from context import Context

MAPBOX_TILESET_SERVICE_URL = 'https://api.mapbox.com/tilesets/v1'


class MapboxTileServiceUploader:
    def __init__(self, context: 'Context'):
        self.context = context
        self.mapbox_token = self.context.tenant_info['mapbox_token']

    @with_retry(lambda resp: resp.status_code >= 400, MAPBOX_UPLOAD_RETRIES, MAPBOX_UPLOAD_RETRY_DELAY)
    def _post(self, path, **kwargs):
        return requests.post(f'{MAPBOX_TILESET_SERVICE_URL}{path}?access_token={self.mapbox_token}', **kwargs)

    @with_retry(lambda resp: resp.status_code >= 400, MAPBOX_UPLOAD_RETRIES, MAPBOX_UPLOAD_RETRY_DELAY)
    def _get(self, path, **kwargs):
        return requests.get(f'{MAPBOX_TILESET_SERVICE_URL}{path}?access_token={self.mapbox_token}', **kwargs)

    def _create_source(self, user: str, tileset_id: str, data: BufferedIOBase):
        return self._post(f'/sources/{user}/{tileset_id}', files={"file": data}).json()

    def _create_tileset(self, name: str, tileset: str, source_id: str):
        self._post(f'/{tileset}',
                   json={
                       'name': name,
                       'recipe': {
                           'version': 1,
                           'layers': {
                               name: {
                                   'source': source_id,
                                   'minzoom': 4,
                                   'maxzoom': 9,
                                   'features': {
                                       'id': ['get', 'id'],
                                   }
                               }
                           }
                       }
                   })

    def _publish_tileset(self, tileset: str):
        return self._post(f'/{tileset}/publish').json()

    def _wait_for_job(self, tileset: str, job_id: str):
        for _ in range(MAPBOX_UPLOAD_CHECK_RETRIES):
            status = self._get(f'/{tileset}/jobs/{job_id}').json()
            if status['stage'] == 'failed':
                raise PublishTilesetError(status['errors'])
            if status['stage'] == 'success':
                return status
            sleep(MAPBOX_STATUS_CHECK_DELAY)

    def upload(self, data: BufferedIOBase, name: str, tileset: str):
        [user, id] = tileset.split('.')

        source = self._create_source(user, id, data)
        self._create_tileset(name, tileset, source['id'])
        job = self._publish_tileset(tileset)
        status = self._wait_for_job(tileset, job['jobId'])

        return status['tilesetId']


class PublishTilesetError(Exception):
    def __init__(self, errors: Iterable[str]):
        error_lines = '\n'.join(errors)
        message = f'The following errors were found while trying to publish the tileset:\n{error_lines}'
        super().__init__(message)
