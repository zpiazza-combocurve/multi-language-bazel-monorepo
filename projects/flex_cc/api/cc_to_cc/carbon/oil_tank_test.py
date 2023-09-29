import pandas as pd
import pytest
import uuid
from bson import ObjectId
from api.cc_to_cc.carbon.oil_tank import oil_tank_export, oil_tank_import


# test oil_tank_export with fluid_model
@pytest.mark.unittest
def test_oil_tank_export_with_fluid_model():
    model = {
        'shape': {
            'position': {
                'x': 817,
                'y': 739.5
            }
        },
        'id': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
        'type': 'oil_tank',
        'name': 'Oil Tank',
        'params': {
            'oil_to_gas_ratio': 1,
            # Only the fluid model id is contained in the mongo doc, the dict is added in carbon_export
            'output_gas_fluid_model': {
                'id': ObjectId('62ec5bcfec23a3496058335c'),
                'name': 'Oil Tank Rich',
            }
        },
        'description': ''
    }

    expected_response_model_id = 'oil tank_1'
    expected_response_row = [{
        'Created At': '',
        'Created By': '',
        'Model ID': expected_response_model_id,
        'Model Type': 'unique',
        'Model Name': 'Oil Tank',
        'Description': '',
        'Fluid Model': 'Oil Tank Rich',
        'Flash Gas Ratio (MCF/BBL)': 1,
        'Last Update': '',
        'Updated By': '',
    }]
    response_model_rows, response_model_id = oil_tank_export(model, [])
    assert response_model_rows == expected_response_row
    assert response_model_id == expected_response_model_id


# test oil_tank_export without fluid_model
@pytest.mark.unittest
def test_oil_tank_export_without_fluid_model():
    model = {
        'shape': {
            'position': {
                'x': 817,
                'y': 739.5
            }
        },
        'id': '6dad314d-b52d-4203-a3d7-7bfc4deb1acd',
        'type': 'oil_tank',
        'name': 'Oil Tank',
        'params': {
            'oil_to_gas_ratio': 1,
            'output_gas_fluid_model': None
        },
        'description': ''
    }

    expected_response_model_id = 'oil tank_1'
    expected_response_row = [{
        'Created At': '',
        'Created By': '',
        'Model ID': expected_response_model_id,
        'Model Type': 'unique',
        'Model Name': 'Oil Tank',
        'Description': '',
        'Fluid Model': '',
        'Flash Gas Ratio (MCF/BBL)': 1,
        'Last Update': '',
        'Updated By': '',
    }]

    response_model_rows, response_model_id = oil_tank_export(model, [])

    assert response_model_rows == expected_response_row
    assert response_model_id == expected_response_model_id


@pytest.fixture
def node_df():
    node_df = pd.DataFrame([{
        'Model ID': 'oil tank_1',
        'Model Type': 'unique',
        'Model Name': 'My Oil Tank',
        'Description': '',
        'Fluid Model': 'Oil Tank Rich',
        'Flash Gas Ratio (MCF/BBL)': 1,
        'Last Update': '',
    }, {
        'Model ID': 'oil tank_1',
        'Model Type': 'unique',
        'Model Name': 'My Oil Tank',
        'Description': 'Another row with the same Model ID',
        'Fluid Model': 'Oil Tank Rich',
        'Flash Gas Ratio (MCF/BBL)': 1,
        'Last Update': '',
    }])
    return node_df


@pytest.fixture
def shape_multipliers():
    shape_multipliers = {'x': 1, 'y': 1}
    return shape_multipliers


# test oil_tank_import with fluid_model
@pytest.mark.unittest
def test_oil_tank_import_with_fluid_model(mocker, node_df, shape_multipliers):
    # mock the uuid generated in oil_tank_import
    mocker.patch('api.cc_to_cc.carbon.oil_tank.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    node_df = node_df.head(1)  # only use the first row
    fluid_model_df = pd.DataFrame([{
        '_id': ObjectId('62ec5bcfec23a3496058335c'),
        'name': 'Oil Tank Rich',
    }])

    error_list = []
    expected_response_document = {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'oil_tank',
        'name': 'My Oil Tank',
        'params': {
            'oil_to_gas_ratio': 1,
            'output_gas_fluid_model': ObjectId('62ec5bcfec23a3496058335c')
        },
        'description': ''
    }
    expected_response_document_id = internal_id
    expected_response_fluid_model_id = ObjectId('62ec5bcfec23a3496058335c')

    response_document, response_document_id, response_fluid_model_id = oil_tank_import(
        node_df, fluid_model_df, shape_multipliers, error_list)

    assert response_document == expected_response_document
    assert response_document_id == expected_response_document_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == []


# test oil_tank_import without fluid_model in project
@pytest.mark.unittest
def test_oil_tank_import_without_fluid_model_in_project(mocker, node_df, shape_multipliers):
    # mock the uuid generated in oil_tank_import
    mocker.patch('api.cc_to_cc.carbon.oil_tank.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    node_df = node_df.head(1)  # only use the first row
    fluid_model_df = pd.DataFrame(columns=['_id', 'name'])

    error_list = []
    expected_response_document = {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'oil_tank',
        'name': 'My Oil Tank',
        'params': {
            'oil_to_gas_ratio': 1,
            'output_gas_fluid_model': None
        },
        'description': ''
    }
    expected_response_document_id = internal_id
    expected_response_fluid_model_id = None
    expected_response_error_list = [{'error_message': 'Fluid Model Oil Tank Rich not in project!', 'row_index': 0}]

    response_document, response_document_id, response_fluid_model_id = oil_tank_import(
        node_df, fluid_model_df, shape_multipliers, error_list)

    assert response_document == expected_response_document
    assert response_document_id == expected_response_document_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == expected_response_error_list


# test oil_tank_import duplicated row
@pytest.mark.unittest
def test_oil_tank_import_duplicated_row(mocker, node_df, shape_multipliers):
    # mock the uuid generated in oil_tank_import
    mocker.patch('api.cc_to_cc.carbon.oil_tank.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    fluid_model_df = pd.DataFrame([{
        '_id': ObjectId('62ec5bcfec23a3496058335c'),
        'name': 'Oil Tank Rich',
    }])

    error_list = []
    expected_response_document = {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'oil_tank',
        'name': 'My Oil Tank',
        'params': {
            'oil_to_gas_ratio': 1,
            'output_gas_fluid_model': ObjectId('62ec5bcfec23a3496058335c')
        },
        'description': ''
    }
    expected_response_document_id = internal_id
    expected_response_fluid_model_id = ObjectId('62ec5bcfec23a3496058335c')
    expected_response_error_list = [{'error_message': 'Duplicated row of oil tank_1 Model ID', 'row_index': 1}]

    response_document, response_document_id, response_fluid_model_id = oil_tank_import(
        node_df, fluid_model_df, shape_multipliers, error_list)

    assert response_document == expected_response_document
    assert response_document_id == expected_response_document_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert error_list == expected_response_error_list
