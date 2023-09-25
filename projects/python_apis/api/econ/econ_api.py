import logging
from bson import ObjectId
from flask import Blueprint, request
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.routes import complete_routing
from combocurve.shared.params import require_params
from combocurve.services.carbon.carbon_service import CarbonService
from api.decorators import with_api_context
from combocurve.services.job_service.econ_job_service import create_and_wait_on_k8s_job, create_and_wait_on_local_job
from combocurve.shared.google_auth import get_auth_headers
from combocurve.shared.config import ECON_CSV_EXPORT_CLOUD_RUN_URL
from combocurve.utils.helpers import rearrange_environment_headers
import requests

econ_api = Blueprint('econ_api', __name__)


@econ_api.route('/type_curve_econ', methods=['POST'])
@complete_routing
@with_api_context
def type_curve_econ(**kwargs):
    context = kwargs['context']
    params = request.json
    try:

        tc_econ_output = context.econ_service.type_curve_econ(params)
        result = {'output': tc_econ_output['nested_output'], 'one_liner': tc_econ_output['one_liner']}
    except Exception as e:
        error_info = get_exception_info(e)
        if not error_info['expected']:
            logging.error('Type curve econ run failed', extra={'metadata': error_info})
        result = {'error': error_info}
    return result


@econ_api.route('/single-well-econ', methods=['POST'])
@complete_routing
@with_api_context
def single_well_econ(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        result = context.econ_service.single_well_econ(params)
    except Exception as e:
        error_info = get_exception_info(e)
        if not error_info['expected']:
            logging.error('Single well econ run failed', extra={'metadata': error_info})
        result = {'error': error_info}

    return result


def run_sync_econ(econ_service, params):
    run_id = params['run_id']
    aggregate = True

    run = econ_service.get_run(run_id)
    params['batch_index'] = 0
    params['assignment_ids'] = [str(oid) for oid in run['scenarioWellAssignments']]

    batch_outputs = econ_service.batch_econ(run, params)

    runMode = run['outputParams'].get('runMode', 'full')
    if runMode == 'fast':
        aggregate = False

    econ_service.write_one_liner_to_db(run, batch_outputs)

    # save the results to bigquery table
    econ_service.upload_results_to_table(run, batch_outputs)

    # generate grouped sum and pull results to front-end
    econ_service.clean_up(run, aggregate, batch_outputs=batch_outputs)


def run_sync_ghg(carbon_service: CarbonService, params):
    run_id = params['run_id']
    run = carbon_service.get_run(run_id)

    batch_index = 0
    params['batch_index'] = batch_index
    params['assignment_ids'] = [str(oid) for oid in run['scenarioWellAssignments']]

    # calculate individual well results and load to storage
    batch_outputs = carbon_service.batch_ghg(run, params)
    monthly_df = carbon_service.write_batch_files_to_cloud(run, batch_index, batch_outputs)

    # calculate facility emissions using 1 monthly_df and 1 thread
    facility_dfs: list = carbon_service.facility_emissions_pipeline(run, [monthly_df], 1)

    if len(facility_dfs) > 0:
        #upload facility results to storage
        facility_index = 1
        carbon_service.write_facility_monthly_as_file(run, facility_index, facility_dfs[0])

    #clean up
    # write results from storage to big query
    carbon_service.load_batch_result_to_bigquery(str(run_id))


@econ_api.route('/sync_econ', methods=['POST'])
@complete_routing
@with_api_context
def sync_econ(**kwargs):
    context = kwargs['context']
    body = request.json

    params = require_params(body, ['run_id', 'is_ghg'])

    is_ghg = params['is_ghg']
    run_id = params['run_id']

    econ_service = context.econ_service
    carbon_service = context.carbon_service

    try:
        if is_ghg:
            run_sync_ghg(carbon_service, params)
        else:
            params['ghg_run_id'] = body.get('ghg_run_id')
            run_sync_econ(econ_service, params)

    except Exception as e:
        error_info = get_exception_info(e)
        if is_ghg:
            logging.error('Carbon run failed', extra={'metadata': error_info})
            context.ghg_runs_collection.update_one({'_id': ObjectId(run_id)},
                                                   {'$set': {
                                                       'status': 'failed',
                                                       'error': error_info
                                                   }})
            raise e
        else:
            logging.error('Econ run failed', extra={'metadata': error_info})
            context.econ_runs_collection.update_one({'_id': ObjectId(run_id)},
                                                    {'$set': {
                                                        'status': 'failed',
                                                        'error': error_info
                                                    }})


@econ_api.route('/group_econ', methods=['POST'])
@complete_routing
@with_api_context
def group_econ(**kwargs):
    request_body = request.json
    headers = request.headers
    context = kwargs['context']
    run = context.econ_runs_collection.find_one({'_id': ObjectId(request_body['run_id'])})
    if __debug__:
        create_and_wait_on_local_job(request_body, headers)
    else:
        create_and_wait_on_k8s_job(request_body, headers, run=run)


@econ_api.route('/gen-econ-csv-export', methods=['POST'])
def csv_export():

    auth_headers = get_auth_headers(ECON_CSV_EXPORT_CLOUD_RUN_URL)

    tenant_headers = rearrange_environment_headers(request.headers)

    response = requests.post(
        url=ECON_CSV_EXPORT_CLOUD_RUN_URL,
        json=request.json,
        headers={
            **tenant_headers,
            **auth_headers
        },
    )

    if not response.reason == 'OK':
        response.raise_for_status()

    return response.json()


@econ_api.route('/get-default-csv-export-settings', methods=['POST'])
@with_api_context
def get_default_csv_export_settings(**kwargs):
    context = kwargs['context']
    params = request.json

    try:
        result = context.econ_service.default_csv_export_settings(params)
    except Exception as e:
        error_info = get_exception_info(e)
        if not error_info['expected']:
            logging.error('Get default CSV export settings failed', extra={'metadata': error_info})
        result = {'error': error_info}

    return result
