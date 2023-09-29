from mapbox import Uploader as MapboxUploader

from combocurve.services.feature_flags.feature_flags_service import FeatureFlagsService
from combocurve.services.scheduling.scheduling_data_service import SchedulingDataService

from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.utils.logging import config_tenant_logging
from combocurve.utils.pusher import init_pusher_client
from combocurve.utils.db_info import DbInfo
from combocurve.utils.tenant_info import TenantInfo
from combocurve.shared.db_context import DbContext
from combocurve.shared.config import ENVIRONMENT
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.services.lookup_table_service import LookupTableService, EmbeddedLookupTableService
from combocurve.services.scenario_well_assignments_service import ScenarioWellAssignmentService
from combocurve.services.scenario_page_query_service import ScenarioPageQueryService
from combocurve.services.assumption_service import AssumptionService
from combocurve.services.notification_service import NotificationService
from combocurve.services.file_service import FileService
from combocurve.services.scenario_service import ScenarioService
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.storage_service import StorageService
from combocurve.services.type_curve.tc_apply_service import TypeCurveApplyService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.production.production_service import ProductionService
from combocurve.services.cc_to_aries.cc_to_aries_service import CCToAriesService
from combocurve.services.cc_to_phdwin.cc_to_phdwin_service import CCToPhdwinService
from combocurve.services.econ.econ_output_service import EconOutputService
from combocurve.services.forecast.export_service import ForecastExportService
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService
from combocurve.services.data_cache.data_cache_service import DataCacheService
from combocurve.services.carbon.carbon_service import CarbonService
from combocurve.services.econ.econ_service import EconService

from api.archive.archive_service import ArchiveService
from api.aries_phdwin_imports.aries_service import AriesService
from api.cc_to_cc.cc_to_cc_service import CCToCCService
from api.economics.multi_econ import EconomicService
from api.file_imports.auto_mapping import AutoMappingService
from api.file_imports.index import FileImportService
from api.forecast_mass_edit.forecast_import import ForecastImport
from api.forecast_mass_edit.forecast_import_aries import ForecastImportAries
from api.google_cloud import GoogleServices
from api.scenarios.scenarios_service import ScenariosService
from api.sessions.index import SessionService
from api.shareable_codes.shareable_codes_service import ShareableCodesService
from api.wells.index import WellService
from api.typecurve_mass_edit.typecurve_download import TypecurveDownload
from api.typecurve_mass_edit.typecurve_workflow_export import TypeCurveWorkflowExport
from api.typecurve_mass_edit.typecurve_upload import TypecurveUpload
from api.typecurve_mass_edit.typecurve_external import TypeCurveExternalExport
from api.forecast_mass_edit.mosaic_forecast_export import MosaicForecastExport
from api.forecast_mass_edit.forecast_export import ForecastExport
from api.forecast_mass_edit.forecast_single_well_export import ForecastSingleWellExport
from api.shapefiles.service import ShapefileService
from api.shapefiles.mts_uploader import MapboxTileServiceUploader

from combocurve.dal.client import DAL


class Context(DbContext):
    def __init__(self, tenant_info: TenantInfo):
        self.tenant_info = tenant_info
        self.subdomain = self.tenant_info['subdomain']

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        if ENVIRONMENT != 'development' or not __debug__:
            config_tenant_logging(self.tenant_info)

        db_info: DbInfo = {
            'db_cluster': tenant_info['db_cluster'],
            'db_name': tenant_info['db_name'],
            'db_password': tenant_info['db_password'],
            'db_username': tenant_info['db_username'],
            'db_connection_string': tenant_info['db_connection_string']
        }

        super().__init__(db_info)

        batch_bucket = self.tenant_info['batch_storage_bucket']
        file_bucket = self.tenant_info['file_storage_bucket']

        self.econ_bucket = self.tenant_info['econ_storage_bucket']
        self.headers = self.tenant_info['headers']
        self.subdomain = self.tenant_info['subdomain']

        self.google_services = GoogleServices(file_bucket, batch_bucket)
        self.pusher = init_pusher_client(self.tenant_info)
        self.big_query_client = BigQueryClient(GCP_PRIMARY_PROJECT_ID)

        # services
        self.scheduling_data_service = SchedulingDataService(self)
        self.data_cache_service = DataCacheService(self)
        self.production_service = ProductionService(self)
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.notification_service = NotificationService(self)
        self.well_service = WellService(self)
        self.cc_to_cc_service = CCToCCService(self)
        self.forecast_mass_edit_service = ForecastImport(self)
        self.forecast_import_aries_service = ForecastImportAries(self)
        self.cc_to_aries_service = CCToAriesService(self)
        self.cc_to_phdwin_service = CCToPhdwinService(self)
        self.file_service = FileService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.auto_mapping_service = AutoMappingService(self)
        self.custom_fields_service = CustomFieldsService(self)
        self.file_import_service = FileImportService(self)
        self.session_service = SessionService(self)
        self.economic_service = EconomicService(self)
        self.econ_output_service = EconOutputService(self)
        self.scenario_service = ScenarioService(self)
        self.assumption_service = AssumptionService(self)
        self.scenario_well_assignments_service = ScenarioWellAssignmentService(self)
        self.aries_service = AriesService(self)
        self.archive_service = ArchiveService(self)
        self.lookup_table_service = LookupTableService(self)
        self.scenarios_service = ScenariosService(self)
        self.shareable_code_service = ShareableCodesService(self, Context)
        self.tc_mass_download_service = TypecurveDownload(self)
        self.tc_workflow_export_service = TypeCurveWorkflowExport(self)
        self.tc_external_service = TypeCurveExternalExport(self)
        self.tc_mass_upload_service = TypecurveUpload(self)
        self.type_curve_service = TypeCurveService(self)
        self.scenario_page_query_service = ScenarioPageQueryService(self)
        self.forecast_export_service = ForecastExport(self)
        self.mosaic_forecast_export_service = MosaicForecastExport(self)
        self.forecast_volumes_export_service = ForecastExportService(self)
        self.forecast_single_well_export = ForecastSingleWellExport(self)
        self.type_curve_apply_service = TypeCurveApplyService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_service = ForecastService(self)
        self.storage_service = StorageService(self)
        self.shapefile_service = ShapefileService(self)
        self.mass_modify_well_life_service = MassModifyWellLifeService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)
        self.carbon_service = CarbonService(self)
        self.econ_service = EconService(self)
        self.embedded_lookup_table_service = EmbeddedLookupTableService(self)

        self.mapbox_uploader = MapboxUploader(self.tenant_info['mapbox_token'])
        self.mapbox_tile_service_uploader = MapboxTileServiceUploader(self)
        self.feature_flags_service = FeatureFlagsService()
