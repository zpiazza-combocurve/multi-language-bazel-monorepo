from combocurve.science.econ.econ_calculations.well_stream import WellStream
from .test_data.well_stream_test_data import inputs, results, ownership_dict_by_phase
import pytest
import deepdiff


@pytest.mark.unittest
def test_well_stream_count():
    calculation = WellStream(*inputs['count'])
    response = calculation.result(ownership_dict_by_phase)
    expected_response = results['count']
    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_well_stream_percentage():
    calculation = WellStream(*inputs['percentage'])
    response = calculation.result(ownership_dict_by_phase)
    expected_response = results['percentage']
    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_well_stream_primary_product():
    calculation = WellStream(*inputs['count_primary_product_gas'])
    response = calculation.result(ownership_dict_by_phase)
    expected_response = results['count_primary_product_gas']
    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6, ignore_numeric_type_changes=True)
