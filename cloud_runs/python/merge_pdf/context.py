from combocurve.cloud.concurrent.base_context import ConcurrentBaseContext
from combocurve.utils.pusher import init_pusher_client
from combocurve.utils.logging import setup_cloud_logging, config_tenant_logging, AppType
from combocurve.utils.scheduler import SchedulerClient
from combocurve.shared.config import ENVIRONMENT
from combocurve.models.file import get_file_model
from combocurve.models.notification import get_notification_model
from combocurve.services.storage_service import StorageService
from combocurve.services.file_service import FileService
from combocurve.services.merge_pdf_sevice import MergePdfService
from combocurve.services.notification_service import NotificationService
from cloud_runs.merge_pdf.google_services import GoogleServices
from combocurve.shared.env import GCP_REGIONAL_PROJECT_ID, REGION


class MergePdfContext(ConcurrentBaseContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info)

        self.tenant_info = tenant_info

        self.db_name = self.tenant_info['db_name']
        self.files_bucket = self.tenant_info['file_storage_bucket']
        self.batch_bucket = self.tenant_info['batch_storage_bucket']
        self.tenant = self.tenant_info['subdomain']
        self.subdomain = self.tenant

        self.google_services = GoogleServices(self.files_bucket)

        self.pusher = init_pusher_client(tenant_info)
        self.scheduler_client = SchedulerClient(GCP_REGIONAL_PROJECT_ID, REGION)

        if ENVIRONMENT != 'development' or not __debug__:
            setup_cloud_logging(logger_name='merge-pdf-cloud-run', app_type=AppType.CLOUD_FUNCTION)
            config_tenant_logging(tenant_info, use_as_default=True, app_type=AppType.CLOUD_FUNCTION)

        # models
        self.file_model = get_file_model(self.db_name)
        self.notification_model = get_notification_model(self.db_name)
        self.notifications_collection = self.notification_model._get_collection()

        # services
        self.storage_service = StorageService(self)
        self.file_service = FileService(self)
        self.merge_pdf_service = MergePdfService(self)
        self.notification_service = NotificationService(self)
