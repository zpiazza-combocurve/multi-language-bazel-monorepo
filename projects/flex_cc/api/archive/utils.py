from datetime import datetime
from pytz import timezone
from urllib.parse import urlparse
import logging
import requests

from retry import retry

from bson import ObjectId
from combocurve.shared.google_auth import get_auth_headers

from combocurve.shared.urls import get_cf_url, get_migrate_cf_url

FILES_BATCH_SIZE = 100

_RETRIES = 5

_DELAY = 3


def generate_version_name(time_zone='UTC') -> str:
    return datetime.now(timezone(time_zone)).strftime("%Y-%m-%dT%H:%M:%S")


def get_storage_directory(project_id, version_name) -> str:
    return f'{project_id}-{version_name}'  # might be changed later


def get_docs_file_name(storage_directory, collection_name: str, index: str = '') -> str:
    suffix = f'_{index}' if index else '_'
    return f'{storage_directory}/{collection_name}{suffix}'


def get_ids_file_name(storage_directory, collection_name: str) -> str:
    return f'{storage_directory}/{collection_name}_ids'


@retry((requests.HTTPError), tries=_RETRIES, delay=_DELAY, logger=logging)
def make_cf_request(cloud_function_name, body, headers):
    url = get_cf_url(cloud_function_name)
    auth_headers = get_auth_headers(url)
    resp = requests.post(url=url, json=body, headers={**auth_headers, **headers, 'Host': urlparse(url).netloc})
    if not resp.ok:
        resp.raise_for_status()


def make_migrate_cf_request(body):
    url = get_migrate_cf_url()
    auth_headers = get_auth_headers(url)
    resp = requests.post(url=url, json=body, headers={**auth_headers, 'Host': urlparse(url).netloc})
    if not resp.ok:
        resp.raise_for_status()


def make_archive_cf_request(body, headers):
    make_cf_request('archive', body, headers)


@retry((requests.HTTPError), tries=_RETRIES, delay=_DELAY, logger=logging)
def make_cloud_run_request(url, body):
    auth_headers = get_auth_headers(url)
    resp = requests.post(url=url, json=body, headers=auth_headers)
    if not resp.ok:
        resp.raise_for_status()


def get_archive_extra_file_name(storage_directory: str, file_name: str) -> str:
    return f'{storage_directory}/files/{file_name}'


def get_econ_file_names(id: ObjectId):
    return f'{id}_final_00000000.csv', f'{id}_grouped_sum.csv'
