import math
from bson.objectid import ObjectId
from pytest_mock_resources import MongoConfig, create_mongo_fixture
import pandas as pd
from pymongo.mongo_client import MongoClient
import pytest
from combocurve.science.scheduling.scheduling_data_models import OutputModel, ScheduleSettings
from combocurve.services.lookup_table_service import EmbeddedLookupTableService
from combocurve.services.project_custom_headers_service import ProjectCustomHeadersService
from combocurve.services.scheduling.scheduling_data_service import (SchedulingDataService, _build_default_v1_output)

from combocurve.services.scheduling.data_service_fixtures import (
    ASSUMPTIONS,
    DETERMINISTIC_FORECAST_DATAS_FIXTURE,
    ECON_INPUT_RESULT_FIXTURE,
    EMBEDDED_LOOKUP_TABLES_FIXTURE,
    INPUT_TABLE_FIXTURE,
    LOOKUP_TABLES_FIXTURE,
    PROBABILISTIC_FORECAST_DATAS_FIXTURE,
    SCHEDULE_INPUT_RESULT_FIXTURE,
    SCHEDULE_SETTINGS_FIXTURE,
    SCHEDULES_FIXTURE,
    WELL_OUTPUTS_FIXTURE,
    WELLS_FIXTURE,
)


@pytest.fixture(scope='session')
def pmr_mongo_config():
    return MongoConfig(image='mongo:5')


mongo = create_mongo_fixture(scope='module')


class MockDataServiceContext():
    def __init__(self, mongo_fixture):
        self.db = MongoClient(**mongo_fixture.pmr_credentials.as_mongo_kwargs())['test_db']
        self.assumptions_collection = self.db['assumptions']
        self.deterministic_forecast_datas_collection = self.db['deterministic-forecast-datas']
        self.embedded_lookup_tables_collection = self.db['embedded-lookup-tables-collection']
        self.forecast_datas_collection = self.db['forecast-datas']
        self.lookup_tables_collection = self.db['lookup-tables']
        self.project_custom_headers_datas_collection = self.db['project-custom-headers-datas']
        self.schedule_settings_collection = self.db['schedule-settings']
        self.schedule_input_qualifiers_collection = self.db['schedule-input-qualifiers']
        self.schedule_well_outputs_collection = self.db['well-outputs']
        self.schedules_collection = self.db['schedules']
        self.wells_collection = self.db['wells']

        self.assumptions_collection.insert_many(ASSUMPTIONS)
        self.deterministic_forecast_datas_collection.insert_many(DETERMINISTIC_FORECAST_DATAS_FIXTURE)
        self.embedded_lookup_tables_collection.insert_many(EMBEDDED_LOOKUP_TABLES_FIXTURE)
        self.forecast_datas_collection.insert_many(PROBABILISTIC_FORECAST_DATAS_FIXTURE)
        self.lookup_tables_collection.insert_many(LOOKUP_TABLES_FIXTURE)
        self.schedule_settings_collection.insert_many(SCHEDULE_SETTINGS_FIXTURE)
        self.schedule_well_outputs_collection.insert_many(WELL_OUTPUTS_FIXTURE)
        self.schedules_collection.insert_many(SCHEDULES_FIXTURE)
        self.wells_collection.insert_many(WELLS_FIXTURE)

        self.project_custom_headers_service = ProjectCustomHeadersService(self)
        self.embedded_lookup_table_service = EmbeddedLookupTableService(self)


@pytest.fixture(scope='module')
def context(mongo):
    yield MockDataServiceContext(mongo)


WELL_SCHEDULE_FIXTURE = (
    (ObjectId('63750838f52f9500123c9b7e'), ObjectId('63a34377ef6ee600127510d7')),
    (ObjectId('63750838f52f9500123c9b7d'), ObjectId('63a34377ef6ee600127510d7')),
    (ObjectId('63b4454fa93ecf00138dacf9'), ObjectId('63d05d7d8c8c590012b5b65a')),
    (ObjectId('63b4454fa93ecf00138dacf9'), ObjectId('63a34377ef6ee600127510d7')),  # Not in fixture.
)

