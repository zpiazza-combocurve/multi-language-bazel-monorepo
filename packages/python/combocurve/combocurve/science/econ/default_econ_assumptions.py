from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults

DOLLAR_PER_BBL = 'dollar_per_bbl'

# map new key to old key
KEY_MAP = {DOLLAR_PER_BBL: 'unit_cost'}


def get_default(key):
    if key in DEFAULT_DICT:
        return DEFAULT_DICT[key]()
    return None


def get_default_ownership_reversion():
    return {
        'ownership': {
            'initial_ownership': {
                'working_interest': 0,
                'original_ownership': {
                    'net_revenue_interest': 0,
                    'lease_net_revenue_interest': 0
                },
                'oil_ownership': {
                    'net_revenue_interest': '',
                    'lease_net_revenue_interest': ''
                },
                'gas_ownership': {
                    'net_revenue_interest': '',
                    'lease_net_revenue_interest': ''
                },
                'ngl_ownership': {
                    'net_revenue_interest': '',
                    'lease_net_revenue_interest': ''
                },
                'drip_condensate_ownership': {
                    'net_revenue_interest': '',
                    'lease_net_revenue_interest': ''
                },
                'net_profit_interest_type': 'expense',
                'net_profit_interest': 0
            },
            'first_reversion': {
                'no_reversion': ''
            },
            'second_reversion': {
                'no_reversion': ''
            },
            'third_reversion': {
                'no_reversion': ''
            },
            'fourth_reversion': {
                'no_reversion': ''
            },
            'fifth_reversion': {
                'no_reversion': ''
            },
            'sixth_reversion': {
                'no_reversion': ''
            },
            'seventh_reversion': {
                'no_reversion': ''
            },
            'eighth_reversion': {
                'no_reversion': ''
            },
            'ninth_reversion': {
                'no_reversion': ''
            },
            'tenth_reversion': {
                'no_reversion': ''
            }
        }
    }


