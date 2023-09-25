from combocurve.science.econ.econ_calculations import discount

import pytest
import deepdiff
import numpy as np
import datetime
import copy

PATH_TO_MODULE = "combocurve.science.econ.econ_calculations.discount."


@pytest.mark.unittest
def test_get_cum_days_mid_month():
    response = discount.get_cum_days(
        np.array([datetime.date(1995, i, 1) for i in range(1, 12)]),
        datetime.date(1995, 1, 15),
        "mid_month",
    )

    expected_response = (
        np.array([True, True, True, True, True, True, True, True, True, True, True]),
        np.array([2, 30, 61, 91, 122, 152, 183, 214, 244, 275, 305]),
    )

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_cum_days_12th_month():
    response = discount.get_cum_days(
        np.array([datetime.date(1995, i, 1) for i in range(1, 13)]),
        datetime.date(1995, 1, 15),
        "mid_month",
    )

    expected_response = (
        np.array([True, True, True, True, True, True, True, True, True, True, True, True]),
        np.array([2, 30, 61, 91, 122, 152, 183, 214, 244, 275, 305, 336]),
    )

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_cum_days_end_month():
    response = discount.get_cum_days(
        np.array([datetime.date(1995, i, 1) for i in range(1, 12)]),
        datetime.date(1995, 1, 15),
        "end_month",
    )

    expected_response = (
        np.array([True, True, True, True, True, True, True, True, True, True, True]),
        np.array([17, 45, 76, 106, 137, 167, 198, 229, 259, 290, 320]),
    )

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_cum_days_invalid_month():
    with pytest.raises(Exception):
        discount.get_cum_days(
            np.array([datetime.date(1995, i, 1) for i in range(1, 12)]),
            datetime.date(1995, 1, 15),
            "invalid_month",
        )


@pytest.mark.unittest
def test_npv(mocker):
    mocker.patch(PATH_TO_MODULE + "phdwin_discount", return_value=2)

    response = discount.npv(0, np.array([1.0, 1.0, 1.0, 1.0]), 0, 0, 0)

    expected_response = np.sum(np.array([2.0, 1.0, 1.0, 1.0]))

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_phdwin_discount():
    response = discount.phdwin_discount(0.1, 30, np.array([0, 30, 60, 90]))

    expected_response = np.array([1.0, 0.99183363, 0.98373396, 0.97570043])

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_npv_derivative(mocker):
    mocker.patch(PATH_TO_MODULE + "phdwin_discount_derivative", return_value=2)

    response = discount.npv_derivative(0, np.array([3.0, 3.0, 3.0, 1.0]), 0, np.array([False, True, True, True]), 0)

    expected_response = np.sum(np.array([6.0, 6.0, 2.0]))

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_phdwin_discount_derivative():
    response = discount.phdwin_discount_derivative(0.1, 30, np.array([0, 30, 60, 90]))

    expected_response = np.array([-0.0, -0.08119413, -0.16106213, -0.23962026])

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_num_period_valid(mocker):
    mocker.patch(PATH_TO_MODULE + "DISC_METHOD_PERIODS", {"test": 5})

    response = discount.get_num_period("test")

    expected_response = 5

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_num_period_invalid(mocker):
    mocker.patch(PATH_TO_MODULE + "DISC_METHOD_PERIODS", {"test": 5})
    with pytest.raises(Exception):
        discount.get_num_period("invalid")