V1_OUTPUTS = [{
    'well': ObjectId('63750838f52f9500123c9b7d'),
    'schedule': ObjectId('63a34377ef6ee600127510d7'),
    'output': _build_default_v1_output(190) | {
        'completeMobStart': 129,
        'completeMobEnd': 129,
        'completeWorkStart': 130,
        'completeWorkEnd': 144,
        'drillMobStart': 67,
        'drillMobEnd': 67,
        'drillWorkStart': 68,
        'drillWorkEnd': 82,
        'preparationWorkStart': 0,
        'preparationWorkEnd': 4,
    }
}, {
    'well': ObjectId('63750838f52f9500123c9b7e'),
    'schedule': ObjectId('63a34377ef6ee600127510d7'),
    'output': _build_default_v1_output(237) | {
        'completeMobStart': 176,
        'completeMobEnd': 176,
        'completeWorkStart': 177,
        'completeWorkEnd': 191,
        'drillMobStart': 114,
        'drillMobEnd': 114,
        'drillWorkStart': 115,
        'drillWorkEnd': 129,
        'preparationWorkStart': 5,
        'preparationWorkEnd': 9,
    }
}, {
    'well': ObjectId('63b4454fa93ecf00138dacf9'),
    'schedule': ObjectId('63d05d7d8c8c590012b5b65a'),
    'output': _build_default_v1_output(154),
}]

WELL_INFO_SCHEDULE = ObjectId('63d44cb2ea5f6e0013d04415')

WELL_INFO_OUTPUT = [
    {
        'well': ObjectId('63b4454fa93ecf00138dad03'),
        'status': 'not_started',
        'pad_name': 'Well-pad-24',
    },
    {
        'well': ObjectId('63d4482fea5f6e0013cfa1df'),
        'rank': 1,
        'status': 'producing',
        'pad_name': 'Wells  two pads-pad-5',
    },
]

SETTINGS_BY_SCHEDULE = ObjectId("63a34377ef6ee600127510d7")

SETTINGS_BY_SCHEDULE_SETTINGS = ObjectId("63a3437aef6ee60012751127")

SCHEDULE_SETTINGS = {
    'name':
    'generic test Config',
    'activitySteps': [{
        'color': '#00ffff',
        'name': 'Pad Preparation',
        'padOperation': 'parallel',
        'stepDuration': {
            'days': 5,
            'useLookup': False
        },
        'delayAfterStep': 0,
        'stepIdx': 0,
        'previousStepIdx': [],
        'requiresResources': True
    }, {
        'name': 'Drilling',
        'color': '#00ffff',
        'padOperation': 'sequence',
        'stepDuration': {
            'days': 15,
            'useLookup': False
        },
        'delayAfterStep': 0,
        'stepIdx': 1,
        'previousStepIdx': [0],
        'requiresResources': True
    }, {
        'name': 'Completion',
        'color': '#00ffff',
        'padOperation': 'sequence',
        'stepDuration': {
            'days': 15,
            'useLookup': False
        },
        'delayAfterStep': 0,
        'stepIdx': 2,
        'previousStepIdx': [1],
        'requiresResources': True
    }, {
        'name': 'Facility Construction',
        'color': None,
        'padOperation': 'parallel',
        'stepDuration': {
            'days': 15,
            'useLookup': False
        },
        'delayAfterStep': 0,
        'stepIdx': 3,
        'previousStepIdx': [2],
        'requiresResources': False
    }],
    'resources': [{
        'stepIdx': [0],
        'active': True,
        'availability': {
            'start': 0,
            'end': 109572
        },
        'demobilizationDays': 0,
        'mobilizationDays': 0,
        'workOnHolidays': True,
        'name': 'Pad Preparation Crew 1'
    }, {
        'stepIdx': [0],
        'active': True,
        'availability': {
            'start': 0,
            'end': 109572
        },
        'demobilizationDays': 0,
        'mobilizationDays': 0,
        'workOnHolidays': True,
        'name': 'Pad Preparation Crew 2'
    }, {
        'stepIdx': [1],
        'active': True,
        'availability': {
            'start': 44914,
            'end': 117964
        },
        'demobilizationDays': 1,
        'mobilizationDays': 1,
        'workOnHolidays': True,
        'name': 'Primary Rig 1'
    }, {
        'stepIdx': [2],
        'active': True,
        'availability': {
            'start': 44914,
            'end': 117964
        },
        'demobilizationDays': 1,
        'mobilizationDays': 1,
        'workOnHolidays': True,
        'name': 'Completion Crew 1'
    }],
    'startProgram':
    44914
}


