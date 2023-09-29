PROPNUM = 'WAPG5EFTIU'
"""Describes scenarios for assign_key_based_on_keyword function following the (input, output) structure
input: tuple -> (keyword, phase)
output: str
"""
ASSIGN_KEY_BASED_ON_KEYWORD_SCENARIOS = [(('ATX/T', 'random_phase'), 'dollar_per_month'),
                                         (('random_key', 'gas'), 'dollar_per_mcf'),
                                         (('random_key', 'random_phase'), 'pct_of revenue')]
"""Describes scenarios for format_obj_key function following the (input, output) structure
input: tuple -> (keyword, key)
output: str -> ATX_T--9999-pct_of revenue
"""
FORMAT_OBJ_KEY_SCENARIOS = [(('ATX/T', 'dollar_per_month'), 'ATX/T--9999-dollar_per_month'),
                            (('STX/T', 'pct_of revenue'), 'STX/T--9999-pct_of revenue'),
                            (('STD/T', 'pct_of revenue'), 'STD/T--9999-pct_of revenue'),
                            (('random_keyword', 'random_key'), 'random_keyword--9999')]
"""Describes scenarios for assign_fixed_expense_to_obj function following the (input, output) structure
input: tuple -> (ls_expression, fixed_cost_name)
output: float
"""
ASSIGN_FIXED_EXPENSE_TO_OBJ_SCENARIOS = [((['08/2022', '-8.687', '9.680', '#/M'], 'monthly_well_cost'), -8.687),
                                         ((['08/2022', '-8.687', '9.680', '#/M'], 'other_monthly_cost_1'), -8.687),
                                         ((['08/2022', '0', '9.680', '#/M'], 'monthly_well_cost'), 0.0),
                                         ((['08/2022', '8.687', '9.680', '#/M'], 'monthly_well_cost'), 0.0),
                                         ((['0.64', 'X', '$/M', 'TO', 'LIFE', 'PC', '0'], 'monthly_well_cost'), 0.0)]
"""Describes scenarios for unpack_exp_values_from_expression function following the (input, output) structure
input: list[str] -> ['4.6', '7.5', '0', '0', '$', 'TO', 'LIFE']
output: tuple -> (value, cap, unit)
"""
UNPACK_EXP_VALUES_FROM_EXPRESSION_SCENARIOS = [(['4.6', '7.5', '0', '0', '$', 'TO', 'LIFE'], ('4.6', '7.5', '0')),
                                               (['3770', 'X', '$/M', 'TO', 'LIFE', 'PC', '0'], ('3770', 'X', '$/M'))]
"""Describes scenarios for unpack_tax_values_from_expression function following the (input, output) structure
input: list[str] -> ['4.6', '7.5', '0', '0', '$', 'TO', 'LIFE']
output: tuple -> (value, cap, unit)
"""
UNPACK_TAX_VALUES_FROM_EXPRESSION_SCENARIOS = [(['4.6', '7.5', '0', '0', '$', 'TO', 'LIFE'], (4.6, '7.5', '0')),
                                               (['3770', 'X', '$/M', 'TO', 'LIFE', 'PC', '0'], (3770.0, 'X', '$/M'))]
