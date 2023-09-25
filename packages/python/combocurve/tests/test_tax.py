from combocurve.science.econ.econ_calculations.tax import TaxDeduct, ProductionTax
from .test_data.tax_test_data import (tax_deduct_parameters, tax_deduct_results, production_tax_model,
                                      production_tax_parameters, production_tax_results)
import pytest
import deepdiff


@pytest.mark.unittest
def test_tax_deduct_unecon():
    model = TaxDeduct()

    response = model.result(*tax_deduct_parameters(unecon_bool=True))

    expected_response = tax_deduct_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_tax_deduct_no_expense():
    model = TaxDeduct()

    response = model.result(*tax_deduct_parameters(with_expense=False))

    expected_response = tax_deduct_results(with_expense=False)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_tax_deduct_with_expense_with_deduct():
    model = TaxDeduct()

    response = model.result(*tax_deduct_parameters(deduct=True))

    expected_response = tax_deduct_results(deduct=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_production_tax_unecon():
    model = ProductionTax(*production_tax_model(unecon_bool=True))

    response = model.result(*production_tax_parameters(unecon_bool=True))

    expected_response = production_tax_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_production_tax_with_ad_deduct():
    model = ProductionTax(*production_tax_model())

    response = model.result(*production_tax_parameters(is_ad_deduct=True))

    expected_response = production_tax_results(is_ad_deduct=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_production_tax_with_se_deduct():
    model = ProductionTax(*production_tax_model())

    response = model.result(*production_tax_parameters(is_se_deduct=True))

    expected_response = production_tax_results(is_se_deduct=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
