from combocurve.utils.task_context import TaskContext
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.forecast.forecast_conversion_service import ForecastConversionService
from cloud_functions.forecast_convert_type.clean_up import clean_up


class ForecastConvertTypeContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'forecast-convert-type-cloud-function')

        self.forecasts_collection = self.db['forecasts']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']

        self.forecast_service = ForecastService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_conversion_service = ForecastConversionService(self)

    def clean_up(self, task, success):
        return clean_up(self, task, success)
