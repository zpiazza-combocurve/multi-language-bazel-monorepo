from combocurve.dal.client import DAL
from combocurve.shared.str_helpers import pluralize
from combocurve.utils.task_context import TaskContext

from combocurve.models.well import get_well_model

from combocurve.services.remove_leading_zeros_service import RemoveLeadingZeroService


class RemoveLeadingZerosContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'remove-leading-zeros-cloud-function')

        db_name = tenant_info['db_name']

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])

        # models
        self.well_model = get_well_model(db_name)
        self.wells_collection = self.well_model._get_collection()

        # services
        self.remove_leading_zeros_service = RemoveLeadingZeroService(self)

    def clean_up(self, task, success):
        well_count = len(task.get('body').get('wells'))
        return f'{pluralize(well_count, "well", "wells")} completed'
