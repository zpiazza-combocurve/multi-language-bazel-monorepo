from combocurve.services.scheduling.scheduling_data_service import SchedulingDataService
from combocurve.utils.task_context import TaskContext

from combocurve.services.rollUp.roll_up_service import RollUpService
from cloud_functions.rollUp.clean_up import clean_up

from combocurve.services.scenario_well_assignments_service import ScenarioWellAssignmentService
from combocurve.services.lookup_table_service import LookupTableService
from combocurve.services.scenario_page_query_service import ScenarioPageQueryService
from combocurve.services.type_curve.tc_apply_service import TypeCurveApplyService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.econ.econ_output_service import EconOutputService
from combocurve.services.econ.econ_service import EconService
from combocurve.services.carbon.carbon_service import CarbonService
from combocurve.services.lookup_table_service import EmbeddedLookupTableService
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.production.production_service import ProductionService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID, GCP_REGIONAL_PROJECT_ID
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService
from combocurve.dal.client import DAL


class RollUpContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'rollUp-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']
        self.networks_collection = self.db['networks']
        self.facilities_collection = self.db['facilities']

        self.primary_project_id = GCP_PRIMARY_PROJECT_ID
        self.regional_project_id = GCP_REGIONAL_PROJECT_ID

        self.scen_roll_up_runs_collection = self.db['scen-roll-up-runs']
        self.roll_up_groups_collection = self.db['roll-up-groups']
        self.forecast_roll_up_runs_collection = self.db['forecast-roll-up-runs']
        self.scenarios_collection = self.db['scenarios']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.forecasts_collection = self.db['forecasts']
        self.forecast_lookup_tables_collection = self.db['forecast-lookup-tables']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.schedule_well_outputs_collection = self.db['schedule-well-outputs']
        self.assumptions_collection = self.db['assumptions']
        self.wells_collection = self.db['wells']
        self.users_collection = self.db['users']
        self.projects_collection = self.db['projects']

        self.type_curves_collection = self.db['type-curves']
        self.type_curve_fits_collection = self.db['type-curve-fits']
        self.type_curve_normalizations_collection = self.db['type-curve-normalizations']
        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']

        self.production_service = ProductionService(self)  # need to be put before the service use it
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.roll_up_service = RollUpService(self)
        self.scenario_well_assignments_service = ScenarioWellAssignmentService(self)
        self.lookup_table_service = LookupTableService(self)
        self.scenario_page_query_service = ScenarioPageQueryService(self)
        self.type_curve_apply_service = TypeCurveApplyService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_service = ForecastService(self)
        self.econ_output_service = EconOutputService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)
        self.econ_service = EconService(self)
        self.carbon_service = CarbonService(self)
        self.embedded_lookup_table_service = EmbeddedLookupTableService(self)
        self.scheduling_data_service = SchedulingDataService(self)

        self.big_query_client = BigQueryClient(self.primary_project_id)
        self.cloud_storage_client = CloudStorageClient()

    def clean_up(self, task, success):
        run_id = task['kindId']
        return clean_up(self, run_id, success)
