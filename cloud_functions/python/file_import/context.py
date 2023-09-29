from combocurve.utils.task_context import TaskContext
from combocurve.models.notification import get_notification_model
from combocurve.models.file_import import get_file_import_models
from combocurve.models.production import get_daily_production_model, get_monthly_production_model
from combocurve.models.well_directional_survey import get_well_directional_survey_model
from combocurve.models.project import get_project_model
from combocurve.models.task import get_task_models
from combocurve.models.well import get_well_model
from combocurve.services.data_import.import_service import ImportService
from cloud_functions.file_import.db_import import FileImportDbService
from cloud_functions.file_import.google_cloud import GoogleServices

import requests
from combocurve.dal.client import DAL
from combocurve.shared.urls import get_main_url


class FileImportCFContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'file-import-cloud-function')
        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])

        batch_bucket = tenant_info['batch_storage_bucket']

        self.google_services = GoogleServices(batch_bucket)

        self.db_name = tenant_info['db_name']
        # models
        self.notification_model = get_notification_model(self.db_name)
        self.notifications_collection = self.notification_model._get_collection()
        (self.file_import_model, _, _, _, _) = get_file_import_models(self.db_name)
        self.file_import_collection = self.file_import_model._get_collection()
        self.monthly_production_model = get_monthly_production_model(self.db_name)
        self.monthly_production_collection = self.monthly_production_model._get_collection()
        self.daily_production_model = get_daily_production_model(self.db_name)
        self.daily_production_collection = self.daily_production_model._get_collection()
        self.well_directional_survey_model = get_well_directional_survey_model(self.db_name)
        self.well_directional_surveys_collection = self.well_directional_survey_model._get_collection()
        self.project_model = get_project_model(self.db_name)
        self.project_collection = self.project_model._get_collection()
        (self.task_model, self.task_progress_model) = get_task_models(self.db_name)
        self.task_collection = self.task_model._get_collection()
        self.well_model = get_well_model(self.db_name)
        self.wells_collection = self.well_model._get_collection()
        self.project_custom_header_collection = self.db['project-custom-headers']
        self.project_custom_headers_data_collection = self.db['project-custom-headers-datas']

        # services
        self.file_import_db_service = FileImportDbService(self)
        self.import_service = ImportService(self)

    def clean_up(self, task, success):
        import_id = task['kindId']
        file_import = self.file_import_model.objects.get(id=import_id)

        if success:
            project = file_import.project
            self.import_service.add_to_project(import_id, project)

            if file_import.importType in ['aries', 'phdwin']:
                import_id_str = str(import_id)
                main_url = get_main_url(self.tenant_info['subdomain'])
                requests.post(f'{main_url}/api/file-imports/start-{file_import.importType}-import/{import_id_str}')
                return file_import.importType

            return 'File import has been completed successfully'

        file_import.change_status("failed")
        return 'File import has been completed successfully'
