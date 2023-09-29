from combocurve.dal.client import DAL
from combocurve.models.economics import get_econ_run_data_model, get_econ_run_model
from combocurve.models.well import get_well_model
from combocurve.services.well_calcs.well_calculations_service import WellCalculationsService
from combocurve.shared.str_helpers import pluralize
from combocurve.utils.task_context import TaskContext


class EconWellCalcsContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'econ-well-calcs-cloud-function')
        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])

        db_name = tenant_info['db_name']

        # models
        self.well_model = get_well_model(db_name)
        self.wells_collection = self.well_model._get_collection()
        self.econ_runs_model = get_econ_run_model(db_name)
        self.econ_runs_collection = self.econ_runs_model._get_collection()
        self.econ_runs_datas_model = get_econ_run_data_model(db_name)
        self.econ_runs_datas_collection = self.econ_runs_datas_model._get_collection()

        # services
        self.well_calcs_service = WellCalculationsService(self)

    def clean_up(self, task, success):
        well_count = len(task.get('body').get('wellIds'))
        return f'{pluralize(well_count, "well", "wells")} completed'
