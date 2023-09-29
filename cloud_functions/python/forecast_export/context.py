from combocurve.utils.task_context import TaskContext
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.production.production_service import ProductionService
from combocurve.services.files.file_service import FileService
from combocurve.services.forecast.export_service import ForecastExportService
from combocurve.services.storage.storage_service import StorageService


class ForecastExportContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'forecast-export-cloud-function')

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.forecasts_collection = self.db['forecasts']
        self.forecasts_export_collection = self.db['forecast-exports']
        self.files_collection = self.db['files']

        self.production_service = ProductionService(self)
        self.forecast_export_service = ForecastExportService(self)
        self.storage_service = StorageService(self)
        self.file_service = FileService(self)

    def clean_up(self, task, success):
        forecast_export_id = task['kindId']
        return self.forecast_export_service.finish_export(forecast_export_id, success)
