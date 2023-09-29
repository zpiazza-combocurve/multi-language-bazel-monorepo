from typing import Optional

from combocurve.utils.exceptions import get_exception_info
from combocurve.utils.constants import (DEFAULT_USER_NOTIFICATION_ERROR, TASK_STATUS_COMPLETED, TASK_STATUS_FAILED,
                                        TASK_STATUS_RUNNING)

from combocurve.shared.db_context import DbContext
from combocurve.shared.progress_notifier import WeightedProgressNotifier
from api.archive.abstract_progress_event_receiver import AbstractProgressEventReceiver, get_progress_name


def get_restore_progress_weights(context: DbContext):
    restore = {
        get_progress_name('restore', 'ids'): 1,
        get_progress_name('restore', 'files'): 10,
        #
        get_progress_name('restore', context.wells_collection.name): 10,
        get_progress_name('restore', context.monthly_production_collection.name): 50,
        get_progress_name('restore', context.daily_production_collection.name): 100,
        get_progress_name('restore', context.well_directional_surveys_collection.name): 10,
        #
        get_progress_name('restore', context.scenarios_collection.name): 1,
        get_progress_name('restore', context.scenario_well_assignments_collection.name): 10,
        get_progress_name('restore', context.assumptions_collection.name): 10,
        #
        get_progress_name('restore', context.forecasts_collection.name): 1,
        get_progress_name('restore', context.forecast_buckets_collection.name): 1,
        get_progress_name('restore', context.deterministic_forecast_datas_collection.name): 10,
        get_progress_name('restore', context.forecast_datas_collection.name): 10,
        get_progress_name('restore', context.forecast_well_assignments_collection.name): 10,
        get_progress_name('restore', context.proximity_forecast_datas_collection.name): 10,
        #
        get_progress_name('restore', context.type_curves_collection.name): 1,
        get_progress_name('restore', context.type_curve_normalizations_collection.name): 1,
        get_progress_name('restore', context.type_curve_fits_collection.name): 1,
        get_progress_name('restore', context.type_curve_umbrellas_collection.name): 10,
        get_progress_name('restore', context.type_curve_normalization_wells_collection.name): 10,
        get_progress_name('restore', context.type_curve_well_assignments_collection.name): 10,
        #
        get_progress_name('restore', context.schedule_collection.name): 1,
        get_progress_name('restore', context.schedule_settings_collection.name): 1,
        get_progress_name('restore', context.schedule_constructions_collection.name): 1,
        get_progress_name('restore', context.schedule_input_qualifiers_collection.name): 10,
        get_progress_name('restore', context.schedule_well_outputs_collection.name): 10,
        #
        get_progress_name('restore', context.shapefiles_collection.name): 1,
        #
        get_progress_name('restore', context.scen_roll_up_runs_collection.name): 1,
        get_progress_name('restore', context.econ_runs_collection.name): 1,
        get_progress_name('restore', context.econ_runs_datas_collection.name): 10,
        get_progress_name('restore', context.econ_groups_collection.name): 10,
        get_progress_name('restore', context.econ_report_export_configurations.name): 1,
        get_progress_name('restore', context.econ_report_export_default_user_configurations.name): 1,
        #
        get_progress_name('restore', context.ghg_runs_collection.name): 1,
        get_progress_name('restore', context.networks_collection.name): 1,
        get_progress_name('restore', context.facilities_collection.name): 1,
        #
        get_progress_name('restore', context.lookup_tables_collection.name): 1,
        get_progress_name('restore', context.forecast_lookup_tables_collection.name): 1,
        get_progress_name('restore', context.embedded_lookup_tables_collection.name): 1,
        #
        get_progress_name('restore', context.filters_collection.name): 1,
        #
        get_progress_name('restore', context.migrations_collection.name): 1,
        #
        get_progress_name('restore', context.project_custom_headers_collection.name): 1,
        get_progress_name('restore', context.project_custom_headers_datas_collection.name): 1,
        #
        get_progress_name('restore', context.project_collection.name): 1,
    }

    update = {
        get_progress_name('update', context.wells_collection.name): 10,
        get_progress_name('update', context.monthly_production_collection.name): 50,
        get_progress_name('update', context.daily_production_collection.name): 100,
        get_progress_name('update', context.well_directional_surveys_collection.name): 10,
        #
        get_progress_name('update', context.scenarios_collection.name): 1,
        get_progress_name('update', context.scenario_well_assignments_collection.name): 10,
        get_progress_name('update', context.assumptions_collection.name): 10,
        #
        get_progress_name('update', context.forecasts_collection.name): 1,
        get_progress_name('update', context.forecast_buckets_collection.name): 1,
        get_progress_name('update', context.deterministic_forecast_datas_collection.name): 10,
        get_progress_name('update', context.forecast_datas_collection.name): 10,
        get_progress_name('update', context.forecast_well_assignments_collection.name): 10,
        get_progress_name('update', context.proximity_forecast_datas_collection.name): 10,
        #
        get_progress_name('update', context.type_curves_collection.name): 1,
        get_progress_name('update', context.type_curve_normalizations_collection.name): 1,
        get_progress_name('update', context.type_curve_fits_collection.name): 1,
        get_progress_name('update', context.type_curve_umbrellas_collection.name): 10,
        get_progress_name('update', context.type_curve_normalization_wells_collection.name): 10,
        get_progress_name('update', context.type_curve_well_assignments_collection.name): 10,
        #
        get_progress_name('update', context.schedule_collection.name): 1,
        get_progress_name('update', context.schedule_settings_collection.name): 1,
        get_progress_name('update', context.schedule_constructions_collection.name): 1,
        get_progress_name('update', context.schedule_input_qualifiers_collection.name): 10,
        get_progress_name('update', context.schedule_well_outputs_collection.name): 10,
        #
        get_progress_name('update', context.shapefiles_collection.name): 1,
        #
        get_progress_name('update', context.scen_roll_up_runs_collection.name): 1,
        get_progress_name('update', context.econ_runs_collection.name): 1,
        get_progress_name('update', context.econ_runs_datas_collection.name): 10,
        get_progress_name('update', context.econ_groups_collection.name): 1,
        get_progress_name('update', context.econ_report_export_configurations.name): 1,
        get_progress_name('update', context.econ_report_export_default_user_configurations.name): 1,
        #
        get_progress_name('update', context.ghg_runs_collection.name): 1,
        get_progress_name('update', context.networks_collection.name): 1,
        get_progress_name('update', context.facilities_collection.name): 1,
        #
        get_progress_name('update', context.lookup_tables_collection.name): 1,
        get_progress_name('update', context.forecast_lookup_tables_collection.name): 1,
        get_progress_name('update', context.embedded_lookup_tables_collection.name): 1,
        #
        get_progress_name('update', context.filters_collection.name): 1,
        #
        get_progress_name('update', context.project_custom_headers_collection.name): 1,
        get_progress_name('update', context.project_custom_headers_datas_collection.name): 10,
        #
        get_progress_name('update', context.project_collection.name): 1,
    }

    copy = {
        get_progress_name('copy', context.wells_collection.name): 10,
        get_progress_name('copy', context.monthly_production_collection.name): 50,
        get_progress_name('copy', context.daily_production_collection.name): 100,
        get_progress_name('copy', context.well_directional_surveys_collection.name): 10,
        #
        get_progress_name('copy', context.scenarios_collection.name): 1,
        get_progress_name('copy', context.scenario_well_assignments_collection.name): 10,
        get_progress_name('copy', context.assumptions_collection.name): 10,
        #
        get_progress_name('copy', context.forecasts_collection.name): 1,
        get_progress_name('copy', context.forecast_buckets_collection.name): 1,
        get_progress_name('copy', context.deterministic_forecast_datas_collection.name): 10,
        get_progress_name('copy', context.forecast_datas_collection.name): 10,
        get_progress_name('copy', context.forecast_well_assignments_collection.name): 10,
        get_progress_name('copy', context.proximity_forecast_datas_collection.name): 10,
        #
        get_progress_name('copy', context.type_curves_collection.name): 1,
        get_progress_name('copy', context.type_curve_normalizations_collection.name): 1,
        get_progress_name('copy', context.type_curve_fits_collection.name): 1,
        get_progress_name('copy', context.type_curve_umbrellas_collection.name): 10,
        get_progress_name('copy', context.type_curve_normalization_wells_collection.name): 10,
        get_progress_name('copy', context.type_curve_well_assignments_collection.name): 10,
        #
        get_progress_name('copy', context.schedule_collection.name): 1,
        get_progress_name('copy', context.schedule_settings_collection.name): 1,
        get_progress_name('copy', context.schedule_constructions_collection.name): 1,
        get_progress_name('copy', context.schedule_input_qualifiers_collection.name): 10,
        get_progress_name('copy', context.schedule_well_outputs_collection.name): 10,
        #
        get_progress_name('copy', context.shapefiles_collection.name): 1,
        #
        get_progress_name('copy', context.scen_roll_up_runs_collection.name): 1,
        get_progress_name('copy', context.econ_runs_collection.name): 1,
        get_progress_name('copy', context.econ_groups_collection.name): 1,
        get_progress_name('copy', context.econ_runs_datas_collection.name): 10,
        get_progress_name('copy', context.econ_report_export_configurations.name): 1,
        get_progress_name('copy', context.econ_report_export_default_user_configurations.name): 1,
        #
        get_progress_name('copy', context.ghg_runs_collection.name): 1,
        get_progress_name('copy', context.networks_collection.name): 1,
        get_progress_name('copy', context.facilities_collection.name): 1,
        #
        get_progress_name('copy', context.lookup_tables_collection.name): 1,
        get_progress_name('copy', context.forecast_lookup_tables_collection.name): 1,
        get_progress_name('copy', context.embedded_lookup_tables_collection.name): 1,
        #
        get_progress_name('copy', context.filters_collection.name): 1,
        #
        get_progress_name('copy', context.project_custom_headers_collection.name): 1,
        get_progress_name('copy', context.project_custom_headers_datas_collection.name): 10,
        #
        get_progress_name('copy', context.access_policies_collection.name): 1,
        #
        get_progress_name('copy', context.project_collection.name): 1,
    }

    return {**restore, **update, **copy}


class RestoreProgressEventReceiver(AbstractProgressEventReceiver):
    progress_notifier: Optional[WeightedProgressNotifier]

    def __init__(self, context, user_id: str, notification_id: str):
        self.context = context
        self.user_id = user_id
        self.notification_id = notification_id

    def init(self, project_name: str):
        self.progress_notifier = WeightedProgressNotifier(get_restore_progress_weights(self.context),
                                                          self.context.pusher, self.notification_id,
                                                          self.context.subdomain, self.user_id)
        self.context.notification_service.update_notification_with_notifying_target(
            self.notification_id, {
                'status': TASK_STATUS_RUNNING,
                'description': f'Restoring "{project_name}"'
            })

    def end(self, results):
        project_id = str(results['restored_project_id'])
        project_name = results['new_project_name']
        orig_project_name = results['archived_project_name']
        ver_name = results['archived_version_name']

        self.context.notification_service.update_notification_with_notifying_target(
            self.notification_id, {
                'status': TASK_STATUS_COMPLETED,
                'description': f'Restored "{orig_project_name} - Version {ver_name}"',
                'extra.output': {
                    'id': project_id,
                    'newProjectName': project_name,
                    'originalProjectName': orig_project_name,
                    'versionName': ver_name
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
