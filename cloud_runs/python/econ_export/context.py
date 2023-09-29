from combocurve.utils.pusher import init_pusher_client
from combocurve.models.file import get_file_model
from combocurve.models.notification import get_notification_model
from combocurve.models.economics import get_econ_run_model
from combocurve.services.storage_service import StorageService
from combocurve.services.notification_service import NotificationService
from combocurve.utils.tenant_info import TenantInfo
from cloud_runs.econ_export.google_services import GoogleServices
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.econ.econ_file_service import EconFileService
from combocurve.services.econ.econ_service import EconService
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.econ.econ_output_service import EconOutputService
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.services.file_service import FileService as OneLinerFileService
from combocurve.services.files.file_service import FileService

from mongoengine import connect


class EconExportContext():

    def __init__(self, tenant_info: TenantInfo):
        self.tenant_info = tenant_info

        self.db_name = self.tenant_info['db_name']
        self.db_connection_string = self.tenant_info['db_connection_string']
        self.db = connect(db=self.db_name, alias=self.db_name, host=self.db_connection_string)[self.db_name]

        self.econ_runs_datas_collection = self.db['econ-runs-datas']
        self.econ_runs_collection = self.db['econ-runs']
        self.econ_groups_collection = self.db['econ-groups']
        self.econ_report_export_configurations = self.db['econ-report-export-configurations']
        self.econ_report_export_default_user_configurations = self.db['econ-report-export-default-user-configurations']
        self.ghg_runs_collection = self.db['ghg-runs']
        self.scenarios_collection = self.db['scenarios']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']
        self.forecast_lookup_tables_collection = self.db['forecast-lookup-tables']
        self.forecasts_collection = self.db['forecasts']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.wells_collection = self.db['wells']
        self.schedule_well_outputs_collection = self.db['schedule-well-outputs']
        self.assumptions_collection = self.db['assumptions']
        self.type_curves_collection = self.db['type-curves']
        self.type_curve_fits_collection = self.db['type-curve-fits']
        self.type_curve_normalizations_collection = self.db['type-curve-normalizations']
        self.networks_collection = self.db['networks']
        self.facilities_collection = self.db['facilities']
        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']
        self.files_collection = self.db['files']

        self.economic_model = get_econ_run_model(self.db_name)

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']
        self.tenant = self.tenant_info['subdomain']
        self.headers = self.tenant_info['headers']
        self.subdomain = self.tenant

        self.google_services = GoogleServices(self.files_bucket)
        self.cloud_storage_client = CloudStorageClient()
        self.big_query_client = BigQueryClient(GCP_PRIMARY_PROJECT_ID)

        self.pusher = init_pusher_client(tenant_info)

        # models
        self.file_model = get_file_model(self.db_name)
        self.notification_model = get_notification_model(self.db_name)
        self.notifications_collection = self.notification_model._get_collection()
        self.economic_collection = self.db['econ-runs']
        self.economic_data_collection = self.db['econ-runs-datas']

        # services
        self.storage_service = StorageService(self)
        self.notification_service = NotificationService(self)
        self.custom_fields_service = CustomFieldsService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.econ_file_service = EconFileService(self)
        self.econ_service = EconService(self)
        self.econ_output_service = EconOutputService(self)
        self.one_liner_file_service = OneLinerFileService(self)
        self.file_service = FileService(self)
