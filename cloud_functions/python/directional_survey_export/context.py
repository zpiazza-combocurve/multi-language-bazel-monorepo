from combocurve.utils.task_context import TaskContext
from combocurve.shared.batch_file_name_generator import BatchFileNameGenerator
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.directional_survey.directional_survey_export_service import DirectionalSurveyExportService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.files.file_service import FileService
from combocurve.services.storage.storage_service import StorageService


class DirectionalSurveyExportContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'directional-survey-export-cloud-function')

        self.db_name = tenant_info['db_name']

        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']

        self.cloud_storage_client = CloudStorageClient()

        self.wells_collection = self.db['wells']
        self.well_directional_surveys_collection = self.db['well-directional-surveys']
        self.files_collection = self.db['files']

        self.directional_survey_export_service = DirectionalSurveyExportService(self)
        self.display_templates_service = DisplayTemplatesService(self)

        self.storage_service = StorageService(self)
        self.file_service = FileService(self)

    def clean_up(self, task, success):
        file_name_generator = BatchFileNameGenerator(f'directional-survey-export-{task["_id"]}', -1)
        return self.directional_survey_export_service.finish_export(file_name_generator, success)
