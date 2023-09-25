from combocurve.science.econ.econ_calculations.revenue import Revenue
from .test_data.revenue_test_data import revenue_params, revenue_results, btu_content_dict
import pytest
import deepdiff


@pytest.fixture(autouse=True)
def mock_evaluate_boolean_flag_disabled(mocker):
    # Patch local version of the evaluate_boolean_flag function so we can control the return value and not reach out
    # to LaunchDarkly
    mocker.patch('combocurve.science.econ.econ_calculations.revenue.evaluate_boolean_flag', return_value=False)


@pytest.mark.unittest
def test_revenue_unecon():
    model = Revenue(btu_content_dict)

    response = model.result(*revenue_params(unecon_bool=True))

    expected_response = revenue_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_revenue_no_cap_no_differential():
    model = Revenue(btu_content_dict)

    response = model.result(*revenue_params())

    expected_response = revenue_results()

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_revenue_with_cap():
    model = Revenue(btu_content_dict)

    response = model.result(*revenue_params(has_cap=True))

    expected_response = revenue_results(has_cap=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_revenue_with_differential():
    model = Revenue(btu_content_dict)

    response = model.result(*revenue_params(has_differential=True))

    expected_response = revenue_results(has_differential=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_revenue_with_cap_with_differential():
    model = Revenue(btu_content_dict)

    response = model.result(*revenue_params(has_cap=True, has_differential=True))

    expected_response = revenue_results(has_cap=True, has_differential=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
