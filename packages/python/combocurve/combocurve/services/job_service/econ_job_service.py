import os
import yaml
import logging
import requests
import time
from combocurve.shared.config import JOBS_API_CLOUD_RUN_URL
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.google_auth import get_auth_headers
from combocurve.utils.tenant import TENANT_HEADER_MAPPINGS
from combocurve.services.job_service.job_config_helpers import (PREFER_MEDIUM_POOL, REQUIRE_MEDIUM_POOL,
                                                                REQUIRE_LARGE_POOL, medium_pool_resources,
                                                                large_pool_resources)

# URLS for running locally
JOBS_API_LOCAL_URL = 'http://host.docker.internal:5003/jobs_api'
GROUP_ECONOMICS_URL = 'http://host.docker.internal:5005/economics'
CARBON_URL = 'http://host.docker.internal:5005/carbon'

# Well Limits for k8s node affinity settings
PREFER_MEDIUM_POOL_LIMIT = 400
REQUIRE_MEDIUM_POOL_LIMIT = 800
REQUIRE_LARGE_POOL_LIMIT = 1600

job_types = {
    'carbon': {
        'name': 'carbon',
        'display_name': 'carbon',
        'yaml': 'carbon_job.yaml',
        'url': CARBON_URL
    },
    'economics': {
        'name': 'economics',
        'display_name': 'group-economics',
        'yaml': 'econ_job.yaml',
        'url': GROUP_ECONOMICS_URL
    }
}


def create_and_wait_on_k8s_job(request_body, headers, run=None):
    tenant = headers['Subdomain']
    is_ghg = request_body.get('is_ghg')
    if is_ghg:
        job_type = job_types['carbon']
    else:
        job_type = job_types['economics']
    job_type_name = job_type['name']

    run_id = request_body['run_id']
    job_model = {
        'backend_type': 'k8s',
        'display_name': f"{job_type['display_name']}-{run_id}",
        'tenant': tenant,
    }
    env_list = create_env_list(request_body, headers)

    with open(os.path.join(os.path.dirname(__file__), f"{job_type['yaml']}")) as f:
        # TODO: adjust compute resource
        body = yaml.safe_load(f)
        body['spec']['template']['spec']['containers'][0]['env'] = env_list
        body['spec']['template']['spec']['containers'][0][
            'image'] = f'gcr.io/{GCP_PRIMARY_PROJECT_ID}/{job_type_name}:latest'
        job_name = f"{job_type['name']}-{run_id}"
        body['metadata']['name'] = job_name
        # adjust node affinity based on number of wells * combos
        output_count = len(run['scenarioWellAssignments']) * len(run['outputParams']['combos'])

        if run and output_count > REQUIRE_LARGE_POOL_LIMIT:
            # replace preferred affinity with required affinity
            body['spec']['template']['spec']['affinity']['nodeAffinity'] = REQUIRE_LARGE_POOL
            # update resource requests to prevent large jobs from getting killed for OOM
            body['spec']['template']['spec']['containers'][0]['resources'] = large_pool_resources
        elif run and output_count > REQUIRE_MEDIUM_POOL_LIMIT:
            body['spec']['template']['spec']['affinity']['nodeAffinity'] = REQUIRE_MEDIUM_POOL
            body['spec']['template']['spec']['containers'][0]['resources'] = medium_pool_resources
        elif run and output_count > PREFER_MEDIUM_POOL_LIMIT:
            body['spec']['template']['spec']['affinity']['nodeAffinity'] = PREFER_MEDIUM_POOL

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


def create_and_wait_on_local_job(request_body, headers):
    is_ghg = request_body.get('is_ghg')
    if is_ghg:
        url = job_types['carbon']['url']
    else:
        url = job_types['economics']['url']
    response = requests.post(url, json=request_body, headers=headers)
    ## TODO: improve this exception
    if response.status_code != 200:
        raise Exception('Job run failed.')
    logging.info(response)


def create_env_list(request_body, header):
    current_env_vars = [{'name': key, 'value': value} for key, value in dict(os.environ).items()]
    env_vars_from_body = [{'name': key.upper(), 'value': str(value)} for key, value in request_body.items()]
    header_dict = dict(header)
    tenant = header_dict['Subdomain']
    env_dict_from_header = {
        'tenant': tenant,
        'dal_url': header_dict['Inpt-Dal-Url'],
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
        status = status_response.json()['status']
        if status in ['completed', 'failed', 'canceled']:
            job_completed = True
        time.sleep(1)
    return status
