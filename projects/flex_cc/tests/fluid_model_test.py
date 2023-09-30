import pandas as pd
import pytest
import datetime
from copy import deepcopy
from api.cc_to_cc.fluid_model import fluid_model_export, fluid_model_import


@pytest.fixture
def composition_dict():
    return {
        'N2': {
            'percentage': 1,
            'price': 0
        },
        'CO2': {
            'percentage': 2,
            'price': 0
        },
        'C1': {
            'percentage': 3,
            'price': 0
        },
        'C2': {
            'percentage': 4,
            'price': 0
        },
        'C3': {
            'percentage': 5,
            'price': 0
        },
        'iC4': {
            'percentage': 6,
            'price': 0
        },
        'nC4': {
            'percentage': 7,
            'price': 0
        },
        'iC5': {
            'percentage': 8,
            'price': 0
        },
        'nC5': {
            'percentage': 9,
            'price': 0
        },
        'iC6': {
            'percentage': 10,
            'price': 0
        },
        'nC6': {
            'percentage': 11,
            'price': 0
        },
        'C7': {
            'percentage': 12,
            'price': 0
        },
        'C8': {
            'percentage': 13,
            'price': 0
        },
        'C9': {
            'percentage': 14,
            'price': 0
        },
        'C10+': {
            'percentage': 15,
            'price': 0
        },
        'H2S': {
            'percentage': 16,
            'price': 0
        },
        'H2': {
            'percentage': 17,
            'price': 0
        },
        'H2O': {
            'percentage': 18,
            'price': 0
        },
        'He': {
            'percentage': 19,
            'price': 0
        },
        'O2': {
            'percentage': 20,
            'price': 0
        }
    }


@pytest.fixture
def empty_composition_dict():
    return {
        'N2': {
            'percentage': 0,
            'price': 0
        },
        'CO2': {
            'percentage': 0,
            'price': 0
        },
        'C1': {
            'percentage': 0,
            'price': 0
        },
        'C2': {
            'percentage': 0,
            'price': 0
        },
        'C3': {
            'percentage': 0,
            'price': 0
        },
        'iC4': {
            'percentage': 0,
            'price': 0
        },
        'nC4': {
            'percentage': 0,
            'price': 0
        },
        'iC5': {
            'percentage': 0,
            'price': 0
        },
        'nC5': {
            'percentage': 0,
            'price': 0
        },
        'iC6': {
            'percentage': 0,
            'price': 0
        },
        'nC6': {
            'percentage': 0,
            'price': 0
        },
        'C7': {
            'percentage': 0,
            'price': 0
        },
        'C8': {
            'percentage': 0,
            'price': 0
        },
        'C9': {
            'percentage': 0,
            'price': 0
        },
        'C10+': {
            'percentage': 0,
            'price': 0
        },
        'H2S': {
            'percentage': 0,
            'price': 0
        },
        'H2': {
            'percentage': 0,
            'price': 0
        },
        'H2O': {
            'percentage': 0,
            'price': 0
        },
        'He': {
            'percentage': 0,
            'price': 0
        },
        'O2': {
            'percentage': 0,
            'price': 0
        }
    }


@pytest.fixture
def model(composition_dict):
    return {
        'name': 'Plus 1',
        'unique': False,
        'econ_function': {
            'oil': {
                'composition': composition_dict,
                'criteria': 'flat',
            },
            'gas': {
                'composition': composition_dict,
                'criteria': 'flat',
            },
            'water': {
                'composition': composition_dict,
                'criteria': 'flat',
            },
            'ngl': {
                'composition': composition_dict,
                'criteria': 'flat',
            },
            'drip_condensate': {
                'composition': composition_dict,
                'criteria': 'flat',
            },
        },
        'updatedAt': datetime.datetime(2021, 8, 31, 17, 5, 5, 500000),
    }


