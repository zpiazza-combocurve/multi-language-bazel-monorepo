from combocurve.dal.client import DAL
from combocurve.utils.logging import setup_cloud_logging, config_tenant_logging, AppType
from combocurve.shared.config import ENVIRONMENT
from combocurve.cloud.concurrent.base_context import ConcurrentBaseContext
from combocurve.models.well import get_well_model
from combocurve.models.production import get_daily_production_model, get_monthly_production_model
from combocurve.models.well_directional_survey import get_well_directional_survey_model
from combocurve.models.project import get_project_model
from combocurve.services.external_api_service import ExternalApiService
from combocurve.services.data_import.import_service import ImportService


class ExternalAPIImportContext(ConcurrentBaseContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info)
        self.dal = DAL.connect(tenant_info['headers']['subdomain'], tenant_info['headers']['inpt-dal-url'])

        if ENVIRONMENT != 'development' or not __debug__:
            setup_cloud_logging(logger_name='external-api-import-cloud-function', app_type=AppType.CLOUD_FUNCTION)
            config_tenant_logging(tenant_info, use_as_default=True, app_type=AppType.CLOUD_FUNCTION)

        db_name = tenant_info['db_name']
        # models
        self.well_model = get_well_model(db_name)
        self.wells_collection = self.well_model._get_collection()
        self.monthly_production_model = get_monthly_production_model(db_name)
        self.monthly_production_collection = self.monthly_production_model._get_collection()
        self.daily_production_model = get_daily_production_model(db_name)
        self.daily_production_collection = self.daily_production_model._get_collection()
        self.well_directional_survey_model = get_well_directional_survey_model(db_name)
        self.well_directional_surveys_collection = self.well_directional_survey_model._get_collection()
        self.project_model = get_project_model(db_name)
        self.project_collection = self.project_model._get_collection()
        self.project_custom_header_collection = self.db['project-custom-headers']
        self.project_custom_headers_data_collection = self.db['project-custom-headers-datas']

        # services
        self.external_api_service = ExternalApiService(self)
        self.import_service = ImportService(self)
