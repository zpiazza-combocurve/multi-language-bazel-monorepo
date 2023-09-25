expense_model = {
    'unique':
    False,
    'name':
    'same as lookup',
    'variable_expenses': {
        'oil': {
            'gathering': {
                'rows': [{
                    'dollar_per_bbl': 1,
                    'entire_well_life': 'Flat'
                }],
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'no',
                'deduct_before_severance_tax': 'yes',
                'deduct_before_ad_val_tax': 'yes',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
            },
            'processing': {
                'rows': [
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 1,
                            'end': 5,
                            'period': 5
                        },
                    },
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 6,
                            'end': 10,
                            'period': 5
                        },
                    },
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 11,
                            'end': 15,
                            'period': 5
                        },
                    },
                ],
                'description':
                '',
                'shrinkage_condition':
                'unshrunk',
                'escalation_model':
                'none',
                'calculation':
                'wi',
                'affect_econ_limit':
                'yes',
                'deduct_before_severance_tax':
                'no',
                'deduct_before_ad_val_tax':
                'no',
                'cap':
                '',
                'deal_terms':
                1,
                'rate_type':
                'gross_well_head',
                'rows_calculation_method':
                'non_monotonic',
            },
            'transportation': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'gas': {
            'gathering': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'rows': [{
                    'dollar_per_mcf': 1,
                    'entire_well_life': 'Flat'
                }],
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
            },
            'marketing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'ngl': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'drip_condensate': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
    },
    'fixed_expenses': {
        'monthly_well_cost': {
            'description':
            '',
            'escalation_model':
            'none',
            'calculation':
            'wi',
            'affect_econ_limit':
            'no',
            'stop_at_econ_limit':
            'yes',
            'expense_before_fpd':
            'no',
            'deduct_before_severance_tax':
            'yes',
            'deduct_before_ad_val_tax':
            'yes',
            'cap':
            '',
            'deal_terms':
            1,
            'rate_type':
            'gross_well_head',
            'rows_calculation_method':
            'non_monotonic',
            'rows': [
                {
                    'fixed_expense': 1,
                    'dates': {
                        'start_date': '2000-01-01',
                        'end_date': '2009-12-31'
                    },
                },
                {
                    'fixed_expense': 2,
                    'dates': {
                        'start_date': '2010-01-01',
                        'end_date': '2019-12-31'
                    },
                },
                {
                    'fixed_expense': 1,
                    'dates': {
                        'start_date': '2020-01-01',
                        'end_date': 'Econ Limit'
                    },
                },
            ],
        },
        'other_monthly_cost_1': {
            'description':
            '',
            'escalation_model':
            'none',
            'calculation':
            'wi',
            'affect_econ_limit':
            'yes',
            'stop_at_econ_limit':
            'yes',
            'expense_before_fpd':
            'no',
            'deduct_before_severance_tax':
            'no',
            'deduct_before_ad_val_tax':
            'no',
            'cap':
            '',
            'deal_terms':
            1,
            'rate_type':
            'gross_well_head',
            'rows_calculation_method':
            'non_monotonic',
            'rows': [
                {
                    'fixed_expense': 1,
                    'gas_rate': {
                        'start': 10,
                        'end': 100
                    }
                },
                {
                    'fixed_expense': 2,
                    'gas_rate': {
                        'start': 100,
                        'end': 'inf'
                    }
                },
            ],
        },
        'other_monthly_cost_2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_3': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_5': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_6': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_7': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_8': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
    },
    'water_disposal': {
        'escalation_model':
        'none',
        'calculation':
        'wi',
        'affect_econ_limit':
        'no',
        'deduct_before_severance_tax':
        'yes',
        'deduct_before_ad_val_tax':
        'yes',
        'cap':
        '',
        'deal_terms':
        1,
        'rate_type':
        'gross_well_head',
        'rows_calculation_method':
        'non_monotonic',
        'rows': [
            {
                'dollar_per_bbl': 1,
                'oil_rate': {
                    'start': 10,
                    'end': 30
                }
            },
            {
                'dollar_per_bbl': 2.5,
                'oil_rate': {
                    'start': 30,
                    'end': 'inf'
                }
            },
        ],
    },
    'carbon_expenses': {
        'category': 'co2e',
        'co2e': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'carbon_expense': 0,
                'entire_well_life': 'Flat'
            }]
        },
        'co2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'carbon_expense': 0,
                'entire_well_life': 'Flat'
            }]
        },
        'ch4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'carbon_expense': 0,
                'entire_well_life': 'Flat'
            }]
        },
        'n2o': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'carbon_expense': 0,
                'entire_well_life': 'Flat'
            }]
        }
    },
    'fetched_embedded': [
        [
            [
                {
                    'key': 'key',
                    'value': 'oil'
                },
                {
                    'key': 'category',
                    'value': 'gathering'
                },
                {
                    'key': 'unit',
                    'lookup': 'line-4-unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'lookup': 'line-2-value',
                    'value': '3'
                },
            ],
            [
                {
                    'key': 'key',
                    'value': 'oil'
                },
                {
                    'key': 'category',
                    'value': 'processing'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'lookup': 'line-3-value',
                    'value': '3'
                },
                {
                    'key': 'description',
                    'lookup': 'line-1-description',
                    'value': ''
                },
            ],
        ],
        [
            [
                {
                    'key': 'key',
                    'value': 'oil'
                },
                {
                    'key': 'category',
                    'value': 'gathering'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'value': '6'
                },
                {
                    'key': 'description',
                    'value': 'test'
                },
                {
                    'key': 'shrinkage_condition',
                    'value': 'shrunk'
                },
                {
                    'key': 'cap'
                },
            ],
            [
                {
                    'key': 'key',
                    'value': 'gas'
                },
                {
                    'key': 'category',
                    'value': 'processing'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_mcf'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'value': '4'
                },
                {
                    'key': 'description',
                    'value': 'if'
                },
            ],
            [
                {
                    'key': 'key',
                    'value': 'ngl'
                },
                {
                    'key': 'category',
                    'value': 'processing'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'value': '25'
                },
                {
                    'key': 'description',
                    'value': 'working'
                },
            ],
            [
                {
                    'key': 'key',
                    'value': 'oil'
                },
                {
                    'key': 'category',
                    'value': 'processing'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'value': '6'
                },
                {
                    'key': 'shrinkage_condition',
                    'value': 'shrunk'
                },
            ],
            [
                {
                    'key': 'key',
                    'value': 'oil'
                },
                {
                    'key': 'category',
                    'value': 'transportation'
                },
                {
                    'key': 'unit',
                    'value': 'dollar_per_bbl'
                },
                {
                    'key': 'criteria',
                    'value': 'entire_well_life'
                },
                {
                    'key': 'period',
                    'value': 'Flat'
                },
                {
                    'key': 'value',
                    'value': '14'
                },
            ],
            [{
                'key': 'key',
                'value': 'fixed_expenses'
            }, {
                'key': 'category',
                'value': ''
            }, {
                'key': 'unit',
                'value': 'dollar_per_bbl'
            }, {
                'key': 'criteria',
                'value': 'entire_well_life'
            }, {
                'key': 'period',
                'value': 'Flat'
            }, {
                'key': 'value',
                'value': '4000'
            }],
        ],
    ],
}

