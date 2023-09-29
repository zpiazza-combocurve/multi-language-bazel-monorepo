from combocurve.utils.task_context import TaskContext
from combocurve.models.file import get_file_model
from combocurve.services.file_service import FileService
from combocurve.services.storage_service import StorageService
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.services.econ.econ_output_service import EconOutputService
from cloud_functions.econ_report_by_well.google_cloud import GoogleServices
from cloud_functions.econ_report_by_well.by_well_report_service import ByWellReportService

from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID


class EconReportByWellCFContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'econ-report-by-well')

        self.db_name = self.tenant_info['db_name']
        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']
        self.headers = self.tenant_info['headers']

        self.google_services = GoogleServices(self.files_bucket)
        self.big_query_client = BigQueryClient(GCP_PRIMARY_PROJECT_ID)

        # models
        self.file_model = get_file_model(self.db_name)

        # collections
        self.economic_collection = self.db['econ-runs']
        self.economic_data_collection = self.db['econ-runs-datas']
        self.project_collection = self.db['projects']
        self.scenarios_collection = self.db['scenarios']
        self.wells_collection = self.db['wells']
        self.econ_groups_collection = self.db['econ-groups']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']

        # services
        self.by_well_report_service = ByWellReportService(self)
        self.storage_service = StorageService(self)
        self.file_service = FileService(self)
        self.econ_output_service = EconOutputService(self)

    def clean_up(self, task, success):
        econ_run_id = task['body']['econRunId']
        file_name = task['body']['fileName']
        user_id = task['user']
        notification_id = task['progress']['emitter']
        project_id = task['body']['project']
        return self.by_well_report_service.merge_batches(econ_run_id, file_name, user_id, notification_id, project_id)
