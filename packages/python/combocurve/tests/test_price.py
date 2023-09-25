from combocurve.science.econ.econ_calculations.price import Price
from .test_data.price_test_data import price_models, price_results, compositional_results
import pytest
import deepdiff


@pytest.fixture(autouse=True)
def mock_evaluate_boolean_flag_disabled(mocker):
    # Patch local version of the evaluate_boolean_flag function so we can control the return value and not reach out
    # to LaunchDarkly
    mocker.patch('combocurve.science.econ.econ_calculations.price.evaluate_boolean_flag', return_value=False)


@pytest.fixture
def mock_evaluate_boolean_flag_enabled(mocker):
    # Patch local version of the evaluate_boolean_flag function so we can control the return value and not reach out
    # to LaunchDarkly
    mocker.patch('combocurve.science.econ.econ_calculations.price.evaluate_boolean_flag', return_value=True)


@pytest.mark.unittest
def test_price_unecon():
    model = Price(*price_models(unecon_bool="unecon", pricing_model="unecon", differential_model="unecon"))

    response = model.result()

    expected_response = price_results(unecon_bool='unecon')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_empty_price():
    model = Price(*price_models(pricing_model="empty_rows"))

    response = model.result()

    expected_response = price_results(pricing_model="empty_rows")

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_empty_differential():
    model = Price(*price_models(differential_model="empty_rows"))

    response = model.result()

    expected_response = price_results(differential_model="empty_rows")

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_flat_price_flat_differential():
    model = Price(*price_models())

    response = model.result()

    expected_response = price_results()

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_timeseries_price_flat_differential():
    model = Price(*price_models(pricing_model='timeseries'))

    response = model.result()

    expected_response = price_results(pricing_model='timeseries')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_undefault_units_price_flat_differential():
    model = Price(*price_models(pricing_model='undefault_units'))

    response = model.result()

    expected_response = price_results(pricing_model='undefault_units')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_escalation_price_flat_differential():
    model = Price(*price_models(pricing_model='escalation'))

    response = model.result()

    expected_response = price_results(pricing_model='escalation')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_cap_price_flat_differential():
    model = Price(*price_models(pricing_model='cap'))

    response = model.result()

    expected_response = price_results(pricing_model='cap')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_flat_price_timeseries_differential():
    model = Price(*price_models(differential_model='timeseries'))

    response = model.result()

    expected_response = price_results(differential_model='timeseries')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_flat_price_base_price_remaining_differential():
    model = Price(*price_models(differential_model='base_price_remaining'))

    response = model.result()

    expected_response = price_results(differential_model='base_price_remaining')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_price_with_compositional_correct_structure(mock_evaluate_boolean_flag_enabled):
    model = Price(*price_models(compositionals_model='flat_only_gas'))

    response = model.result()

    for price_category in ['dict', 'parameter', 'cap', 'escalation']:
        assert 'compositionals' in response['price']['price_' + price_category]

    assert 'gas' in response['price']['price_dict']['compositionals']

    assert 'ngl' not in response['price']['price_dict']['compositionals']

    assert 'CO2' in response['price']['price_dict']['compositionals']['gas']

    assert 'C9' not in response['price']['price_dict']['compositionals']['gas']


@pytest.mark.parametrize('compositional_model',
                         ['flat_only_gas', 'flat_gas_ngl', 'as_of_only_gas', 'as_of_only_ngl', 'dates_only_gas'])
def test_price_with_compositional_correct_values(mock_evaluate_boolean_flag_enabled, compositional_model):
    model = Price(*price_models(compositionals_model=compositional_model))

    response = model.result()

    expected_compositional_response = compositional_results(compositional_model)

    response_compositionals = response['price']['price_dict']['compositionals']

    assert deepdiff.DeepDiff(response_compositionals, expected_compositional_response, significant_digits=6)
