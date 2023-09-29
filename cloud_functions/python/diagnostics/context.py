import datetime

from combocurve.shared.str_helpers import pluralize
from combocurve.utils.task_context import TaskContext
from combocurve.services.diagnostics.diagnostic_service import DiagnosticService
from combocurve.services.production.production_service import ProductionService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.dal.client import DAL


class DiagnosticContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'diagnostics-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        self.forecasts_collection = self.db['forecasts']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']

        self.diagnostic_service = DiagnosticService(self)
        self.production_service = ProductionService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_service = ForecastService(self)

    def clean_up(self, task, success):
        forecast_id = task['kindId']
        well_count = len(task.get('body').get('wellIds'))

        forecast = self.forecasts_collection.find_one_and_update({'_id': forecast_id},
                                                                 {'$set': {
                                                                     'diagDate': datetime.datetime.utcnow()
                                                                 }})

        return f'Diagnosed {pluralize(well_count, "well", "wells")}. Forecast "{forecast["name"]}"'
