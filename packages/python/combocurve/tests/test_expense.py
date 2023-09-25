from combocurve.science.econ.econ_calculations.expense import (
    Expense,
    FixedExpense,
    VariableExpense,
    CarbonExpense,
    WaterDisposalExpense,
)
import numpy as np
import datetime
import pytest
from copy import deepcopy

params_FixedExpense = [('', 1), ('3', 1), ('', None)]
params_Expense = ['oil', 'gas', 'ngl', 'drip_condensate', 'total']
params_WaterDisposalExpense = [(1, 'pct_of_gas_rev', '', True), ('', 'dollar_per_bbl', 3, True),
                               (None, 'dollar_per_bbl', '', True), (1, 'pct_of_gas_rev', '', False)]
params_VariableExpense = [
    ('oil', 'gathering', 1, 'pct_of_gas_rev', '', 'shrunk'),
    ('oil', 'processing', '', 'dollar_per_bbl', '', 'shrunk'),
    ('oil', 'transportation', None, 'dollar_per_mmbtu', 3, 'unshrunk'),
    ('oil', 'marketing', 1, 'pct_of_gas_rev', 3, 'unshrunk'),
    ('oil', 'other', 1, 'pct_of_gas_rev', 3, 'unshrunk'),
    ('gas', 'gathering', 1, 'pct_of_gas_rev', '', 'shrunk'),
    ('gas', 'processing', '', 'dollar_per_bbl', '', 'shrunk'),
    ('gas', 'transportation', None, 'dollar_per_mmbtu', '', 'unshrunk'),
    ('gas', 'marketing', 1, 'pct_of_gas_rev', 4, 'unshrunk'),
    ('gas', 'other', 1, 'pct_of_gas_rev', 4, 'unshrunk'),
    ('gas', 'other', 1, 'dollar_per_mmbtu', 4, 'shrunk'),
    ('ngl', 'gathering', 1, 'pct_of_gas_rev', '', 'shrunk'),
    ('ngl', 'processing', '', 'dollar_per_bbl', '', 'shrunk'),
    ('ngl', 'transportation', None, 'dollar_per_mmbtu', '', 'unshrunk'),
    ('ngl', 'marketing', 1, 'pct_of_gas_rev', 5, 'unshrunk'),
    ('ngl', 'other', 1, 'pct_of_gas_rev', 5, 'unshrunk'),
    ('drip_condensate', 'gathering', 1, 'pct_of_gas_rev', '', 'shrunk'),
    ('drip_condensate', 'processing', '', 'dollar_per_bbl', '', 'shrunk'),
    ('drip_condensate', 'transportation', None, 'dollar_per_mmbtu', '', 'unshrunk'),
    ('drip_condensate', 'marketing', 1, 'pct_of_gas_rev', 5, 'unshrunk'),
    ('drip_condensate', 'other', 1, 'pct_of_gas_rev', 5, 'unshrunk'),
    ('other', 'other', 1, 'dollar_per_bbl', 5, 'unshrunk'),
]
params_CarbonExpense = [('co2e', 1, ''), ('co2', None, 3), ('ch4', '', 4), ('n2o', 1, 5), ('category', 1, 5),
                        ('dates', 1, 5)]


def assert_handler(response, expected_response, error_msg):
    assert len(response) == len(expected_response), error_msg + 'response length dont match'

    if not expected_response:
        assert response == [], error_msg
        return

    for key in expected_response[0].keys():
        if key != 'values':
            assert response[0].get(key) == expected_response[0].get(key), error_msg + f'response dont match at {key}'
        else:
            np.testing.assert_almost_equal(
                actual=response[0]['values'],
                desired=expected_response[0]['values'],
                err_msg=error_msg + f'response dont match at {key}',
            )


@pytest.fixture
def general_expense_conditions():
    return {
        'escalation_model': None,
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'type_model': 'original',
    }


@pytest.fixture
def date_dict():
    return {
        'first_production_date': datetime.date(2014, 1, 1),
        'cut_off_date': datetime.date(2014, 2, 28),
        'cf_start_date': datetime.date(2014, 1, 1),
        'cf_end_date': datetime.date(2014, 2, 28),
    }


