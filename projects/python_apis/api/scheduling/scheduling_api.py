from typing import TYPE_CHECKING
from flask import Blueprint, request
from combocurve.services.job_service.scheduling_job_service import (
    create_and_wait_on_k8s_job,
    create_and_wait_on_local_job,
)

from combocurve.utils.logging import add_to_logging_metadata
from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from bson import ObjectId

if TYPE_CHECKING:
    from context import APIContext

VALIDATION_MODELS = {
    'capex': 'CAPEX',
    'differentials': 'Differentials',
    'expenses': 'Expenses',
    'forecast': 'Forecast',
    'forecast_p_series': 'P-series',
    'ownership_reversion': 'Ownership Reversion',
    'pricing': 'Pricing',
    'production_taxes': 'Production Taxes',
    'risking': 'Risking',
    'stream_properties': 'Stream Properties'
}

scheduling_api = Blueprint('scheduling_api', __name__)


@scheduling_api.route('/schedule', methods=['POST'])
@complete_routing
def schedule():
    params = request.json
    headers = request.headers
    try:
        # if __debug__:
        #     create_and_wait_on_local_job(params, headers)
        # else:
        create_and_wait_on_k8s_job(params, headers)
    except Exception as e:
        add_to_logging_metadata({'schedule_settings': params})
        raise e


@scheduling_api.route('/npv-data-validation', methods=['POST'])
@complete_routing
@with_api_context
def npv_data_validation(**kwargs):
    context: 'APIContext' = kwargs['context']
    params = request.json
    schedule_id = params['scheduleId']
    well_ids = params['wellIds']

    try:
        model_info = context.scheduling_data_service.schedule_model_validation_info(ObjectId(schedule_id), well_ids)
        validations_dict = {}

        for models in model_info:
            for col in VALIDATION_MODELS.keys():
                if col in models['inputData'].keys():
                    if all(value is None for value in models['inputData'][col].values()):
                        validations_dict[col] = validations_dict.get(col, 0) + 1
                else:
                    validations_dict[col] = validations_dict.get(col, 0) + 1

        num_wells = len(model_info)
        validations = []
        for model in validations_dict.keys():
            validations.append({'missing': validations_dict[model], 'model': VALIDATION_MODELS[model]})

        ret = {'total': num_wells, 'validations': validations}
    except Exception as e:
        add_to_logging_metadata({'npv_data_validation': params})
        raise e

    return ret
