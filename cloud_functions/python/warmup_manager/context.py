import os

from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID, GCP_REGIONAL_PROJECT_ID, REGION
from combocurve.utils.cloud_tasks import TasksClient
from combocurve.utils.logging import setup_cloud_logging, AppType

from .service import WarmupManagerService

_CLOUD_FUNCTIONS_URL = os.environ.get('CLOUD_FUNCTIONS_URL')  # relevant on development only


class WarmupManagerContext():
    def __init__(self, shared_db):
        if not __debug__:
            setup_cloud_logging(logger_name='warmup-manager-cloud-function', app_type=AppType.CLOUD_FUNCTION)

        self.cloud_functions_url = _CLOUD_FUNCTIONS_URL or 'https://{}-{}.cloudfunctions.net'.format(
            REGION, GCP_PRIMARY_PROJECT_ID)

        self.tasks_client = TasksClient(GCP_REGIONAL_PROJECT_ID, REGION)
        self.warmup_manager_service = WarmupManagerService(self)

        self.queues_collection = shared_db['queues']
