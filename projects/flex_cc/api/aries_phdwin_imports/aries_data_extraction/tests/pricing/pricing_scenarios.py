"""Describes the scenarios for get_price_differential_model_name function following the structure (input, output)
input: dict -> {'assumptionKey': str}
output: str
"""
from typing import Union

from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
from api.aries_phdwin_imports.aries_data_extraction.dataclasses.pricing import PriceConditionals, PricingValues
from api.aries_phdwin_imports.aries_import_helpers import DEFAULT_PRICE_OBJ
from api.aries_phdwin_imports.helpers import create_default_escalation_obj

PROPNUM = 'KCAKOBFMHJ'

KEYWORD_LS = [
    'PRI/OIL',
    'PAD/OIL',
    'PAJ/OIL',
    # Gas
    'PRI/GAS',
    'PAD/GAS',
    'PAJ/GAS',
    # Condensate
    'PRI/CND',
    'PAJ/CND',
    'PAD/CND',
    # NGL
    'PRI/NGL',
    'PAJ/NGL',
    'PAD/NGL'
]

USE_FPD_LS = [True, False]
USE_ASOF_LS = [True, False]

START_DATE = '02/2023'
"""Describes the scenarios for get_price_differential_model_name function following the structure (input, output)
input: dict
output: str
"""
GET_PRICE_DIFFERENTIAL_MODEL_NAME_SCENARIOS = [({
    'assumptionKey': 'differentials'
}, 'differentials'), ({
    'assumptionKey': 'pricing'
}, 'price_model'), ({
    'assumptionKey': 'random'
}, None)]
"""Describes the scenarios for get_shift_month_year_multiplier function following the structure (input, output)
input: str
output: dict -> {'shift_month': int, 'shift_year': int, 'multiplier': int}
"""
GET_SHIFT_MONTH_YEAR_MLTP_SCENARIOS = [('#', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1
}), ('#/M', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1
}), ('#M', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1
}), ('#/Y', {
    'shift_month': 0,
    'shift_year': 1,
    'multiplier': 1
}), ('#Y', {
    'shift_month': 0,
    'shift_year': 1,
    'multiplier': 1
}), ('M#', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1000
}), ('M#/M', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1000
}), ('M#M', {
    'shift_month': 1,
    'shift_year': 0,
    'multiplier': 1000
}), ('M#/Y', {
    'shift_month': 0,
    'shift_year': 1,
    'multiplier': 1000
}), ('M#Y', {
    'shift_month': 0,
    'shift_year': 1,
    'multiplier': 1000
}), ('random_expression', {
    'shift_month': 0,
    'shift_year': 1,
    'multiplier': 1000
})]
"""Describes the scenarios for update_price_based_on_key function following the structure (input, output)
input: tuple -> (price_obj: dict, keyword: str, use_btu_ bool)
output: dict -> The result object after updating.
"""
UPDATE_PRICE_BASED_ON_KEY_SCENARIOS = [(({
    'dollar_per_bbl': 1000
}, 'PRI/OIL', False), {
    'price': 1000
}), (({
    'dollar_per_mcf': 2500
}, 'PAJ/GAS', True), {
    'dollar_per_mmbtu': 2500
}), (({
    'random_key': 1000
}, 'RANDOM_KEY', False), {
    'random_key': 1000
}), (({
    'random_key': 1000
}, 'RANDOM_KEY', True), {
    'random_key': 1000
})]
"""Describes the scenarios for append_obj_and_assign_escalation function the structure (input, output)
input: tuple -> (keyword: str, original_keyword: str)
output: phase where the price_obj should be contained
"""
APPEND_OBJ_ASSIGN_ESCALATION_SCENARIOS = [(('PRI/OIL', 'PRI/OIL'), 'oil'), (('PRI/GAS', 'PRI/GAS'), 'gas'),
                                          (('PRI/NGL', 'PRI/NGL'), 'ngl'), (('PRI/CND', 'PRI/CND'), 'drip_condensate')]

CHECK_IF_APPLY_CAP_SCENARIOS = []