fixed_expense_input = {
    'monthly_well_cost': {
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'description': '',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'rows': [{
            'fixed_expense': 4000.0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_1': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_2': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_3': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_4': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_5': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_6': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_7': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
    'other_monthly_cost_8': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'stop_at_econ_limit': 'yes',
        'expense_before_fpd': 'no',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'fixed_expense': 0,
            'entire_well_life': 'Flat'
        }],
    },
}

var_expenses_input = {
    'oil': {
        'gathering': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'shrinkage_condition': 'shrunk',
            'description': 'test',
            'rows': [{
                'dollar_per_bbl': 6.0,
                'entire_well_life': 'Flat'
            }],
        },
        'processing': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'shrinkage_condition': 'shrunk',
            'description': '',
            'rows': [{
                'dollar_per_bbl': 6.0,
                'entire_well_life': 'Flat'
            }],
        },
        'transportation': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'shrinkage_condition': 'unshrunk',
            'description': '',
            'rows': [{
                'dollar_per_bbl': 14.0,
                'entire_well_life': 'Flat'
            }],
        },
        'marketing': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
        'other': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
    },
    'gas': {
        'gathering': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_mcf': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
        'processing': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'shrinkage_condition': 'unshrunk',
            'description': 'if',
            'rows': [{
                'dollar_per_mcf': 4.0,
                'entire_well_life': 'Flat'
            }],
        },
        'transportation': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_mcf': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
        'marketing': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_mcf': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
        'other': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_mcf': 0,
                'entire_well_life': 'Flat'
            }],
            'shrinkage_condition': 'unshrunk',
        },
    },
    'ngl': {
        'gathering': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'processing': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'description': 'working',
            'rows': [{
                'dollar_per_bbl': 25.0,
                'entire_well_life': 'Flat'
            }],
        },
        'transportation': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'marketing': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
    },
    'drip_condensate': {
        'gathering': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'processing': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'transportation': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'marketing': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'dollar_per_bbl': 0,
                'entire_well_life': 'Flat'
            }],
        },
    },
}

