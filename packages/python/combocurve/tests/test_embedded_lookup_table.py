'''from combocurve.science.econ.embedded_lookup_table import expense_conversion
import numpy as np
import pytest
import embedded_lookup_table_test_variables


@pytest.mark.unittest
def test_row_converter_dates():
    current_input = {
        'key': 'oil',
        'category': 'processing',
        'unit': 'dollar_per_bbl',
        'criteria': 'dates',
        'period': ['01/1995', '01/1997'],
        'value': ['2', '2'],
    }

    expense_type = 'variable_expense'

    response = expense_conversion.row_converter(current_input, expense_type)

    expected_response = [
        {
            'dollar_per_bbl': 2.0,
            'dates': {
                'start_date': '1995-01-01',
                'end_date': '1996-12-31'
            },
        },
        {
            'dollar_per_bbl': 2.0,
            'dates': {
                'start_date': '1997-01-01',
                'end_date': 'Econ Limit'
            },
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_row_converter_rate():
    current_input = {
        'key': 'oil',
        'category': 'gathering',
        'unit': 'dollar_per_bbl',
        'criteria': 'oil_rate',
        'period': [10, 20],
        'value': ['2', '2'],
        'description': '',
        'shrinkage_condition': {
            'label': 'Unshrunk',
            'value': 'unshrunk'
        },
        'escalation_model': {
            'label': 'None',
            'value': 'none'
        },
        'calculation': {
            'label': 'WI',
            'value': 'wi'
        },
        'affect_econ_limit': {
            'label': 'Yes',
            'value': 'yes'
        },
        'deduct_before_severance_tax': {
            'label': 'No',
            'value': 'no'
        },
        'deduct_before_ad_val_tax': {
            'label': 'No',
            'value': 'no'
        },
        'cap': '',
        'deal_terms': 1,
        'rate_type': {
            'label': 'Gross Well Head',
            'value': 'gross_well_head'
        },
        'rows_calculation_method': {
            'label': 'Non Monotonic',
            'value': 'non_monotonic',
        },
    }

    expense_type = 'variable_expense'

    response = expense_conversion.row_converter(current_input, expense_type)

    expected_response = [
        {
            'dollar_per_bbl': 2.0,
            'oil_rate': {
                'start': 10,
                'end': 20
            }
        },
        {
            'dollar_per_bbl': 2.0,
            'oil_rate': {
                'start': 20,
                'end': 'inf'
            }
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_row_converter_entire():
    current_input = {
        'key': 'oil',
        'category': 'gathering',
        'unit': 'dollar_per_bbl',
        'criteria': 'entire_well_life',
        'period': 'Flat',
        'value': '3',
    }
    expense_type = 'variable_expense'

    response = expense_conversion.row_converter(current_input, expense_type)

    expected_response = [{'dollar_per_bbl': 3.0, 'entire_well_life': 'Flat'}]

    assert response == expected_response


@pytest.mark.unittest
def test_row_converter_else():
    current_input = {
        'key': 'oil',
        'category': 'transportation',
        'unit': 'dollar_per_bbl',
        'criteria': 'offset_to_fpd',
        'period': [2, 2],
        'value': [0, 0],
    }

    expense_type = 'variable_expense'

    response = expense_conversion.row_converter(current_input, expense_type)

    expected_response = [
        {
            'dollar_per_bbl': 0.0,
            'offset_to_fpd': {
                'start': 1,
                'end': 2,
                'period': 2
            },
        },
        {
            'dollar_per_bbl': 0.0,
            'offset_to_fpd': {
                'start': 3,
                'end': 4,
                'period': 2
            }
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_row_converter_fixed():
    current_input = {
        'key': 'fixed_expenses',
        'category': {
            'label': 'Fixed 1',
            'value': 'monthly_well_cost'
        },
        'unit': 'dollar_per_bbl',
        'criteria': 'entire_well_life',
        'period': 'Flat',
        'value': '4000',
    }
    expense_type = 'fixed_expense'

    response = expense_conversion.row_converter(current_input, expense_type)

    expected_response = [{'fixed_expense': 4000.0, 'entire_well_life': 'Flat'}]

    assert response == expected_response


@pytest.mark.unittest
def test_lines_processor():
    lines = [
        {
            'key': 'key',
            'value': 'oil'
        },
        {
            'key': 'category',
            'value': 'gathering'
        },
        {
            'key': 'unit',
            'value': 'dollar_per_bbl'
        },
        {
            'key': 'criteria',
            'value': 'oil_rate'
        },
        {
            'key': 'period',
            'value': 10
        },
        {
            'key': 'value',
            'value': '2'
        },
        {
            'key': 'description',
            'value': ''
        },
        {
            'key': 'shrinkage_condition',
            'value': 'unshrunk'
        },
        {
            'key': 'escalation_model',
            'value': 'none'
        },
        {
            'key': 'calculation',
            'value': 'wi'
        },
        {
            'key': 'affect_econ_limit',
            'value': 'yes'
        },
        {
            'key': 'deduct_before_severance_tax',
            'value': 'no'
        },
        {
            'key': 'deduct_before_ad_val_tax',
            'value': 'no'
        },
        {
            'key': 'cap',
            'value': ''
        },
        {
            'key': 'deal_terms',
            'value': 1
        },
        {
            'key': 'rate_type',
            'value': 'gross_well_head'
        },
        {
            'key': 'rows_calculation_method',
            'value': 'non_monotonic'
        },
    ]

    response = expense_conversion.lines_processor(lines)

    expected_response = {
        'key': 'oil',
        'category': 'gathering',
        'unit': 'dollar_per_bbl',
        'criteria': 'oil_rate',
        'period': 10,
        'value': '2',
        'shrinkage_condition': 'unshrunk',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic'
    }

    np.testing.assert_array_equal(response, expected_response)


@pytest.mark.unittest
def test_lines_processor_translate_FE_entries_to_BE_values():
    lines = [{
        'key': 'a',
        'value': 'Unshrunk'
    }, {
        'key': 'b',
        'value': 'Shrunk'
    }, {
        'key': 'c',
        'value': 'WI'
    }, {
        'key': 'd',
        'value': 'NRI'
    }, {
        'key': 'e',
        'value': 'Lease NRI'
    }, {
        'key': 'f',
        'value': '1 - WI'
    }, {
        'key': 'g',
        'value': '1 - NRI'
    }, {
        'key': 'h',
        'value': '1 - Lease NRI'
    }, {
        'key': 'i',
        'value': 'WI - 1'
    }, {
        'key': 'j',
        'value': 'NRI - 1'
    }, {
        'key': 'k',
        'value': 'Lease NRI - 1'
    }, {
        'key': 'l',
        'value': '100% WI'
    }]

    response = expense_conversion.lines_processor(lines, False)

    expected_response = {
        'a': 'unshrunk',
        'b': 'shrunk',
        'c': 'wi',
        'd': 'nri',
        'e': 'lease_nri',
        'f': 'one_minus_wi',
        'g': 'one_minus_nri',
        'h': 'one_minus_lease_nri',
        'i': 'wi_minus_one',
        'j': 'nri_minus_one',
        'k': 'lease_nri_minus_one',
        'l': '100_pct_wi'
    }

    np.testing.assert_array_equal(response, expected_response)


@pytest.mark.unittest
def test_lines_processor_invalid_pairings_leading_to_no_values():
    response = expense_conversion.lines_processor([])

    expected_response = {
        'value': '0',
        'unit': 'dollar_per_bbl',
    }

    np.testing.assert_array_equal(response, expected_response)


@pytest.mark.unittest
def test_embedded_expenses_conversion():
    lookup_input = [
        [
            {
                'key': 'key',
                'value': 'oil'
            },
            {
                'key': 'category',
                'value': 'gathering'
            },
            {
                'key': 'unit',
                'lookup': 'line-4-unit',
                'value': 'dollar_per_bbl'
            },
            {
                'key': 'criteria',
                'value': 'entire_well_life'
            },
            {
                'key': 'period',
                'value': 'Flat'
            },
            {
                'key': 'value',
                'lookup': 'line-2-value',
                'value': '3'
            },
        ],
        [
            {
                'key': 'key',
                'value': 'oil'
            },
            {
                'key': 'category',
                'value': 'processing'
            },
            {
                'key': 'unit',
                'value': 'dollar_per_bbl'
            },
            {
                'key': 'criteria',
                'value': 'entire_well_life'
            },
            {
                'key': 'period',
                'value': 'Flat'
            },
            {
                'key': 'value',
                'lookup': 'line-3-value',
                'value': '3'
            },
            {
                'key': 'description',
                'lookup': 'line-1-description',
                'value': ''
            },
        ],
    ]
    response = expense_conversion.embedded_expenses_conversion(lookup_input)

    expected_response = embedded_lookup_table_test_variables.expenses_inputs

    for i in range(3):
        assert response[i] == expected_response[i]


@pytest.mark.unittest
def test_embedded_fixed_expenses_conversion():
    fixed_expense_lookup_input = {
        'monthly_well_cost': {
            'key': 'fixed_expenses',
            'category': {
                'label': 'Fixed 1',
                'value': 'monthly_well_cost'
            },
            'unit': 'dollar_per_bbl',
            'criteria': 'entire_well_life',
            'period': 'Flat',
            'value': '4000',
        },
        'other_monthly_cost_1': None,
        'other_monthly_cost_2': None,
        'other_monthly_cost_3': None,
        'other_monthly_cost_4': None,
        'other_monthly_cost_5': None,
        'other_monthly_cost_6': None,
        'other_monthly_cost_7': None,
        'other_monthly_cost_8': None,
    }

    response = expense_conversion.embedded_fixed_expenses_conversion(fixed_expense_lookup_input)

    expected_response = embedded_lookup_table_test_variables.fixed_expense_input

    assert response == expected_response


@pytest.mark.unittest
def test_embedded_var_expenses_conversion():
    var_expenses_lookup_input = {
        'oil': {
            'gathering': {
                'key': 'oil',
                'category': 'gathering',
                'unit': 'dollar_per_bbl',
                'criteria': 'entire_well_life',
                'period': 'Flat',
                'value': '6',
                'description': 'test',
                'shrinkage_condition': 'shrunk',
                'cap': '',
            },
            'processing': {
                'key': 'oil',
                'category': 'processing',
                'unit': 'dollar_per_bbl',
                'criteria': 'entire_well_life',
                'period': 'Flat',
                'value': '6',
                'shrinkage_condition': 'shrunk',
            },
            'transportation': {
                'key': 'oil',
                'category': 'transportation',
                'unit': 'dollar_per_bbl',
                'criteria': 'entire_well_life',
                'period': 'Flat',
                'value': '14',
            },
            'marketing': None,
            'other': None,
        },
        'gas': {
            'gathering': None,
            'processing': {
                'key': 'gas',
                'category': 'processing',
                'unit': 'dollar_per_mcf',
                'criteria': 'entire_well_life',
                'period': 'Flat',
                'value': '4',
                'description': 'if',
            },
            'transportation': None,
            'marketing': None,
            'other': None,
        },
        'ngl': {
            'gathering': None,
            'processing': {
                'key': 'ngl',
                'category': 'processing',
                'unit': 'dollar_per_bbl',
                'criteria': 'entire_well_life',
                'period': 'Flat',
                'value': '25',
                'description': 'working',
            },
            'transportation': None,
            'marketing': None,
            'other': None,
        },
        'drip_condensate': {
            'gathering': None,
            'processing': None,
            'transportation': None,
            'marketing': None,
            'other': None,
        },
    }

    response = expense_conversion.embedded_var_expenses_conversion(var_expenses_lookup_input)

    expected_response = embedded_lookup_table_test_variables.var_expenses_input

    assert response == expected_response


@pytest.mark.unittest
def test_embedded_water_expenses_conversion():
    water_expenses_lookup_input = {
        'key': 'water_disposal',
        'category': '',
        'unit': 'dollar_per_bbl',
        'criteria': 'entire_well_life',
        'period': 'Flat',
        'value': '7',
    }

    response = expense_conversion.embedded_water_expenses_conversion(water_expenses_lookup_input)

    expected_response = {
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'dollar_per_bbl': 7.0,
            'entire_well_life': 'Flat'
        }],
    }

    assert response == expected_response


@pytest.mark.unittest
def test_orig_emb():
    response = expense_conversion.orig_emb({'a': 'b'}, 'original')

    expected_response = {'a': 'b', 'type_model': 'original'}

    assert response == expected_response


@pytest.mark.unittest
def test_incorporate_embedded():
    response = expense_conversion.incorporate_embedded(embedded_lookup_table_test_variables.expense_model)

    expected_response = embedded_lookup_table_test_variables.incorporated_inputs

    assert response == expected_response
'''