"""Describes scenarios for extract_model_name_from_keyword function following the (input, output) structure
input: tuple -> (keyword, original_keyword, phase)
output: tuple -> (model_name, expense, phase)
"""
EXTRACT_MODEL_NAME_FROM_KEY_SCENARIOS = [
    # ATX keyword
    (('ATX/T', 'ATX/T', 'oil'), ('ad_valorem_tax', None, 'oil')),
    (('ATX', 'ATX', 'oil'), ('ad_valorem_tax', None, 'oil')),
    # STX keyword
    (('STX/GAS', 'STX/GAS', 'gas'), ('severance_tax', None, 'gas')),
    # CMP keyword
    (('CMP/REV', 'CMP/REV', 'rev'), ('variable_expenses', 'other', 'gas')),
    (('CMP/GAS', 'CMP/GAS', 'gas'), ('variable_expenses', 'other', 'gas')),
    # GPC keyword
    (('GPC/GAS', 'GPC/GAS', 'gas'), ('variable_expenses', 'gathering', 'gas')),
    (('GPC/REV', 'GPC/REV', 'rev'), ('variable_expenses', 'gathering', 'gas')),
    (('GPC/NGL', 'GPC/NGL', 'ngl'), ('variable_expenses', 'gathering', 'ngl')),
    # GTC keyword
    (('GTC/GAS', 'GTC/GAS', 'gas'), ('variable_expenses', 'transportation', 'gas')),
    (('GTC/REV', 'GTC/REV', 'gas'), ('variable_expenses', 'transportation', 'gas')),
    # LTC keyword
    (('LTC/GAS', 'LTC/GAS', 'gas'), ('variable_expenses', 'transportation', 'gas')),
    (('LTC/REV', 'LTC/REV', 'rev'), ('variable_expenses', 'transportation', 'oil')),
    (('LTC/OIL', 'LTC/OIL', 'oil'), ('variable_expenses', 'transportation', 'oil')),
    # OPC keyword
    (('OPC/GAS', 'OPC/GAS', 'rev'), ('variable_expenses', 'processing', 'rev')),
    (('OPC/OIL', 'OPC/OIL', 'oil'), ('variable_expenses', 'processing', 'oil')),
    # TRC keyword
    (('TRC/GAS', 'TRC/GAS', 'gas'), ('variable_expenses', 'marketing', 'gas')),
    # phase validation
    (('random_key', 'random_key', 'cnd'), (None, None, 'drip_condensate')),
    (('random_key', 'random_key', 'wtr'), ('water_disposal', None, 'wtr')),
]
"""Describes scenarios for update_obj_based_on_mo_cutoff function following the (input, output) structure
input: tuple -> (cutoff_unit, expression)
output: dict -> corresponds to the result `dates` key in default tax expense document
"""
UPDATE_OBJ_BASED_ON_MO_CUTOFF_SCENARIOS = [(('MO', '2.5'), {
    'start_date': '2021-03-01',
    'end_date': '2021-04-30'
}), (('MO', '-2.5'), {
    'start_date': '2021-03-01',
    'end_date': '2021-04-30'
}), (('MOS', '3.5'), {
    'start_date': '2021-03-01',
    'end_date': '2021-05-31'
}), (('MOS', '-3.5'), {
    'start_date': '2021-03-01',
    'end_date': '2021-05-31'
}), (('IMO', '2.6'), {
    'start_date': '2021-03-01',
    'end_date': '2021-05-31'
}), (('IMO', '-2.6'), {
    'start_date': '2021-03-01',
    'end_date': '2021-05-31'
}), (('IMOS', '3.6'), {
    'start_date': '2021-03-01',
    'end_date': '2021-06-30'
}), (('IMOS', '-3.6'), {
    'start_date': '2021-03-01',
    'end_date': '2021-06-30'
})]
"""Describes scenarios for update_obj_based_on_yr_cutoff function following the (input, output) structure
input: tuple -> (cutoff_unit, expression)
output: dict -> corresponds to the result `dates` key in default tax expense document
"""
UPDATE_OBJ_BASED_ON_YR_CUTOFF_SCENARIOS = [
    (('YR', '2.5'), {
        'start_date': '2021-03-01',
        'end_date': '2023-07-31'
    }),
    (('YR', '-2.5'), {
        'start_date': '2021-03-01',
        'end_date': '2023-07-31'
    }),
    (('YRS', '3.5'), {
        'start_date': '2021-03-01',
        'end_date': '2024-07-31'
    }),
    (('YRS', '-3.5'), {
        'start_date': '2021-03-01',
        'end_date': '2024-07-31'
    }),
    (('IYR', '2.6'), {
        'start_date': '2021-02-01',
        'end_date': '2023-09-30'
    }),
    (('IYR', '-2.6'), {
        'start_date': '2021-02-01',
        'end_date': '2023-09-30'
    }),
    (('IYRS', '3.6'), {
        'start_date': '2021-02-01',
        'end_date': '2024-09-30'
    }),
    (('IYRS', '-3.6'), {
        'start_date': '2021-02-01',
        'end_date': '2024-09-30'
    }),
    (('IYR', '0'), {
        'start_date': '',
        'end_date': ''
    }),
    (('IYRS', '0'), {
        'start_date': '',
        'end_date': ''
    }),
    (('YRS', '0'), {
        'start_date': '',
        'end_date': ''
    }),
    (('YR', '0'), {
        'start_date': '',
        'end_date': ''
    }),
]