expenses_inputs = (
    {
        'monthly_well_cost': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_1': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_3': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_5': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_6': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_7': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_8': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
    },
    {
        'oil': {
            'gathering': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 3.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 3.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'gas': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'ngl': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'drip_condensate': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
    },
    {
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'cap': '',
        'deal_terms': 1,
        'rows': [{
            'dollar_per_bbl': 0,
            'entire_well_life': 'Flat'
        }],
    },
)

incorporated_inputs = ([
    {
        'monthly_well_cost': {
            'description':
            '',
            'escalation_model':
            'none',
            'calculation':
            'wi',
            'affect_econ_limit':
            'no',
            'stop_at_econ_limit':
            'yes',
            'expense_before_fpd':
            'no',
            'deduct_before_severance_tax':
            'yes',
            'deduct_before_ad_val_tax':
            'yes',
            'cap':
            '',
            'deal_terms':
            1,
            'rate_type':
            'gross_well_head',
            'rows_calculation_method':
            'non_monotonic',
            'rows': [
                {
                    'fixed_expense': 1,
                    'dates': {
                        'start_date': '2000-01-01',
                        'end_date': '2009-12-31'
                    },
                },
                {
                    'fixed_expense': 2,
                    'dates': {
                        'start_date': '2010-01-01',
                        'end_date': '2019-12-31'
                    },
                },
                {
                    'fixed_expense': 1,
                    'dates': {
                        'start_date': '2020-01-01',
                        'end_date': 'Econ Limit'
                    },
                },
            ],
        },
        'other_monthly_cost_1': {
            'description':
            '',
            'escalation_model':
            'none',
            'calculation':
            'wi',
            'affect_econ_limit':
            'yes',
            'stop_at_econ_limit':
            'yes',
            'expense_before_fpd':
            'no',
            'deduct_before_severance_tax':
            'no',
            'deduct_before_ad_val_tax':
            'no',
            'cap':
            '',
            'deal_terms':
            1,
            'rate_type':
            'gross_well_head',
            'rows_calculation_method':
            'non_monotonic',
            'rows': [
                {
                    'fixed_expense': 1,
                    'gas_rate': {
                        'start': 10,
                        'end': 100
                    }
                },
                {
                    'fixed_expense': 2,
                    'gas_rate': {
                        'start': 100,
                        'end': 'inf'
                    }
                },
            ],
        },
        'other_monthly_cost_2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_3': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_5': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_6': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_7': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_8': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'type_model': 'original',
    },
    {
        'monthly_well_cost': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_1': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_3': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_5': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_6': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_7': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_8': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'type_model': 'embedded',
    },
    {
        'monthly_well_cost': {
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'cap': '',
            'deal_terms': 1,
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'description': '',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'rows': [{
                'fixed_expense': 4000.0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_1': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_2': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_3': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_4': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_5': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_6': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_7': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'other_monthly_cost_8': {
            'description': '',
            'escalation_model': 'none',
            'calculation': 'wi',
            'affect_econ_limit': 'yes',
            'stop_at_econ_limit': 'yes',
            'expense_before_fpd': 'no',
            'deduct_before_severance_tax': 'no',
            'deduct_before_ad_val_tax': 'no',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'cap': '',
            'deal_terms': 1,
            'rows': [{
                'fixed_expense': 0,
                'entire_well_life': 'Flat'
            }],
        },
        'type_model': 'embedded',
    },
], [
    {
        'oil': {
            'gathering': {
                'rows': [{
                    'dollar_per_bbl': 1,
                    'entire_well_life': 'Flat'
                }],
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'no',
                'deduct_before_severance_tax': 'yes',
                'deduct_before_ad_val_tax': 'yes',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
            },
            'processing': {
                'rows': [
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 1,
                            'end': 5,
                            'period': 5
                        },
                    },
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 6,
                            'end': 10,
                            'period': 5
                        },
                    },
                    {
                        'dollar_per_bbl': 1,
                        'offset_to_fpd': {
                            'start': 11,
                            'end': 15,
                            'period': 5
                        },
                    },
                ],
                'description':
                '',
                'shrinkage_condition':
                'unshrunk',
                'escalation_model':
                'none',
                'calculation':
                'wi',
                'affect_econ_limit':
                'yes',
                'deduct_before_severance_tax':
                'no',
                'deduct_before_ad_val_tax':
                'no',
                'cap':
                '',
                'deal_terms':
                1,
                'rate_type':
                'gross_well_head',
                'rows_calculation_method':
                'non_monotonic',
            },
            'transportation': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'gas': {
            'gathering': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'rows': [{
                    'dollar_per_mcf': 1,
                    'entire_well_life': 'Flat'
                }],
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
            },
            'marketing': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'shrinkage_condition': 'unshrunk',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'ngl': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'drip_condensate': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'type_model': 'original',
    },
    {
        'oil': {
            'gathering': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 3.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 3.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'gas': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'ngl': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'drip_condensate': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'type_model': 'embedded',
    },
    {
        'oil': {
            'gathering': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'shrunk',
                'description': 'test',
                'rows': [{
                    'dollar_per_bbl': 6.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'shrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 6.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': '',
                'rows': [{
                    'dollar_per_bbl': 14.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'gas': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'processing': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'shrinkage_condition': 'unshrunk',
                'description': 'if',
                'rows': [{
                    'dollar_per_mcf': 4.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }],
                'shrinkage_condition': 'unshrunk',
            },
        },
        'ngl': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'cap': '',
                'deal_terms': 1,
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'description': 'working',
                'rows': [{
                    'dollar_per_bbl': 25.0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'drip_condensate': {
            'gathering': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'processing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'transportation': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'marketing': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
            'other': {
                'description': '',
                'escalation_model': 'none',
                'calculation': 'wi',
                'affect_econ_limit': 'yes',
                'deduct_before_severance_tax': 'no',
                'deduct_before_ad_val_tax': 'no',
                'rate_type': 'gross_well_head',
                'rows_calculation_method': 'non_monotonic',
                'cap': '',
                'deal_terms': 1,
                'rows': [{
                    'dollar_per_bbl': 0,
                    'entire_well_life': 'Flat'
                }],
            },
        },
        'type_model': 'embedded',
    },
], [{
    'escalation_model':
    'none',
    'calculation':
    'wi',
    'affect_econ_limit':
    'no',
    'deduct_before_severance_tax':
    'yes',
    'deduct_before_ad_val_tax':
    'yes',
    'cap':
    '',
    'deal_terms':
    1,
    'rate_type':
    'gross_well_head',
    'rows_calculation_method':
    'non_monotonic',
    'rows': [
        {
            'dollar_per_bbl': 1,
            'oil_rate': {
                'start': 10,
                'end': 30
            }
        },
        {
            'dollar_per_bbl': 2.5,
            'oil_rate': {
                'start': 30,
                'end': 'inf'
            }
        },
    ],
    'type_model':
    'original',
}, {
    'escalation_model': 'none',
    'calculation': 'wi',
    'affect_econ_limit': 'yes',
    'deduct_before_severance_tax': 'no',
    'deduct_before_ad_val_tax': 'no',
    'rate_type': 'gross_well_head',
    'rows_calculation_method': 'non_monotonic',
    'cap': '',
    'deal_terms': 1,
    'rows': [{
        'dollar_per_bbl': 0,
        'entire_well_life': 'Flat'
    }],
    'type_model': 'embedded',
}, {
    'escalation_model': 'none',
    'calculation': 'wi',
    'affect_econ_limit': 'yes',
    'deduct_before_severance_tax': 'no',
    'deduct_before_ad_val_tax': 'no',
    'rate_type': 'gross_well_head',
    'rows_calculation_method': 'non_monotonic',
    'cap': '',
    'deal_terms': 1,
    'rows': [{
        'dollar_per_bbl': 0,
        'entire_well_life': 'Flat'
    }],
    'type_model': 'embedded',
}], [{
    'category': 'co2e',
    'co2e': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'co2': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'ch4': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'n2o': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'type_model': 'original'
}, {
    'co2e': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'co2': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'ch4': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'n2o': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'type_model': 'embedded'
}, {
    'co2e': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'co2': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'ch4': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'n2o': {
        'description': '',
        'escalation_model': 'none',
        'calculation': 'wi',
        'affect_econ_limit': 'yes',
        'deduct_before_severance_tax': 'no',
        'deduct_before_ad_val_tax': 'no',
        'cap': '',
        'deal_terms': 1,
        'rate_type': 'gross_well_head',
        'rows_calculation_method': 'non_monotonic',
        'rows': [{
            'carbon_expense': 0,
            'entire_well_life': 'Flat'
        }]
    },
    'type_model': 'embedded'
}])
