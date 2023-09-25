'''
from combocurve.science.econ.pre_process import PreProcess
import numpy as np
import pytest
import datetime


@pytest.mark.unittest
def test_depreciation_pre_base():
    this_depre_para_yearly = {
        'rows': [{
            'years': 1,
            'tan_factor': 50,
            'intan_factor': 60
        }, {
            'years': 2,
            'tan_factor': 40,
            'intan_factor': 20
        }, {
            'years': 1,
            'tan_factor': 10,
            'intan_factor': 20
        }]
    }

    response = PreProcess.depreciation_pre(this_depre_para_yearly=this_depre_para_yearly, remaining_months=4)

    expected_response = (np.array([.5 / 4] * 4 + [.4 / 12] * 12 + [.1 / 6] * 6),
                         np.array([.6 / 4] * 4 + [.2 / 12] * 12 + [.2 / 6] * 6))

    np.testing.assert_array_almost_equal(response[0], expected_response[0])
    np.testing.assert_array_almost_equal(response[1], expected_response[1])


@pytest.mark.unittest
def test_depletion_pre_helper_uop_major():
    ownership_volume_dict = {
        'well_head': {
            'oil': {
                '100_pct_wi': np.array([15, 10, 5, 3])
            },
            'gas': {
                '100_pct_wi': np.array([100, 20, 10, 5])
            }
        },
        'boe': {
            'well_head_boe': {
                'total': np.array([20, 15, 10, 7])
            }
        }
    }

    unadjusted_wh_volume = {'oil': np.array([15, 10, 5, 3]), 'gas': np.array([100, 20, 10, 5])}

    class WellInput(object):
        primary_product = 'oil'
        date_dict = {'cut_off_date': datetime.date(2016, 4, 1), 'first_production_date': datetime.date(2016, 1, 1)}

    response = PreProcess.depletion_pre_helper(depletion_model='unit_of_production_major',
                                               well_input=WellInput(),
                                               ownership_volume_dict=ownership_volume_dict,
                                               volume_t=np.array([0, 1, 2, 3]),
                                               capex_t=0,
                                               unadjusted_wh_volume=unadjusted_wh_volume)

    expected_response = np.array([15 / 33, 10 / 33, 5 / 33, 3 / 33])

    np.testing.assert_almost_equal(response, expected_response)


@pytest.mark.unittest
def test_depletion_pre_helper_ecl():
    ownership_volume_dict = {
        'well_head': {
            'oil': {
                '100_pct_wi': np.array([15, 10, 5, 3])
            },
            'gas': {
                '100_pct_wi': np.array([100, 20, 10, 5])
            }
        },
        'boe': {
            'well_head_boe': {
                'total': np.array([20, 15, 10, 7])
            }
        }
    }

    unadjusted_wh_volume = {'oil': np.array([15, 10, 5, 3]), 'gas': np.array([100, 20, 10, 5])}

    class WellInput(object):
        primary_product = 'oil'
        date_dict = {'cut_off_date': datetime.date(2016, 4, 1), 'first_production_date': datetime.date(2016, 1, 1)}

    response = PreProcess.depletion_pre_helper(depletion_model='ecl',
                                               well_input=WellInput(),
                                               ownership_volume_dict=ownership_volume_dict,
                                               volume_t=np.array([0, 1, 2, 3]),
                                               capex_t=0,
                                               unadjusted_wh_volume=unadjusted_wh_volume)

    expected_response = np.array([0, 0, 0, 1])

    np.testing.assert_almost_equal(response, expected_response)


@pytest.mark.unittest
def test_depletion_pre_helper_fpd():
    ownership_volume_dict = {
        'well_head': {
            'oil': {
                '100_pct_wi': np.array([15, 10, 5, 3])
            },
            'gas': {
                '100_pct_wi': np.array([100, 20, 10, 5])
            }
        },
        'boe': {
            'well_head_boe': {
                'total': np.array([20, 15, 10, 7])
            }
        }
    }

    unadjusted_wh_volume = {'oil': np.array([15, 10, 5, 3]), 'gas': np.array([100, 20, 10, 5])}

    class WellInput(object):
        primary_product = 'oil'
        date_dict = {'cut_off_date': datetime.date(2016, 4, 1), 'first_production_date': datetime.date(2016, 1, 1)}

    response = PreProcess.depletion_pre_helper(depletion_model='fpd',
                                               well_input=WellInput(),
                                               ownership_volume_dict=ownership_volume_dict,
                                               volume_t=np.array([0, 1, 2, 3]),
                                               capex_t=0,
                                               unadjusted_wh_volume=unadjusted_wh_volume)
    expected_response = np.array([1, 0, 0, 0])
    np.testing.assert_almost_equal(response, expected_response)


@pytest.mark.unittest
def test_depletion_pre_helper_never():
    ownership_volume_dict = {
        'well_head': {
            'oil': {
                '100_pct_wi': np.array([15, 10, 5, 3])
            },
            'gas': {
                '100_pct_wi': np.array([100, 20, 10, 5])
            }
        },
        'boe': {
            'well_head_boe': {
                'total': np.array([20, 15, 10, 7])
            }
        }
    }

    unadjusted_wh_volume = {'oil': np.array([15, 10, 5, 3]), 'gas': np.array([100, 20, 10, 5])}

    class WellInput(object):
        primary_product = 'oil'
        date_dict = {'cut_off_date': datetime.date(2016, 4, 1), 'first_production_date': datetime.date(2016, 1, 1)}

    response = PreProcess.depletion_pre_helper(depletion_model='never',
                                               well_input=WellInput(),
                                               ownership_volume_dict=ownership_volume_dict,
                                               volume_t=np.array([0, 1, 2, 3]),
                                               capex_t=0,
                                               unadjusted_wh_volume=unadjusted_wh_volume)

    expected_response = np.array([0, 0, 0, 0])
    np.testing.assert_almost_equal(response, expected_response)
'''
