from combocurve.utils.task_context import TaskContext

from combocurve.services.wells_export.wells_export_service import WellsExportService
from combocurve.services.well_service import WellService
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.files.file_service import FileService
from combocurve.services.storage.storage_service import StorageService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService


class WellsExportContext(TaskContext):

    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'wells-export-cloud-function')

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.files_collection = self.db['files']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']
        self.wells_collection = self.db['wells']
        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']

        self.well_service = WellService(self)
        self.wells_export_service = WellsExportService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.custom_fields_service = CustomFieldsService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)

        self.storage_service = StorageService(self)
        self.file_service = FileService(self)

    def clean_up(self, task, success):
        return self.wells_export_service.finish_export(task, success)