def get_pricing():
    return {
        'price_model': {
            'oil': {
                'cap': '',
                'escalation_model': 'none',
                'rows': [{
                    'price': 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas': {
                'cap': '',
                'escalation_model': 'none',
                'rows': [{
                    'dollar_per_mmbtu': 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'ngl': {
                'cap': '',
                'escalation_model': 'none',
                'rows': [{
                    'pct_of_oil_price': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'drip_condensate': {
                'cap': '',
                'escalation_model': 'none',
                'rows': [{
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            }
        },
        'breakeven': {
            'npv_discount': 0,
            'based_on_price_ratio': 'no',
            'price_ratio': ''
        }
    }


def get_differentials():
    return {
        'differentials': {
            'differentials_1': EconModelDefaults.diff(),
            'differentials_2': EconModelDefaults.diff(),
            'differentials_3': EconModelDefaults.diff()
        }
    }


def get_general_options():
    return {
        'income_tax': {
            'state_income_tax': '',
            'federal_income_tax': ''
        },
        'boe_conversion': {
            'oil': 1,
            'wet_gas': 6,
            'dry_gas': 6,
            'ngl': 1,
            'drip_condensate': 1
        },
        'reporting_units': {
            'oil': 'MBBL',
            'gas': 'MMCF',
            'ngl': 'MBBL',
            'drip_condensate': 'MBBL',
            'water': 'MBBL',
            'pressure': 'PSI',
            'cash': 'M$',
            'water_cut': 'BBL/BOE',
            'gor': 'CF/BBL',
            'condensate_gas_ratio': 'BBL/MMCF',
            'drip_condensate_yield': 'BBL/MMCF',
            'ngl_yield': 'BBL/MMCF'
        },
        'main_options': {
            'max_well_life': 80,
            'currency': 'USD',
            'discount_date': None,
            'as_of_date': None,
            'base_date': None,
            'reporting_period': 'calendar',
            'fiscal': '',
            'income_tax': 'no',
            'project_type': 'primary_recovery'
        },
        'discount_table': {
            'discount_method':
            'yearly',
            'cash_accrual_time':
            'mid_month',
            'first_discount':
            10,
            'second_discount':
            15,
            'rows': [{
                'discount_table': 0
            }, {
                'discount_table': 2
            }, {
                'discount_table': 5
            }, {
                'discount_table': 8
            }, {
                'discount_table': 10
            }, {
                'discount_table': 12
            }, {
                'discount_table': 15
            }, {
                'discount_table': 20
            }, {
                'discount_table': 25
            }, {
                'discount_table': 30
            }, {
                'discount_table': 40
            }, {
                'discount_table': 50
            }, {
                'discount_table': 60
            }, {
                'discount_table': 70
            }, {
                'discount_table': 80
            }, {
                'discount_table': 100
            }]
        },
        'cut_off': {
            'first_negative_cash_flow': 'Yes'
        }
    }


def get_capex():
    return {'other_capex': {'rows': []}}


def get_production_taxes():
    return {
        'ad_valorem_tax': {
            'deduct_severance_tax': 'no',
            'shrinkage_condition': 'shrunk',
            'calculation': 'nri',
            'start_date': 'fpd',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'escalation_model': {
                'escalation_model_1': 'none',
                'escalation_model_2': 'none'
            },
            'rows': [{
                'pct_of_revenue': 0,
                'dollar_per_boe': 0,
                'entire_well_life': 'Flat'
            }]
        },
        'severance_tax': {
            'auto_calculation': 'no',
            'shrinkage_condition': 'shrunk',
            'calculation': 'nri',
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'oil': {
                'escalation_model': {
                    'escalation_model_1': 'none',
                    'escalation_model_2': 'none'
                },
                'rows': [{
                    'pct_of_revenue': 0,
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas': {
                'escalation_model': {
                    'escalation_model_1': 'none',
                    'escalation_model_2': 'none'
                },
                'rows': [{
                    'pct_of_revenue': 0,
                    'dollar_per_mcf': 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'ngl': {
                'escalation_model': {
                    'escalation_model_1': 'none',
                    'escalation_model_2': 'none'
                },
                'rows': [{
                    'pct_of_revenue': 0,
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'drip_condensate': {
                'escalation_model': {
                    'escalation_model_1': 'none',
                    'escalation_model_2': 'none'
                },
                'rows': [{
                    'pct_of_revenue': 0,
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            }
        }
    }


def get_expenses():
    return {
        'variable_expenses': {
            'oil': {
                'gathering': {
                    'description': '',
                    'shrinkage_condition': 'unshrunk',
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
                        DOLLAR_PER_BBL: 0,
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
                    'rate_type': 'gross_well_head',
                    'rows_calculation_method': 'non_monotonic',
                    'cap': '',
                    'deal_terms': 1,
                    'rows': [{
                        DOLLAR_PER_BBL: 0,
                        'entire_well_life': 'Flat'
                    }],
                },
                'transportation': {
                    'description': '',
                    'shrinkage_condition': 'unshrunk',
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
                        DOLLAR_PER_BBL: 0,
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
                    'rate_type': 'gross_well_head',
                    'rows_calculation_method': 'non_monotonic',
                    'cap': '',
                    'deal_terms': 1,
                    'rows': [{
                        DOLLAR_PER_BBL: 0,
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
                    'rate_type': 'gross_well_head',
                    'rows_calculation_method': 'non_monotonic',
                    'cap': '',
                    'deal_terms': 1,
                    'rows': [{
                        DOLLAR_PER_BBL: 0,
                        'entire_well_life': 'Flat'
                    }],
                }
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
                    'rate_type': 'gross_well_head',
                    'rows_calculation_method': 'non_monotonic',
                    'cap': '',
                    'deal_terms': 1,
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
                    'rate_type': 'gross_well_head',
                    'rows_calculation_method': 'non_monotonic',
                    'cap': '',
                    'deal_terms': 1,
                    'rows': [{
                        'dollar_per_mcf': 0,
                        'entire_well_life': 'Flat'
                    }],
                },
                'transportation': {
                    'description': '',
                    'shrinkage_condition': 'unshrunk',
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
                },
                'marketing': {
                    'description': '',
                    'shrinkage_condition': 'unshrunk',
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
                },
                'other': {
                    'description': '',
                    'shrinkage_condition': 'unshrunk',
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
                }
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
                        'entire_well_life': 'Flat'
                    }],
                }
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
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
                        DOLLAR_PER_BBL: 0,
                        'entire_well_life': 'Flat'
                    }],
                }
            }
        },
        'fixed_expenses': {
            'monthly_well_cost': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_1': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_2': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_3': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_4': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_5': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_6': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_7': EconModelDefaults.fixed_exp(),
            'other_monthly_cost_8': EconModelDefaults.fixed_exp(),
        },
        'water_disposal': {
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
                DOLLAR_PER_BBL: 0,
                'entire_well_life': 'Flat'
            }]
        },
        'carbon_expenses': {
            'category': 'co2e',
            'co2e': EconModelDefaults.ghg_default(),
            'co2': EconModelDefaults.ghg_default(),
            'ch4': EconModelDefaults.ghg_default(),
            'n2o': EconModelDefaults.ghg_default(),
        }
    }


def get_stream_properties():
    return {
        'btu_content': {
            'unshrunk_gas': 1000,
            'shrunk_gas': 1000
        },
        'yields': {
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'ngl': {
                'rows': [{
                    'yield': 0,
                    'entire_well_life': 'Flat',
                    'unshrunk_gas': 'Unshrunk Gas'
                }]
            },
            'drip_condensate': {
                'rows': [{
                    'yield': 0,
                    'entire_well_life': 'Flat',
                    'unshrunk_gas': 'Unshrunk Gas'
                }]
            }
        },
        'shrinkage': {
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'oil': {
                'rows': [{
                    'pct_remaining': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas': {
                'rows': [{
                    'pct_remaining': 100,
                    'entire_well_life': 'Flat'
                }]
            }
        },
        'loss_flare': {
            'rate_type': 'gross_well_head',
            'rows_calculation_method': 'non_monotonic',
            'oil_loss': {
                'rows': [{
                    'pct_remaining': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas_loss': {
                'rows': [{
                    'pct_remaining': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas_flare': {
                'rows': [{
                    'pct_remaining': 100,
                    'entire_well_life': 'Flat'
                }]
            }
        },
        'compositional_economics': {
            'rows': []
        }
    }


def get_risking():
    return {
        'risking_model': {
            'oil': {
                'rows': [{
                    'multiplier': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas': {
                'rows': [{
                    'multiplier': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'ngl': {
                'rows': [{
                    'multiplier': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'drip_condensate': {
                'rows': [{
                    'multiplier': 100,
                    'entire_well_life': 'Flat'
                }]
            },
            'water': {
                'rows': [{
                    'multiplier': 100,
                    'entire_well_life': 'Flat'
                }],
            },
            'well_stream': {
                'rows': [{
                    'count': 1,
                    'offset_to_fpd': {
                        'start': 1,
                        'end': 1,
                        'period': 12,
                        'end_date': 'Econ Limit'
                    }
                }]
            },
            'risk_prod': 'yes',
            'risk_ngl_drip_cond_via_gas_risk': 'yes',
        },
        'shutIn': {
            'rows': []
        }
    }


def get_production_vs_fit():
    return {
        'production_vs_fit_model': {
            'replace_actual': {
                'oil': {
                    'never': ''
                },
                'gas': {
                    'never': ''
                },
                'water': {
                    'never': ''
                }
            }
        }
    }


def get_reserves_category():
    return {
        'reserves_category': {
            'prms_resources_class': '',
            'prms_reserves_category': '',
            'prms_reserves_sub_category': ''
        }
    }


def get_dates():
    return {
        'dates_setting': {
            'max_well_life': 100,
            'as_of_date': {
                'fpd': ''
            },
            'discount_date': {
                'fpd': ''
            },
            'cash_flow_prior_to_as_of_date': 'no',
            'fpd_source_hierarchy': EconModelDefaults.fpd_source_hierarchy()
        },
        'cut_off': {
            'max_cum_cash_flow': '',
            'include_capex': 'no',
            'discount': 0,
            'econ_limit_delay': 0,
        }
    }


def get_escalation():
    return {
        'escalation_model': {
            'escalation_frequency': 'monthly',
            'calculation_method': 'compound',
            'rows': [{
                'pct_per_year': 0,
                'entire_well_life': 'Flat',
            }]
        }
    }


DEFAULT_DICT = {
    'ownership_reversion': get_default_ownership_reversion,
    'pricing': get_pricing,
    'differentials': get_differentials,
    'general_options': get_general_options,
    'capex': get_capex,
    'production_taxes': get_production_taxes,
    'expenses': get_expenses,
    'stream_properties': get_stream_properties,
    'risking': get_risking,
    'production_vs_fit': get_production_vs_fit,
    'reserves_category': get_reserves_category,
    'dates': get_dates,
    'escalation': get_escalation,
}