@pytest.mark.unittest
def test_discounted_roi_no_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    response = discount.discounted_roi({
        "total_revenue": np.array([1, 2, 3, 4, 5]),
        "total_expense": np.array([1, 2, 3, 4, 5]),
        "total_production_tax": np.array([1, 2, 3, 4, 5]),
        "total_capex": np.zeros(3),
    })

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_discounted_roi_infinite(mocker):

    def return_if_or_not(a, total, b, c, d):
        return np.inf if total[0] == "inf" else 0

    mocker.patch(PATH_TO_MODULE + "npv", side_effect=return_if_or_not)

    response = discount.discounted_roi(
        {
            "total_revenue": np.array(["inf"]),
            "total_expense": np.array([1, 2, 3, 4, 5]),
            "total_production_tax": np.array([1, 2, 3, 4, 5]),
            "total_capex": np.array([1, 2, 3, 4, 5]),
        },
        disc_rate=0.1,
    )

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_discounted_roi_with_capex_no_disc_rate(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    total_revenue = np.array([1, 2, 3, 4, 5])
    total_expense = np.array([1, 2, 3, 4, 5])
    total_production_tax = np.array([1, 2, 3, 4, 5])
    total_capex = np.array([1, 2, 3, 4, 5])

    response = discount.discounted_roi({
        "total_revenue": total_revenue,
        "total_expense": total_expense,
        "total_production_tax": total_production_tax,
        "total_capex": total_capex,
    })

    expected_response = (np.sum(total_revenue) - np.sum(total_expense)
                         - np.sum(total_production_tax)) / np.sum(total_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_discounted_roi_with_capex_with_disc_rate_no_disc_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    total_revenue = np.array([1, 2, 3, 4, 5])
    total_expense = np.array([1, 2, 3, 4, 5])
    total_production_tax = np.array([1, 2, 3, 4, 5])
    total_capex = np.array([1, 2, 3, 4, 5])

    response = discount.discounted_roi(
        {
            "total_revenue": total_revenue,
            "total_expense": total_expense,
            "total_production_tax": total_production_tax,
            "total_capex": total_capex,
        },
        disc_rate=0.1,
    )

    expected_response = (5 - 5 - 5 + 5) / np.sum(total_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_discounted_roi_with_capex_with_disc_rate_with_disc_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=8)

    total_revenue = (np.array([1, 2, 3, 4, 5]), )
    total_expense = (np.array([1, 2, 3, 4, 5]), )
    total_production_tax = (np.array([1, 2, 3, 4, 5]), )
    total_capex = np.array([1, 2, 3, 4, 5])
    discounted_capex = np.array([0, 1, 2, 3, 4])

    response = discount.discounted_roi(
        {
            "total_revenue": total_revenue,
            "total_expense": total_expense,
            "total_production_tax": total_production_tax,
            "total_capex": total_capex,
        },
        [],
        0.1,
        0,
        0,
        0,
        discounted_capex,
    )

    expected_response = (8 - 8 - 8 + 8) / np.sum(discounted_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_afit_discounted_roi_no_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    response = discount.afit_discounted_roi({
        "after_income_tax_cash_flow": np.array([1, 2, 3, 4, 5]),
        "total_capex": np.zeros(3),
    })

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_afit_discounted_roi_infinite(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=-np.inf)

    response = discount.afit_discounted_roi(
        {
            "after_income_tax_cash_flow": np.array([1, 2, 3, 4, 5]),
            "total_capex": np.array([1, 2, 3, 4, 5]),
        },
        0.1,
    )

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_afit_discounted_roi_with_capex_no_disc_rate(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    after_income_tax_cash_flow = np.array([1, 2, 3, 4, 5])
    total_capex = np.array([1, 2, 3, 4, 5])

    response = discount.afit_discounted_roi({
        "after_income_tax_cash_flow": after_income_tax_cash_flow,
        "total_capex": total_capex,
    })

    expected_response = np.sum(after_income_tax_cash_flow + total_capex) / np.sum(total_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_afit_discounted_roi_with_capex_with_disc_rate_no_disc_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=5)

    after_income_tax_cash_flow = np.array([1, 2, 3, 4, 5])
    total_capex = np.array([1, 2, 3, 4, 5])

    response = discount.afit_discounted_roi(
        {
            "after_income_tax_cash_flow": after_income_tax_cash_flow,
            "total_capex": total_capex,
        },
        0.1,
    )

    expected_response = 5 / np.sum(total_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_afit_discounted_roi_with_capex_with_disc_rate_with_disc_capex(mocker):
    mocker.patch(PATH_TO_MODULE + "npv", return_value=8)

    discounted_capex = np.array([0, 1, 2, 3, 4])
    after_income_tax_cash_flow = np.array([1, 2, 3, 4, 5])
    total_capex = np.array([1, 2, 3, 4, 5])

    response = discount.afit_discounted_roi(
        {
            "after_income_tax_cash_flow": after_income_tax_cash_flow,
            "total_capex": total_capex,
        },
        0.1,
        0,
        0,
        0,
        discounted_capex,
    )

    expected_response = (8) / np.sum(discounted_capex)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_irr(mocker):
    mocker.patch(PATH_TO_MODULE + "optimize.newton", return_value=5)

    response = discount.irr(np.array([-1, 1, 1]), 0, 0, 0)

    expected_response = 5

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_irr_above_limit(mocker):
    mocker.patch(PATH_TO_MODULE + "optimize.newton", return_value=100000)

    response = discount.irr(np.array([-1, 1, 1]), 0, 0, 0)

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_irr_negative_sum(mocker):
    mocker.patch(PATH_TO_MODULE + "optimize.newton", return_value=5)

    response = discount.irr(np.array([-1, -1, -1]), 0, 0, 0)

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_irr_all_positive(mocker):
    mocker.patch(PATH_TO_MODULE + "optimize.newton", return_value=5)

    response = discount.irr(np.array([1, 1, 1]), 0, 0, 0)

    expected_response = None

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_discounted_capex_no_capex_detail():
    capex_detail = []
    capex_detail_unchanged = copy.deepcopy(capex_detail)

    response = discount.get_discounted_capex(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2000, 1, 1),
        1,
        0.1,
    )

    expected_response = (np.zeros(4), capex_detail)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
    assert not deepdiff.DeepDiff(capex_detail, capex_detail_unchanged,
                                 significant_digits=6), "capex_detail wasn't properly copied"


@pytest.mark.unittest
def test_get_discounted_capex_with_capex_detail_before_discount_date():
    capex_detail = [{"index": 2, "date": datetime.date(2000, 3, 1), "total": 10000}]
    capex_detail_unchanged = copy.deepcopy(capex_detail)

    response = discount.get_discounted_capex(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2001, 1, 1),
        1,
        0.1,
    )

    expected_response = (
        np.array([0, 0, 10000.0, 0]),
        [{
            "index": 2,
            "date": datetime.date(2000, 3, 1),
            "total": 10000,
            "discounted_total": 10000,
        }],
    )

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
    assert not deepdiff.DeepDiff(capex_detail, capex_detail_unchanged,
                                 significant_digits=6), "capex_detail wasn't properly copied"


@pytest.mark.unittest
def test_get_discounted_capex_with_capex_detail_after_discount_date(mocker):
    mocker.patch(PATH_TO_MODULE + "phdwin_discount", return_value=[0.5])

    capex_detail = [{"index": 2, "date": datetime.date(2000, 3, 1), "total": 10000}]
    capex_detail_unchanged = copy.deepcopy(capex_detail)

    response = discount.get_discounted_capex(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2000, 1, 1),
        1,
        0.1,
    )

    expected_response = (
        np.array([0, 0, 5000.0, 0]),
        [{
            "index": 2,
            "date": datetime.date(2000, 3, 1),
            "total": 10000,
            "discounted_total": 5000.0,
        }],
    )

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
    assert not deepdiff.DeepDiff(capex_detail, capex_detail_unchanged,
                                 significant_digits=6), "capex_detail wasn't properly copied"


@pytest.mark.unittest
def test_get_discounted_capex_no_copy_no_capex_detail():
    capex_detail = []

    response = discount.get_discounted_capex_no_copy(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2000, 1, 1),
        1,
        0.1,
    )

    expected_response = np.zeros(4)

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_discounted_capex_no_copy_with_capex_detail_before_discount_date():
    capex_detail = [{"index": 2, "date": datetime.date(2000, 3, 1), "total": 10000}]

    response = discount.get_discounted_capex_no_copy(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2001, 1, 1),
        1,
        0.1,
    )

    expected_response = np.array([0, 0, 10000.0, 0])

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_get_discounted_capex_no_copy_with_capex_detail_after_discount_date(mocker):
    mocker.patch(PATH_TO_MODULE + "phdwin_discount", return_value=[0.5])

    capex_detail = [{"index": 2, "date": datetime.date(2000, 3, 1), "total": 10000}]

    response = discount.get_discounted_capex_no_copy(
        {
            "time": np.array([0, 1, 2, 3]),
            "total_capex": np.array([100, 200, 300, 400]),
            "capex_detail": capex_detail,
        },
        datetime.date(2000, 1, 1),
        1,
        0.1,
    )

    expected_response = np.array([0, 0, 9844.652259624161, 0])

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
