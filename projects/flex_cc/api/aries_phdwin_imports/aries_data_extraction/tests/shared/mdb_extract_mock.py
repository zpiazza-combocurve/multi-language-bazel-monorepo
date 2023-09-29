import copy
import datetime

import pandas as pd
from bson import ObjectId

from api.aries_phdwin_imports.aries_data_extraction.tests.constants import AC_PROPERTY_TABLE, CUSTOM_TABLE_dict
from api.aries_phdwin_imports.aries_data_extraction.tests.shared.error_mock import ErrorReportMock
from combocurve.shared.aries_import_enums import ARIES_FILES_LABEL, AriesFilesEnum, FileDir, PhaseEnum
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults


class AriesDataExtractionMock:
    def __init__(self, **kwargs):
        self.log_report = ErrorReportMock()
        self.AC_PROPERTY_df = pd.DataFrame(AC_PROPERTY_TABLE)
        self.at_symbol_mapping = {FileDir.m.value: [self.AC_PROPERTY_df, ARIES_FILES_LABEL[AriesFilesEnum.ac_property]]}
        self.dates_1_base_date = None
        self.CUSTOM_TABLE_dict = CUSTOM_TABLE_dict
        self.capex_data_list = []
        self.well_count_by_phase_obj_dict = {PhaseEnum.oil.value: [], PhaseEnum.gas.value: [], 'inj': []}
        self.default_well_count_for_major_phase = {'oil': False, 'gas': False}

        self.escalation_segment_param = {}
        self.owl_overlay = []
        self.ignore_overhead = False
        self.major_phase = None

        self.at_symbol_mapping_dic = {
            FileDir.m.value: [self.AC_PROPERTY_df, ARIES_FILES_LABEL[AriesFilesEnum.ac_property]]
        }

        self.main_tax_unit = {
            PhaseEnum.oil.value: None,
            PhaseEnum.gas.value: None,
            PhaseEnum.ngl.value: None,
            PhaseEnum.aries_condensate.value: None
        }

        self.common_default_lines = {
            "DEFAULT": [],
            "COMMON": [
                ["S/709", "S/280 X FRAC TO LIFE MUL 371"],
                ["S/709", "S/709 X $/M TO LIFE PLUS S/279"],
                ["S/823", "0.167 X FRAC TO LIFE MUL S/816"],
                ["S/823", "S/823 X FRAC TO LIFE MUL S/815"],
                ["S/823", "S/823 X FRAC TO LIFE MUL S/819"],
                ["S/426", "S/371 X FRAC TO LIFE MUL 146"],
                ["S/380", "S/370 X B/M TO LIFE PLUS S/376"],
                ["S/382", "S/370 X B/M TO LIFE PLUS S/376"],
                ["S/896", "S/272 X $/M TO LIFE MUL S/95"],
            ],
        }

        self.projects_dic = {
            ObjectId(b'project_test'): {
                'history': {
                    'nameChange': [],
                    'scenarioDeleted': [],
                    'permChange': []
                },
                'wells': [],
                'scenarios': [ObjectId(b'scenari_test')],
                'name': 'Aries Project',
                'createdBy': ObjectId(b'user_test123'),
                'createdAt': datetime.datetime(2020, 1, 1),
                'updatedAt': datetime.datetime(2020, 1, 1),
                '_id': ObjectId(b'project_test'),
            }
        }

        self.scenarios_dic = self.get_scenarios_obj()

        # Update on demand the default value of the previous attributes or create new ones
        if kwargs:
            self.__dict__.update(kwargs)

    @classmethod
    def read_start(cls, ls_expression, propnum, scenario, error_model, section, is_list=False):
        if '/' in ls_expression[0]:
            return ls_expression[0]
        return '02/2023'

    @classmethod
    def get_scenarios_obj(cls):
        obj = cls.get_default_format('scenarios')
        obj['name'] = 'WFS'

        return {ObjectId(b'scenari_test'): obj}

    @classmethod
    def compare_and_save_into_self_data_list(cls, document, ls, *args, **kwargs):
        ls.append(copy.deepcopy(document))

    @classmethod
    def get_default_format(cls, document_name):
        format_dic = {}
        default_qualifier_key = 'default'

        default_scenario_column = {
            'activeQualifier': default_qualifier_key,
            'qualifiers': {
                default_qualifier_key: {
                    'name': 'Default',
                },
            },
        }

        format_dic['pricing'] = {
            # need to give a name
            "name": "",
            "typeCurve": None,
            # need to belong to a project
            "project": "",
            "unique": False,
            # need to belong to a well
            "wells": set(),  # not in CC format
            "assumptionKey": "pricing",
            "assumptionName": "Pricing",
            "econ_function": {
                "price_model": {
                    "oil": {
                        "cap": '',
                        "escalation_model": 'none',
                        "rows": [{
                            "cap": '',
                            "price": 55,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "gas": {
                        "cap": '',
                        "escalation_model": 'none',
                        "rows": [{
                            "cap": '',
                            "dollar_per_mmbtu": 3,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "ngl": {
                        "cap": '',
                        "escalation_model": 'none',
                        "rows": [{
                            "cap": '',
                            "pct_of_oil_price": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "drip_condensate": {
                        "cap": '',
                        "escalation_model": 'none',
                        "rows": [{
                            "cap": '',
                            "pct_of_oil_price": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    }
                },
                "breakeven": {
                    "npv_discount": 0,
                    "based_on_price_ratio": 'no',
                    "price_ratio": ""
                }
            },
            "createdBy": 'UserTest',
            "createdAt": datetime.datetime(2020, 1, 1),
            "updatedAt": datetime.datetime(2020, 1, 1),
            # "lastUpdatedBy": ''
        }

        fixed_exp = {
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

        format_dic['capex'] = {
            'name': '',
            'typeCurve': None,
            'project': '',
            'unique': False,
            'wells': set(),  # not in CC format
            'assumptionKey': 'capex',
            'assumptionName': 'CAPEX',
            'econ_function': {
                'other_capex': {
                    'rows': [{
                        'date': '01/2020',
                        'category': 'drilling',
                        'description': '',
                        'tangible': 0,
                        'intangible': 0,
                        'offset_to_fpd': -120,
                        'capex_expense': 'capex',
                        'after_econ_limit': 'no',
                        'calculation': 'gross',
                        'depreciation_model': 'none',
                        'deal_terms': 1
                    }]
                }
            },
            'createdBy': 'UserTest',
            'createdAt': datetime.datetime(2020, 1, 1),
            'updatedAt': datetime.datetime(2020, 1, 1)
        }

        format_dic['scenarios'] = {
            'history': {
                'nameChange': [],
                'scenarioDeleted': [],
                'permChange': []
            },
            'wells': [],
            'name': '',
            'project': ObjectId(b'project_test'),
            'schemaVersion': 2,
            'general_options': '',
            'createdBy': ObjectId(b'user_test123'),
            'createdAt': datetime.datetime(2020, 1, 1),
            'updatedAt': datetime.datetime(2020, 1, 1),
            'columns': {
                'capex': default_scenario_column,
                'dates': default_scenario_column,
                'depreciation': default_scenario_column,
                'escalation': default_scenario_column,
                'expenses': default_scenario_column,
                'forecast': default_scenario_column,
                'forecast_p_series': default_scenario_column,
                'ownership_reversion': default_scenario_column,
                'pricing': default_scenario_column,
                'differentials': default_scenario_column,
                'production_taxes': default_scenario_column,
                'production_vs_fit': default_scenario_column,
                'reserves_category': default_scenario_column,
                'risking': default_scenario_column,
                'schedule': default_scenario_column,
                'stream_properties': default_scenario_column,
                'network': default_scenario_column,
            },
        }

        gas_shrinkage = 'shrunk'
        oil_shrinkage = 'unshrunk'

        format_dic['tax'] = {
            "name": "",
            "typeCurve": None,
            "project": "",
            "unique": False,
            "wells": set(),  # not in CC format
            "assumptionKey": "production_taxes",
            "assumptionName": "Production Taxes",
            "econ_function": {
                "ad_valorem_tax": {
                    "deduct_severance_tax": "no",  # aries default is yes
                    "calculation": "nri",
                    'shrinkage_condition': 'shrunk',
                    'rate_type': 'net_sales',  # not sure which volume ARIES uses
                    "escalation_model": copy.deepcopy(EconModelDefaults.prod_tax_escalation),
                    'rows_calculation_method': 'non_monotonic',
                    "rows": [{
                        "pct_of_revenue": 0,
                        "dollar_per_boe": 0,
                        "entire_well_life": "Entire Well Life"
                    }]
                },
                "severance_tax": {
                    "auto_calculation": "no",
                    "calculation": "nri",
                    'shrinkage_condition': 'shrunk',
                    'state': 'custom',
                    'rate_type': 'gross_well_head',  # not sure which volume ARIES uses
                    'rows_calculation_method': 'non_monotonic',
                    "oil": {
                        "escalation_model": copy.deepcopy(EconModelDefaults.prod_tax_escalation),
                        "rows": [{
                            "pct_of_revenue": 0,
                            "dollar_per_bbl": 0,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "gas": {
                        "escalation_model": copy.deepcopy(EconModelDefaults.prod_tax_escalation),
                        "rows": [{
                            "pct_of_revenue": 0,
                            "dollar_per_mcf": 0,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "ngl": {
                        "escalation_model": copy.deepcopy(EconModelDefaults.prod_tax_escalation),
                        "rows": [{
                            "pct_of_revenue": 0,
                            "dollar_per_bbl": 0,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "drip_condensate": {
                        "escalation_model": copy.deepcopy(EconModelDefaults.prod_tax_escalation),
                        "rows": [{
                            "pct_of_revenue": 0,
                            "dollar_per_bbl": 0,
                            "entire_well_life": "Entire Well Life"
                        }]
                    }
                }
            },
            "createdBy": 'UserTest',
            "createdAt": datetime.datetime(2020, 1, 1),
            "updatedAt": datetime.datetime(2020, 1, 1),
            # "lastUpdatedBy": ""
        }

        format_dic['expense'] = {
            "name": "",
            "typeCurve": None,
            "project": "",
            "unique": False,
            "wells": set(),
            "assumptionKey": "expenses",
            "assumptionName": "Expenses",
            "econ_function": {
                "variable_expenses": {
                    # "phase": "",
                    "oil": {
                        "gathering": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            oil_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "processing": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            oil_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "transportation": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            oil_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "nri",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            # },
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "marketing": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            oil_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "other": {
                            "description":
                            "",
                            "shrinkage_condition":
                            oil_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        }
                    },
                    "gas": {
                        "gathering": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            gas_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_mmbtu": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "processing": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            gas_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_mmbtu": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "transportation": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            gas_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_mmbtu": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "marketing": {
                            # "conditions": {
                            "description":
                            "",
                            "shrinkage_condition":
                            gas_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_mmbtu": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "other": {
                            "description":
                            "",
                            "shrinkage_condition":
                            gas_shrinkage,
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_mmbtu": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        }
                    },
                    "ngl": {
                        "gathering": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "processing": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "transportation": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "marketing": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "other": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        }
                    },
                    "drip_condensate": {
                        "gathering": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "processing": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "transportation": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "marketing": {
                            # "conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            # "effect_econ_limit": "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "other": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            "deduct_before_severance_tax":
                            "no",
                            "deduct_before_ad_val_tax":
                            "no",
                            "cap":
                            "",
                            "deal_terms":
                            1,
                            'rate_type':
                            'gross_well_head',  # not sure which volume ARIES uses
                            'rows_calculation_method':
                            'non_monotonic',
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        }
                    }
                },
                "fixed_expenses": {
                    'monthly_well_cost': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_1': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_2': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_3': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_4': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_5': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_6': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_7': copy.deepcopy(fixed_exp),
                    'other_monthly_cost_8': copy.deepcopy(fixed_exp),
                },
                "water_disposal": {
                    # "conditions": {
                    "escalation_model":
                    "none",
                    "calculation":
                    "wi",
                    "affect_econ_limit":
                    "yes",
                    # "effect_econ_limit": "yes",
                    "deduct_before_severance_tax":
                    "no",
                    "deduct_before_ad_val_tax":
                    "no",
                    "cap":
                    "",
                    "deal_terms":
                    1,
                    'rate_type':
                    'gross_well_head',  # not sure which volume ARIES uses
                    'rows_calculation_method':
                    'non_monotonic',
                    "rows": [{
                        "cap": "",
                        "escalation_model": "none",
                        "dollar_per_bbl": 0,
                        "entire_well_life": "Entire Well Life"
                    }]
                },
                "carbon_expenses": {
                    "category": "co2e",
                    "co2e": {
                        "description": "",
                        "escalation_model": "none",
                        "calculation": "wi",
                        "affect_econ_limit": "yes",
                        "deduct_before_severance_tax": "no",
                        "deduct_before_ad_val_tax": "no",
                        "cap": "",
                        "deal_terms": 1,
                        "rate_type": "gross_well_head",
                        "rows_calculation_method": "non_monotonic",
                        "rows": [{
                            "carbon_expense": 0,
                            "entire_well_life": "Flat"
                        }]
                    },
                    "co2": {
                        "description": "",
                        "escalation_model": "none",
                        "calculation": "wi",
                        "affect_econ_limit": "yes",
                        "deduct_before_severance_tax": "no",
                        "deduct_before_ad_val_tax": "no",
                        "cap": "",
                        "deal_terms": 1,
                        "rate_type": "gross_well_head",
                        "rows_calculation_method": "non_monotonic",
                        "rows": [{
                            "carbon_expense": 0,
                            "entire_well_life": "Flat"
                        }]
                    },
                    "ch4": {
                        "description": "",
                        "escalation_model": "none",
                        "calculation": "wi",
                        "affect_econ_limit": "yes",
                        "deduct_before_severance_tax": "no",
                        "deduct_before_ad_val_tax": "no",
                        "cap": "",
                        "deal_terms": 1,
                        "rate_type": "gross_well_head",
                        "rows_calculation_method": "non_monotonic",
                        "rows": [{
                            "carbon_expense": 0,
                            "entire_well_life": "Flat"
                        }]
                    },
                    "n2o": {
                        "description": "",
                        "escalation_model": "none",
                        "calculation": "wi",
                        "affect_econ_limit": "yes",
                        "deduct_before_severance_tax": "no",
                        "deduct_before_ad_val_tax": "no",
                        "cap": "",
                        "deal_terms": 1,
                        "rate_type": "gross_well_head",
                        "rows_calculation_method": "non_monotonic",
                        "rows": [{
                            "carbon_expense": 0,
                            "entire_well_life": "Flat"
                        }]
                    }
                }
            },
            'createdBy': 'UserTest',
            'createdAt': datetime.datetime(2020, 1, 1),
            'updatedAt': datetime.datetime(2020, 1, 1)
        }

        return format_dic[document_name]
