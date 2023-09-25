import copy
from typing import Callable

from bson.objectid import ObjectId
from api.cc_to_cc.helper import as_of_date_criteria, date_criteria, never_criteria
from api.cc_to_cc.file_headers import ColumnName, DIFFERENTIALS_KEY
from api.cc_to_cc.dates import CUT_OFF_KEY_MAP, LINK_TO_WELLS_ECL
from combocurve.shared.aries_import_enums import PhaseEnum
from combocurve.shared.econ_tools.econ_model_tools import (CriteriaEnum, EXP_UNIT_KEYS, REVERSION_KEYS, FIXED_EXP_KEYS,
                                                           UnitKeyEnum)
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.shared.econ_tools.econ_model_display_templates import FPD_SCOURCE_CRITERIA, ESCALATION_START_CRITERIA

######## convert dicts & default template
#### convert dicts
fiscal_convert_dict = {
    '0-11': 'JAN - DEC',
    '1-0': 'FEB - JAN',
    '2-1': 'MAR - FEB',
    '3-2': 'APR - MAR',
    '4-3': 'MAY - APR',
    '5-4': 'JUN - MAY',
    '6-5': 'JUL - JUN',
    '7-6': 'AUG - JUL',
    '8-7': 'SEP - AUG',
    '9-8': 'OCT - SEP',
    '10-9': 'NOV - OCT',
    '11-10': 'DEC - NOVE',
}

criteria_value_label_dict = {
    'dates': 'Dates',
    'entire_well_life': 'Flat',
    'offset_to_fpd': 'FPD',
    'offset_to_as_of_date': 'As Of',
    'offset_to_discount_date': 'Disc Date',
    'offset_to_first_segment': 'Maj Seg',
    'offset_to_end_history': 'End Hist',
    'schedule_end': 'Schedule End',
    'schedule_start': 'Schedule Start'
}

percent_of_revenue_dict = {
    'pct_of_gas_rev': '% of Gas Rev',
    'pct_of_oil_rev': '% of Oil Rev',
    'pct_of_ngl_rev': '% of NGL Rev',
    'pct_of_total_rev': '% of Total Rev',
}

fixed_exp_unit_dict = {'fixed_expense': '$/Month', 'fixed_expense_per_well': '$/Well/Month'}

calculation_options = {
    'wi': 'WI',
    'nri': 'NRI',
    'lease_nri': 'Lease NRI',
    'one_minus_wi': '1 - WI',
    'one_minus_nri': '1 - NRI',
    'one_minus_lease_nri': '1 - Lease NRI',
    'wi_minus_one': 'WI - 1',
    'nri_minus_one': 'NRI - 1',
    'lease_nri_minus_one': 'Lease NRI - 1'
}

percent_of_base_price_options = {'pct_of_base_price': '% Base Price Rem'}

production_taxes_state_options = {
    'custom': 'Custom',
    'alaska': 'AK',
    'alabama': 'AL',
    'arkansas': 'AR',
    'arizona': 'AZ',
    'california': 'CA',
    'colorado': 'CO',
    'florida': 'FL',
    'idaho': 'ID',
    'indiana': 'IN',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maryland': 'MD',
    'michigan': 'MI',
    'mississippi': 'MS',
    'montana': 'MT',
    'north_dakota': 'ND',
    'nebraska': 'NE',
    'new_mexico': 'NM',
    'nevada': 'NV',
    'new_york': 'NY',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA IF SIMPLE',
    'pennsylvania horizontal': 'PA IF H',
    'pennsylvania vertical': 'PA IF V',
    'south_dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'virginia': 'VA',
    'west_virginia': 'WV',
    'wyoming': 'WY'
}

start_date_options = {
    'spud date from headers': 'SPUD Date from headers',
    'spud date from schedule': 'SPUD Date from schedule',
    'fpd': 'FPD'
}

ESCALATION_SPECIAL_LABELS = {'simple': 'Simple (Linear)', 'pct_per_year': '%/Year (APY)'}

# dates_setting criteria select need full menuItems
dates_setting_convert_dict = {
    'date': {
        'label': 'Date',
        'value': 'date',
        'required': True,
        'fieldName': 'Date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'dynamic': {
        'label':
        'Dynamic Date',
        'value':
        'dynamic',
        'required':
        True,
        'fieldType':
        'select',
        'menuItems': [{
            'label': 'First of Next Month',
            'value': 'first_of_next_month'
        }, {
            'label': 'First of Next Year',
            'value': 'first_of_next_year'
        }]
    },
    'fpd': {
        'label': 'FPD',
        'value': 'fpd',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'FPD'
    },
    'maj_seg': {
        'label': 'Maj Seg',
        'value': 'maj_seg',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Maj Seg'
    }
}

# cut_off criteria select need full menuItems
cut_off_convert_dict = {
    'max_cum_cash_flow': {
        'label': 'Max Cum Cash Flow',
        'value': 'max_cum_cash_flow',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'Max Cum Cash Flow'
    },
    'first_negative_cash_flow': {
        'label': 'First Negative Cash Flow',
        'value': 'first_negative_cash_flow',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'First Negative Cash Flow'
    },
    'last_positive_cash_flow': {
        'label': 'Last Positive Cash Flow',
        'value': 'last_positive_cash_flow',
        'staticValue': '',
        'fieldType': 'static'
    },
    'no_cut_off': {
        'label': 'No Cut Off',
        'value': 'no_cut_off',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'No Cut Off'
    },
    'oil_rate': {
        'required': True,
        'label': 'Oil Rate',
        'value': 'oil_rate',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'BBL/D',
        'unit': 'BBL/D',
        'fieldName': 'Oil Rate'
    },
    'gas_rate': {
        'required': True,
        'label': 'Gas Rate',
        'value': 'gas_rate',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'MCF/D',
        'unit': 'MCF/D',
        'fieldName': 'Gas Rate'
    },
    'water_rate': {
        'required': True,
        'label': 'Water Rate',
        'value': 'water_rate',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'BBL/D',
        'unit': 'BBL/D',
        'fieldName': 'Water Rate'
    },
    'date': {
        'label': 'Date',
        'value': 'date',
        'required': True,
        'fieldName': 'Date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'years_from_as_of': {
        'label': 'Years From As Of',
        'value': 'years_from_as_of',
        'required': True,
        'min': 0,
        'max': 1000,
        'fieldType': 'number',
        'valType': 'years',
        'unit': 'years',
        'fieldName': 'Years From As Of'
    },
    'gor': {
        'required': True,
        'label': 'GOR',
        'value': 'gor',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'CF/BBL',
        'unit': 'CF/BBL',
        'fieldName': 'GOR',
        'disabled': True
    },
    'ftp': {
        'required': True,
        'label': 'FTP',
        'value': 'ftp',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'PSI',
        'unit': 'PSI',
        'fieldName': 'FTP',
        'disabled': True
    },
    'water_cut': {
        'required': True,
        'label': 'Water Cut',
        'value': 'water_cut',
        'min': 0,
        'max': 10000000,
        'fieldType': 'number',
        'valType': 'BBL/BOE',
        'unit': 'BBL/BOE',
        'fieldName': 'Water Cut',
        'disabled': True
    },
    LINK_TO_WELLS_ECL: {
        'label': "Link to Well's ECL",
        'value': LINK_TO_WELLS_ECL,
        'required': True,
        'fieldType': 'text',
        'fieldName': "Link to Well's ECL",
        'maxLength': 30,
        'valType': 'text',
    },
}

MIN_CUT_OFF_CONVERT = {
    'none': {
        'label': 'None',
        'value': 'none',
        'staticValue': '',
        'fieldType': 'static'
    },
    'date': {
        'label': 'Date',
        'value': 'date',
        'fieldName': 'Date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'as_of': {
        'label': 'As Of',
        'value': 'as_of',
        'fieldType': 'number',
        'valType': 'months',
        'min': 0,
        'fieldName': 'As Of'
    },
    'end_hist': {
        'label': 'End Hist',
        'value': 'end_hist',
        'staticValue': '',
        'fieldType': 'static'
    }
}

# reversion criteria select need full menuItems
reversion_criteria_convert_dict = {
    'no_reversion': {
        'required': False,
        'label': 'No Reversion',
        'value': 'no_reversion',
        'fieldType': 'static',
        'staticValue': ''
    },
    'irr': {
        'required': True,
        'label': 'IRR',
        'value': 'irr',
        'fieldType': 'number',
        'valType': 'percentage',
        'min': 0,
        'max': 10000
    },
    'payout_with_investment': {
        'required': True,
        'label': 'PO W/INV',
        'value': 'payout_with_investment',
        'fieldType': 'number',
        'valType': 'dollars',
        'min': 0,
        'max': 10000000000
    },
    'payout_without_investment': {
        'required': True,
        'label': 'PO',
        'value': 'payout_without_investment',
        'fieldType': 'number',
        'valType': 'dollars',
        'min': 0,
        'max': 10000000000
    },
    'roi_undisc': {
        'required': True,
        'label': 'Undisc ROI',
        'value': 'roi_undisc',
        'fieldType': 'number',
        'valType': 'multiple',
        'min': 0,
        'max': 1000
    },
    'offset_to_as_of_date': {
        'required': True,
        'label': 'As Of',
        'value': 'offset_to_as_of_date',
        'fieldType': 'number',
        'valType': 'months',
        'min': -1200,
        'max': 1200
    },
    'date': {
        'required': True,
        'label': 'Date',
        'value': 'date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'well_head_oil_cum': {
        'required': True,
        'label': 'WH Cum Oil',
        'value': 'well_head_oil_cum',
        'fieldType': 'number',
        'valType': 'BBL',
        'min': 0,
        'max': 10000000000
    },
    'well_head_gas_cum': {
        'required': True,
        'label': 'WH Cum Gas',
        'value': 'well_head_gas_cum',
        'fieldType': 'number',
        'valType': 'MCF',
        'min': 0,
        'max': 10000000000
    },
    'well_head_boe_cum': {
        'required': True,
        'label': 'WH Cum BOE',
        'value': 'well_head_boe_cum',
        'fieldType': 'number',
        'valType': 'BOE',
        'min': 0,
        'max': 10000000000
    }
}

# reversion tied to convert dict
reversion_tied_to_convert_dict = {
    'date': {
        'label': 'Date',
        'value': 'date',
        'required': True,
        'fieldName': 'Date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'fpd': {
        'label': 'FPD',
        'value': 'fpd',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'FPD'
    },
    'as_of': {
        'label': 'As Of',
        'value': 'as_of',
        'staticValue': '',
        'fieldType': 'static',
        'fieldName': 'As Of'
    }
}