def get_process_date_format_scenarios():
    """Describes scenarios for process_date_format function following the (input, output) structure
    input: tuple -> (economic_values, expression)
    output: dict -> corresponds to the result in default tax expense document
    """
    from api.aries_phdwin_imports.aries_data_extraction.tests.shared.mdb_extract_mock import AriesDataExtractionMock
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic

    expressions = [('OPC/GAS', '3770 X $/M TO LIFE PC 0'), ('OPC/OIL', '4230 X $/M 12 MO PC 0'),
                   ('OPC/OIL', '4230 X $/M 12 MOS PC 0'), ('OPC/OIL', '5200 X $/M 24 IMO PC 0'),
                   ('OPC/OIL', '5200 X $/M 24 IMOS PC 0'), ('GTC/GAS', '0.64 X $/M 02/2025 AD PC 0'),
                   ('STX/GAS', '4.58 X % 4 YR PC 0'), ('STX/GAS', '4.58 X % 4 YRS PC 0'),
                   ('STX/GAS', '4.58 X % 3 IYR PC 0'), ('STX/GAS', '4.58 X % 3 IYRS PC 0'),
                   ('ATX', '0.83 X % 50 BPD PC 0'), ('ATX', '0.83 X % 50 MPD PC 0')]

    default_documents = ['tax', 'expense']

    economic_values = [
        Economic(keyword=keyword,
                 propnum=PROPNUM,
                 original_keyword=keyword,
                 expression=expression,
                 qualifier='',
                 section='6',
                 sequence='8',
                 ls_expression=expression.split(' ')) for (keyword, expression) in expressions
    ]

    input_ = {(economic.keyword, economic.expression, document):
              (economic, AriesDataExtractionMock.get_default_format(document))
              for economic in economic_values for document in default_documents}

    output = {
        # Tax
        ('ATX', '0.83 X % 50 BPD PC 0', 'tax'): {
            'oil_rate': {
                'start': 50.0,
                'end': 'inf'
            }
        },
        ('ATX', '0.83 X % 50 MPD PC 0', 'tax'): {
            'gas_rate': {
                'start': 50.0,
                'end': 'inf'
            }
        },
        ('STX/GAS', '4.58 X % 4 YR PC 0', 'tax'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2028-11-30'
            }
        },
        ('STX/GAS', '4.58 X % 4 YRS PC 0', 'tax'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2028-11-30'
            }
        },
        ('STX/GAS', '4.58 X % 4 IYR PC 0', 'tax'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2023-07-31'
            }
        },
        ('STX/GAS', '4.58 X % 4 IYRS PC 0', 'tax'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2023-07-31'
            }
        },
        # Expense
        ('OPC/OIL', '4230 X $/M 12 MO PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-11-30'
            }
        },
        ('OPC/OIL', '4230 X $/M 12 MOS PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-11-30'
            }
        },
        ('OPC/OIL', '5200 X $/M 24 IMO PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2026-11-30'
            }
        },
        ('OPC/OIL', '5200 X $/M 24 iMOS PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2026-11-30'
            }
        },
        ('OPC/GAS', '3770 X $/M TO LIFE PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': 'Econ Limit'
            }
        },
        ('GTC/GAS', '0.64 X $/M 02/2025 AD PC 0', 'expense'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-01-31'
            }
        }
    }

    return [(in_, output[key]) for key, in_ in input_.items() if key in output]


