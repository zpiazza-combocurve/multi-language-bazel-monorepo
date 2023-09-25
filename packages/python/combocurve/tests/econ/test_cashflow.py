from combocurve.science.econ.econ_calculations.cashflow import BeforeIncomeTaxCashFlow, AfterIncomeTaxCashFlow
from .test_data.cashflow_test_data import (BFIT_cashflow_parameters, BFIT_cashflow_results, AFIT_cashflow_models,
                                           AFIT_cashflow_parameters, AFIT_cashflow_results)
import pytest
import deepdiff


@pytest.mark.unittest
def test_BFIT_unecon():
    model = BeforeIncomeTaxCashFlow()

    response = model.result(*BFIT_cashflow_parameters(unecon_bool=True))

    expected_response = BFIT_cashflow_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_BFIT_with_expense():
    model = BeforeIncomeTaxCashFlow()

    response = model.result(*BFIT_cashflow_parameters(is_expense=True))

    expected_response = BFIT_cashflow_results(is_expense=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_BFIT_with_capex():
    model = BeforeIncomeTaxCashFlow()

    response = model.result(*BFIT_cashflow_parameters(is_capex=True))

    expected_response = BFIT_cashflow_results(is_capex=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_BFIT_with_production_tax():
    model = BeforeIncomeTaxCashFlow()

    response = model.result(*BFIT_cashflow_parameters(is_production_tax=True))

    expected_response = BFIT_cashflow_results(is_production_tax=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_BFIT_with_expense_capex_and_production_tax():
    model = BeforeIncomeTaxCashFlow()

    response = model.result(*BFIT_cashflow_parameters(is_expense=True, is_capex=True, is_production_tax=True))

    expected_response = BFIT_cashflow_results(is_expense=True, is_capex=True, is_production_tax=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_unecon():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models(unecon_bool=True))

    response = model.result(*AFIT_cashflow_parameters(unecon_bool=True))

    expected_response = AFIT_cashflow_results(unecon_bool=True)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_fifteen_percent():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models(income_tax_specification='fifteen'))

    response = model.result(*AFIT_cashflow_parameters())

    expected_response = AFIT_cashflow_results(income_tax_specification='fifteen')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_carry_forward():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models(income_tax_specification='carry_forward'))

    response = model.result(*AFIT_cashflow_parameters())

    expected_response = AFIT_cashflow_results(income_tax_specification='carry_forward')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_fifteen_carry_forward():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models(income_tax_specification='fifteen_carry_forward'))

    response = model.result(*AFIT_cashflow_parameters())

    expected_response = AFIT_cashflow_results(income_tax_specification='fifteen_carry_forward')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_depreciation():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='depreciation'))

    expected_response = AFIT_cashflow_results(dda_model='depreciation')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_UOP_major():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='UOP_major'))

    expected_response = AFIT_cashflow_results(dda_model='UOP_major')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_UOP_BOE():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='UOP_BOE'))

    expected_response = AFIT_cashflow_results(dda_model='UOP_BOE')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_deduct_ecl():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='deduct_ecl'))

    expected_response = AFIT_cashflow_results(dda_model='deduct_ecl')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_expense_fpd():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='expense_fpd'))

    expected_response = AFIT_cashflow_results(dda_model='expense_fpd')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_no_depletion():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='no_depletion'))

    expected_response = AFIT_cashflow_results(dda_model='no_depletion')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_depreciation_and_depletion():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='depreciation_and_depletion'))

    expected_response = AFIT_cashflow_results(dda_model='depreciation_and_depletion')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_depreciation_with_tax_credit():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='depreciation_with_tax_credit'))

    expected_response = AFIT_cashflow_results(dda_model='depreciation_with_tax_credit')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_depletion_with_immediate_depletion():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='depletion_with_immediate_depletion'))

    expected_response = AFIT_cashflow_results(dda_model='depletion_with_immediate_depletion')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_AFIT_bonus_depreciation():
    model = AfterIncomeTaxCashFlow(*AFIT_cashflow_models())

    response = model.result(*AFIT_cashflow_parameters(dda_model='bonus_depreciation'))

    expected_response = AFIT_cashflow_results(dda_model='bonus_depreciation')

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
