from combocurve.science.econ.econ_calculations.cutoff import *

import numpy as np
import pytest
from datetime import date
from deepdiff import DeepDiff

PATH_TO_MODULE = "combocurve.science.econ.econ_calculations.cutoff."


@pytest.mark.unittest
def test_apply_min_cut_off_date():
    real_cut_off = date(2021, 1, 1)
    t_real_cut_off = 0
    unecon_bool = False
    min_cut_off = {'date': date(2030, 1, 1)}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2030, 1, 1), 120, False)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_min_cut_off_real_cutoff_override():
    real_cut_off = date(2035, 1, 1)
    t_real_cut_off = 180
    unecon_bool = False
    min_cut_off = {'date': date(2030, 1, 1)}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2035, 1, 1), 180, False)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_min_cut_off_unecon_with_min_cutoff():
    real_cut_off = date(2035, 1, 1)
    t_real_cut_off = 180
    unecon_bool = True
    min_cut_off = {'date': date(2030, 1, 1)}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2030, 1, 1), 120, False)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_min_cut_off_no_min_cut_off():
    real_cut_off = date(2035, 1, 1)
    t_real_cut_off = 180
    unecon_bool = True
    min_cut_off = {'none': 0}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2035, 1, 1), 180, True)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_min_cut_off_as_of():
    real_cut_off = date(2021, 1, 1)
    t_real_cut_off = 0
    unecon_bool = False
    min_cut_off = {'as_of': 60}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2025, 12, 31), 71, False)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_min_cut_off_end_hist():
    real_cut_off = date(2021, 1, 1)
    t_real_cut_off = 0
    unecon_bool = False
    min_cut_off = {'end_hist': True}
    fpd = date(2020, 1, 1)
    as_of_date = date(2021, 1, 1)
    end_hist_date = date(2040, 1, 1)
    max_econ_life_date = date(2045, 1, 1)

    response = apply_min_cut_off(
        real_cut_off,
        t_real_cut_off,
        unecon_bool,
        min_cut_off,
        fpd,
        as_of_date,
        end_hist_date,
        max_econ_life_date,
    )
    expected_response = (date(2040, 1, 1), 240, False)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_first_negative_with_tolerance_econ():
    cf = np.array([0, 0, 0, 0, 0, -10, -5, -3, 0, 0, 0])
    tolerance = 2

    response = get_first_negative_with_tolerance(cf, tolerance)

    expected_response = 4, False, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_first_negative_with_tolerance_unecon():
    cf = np.array([-10, -8, -6, 0, 0, 0])
    tolerance = 2

    response = get_first_negative_with_tolerance(cf, tolerance)

    expected_response = 0, True, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_first_negative_with_tolerance_greater_than_cf_length():
    cf = np.array([-10, -8, -6, 0, 0, 0])
    tolerance = 8

    response = get_first_negative_with_tolerance(cf, tolerance)

    expected_response = 5, False, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_first_negative_with_no_tolerance():
    cf = np.array([0, 0, -10, 0])
    tolerance = 0

    response = get_first_negative_with_tolerance(cf, tolerance)

    expected_response = 1, False, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cutoff_date_key(mocker):
    mocker.patch(PATH_TO_MODULE + "apply_date_cutoff", return_value=(1, 2))
    response = apply_cutoff(0, 0, 'date', 0, 0)
    expected_response = (1, 2)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cutoff_rate_key(mocker):
    mocker.patch(PATH_TO_MODULE + "apply_volume_cutoff", return_value=(3, 4))
    response = apply_cutoff(0, 0, 'oil_rate', 0, 0)
    expected_response = (3, 4)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cutoff_cf_key(mocker):
    mocker.patch(PATH_TO_MODULE + "apply_cf_cutoff", return_value=(5, 6))
    response = apply_cutoff({}, 0, 'first_negative_cash_flow', 0, 0)
    expected_response = (5, 6)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_if_cf_cutoff_unecon_1():
    '''
    this test case intended to check when as of date is prior to FPD and first capex date
    the cutoff is been calculated at as if date (before FPD), well should be uneconomic

    The critical input for this test is cut_off_index is 0

    note:
    1. FPD will have absolute index as 0
    2. cutoff cut_off_index is relative index based on position of cf_after_deduct
    '''

    cf_after_deduct = [0, 0, 0, -100, 0, 10, 10, 10]
    include_capex = 'yes'
    cut_off_index = 0
    econ_results = {
        'time': [-5, -4, -3, -2, -1, 0, 1, 2],
        'capex': {
            'capex_detail': [{
                'total': 100,
                'index': -2,
                'after_econ_limit': 'yes'
            }]
        },
    }
    discounted_capex_detail = None

    response = if_cf_cutoff_unecon(
        cf_after_deduct=cf_after_deduct,
        include_capex=include_capex,
        cut_off_index=cut_off_index,
        econ_results=econ_results,
        discounted_capex_detail=discounted_capex_detail,
    )

    expected_response = True

    np.testing.assert_equal(response, expected_response)


