from combocurve.science.econ.econ_calculations.ownership import Ownership, OwnershipDaily
from combocurve.science.econ.econ_calculations.econ_calculations_test.test_data.ownership_test_data import (
    OWNERSHIP_INPUT,
    OWNERSHIP_DICT,
    OWNERSHIP_INPUT_DAILY,
    OWNERSHIP_DICT_DAILY,
    OWNERSHIP_DICT_DAILY_SINGLE_MONTH,
    DATE_DICT,
    DATE_DICT_SINGLE_MONTH
)
import pytest
import deepdiff
import numpy as np


PATH_TO_MODULE = "combocurve.science.econ.econ_calculations.ownership."


def adjust_array_return_ownership(this_ownership, t_ownership, t_all):
    return this_ownership


@pytest.mark.unittest
def test_ownership_monthly_reversion_or_cutoff(mocker):
    mocker.patch(
        PATH_TO_MODULE + "PreProcess.adjust_array",
        side_effect=adjust_array_return_ownership,
    )

    model = Ownership()

    response = model.result(OWNERSHIP_INPUT, 0, 0, False)

    expected_response = {
        "ownership_dict_by_phase": OWNERSHIP_DICT,
        "npi": {"expense": np.array([0.8])},
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_ownership_monthly_complete(mocker):
    mocker.patch(
        PATH_TO_MODULE + "PreProcess.adjust_array",
        side_effect=adjust_array_return_ownership,
    )

    model = Ownership()

    response = model.result(OWNERSHIP_INPUT, 0, 0, True)

    expected_response = {
        "ownership_dict_by_phase": OWNERSHIP_DICT,
        "npi": {"type": np.array([0.8])},
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)

@pytest.mark.unittest
def test_ownership_daily_multiple_months(mocker):
    mocker.patch(
        PATH_TO_MODULE + "days_in_month",
        return_value=np.array([30, 30, 31, 30], dtype=np.int64),
    )

    model = OwnershipDaily(DATE_DICT)

    response = model.result(OWNERSHIP_INPUT_DAILY, [0])

    expected_response = {'ownership_dict_by_phase_daily': OWNERSHIP_DICT_DAILY}

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)

@pytest.mark.unittest
def test_ownership_daily_single_month(mocker):
    mocker.patch(
        PATH_TO_MODULE + "days_in_month",
        return_value=np.array([], dtype=np.int64),
    )

    model = OwnershipDaily(DATE_DICT_SINGLE_MONTH)

    response = model.result(OWNERSHIP_DICT, [0])

    expected_response = {'ownership_dict_by_phase_daily': OWNERSHIP_DICT_DAILY_SINGLE_MONTH}

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)