def schedule_outputs_fixture():
    schedule_one = ObjectId("63a34377ef6ee600127510d7")
    schedule_two = ObjectId("63d05d7d8c8c590012b5b65a")
    well_one_in_schedule_one = ObjectId("63750838f52f9500123c9b7e")
    well_two_in_schedule_one = ObjectId("63750838f52f9500123c9b7d")
    well_three_in_schedule_two = ObjectId("63b4454fa93ecf00138dacf0")
    well_one_output = OutputModel.parse_obj(WELL_OUTPUTS_FIXTURE[0]['output'])
    well_two_output = OutputModel.parse_obj(WELL_OUTPUTS_FIXTURE[1]['output'])
    well_three_output = OutputModel.parse_obj(WELL_OUTPUTS_FIXTURE[-1]['output'])
    kwargs = [
        {
            'schedule': schedule_one,
            'wells': [well_one_in_schedule_one, well_two_in_schedule_one]
        },
        {
            'schedule': schedule_one,
            'wells': well_one_in_schedule_one
        },
        {
            'schedule': [schedule_one, schedule_two],
            'wells': [well_one_in_schedule_one, well_three_in_schedule_two]
        },
    ]
    rets = [
        {
            (schedule_one, well_one_in_schedule_one): well_one_output,
            (schedule_one, well_two_in_schedule_one): well_two_output
        },
        {
            (schedule_one, well_one_in_schedule_one): well_one_output,
        },
        {
            (schedule_one, well_one_in_schedule_one): well_one_output,
            (schedule_two, well_three_in_schedule_two): well_three_output
        },
    ]
    return [(kwarg, ret) for kwarg, ret in zip(kwargs, rets)]


@pytest.mark.integtest
def test_batch_get_schedule_v1(context):
    scheduling_data_service = SchedulingDataService(context)
    batch_assignment_df = pd.DataFrame(WELL_SCHEDULE_FIXTURE, columns=('well', 'schedule'))
    schedules = scheduling_data_service.batch_get_schedule_v1(batch_assignment_df)
    assert schedules == V1_OUTPUTS


# The $fill operator is currently not implemented in mongomock. Need to migrate to
# a new mock library to test this function.
# @pytest.mark.integtest
# def test_schedule_well_info(context):
#     scheduling_data_service = SchedulingDataService(context)
#     well_info = scheduling_data_service.schedule_well_info(WELL_INFO_SCHEDULE)
#     assert isinstance(well_info, list)
#     for well in well_info:
#         assert well in WELL_INFO_OUTPUT
#     assert len(well_info) == len(WELL_INFO_OUTPUT)


@pytest.mark.integtest
def test_schedule_settings(context):
    scheduling_data_service = SchedulingDataService(context)
    settings = scheduling_data_service.schedule_settings(SCHEDULE_SETTINGS)
    assert settings.dict() == ScheduleSettings.from_db_record(SCHEDULE_SETTINGS).dict()
    with pytest.raises(TypeError):
        scheduling_data_service.schedule_settings()
    with pytest.raises(Exception):
        scheduling_data_service.schedule_settings('invalid')


@pytest.mark.integtest
@pytest.mark.parametrize('kwargs, out', schedule_outputs_fixture())
def test_schedule_outputs(context, kwargs, out):
    schedule_data_service = SchedulingDataService(context)
    assert out == schedule_data_service.schedule_outputs(**kwargs)


@pytest.mark.integtest
def test_schedule_input_table(context):
    scheduling_data_service = SchedulingDataService(context)
    input_df = pd.DataFrame(INPUT_TABLE_FIXTURE)
    input_df.set_index('wells', inplace=True)
    project = ObjectId("63a0e8dbe640e5a88bb7d909")
    headers, result = scheduling_data_service.schedule_input_table(input_df, project)
    correct_result = SCHEDULE_INPUT_RESULT_FIXTURE
    assert result.to_dict() == correct_result.to_dict()


@pytest.mark.integtest
def test_econ_input_for_schedule(context):
    scheduling_data_service = SchedulingDataService(context)
    filled_table = SCHEDULE_INPUT_RESULT_FIXTURE
    headers = {doc['_id']: doc for doc in WELLS_FIXTURE}
    result = scheduling_data_service.econ_input_for_schedule(headers, filled_table)
    safe_deep_compare(result, ECON_INPUT_RESULT_FIXTURE)


def safe_deep_compare(left, right):
    assert type(left) == type(right)
    if isinstance(left, dict):
        assert len(left) == len(right)
        for k, v in left.items():
            assert k in right
            safe_deep_compare(v, right[k])
    elif isinstance(left, list):
        assert len(left) == len(right)
        for el, r in zip(left, right):
            safe_deep_compare(el, r)
    elif isinstance(left, float):
        assert math.isclose(left, right)
    else:
        assert left == right