@pytest.fixture
def FixedExpense_io(general_expense_conditions):
    ownership_dict_by_phase = {'original': {general_expense_conditions['calculation']: np.array([1, 1])}}
    fixed_expense_model = [{
        'monthly_well_cost': {
            **general_expense_conditions,
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense_per_well': 1,
                'entire_well_life': 'Flat'
            }],
        },
        'type_model': 'original',
    }]
    well_count = {
        'gross_well_count': np.array([2, 1]),
        'wi_well_count': np.array([2, 1]),
        'nri_well_count': np.array([2, 1]),
    }
    other_monthly_cost_template = deepcopy(fixed_expense_model[0]['monthly_well_cost'])
    for i in np.arange(1, 9):
        fixed_expense_model[0][f'other_monthly_cost_{i}'] = other_monthly_cost_template
        fixed_expense_model[0][f'other_monthly_cost_{i}']['rows'][0]['fixed_expense'] = 0

    t_all = np.array([0, 1])

    expected_response = [{
        'category': 'monthly_well_cost',
        'values': np.array([2., 1.]),
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
    }]

    return fixed_expense_model, ownership_dict_by_phase, t_all, well_count, expected_response


@pytest.fixture
def Expense_io(general_expense_conditions):
    exp_param = np.array([1, 1])
    deal_term = 2
    revenue_dict = {}
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        revenue_dict[phase] = {'ownership': {general_expense_conditions['calculation']: np.array([100, 200])}}
    expected_response = np.array([2, 4])
    return exp_param, revenue_dict, general_expense_conditions['calculation'], deal_term, expected_response


@pytest.fixture
def WaterDisposalExpense_io(general_expense_conditions):
    ownership_type = general_expense_conditions['calculation']
    ownership_volume_dict = {'sales': {'time': np.array([0, 1]), 'water': {ownership_type: np.array([100, 200])}}}

    revenue_dict = {}
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        revenue_dict[phase] = {'ownership': {ownership_type: np.array([100, 200])}}

    expected_response = [{
        'values': np.array([1., 2.]),
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no'
    }]
    return ownership_volume_dict, revenue_dict, expected_response


@pytest.fixture
def VariableExpense_io(general_expense_conditions):
    ownership_type = general_expense_conditions['calculation']
    ownership_volume_dict = {'unshrunk': {}, 'sales': {}}
    revenue_dict = {}
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        revenue_dict[phase] = {'ownership': {ownership_type: np.array([100, 200])}}
        for key in ownership_volume_dict.keys():
            ownership_volume_dict[key].update({phase: {ownership_type: np.array([100, 200])}})
    ownership_volume_dict.update({'boe': {'sales_boe': {f'boe_{ownership_type}': np.array([100, 200])}}})
    btu_content_dict = {'unshrunk_gas': 2.0, 'shrunk_gas': 2.0}

    expected_response = [{
        'values': np.array([1., 2.]),
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no'
    }]

    return ownership_volume_dict, btu_content_dict, revenue_dict, expected_response


@pytest.fixture
def CarbonExpense_io(general_expense_conditions):
    ghg_params = {
        **general_expense_conditions,
        'rows': [{
            'carbon_expense': 1,
            'entire_well_life': 'Flat'
        }],
    }
    ghg_mass_dict = {general_expense_conditions['calculation']: np.array([100, 200])}

    expected_response = [{
        'values': np.array([100, 200]),
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no'
    }]
    return ghg_params, ghg_mass_dict, expected_response


@pytest.mark.unittest
@pytest.mark.parametrize('cap, deal_terms', params_FixedExpense)
def test_FixedExpense(cap, deal_terms, FixedExpense_io, date_dict):

    fixed_expense_model, ownership_dict_by_phase, t_all, well_count, expected_response = FixedExpense_io
    fixed_expense_model[0]['monthly_well_cost'].update({'cap': cap, 'deal_terms': deal_terms})

    response = FixedExpense(date_dict, None, fixed_expense_model).result(None, ownership_dict_by_phase, t_all,
                                                                         well_count)['fixed_expenses']

    # drop other_monthly_costs since they are all zero
    response = list(filter(lambda item: 'other_monthly_cost' not in item.get('category', ''), response))

    assert_handler(response, expected_response, f'{test_FixedExpense.__name__}: ')


