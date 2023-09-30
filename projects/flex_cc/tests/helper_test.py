import pytest

from api.cc_to_cc.helper import number_validation, bool_validation


# test number_validation
@pytest.mark.unittest
@pytest.mark.parametrize(''.join(['value, expected_response, expected_error_list']), [
    (1, 1, []),
    (1.0, 1, []),
    (1.5, 1.5, []),
    ('1', 1, []),
    ('1.0', 1, []),
    ('1.5', 1.5, []),
    (-1, -1, []),
    (-1.0, -1, []),
    (-1.5, -1.5, []),
    ('-1', -1, []),
    ('-1.0', -1, []),
    ('-1.5', -1.5, []),
    ('', None, [{
        'error_message': 'value is required',
        'row_index': 0
    }]),
    ('a', None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
    ('1a', None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
    ('1.1.1', None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
    ('1,2', None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
    ([1], None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
    ((1, ), None, [{
        'error_message': 'Wrong value type in value',
        'row_index': 0
    }]),
])
def test_number_validation(value, expected_response, expected_error_list):
    error_list = []
    input_dict = {'value': value}
    input_key = 'value'
    assert number_validation(error_list=error_list, input_dict=input_dict, input_key=input_key) == expected_response
    assert error_list == expected_error_list


# test number_validation with min_value and max_value
@pytest.mark.unittest
@pytest.mark.parametrize(''.join(['value, min_value, max_value, expected_response, expected_error_list']), [
    (1, 0, 100, 1, []),
    (0, 0, 100, 0, []),
    (100, 0, 100, 100, []),
    (0, 0.0, 100.0, 0, []),
    (100, 0.0, 100.0, 100, []),
    (0.0, 0, 100, 0, []),
    (100.0, 0, 100, 100, []),
    (-1, 0, 100, None, [{
        'error_message': 'value value is less than 0',
        'row_index': 0
    }]),
    (101, 0, 100, None, [{
        'error_message': 'value value is greater than 100',
        'row_index': 0
    }]),
    (-1, 0.0, 100.0, None, [{
        'error_message': 'value value is less than 0.0',
        'row_index': 0
    }]),
    (101, 0.0, 100.0, None, [{
        'error_message': 'value value is greater than 100.0',
        'row_index': 0
    }]),
    (1, 0, None, 1, []),
    (-1, 0, None, None, [{
        'error_message': 'value value is less than 0',
        'row_index': 0
    }]),
    (1, None, 100, 1, []),
    (101, None, 100, None, [{
        'error_message': 'value value is greater than 100',
        'row_index': 0
    }]),
])
def test_number_validation_with_min_max_value(value, min_value, max_value, expected_response, expected_error_list):
    error_list = []
    input_dict = {'value': value}
    input_key = 'value'
    assert number_validation(error_list=error_list,
                             input_dict=input_dict,
                             input_key=input_key,
                             min_value=min_value,
                             max_value=max_value) == expected_response
    assert error_list == expected_error_list


# test bool_validation
@pytest.mark.unittest
@pytest.mark.parametrize(''.join(['value, expected_response, expected_error_list']), [
    (True, True, []),
    (False, False, []),
    ('True', True, []),
    ('False', False, []),
    ('true', True, []),
    ('false', False, []),
    ('TRUE', True, []),
    ('FALSE', False, []),
    (0, None, [{
        'error_message': 'Wrong or missing value',
        'row_index': 0
    }]),
    (1, None, [{
        'error_message': 'Wrong or missing value',
        'row_index': 0
    }]),
    ('0', None, [{
        'error_message': 'Wrong or missing value',
        'row_index': 0
    }]),
    ('1', None, [{
        'error_message': 'Wrong or missing value',
        'row_index': 0
    }]),
    ('', None, [{
        'error_message': 'Wrong or missing value',
        'row_index': 0
    }]),
])
def test_bool_validation(value, expected_response, expected_error_list):
    error_list = []
    input_dict = {'value': value}
    input_key = 'value'
    assert bool_validation(error_list=error_list, input_dict=input_dict, input_key=input_key) == expected_response
    assert error_list == expected_error_list
