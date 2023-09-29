import pandas as pd
import pytest
import uuid
from bson import ObjectId
from api.cc_to_cc.carbon.custom_calculation import custom_calculation_export, custom_calculation_import

models = [
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '6ca6b299-e93f-42ce-bb83-9c133cb56f67',
        'type': 'custom_calculation',
        'name': 'Custom Calculation Link',
        'params': {
            'inputs': [{
                'name': 'Oil',
                'assign': False,
                'by': 'oil'
            }, {
                'name': 'Gas',
                'assign': False,
                'by': 'gas'
            }, {
                'name': 'Water',
                'assign': False,
                'by': 'water'
            }],
            'outputs': [{
                'name': 'Gas',
                'assign': False,
                'by': 'gas',
                'category': 'custom_calculation',
                'emission_type': 'N/A'
            }, {
                'name': 'CO2e',
                'assign': True,
                'by': 'CO2e',
                'category': 'custom_calculation',
                'emission_type': 'vented'
            }, {
                'name': 'CO2',
                'assign': False,
                'by': 'CO2',
                'category': 'custom_calculation',
                'emission_type': 'vented'
            }, {
                'name': 'CH4',
                'assign': False,
                'by': 'CH4',
                'category': 'custom_calculation',
                'emission_type': 'vented'
            }, {
                'name': 'N2O',
                'assign': False,
                'by': 'N2O',
                'category': 'custom_calculation',
                'emission_type': 'vented'
            }],
            'formula': {
                'simple': [{
                    'output': 'CO2e',
                    'formula': '100'
                }],
                'advanced': ''
            },
            'fluid_model':
            None,
            'active_formula':
            'simple'
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
        'id': '75fa021a-bed5-4792-a0dd-a0013c14e9a0',
        'type': 'custom_calculation',
        'name': 'Custom Calculation Streams',
        'params': {
            'inputs': [{
                'name': 'Oil',
                'assign': True,
                'by': 'oil'
            }, {
                'name': 'Gas',
                'assign': True,
                'by': 'gas'
            }, {
                'name': 'Water',
                'assign': True,
                'by': 'water'
            }],
            'outputs': [{
                'name': 'Gas',
                'assign': True,
                'by': 'gas',
                'category': 'atmospheric_tank',
                'emission_type': 'N/A'
            }, {
                'name': 'CO2e',
                'assign': False,
                'by': 'CO2e',
                'category': 'reciprocating_compressor',
                'emission_type': 'vented'
            }, {
                'name': 'CO2',
                'assign': True,
                'by': 'CO2',
                'category': 'completions_without_fracturing',
                'emission_type': 'flare'
            }, {
                'name': 'CH4',
                'assign': True,
                'by': 'CH4',
                'category': 'drilling',
                'emission_type': 'combustion'
            }, {
                'name': 'N2O',
                'assign': True,
                'by': 'N2O',
                'category': 'completion',
                'emission_type': 'electricity'
            }],
            'formula': {
                'simple': [{
                    'output': 'Gas',
                    'formula': 'Gas * 1'
                }, {
                    'output': 'CO2',
                    'formula': 'Oil * 2'
                }, {
                    'output': 'CH4',
                    'formula': 'Water * 3'
                }, {
                    'output': 'N2O',
                    'formula': '@FPD(100)'
                }],
                'advanced':
                ''
            },
            # Only the fluid model id is contained in the mongo doc, the dict is added in carbon_export
            'fluid_model': {
                'id': ObjectId('645bd80b688ea361947f0acd'),
                'name': '123',
            },
            'active_formula':
            'simple'
        },
        'description': ''
    }
]

