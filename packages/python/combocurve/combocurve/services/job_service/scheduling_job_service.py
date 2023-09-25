import time
import requests
import logging
import os
import yaml
from bson.objectid import ObjectId

from combocurve.shared.config import JOBS_API_CLOUD_RUN_URL
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.google_auth import get_auth_headers
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.tenant import TENANT_HEADER_MAPPINGS
from combocurve.services.job_service.job_config_helpers import (REQUIRE_LARGE_POOL, large_pool_resources)

# URLS for running locally
JOBS_API_LOCAL_URL = 'http://host.docker.internal:5003/jobs_api'
SCHEDULING_URL = 'http://host.docker.internal:5005/scheduling'

job_types = {
    'scheduling': {
        'name': 'scheduling',
        'display_name': 'scheduling',
        'yaml': 'scheduling_job.yaml',
        'url': SCHEDULING_URL
    }
}


def create_env_list(request_body, header):
    current_env_vars = [{'name': key, 'value': value} for key, value in dict(os.environ).items()]
    env_vars_from_body = [{'name': key.upper(), 'value': str(value)} for key, value in request_body.items()]
    header_dict = dict(header)
    tenant = header_dict['Subdomain']
    env_dict_from_header = {
        'tenant': tenant,
        'redis_host': header_dict['Inpt-Redis-Host'],
        'redis_port': header_dict['Inpt-Redis-Port']
    }
    env_vars_from_header = [{'name': key.upper(), 'value': value} for key, value in env_dict_from_header.items()]
    return current_env_vars + env_vars_from_body + env_vars_from_header


def wait_on_job(job_id, full_headers):
    job_completed = False
    status = 'queued'

    while not job_completed:
        status_response = requests.get(JOBS_API_CLOUD_RUN_URL + f'/jobs/{job_id}', headers=full_headers)
        try:
            status_response.raise_for_status()
        except requests.HTTPError as error:
            error_info = get_exception_info(error)
            logging.error(error_info['message'],
                          extra={'metadata': {
                              'error': error_info,
                              'job': job_id,
                              'headers': full_headers
                          }})
            raise error
        status = status_response.json()['status']
        if status in ['completed', 'failed', 'canceled']:
            job_completed = True
        time.sleep(1)
    return status


def create_and_wait_on_local_job(request_body, headers):
    response = requests.post(job_types['scheduling']['url'], json=request_body, headers=headers)
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        error_info = get_exception_info(error)
        logging.error(error_info['message'],
                      extra={'metadata': {
                          'error': error_info,
                          'request': request_body,
                          'headers': headers
                      }})
        raise error
    return response


def create_and_wait_on_k8s_job(request_body, headers):
    try:
        os.environ['SCHEDULE_ID'] = str(request_body['schedule_id'])
        os.environ['PROJECT_ID'] = str(request_body['project_id'])
        os.environ['USER_ID'] = str(request_body['user_id'])
        os.environ['NOTIFICATION_ID'] = str(request_body['notification_id'])
    except KeyError:
        raise Exception('Missing schedule parameters')

    tenant = headers['Subdomain']
    job_type = job_types['scheduling']
    job_type_name = job_type['name']
    run_id = ObjectId()

    job_model = {
        'backend_type': 'k8s',
        'display_name': f"{job_type['display_name']}-{run_id}",
        'tenant': tenant,
    }
    env_list = create_env_list(request_body, headers)

    with open(os.path.join(os.path.dirname(__file__), f"{job_type['yaml']}")) as f:
        body = yaml.safe_load(f)
        body['spec']['template']['spec']['containers'][0]['env'] = env_list
        body['spec']['template']['spec']['containers'][0][
            'image'] = f'gcr.io/{GCP_PRIMARY_PROJECT_ID}/{job_type_name}:latest'
        job_name = f"{job_type['name']}-{run_id}"
        body['metadata']['name'] = job_name
        # replace preferred affinity with required affinity
        body['spec']['template']['spec']['affinity']['nodeAffinity'] = REQUIRE_LARGE_POOL
        body['spec']['template']['spec']['containers'][0]['resources'] = large_pool_resources

    job_model['definition'] = body

    # enqueue the job
    auth_headers = get_auth_headers(JOBS_API_CLOUD_RUN_URL)
    tenant_headers = {
        key: value
        for key, value in headers.items() if key.lower() in [pair[1].lower() for pair in TENANT_HEADER_MAPPINGS]
    }
    full_headers = {**tenant_headers, **auth_headers}
    create_response = requests.post(JOBS_API_CLOUD_RUN_URL + '/jobs', json={'job': job_model}, headers=full_headers)
    job = create_response.json()
    status = wait_on_job(job['id'], full_headers)
    logging.info(f'Job execution finished with status: {status}')
    if status == 'failed':
        logging.error(f'Job finished with status failed. Check K8s cluster with job name {job_name} for more info.')
        raise Exception('Job run failed.')
    return status
