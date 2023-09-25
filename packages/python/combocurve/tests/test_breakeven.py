from combocurve.science.econ.econ_calculations.breakeven import *
from deepdiff import DeepDiff
import pytest
import numpy as np

PATH_TO_MODULE = "combocurve.science.econ.econ_calculations.breakeven."


@pytest.mark.unittest
def test_change_unit_for_gas_mmbtu():
    response = change_unit_for_gas('dollar_per_mmbtu')
    expected_response = '$/MMBTU'

    assert response == expected_response


@pytest.mark.unittest
def test_change_unit_for_gas_mcf():
    response = change_unit_for_gas('dollar_per_mcf')
    expected_response = '$/MCF'

    assert response == expected_response


@pytest.mark.unittest
def test_change_unit_for_gas_error():
    with pytest.raises(Exception):
        change_unit_for_gas('dollar_per_aaa')


@pytest.mark.unittest
def test_calculate_proportion_equal():
    response = calculate_proportion((5, 10), (10, 10))
    expected_response = None

    assert response == expected_response


@pytest.mark.unittest
def test_calculate_proportion_different():
    response = calculate_proportion((5, 10), (10, 20))
    expected_response = np.round((10 * 10 - 5 * 20) / (10 - 20), 2)

    assert response == expected_response


@pytest.mark.unittest
def test_phase_pricing_model_dictionary_gas():
    response = phase_pricing_model_dictionary('gas', 'A', 10)
    expected_response = {
        'cap': '',
        'escalation_model': 'none',
        'rows': [{
            'A': 10.,
            'entire_well_life': 'Entire Well Life'
        }]
    }

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_phase_pricing_model_dictionary_gas_with_price_ratio():
    response = phase_pricing_model_dictionary('gas', 'A', 10, oil_gas_price_ratio=2)
    expected_response = {
        'cap': '',
        'escalation_model': 'none',
        'rows': [{
            'A': 5.0,
            'entire_well_life': 'Entire Well Life'
        }]
    }

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_phase_pricing_model_dictionary_not_gas():
    response = phase_pricing_model_dictionary('oil', 'A', 10, oil_gas_price_ratio=2)
    expected_response = {
        'cap': '',
        'escalation_model': 'none',
        'rows': [{
            'price': 20,
            'entire_well_life': 'Entire Well Life'
        }]
    }

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_setup_pricing_model_for_economics_no_ratio(mocker):
    def mock_phase_pricing_model_dictionary(phase_key, gas_price_unit, price, oil_gas_price_ratio=1):
        return [gas_price_unit, price, oil_gas_price_ratio]

    mocker.patch(PATH_TO_MODULE + 'phase_pricing_model_dictionary', side_effect=mock_phase_pricing_model_dictionary)
    phase_key = 'gas'
    pricing_model = {'gas': {'rows': [{'dollar_per_mcf': 1}]}}
    based_on_price_ratio = 'no'
    oil_gas_price_ratio = 2
    response = setup_pricing_model_for_economics(phase_key, pricing_model, based_on_price_ratio, oil_gas_price_ratio)
    expected_response = 'dollar_per_mcf', [0, 5], [{'gas': ['dollar_per_mcf', 0, 1]}, {'gas': ['dollar_per_mcf', 5, 1]}]
    print(response)
    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_setup_pricing_model_for_economics_with_ratio(mocker):
    def mock_phase_pricing_model_dictionary(phase_key, gas_price_unit, price, oil_gas_price_ratio=2):
        return [gas_price_unit, price, oil_gas_price_ratio]

    mocker.patch(PATH_TO_MODULE + 'phase_pricing_model_dictionary', side_effect=mock_phase_pricing_model_dictionary)
    phase_key = 'gas'
    pricing_model = {'gas': {'rows': [{'dollar_per_mcf': 1}]}}
    based_on_price_ratio = 'yes'
    oil_gas_price_ratio = 2
    response = setup_pricing_model_for_economics(phase_key, pricing_model, based_on_price_ratio, oil_gas_price_ratio)
    expected_response = ('dollar_per_mcf', [0, 5], [{
        'gas': ['dollar_per_mcf', 0, 2],
        'oil': ['dollar_per_mcf', 0, 2]
    }, {
        'gas': ['dollar_per_mcf', 5, 2],
        'oil': ['dollar_per_mcf', 5, 2]
    }])
    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_phase_breakeven_not_gas(mocker):
    class MockSimpleEconomics:
        def __init__(self, pricing_model):
            self.pricing_model = pricing_model

        def simple_econ_result(self):
            return {'bfit_disc': {'detail_cf': {'disc_cf_1': self.pricing_model}}}

    class MockWellInput():
        def __init__(self):
            self.ownership_model = {'ownership': {'initial_ownership': 'A'}}
            self.breakeven_model = {'npv_discount': 'B', 'based_on_price_ratio': 'C', 'price_ratio': 'D'}
            self.general_option_model = {'discount_table': {'first_discount': 0}}
            self.pricing_model = {}
            self.date_dict = {}

    def mock_simple_econ(well_input, well_result_params):
        return MockSimpleEconomics(well_input.pricing_model)

    test_pricing_model = [[100, 100, 100], [200, 200, 200]]
    mocker.patch(PATH_TO_MODULE + 'get_initial_ownership_params', return_value=('E', 'F'))
    mocker.patch(PATH_TO_MODULE + 'setup_pricing_model_for_economics', return_value=('F', 'G', test_pricing_model))
    mocker.patch(PATH_TO_MODULE + 'calculate_proportion', side_effect=lambda x, y: (x, y))

    response = calculate_phase_breakeven(mock_simple_econ, MockWellInput(), 'J')

    assert response == (('G', [300, 600]), '$/BBL')