expected_response_model_rows = [
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Link',
            'Description': '',
            'Fluid Model': '',
            'Input': '',
            'Output': 'Gas',
            'Formula': '',
            'Emission Type': '',
            'Category': 'Custom',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Link',
            'Description': '',
            'Fluid Model': '',
            'Input': '',
            'Output': 'CO2e',
            'Formula': '100',
            'Emission Type': 'Vented',
            'Category': 'Custom',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Link',
            'Description': '',
            'Fluid Model': '',
            'Input': '',
            'Output': 'CO2',
            'Formula': '',
            'Emission Type': 'Vented',
            'Category': 'Custom',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Link',
            'Description': '',
            'Fluid Model': '',
            'Input': '',
            'Output': 'CH4',
            'Formula': '',
            'Emission Type': 'Vented',
            'Category': 'Custom',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Link',
            'Description': '',
            'Fluid Model': '',
            'Input': '',
            'Output': 'N2O',
            'Formula': '',
            'Emission Type': 'Vented',
            'Category': 'Custom',
            'Last Update': '',
            'Updated By': '',
        },
    ],
    [
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': 'Oil',
            'Output': '',
            'Formula': '',
            'Emission Type': '',
            'Category': '',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': 'Gas',
            'Output': '',
            'Formula': '',
            'Emission Type': '',
            'Category': '',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': 'Water',
            'Output': '',
            'Formula': '',
            'Emission Type': '',
            'Category': '',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': '',
            'Output': 'Gas',
            'Formula': 'Gas * 1',
            'Emission Type': '',
            'Category': 'Atmospheric Tank',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': '',
            'Output': 'CO2e',
            'Formula': '',
            'Emission Type': 'Vented',
            'Category': 'Reciprocating Compressor',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': '',
            'Output': 'CO2',
            'Formula': 'Oil * 2',
            'Emission Type': 'Flare',
            'Category': 'Completions Without Fracturing',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': '',
            'Output': 'CH4',
            'Formula': 'Water * 3',
            'Emission Type': 'Combustion',
            'Category': 'Drilling Combustion',
            'Last Update': '',
            'Updated By': '',
        },
        {
            'Created At': '',
            'Created By': '',
            'Model ID': 'custom calculation_1',
            'Model Type': 'unique',
            'Model Name': 'Custom Calculation Streams',
            'Description': '',
            'Fluid Model': '123',
            'Input': '',
            'Output': 'N2O',
            'Formula': ' @FPD(100)',
            'Emission Type': 'Electricity',
            'Category': 'Completion Combustion',
            'Last Update': '',
            'Updated By': '',
        },
    ],
]

expected_response_model_ids = ['custom calculation_1', 'custom calculation_1']

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]

expected_response_fluid_model_ids = [None, ObjectId('645bd80b688ea361947f0acd')]


# test custom_calculation_export without and with input streams
@pytest.mark.unittest
@pytest.mark.parametrize('model, expected_response_model_rows, expected_response_model_id',
                         zip(models, expected_response_model_rows, expected_response_model_ids))
def test_custom_calculation_export(model, expected_response_model_rows, expected_response_model_id):
    reponse_model_rows, response_model_id = custom_calculation_export(model, [])
    assert reponse_model_rows == expected_response_model_rows
    assert response_model_id == expected_response_model_id


# test custom_calculation_import without and with input streams
@pytest.mark.unittest
@pytest.mark.parametrize('node_df, expected_response_document, expected_response_fluid_model_id',
                         zip(node_dfs, models, expected_response_fluid_model_ids))
def test_custom_calculation_import(mocker, node_df, expected_response_document, expected_response_fluid_model_id):
    # mock the uuid generated in custom_calculation_import
    mocker.patch('api.cc_to_cc.carbon.custom_calculation.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    expected_response_document.update({'id': internal_id})
    expected_response_document['params'].update({'fluid_model': expected_response_fluid_model_id})
    fluid_model_df = pd.DataFrame([{
        '_id': ObjectId('645bd80b688ea361947f0acd'),
        'name': '123',
    }])
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []

    response_document, response_document_id, response_fluid_model_id = custom_calculation_import(
        node_df, fluid_model_df, shape_multipliers, error_list)

    assert error_list == []
    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_fluid_model_id == expected_response_fluid_model_id
