import pytest
from combocurve.services import lookup_table_service
from unittest.mock import call

test_embedded_lookup_table_service = lookup_table_service.EmbeddedLookupTableService(None)


@pytest.mark.unittest
def test_initial_embedded_process_ordinary_case():
    lines = [
        {
            'key': 'a',
            'value': '1'
        },
        {
            'key': 'b',
            'value': '2'
        },
        {
            'key': 'c',
            'value': '3'
        },
        {
            'key': 'd',
            'value': '4'
        },
        {
            'key': 'e',
            'value': '5'
        },
    ]

    response = lookup_table_service.initial_embedded_process(lines)
    expected_response = {
        'a': '1',
        'b': '2',
        'c': '3',
        'd': '4',
        'e': '5',
    }

    assert response == expected_response


@pytest.mark.unittest
def test_initial_embedded_process_empty_case():
    lines = []

    response = lookup_table_service.initial_embedded_process(lines)
    expected_response = {}

    assert response == expected_response


@pytest.mark.unittest
def test_initial_embedded_process_no_value_case():
    lines = [
        {
            'key': 'a',
            'lookup': '1'
        },
        {
            'key': 'b'
        },
        {
            'key': 'c',
            'lookup': '1'
        },
        {
            'key': 'd'
        },
        {
            'key': 'e',
            'lookup': '1'
        },
    ]

    response = lookup_table_service.initial_embedded_process(lines)
    expected_response = {
        'a': '',
        'c': '',
        'e': '',
    }

    assert response == expected_response


@pytest.mark.unittest
def test_initial_embedded_process_value_is_list_or_dict():
    lines = [
        {
            'key': 'a',
            'value': ['1', '2']
        },
        {
            'key': 'b',
            'value': {
                '1': '2'
            }
        },
    ]

    response = lookup_table_service.initial_embedded_process(lines)
    expected_response = {
        'a': ['1', '2'],
        'b': {
            '1': '2'
        },
    }

    assert response == expected_response


