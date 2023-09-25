from combocurve.models.archived_project import get_archived_project_model
from combocurve.models.assumption import get_assumption_model
from combocurve.models.notification import get_notification_model
from combocurve.models.cc_to_cc_import import get_cc_to_cc_import_model
from combocurve.models.economics import get_econ_run_model, get_econ_run_data_model
from combocurve.models.file import get_file_model
from combocurve.models.file_import import get_file_import_models
from combocurve.models.production import get_monthly_production_model, get_daily_production_model
from combocurve.models.project import get_project_model
from combocurve.models.scenario import get_scenario_model
from combocurve.models.scenario_well_assignment import get_scenario_well_assigment_model
from combocurve.models.schedule import get_schedule_model
from combocurve.models.task import get_task_models
from combocurve.models.well import get_well_model
from combocurve.models.access_policy import get_access_policy_model
from combocurve.shared.database import get_db
from combocurve.utils.db_info import DbInfo


class DbContext():
    # db context
    def __init__(self, db_info: DbInfo):
        self.db_info = db_info

        self.db_cluster = self.db_info['db_cluster']
        self.db_connection_string = self.db_info['db_connection_string']
        self.db_name = self.db_info['db_name']
        self.db_password = self.db_info['db_password']
        self.db_username = self.db_info['db_username']

        self.db = get_db(self.db_name, self.db_connection_string)

        self._initialize_models()
        self._initialize_collections()

    def _initialize_models(self):
        (self.archived_project_model, self.archived_project_item_model) = get_archived_project_model(self.db_name)
        (self.file_import_model, self.file_import_file_model, self.file_import_stats_model,
         self.file_import_well_info_model,
         self.file_import_update_well_info_model) = get_file_import_models(self.db_name)
        (self.task_model, self.task_progress_model) = get_task_models(self.db_name)
        self.assumptions_model = get_assumption_model(self.db_name)
        self.notification_model = get_notification_model(self.db_name)
        self.cc_to_cc_imports_model = get_cc_to_cc_import_model(self.db_name)
        self.daily_production_model = get_daily_production_model(self.db_name)
        self.economic_data_model = get_econ_run_data_model(self.db_name)
        self.economic_model = get_econ_run_model(self.db_name)
        self.file_model = get_file_model(self.db_name)
        self.monthly_production_model = get_monthly_production_model(self.db_name)
        self.project_model = get_project_model(self.db_name)
        self.scenario_well_assignments_model = get_scenario_well_assigment_model(self.db_name)
        self.scenarios_model = get_scenario_model(self.db_name)
        self.schedule_model = get_schedule_model(self.db_name)
        self.well_model = get_well_model(self.db_name)
        self.access_policy_model = get_access_policy_model(self.db_name)

    def _initialize_collections(self):
        self.assumptions_collection = self.db['assumptions']
        self.notifications_collection = self.db['notifications']
        self.cc_to_cc_imports_collection = self.db['cc-to-cc-imports']
        self.daily_production_collection = self.db['daily-productions']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.econ_runs_collection = self.db['econ-runs']
        self.econ_runs_datas_collection = self.db['econ-runs-datas']
        self.economic_collection = self.db['econ-runs']
        self.economic_data_collection = self.db['econ-runs-datas']
        self.files_collection = self.db['files']
        self.filters_collection = self.db['filters']
        self.forecast_buckets_collection = self.db['forecast-buckets']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.forecast_well_assignments_collection = self.db['forecast-well-assignments']
        self.forecasts_collection = self.db['forecasts']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.forecast_lookup_tables_collection = self.db['forecast-lookup-tables']
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']
        self.migrations_collection = self.db['migrations']
        self.monthly_production_collection = self.db['monthly-productions']
        self.project_collection = self.db['projects']
        self.scen_roll_up_runs_collection = self.db['scen-roll-up-runs']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
        self.scenarios_collection = self.db['scenarios']
        self.schedule_collection = self.db['schedules']
        self.schedule_constructions_collection = self.db['schedule-constructions']
        self.schedule_settings_collection = self.db['schedule-settings']
        self.schedule_input_qualifiers_collection = self.db['schedule-input-qualifiers']
        self.schedule_well_outputs_collection = self.db['schedule-well-outputs']
        self.session_collection = self.db['sessions']
        self.shapefiles_collection = self.db['shapefiles']
        self.type_curve_fits_collection = self.db['type-curve-fits']
        self.type_curve_normalization_wells_collection = self.db['type-curve-normalization-wells']
        self.type_curve_normalizations_collection = self.db['type-curve-normalizations']
        self.type_curve_umbrellas_collection = self.db['type-curve-umbrellas']
        self.type_curve_well_assignments_collection = self.db['type-curve-well-assignments']
        self.type_curves_collection = self.db['type-curves']
        self.wells_collection = self.db['wells']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']
        self.access_policies_collection = self.db['access-policies']
        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
        self.users_collection = self.db['users']
        self.proximity_forecast_datas_collection = self.db['proximity-forecast-datas']
        self.ghg_runs_collection = self.db['ghg-runs']
        self.networks_collection = self.db['networks']
        self.facilities_collection = self.db['facilities']
        self.well_directional_surveys_collection = self.db['well-directional-surveys']
        self.econ_groups_collection = self.db['econ-groups']
        self.econ_report_export_configurations = self.db['econ-report-export-configurations']
        self.econ_report_export_default_user_configurations = self.db['econ-report-export-default-user-configurations']
