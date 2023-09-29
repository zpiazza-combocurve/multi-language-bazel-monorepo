import pandas as pd
import pytest
import uuid
from api.cc_to_cc.carbon.stream_shared_node import stream_shared_node_export, stream_shared_node_import
from combocurve.science.network_module.nodes.shared.utils import (ASSOCIATED_GAS_KEY, ATMOSPHERE_KEY, CAPTURE_KEY,
                                                                  ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY)

node_keys = ASSOCIATED_GAS_KEY, ATMOSPHERE_KEY, CAPTURE_KEY, ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY

models = [
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'type': 'associated_gas',
        'name': 'Associated Gas',
        'params': {},
        'description': 'This one has a description'
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'type': 'atmosphere',
        'name': 'Atmosphere',
        'params': {
            'emission_type': 'vented'
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'type': 'capture',
        'name': 'Capture',
        'params': {
            'emission_type': 'capture'
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'type': 'econ_output',
        'name': 'Econ Output',
        'params': {},
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'f6de439b-f8fe-4e1c-b22c-b9601bce2925',
        'type': 'liquids_unloading',
        'name': 'Liquids Unloading',
        'params': {},
        'description': '5'
    },
]

expected_response_model_ids = ['associated gas_1', 'atmosphere_1', 'capture_1', 'econ output_1', 'liquids unloading_1']

expected_response_model_rows = [
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'associated gas_1',
        'Model Type': 'unique',
        'Model Name': 'Associated Gas',
        'Description': 'This one has a description',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'atmosphere_1',
        'Model Type': 'unique',
        'Model Name': 'Atmosphere',
        'Description': '',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'capture_1',
        'Model Type': 'unique',
        'Model Name': 'Capture',
        'Description': '',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'econ output_1',
        'Model Type': 'unique',
        'Model Name': 'Econ Output',
        'Description': '',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'liquids unloading_1',
        'Model Type': 'unique',
        'Model Name': 'Liquids Unloading',
        'Description': '5',
        'Last Update': '',
        'Updated By': '',
    }],
]

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]


# test stream_shared_node_export for each node key
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, model, expected_response_model_id, expected_response_model_row',
                         zip(node_keys, models, expected_response_model_ids, expected_response_model_rows))
def test_stream_shared_node_export(node_key, model, expected_response_model_id, expected_response_model_row):
    response_model_row, response_model_id = stream_shared_node_export(node_key, model, model_rows=[])
    assert response_model_row == expected_response_model_row
    assert response_model_id == expected_response_model_id


# test stream_shared_node_import for each node key
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, node_df, test_index', zip(node_keys, node_dfs, range(len(node_keys))))
def test_stream_shared_node_import(mocker, node_key, node_df, test_index):
    # mock the uuid generated in stream_shared_node_import
    mocker.patch('api.cc_to_cc.carbon.stream_shared_node.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    expected_response_documents = [
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'associated_gas',
            'name': 'Associated Gas',
            'params': {},
            'description': 'This one has a description'
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'atmosphere',
            'name': 'Atmosphere',
            'params': {
                'emission_type': 'vented'
            },
            'description': ''
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'capture',
            'name': 'Capture',
            'params': {
                'emission_type': 'capture'
            },
            'description': ''
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'econ_output',
            'name': 'Econ Output',
            'params': {},
            'description': ''
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'liquids_unloading',
            'name': 'Liquids Unloading',
            'params': {},
            'description': '5'
        },
    ]
    fluid_model_df = pd.DataFrame(columns=['_id', 'name'])
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []

    response_document, response_document_id, response_fluid_model_id = stream_shared_node_import(
        node_key, node_df, fluid_model_df, shape_multipliers, error_list)

    assert response_document == expected_response_documents[test_index]
    assert response_document_id == internal_id
    assert response_fluid_model_id is None
    assert error_list == []