@pytest.mark.unittest
def test_initial_embedded_process_value_is_in_map():
    lines = [
        {
            'key': 'a',
            'value': 'Shrunk'
        },
        {
            'key': 'b',
            'value': 'Lease NRI'
        },
    ]

    response = lookup_table_service.initial_embedded_process(lines)
    expected_response = {
        'a': 'shrunk',
        'b': 'lease_nri',
    }

    assert response == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_no_missing_case():
    lines_dict = {
        'value': '1',
        'unit': '2',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'unit': '2',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_unit_gas_case():
    lines_dict = {
        'value': '1',
        'key': 'gas',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'key': 'gas',
        'unit': 'dollar_per_mcf',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_unit_oil_case():
    lines_dict = {
        'value': '1',
        'key': 'oil',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'key': 'oil',
        'unit': 'dollar_per_bbl',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_unit_water_case():
    lines_dict = {
        'value': '1',
        'key': 'water_disposal',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'key': 'water_disposal',
        'unit': 'dollar_per_bbl',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_unit_fixed_exp_case():
    lines_dict = {
        'value': '1',
        'key': 'fixed_expenses',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'key': 'fixed_expenses',
        'unit': 'fixed_expense',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_unit_carbon_exp_case():
    lines_dict = {
        'value': '1',
        'key': 'carbon_expenses',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'value': '1',
        'key': 'carbon_expenses',
        'unit': 'carbon_expense',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_value_timeseries_period_case():
    lines_dict = {
        'key': 'gas',
        'period': [0, 1, 2],
        'unit': 'dollar_per_mcf',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'key': 'gas',
        'period': [0, 1, 2],
        'unit': 'dollar_per_mcf',
        'value': ['0', '0', '0'],
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_expense_lines_processor_missing_value_scalar_value_case():
    lines_dict = {
        'key': 'gas',
        'period': 0,
        'unit': 'dollar_per_mcf',
    }

    lookup_table_service.expense_lines_processor(lines_dict)
    expected_response = {
        'key': 'gas',
        'period': 0,
        'unit': 'dollar_per_mcf',
        'value': '0',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_values_process_proper():
    lines_dict = {'tangible': 3, 'intangible': 5}

    lookup_table_service.capex_values_process(lines_dict)
    expected_response = {'tangible': 3, 'intangible': 5}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_values_process_string_tangible():
    lines_dict = {'tangible': '3', 'intangible': 5}

    lookup_table_service.capex_values_process(lines_dict)
    expected_response = {'tangible': 0, 'intangible': 5}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_values_process_string_intangible():
    lines_dict = {'tangible': 3, 'intangible': '5'}

    lookup_table_service.capex_values_process(lines_dict)
    expected_response = {'tangible': 3, 'intangible': 0}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_values_process_string_both():
    lines_dict = {'tangible': '3', 'intangible': '5'}

    lookup_table_service.capex_values_process(lines_dict)
    expected_response = {'tangible': 0, 'intangible': 0}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_escalation_process_date():
    lines_dict = {
        'escalation_start_option': 'date',
        'escalation_start_value': '01/01/2020',
    }

    lookup_table_service.capex_escalation_process(lines_dict)
    expected_response = {
        'escalation_start_option': 'date',
        'escalation_start_value': '01/01/2020',
        'escalation_start': {
            'date': '01/01/2020'
        }
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_escalation_process_not_date():
    lines_dict = {
        'escalation_start_option': 'not_date',
        'escalation_start_value': 5,
    }

    lookup_table_service.capex_escalation_process(lines_dict)
    expected_response = {
        'escalation_start_option': 'not_date',
        'escalation_start_value': 5,
        'escalation_start': {
            'not_date': 5.0,
        }
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_from_headers():
    lines_dict = {
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'criteria_value': 1,
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'criteria_value': 1,
        'fromHeaders': 'example_header',
        'example_header': 1,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_from_headers_no_value():
    lines_dict = {
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'fromHeaders': 'example_header',
        'example_header': 0,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_from_schedule():
    lines_dict = {
        'criteria_option': 'fromSchedule',
        'criteria_from_option': 'example_schedule',
        'criteria_value': 1,
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'fromSchedule',
        'criteria_from_option': 'example_schedule',
        'criteria_value': 1,
        'fromSchedule': 'example_schedule',
        'example_schedule': 1,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_from_schedule_no_value():
    lines_dict = {
        'criteria_option': 'fromSchedule',
        'criteria_from_option': 'example_schedule',
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'fromSchedule',
        'criteria_from_option': 'example_schedule',
        'fromSchedule': 'example_schedule',
        'example_schedule': 0,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_from_date():
    lines_dict = {
        'criteria_option': 'date',
        'criteria_value': '01/01/2020',
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'date',
        'criteria_value': '01/01/2020',
        'date': '2020-01-01',
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_else():
    lines_dict = {
        'criteria_option': 'else',
        'criteria_value': 1,
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'else',
        'criteria_value': 1,
        'else': 1,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_criteria_process_else_no_value():
    lines_dict = {
        'criteria_option': 'else',
    }

    lookup_table_service.capex_criteria_process(lines_dict)
    expected_response = {
        'criteria_option': 'else',
        'else': 0,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_remove_unused_keys_all():
    '''
    remove 'escalation_start_option', 'escalation_start_value', 'criteria_option', 'criteria_value', 
    'criteria_from_option' from dictionary
    '''
    lines_dict = {
        'escalation_start_option': 'date',
        'escalation_start_value': '01/01/2020',
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'criteria_value': 1,
    }

    lookup_table_service.capex_remove_unused_keys(lines_dict)
    expected_response = {}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_remove_unused_keys_some():
    lines_dict = {
        'escalation_start_option': 'date',
        'escalation_start_value': '01/01/2020',
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'criteria_value': 1,
        'example_header': 1,
    }

    lookup_table_service.capex_remove_unused_keys(lines_dict)
    expected_response = {
        'example_header': 1,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_remove_unused_keys_none():
    lines_dict = {
        'example_header': 1,
    }

    lookup_table_service.capex_remove_unused_keys(lines_dict)
    expected_response = {
        'example_header': 1,
    }

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_remove_unused_keys_empty():
    lines_dict = {}

    lookup_table_service.capex_remove_unused_keys(lines_dict)
    expected_response = {}

    assert lines_dict == expected_response


@pytest.mark.unittest
def test_capex_lines_processor(mocker):
    '''
    test capex_lines_processor by mocking the calls of the following functions:
    capex_values_process, capex_escalation_process, capex_criteria_process, capex_remove_unused_keys
    '''
    lines_dict = {
        'escalation_start_option': 'date',
        'escalation_start_value': '01/01/2020',
        'criteria_option': 'fromHeaders',
        'criteria_from_option': 'example_header',
        'criteria_value': 1,
        'example_header': 1,
    }

    mocker.patch.object(lookup_table_service, 'capex_values_process')
    mocker.patch.object(lookup_table_service, 'capex_escalation_process')
    mocker.patch.object(lookup_table_service, 'capex_criteria_process')
    mocker.patch.object(lookup_table_service, 'capex_remove_unused_keys')

    lookup_table_service.capex_lines_processor(lines_dict)

    lookup_table_service.capex_values_process.assert_called_once_with(lines_dict)
    lookup_table_service.capex_escalation_process.assert_called_once_with(lines_dict)
    lookup_table_service.capex_criteria_process.assert_called_once_with(lines_dict)
    lookup_table_service.capex_remove_unused_keys.assert_called_once_with(lines_dict)


@pytest.mark.unittest
def test_lines_processor_capex(mocker):
    '''
    test lines_processor by mocking the call of initial_embedded_process and feeding the return value
    to the capex_lines_processor
    '''
    lines_dict = {}

    mocker.patch.object(lookup_table_service, 'initial_embedded_process')
    mocker.patch.object(lookup_table_service, 'capex_lines_processor')

    lookup_table_service.initial_embedded_process.return_value = lines_dict
    lookup_table_service.lines_processor(lines_dict, 'capex')

    lookup_table_service.initial_embedded_process.assert_called_once_with(lines_dict)
    lookup_table_service.capex_lines_processor.assert_called_once_with(lines_dict)


@pytest.mark.unittest
def test_lines_processor_expense(mocker):
    '''
    test lines_processor by mocking the call of initial_embedded_process and feeding the return value
    to the expense_lines_processor
    '''
    lines_dict = {}

    mocker.patch.object(lookup_table_service, 'initial_embedded_process')
    mocker.patch.object(lookup_table_service, 'expense_lines_processor')

    lookup_table_service.initial_embedded_process.return_value = lines_dict
    lookup_table_service.lines_processor(lines_dict, 'expense')

    lookup_table_service.initial_embedded_process.assert_called_once_with(lines_dict)
    lookup_table_service.expense_lines_processor.assert_called_once_with(lines_dict)


@pytest.mark.unittest
def test_ratio_interpolation_value_for_ratio(mocker):
    '''
    Test ratio_interpolation_value that it calls ratio_value function by mocking when ratio_header is not an empty string
    Variables: well_headers, ratio_header, ratio_number, rule, interpolation_header, interpolation_boundaries
    '''
    well_headers = ['example_header']
    ratio_header = 'example_header'
    ratio_number = 1
    rule = 'example_rule'
    interpolation_header = ''
    interpolation_boundaries = []

    mocker.patch.object(lookup_table_service, 'ratio_value')

    lookup_table_service.ratio_interpolation_value(well_headers, ratio_header, ratio_number, rule, interpolation_header,
                                                   interpolation_boundaries)

    lookup_table_service.ratio_value.assert_called_once_with(well_headers, ratio_header, ratio_number, rule)


@pytest.mark.unittest
def test_ratio_interpolation_value_for_interpolation(mocker):
    '''
    Test ratio_interpolation_value that it calls interpolation_value function by mocking when ratio_header is an empty string
    Variables: well_headers, ratio_header, ratio_number, rule, interpolation_header, interpolation_boundaries
    '''
    well_headers = ['example_header']
    ratio_header = ''
    ratio_number = 1
    rule = 'example_rule'
    interpolation_header = 'example_header'
    interpolation_boundaries = []

    mocker.patch.object(lookup_table_service, 'interpolate_value')

    lookup_table_service.ratio_interpolation_value(well_headers, ratio_header, ratio_number, rule, interpolation_header,
                                                   interpolation_boundaries)

    lookup_table_service.interpolate_value.assert_called_once_with(rule, well_headers, interpolation_header,
                                                                   interpolation_boundaries)


@pytest.mark.unittest
def test_outside_of_interpolation_range_list():
    '''
    Test outside_of_interpolation_range when value is type list
    Variables: rule
    '''
    rule = {'values': [{'value': [1, 2, 3]}]}

    expected_response = {'values': [{'value': [0, 0, 0]}]}

    assert lookup_table_service.outside_of_interpolation_range(rule) == expected_response


@pytest.mark.unittest
def test_outside_of_interpolation_range_not_list():
    '''
    Test outside_of_interpolation_range when value is not type list
    Variables: rule
    '''
    rule = {'values': [{'value': 1}]}

    expected_response = {'values': [{'value': 0}]}

    assert lookup_table_service.outside_of_interpolation_range(rule) == expected_response


@pytest.mark.unittest
def test_outside_of_interpolation_range_string():
    '''
    Test outside_of_interpolation_range when value is not type list but a string
    Variables: rule
    '''
    rule = {'values': [{'value': '1'}]}

    expected_response = {'values': [{'value': '1'}]}

    assert lookup_table_service.outside_of_interpolation_range(rule) == expected_response


@pytest.mark.unittest
def test_outside_of_interpolation_range_empty_list():
    '''
    Test outside_of_interpolation_range when value is an empty list
    Variables: rule
    '''
    rule = {'values': [{'value': []}]}

    expected_response = {'values': [{'value': []}]}

    assert lookup_table_service.outside_of_interpolation_range(rule) == expected_response


@pytest.mark.unittest
def test_interpolation_calculation_value_is_list_of_list(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': [[1, 2, 3]], 'childrenValues': [[[1, 2, 3]]]}]}
    expected_response = {'values': [{'value': [1.0, 2.0, 3.0], 'childrenValues': [[[1, 2, 3]]]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = [1.0, 2.0, 3.0]

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, [[[1, 2, 3]], [[1, 2, 3]]])


@pytest.mark.unittest
def test_interpolation_calculation_value_is_list(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': [1, 2, 3], 'childrenValues': [[1, 2, 3]]}]}
    expected_response = {'values': [{'value': [1.0, 2.0, 3.0], 'childrenValues': [[1, 2, 3]]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = [1.0, 2.0, 3.0]

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, [[1, 2, 3], [1, 2, 3]])


@pytest.mark.unittest
def test_interpolation_calculation_value_is_multiple_lists_in_list(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': [[1, 2, 3], [4, 5, 6]], 'childrenValues': [[[1, 2, 3], [4, 5, 6]]]}]}
    expected_response = {'values': [{'value': [1.0, 2.0, 3.0], 'childrenValues': [[[1, 2, 3], [4, 5, 6]]]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = [1.0, 2.0, 3.0]

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, [[[1, 2, 3], [4, 5, 6]], [[1, 2, 3], [4, 5, 6]]])


@pytest.mark.unittest
def test_interpolation_calculation_value_is_empty_list(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': [], 'childrenValues': [[]]}]}
    expected_response = {'values': [{'value': [], 'childrenValues': [[]]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = []

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, [[], []])

@pytest.mark.unittest
def test_interpolation_calculation_value_is_string():
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': 'TEST', 'childrenValues': []}]}
    expected_response = {'values': [{'value': 'TEST', 'childrenValues': []}]}

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response

@pytest.mark.unittest
def test_interpolation_calculation_value_is_numeric_string_without_children_values():
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': '1', 'childrenValues': []}]}
    expected_response = {'values': [{'value': '1', 'childrenValues': []}]}

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response

@pytest.mark.unittest
def test_interpolation_calculation_value_is_numeric_string_with_children_values(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': '1', 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': 2, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = 2

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, ['1', 1])

@pytest.mark.unittest
def test_interpolation_calculation_value_is_not_list(mocker):
    header_value = 1
    interpolation_boundaries = [0, 2]
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': 2, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'interpolation')
    lookup_table_service.interpolation.return_value = 2

    assert lookup_table_service.interpolation_calculation(header_value, interpolation_boundaries,
                                                          rule) == expected_response
    lookup_table_service.interpolation.assert_called_once_with(0.5, 1, [1, 1])


@pytest.mark.unittest
def test_interpolation_value_is_list():
    interpolation_lever = 0.5
    idx = 1
    value = [1, 2, 3]
    expected_response = 1.5

    assert lookup_table_service.interpolation(interpolation_lever, idx, value) == expected_response


@pytest.mark.unittest
def test_interpolation_value_is_list_of_list():
    interpolation_lever = 0.5
    idx = 1
    value = [[1, 2, 3], [4, 5, 6]]
    expected_response = [2.5, 3.5, 4.5]

    assert lookup_table_service.interpolation(interpolation_lever, idx, value) == expected_response


@pytest.mark.unittest
def test_interpolate_value_header_value_is_none(mocker):
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    well_headers = {'header': None}
    interpolation_header = 'header'
    interpolation_boundaries = [0, 2]
    expected_response = {'values': [{'value': 1, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'outside_of_interpolation_range')
    lookup_table_service.outside_of_interpolation_range.return_value = expected_response

    assert lookup_table_service.interpolate_value(rule, well_headers, interpolation_header,
                                                  interpolation_boundaries) == expected_response
    lookup_table_service.outside_of_interpolation_range.assert_called_once_with(rule)


@pytest.mark.unittest
def test_interpolate_value_header_value_is_less_than_lower_boundary(mocker):
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    well_headers = {'header': -1}
    interpolation_header = 'header'
    interpolation_boundaries = [0, 2]
    expected_response = {'values': [{'value': 1, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'outside_of_interpolation_range')
    lookup_table_service.outside_of_interpolation_range.return_value = expected_response

    assert lookup_table_service.interpolate_value(rule, well_headers, interpolation_header,
                                                  interpolation_boundaries) == expected_response
    lookup_table_service.outside_of_interpolation_range.assert_called_once_with(rule)


@pytest.mark.unittest
def test_interpolate_value_header_value_is_greater_than_upper_boundary(mocker):
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    well_headers = {'header': 3}
    interpolation_header = 'header'
    interpolation_boundaries = [0, 2]
    expected_response = {'values': [{'value': 1, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'outside_of_interpolation_range')
    lookup_table_service.outside_of_interpolation_range.return_value = expected_response

    assert lookup_table_service.interpolate_value(rule, well_headers, interpolation_header,
                                                  interpolation_boundaries) == expected_response
    lookup_table_service.outside_of_interpolation_range.assert_called_once_with(rule)


@pytest.mark.unittest
def test_interpolate_value_header_value_is_within_boundary(mocker):
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    well_headers = {'header': 1}
    interpolation_header = 'header'
    interpolation_boundaries = [0, 2]
    expected_response = {'values': [{'value': 1, 'childrenValues': [1]}]}
    mocker.patch.object(lookup_table_service, 'interpolation_calculation')
    lookup_table_service.interpolation_calculation.return_value = expected_response

    assert lookup_table_service.interpolate_value(rule, well_headers, interpolation_header,
                                                  interpolation_boundaries) == expected_response
    lookup_table_service.interpolation_calculation.assert_called_once_with(1, interpolation_boundaries, rule)


@pytest.mark.unittest
def test_ratio_value_value_is_list():
    well_headers = {'header': 1}
    ratio_header = 'header'
    ratio_number = 2
    rule = {'values': [{'value': [1, 2, 3], 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': [0.5, 1.0, 1.5], 'childrenValues': [1]}]}

    assert lookup_table_service.ratio_value(well_headers, ratio_header, ratio_number, rule) == expected_response


@pytest.mark.unittest
def test_ratio_value_value_is_not_list():
    well_headers = {'header': 1}
    ratio_header = 'header'
    ratio_number = 2
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': 0.5, 'childrenValues': [1]}]}

    assert lookup_table_service.ratio_value(well_headers, ratio_header, ratio_number, rule) == expected_response


@pytest.mark.unittest
def test_ratio_value_value_is_not_float():
    well_headers = {'header': 'a'}
    ratio_header = 'header'
    ratio_number = 2
    rule = {'values': [{'value': 'a', 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': 'a', 'childrenValues': [1]}]}

    assert lookup_table_service.ratio_value(well_headers, ratio_header, ratio_number, rule) == expected_response


@pytest.mark.unittest
def test_ratio_value_value_is_a_numeric_string():
    well_headers = {'header': 'a'}
    ratio_header = 'header'
    ratio_number = 2
    rule = {'values': [{'value': '1', 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': '1', 'childrenValues': [1]}]}

    assert lookup_table_service.ratio_value(well_headers, ratio_header, ratio_number, rule) == expected_response


@pytest.mark.unittest
def test_ratio_value_header_is_none():
    well_headers = {}
    ratio_header = 'header'
    ratio_number = 2
    rule = {'values': [{'value': 1, 'childrenValues': [1]}]}
    expected_response = {'values': [{'value': 0.0, 'childrenValues': [1]}]}

    assert lookup_table_service.ratio_value(well_headers, ratio_header, ratio_number, rule) == expected_response


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_none():
    value = None
    assert test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_string():
    value = 'a'
    assert test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_list_of_string():
    value = ['a', 'b']
    assert test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_list_of_string_with_empty_string():
    value = ['a', '']
    assert test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_not_string_raise_error():
    value = 1
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value)


@pytest.mark.unittest
def test_validate_strict_string_or_list_of_string_or_none_value_is_not_list_of_string_raise_error():
    value = [1, 2]
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_strict_string_or_list_of_string_or_none(value)


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_none():
    value = None
    assert test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_numeric():
    value = 1
    assert test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_empty_string():
    value = ''
    assert test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_list_of_numeric():
    value = [1, 2]
    assert test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value) is None


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_not_numeric_raise_error():
    value = 'a'
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_strict_numeric_or_list_of_numeric_or_none_value_is_not_list_of_numeric_raise_error():
    value = ['a', 'b']
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_strict_numeric_or_list_of_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_string_like_date_or_string_like_numeric_or_none_value_is_none_return_none():
    value = None
    test_embedded_lookup_table_service.validate_string_like_date_or_string_like_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_string_like_date_or_string_like_numeric_or_none_value_is_string_return_none():
    value = '1/1/2020'
    test_embedded_lookup_table_service.validate_string_like_date_or_string_like_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_string_like_date_or_string_like_numeric_or_none_value_is_list_of_date_string_return_none():
    value = ['01/01/2020', '01/02/2020', '01/2020']
    test_embedded_lookup_table_service.validate_string_like_date_or_string_like_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_string_like_date_or_string_like_numeric_or_none_value_is_numeric_return_none():
    value = 1
    test_embedded_lookup_table_service.validate_string_like_date_or_string_like_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_string_like_date_or_string_like_numeric_or_none_value_is_not_datelike_string_raise_value_error():
    value = 'abc'
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_string_like_date_or_string_like_numeric_or_none(value)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_string_keys_correct():
    string_keys = {
        'category',
        'description',
        'capex_expense',
        'after_econ_limit',
        'calculation',
        'criteria_option',
        'escalation_start_option',
        'criteria_from_option',
        'escalation_model',
        'depreciation_model',
    }
    for key in string_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_string_keys_incorrect_raise_value_error():
    string_keys = {
        'category',
        'description',
        'capex_expense',
        'after_econ_limit',
        'calculation',
        'criteria_option',
        'escalation_start_option',
        'criteria_from_option',
        'escalation_model',
        'depreciation_model',
    }
    for key in string_keys:
        lines = [[{'key': key, 'value': 1}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_numeric_keys_correct():
    numeric_keys = {'intangible', 'deal_terms', 'tangible'}
    for key in numeric_keys:
        lines = [[{'key': key, 'value': 1}]]
        test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_numeric_keys_incorrect_raise_value_error():
    numeric_keys = {'intangible', 'deal_terms', 'tangible'}
    for key in numeric_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_date_or_numeric_keys_correct():
    date_or_numeric_keys = {'criteria_value', 'escalation_start_value'}
    for key in date_or_numeric_keys:
        lines = [[{'key': key, 'value': 1}]]
        test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_capex_embedded_lookup_table_date_or_numeric_keys_incorrect_raise_value_error():
    date_or_numeric_keys = {'criteria_value', 'escalation_start_value'}
    for key in date_or_numeric_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_capex_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_string_keys_correct():
    string_keys = {
        'key', 'category', 'calculation', 'rows_calculation_method', 'criteria', 'description', 'escalation_model',
        'rate_type', 'stop_at_econ_limit', 'deduct_before_ad_val_tax', 'deduct_before_severance_tax',
        'affect_econ_limit'
    }
    for key in string_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_string_keys_incorrect_raise_value_error():
    string_keys = {
        'key', 'category', 'calculation', 'rows_calculation_method', 'criteria', 'description', 'escalation_model',
        'rate_type', 'stop_at_econ_limit', 'deduct_before_ad_val_tax', 'deduct_before_severance_tax',
        'affect_econ_limit'
    }
    for key in string_keys:
        lines = [[{'key': key, 'value': 1}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_numeric_keys_correct():
    numeric_keys = {'value', 'cap', 'deal_terms'}
    for key in numeric_keys:
        lines = [[{'key': key, 'value': 1}]]
        test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_numeric_keys_incorrect_raise_value_error():
    numeric_keys = {'value', 'cap', 'deal_terms'}
    for key in numeric_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_date_or_numeric_keys_correct():
    date_or_numeric_keys = {'period'}
    for key in date_or_numeric_keys:
        lines = [[{'key': key, 'value': 1}]]
        test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_expense_embedded_lookup_table_date_or_numeric_keys_incorrect_raise_value_error():
    date_or_numeric_keys = {'period'}
    for key in date_or_numeric_keys:
        lines = [[{'key': key, 'value': 'value'}]]
        with pytest.raises(ValueError):
            test_embedded_lookup_table_service.validate_expense_embedded_lookup_table(lines)


@pytest.mark.unittest
def test_validate_embedded_lookup_lines_capex_call(mocker):
    mocker.patch.object(lookup_table_service.EmbeddedLookupTableService, 'validate_capex_embedded_lookup_table')
    lines = []
    assumption_key = 'capex'
    test_embedded_lookup_table_service.validate_embedded_lookup_lines(lines, assumption_key)
    test_embedded_lookup_table_service.validate_capex_embedded_lookup_table.assert_called_once_with(lines)


@pytest.mark.unittest
def test_validate_embedded_lookup_lines_expenses_call(mocker):
    mocker.patch.object(lookup_table_service.EmbeddedLookupTableService, 'validate_expense_embedded_lookup_table')
    lines = []
    assumption_key = 'expenses'
    test_embedded_lookup_table_service.validate_embedded_lookup_lines(lines, assumption_key)
    test_embedded_lookup_table_service.validate_expense_embedded_lookup_table.assert_called_once_with(lines)


@pytest.mark.unittest
def test_validate_embedded_lookup_lines_incorrect_assumption_key_raise_value_error():
    lines = []
    assumption_key = 'incorrect_assumption_key'
    with pytest.raises(ValueError):
        test_embedded_lookup_table_service.validate_embedded_lookup_lines(lines, assumption_key)


@pytest.mark.unittest
def test_query_embedded_lookup_tables(mocker):
    #mock embedded_lookup_tables_collection
    mocker.patch.object(test_embedded_lookup_table_service, 'context')
    mocker.patch.object(test_embedded_lookup_table_service.context, 'embedded_lookup_tables_collection')
    mocker.patch.object(test_embedded_lookup_table_service.context.embedded_lookup_tables_collection, 'find')

    batch_input = [{'assumptions': {'assumption1': {'embedded': ['embedded_id1']}}}]
    test_embedded_lookup_table_service.query_embedded_lookup_tables(batch_input)
    test_embedded_lookup_table_service.context.embedded_lookup_tables_collection.find.assert_called_once_with(
        {'_id': {
            '$in': ['embedded_id1']
        }})
    test_embedded_lookup_table_service.context.embedded_lookup_tables_collection.find.return_value = [{
        '_id':
        'embedded_id1'
    }]
    assert test_embedded_lookup_table_service.query_embedded_lookup_tables(batch_input) == {
        'embedded_id1': {
            '_id': 'embedded_id1'
        }
    }


@pytest.mark.unittest
def test_query_embedded_lookup_tables_empty_query(mocker):
    #mock embedded_lookup_tables_collection
    mocker.patch.object(test_embedded_lookup_table_service, 'context')
    mocker.patch.object(test_embedded_lookup_table_service.context, 'embedded_lookup_tables_collection')
    mocker.patch.object(test_embedded_lookup_table_service.context.embedded_lookup_tables_collection, 'find')

    batch_input = [{'assumptions': {'assumption1': {'embedded': []}}}]
    assert test_embedded_lookup_table_service.query_embedded_lookup_tables(batch_input) == {}


@pytest.mark.unittest
def test_substitute_lookup_fields(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'validate_embedded_lookup_lines')
    mocker.patch.object(lookup_table_service, 'initial_embedded_process', return_value={'lookup1': 'value2'})
    rule = {'values': []}
    table = {'lines': [[{'lookup': 'lookup1'}], [{'value': 'value1'}]], 'assumptionKey': 'assumption_key'}
    expected_response = [[{'lookup': 'lookup1', 'value': 'value2'}], [{'value': 'value1'}]]

    assert test_embedded_lookup_table_service.substitute_lookup_fields(rule, table) == expected_response
    lookup_table_service.initial_embedded_process.assert_called_once_with(rule['values'])
    test_embedded_lookup_table_service.validate_embedded_lookup_lines.assert_called_once_with(
        expected_response, 'assumption_key')


@pytest.mark.unittest
def test_substitute_lookup_fields_unassigned_value(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'validate_embedded_lookup_lines')
    mocker.patch.object(lookup_table_service, 'initial_embedded_process', return_value={})
    rule = {'values': []}
    table = {'lines': [[{'key': 'ABC', 'lookup': 'lookup1'}], [{'value': 'value1'}]], 'assumptionKey': 'assumption_key'}
    expected_response = [[{'value': 'value1'}]]

    assert test_embedded_lookup_table_service.substitute_lookup_fields(rule, table) == expected_response
    lookup_table_service.initial_embedded_process.assert_called_once_with(rule['values'])
    test_embedded_lookup_table_service.validate_embedded_lookup_lines.assert_called_once_with(
        expected_response, 'assumption_key')


@pytest.mark.unittest
def test_substitute_lookup_fields_unassigned_value_but_criteria_from_option(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'validate_embedded_lookup_lines')
    mocker.patch.object(lookup_table_service, 'initial_embedded_process', return_value={})
    rule = {'values': []}
    table = {
        'lines': [[{
            'key': 'criteria_from_option',
            'lookup': 'lookup1'
        }], [{
            'value': 'value1'
        }]],
        'assumptionKey': 'assumption_key'
    }
    expected_response = [[{'key': 'criteria_from_option', 'lookup': 'lookup1'}], [{'value': 'value1'}]]

    assert test_embedded_lookup_table_service.substitute_lookup_fields(rule, table) == expected_response
    lookup_table_service.initial_embedded_process.assert_called_once_with(rule['values'])
    test_embedded_lookup_table_service.validate_embedded_lookup_lines.assert_called_once_with(
        expected_response, 'assumption_key')


@pytest.mark.unittest
def test_substitute_lookup_fields_with_multiple_lookups(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'validate_embedded_lookup_lines')
    mocker.patch.object(lookup_table_service,
                        'initial_embedded_process',
                        return_value={
                            'lookup1': 'value2',
                            'lookup2': 'value3'
                        })
    rule = {'values': []}
    table = {
        'lines': [[{
            'lookup': 'lookup1'
        }], [{
            'lookup': 'lookup2'
        }], [{
            'value': 'value1'
        }]],
        'assumptionKey': 'assumption_key'
    }
    expected_response = [[{
        'lookup': 'lookup1',
        'value': 'value2'
    }], [{
        'lookup': 'lookup2',
        'value': 'value3'
    }], [{
        'value': 'value1'
    }]]

    assert test_embedded_lookup_table_service.substitute_lookup_fields(rule, table) == expected_response
    lookup_table_service.initial_embedded_process.assert_called_once_with(rule['values'])
    test_embedded_lookup_table_service.validate_embedded_lookup_lines.assert_called_once_with(
        expected_response, 'assumption_key')


@pytest.mark.unittest
def test_evaluate_embedded_lookup_tables(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'evaluate_scenario_well_assignments')
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.return_value = (True, None)
    mocker.patch.object(test_embedded_lookup_table_service, 'substitute_lookup_fields')
    test_embedded_lookup_table_service.substitute_lookup_fields.return_value = [{
        'lookup': 'lookup1',
        'value': 'value2'
    }]
    assumption = {'embedded': ['embedded_id1', 'embedded_id2']}
    this_well_headers = {'well': 'well1'}
    embedded_map = {'embedded_id1': 'embedded1', 'embedded_id2': 'embedded2'}
    expected_response = [[{'lookup': 'lookup1', 'value': 'value2'}], [{'lookup': 'lookup1', 'value': 'value2'}]]

    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables(assumption, this_well_headers, embedded_map)
    assert assumption['fetched_embedded'] == expected_response
    '''
    evaluate_scenario_well_assignments called twice substitute_lookup_fields called twice
    '''
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.assert_has_calls(
        [call(this_well_headers, 'embedded1', None),
         call(this_well_headers, 'embedded2', None)])
    test_embedded_lookup_table_service.substitute_lookup_fields.assert_has_calls(
        [call(None, 'embedded1'), call(None, 'embedded2')])
    assert test_embedded_lookup_table_service.evaluate_scenario_well_assignments.call_count == 2
    assert test_embedded_lookup_table_service.substitute_lookup_fields.call_count == 2


@pytest.mark.unittest
def test_evaluate_embedded_lookup_tables_with_no_embedded(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'evaluate_scenario_well_assignments')
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.return_value = (True, None)
    mocker.patch.object(test_embedded_lookup_table_service, 'substitute_lookup_fields')
    test_embedded_lookup_table_service.substitute_lookup_fields.return_value = [{
        'lookup': 'lookup1',
        'value': 'value2'
    }]
    assumption = {'embedded': []}
    this_well_headers = {'well': 'well1'}
    embedded_map = {'embedded_id1': 'embedded1', 'embedded_id2': 'embedded2'}
    expected_response = []

    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables(assumption, this_well_headers, embedded_map)
    assert assumption['fetched_embedded'] == expected_response
    '''
    evaluate_scenario_well_assignments not called substitute_lookup_fields not called
    '''
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.assert_not_called()
    test_embedded_lookup_table_service.substitute_lookup_fields.assert_not_called()


@pytest.mark.unittest
def test_evaluate_embedded_lookup_tables_with_no_embedded_id_in_embedded_map(mocker):
    mocker.patch.object(test_embedded_lookup_table_service, 'evaluate_scenario_well_assignments')
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.return_value = (True, None)
    mocker.patch.object(test_embedded_lookup_table_service, 'substitute_lookup_fields')
    test_embedded_lookup_table_service.substitute_lookup_fields.return_value = [{
        'lookup': 'lookup1',
        'value': 'value2'
    }]
    assumption = {'embedded': ['embedded_id1', 'embedded_id2']}
    this_well_headers = {'well': 'well1'}
    embedded_map = {'embedded_id1': 'embedded1'}
    expected_response = [[{'lookup': 'lookup1', 'value': 'value2'}]]

    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables(assumption, this_well_headers, embedded_map)
    assert assumption['fetched_embedded'] == expected_response
    '''
    evaluate_scenario_well_assignments called once substitute_lookup_fields called once
    '''
    test_embedded_lookup_table_service.evaluate_scenario_well_assignments.assert_called_once_with(
        this_well_headers, 'embedded1', None)
    test_embedded_lookup_table_service.substitute_lookup_fields.assert_called_once_with(None, 'embedded1')


@pytest.mark.unittest
def test_fill_in_embedded_lookup_no_embedded(mocker):
    '''
    test fill_in_embedded_lookup when there is no embedded in assumption
    '''
    mocker.patch.object(test_embedded_lookup_table_service, 'query_embedded_lookup_tables')
    test_embedded_lookup_table_service.query_embedded_lookup_tables.return_value = {'embedded_id1': 'embedded1'}
    mocker.patch.object(test_embedded_lookup_table_service, 'evaluate_embedded_lookup_tables')
    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables.return_value = None
    batch_input = [{'well': {'well': 'well1'}, 'assumptions': {'assumption1': {'embedded': []}}}]
    expected_response = [{'well': {'well': 'well1'}, 'assumptions': {'assumption1': {'embedded': []}}}]

    test_embedded_lookup_table_service.fill_in_embedded_lookup(batch_input)
    assert batch_input == expected_response


@pytest.mark.unittest
def test_fill_in_embedded_lookup_with_embedded(mocker):
    '''
    test fill_in_embedded_lookup when there is embedded in assumption
    '''
    mocker.patch.object(test_embedded_lookup_table_service, 'query_embedded_lookup_tables')
    test_embedded_lookup_table_service.query_embedded_lookup_tables.return_value = {'embedded_id1': 'embedded1'}
    mocker.patch.object(test_embedded_lookup_table_service, 'evaluate_embedded_lookup_tables')
    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables.return_value = None
    batch_input = [{'well': {'well': 'well1'}, 'assumptions': {'assumption1': {'embedded': ['embedded_id1']}}}]
    expected_response = [{
        'well': {
            'well': 'well1'
        },
        'assumptions': {
            'assumption1': {
                'embedded': ['embedded_id1'],
            }
        }
    }]
    test_embedded_lookup_table_service.fill_in_embedded_lookup(batch_input)
    test_embedded_lookup_table_service.evaluate_embedded_lookup_tables.assert_called_once_with(
        {'embedded': ['embedded_id1']}, {'well': 'well1'}, {'embedded_id1': 'embedded1'})
    assert batch_input == expected_response
