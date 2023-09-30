import pandas as pd
import pytest
import uuid
from bson import ObjectId
from api.cc_to_cc.carbon.well_group import well_group_export, well_group_wells_export, well_group_import

# test well_group_export with and without fluid_model
models = [
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'type': 'well_group',
        'name': 'Well Group',
        'params': {
            'wells': [ObjectId('5e272d3bb78910dd2a1be75a')],
            # Only the fluid model id is contained in the mongo doc, the dict is added in carbon_export
            'fluid_model': {
                '_id': ObjectId('642c990009e3f300120dd027'),
                'name': '5 - 90 - 10'
            }
        },
        'description': 'Well group with fluid model and wells'
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '93dcc305-2dfb-4ad8-af10-8e1f43de120f',
        'type': 'well_group',
        'name': 'Well Group',
        'params': {
            'wells': [],
            'fluid_model': None
        },
        'description': 'Well group without fluid model and wells'
    }
]

expected_response_model_rows = [
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'well group_1',
        'Model Type': 'unique',
        'Model Name': 'Well Group',
        'Wells': 1,
        'Description': 'Well group with fluid model and wells',
        'Fluid Model': '5 - 90 - 10',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'well group_1',
        'Model Type': 'unique',
        'Model Name': 'Well Group',
        'Wells': 0,
        'Description': 'Well group without fluid model and wells',
        'Fluid Model': '',
        'Last Update': '',
        'Updated By': '',
    }],
]

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]
# update the 2nd node_df to have the fluid model as well, which is not in the project
node_dfs[1]['Fluid Model'] = '5 - 90 - 10'

wells_dfs = [
    pd.DataFrame([{
        '_id': ObjectId('5e272d3bb78910dd2a1be75a'),
        'chosenID': '42477306080000',
        'inptID': 'INPT.auLG79kL9i',
        'api10': '4247730608',
        'api12': '424773060800',
        'api14': '',
        'ariesID': '',
        'phdwinID': ''
    }]),
    pd.DataFrame(columns=['_id', 'chosenID', 'inptID', 'api10', 'api12', 'api14', 'ariesID', 'phdwinID'])
]
fluid_model_dfs = [
    pd.DataFrame([{
        '_id': ObjectId('642c990009e3f300120dd027'),
        'name': '5 - 90 - 10',
    }]),
    pd.DataFrame(columns=['_id', 'name'])
]

expected_response_fluid_model_ids = [ObjectId('642c990009e3f300120dd027'), None]

expected_response_wells = [[ObjectId('5e272d3bb78910dd2a1be75a')], []]

expected_response_error_dicts = [{
    'well_group': [],
    'wells': []
}, {
    'well_group': [{
        'error_message': 'Fluid Model 5 - 90 - 10 not in project!',
        'row_index': 0
    }],
    'wells': []
}]


# test well_group_export with and without fluid_model
@pytest.mark.unittest
@pytest.mark.parametrize('model, expected_response_model_rows', zip(models, expected_response_model_rows))
def test_well_group_export(model, expected_response_model_rows):
    expected_response_model_id = 'well group_1'

    response_model_rows, response_model_id = well_group_export(model, [])

    assert response_model_rows == expected_response_model_rows
    assert response_model_id == expected_response_model_id


# test well_group_wells_export
@pytest.mark.unittest
def test_well_group_wells_export():
    wells_model = models[0]  # use the first model from the well_group_export
    well_group_id = 'well group_1'
    wells_map = {
        ObjectId('5e272d3bb78910dd2a1be75a'): {
            '_id': ObjectId('5e272d3bb78910dd2a1be75a'),
            'well_name': 'B.L.M. RANTON',
            'well_number': '1',
            'chosenID': '42477306080000',
            'api14': '42477306080000',
            'inptID': 'INPT.auLG79kL9i',
            'api10': '4247730608',
            'api12': '424773060800'
        }
    }

    expected_response = [{
        'Well Group Model ID': 'well group_1',
        'Well Name': 'B.L.M. RANTON',
        'Well Number': '1',
        'INPT ID': 'INPT.auLG79kL9i',
        'Chosen ID': '42477306080000',
        'API 10': '4247730608',
        'API 12': '424773060800',
        'API 14': '42477306080000',
        'Aries ID': '',
        'PHDwin ID': '',
    }]

    response = well_group_wells_export(wells_model, [], well_group_id, wells_map)

    assert response == expected_response


# test well_group_import with and without fluid_model in project
@pytest.mark.unittest
@pytest.mark.parametrize(
    ''.join([
        'node_df, wells_df, fluid_model_df, expected_response_fluid_model_id, expected_response_wells,'
        'expected_response_error_dict, test_index'
    ]),
    zip(node_dfs, wells_dfs, fluid_model_dfs, expected_response_fluid_model_ids, expected_response_wells,
        expected_response_error_dicts, range(len(node_dfs))),
)
def test_well_group_import_fluid_model(mocker, node_df, wells_df, fluid_model_df, expected_response_fluid_model_id,
                                       expected_response_wells, expected_response_error_dict, test_index):
    # mock the uuid generated in well_group_import
    mocker.patch('api.cc_to_cc.carbon.well_group.uuid.uuid4')
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
        'type': 'well_group',
        'name': 'Well Group',
        'params': {
            'wells': [ObjectId('5e272d3bb78910dd2a1be75a')],
            'fluid_model': ObjectId('642c990009e3f300120dd027')
        },
        'description': 'Well group with fluid model and wells'
    }, {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': internal_id,
        'type': 'well_group',
        'name': 'Well Group',
        'params': {
            'wells': [],
            'fluid_model': None
        },
        'description': 'Well group without fluid model and wells'
    }]
    expected_response_document = expected_response_documents[test_index]

    shape_multipliers = {'x': 1, 'y': 1}

    missing_wells_df = pd.DataFrame(
        columns=['_id', 'chosenID', 'inptID', 'api10', 'api12', 'api14', 'ariesID', 'phdwinID'])

    error_dict = {'well_group': [], 'wells': []}

    response_document, response_document_id, response_fluid_model_id, response_wells = well_group_import(
        node_df, wells_df, missing_wells_df, fluid_model_df, shape_multipliers, error_dict)
    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_fluid_model_id == expected_response_fluid_model_id
    assert response_wells == expected_response_wells
    assert error_dict == expected_response_error_dict
