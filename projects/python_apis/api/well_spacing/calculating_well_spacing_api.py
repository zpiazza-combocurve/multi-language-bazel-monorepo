from flask import request, Blueprint
from threading import Thread
from combocurve.utils.routes import complete_routing
from api.decorators import with_api_context
from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.logging import add_to_logging_metadata

well_spacing_api = Blueprint('well_spacing_api', __name__)


@well_spacing_api.route('/calculating-well-spacing', methods=['POST'])
@complete_routing
@with_api_context
def calculating_well_spacing(**kwargs):
    context = kwargs['context']
    params = request.json
    notification_id = params['notificationId']

    def call_spacing_service():
        try:
            context.well_spacing_service.calculate_well_spacing(params)
        except Exception as e:
            error_info = get_exception_info(e)
            add_to_logging_metadata({'well_spacing_calc': params})
            context.notification_service.update_notification_with_notifying_target(
                notification_id, {
                    'status': 'failed',
                    'extra.error': error_info['message'] if error_info['expected'] else 'Failed. Please, try again.'
                })
            raise e

    thread = Thread(target=call_spacing_service)
    thread.start()
    return 'started'


@well_spacing_api.route('/midpoint-data-validation', methods=['POST'])
@complete_routing
@with_api_context
def midpoint_data_validation(**kwargs):
    context = kwargs['context']
    params = request.json
    filtered_wells = params['filteredWells']
    all_well_ids = params['allWellIds']
    zone_type = params['zoneType']
    distance_type = params['distanceType']

    try:
        selected_wells = []
        for well in filtered_wells:
            selected_wells.append(well['_id'])
        _, all_wells = context.well_spacing_service._get_target_and_all(selected_wells, all_well_ids, distance_type,
                                                                        zone_type, True)
        d_survey_data = context.well_spacing_service._get_directional_survey_data(all_wells)
        failed_calcs, _ = context.well_spacing_service._filter_surveys_non_mixed(d_survey_data)
        for well in filtered_wells:
            well['heel_found'] = not any(str(survey['well'][0]['_id']) == well['_id'] for survey in failed_calcs)
    except Exception as e:
        add_to_logging_metadata({'midpoint_data_validation': params})
        raise e

    return filtered_wells