@pytest.mark.unittest
def test_if_cf_cutoff_unecon_2():
    '''
    this test case intended to check when well has large capex (appear after econ limit is selected as yes)
    after ECL that make the total CF negative, well should be uneconomic

    The critical input for this test is cut_off_index is 5, but the capex detail index is 3

    note:
    1. FPD will have absolute index as 0
    2. cutoff cut_off_index is relative index based on position of cf_after_deduct
    3. index in  econ_results['capex']['capex_detail'] is absolute index treat FPD index as 0
    '''

    cf_after_deduct = [0, 0, 0, 10, 10, 10, -100, 10, 10]
    include_capex = 'yes'
    cut_off_index = 5
    econ_results = {
        'time': [-3, -2, -1, 0, 1, 2, 3, 4, 5],
        'capex': {
            'capex_detail': [{
                'total': 100,
                'index': 3,
                'after_econ_limit': 'yes'
            }]
        },
    }
    discounted_capex_detail = None

    response = if_cf_cutoff_unecon(
        cf_after_deduct=cf_after_deduct,
        include_capex=include_capex,
        cut_off_index=cut_off_index,
        econ_results=econ_results,
        discounted_capex_detail=discounted_capex_detail,
    )

    expected_response = True

    np.testing.assert_equal(response, expected_response)


@pytest.mark.unittest
def test_if_cf_cutoff_unecon_negative_cf_sum():
    cf_after_deduct = [0, 0, 0, 10, -100, 10, -100, 10, 10]
    include_capex = 'yes'
    cut_off_index = 5
    econ_results = {
        'time': [-3, -2, -1, 0, 1, 2, 3, 4, 5],
        'capex': {
            'capex_detail': [{
                'total': 100,
                'index': 3,
                'after_econ_limit': 'yes'
            }]
        },
    }
    discounted_capex_detail = None

    response = if_cf_cutoff_unecon(
        cf_after_deduct=cf_after_deduct,
        include_capex=include_capex,
        cut_off_index=cut_off_index,
        econ_results=econ_results,
        discounted_capex_detail=discounted_capex_detail,
    )

    expected_response = True

    np.testing.assert_equal(response, expected_response)


