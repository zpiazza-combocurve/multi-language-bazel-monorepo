from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.utils.task_context import TaskContext

from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.collision_report_service import CollisionReportService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from combocurve.services.files.file_service import FileService
from combocurve.services.storage.storage_service import StorageService


class CollisionReportContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'collision-report-cloud-function')

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.files_collection = self.db['files']
        self.custom_header_configurations_collection = self.db['custom-header-configurations']
        self.wells_collection = self.db['wells']

        self.display_templates_service = DisplayTemplatesService(self)
        self.custom_fields_service = CustomFieldsService(self)
        self.collision_report_service = CollisionReportService(self)

        self.storage_service = StorageService(self)
        self.file_service = FileService(self)

    def clean_up(self, task, success):
        return self.collision_report_service.finish_report(task, success)