def get_process_date_format():
    ls_expressions = [('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'), ('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'),
                      ('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'), ('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'),
                      ('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'), ('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0')]

    input_ = {
        (ls_expression, keyword, use_fpd, use_asof): {
            'ls_expression': ls_expression,
            'start_date': START_DATE,
            'propnum': PROPNUM,
            'keyword': keyword,
            'original_keyword': keyword,
            'use_fpd': use_fpd,
            'use_asof': use_asof
        }
        for ls_expression in ls_expressions for keyword in KEYWORD_LS for use_fpd in USE_FPD_LS  # noqa (E126)
        for use_asof in USE_ASOF_LS
    }

    def get_output_structure(date_format: dict):
        return {'cap': '', 'escalation_model': 'none', **date_format}

    output = {
        (('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'), 'PRI/OIL', True, False):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2019-1-23'
        }}),
        (('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'), 'PRI/OIL', False, True):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2019-1-23'
        }}),
        (('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'), 'PRI/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'), 'PRI/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 'Econ Limit',
            'period': 1200,
            'start': 1
        }}),
        (('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'), 'PAJ/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': '2033-01-31',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'), 'PAJ/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 120,
            'period': 120,
            'start': 1
        }}),
        (('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'), 'PAD/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': '2023-11-09',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'), 'PAD/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 9,
            'period': 9,
            'start': 1
        }}),
        (('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'), 'PAD/OIL', True, False):
        get_output_structure({'dates': {
            'end_date': '2023-11-12',
            'start_date': '2023-02-01'
        }}),
        (('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'), 'PAD/OIL', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 9,
            'period': 9,
            'start': 1
        }}),
        (('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0'), 'PRI/OIL', True, False):
        get_output_structure({'dates': {
            'end_date': '2032-06-24',
            'start_date': '2023-02-01'
        }}),
        (('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0'), 'PRI/OIL', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 113,
            'period': 113,
            'start': 1
        }})
    }

    return ((input_[key], output[key]) for key in output)


def get_process_cutoff_format():
    ls_expressions = [('X', '-0.871', '$/M', '1.987', 'BBL', '0'), ('X', '-0.871', '$/M', '0.125', 'MCF', '0'),
                      ('X', '-0.871', '$/M', '2.786', 'RDN', '0'), ('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'),
                      ('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'), ('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'),
                      ('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'), ('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'),
                      ('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0')]

    input_ = {
        (ls_expression, keyword, use_fpd, use_asof): {
            'ls_expression': ls_expression,
            'start_date': START_DATE,
            'propnum': PROPNUM,
            'keyword': keyword,
            'original_keyword': keyword,
            'use_fpd': use_fpd,
            'use_asof': use_asof
        }
        for ls_expression in ls_expressions for keyword in KEYWORD_LS for use_fpd in USE_FPD_LS  # noqa (E126)
        for use_asof in USE_ASOF_LS
    }
    """Describes the output associated to the different inputs in a tuple-like structure (obj, contained_in)
    obj: dict -> the result object that is going to be appended in the contained_in structure
    contained_in: Structure where `obj` should be in. e.g tuple for default_price_document, dollar_diff_oil_1, etc

    NOTE: ADD NEW SCENARIOS BASED ON THE PARAMETER TUPLE (LS_EXPRESSION, KEYWORD, USE_FPD, USE_ASOF)
    """
    def get_output_structure(price: dict):
        return {'cap': '', 'escalation_model': 'none', **price}

    output = {
        (('X', '-0.871', '$/M', '1.987', 'BBL', '0'), 'PRI/OIL', True, True):
        get_output_structure({
            'well_head_oil_cum': 1.987,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '1.987', 'BBL', '0'), 'PAJ/OIL', False, False):
        get_output_structure({
            'well_head_oil_cum': 1.987,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '1.987', 'BBL', '0'), 'PAD/OIL', False, False):
        get_output_structure({
            'well_head_oil_cum': 1.987,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '0.125', 'MCF', '0'), 'PRI/GAS', False, False):
        get_output_structure({
            'well_head_gas_cum': 0.125,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '0.125', 'MCF', '0'), 'PAJ/GAS', True, False):
        get_output_structure({
            'well_head_gas_cum': 0.125,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '0.125', 'MCF', '0'), 'PAJ/GAS', False, True):
        get_output_structure({
            'well_head_gas_cum': 0.125,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '0.125', 'MCF', '0'), 'PAD/GAS', True, False):
        get_output_structure({
            'well_head_gas_cum': 0.125,
            'start': START_DATE
        }),
        (('X', '-0.871', '$/M', '0.125', 'MCF', '0'), 'PAD/GAS', False, True):
        get_output_structure({
            'well_head_gas_cum': 0.125,
            'start': START_DATE
        }),
        (('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'), 'PRI/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2019-1-23'
        }}),
        (('35', 'X', 'M$', '10.4', 'AD', 'PC', '0'), 'PRI/OIL', False, True):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2019-1-23'
        }}),
        (('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'), 'PRI/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': 'Econ Limit',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0'), 'PRI/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 'Econ Limit',
            'period': 1200,
            'start': 1
        }}),
        (('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'), 'PAJ/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': '2033-01-31',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', '10.4', 'YR', 'PC', '0'), 'PAJ/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 120,
            'period': 120,
            'start': 1
        }}),
        (('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'), 'PAD/GAS', True, False):
        get_output_structure({'dates': {
            'end_date': '2023-11-09',
            'start_date': '2023-02-01'
        }}),
        (('35', 'X', 'M$', '9.3', 'IMOS', 'PC', '0'), 'PAD/GAS', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 9,
            'period': 9,
            'start': 1
        }}),
        (('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'), 'PAD/OIL', True, False):
        get_output_structure({'dates': {
            'end_date': '2023-11-12',
            'start_date': '2023-02-01'
        }}),
        (('86', 'X', 'M$', '9.4', 'MOS', 'PC', '0'), 'PAD/OIL', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 9,
            'period': 9,
            'start': 1
        }}),
        (('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0'), 'PRI/OIL', True, False):
        get_output_structure({'dates': {
            'end_date': '2032-06-24',
            'start_date': '2023-02-01'
        }}),
        (('73', 'X', 'M$', '9.4', 'IYR', 'PC', '0'), 'PRI/OIL', False, True):
        get_output_structure({'offset_to_as_of_date': {
            'end': 113,
            'period': 113,
            'start': 1
        }}),
        (('X', '-0.871', '$/M', '2.786', 'RDN', '0'), 'PRI/OIL', False, False):
        DEFAULT_PRICE_OBJ
    }

    return ((input_[key], output[key]) for key in output)


