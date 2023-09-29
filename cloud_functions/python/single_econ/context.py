import logging

from combocurve.services.feature_flags.feature_flags_service import FeatureFlagsService
from combocurve.services.scheduling.scheduling_data_service import SchedulingDataService
from combocurve.utils.task_context import TaskContext
from combocurve.utils.exceptions import get_exception_info
from combocurve.services.scenario_well_assignments_service import ScenarioWellAssignmentService
from combocurve.services.lookup_table_service import LookupTableService, EmbeddedLookupTableService
from combocurve.services.scenario_page_query_service import ScenarioPageQueryService

from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.big_query_client import BigQueryClient
from combocurve.shared.cloud_storage_client import CloudStorageClient
from combocurve.services.econ.econ_service import EconService
from combocurve.services.carbon.carbon_service import CarbonService
from combocurve.services.econ.econ_file_service import EconFileService
from combocurve.services.econ.econ_output_service import EconOutputService
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.services.type_curve.tc_apply_service import TypeCurveApplyService
from combocurve.services.forecast.deterministic_forecast_service import DeterministicForecastService
from combocurve.services.forecast.forecast_service import ForecastService
from combocurve.services.production.production_service import ProductionService
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService

from combocurve.dal.client import DAL

FILE_TYPE = 'parquet'


class SingleEconContext(TaskContext):
    def __init__(self, tenant_info):
        super().__init__(tenant_info, 'single-econ-cloud-function')

        self.dal = DAL.connect(self.subdomain, tenant_info['headers']['inpt-dal-url'])
        self.big_query_client = BigQueryClient(GCP_PRIMARY_PROJECT_ID)
        self.cloud_storage_client = CloudStorageClient()

        self.econ_runs_datas_collection = self.db['econ-runs-datas']
        self.econ_runs_collection = self.db['econ-runs']
        self.ghg_runs_collection = self.db['ghg-runs']
        self.scenarios_collection = self.db['scenarios']
        self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']
        self.forecast_lookup_tables_collection = self.db['forecast-lookup-tables']
        self.forecasts_collection = self.db['forecasts']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.wells_collection = self.db['wells']
        self.schedule_well_outputs_collection = self.db['schedule-well-outputs']
        self.assumptions_collection = self.db['assumptions']

        self.type_curves_collection = self.db['type-curves']
        self.type_curve_fits_collection = self.db['type-curve-fits']
        self.type_curve_normalizations_collection = self.db['type-curve-normalizations']
        self.networks_collection = self.db['networks']
        self.facilities_collection = self.db['facilities']
        self.users_collection = self.db['users']

        self.project_custom_headers_collection = self.db['project-custom-headers']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']

        self.scheduling_data_service = SchedulingDataService(self)
        self.production_service = ProductionService(self)
        self.tc_normalization_service = TypeCurveNormalizationService(self)
        self.econ_service = EconService(self)
        self.econ_output_service = EconOutputService(self)
        self.econ_file_service = EconFileService(self)
        self.display_templates_service = DisplayTemplatesService(self)
        self.scenario_well_assignments_service = ScenarioWellAssignmentService(self)
        self.lookup_table_service = LookupTableService(self)
        self.embedded_lookup_table_service = EmbeddedLookupTableService(self)
        self.scenario_page_query_service = ScenarioPageQueryService(self)
        self.type_curve_apply_service = TypeCurveApplyService(self)
        self.deterministic_forecast_service = DeterministicForecastService(self)
        self.forecast_service = ForecastService(self)
        self.carbon_service = CarbonService(self)
        self.project_custom_headers_service = ProjectCustomHeadersService(self)
        self.feature_flags_service = FeatureFlagsService()

    def clean_up(self, task, success):
        run_id = task['kindId']  # run_id from document, already ObjectId
        is_ghg = task['body'].get('isGhg', False)
        try:
            if is_ghg:
                run = self.carbon_service.get_run(run_id)

                if not success:
                    update = {
                        '$set': {
                            'status': 'failed',
                        }
                    }
                    self.ghg_runs_collection.update_one({'_id': run_id}, update)
                # else:
                #     self.carbon_service.load_batch_result_to_bigquery(str(run_id))
            else:
                run = self.econ_runs_collection.find_one({'_id': run_id})
                aggregate = True  # default to aggregate the results
                run_mode = run['outputParams'].get('runMode', 'full')
                if run_mode == 'fast':
                    aggregate = False

                # load batch results
                for data_type in ['well-header', 'monthly', 'one-liner']:
                    self.econ_file_service.load_batch_result_to_bigquery(str(run_id), data_type, file_type=FILE_TYPE)

                if not success:
                    update = {
                        '$set': {
                            'status': 'failed',
                        }
                    }
                    self.econ_runs_collection.update_one({'_id': run_id}, update)
                else:
                    self.econ_service.clean_up(run, aggregate)

        except Exception as e:
            error_info = get_exception_info(e)
            if is_ghg:
                logging.error('GHG run failed', extra={'metadata': error_info})
                self.ghg_runs_collection.update_one({'_id': run_id},
                                                    {'$set': {
                                                        'status': 'failed',
                                                        'error': error_info
                                                    }})
            else:
                logging.error('Econ run failed', extra={'metadata': error_info})
                self.econ_runs_collection.update_one({'_id': run_id},
                                                     {'$set': {
                                                         'status': 'failed',
                                                         'error': error_info
                                                     }})
