from cloud_functions.proximity_forecast.clean_up import clean_up

from combocurve.services.data_cache.data_cache_service import DataCacheService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.production.production_service import ProductionService
from combocurve.services.proximity_forecast.proximity_forecast_service import ProximityForecastService
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService

from combocurve.utils.task_context import TaskContext
from combocurve.dal.client import DAL


class ProximityForecastContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'proximity-forecast-cloud-function')

        self.dal = DAL.connect(tenant_info['subdomain'], tenant_info['headers']['inpt-dal-url'])
        # required database collections
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.forecasts_collection = self.db['forecasts']
        self.proximity_forecast_datas_collection = self.db['proximity-forecast-datas']
        self.wells_collection = self.db['wells']

        self.data_cache_service = DataCacheService(self)
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.mass_modify_well_life_service = MassModifyWellLifeService(self)
        self.production_service = ProductionService(self)
        self.proximity_forecast_service = ProximityForecastService(self)
        self.type_curve_service = TypeCurveService(self)

    def clean_up(self, task, success):
        forecast_id = task['kindId']
        well_count = len(task.get('body').get('wellIds'))
        return clean_up(self, forecast_id, well_count, success)
