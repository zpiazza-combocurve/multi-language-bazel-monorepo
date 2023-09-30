import pandas as pd
import pytest
import uuid
from bson import ObjectId
from api.cc_to_cc.carbon.pneumatic_compressor import pneumatic_compressor_export, pneumatic_compressor_import
from combocurve.science.network_module.nodes.shared.utils import (PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY,
                                                                  RECIPROCATING_COMPRESSOR_KEY,
                                                                  CENTRIFUGAL_COMPRESSOR_KEY)

# node keys will be included a parameter to pass into the tests.
# Using reciprocating compressor to test time series so it is included twice
node_keys = [
    PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY, RECIPROCATING_COMPRESSOR_KEY, CENTRIFUGAL_COMPRESSOR_KEY,
    RECIPROCATING_COMPRESSOR_KEY
]
models = [
    {
        'shape': {
            'position': {
                'x': 553,
                'y': 952
            }
        },
        'id': 'node',
        'type': 'pneumatic_device',
        'name': 'Pneumatic Device',
        'params': {
            'time_series': {
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'device_type': 'high-bleed',
                    'period': 'Flat'
                }]
            },
            # Only the fluid model id is contained in the mongo doc, the dict is added in carbon_export
            'fluid_model': {
                'id': ObjectId('62f2a758f0518023e4bc6f89'),
                'name': 'Pneumatics'
            }
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 955,
                'y': 1131.5
            }
        },
        'id': 'node4',
        'type': 'pneumatic_pump',
        'name': 'Pneumatic Pump',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
            # Only the fluid model id is contained in the mongo doc, the dict is added in carbon_export
            'fluid_model': {
                'id': ObjectId('62f2a758f0518023e4bc6f89'),
                'name': 'Pneumatics'
            }
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 1028,
                'y': 947.5
            }
        },
        'id': 'node2',
        'type': 'reciprocating_compressor',
        'name': 'Reciprocating Compressor',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
            'fluid_model': None
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 668,
                'y': 1131.5
            }
        },
        'id': 'node3',
        'type': 'centrifugal_compressor',
        'name': 'Centrifugal Compressor',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
            'fluid_model': None
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 1028,
                'y': 947.5
            }
        },
        'id': 'node2',
        'type': 'reciprocating_compressor',
        'name': 'Reciprocating Compressor',
        'params': {
            'time_series': {
                'assigning_mode':
                'facility',
                'criteria':
                'dates',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': '03/01/2023'
                }, {
                    'count': 1,
                    'runtime': 8760,
                    'period': '04/01/2023'
                }]
            },
            'fluid_model': None
        },
        'description': ''
    }
]

expected_response_model_ids = [
    'pneumatic device_1', 'pneumatic pump_1', 'reciprocating compressor_1', 'centrifugal compressor_1',
    'reciprocating compressor_1'
]
expected_response_model_rows = [
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'pneumatic device_1',
            'Model Type': 'unique',
            'Model Name': 'Pneumatic Device',
            'Description': '',
            'Fluid Model': 'Pneumatics',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Count': 0,
            'Runtime (HR/Y)': 8760,
            'Device Type': 'High Bleed',
            'Last Update': '',
            'Updated By': '',
        },
    ],
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'pneumatic pump_1',
            'Model Type': 'unique',
            'Model Name': 'Pneumatic Pump',
            'Description': '',
            'Fluid Model': 'Pneumatics',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Count': 0,
            'Runtime (HR/Y)': 8760,
            'Last Update': '',
            'Updated By': '',
        },
    ],
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'reciprocating compressor_1',
            'Model Type': 'unique',
            'Model Name': 'Reciprocating Compressor',
            'Description': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Count': 0,
            'Runtime (HR/Y)': 8760,
            'Last Update': '',
            'Updated By': '',
        },
    ],
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'centrifugal compressor_1',
            'Model Type': 'unique',
            'Model Name': 'Centrifugal Compressor',
            'Description': '',
            'Criteria': 'Flat',
            'Period': 'Flat',
            'Count': 0,
            'Runtime (HR/Y)': 8760,
            'Last Update': '',
            'Updated By': '',
        },
    ],
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'reciprocating compressor_1',
            'Model Type': 'unique',
            'Model Name': 'Reciprocating Compressor',
            'Description': '',
            'Criteria': 'Dates',
            'Period': '03/01/2023',
            'Count': 0,
            'Runtime (HR/Y)': 8760,
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'reciprocating compressor_1',
            'Model Type': 'unique',
            'Model Name': 'Reciprocating Compressor',
            'Description': '',
            'Criteria': 'Dates',
            'Period': '04/01/2023',
            'Count': 1,
            'Runtime (HR/Y)': 8760,
            'Last Update': '',
            'Updated By': '',
        },
    ],
]

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]

expected_response_fluid_model_ids = [
    ObjectId('62f2a758f0518023e4bc6f89'),
    ObjectId('62f2a758f0518023e4bc6f89'), None, None, None
]


# test pneumatic_compressor_export for each node type and both flat and dates criteria
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, model, expected_response_model_id, expected_response_model_row',
                         zip(node_keys, models, expected_response_model_ids, expected_response_model_rows))
def test_pneumatic_compressor_export_each_node_type(node_key, model, expected_response_model_id,
                                                    expected_response_model_row):
    response_model_row, response_model_id = pneumatic_compressor_export(node_key, model, model_rows=[])
    assert response_model_id == expected_response_model_id
    assert response_model_row == expected_response_model_row


# test pneumatic_compressor_import for each node type and both flat and dates criteria
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, node_df, expected_response_fluid_model_id, test_index',
                         zip(node_keys, node_dfs, expected_response_fluid_model_ids, range(len(node_keys))))
def test_pneumatic_compressor_import_each_node_type(mocker, node_key, node_df, expected_response_fluid_model_id,
                                                    test_index):
    # mock the uuid generated in pneumatic_compressor_import
    mocker.patch('api.cc_to_cc.carbon.pneumatic_compressor.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    expected_response_documents = [{
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'pneumatic_device',
        'name': 'Pneumatic Device',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'device_type': 'high-bleed',
                    'period': 'Flat'
                }]
            },
            'fluid_model': ObjectId('62f2a758f0518023e4bc6f89')
        },
        'description': ''
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'pneumatic_pump',
        'name': 'Pneumatic Pump',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
            'fluid_model': ObjectId('62f2a758f0518023e4bc6f89')
        },
        'description': ''
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'reciprocating_compressor',
        'name': 'Reciprocating Compressor',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
        },
        'description': ''
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'centrifugal_compressor',
        'name': 'Centrifugal Compressor',
        'params': {
            'time_series': {
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'count': 0,
                    'runtime': 8760,
                    'period': 'Flat'
                }]
            },
        },
        'description': ''
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'reciprocating_compressor',
        'name': 'Reciprocating Compressor',
        'params': {
            'time_series': {
                'assigning_mode':
                'facility',
                'criteria':
                'dates',
                'rows': [
                    {
                        'count': 0,
                        'runtime': 8760,
                        'period': '03/01/2023'
                    },
                    {
                        'count': 1,
                        'runtime': 8760,
                        'period': '04/01/2023'
                    },
                ],
            },
        },
        'description': ''
    }]
    expected_response_document = expected_response_documents[test_index]

    fluid_model_df = pd.DataFrame([{
        '_id': ObjectId('62f2a758f0518023e4bc6f89'),
        'name': 'Pneumatics',
    }])
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []

    response_document, response_document_id, response_fluid_model_id = pneumatic_compressor_import(
        node_key, node_df, fluid_model_df, shape_multipliers, error_list)

    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == []
