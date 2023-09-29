from typing import Optional

from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import (DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED,
                                        TASK_STATUS_RUNNING)

from combocurve.shared.db_context import DbContext
from combocurve.shared.progress_notifier import WeightedProgressNotifier
from api.archive.abstract_progress_event_receiver import AbstractProgressEventReceiver, get_progress_name


def get_archive_progress_weights(context: DbContext):
    return {
        get_progress_name('archive', 'files'): 10,
        get_progress_name('archive', context.wells_collection.name): 10,
        get_progress_name('archive', context.monthly_production_collection.name): 50,
        get_progress_name('archive', context.daily_production_collection.name): 100,
        get_progress_name('archive', context.well_directional_surveys_collection.name): 10,
        #
        get_progress_name('archive', context.scenarios_collection.name): 1,
        get_progress_name('archive', context.scenario_well_assignments_collection.name): 10,
        get_progress_name('archive', context.assumptions_collection.name): 10,
        #
        get_progress_name('archive', context.forecasts_collection.name): 1,
        get_progress_name('archive', context.forecast_buckets_collection.name): 1,
        get_progress_name('archive', context.deterministic_forecast_datas_collection.name): 10,
        get_progress_name('archive', context.forecast_datas_collection.name): 10,
        get_progress_name('archive', context.forecast_well_assignments_collection.name): 10,
        get_progress_name('archive', context.proximity_forecast_datas_collection.name): 10,
        #
        get_progress_name('archive', context.type_curves_collection.name): 1,
        get_progress_name('archive', context.type_curve_normalizations_collection.name): 1,
        get_progress_name('archive', context.type_curve_fits_collection.name): 1,
        get_progress_name('archive', context.type_curve_umbrellas_collection.name): 10,
        get_progress_name('archive', context.type_curve_normalization_wells_collection.name): 10,
        get_progress_name('archive', context.type_curve_well_assignments_collection.name): 10,
        #
        get_progress_name('archive', context.schedule_collection.name): 1,
        get_progress_name('archive', context.schedule_settings_collection.name): 1,
        get_progress_name('archive', context.schedule_input_qualifiers_collection.name): 1,
        get_progress_name('archive', context.schedule_constructions_collection.name): 1,
        get_progress_name('archive', context.schedule_well_outputs_collection.name): 10,
        #
        get_progress_name('archive', context.scen_roll_up_runs_collection.name): 1,
        get_progress_name('archive', context.econ_runs_collection.name): 1,
        get_progress_name('archive', context.econ_runs_datas_collection.name): 10,
        get_progress_name('archive', context.econ_groups_collection.name): 1,
        get_progress_name('archive', context.econ_report_export_configurations.name): 1,
        get_progress_name('archive', context.econ_report_export_default_user_configurations.name): 1,
        #
        get_progress_name('archive', context.ghg_runs_collection.name): 1,
        get_progress_name('archive', context.networks_collection.name): 1,
        get_progress_name('archive', context.facilities_collection.name): 1,
        #
        get_progress_name('archive', context.lookup_tables_collection.name): 1,
        get_progress_name('archive', context.forecast_lookup_tables_collection.name): 1,
        get_progress_name('archive', context.embedded_lookup_tables_collection.name): 1,
        #
        get_progress_name('archive', context.shapefiles_collection.name): 1,
        #
        get_progress_name('archive', context.migrations_collection.name): 1,
        #
        get_progress_name('archive', context.filters_collection.name): 1,
        #
        get_progress_name('archive', context.project_custom_headers_collection.name): 1,
        get_progress_name('archive', context.project_custom_headers_datas_collection.name): 10,
        #
        get_progress_name('archive', context.project_collection.name): 1,
    }


class ArchiveProgressEventReceiver(AbstractProgressEventReceiver):
    progress_notifier: Optional[WeightedProgressNotifier]

    def __init__(self, context, user_id: str, notification_id: str):
        self.context = context
        self.user_id = user_id
        self.notification_id = notification_id

    def init(self, project_name: str):
        self.progress_notifier = WeightedProgressNotifier(get_archive_progress_weights(self.context),
                                                          self.context.pusher, self.notification_id,
                                                          self.context.subdomain, self.user_id)
        self.context.notification_service.update_notification_with_notifying_target(
            self.notification_id, {
                'status': TASK_STATUS_RUNNING,
                'description': f'Archiving "{project_name}"'
            })

    def end(self, results):
        project_id = str(results['archived_project_id'])
        project_name = results['archived_project_name']
        version_name = results['archived_version_name']

        self.context.notification_service.update_notification_with_notifying_target(
            self.notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Archived "{project_name}"',
                'extra.output': {
                    'id': project_id,
                    'projectName': project_name,
                    'versionName': version_name
                }
            })

    def error(self, error):
        error_info = get_exception_info(error)
        user_error = error_info['message'] if error_info['expected'] else DEFAULT_USER_NOTIFICATION_ERROR
        self.context.notification_service.update_notification_with_notifying_target(self.notification_id, {
            'status': TASK_STATUS_FAILED,
            'description': user_error,
            'extra.error': user_error
        })

    def progress(self, name: str, progress: float):
        self.progress_notifier.add_partial_progress(name, progress)
