import copy
import numpy as np
from combocurve.science.econ.econ_calculations.reversion import get_initial_ownership_params
from combocurve.science.econ.econ_input.well_input import WellInput
from copy import deepcopy

OIL_BREAKEVEN_UNIT = '$/BBL'


def breakeven_results(simple_economics, well_input: WellInput, unecon_bool):
    breakeven_dict, breakeven_unit_dict = {}, {}
    breakeven_col_dicts = [
        column_dict for column_dict in well_input.columns if column_dict['key'] in ['oil_breakeven', 'gas_breakeven']
    ]
    for breakeven_col in breakeven_col_dicts:
        one_liner_selection = breakeven_col['selected_options']['one_liner']
        if one_liner_selection is False:
            continue
        breakeven_key = breakeven_col['key']
        if well_input.incremental_index > 0 or unecon_bool:
            # not calculating breakeven for incremental case or unecon case
            breakeven = None
            price_unit = None
        else:
            phase_key = breakeven_key.replace('_breakeven', '')
            breakeven, price_unit = calculate_phase_breakeven(simple_economics, copy.deepcopy(well_input), phase_key)

        breakeven_dict[breakeven_key] = breakeven
        breakeven_unit_dict[breakeven_key] = price_unit

    return breakeven_dict, breakeven_unit_dict


def calculate_phase_breakeven(simple_economics, well_input: WellInput, phase_key):
    ownership_model = well_input.ownership_model['ownership']
    breakeven_model = well_input.breakeven_model
    initial_ownership_model = ownership_model['initial_ownership']
    breakeven_disc_rate = breakeven_model['npv_discount']
    based_on_price_ratio = breakeven_model['based_on_price_ratio']
    oil_gas_price_ratio = breakeven_model.get('price_ratio') if based_on_price_ratio == 'yes' else None

    # compute original ownership
    ownership_params, t_ownership = get_initial_ownership_params(initial_ownership_model, well_input.date_dict)
    well_result_params = {
        'ownership_params': ownership_params,
        't_ownership': t_ownership,
        'rev_dates_detail': []  # don't need reversion details
    }

    # set econ assumption to satisfy break even criteria
    # discount table
    well_input.general_option_model['discount_table']['first_discount'] = breakeven_disc_rate
    disc_key = 'disc_cf_1'

    gas_price_unit, breakeven_price, pricing_models = setup_pricing_model_for_economics(
        phase_key, well_input.pricing_model, based_on_price_ratio, oil_gas_price_ratio)

    breakeven_total_bfit = []
    for model in pricing_models:
        well_input.pricing_model = model
        breakeven_log = simple_economics(well_input, well_result_params).simple_econ_result()
        breakeven_total_bfit.append(sum(breakeven_log['bfit_disc']['detail_cf'][disc_key]))

    return (calculate_proportion(breakeven_price, breakeven_total_bfit),
            change_unit_for_gas(gas_price_unit) if phase_key == 'gas' else OIL_BREAKEVEN_UNIT)


def setup_pricing_model_for_economics(phase_key, pricing_model, based_on_price_ratio, oil_gas_price_ratio):
    # gas price unit
    gas_price_unit = list(
        set(pricing_model['gas']['rows'][0].keys()).intersection({'dollar_per_mcf', 'dollar_per_mmbtu'}))[0]

    pricing_models = [deepcopy(pricing_model), deepcopy(pricing_model)]

    # breakeven
    breakeven_price = [10, 60] if phase_key == 'oil' else [0, 5]
    for idx in range(len(breakeven_price)):
        pricing_models[idx][phase_key] = phase_pricing_model_dictionary(phase_key, gas_price_unit, breakeven_price[idx])
        if based_on_price_ratio == 'yes':
            other_phase_key = 'oil' if phase_key == 'gas' else 'gas'
            pricing_models[idx][other_phase_key] = phase_pricing_model_dictionary(other_phase_key, gas_price_unit,
                                                                                  breakeven_price[idx],
                                                                                  oil_gas_price_ratio)

    return gas_price_unit, breakeven_price, pricing_models


def phase_pricing_model_dictionary(phase_key, gas_price_unit, price, oil_gas_price_ratio=1):
    '''
    if oil_gas_price_ratio is passed in, the price is the price of the other phase
    the oil_gas_price_ratio is oil price / gas price
    for example, if phase_key = 'gas', the input price is oil price,
    the calculation should be price / oil_gas_price_ratio to get the gas price
    '''
    return {
        'cap':
        '',
        'escalation_model':
        'none',
        'rows': [{
            gas_price_unit if phase_key == 'gas' else 'price':
            price / oil_gas_price_ratio if phase_key == 'gas' else price * oil_gas_price_ratio,
            'entire_well_life':
            'Entire Well Life'
        }]
    }


def calculate_proportion(breakeven_price, breakeven_total_bfit):
    x1, x2 = breakeven_price
    y1, y2 = breakeven_total_bfit
    if y1 == y2:
        return None
    return np.round((x2 * y1 - x1 * y2) / (y1 - y2), 2)


def change_unit_for_gas(unit):
    if unit == 'dollar_per_mmbtu':
        return '$/MMBTU'
    elif unit == 'dollar_per_mcf':
        return '$/MCF'
    raise Exception('This gas unit is not possible')