def get_process_list_method_format_scenarios():
    """Builds up different combination of inputs and relations them with their expected outcomes.

    Returns:
        Generator containing the different set of (input_, output) scenarios
    """
    ls_expressions = [('X', '8.695', '#/M'), ('01/2015', '6.456', 'M#'), ('05/2020', '2*1.098', 'M#Y')]

    price_use_btu = [False, True]

    input_ = {(ls_expression, keyword, use_btu): {
        'start_date': '02/2023',
        'ls_expression': ls_expression,
        'propnum': PROPNUM,
        'keyword': keyword,
        'original_keyword': keyword,
        'use_btu': use_btu
    }
              for ls_expression in ls_expressions for keyword in KEYWORD_LS for use_btu in price_use_btu}  # noqa (E126)
    """Describes the output associated to the different inputs in a tuple-like structure (obj, contained_in)
    obj: dict -> the result object that is going to be appended in the contained_in structure
    contained_in: Structure where `obj` should be in. e.g tuple for default_price_document, dollar_diff_oil_1, etc.
    NOTE: ADD NEW SCENARIOS BASED ON THE PARAMETER TUPLE (LS_EXPRESSION, KEYWORD, USE_BTU)
    """
    def get_output_structure(start_date: str, end_date: str, price: dict, contained_in: Union[str, tuple]):
        return ({
            'cap': '',
            'dates': {
                'start_date': start_date,
                'end_date': end_date
            },
            **price, 'escalation_model': create_default_escalation_obj(start_date, end_date, None)
        }, contained_in)

    output = {
        (('X', '8.695', '#/M'), 'PRI/OIL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'price': 8.695}, contained_in=('price_model', 'oil')),
        (('X', '8.695', '#/M'), 'PAD/OIL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_bbl': 8.695}, contained_in='dollar_diff_oil_1'),
        (('X', '8.695', '#/M'), 'PAJ/OIL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_bbl': 8.695}, contained_in='dollar_diff_oil_1'),
        (('X', '8.695', '#/M'), 'PRI/GAS', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_mcf': 8.695},
                             contained_in=('price_model', 'gas')),
        (('X', '8.695', '#/M'), 'PRI/GAS', True):
        get_output_structure('2023-02-01',
                             '2023-02-28', {'dollar_per_mmbtu': 8.695},
                             contained_in=('price_model', 'gas')),
        (('X', '8.695', '#/M'), 'PAD/GAS', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_mcf': 8.695}, contained_in='dollar_diff_gas_1'),
        (('X', '8.695', '#/M'), 'PAD/GAS', True):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_mmbtu': 8.695}, contained_in='dollar_diff_gas_1'),
        (('X', '8.695', '#/M'), 'PAJ/GAS', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_mcf': 8.695}, contained_in='dollar_diff_gas_1'),
        (('X', '8.695', '#/M'), 'PAJ/GAS', True):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_mmbtu': 8.695}, contained_in='dollar_diff_gas_1'),
        (('X', '8.695', '#/M'), 'PRI/CND', False):
        get_output_structure('2023-02-01',
                             '2023-02-28', {'dollar_per_bbl': 8.695},
                             contained_in=('price_model', 'drip_condensate')),
        (('X', '8.695', '#/M'), 'PAJ/CND', True):
        get_output_structure('2023-02-01',
                             '2023-02-28', {'dollar_per_bbl': 8.695},
                             contained_in='dollar_diff_condensate_1'),
        (('X', '8.695', '#/M'), 'PAD/CND', False):
        get_output_structure('2023-02-01',
                             '2023-02-28', {'dollar_per_bbl': 8.695},
                             contained_in='dollar_diff_condensate_1'),
        (('X', '8.695', '#/M'), 'PRI/NGL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_bbl': 8.695},
                             contained_in=('price_model', 'ngl')),
        (('X', '8.695', '#/M'), 'PAD/NGL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_bbl': 8.695}, contained_in='dollar_diff_ngl_1'),
        (('X', '8.695', '#/M'), 'PAJ/NGL', False):
        get_output_structure('2023-02-01', '2023-02-28', {'dollar_per_bbl': 8.695}, contained_in='dollar_diff_ngl_1'),
        (('01/2015', '6.456', 'M#'), 'PRI/OIL', False):
        get_output_structure('2015-01-01', '2015-01-31', {'price': 6456.0}, contained_in=('price_model', 'oil')),
        (('01/2015', '6.456', 'M#'), 'PAD/OIL', True):
        get_output_structure('2015-01-01', '2015-01-31', {'dollar_per_bbl': 6456.0}, contained_in='dollar_diff_oil_1'),
        (('01/2015', '6.456', 'M#'), 'PAJ/OIL', True):
        get_output_structure('2015-01-01', '2015-01-31', {'dollar_per_bbl': 6456.0}, contained_in='dollar_diff_oil_1'),
        (('05/2020', '2*1.098', 'M#Y'), 'PRI/OIL', False):
        get_output_structure('2020-05-01', '2022-04-30', {'price': 1098.0}, contained_in=('price_model', 'oil')),
        (('05/2020', '2*1.098', 'M#Y'), 'PAJ/OIL', False):
        get_output_structure('2020-05-01', '2022-04-30', {'dollar_per_bbl': 1098.0}, contained_in='dollar_diff_oil_1')
    }
    return ((input_[key], output[key]) for key in output)


