DOLLAR_PER_BBL = 'dollar_per_bbl'

DEFAULT_VAR_VALUES = {
    'description': '',
    'escalation_model': 'none',
    'calculation': 'wi',
    'affect_econ_limit': 'yes',
    'deduct_before_severance_tax': 'no',
    'deduct_before_ad_val_tax': 'no',
    'rate_type': 'gross_well_head',
    'rows_calculation_method': 'non_monotonic',
    'cap': '',
    'deal_terms': 1
}

DEFAULT_GAS_RATE = {'rows': [{'dollar_per_mcf': 0, 'entire_well_life': 'Flat'}]}

DEFAULT_LIQUID_RATE = {'rows': [{'dollar_per_bbl': 0, 'entire_well_life': 'Flat'}]}

SHRINKAGE_COND = {'shrinkage_condition': 'unshrunk'}

DEFAULT_GAS_VAR_VALUES = {**DEFAULT_VAR_VALUES, **DEFAULT_GAS_RATE, **SHRINKAGE_COND}

DEFAULT_OIL_VAR_VALUES = {**DEFAULT_VAR_VALUES, **DEFAULT_LIQUID_RATE, **SHRINKAGE_COND}

DEFAULT_NGL_DRIP_VALUES = {**DEFAULT_VAR_VALUES, **DEFAULT_LIQUID_RATE}


class EconModelDefaults:
    @staticmethod
    def ghg_default():
        return {
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

    @staticmethod
    def fpd_source_hierarchy():
        return {
            'first_fpd_source': {
                'well_header': ''
            },
            'second_fpd_source': {
                'production_data': ''
            },
            'third_fpd_source': {
                'forecast': ''
            },
            'fourth_fpd_source': {
                'not_used': ''
            },
            'use_forecast_schedule_when_no_prod': 'yes'
        }

    production_data_resolution = 'same_as_forecast'

    escalation_start = {'apply_to_criteria': 0}

    prod_tax_escalation = {'escalation_model_1': 'none', 'escalation_model_2': 'none'}

    no_reversion = {
        'no_reversion': '',
        'balance': 'gross',
        'include_net_profit_interest': 'yes',
        'working_interest': '',
        'original_ownership': {
            'net_revenue_interest': '',
            'lease_net_revenue_interest': ''
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
        'net_profit_interest': ''
    }

    income_tax_para = {
        'state_tax': [{
            'start': 0,
            'end': 'inf',
            'value': 0
        }],
        'federal_tax': [{
            'start': 0,
            'end': 'inf',
            'value': 0
        }]
    }

    phase_risking = {'rows': [{'multiplier': 100, 'entire_well_life': 'Flat'}]}

    @staticmethod
    def fixed_exp():
        return {
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
            }]
        }

    water_disposal = {
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
        }]
    }

    oil_var_exp = DEFAULT_OIL_VAR_VALUES

    gas_var_exp = DEFAULT_GAS_VAR_VALUES

    ngl_drip_cond_var_exp = DEFAULT_NGL_DRIP_VALUES

    @staticmethod
    def diff():
        return {
            'oil': {
                'escalation_model': 'none',
                'rows': [{
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'gas': {
                'escalation_model': 'none',
                'rows': [{
                    'dollar_per_mmbtu': 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'ngl': {
                'escalation_model': 'none',
                'rows': [{
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            },
            'drip_condensate': {
                'escalation_model': 'none',
                'rows': [{
                    DOLLAR_PER_BBL: 0,
                    'entire_well_life': 'Flat'
                }]
            }
        }

    @staticmethod
    def well_stream():
        return {'rows': [{'count': 1, 'offset_to_fpd': {'start': 1, 'end': 1, 'period': 12, 'end_date': 'Econ Limit'}}]}

    reversion_tied_to = {'as_of': ''}
