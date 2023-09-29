from combocurve.utils.task_context import TaskContext
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.production.production_service import ProductionService
from combocurve.services.files.file_service import FileService
from combocurve.services.forecast.charts_service import ForecastChartsService
from combocurve.services.storage.storage_service import StorageService
from combocurve.services.cc_to_aries.cc_to_aries_service import CCToAriesService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService


class ForecastChartsExportContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'forecast-charts-export-cloud-function')

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.forecasts_collection = self.db['forecasts']
        self.forecasts_export_collection = self.db['forecast-exports']
        self.files_collection = self.db['files']
        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']

        self.production_service = ProductionService(self)
        self.forecast_charts_service = ForecastChartsService(self)
        self.storage_service = StorageService(self)
        self.file_service = FileService(self)
        self.cc_to_aries_service = CCToAriesService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)

    def clean_up(self, task, success):
        forecast_export_id = task['kindId']
        file_name_gen = BatchFileNameGenerator(forecast_export_id, -1)
        return self.forecast_charts_service.finish_export(forecast_export_id, success, file_name_gen)