@pytest.mark.unittest
def test_calculate_phase_breakeven_gas(mocker):
    class MockSimpleEconomics:
        def __init__(self, pricing_model):
            self.pricing_model = pricing_model

        def simple_econ_result(self):
            return {'bfit_disc': {'detail_cf': {'disc_cf_1': self.pricing_model}}}

    class MockWellInput():
        def __init__(self):
            self.ownership_model = {'ownership': {'initial_ownership': 'A'}}
            self.breakeven_model = {'npv_discount': 'B', 'based_on_price_ratio': 'C', 'price_ratio': 'D'}
            self.general_option_model = {'discount_table': {'first_discount': 0}}
            self.pricing_model = {}
            self.date_dict = {}

    def mock_simple_econ(well_input, well_result_params):
        return MockSimpleEconomics(well_input.pricing_model)

    test_pricing_model = [[100, 100, 100], [200, 200, 200]]
    mocker.patch(PATH_TO_MODULE + 'get_initial_ownership_params', return_value=('E', 'F'))
    mocker.patch(PATH_TO_MODULE + 'setup_pricing_model_for_economics', return_value=('F', 'G', test_pricing_model))
    mocker.patch(PATH_TO_MODULE + 'calculate_proportion', side_effect=lambda x, y: (x, y))
    mocker.patch(PATH_TO_MODULE + 'change_unit_for_gas', return_value='I')

    response = calculate_phase_breakeven(mock_simple_econ, MockWellInput(), 'gas')

    assert response == (('G', [300, 600]), 'I')


@pytest.mark.unittest
def test_breakeven_results_unecon():
    class MockSimpleEconomics:
        def __init__(self, pricing_model):
            self.pricing_model = pricing_model

    class MockWellInput():
        def __init__(self):
            self.columns = [{
                'key': 'oil_breakeven',
                'selected_options': {
                    'one_liner': True
                }
            }, {
                'key': 'gas_breakeven',
                'selected_options': {
                    'one_liner': False
                }
            }]
            self.incremental_index = 0

    def mock_simple_econ(well_input, well_result_params):
        return MockSimpleEconomics(well_input.pricing_model)

    unecon_bool = True

    response = breakeven_results(mock_simple_econ, MockWellInput(), unecon_bool)
    expected_response = {'oil_breakeven': None}, {'oil_breakeven': None}

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_breakeven_results_incremental():
    class MockSimpleEconomics:
        def __init__(self, pricing_model):
            self.pricing_model = pricing_model

    class MockWellInput():
        def __init__(self):
            self.columns = [{
                'key': 'oil_breakeven',
                'selected_options': {
                    'one_liner': True
                }
            }, {
                'key': 'gas_breakeven',
                'selected_options': {
                    'one_liner': False
                }
            }]
            self.incremental_index = 1

    def mock_simple_econ(well_input, well_result_params):
        return MockSimpleEconomics(well_input.pricing_model)

    unecon_bool = False

    response = breakeven_results(mock_simple_econ, MockWellInput(), unecon_bool)
    expected_response = {'oil_breakeven': None}, {'oil_breakeven': None}

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_breakeven_results_not_incremental_not_unecon(mocker):
    class MockSimpleEconomics:
        def __init__(self, pricing_model):
            self.pricing_model = pricing_model

    class MockWellInput():
        def __init__(self):
            self.columns = [{
                'key': 'oil_breakeven',
                'selected_options': {
                    'one_liner': True
                }
            }, {
                'key': 'gas_breakeven',
                'selected_options': {
                    'one_liner': True
                }
            }]
            self.incremental_index = 0

    def mock_simple_econ(well_input, well_result_params):
        return MockSimpleEconomics(well_input.pricing_model)

    def mock_calculate_phase_breakeven(simple_economics, well_input, phase_key):
        return phase_key, {'oil': '$/bbl', 'gas': '$/mcf'}[phase_key]

    mocker.patch(PATH_TO_MODULE + 'calculate_phase_breakeven', side_effect=mock_calculate_phase_breakeven)

    unecon_bool = False

    response = breakeven_results(mock_simple_econ, MockWellInput(), unecon_bool)
    expected_response = {
        'oil_breakeven': 'oil',
        'gas_breakeven': 'gas'
    }, {
        'oil_breakeven': '$/bbl',
        'gas_breakeven': '$/mcf'
    }

    assert not DeepDiff(response, expected_response)
