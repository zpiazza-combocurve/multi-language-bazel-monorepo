from combocurve.services.forecast.update_eur_service import UpdateEurService
from combocurve.services.scheduling.scheduling_data_service import SchedulingDataService
from combocurve.services.well_spacing.well_spacing_service import WellSpacingService
from combocurve.utils.pusher import init_pusher_client
from combocurve.utils.logging import config_tenant_logging
from combocurve.shared.context_provider import ContextProvider
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from api.database import get_db

from combocurve.services.econ.econ_service import EconService
from combocurve.services.econ.econ_file_service import EconFileService
from combocurve.services.econ.econ_output_service import EconOutputService
from combocurve.services.diagnostics.diagnostic_service import DiagnosticService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.proximity_forecast.proximity_forecast_service import ProximityForecastService
from combocurve.services.forecast.add_last_segment_service import AddLastSegmentService
from combocurve.services.forecast.export_service import ForecastExportService
from combocurve.services.rollUp.roll_up_service import RollUpService
from combocurve.services.rollUp.roll_up_export import RollUpExport
from combocurve.services.production.production_service import ProductionService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.services.type_curve.tc_apply_service import TypeCurveApplyService
from combocurve.services.type_curve.tc_chart_export_service import TypeCurveChartExportService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.forecast.mass_shift_segments_service import MassShiftSegmentsService
from combocurve.services.forecast.mass_adjust_terminal_decline_service import MassAdjustTerminalDeclineService
from combocurve.services.data_cache.data_cache_service import DataCacheService

from combocurve.services.scenario_well_assignments_service import ScenarioWellAssignmentService
from combocurve.services.lookup_table_service import LookupTableService, EmbeddedLookupTableService
from combocurve.services.scenario_page_query_service import ScenarioPageQueryService
from combocurve.services.files.file_service import FileService
from combocurve.services.notification_service import NotificationService
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService

from combocurve.services.feature_flags.feature_flags_service import FeatureFlagsService

from combocurve.services.carbon.carbon_service import CarbonService
from combocurve.dal.client import DAL
import os

FORECAST_LIBRARY_URL = os.environ.get('FORECAST_LIBRARY_URL')


class APIContext():
    def __init__(self, tenant_info):
        # This is an initial version of context simplified to minimize the amount of changes required
        # to get a first version of a multi-tenant app.
        # We want context to contain instances of models and services, not db instances
        self.db = get_db(tenant_info)
        self.tenant_info = tenant_info
        self.subdomain = tenant_info['subdomain']

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])

        if not __debug__:
            config_tenant_logging(tenant_info)

        self.pusher_client = init_pusher_client(tenant_info)
        self.pusher = self.pusher_client  # for the notification service
        self.cloud_storage_client = CloudStorageClient()
        self.big_query_client = BigQueryClient(GCP_PRIMARY_PROJECT_ID)

        # urls
        self.forecast_library_url = FORECAST_LIBRARY_URL or 'https://forecast-library-dot-{}.appspot.com'.format(
            FORECAST_LIBRARY_URL)
        # models
        self.schedules_collection = self.db['schedules']
        self.schedule_constructions_collection = self.db['schedule-constructions']
        self.schedule_settings_collection = self.db['schedule-settings']
        self.schedule_well_outputs_collection = self.db['schedule-well-outputs']
        self.schedule_input_qualifiers_collection = self.db['schedule-input-qualifiers']
        self.econ_runs_collection = self.db['econ-runs']
        self.ghg_runs_collection = self.db['ghg-runs']
        self.econ_runs_datas_collection = self.db['econ-runs-datas']
        self.scenarios_collection = self.db['scenarios']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']
        self.forecasts_collection = self.db['forecasts']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.wells_collection = self.db['wells']
        self.type_curves_collection = self.db['type-curves']
        self.forecast_lookup_tables_collection = self.db['forecast-lookup-tables']
        self.type_curve_fits_collection = self.db['type-curve-fits']
        self.type_curve_normalizations_collection = self.db['type-curve-normalizations']
        self.assumptions_collection = self.db['assumptions']
        self.scen_roll_up_runs_collection = self.db['scen-roll-up-runs']
        self.roll_up_groups_collection = self.db['roll-up-groups']
        self.forecast_roll_up_runs_collection = self.db['forecast-roll-up-runs']
        self.files_collection = self.db['files']
        self.notifications_collection = self.db['notifications']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']
        self.type_curve_normalization_wells_collection = self.db['type-curve-normalization-wells']
        self.networks_collection = self.db['networks']
        self.facilities_collection = self.db['facilities']
        self.type_curve_well_assignments_collection = self.db['type-curve-well-assignments']
        self.proximity_forecast_datas_collection = self.db['proximity-forecast-datas']
        self.well_directional_surveys_collection = self.db['well-directional-surveys']
        self.project_collection = self.db['projects']

        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
        self.users_collection = self.db['users']

        # services
        self.scheduling_data_service = SchedulingDataService(self)
        self.data_cache_service = DataCacheService(self)
        self.update_eur_service = UpdateEurService(self)
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.diagnostic_service = DiagnosticService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.econ_service = EconService(self)
        self.econ_output_service = EconOutputService(self)
        self.econ_file_service = EconFileService(self)
        self.forecast_service = ForecastService(self)
        self.forecast_export_service = ForecastExportService(self)
        self.add_last_segment_service = AddLastSegmentService(self)
        self.production_service = ProductionService(self)
        self.roll_up_service = RollUpService(self)
        self.roll_up_export_service = RollUpExport(self)
        self.scenario_well_assignments_service = ScenarioWellAssignmentService(self)
        self.type_curve_service = TypeCurveService(self)
        self.type_curve_apply_service = TypeCurveApplyService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.lookup_table_service = LookupTableService(self)
        self.embedded_lookup_table_service = EmbeddedLookupTableService(self)
        self.scenario_page_query_service = ScenarioPageQueryService(self)
        self.mass_modify_well_life_service = MassModifyWellLifeService(self)
        self.proximity_forecast_service = ProximityForecastService(self)
        self.mass_shift_segments_service = MassShiftSegmentsService(self)
        self.notification_service = NotificationService(self)
        self.file_service = FileService(self)
        self.mass_adjust_terminal_decline_service = MassAdjustTerminalDeclineService(self)
        self.custom_fields_service = CustomFieldsService(self)
        self.tc_chart_export_service = TypeCurveChartExportService(self)
        self.carbon_service = CarbonService(self)
        self.well_spacing_service = WellSpacingService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)

        self.feature_flags_service = FeatureFlagsService()


context_provider = ContextProvider(APIContext)