def get_process_cutoff_format_scenarios():
    """Describes scenarios for process_cutoff_format function following the (input, output) structure
        input: tuple -> (cutoff_unit, expression)
        output: dict -> corresponds to the result in default tax expense document
    """
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic

    expressions = [('OPC/GAS', '3770 X $/M TO LIFE PC 0'), ('OPC/OIL', '4230 X $/M 12 MO PC 0'),
                   ('OPC/OIL', '4230 X $/M 12 MOS PC 0'), ('OPC/OIL', '5200 X $/M 24 IMO PC 0'),
                   ('OPC/OIL', '5200 X $/M 24 IMOS PC 0'), ('GTC/GAS', '0.64 X $/M 02/2025 AD PC 0'),
                   ('STX/GAS', '4.58 X % 4 YR PC 0'), ('STX/GAS', '4.58 X % 4 YRS PC 0'),
                   ('STX/GAS', '4.58 X % 3 IYR PC 0'), ('STX/GAS', '4.58 X % 3 IYRS PC 0'),
                   ('ATX', '0.83 X % 50 BPD PC 0'), ('ATX', '2000 X $/M 50 BBL PC 0'), ('ATX', '2000 X $/M 2 MB PC 0'),
                   ('STX/OIL', '1500 X $/M 0.5 MMB PC 0'), ('STX/GAS', '1500 X $/M 50 MCF PC 0'),
                   ('STX/GAS', '1500 X $/M 5 MMF PC 0'), ('STX/GAS', '1500 X $/M 0.5 BCF PC 0')]

    default_documents = ['tax_default_document', 'exp_default_document']

    economic_values = [
        Economic(keyword=keyword,
                 propnum=PROPNUM,
                 original_keyword=keyword,
                 expression=expression,
                 qualifier='',
                 section='6',
                 sequence='8',
                 ls_expression=expression.split(' ')) for (keyword, expression) in expressions
    ]

    input_ = {(economic.keyword, economic.expression, document): (economic, document)
              for economic in economic_values for document in default_documents}

    output = {
        # Cumulative
        ('ATX', '2000 X $/M 50 BBL PC 0', 'tax_default_document'): {
            'well_head_oil_cum': 50.0
        },
        ('ATX', '2000 X $/M 2 MB PC 0', 'tax_default_document'): {
            'well_head_oil_cum': 2000.0
        },
        ('STX/GAS', '1500 X $/M 0.5 MMB PC 0', 'tax_default_document'): {
            'well_head_oil_cum': 500000.0
        },
        ('STX/GAS', '1500 X $/M 50 MCF PC 0', 'tax_default_document'): {
            'well_head_gas_cum': 50.0
        },
        ('STX/GAS', '1500 X $/M 5 MMF PC 0', 'tax_default_document'): {
            'well_head_gas_cum': 5000.0
        },
        ('STX/GAS', '1500 X $/M 0.5 BCF PC 0', 'tax_default_document'): {
            'well_head_gas_cum': 500000.0
        },
        # Tax
        ('ATX', '0.83 X % 50 BPD PC 0', 'tax_default_document'): {
            'oil_rate': {
                'start': 50.0,
                'end': 'inf'
            }
        },
        ('ATX', '0.83 X % 50 MPD PC 0', 'tax_default_document'): {
            'gas_rate': {
                'start': 50.0,
                'end': 'inf'
            }
        },
        ('STX/GAS', '4.58 X % 4 YR PC 0', 'tax_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2028-11-30'
            }
        },
        ('STX/GAS', '4.58 X % 4 YRS PC 0', 'tax_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2028-11-30'
            }
        },
        ('STX/GAS', '4.58 X % 4 IYR PC 0', 'tax_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2023-07-31'
            }
        },
        ('STX/GAS', '4.58 X % 4 IYRS PC 0', 'tax_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2023-07-31'
            }
        },
        # Expense
        ('OPC/OIL', '4230 X $/M 12 MO PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-11-30'
            }
        },
        ('OPC/OIL', '4230 X $/M 12 MOS PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-11-30'
            }
        },
        ('OPC/OIL', '5200 X $/M 24 IMO PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2026-11-30'
            }
        },
        ('OPC/OIL', '5200 X $/M 24 iMOS PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2026-11-30'
            }
        },
        ('OPC/GAS', '3770 X $/M TO LIFE PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': 'Econ Limit'
            }
        },
        ('GTC/GAS', '0.64 X $/M 02/2025 AD PC 0', 'exp_default_document'): {
            'dates': {
                'start_date': '2024-12-01',
                'end_date': '2025-01-31'
            }
        }
    }

    return [(in_, output[key]) for key, in_ in input_.items() if key in output]


