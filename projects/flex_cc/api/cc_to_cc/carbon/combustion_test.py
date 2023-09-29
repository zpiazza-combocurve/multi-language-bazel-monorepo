import pandas as pd
import pytest
import uuid
from api.cc_to_cc.carbon.combustion import combustion_export, combustion_import

models = [
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'node1',
        'type': 'combustion',
        'name': 'Combustion',
        'params': {
            'time_series': {
                'fuel_type': 'distillate_fuel_oil_number_2',
                'assigning_mode': 'facility',
                'criteria': 'entire_well_life',
                'rows': [{
                    'period': 'Flat',
                    'consumption_rate': 0
                }]
            }
        },
        'description': 'Flat combustion'
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': 'node1',
        'type': 'combustion',
        'name': 'Combustion',
        'params': {
            'time_series': {
                'fuel_type': 'electricity_us_average',
                'assigning_mode': 'facility',
                'criteria': 'dates',
                'rows': [{
                    'period': '03/01/2023',
                    'consumption_rate': 0
                }, {
                    'period': '04/01/2023',
                    'consumption_rate': 10
                }]
            }
        },
        'description': 'Time series combustion'
    },
]

expected_response_model_rows = [
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'combustion_1',
        'Model Type': 'unique',
        'Model Name': 'Combustion',
        'Description': 'Flat combustion',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Criteria': 'Flat',
        'Period': 'Flat',
        'Consumption Rate': 0,
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'combustion_1',
        'Model Type': 'unique',
        'Model Name': 'Combustion',
        'Description': 'Time series combustion',
        'Fuel Type': 'Electricity: U.S. Average',
        'Criteria': 'Dates',
        'Period': '03/01/2023',
        'Consumption Rate': 0,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'combustion_1',
        'Model Type': 'unique',
        'Model Name': 'Combustion',
        'Description': 'Time series combustion',
        'Fuel Type': 'Electricity: U.S. Average',
        'Criteria': 'Dates',
        'Period': '04/01/2023',
        'Consumption Rate': 10,
        'Last Update': '',
        'Updated By': '',
    }],
]

expected_response_model_ids = ['combustion_1', 'combustion_1']

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]


# test combustion_export with both flat and dates criteria
@pytest.mark.unittest
@pytest.mark.parametrize('model, expected_response_model_rows, expected_response_model_id',
                         zip(models, expected_response_model_rows, expected_response_model_ids))
def test_combustion_export_flat_dates(model, expected_response_model_rows, expected_response_model_id):
    reponse_model_rows, response_model_id = combustion_export(model, [])
    assert reponse_model_rows == expected_response_model_rows
    assert response_model_id == expected_response_model_id


# test combustion_import with both flat and dates criteria
@pytest.mark.unittest
@pytest.mark.parametrize('node_df, test_index', zip(node_dfs, range(len(node_dfs))))
def test_combustion_import_flat_dates(mocker, node_df, test_index):
    # mock the uuid generated in combustion_import
    mocker.patch('api.cc_to_cc.carbon.combustion.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    expected_response_documents = [
        {
            'shape': {
                'position': {
                    'x': 200,
                    'y': 400
                }
            },
            'id': internal_id,
            'type': 'combustion',
            'name': 'Combustion',
            'params': {
                'time_series': {
                    'fuel_type': 'distillate_fuel_oil_number_2',
                    'assigning_mode': 'facility',
                    'criteria': 'entire_well_life',
                    'rows': [{
                        'period': 'Flat',
                        'consumption_rate': 0
                    }]
                }
            },
            'description': 'Flat combustion'
        },
        {
            'shape': {
                'position': {
                    'x': 200,
                    'y': 400
                }
            },
            'id': internal_id,
            'type': 'combustion',
            'name': 'Combustion',
            'params': {
                'time_series': {
                    'fuel_type':
                    'electricity_us_average',
                    'assigning_mode':
                    'facility',
                    'criteria':
                    'dates',
                    'rows': [{
                        'period': '03/01/2023',
                        'consumption_rate': 0
                    }, {
                        'period': '04/01/2023',
                        'consumption_rate': 10
                    }]
                }
            },
            'description': 'Time series combustion'
        },
    ]

    expected_response_document = expected_response_documents[test_index]

    fluid_model_df = pd.DataFrame(columns=['_id', 'name'])
    shape_multipliers = {'x': 2, 'y': 4}  # test something besides default 1, 1
    error_list = []

    response_document, response_document_id, response_fluid_model_id = combustion_import(
        node_df, fluid_model_df, shape_multipliers, error_list)
    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_fluid_model_id is None
    assert error_list == []