@pytest.mark.unittest
@pytest.mark.parametrize('phase', params_Expense)
def test_Expense(phase, Expense_io):
    exp_param, revenue_dict, ownership, deal_term, expected_response = Expense_io
    unit = f'pct_of_{phase}_rev'
    if unit == 'pct_of_total_rev':
        expected_response *= 4
    response = Expense()._pct_of_rev(exp_param, unit, revenue_dict, ownership, deal_term)
    np.testing.assert_almost_equal(response, expected_response, err_msg=f'{test_Expense.__name__}: unit = {unit}')


@pytest.mark.unittest
@pytest.mark.parametrize('deal_terms, unit, cap, is_water_exist', params_WaterDisposalExpense)
def test_WaterDisposalExpense(deal_terms, unit, cap, is_water_exist, WaterDisposalExpense_io,
                              general_expense_conditions, date_dict):
    ownership_volume_dict, revenue_dict, expected_response = WaterDisposalExpense_io

    disposal_expense_model = [{
        **general_expense_conditions,
        'deal_terms': deal_terms,
        'cap': cap,
        'rows': [{
            unit: 1,
            'entire_well_life': 'Flat'
        }],
    }]
    if unit == 'dollar_per_bbl':
        expected_response[0]['values'] *= 100
    if not is_water_exist:
        ownership_volume_dict['sales'].pop('water')
        expected_response[0]['values'] = np.array([0, 0])

    response = WaterDisposalExpense(date_dict, disposal_expense_model).result(ownership_volume_dict,
                                                                              revenue_dict)['water_disposal']

    assert_handler(response, expected_response, f'{test_WaterDisposalExpense.__name__}: ')


@pytest.mark.unittest
@pytest.mark.parametrize('phase, category, deal_terms, unit, cap, shrinkage', params_VariableExpense)
def test_VariableExpense(phase, category, deal_terms, unit, cap, shrinkage, VariableExpense_io,
                         general_expense_conditions, date_dict):
    ownership_volume, btu_content, revenue_dict, expected_response = VariableExpense_io
    variable_exp_params = [{
        phase: {
            category: {
                **general_expense_conditions,
                'shrinkage_condition': shrinkage,
                'cap': cap,
                'deal_terms': deal_terms,
                'rows': [{
                    unit: 1,
                    'entire_well_life': 'Flat'
                }],
            }
        },
        'type_model': 'original',
    }]
    expected_response[0].update({'key': phase, 'category': category})
    if unit == 'dollar_per_bbl' or unit == 'dollar_per_mmbtu':
        expected_response[0]['values'] *= 100
        if phase == 'gas' and unit == 'dollar_per_mmbtu':
            expected_response[0]['values'] *= 2

    response = VariableExpense(date_dict, btu_content, variable_exp_params).result(ownership_volume,
                                                                                   revenue_dict)['variable_expenses']
    # get expense for the phase and category
    response = list(filter(lambda item: item['key'] == phase and item['category'] == category, response))

    assert_handler(response, expected_response, f'{test_VariableExpense.__name__}: ')


@pytest.mark.unittest
@pytest.mark.parametrize('phase, deal_terms, cap', params_CarbonExpense)
def test_CarbonExpense(phase, deal_terms, cap, CarbonExpense_io, date_dict):
    ghg_params, ghg_mass_dict, expected_response = CarbonExpense_io

    ghg_expense_model = [{
        'category': phase,
        phase: {
            **ghg_params,
            'deal_terms': deal_terms,
            'cap': cap,
        }
    }]

    ghg_mass_dict = {phase: ghg_mass_dict}
    expected_response[0].update({'category': phase})
    if phase in {'category', 'dates'}:
        expected_response = []

    response = CarbonExpense(date_dict, ghg_expense_model).result(ghg_mass_dict)['carbon_expenses']

    # get the result for phase
    response = list(filter(lambda item: item['category'] == phase, response))

    assert_handler(response, expected_response, f'{test_CarbonExpense.__name__}: ')
