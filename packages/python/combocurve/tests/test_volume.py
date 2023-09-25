import pytest
import deepdiff

from combocurve.science.econ.econ_calculations.volume import VolumeMonthly
from .test_data.volume_test_data import volume_models, volume_params, volume_results


@pytest.fixture()
def mock_evaluate_boolean_flag(mocker):
    # Patch local version of the evaluate_boolean_flag function so we can control the return value and not reach out
    # to LaunchDarkly
    mocker.patch('combocurve.science.econ.econ_calculations.volume.evaluate_boolean_flag', return_value=False)


@pytest.mark.unittest
def test_volume_unecon(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models(unecon_bool=True))

    response = model.result(*volume_params(unecon_bool=True))

    expected_response = volume_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_no_risk_no_stream_property(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models())

    response = model.result(*volume_params())

    expected_response = volume_results()

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_with_risk(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models(is_risk=True))

    response = model.result(*volume_params())

    expected_response = volume_results(is_risk=True)

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_yield(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models())

    response = model.result(*volume_params(stream_property='yield'))

    expected_response = volume_results(stream_property='yield')

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_shrinkage(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models())

    response = model.result(*volume_params(stream_property='shrink'))

    expected_response = volume_results(stream_property='shrink')

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_flare(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models())

    response = model.result(*volume_params(stream_property='flare'))

    expected_response = volume_results(stream_property='flare')

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)


@pytest.mark.unittest
def test_volume_all_stream_property(mock_evaluate_boolean_flag):
    model = VolumeMonthly(*volume_models())

    response = model.result(*volume_params(stream_property='all'))

    expected_response = volume_results(stream_property='all')

    assert not deepdiff.DeepDiff(response, expected_response, math_epsilon=1e-5)
