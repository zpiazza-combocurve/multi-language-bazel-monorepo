from combocurve.utils.task_context import TaskContext

from combocurve.services.production.production_data_export_service import ProductionDataExportService
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.production.production_service import ProductionService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.files.file_service import FileService
from combocurve.services.storage.storage_service import StorageService
from combocurve.dal.client import DAL


class ProductionDataExportContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'production-data-export-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.files_collection = self.db['files']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']

        self.production_data_export_service = ProductionDataExportService(self)
        self.production_service = ProductionService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.custom_fields_service = CustomFieldsService(self)

        self.storage_service = StorageService(self)
        self.file_service = FileService(self)

    def clean_up(self, task, success):
        return self.production_data_export_service.finish_export(task, success)
