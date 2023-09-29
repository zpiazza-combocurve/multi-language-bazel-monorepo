import os
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID, REGION
from combocurve.utils.task_context import TaskContext

from cloud_functions.supervisor.services.supervisor_service import SupervisorService

CLOUD_FUNCTIONS_URL = os.environ.get('CLOUD_FUNCTIONS_URL')  # relevant on development only


class SupervisorContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'supervisor-cloud-function')

        self.cloud_functions_url = CLOUD_FUNCTIONS_URL or 'https://{}-{}.cloudfunctions.net'.format(
            REGION, GCP_PRIMARY_PROJECT_ID)

        # collections
        self.econ_runs_collection = self.db['econ-runs']

        # services
        self.supervisor_service = SupervisorService(self)
