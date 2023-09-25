from combocurve.shared.env import GCP_REGIONAL_PROJECT_ID, REGION

from ..services.notification_service import NotificationService
from .database import get_connected_db
from .shared_database import get_connected_shared_db
from .cloud_tasks import TasksClient
from .logging import setup_cloud_logging, config_tenant_logging, AppType
from .pusher import init_pusher_client
from .scheduler import SchedulerClient
from .task_service import TaskService


class TaskContext():
    '''
        Base context class for all tasks.
        It must initialize all the collections, services, clients, etc. that the TaskService requires.
        It must also initialize the TaskService, since it's required by the task decorator.
    '''
    def __init__(self, tenant_info, logger_name):
        self.tenant_info = tenant_info
        self.subdomain = tenant_info['subdomain']

        self.db = get_connected_db()

        shared_db = get_connected_shared_db(tenant_info)

        # collections
        self.notifications_collection = self.db['notifications']
        self.tasks_collection = self.db['tasks']

        # shared collections
        self.queues_collection = shared_db['queues']

        # clients
        self.tasks_client = TasksClient(GCP_REGIONAL_PROJECT_ID, REGION)
        self.pusher_client = init_pusher_client(tenant_info)
        self.pusher = self.pusher_client  # for the notification_service
        self.scheduler_client = SchedulerClient(GCP_REGIONAL_PROJECT_ID, REGION)

        # logger
        if not __debug__:
            setup_cloud_logging(logger_name=logger_name, app_type=AppType.CLOUD_FUNCTION)
            config_tenant_logging(tenant_info, use_as_default=True, app_type=AppType.CLOUD_FUNCTION)

        # services
        self.task_service = TaskService(self)
        self.notification_service = NotificationService(self)
