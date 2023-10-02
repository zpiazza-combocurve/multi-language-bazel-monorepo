import os
import pytest
import numpy as np
import pandas as pd
from bson.objectid import ObjectId
import importlib.resources

from combocurve.science.scheduling.utils import DEFAULT_CHUNK_SIZE, create_chunks, parse_schedule
from combocurve.science.scheduling.scheduling_data_models import OutputModel

CHUNK_FIXTURE = (
    ([], DEFAULT_CHUNK_SIZE, []),
    (np.arange(10).tolist(), 2, [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]),
    (np.arange(7).tolist(), 2, [[0, 1], [2, 3], [4, 5], [6]]),
    (np.arange(10).tolist(), DEFAULT_CHUNK_SIZE, [np.arange(10).tolist()]),
)

step_names = {
    0: 'Spud',
    1: 'Drill',
    2: 'Completion',
}

resource_names = {
    0: 'Spud Rig 1',
    1: 'Primary Rig 1',
    2: 'Completion Crew 1',
    3: 'Spud Rig 2',
}

output = {
    ObjectId('63c0a59d555eaee8e3f01856'):
    OutputModel.parse_obj({
        'events': [
            {
                'activityStepIdx': 0,
                'activityStepName': 'Spud',
                'mob': {
                    'start': 44937,
                    'end': 44937
                },
                'resourceIdx': 0,
                'resourceName': 'Spud Rig 1',
                'work': {
                    'start': 44938,
                    'end': 44952
                }
            },
            {
                'activityStepIdx': 1,
                'activityStepName': 'Drill',
                'mob': {
                    'start': 44971,
                    'end': 44971
                },
                'resourceIdx': 1,
                'resourceName': 'Primary Rig 1',
                'work': {
                    'start': 44972,
                    'end': 44986
                }
            },
            {
                'activityStepIdx': 2,
                'activityStepName': 'Completion',
                'mob': {
                    'start': 45003,
                    'end': 45003
                },
                'resourceIdx': 2,
                'resourceName': 'Completion Crew 1',
                'work': {
                    'start': 45004,
                    'end': 45018
                }
            },
        ],
        'FPD':
        45019
    }),
    ObjectId('63c0a59d555eaee8e3f01857'):
    OutputModel.parse_obj({
        'events': [
            {
                'activityStepIdx': 0,
                'activityStepName': 'Spud',
                'demob': {
                    'start': 44968,
                    'end': 44968
                },
                'resourceIdx': 0,
                'resourceName': 'Spud Rig 1',
                'work': {
                    'start': 44953,
                    'end': 44967
                }
            },
            {
                'activityStepIdx': 1,
                'activityStepName': 'Drill',
                'demob': {
                    'start': 45002,
                    'end': 45002
                },
                'resourceIdx': 1,
                'resourceName': 'Primary Rig 1',
                'work': {
                    'start': 44987,
                    'end': 45001
                }
            },
            {
                'activityStepIdx': 2,
                'activityStepName': 'Completion',
                'demob': {
                    'start': 45034,
                    'end': 45034
                },
                'resourceIdx': 2,
                'resourceName': 'Completion Crew 1',
                'work': {
                    'start': 45019,
                    'end': 45033
                }
            },
        ],
        'FPD':
        45035
    }),
    ObjectId('63c0a59d555eaee8e3f01858'):
    OutputModel.parse_obj({
        'events': [
            {
                'activityStepIdx': 0,
                'activityStepName': 'Spud',
                'demob': {
                    'start': 44953,
                    'end': 44953
                },
                'mob': {
                    'start': 44937,
                    'end': 44937
                },
                'resourceIdx': 3,
                'resourceName': 'Spud Rig 2',
                'work': {
                    'start': 44938,
                    'end': 44952
                }
            },
            {
                'activityStepIdx': 1,
                'activityStepName': 'Drill',
                'demob': {
                    'start': 44970,
                    'end': 44970
                },
                'mob': {
                    'start': 44954,
                    'end': 44954
                },
                'resourceIdx': 1,
                'resourceName': 'Primary Rig 1',
                'work': {
                    'start': 44955,
                    'end': 44969
                }
            },
            {
                'activityStepIdx': 2,
                'activityStepName': 'Completion',
                'demob': {
                    'start': 44987,
                    'end': 44987
                },
                'mob': {
                    'start': 44971,
                    'end': 44971
                },
                'resourceIdx': 2,
                'resourceName': 'Completion Crew 1',
                'work': {
                    'start': 44972,
                    'end': 44986
                }
            },
        ],
        'FPD':
        44988
    }),
}


@pytest.mark.unittest
@pytest.mark.parametrize('list_, chunk_size, results', CHUNK_FIXTURE)
def test_create_chunks(list_, chunk_size, results):
    for chunk, result in zip(create_chunks(list_, chunk_size), results):
        assert chunk == result


@pytest.mark.unittest
def test_parse_schedule():
    with importlib.resources.open_text("combocurve.science.scheduling", "schedule_outputs.csv", "utf-8-sig") as f:
        schedule_ouput = pd.read_csv(f)
    schedule_ouput['job'] = list(map(ObjectId, schedule_ouput['job']))
    for well, parsed_schedule in parse_schedule(schedule_ouput, resource_names, step_names):
        assert parsed_schedule == output[well]


if __name__ == '__main__':
    test_parse_schedule()