@pytest.mark.unittest
def test_adjust_cutoff_unecon_cutoff():
    real_cut_off_date = date(2000, 1, 1)
    date_dict = {
        'cf_start_date': date(2010, 1, 1),
        'as_of_date': date(2011, 1, 1),
        'first_production_date': date(2010, 6, 1)
    }
    max_econ_life_date = date(2050, 1, 1)
    t_max_econ_life_date = 1000

    response = adjust_cutoff(real_cut_off_date, date_dict, max_econ_life_date, t_max_econ_life_date)
    expected_response = date(2011, 1, 1), 7

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_adjust_cutoff_after_max_life():
    real_cut_off_date = date(2020, 1, 1)
    date_dict = {
        'cf_start_date': date(2010, 1, 1),
        'as_of_date': date(2011, 1, 1),
        'first_production_date': date(2010, 6, 1),
        'cf_end_date': date(2015, 1, 1)
    }
    max_econ_life_date = date(2015, 1, 1)
    t_max_econ_life_date = 1000

    response = adjust_cutoff(real_cut_off_date, date_dict, max_econ_life_date, t_max_econ_life_date)
    expected_response = date(2015, 1, 1), 1000

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_last_positive_cashflow_no_positive():
    cashflow = np.array([-10, -11, -12, -13, -14])
    response = get_last_positive_cashflow(cashflow)
    expected_response = 0, True, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_last_positive_cashflow_last_postiive():
    cashflow = np.array([-10, -11, -12, -13, 14])
    response = get_last_positive_cashflow(cashflow)
    expected_response = 4, False, None

    assert not DeepDiff(response, expected_response, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_get_last_positive_cashflow_first_positive():
    cashflow = np.array([10, -11, -12, -13, -14])
    response = get_last_positive_cashflow(cashflow)
    expected_response = 0, False, None

    assert not DeepDiff(response, expected_response, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_get_last_positive_cashflow_no_negative():
    cashflow = np.array([10, 11, 12, 13, 14])
    response = get_last_positive_cashflow(cashflow)
    expected_response = 4, False, None

    assert not DeepDiff(response, expected_response, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_calculate_econ_results_group_volume(mocker):
    mocker.patch(PATH_TO_MODULE + 'econ_result_for_group_volume_cutoff', return_value=True)
    econ_calc_results = {}
    cut_off_key = 'oil_rate'

    response = calculate_econ_results(econ_calc_results, cut_off_key)
    expected_response = True

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_econ_results_group_cf(mocker):
    mocker.patch(PATH_TO_MODULE + 'econ_result_for_group_cf_cutoff', return_value=True)
    econ_calc_results = {}
    cut_off_key = 'first_negative_cash_flow'

    response = calculate_econ_results(econ_calc_results, cut_off_key)
    expected_response = True

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_econ_results_not_group():
    class MockWellInput:
        def simple_econ_result(self):
            return True

    econ_calc_results = MockWellInput()
    cut_off_key = 'oil_rate'

    response = calculate_econ_results(econ_calc_results, cut_off_key)
    expected_response = True

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_econ_results_for_adjusted_ownership(mocker):
    mocker.patch(PATH_TO_MODULE + 'get_gross_ownership', return_value='own')

    well_input = {'input'}
    well_result = {'ownership_params': 'params'}
    econ_calc_func = lambda x, y, feature_flags: (x, y, feature_flags)

    response = econ_results_for_adjusted_ownership(well_input, well_result, econ_calc_func)
    expected_response = (well_input, {**well_result, 'ownership_params': 'own'}, None)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_date_cutoff_date_key():
    cut_off_date = date(2000, 1, 1)
    fpd = date(1995, 1, 1)
    cut_off_model = {'date': cut_off_date}
    date_dict = {'first_production_date': fpd}

    response = apply_date_cutoff(cut_off_model, date_dict)
    expected_response = cut_off_date, 5 * 12

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_date_cutoff_years_from_as_of_key():
    fpd = date(1995, 1, 1)
    as_of_date = date(1996, 1, 1)
    cut_off_model = {'years_from_as_of': 10}
    date_dict = {'first_production_date': fpd, 'as_of_date': as_of_date}

    response = apply_date_cutoff(cut_off_model, date_dict)
    expected_response = date(2005, 12, 29), 131

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_date_cutoff_invalid_option():
    cut_off_model = {'INVALID': 10}
    date_dict = {}
    with pytest.raises(CutOffError):
        apply_date_cutoff(cut_off_model, date_dict)


@pytest.mark.unittest
def test_apply_volume_cutoff_daily(mocker):
    def check_daily_volume_not_empty(a, b, c, d, e):
        if len(a) == 0 or len(b) == 0:
            pytest.fail('Daily volumes are empty')
        return date(2030, 1, 1)

    mocker.patch(PATH_TO_MODULE + 'volume_cutoff_date', side_effect=check_daily_volume_not_empty)
    date_dict = {'first_production_date': date(2020, 1, 1)}
    cut_off_key = 'oil_rate'
    econ_results = {
        'py_date': date(2025, 1, 1),
        'volume': {
            'oil': {
                'well_head': [10]
            }
        },
        'daily_wh_volume': {
            'oil': {
                'value': [10],
                'index': [0]
            }
        }
    }
    cut_off_model = {'oil_rate': 0}

    response = apply_volume_cutoff(cut_off_model, cut_off_key, date_dict, econ_results)
    expected_response = date(2030, 1, 1), 10 * 12

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_volume_cutoff_no_daily(mocker):
    mocker.patch(PATH_TO_MODULE + 'volume_cutoff_date', return_value=date(2030, 1, 1))
    date_dict = {'first_production_date': date(2020, 1, 1)}
    cut_off_key = 'oil_rate'
    econ_results = {'py_date': date(2025, 1, 1), 'volume': {'oil': {'well_head': [10]}}}
    cut_off_model = {'oil_rate': 0}

    response = apply_volume_cutoff(cut_off_model, cut_off_key, date_dict, econ_results)
    expected_response = date(2030, 1, 1), 10 * 12

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cf_cutoff_max_cum_cash_flow(mocker):
    mocker.patch(PATH_TO_MODULE + 'max_cum_cf_cutoff_index', return_value=(0, False, []))
    mocker.patch(PATH_TO_MODULE + 'cf_after_expense_deduction', return_value=0)
    mocker.patch(PATH_TO_MODULE + 'calculate_real_cutoff_date', return_value=(date(2040, 1, 1), 20 * 12))
    well_input = {'date_dict': {'first_production_date': date(2020, 1, 1)}}
    cut_off_key = 'max_cum_cash_flow'
    econ_results = {'py_date': date(2020, 1, 1)}

    response = apply_cf_cutoff({}, cut_off_key, well_input, econ_results, econ_limit_delay=None)
    expected_response = (date(2040, 1, 1), 20 * 12)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cf_cutoff_first_negative_cash_flow(mocker):
    mocker.patch(PATH_TO_MODULE + 'get_first_negative_with_tolerance', return_value=(0, False, []))
    mocker.patch(PATH_TO_MODULE + 'cf_after_expense_deduction', return_value=0)
    mocker.patch(PATH_TO_MODULE + 'calculate_real_cutoff_date', return_value=(date(2040, 1, 1), 20 * 12))
    well_input = {'date_dict': {'first_production_date': date(2020, 1, 1)}}
    cut_off_key = 'first_negative_cash_flow'
    econ_results = {'py_date': date(2020, 1, 1)}

    response = apply_cf_cutoff({}, cut_off_key, well_input, econ_results, econ_limit_delay=None)
    expected_response = (date(2040, 1, 1), 20 * 12)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cf_cutoff_last_positive_cash_flow(mocker):
    mocker.patch(PATH_TO_MODULE + 'get_last_positive_cashflow', return_value=(0, False, []))
    mocker.patch(PATH_TO_MODULE + 'cf_after_expense_deduction', return_value=0)
    mocker.patch(PATH_TO_MODULE + 'calculate_real_cutoff_date', return_value=(date(2040, 1, 1), 20 * 12))
    well_input = {'date_dict': {'first_production_date': date(2020, 1, 1)}}
    cut_off_key = 'last_positive_cash_flow'
    econ_results = {'py_date': date(2020, 1, 1)}

    response = apply_cf_cutoff({}, cut_off_key, well_input, econ_results, econ_limit_delay=None)
    expected_response = (date(2040, 1, 1), 20 * 12)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_apply_cf_cutoff_invalid_key(mocker):
    mocker.patch(PATH_TO_MODULE + 'cf_after_expense_deduction', return_value=0)
    mocker.patch(PATH_TO_MODULE + 'calculate_real_cutoff_date', return_value=(date(2040, 1, 1), 20 * 12))
    well_input = {'date_dict': {'first_production_date': date(2020, 1, 1)}}
    cut_off_key = 'INVALID'
    econ_results = {'py_date': date(2020, 1, 1)}

    with pytest.raises(CutOffError):
        apply_cf_cutoff({}, cut_off_key, well_input, econ_results, econ_limit_delay=None)


@pytest.mark.unittest
def test_volume_cutoff_date_never_above_cutoff():
    daily_indicate_array = []
    daily_index = []
    this_wh = np.array([1, 2, 3, 4, 5])
    this_cut_off = 1
    dates = [date(2020, i, 1) for i in range(1, 6)]

    response = volume_cutoff_date(daily_indicate_array, daily_index, this_wh, this_cut_off, dates)
    expected_response = date(2019, 12, 31)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_volume_cutoff_date_always_above_cutoff():
    daily_indicate_array = []
    daily_index = []
    this_wh = np.array([100, 200, 300, 400, 500])
    this_cut_off = 1
    dates = [date(2020, i, 1) for i in range(1, 6)]

    response = volume_cutoff_date(daily_indicate_array, daily_index, this_wh, this_cut_off, dates)
    expected_response = date(2020, 5, 31)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_volume_cutoff_date_sometimes_below():
    daily_indicate_array = []
    daily_index = []
    this_wh = np.array([10, 200, 30, 400, 50])
    this_cut_off = 1
    dates = [date(2020, i, 1) for i in range(1, 6)]

    response = volume_cutoff_date(daily_indicate_array, daily_index, this_wh, this_cut_off, dates)
    expected_response = date(2020, 5, 31)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_real_cutoff_date_econ_limit_delay():
    cutoff_details = (5, False, {})
    econ_limit_delay = 2
    dates = [date(2000, i, 1) for i in range(1, 10)]
    cf_after_deduct = []
    include_capex = True
    econ_results = {}
    fpd = date(2000, 1, 1)

    response = calculate_real_cutoff_date(
        cutoff_details,
        econ_limit_delay,
        dates,
        cf_after_deduct,
        include_capex,
        econ_results,
        fpd,
    )
    expected_response = (date(2000, 8, 31), 7)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_real_cutoff_is_cf_cutoff_unecon(mocker):
    mocker.patch(PATH_TO_MODULE + 'if_cf_cutoff_unecon', return_value=True)
    cutoff_details = (5, False, {})
    econ_limit_delay = 0
    dates = [date(2000, i, 1) for i in range(1, 10)]
    cf_after_deduct = []
    include_capex = True
    econ_results = {}
    fpd = date(2000, 1, 1)

    response = calculate_real_cutoff_date(
        cutoff_details,
        econ_limit_delay,
        dates,
        cf_after_deduct,
        include_capex,
        econ_results,
        fpd,
    )
    expected_response = (date(1999, 12, 31), -1)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_calculate_real_cutoff_not_cf_cutoff_unecon(mocker):
    mocker.patch(PATH_TO_MODULE + 'if_cf_cutoff_unecon', return_value=False)
    cutoff_details = (5, False, {})
    econ_limit_delay = 0
    dates = [date(2000, i, 1) for i in range(1, 10)]
    cf_after_deduct = []
    include_capex = True
    econ_results = {}
    fpd = date(2000, 1, 1)

    response = calculate_real_cutoff_date(
        cutoff_details,
        econ_limit_delay,
        dates,
        cf_after_deduct,
        include_capex,
        econ_results,
        fpd,
    )
    expected_response = (date(2000, 6, 30), 5)

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cf_after_expense_deduction_exclude_capex_no_expense_effect():
    econ_results = {
        'bfit_cf': {
            'bfit_cf': np.array([500, 400, 300, 200, 100]),
            'capex': np.array([1000, 0, 0, 0, 0])
        },
        'expense': {
            'var_expense': [{
                'values': np.array([100, 85, 70, 50, 30]),
                'affect_econ_limit': 'yes',
            }],
            'fixed_expense': [],
            'water_expense': [],
            'ghg_expense': []
        }
    }

    include_capex = 'yes'

    response = cf_after_expense_deduction(include_capex, econ_results)
    expected_response = np.array([500., 400., 300., 200., 100.])

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cf_after_expense_deduction_include_capex_no_expense_effect():
    econ_results = {
        'bfit_cf': {
            'bfit_cf': np.array([500, 400, 300, 200, 100]),
            'capex': np.array([1000, 0, 0, 0, 0])
        },
        'expense': {
            'var_expense': [{
                'values': np.array([100, 85, 70, 50, 30]),
                'affect_econ_limit': 'yes',
            }],
            'fixed_expense': [],
            'water_expense': [],
            'ghg_expense': []
        }
    }

    include_capex = 'no'

    response = cf_after_expense_deduction(include_capex, econ_results)
    expected_response = np.array([1500., 400., 300., 200., 100.])

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cf_after_expense_deduction_exclude_capex_yes_expense_effect():
    econ_results = {
        'bfit_cf': {
            'bfit_cf': np.array([500, 400, 300, 200, 100]),
            'capex': np.array([1000, 0, 0, 0, 0])
        },
        'expense': {
            'var_expense': [{
                'values': np.array([100, 85, 70, 50, 30]),
                'affect_econ_limit': 'no',
            }],
            'fixed_expense': [],
            'water_expense': [],
            'ghg_expense': []
        }
    }

    include_capex = 'yes'

    response = cf_after_expense_deduction(include_capex, econ_results)
    expected_response = np.array([600., 485., 370., 250., 130.])

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_cut_off_key_valid():
    cut_off_model = {'first_negative_cash_flow': True}

    response = get_cut_off_key(cut_off_model)
    expected_response = 'first_negative_cash_flow'

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_get_cut_off_key_invalid():
    cut_off_model = {'INVALID': True}

    with pytest.raises(CutOffError):
        get_cut_off_key(cut_off_model)


@pytest.mark.unittest
def test_max_cum_cf_cutoff_index_with_cutoff_discount_exclude_capex(mocker):
    mocker.patch(PATH_TO_MODULE + 'get_cum_days',
                 return_value=(
                     np.array([True, True, True, True, True]),
                     np.array([2, 30, 61, 91, 122]),
                 ))

    mocker.patch(PATH_TO_MODULE + 'phdwin_discount', return_value=np.array([.9, .8, .7, .6, .5]))

    mocker.patch(PATH_TO_MODULE + 'get_num_period', return_value=12)

    cut_off_discount = 90
    well_input = {
        'date_dict': {
            'discount_date': date(2020, 1, 1)
        },
        'general_option_model': {
            'discount_table': {
                'discount_method': 'monthly',
                'cash_accrual_time': 'end_month',
                'first_discount': 80,
                'second_discount': 60,
                'rows': [{
                    'discount_table': 100
                }]
            }
        }
    }
    dates = [date(2000, i, 1) for i in range(1, 6)]
    include_capex = 'no'
    econ_results = {'capex': {}}
    cf_after_deduct = np.array([100, 50, 40, -30, 15])
    response = max_cum_cf_cutoff_index(cut_off_discount, well_input, dates, include_capex, econ_results,
                                       cf_after_deduct)
    expected_response = (2, False, None)

    assert not DeepDiff(response, expected_response, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_max_cum_cf_cutoff_index_with_cutoff_discount_include_capex(mocker):
    mocker.patch(PATH_TO_MODULE + 'get_cum_days',
                 return_value=(
                     np.array([True, True, True, True, True]),
                     np.array([2, 30, 61, 91, 122]),
                 ))

    mocker.patch(PATH_TO_MODULE + 'phdwin_discount', return_value=np.array([.9, .8, .7, .6, .5]))

    mocker.patch(PATH_TO_MODULE + 'get_num_period', return_value=12)
    mocker.patch(PATH_TO_MODULE + 'get_discounted_capex', return_value=(np.array([30, 0, 0, 0, 0]), {}))

    cut_off_discount = 90
    well_input = {
        'date_dict': {
            'discount_date': date(2020, 1, 1)
        },
        'general_option_model': {
            'discount_table': {
                'discount_method': 'monthly',
                'cash_accrual_time': 'end_month',
                'first_discount': 80,
                'second_discount': 60,
                'rows': [{
                    'discount_table': 100
                }]
            }
        }
    }
    dates = [date(2000, i, 1) for i in range(1, 6)]
    include_capex = 'yes'
    econ_results = {'capex': {'capex_detail': [], 'total_capex': np.array([30, 0, 0, 0, 0]), 'time': []}}
    cf_after_deduct = np.array([100, 50, 40, -30, 15])
    response = max_cum_cf_cutoff_index(cut_off_discount, well_input, dates, include_capex, econ_results,
                                       cf_after_deduct)
    expected_response = (2, False, {})

    assert not DeepDiff(response, expected_response, ignore_numeric_type_changes=True)


@pytest.mark.unittest
def test_cutoff_results_as_of_fpd_later_than_max_econ():
    econ_calc_func = 0
    well_input = {
        'date_dict': {
            'first_production_date': date(2020, 1, 1),
            'as_of_date': date(2021, 1, 1),
            'end_history_date': date(2045, 1, 1),
            'cf_end_date': date(2000, 1, 1)
        },
        'cut_off_model': {}
    }
    well_result = {}
    response = cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=False)
    expected_response = date(2021, 1, 1), True

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cutoff_results_as_of_fpd_later_than_max_econ_return_cutoff_well_result():
    econ_calc_func = 0
    well_input = {
        'date_dict': {
            'first_production_date': date(2020, 1, 1),
            'as_of_date': date(2021, 1, 1),
            'end_history_date': date(2045, 1, 1),
            'cf_end_date': date(2000, 1, 1)
        },
        'cut_off_model': {}
    }
    well_result = {}
    response = cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=True)
    expected_response = date(2021, 1, 1), True, None

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cutoff_results_no_cutoff(mocker):
    def apply_min_cut_off(*args):
        return args[:3]

    mocker.patch(PATH_TO_MODULE + 'get_cut_off_key', return_value='no_cut_off')
    mocker.patch(PATH_TO_MODULE + 'econ_results_for_adjusted_ownership', return_value={})
    mocker.patch(PATH_TO_MODULE + 'calculate_econ_results', return_value={})
    mocker.patch(PATH_TO_MODULE + 'apply_min_cut_off', side_effect=apply_min_cut_off)

    econ_calc_func = 0
    well_input = {
        'date_dict': {
            'cf_start_date': date(2022, 1, 1),
            'first_production_date': date(2020, 1, 1),
            'as_of_date': date(2021, 1, 1),
            'end_history_date': date(2045, 1, 1),
            'cf_end_date': date(2050, 1, 1)
        },
        'cut_off_model': {}
    }
    well_result = {}
    response = cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=True)
    expected_response = date(2050, 1, 1), False, {}

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cutoff_results_trigger_adjust_cutoff_with_econ_after_apply_cutoff(mocker):
    def apply_min_cut_off(*args):
        return args[:3]

    mocker.patch(PATH_TO_MODULE + 'get_cut_off_key', return_value='cut_off')
    mocker.patch(PATH_TO_MODULE + 'apply_cutoff', return_value=(date(2020, 1, 1), -12))
    mocker.patch(PATH_TO_MODULE + 'adjust_cutoff', return_value=(date(2021, 1, 1), 0))
    mocker.patch(PATH_TO_MODULE + 'econ_results_for_adjusted_ownership', return_value={})
    mocker.patch(PATH_TO_MODULE + 'calculate_econ_results', return_value={})
    mocker.patch(PATH_TO_MODULE + 'apply_min_cut_off', side_effect=apply_min_cut_off)

    econ_calc_func = 0
    well_input = {
        'date_dict': {
            'cf_start_date': date(2022, 1, 1),
            'first_production_date': date(2020, 1, 1),
            'as_of_date': date(2021, 1, 1),
            'end_history_date': date(2045, 1, 1),
            'cf_end_date': date(2050, 1, 1)
        },
        'cut_off_model': {}
    }
    well_result = {}
    response = cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=True)
    expected_response = date(2021, 1, 1), True, {}

    assert not DeepDiff(response, expected_response)