# other_capex criteria select need full menuItems
other_capex_criteria_convert_dict = {
    'offset_to_fpd': {
        'required': True,
        'label': 'FPD',
        'value': 'offset_to_fpd',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': -120
    },
    'offset_to_as_of_date': {
        'required': True,
        'label': 'As of',
        'value': 'offset_to_as_of_date',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': -120
    },
    'offset_to_discount_date': {
        'required': True,
        'label': 'Disc Date',
        'value': 'offset_to_discount_date',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': -120
    },
    'offset_to_first_segment': {
        'required': True,
        'label': 'Maj Seg',
        'value': 'offset_to_first_segment',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': -120
    },
    'offset_to_econ_limit': {
        'required': True,
        'label': 'Econ Limit',
        'value': 'offset_to_econ_limit',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'date': {
        'required': True,
        'label': 'Date',
        'value': 'date',
        'fieldType': 'date',
        'valType': 'datetime'
    },
    'oil_rate': {
        "required": True,
        "label": "Oil Rate",
        "value": "oil_rate",
        "fieldType": "number",
        "valType": "BBL/D",
        "unit": "BBL/D",
        "min": 0,
        "max": 10000000000
    },
    'gas_rate': {
        "required": True,
        "label": "Gas Rate",
        "value": "gas_rate",
        "fieldType": "number",
        "valType": "MCF/D",
        "unit": "MCF/D",
        "min": 0,
        "max": 10000000000
    },
    'water_rate': {
        "required": True,
        "label": "Water Rate",
        "value": "water_rate",
        "fieldType": "number",
        "valType": "BBL/D",
        "unit": "BBL/D",
        "min": 0,
        "max": 10000000000
    },
    'total_fluid_rate': {
        "required": True,
        "label": "Total Fluid Rate (Oil + Water)",
        "value": "total_fluid_rate",
        "fieldType": "number",
        "valType": "BBL/D",
        "unit": "BBL/D",
        "min": 0,
        "max": 10000000000
    },
    'fromSchedule': {
        'required': True,
        'label': 'From Schedule',
        'value': 'fromSchedule',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'fromHeaders': {
        'required': True,
        'label': 'From Headers',
        'value': 'fromHeaders',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    }
}

# other_capex criteria for fromSchedule (full menuItems)
other_capex_from_schedule_criteria = {
    'offset_to_pad_preparation_mob_start': {
        'required': True,
        'label': 'Pad Preparation Mob Start',
        'value': 'offset_to_pad_preparation_mob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_pad_preparation_mob_end': {
        'required': True,
        'label': 'Pad Preparation Mob End',
        'value': 'offset_to_pad_preparation_mob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_pad_preparation_start': {
        'required': True,
        'label': 'Pad Preparation Start',
        'value': 'offset_to_pad_preparation_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_pad_preparation_end': {
        'required': True,
        'label': 'Pad Preparation End',
        'value': 'offset_to_pad_preparation_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_pad_preparation_demob_start': {
        'required': True,
        'label': 'Pad Preparation Demob Start',
        'value': 'offset_to_pad_preparation_demob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_pad_preparation_demob_end': {
        'required': True,
        'label': 'Pad Preparation Demob End',
        'value': 'offset_to_pad_preparation_demob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_mob_start': {
        'required': True,
        'label': 'Spud Mob Start',
        'value': 'offset_to_spud_mob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_mob_end': {
        'required': True,
        'label': 'Spud Mob End',
        'value': 'offset_to_spud_mob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_start': {
        'required': True,
        'label': 'Spud Start',
        'value': 'offset_to_spud_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_end': {
        'required': True,
        'label': 'Spud End',
        'value': 'offset_to_spud_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_demob_start': {
        'required': True,
        'label': 'Spud Demob Start',
        'value': 'offset_to_spud_demob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_spud_demob_end': {
        'required': True,
        'label': 'Spud Demob End',
        'value': 'offset_to_spud_demob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_mob_start': {
        'required': True,
        'label': 'Drill Mob Start',
        'value': 'offset_to_drill_mob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_mob_end': {
        'required': True,
        'label': 'Drill Mob End',
        'value': 'offset_to_drill_mob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_start': {
        'required': True,
        'label': 'Drill Start',
        'value': 'offset_to_drill_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_end': {
        'required': True,
        'label': 'Drill End',
        'value': 'offset_to_drill_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_demob_start': {
        'required': True,
        'label': 'Drill Demob Start',
        'value': 'offset_to_drill_demob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_drill_demob_end': {
        'required': True,
        'label': 'Drill Demob End',
        'value': 'offset_to_drill_demob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_mob_start': {
        'required': True,
        'label': 'Completion Mob Start',
        'value': 'offset_to_completion_mob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_mob_end': {
        'required': True,
        'label': 'Completion Mob End',
        'value': 'offset_to_completion_mob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_start': {
        'required': True,
        'label': 'Completion Start',
        'value': 'offset_to_completion_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_end': {
        'required': True,
        'label': 'Completion End',
        'value': 'offset_to_completion_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_demob_start': {
        'required': True,
        'label': 'Completion Demob Start',
        'value': 'offset_to_completion_demob_start',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    },
    'offset_to_completion_demob_end': {
        'required': True,
        'label': 'Completion Demob End',
        'value': 'offset_to_completion_demob_end',
        'fieldType': 'number',
        'valType': 'days',
        'min': -20000,
        'max': 20000,
        'Default': 0
    }
}

# other_capex criteria for fromHeaders (full menuItems)
other_capex_from_headers_criteria = {
    'offset_to_refrac_date': {
        "required": True,
        "label": "Refrac Date",
        "value": "offset_to_refrac_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_completion_end_date': {
        "required": True,
        "label": "Completion End Date",
        "value": "offset_to_completion_end_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_completion_start_date': {
        "required": True,
        "label": "Completion Start Date",
        "value": "offset_to_completion_start_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_date_rig_release': {
        "required": True,
        "label": "Date Rig Release",
        "value": "offset_to_date_rig_release",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_drill_end_date': {
        "required": True,
        "label": "Drill End Date",
        "value": "offset_to_drill_end_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_drill_start_date': {
        "required": True,
        "label": "Drill Start Date",
        "value": "offset_to_drill_start_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_first_prod_date': {
        "required": True,
        "label": "First Prod Date",
        "value": "offset_to_first_prod_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_permit_date': {
        "required": True,
        "label": "Permit Date",
        "value": "offset_to_permit_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_spud_date': {
        "required": True,
        "label": "Spud Date",
        "value": "offset_to_spud_date",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_til': {
        "required": True,
        "label": "TIL",
        "value": "offset_to_til",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_0': {
        "required": True,
        "label": "Custom Date Header 1",
        "value": "offset_to_custom_date_0",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_1': {
        "required": True,
        "label": "Custom Date Header 2",
        "value": "offset_to_custom_date_1",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_2': {
        "required": True,
        "label": "Custom Date Header 3",
        "value": "offset_to_custom_date_2",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_3': {
        "required": True,
        "label": "Custom Date Header 4",
        "value": "offset_to_custom_date_3",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_4': {
        "required": True,
        "label": "Custom Date Header 5",
        "value": "offset_to_custom_date_4",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_5': {
        "required": True,
        "label": "Custom Date Header 6",
        "value": "offset_to_custom_date_5",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_6': {
        "required": True,
        "label": "Custom Date Header 7",
        "value": "offset_to_custom_date_6",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_7': {
        "required": True,
        "label": "Custom Date Header 8",
        "value": "offset_to_custom_date_7",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_8': {
        "required": True,
        "label": "Custom Date Header 9",
        "value": "offset_to_custom_date_8",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_custom_date_9': {
        "required": True,
        "label": "Custom Date Header 10",
        "value": "offset_to_custom_date_9",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_first_prod_date_daily_calc': {
        "required": True,
        "label": "First Prod Date Daily",
        "value": "offset_to_first_prod_date_daily_calc",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_first_prod_date_monthly_calc': {
        "required": True,
        "label": "First Prod Date Monthly",
        "value": "offset_to_first_prod_date_monthly_calc",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_last_prod_date_monthly': {
        "required": True,
        "label": "Last Prod Date Monthly",
        "value": "offset_to_last_prod_date_monthly",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
    'offset_to_last_prod_date_daily': {
        "required": True,
        "label": "Last Prod Date Daily",
        "value": "offset_to_last_prod_date_daily",
        "fieldType": "number",
        "valType": "days",
        "min": -20000,
        "max": 20000,
        "Default": 0
    },
}

symbol_convert_dict = {
    'dollar': '$',
    'per': '/',
    'pct': '%',
}

# discount_method
discount_method_label = {
    'yearly': 'Yearly (N = 1)',
    'quaterly': 'Quarterly (N = 4)',
    'quarterly': 'Quarterly (N = 4)',
    'monthly': 'Monthly (N = 12)',
    'daily': 'Daily (N = 365)'
}

#### default template
discount_table_template = {
    'discount_method': {
        'label': 'Yearly (N = 1)',
        'value': 'yearly'
    },
    'cash_accrual_time': {
        'label': 'Mid Month',
        'value': 'mid_month'
    },
    'first_discount': 10,
    'second_discount': 15,
    'vertical_row_view': {
        'headers': {
            'discount_table': 'Discount Table'
        },
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
    }
}
#
drilling_cost_template = {
    'calculation': {
        'label': 'Gross',
        'value': 'gross'
    },
    'dollar_per_ft_of_vertical': 0,
    'dollar_per_ft_of_horizontal': 0,
    'fixed_cost': 0,
    'tangible_pct': 0,
    'escalation_model': {
        'label': 'None',
        'value': 'none'
    },
    'depreciation_model': {
        'label': 'None',
        'value': 'none'
    },
    'deal_terms': 1,
    'empty_header': {
        'subItems': {
            'row_view': {
                'headers': {
                    'pct_of_total_cost': '% of Total Cost',
                    'criteria': {
                        'label': 'FPD',
                        'value': 'offset_to_fpd'
                    }
                },
                'rows': [{
                    'pct_of_total_cost': 100,
                    'criteria': -120
                }]
            }
        }
    },
    'omitSection': True
}
#
completion_cost_template = {
    'calculation': {
        'label': 'Gross',
        'value': 'gross'
    },
    'dollar_per_ft_of_vertical': 0,
    'dollar_per_ft_of_horizontal': {
        'subItems': {
            'row_view': {
                'headers': {
                    'unit_cost': 'Unit Cost',
                    'prop_ll': 'Prop/LL'
                },
                'rows': [{
                    'unit_cost': 600,
                    'prop_ll': 2000
                }]
            }
        }
    },
    'fixed_cost': 0,
    'tangible_pct': 0,
    'escalation_model': {
        'label': 'None',
        'value': 'none'
    },
    'depreciation_model': {
        'label': 'None',
        'value': 'none'
    },
    'deal_terms': 1,
    'empty_header': {
        'subItems': {
            'row_view': {
                'headers': {
                    'pct_of_total_cost': '% of Total Cost',
                    'criteria': {
                        'label': 'FPD',
                        'value': 'offset_to_fpd'
                    }
                },
                'rows': [{
                    'pct_of_total_cost': 100,
                    'criteria': -120
                }]
            }
        }
    },
    'omitSection': True
}
#
other_capex_header = {
    'category': 'Category',
    'description': 'Description',
    'tangible': 'Tangible',
    'intangible': 'Intangible',
    'criteria': 'Criteria',
    'capex_expense': 'CAPEX/Expense',
    'calculation': 'Calculation',
    'escalation_model': 'Escalation',
    'depreciation_model': 'Depreciation',
    'deal_terms': 'Paying WI / Earning WI'
}

distribution_type_dict = {
    'na': 'N/A',
    'normal': "Normal",
    'lognormal': "Lognormal",
    'triangular': "Triangular",
    'uniform': "Uniform",
}
#### headers mapping
# shut-in from risking model headers mapping
SHUT_IN_DEFAULT_HEAHERS = {
    'phase': 'Phase',
    'criteria': {
        'label': 'Dates',
        'value': 'dates',
    },
    'repeat_range_of_dates': 'Repeat Range Of Dates',
    'total_occurrences': 'Total Occurrences',
    'unit': 'Unit',
    'multiplier': 'Scale Post Shut-in Factor',
    'scale_post_shut_in_end_criteria': 'Scale Post Shut-In End Criteria',
    'scale_post_shut_in_end': 'Scale Post Shut-In End',
    'fixed_expense': 'Fixed Expense',
    'capex': 'CAPEX',
}

SPECIAL_LABEL_MAP = {
    'revenue': 'Rev',
    'condensate': 'Cond',
}


def value_to_label_conv_dict(value):
    if len(value) == 0:
        return ''

    if value in fiscal_convert_dict:
        return fiscal_convert_dict[value]

    if value in percent_of_revenue_dict:
        return percent_of_revenue_dict[value]

    if value in criteria_value_label_dict:
        return criteria_value_label_dict[value]

    if value in calculation_options:
        return calculation_options[value]

    if value in production_taxes_state_options:
        return production_taxes_state_options[value]

    if value in percent_of_base_price_options:
        return percent_of_base_price_options[value]

    if value in start_date_options:
        return start_date_options[value]

    if value in ESCALATION_SPECIAL_LABELS:
        return ESCALATION_SPECIAL_LABELS[value]

    if value in fixed_exp_unit_dict:
        return fixed_exp_unit_dict[value]

    if value in distribution_type_dict:
        return distribution_type_dict[value]


def value_to_label(value):
    label = value_to_label_conv_dict(value)
    if label is not None:
        return label
    label = ''
    value_list = copy.deepcopy(value).split('_')
    for i in range(len(value_list)):
        item = value_list[i]
        if item in symbol_convert_dict:
            this_label_add = symbol_convert_dict[item]
        elif item in ['to', 'of']:
            this_label_add = item
        elif item in ['fpd', 'capex', 'bbl', 'mcf', 'mmbtu', 'gal', 'boe', 'ngl', 'co2e', 'co2', 'n2o', 'ch4']:
            this_label_add = item.upper()
        elif item in SPECIAL_LABEL_MAP:
            this_label_add = SPECIAL_LABEL_MAP[item]
        else:
            if any(not char.isalpha() and not char.isnumeric() for char in item) and len(value_list) == 1:
                this_label_add = item[0].upper() + item[1:].upper()
            else:
                this_label_add = item[0].upper() + item[1:]
        # add space
        if i == len(value_list) - 1:
            label = label + this_label_add
        else:
            label = label + this_label_add + ' '
        # check '$ / '
        if label == '$ / ':
            label = '$/'
        # check '% / '
        if label == '% / ':
            label = '%/'
    return label


def fill_yes_or_no_label_value(options: dict, econ_model: dict, key: str):
    if key in econ_model:
        yes_or_no = 'Yes' if econ_model[key] == 'yes' else 'No'
        options[key] = {'label': yes_or_no, 'value': yes_or_no.lower()}


def fill_label_value(options: dict, econ_model: dict, key: str, label_fn: Callable[[str], str], default_value: str):
    if key in econ_model:
        value = econ_model[key]
        if isinstance(value, str):
            options[key] = {'label': label_fn(value), 'value': value}
    elif default_value is not None:
        options[key] = {'label': label_fn(default_value), 'value': default_value}


def fill_number(options: dict, econ_model: dict, key: str, default: int):
    options[key] = default
    if key in econ_model:
        options[key] = econ_model[key]


def fill_label_value_with_dict(options: dict, econ_model: dict, key: str, map: dict[str, str], default: str):
    value = default
    if key in econ_model:
        value = econ_model[key]

    if value in map:
        options[key] = {'label': map[value], 'value': value}


def fill_table(options: dict, econ_model: dict, key: str, headers: dict):
    if key not in econ_model:
        return

    # default structure:
    options[key] = {'subItems': {'row_view': {'headers': headers, 'rows': {}}}}

    options[key]['subItems']['row_view']['rows'] = copy.deepcopy(econ_model[key]['rows'])


def add_options_selection(options, econ_function, key, default=None):
    selected = econ_function.get(key, default)
    options[key] = {'label': value_to_label(selected), 'value': selected}


#### date_format_convert
def date_format_convert(py_date):
    if '-' not in str(py_date) or type(py_date) is not str:
        return py_date
    # convert date string from yyyy-mm-dd to format mm/dd/yyyy
    ret_str = py_date[:10]  # get rid of time information
    year, month, day = ret_str.split('-')
    return f'{month}/{day}/{year}'


def criteria_dates_convert(econ_criteria_dates):
    options_criteria_dates = {
        'start_date': date_format_convert(econ_criteria_dates['start_date']),
        'end_date': date_format_convert(econ_criteria_dates['end_date'])
    }
    return options_criteria_dates


def esc_fill_in(escalation_model):
    # can use to fill in escalation and depreciation model
    if escalation_model == 'none':
        escalation_ret = {'label': 'None', 'value': 'none'}
    if type(escalation_model) in [str, ObjectId]:
        # new format, only store model_id in econ function
        escalation_ret = {'label': '', 'value': str(escalation_model)}
    else:
        # old format, store model content in econ function
        escalation_ret = {'label': escalation_model['name'], 'value': str(escalation_model['_id'])}
    return escalation_ret


#### general_options
def general_options(econ_function):
    options = {}
    ## main_options
    options['main_options'] = {}
    options['main_options']['aggregation_date'] = date_format_convert(econ_function['main_options']['aggregation_date'])
    options['main_options']['currency'] = {
        'label': econ_function['main_options']['currency'],
        'value': econ_function['main_options']['currency']
    }
    options['main_options']['reporting_period'] = {
        'label': value_to_label(econ_function['main_options']['reporting_period']),
        'value': econ_function['main_options']['reporting_period']
    }
    options['main_options']['fiscal'] = {
        'label': value_to_label(econ_function['main_options']['fiscal']),
        'value': econ_function['main_options']['fiscal']
    }
    options['main_options']['income_tax'] = {
        'label': value_to_label(econ_function['main_options']['income_tax']),
        'value': econ_function['main_options']['income_tax']
    }
    options['main_options']['project_type'] = {
        'label': value_to_label(econ_function['main_options']['project_type']),
        'value': econ_function['main_options']['project_type']
    }
    ## income_tax
    taxes = econ_function['income_tax']
    opt_taxes = options['income_tax'] = {}
    empty_phase_dict = {'subItems': {'row_view': {'headers': {'multiplier': 'Multiplier', 'criteria': {}}, 'rows': []}}}

    criteria_key_list = [
        CriteriaEnum.entire_well_life.name,
        CriteriaEnum.offset_to_fpd.name,
        CriteriaEnum.offset_to_as_of_date.name,
        CriteriaEnum.dates.name,
    ]

    fill_yes_or_no_label_value(opt_taxes, taxes, 'fifteen_depletion')
    fill_yes_or_no_label_value(opt_taxes, taxes, 'carry_forward')

    # state_income_tax and federal_income_tax
    for tax_type, tax_dict in econ_function['income_tax'].items():
        if not isinstance(tax_dict, dict):
            continue

        this_dict = copy.deepcopy(empty_phase_dict)
        row_dicts = tax_dict['rows']
        option_rows = []
        for key in row_dicts[0]:
            if key in criteria_key_list:
                label = value_to_label(key)
                value = key
        for row in row_dicts:
            this_row_criteria = row[value]
            if value == 'dates':
                # only need process for dates, no need for number range and seasonal
                this_row_criteria = criteria_dates_convert(this_row_criteria)
            option_rows.append({'multiplier': row['multiplier'], 'criteria': this_row_criteria})
        this_dict['subItems']['row_view']['rows'] = option_rows
        this_dict['subItems']['row_view']['headers']['criteria'] = {'label': label, 'value': value}
        options['income_tax'][tax_type] = this_dict

    if econ_function['main_options']['income_tax'] == 'no':
        options['income_tax']['omitSection'] = True
    else:
        options['income_tax']['omitSection'] = False

    ## discount_table
    options['discount_table'] = {}
    options['discount_table']['discount_method'] = {
        'label': discount_method_label[econ_function['discount_table']['discount_method']],
        'value': econ_function['discount_table']['discount_method']
    }
    options['discount_table']['cash_accrual_time'] = {
        'label': 'Mid Month' if econ_function['discount_table']['cash_accrual_time'] == 'mid_month' else 'End of Month',
        'value': econ_function['discount_table']['cash_accrual_time']
    }
    options['discount_table']['first_discount'] = econ_function['discount_table']['first_discount']
    options['discount_table']['second_discount'] = econ_function['discount_table']['second_discount']
    options['discount_table']['vertical_row_view'] = {
        'headers': {
            'discount_table': 'Discount Table'
        },
        'rows': econ_function['discount_table']['rows']
    }

    ## boe_conversion
    options['boe_conversion'] = econ_function['boe_conversion']

    ## reporting_units (special: value is the same with label)
    options['reporting_units'] = {}
    for key in econ_function['reporting_units']:
        if key == 'water_cut':
            options['reporting_units'][key] = econ_function['reporting_units'][key]
        else:
            options['reporting_units'][key] = {
                'label': econ_function['reporting_units'][key],
                'value': econ_function['reporting_units'][key]
            }
    return options


def actual_or_forecast(econ_function):
    options = {'production_vs_fit_model': {'replace_actual': {'subItems': {}}}}

    opt_fit_model = options['production_vs_fit_model']
    fit_model = econ_function['production_vs_fit_model']

    fill_yes_or_no_label_value(opt_fit_model, fit_model, 'ignore_hist_prod')

    if ('replace_actual' in fit_model) and (fit_model['replace_actual'] is not None):
        phases = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value]
        for phase in phases:
            if list(fit_model['replace_actual'][phase].keys())[-1] == 'date':
                opt_fit_model['replace_actual']['subItems'][phase] = copy.deepcopy(date_criteria)
                opt_fit_model['replace_actual']['subItems'][phase]['value'] = econ_function['production_vs_fit_model'][
                    'replace_actual'][phase]['date']

            elif list(fit_model['replace_actual'][phase].keys())[-1] == 'never':
                opt_fit_model['replace_actual']['subItems'][phase] = copy.deepcopy(never_criteria)
            else:
                opt_fit_model['replace_actual']['subItems'][phase] = copy.deepcopy(as_of_date_criteria)

    return options


def dates(econ_function):
    # dates_setting
    dates_setting = {}
    econ_dates_setting = econ_function['dates_setting']

    dates_setting[ColumnName.max_well_life.name] = econ_dates_setting[ColumnName.max_well_life.name]

    as_of_key = list(econ_dates_setting[ColumnName.as_of_date.name].keys())[0]
    dates_setting[ColumnName.as_of_date.name] = {
        'criteria': dates_setting_convert_dict[as_of_key],
        'value': date_format_convert(econ_dates_setting[ColumnName.as_of_date.name][as_of_key])
    }

    discount_key = list(econ_dates_setting[ColumnName.discount_date.name].keys())[0]
    dates_setting[ColumnName.discount_date.name] = {
        'criteria': dates_setting_convert_dict[discount_key],
        'value': date_format_convert(econ_dates_setting[ColumnName.discount_date.name][discount_key])
    }

    add_options_selection(dates_setting, econ_dates_setting, ColumnName.cash_flow_prior_to_as_of_date.name)

    add_options_selection(dates_setting, econ_dates_setting, ColumnName.production_data_resolution.name,
                          EconModelDefaults.production_data_resolution)

    fpd_source_hierarchy = econ_dates_setting.get(ColumnName.fpd_source_hierarchy.name,
                                                  EconModelDefaults.fpd_source_hierarchy())
    fpd_source_options = {}

    add_options_selection(fpd_source_options, fpd_source_hierarchy, ColumnName.use_forecast_schedule_when_no_prod.name,
                          EconModelDefaults.fpd_source_hierarchy()[ColumnName.use_forecast_schedule_when_no_prod.name])

    for fpd_key, content in fpd_source_hierarchy.items():
        if fpd_key == ColumnName.use_forecast_schedule_when_no_prod.name:
            # use_forecast_schedule_when_no_prod been processed bove separately
            continue
        selected_key = list(content.keys())[0]
        value = content[selected_key]
        fpd_source_options[fpd_key] = {
            'criteria': FPD_SCOURCE_CRITERIA[selected_key],
            'value': date_format_convert(value)
        }
    dates_setting[ColumnName.fpd_source_hierarchy.name] = {'subItems': fpd_source_options}

    # cut_off
    cut_off = {}
    econ_cut_off = econ_function['cut_off']

    cut_off_key = list(set(CUT_OFF_KEY_MAP.keys()) & set(econ_cut_off.keys()))[0]

    cut_off_value = econ_cut_off[cut_off_key]
    cut_off['cut_off'] = {
        'criteria': cut_off_convert_dict[cut_off_key],
        'value': date_format_convert(cut_off_value) if type(cut_off_value) is str else cut_off_value,
    }

    min_cut_off = econ_cut_off.get('min_cut_off', {'none': None})
    min_cut_off_key = list(min_cut_off.keys())[0]
    min_cut_off_value = min_cut_off[min_cut_off_key]
    cut_off['min_cut_off'] = {
        'criteria': MIN_CUT_OFF_CONVERT[min_cut_off_key],
        'value': date_format_convert(min_cut_off_value) if type(min_cut_off_value) is str else min_cut_off_value,
    }

    add_options_selection(cut_off, econ_cut_off, ColumnName.include_capex.name, 'no')
    cut_off[ColumnName.discount.name] = econ_cut_off.get(ColumnName.discount.name, 0)
    cut_off[ColumnName.econ_limit_delay.name] = econ_cut_off.get(ColumnName.econ_limit_delay.name, 0)
    cut_off[ColumnName.consecutive_negative.name] = econ_cut_off.get(ColumnName.consecutive_negative.name, 0)
    add_options_selection(cut_off, econ_cut_off, ColumnName.capex_offset_to_ecl.name, 'no')
    add_options_selection(cut_off, econ_cut_off, ColumnName.side_phase_end.name, 'no')

    return {
        'dates_setting': dates_setting,
        'cut_off': cut_off,
    }


#### ownership_reversion
def ownership_reversion(econ_function):
    options = {}
    options['ownership'] = {}
    options['ownership']['segment'] = {'label': 'Initial Ownership', 'value': 'initial_ownership'}

    # initial_ownership
    initial_ownership_subitem = {}
    initial_ownership_econ = econ_function['ownership']['initial_ownership']
    initial_ownership_subitem['working_interest'] = initial_ownership_econ['working_interest']
    initial_ownership_subitem['original_ownership'] = {'subItems': initial_ownership_econ['original_ownership']}
    initial_ownership_subitem['phase'] = {'label': 'Oil', 'value': 'oil_ownership'}
    initial_ownership_subitem['oil_ownership'] = {'subItems': initial_ownership_econ['oil_ownership']}
    initial_ownership_subitem['gas_ownership'] = {'subItems': initial_ownership_econ['gas_ownership']}
    initial_ownership_subitem['ngl_ownership'] = {'subItems': initial_ownership_econ['ngl_ownership']}
    initial_ownership_subitem['drip_condensate_ownership'] = {
        'subItems': initial_ownership_econ['drip_condensate_ownership']
    }
    initial_ownership_subitem['empty_header'] = ''
    initial_ownership_subitem['net_profit_interest_type'] = {
        'label': value_to_label(initial_ownership_econ['net_profit_interest_type']),
        'value': initial_ownership_econ['net_profit_interest_type']
    }
    initial_ownership_subitem['net_profit_interest'] = initial_ownership_econ['net_profit_interest']

    options['ownership']['initial_ownership'] = {'subItems': initial_ownership_subitem}

    # reversion
    for rev_key in REVERSION_KEYS:
        this_reversion_subitem = {}
        this_reversion_econ = econ_function['ownership'].get(rev_key, EconModelDefaults.no_reversion)
        # criteria
        all_criteria_set = set(reversion_criteria_convert_dict.keys())
        this_rev_key_set = set(this_reversion_econ.keys())
        this_criteria_key = list(all_criteria_set.intersection(this_rev_key_set))[0]
        this_reversion_subitem['criteria'] = {
            'criteria': reversion_criteria_convert_dict[this_criteria_key],
        }
        if this_criteria_key == 'date':
            this_reversion_subitem['criteria']['value'] = date_format_convert(
                this_reversion_econ[this_criteria_key]) if this_reversion_econ[this_criteria_key] is not None else None
        else:
            this_reversion_subitem['criteria']['value'] = this_reversion_econ[this_criteria_key]

        rev_tied_to_econ = this_reversion_econ.get(ColumnName.reversion_tied_to.name,
                                                   EconModelDefaults.reversion_tied_to)
        rev_tied_to_key = list(rev_tied_to_econ.keys())[0]
        this_reversion_subitem[ColumnName.reversion_tied_to.name] = {
            'criteria': reversion_tied_to_convert_dict[rev_tied_to_key],
            'value': date_format_convert(rev_tied_to_econ[rev_tied_to_key])
        }

        this_reversion_subitem['balance'] = {
            'label': value_to_label(this_reversion_econ['balance']),
            'value': this_reversion_econ['balance']
        }
        this_reversion_subitem['include_net_profit_interest'] = {
            'label': value_to_label(this_reversion_econ['include_net_profit_interest']),
            'value': this_reversion_econ['include_net_profit_interest']
        }
        this_reversion_subitem['working_interest'] = this_reversion_econ['working_interest']
        this_reversion_subitem['original_ownership'] = {'subItems': this_reversion_econ['original_ownership']}
        this_reversion_subitem['phase'] = {'label': 'Oil', 'value': 'oil_ownership'}
        this_reversion_subitem['oil_ownership'] = {'subItems': this_reversion_econ['oil_ownership']}
        this_reversion_subitem['gas_ownership'] = {'subItems': this_reversion_econ['gas_ownership']}
        this_reversion_subitem['ngl_ownership'] = {'subItems': this_reversion_econ['ngl_ownership']}
        this_reversion_subitem['drip_condensate_ownership'] = {
            'subItems': this_reversion_econ['drip_condensate_ownership']
        }
        this_reversion_subitem['empty_header'] = ''
        this_reversion_subitem['net_profit_interest'] = this_reversion_econ['net_profit_interest']

        options['ownership'][rev_key] = {'subItems': this_reversion_subitem}

    return options


####  pricing
def pricing(econ_function):
    options = {}
    criteria_key_list = [
        'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date',
        'offset_to_first_segment', 'offset_to_end_history', 'dates'
    ]
    ## price_model
    options['price_model'] = {}
    for phase in econ_function['price_model'].keys():
        options['price_model'][phase] = {'subItems': {}}
        options['price_model'][phase]['subItems']['cap'] = econ_function['price_model'][phase]['cap']
        options['price_model'][phase]['subItems']['escalation_model'] = esc_fill_in(
            econ_function['price_model'][phase]['escalation_model'])
        #
        options['price_model'][phase]['subItems']['row_view'] = {'headers': {}, 'rows': []}
        key_list = list(econ_function['price_model'][phase]['rows'][0].keys())
        for key in key_list:
            if key in [
                    'price', 'dollar_per_mmbtu', 'dollar_per_mcf', 'dollar_per_bbl', 'dollar_per_gal',
                    'pct_of_oil_price'
            ]:
                if key == 'price':
                    options['price_model'][phase]['subItems']['row_view']['headers']['price'] = '$/BBL'
                else:
                    options['price_model'][phase]['subItems']['row_view']['headers']['price'] = {
                        'label': value_to_label(key),
                        'value': key
                    }
                key1 = key
            elif key in criteria_key_list:
                options['price_model'][phase]['subItems']['row_view']['headers']['criteria'] = {
                    'label': value_to_label(key),
                    'value': key
                }
                key2 = key
        for i in range(len(econ_function['price_model'][phase]['rows'])):
            this_econ_row = econ_function['price_model'][phase]['rows'][i]
            this_opt_row = {}
            this_opt_row['price'] = this_econ_row[key1]
            if key2 == 'dates':
                this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
            else:
                this_opt_row['criteria'] = this_econ_row[key2]
            #
            options['price_model'][phase]['subItems']['row_view']['rows'].append(this_opt_row)

    ## break even
    options['breakeven'] = {}
    options['breakeven']['npv_discount'] = econ_function['breakeven']['npv_discount']
    options['breakeven']['based_on_price_ratio'] = {
        'label': value_to_label(econ_function['breakeven']['based_on_price_ratio']),
        'value': econ_function['breakeven']['based_on_price_ratio']
    }
    options['breakeven']['price_ratio'] = econ_function['breakeven']['price_ratio']

    return options


#### differentials
def differentials(econ_function):
    options = {}
    criteria_key_list = [
        'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date',
        'offset_to_first_segment', 'offset_to_end_history', 'dates'
    ]

    options[DIFFERENTIALS_KEY] = {}
    for diff_key in econ_function[DIFFERENTIALS_KEY]:
        this_diff = econ_function[DIFFERENTIALS_KEY][diff_key]
        options[DIFFERENTIALS_KEY][diff_key] = {'subItems': {}}

        for phase in this_diff:
            this_diff_options = {'subItems': {}}

            this_diff_options['subItems']['row_view'] = {'headers': {}, 'rows': []}

            this_diff_options['subItems'][ColumnName.escalation_model.name] = esc_fill_in(
                econ_function[DIFFERENTIALS_KEY][diff_key][phase][ColumnName.escalation_model.name])

            phase_econ_rows = this_diff[phase]['rows']

            key_list = list(phase_econ_rows[0].keys())
            for key in key_list:
                if key in [
                        'pct_of_base_price', 'dollar_per_bbl', 'dollar_per_mcf', 'dollar_per_mmbtu', 'dollar_per_gal'
                ]:
                    this_diff_options['subItems']['row_view']['headers']['differential'] = {
                        'label': value_to_label(key),
                        'value': key
                    }
                    key1 = key
                elif key in criteria_key_list:
                    this_diff_options['subItems']['row_view']['headers']['criteria'] = {
                        'label': value_to_label(key),
                        'value': key
                    }
                    key2 = key
            for i in range(len(phase_econ_rows)):
                this_econ_row = phase_econ_rows[i]
                this_opt_row = {}
                this_opt_row['differential'] = this_econ_row[key1]
                if key2 == 'dates':
                    this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
                else:
                    this_opt_row['criteria'] = this_econ_row[key2]
                #
                this_diff_options['subItems']['row_view']['rows'].append(this_opt_row)

            options[DIFFERENTIALS_KEY][diff_key]['subItems'][phase] = this_diff_options

    return options


#### stream_properties
def yields(options, econ_function):
    yields_econ = econ_function['yields']
    yields_options = {}

    for phase in yields_econ.keys():
        if phase in [ColumnName.rate_type.name, ColumnName.rows_calculation_method.name]:
            add_options_selection(yields_options, yields_econ, phase)
            continue

        this_row_view = {'headers': {}, 'rows': []}
        key_list = list(yields_econ[phase]['rows'][0].keys())
        for key in key_list:
            if key == 'yield':
                if phase == 'ngl':
                    this_row_view['headers']['yield'] = 'NGL Yield'
                elif phase == 'drip_condensate':
                    this_row_view['headers']['yield'] = 'Drip Condensate Yield'
                key1 = 'yield'
            elif key not in ['shrunk_gas', 'unshrunk_gas']:
                this_row_view['headers']['criteria'] = {'label': value_to_label(key), 'value': key}
                key2 = key
            else:
                this_row_view['headers']['gas_type'] = {'label': value_to_label(key), 'value': key}
                key3 = key

        for i in range(len(yields_econ[phase]['rows'])):
            this_econ_row = yields_econ[phase]['rows'][i]
            this_opt_row = {}
            this_opt_row['yield'] = this_econ_row[key1]
            if key2 == 'dates':
                this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
            else:
                this_opt_row['criteria'] = this_econ_row[key2]
            this_opt_row['gas_type'] = this_econ_row[key3]

            this_row_view['rows'].append(this_opt_row)

        yields_options[phase] = {'subItems': {'row_view': this_row_view}}

    options['yields'] = yields_options


def stream_properties(econ_function):
    options = {}

    # btu_content
    options['btu_content'] = econ_function['btu_content']

    # yields
    yields(options, econ_function)

    # shrinkage and loss_flare (they have same structure)
    for model in ['shrinkage', 'loss_flare']:
        this_options = {}
        this_econ = econ_function[model]
        for phase in this_econ.keys():
            if phase in [ColumnName.rate_type.name, ColumnName.rows_calculation_method.name]:
                add_options_selection(this_options, this_econ, phase)
                continue

            phase_econ = this_econ[phase]

            this_row_view = {'headers': {}, 'rows': []}
            key_list = list(phase_econ['rows'][0].keys())

            for key in key_list:
                if key == 'pct_remaining':
                    this_row_view['headers']['pct_remaining'] = '% Remaining'
                    key1 = 'pct_remaining'
                else:
                    this_row_view['headers']['criteria'] = {'label': value_to_label(key), 'value': key}
                    key2 = key

            for i in range(len(phase_econ['rows'])):
                this_econ_row = phase_econ['rows'][i]
                this_opt_row = {}
                this_opt_row['pct_remaining'] = this_econ_row[key1]
                if key2 == 'dates':
                    this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
                else:
                    this_opt_row['criteria'] = this_econ_row[key2]

                this_row_view['rows'].append(this_opt_row)

            this_options[phase] = {'subItems': {'row_view': this_row_view}}

        options[model] = this_options

    return options


#### capex
def capex(econ_function, custom_headers={}):

    # modify custom date headers
    custom_dates = {
        f'offset_to_{key}': custom_headers.get(key)
        for key in custom_headers.keys() if 'custom_date_' in key and custom_headers.get(key) is not None
    }
    for key in custom_dates.keys():
        other_capex_from_headers_criteria[key]["label"] = custom_dates[key]

    options = {}
    ## drilling_cost
    options['drilling_cost'] = drilling_cost_template

    if 'drilling_cost' in econ_function:
        drilling_cost_options = {}
        criteria_key_list = [
            CriteriaEnum.offset_to_fpd.name,
            CriteriaEnum.offset_to_as_of_date.name,
            CriteriaEnum.offset_to_discount_date.name,
            CriteriaEnum.offset_to_end_history.name,
            CriteriaEnum.offset_to_first_segment.name,
            CriteriaEnum.schedule_start.name,
            CriteriaEnum.schedule_end.name,
            CriteriaEnum.dates.name,
        ]
        drilling_cost_options.update({
            'dollar_per_ft_of_vertical':
            econ_function['drilling_cost']['dollar_per_ft_of_vertical'],
            'dollar_per_ft_of_horizontal':
            econ_function['drilling_cost']['dollar_per_ft_of_horizontal'],
            'fixed_cost':
            econ_function['drilling_cost']['fixed_cost'],
            'calculation': {
                'label': econ_function['drilling_cost']['calculation'].title(),
                'value': econ_function['drilling_cost']['calculation']
            },
            'tangible_pct':
            econ_function['drilling_cost']['tangible_pct'],
            'escalation_model':
            esc_fill_in(econ_function['drilling_cost']['escalation_model']),
            'depreciation_model':
            esc_fill_in(econ_function['drilling_cost']['depreciation_model']),
            'deal_terms':
            econ_function['drilling_cost']['deal_terms'],
            'omitSection':
            False,
        })
        drilling_cost_row_header = {'pct_of_total_cost': '% of Total Cost', 'criteria': {}}
        for keys_first_row in list(econ_function['drilling_cost']['rows'][0].keys()):
            if keys_first_row in criteria_key_list:
                drilling_cost_row_header['criteria'].update({
                    'label': value_to_label(keys_first_row),
                    'value': keys_first_row
                })

        drilling_cost_options['empty_header'] = {'subItems': {'row_view': {'headers': drilling_cost_row_header}}}
        drilling_cost_row_objects = []
        for row in econ_function['drilling_cost']['rows']:
            row_object = {'pct_of_total_cost': row['pct_of_total_cost']}
            criteria_value = list(key for key in list(row.keys()) if key not in ['pct_of_total_cost'])
            row_object['criteria'] = row[criteria_value[0]]
            drilling_cost_row_objects.append(row_object)
        drilling_cost_options['empty_header']['subItems']['row_view']['rows'] = drilling_cost_row_objects
        options['drilling_cost'] = drilling_cost_options

    ## completion_cost
    options['completion_cost'] = completion_cost_template

    if 'completion_cost' in econ_function:
        completion_cost_options = {}
        criteria_key_list = [
            CriteriaEnum.offset_to_fpd.name,
            CriteriaEnum.offset_to_as_of_date.name,
            CriteriaEnum.offset_to_discount_date.name,
            CriteriaEnum.offset_to_first_segment.name,
            CriteriaEnum.schedule_start.name,
            CriteriaEnum.schedule_end.name,
            CriteriaEnum.dates.name,
        ]
        completion_cost_options.update({
            'dollar_per_ft_of_vertical':
            econ_function['completion_cost']['dollar_per_ft_of_vertical'],
            'dollar_per_ft_of_horizontal': {
                'subItems': {
                    'row_view': {
                        'headers': {
                            'unit_cost': 'Unit Cost',
                            'prop_ll': 'Prop/PLL"'
                        },
                        'rows': copy.deepcopy(econ_function['completion_cost']['dollar_per_ft_of_horizontal']['rows'])
                    }
                }
            },
            'fixed_cost':
            econ_function['completion_cost']['fixed_cost'],
            'calculation': {
                'label': econ_function['completion_cost']['calculation'].title(),
                'value': econ_function['completion_cost']['calculation']
            },
            'tangible_pct':
            econ_function['completion_cost']['tangible_pct'],
            'escalation_model':
            esc_fill_in(econ_function['completion_cost']['escalation_model']),
            'depreciation_model':
            esc_fill_in(econ_function['completion_cost']['depreciation_model']),
            'deal_terms':
            econ_function['completion_cost']['deal_terms'],
            'omitSection':
            False,
        })
        completion_cost_row_header = {'pct_of_total_cost': '% of Total Cost', 'criteria': {}}
        for keys_first_row in list(econ_function['completion_cost']['rows'][0].keys()):
            if keys_first_row in criteria_key_list:
                completion_cost_row_header['criteria'].update({
                    'label': value_to_label(keys_first_row),
                    'value': keys_first_row
                })

        completion_cost_options['empty_header'] = {'subItems': {'row_view': {'headers': completion_cost_row_header}}}
        completion_cost_row = []
        for row in econ_function['completion_cost']['rows']:
            row_object = {'pct_of_total_cost': row['pct_of_total_cost']}
            criteria_value = list(key for key in list(row.keys()) if key not in ['pct_of_total_cost'])
            row_object['criteria'] = row[criteria_value[0]]
            completion_cost_row.append(row_object)
        completion_cost_options['empty_header']['subItems']['row_view']['rows'] = completion_cost_row
        options['completion_cost'] = completion_cost_options

    ## other_capex
    options['other_capex'] = {}

    ## checking if probCapex is set
    if econ_function['other_capex'].get('probCapex'):
        options['other_capex']['probCapex'] = econ_function['other_capex']['probCapex']

    # headers is fixed for other_capex
    options['other_capex']['row_view'] = {'headers': other_capex_header, 'rows': []}
    for i in range(len(econ_function['other_capex']['rows'])):
        this_econ_row = econ_function['other_capex']['rows'][i]
        this_opt_row = {}
        this_opt_row['category'] = {
            'label': value_to_label(this_econ_row['category']),
            'value': this_econ_row['category']
        }
        this_opt_row['description'] = this_econ_row['description']
        this_opt_row['tangible'] = this_econ_row['tangible']
        this_opt_row['intangible'] = this_econ_row['intangible']

        # criteria
        criteria_key = list(set(other_capex_criteria_convert_dict.keys()).intersection(set(this_econ_row.keys())))[0]
        this_opt_row['criteria'] = {'criteria': other_capex_criteria_convert_dict[criteria_key]}
        if criteria_key == 'date':
            this_opt_row['criteria']['value'] = date_format_convert(this_econ_row[criteria_key])
        elif criteria_key == 'fromSchedule':
            from_schedule_key = list(
                set(other_capex_from_schedule_criteria.keys()).intersection(set(this_econ_row.keys())))[0]
            this_opt_row['criteria']['criteria']['fromSchedule'] = other_capex_from_schedule_criteria[from_schedule_key]
            this_opt_row['criteria']['value'] = 0
            this_opt_row['criteria']['fromScheduleValue'] = this_econ_row[from_schedule_key]
            this_opt_row['criteria']['fromSchedule'] = other_capex_from_schedule_criteria[from_schedule_key]
        elif criteria_key == 'fromHeaders':
            from_headers_key = list(
                set(other_capex_from_headers_criteria.keys()).intersection(set(this_econ_row.keys())))[0]
            this_opt_row['criteria']['criteria']['fromHeaders'] = other_capex_from_headers_criteria[from_headers_key]
            this_opt_row['criteria']['value'] = 0
            this_opt_row['criteria']['fromHeadersValue'] = this_econ_row[from_headers_key]
            this_opt_row['criteria']['fromHeaders'] = other_capex_from_headers_criteria[from_headers_key]
        else:
            this_opt_row['criteria']['value'] = this_econ_row[criteria_key]

        this_opt_row['capex_expense'] = {
            'label': value_to_label(this_econ_row['capex_expense']),
            'value': this_econ_row['capex_expense']
        }
        this_opt_row['after_econ_limit'] = {
            'label': value_to_label(this_econ_row['after_econ_limit']),
            'value': this_econ_row['after_econ_limit']
        }
        if 'offset_to_econ_limit' in this_econ_row or this_econ_row['category'] in ['abandonment', 'salvage']:
            this_opt_row['after_econ_limit']['na'] = 'yes'  # used for disabling selection in FE

        this_opt_row['calculation'] = {
            'label': value_to_label(this_econ_row['calculation']),
            'value': this_econ_row['calculation']
        }
        this_opt_row['escalation_model'] = esc_fill_in(this_econ_row['escalation_model'])
        this_opt_row['depreciation_model'] = esc_fill_in(this_econ_row['depreciation_model'])

        ## checking if probCapex is set
        if econ_function['other_capex'].get('probCapex'):
            this_opt_row['distribution_type'] = {
                'label': value_to_label(this_econ_row['distribution_type']),
                'value': this_econ_row['distribution_type']
            }
            this_opt_row['mode'] = this_econ_row['mode']
            this_opt_row['mean'] = this_econ_row['mean']
            this_opt_row['standard_deviation'] = this_econ_row['standard_deviation']
            this_opt_row['upper_bound'] = this_econ_row['upper_bound']
            this_opt_row['lower_bound'] = this_econ_row['lower_bound']
            this_opt_row['seed'] = this_econ_row['seed']

        # escalation start
        escalation_start = this_econ_row.get(ColumnName.escalation_start.name, EconModelDefaults.escalation_start)
        escalation_start_criteria_key = list(escalation_start.keys())[0]
        escalation_start_criteria = ESCALATION_START_CRITERIA[escalation_start_criteria_key]
        escalation_start_value = escalation_start[escalation_start_criteria_key]
        this_opt_row[ColumnName.escalation_start.name] = {
            ColumnName.criteria.name: escalation_start_criteria,
            ColumnName.value.name: date_format_convert(escalation_start_value)
        }

        options['other_capex']['row_view']['rows'].append(this_opt_row)
    return options


#### expenses
def expenses(econ_function):  # noqa: C901
    options = {}
    criteria_key_list = [
        CriteriaEnum.entire_well_life.name,
        CriteriaEnum.offset_to_fpd.name,
        CriteriaEnum.offset_to_as_of_date.name,
        CriteriaEnum.offset_to_discount_date.name,
        CriteriaEnum.offset_to_first_segment.name,
        CriteriaEnum.offset_to_end_history.name,
        CriteriaEnum.dates.name,
        CriteriaEnum.oil_rate.name,
        CriteriaEnum.gas_rate.name,
        CriteriaEnum.water_rate.name,
        CriteriaEnum.total_fluid_rate.name,
    ]
    ## variable_expenses
    options['variable_expenses'] = {}
    options['variable_expenses']['phase'] = {'label': 'Oil', 'value': 'oil'}
    options['variable_expenses']['category'] = {'label': 'G&P', 'value': 'gathering'}
    for phase in econ_function['variable_expenses']:
        options['variable_expenses'][phase] = {'subItems': {}}
        for category in econ_function['variable_expenses'][phase]:
            phase_category_econ = econ_function['variable_expenses'][phase][category]

            phase_cat_options = {}

            phase_cat_options['description'] = phase_category_econ['description']

            if phase in ['oil', 'gas']:
                add_options_selection(phase_cat_options, phase_category_econ, ColumnName.shrinkage_condition.name)

            phase_cat_options[ColumnName.escalation_model.name] = esc_fill_in(
                phase_category_econ[ColumnName.escalation_model.name])

            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.calculation.name)
            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.affect_econ_limit.name)
            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.deduct_before_severance_tax.name)
            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.deduct_before_ad_val_tax.name)

            phase_cat_options[ColumnName.cap.name] = phase_category_econ[ColumnName.cap.name]
            phase_cat_options[ColumnName.deal_terms.name] = phase_category_econ[ColumnName.deal_terms.name]

            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.rate_type.name)
            add_options_selection(phase_cat_options, phase_category_econ, ColumnName.rows_calculation_method.name)

            phase_cat_options['row_view'] = {'headers': {}, 'rows': []}
            key_list = list(phase_category_econ['rows'][0].keys())

            continue_bool = False  # used to skip import rows when there are invalid columns
            for key in key_list:
                if key in EXP_UNIT_KEYS:
                    unit_cost_dict = {'label': value_to_label(key), 'value': key}
                    phase_cat_options['row_view']['headers']['unit_cost'] = unit_cost_dict
                    key1 = key
                elif key in criteria_key_list:
                    criteria_dict = {'label': value_to_label(key), 'value': key}
                    phase_cat_options['row_view']['headers']['criteria'] = criteria_dict
                    key2 = key
                else:
                    if key not in ['cap', 'escalation_model']:
                        continue_bool = True
            if continue_bool is True:
                continue

            for i in range(len(phase_category_econ['rows'])):
                this_econ_row = phase_category_econ['rows'][i]
                this_opt_row = {}
                this_opt_row['unit_cost'] = this_econ_row[key1]
                if key2 == 'dates':
                    this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
                else:
                    this_opt_row['criteria'] = this_econ_row[key2]
                phase_cat_options['row_view']['rows'].append(this_opt_row)

            options['variable_expenses'][phase]['subItems'][category] = {'subItems': phase_cat_options}

    ## fixed_expenses
    options['fixed_expenses'] = {}
    options['fixed_expenses']['category'] = {'label': 'Monthly Well Cost', 'value': 'monthly_well_cost'}
    for key in FIXED_EXP_KEYS:
        options['fixed_expenses'][key] = {'subItems': {}}

    for key in econ_function['fixed_expenses']:
        this_options = options['fixed_expenses'][key]['subItems']
        this_fixed_econ = econ_function['fixed_expenses'][key]

        this_options[ColumnName.description.name] = this_fixed_econ[ColumnName.description.name]
        this_options[ColumnName.escalation_model.name] = esc_fill_in(this_fixed_econ[ColumnName.escalation_model.name])

        add_options_selection(this_options, this_fixed_econ, ColumnName.calculation.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.affect_econ_limit.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.stop_at_econ_limit.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.expense_before_fpd.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.deduct_before_severance_tax.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.deduct_before_ad_val_tax.name)

        this_options[ColumnName.cap.name] = this_fixed_econ[ColumnName.cap.name]
        this_options[ColumnName.deal_terms.name] = this_fixed_econ[ColumnName.deal_terms.name]

        add_options_selection(this_options, this_fixed_econ, ColumnName.rate_type.name)
        add_options_selection(this_options, this_fixed_econ, ColumnName.rows_calculation_method.name)

        this_options['row_view'] = {'headers': {}, 'rows': []}
        key_list = list(this_fixed_econ['rows'][0].keys())

        unit_key = next(iter(set(key_list).intersection(set(EXP_UNIT_KEYS))))
        this_options['row_view']['headers']['fixed_expense'] = {'label': value_to_label(unit_key), 'value': unit_key}

        key2 = [key for key in key_list if key in criteria_key_list][0]
        this_options['row_view']['headers']['criteria'] = {'label': value_to_label(key2), 'value': key2}

        for i in range(len(this_fixed_econ['rows'])):
            this_econ_row = this_fixed_econ['rows'][i]
            this_opt_row = {}
            this_opt_row['fixed_expense'] = this_econ_row.get(unit_key, '')
            if key2 == 'dates':
                this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
            else:
                this_opt_row['criteria'] = this_econ_row[key2]
            this_options['row_view']['rows'].append(this_opt_row)

    ## water_disposal
    water_options = {}
    water_econ = econ_function['water_disposal']

    water_options[ColumnName.escalation_model.name] = esc_fill_in(water_econ[ColumnName.escalation_model.name])

    add_options_selection(water_options, water_econ, ColumnName.calculation.name)
    add_options_selection(water_options, water_econ, ColumnName.affect_econ_limit.name)
    add_options_selection(water_options, water_econ, ColumnName.deduct_before_severance_tax.name)
    add_options_selection(water_options, water_econ, ColumnName.deduct_before_ad_val_tax.name)

    water_options[ColumnName.cap.name] = water_econ[ColumnName.cap.name]
    water_options[ColumnName.deal_terms.name] = water_econ[ColumnName.deal_terms.name]

    add_options_selection(water_options, water_econ, ColumnName.rate_type.name)
    add_options_selection(water_options, water_econ, ColumnName.rows_calculation_method.name)

    water_options['row_view'] = {'headers': {}, 'rows': []}
    key_list = list(water_econ['rows'][0].keys())

    key1 = [key for key in key_list if key in EXP_UNIT_KEYS][0]
    key2 = [key for key in key_list if key in criteria_key_list][0]
    water_options['row_view']['headers']['unit_cost'] = {'label': value_to_label(key1), 'value': key1}
    water_options['row_view']['headers']['criteria'] = {'label': value_to_label(key2), 'value': key2}

    for i in range(len(water_econ['rows'])):
        this_econ_row = water_econ['rows'][i]
        this_opt_row = {}
        this_opt_row['unit_cost'] = this_econ_row[key1]
        if key2 == 'dates':
            this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key2])
        else:
            this_opt_row['criteria'] = this_econ_row[key2]
        water_options['row_view']['rows'].append(this_opt_row)

    options['water_disposal'] = water_options

    # carbon expenses
    carbon_econ = econ_function['carbon_expenses']
    options['carbon_expenses'] = {}
    add_options_selection(options['carbon_expenses'], carbon_econ, key='category')

    for phase in carbon_econ:
        if phase == 'category':
            continue

        phase_econ = carbon_econ[phase]
        options['carbon_expenses'][phase] = {'subItems': {}}
        phase_option = options['carbon_expenses'][phase]['subItems']
        phase_option.update({
            'description': phase_econ['description'],
            ColumnName.escalation_model.name: esc_fill_in(phase_econ[ColumnName.escalation_model.name]),
            ColumnName.cap.name: phase_econ[ColumnName.cap.name],
            ColumnName.deal_terms.name: phase_econ[ColumnName.deal_terms.name]
        })
        for item in [
                ColumnName.calculation, ColumnName.affect_econ_limit, ColumnName.deduct_before_severance_tax,
                ColumnName.deduct_before_ad_val_tax, ColumnName.rate_type, ColumnName.rows_calculation_method
        ]:
            add_options_selection(phase_option, phase_econ, key=item.name)

        phase_option['row_view'] = {'headers': {}, 'rows': []}
        key_list = list(phase_econ['rows'][0].keys())
        key1 = [key for key in key_list if key in EXP_UNIT_KEYS][0]
        key2 = [key for key in key_list if key in criteria_key_list][0]
        phase_option['row_view']['headers'].update({
            'carbon_expense': "$/MT",
            'criteria': {
                'label': value_to_label(key2),
                'value': key2
            },
        })

        for econ_row in phase_econ['rows']:
            opt_row = {}
            opt_row['carbon_expense'] = econ_row[key1]
            opt_row['criteria'] = criteria_dates_convert(econ_row[key2]) if key2 == 'dates' else econ_row[key2]
            phase_option['row_view']['rows'].append(opt_row)

    return options


#### production_taxes
def production_taxes(econ_function, esca_name_dict=None):
    options = {}
    prod_tax_unit_list = [
        'dollar_per_month', 'dollar_per_boe', 'pct_of_production', 'pct_of_revenue', 'dollar_per_bbl', 'dollar_per_mcf'
    ]
    criteria_key_list = [
        'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date',
        'offset_to_first_segment', 'offset_to_end_history', 'dates', 'oil_rate', 'gas_rate', 'water_rate'
    ]

    # ad_valorem_tax
    ad_val_econ = econ_function['ad_valorem_tax']
    ad_val_tax = {}
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.deduct_severance_tax.name)
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.start_date.name, default='fpd')
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.calculation.name)
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.shrinkage_condition.name)
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.rate_type.name)
    add_options_selection(ad_val_tax, ad_val_econ, ColumnName.rows_calculation_method.name)

    ad_val_row_view = {'headers': {}, 'rows': []}
    key_list = list(ad_val_econ['rows'][0].keys())

    unit_keys = [key for key in key_list if key in prod_tax_unit_list]
    if len(unit_keys) == 1:
        key1 = key2 = unit_keys[0]
    else:
        key1, key2 = unit_keys

    key3 = [key for key in key_list if key in criteria_key_list][0]

    ad_val_row_view['headers']['ad_valorem_tax'] = {'label': value_to_label(key1), 'value': key1}
    ad_val_row_view['headers']['ad_valorem_tax_2'] = {'label': value_to_label(key2), 'value': key2}
    ad_val_row_view['headers']['criteria'] = {'label': value_to_label(key3), 'value': key3}

    for i in range(len(ad_val_econ['rows'])):
        this_econ_row = ad_val_econ['rows'][i]
        this_opt_row = {}
        this_opt_row['ad_valorem_tax'] = this_econ_row[key1]
        this_opt_row['ad_valorem_tax_2'] = this_econ_row[key2] if key1 != key2 else 0
        if key3 == 'dates':
            this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key3])
        else:
            this_opt_row['criteria'] = this_econ_row[key3]
        ad_val_row_view['rows'].append(this_opt_row)
    ad_val_tax['row_view'] = ad_val_row_view

    # add escalation
    ad_val_tax[ColumnName.escalation_model.name] = {
        'subItems': {
            'row_view': {
                'headers': {
                    ColumnName.escalation_model_1.name:
                    esc_fill_in(ad_val_econ[ColumnName.escalation_model.name][ColumnName.escalation_model_1.name]),
                    ColumnName.escalation_model_2.name:
                    esc_fill_in(ad_val_econ[ColumnName.escalation_model.name][ColumnName.escalation_model_2.name])
                },
                'rows': [{
                    ColumnName.escalation_model_1.name: '',
                    ColumnName.escalation_model_2.name: ''
                }]
            }
        }
    }
    # add labels to escalation
    for esc_model in [ColumnName.escalation_model_1.name, ColumnName.escalation_model_2.name]:
        esc_label = ad_val_tax[ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['label']
        esc_value = ad_val_tax[ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['value']
        if esc_label == '' and esca_name_dict is not None:
            esc_label = esca_name_dict.get(esc_value, 'None')
            ad_val_tax[
                ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['label'] = esc_label

    options['ad_valorem_tax'] = ad_val_tax

    # severance_tax
    sev_tax_econ = econ_function['severance_tax']
    sev_tax = {}
    sev_tax['state'] = {'label': value_to_label(sev_tax_econ['state']), 'value': sev_tax_econ['state']}

    add_options_selection(sev_tax, sev_tax_econ, ColumnName.calculation.name)
    add_options_selection(sev_tax, sev_tax_econ, ColumnName.shrinkage_condition.name)
    add_options_selection(sev_tax, sev_tax_econ, ColumnName.rate_type.name)
    add_options_selection(sev_tax, sev_tax_econ, ColumnName.rows_calculation_method.name)

    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        sev_tax[phase] = {'subItems': {'row_view': {'headers': {}, 'rows': []}}}
        key_list = list(sev_tax_econ[phase]['rows'][0].keys())

        unit_keys = [key for key in key_list if key in prod_tax_unit_list]
        if len(unit_keys) == 1:
            key1 = key2 = unit_keys[0]
        else:
            key1, key2 = unit_keys

        key3 = [key for key in key_list if key in criteria_key_list][0]

        sev_tax[phase]['subItems']['row_view']['headers']['severance_tax'] = {
            'label': value_to_label(key1),
            'value': key1
        }
        sev_tax[phase]['subItems']['row_view']['headers']['severance_tax_2'] = {
            'label': value_to_label(key2),
            'value': key2
        }
        sev_tax[phase]['subItems']['row_view']['headers']['criteria'] = {'label': value_to_label(key3), 'value': key3}

        for i in range(len(sev_tax_econ[phase]['rows'])):
            this_econ_row = sev_tax_econ[phase]['rows'][i]
            this_opt_row = {}
            this_opt_row['severance_tax'] = this_econ_row[key1]
            this_opt_row['severance_tax_2'] = this_econ_row[key2] if key1 != key2 else 0
            if key3 == 'dates':
                this_opt_row['criteria'] = criteria_dates_convert(this_econ_row[key3])
            else:
                this_opt_row['criteria'] = this_econ_row.get(key3, '')
            sev_tax[phase]['subItems']['row_view']['rows'].append(this_opt_row)

        # add escalation
        sev_tax[phase]['subItems'][ColumnName.escalation_model.name] = {
            'subItems': {
                'row_view': {
                    'headers': {
                        ColumnName.escalation_model_1.name:
                        esc_fill_in(
                            sev_tax_econ[phase][ColumnName.escalation_model.name][ColumnName.escalation_model_1.name]),
                        ColumnName.escalation_model_2.name:
                        esc_fill_in(
                            sev_tax_econ[phase][ColumnName.escalation_model.name][ColumnName.escalation_model_2.name])
                    },
                    'rows': [{
                        ColumnName.escalation_model_1.name: '',
                        ColumnName.escalation_model_2.name: ''
                    }]
                }
            }
        }
        # add labels to escalation
        for esc_model in [ColumnName.escalation_model_1.name, ColumnName.escalation_model_2.name]:
            esc_label = sev_tax[phase]['subItems'][
                ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['label']
            esc_value = sev_tax[phase]['subItems'][
                ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['value']
            if esc_label == '' and esca_name_dict is not None:
                esc_label = esca_name_dict.get(esc_value, 'None')
                sev_tax[phase]['subItems'][
                    ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['label'] = esc_label

    options['severance_tax'] = sev_tax
    return options


#### risking
def order_shutin_fields(d):
    return {
        key: d[key]
        for key in [
            'phase', 'criteria', 'repeat_range_of_dates', 'total_occurrences', 'unit', 'multiplier',
            'scale_post_shut_in_end_criteria', 'scale_post_shut_in_end', 'fixed_expense', 'capex'
        ]
    }


def risking(econ_function):
    options = {}
    risking_options = {}

    criteria_key_list = [
        CriteriaEnum.entire_well_life.name,
        CriteriaEnum.offset_to_fpd.name,
        CriteriaEnum.offset_to_as_of_date.name,
        CriteriaEnum.offset_to_first_segment.name,
        CriteriaEnum.offset_to_end_history.name,
        CriteriaEnum.offset_to_discount_date.name,
        CriteriaEnum.dates.name,
        CriteriaEnum.seasonal.name,
    ]

    add_options_selection(risking_options, econ_function['risking_model'], ColumnName.risk_prod.name)
    add_options_selection(risking_options, econ_function['risking_model'],
                          ColumnName.risk_ngl_drip_cond_via_gas_risk.name)

    empty_phase_dict = {'subItems': {'row_view': {'headers': {'multiplier': {}, 'criteria': {}}, 'rows': []}}}

    for phase, phase_dict in econ_function['risking_model'].items():
        if phase in [ColumnName.risk_prod.name, ColumnName.risk_ngl_drip_cond_via_gas_risk.name]:
            continue

        this_phase_dict = copy.deepcopy(empty_phase_dict)
        row_dicts = phase_dict['rows']
        option_rows = []

        key_list = list(row_dicts[0].keys())
        for key in key_list:
            if key in criteria_key_list:
                value = key
                label = value_to_label(key)
        unit_key = [k for k in key_list if k != value][0]

        for row in row_dicts:
            this_row_criteria = row[value]
            if value == 'dates':
                # only need process for dates, no need for number range and seasonal
                this_row_criteria = criteria_dates_convert(this_row_criteria)
            option_rows.append({'multiplier': row[unit_key], 'criteria': this_row_criteria})
        this_phase_dict['subItems']['row_view']['rows'] = option_rows

        if unit_key == 'multiplier':  # risking
            this_phase_dict['subItems']['row_view']['headers']['multiplier'] = 'Multiplier'
        else:  # well count
            this_phase_dict['subItems']['row_view']['headers']['multiplier'] = {
                'label': value_to_label(unit_key),
                'value': unit_key,
            }

        this_phase_dict['subItems']['row_view']['headers']['criteria'] = {
            'label': label,
            'value': value,
        }
        risking_options[phase] = this_phase_dict

    options['risking_model'] = risking_options

    options['shutIn'] = {'row_view': {'headers': {}, 'rows': []}}

    econ_rows = econ_function['shutIn']['rows']

    if not econ_rows:
        options['shutIn']['row_view']['headers'] = SHUT_IN_DEFAULT_HEAHERS
        return options

    key_list = list(econ_rows[0].keys())

    shutin_headers = {}
    for key in key_list:
        if key in ['dates', 'offset_to_as_of_date']:
            shutin_headers['criteria'] = {
                'label': value_to_label(key),
                'value': key,
            }
        else:
            shutin_headers[key] = SHUT_IN_DEFAULT_HEAHERS[key]
    shutin_headers = order_shutin_fields(shutin_headers)
    options['shutIn']['row_view']['headers'] = shutin_headers

    for econ_row in econ_rows:
        this_opt_row = {}
        for key, value in econ_row.items():
            if key in ['multiplier', 'total_occurrences', 'scale_post_shut_in_end']:
                this_opt_row[key] = value
            elif key in ['dates', 'offset_to_as_of_date']:
                this_opt_row['criteria'] = value if key == 'offset_to_as_of_date' else criteria_dates_convert(value)
            else:
                this_opt_row[key] = {'label': value_to_label(value), 'value': value}

        # order options
        this_opt_row = order_shutin_fields(this_opt_row)
        options['shutIn']['row_view']['rows'].append(this_opt_row)

    return options


#### production_vs_fit
def production_vs_fit(econ_function):
    options = {}
    options['production_vs_fit_model'] = {
        'replace_actual': {
            'subItems': {
                'oil': {
                    'label':
                    value_to_label(list(econ_function['production_vs_fit_model']['replace_actual']['oil'].keys())[-1]),
                    'value':
                    econ_function['production_vs_fit_model']['replace_actual']['oil']
                },
                'gas': {
                    'label':
                    value_to_label(list(econ_function['production_vs_fit_model']['replace_actual']['oil'].keys())[-1]),
                    'value':
                    econ_function['production_vs_fit_model']['replace_actual']['gas']
                },
                'water': {
                    'label':
                    value_to_label(list(econ_function['production_vs_fit_model']['replace_actual']['oil'].keys())[-1]),
                    'value':
                    econ_function['production_vs_fit_model']['replace_actual']['water']
                }
            }
        }
    }
    return options


#### escalation
def escalation(econ_function):
    esc_model = ColumnName.escalation_model.name
    criteria = ColumnName.criteria.name

    options = {esc_model: {'row_view': {'headers': {}, 'rows': []}}}

    for param in [ColumnName.escalation_frequency.name, ColumnName.calculation_method.name]:
        add_options_selection(options=options[esc_model], econ_function=econ_function[esc_model], key=param)

    for key in econ_function[esc_model]['rows'][0].keys():
        if key in [UnitKeyEnum.DOLLAR_PER_YEAR.value, UnitKeyEnum.PCT_PER_YEAR.value]:
            options[esc_model]['row_view']['headers']['escalation_value'] = {'label': value_to_label(key), 'value': key}
            value_key = key
        else:
            options[esc_model]['row_view']['headers'][criteria] = {'label': value_to_label(key), 'value': key}
            criteria_key = key

    for row in econ_function[esc_model]['rows']:
        options[esc_model]['row_view']['rows'].append({
            'escalation_value':
            row[value_key],
            criteria:
            criteria_dates_convert(row[criteria_key]) if criteria_key == 'dates' else row[criteria_key]
        })

    return options


def reserves_category(econ_function):
    options = {}
    res_cat = econ_function['reserves_category']
    options['reserves_category'] = {
        'prms_resources_class': {
            'label': value_to_label(res_cat['prms_resources_class']),
            'value': res_cat['prms_resources_class']
        },
        'prms_reserves_category': {
            'label': value_to_label(res_cat['prms_reserves_category']),
            'value': res_cat['prms_reserves_category']
        },
        'prms_reserves_sub_category': {
            'label': value_to_label(res_cat['prms_reserves_sub_category']),
            'value': res_cat['prms_reserves_sub_category']
        }
    }

    return options


## Depreciation
# See the options model on:
# main-combocurve -> internal-api/src/inpt-shared/display-templates/cost-model-dialog/depreciation.json
DEPRECIATION_DEPLETION_MAP = {
    'unit_of_production_major': 'UOP (Major Phase)',
    'unit_of_production_BOE': 'UOP (BOE)',
    'ecl': 'Deduct at Economic Limit',
    'fpd': 'Expensed at First Production Date',
    'never': 'No Depletion',
}

BONUS_DEPRECIATION_HEADERS = {
    'tangible_bonus_depreciation': '% Tangible Bonus Depreciation',
    'intangible_bonus_depreciation': '% Intangible Bonus Depreciation'
}

DEPRECIATION_HEADERS = {
    'year': 'Year',
    'tan_factor': 'Tangible Factor',
    'tan_cumulative': 'Tangible Cumulative',
    'intan_factor': 'Intangible Factor',
    'intan_cumulative': 'Intangible Cumulative',
}


def depreciation(econ_function):
    options = {'depreciation_model': {}}
    opt_model = options['depreciation_model']
    econ_model = econ_function['depreciation_model']

    fill_yes_or_no_label_value(opt_model, econ_model, 'tcja_bonus')
    fill_label_value(opt_model, econ_model, 'prebuilt', create_prebuild_label, 'custom')
    fill_label_value(opt_model, econ_model, 'depreciation_or_depletion', lambda v: v.capitalize(), 'depreciation')

    fill_number(opt_model, econ_model, 'tax_credit', 0)
    fill_number(opt_model, econ_model, 'tangible_immediate_depletion', 0)
    fill_number(opt_model, econ_model, 'intangible_immediate_depletion', 0)

    # custom labels:
    map = DEPRECIATION_DEPLETION_MAP
    default_value = 'unit_of_production_major'

    fill_label_value_with_dict(opt_model, econ_model, 'tangible_depletion_model', map, default_value)
    fill_label_value_with_dict(opt_model, econ_model, 'intangible_depletion_model', map, default_value)

    # tables:
    fill_table(opt_model, econ_model, 'bonus_depreciation', BONUS_DEPRECIATION_HEADERS)
    fill_table(opt_model, econ_model, 'depreciation', DEPRECIATION_HEADERS)

    return options


def create_prebuild_label(value: str) -> str:
    """
    The Label follows a simple partner:
        value: acr_3 | label: MACRS 3 Year
        value: acr_5 | label: MACRS 5 Year
    """

    if value == 'custom':
        return 'Custom'

    build_number = value.replace("acr_", "")
    return f"MACRS {build_number} Year"


######## main convert function
def add_options(cost_model_dict):
    assumption_key = cost_model_dict['assumptionKey']
    econ_function = copy.deepcopy(cost_model_dict['econ_function'])
    options = {}
    # general_options
    if assumption_key == 'general_options':
        options = general_options(econ_function)
    # dates
    elif assumption_key == 'dates':
        options = dates(econ_function)
    # ownership_reversion
    elif assumption_key == 'ownership_reversion':
        options = ownership_reversion(econ_function)
    # pricing
    elif assumption_key == 'pricing':
        options = pricing(econ_function)
    # differentials
    elif assumption_key == 'differentials':
        options = differentials(econ_function)
    # stream_properties
    elif assumption_key == 'stream_properties':
        options = stream_properties(econ_function)
    # capex
    elif assumption_key == 'capex':
        options = capex(econ_function)
    # expense
    elif assumption_key == 'expenses':
        options = expenses(econ_function)
    # production_taxes
    elif assumption_key == 'production_taxes':
        options = production_taxes(econ_function)
    # risking
    elif assumption_key == 'risking':
        options = risking(econ_function)
    # production_vs_fit
    elif assumption_key == 'production_vs_fit':
        options = actual_or_forecast(econ_function)
    # escalation_model
    elif assumption_key == 'escalation':
        options = escalation(econ_function)
    # reserves_category
    elif assumption_key == 'reserves_category':
        options = reserves_category(econ_function)
    # depreciation
    elif assumption_key == 'depreciation':
        options = depreciation(econ_function)

    cost_model_dict['options'] = options

    return cost_model_dict


## econ_to_options_dict, used in import cc to cc
ECON_TO_OPTIONS_DICT = {
    'ownership_reversion': ownership_reversion,
    'reserves_category': reserves_category,
    'expenses': expenses,
    'capex': capex,
    'stream_properties': stream_properties,
    'dates': dates,
    'pricing': pricing,
    'differentials': differentials,
    'risking': risking,
    'production_taxes': production_taxes,
    'escalation': escalation,
    'general_options': general_options,
    'production_vs_fit': actual_or_forecast,
    'depreciation': depreciation
}