@pytest.fixture
def expected_response_model_rows():
    expected_response_model_rows = [
        {
            'Model Type': 'project',
            'Model Name': 'Plus 1',
            'Phase': 'oil',
            'Criteria': 'flat',
            'N2': 1,
            'CO2': 2,
            'C1': 3,
            'C2': 4,
            'C3': 5,
            'iC4': 6,
            'nC4': 7,
            'iC5': 8,
            'nC5': 9,
            'iC6': 10,
            'nC6': 11,
            'C7': 12,
            'C8': 13,
            'C9': 14,
            'C10+': 15,
            'H2S': 16,
            'H2': 17,
            'H2O': 18,
            'He': 19,
            'O2': 20,
            'Last Update': '08/31/2021 17:05:05',
        },
        {
            'Model Type': 'project',
            'Model Name': 'Plus 1',
            'Phase': 'gas',
            'Criteria': 'flat',
            'N2': 1,
            'CO2': 2,
            'C1': 3,
            'C2': 4,
            'C3': 5,
            'iC4': 6,
            'nC4': 7,
            'iC5': 8,
            'nC5': 9,
            'iC6': 10,
            'nC6': 11,
            'C7': 12,
            'C8': 13,
            'C9': 14,
            'C10+': 15,
            'H2S': 16,
            'H2': 17,
            'H2O': 18,
            'He': 19,
            'O2': 20,
            'Last Update': '08/31/2021 17:05:05',
        },
        {
            'Model Type': 'project',
            'Model Name': 'Plus 1',
            'Phase': 'water',
            'Criteria': 'flat',
            'N2': 1,
            'CO2': 2,
            'C1': 3,
            'C2': 4,
            'C3': 5,
            'iC4': 6,
            'nC4': 7,
            'iC5': 8,
            'nC5': 9,
            'iC6': 10,
            'nC6': 11,
            'C7': 12,
            'C8': 13,
            'C9': 14,
            'C10+': 15,
            'H2S': 16,
            'H2': 17,
            'H2O': 18,
            'He': 19,
            'O2': 20,
            'Last Update': '08/31/2021 17:05:05',
        },
        {
            'Model Type': 'project',
            'Model Name': 'Plus 1',
            'Phase': 'ngl',
            'Criteria': 'flat',
            'N2': 1,
            'CO2': 2,
            'C1': 3,
            'C2': 4,
            'C3': 5,
            'iC4': 6,
            'nC4': 7,
            'iC5': 8,
            'nC5': 9,
            'iC6': 10,
            'nC6': 11,
            'C7': 12,
            'C8': 13,
            'C9': 14,
            'C10+': 15,
            'H2S': 16,
            'H2': 17,
            'H2O': 18,
            'He': 19,
            'O2': 20,
            'Last Update': '08/31/2021 17:05:05',
        },
        {
            'Model Type': 'project',
            'Model Name': 'Plus 1',
            'Phase': 'drip cond',
            'Criteria': 'flat',
            'N2': 1,
            'CO2': 2,
            'C1': 3,
            'C2': 4,
            'C3': 5,
            'iC4': 6,
            'nC4': 7,
            'iC5': 8,
            'nC5': 9,
            'iC6': 10,
            'nC6': 11,
            'C7': 12,
            'C8': 13,
            'C9': 14,
            'C10+': 15,
            'H2S': 16,
            'H2': 17,
            'H2O': 18,
            'He': 19,
            'O2': 20,
            'Last Update': '08/31/2021 17:05:05',
        },
    ]
    return expected_response_model_rows


# test fluid_model_export
@pytest.mark.unittest
def test_fluid_model_export(model, expected_response_model_rows):
    response_model_rows = fluid_model_export(model)

    assert response_model_rows == expected_response_model_rows


# test fluid_model_import
@pytest.mark.unittest
def test_fluid_model_import(model, expected_response_model_rows):
    model_df = pd.DataFrame(expected_response_model_rows)
    model_array = model_df.values
    header = list(model_df.columns)

    expected_response_econ_model = model['econ_function']
    expected_response_error_list = []

    response_econ_model, response_error_list = fluid_model_import(model_array, header)

    assert response_econ_model == expected_response_econ_model
    assert response_error_list == expected_response_error_list


# test fluid_model_import with wrong phase
@pytest.mark.unittest
def test_fluid_model_import_wrong_phase(model, expected_response_model_rows, empty_composition_dict):
    model_df = pd.DataFrame(expected_response_model_rows)
    model_df.loc[0, 'Phase'] = 'oiloil'
    model_array = model_df.values
    header = list(model_df.columns)

    model['econ_function']['oil']['composition'] = empty_composition_dict

    expected_response_econ_model = model['econ_function']
    expected_response_error_list = [{'error_message': 'Wrong or missing Phase', 'row_index': 0}]

    response_econ_model, response_error_list = fluid_model_import(model_array, header)

    assert response_econ_model == expected_response_econ_model
    assert response_error_list == expected_response_error_list


# test fluid_model_import with duplicate phase
@pytest.mark.unittest
def test_fluid_model_import_duplicate_phase(model, expected_response_model_rows):
    model_df = pd.DataFrame(expected_response_model_rows)
    model_df.loc[5, :] = model_df.loc[0, :]  # duplicate the first (oil) row
    model_array = model_df.values
    header = list(model_df.columns)

    expected_response_econ_model = model['econ_function']
    expected_response_error_list = [{'error_message': 'Duplicated row of oil Phase', 'row_index': 5}]

    response_econ_model, response_error_list = fluid_model_import(model_array, header)

    assert response_econ_model == expected_response_econ_model
    assert response_error_list == expected_response_error_list


# test fluid_model_import with negative percentage
@pytest.mark.unittest
def test_fluid_model_import_negative_percentage(model, expected_response_model_rows, composition_dict):
    model_df = pd.DataFrame(expected_response_model_rows)
    model_df.loc[0, 'N2'] = -1
    model_array = model_df.values
    header = list(model_df.columns)

    expected_response_econ_model = deepcopy(model['econ_function'])
    # need to replace the composition dict before mutating it
    expected_response_econ_model['oil']['composition'] = composition_dict
    expected_response_econ_model['oil']['composition']['N2']['percentage'] = 0
    expected_response_error_list = [{'error_message': 'N2 value is less than 0', 'row_index': 0}]

    response_econ_model, response_error_list = fluid_model_import(model_array, header)

    assert response_error_list == expected_response_error_list
    assert response_econ_model == expected_response_econ_model