def get_process_tax_formula_method_scenarios():
    """Describes scenarios for process_tax_formula_method_scenarios function following the (input, output) structure
        input: tuple -> (keyword, expression, section)
        output: dict -> corresponds to the result in default tax expense document
    """
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic

    def get_output_struct(parent: str, **kwargs):
        """Returns a full structure of a tax/expense object to be validated.

        Args:
            parent: Document key which will contain the object. e.g. `oil`, `gas`, `ngl`
            **kwargs: additional keys regarding different types of data. e.g `dollar_per_bbl`, `pct_of_revenue`

        Returns:
            Fully built object.
        """
        return {parent: {'cap': '', **kwargs}}

    expressions = [('STX', '4.58 X % 4 YR PC 0'), ('STD', '.083 .083 $/U TO LIFE PC 0'),
                   ('ATX/OIL', '2000 X $ 50 BBL PC 0')]

    sequences = [8, -9999]

    economic_values = {(keyword, expression, f'sec: {sec}'): Economic(keyword=keyword,
                                                                      propnum=PROPNUM,
                                                                      original_keyword=keyword,
                                                                      expression=expression,
                                                                      qualifier='',
                                                                      section='6',
                                                                      sequence=sec,
                                                                      ls_expression=expression.split(' '))
                       for (keyword, expression) in expressions for sec in sequences}

    output = {
        ('STX', '4.58 X % 4 YR PC 0', 'sec: 8'):
        get_output_struct('severance_tax.oil',
                          dates={
                              'start_date': '2024-12-01',
                              'end_date': '2028-11-30'
                          },
                          pct_of_revenue=4.58,
                          dollar_per_bbl=0),
        ('STD', '.083 .083 $/U TO LIFE PC 0', 'sec: 8'):
        get_output_struct('severance_tax.oil',
                          dates={
                              'start_date': '2024-12-01',
                              'end_date': 'Econ Limit'
                          },
                          pct_of_revenue=0,
                          dollar_per_bbl=0.083),
        ('ATX', '2000 X $ 50 BBL PC 0', 'sec: 8'):
        get_output_struct('ad_valorem_tax.oil', start='12/2024', well_head_oil_cum=50.0, pct_of_revenue=0),
        ('ATX/OIL', '2000 X $ 50 BBL PC 0', 'sec: -9999'): {
            'ad_valorem_tax.oil': 'ATX/OIL--9999-dollar_per_bbl'
        }
    }

    return [(in_, output[key]) for key, in_ in economic_values.items() if key in output]


def get_process_fixed_expenses_total():
    """Describes scenarios for get_process_fixed_expenses_total function following the (input, output) structure
        input: tuple -> (keyword, expense_values)
        output: float -> corresponds to the result for fixed_expense value
    """
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.tax_expense import ExpenseValues

    expressions = [('STX', '4.58 X $/Y 4 YR PC 0'), ('STD', '.083 .083 $/D TO LIFE PC 0'),
                   ('ATX/OIL', '2000 X M$ 50 BBL PC 0'), ('STX/GAS', '4.58 X % 3 IYRS PC 0')]

    input_ = {(keyword, exp): (Economic(keyword=keyword,
                                        propnum=PROPNUM,
                                        original_keyword=keyword,
                                        expression=exp,
                                        qualifier='',
                                        section='6',
                                        sequence='8',
                                        ls_expression=exp.split(' ')), ExpenseValues(value='60',
                                                                                     unit=exp.split(' ')[2]))
              for (keyword, exp) in expressions}

    output = {
        ('STX', '4.58 X $/Y 4 YR PC 0'): 5.0,
        ('STD', '.083 .083 $/D TO LIFE PC 0'): 1826.25,
        ('ATX/OIL', '2000 X M$ 50 BBL PC 0'): 60000.0,
        ('STX/GAS', '4.58 X % 3 IYRS PC 0'): 60.0
    }

    return [(in_, output[key]) for key, in_ in input_.items() if key in output]


def get_process_fixed_expense_per_well():
    """Describes scenarios for get_process_fixed_expense_per_well function following the (input, output) structure
        input: tuple -> (keyword, expense_values)
        output: float -> corresponds to the result for fixed_expense value
    """
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
    from api.aries_phdwin_imports.aries_data_extraction.dataclasses.tax_expense import ExpenseValues

    expressions = [('OPC/OWL', '3770 X $/Y TO LIFE PC 0'), ('OPC/GWL', '3770 X $/D TO LIFE PC 0'),
                   ('OPC/INJ', '3770 X M$ TO LIFE PC 0')]

    input_ = {(keyword, exp): (Economic(keyword=keyword,
                                        propnum=PROPNUM,
                                        original_keyword=keyword,
                                        expression=exp,
                                        qualifier='',
                                        section='6',
                                        sequence='8',
                                        ls_expression=exp.split(' ')), ExpenseValues(value='60',
                                                                                     unit=exp.split(' ')[2]))
              for (keyword, exp) in expressions}

    output = {
        ('OPC/OWL', '3770 X $/Y TO LIFE PC 0'): 5.0,
        ('OPC/GWL', '4250 X $/D TO LIFE PC 0'): 1826.35,
        ('OPC/INJ', '1420 X M$ TO LIFE PC 0'): 60000.0
    }

    return [(in_, output[key]) for key, in_ in input_.items() if key in output]
