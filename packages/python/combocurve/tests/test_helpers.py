import pytest

from combocurve.science.econ.helpers import convert_list_of_int_to_as_of_dates, check_dates_sequence_validity, \
    convert_list_of_date_strings_to_dates


def test_empty_list():
    assert convert_list_of_int_to_as_of_dates([]) == []


def test_single_element():
    assert convert_list_of_int_to_as_of_dates([42]) == [{'start': 42, 'end': 'Econ Limit'}]


def test_two_elements():
    assert convert_list_of_int_to_as_of_dates([10, 20]) == [{
        'start': 10,
        'end': 20
    }, {
        'start': 20,
        'end': 'Econ Limit'
    }]


def test_multiple_elements():
    assert convert_list_of_int_to_as_of_dates([10, 20, 30]) == [{
        'start': 10,
        'end': 20
    }, {
        'start': 20,
        'end': 30
    }, {
        'start': 30,
        'end': 'Econ Limit'
    }]


def test_invalid_type():
    with pytest.raises(TypeError):
        convert_list_of_int_to_as_of_dates('invalid')


# Tests for check_dates_sequence_validity function
def test_dates_validity_true():
    assert check_dates_sequence_validity("2021-01-01", "2022-01-01") is True


def test_dates_validity_false():
    assert check_dates_sequence_validity("2022-01-01", "2021-01-01") is False


def test_dates_validity_equal_dates():
    assert check_dates_sequence_validity("2021-01-01", "2021-01-01") is False


# Tests for convert_list_of_date_strings_to_date_dicts function
def test_convert_list_of_date_strings():
    result = convert_list_of_date_strings_to_dates(["2021-01-01", "2022-01-01"])
    expected = [{
        'start_date': '2021-01-01',
        'end_date': '2022-01-01'
    }, {
        'start_date': '2022-01-01',
        'end_date': 'Econ Limit'
    }]
    assert result == expected


def test_convert_single_date_string():
    result = convert_list_of_date_strings_to_dates(["2021-01-01"])
    expected = [{'start_date': '2021-01-01', 'end_date': 'Econ Limit'}]
    assert result == expected


def test_convert_invalid_dates_sequence():
    with pytest.raises(ValueError) as exc_info:
        convert_list_of_date_strings_to_dates(["2022-01-01", "2021-01-01"])
    assert str(exc_info.value) == "Invalid dates sequence: 2022-01-01 is not before 2021-01-01"


def test_convert_empty_list():
    result = convert_list_of_date_strings_to_dates([])
    assert result == []


def test_convert_invalid_periods_type():
    with pytest.raises(TypeError) as exc_info:
        convert_list_of_date_strings_to_dates("2022-01-01")
    assert "periods must be a list" in str(exc_info.value)
