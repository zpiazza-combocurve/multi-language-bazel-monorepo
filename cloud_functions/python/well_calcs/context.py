from combocurve.dal.client import DAL
from combocurve.models.notification import get_notification_model
from combocurve.models.task import get_task_models
from combocurve.models.well import get_well_model
from combocurve.services.well_calcs.well_calculations_service import WellCalculationsService
from combocurve.shared.str_helpers import pluralize
from combocurve.utils.task_context import TaskContext


class WellCalcsContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'well-calcs-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])

        db_name = tenant_info['db_name']

        # models
        self.well_model = get_well_model(db_name)
        self.wells_collection = self.well_model._get_collection()
        self.notification_model = get_notification_model(db_name)
        (self.task_model, self.task_progress_model) = get_task_models(db_name)

        # services
        self.well_calcs_service = WellCalculationsService(self)

    def clean_up(self, task, success):
        well_count = len(task.get('body').get('wells'))
        return f'{pluralize(well_count, "well", "wells")} completed'