def get_process_price_scenarios():
    """Makes a permutation between different option of scenarios for each parameter and creates an individual test case

    Returns:
        Testing scenarios to test process_price() function
    """
    econ_rows = [('PRI/OIL', 'KCAKOBFMHJ', 'PRI/OIL', '', '', 5, 15, ['X', '8.695', '#/M']),
                 ('PRI/OIL', 'KCAKOBFMHJ', 'PRI/OIL', '', '', 5, 15, ['X', '-0.871', '$/M', 'TO', 'LIFE', '0']),
                 ('PAJ/GAS', 'KCAKOBFMHJ', 'PAJ/GAS', '', '', 5, 15, ['X', '-0.871', '$/M', '0.125', 'MCF', '0'])]
    price_use_btu = [False, True]
    use_oil_price_as_base = [False, True]
    price_values = ['dollar_per_mcf', 'dollar_per_bbl', 'random_value']

    economic_instances = [Economic(*row) for row in econ_rows]
    condition_instances = [PriceConditionals(row) for row in price_use_btu]
    price_values = [PricingValues(row) for row in price_values]

    input_ = {
        (str(econ), price_value.unit, price.use_btu, oil_price_as_base): {
            'price_conditionals': price,
            'economic_values': econ,
            'use_oil_price_as_base': oil_price_as_base,
            'start_date': '02/2023',
            'pricing_values': price_value
        }
        for econ in economic_instances for price in condition_instances  # noqa (E126)
        for oil_price_as_base in use_oil_price_as_base for price_value in price_values
    }
    """Describes scenarios with the expected output for different variables in a tuple-like structure where
    (return of the function, phase(optional))
    """
    output = {
        ('X 8.695 #/M PRI/OIL', 'dollar_per_mcf', False, False): (True, 'oil'),
        ('X -0.871 $/M TO LIFE 0 PRI/OIL', 'dollar_per_mcf', False, False): (True, ),
        ('X -0.871 $/M TO LIFE 0 PRI/OIL', 'dollar_per_mcf', False, False): (True, ),
        ('X -0.871 $/M 0.125 MCF 0 PAJ/GAS', 'dollar_per_bbl', False, False): (False, )
    }

    return ((input_[key], output[key]) for key in output)
