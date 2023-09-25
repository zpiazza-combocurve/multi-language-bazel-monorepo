# import mongomock
# import pytest

# from combocurve.services.scenario_page_query_service import ScenarioPageQueryService
# from combocurve.services.lookup_table_service import LookupTableService, EmbeddedLookupTableService
# from combocurve.services.econ.econ_service import EconService
# from combocurve.services.carbon.carbon_service import CarbonService
# from combocurve.services.econ.econ_output_service import EconOutputService
# from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
# from combocurve.services.forecast.forecast_service import ForecastService
# from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService
# from combocurve.services.scenario_well_assignments_service import ScenarioWellAssignmentService
# from combocurve.services.econ.econ_and_roll_up_batch_query import econ_batch_input
# from combocurve.services.scheduling.scheduling_data_service import (SchedulingDataService)
# from combocurve.services.econ.econ_service_fixtures import (SCENARIO_WELL_ASSIGNMENTS_FIXTURE, SCENARIO_FIXTURE,
#                                                             ASSUMPTIONS_FIXTURE, WELLS_FIXTURE,
#                                                             ECON_RUN_OUTPUT_1_2_FIXTURE, ECON_RUN_OUTPUT_3_FIXTURE,
#                                                             ECON_BATCH_INPUT_1_2_FIXTURE, ECON_BATCH_INPUT_FIXTURE_3,
#                                                             LOOKUP_TABLE_FIXTURE, EMBEDDED_LOOKUP_TABLES_FIXTURE)

# class MockEconAndRollUpBatchQueryContext():
#     def __init__(self):
#         self.db = mongomock.MongoClient().get_database('test')

#         self.schedule_well_outputs_collection = self.db.get_collection('well-outputs')
#         self.wells_collection = self.db.get_collection('wells')
#         self.scenario_well_assignments_collection = self.db['scenario-well-assignments']
#         self.project_custom_headers_collection = self.db['project-custom-headers']
#         self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
#         self.scenarios_collection = self.db['scenarios']
#         self.lookup_tables_collection = self.db['lookup-tables']
#         self.assumptions_collection = self.db['assumptions']
#         self.forecasts_collection = self.db['forecasts']
#         self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables']

#         self.wells_collection.insert_many(WELLS_FIXTURE)
#         self.scenario_well_assignments_collection.insert_many(SCENARIO_WELL_ASSIGNMENTS_FIXTURE)
#         self.scenarios_collection.insert_many(SCENARIO_FIXTURE)
#         self.assumptions_collection.insert_many(ASSUMPTIONS_FIXTURE)
#         self.lookup_tables_collection.insert_many(LOOKUP_TABLE_FIXTURE)
#         self.embedded_lookup_tables_collection.insert_many(EMBEDDED_LOOKUP_TABLES_FIXTURE)

#         self.project_custom_headers_service = ProjectCustomHeadersService(self)
#         self.econ_service = EconService(self)
#         self.econ_output_service = EconOutputService(self)
#         self.display_templates_service = DisplayTemplatesService(self)
#         self.scenario_well_assignments_service = ScenarioWellAssignmentService(self)
#         self.lookup_table_service = LookupTableService(self)
#         self.embedded_lookup_table_service = EmbeddedLookupTableService(self)
#         self.scenario_page_query_service = ScenarioPageQueryService(self)
#         self.forecast_service = ForecastService(self)
#         self.carbon_service = CarbonService(self)
#         self.project_custom_headers_service = ProjectCustomHeadersService(self)
#         self.scheduling_data_service = SchedulingDataService(self)

# @pytest.fixture
# def context():
#     return MockEconAndRollUpBatchQueryContext()

# def econ_batch_input_fixture_1():
#     scenario_id = ECON_BATCH_INPUT_1_2_FIXTURE[0]['scenario_id']
#     assignment_ids = ECON_BATCH_INPUT_1_2_FIXTURE[0]['assignment_ids']
#     assumption_keys = ECON_BATCH_INPUT_1_2_FIXTURE[0]['assumption_keys']
#     combos = ECON_BATCH_INPUT_1_2_FIXTURE[0]['combos']
#     ghg_id = None
#     project_id = ECON_BATCH_INPUT_1_2_FIXTURE[0]['project_id']
#     out = ECON_RUN_OUTPUT_1_2_FIXTURE
#     return [(scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out)]

# def econ_batch_input_fixture_2():
#     scenario_id = ECON_BATCH_INPUT_1_2_FIXTURE[1]['scenario_id']
#     assignment_ids = ECON_BATCH_INPUT_1_2_FIXTURE[1]['assignment_ids']
#     assumption_keys = ECON_BATCH_INPUT_1_2_FIXTURE[1]['assumption_keys']
#     combos = ECON_BATCH_INPUT_1_2_FIXTURE[1]['combos']
#     ghg_id = None
#     project_id = ECON_BATCH_INPUT_1_2_FIXTURE[1]['project_id']
#     out = ECON_RUN_OUTPUT_1_2_FIXTURE
#     return [(scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out)]

# def econ_batch_input_fixture_3():
#     scenario_id = ECON_BATCH_INPUT_FIXTURE_3[0]['scenario_id']
#     assignment_ids = ECON_BATCH_INPUT_FIXTURE_3[0]['assignment_ids']
#     assumption_keys = ECON_BATCH_INPUT_FIXTURE_3[0]['assumption_keys']
#     combos = ECON_BATCH_INPUT_FIXTURE_3[0]['combos']
#     ghg_id = None
#     project_id = ECON_BATCH_INPUT_FIXTURE_3[0]['project_id']
#     out = ECON_RUN_OUTPUT_3_FIXTURE
#     return [(scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out)]

# # test 1: basic test - no custom combos qualifiers or assumptions
# @pytest.mark.unittest
# @pytest.mark.parametrize('scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out',
#                          econ_batch_input_fixture_1())
# def test_econ_batch_input_1(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out):
#     econ_inputs = econ_batch_input(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id)
#
#     assert out == econ_inputs

# # test 2: custom combos qualifiers definition - capex: 'qualifier1'
# @pytest.mark.unittest
# @pytest.mark.parametrize('scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out',
#                          econ_batch_input_fixture_2())
# def test_econ_batch_input_2(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out):
#     econ_inputs = econ_batch_input(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id)
#     assert out == econ_inputs

# # test 3: assumptions - capex, dates & ownership_reversion
# @pytest.mark.unittest
# @pytest.mark.parametrize('scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out',
#                          econ_batch_input_fixture_3())
# def test_econ_batch_input_3(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id, out):
#     econ_inputs = econ_batch_input(context, scenario_id, assignment_ids, assumption_keys, combos, ghg_id, project_id)
#     assert out == econ_inputs
