import numpy as np
from api.aries_phdwin_imports.error import ErrorReport
from combocurve.shared.aries_import_enums import CCSchemaEnum
from combocurve.shared.econ_tools.econ_to_options import add_options
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from api.aries_phdwin_imports.helpers import (calculate_start_date_index, MAX_DATE_INDEX, update_asof_default_aries,
                                              name_and_save_model_for_data_list, OWNERSHIP_KEYS)

from bson.objectid import ObjectId

import datetime
import copy

import pandas as pd

pd.options.mode.chained_assignment = None


class DataExtraction:
    """
    Parent Class
    shared methods between PHDWind and Aries data extraction
    """
    def __init__(self, user_id, context, batch_number):
        self.context = context
        self.batch_number = batch_number
        # initialize document list for insert_many into mongodb
        self.dates_data_list = []
        self.ownership_data_list = []
        self.price_data_list = []
        self.differential_data_list = []
        self.capex_data_list = []
        self.tax_data_list = []
        self.reserves_data_list = []
        self.expense_data_list = []
        self.stream_properties_data_list = []
        self.escalation_data_list = []
        self.risking_data_list = []
        self.actual_forecast_data_list = []
        self.max_date_index = MAX_DATE_INDEX
        self.well_days_data_list = []
        self.well_months_data_list = []
        self.elt_data_list = []
        self.well_daily_data = pd.DataFrame([])
        self.well_monthly_data = pd.DataFrame([])

        # could be potentailly use for increase the import speed, ex: {'5cb8aef1b986470c40761f18': well_header_document}
        self.wells_dic = {}

        # could be potentailly use for increase the import speed, ex: {'5cb8aef1b986470c40761f18': well_header_document}
        self.points_dic = {}

        # for creating unique _id
        self.current_all_id_dictionary = {}

        self.user_id = user_id  # integration
        # datess_1
        self.dates_1_life = 0
        self.dates_1_base_date = None

        # the only_project_id
        self.project_id = None
        self.general_options_model_id = None
        self.dates_model_id = None
        self.actual_or_forecast_id = None
        self.as_of_date = None
        self.log_report = ErrorReport()

    def get_default_format(self, collection_name):
        def get_default_scenario_column():
            return {
                'activeQualifier': 'default',
                'qualifiers': {
                    'default': {
                        'name': 'Default',
                    },
                },
            }

        format_dic = {}

        default_qualifier_key = 'default'
        model_key = 'model'
        p_series_key = 'best'

        default_schema_dic = {default_qualifier_key: {model_key: None}}
        default_schema_dic_pseries = copy.deepcopy(default_schema_dic)
        default_schema_dic_pseries[default_qualifier_key][model_key] = p_series_key

        format_dic['ownership'] = {

            # need to give a name
            "name": "",
            # need to belong to a project
            "project": "",
            "unique": False,
            "typeCurve": None,
            # need to belong to a well
            "wells": set(),  # not in CC format
            "assumptionKey": "ownership_reversion",
            "assumptionName": "Ownership and Reversion",
            "econ_function": {
                "ownership": {
                    "initial_ownership": {
                        "working_interest": 100,
                        "original_ownership": {
                            "net_revenue_interest": 75,
                            "lease_net_revenue_interest": 75
                        },
                        "oil_ownership": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        },
                        "gas_ownership": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        },
                        "ngl_ownership": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        },
                        "drip_condensate_ownership": {
                            "net_revenue_interest": "",
                            "lease_net_revenue_interest": ""
                        },
                        "net_profit_interest_type": "expense",
                        "net_profit_interest": 0
                    },
                    "first_reversion": None,
                    "second_reversion": None,
                    "third_reversion": None,
                    "fourth_reversion": None,
                    "fifth_reversion": None,
                    "sixth_reversion": None,
                    "seventh_reversion": None,
                    "eighth_reversion": None,
                    "ninth_reversion": None,
                    "tenth_reversion": None,
                }
            },
            "createdBy": self.user_id,
            # need to give a create date object
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['wells'] = {
            'api14': None,  # { type: String, index: true },
            'chosenID': None,  # { type: Schema.Types.Mixed, index: true },
            'dataPool': 'external',  # { type: String,
            'dataSource': None,  # { type: String,
            'inptID': None,  # { type: String, index: true },
            'project': self.project_id,  # { type: Schema.ObjectId, ref: 'projects', default: null, index: true },
            # enum: ['external', 'internal'], default: 'internal', index: true },
            # enum: ['di', 'ihs', 'phdwin', 'aries', 'other'], default: 'other', index: true },
            'location': None,
            'toeLocation': None,
            'basin': None,  # { type: String, index: true },
            'county': None,  # { type: String, index: true },
            'current_operator': None,  # { type: String, index: true },
            'first_cluster_count': None,  # { type: Number, index: true },
            'first_fluid_per_perforated_interval': None,  # { type: Number, index: true },
            'first_prod_date': None,  # { type: Date, index: true, default: null },
            'first_prod_date_calc': None,  # { type: Date, index: true, default: null },
            'first_proppant_per_perforated_interval': None,  # { type: Number, index: true },
            'first_stage_count': None,  # { type: Number, index: true },
            'generic': None,  # { type: Boolean, index: true },
            'geohash': None,  # { type: String, index: true },
            'has_daily': False,  # { type: Boolean, index: true },
            'has_monthly': False,  # { type: Boolean, index: true },
            'hole_direction': None,  # { type: String, index: true },
            'landing_zone': None,  # { type: String, index: true },
            'lateral_length': None,  # { type: Number, default: null, index: true },
            'lease_name': None,  # { type: String, index: true },
            'pad_name': None,  # { type: String, index: true },
            'perf_lateral_length': None,  # { type: Number, default: null, index: true, required: true },
            'play': None,  # { type: String, index: true },
            'primary_product': None,  # { type: String, default: null, index: true },
            'refrac_date': None,  # { type: Date, index: true },
            'state': None,  # { type: String, index: true },
            'status': None,  # { type: String, index: true },
            'township': None,  # { type: String, index: true },
            'true_vertical_depth': None,  # { type: Number, default: null, index: true, required: true },
            'type_curve_area': None,  # { type: String, index: true },
            'well_name': None,  # { type: String, index: true },
            'chosenKeyID': None,  # String,
            'copied': None,  # Boolean,
            'copiedFrom': None,  # { type: Schema.ObjectId, ref: 'wells' },
            'dataSourceCustomName': None,  # String,
            'mostRecentImport': None,  # { type: Schema.ObjectId, ref: 'data-imports' },
            'wellCalcs': None,  # { type: Schema.ObjectId, ref: 'well-calcs' },
            'abstract': None,  # String,
            'acre_spacing': None,  # Number,
            'allocation_type': None,  # String,
            'api10': None,  # String,
            'api12': None,  # String,
            'aries_id': None,  # String,
            'azimuth': None,  # Number,
            'block': None,  # String,
            'casing_id': None,  # Number,
            'choke_size': None,  # Number,
            'completion_design': None,  # String,
            'completion_end_date': None,  # Date,
            'completion_start_date': None,  # Date,
            'country': None,  # String,
            'current_operator_alias': None,  # String,
            'current_operator_code': None,  # String,
            'current_operator_ticker': None,  # String,
            'date_rig_release': None,  # Date,
            'distance_from_base_of_zone': None,  # Number,
            'distance_from_top_of_zone': None,  # Number,
            'district': None,  # String,
            'drill_end_date': None,  # Date,
            'drill_start_date': None,  # Date,
            'elevation': None,  # Number,
            'elevation_type': None,  # String,
            'field': None,  # String,
            'first_additive_volume': None,  # Number,
            'first_fluid_volume': None,  # { type: Number, required: true },
            'first_frac_vendor': None,  # String,
            'first_max_injection_pressure': None,  # Number,
            'first_max_injection_rate': None,  # Number,
            'first_prop_weight': None,  # { type: Number, default: null, required: true },
            'first_proppant_per_fluid': None,  # Number,
            'first_test_flow_tbg_press': None,  # Number,
            'first_test_gas_vol': None,  # Number,
            'first_test_gor': None,  # Number,
            'first_test_oil_vol': None,  # Number,
            'first_test_water_vol': None,  # Number,
            'first_treatment_type': None,  # String,
            'flow_path': None,  # String,
            'fluid_type': None,  # String,
            'footage_in_landing_zone': None,  # Number,
            'formation_thickness_mean': None,  # Number,
            'gas_gatherer': None,  # String,
            'gas_specific_gravity': None,  # Number,
            'ground_elevation': None,  # Number,
            'hz_well_spacing_any_zone': None,  # Number,
            'hz_well_spacing_same_zone': None,  # Number,
            'initial_respress': None,  # Number,
            'initial_restemp': None,  # Number,
            'landing_zone_base': None,  # Number,
            'landing_zone_top': None,  # Number,
            'lease_number': None,  # String,
            'lower_perforation': None,  # Number,
            'matrix_permeability': None,  # Number,
            'measured_depth': None,  # { type: Number, default: null, required: true },
            'num_treatment_records': None,  # Number,
            'oil_api_gravity': None,  # Number,
            'oil_gatherer': None,  # String,
            'oil_specific_gravity': None,  # Number,
            'parent_child_any_zone': None,  # String,
            'parent_child_same_zone': None,  # String,
            'percent_in_zone': None,  # Number,
            'permit_date': None,  # Date,
            'phdwin_id': None,  # String,
            'porosity': None,  # Number,
            'previous_operator': None,  # String,
            'previous_operator_alias': None,  # String,
            'previous_operator_code': None,  # String,
            'previous_operator_ticker': None,  # String,
            'production_method': None,  # String,
            'proppant_mesh_size': None,  # String,
            'proppant_type': None,  # String,
            'range': None,  # String,
            'recovery_method': None,  # String,
            'refrac_additive_volume': None,  # Number,
            'refrac_cluster_count': None,  # Number,
            'refrac_fluid_per_perforated_interval': None,  # Number,
            'refrac_fluid_volume': None,  # Number,
            'refrac_frac_vendor': None,  # String,
            'refrac_max_injection_pressure': None,  # Number,
            'refrac_max_injection_rate': None,  # Number,
            'refrac_prop_weight': None,  # Number,
            'refrac_proppant_per_fluid': None,  # Number,
            'refrac_proppant_per_perforated_interval': None,  # Number,
            'refrac_stage_count': None,  # Number,
            'refrac_treatment_type': None,  # String,
            'section': None,  # Number,
            'sg': None,  # Number,
            'so': None,  # Number,
            'spud_date': None,  # Date,
            'stage_spacing': None,  # Number,
            'subplay': None,  # String,
            'surfaceLatitude': None,  # { type: Number, default: null, required: true },
            'surfaceLongitude': None,  # { type: Number, default: null, required: true },
            'survey': None,  # String,
            'sw': None,  # Number,
            'target_formation': None,  # String,
            'thickness': None,  # Number,
            'til': None,  # Date,
            'toeLatitude': None,  # Number,
            'toeLongitude': None,  # Number,
            'toe_in_landing_zone': None,  # String,
            'toe_up': None,  # String,
            'tubing_depth': None,  # Number,
            'tubing_id': None,  # Number,
            'upper_perforation': None,  # Number,
            'vt_well_spacing_any_zone': None,  # Number,
            'vt_well_spacing_same_zone': None,  # Number,
            'well_number': None,  # String,
            'well_type': None,  # String,
            # Calcs
            'total_additive_volume': None,  # Number,
            'total_cluster_count': None,  # Number,
            'total_fluid_volume': None,  # { type: Number, default: null },
            'total_prop_weight': None,  # { type: Number, default: null },
            'total_proppant_per_fluid': None,  # Number,
            # Indexed calcs
            'total_fluid_per_perforated_interval': None,  # { type: Number, index: true },
            'total_proppant_per_perforated_interval': None,  # { type: Number, index: true },
            'total_stage_count': None,  # { type: Number, index: true },

            # 3/29 new header item, never use or map
            # "operated": "",
            # "opex_area": "",
            # "lift_type": "",
            # "old_reserve_category": "",
            # "district": "",
            # "rig_name": "",
            # "prospect_area": ""
        }

        format_dic['projects'] = {
            "history": {
                "nameChange": [],
                "scenarioDeleted": [],
                "permChange": []
            },
            # need to include all wells from a file
            "wells": [],
            "scenarios": [],
            # "assumptionModels": [],
            # need to give a name
            "name": "company name as project name",
            #"users": [],
            # need to give a creat date object
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['points'] = {
            "location": {
                "type": "Point",
                "coordinates": [0, 0]  # longitude, latitude
            },
            "heelLocation": {
                "type": "Point",
                "coordinates": []
            },
            "toeLocation": {
                "type": "Point",
                "coordinates": []
            },
            "inptID": "",
            "well": "",
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
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['differentials'] = {
            # need to give a name
            "name": "",
            "typeCurve": None,
            # need to belong to a project
            "project": "",
            "unique": False,
            # need to belong to a well
            "wells": set(),  # not in CC format
            "assumptionKey": "differentials",
            "assumptionName": "Differentials",
            "econ_function": {
                "differentials": {
                    "differentials_1": EconModelDefaults.diff(),
                    "differentials_2": EconModelDefaults.diff(),
                    "differentials_3": EconModelDefaults.diff(),
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['general_options'] = {
            "name": "",
            "typeCurve": None,
            "project": '',
            "unique": False,
            "assumptionKey": "general_options",
            "assumptionName": "General Options",
            "econ_function": {
                "income_tax": {
                    "state_income_tax": {
                        "rows": [{
                            "multiplier": 0,
                            "entire_well_life": "Flat"
                        }]
                    },
                    "federal_income_tax": {
                        "rows": [{
                            "multiplier": 0,
                            "entire_well_life": "Flat"
                        }]
                    }
                },
                "boe_conversion": {
                    "oil": 1,
                    "wet_gas": 6,
                    "dry_gas": 6,
                    "ngl": 1,
                    "drip_condensate": 1
                },
                "reporting_units": {
                    "oil": "MBBL",
                    "gas": "MMCF",
                    "ngl": "MBBL",
                    "drip_condensate": "MBBL",
                    "water": "MBBL",
                    "pressure": "PSI",
                    "cash": "M$",
                    "water_cut": "BBL/BOE",
                    "gor": "CF/BBL",
                    "condensate_gas_ratio": "BBL/MMCF",
                    "drip_condensate_yield": "BBL/MMCF",
                    "ngl_yield": "BBL/MMCF"
                },
                "main_options": {
                    #"analysis_type": "working_interest",
                    "aggregation_date": "2021-01-01",
                    "currency": "USD",
                    "reporting_period": "calendar",
                    "fiscal": "",
                    "income_tax": "no",
                    #"output_report_version": "sec",
                    "project_type": "primary_recovery"
                },
                "discount_table": {
                    "discount_method":
                    "yearly",
                    "cash_accrual_time":
                    "mid_month",
                    "first_discount":
                    10,
                    "second_discount":
                    15,
                    "rows": [{
                        "discount_table": 0
                    }, {
                        "discount_table": 2
                    }, {
                        "discount_table": 5
                    }, {
                        "discount_table": 8
                    }, {
                        "discount_table": 10
                    }, {
                        "discount_table": 12
                    }, {
                        "discount_table": 15
                    }, {
                        "discount_table": 20
                    }, {
                        "discount_table": 25
                    }, {
                        "discount_table": 30
                    }, {
                        "discount_table": 40
                    }, {
                        "discount_table": 50
                    }, {
                        "discount_table": 60
                    }, {
                        "discount_table": 70
                    }, {
                        "discount_table": 80
                    }, {
                        "discount_table": 100
                    }]
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['dates'] = {
            "copiedFrom": None,
            "typeCurve": None,
            "unique": False,
            "name": '',
            "project": '',
            "assumptionKey": "dates",
            "assumptionName": "Dates",
            "econ_function": {
                "dates_setting": {
                    "max_well_life": 50,
                    "as_of_date": {
                        "fpd": ""
                    },
                    "discount_date": {
                        "fpd": ""
                    },
                    "cash_flow_prior_to_as_of_date": "no",
                    "production_data_resolution": "same_as_forecast",
                    "fpd_source_hierarchy": EconModelDefaults.fpd_source_hierarchy(),
                    "base_date": ""
                },
                "cut_off": {
                    "max_cum_cash_flow": "",
                    "include_capex": "no",
                    "discount": 0,
                    "econ_limit_delay": 0,
                    "side_phase_end": 'no'
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['capex'] = {
            "name": "",
            "typeCurve": None,
            "project": "",
            "unique": False,
            "wells": set(),  # not in CC format
            "assumptionKey": "capex",
            "assumptionName": "CAPEX",
            "econ_function": {
                "other_capex": {
                    "rows": [{
                        "category": "drilling",
                        "description": "",
                        "tangible": 0,
                        "intangible": 0,
                        "offset_to_fpd": -120,
                        "capex_expense": "capex",
                        'after_econ_limit': 'no',
                        "calculation": "gross",
                        "escalation_model": "none",
                        'escalation_start': copy.deepcopy(EconModelDefaults.escalation_start),
                        "depreciation_model": "none",
                        "deal_terms": 1
                    }]
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ""
        }

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
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ""
        }
        gas_shrinkage = 'shrunk'
        oil_shrinkage = 'unshrunk'
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
                    #"phase": "",
                    # TODO: Fix JSON structure indentation
                    "oil": {
                        "gathering": {
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #},
                            "rows": [{
                                "cap": "",
                                "escalation_model": "none",
                                "dollar_per_bbl": 0,
                                "entire_well_life": "Entire Well Life"
                            }]
                        },
                        "marketing": {
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
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
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                            #"conditions": {
                            "description":
                            "",
                            "escalation_model":
                            "none",
                            "calculation":
                            "wi",
                            "affect_econ_limit":
                            "yes",
                            #"effect_econ_limit": "yes",
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
                "water_disposal": {
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
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": ''
        }

        format_dic['stream_properties'] = {
            "name": "",
            "typeCurve": None,
            "project": "",
            "unique": False,
            "wells": set(),
            "assumptionKey": "stream_properties",
            "assumptionName": "Stream Properties",
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            #"lastUpdatedBy": "",
            "econ_function": {
                "btu_content": {
                    "unshrunk_gas": 1000,
                    "shrunk_gas": 1000
                },
                "yields": {
                    'rate_type': 'gross_well_head',  # not sure which volume ARIES uses
                    'rows_calculation_method': 'non_monotonic',
                    "ngl": {
                        "rows": [{
                            "yield": 0,
                            "entire_well_life": "Entire Well Life",
                            "unshrunk_gas": "Unshrunk Gas"
                        }]
                    },
                    "drip_condensate": {
                        "rows": [{
                            "yield": 0,
                            "entire_well_life": "Entire Well Life",
                            "unshrunk_gas": "Unshrunk Gas"
                        }]
                    }
                },
                "shrinkage": {
                    'rate_type': 'gross_well_head',  # not sure which volume ARIES uses
                    'rows_calculation_method': 'non_monotonic',
                    "oil": {
                        "rows": [{
                            "pct_remaining": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "gas": {
                        "rows": [{
                            "pct_remaining": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    }
                },
                "loss_flare": {
                    'rate_type': 'gross_well_head',  # not sure which volume ARIES uses
                    'rows_calculation_method': 'monotonic',
                    "oil_loss": {
                        "rows": [{
                            "pct_remaining": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "gas_loss": {
                        "rows": [{
                            "pct_remaining": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    },
                    "gas_flare": {
                        "rows": [{
                            "pct_remaining": 100,
                            "entire_well_life": "Entire Well Life"
                        }]
                    }
                }
            }
        }

        format_dic['embedded-lookup-tables'] = {
            "configuration": {
                "caseInsensitiveMatching": True,
                "selectedHeaders": [],
                "selectedHeadersMatchBehavior": {}
            },
            "copiedFrom": None,
            "tags": [],
            "lines": [],
            "name": None,
            "assumptionKey": None,
            "project": None,
            "rules": [],
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            "__v": 0
        }

        format_dic['scenarios'] = {
            "history": {
                "nameChange": [],
                "scenarioDeleted": [],
                "permChange": []
            },
            "wells": [],
            "name": "",
            "project": "",
            "schemaVersion": 2,
            "general_options": "",
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            "columns": {
                "capex": get_default_scenario_column(),
                "dates": get_default_scenario_column(),
                "depreciation": get_default_scenario_column(),
                "escalation": get_default_scenario_column(),
                "expenses": get_default_scenario_column(),
                "forecast": get_default_scenario_column(),
                "forecast_p_series": get_default_scenario_column(),
                "ownership_reversion": get_default_scenario_column(),
                "pricing": get_default_scenario_column(),
                "differentials": get_default_scenario_column(),
                "production_taxes": get_default_scenario_column(),
                "production_vs_fit": get_default_scenario_column(),
                "reserves_category": get_default_scenario_column(),
                "risking": get_default_scenario_column(),
                "schedule": get_default_scenario_column(),
                "stream_properties": get_default_scenario_column(),
                "network": get_default_scenario_column(),
                "emission": get_default_scenario_column()
            },
        }

        format_dic['risking'] = {
            "unique": False,
            "typeCurve": None,
            "wells": set(),
            "name": "",
            "project": "",
            "assumptionKey": "risking",
            "assumptionName": "Risking",
            "econ_function": {
                "risking_model": {
                    'risk_prod': 'yes',
                    'risk_ngl_drip_cond_via_gas_risk': 'no',
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
                        }]
                    },
                    "well_stream": {
                        "rows": [{
                            "count": 1,
                            "offset_to_fpd": {
                                "start": 1,
                                "end": 12,
                                "period": 12,
                                "end_date": "Econ Limit"
                            }
                        }]
                    }
                },
                "shutIn": {
                    "rows": []
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now()
        }

        format_dic['production_vs_fit'] = {
            "unique": False,
            "typeCurve": None,
            "wells": set(),
            "name": "",
            "project": "",
            "assumptionKey": "production_vs_fit",
            "assumptionName": "Production Vs Fit",
            "econ_function": {
                "production_vs_fit_model": {
                    "ignore_hist_prod": "yes",  # ARIES default to ignore hist prod unless LOAD is used
                    "replace_missing_value": {
                        "oil": "yes",
                        "gas": "yes",
                        "water": "yes"
                    }
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now()
        }

        format_dic['depreciation'] = {
            "unique": False,
            "typeCurve": None,
            "wells": set(),
            "name": "",
            "project": "",
            "assumptionKey": "depreciation",
            "assumptionName": "Depreciation",
            "econ_function": {
                "depreciation_model": {
                    "rows": [{
                        "year": 1,
                        "factor": 30,
                        "cumulative": 30
                    }, {
                        "year": 2,
                        "factor": 30,
                        "cumulative": 60
                    }, {
                        "year": 3,
                        "factor": 20,
                        "cumulative": 80
                    }, {
                        "year": 4,
                        "factor": 20,
                        "cumulative": 100
                    }]
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }

        format_dic['escalation'] = {
            "unique": False,
            "typeCurve": None,
            "wells": set(),
            "name": "",
            "project": "",
            "assumptionKey": "escalation",
            "assumptionName": "Escalation",
            "econ_function": {
                'escalation_model': {
                    'escalation_frequency': 'yearly',
                    'calculation_method': 'compound',
                    "rows": [{
                        "pct_per_year": 0,
                        "entire_well_life": "Entire Well Life"
                    }]
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }

        format_dic['scenario_well_assignments'] = {
            "well": '',
            "scenario": '',
            "project": '',
            "general_options": '',
            "reserves_category": copy.deepcopy(default_schema_dic),
            "ownership_reversion": copy.deepcopy(default_schema_dic),
            "dates": copy.deepcopy(default_schema_dic),
            "forecast": copy.deepcopy(default_schema_dic),
            "forecast_p_series": default_schema_dic_pseries,
            "schedule": copy.deepcopy(default_schema_dic),
            "capex": copy.deepcopy(default_schema_dic),
            "pricing": copy.deepcopy(default_schema_dic),
            "differentials": copy.deepcopy(default_schema_dic),
            "stream_properties": copy.deepcopy(default_schema_dic),
            "expenses": copy.deepcopy(default_schema_dic),
            "production_taxes": copy.deepcopy(default_schema_dic),
            "production_vs_fit": copy.deepcopy(default_schema_dic),
            "risking": copy.deepcopy(default_schema_dic),
            'network': copy.deepcopy(default_schema_dic),
            'emission': copy.deepcopy(default_schema_dic),
            "schemaVersion": 3,
            "createdAt": '',
            "updatedAt": '',
        }

        format_dic['forecasts'] = {
            # "tags": {
            #     "ml": [],
            #     "auto": [],
            #     "manual": []
            # },
            #"hidden": False,
            #"private": True,
            "imported": True,
            "type": "deterministic",
            "forecasted": True,
            "wells": [],
            #"dataIds": [],
            "name": "",
            "user": self.user_id,
            "project": "",
            #"dataSize": 500,
            #"dataCount": 0,
            #"wellCount": 0,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            "running": False,
            "settings": {},
            "qFinal": {
                "gas": None,
                "oil": None,
                "water": None
            }
        }

        format_dic['forecast-datas'] = {
            'wells': [],
            'well': '',
            #'order': '',
            'forecast': '',
            'data': {},
            'project': '',
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
            'forecasted': True,
            'runDate': None,
            'diagDate': None,
            'status': 'in_progress',
            'forecastType': 'manual'
        }

        format_dic['well-forecasts'] = {'well': '', 'inptID': '', 'forecastDocs': []}

        format_dic['well-calcs'] = {
            "first_prod_date": None,
            "total_prop_weight": 0,
            "total_fluid_volume": 0,
            "well": None,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }

        format_dic['actual_or_forecast'] = {
            "unique": False,
            "copiedFrom": None,
            "typeCurve": None,
            "name": "",
            "options": {
                "production_vs_fit_model": {
                    "ignore_hist_prod": {
                        "label": "Yes",
                        "value": "yes"
                    },
                    "replace_actual": {
                        "subItems": {
                            "oil": {
                                "criteria": {
                                    "label": "Never",
                                    "value": "never",
                                    "staticValue": "",
                                    "fieldType": "static",
                                    "fieldName": "Never"
                                },
                                "value": "",
                                "criteriaHeader": True
                            },
                            "gas": {
                                "criteria": {
                                    "label": "Never",
                                    "value": "never",
                                    "staticValue": "",
                                    "fieldType": "static",
                                    "fieldName": "Never"
                                },
                                "value": "",
                                "criteriaHeader": True
                            },
                            "water": {
                                "criteria": {
                                    "label": "Never",
                                    "value": "never",
                                    "staticValue": "",
                                    "fieldType": "static",
                                    "fieldName": "Never"
                                },
                                "value": "",
                                "criteriaHeader": True
                            }
                        }
                    }
                }
            },
            "project": None,
            "assumptionKey": "production_vs_fit",
            "assumptionName": "Actual or Forecast",
            "econ_function": {
                "production_vs_fit_model": {
                    "ignore_hist_prod": "yes",
                    "replace_actual": {
                        "oil": {
                            "never": ""
                        },
                        "gas": {
                            "never": ""
                        },
                        "water": {
                            "never": ""
                        }
                    }
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }

        format_dic['reserves_category'] = {
            "copiedFrom": None,
            "unique": False,
            "name": "",
            "wells": set(),
            "project": None,
            "assumptionKey": "reserves_category",
            "assumptionName": "Reserves Category",
            "econ_function": {
                "reserves_category": {
                    "prms_resources_class": "reserves",
                    "prms_reserves_category": "proved",
                    "prms_reserves_sub_category": "producing"
                }
            },
            "createdBy": self.user_id,
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now(),
        }

        return format_dic[collection_name]

    def delete_common_key_for_deep_compare(self, deepcopy_document):
        del deepcopy_document['name']
        del deepcopy_document['project']
        del deepcopy_document['wells']
        del deepcopy_document['createdBy']
        del deepcopy_document['createdAt']
        del deepcopy_document['updatedAt']
        #del deepcopy_document['lastUpdatedBy']

        # if the document never save into self_data_list, it will not have 'options' key
        try:
            del deepcopy_document['options']
        except Exception:
            # this document is being comparing
            pass

        # for Aries econ model, every model document will have _id which need to be deleted
        # (PhDwin econ model will not have)
        try:
            del deepcopy_document['_id']
        except Exception:
            # this document does not have _id, this document is from PhDWins
            pass

        return deepcopy_document

    def compare_and_save_into_self_data_list(self, document, ls, projects_dic, model_name=None, aries=False):
        '''
        save only the unique models into the self.model_name_data_list
        '''
        max_idx = 0
        repeat = False
        deepcopy_document = document.copy()
        deepcopy_document = self.delete_common_key_for_deep_compare(deepcopy_document)
        for exist_document in ls:
            deepcopy_exist_document = exist_document.copy()
            deepcopy_exist_document = self.delete_common_key_for_deep_compare(deepcopy_exist_document)
            if deepcopy_document == deepcopy_exist_document and deepcopy_document[
                    CCSchemaEnum.assumption_key.value] != 'ownership_reversion':
                exist_document[CCSchemaEnum.wells.value].add(next(iter(document[CCSchemaEnum.wells.value])))
                repeat = True
                break

            if deepcopy_document[CCSchemaEnum.assumption_key.value] == 'ownership_reversion':
                max_idx = int(ls[-1][CCSchemaEnum.name.value].rsplit('_', 1)[-1])
                break

            if model_name == exist_document[CCSchemaEnum.name.value].rsplit('_', 1)[0] or model_name is None:
                try:
                    idx = int(exist_document[CCSchemaEnum.name.value].split('_')[-1])
                    if idx > max_idx:
                        max_idx = idx
                except (TypeError, ValueError):  # handle for Reserve Category naming
                    pass

        if not repeat:
            (self.general_options_model_id, self.dates_model_id, self.dates_1_life, self.dates_1_base_date,
             self.as_of_date) = name_and_save_model_for_data_list(document, model_name, max_idx, ls, projects_dic,
                                                                  self.batch_number, self.general_options_model_id,
                                                                  self.dates_model_id, self.dates_1_life,
                                                                  self.dates_1_base_date, self.as_of_date, add_options,
                                                                  aries)

    def update_project_default_assumption(self, project_document, model_document):
        '''
        update project_document defaultAssumptions with each model_document_1

        ex: capex, risking, expenses, general_options, production_taxes, production_vs_fit
        ex: stream_properties, ownership_reversion, pricing, differentials
        '''
        default_assumptions_dic = {
            'capex': 'capex',
            'risking': 'risking',
            'expenses': 'expenses',
            'general_options': 'general_options',
            'production_taxes': 'production_taxes',
            'production_vs_fit': 'productin_vs_fit',
            'stream_properties': 'stream_properties',
            'ownership_reversion': 'ownership_reversion',
            'pricing': 'pricing',
            'differentials': 'differentials'
        }

        if model_document['assumptionKey'] in default_assumptions_dic:
            project_document['defaultAssumptions'][model_document['assumptionKey']] = model_document['_id']

    # def update_all_id_from_all_collections_documents(self):
    #     '''
    #     output: all _id(primary key) from documents in all collecitons
    #     ex: _id(primary key) as key in a dictionary
    #     '''
    #     # 9/4 2019 give primary_id without checking if repeat or not
    #     # therefore this function is deprecated
    #     all_documents_id_list = []

    #     for collection_name in self.db.list_collection_names():
    #         # need to use add
    #         # (do not use append here, which will casue error since will create [[], [], []], list inside list)
    #         # ex: [ObjectId('5c802547b986471120847d48')] += [ObjectId('5c802547b986471120847d49')]
    #         all_documents_id_list += self.db[collection_name].distinct('_id')

    #     self.current_all_id_dictionary = dict(zip(all_documents_id_list, range(0, len(all_documents_id_list) - 1)))

    def create_point_document_format(self, document):
        '''
        lack of well information since well_header haven't been import into db, there's no _id generated yet
        'well' need to be update later when well_header is impoeted
        '''
        # get default format
        point_default_document = self.get_default_format('points')
        # fill in the deault format from document
        #point_default_document['location']['coordinates'].append(document['surface_longitude_wgs84'])
        #point_default_document['location']['coordinates'].append(document['surface_latitude_wgs84'])
        point_default_document['location']['coordinates'] = [
            document['surface_longitude_wgs84'], document['surface_latitude_wgs84']
        ]

        point_default_document['inptID'] = document['inptID']
        point_default_document['well'] = None
        return point_default_document

    def get_inptid_wellid_from_well_header(self, exist_wells_document, document):
        '''
        document is actually in dictionary format
        use well_header_document in database to fetch the _id as well and inptID
        '''
        if exist_wells_document:
            document['inptID'] = exist_wells_document['inptID']
            document['well'] = exist_wells_document['_id']
        return document

    def forecast_datas_format_v2_to_v3(self, forecast_datas_ls_v2):
        '''
        convert each forecast_data document from version2 to version3
        input: forecast_datas_ls_v2
        output: forecast_datas_ls_v3

        noted: need to put P_dict, P_extra, phase to top level (no longer nested)
        '''
        forecast_datas_ls_v3 = []
        phase_ls = ['gas', 'oil', 'water']
        for document in forecast_datas_ls_v2:
            copy_document = copy.deepcopy(document)

            # delet not use key
            del copy_document['data']

            for phase in phase_ls:
                copy_document['_id'] = ObjectId()
                copy_document['phase'] = phase
                copy_document['P_dict'] = copy.deepcopy(document['data'][phase]['P_dict'])

                if len(document['data'][phase]['P_dict']['best']['segments']) == 0:
                    copy_document['forecasted'] = False
                else:
                    copy_document['forecasted'] = True

                copy_document['forecastType'] = 'rate'
                copy_document['p_extra'] = {}
                copy_document['forecastSubType'] = 'imported'

                copy_document['ratio'] = {}
                copy_document['warning'] = {"status": False, "message": ""}
                copy_document['model_name'] = ''
                copy_document['data_freq'] = 'monthly'

                try:
                    # if basePhase exists change document format to ratio
                    if copy_document['forecasted']:
                        base_phase = copy.deepcopy(document['data'][phase]['basePhase'])
                        copy_document['phase'] = phase
                        copy_document['forecastType'] = 'ratio'
                        copy_document['ratio'] = copy.deepcopy(copy_document['P_dict']['best'])
                        copy_document['ratio']['basePhase'] = base_phase
                        copy_document['ratio']['x'] = 'time'
                        copy_document['P_dict'] = {}
                        copy_document['p_extra'] = {}
                except KeyError:
                    pass
                forecast_datas_ls_v3.append(copy.deepcopy(copy_document))
        return forecast_datas_ls_v3

    def check_every_model_have_at_least_one_assumption(self, project_default_document):
        '''
        check in assumptions collection have at least one model if it is needed
        ex: general_options, ownership, capex, price, tax, expense, stream_properties
        should have at least one model save in assumptions collection
        '''
        def fill_ownership_reversion_defaull_format(default_format):
            '''
            change ownership default format reversion from None to default format
            '''
            # give None segment a default empty obj
            reversion_default_obj = {
                "no_reversion": "",
                EconModelDefaults.reversion_tied_to.name: EconModelDefaults.reversion_tied_to.value,
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "working_interest": "",
                "original_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "oil_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "gas_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "ngl_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "drip_condensate_ownership": {
                    "net_revenue_interest": "",
                    "lease_net_revenue_interest": ""
                },
                "net_profit_interest": ""
            }

            for key in OWNERSHIP_KEYS:
                if default_format['econ_function']['ownership'][key] is None:
                    default_format['econ_function']['ownership'][key] = reversion_default_obj

            return default_format

        needed_model_ls = [
            'ownership_reversion', 'pricing', 'differentials', 'capex', 'production_taxes', 'expenses',
            'stream_properties', 'risking', 'production_vs_fit'
        ]

        model_name_convert_to_dafult_format_name = {
            'ownership_reversion': 'ownership',
            'pricing': 'pricing',
            'differentials': 'differentials',
            'capex': 'capex',
            'production_taxes': 'tax',
            'expenses': 'expense',
            'stream_properties': 'stream_properties',
            'risking': 'risking',
            'production_vs_fit': 'production_vs_fit'
        }

        for model_name in needed_model_ls:
            # add the only one model to project document, defaultAssumptions, in self.projects_dic
            # add default format for this model_name
            default_format = self.get_default_format(model_name_convert_to_dafult_format_name[model_name])
            default_format['name'] = model_name + '_1'
            default_format['project'] = project_default_document['_id']  # only have one project when uploading new file
            default_format['_id'] = ObjectId()
            default_format['createdAt'] = datetime.datetime.now()
            default_format['updatedAt'] = datetime.datetime.now()
            del default_format['wells']

            if model_name == 'ownership_reversion':
                default_format = fill_ownership_reversion_defaull_format(default_format)

            default_format = add_options(default_format)
            self.context.assumptions_collection.insert_one(default_format)

            project_default_document['defaultAssumptions'][model_name] = default_format['_id']

        return project_default_document

    def update_models_id_and_wells_id_to_project(self):
        '''
        when model is done, add models _id to project_document
        such as ownerhsip, capex, prices_taxes_expense, into project collection, and wells _id
        '''
        user_create_projects_document = self.context.project_collection.find_one({'_id': self.project_id})

        for _id in self.projects_dic:
            projects_exist_document = self.projects_dic[_id]
            projects_exist_document['wells'] = self.context.wells_collection.find({
                'project': self.project_id
            }).distinct('_id')  # there might have new wells _id when importing production and models data
            projects_exist_document['scenarios'] = self.context.scenarios_collection.find({
                'project': self.project_id
            }).distinct('_id')  # when uploading, only one scenarios is impoeted
            projects_exist_document['updatedAt'] = datetime.datetime.now()

            # use user create project name (not Aries or Phdwins project nmae)
            if user_create_projects_document:
                projects_exist_document['name'] = user_create_projects_document['name']

                # 01/06/2020 integration to website, need to update project since project already exist
                self.context.project_collection.update_one(
                    # if it can not fine the _id, it will not show error
                    {'_id': self.project_id},
                    {'$set': projects_exist_document},
                )
            else:
                # for testing local
                self.context.project_collection.insert_many(list(self.projects_dic.values()))

    def create_total_prop_weight_and_total_fluid_volume(self, well_calcs_default_document, well_document):
        '''
        create total prop weight and total fluid volume into well_calcs_default_document if exist
        '''
        # total prop weight
        try:
            well_calcs_default_document[
                'total_prop_weight'] = well_document['first_prop_weight'] + well_document['refrac_prop_weight']
        except Exception:
            pass

        # total fluid volume
        try:
            well_calcs_default_document[
                'total_fluid_volume'] = well_document['first_fluid_volume'] + well_document['refrac_fluid_volume']
        except Exception:
            pass
        return well_calcs_default_document

    def create_and_insert_actual_or_forecast_model(self, aries_import=False):
        '''
        create and insert the default actual_or_forecast model (only 1 default model for both phdwin and aries import)
        '''
        actual_or_forecast_default_document = self.get_default_format('actual_or_forecast')
        if aries_import:
            actual_or_forecast_default_document = update_asof_default_aries(actual_or_forecast_default_document)

        actual_or_forecast_default_document['_id'] = ObjectId()
        self.actual_or_forecast_id = actual_or_forecast_default_document['_id']

        key = 'ARIES' if aries_import else 'PHD'
        actual_or_forecast_default_document[
            'name'] = f'{key}_CC_{actual_or_forecast_default_document[CCSchemaEnum.assumption_key.value].upper()}'
        actual_or_forecast_default_document['project'] = self.project_id
        actual_or_forecast_default_document['createdAt'] = datetime.datetime.now()
        actual_or_forecast_default_document['updatedAt'] = datetime.datetime.now()

        self.context.assumptions_collection.insert_one(actual_or_forecast_default_document)

    def add_last_zero_row(self, key_ls, document):
        '''
        copy and add last obj in rows with 0 value and 'Econ Limit' for end_date
        '''
        end_date_is_not_2262 = False
        end_date_is_not_econ_limit = False
        obj = document['econ_function']
        for key in key_ls:
            obj = obj[key]
        if len(obj['rows']) > 1:
            copy_last_obj = copy.deepcopy(obj['rows'][-1])
            # '2262-04-11' is phdwin 65535 econ limit and 'Econ Limit' is aries econ limit
            if any(key in copy_last_obj for key in ['dates', 'offset_to_fpd', 'offset_to_as_of_date']):
                if 'dates' in copy_last_obj:
                    end_date_is_not_2262 = copy_last_obj['dates']['end_date'] != '2262-04-11'
                    end_date_is_not_econ_limit = copy_last_obj['dates']['end_date'] != 'Econ Limit'
                else:
                    offset_key = next(key for key in copy_last_obj if 'offset_to_' in key)
                    end_date_is_not_2262 = copy_last_obj[offset_key]['end'] != '2262-04-11' and copy_last_obj[
                        offset_key]['end'] != 1200
                    end_date_is_not_econ_limit = copy_last_obj[offset_key]['end'] != 'Econ Limit'
                if end_date_is_not_2262 and end_date_is_not_econ_limit:
                    for key in copy_last_obj:
                        if key == 'dates':
                            # handle dates key
                            copy_last_obj[key]['start_date'] = (pd.to_datetime(copy_last_obj[key]['end_date'])
                                                                + pd.DateOffset(days=1)).strftime('%Y-%m-%d')
                            copy_last_obj[key]['end_date'] = 'Econ Limit'
                        elif key in ['offset_to_fpd', 'offset_to_as_of_date']:
                            copy_last_obj[key]['start'] = copy_last_obj[key]['end'] + 1
                            copy_last_obj[key]['end'] = 'Econ Limit'
                            copy_last_obj[key]['period'] = 1200 - copy_last_obj[key]['start']
                        elif key == 'cap' or key == 'escalation_model':
                            # special for Aries
                            pass
                        else:
                            # handle other key, ex: fixed_expense, price, dollar_per_mcf, dollar_per_bbl,...
                            if key == 'multiplier':
                                copy_last_obj[key] = 100
                            else:
                                copy_last_obj[key] = 0
                    if 'escalation_model' in copy_last_obj:
                        copy_last_obj['escalation_model'] = 'none'
                    obj['rows'].append(copy_last_obj)
                else:
                    if 'dates' in obj['rows'][-1]:
                        obj['rows'][-1]['dates']['end_date'] = 'Econ Limit'
                    else:
                        obj['rows'][-1][offset_key]['end'] = 'Econ Limit'

            obj['rows'].pop(0)

        return document

    def general_adjust_recursion(self, key_collection, key_ls, document):
        '''
        resursive way to find all keys of various econ document (price, tax, expense)
        '''
        for key in key_collection:
            if key_collection[key] is None:
                document = self.add_last_zero_row(key_ls + [key], document)
            else:
                document = self.general_adjust_recursion(key_collection[key], key_ls + [key], document)

        return document

    def add_zero_to_end_of_row(self, document):
        '''
        add zero to each end of row for price, tax, expense filled document
        also pop the 0 index element
        '''
        assumption_key = document['assumptionKey']

        phase_option = {'gas': None, 'oil': None, 'ngl': None, 'drip_condensate': None}
        risk_phase_option = {
            'gas': None,
            'oil': None,
            'ngl': None,
            'drip_condensate': None,
            'water': None,
            'well_stream': None
        }
        expenses_option = {
            'gathering': None,
            'processing': None,
            'transportation': None,
            'marketing': None,
            'other': None
        }

        key_collection = {
            'pricing': {
                'price_model': phase_option
            },
            'differentials': {
                'differentials': {
                    'differentials_1': phase_option,
                    'differentials_2': phase_option,
                    'differentials_3': phase_option,
                }
            },
            'production_taxes': {
                'ad_valorem_tax': None,
                'severance_tax': phase_option
            },
            'expenses': {
                'variable_expenses': {
                    'gas': expenses_option,
                    'oil': expenses_option,
                    'ngl': expenses_option,
                    'drip_condensate': expenses_option
                },
                'fixed_expenses': {
                    'monthly_well_cost': None,
                    'other_monthly_cost_1': None,
                    'other_monthly_cost_2': None,
                    'other_monthly_cost_3': None,
                    'other_monthly_cost_4': None,
                    'other_monthly_cost_5': None,
                    'other_monthly_cost_6': None,
                    'other_monthly_cost_7': None,
                    'other_monthly_cost_8': None
                },
                'water_disposal': None
            },
            'risking': {
                'risking_model': risk_phase_option
            }
        }

        document = self.general_adjust_recursion(key_collection[assumption_key], [], document)

        return document

    def create_daily_format_via_ls(self, selected_df, source):  # noqa: C901
        '''
        11/19/2019
        create new data format for mongodb
        input selected_df from both phdwin and aries
        '''
        item_ls = [
            'water', 'oil', 'gas', 'choke', 'hours_on', 'shut_in_bh_pressure', 'flowing_bh_pressure',
            'flowing_tbg_pressure', 'shut_in_csg_pressure', 'flowing_csg_pressure', 'shut_in_tbg_pressure'
        ]

        # check if all value is None, then return True for all_none
        check_selected_df = selected_df[item_ls]
        if check_selected_df.isnull().all(axis=None):
            return selected_df, True

        daily_format_ls = []
        temp_document_ls = []
        month = None
        year = None
        last_index = selected_df.index[-1]

        for index_row, row in selected_df.iterrows():
            # one month is a document
            if row['month'] != month or row['year'] != year:
                # append temp_document_ls before create new month document
                if temp_document_ls:
                    # need to give each array 31 position
                    if len(temp_document_ls[3]) < 31:
                        no_of_none = 31 - len(temp_document_ls[3])

                        temp_document_ls[3] += [None] * no_of_none
                        temp_document_ls[4] += [None] * no_of_none
                        temp_document_ls[5] += [None] * no_of_none
                        temp_document_ls[6] += [None] * no_of_none
                        temp_document_ls[7] += [None] * no_of_none
                        temp_document_ls[8] += [None] * no_of_none
                        temp_document_ls[9] += [None] * no_of_none
                        temp_document_ls[10] += [None] * no_of_none
                        temp_document_ls[11] += [None] * no_of_none
                        temp_document_ls[12] += [None] * no_of_none
                        temp_document_ls[13] += [None] * no_of_none
                        temp_document_ls[14] += [None] * no_of_none

                    for idx in range(len(temp_document_ls[3])):
                        if temp_document_ls[3][idx] is not None:
                            temp_document_ls[2] = idx
                            break

                    daily_format_ls.append(temp_document_ls)
                # create new month document (daily production)
                # need to calcualte fist day of month
                no_of_none = int(row['day']) - 1
                default_ls = [None] * no_of_none
                start_index = calculate_start_date_index(row['year'], row['month'], 1)
                chosen_id = None
                first_production_index = no_of_none
                index = default_ls.copy() + [row['index']]
                water = default_ls.copy() + [row['water'] if (row['water'] is not None and row['water'] >= 0) else None]
                oil = default_ls.copy() + [row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None]
                gas = default_ls.copy() + [row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None]
                choke = default_ls.copy() + [row['choke'] if (row['choke'] is not None and row['choke'] >= 0) else None]
                hours_on = default_ls.copy() + [
                    row['hours_on'] if (row['hours_on'] is not None and row['hours_on'] >= 0) else None
                ]
                shut_in_bh_pressure = default_ls.copy() + [
                    row['shut_in_bh_pressure'] if
                    (row['shut_in_bh_pressure'] is not None and row['shut_in_bh_pressure'] >= 0) else None
                ]
                flowing_bh_pressure = default_ls.copy() + [
                    row['flowing_bh_pressure'] if
                    (row['flowing_bh_pressure'] is not None and row['flowing_bh_pressure'] >= 0) else None
                ]
                flowing_tbg_pressure = default_ls.copy() + [
                    row['flowing_tbg_pressure'] if
                    (row['flowing_tbg_pressure'] is not None and row['flowing_tbg_pressure'] >= 0) else None
                ]
                shut_in_csg_pressure = default_ls.copy() + [
                    row['shut_in_csg_pressure'] if
                    (row['shut_in_csg_pressure'] is not None and row['shut_in_csg_pressure'] >= 0) else None
                ]
                flowing_csg_pressure = default_ls.copy() + [
                    row['flowing_csg_pressure'] if
                    (row['flowing_csg_pressure'] is not None and row['flowing_csg_pressure'] >= 0) else None
                ]
                shut_in_tbg_pressure = default_ls.copy() + [
                    row['shut_in_tbg_pressure'] if
                    (row['shut_in_tbg_pressure'] is not None and row['shut_in_tbg_pressure'] >= 0) else None
                ]

                if all(row[item] is None for item in item_ls):
                    index = None

                temp_document_ls = [
                    start_index, chosen_id, first_production_index, index, water, oil, gas, choke, hours_on,
                    shut_in_bh_pressure, flowing_bh_pressure, flowing_tbg_pressure, shut_in_csg_pressure,
                    flowing_csg_pressure, shut_in_tbg_pressure
                ]

                year = row['year']
                month = row['month']
                day = row['day']
            else:
                # keep filling the exist month document (daily production)
                if row['day'] == day + 1:
                    if all(row[item] is None for item in item_ls):
                        temp_document_ls[3].append(None)
                    else:
                        temp_document_ls[3].append(row['index'])

                    temp_document_ls[4].append(row['water'] if (
                        row['water'] is not None and row['water'] >= 0) else None)
                    temp_document_ls[5].append(row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None)
                    temp_document_ls[6].append(row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None)
                    temp_document_ls[7].append(row['choke'] if (
                        row['choke'] is not None and row['choke'] >= 0) else None)
                    temp_document_ls[8].append(row['hours_on'] if (
                        row['hours_on'] is not None and row['hours_on'] >= 0) else None)
                    temp_document_ls[9].append(row['shut_in_bh_pressure'] if (
                        row['shut_in_bh_pressure'] is not None and row['shut_in_bh_pressure'] >= 0) else None)
                    temp_document_ls[10].append(row['flowing_bh_pressure'] if (
                        row['flowing_bh_pressure'] is not None and row['flowing_bh_pressure'] >= 0) else None)
                    temp_document_ls[11].append(row['flowing_tbg_pressure'] if (
                        row['flowing_tbg_pressure'] is not None and row['flowing_tbg_pressure'] >= 0) else None)
                    temp_document_ls[12].append(row['shut_in_csg_pressure'] if (
                        row['shut_in_csg_pressure'] is not None and row['shut_in_csg_pressure'] >= 0) else None)
                    temp_document_ls[13].append(row['flowing_csg_pressure'] if (
                        row['flowing_csg_pressure'] is not None and row['flowing_csg_pressure'] >= 0) else None)
                    temp_document_ls[14].append(row['shut_in_tbg_pressure'] if (
                        row['shut_in_tbg_pressure'] is not None and row['shut_in_tbg_pressure'] >= 0) else None)
                else:
                    if row['day'] <= day:
                        continue
                    for dummy_idx in range(int(row['day']) - (day + 1)):
                        temp_document_ls[3].append(None)
                        temp_document_ls[4].append(None)
                        temp_document_ls[5].append(None)
                        temp_document_ls[6].append(None)
                        temp_document_ls[7].append(None)
                        temp_document_ls[8].append(None)
                        temp_document_ls[9].append(None)
                        temp_document_ls[10].append(None)
                        temp_document_ls[11].append(None)
                        temp_document_ls[12].append(None)
                        temp_document_ls[13].append(None)
                        temp_document_ls[14].append(None)

                    if all(row[item] is None for item in item_ls):
                        temp_document_ls[3].append(None)
                    else:
                        temp_document_ls[3].append(row['index'])

                    temp_document_ls[4].append(row['water'] if (
                        row['water'] is not None and row['water'] >= 0) else None)
                    temp_document_ls[5].append(row['oil'] if (row['oil'] is not None and row['oil'] >= 0) else None)
                    temp_document_ls[6].append(row['gas'] if (row['gas'] is not None and row['gas'] >= 0) else None)
                    temp_document_ls[7].append(row['choke'] if (
                        row['choke'] is not None and row['choke'] >= 0) else None)
                    temp_document_ls[8].append(row['hours_on'] if (
                        row['hours_on'] is not None and row['hours_on'] >= 0) else None)
                    temp_document_ls[9].append(row['shut_in_bh_pressure'] if (
                        row['shut_in_bh_pressure'] is not None and row['shut_in_bh_pressure'] >= 0) else None)
                    temp_document_ls[10].append(row['flowing_bh_pressure'] if (
                        row['flowing_bh_pressure'] is not None and row['flowing_bh_pressure'] >= 0) else None)
                    temp_document_ls[11].append(row['flowing_tbg_pressure'] if (
                        row['flowing_tbg_pressure'] is not None and row['flowing_tbg_pressure'] >= 0) else None)
                    temp_document_ls[12].append(row['shut_in_csg_pressure'] if (
                        row['shut_in_csg_pressure'] is not None and row['shut_in_csg_pressure'] >= 0) else None)
                    temp_document_ls[13].append(row['flowing_csg_pressure'] if (
                        row['flowing_csg_pressure'] is not None and row['flowing_csg_pressure'] >= 0) else None)
                    temp_document_ls[14].append(row['shut_in_tbg_pressure'] if (
                        row['shut_in_tbg_pressure'] is not None and row['shut_in_tbg_pressure'] >= 0) else None)
                day = row['day']

            if index_row == last_index:
                # append temp_document_ls before create new month document
                if temp_document_ls:
                    # need to give each array 31 position
                    if len(temp_document_ls[3]) < 31:
                        no_of_none = 31 - len(temp_document_ls[3])

                        temp_document_ls[3] += [None] * no_of_none
                        temp_document_ls[4] += [None] * no_of_none
                        temp_document_ls[5] += [None] * no_of_none
                        temp_document_ls[6] += [None] * no_of_none
                        temp_document_ls[7] += [None] * no_of_none
                        temp_document_ls[8] += [None] * no_of_none
                        temp_document_ls[9] += [None] * no_of_none
                        temp_document_ls[10] += [None] * no_of_none
                        temp_document_ls[11] += [None] * no_of_none
                        temp_document_ls[12] += [None] * no_of_none
                        temp_document_ls[13] += [None] * no_of_none
                        temp_document_ls[14] += [None] * no_of_none

                    for idx in range(len(temp_document_ls[3])):
                        if temp_document_ls[3][idx] is not None:
                            temp_document_ls[2] = idx
                            break

                    daily_format_ls.append(temp_document_ls)

        format_selected_df = pd.DataFrame.from_records(daily_format_ls,
                                                       columns=[
                                                           'startIndex', 'chosenID', 'first_production_index', 'index',
                                                           'water', 'oil', 'gas', 'choke', 'hours_on',
                                                           'shut_in_bh_pressure', 'flowing_bh_pressure',
                                                           'flowing_tbg_pressure', 'shut_in_csg_pressure',
                                                           'flowing_csg_pressure', 'shut_in_tbg_pressure'
                                                       ])
        if source == 'aries':
            format_selected_df['aries_id'] = selected_df['aries_id'].values[0]
        elif source == 'phdwin':
            format_selected_df['phdwin_id'] = selected_df['phdwin_id'].values[0]
            format_selected_df['lse_id'] = selected_df['lse_id'].values[0]
            format_selected_df['lse_name'] = selected_df['lse_name'].values[0]
        return format_selected_df, False

    def wells_add_has_daily_monthly(self):
        has_daily_well_list = np.unique([d['well'] for d in self.well_days_data_list]).tolist()
        has_monthly_well_list = np.unique([m['well'] for m in self.well_months_data_list]).tolist()

        self.context.wells_collection.update_many({'_id': {'$in': has_daily_well_list}}, {'$set': {'has_daily': True}})
        self.context.wells_collection.update_many({'_id': {
            '$in': has_monthly_well_list
        }}, {'$set': {
            'has_monthly': True
        }})