@pytest.mark.unittest
def test_cutoff_results_no_cutoff_well_result(mocker):
    def apply_min_cut_off(*args):
        return args[:3]

    mocker.patch(PATH_TO_MODULE + 'get_cut_off_key', return_value='cut_off')
    mocker.patch(PATH_TO_MODULE + 'apply_cutoff', return_value=(date(2030, 1, 1), 9 * 12))
    mocker.patch(PATH_TO_MODULE + 'econ_results_for_adjusted_ownership', return_value={})
    mocker.patch(PATH_TO_MODULE + 'calculate_econ_results', return_value={})
    mocker.patch(PATH_TO_MODULE + 'apply_min_cut_off', side_effect=apply_min_cut_off)

    econ_calc_func = 0
    well_input = {
        'date_dict': {
            'cf_start_date': date(2022, 1, 1),
            'first_production_date': date(2020, 1, 1),
            'as_of_date': date(2021, 1, 1),
            'end_history_date': date(2045, 1, 1),
            'cf_end_date': date(2050, 1, 1)
        },
        'cut_off_model': {}
    }
    well_result = {}
    response = cutoff_results(econ_calc_func, well_input, well_result, return_cutoff_well_result=False)
    expected_response = date(2030, 1, 1), False

    assert not DeepDiff(response, expected_response)
