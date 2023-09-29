from combocurve.utils.task_context import TaskContext

from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.production.production_service import ProductionService

from cloud_functions.forecast.clean_up import clean_up
from combocurve.dal.client import DAL


class ForecastContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'forecast-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        self.forecasts_collection = self.db['forecasts']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']

        self.forecast_service = ForecastService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.production_service = ProductionService(self)
        self.mass_modify_well_life_service = MassModifyWellLifeService(self)

    def clean_up(self, task, success):
        forecast_id = task['kindId']
        well_count = len(task.get('body').get('wellIds'))

        # if proximity_forecast_task_id is not None:
        #     try:
        #         main_url = get_main_url(self.tenant_info['subdomain'])
        #         requests.get(f"{main_url}/api/task/run-task-by-id/{proximity_forecast_task_id}")

        #         return 'Starting proximity forecast'
        #     except Exception as e:
        #         # need to discuss how to handle error
        #         pass

        return clean_up(self, forecast_id, well_count, success)
