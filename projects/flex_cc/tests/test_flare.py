import pandas as pd
import pytest
import uuid
from api.cc_to_cc.carbon.flare import flare_export, flare_import


@pytest.mark.unittest
def test_flare_export():
    model = {
        'shape': {
            'position': {
                'x': 1010,
                'y': -70
            }
        },
        'id': 'e6568d87-68d5-4e45-81b7-7c9c73921f4c',
        'type': 'flare',
        'name': 'Flare',
        'params': {
            'fuel_hhv': {
                'value': 0.001235,
                'unit': 'MMBtu/scf'
            },
            'pct_flare_efficiency': 98,
            'pct_flare_unlit': 0,
        },
        'description': ''
    }
    expected_response_model_id = 'flare_1'
    expected_response_row = [{
        'Created At': '',
        'Created By': '',
        'Model ID': expected_response_model_id,
        'Model Type': 'unique',
        'Model Name': 'Flare',
        'Description': '',
        'Flare Efficency (%)': 98,
        'Flare Unlit (%)': 0,
        'Fuel HHV (MMBtu/scf)': 0.001235,
        'Last Update': '',
        'Updated By': '',
    }]

    response_model_rows, response_model_id = flare_export(model, [])

    assert response_model_rows == expected_response_row
    assert response_model_id == expected_response_model_id


@pytest.mark.unittest
def test_flare_import(mocker):
    # mock the uuid generated in flare_import
    mocker.patch('api.cc_to_cc.carbon.flare.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    node_df = pd.DataFrame([{
        'Model ID': 'flare_1',
        'Model Type': 'unique',
        'Model Name': 'Flare',
        'Description': '',
        'Flare Efficency (%)': 98,
        'Flare Unlit (%)': 0,
        'Fuel HHV (MMBtu/scf)': 0.001235,
        'Last Update': '',
    }])
    fluid_model_df = pd.DataFrame()
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []
    expected_response_document = {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'flare',
        'name': 'Flare',
        'params': {
            'fuel_hhv': {
                'value': 0.001235,
                'unit': 'MMBtu/scf'
            },
            'pct_flare_efficiency': 98,
            'pct_flare_unlit': 0,
        },
        'description': ''
    }
    response_document, response_document_id, response_fluid_model_id = flare_import(
        node_df,
        fluid_model_df,
        shape_multipliers,
        error_list,
    )
    expected_response_document_id = internal_id
    expected_response_fluid_model_id = None
    assert response_document == expected_response_document
    assert response_document_id == expected_response_document_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == []


@pytest.mark.unittest
def test_flare_import_duplicated_row(mocker):
    # mock the uuid generated in flare_import
    mocker.patch('api.cc_to_cc.carbon.flare.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    node_df = pd.DataFrame([{
        'Model ID': 'flare_1',
        'Model Type': 'unique',
        'Model Name': 'Flare',
        'Description': '',
        'Flare Efficency (%)': 98,
        'Flare Unlit (%)': 0,
        'Fuel HHV (MMBtu/scf)': 0.001235,
        'Last Update': '',
    }, {
        'Model ID': 'flare_1',
        'Model Type': 'unique',
        'Model Name': 'Flare',
        'Description': 'Another row with the same model ID',
        'Flare Efficency (%)': 90,
        'Flare Unlit (%)': 10,
        'Fuel HHV (MMBtu/scf)': 0.001235,
        'Last Update': '',
    }])
    fluid_model_df = pd.DataFrame()
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []
    expected_response_document = {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'flare',
        'name': 'Flare',
        'params': {
            'fuel_hhv': {
                'value': 0.001235,
                'unit': 'MMBtu/scf'
            },
            'pct_flare_efficiency': 98,
            'pct_flare_unlit': 0,
        },
        'description': ''
    }
    expected_response_document_id = internal_id
    expected_response_fluid_model_id = None
    expected_response_error_list = [{'error_message': 'Duplicated row of flare_1 Model ID', 'row_index': 1}]

    response_document, response_document_id, response_fluid_model_id = flare_import(
        node_df,
        fluid_model_df,
        shape_multipliers,
        error_list,
    )

    assert response_document == expected_response_document
    assert response_document_id == expected_response_document_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == expected_response_error_list
