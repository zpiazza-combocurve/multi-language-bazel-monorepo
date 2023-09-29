import copy
import datetime
import json

import numpy as np
import pandas as pd
from bson.objectid import ObjectId
from dateutil import parser, relativedelta
from calendar import monthrange

from combocurve.shared.forecast_tools.forecast_segments_check import check_forecast_segments
from api.aries_phdwin_imports.error import format_error_msg, ErrorMsgEnum, ErrorMsgSeverityEnum
from api.aries_phdwin_imports.combine_rows import (aries_cc_round, get_unit_key_and_clean_row_for_taxes, copy_rows,
                                                   shift_datetime_date, get_two_tax_keys, FIXED_EXPENSE_CATEGORY)
from api.aries_phdwin_imports.aries_import_helpers import (clean_overlay_keyword, DEFAULT_TAX_EXPENSE_OBJ,
                                                           process_list_start_date_and_get_end_date,
                                                           convert_str_date_to_datetime_format)

from combocurve.shared.phdwin_import_constants import (monthly_import_header_format, PhdHeaderCols, ProductCode,
                                                       PhdwinPTEEnum)
from combocurve.shared.aries_import_enums import (ForecastEnum, UnitEnum, PhaseEnum, WellHeaderEnum, EconHeaderEnum,
                                                  CCSchemaEnum, PriceEnum, EconEnum, OverlayEnum, ReservesEnum,
                                                  TableEnum, FileDir)

from combocurve.utils.constants import DAYS_IN_YEAR, DAYS_IN_MONTH
from combocurve.science.segment_models.shared.helper import (arps_get_D_delta, arps_D_2_D_eff, arps_modified_switch)

# local import variables
user_id = ObjectId("5e7517a4c17b890012f0bada")
parallel_dic = {
    'partial_well_propnum': None,
    'user_scenarios_id': None,
    'user_forecasts_id': None,
    'batch_number': 0,
}

MAX_WELL_LIFE_NUDGE = 0.0001
MAX_ALLOWABLE_MONTHS = 1200
NUM_TRAILING_ZEROS = 3

KEYWORD_LIQUID_EXPENSE_PHASE_DICT = {
    OverlayEnum.opc_oil_gas_well.value: [PhaseEnum.oil.value, PhaseEnum.gas.value],
    OverlayEnum.ltc_oil_cnd_ini.value: [PhaseEnum.oil.value, PhaseEnum.condensate.value],
    OverlayEnum.opc_ngl_ini.value: [PhaseEnum.ngl.value],
    OverlayEnum.gpc_ngl_ini.value: [PhaseEnum.ngl.value],
    OverlayEnum.opc_cnd_ini.value: [PhaseEnum.condensate.value]
}

FIXED_EXPENSE_OVERLAY_DICT = {
    OverlayEnum.opc_oil_gas_well.value: 'OPC/OGW',
    OverlayEnum.opc_t.value: 'OPC/T',
    OverlayEnum.opc_ogw.value: 'OPC/OGW',
    OverlayEnum.oh_t.value: 'OH/T',
    OverlayEnum.oh_w.value: 'OH/W'
}

forecast_phases = [PhaseEnum.gas.value, PhaseEnum.oil.value, PhaseEnum.water.value]

yield_obj_format = {
    ForecastEnum.ngl_yield.value: '',
    CCSchemaEnum.dates.value: {
        CCSchemaEnum.start_date.value: '',
        CCSchemaEnum.end_date.value: ''
    },
    ForecastEnum.unshrunk_gas.name: ForecastEnum.unshrunk_gas.value
}

cumulative_unit_dic = {
    UnitEnum.bbl.value: (ForecastEnum.well_oil_cum.value, 1),
    UnitEnum.mb.value: (ForecastEnum.well_oil_cum.value, 1000),
    UnitEnum.mmb.value: (ForecastEnum.well_oil_cum.value, 1000000),
    UnitEnum.mcf.value: (ForecastEnum.well_gas_cum.value, 1),
    UnitEnum.mmf.value: (ForecastEnum.well_gas_cum.value, 1000),
    UnitEnum.bcf.value: (ForecastEnum.well_gas_cum.value, 1000000),
    UnitEnum.imu.value: (None, 1000),
    UnitEnum.u.value: (None, 1),
    UnitEnum.mu.value: (None, 1000)
}

overlay_shrink_dict = {
    OverlayEnum.oil_shrink.value: PhaseEnum.oil.value,
    OverlayEnum.lease_net_gas.value: PhaseEnum.gas.value
}

price_unit_for_phase_dict = {
    PhaseEnum.oil.value: PriceEnum.dollar_per_bbl.value,
    PhaseEnum.gas.value: PriceEnum.dollar_per_mcf.value,
    PhaseEnum.ngl.value: PriceEnum.dollar_per_bbl.value,
    PhaseEnum.condensate.value: PriceEnum.dollar_per_bbl.value
}

ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT = {
    OverlayEnum.opc_gas_ini.value: (PhaseEnum.gas.value, EconEnum.gathering.value),
    OverlayEnum.gtc_gas_ini.value: (PhaseEnum.gas.value, EconEnum.transport.value),
    OverlayEnum.gpc_gas.value: (PhaseEnum.gas.value, EconEnum.opc.value),
    OverlayEnum.trc_gas.value: (PhaseEnum.gas.value, EconEnum.market.value),
    OverlayEnum.cmp_gas.value: (PhaseEnum.gas.value, EconEnum.other.value),
    OverlayEnum.opc_oil_ini.value: (PhaseEnum.oil.value, EconEnum.gathering.value),
    OverlayEnum.opc_cnd_ini.value: (PhaseEnum.condensate.value, EconEnum.gathering.value),
    OverlayEnum.opc_ngl_ini.value: (PhaseEnum.ngl.value, EconEnum.gathering.value)
}

ARIES_CC_OVERLAY_PHASE_STREAM_DICT = {
    OverlayEnum.gross_oil.value: PhaseEnum.oil.value,
    OverlayEnum.gross_gas.value: PhaseEnum.gas.value,
    OverlayEnum.gross_ngl.value: PhaseEnum.ngl.value,
    OverlayEnum.gross_cnd.value: PhaseEnum.condensate.value,
}

ARIES_CC_OVERLAY_GROSS_SEV_TAX_PHASE_DICT = {
    OverlayEnum.gross_oil_sev_tax.value: PhaseEnum.oil.value,
    OverlayEnum.gross_gas_sev_tax.value: PhaseEnum.gas.value,
    OverlayEnum.gross_cnd_sev_tax.value: PhaseEnum.condensate.value,
    OverlayEnum.gross_ngl_sev_tax.value: PhaseEnum.ngl.value
}

ARIES_CC_OVERLAY_REVENUE_PHASE_DICT = {
    OverlayEnum.gross_oil_rev.value: PhaseEnum.oil.value,
    OverlayEnum.gross_gas_rev.value: PhaseEnum.gas.value,
    OverlayEnum.gross_cnd_rev.value: PhaseEnum.condensate.value,
    OverlayEnum.gross_ngl_rev.value: PhaseEnum.ngl.value
}

APPRAISED_LIQUID_EXPENSE_CONV_DICT = {
    OverlayEnum.ltc_oil_cnd_nri.value: OverlayEnum.ltc_oil_cnd_ini.value,
    OverlayEnum.appraised_opc_oil.value: OverlayEnum.gtc_gas_ini.value,
    OverlayEnum.appraised_opc_ngl.value: OverlayEnum.opc_ngl_ini.value
}

ARIES_CC_OVERLAY_SEV_TAX_RATE_PHASE_DICT = {
    OverlayEnum.oil_sev_tax_rate.value: PhaseEnum.oil.value,
    OverlayEnum.gas_sev_tax_rate.value: PhaseEnum.gas.value,
    OverlayEnum.ngl_sev_tax_rate.value: PhaseEnum.ngl.value,
    OverlayEnum.cnd_sev_tax_rate.value: PhaseEnum.condensate.value
}

CC_ARIES_DATE_EXPENSE_DICT = {
    UnitEnum.dollar_per_year.value: (PriceEnum.dollar_per_month.value, 1 / 12),
    UnitEnum.dollar_per_mcf.value: (PriceEnum.dollar_per_mcf.value, 1),
    UnitEnum.dollar_per_bbl.value: (PriceEnum.dollar_per_bbl.value, 1),
}

OPC_WELL_PHASE_DICT = {
    OverlayEnum.opc_oil_well.value: ['OPC/OWL'],
    OverlayEnum.opc_gas_well.value: ['OPC/GWL'],
    OverlayEnum.opc_oil_gas_well.value: ['OPC/OGW', 'OPC/W']
}

ARIES_ESCALATION_SYNTAX = [
    UnitEnum.dollar_escalation.value, UnitEnum.perc_compound_escalation.value, UnitEnum.perc_escalation.value,
    UnitEnum.escalation.value
]

CC_ARIES_FRAC_EXPENSE_DICT = {
    UnitEnum.perc_sign.value: (PriceEnum.pct_of_revenue.value, 1),
    UnitEnum.frac.value: (PriceEnum.pct_of_revenue.value, 100)
}

PRICE_UNITS = [
    PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_mmbtu.value, PriceEnum.pct_of_base_price.value,
    PriceEnum.price.value, PriceEnum.dollar_per_bbl.value
]

date_unit_list = [
    UnitEnum.ad.value, UnitEnum.month.value, UnitEnum.months.value, UnitEnum.incr_month.value,
    UnitEnum.incr_months.value, UnitEnum.incr_year.value, UnitEnum.incr_years.value, UnitEnum.year.value,
    UnitEnum.years.value, UnitEnum.life.value
]

date_list = date_unit_list + ['MOX']

date_obj = {CCSchemaEnum.dates.value: {CCSchemaEnum.start_date.value: '', CCSchemaEnum.end_date.value: ''}}

ZERO_LEASE_NRI = 0
DEFAULT_LEASE_NRI = 100
DEFAULT_START_DATE = '1800-12-28'
DEFAULT_BASE_DATE = '2021-01-01'
PHDWIN_ECON_LIMIT = '4/11/2262'

IGNORE_OVERHEAD_LIST = [EconEnum.opinc.value, EconEnum.zero.value, EconEnum.no.value]

reserve_classes = [ReservesEnum.proved.value, ReservesEnum.probable.value, ReservesEnum.possible.value]
reserve_sub_categories = [
    ReservesEnum.producing.value, ReservesEnum.non_producing.value, ReservesEnum.undeveloped.value,
    ReservesEnum.behind_pipe.value, ReservesEnum.shut_in.value, ReservesEnum.injection.value, ReservesEnum.p_a.value
]

variable_expenses_category = [
    EconEnum.gathering.value, EconEnum.opc.value, EconEnum.transport.value, EconEnum.market.value, EconEnum.other.value
]

cut_off_phase_code_dict = {0: PhaseEnum.gas.value, 1: PhaseEnum.water.value, 4: PhaseEnum.oil.value}

ECON_REQUIRED_COLS = [
    EconHeaderEnum.propnum.value, EconHeaderEnum.section.value, EconHeaderEnum.qualifier.value,
    EconHeaderEnum.initial_keyword.value, EconHeaderEnum.expression.value
]

SIDEFILE_REQUIRED_COLS = [
    EconHeaderEnum.file_name.value, EconHeaderEnum.section.value, EconHeaderEnum.initial_keyword.value,
    EconHeaderEnum.expression.value, EconHeaderEnum.owner.value
]

ECON_COLS = [
    EconHeaderEnum.propnum.value, EconHeaderEnum.section.value, EconHeaderEnum.sequence.value,
    EconHeaderEnum.qualifier.value, EconHeaderEnum.initial_keyword.value, EconHeaderEnum.expression.value
]

LOOKUP_REQUIRED_COLS = [
    EconHeaderEnum.name.value, EconHeaderEnum.linetype.value, EconHeaderEnum.sequence.value, EconHeaderEnum.owner.value
]

ENDDATE_RQD_COLS = [TableEnum.life.value, TableEnum.record.value]

SETUP_DATA_RQD_COLS = [TableEnum.line.value, TableEnum.line_number.value]
cc_fixed_expense_categories = [EconEnum.monthly_cost.value, EconEnum.other_cost_1.value, EconEnum.other_cost_2.value]

unit_multiplier_dict = {
    10: 1000000000,
    14: 1000000000,
    9: 1000000,
    13: 1000000,
    8: 1000,
    12: 1000,
    7: 1,
    6: 0.001,
    11: 1,
    0: None
}

ARIES_PHASE_KEYWORD_TO_CC_DICT = {
    PhaseEnum.oil.value.upper(): PhaseEnum.oil.value,
    PhaseEnum.gas.value.upper(): PhaseEnum.gas.value,
    PhaseEnum.ngl.value.upper(): PhaseEnum.ngl.value,
    PhaseEnum.aries_water.value: PhaseEnum.water.value,
    PhaseEnum.aries_condensate.value.upper(): PhaseEnum.condensate.value
}

CC_ARIES_OVERLAY_PRICE_DICT = {
    'S/195': PhaseEnum.oil.value,
    'S/196': PhaseEnum.gas.value,
    'S/197': PhaseEnum.condensate.value,
    'S/199': PhaseEnum.ngl.value
}

CC_ARIES_OVERLAY_SEV_TAX_DIC = {
    'S/872': PhaseEnum.oil.value,
    'S/873': PhaseEnum.gas.value,
    'S/874': PhaseEnum.condensate.value,
    'S/876': PhaseEnum.ngl.value
}

ESCALATION_UNIT_DICT = {
    'PE/M': ('simple', 'monthly'),
    'PE/Y': ('simple', 'yearly'),
    'PE': ('simple', 'monthly'),
    'PC/M': ('compound', 'monthly'),
    'PC': ('compound', 'monthly'),
    'PC/Y': ('compound', 'yearly'),
    '$E/M': ('constant', 'monthly'),
    '$E': ('constant', 'monthly'),
    '$E/Y': ('constant', 'yearly'),
    'SPD': ('simple', 'monthly')
}

CUSTOM_ESCALATION_UNIT_DICT = {
    ('A', '%'): ('compound', 'yearly'),
    ('M', '%'): ('compound', 'monthly'),
    ('A', '$'): ('constant', 'yearly'),
    ('M', '$'): ('constant', 'monthly')
}

CALC_MODEL_TO_ARIES_SYNTAX = {
    ('compound', 'yearly'): 'PC/Y',
    ('compound', 'monthly'): 'PC',
    ('constant', 'yearly'): '$E/Y',
    ('constant', 'monthly'): '$E'
}

RESERVE_CLASS_DICT = {
    ('PDP', 'PVPD'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.producing.value),
    ('PUD', 'UND', 'UNDEV'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.undeveloped.value),
    ('PBP', 'PVBP'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.behind_pipe.name),
    ('DUC', 'PDNP', 'PVNP', 'PNP'):
    (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.non_producing.name),
    ('SI', 'PDSI', 'SI/TA', 'TA'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.shut_in.name),
    ('ABAN', 'P&A', 'ABD', 'PA'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.p_a.value),
    ('INA', 'INJ'): (ReservesEnum.reserves.value, ReservesEnum.proved.value, ReservesEnum.injection.value),
    ('PROB', 'PRB', 'PROBABLE'):
    (ReservesEnum.reserves.value, ReservesEnum.probable.value, ReservesEnum.undeveloped.value),
    ('POS', 'POSS', 'POSSIBLE'):
    (ReservesEnum.reserves.value, ReservesEnum.possible.value, ReservesEnum.undeveloped.value),
    ('LOC', 'UNDEV'): (ReservesEnum.contingent.value, ReservesEnum.c_1.value, ReservesEnum.undeveloped.value)
}

REVERSION_DEFAULT_OBJ = {
    "no_reversion": "",
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

OWNERSHIP_KEYS = [
    'first_reversion', 'second_reversion', 'third_reversion', 'fourth_reversion', 'fifth_reversion', 'sixth_reversion',
    'seventh_reversion', 'eighth_reversion', 'ninth_reversion', 'tenth_reversion'
]

MAX_CUM_CASH_FLOW_DICT = {
    "max_cum_cash_flow": "",
    "include_capex": "no",
    "discount": 0,
    "econ_limit_delay": 0,
    "side_phase_end": "no"
}

MAX_CUM_CASH_FLOW_DICT_PMAX = {
    "max_cum_cash_flow": "",
    "include_capex": "yes",
    "discount": 0,
    "econ_limit_delay": 0,
    "side_phase_end": "no"
}

FIRST_NEG_CASH_FLOW = {'first_negative_cash_flow': '', "include_capex": "no", "discount": 0, "econ_limit_delay": 0}

PRICE_SIGN_DICT = {'OIL': '$/B', 'GAS': '$/M', 'NGL': '$/B', 'CND': '$/B'}

LAST_POS_CASH_FLOW_DICT = {
    "last_positive_cash_flow": "",
    "include_capex": "no",
    "discount": 0,
    "econ_limit_delay": 0,
    "side_phase_end": "no"
}

NUMBER_OF_PRICE_PHASE = 4
RATE_CUT_OFF = {PhaseEnum.oil.value.upper(): 'oil_rate', PhaseEnum.gas.value.upper(): 'gas_rate'}

ARIES_LIFE_MULTIPLER_OPERATOR = 'TO LIFE MUL'

MAX_DATE_INDEX = (np.datetime64(pd.to_datetime(pd.Timestamp.max), 'D') - np.datetime64('1900-01-01')).astype(int).item()

DEFAULT_ASOF_OPTION = {
    "criteria": {
        "label": "As of Date",
        "value": "as_of_date",
        "staticValue": "",
        "fieldType": "static",
        "fieldName": "As of Date"
    },
    "value": "",
    "criteriaHeader": True
}

SHUT_IN_ROWS = {"phase": "oil", "unit": "day", "multiplier": 1, "fixed_expense": "yes", "capex": "yes"}

DEFAULT_ESCALATION_DATES = {
    CCSchemaEnum.start_date.value: "1800-1-31",
    CCSchemaEnum.end_date.value: EconEnum.econ_limit.value
}

DEFAULT_ARIES_ASOF_ECON = {EconEnum.asof_date.value: ""}

DEFAULT_PRICE_UNIT_DICT = {
    PhaseEnum.oil.value: 'price',
    PhaseEnum.gas.value: 'dollar_per_mcf',
    PhaseEnum.ngl.value: 'dollar_per_bbl',
    PhaseEnum.condensate.value: 'dollar_per_bbl'
}
STREAM_PRICE_KEYWORD_DICT = {
    'S/195': PhaseEnum.oil.value,
    'S/196': PhaseEnum.gas.value,
    'S/197': PhaseEnum.condensate.value,
    'S/199': PhaseEnum.ngl.value
}

DEFAULT_TAX_UNIT_DICT = {
    PhaseEnum.oil.value: 'dollar_per_bbl',
    PhaseEnum.gas.value: 'dollar_per_mcf',
    PhaseEnum.ngl.value: 'dollar_per_bbl',
    PhaseEnum.condensate.value: 'dollar_per_bbl'
}

DEFAULT_DIFF_UNIT_DICT = {
    PhaseEnum.oil.value: 'dollar_per_bbl',
    PhaseEnum.gas.value: 'dollar_per_mcf',
    PhaseEnum.ngl.value: 'dollar_per_bbl',
    PhaseEnum.condensate.value: 'dollar_per_bbl'
}

SHRINKAGE_PHASE_DICT = {
    OverlayEnum.sales_oil.value: PhaseEnum.oil.value,
    OverlayEnum.sales_gas.value: PhaseEnum.gas.value,
    'SHK/GAS': PhaseEnum.gas.value,
    OverlayEnum.net_oil.value: PhaseEnum.oil.value,
    OverlayEnum.net_gas.value: PhaseEnum.gas.value
}

SHRINKAGE_KEY_DICT = {
    PhaseEnum.oil.value: ['shrinkage', 'oil_loss'],
    PhaseEnum.gas.value: ['shrinkage', 'gas_loss', 'gas_flare']
}


def date_aries_to_cc(aries_date_str, propnum):
    aries_date_list = aries_date_str.split('/')
    if len(aries_date_list) == 2:
        year = aries_date_list[1]
        month = aries_date_list[0]
        return year + '-' + month + '-01'
    elif len(aries_date_list) == 3:
        year = aries_date_list[2]
        month = aries_date_list[0]
        return year + '-' + month + '-01'
    else:
        return None


def yield_val_calculation(value_int, value_end, keyword, unit, shrink, risk, error_report, expression, well_id,
                          scenario, section):
    value = None
    if shrink:
        if unit == UnitEnum.frac.value:
            value_int *= 100
            value_end *= 100

        value = ((value_int) + (value_end)) / 2
    elif risk:
        value = process_risk_value(value_int, value_end, keyword, unit, error_report, expression, well_id, scenario)
    elif unit == UnitEnum.bpm.value or unit == UnitEnum.frac.value:
        value = ((value_int * 1000) + (value_end * 1000)) / 2
    elif unit == UnitEnum.bpmcf.value:
        value = (value_int + value_end) / 2
    return value


def process_risk_value(value_int, value_end, keyword, unit, error_report, expression, well_id, scenario):
    if unit != UnitEnum.perc_sign.value:
        value_int *= 100
        if value_end is not None:
            value_end *= 100
    if value_end is not None:
        value = (value_int + value_end) / 2
    else:
        value = value_int
    if 'MUL' in keyword and value == 0:
        value = 100

    # Error catch for negative multipliers not handled by CC. Default to 100%
    if value < 0:
        error_report.log_error(aries_row=str_join(expression),
                               message=ErrorMsgEnum.negative_multiplier.value,
                               scenario=scenario,
                               well=well_id,
                               model=None,
                               severity=ErrorMsgSeverityEnum.error.value)
        value = 100
    return value


def parse_mul_factor_value(document_rows: list[dict], keyword: str, expression: str, *args, **kwargs):
    """

    Args:
        document_rows:
        keyword:
        expression:
        *args:
        **kwargs:

    Returns:

    """
    try:
        unit = expression[2]
    except IndexError:
        unit = '%' if 'MUL' in keyword else 'FRAC'

    for row in document_rows:
        row['multiplier'] = process_risk_value(row['multiplier'], row['multiplier'], keyword, unit,
                                               kwargs['error_report'], expression, kwargs['well_id'],
                                               kwargs['scenario'])


def convert_arps_exp_to_modified_arps(data):
    phase_ls = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value]
    keys = list(data.keys())

    for key in keys:
        well_scenario_data = data[key]
        for phase in phase_ls:
            segments = well_scenario_data[ForecastEnum.data.value][phase][ForecastEnum.p_dict.value][
                ForecastEnum.best.value][ForecastEnum.segments.value]
            prev_segment_name = None
            for i, segment in enumerate(segments):
                if segment[ForecastEnum.name.
                           value] == ForecastEnum.exp_dec.value and prev_segment_name == ForecastEnum.arps.value:
                    arps_index = i - 1
                    exp_index = i
                    delta_arps = float(segments[arps_index][ForecastEnum.end_index.value]) - float(
                        segments[arps_index][ForecastEnum.start_index.value])
                    b = segments[arps_index][ForecastEnum.b.value]
                    d_arps_end = arps_get_D_delta(segments[arps_index][ForecastEnum.d.value], b, delta_arps)
                    d_eff_arps_end = arps_D_2_D_eff(d_arps_end, b)
                    condition_1 = check_near_equality(float(segments[arps_index][ForecastEnum.q_end.value]),
                                                      float(segments[exp_index][ForecastEnum.q_start.value]))
                    condition_2 = check_near_equality(d_eff_arps_end, segments[exp_index][ForecastEnum.d_eff.value])

                    if condition_1 and condition_2:
                        updated_segment_dic = arps_modified_switch(segments[arps_index][ForecastEnum.start_index.value],
                                                                   b, segments[arps_index][ForecastEnum.d.value],
                                                                   segments[exp_index][ForecastEnum.d_eff.value])

                        this_segment = copy.deepcopy(common_template)
                        this_segment.update(arps_modified_template)
                        this_segment[ForecastEnum.start_index.value] = segments[arps_index][
                            ForecastEnum.start_index.value]
                        this_segment[ForecastEnum.end_index.value] = segments[exp_index][ForecastEnum.end_index.value]
                        this_segment[ForecastEnum.q_start.value] = segments[arps_index][ForecastEnum.q_start.value]
                        this_segment[ForecastEnum.q_end.value] = segments[exp_index][ForecastEnum.q_end.value]
                        this_segment[ForecastEnum.d_eff.value] = segments[arps_index][ForecastEnum.d_eff.value]
                        this_segment[ForecastEnum.d.value] = segments[arps_index][ForecastEnum.d.value]
                        this_segment[ForecastEnum.b.value] = segments[arps_index][ForecastEnum.b.value]
                        this_segment[ForecastEnum.switch_index.value] = segments[exp_index][
                            ForecastEnum.start_index.value]
                        this_segment[ForecastEnum.q_switch.value] = segments[exp_index][ForecastEnum.q_start.value]
                        this_segment[ForecastEnum.d_exp_eff.value] = segments[exp_index][ForecastEnum.d_eff.value]
                        this_segment[ForecastEnum.d_exp.value] = segments[exp_index][ForecastEnum.d.value]
                        this_segment[ForecastEnum.r_d_eff_sw.value] = updated_segment_dic[ForecastEnum.r_d_eff_sw.value]
                        this_segment[ForecastEnum.t_d_eff_sw.value] = updated_segment_dic[ForecastEnum.r_d_eff_sw.value]

                        del segments[arps_index:exp_index + 1]
                        segments.insert(arps_index, this_segment)
                        # assuming only one modified arps segment can exist per phase
                        break
                prev_segment_name = segment[ForecastEnum.name.value]


def convert_document_to_list(document, ids, property_id, scenario, data, scenarios_dic, project_dic,
                             compare_and_save_data_list):
    if document is not None:
        # create wells set
        document[CCSchemaEnum.wells.value] = set()
        # if document name is not empty and not an initial overlay model and 'OL_1' to name
        if document[CCSchemaEnum.name.value] and 'OL' not in document[CCSchemaEnum.name.value]:
            document[CCSchemaEnum.name.value] = document[CCSchemaEnum.name.value] + '_OL_0001'
        # else if document name is empty (risking and actual vs forecast) create name based on assumption key and 'OL_1'
        elif not document[CCSchemaEnum.name.value]:
            document[
                CCSchemaEnum.name.value] = f'ARIES_CC_{document[CCSchemaEnum.assumption_key.value].upper()}_OL_0001'
        # save into data list
        for _id in ids:
            if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                document[CCSchemaEnum.wells.value].add((_id, property_id))

        compare_and_save_data_list(document, data, project_dic, aries=True)


def check_for_previous_overlay_model(document, models):
    # loop through model document in model list
    for model in models:
        # if name already exist check new name based on sequence (1,2,3...) till unique name is found
        if model[CCSchemaEnum.name.value] == document[CCSchemaEnum.name.value]:
            name = document[CCSchemaEnum.name.value]
            document[CCSchemaEnum.name.value] = f'{name.rsplit("_", 1)[0]}_{int(name.split("_")[-1]) + 1} '


def convert_expense_dates_to_offset(document, asof, fpd):
    # get asof and fpd
    asof = pd.to_datetime(asof, errors='coerce')
    fpd = pd.to_datetime(fpd, errors='coerce')

    for expense_type in ['variable', 'fixed']:
        if expense_type == 'variable':
            # loop through phases
            for phase in [
                    PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
                    PhaseEnum.water.value
            ]:
                if phase != PhaseEnum.water.value:
                    for category in variable_expenses_category:
                        rows = copy_rows(document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category]
                                         [EconEnum.rows.value])
                        rows = convert_dates_to_offset(rows, asof, fpd)

                        document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                            EconEnum.rows.value] = rows
                else:
                    rows = copy_rows(
                        document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value])
                    rows = convert_dates_to_offset(rows, asof, fpd)
                    document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value] = rows
        else:
            # loop through fixed expense category
            for category in FIXED_EXPENSE_CATEGORY:
                rows = copy_rows(
                    document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][EconEnum.rows.value])
                rows = convert_dates_to_offset(rows, asof, fpd)
                document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                    EconEnum.rows.value] = rows

    return document


def convert_tax_dates_to_offset(document, asof, fpd):
    # get asof and fpd
    asof = pd.to_datetime(asof, errors='coerce')
    fpd = pd.to_datetime(fpd, errors='coerce')

    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        sev_tax_rows = copy_rows(
            document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value])
        rows = convert_dates_to_offset(sev_tax_rows, asof, fpd)
        document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value] = rows

    adval_tax_rows = copy_rows(document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value])
    rows = convert_dates_to_offset(adval_tax_rows, asof, fpd)
    document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value] = rows

    return document


def update_max_econ_settings(end_date,
                             dates_data_list,
                             dates_1_base_date,
                             well_id,
                             scenario,
                             ls_scenarios_id,
                             scenarios_dic,
                             projects_dic,
                             get_default_format,
                             compare_and_save_into_self_data_list,
                             effective=False):
    ignore = False
    dates_default_document = get_well_doc_overlay(dates_data_list, well_id, ls_scenarios_id)
    if dates_default_document is None:
        dates_default_document = copy.deepcopy(dates_data_list[0])
    document_name = dates_default_document[CCSchemaEnum.name.value].rsplit('_', 1)[0]
    if effective:
        try:
            end_date = aries_cc_round(float(end_date))
        except ValueError:
            end_date = None
        if end_date is not None:
            if end_date < float(dates_default_document[EconEnum.econ_function.value][EconEnum.dates_setting.value][
                    EconEnum.max_well_life.value]):
                end_date = 0 if end_date < 0 else end_date
                dates_default_document[EconEnum.econ_function.value][EconEnum.dates_setting.value][
                    EconEnum.max_well_life.value] = end_date
            else:
                ignore = True
        else:
            ignore = True
    else:
        try:
            asof_date = pd.to_datetime(dates_default_document[EconEnum.econ_function.value][
                EconEnum.dates_setting.value][EconEnum.asof_date.value][EconEnum.date.value])
        except KeyError:
            asof_date = pd.to_datetime(dates_1_base_date)
        year = get_aries_number_of_year_between(end_date, asof_date)
        if year < float(dates_default_document[EconEnum.econ_function.value][EconEnum.dates_setting.value][
                EconEnum.max_well_life.value]):
            year = 0 if year < 0 else year
            dates_default_document[EconEnum.econ_function.value][EconEnum.dates_setting.value][
                EconEnum.max_well_life.value] = year
        else:
            ignore = True

    if not ignore:
        check_and_remove_well_from_previous_model(dates_data_list, [(well_id, scenario)], well_id, scenario,
                                                  ls_scenarios_id)
        dates_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
        dates_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()
        dates_default_document[CCSchemaEnum.wells.value] = set()

        for _id in ls_scenarios_id:
            if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                dates_default_document[CCSchemaEnum.wells.value].add((_id, well_id))
        compare_and_save_into_self_data_list(dates_default_document,
                                             dates_data_list,
                                             projects_dic,
                                             model_name=document_name,
                                             aries=True)


def update_life_from_major_phase(df, major_phase, asof_date, well_id, scenario, scenarios_dic, ls_scenarios_id,
                                 data_list, forecast_datas_dic, projects_dic, compare_and_save_into_self_data_list):

    # check if major_phase is not None
    if major_phase is None:
        return
    # set major_phase to lower case
    major_phase = major_phase.lower()
    # get the forecast lines of the major phase and get the qualifier
    major_df = df[df[:, 4] == major_phase.upper()]
    major_qualifier = None if major_df.size == 0 else major_df[0, 3]

    for _id in projects_dic:
        # get forecast parameters of the major phase
        forecast_param = forecast_datas_dic.get((scenario, _id, major_qualifier, well_id))

    # if forecast parameters is None, ignore
    if forecast_param is None:
        return

    # if major phase is neither oil or gas (it must be, this is a fail safe) ignore it
    if major_phase not in [PhaseEnum.oil.value, PhaseEnum.gas.value]:
        return

    # get end date of the major phase, if an error is encountered, ignore
    try:
        major_end_date = get_forecast_date_from_index(
            forecast_param[ForecastEnum.data.value][major_phase][ForecastEnum.p_dict.value][ForecastEnum.best.value][
                ForecastEnum.segments.value][-1][ForecastEnum.end_index.value])
    except (IndexError, KeyError):
        return

    # convert end date to datetime format
    major_end_date = pd.to_datetime(major_end_date, errors='coerce')

    # get date documents of that well and scenario
    document = get_well_doc_overlay(data_list, well_id, ls_scenarios_id)

    # if document cannot be gotten (highly unlikely), ignore
    if document is None:
        return

    # get right document name, base date and max well life
    document_name = document[CCSchemaEnum.name.value].rsplit('_', 1)[0]
    max_life = document[EconEnum.econ_function.value]['dates_setting']['max_well_life']

    # convert base date to datetime format
    asof_date = pd.to_datetime(asof_date, errors='coerce')

    # if any of the base date or major end date is not a date ignore
    if pd.isnull(asof_date) or pd.isnull(major_end_date):
        return

    # get the years between the major end date and the asof date
    year_to_major_end_date = get_aries_number_of_year_between(major_end_date, asof_date)

    year_to_major_end_date = 0 if year_to_major_end_date < 0 else year_to_major_end_date
    # IMPORTANT
    # if max well life is greater than the time to hit the major end date, change max well life to the
    # years required to hit the major end date
    if max_life > year_to_major_end_date and year_to_major_end_date >= 0:
        document[EconEnum.econ_function.value]['dates_setting']['max_well_life'] = year_to_major_end_date
        check_and_remove_well_from_previous_model(data_list, [(well_id, scenario)], well_id, scenario, ls_scenarios_id)
        document[CCSchemaEnum.created.value] = datetime.datetime.now()
        document[CCSchemaEnum.updated.value] = datetime.datetime.now()
        document[CCSchemaEnum.wells.value] = set()

        for _id in ls_scenarios_id:
            if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                document[CCSchemaEnum.wells.value].add((_id, well_id))
        compare_and_save_into_self_data_list(document, data_list, projects_dic, model_name=document_name, aries=True)


def merge_phase_ac_property_and_economic(major_phase, well_id, scenario, wells_dic, error_report):
    # Default to ECONOMIC phase if available, else use PROPERTY Major Phase
    major_phase_ac_property = wells_dic[well_id][CCSchemaEnum.primary_product.value]
    if major_phase_ac_property is not None:
        major_phase_ac_property = str(major_phase_ac_property).lower()
    if major_phase is not None:
        major_phase = str(major_phase).lower()
    else:
        major_phase = major_phase_ac_property

    if major_phase is not None and major_phase_ac_property is not None:
        # throw warning message if Economic and Property phases don't match
        if major_phase_ac_property != major_phase:
            error_report.log_error(aries_row='',
                                   message=ErrorMsgEnum.phase_mismatch.value,
                                   scenario=scenario,
                                   well=well_id,
                                   model=ErrorMsgEnum.forecast.value,
                                   severity=ErrorMsgSeverityEnum.warn.value)
    return major_phase


def update_param_document_based_on_life_cutoff(life_dict, economic_df, major_phase, well_id, scenario, ls_scenarios_id,
                                               wells_dic, scenarios_dic, projects_dic, dates_1_base_date,
                                               dates_data_list, forecast_datas_dic,
                                               compare_and_save_into_self_data_list, get_default_format, error_report):
    key = list(life_dict.keys())[-1]
    if key == CCSchemaEnum.dates.value:
        set_end_date = life_dict[key]
        update_max_econ_settings(set_end_date, dates_data_list, dates_1_base_date, well_id, scenario, ls_scenarios_id,
                                 scenarios_dic, projects_dic, get_default_format, compare_and_save_into_self_data_list)
    elif key == CCSchemaEnum.major.value:
        # Default to ECONOMIC phase if available, else use PROPERTY Major Phase

        major_df = economic_df[economic_df[:, 4] == major_phase.upper()]
        major_qualifier = None if major_df.size == 0 else major_df[0, 3]
        for _id in projects_dic:
            forecast_param = forecast_datas_dic.get((scenario, _id, major_qualifier, well_id))
        if forecast_param is not None:
            if major_phase in [PhaseEnum.oil.value, PhaseEnum.gas.value]:
                major_end_date = get_forecast_date_from_index(
                    forecast_param[ForecastEnum.data.value][major_phase][ForecastEnum.p_dict.value][
                        ForecastEnum.best.value][ForecastEnum.segments.value][0][ForecastEnum.start_index.value])
                day_shift, month_shift, year_shift = get_day_month_year_from_decimal_date(life_dict[key])
                major_end_date = pd.to_datetime(major_end_date)
                major_end_date += pd.DateOffset(months=month_shift, days=day_shift, years=year_shift)
                update_max_econ_settings(major_end_date, dates_data_list, dates_1_base_date, well_id, scenario,
                                         ls_scenarios_id, scenarios_dic, projects_dic, get_default_format,
                                         compare_and_save_into_self_data_list)
    elif key == CCSchemaEnum.base.value:
        base_end_date = pd.to_datetime(dates_1_base_date).strftime(CCSchemaEnum.mdy_date_slash_format.value)
        day_shift, month_shift, year_shift = get_day_month_year_from_decimal_date(life_dict[key])
        base_end_date = pd.to_datetime(base_end_date)
        base_end_date += pd.DateOffset(months=month_shift, days=day_shift, years=year_shift)
        # ref_idx = get_forecast_date_index(base_end_date, end=True)
        update_max_econ_settings(base_end_date, dates_data_list, dates_1_base_date, well_id, scenario, ls_scenarios_id,
                                 scenarios_dic, projects_dic, get_default_format, compare_and_save_into_self_data_list)
    elif key == CCSchemaEnum.effective.value:
        well_life = life_dict[key]
        update_max_econ_settings(well_life,
                                 dates_data_list,
                                 dates_1_base_date,
                                 well_id,
                                 scenario,
                                 ls_scenarios_id,
                                 scenarios_dic,
                                 projects_dic,
                                 get_default_format,
                                 compare_and_save_into_self_data_list,
                                 effective=True)


def process_multiple_net_values(expression, wi, nri_oil, nri_gas, npi):
    # unit is typically the 5th item in an ownership expression
    try:
        unit = expression[4]
    except IndexError:
        unit = None

    # if the unit cannot be found on the 5th item go to the 4th item
    if unit is None:
        try:
            unit = expression[3]
        except IndexError:
            unit = None

    wi = update_ownership_param_for_summation(wi, expression, unit, 0)
    nri_oil = update_ownership_param_for_summation(nri_oil, expression, unit, 1)
    nri_gas = update_ownership_param_for_summation(nri_gas, expression, unit, 2)
    npi = update_ownership_param_for_summation(npi, expression, unit, 3)

    return wi, nri_oil, nri_gas, npi


def update_ownership_param_for_summation(own_param, expression, unit, idx):
    if own_param is not None:
        try:
            new_own_param = float(expression[idx])
            if unit == UnitEnum.frac.value:
                new_own_param *= 100
        except (IndexError, ValueError):
            new_own_param = 0
        own_param += new_own_param
    return own_param


def update_well_life_dict(expression, life_dict):
    date = pd.to_datetime(expression[0], errors='coerce')
    if not pd.isnull(date):
        well_end_date = pd.to_datetime(expression[0], errors='coerce')
        if not pd.isnull(well_end_date):
            life_dict[CCSchemaEnum.dates.value] = well_end_date
    else:
        try:
            _, month, year = get_day_month_year_from_decimal_date(float(expression[0]))
            well_life = year + round((month / 12), 4) + MAX_WELL_LIFE_NUDGE
        except ValueError:
            well_life = None
        try:
            criteria = expression[1]
        except IndexError:
            criteria = 'BASE'

        if well_life is not None:
            if criteria == 'MAJ':
                life_dict[CCSchemaEnum.major.value] = well_life
            elif criteria == 'EFF':
                life_dict[CCSchemaEnum.effective.value] = well_life
            elif criteria == 'BASE':
                life_dict[CCSchemaEnum.base.value] = well_life
            else:
                life_dict[CCSchemaEnum.base.value] = well_life
    return life_dict


def check_near_equality(var1, var2, tolerance=5):
    """
    Check if two values are equal within range of tolerance

    Tolerance (%)
    var1, var2 (float)

    returns True(bool) if True and False if not
    """
    return_bool = False
    tolerance /= 100
    if (var1 >= var2 * (1 - tolerance)) and (var1 <= var2 * (1 + tolerance)):
        return_bool = True
    return return_bool


def get_phdwin_major_phase_wc(document, major_dic):
    phase = major_dic.get(document[PhdHeaderCols.lse_id.name])
    if phase is not None:
        phase = phase.strip().lower()
        if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value]:
            return PhaseEnum.water.value, phase
        else:
            return PhaseEnum.water.value, PhaseEnum.oil.value
    else:
        return PhaseEnum.water.value, PhaseEnum.oil.value


def get_phdwin_ratio_product_phases(code, type_code, document, major_dic):
    if type_code == 6:
        product_name = str(document['productname']).lower().strip()
        if product_name in ['oil', 'gas', 'water']:
            return (product_name, str(document['base_phase']).lower().strip())
        else:
            return (None, None)

    if code in phdwin_ratio_product_code and code != ProductCode.wc.value:
        return phdwin_ratio_product_code[code]
    elif code == ProductCode.wc.value:
        return phdwin_ratio_product_code[code](document, major_dic)
    else:
        return (None, None)


def convert_wc_to_wr(document):
    # prevent divide by 0 error, add error message for unable to convert
    if document[ForecastEnum.qi.value] in [0, 100] or document[ForecastEnum.qend.value] in [0, 100]:
        return document, False

    multiplier = 1 if document.get('unitsn_name') == '%' else 100
    document[ForecastEnum.qi.value] = ((document[ForecastEnum.qi.value] / 100) /
                                       (1 - document[ForecastEnum.qi.value] / 100)) * multiplier
    document[ForecastEnum.qend.value] = ((document[ForecastEnum.qend.value] / 100) /
                                         (1 - document[ForecastEnum.qend.value] / 100)) * multiplier

    return document, True


#####################
# FORECAST TEMPLATES

common_template = {
    ForecastEnum.start_index.value: 0,
    ForecastEnum.end_index.value: 31,
    ForecastEnum.q_start.value: 1,
    ForecastEnum.q_end.value: MAX_ALLOWABLE_MONTHS
}

exp_inc_template = {
    ForecastEnum.name.value: ForecastEnum.exp_inc.value,
    ForecastEnum.slope.value: 1,
    ForecastEnum.d_eff.value: -0.5,
    ForecastEnum.d.value: -0.67
}

exp_dec_template = {
    ForecastEnum.name.value: ForecastEnum.exp_dec.value,
    ForecastEnum.slope.value: -1,
    ForecastEnum.d_eff.value: 0.5,
    ForecastEnum.d.value: 0.67
}

arps_modified_template = {
    ForecastEnum.name.value: ForecastEnum.arps_modified.value,
    ForecastEnum.b.value: 2,
    ForecastEnum.d_eff.value: 0.5,
    ForecastEnum.d_exp_eff.value: 0.06,
    ForecastEnum.d_exp.value: 0.012,
    ForecastEnum.d.value: 0.67,
    ForecastEnum.q_switch.value: 1230,
    ForecastEnum.r_d_eff_sw.value: 0.06,
    ForecastEnum.slope.value: -1,
    ForecastEnum.switch_index.value: 21.1,
    ForecastEnum.t_d_eff_sw.value: 0.06,
}

flat_template = {
    ForecastEnum.name.value: ForecastEnum.flat.value,
    ForecastEnum.slope.value: 0,
    ForecastEnum.c.value: 123
}

empty_template = {ForecastEnum.name.value: ForecastEnum.empty.value, ForecastEnum.slope.value: 0}

arps_template = {
    ForecastEnum.name.value: ForecastEnum.arps.value,
    ForecastEnum.slope.value: -1,
    ForecastEnum.b.value: 2,
    ForecastEnum.d_eff.value: 0.5,
    ForecastEnum.d.value: 0.67
}

templates = {
    ForecastEnum.commom.value: common_template,
    ForecastEnum.exp_inc.value: exp_inc_template,
    ForecastEnum.exp_dec.value: exp_dec_template,
    ForecastEnum.arps.value: arps_template,
    ForecastEnum.arps_modified.value: arps_modified_template,
    ForecastEnum.flat.value: flat_template,
    ForecastEnum.empty.value: empty_template,
    ForecastEnum.ratio.value: common_template
}

phdwin_ratio_product_code = {
    ProductCode.gor.value: [PhaseEnum.gas.value, PhaseEnum.oil.value],
    ProductCode.ogr.value: [PhaseEnum.oil.value, PhaseEnum.gas.value],
    ProductCode.wor.value: [PhaseEnum.water.value, PhaseEnum.oil.value],
    ProductCode.wgr.value: [PhaseEnum.water.value, PhaseEnum.gas.value],
    ProductCode.wc.value: get_phdwin_major_phase_wc
}

phdwin_ratio_multiplier = {
    ProductCode.gor.value: 1 / 1000,
    ProductCode.ogr.value: 1000,
    ProductCode.wor.value: 1,
    ProductCode.wgr.value: 1000,
    ProductCode.wc.value: 1 / 100
}


def check_arps_modified_segment(document):
    if document['target_D_eff_sw'] > document['D_eff']:
        document['target_D_eff_sw'] = document['D_eff']
        document['realized_D_eff_sw'] = document['D_eff']
        document['sw_idx'] = document[ForecastEnum.start_index.value]
        document['q_sw'] = document['q_start']

    return document


#############
# Check Forecast Segments for incline type
def check_exp_inc_dec(d, segment):
    if d <= 0:
        segment.update(exp_inc_template)
    else:
        segment.update(exp_dec_template)
    return segment


def get_reserve_class_for_well(reserve_class):
    for key in RESERVE_CLASS_DICT:
        if any(value in reserve_class for value in key):
            return RESERVE_CLASS_DICT[key]
    return (None, None, None)


def check_if_use_fpd_asof(start_date, wells_dic, as_of_date, well_id):
    use_fpd, use_asof = False, False
    first_prod_date = wells_dic[well_id].get('first_prod_date')
    if pd.to_datetime(start_date) == pd.to_datetime(first_prod_date, errors='coerce'):
        use_fpd = True
    elif pd.to_datetime(start_date) == pd.to_datetime(as_of_date, errors='coerce'):
        use_asof = True
    return use_fpd, use_asof


def remove_escalation_own_df(section_economic_df, expression_index, keyword_index, section_index, property_id, scenario,
                             log_report):
    n = section_economic_df.shape[0]
    for i in range(n):
        expression = section_economic_df[i, expression_index]
        keyword = section_economic_df[i, keyword_index]
        section = section_economic_df[i, section_index]
        if keyword == 'TEXT' or section != 7:
            continue

        for escalation_syntax in ARIES_ESCALATION_SYNTAX + ['FLAT']:
            if escalation_syntax in str(expression).split():
                if escalation_syntax not in ['FLAT']:
                    log_report.log_error(aries_row=expression,
                                         message=ErrorMsgEnum.ownership_escalation_error.value,
                                         scenario=scenario,
                                         well=property_id,
                                         model=ErrorMsgEnum.ownership.value,
                                         section=7,
                                         severity=ErrorMsgSeverityEnum.warn.value)
                expression = expression.split(escalation_syntax)[0]
                section_economic_df[i, expression_index] = expression.strip()
                break

    return section_economic_df


def update_fpd_asof_date(obj,
                         start,
                         formated_start_date,
                         formated_end_date,
                         use_fpd,
                         use_asof,
                         start_asof,
                         start_fpd,
                         life=False,
                         price_diff=False,
                         incremental=False):
    period = None
    if use_asof or use_fpd:
        if not life:
            period = round((formated_end_date - formated_start_date).days / DAYS_IN_MONTH)
        if use_fpd and not price_diff:
            obj = get_offset_obj(life, start_fpd, start, period, obj, EconEnum.fpd_offset.value, incremental)
            return obj
        elif use_asof:
            obj = get_offset_obj(life, start_asof, start, period, obj, EconEnum.asof_offset.value, incremental)
            return obj
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = formated_start_date.strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    if life:
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = formated_end_date
    else:
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = formated_end_date.strftime(
            CCSchemaEnum.ymd_date_dash_format.value)
    return obj


def get_offset_obj(life, offset_start, start, period, obj, offset_type, incremental):
    del obj[CCSchemaEnum.dates.value]
    if offset_start:
        if life:
            period = MAX_ALLOWABLE_MONTHS
            end = EconEnum.econ_limit.value
        else:
            end = period
        obj[offset_type] = {CCSchemaEnum.start.value: 1, CCSchemaEnum.end.value: end, EconEnum.period.value: period}
    else:
        if start is not None:
            if not incremental and not life:
                period -= start
            if life:
                period = MAX_ALLOWABLE_MONTHS - start
                end = EconEnum.econ_limit.value
            else:
                end = period + start
            obj[offset_type] = {
                CCSchemaEnum.start.value: start + 1,
                CCSchemaEnum.end.value: end,
                EconEnum.period.value: period
            }

    try:
        if period <= 0:
            return DEFAULT_TAX_EXPENSE_OBJ
    except (ValueError, TypeError):
        pass

    return obj


def convert_dates_to_offset(rows, asof, fpd):
    """
    Changes the criteria of the document, if the start_date is either the asof date or fpd
    """

    # get the intial start
    if len(rows) < 1 or 'dates' not in rows[0]:
        return rows
    start_date = pd.to_datetime(rows[0]['dates']['start_date'], errors='coerce')

    # identify which key to use if the initial start date is same as first production date and asof date
    key = None
    if not pd.isnull(start_date):
        if start_date == asof:
            key = 'offset_to_as_of_date'
        elif start_date == fpd:
            key = 'offset_to_fpd'

    # change date criteria to offset criteria based on key
    rows = change_date_criteria_to_offset(rows, key)

    return rows


def change_date_criteria_to_offset(rows, key):
    if key is None:
        return rows
    prev_end = 0
    for row in rows:
        date_dict = row.get('dates')
        if date_dict is None:
            continue
        start_date = pd.to_datetime(date_dict['start_date'])
        end_date = date_dict['end_date']
        row.pop('dates')
        if end_date == 'Econ Limit':
            row[key] = {'start': prev_end + 1, 'end': end_date, 'period': 1200 - prev_end}
        else:
            end_date = pd.to_datetime(date_dict['end_date'])
            ini_period = round((end_date - start_date).days / DAYS_IN_MONTH)
            row[key] = {'start': prev_end + 1, 'end': prev_end + ini_period, 'period': ini_period}
            prev_end += ini_period
    return rows


def add_reservoir_category(property_id, scenario, ls_scenarios_id, wells_dic, scenarios_dic, projects_dic,
                           reserves_data_list, get_default_format, compare_and_save_into_self_data_list):
    reserve_class = wells_dic[property_id].get(EconEnum.prms_cat.value)
    if reserve_class is not None:
        reserve_class = ''.join([str(char) for char in reserve_class if str(char).isalpha()])
        reserves_default_document = get_default_format(EconEnum.reserves_category.value)
        res_class, res_cat, res_sub_cat = get_reserve_class_for_well(reserve_class)
        if res_class is not None and res_cat is not None and res_sub_cat is not None:
            reserves_default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
                EconEnum.prms_class.value] = res_class
            reserves_default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
                EconEnum.prms_cat.value] = res_cat
            reserves_default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
                EconEnum.prms_sub_cat.value] = res_sub_cat

            for _id in ls_scenarios_id:
                if scenarios_dic[_id]['name'] == scenario:
                    reserves_default_document['wells'].add((_id, property_id))
            compare_and_save_into_self_data_list(reserves_default_document,
                                                 reserves_data_list,
                                                 projects_dic,
                                                 aries=True)


def name_reserves_model(document):
    prms_class = document[EconEnum.econ_function.value][EconEnum.reserves_category.value][EconEnum.prms_class.value]
    prms_cat = document[EconEnum.econ_function.value][EconEnum.reserves_category.value][EconEnum.prms_cat.value]
    prms_sub_cat = document[EconEnum.econ_function.value][EconEnum.reserves_category.value][EconEnum.prms_sub_cat.value]
    prms_class = str(prms_class[0]).upper() + str(prms_class[1:])
    prms_cat = str(prms_cat[0]).upper() + str(prms_cat[1:])
    prms_sub_cat = str(prms_sub_cat[0]).upper() + str(prms_sub_cat[1:])
    document[CCSchemaEnum.name.value] = f'{prms_class}, {prms_cat}, {prms_sub_cat}'

    return document


# convert well monthly data to format accpeted by well import pipeline
def monthly_phd_well_format(data):
    months = [
        'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november',
        'december'
    ]

    phase_splice_dict = {'oil': [], 'gas': [], 'water': [], 'wellcount': []}

    for phase in phase_splice_dict:
        for month in months:
            phase_splice_dict[phase].append(phase + month)

    use_columns = ['phdwin_id', 'lse_name', 'lse_id', 'year', 'month', 'oil', 'gas', 'water', 'wellcount']

    for phase, splice in phase_splice_dict.items():
        data[phase] = list(data[splice].values)

    data['month'] = [[j for j in range(1, 13)] for i in range(data.shape[0])]

    data = data[use_columns]
    data.reset_index(drop=True, inplace=True)
    data = data.apply(pd.Series.explode)
    data['day'] = 1

    data['date'] = pd.to_datetime(data[['year', 'month', 'day']]) + pd.offsets.MonthEnd(0)
    monthly_start_date_dict = {
        str(k): str(v)
        for k, v in data[['lse_id', 'date']].groupby(['lse_id']).min().to_dict()['date'].items()
    }
    monthly_end_date_dict = {
        str(k): str(v)
        for k, v in data[['lse_id', 'date']].groupby(['lse_id']).max().to_dict()['date'].items()
    }
    data['date'] = data['date'].astype(str)
    prod_data = data[monthly_import_header_format]
    well_count_data = data[['lse_id', 'date', 'wellcount']]
    well_count_data.rename(columns={'wellcount': 'count'}, inplace=True)

    return prod_data, well_count_data, monthly_start_date_dict, monthly_end_date_dict


def process_kill_date_min_life_dict(kill_date_min_life_dict, lse_major_segment_start_dict, lse_id_offset_dicts):
    for idx, use_dict in enumerate(kill_date_min_life_dict):
        remove_lse_id = []
        for lse_id in use_dict:
            if str(use_dict[lse_id]) == '-2':
                offset = lse_id_offset_dicts[idx].get(lse_id)
                major_segment_start = lse_major_segment_start_dict.get(lse_id)
                if major_segment_start is not None and major_segment_start != 0:
                    offset = 0 if offset is None else offset

                    if offset != 0:
                        use_dict[lse_id] = pd.to_datetime(
                            (np.datetime64(DEFAULT_START_DATE) + int(float(major_segment_start))
                             + int(float(offset)))).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                    else:
                        remove_lse_id.append(lse_id)
                else:
                    remove_lse_id.append(lse_id)

            try:
                date_value = float(use_dict.get(lse_id))
            except (ValueError, TypeError):
                date_value = None

            if date_value is not None and not pd.isna(date_value) and date_value > 0:
                offset = lse_id_offset_dicts[idx].get(lse_id)
                offset = 0 if offset is None else offset
                use_dict[lse_id] = pd.to_datetime(
                    (np.datetime64(DEFAULT_START_DATE) + int(float(date_value)) + int(float(offset)))).strftime(
                        CCSchemaEnum.ymd_date_dash_format.value)
        for _id in remove_lse_id:
            if _id in use_dict:
                del use_dict[_id]

    return kill_date_min_life_dict


def clean_kill_date_min_life_table(df, lse_major_segment_start_dict):
    for idx, row in df.iterrows():
        for column in ['kill_date', 'min_life']:
            try:
                if str(row[column]) == '-2':
                    df.at[idx, column] = lse_major_segment_start_dict[str(row.lse_id)]
                elif float(row[column]) <= 0:
                    df.at[idx, column] = None
            except (ValueError, TypeError):
                df.at[idx, column] = None

    for idx, row in df.iterrows():
        for column in ['kill_date', 'min_life']:
            try:
                float(row[column])
            except (ValueError, TypeError):
                pass

            if row[column] is not None:
                try:
                    offset = float(row.offset)
                except (TypeError, ValueError):
                    offset = 0
                df.at[idx, column] = pd.to_datetime((np.datetime64(DEFAULT_START_DATE) + int(float(row[column]))
                                                     + int(offset))).strftime(CCSchemaEnum.ymd_date_dash_format.value)

    return df


def get_dates_values_from_econ_option_doc(document):
    dates_dic = {}

    for key in [EconEnum.asof_date.value, EconEnum.discount_date.value, EconEnum.max_eco_years.value]:
        dates_dic[key] = document.get(key)
    if dates_dic[EconEnum.discount_date.value] is None:
        dates_dic[EconEnum.discount_date.value] = dates_dic.get(EconEnum.asof_date.value)

    return {k: v for k, v in dates_dic.items() if v is not None}


def get_monthly_well_count(df):
    if not df.empty:
        months = [
            'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
            'november', 'december'
        ]
        df.columns = format_well_header_col(df.columns)
        use_columns = [PhdHeaderCols.lse_id.name, 'year', 'month', 'count']

        splice = [f'wellcount{month}' for month in months]

        df['count'] = list(df[splice].values)

        df['month'] = [[j for j in range(1, 13)] for i in range(df.shape[0])]

        df = df[use_columns]

        df = df.apply(pd.Series.explode)
        df['day'] = 1

        df['date'] = pd.to_datetime(df[['year', 'month', 'day']])

        df = df[[PhdHeaderCols.lse_id.name, EconEnum.date.value, 'count']]

        df = df[df['count'] != 0]

        df.sort_values(by=[PhdHeaderCols.lse_id.name, EconEnum.date.value], ignore_index=True, inplace=True)
        df.reset_index(drop=True, inplace=True)

    return df


def add_forecast_well_count(df, document, lse_id_to_curarcseq_dic):
    if df.empty:
        return df
    if document['arcseq'] == lse_id_to_curarcseq_dic[document[PhdHeaderCols.lse_id.name]] and document[
            PhdwinPTEEnum.product_name.value] == 'Well Count':
        value = int((float(document[ForecastEnum.qi.value]) + float(document[ForecastEnum.qend.value])) / 2)
        # TODO: Add Error Msg
        if value > 0:
            df.loc[len(
                df.index)] = [document[PhdHeaderCols.lse_id.name], document[CCSchemaEnum.start_date.value], value]
            df.sort_values([PhdHeaderCols.lse_id.name, EconEnum.date.value], inplace=True, ignore_index=True)

    return df


# get production data rows for well import pipeline
def get_rows(r, well_prod_data):
    if well_prod_data.empty:
        return []
    aries_id = r[WellHeaderEnum.aries_id.value]
    selected_df = well_prod_data[well_prod_data.aries_id == aries_id]
    selected_df.sort_values(by='index', inplace=True)
    json_str = selected_df.to_json(orient='records')
    data_list = json.loads(json_str)
    return data_list


# append production data into list
def build_prod_data_list(full_data, format_via_ls, data_list, wells):
    if full_data.empty:
        return
    for well_document in wells:
        aries_id = well_document[WellHeaderEnum.aries_id.value]
        selected_df = full_data[full_data.aries_id == aries_id]
        selected_df.sort_values(by='index', inplace=True)
        selected_df, all_none = format_via_ls(selected_df, 'aries')

        if all_none:
            return
        else:
            json_str = selected_df.to_json(orient='records')
            prod_data = json.loads(json_str)

        for data in prod_data:
            data['well'] = well_document['_id']
            data[WellHeaderEnum.chosen_id.value] = data[WellHeaderEnum.aries_id.value]
            del data[WellHeaderEnum.aries_id.value]
            data[CCSchemaEnum.created.value] = datetime.datetime.now()
            data[CCSchemaEnum.updated.value] = datetime.datetime.now()
            data_list.append(data)


def format_well_header_document(well_document, project_id, dictionary_convert):
    well_document = dictionary_convert(well_document, CCSchemaEnum.wells.value)
    well_document[WellHeaderEnum.project.value] = project_id
    well_document[WellHeaderEnum.well_name.value] = str(well_document[WellHeaderEnum.aries_id.value])
    well_document[WellHeaderEnum.api_14.value] = str(well_document[WellHeaderEnum.api_14.value])
    well_document[WellHeaderEnum.api_10.value] = str(well_document[WellHeaderEnum.api_10.value])
    well_document[WellHeaderEnum.chosen_id.value] = str(well_document[WellHeaderEnum.chosen_id.value])
    well_document = remove_none_from_wells_document(well_document)
    return well_document


def remove_none_from_wells_document(wells_document):
    '''
    remove key in wells document if value is None
    '''
    default_keys = {
        WellHeaderEnum.api_14.value: WellHeaderEnum.api_14.value,
        WellHeaderEnum.chosen_key_id.value: WellHeaderEnum.chosen_key_id.value,
        WellHeaderEnum.chosen_id.value: WellHeaderEnum.chosen_id.value,
        WellHeaderEnum.project.value: WellHeaderEnum.project.value,
        WellHeaderEnum.data_pool.value: WellHeaderEnum.data_pool.value,
        WellHeaderEnum.data_source.value: WellHeaderEnum.data_source.value,
        WellHeaderEnum.inpt_id.value: WellHeaderEnum.inpt_id.value,
        WellHeaderEnum.copied_from.value: WellHeaderEnum.copied_from.value,
        WellHeaderEnum.first_prop_weight.value: WellHeaderEnum.first_prop_weight.value,
        WellHeaderEnum.lateral_length.value: WellHeaderEnum.lateral_length.value,
        WellHeaderEnum.measured_depth.value: WellHeaderEnum.measured_depth.value,
        WellHeaderEnum.perf_lateral_length.value: WellHeaderEnum.perf_lateral_length.value,
        WellHeaderEnum.primary_product.value: WellHeaderEnum.primary_product.value,
        WellHeaderEnum.surface_latitude.value: WellHeaderEnum.surface_latitude.value,
        WellHeaderEnum.surface_longitude.value: WellHeaderEnum.surface_longitude.value,
        WellHeaderEnum.tvd.value: WellHeaderEnum.tvd.value,
        WellHeaderEnum.first_fluid_volume.value: WellHeaderEnum.first_fluid_volume.value
    }
    wells_document = {k: v for k, v in wells_document.items() if k in default_keys or (v is not None and v != '')}

    # 12/03/2019
    # also make sure wells_document always has well_name
    # if not, use id instead (aries_id for aries import or les_id for phdwin import)
    if WellHeaderEnum.well_name.value not in wells_document:
        # for aries file
        if wells_document[WellHeaderEnum.data_source.value] == 'aries':
            wells_document[WellHeaderEnum.well_name.value] = wells_document[WellHeaderEnum.aries_id.value]
        # for phdwin file
        elif wells_document[WellHeaderEnum.data_source.value] == 'phdwin':
            wells_document[WellHeaderEnum.well_name.value] = wells_document[PhdHeaderCols.lease_no.value]
    return wells_document


def check_batch_limit(well_count, wells, batch_size=100):
    return_bool = False
    if len(wells) == batch_size or well_count == 0:
        return_bool = True
    return return_bool


def clean_econ_df(df, index):
    df[:, index] = df[:, index].astype(str)
    df[:, index] = [
        propnum.replace('_', '').replace('-', '').replace('(', '').replace(')', '') for propnum in df[:, index]
    ]
    return np.where(df.astype(str) == 'nan', '', df)


def convert_pd_series_to_int(series):
    new_series = []
    for value in series:
        try:
            new_value = int(float(value))
            if float(value) - new_value == 0:
                new_series.append(new_value)
            else:
                new_series.append(round(float(value), 4))
        except (ValueError, TypeError):
            new_series.append(value)
    return np.array(new_series, dtype='object')


def check_eloss_loss_keyword(economic_df, keyword_mark_index):
    if 'LOSS' in economic_df[:, keyword_mark_index] and 'ELOSS' in economic_df[:, keyword_mark_index]:
        loop_limit = 5
        count = 0
        while 'LOSS' in economic_df[:, keyword_mark_index]:
            count += 1
            loss_row_index = list(economic_df[:, keyword_mark_index].flatten()).index('LOSS')
            economic_df = np.delete(economic_df, loss_row_index, 0)
            count += 1
            if count == loop_limit:
                break
    return economic_df


def order_df_based_on_section_and_sequence(economic_df, header_cols):
    current_header_cols = header_cols[:economic_df.shape[1]]
    df = pd.DataFrame(economic_df, columns=current_header_cols)
    df[EconHeaderEnum.section.value] = convert_pd_series_to_int(df[EconHeaderEnum.section.value])
    df[EconHeaderEnum.sequence.value] = convert_pd_series_to_int(df[EconHeaderEnum.sequence.value])
    df[EconHeaderEnum.extracted_sequence.value] = convert_pd_series_to_int(df[EconHeaderEnum.extracted_sequence.value])
    return np.array(
        df.sort_values(
            by=[EconHeaderEnum.section.value, EconHeaderEnum.sequence.value, EconHeaderEnum.extracted_sequence.value]))


def get_economic_section(economic_df, section_index, keyword_mark_index, section=None, keyword_mark=None):
    # REMOVE START IN SECTION 8
    economic_df = economic_df[~((economic_df[:, keyword_mark_index] == 'START') & (economic_df[:, section_index] == 8))]
    index_list = []
    if section is None:
        section = []
    for value in section:
        index_list += list(np.argwhere(economic_df[:, section_index] == value).flatten())
    if keyword_mark is None:
        keyword_mark = []
    for value in keyword_mark:
        index_list += list(np.argwhere(economic_df[:, keyword_mark_index] == value).flatten())

    # remove any repeated index, a row should not be repeated
    index_list = list(set(index_list))
    index_list.sort()

    return_df = economic_df[index_list, :]

    if EconHeaderEnum.forecast_section_key.value in section or EconHeaderEnum.own_section_key.value in section:
        return return_df, index_list

    return return_df


def extract_selected_setup_data(row, df):
    '''
    Input:
        row (Pandas Series): Row of AC_SETUP dataframe containing the name of frame to select from
                                AC_SETUPDATA dataframe

        df (Pandas dataframe): Dataframe containing all possible setup data from the AC_SETUPDATE file

    Output:
        Pandas dataframe where the SECTYPE is 'FRAME' only annd where the selected frame from AC_SETUP
        matched the AC_SETUPDATA file
    '''
    # Check if dataframe has all required columns else it returns an empty dataframe
    if (EconHeaderEnum.frame.value not in row.index) or (EconHeaderEnum.sec_type.value not in df.columns
                                                         or EconHeaderEnum.sec_name.value not in df.columns):
        return pd.Dataframe([])

    # get boolean masks
    mask_1 = df[EconHeaderEnum.sec_type.value].astype(str).str.upper() == EconHeaderEnum.frame.value
    clean_sec_name = pd.Series(
        [value.strip('0') if value.isdigit() else value for value in df[EconHeaderEnum.sec_name.value].astype(str)])
    clean_frame = str(row.FRAME).strip('0') if str(row.FRAME).isdigit() else str(row.FRAME)
    mask_2 = clean_sec_name == clean_frame

    # return selected dataframe
    return df.loc[mask_1 & mask_2]


def extract_selected_setup_data_corptax(row, df):
    '''
    Input:
        row (Pandas Series): Row of AC_SETUP dataframe containing the name of frame to select from
                                AC_SETUPDATA dataframe

        df (Pandas dataframe): Dataframe containing all possible setup data from the AC_SETUPDATE file

    Output:
        Pandas dataframe where the SECTYPE is 'FRAME' only annd where the selected frame from AC_SETUP
        matched the AC_SETUPDATA file
    '''
    # Check if dataframe has all required columns else it returns an empty dataframe
    if (EconHeaderEnum.corptax.value not in row.index) or (EconHeaderEnum.varates.value not in row.index) or (
            EconHeaderEnum.sec_type.value not in df.columns or EconHeaderEnum.sec_name.value not in df.columns):
        return pd.Dataframe([])

    # get boolean masks
    mask_1 = (df[EconHeaderEnum.sec_type.value].astype(str).str.upper() == EconHeaderEnum.corptax.value) | (
        df[EconHeaderEnum.sec_type.value].astype(str).str.upper() == EconHeaderEnum.varates.value)
    clean_sec_name = pd.Series(
        [value.strip('0') if value.isdigit() else value for value in df[EconHeaderEnum.sec_name.value].astype(str)])
    clean_corptax = str(row.CORPTAX).strip('0') if str(row.CORPTAX).isdigit() else str(row.CORPTAX)
    clean_varrates = str(row.VARATES).strip('0') if str(row.VARATES).isdigit() else str(row.VARATES)
    mask_2 = (clean_sec_name == clean_corptax) | (clean_sec_name == clean_varrates)

    # return selected dataframe
    return df.loc[mask_1 & mask_2]


def get_custom_escalation(df, setup_df):
    return_dict = {}
    esc_data = setup_df.ESC.values

    for name in esc_data:
        selected_df = df[df[EconHeaderEnum.sec_name.value] == name]
        selected_default_df = selected_df[selected_df[EconHeaderEnum.sec_type.value] == UnitEnum.escalation.value]

        for value in selected_default_df[TableEnum.line.value]:
            try:
                esc_name = value.split()[0]
                esc_value = value.split()[1:]

                process_esc_doc = process_custom_escalation_line(esc_value)

                return_dict[esc_name] = process_esc_doc
            except (IndexError, KeyError, TypeError, ValueError):
                pass

    return return_dict


def update_spd_escalation_value(escalation_value, escalation_unit):
    if escalation_unit.upper() == 'SPD' and escalation_value > 0:
        escalation_value *= -1
    return escalation_value


def process_custom_escalation_line(value):
    date = value[0][:7]
    s_i_c = value[0][7:8]
    b_e = value[0][8:9]
    ann_mo = value[0][9:10]
    per_ppy = value[0][10:11]

    value[0] = value[0][11:]
    esc_list = []
    for escalation_line in value:
        escalation_line = escalation_line.strip(' , ')
        if '*' in escalation_line:
            month_esc_value = tuple(escalation_line.split('*'))
        else:
            month_esc_value = ('1', escalation_line.strip())
        esc_list.append(month_esc_value)
    return_dict = {}
    return_dict[CCSchemaEnum.date.value] = date
    return_dict['start_type'] = s_i_c
    return_dict['start_from'] = b_e
    return_dict['rate'] = ann_mo
    return_dict['calc_type'] = per_ppy
    return_dict[EconEnum.rows.value] = esc_list

    return return_dict


def process_custom_escalation_doc_into_esclation_obj(escalation_doc, segment_start_date, segment_end_date, start=False):
    start_date = pd.to_datetime(escalation_doc[CCSchemaEnum.date.value]).strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    escalation_objs = []

    start_type = escalation_doc.get('start_type')
    if start_type == '3':
        start_date = segment_start_date
    multiplier = 1
    key = EconEnum.pct_per_year.value
    if escalation_doc.get('rate') == 'A':
        multiplier = 12
    if escalation_doc.get('calc_type') == '$':
        key = EconEnum.dollar_per_year.value
    for row in escalation_doc[EconEnum.rows.value]:
        escalation_obj = {
            CCSchemaEnum.dates.value: {
                CCSchemaEnum.start_date.value: "1800-1-31",
                CCSchemaEnum.end_date.value: EconEnum.econ_limit.value
            },
            key: 0
        }
        formated_start_date = start_date
        escalation_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = formated_start_date
        end = int(float(row[0]))
        year, month, day = formated_start_date.split('-')
        formated_end_date = shift_datetime_date(datetime.date(int(year), int(month), int(day)),
                                                months=end * multiplier,
                                                days=-1)
        escalation_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = formated_end_date.strftime(
            CCSchemaEnum.ymd_date_dash_format.value)
        start_date = shift_datetime_date(formated_end_date, days=1).strftime(CCSchemaEnum.ymd_date_dash_format.value)
        escalation_obj[key] = aries_cc_round(float(row[1]))
        escalation_objs.append(escalation_obj)
    escalation_objs = set_escalation_objs_for_escalation_import_doc(escalation_objs,
                                                                    start_type,
                                                                    segment_start_date,
                                                                    segment_end_date,
                                                                    start=start)

    return escalation_objs


def process_differenial_obj_append(keyword, differential_obj, differential_ls_dict):
    if any(differential_short in keyword for differential_short in ['PAJ/', 'PAD/']):
        diff_phase = keyword.split('/')[-1].lower()
        if diff_phase in ['oil', 'gas', 'ngl', 'cnd']:
            (dollar_diff_phase_1, dollar_diff_phase_2, dollar_diff_phase_3, pct_diff_phase_1, pct_diff_phase_2,
             order) = differential_ls_dict.get(diff_phase.lower())
            if diff_phase != 'gas':
                if 'dollar_per_bbl' in differential_obj:
                    diff_ls = get_diff_ls(dollar_diff_phase_1, dollar_diff_phase_2, dollar_diff_phase_3, keyword)
                    diff_ls.append(differential_obj)
                    check_differential_order(order, 'dollar_diff')
                else:
                    diff_ls = get_diff_ls(pct_diff_phase_1, pct_diff_phase_2, None, keyword, percent=True)
                    diff_ls.append(differential_obj)
                    check_differential_order(order, 'pct')
            else:
                if 'dollar_per_mcf' in differential_obj or 'dollar_per_mmbtu' in differential_obj:
                    diff_ls = get_diff_ls(dollar_diff_phase_1, dollar_diff_phase_2, dollar_diff_phase_3, keyword)
                    diff_ls.append(differential_obj)
                    check_differential_order(order, 'dollar_diff')
                else:
                    diff_ls = get_diff_ls(pct_diff_phase_1, pct_diff_phase_2, None, keyword, percent=True)
                    diff_ls.append(differential_obj)
                    check_differential_order(order, 'pct')


def check_differential_order(order, type):
    if len(order) == 0:
        order.append(type)


def check_if_diff_slot_free(diff_phase, use_next_diff):
    if len(diff_phase) > 0:
        if any('offset_' in key or 'dates' in key for key in diff_phase[-1]):
            diff_key = next(key for key in diff_phase[-1] if 'offset_' in key or 'dates' in key)
            if 'end_date' in diff_phase[-1][diff_key]:
                if diff_phase[-1][diff_key][CCSchemaEnum.end_date.value] == EconEnum.econ_limit.value:
                    use_next_diff = True
            elif 'end' in diff_phase[-1][diff_key]:
                if diff_phase[-1][diff_key][CCSchemaEnum.end.value] == EconEnum.econ_limit.value:
                    use_next_diff = True
    return use_next_diff


def get_diff_ls(first_diff_phase_1, first_diff_phase_2, first_diff_phase_3, keyword, percent=False):
    if percent:
        if 'PAJ' in keyword:
            return first_diff_phase_1
        elif 'PAD' in keyword:
            return first_diff_phase_2
    else:
        use_diff_2, use_diff_3 = False, False
        use_diff_2 = check_if_diff_slot_free(first_diff_phase_1, use_diff_2)

        if use_diff_2:
            use_diff_3 = check_if_diff_slot_free(first_diff_phase_2, use_diff_3)
        else:
            return first_diff_phase_1

        if use_diff_3:
            return first_diff_phase_3
        else:
            return first_diff_phase_2


def update_list_escalation_segment(obj, well_id, scenario, keyword, cont, escalation_segment_param, get_default_format):
    # check if this case is already in Escalation segment parameter document
    if (well_id, scenario, keyword, cont) in escalation_segment_param:
        escalation_document = escalation_segment_param[(well_id, scenario, keyword, cont)]
        # get escalation_key being used (EconEnum.dollar_per_year.value or EconEnum.pct_per_year.value)
        last_row = escalation_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
            EconEnum.rows.value][-1]
        if any('per_year' in key for key in last_row):
            esc_key = next(key for key in last_row if 'per_year' in key)
        # get the escalation row from the list method object
        append_rows = obj[EconEnum.escalation_model.value][EconEnum.econ_function.value][
            EconEnum.escalation_model.value][EconEnum.rows.value]
        # check if previous keys is dollar_per_year, change the current key to dollar_per_year
        for row in append_rows:
            if esc_key == EconEnum.dollar_per_year.value:
                del row[EconEnum.pct_per_year.value]
                row[esc_key] = 0
            escalation_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
                EconEnum.rows.value].append(row)
    else:
        # if not already in Escalation segment parameter document
        # get the escalation document from the list method object
        escalation_document = copy.deepcopy(obj[EconEnum.escalation_model.value])
        # add document to Escalation segment parameter
        escalation_segment_param[(well_id, scenario, keyword, cont)] = escalation_document


def create_default_escalation_obj(start_date, end_date, get_default_format):
    # get escalation default document
    escalation_doc = {
        EconEnum.econ_function.value: {
            EconEnum.escalation_model.value: {
                EconEnum.esc_frequency.value:
                'monthly',
                EconEnum.esc_calc_method.value:
                'compound',
                EconEnum.rows.value: [{
                    CCSchemaEnum.dates.value: {
                        CCSchemaEnum.start_date.value: start_date,
                        CCSchemaEnum.end_date.value: end_date
                    },
                    EconEnum.pct_per_year.value: 0
                }]
            }
        }
    }

    return escalation_doc


def convert_dash_date_to_datetime(date):
    year, month, day = date.split('-')
    return datetime.date(int(year), int(month), int(day))


def set_escalation_objs_for_escalation_import_doc(escalation_objs,
                                                  start_type,
                                                  segment_start_date,
                                                  segment_end_date,
                                                  start=False):
    year, month, end = segment_start_date.split('-')
    segment_start_date = datetime.date(int(year), int(month), int(end))
    if segment_end_date != EconEnum.econ_limit.value:
        year, month, end = segment_end_date.split('-')
        segment_end_date = datetime.date(int(year), int(month), int(end))
    new_escalation_objs = []
    if len(escalation_objs) > 0:
        first_row_start_date = convert_dash_date_to_datetime(
            escalation_objs[0][CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])

        if (segment_start_date < first_row_start_date) and (segment_end_date != EconEnum.econ_limit.value) and (
                segment_end_date < first_row_start_date):
            return new_escalation_objs
        elif segment_start_date < first_row_start_date:
            unit_key = get_unit_key_and_clean_row_for_taxes(escalation_objs)
            new_escalation_objs.append({
                CCSchemaEnum.dates.value: {
                    CCSchemaEnum.start_date.value:
                    segment_start_date.strftime(CCSchemaEnum.ymd_date_dash_format.value),
                    CCSchemaEnum.end_date.value:
                    (shift_datetime_date(first_row_start_date,
                                         days=-1)).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                },
                unit_key: 0
            })
            segment_start_date = first_row_start_date
        else:
            if start_type == '1' and start:
                segment_start_date = first_row_start_date
    for row in escalation_objs:
        row_end_date = convert_dash_date_to_datetime(row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])
        row_start_date = convert_dash_date_to_datetime(row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
        if segment_start_date < row_end_date:
            if segment_start_date >= row_start_date:
                new_row = copy.deepcopy(row)
                new_row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = segment_start_date.strftime(
                    CCSchemaEnum.ymd_date_dash_format.value)
                if segment_end_date == EconEnum.econ_limit.value:
                    segment_start_date = shift_datetime_date(row_end_date, days=1)
                    new_escalation_objs.append(new_row)
                    continue
                if segment_end_date <= row_end_date:
                    new_row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = segment_end_date.strftime(
                        CCSchemaEnum.ymd_date_dash_format.value)
                    new_escalation_objs.append(new_row)
                else:
                    segment_start_date = shift_datetime_date(row_end_date, days=1)
                    new_escalation_objs.append(new_row)
    return new_escalation_objs


def get_default_common_lines_from_setup(df, setup_df):
    return_dict = {}
    return_dict[EconHeaderEnum.default.value] = []
    def_data = setup_df.DEFLINES.values
    for name in def_data:
        selected_df = df[df[EconHeaderEnum.sec_name.value] == name]
        selected_default_df = selected_df[selected_df[EconHeaderEnum.sec_type.value] ==
                                          EconHeaderEnum.default_lines.value]
        for value in selected_default_df[TableEnum.line.value]:
            if len(value.split()) > 1:
                return_dict[EconHeaderEnum.default.value].append(
                    [str(value).split()[0].strip(), ' '.join(str(value).split()[1:])])

    return_dict[EconHeaderEnum.common.value] = []
    common_data = setup_df.COMLINES.values
    for name in common_data:
        selected_df = df[df[EconHeaderEnum.sec_name.value] == name]
        selected_common_df = selected_df[selected_df[EconHeaderEnum.sec_type.value] ==
                                         EconHeaderEnum.common_lines.value]
        for value in selected_common_df[TableEnum.line.value]:
            if len(value.split()) > 1:
                return_dict[EconHeaderEnum.common.value].append(
                    [str(value).split()[0].strip(), ' '.join(str(value).split()[1:])])

    return return_dict


def get_discount_rows(ac_setupdata_df, ac_setup_df):
    pw_name = ac_setup_df.PW.values[-1]
    selected_df = ac_setupdata_df[ac_setupdata_df[EconHeaderEnum.sec_name.value] == pw_name]
    selected_default_df = selected_df[(selected_df[EconHeaderEnum.sec_type.value] == EconHeaderEnum.pw.value)
                                      & (selected_df[EconHeaderEnum.linenumber.value].astype(int) == 3)]
    discount_rows = list(selected_default_df.LINE.values)[-1].split(' ')

    return discount_rows


def has_forecast(forecast_df):
    for row in forecast_df:
        if row[-1] in ['OIL', 'GAS', 'WTR']:
            return True
    return False


def update_date_model_from_expression_keyword(  # noqa(C901)
        keyword, expression, property_id, ls_scenarios_id, dates_setting_dic, get_default_format, discount_rows,
        ignore_overhead, has_eloss_pmax, dates_data_list, scenario, scenarios_dic, projects_dic, model_name,
        well_has_forecast, compare_and_save_into_self_data_list):
    method = str(expression[0]).upper()
    if method in dates_setting_dic:
        dates_default_document = get_well_doc_overlay(dates_data_list, property_id, ls_scenarios_id)
        if dates_default_document is None:
            dates_default_document = get_default_format(CCSchemaEnum.dates.value)
        dates_default_document[EconEnum.econ_function.value] = copy.deepcopy(
            dates_data_list[0][EconEnum.econ_function.value])
        delay, discount, min_life, overhead = None, None, None, None
        if method in IGNORE_OVERHEAD_LIST:
            ignore_overhead = True
            if EconEnum.oh.value in expression and keyword == EconEnum.eloss.value:
                ignore_overhead = False

        try:
            try:
                delay = aries_cc_round(float(expression[1]))
            except ValueError:
                pass
            overhead = expression[2]
            discount = expression[3]
            min_life = expression[4]
        except IndexError:
            pass

        if keyword == EconEnum.eloss.value and overhead == EconEnum.noh.value and method != EconEnum.pmax.value:
            ignore_overhead = True
        if keyword == EconEnum.eloss.value:
            if method in [EconEnum.opinc.value, EconEnum.no.value]:
                dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = dates_setting_dic[method]
                if method == EconEnum.opinc.value and well_has_forecast:
                    dates_default_document[EconEnum.econ_function.value][
                        EconEnum.cut_off.value]['capex_offset_to_ecl'] = 'yes'
                if method != EconEnum.no.value:
                    dates_default_document = process_delay_and_min_life(dates_default_document, delay, min_life)
            elif method in [EconEnum.pmax.value, EconEnum.bfit.value]:
                dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = dates_setting_dic[method]
                if discount is not None:
                    dates_default_document = update_document_discount_value_from_dates_expression(
                        dates_default_document, expression, discount_rows)
                if method == EconEnum.pmax.value:
                    dates_default_document = process_delay_and_min_life(dates_default_document, delay, min_life)
                    has_eloss_pmax = True
            elif method == EconEnum.ok.value:
                dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = dates_setting_dic[method]

        elif keyword == EconEnum.loss.value:
            dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = dates_setting_dic[method]
        update_general_settings_in_default_document_and_add_options(dates_default_document, property_id, scenario,
                                                                    scenarios_dic, ls_scenarios_id, dates_data_list,
                                                                    projects_dic, model_name,
                                                                    compare_and_save_into_self_data_list)

        return (ignore_overhead, True, has_eloss_pmax, method)

    return (ignore_overhead, False, has_eloss_pmax, method)


def process_delay_and_min_life(document, delay, min_life):
    if delay is not None:
        document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.el_delay.value] = delay
    if min_life is not None:
        document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.min_cut_off.value] = get_min_life_dict(
            min_life)

    return document


def get_min_life_dict(min_life):
    if not pd.isnull(pd.to_datetime(min_life, errors='coerce')):
        return_dict = {
            CCSchemaEnum.date.value: pd.to_datetime(min_life).strftime(CCSchemaEnum.ymd_date_dash_format.value)
        }
    else:
        try:
            min_life = aries_cc_round(float(min_life))
        except Exception:
            min_life = None
        if min_life is not None:
            return_dict = {EconEnum.as_of.value: min_life}
        else:
            return_dict = {'none': ""}
    return return_dict


def update_include_capex_in_date_model(property_id, ls_scenarios_id, get_default_format, dates_data_list, scenario,
                                       scenarios_dic, projects_dic, model_name, compare_and_save_into_self_data_list):
    dates_default_document = get_well_doc_overlay(dates_data_list, property_id, ls_scenarios_id)
    if dates_default_document is None:
        dates_default_document = get_default_format(CCSchemaEnum.dates.value)
    dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.include_capex.value] = 'no'
    update_general_settings_in_default_document_and_add_options(dates_default_document, property_id, scenario,
                                                                scenarios_dic, ls_scenarios_id, dates_data_list,
                                                                projects_dic, model_name,
                                                                compare_and_save_into_self_data_list)


def update_fixed_expense_with_multiplier(default_document, multiplier):
    for category in FIXED_EXPENSE_CATEGORY:
        default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
            EconEnum.deal_terms.value] *= multiplier
    return default_document


def update_document_discount_value_from_dates_expression(default_document, expression, discount_rows):
    discount_value = None
    try:
        discount_value = expression[3]
        float(expression[3])
    except (IndexError, ValueError):
        return default_document
    if float(discount_value) == 0:
        return default_document
    if discount_value is not None:
        if '.' in str(discount_value) and float(discount_value) > 0 and float(discount_value) < 1:
            default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.discount.value] = round(
                float(discount_value) * 100, CCSchemaEnum.date_round_off.value)
        elif '.' not in discount_value:
            discount_index = int(discount_value) - 1
            try:
                discount_value = discount_rows[discount_index]
            except IndexError:
                discount_value = 0
            default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][EconEnum.discount.value] = round(
                float(discount_value), CCSchemaEnum.date_round_off.value)
    return default_document


def update_general_settings_in_default_document_and_add_options(default_document, property_id, scenario, scenarios_dic,
                                                                ls_scenarios_id, data_list, projects_dic, model_name,
                                                                compare_and_save_into_self_data_list):
    check_and_remove_well_from_previous_model(data_list, [(property_id, scenario)], property_id, scenario,
                                              ls_scenarios_id)
    default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
    default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()
    default_document[CCSchemaEnum.wells.value] = set()
    for _id in ls_scenarios_id:
        if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
            default_document[CCSchemaEnum.wells.value].add((_id, property_id))
        compare_and_save_into_self_data_list(default_document,
                                             data_list,
                                             projects_dic,
                                             model_name=model_name,
                                             aries=True)


def check_for_default_lines(ls_expression, keyword, common_default_lines):
    default_lines = common_default_lines.get(EconHeaderEnum.default.value)
    if default_lines is not None:
        for value in default_lines:
            if keyword == value[0]:
                if len(ls_expression) < len(str(value[1]).split()):
                    n = len(ls_expression)
                    ls_expression += str(value[1]).split()[n:]
    return ls_expression


def format_econ_assumptions(section_economic_df,
                            header_cols,
                            ls_scenarios_id,
                            scenario,
                            property_id,
                            model_extraction,
                            section=None,
                            keyword_mark=None,
                            index=None,
                            operator='or',
                            ignore_check=False,
                            elt=False):
    if section_economic_df.size != 0:
        criteria_met = check_econ_assum_criteria(section_economic_df, header_cols, section, keyword_mark, operator)
        if criteria_met or ignore_check:
            doc = model_extraction(section_economic_df,
                                   header_cols,
                                   ls_scenarios_id,
                                   scenario,
                                   property_id,
                                   index,
                                   elt=elt)
            if elt:
                return doc


def check_econ_assum_criteria(section_economic_df, header_cols, section_criteria, keyword_mark_criteria, operator):
    section_index = header_cols.index(EconHeaderEnum.section.value)
    keyword_mark_index = header_cols.index(EconHeaderEnum.keyword.value)
    section_criteria_met = False
    keyword_mark_criteria_met = False
    criteria_met = False
    if section_criteria is None:
        section_criteria = []
    for value in section_criteria:
        if str(value) in section_economic_df[:, section_index].astype(str):
            section_criteria_met = True
            break
    if keyword_mark_criteria is None:
        keyword_mark_criteria = []
    for value in keyword_mark_criteria:
        if str(value) in section_economic_df[:, keyword_mark_index].astype(str):
            keyword_mark_criteria_met = True
            break
    if operator == 'or':
        criteria_met = keyword_mark_criteria_met or section_criteria_met
    elif operator == 'and':
        criteria_met = keyword_mark_criteria_met and section_criteria_met
    return criteria_met


def get_forecast_date_from_index(idx):
    date = (pd.to_datetime('1/1900') + pd.DateOffset(days=idx)).strftime(CCSchemaEnum.mdy_date_slash_format.value)

    return date


def get_well_doc_overlay(data, well_id, scenarios_id):
    if len(data) == 0:
        return None
    # loop through existing list of model documents
    for doc in data:
        # find model with which to apply overlay model
        for _id in scenarios_id:
            if (_id, well_id) in doc[CCSchemaEnum.wells.value]:
                return copy.deepcopy(doc)


def check_and_remove_well_from_previous_model(data, param_dic, well_id, scenario, scenarios_id):
    # only continue if current well and scenario is in parameter document
    if (well_id, scenario) in param_dic:
        # loop through each model is model list
        document_idx_to_delete = []
        for idx, doc in enumerate(data):
            # loop through the scenario-well in each model and if current scenario-well in model list
            # delete scenario-well from model
            for _id in scenarios_id:
                original_length = len(doc[CCSchemaEnum.wells.value])
                doc[CCSchemaEnum.wells.value].discard((_id, well_id))
            if original_length != len(doc[CCSchemaEnum.wells.value]):
                break
            if len(doc[CCSchemaEnum.wells.value]) == 0:
                document_idx_to_delete.append(idx)
        for idx in document_idx_to_delete:
            del data[idx]


def check_for_required_cols(header_cols, essential_cols):
    for col in essential_cols:
        if col not in header_cols:
            return False, col
    return True, None


def update_wells_dic_and_major_product(wells_dic, major_dic, wells, import_detail):
    for idx, well_document in enumerate(wells):
        well_document['_id'] = import_detail['upserted'][idx]['_id']
        wells_dic[str(well_document[WellHeaderEnum.aries_id.value])] = well_document
        major_dic[str(well_document[WellHeaderEnum.aries_id.value])] = str(
            well_document[WellHeaderEnum.primary_product.value])


def convert_str_to_date(year, month):
    year = str(year)
    month = str(month)
    day = '30'
    if month == '2':
        day = '28'
    try:
        date = pd.to_datetime(year + '/' + month + '/' + day).strftime(CCSchemaEnum.ymd_date_dash_format.value)
    except Exception:
        date = None

    return date


##########
# check if forecast segment is valid before importing
def forecast_validity_check(data):
    for forecast_datas in data:
        if forecast_datas[ForecastEnum.forecast_type.value] == ForecastEnum.ratio.value:
            continue
        segments = forecast_datas[ForecastEnum.p_dict.value][ForecastEnum.best.value][ForecastEnum.segments.value]
        if segments:
            valid, _ = check_forecast_segments(segments)
            if not valid:
                forecast_datas[ForecastEnum.p_dict.value][ForecastEnum.best.value][ForecastEnum.segments.value] = []
                forecast_datas[ForecastEnum.forecast_bool.value] = False
    return data


def clean_ratio_name(data):
    for forecast_data in data:

        if forecast_data[ForecastEnum.forecast_type.value] == ForecastEnum.ratio.value:
            for segment in forecast_data[ForecastEnum.ratio.value][ForecastEnum.segments.value]:
                segment[ForecastEnum.name.value] = segment[ForecastEnum.name.value].replace(
                    f'_{ForecastEnum.ratio.value}', '')
    return data


def fill_reserves_document(default_document, document):
    if document[PhdwinPTEEnum.reserves_class_name.value] is not None and document[
            PhdwinPTEEnum.reserves_sub_cat_name.value] is not None:
        phdwin_reserve_class = document[PhdwinPTEEnum.reserves_class_name.value].lower().strip()
        phdwin_reserve_sub_cat = document[PhdwinPTEEnum.reserves_sub_cat_name.value].lower().strip()

        prms_class, prms_cat, prms_sub_cat = get_cc_reserve_categories(phdwin_reserve_class, phdwin_reserve_sub_cat)

        default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
            EconEnum.prms_class.value] = prms_class
        default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
            EconEnum.prms_cat.value] = prms_cat
        default_document[EconEnum.econ_function.value][EconEnum.reserves_category.value][
            EconEnum.prms_sub_cat.value] = prms_sub_cat

        default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
        default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()


def get_cc_reserve_categories(phdwin_reserve_class, phdwin_reserve_sub_cat):
    if phdwin_reserve_class in reserve_classes:
        cc_prms_class = ReservesEnum.reserves.value
        cc_prms_cat = phdwin_reserve_class
    else:
        cc_prms_class = ReservesEnum.contingent.value
        cc_prms_cat = ReservesEnum.c_1.value
    if phdwin_reserve_sub_cat in reserve_sub_categories:
        cc_prms_sub_cat = phdwin_reserve_sub_cat.replace(' ', '_').replace('-', '_')
    else:
        cc_prms_sub_cat = ReservesEnum.non_producing.name
    return cc_prms_class, cc_prms_cat, cc_prms_sub_cat


# format well_header pandas columns
def format_well_header_col(columns, make_lowercase=True, make_upper_case=False):
    columns = columns.str.replace(' ', '_', regex=False).str.replace('-', '_', regex=False).str.replace(
        '(', '_', regex=False).str.replace(')', '', regex=False)

    if make_upper_case:
        return columns.str.upper()
    if make_lowercase:
        return columns.str.lower()
    return columns


def clean_match_value(match_value):
    try:
        float(match_value)
        match_value = match_value.split('.0')[0]
    except ValueError:
        return match_value
    return match_value


def clean_match_column(original_column):
    new_array = []
    for item in original_column:
        item = str(item).upper().strip()
        try:
            float(item)
            item = item.split('.0')
            new_array.append(item[0])
        except (ValueError, TypeError):
            new_array.append(item)
    return np.array(new_array)


overlay_expense_type_dic = {
    OverlayEnum.opc_gas_wi.value: EconEnum.opc.value,
    OverlayEnum.gpc_gas.value: EconEnum.gathering.value,
    OverlayEnum.gpc_gas_wi.value: EconEnum.gathering.value,
    OverlayEnum.gtc_gas_wi.value: EconEnum.transport.value,
    OverlayEnum.gtc_lqd.value: EconEnum.transport.value,
    OverlayEnum.gtc_gas_nri.value: EconEnum.transport.value,
    OverlayEnum.opc_oil_well.value: EconEnum.opc.value,
    OverlayEnum.opc_gas_well.value: EconEnum.opc.value,
    OverlayEnum.opc_oil_gas_well.value: EconEnum.opc.value,
    OverlayEnum.opc_oil_ini.value: EconEnum.opc.value,
    OverlayEnum.gtc_gas_ini.value: EconEnum.transport.value,
    OverlayEnum.opc_gas_ini.value: EconEnum.opc.value,
    OverlayEnum.ltc_oil_cnd_ini.value: EconEnum.transport.value,
    OverlayEnum.opc_ngl_ini.value: EconEnum.opc.value,
    OverlayEnum.opc_cnd_ini.value: EconEnum.opc.value,
    OverlayEnum.gpc_ngl_ini.value: EconEnum.gathering.value,
    OverlayEnum.cmp_gas.value: EconEnum.other.value
}

overlay_phase_dic = {
    OverlayEnum.gross_oil.value: PhaseEnum.oil.value,
    OverlayEnum.gross_gas.value: PhaseEnum.gas.value,
    OverlayEnum.gross_ngl.value: PhaseEnum.ngl.value,
    OverlayEnum.sales_ngl.value: PhaseEnum.ngl.value,
    OverlayEnum.gross_wtr.value: PhaseEnum.water.value,
    OverlayEnum.gross_wtr_2.value: PhaseEnum.water.value,
    OverlayEnum.gross_cnd.value: PhaseEnum.condensate.value,
    OverlayEnum.sales_cnd.value: PhaseEnum.condensate.value,
    OverlayEnum.lease_net_gas.value: PhaseEnum.gas.value
}
overlay_gas_expense_keys = [
    OverlayEnum.opc_gas_wi.value, OverlayEnum.gtc_gas_wi.value, OverlayEnum.gtc_gas_nri.value,
    OverlayEnum.all_gas_net.value, OverlayEnum.gtc_gas_ini.value, OverlayEnum.opc_gas_well.value,
    OverlayEnum.gpc_gas_wi.value, OverlayEnum.opc_gas_ini.value, OverlayEnum.cmp_gas.value, OverlayEnum.gpc_gas.value
]

overlay_liquid_expense_keys = [
    OverlayEnum.gtc_lqd.value, OverlayEnum.opc_oil_well.value, OverlayEnum.opc_oil_gas_well.value,
    OverlayEnum.opc_oil_ini.value, OverlayEnum.opc_cnd_ini.value, OverlayEnum.ltc_oil_cnd_nri.value,
    OverlayEnum.opc_ngl_ini.value, OverlayEnum.ltc_oil_cnd_ini.value, OverlayEnum.gpc_ngl_ini.value,
    OverlayEnum.appraised_opc_ngl.value, OverlayEnum.appraised_opc_oil.value
]

CALC_VALUE_TO_OPTIONS_DICT = {'wi': 'WI', 'nri': 'NRI', '100_pct_wi': '100% WI'}

KEYWORD_OVERLAY_CONV_DICT = {
    'OPC/OIL': OverlayEnum.opc_oil_ini.value,
    'OPC/GAS': OverlayEnum.opc_gas_ini.value,
    'OPC/NGL': OverlayEnum.opc_ngl_ini.value,
    'GTC/GAS': OverlayEnum.gtc_gas_ini.value,
    'GPC/GAS': OverlayEnum.gpc_gas.value,
    'CMP/GAS': OverlayEnum.cmp_gas.value
}


def add_base_phase_if_ratio(document, phase, base):
    prev_base_phase = document[ForecastEnum.data.value][phase.lower()].get(ForecastEnum.base_phase.value)
    if prev_base_phase is not None and prev_base_phase in ['oil', 'gas', 'water']:
        return document
    if base is not None:
        document[ForecastEnum.data.value][phase.lower()][ForecastEnum.base_phase.value] = base.lower()
    return document


def create_forecast_doc_and_append_segment_obj_phdwin(segment, data_obj, well, phase, base, forecast_name,
                                                      forecasts_dic, forecast_datas_dic, get_default_format,
                                                      forecast_other_phase, forecast_id_to_name_dic, project_id):
    # create both new forecast and new forecast-datas
    forecasts_default_document = get_default_format('forecasts')
    forecast_datas_default_document = get_default_format('forecast-datas')

    # need to give _id to each document
    forecasts_default_document[CCSchemaEnum._id.value] = ObjectId()
    forecast_datas_default_document[CCSchemaEnum._id.value] = ObjectId()

    # forecasts collection
    forecasts_default_document[CCSchemaEnum.wells.value].append(well)
    forecasts_default_document[ForecastEnum.name.value] = forecast_name
    forecasts_default_document[CCSchemaEnum.project.value] = project_id
    forecasts_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
    forecasts_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()

    # forecast_datas collection
    if str(phase).lower() in forecast_phases:
        data_obj[phase.lower()][ForecastEnum.p_dict.value][ForecastEnum.best.value][ForecastEnum.segments.value].append(
            segment)
        # need to fill plot_idx
        data_obj[phase.lower()][ForecastEnum.p_extra.value][ForecastEnum.plot_index.value] = segment[
            ForecastEnum.start_index.value]
    else:
        # need to handle other phase forecast in the future
        data_obj[PhaseEnum.gas.value][ForecastEnum.p_extra.value][ForecastEnum.other_phase.value] = phase.lower()
        forecast_other_phase.add(phase.lower())
        return

    forecast_datas_default_document[CCSchemaEnum.wells.value].append(well)
    forecast_datas_default_document[CCSchemaEnum.well.value] = well
    forecast_datas_default_document['forecast'] = forecasts_default_document[CCSchemaEnum._id.value]
    if base is not None:
        data_obj[phase.lower()][ForecastEnum.base_phase.value] = base.lower()
    forecast_datas_default_document[ForecastEnum.data.value] = data_obj
    forecast_datas_default_document[CCSchemaEnum.project.value] = project_id
    forecast_datas_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
    forecast_datas_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()

    # save into self dictionary
    forecasts_dic[forecast_name] = forecasts_default_document
    forecast_id_to_name_dic[forecasts_default_document[CCSchemaEnum._id.value]] = forecast_name
    forecast_datas_dic[(forecast_name, well)] = forecast_datas_default_document


def append_new_segment_obj_phdwin(document, segment, data_obj, well, phase, base, forecast_name, forecast_datas_dic,
                                  get_default_format, forecast_other_phase, project_id):

    # create new forecast-datas
    forecast_datas_default_document = get_default_format('forecast-datas')

    # need to give _id to each document
    forecast_datas_default_document[CCSchemaEnum._id.value] = ObjectId()

    # forecast_datas collection
    if str(phase).lower() in forecast_phases:
        data_obj[phase.lower()][ForecastEnum.p_dict.value][ForecastEnum.best.value][ForecastEnum.segments.value].append(
            segment)
        # need to fill plot_idx
        data_obj[phase.lower()][ForecastEnum.p_extra.value][ForecastEnum.plot_index.value] = segment[
            ForecastEnum.start_index.value]
    else:
        # need to handle other phase forecast in the future
        data_obj[PhaseEnum.gas.value][ForecastEnum.p_extra.value][ForecastEnum.other_phase.value] = phase.lower()
        forecast_other_phase.add(phase.lower())
        return

    # only add this well to forecasts document if forecast_datas imported (after return)
    document[CCSchemaEnum.wells.value].append(well)

    forecast_datas_default_document[CCSchemaEnum.wells.value].append(well)
    forecast_datas_default_document[CCSchemaEnum.well.value] = well
    forecast_datas_default_document['forecast'] = document[CCSchemaEnum._id.value]
    if base is not None:
        data_obj[phase.lower()][ForecastEnum.base_phase.value] = base.lower()
    forecast_datas_default_document[ForecastEnum.data.value] = data_obj
    forecast_datas_default_document[CCSchemaEnum.project.value] = project_id
    forecast_datas_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
    forecast_datas_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()

    # save into self dictionary
    forecast_datas_dic[(forecast_name, well)] = forecast_datas_default_document


def process_risking_list_method_expression(aries_extract,
                                           rows,
                                           start_date,
                                           original_keyword,
                                           ls_expression,
                                           propnum,
                                           scenario,
                                           section,
                                           well_count_doc=None):
    if original_keyword == '"':
        ls_expression[0] = 'X'

    list_start_date = start_date
    if ls_expression[0] != 'X':
        list_start_date = aries_extract.read_start(ls_expression, propnum, scenario, ErrorMsgEnum.forecast_stream.value,
                                                   section)
    mul_factor_list_method(rows, ls_expression, list_start_date, well_count_doc=well_count_doc)


def mul_factor_list_method(document_rows: list[dict], ls_expression: list[str], start_date: str, well_count_doc=None):
    """

    Args:
        document_rows:
        ls_expression:
        start_date:

    """
    from api.aries_phdwin_imports.aries_data_extraction.helpers.common import get_shift_month_year_multiplier

    shift_month_year_obj = get_shift_month_year_multiplier(ls_expression[-1])
    shift_month = shift_month_year_obj['shift_month']
    shift_year = shift_month_year_obj['shift_year']
    multiplier = shift_month_year_obj['multiplier']

    for idx, value in enumerate(ls_expression[1:-1]):
        if ls_expression[0] != 'X' and idx == 0:
            start_date = convert_str_date_to_datetime_format(start_date, format='%m/%Y')
        else:
            try:
                last_segment = document_rows[-1]

                start_date = convert_str_date_to_datetime_format(last_segment['dates']['end_date'])
                start_date = shift_datetime_date(start_date, days=1)
            except (IndexError, ValueError):
                start_date = pd.to_datetime(start_date)

        formatted_start_date, end_date = process_list_start_date_and_get_end_date(start_date, shift_month, shift_year)

        if '*' in str(value):
            expression_split = value.split('*')

            times = expression_split[0]
            value = expression_split[1]

            formatted_start_date, end_date = process_list_start_date_and_get_end_date(
                start_date, shift_month * int(times), shift_year * int(times))

        is_risk = well_count_doc is None
        is_well_count = not is_risk

        unit_muliplier = 1 if is_well_count else 100
        try:
            use_value = aries_cc_round(float(value) * multiplier) * unit_muliplier
        except ValueError:
            continue

        obj = get_filled_yield_obj(use_value, False, is_risk, is_well_count=is_well_count)
        obj['dates']['start_date'] = formatted_start_date
        obj['dates']['end_date'] = end_date
        document_rows.append(obj)
        if well_count_doc is not None:
            well_count_doc.append(obj)


def append_existing_segment_obj_phdwin(document, segment, data_obj, phase, base, forecast_other_phase):  # noqa (C901)
    if str(phase).lower() in forecast_phases:
        if len(document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][ForecastEnum.best.value][
                ForecastEnum.segments.value]) == 0:
            # need to fill plot_idx
            document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_extra.value][
                ForecastEnum.plot_index.value] = segment[ForecastEnum.start_index.value]

        if len(document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][ForecastEnum.best.value][
                ForecastEnum.segments.value]) > 0:
            last_segment = document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][
                ForecastEnum.best.value][ForecastEnum.segments.value][-1]
            if segment[ForecastEnum.start_index.value] < (
                    last_segment[ForecastEnum.end_index.value]) and ForecastEnum.ratio.value not in last_segment[
                        ForecastEnum.name.value]:
                try:
                    del document[ForecastEnum.data.value][phase.lower()][ForecastEnum.base_phase.value]
                # basephase not present in document
                except KeyError:
                    pass
                return
            elif segment[ForecastEnum.start_index.value] < (last_segment[ForecastEnum.end_index.value]):
                return
            elif segment[ForecastEnum.start_index.value] == (last_segment[ForecastEnum.end_index.value]):
                segment[ForecastEnum.start_index.value] += 1

            if base:
                if ForecastEnum.ratio.value in last_segment[ForecastEnum.name.value]:
                    document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][
                        ForecastEnum.best.value][ForecastEnum.segments.value].append(segment)
                else:
                    try:
                        del document[ForecastEnum.data.value][phase.lower()][ForecastEnum.base_phase.value]
                    # if basePhase has already been deleted from the document and key does not exist
                    except KeyError:
                        pass

            else:
                if ForecastEnum.ratio.value in last_segment[ForecastEnum.name.value]:
                    del document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][
                        ForecastEnum.best.value][ForecastEnum.segments.value][-1]
                    try:
                        del document[ForecastEnum.data.value][phase.lower()][ForecastEnum.base_phase.value]
                    # if basePhase has already been deleted from the document and key does not exist
                    except KeyError:
                        pass
                    document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][
                        ForecastEnum.best.value][ForecastEnum.segments.value].append(segment)
                else:
                    document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][
                        ForecastEnum.best.value][ForecastEnum.segments.value].append(segment)
        else:
            document[ForecastEnum.data.value][phase.lower()][ForecastEnum.p_dict.value][ForecastEnum.best.value][
                ForecastEnum.segments.value].append(segment)
    else:
        data_obj[PhaseEnum.gas.value][ForecastEnum.p_extra.value][ForecastEnum.other_phase.value] = phase.lower()
        forecast_other_phase.add(phase.lower())

    return document


def get_multiplier_phdwin_ratio(document):
    numerator = int(float(document['unitsn']))
    denominator = int(float(document['unitsd']))
    code = int(float(document['productcode']))

    return get_multiplier_from_unit(numerator, denominator, code=code)


def get_multiplier_from_unit(*args, code=None, multiplier=1):
    ratio_specific_multiplier = 1
    if code == ProductCode.wgr.value:
        ratio_specific_multiplier = 0.001
    for idx, value in enumerate(args):
        dict_value = unit_multiplier_dict.get(value)
        if dict_value is None:
            return 1
        else:
            if idx == 0:
                multiplier *= dict_value
            else:
                multiplier *= dict_value**-1
    return multiplier * ratio_specific_multiplier


def clean_yield_document(document):
    if document is not None:
        if len(document[EconEnum.econ_function.value][ForecastEnum.yields.value][PhaseEnum.ngl.value][
                EconEnum.rows.value]) > 1:
            document[EconEnum.econ_function.value][ForecastEnum.yields.value][PhaseEnum.ngl.value][
                EconEnum.rows.value].pop(0)
        return document


def clean_filled_risked_document(document):
    # remove default row in filled risk document
    for phase in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value, PhaseEnum.ngl.value,
            PhaseEnum.condensate.value
    ]:
        if len(document[EconEnum.econ_function.value]['risking_model'][phase][EconEnum.rows.value]) > 1:
            document[EconEnum.econ_function.value]['risking_model'][phase][EconEnum.rows.value].pop(0)
    return document


def extract_yield_properties(start_date,
                             expression,
                             keyword,
                             well_id,
                             document,
                             scenario,
                             section,
                             error_report,
                             use_fpd,
                             use_asof,
                             shrink=False,
                             risk=False,
                             risk_overlay=False,
                             condensate=False):
    if risk:
        phase = ARIES_PHASE_KEYWORD_TO_CC_DICT.get(str(keyword.split('/')[-1]).upper())
        if phase is None:
            phase = overlay_phase_dic.get(keyword)
        use_fpd, use_asof = False, False
    else:
        phase = None
    # get initial and end values from expression
    yield_initial_value, yield_end_value, expression = get_yield_shrink_values(expression, error_report, well_id,
                                                                               scenario, section)

    # calculate yield value from average of initial and end yield values
    try:
        unit = expression[2]
    except IndexError:
        unit = '%' if 'MUL' in keyword else 'FRAC'

    yield_val = yield_val_calculation(yield_initial_value, yield_end_value, keyword, unit, shrink, risk, error_report,
                                      expression, well_id, scenario, section)

    # fill in yield object (dictionary) with yield value
    yield_obj = get_filled_yield_obj(yield_val, shrink, risk)

    # get cut off unit from expression
    try:
        unit = expression[4]
    except IndexError:
        # if expression does not have unit values set time limit to economic life
        unit = UnitEnum.life.value
    if unit not in date_unit_list + list(cumulative_unit_dic.keys()):
        unit = UnitEnum.life.value

    # process yield cut-off either based on date or cumulative depending on unit
    if keyword in ['XINVWT', 'WEIGHT']:
        phase = PhaseEnum.oil.value
    yield_obj, invalid_obj = process_yield_format(unit, phase, keyword, start_date, expression, yield_obj, document,
                                                  well_id, scenario, section, error_report, use_fpd, use_asof, shrink,
                                                  risk)
    # if invalid_obj is returned(values not pulled from expression), return nothing
    if invalid_obj:
        return
    # append yield_obj to stream_properties yields ngl row

    if risk_overlay:
        return yield_obj

    if shrink:
        key = clean_overlay_keyword(keyword)
        key = keyword if key is None else key
        phase = SHRINKAGE_PHASE_DICT.get(key)

        shrink_key = get_valid_shrink_key(document, phase)

        if shrink_key is not None:
            if shrink_key == 'shrinkage':
                document[EconEnum.econ_function.value][shrink_key][phase][EconEnum.rows.value].append(yield_obj)
            else:
                document[EconEnum.econ_function.value]['loss_flare'][shrink_key][EconEnum.rows.value].append(yield_obj)
        else:
            error_report.log_error(aries_row=str_join(expression),
                                   message=ErrorMsgEnum.shrink_message.value,
                                   scenario=scenario,
                                   well=well_id,
                                   model=ErrorMsgEnum.forecast_stream.value,
                                   section=section,
                                   severity=ErrorMsgSeverityEnum.error.value)
    elif risk:
        # temporary document use (to be filled when multi segment risking is implemented in Econ)
        if keyword in ['XINVWT', 'WEIGHT']:
            for phase in [
                    PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value, PhaseEnum.condensate.value,
                    PhaseEnum.ngl.value
            ]:
                document[EconEnum.econ_function.value]['risking_model'][phase][EconEnum.rows.value].append(yield_obj)
        else:
            document[EconEnum.econ_function.value]['risking_model'][phase][EconEnum.rows.value].append(yield_obj)
    else:
        if condensate:
            phase = PhaseEnum.condensate.value
        else:
            phase = PhaseEnum.ngl.value
        document[EconEnum.econ_function.value][ForecastEnum.yields.value][phase][EconEnum.rows.value].append(yield_obj)


def get_valid_shrink_key(document, phase):
    for dict_key in SHRINKAGE_KEY_DICT.get(phase):
        if dict_key == 'shrinkage':
            rows = document[EconEnum.econ_function.value][dict_key][phase][EconEnum.rows.value]
        else:
            rows = document[EconEnum.econ_function.value]['loss_flare'][dict_key][EconEnum.rows.value]

        if len(rows) > 1:
            row = rows[-1]
            if any('offset_' in key for key in row):
                offset_key = next(key for key in row if 'offset_' in key)
                if row[offset_key][CCSchemaEnum.end.value] != EconEnum.econ_limit.value:
                    return dict_key
            elif 'dates' in row:
                if row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != EconEnum.econ_limit.value:
                    return dict_key

        else:
            if len(rows) == 1:
                row = rows[-1]
                if EconEnum.entire_well_life.value in row and row.get(EconEnum.pct_remaining.value) != 100:
                    continue
                else:
                    return dict_key
            else:
                return dict_key


def str_join(expression):
    try:
        return ' '.join([str(value) for value in expression])
    except TypeError:
        return None


def process_ecophase_for_price_tax_backup(ecophase_df):
    ecophase_df.columns = [str(col_name).upper() for col_name in ecophase_df.columns]
    price_dict = {}
    tax_dict = {}
    ownership_dict = {}
    ecophase_df.fillna(0, inplace=True)
    for index, row in ecophase_df.iterrows():
        try:
            price_dict[str(row.KWORD).lower()] = aries_cc_round(float(row.PRI_BKUP))
        except ValueError:
            backup_price = str(row.PRI_BKUP).lower()
            backup_price = (backup_price
                            if backup_price != PhaseEnum.aries_condensate.value else PhaseEnum.condensate.value)
            try:
                price_dict[str(row.KWORD).lower()] = backup_price
            except (ValueError, IndexError):
                price_dict[str(row.KWORD).lower()] = None
        try:
            tax_dict[str(row.KWORD).lower()] = aries_cc_round(float(row.TAX_BKUP))
        except ValueError:
            backup_tax = str(row.TAX_BKUP).lower()
            backup_tax = (backup_tax if backup_tax != PhaseEnum.aries_condensate.value else PhaseEnum.condensate.value)
            try:
                tax_dict[str(row.KWORD).lower()] = backup_tax
            except (ValueError, IndexError):
                tax_dict[str(row.KWORD).lower()] = None
        try:
            ownership_dict[str(row.KWORD).lower()] = aries_cc_round(float(row.NET_BKUP))
        except ValueError:
            try:
                ownership_dict[str(row.KWORD).lower()] = aries_cc_round(
                    float(np.array(ecophase_df[ecophase_df.KWORD == row.NET_BKUP]['NET_BKUP'])[-1]))
            except (ValueError, IndexError):
                ownership_dict[str(row.KWORD).lower()] = None
    return price_dict, tax_dict, ownership_dict


def set_oil_unshrunk(expression):
    """
    Inputs:
            expression(list):  ARIES 'split' Overlay expression [left_operand, 'X', 'FRAC', date, date_unit,
                                 operand_type, right_operand]
    """
    # Remove first and last item for comparison, to check if MUL syntax
    try:
        compulsory_syntax = str_join(expression[3:-1])
    except IndexError:
        compulsory_syntax = None
    if compulsory_syntax == 'TO LIFE MUL':
        first_key = str(clean_overlay_keyword(expression[0])).strip()
        last_key = str(clean_overlay_keyword(expression[-1])).strip()
        if ((first_key in [OverlayEnum.opc_oil_ini.value, OverlayEnum.gtc_lqd.value]
             and last_key == OverlayEnum.gross_oil.value)
                or (first_key == OverlayEnum.gross_oil.value
                    and last_key in [OverlayEnum.opc_oil_ini.value, OverlayEnum.gtc_lqd.value])):
            return True
    return False


def process_expression_for_overlay_differentials(ls_expression, keyword):
    '''
    Inputs: ls_expression (list): List of parameters for building model order [value, cap, unit, date, date_unit]
            keyword (str): ARIES keyword being processed

    Output: Updated ls_expression list if Price overlay differentials are detected
    '''
    key = str(keyword).split('/')[-1]
    overlay_phase = CC_ARIES_OVERLAY_PRICE_DICT.get(keyword)
    if overlay_phase == PhaseEnum.condensate.value:
        overlay_phase = PhaseEnum.aries_condensate.value.upper()
    else:
        overlay_phase = str(overlay_phase).upper()
        ls_expression, keyword, use_oil_base_price = process_pct_of_oil_ngl(ls_expression, keyword)
        if use_oil_base_price:
            return ls_expression, keyword, use_oil_base_price
    for operator in ['PLUS', 'MINUS', 'MUL', 'DIV']:
        if str_join(ls_expression[-2:]) == f'{operator} {keyword}' or str_join(
                ls_expression[-2:]) == f'{operator} {key}':
            if operator in ['PLUS', 'MINUS']:
                ls_expression = ls_expression[:-2]
                ls_expression[2] = PRICE_SIGN_DICT[overlay_phase]
                if operator == 'MINUS':
                    try:
                        ls_expression[0] = str(round(float(ls_expression[0]) * -1, 4))
                    except ValueError:
                        pass
            else:
                ls_expression = ls_expression[:-2]
                if operator == 'DIV':
                    try:
                        ls_expression[0] = str(round(1 / float(ls_expression[0]), 4))
                    except ValueError:
                        pass
            if keyword in CC_ARIES_OVERLAY_PRICE_DICT:
                keyword = f'PAD/{overlay_phase}'
                if operator in ['PLUS', 'MINUS']:
                    if str(overlay_phase).lower() != PhaseEnum.gas.value:
                        ls_expression[2] = UnitEnum.dollar_per_bbl.value
                    else:
                        ls_expression[2] = UnitEnum.dollar_per_mcf.value
                else:
                    ls_expression[2] = 'FRAC'
            else:
                keyword = f'PAJ/{overlay_phase}'
    return ls_expression, keyword, False


def process_pct_of_oil_ngl(ls_expression, keyword):
    for operator in ['MUL', 'DIV']:
        if keyword in ['S/199', 'PRI/NGL'] and (str_join(ls_expression[-2:]) == f'{operator} S/195'
                                                or str_join(ls_expression[-2:]) == f'{operator} 195'):
            ls_expression = ls_expression[:-2]
            if operator == 'DIV':
                try:
                    ls_expression[0] = str(round(1 / float(ls_expression[0]), 4))
                except ValueError:
                    pass
            keyword = 'PRI/NGL'
            return ls_expression, keyword, True
    return ls_expression, keyword, False


def apply_backup_to_select_document(ownership_economic_df, index, backup_ownership_dict, ls_scenarios_id, scenario,
                                    scenarios_dic, property_id, ownership_data_list,
                                    compare_and_save_into_self_data_list, get_default_format, projects_dic):
    if 7 not in ownership_economic_df[:, index]:
        ownership_default_document = get_default_format('ownership')
        nri_oil = backup_ownership_dict[PhaseEnum.oil.value]
        nri_gas = backup_ownership_dict[PhaseEnum.gas.value]
        if nri_oil is not None:
            ownership_default_document[
                EconEnum.econ_function.value]['ownership']['initial_ownership']['working_interest'] = 100
            ownership_default_document[EconEnum.econ_function.value]['ownership']['initial_ownership'][
                'original_ownership']['net_revenue_interest'] = nri_oil * 100
            ownership_default_document[EconEnum.econ_function.value]['ownership']['initial_ownership'][
                'original_ownership']['lease_net_revenue_interest'] = DEFAULT_LEASE_NRI
            if nri_gas != nri_oil and nri_gas is not None:
                ownership_default_document[EconEnum.econ_function.value]['ownership']['initial_ownership'][
                    'gas_ownership']['net_revenue_interest'] = nri_gas * 100
                ownership_default_document[EconEnum.econ_function.value]['ownership']['initial_ownership'][
                    'gas_ownership']['lease_net_revenue_interest'] = DEFAULT_LEASE_NRI
        for _id in ls_scenarios_id:
            if scenarios_dic[_id]['name'] == scenario:
                ownership_default_document['wells'].add((_id, property_id))
                ownership_default_document['createdAt'] = datetime.datetime.now()
                ownership_default_document['updatedAt'] = datetime.datetime.now()
        ownership_default_document = fill_reversion_ownership_document(ownership_default_document)
        compare_and_save_into_self_data_list(
            ownership_default_document,
            ownership_data_list,
            projects_dic,
            model_name=f'ARIES_CC_{ownership_default_document[CCSchemaEnum.assumption_key.value].upper()}',
            aries=True)


def fill_reversion_ownership_document(ownership_default_document):
    for key in OWNERSHIP_KEYS:
        if ownership_default_document[EconEnum.econ_function.value]['ownership'][key] is None:
            ownership_default_document[EconEnum.econ_function.value]['ownership'][key] = REVERSION_DEFAULT_OBJ
    # check if npi type of reversion is same as npi type of original
    # if not the same, just remove all reversion
    ownership_default_document = remove_diff_type_reversion(ownership_default_document)
    return ownership_default_document


def remove_diff_type_reversion(ownership_default_document):
    '''
    remove all reversion segments if one npi type of the reversions is different to original segment
    '''
    original_type = ownership_default_document[
        EconEnum.econ_function.value]['ownership']['initial_ownership']['net_profit_interest_type']

    no_reversion_ownership_default_document = copy.deepcopy(ownership_default_document)
    # create no_reversion_ownership_default_document
    for key in OWNERSHIP_KEYS:
        no_reversion_ownership_default_document[EconEnum.econ_function.value]['ownership'][key] = REVERSION_DEFAULT_OBJ

    for key in OWNERSHIP_KEYS:
        if 'net_profit_interest_type' in ownership_default_document[EconEnum.econ_function.value]['ownership'][key]:
            if ownership_default_document[
                    EconEnum.econ_function.value]['ownership'][key]['net_profit_interest_type'] != original_type:
                return no_reversion_ownership_default_document

    return ownership_default_document


def get_price_unit_key_from_obj(row):
    unit_key = None
    for key in row:
        if key in PRICE_UNITS:
            unit_key = key
            break
    return unit_key


COMPATIBLE_PRICE_PHASE_UNIT_DICT = {
    PhaseEnum.oil.value: [PriceEnum.price.value],
    PhaseEnum.gas.value: [PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_mmbtu.value],
    PhaseEnum.ngl.value: [PriceEnum.dollar_per_bbl.value, PriceEnum.pct_of_oil_price.value],
    PhaseEnum.condensate.value: [PriceEnum.dollar_per_bbl.value, PriceEnum.pct_of_oil_price.value]
}

COMPATIBLE_TAX_PHASE_UNIT_DICT = {
    PhaseEnum.oil.value:
    [PriceEnum.pct_of_revenue.value, PriceEnum.dollar_per_month.value, PriceEnum.dollar_per_bbl.value],
    PhaseEnum.gas.value:
    [PriceEnum.pct_of_revenue.value, PriceEnum.dollar_per_month.value, PriceEnum.dollar_per_mcf.value],
    PhaseEnum.ngl.value:
    [PriceEnum.pct_of_revenue.value, PriceEnum.dollar_per_month.value, PriceEnum.dollar_per_bbl.value],
    PhaseEnum.condensate.value:
    [PriceEnum.pct_of_revenue.value, PriceEnum.dollar_per_month.value, PriceEnum.dollar_per_bbl.value]
}


def update_referencing_phase_doc_with_referenced_phase_tax_doc(rows, referencing_phase, unit_keys):
    ref_rows = copy_rows(rows)
    for unit_key in unit_keys:
        compatible = unit_key in COMPATIBLE_TAX_PHASE_UNIT_DICT.get(referencing_phase)
        default_units = DEFAULT_TAX_UNIT_DICT.get(referencing_phase)
        if compatible:
            continue
        for row in ref_rows:
            row[default_units] = row[unit_key]
            if unit_key != default_units:
                del row[unit_key]

    return ref_rows


def update_referencing_phase_doc_with_referenced_phase_doc(rows, referencing_phase, unit_key, tax=False):
    ref_rows = []
    compatible = unit_key in COMPATIBLE_PRICE_PHASE_UNIT_DICT.get(referencing_phase)
    default_units = DEFAULT_PRICE_UNIT_DICT.get(referencing_phase)
    if compatible:
        return [row for row in rows]
    for row in rows:
        row[default_units] = row[unit_key]
        if unit_key != default_units:
            del row[unit_key]
        ref_rows.append(row)
    return ref_rows


def update_referencing_phase_diff_doc_with_referenced_phase_diff_doc(differential_ls_dict, differentials_ignored,
                                                                     referencing_phase, referenced_phase):
    referenced_phase_differential_ls = [item[:] for item in differential_ls_dict.get(referenced_phase)]
    referencing_phase_differential_ls = [item[:] for item in differential_ls_dict.get(referenced_phase)]

    for i in range(3):
        referenced_rows = referenced_phase_differential_ls[i]
        if len(referenced_rows) > 0:
            unit_key = get_price_unit_key_from_obj(referenced_rows[-1])
            referencing_phase_differential_ls[i] = update_referencing_phase_doc_with_referenced_phase_doc(
                referenced_rows, referencing_phase, unit_key)
            if referencing_phase in differentials_ignored and referenced_phase not in differentials_ignored:
                differentials_ignored.remove(referencing_phase)
    if (len(referencing_phase_differential_ls[3]) >
            0) and (referencing_phase in differentials_ignored) and referenced_phase not in differentials_ignored:
        differentials_ignored.remove(referencing_phase)
    if (len(referencing_phase_differential_ls[4]) >
            0) and (referencing_phase in differentials_ignored) and referenced_phase not in differentials_ignored:
        differentials_ignored.remove(referencing_phase)

    if referencing_phase != PhaseEnum.condensate.value:
        differential_ls_dict[referencing_phase] = tuple(referencing_phase_differential_ls)
    else:
        differential_ls_dict[PhaseEnum.aries_condensate.value] = tuple(referencing_phase_differential_ls)

    return differential_ls_dict, differentials_ignored


def dynamically_update_tax_with_backup(document, referencing_phase, referenced_phase):
    # get rows from phase being referenced (price document)
    rows = copy_rows(
        document[EconEnum.econ_function.value][EconEnum.sev_tax.value][referenced_phase][EconEnum.rows.value])
    # get last row and get the unit key (e.g. dollar_per_bbl)
    row = rows[-1]
    unit_keys = get_two_tax_keys(row)

    document[EconEnum.econ_function.value][EconEnum.sev_tax.value][referencing_phase][
        EconEnum.rows.value] = update_referencing_phase_doc_with_referenced_phase_tax_doc(
            rows, referencing_phase, unit_keys)

    return document


def dynamically_update_price_differential_with_backup(default_document, differential_ls_dict, differentials_ignored,
                                                      referencing_phase, referenced_phase):
    # get rows from phase being referenced (price document)
    rows = copy_rows(default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][referenced_phase][
        EconEnum.rows.value])
    # get last row and get the unit key (e.g. dollar_per_bbl)
    row = rows[-1]
    unit_key = get_price_unit_key_from_obj(row)

    # update the referencing phase with referenced phase for Price document
    default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][referencing_phase][
        EconEnum.rows.value] = update_referencing_phase_doc_with_referenced_phase_doc(
            rows, referencing_phase, unit_key)

    # add phase to ignore differentials lists
    differentials_ignored.append(referencing_phase)

    differential_ls_dict, differentials_ignored = update_referencing_phase_diff_doc_with_referenced_phase_diff_doc(
        differential_ls_dict, differentials_ignored, referencing_phase, referenced_phase)

    return default_document, differential_ls_dict, differentials_ignored


def update_tax_model_with_backup_values(document, backup_dict, as_of_date):
    asof_date = pd.to_datetime(as_of_date, errors="coerce")
    if not pd.isnull(asof_date):
        date = asof_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
    else:
        date = DEFAULT_START_DATE

    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        rows = document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value]

        value, update_using_processed_tax, default_tax_obj = process_backup_dict_based_on_document(
            document, rows, date, backup_dict, EconEnum.sev_tax.value, phase)

        if value is not None:
            if update_using_processed_tax:
                document = dynamically_update_tax_with_backup(document, phase, value)
            else:
                default_tax_obj[PriceEnum.pct_of_revenue.value] = value * 100
                if phase != PhaseEnum.gas.value:
                    default_tax_obj['dollar_per_bbl'] = 0
                else:
                    default_tax_obj['dollar_per_mcf'] = 0
                document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value].append(
                    default_tax_obj)

    return document


def process_backup_dict_based_on_document(document, rows, date, backup_dict, key, phase):
    value, default_obj = None, None
    update_using_processed_model = False

    if len(rows) == 1:
        default_obj = {
            EconEnum.cap.value: '',
            CCSchemaEnum.dates.value: {
                CCSchemaEnum.start_date.value: date,
                CCSchemaEnum.end_date.value: EconEnum.econ_limit.value
            },
            EconEnum.escalation_model.value: 'none'
        }
        if phase != PhaseEnum.condensate.value:
            value = backup_dict.get(phase)
        else:
            value = backup_dict.get(PhaseEnum.aries_condensate.value)

        if value is None:
            value = 0
        elif type(value) == str:
            if value in document[EconEnum.econ_function.value][key]:
                copied_default_rows = copy_rows(document[EconEnum.econ_function.value][key][value][EconEnum.rows.value])
                if len(copied_default_rows) == 1:
                    value = value if value != PhaseEnum.condensate.value else PhaseEnum.aries_condensate.value
                    value = backup_dict.get(value)
                    try:
                        value = float(value)
                    except ValueError:
                        value = 0
                else:
                    update_using_processed_model = True
            else:
                value = 0
    return value, update_using_processed_model, default_obj


def update_price_model_with_backup_values(default_document, differential_ls_dict, price_backup_dict, as_of_date):
    asof_date = pd.to_datetime(as_of_date, errors="coerce")
    if not pd.isnull(asof_date):
        date = asof_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
    else:
        date = DEFAULT_START_DATE
    differentials_ignored = []
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        rows = default_document[EconEnum.econ_function.value][EconEnum.price_model.value][phase][EconEnum.rows.value]
        value, update_using_processed_price, default_price_obj = process_backup_dict_based_on_document(
            default_document, rows, date, price_backup_dict, EconEnum.price_model.value, phase)
        if value is not None:
            if update_using_processed_price:
                (default_document, differential_ls_dict,
                 differentials_ignored) = dynamically_update_price_differential_with_backup(
                     default_document, differential_ls_dict, differentials_ignored, phase, value)
            else:
                if phase not in [PhaseEnum.gas.value, PhaseEnum.oil.value]:
                    default_price_obj['dollar_per_bbl'] = value
                elif phase == PhaseEnum.oil.value:
                    default_price_obj['price'] = value
                else:
                    default_price_obj['dollar_per_mcf'] = value
                differentials_ignored.append(phase)
                default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][
                    EconEnum.rows.value].append(default_price_obj)
    return default_document, differential_ls_dict, differentials_ignored


def reorder_tax_document_row_for_rate_cut_off(document):
    '''
    Re-order tax order for rate cut off
    '''
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        if any('rate' in key for key in document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                EconEnum.rows.value][-1]):
            document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value] = document[
                EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value][::-1]

    return document


def reorder_expense_document_row_for_rate_cut_off(document):
    for expense_type in [EconEnum.fixed_expense.value, EconEnum.var_exp.value]:
        if expense_type == EconEnum.fixed_expense.value:
            for category in FIXED_EXPENSE_CATEGORY:
                if any('rate' in key for key in document[EconEnum.econ_function.value][expense_type][category][
                        EconEnum.rows.value][-1]):
                    document[EconEnum.econ_function.value][expense_type][category][EconEnum.rows.value] = document[
                        EconEnum.econ_function.value][expense_type][category][EconEnum.rows.value][::-1]
        else:
            for phase in [
                    PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
                    PhaseEnum.water.value
            ]:
                if phase != PhaseEnum.water.value:
                    for category in variable_expenses_category:
                        if any('rate' in key for key in document[EconEnum.econ_function.value][expense_type][phase]
                               [category][EconEnum.rows.value][-1]):
                            document[EconEnum.econ_function.value][expense_type][phase][category][
                                EconEnum.rows.value] = document[EconEnum.econ_function.value][expense_type][phase][
                                    category][EconEnum.rows.value][::-1]
                else:
                    if any('rate' in key for key in document[EconEnum.econ_function.value][
                            EconEnum.water_disposal.value][EconEnum.rows.value][-1]):
                        document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                            EconEnum.rows.value] = document[EconEnum.econ_function.value][
                                EconEnum.water_disposal.value][EconEnum.rows.value][::-1]
    return document


def get_yield_shrink_values(expression, error_report, well_id, scenario, section):
    try:
        initial = eval(str(expression[0]))
    except (NameError, TypeError, SyntaxError, ValueError):
        error_report.log_error(aries_row=str_join(expression),
                               message=format_error_msg(ErrorMsgEnum.invalid1_msg.value, expression[0],
                                                        ErrorMsgEnum.yield_.value),
                               scenario=scenario,
                               well=well_id,
                               model=ErrorMsgEnum.stream.value,
                               section=section,
                               severity=ErrorMsgSeverityEnum.error.value)
        return
    try:
        end = expression[1]
    except IndexError:
        end = 'X'
    if end != 'X':
        try:
            end = eval(str(expression[1]))
        except (IndexError, NameError, TypeError, SyntaxError, ValueError):
            end = initial
            if expression[1] in [UnitEnum.frac.value, UnitEnum.bpmcf.value, UnitEnum.bpm.value]:
                expression.insert(1, 'X')
            else:
                error_report.log_error(aries_row=str_join(expression),
                                       message=format_error_msg(ErrorMsgEnum.invalid1_msg.value, end,
                                                                ErrorMsgEnum.yield_.value),
                                       scenario=scenario,
                                       well=well_id,
                                       model=ErrorMsgEnum.stream.value,
                                       section=section,
                                       severity=ErrorMsgSeverityEnum.warn.value)
    elif end == 'X':
        # NGL/GAS does not have valid end value for yield
        end = initial

    return initial, end, expression


def get_filled_yield_obj(yield_val, shrink, risk, is_well_count=False):
    if shrink:
        key = EconEnum.pct_remaining.value
    elif risk:
        key = EconEnum.multiplier.value
    elif is_well_count:
        key = 'count'
    else:
        key = ForecastEnum.ngl_yield.value
    yield_obj = copy.deepcopy(yield_obj_format)
    if shrink or risk or is_well_count:
        del yield_obj[ForecastEnum.ngl_yield.value]
        del yield_obj[ForecastEnum.unshrunk_gas.name]

    yield_obj[key] = aries_cc_round(yield_val)
    return yield_obj


def process_yield_format(unit, phase, keyword, start_date, expression, obj, document, well_id, scenario, section,
                         error_report, use_fpd, use_asof, shrink, risk):
    error_message = None
    try:
        initial_obj = copy.deepcopy(obj)
        # if unit is a date, process date cut off format
        if unit in date_unit_list or shrink or risk:
            error_message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.date.value,
                                             str_join(expression))
            obj = process_yield_date_format(unit, phase, keyword, start_date, expression, obj, well_id, document,
                                            scenario, section, error_report, use_fpd, use_asof, shrink, risk)
        # if unit is cumulative, process cumulative cut-off format
        elif unit in cumulative_unit_dic:
            error_message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.cum_value.value,
                                             str_join(expression))
            obj = process_cum_format(obj, start_date, unit, expression)
    except Exception:
        error_report.log_error(aries_row=str_join(expression),
                               message=error_message,
                               scenario=scenario,
                               well=well_id,
                               model=ErrorMsgEnum.stream.value,
                               section=section,
                               severity=ErrorMsgSeverityEnum.error.value)
    invalid_obj = initial_obj == obj
    return obj, invalid_obj


def process_yield_date_format(unit, phase, keyword, start_date, expression, obj, well_id, document, scenario, section,
                              error_report, use_fpd, use_asof, shrink, risk):
    '''
    input: start_date, expression, obj, well_id, process_date
    output: add start_date or end_date to input obj
    '''
    start_fpd, start_asof = False, False
    start = None
    # check if last segment exist, if it exist use end date of last segment as start_date, else use initial start_date
    last_segment = None
    if shrink:
        if keyword == 'SHK/GAS':
            shrink_phase = PhaseEnum.gas.value
        else:
            shrink_phase = SHRINKAGE_PHASE_DICT.get(clean_overlay_keyword(keyword))
        shrink_key = get_valid_shrink_key(document, shrink_phase)
        if shrink_key is not None:
            if shrink_key == 'shrinkage':
                segments = document[EconEnum.econ_function.value][EconEnum.shrinkage.value][shrink_phase][
                    EconEnum.rows.value]
            else:
                segments = document[EconEnum.econ_function.value]['loss_flare'][shrink_key][EconEnum.rows.value]

    elif risk:
        use_fpd, use_asof = False, False
        segments = document[EconEnum.econ_function.value]['risking_model'][phase][EconEnum.rows.value]
    else:
        segments = document[EconEnum.econ_function.value][ForecastEnum.yields.value][PhaseEnum.ngl.value][
            EconEnum.rows.value]
    if len(segments) > 1:
        last_segment = segments[-1]

    # process start date and end date
    if last_segment is not None:
        # get start date from last segment if previous segment exist
        yield_start_date, start = get_start_date_from_last_segment(last_segment, well_id, scenario, section,
                                                                   error_report, use_fpd, use_asof, start_date)
        if yield_start_date is None:
            yield_start_date = start_date
    else:
        if use_fpd:
            start_fpd = True
            yield_start_date = start_date
        elif use_asof:
            start_asof = True
            yield_start_date = start_date
        else:
            yield_start_date = start_date

    # return updated yield object with start and end dates
    return process_date_based_on_cutoff_unit(start_date, yield_start_date, expression, unit, obj, well_id, scenario,
                                             section, error_report, use_fpd, use_asof, start_fpd, start_asof, start)


def process_cum_format(obj, start_date, unit, expression):
    # delete date parameter from yield object
    del obj[CCSchemaEnum.dates.value]
    # get key and unit multiplier for specified unit
    key = cumulative_unit_dic[unit][0]
    multiplier = cumulative_unit_dic[unit][1]
    # add retrieved key to yield object with value based on expression and specified multiplier
    obj[key] = float(expression[3]) * multiplier
    # set start date
    obj[CCSchemaEnum.start.value] = start_date

    return obj


def process_date_based_on_cutoff_unit(original_start_date, start_date, expression, cutoff_unit, obj, well_id, scenario,
                                      section, error_report, use_fpd, use_asof, start_fpd, start_asof, start):

    formatted_start_date, formatted_end_date, life, incremental = get_start_and_end_date_for_row(
        cutoff_unit, original_start_date, start_date, expression[3])
    try:

        if not life:
            if formatted_start_date > formatted_end_date:
                formatted_start_date = formatted_end_date + pd.DateOffset(months=-1)
            formatted_end_date += pd.DateOffset(days=-1)

            obj = update_fpd_asof_date(obj,
                                       start,
                                       formatted_start_date,
                                       formatted_end_date,
                                       use_fpd,
                                       use_asof,
                                       start_asof,
                                       start_fpd,
                                       life=False,
                                       incremental=incremental)
        # otherwise, if set to life update start date based on start date value and set end date to economic life
        else:
            obj = update_fpd_asof_date(obj,
                                       start,
                                       formatted_start_date,
                                       EconEnum.econ_limit.value,
                                       use_fpd,
                                       use_asof,
                                       start_asof,
                                       start_fpd,
                                       life=True,
                                       incremental=incremental)
    except Exception:
        error_report.log_error(aries_row=str_join(expression),
                               message=format_error_msg(ErrorMsgEnum.date_error_msg.value, expression[3]),
                               scenario=scenario,
                               well=well_id,
                               model=ErrorMsgEnum.stream.value,
                               section=section,
                               severity=ErrorMsgSeverityEnum.error.value)
    # return updated object
    return obj


def get_start_and_end_date_for_row(cutoff_unit, original_start_date, start_date, date_value):
    """
    Get the start and end date based on the provided cutoff unit, original start date, start date, and expression.

    Args:
        cutoff_unit (str): The cutoff unit indicating the type of date calculation (e.g., 'Year', 'Month', 'Life',
        'Incremental').
        original_start_date (str): The original start date in string format (e.g., '2022-01-01').
        start_date (str): The current start date in string format (e.g., '2022-01-01').
        expression (list): A list containing elements related to the expression used for date calculation.

    Returns:
        tuple: A tuple containing the formatted start date, formatted end date, life flag, and incremental flag.

    """
    # check if date cut-off unit is based on year, month or to economic limit
    month, year, life, incremental = update_date_bool_from_cut_off_unit(cutoff_unit)
    if incremental:
        formatted_start_date = pd.to_datetime(start_date)
    else:
        formatted_start_date = pd.to_datetime(original_start_date)
    # if based on month or year add months or years to current start date to get end date
    if month or year:
        shift = abs(float(date_value))
        if month:
            if '.' in date_value:
                day_shift, month_shift = get_day_month_from_decimal_date(date_value)
            else:
                month_shift = shift
                day_shift = 0

            formatted_end_date = formatted_start_date + pd.DateOffset(months=month_shift)
            formatted_end_date += pd.DateOffset(days=day_shift)
        elif year:
            if '.' in date_value:
                day_shift, month_shift, year_shift = get_day_month_year_from_decimal_date(date_value)
            else:
                year_shift = shift
                month_shift = 0
                day_shift = 0
            formatted_end_date = formatted_start_date + pd.DateOffset(years=year_shift)
            formatted_end_date += pd.DateOffset(months=month_shift)
            formatted_end_date += pd.DateOffset(days=day_shift)
    # otherwise if not economic life (i.e. to a specific date, set end date to that date)
    elif not life:
        formatted_end_date = pd.to_datetime(date_value)

    # if cut-off unit is not set to life, update date parameters based on start and end date values
    formatted_start_date = pd.to_datetime(start_date)

    if life:
        formatted_end_date = EconEnum.econ_limit.value

    return formatted_start_date, formatted_end_date, life, incremental


def get_ending_value(ls_expression):
    try:
        ending_value = ls_expression[1]
    except IndexError:
        ending_value = None

    try:
        ending_value = round(float(ending_value), 2)
    except (TypeError, ValueError) as e:
        if type(e) is ValueError:
            ending_value = 'X'

    if ending_value == 'X':
        return ending_value

    ending_value = None if (ending_value is not None and ending_value < 0) else ending_value

    if ending_value is None:
        # TODO: Add Error Message (invalid ending_value)
        pass
    return ending_value


def get_starting_value(rows, starting_value):
    try:
        starting_value = round(float(starting_value), 2)
    except (TypeError, ValueError) as e:
        if type(e) is ValueError:
            starting_value = 'X'

    if starting_value == 'X':
        # get starting value from previous row
        starting_value = get_starting_value_from_row(rows)

    starting_value = None if (starting_value is not None and starting_value < 0) else starting_value

    return starting_value


def get_date_parameters(ls_expression):
    date_value = None
    try:
        date_value = ls_expression[3]
        date_criteria = ls_expression[4]
    except IndexError:
        if pd.notnull(pd.to_datetime(str(date_value), errors="coerce")):
            date_criteria = 'AD'
        else:
            # TODO: Add warning message (not enough information, assuming end date is economic life)
            date_criteria = 'LIFE'
    return date_value, date_criteria


def get_appropriate_decline_method_and_rate_for_well_count(ls_expression, starting_value):
    try:
        decline_method = ls_expression[5]
        decline_rate = ls_expression[6]
    except IndexError:
        # TODO: Add warning message (not enough information, well count to be set to FLAT)
        decline_method = 'FLAT'
        decline_rate = 0
    if decline_method != 'SPD' or decline_rate == 0 or starting_value == 0:
        if decline_method != 'FLAT' and decline_rate != 0:
            pass
            # TODO: Add warning message (Cannot handle decline method-rate combo, set to FLAT)
        decline_method = 'FLAT'
    else:
        decline_method = 'SPD'

    try:
        decline_rate = round(float(decline_rate), 2)
    except (TypeError, ValueError):
        decline_rate = 'X'

    return decline_method, decline_rate


def process_well_stream_cut_off_expression(rows,
                                           original_keyword,
                                           ls_expression,
                                           start_date,
                                           by_phase_doc,
                                           wells_keyword=False):

    if wells_keyword:
        process_wells_keyword(rows, by_phase_doc, ls_expression, start_date)
        return

    recent_start_date = get_previous_end_date_from_row(rows, start_date, original_keyword)

    date_value, date_criteria = get_date_parameters(ls_expression)

    starting_value = get_starting_value(rows, ls_expression[0])

    decline_method, decline_rate = get_appropriate_decline_method_and_rate_for_well_count(ls_expression, starting_value)

    if starting_value is None:
        # TODO: Add warning message (starting value not found)
        return

    if decline_method == 'FLAT':
        process_flat_well_count(rows, by_phase_doc, starting_value, start_date, date_criteria, date_value,
                                recent_start_date)

    else:
        ending_value = get_ending_value(ls_expression)
        if ending_value is None:
            # TODO: Add warning message (ending value INVALID)
            return
        process_spd_well_count(rows, by_phase_doc, decline_rate, starting_value, ending_value, start_date,
                               recent_start_date, date_criteria, date_value)


def process_wells_wls_stream_lines(df, keyword_index):
    keywords = df[:, keyword_index]
    mask = np.logical_or(keywords == "WELLS", np.char.startswith(keywords.astype(str), "WLS/"))
    wells_stream_df = df[mask]

    if (wells_stream_df.size > 0 and 'WELLS' in wells_stream_df[:, keyword_index]
            and any(np.char.startswith(keywords.astype(str), "WLS/"))):
        # TODO: Add error message that WELLS keyword is not allowed with WLS/ keyword and will be removed
        df = df[(df[:, keyword_index] != "WELLS")]

    return df


def process_wells_keyword(rows, by_phase_doc, ls_expression, start_date):
    for idx, phase in enumerate(by_phase_doc.keys()):
        try:
            starting_value = int(float(ls_expression[idx]))
        except (IndexError, ValueError, TypeError):
            continue
        if starting_value <= 0:
            continue
        process_flat_well_count(rows, by_phase_doc[phase], starting_value, start_date, 'LIFE', 'TO', start_date)


def process_flat_well_count(rows, by_phase_doc, starting_value, start_date, date_criteria, date_value,
                            recent_start_date):
    use_start_date, use_end_date, life, _ = get_start_and_end_date_for_row(date_criteria, start_date, recent_start_date,
                                                                           date_value)
    row_end_date = use_end_date if life else (use_end_date + pd.DateOffset(days=-1)).strftime(
        CCSchemaEnum.ymd_date_dash_format.value)

    row_obj = {
        'dates': {
            'start_date': use_start_date.strftime(CCSchemaEnum.ymd_date_dash_format.value),
            'end_date': row_end_date
        },
        'count': starting_value
    }
    rows.append(row_obj)
    by_phase_doc.append(row_obj)


def process_spd_well_count(rows, by_phase_doc, decline_rate, starting_value, ending_value, start_date,
                           recent_start_date, date_criteria, date_value):
    if ending_value == 'X':
        if date_value == 'X' or decline_rate == 'X':
            # TODO: Add warning message (not enough parameters)
            return
        use_start_date, use_end_date, life, _ = get_start_and_end_date_for_row(date_criteria, start_date,
                                                                               recent_start_date, date_value)
        if life:
            use_end_date = use_start_date + pd.DateOffset(years=100, days=-1)
        else:
            use_end_date = use_end_date + pd.DateOffset(days=-1)
        create_and_append_row_obj(rows,
                                  by_phase_doc,
                                  starting_value,
                                  use_start_date,
                                  decline_rate,
                                  date_cutoff=use_end_date)
    else:
        if date_value == 'X':
            if decline_rate == 'X':
                # TODO: Add warning message (not enough parameters)
                return
            use_start_date = pd.to_datetime(recent_start_date, errors="coerce")
            if pd.isnull(use_start_date):
                # TODO: Add warning message ( row start date not found)
                return
            create_and_append_row_obj(rows,
                                      by_phase_doc,
                                      starting_value,
                                      use_start_date,
                                      decline_rate,
                                      value_cutoff=ending_value)
        else:
            use_start_date, use_end_date, life, _ = get_start_and_end_date_for_row(date_criteria, start_date,
                                                                                   recent_start_date, date_value)
            if life:
                use_end_date = use_start_date + pd.DateOffset(years=100, days=-1)
            else:
                use_end_date = use_end_date + pd.DateOffset(days=-1)
            decline_rate = calculate_spd(starting_value, ending_value, use_start_date, use_end_date)
            create_and_append_row_obj(
                rows,
                by_phase_doc,
                starting_value,
                use_start_date,
                decline_rate,
                value_cutoff=ending_value,
            )


def get_previous_end_date_from_row(rows, start_date, original_keyword):
    if len(rows) > 1 and original_keyword == '"':
        end_date = rows[-1]['dates']['end_date']
        if pd.isnull(pd.to_datetime(end_date)):
            new_start_date = start_date
        else:
            new_start_date = pd.to_datetime(end_date) + pd.DateOffset(days=1)
    else:
        new_start_date = start_date

    return new_start_date


def get_starting_value_from_row(rows):
    if len(rows) > 1:
        well_count = rows[-1]['count']

    return well_count


def calculate_spd(starting_value, ending_value, use_start_date, use_end_date):
    return round(((starting_value - ending_value) / starting_value /
                  (use_end_date - use_start_date).days) * DAYS_IN_YEAR, 4) * 100


def create_and_append_row_obj(rows,
                              by_phase_doc,
                              starting_value,
                              start_date,
                              decline_rate,
                              value_cutoff=None,
                              date_cutoff=None):
    def check_to_end_process(current_date, current_value):
        if value_cutoff is not None:
            if current_value <= value_cutoff:
                return True
        elif date_cutoff is not None:
            if current_date > date_cutoff:
                return True
        return False

    def change_well_count_value(current_value, decrement, iteration):
        if iteration == 0:
            return current_value - (decrement / 2)
        return current_value - decrement

    def update_current_month_year(current_month, current_year):
        if current_month + 1 > 12:
            current_month = 1
            current_year += 1
        else:
            current_month += 1

        return current_month, current_year

    def update_well_count_rows(current_year, current_month):
        row_obj = {
            'dates': {
                'start_date':
                datetime.date(current_year, current_month, 1).strftime('%Y-%m-%d'),
                'end_date':
                datetime.date(current_year, current_month,
                              monthrange(current_year, current_month)[1]).strftime('%Y-%m-%d')
            },
            'count': round(current_value, 2)
        }
        rows.append(row_obj)
        by_phase_doc.append(row_obj)

    decrement = (decline_rate / 100 / 12) * starting_value
    current_value = starting_value
    current_month, current_year = start_date.month, start_date.year
    iteration = 0
    max_iterations = 2400  # 200 years
    while iteration < max_iterations:
        current_value = change_well_count_value(current_value, decrement, iteration)
        end_process = check_to_end_process(datetime.date(current_year, current_month, 1), current_value)
        if end_process:
            break
        update_well_count_rows(current_year, current_month)
        current_month, current_year = update_current_month_year(current_month, current_year)
        iteration += 1

    if value_cutoff is not None and iteration > 0:
        rows[-1]['count'] = value_cutoff


def get_day_month_from_decimal_date(value):
    month = int(float(value))
    day = int(round((float(value) - month) * DAYS_IN_MONTH, 0))

    return day, month


def get_day_month_year_from_decimal_date(value, ad=False):
    value = float(value)
    year = int(value)
    month_raw = (value - year) * 12
    month = int(month_raw)
    day = int(round((month_raw - month) * DAYS_IN_MONTH, 0))
    day = 1 if day == 0 and ad else day
    month = month + 1 if ad else month
    return day, month, year


def process_ad(value, base_date):
    return_value = pd.to_datetime(value, errors='coerce')
    if not pd.isnull(return_value):
        return return_value
    try:
        date = parser.parse(value)
    except parser.ParserError:
        return pd.to_datetime(base_date)
    return date


def update_date_bool_from_cut_off_unit(cutoff_unit, month=False, year=False, life=False, incremental=False):
    if cutoff_unit in [
            UnitEnum.month.value, UnitEnum.months.value, UnitEnum.incr_month.value, UnitEnum.incr_months.value
    ]:
        month = True
        if cutoff_unit.startswith('I'):
            incremental = True
    elif cutoff_unit in [
            UnitEnum.year.value, UnitEnum.years.value, UnitEnum.incr_year.value, UnitEnum.incr_years.value
    ]:
        year = True
        if cutoff_unit.startswith('I'):
            incremental = True
    elif cutoff_unit == UnitEnum.life.value:
        life = True

    return month, year, life, incremental


def get_start_date_from_last_segment(last_segment, well_id, scenario, section, error_report, use_fpd, use_asof,
                                     start_date):
    start = None
    last_date = None
    try:
        if use_fpd:
            try:
                start = round(float(last_segment[EconEnum.fpd_offset.value][CCSchemaEnum.end.value]))
            except ValueError:
                start = 0
        elif use_asof:
            try:
                start = round(float(last_segment[EconEnum.asof_offset.value][CCSchemaEnum.end.value]))
            except ValueError:
                start = 0
        else:
            last_date_unformatted = last_segment[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]
            last_date = pd.to_datetime(last_date_unformatted, errors="coerce")
            if not pd.isnull(last_date):
                last_date += pd.DateOffset(days=1)
            else:
                last_date = pd.to_datetime(start_date)
            last_date = last_date.strftime(CCSchemaEnum.mdy_date_slash_format.value)
        if start == MAX_ALLOWABLE_MONTHS:
            start = 0
        return last_date, start
    except KeyError:
        error_report.log_error(message=format_error_msg(ErrorMsgEnum.date_error_msg.value, last_date_unformatted),
                               scenario=scenario,
                               well=well_id,
                               model=ErrorMsgEnum.stream.value,
                               section=section,
                               severity=ErrorMsgSeverityEnum.error.value)


def convert_q_from_unit(q, expression):
    if expression[2] in [UnitEnum.bpm.value, UnitEnum.mpm.value, UnitEnum.upm.value]:
        q = q / DAYS_IN_MONTH
    elif expression[2] in [UnitEnum.bpy.value, UnitEnum.mpy.value, UnitEnum.upy.value]:
        q = q / DAYS_IN_YEAR
    elif expression[2] in [UnitEnum.mbpd.value, UnitEnum.mmpd.value, UnitEnum.mupd.value]:
        q = q * 1000
    elif expression[2] in [UnitEnum.mbpm.value, UnitEnum.mmpm.value]:
        q = q / DAYS_IN_MONTH * 1000
    elif expression[2] in [UnitEnum.mbpy.value, UnitEnum.mmpy.value]:
        q = q / DAYS_IN_YEAR * 1000

    return q


def update_tax_date_obj(obj, document, filled_document):
    start_date = str(document[CCSchemaEnum.start_date.value])
    if any(item in start_date for item in STATIC_PHDWIN_DATES_DICT):
        offset_type = next(item for item in STATIC_PHDWIN_DATES_DICT if item in start_date)
        offset_key = list(STATIC_PHDWIN_DATES_DICT[offset_type].keys())[-1]
        product_name = str(document[PhdHeaderCols.product_name.value.lower()]).lower()
        type_name = document[PhdwinPTEEnum.type_name.value]
        obj.update(copy.deepcopy(STATIC_PHDWIN_DATES_DICT[offset_type]))

        phase_check = product_name in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.name
        ]
        if type_name == PhdwinPTEEnum.local_adval_tax.value:
            prev_objs = filled_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value]
        elif (type_name == PhdwinPTEEnum.state_severance_tax.value) and phase_check:
            if product_name != PhaseEnum.condensate.name:
                prev_objs = filled_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][product_name][
                    EconEnum.rows.value]
            else:
                prev_objs = filled_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][
                    PhaseEnum.condensate.value][EconEnum.rows.value]
        if len(prev_objs) > 1:
            obj[offset_key][CCSchemaEnum.start.value] = prev_objs[-1][offset_key][CCSchemaEnum.end.value] + 1
            obj[offset_key][CCSchemaEnum.end.value] = obj[offset_key][CCSchemaEnum.start.value] + aries_cc_round(
                float(str(document[CCSchemaEnum.end_date.value]).split('_')[-1])) - 1
            obj[offset_key][EconEnum.period.value] = obj[offset_key][CCSchemaEnum.end.value] - obj[offset_key][
                CCSchemaEnum.start.value] + 1
        else:
            obj[offset_key][CCSchemaEnum.start.value] = 1
            obj[offset_key][CCSchemaEnum.end.value] = float(str(document[CCSchemaEnum.end_date.value]).split('_')[-1])
            obj[offset_key][EconEnum.period.value] = obj[offset_key][CCSchemaEnum.end.value] - obj[offset_key][
                CCSchemaEnum.start.value] + 1

    else:
        obj.update(copy.deepcopy(date_obj))
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
            CCSchemaEnum.ymd_date_dash_format.value)
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
            CCSchemaEnum.ymd_date_dash_format.value)


def update_price_diff_date_obj(obj, document, filled_document, price=False, pct=False):
    model = EconEnum.price_model.value if price else EconEnum.differentials.value
    start_date = str(document[CCSchemaEnum.start_date.value])
    if any(item in start_date for item in STATIC_PHDWIN_DATES_DICT):
        product_name = str(document[PhdHeaderCols.product_name.value.lower()]).lower()
        offset_type = next(item for item in STATIC_PHDWIN_DATES_DICT if item in start_date)
        offset_key = list(STATIC_PHDWIN_DATES_DICT[offset_type].keys())[-1]
        if product_name in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
            try:
                if model == EconEnum.price_model.value:
                    prev_objs = filled_document[EconEnum.econ_function.value][model][product_name][EconEnum.rows.value]
                else:
                    prev_objs = filled_document[EconEnum.econ_function.value][model][
                        PriceEnum.diff_1.value][product_name][EconEnum.rows.value]
            except Exception:
                prev_objs = []
            if len(prev_objs) > 1:
                obj[offset_key][CCSchemaEnum.start.value] = prev_objs[-1][offset_key][CCSchemaEnum.end.value] + 1
                obj[offset_key][CCSchemaEnum.end.value] = obj[offset_key][CCSchemaEnum.start.value] + aries_cc_round(
                    float(str(document[CCSchemaEnum.end_date.value]).split('_')[-1])) - 1
                obj[offset_key][EconEnum.period.value] = obj[offset_key][CCSchemaEnum.end.value] - obj[offset_key][
                    CCSchemaEnum.start.value] + 1
            else:
                obj[offset_key][CCSchemaEnum.start.value] = 1
                obj[offset_key][CCSchemaEnum.end.value] = aries_cc_round(
                    float(str(document[CCSchemaEnum.end_date.value]).split('_')[-1]))
                obj[offset_key][EconEnum.period.value] = obj[offset_key][CCSchemaEnum.end.value] - obj[offset_key][
                    CCSchemaEnum.start.value] + 1
    else:
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
            CCSchemaEnum.ymd_date_dash_format.value)
        obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
            CCSchemaEnum.ymd_date_dash_format.value)


def remove_default_item_and_set_date_econ_limit(document, yield_=False):
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value]:
        if yield_:
            if phase == PhaseEnum.ngl.value:
                if len(document[EconEnum.econ_function.value][EconEnum.yields.value][phase][EconEnum.rows.value]) > 1:
                    document[EconEnum.econ_function.value][EconEnum.yields.value][phase][EconEnum.rows.value].pop(0)
                if CCSchemaEnum.dates.value in document[EconEnum.econ_function.value][EconEnum.yields.value][phase][
                        EconEnum.rows.value][-1]:
                    document[EconEnum.econ_function.value][EconEnum.yields.value][phase][EconEnum.rows.value][-1][
                        CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = EconEnum.econ_limit.value
            else:
                if len(document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][
                        EconEnum.rows.value]) > 1:
                    document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][EconEnum.rows.value].pop(0)
                if CCSchemaEnum.dates.value in document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][
                        EconEnum.rows.value][-1]:
                    document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][EconEnum.rows.value][-1][
                        CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = EconEnum.econ_limit.value
        else:
            if phase == PhaseEnum.ngl.value:
                continue
            if len(document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][EconEnum.rows.value]) > 1:
                document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][EconEnum.rows.value].pop(0)
            if CCSchemaEnum.dates.value in document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][
                    EconEnum.rows.value][-1]:
                document[EconEnum.econ_function.value][EconEnum.shrinkage.value][phase][EconEnum.rows.value][-1][
                    CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = EconEnum.econ_limit.value


def calculate_phdwin_date(days):
    '''
    Convert PHDWin date index to date

    Input: PHDWin Date index

    Output: Pandas Datetime Format
    '''
    pd_date = pd.to_datetime(str(days), errors='coerce')

    if pd.isnull(pd_date):
        pass
    else:
        return pd_date
    try:
        date = np.datetime64(DEFAULT_START_DATE) + int(float(days))
    except ValueError:
        days = 0
        date = np.datetime64(DEFAULT_START_DATE) + int(float(days))

    try:
        timestamp = pd.to_datetime(date)
    # handles out of bounds error
    except ValueError:
        timestamp = pd.to_datetime(PHDWIN_ECON_LIMIT)

    return timestamp


def calculate_phdwin_index(date):
    '''
    Convert PHDWin date date to index

    Input: PHDWin Date

    Output: Index in int
    '''
    pd_date = pd.to_datetime(str(date), errors='coerce')

    if pd.isnull(pd_date):
        return 0
    formatted_date = pd_date.strftime('%Y-%m-%d')

    index = (np.datetime64(formatted_date) - np.datetime64(DEFAULT_START_DATE)).astype(int)

    return index


def get_end_of_projection(row):
    value = None
    for i in range(10):
        if row[f'Segmentend[{i}]'] == 0:
            break
        value = row[f'Segmentend[{i}]']
    return value


def calculate_start_date_index(year, month, day):
    start_date = datetime.date(int(year), int(month), int(day))
    index = (start_date - datetime.date(1900, 1, 1)).days
    return index


def process_phdwin_date_columns(df, value):
    '''
    Input:
        df(Pandas Dataframe): Pandas Dataframe with date column
        value (str): Name of selected date column

        Output:
        Panda Dataframe with selected date index converted from PHDWin index to date
    '''
    df[value] = [
        value if value in STATIC_PHDWIN_DATES_DICT else calculate_phdwin_date(value) for value in list(df[value])
    ]

    return df


def process_phdwin_date_sequence_lsg(df):
    '''
    Input:
    df (Pandas DataFrame): Pandas DataFrame containing date columns

    Output:
    Pandas Dataframe sort by well with each models date sequence sorted in order with correspending start and end date
    or period ( sequntial duration)
    '''
    temp_ls = []
    lse_ids = df[PhdHeaderCols.lse_id.value].unique()
    for property_id in lse_ids:
        selected_df = df.loc[df[PhdHeaderCols.lse_id.value] == property_id]

        # special process to sort Type, Productcode, Seq in order
        selected_df = special_process_to_sort_type_productcode_seq(selected_df)
        selected_df = selected_df.reset_index(drop=True)

        # set every date start from 1st day of the month
        date1 = selected_df.at[0, PhdHeaderCols.date1.value]
        date2 = selected_df.at[0, PhdHeaderCols.date2.value]
        for index, row_selected in selected_df.iterrows():
            length = row_selected[PhdHeaderCols.length.value]
            if row_selected[PhdHeaderCols.sequence.value] == 1:
                date1 = row_selected[PhdHeaderCols.date1.value]
            else:
                row_selected[PhdHeaderCols.date1.value] = date1

            if any(item in str(row_selected[PhdHeaderCols.date1.value]) for item in STATIC_PHDWIN_DATES_DICT):
                if length != 65535:
                    date2 = date1 + '_' + str(length)
                else:
                    date2 = date1 + '_' + str(MAX_ALLOWABLE_MONTHS)
            else:
                if length == 65535:
                    date2 = pd.to_datetime(PHDWIN_ECON_LIMIT)
                else:
                    try:
                        date2 = date1 + pd.DateOffset(months=length, days=-1)
                        date1 = date2 + pd.DateOffset(days=1)
                    except Exception:
                        date2 = pd.to_datetime(PHDWIN_ECON_LIMIT)
                        pass

            row_selected[PhdHeaderCols.date2.value] = date2
            temp_ls.append(row_selected.values.tolist())

    return pd.DataFrame.from_records(temp_ls, columns=row_selected.index)


def special_process_to_sort_type_productcode_seq(selected_df):
    '''
    sort in order by Type, Productcode, Seq
    output ex, Type_Productcode_Seq
    4_18_1
    4_18_2
    5_1_1
    5_1_2
    5_2_1
    5_3_1
    5_3_2
    '''
    nparr = selected_df.values
    sorted_ls = []
    # get unique 'Type_Productcode', where index is 27
    for type_productcode in np.unique(nparr[:, 27]):
        selected_nparr = nparr[nparr[:, 27] == type_productcode]
        sorted_nparr = selected_nparr[np.argsort(selected_nparr[:, 4].astype(int))]
        sorted_ls += list(sorted_nparr)

    sorted_selected_df = pd.DataFrame(sorted_ls, columns=selected_df.columns)
    return sorted_selected_df


def format_phdwin_date_1_2_to_start_end_values(df):
    '''
    Input:
    df (Pandas Dataframe): dataframe containing dates column date1 ==> start_date and date2 ==> end_date
    Output:
    date1 and date2 values
    '''

    start_year, start_month, start_day = get_year_month_day_from_phdwin_econ_column(df, PhdHeaderCols.date1.value)
    end_year, end_month, end_day = get_year_month_day_from_phdwin_econ_column(df, PhdHeaderCols.date2.value)

    df[PhdHeaderCols.start_year.value] = start_year
    df[PhdHeaderCols.start_month.value] = start_month
    df[PhdHeaderCols.start_day.value] = start_day

    df[PhdHeaderCols.end_year.value] = end_year
    df[PhdHeaderCols.end_month.value] = end_month
    df[PhdHeaderCols.end_day.value] = end_day

    return df


def get_year_month_day_from_phdwin_econ_column(df, column):
    '''
    Input:
    df (Pandas Dataframe): dataframe containing date column e.g. start_date(date1) and end_date(date2)

    column: name of date column to extract year, month and day from

    Output:
    year, months and day if values is date and return same string if value is in STATIC_PHDWIN_DATES_DICT list

    '''
    year = [
        value if any(item in str(value) for item in STATIC_PHDWIN_DATES_DICT) else pd.to_datetime(value).year
        for value in df[column]
    ]
    month = [
        value if any(item in str(value) for item in STATIC_PHDWIN_DATES_DICT) else pd.to_datetime(value).month
        for value in df[column]
    ]
    day = [
        value if any(item in str(value) for item in STATIC_PHDWIN_DATES_DICT) else pd.to_datetime(value).day
        for value in df[column]
    ]
    return year, month, day


def clean_phdwin_prices_taxes_expense_df(df, lsg=False):
    '''
    Input:
    df (Pandas Dataframe): Price_taxes_expense dataframe

    Output: Clean dataframe that can be extracted by the extraction function to CC
    '''

    df = df.filter(items=[
        PhdHeaderCols.phdwin_id.value, PhdHeaderCols.lse_id.value, PhdHeaderCols.start_year.value, PhdHeaderCols.
        start_month.value, PhdHeaderCols.start_day.value, PhdHeaderCols.end_year.value, PhdHeaderCols.end_month.value,
        PhdHeaderCols.end_day.value, PhdHeaderCols.value.value, PhdwinPTEEnum.ad_val_tax.value,
        PhdHeaderCols.value2.value, PhdHeaderCols.type_.value, PhdHeaderCols.type_name.value,
        PhdHeaderCols.mod_pointer.value, PhdHeaderCols.model_name.value, PhdHeaderCols.currency.value,
        PhdHeaderCols.unit_id.value, PhdHeaderCols.unit_str.value, PhdHeaderCols.real_param_3.value,
        PhdHeaderCols.real_param_4.value, PhdHeaderCols.product_name.value, PhdHeaderCols.product_code.value,
        PhdHeaderCols.bool_param_0.value, PhdHeaderCols.bool_param_1.value, PhdHeaderCols.bool_param_3.value,
        PhdHeaderCols.real_param_0.value, PhdHeaderCols.real_param_1.value, PhdHeaderCols.bool_param_2.value
    ])

    df.rename(
        columns={
            PhdHeaderCols.value2.value: PhdwinPTEEnum.ad_val_tax.value,
            PhdHeaderCols.real_param_3.value: PhdwinPTEEnum.diff_perc.value,
            PhdHeaderCols.real_param_4.value: PhdwinPTEEnum.diff_dollar.value,
            PhdHeaderCols.bool_param_0.value: PhdwinPTEEnum.calc_wi.value,
            PhdHeaderCols.bool_param_1.value: PhdwinPTEEnum.affect_econ_limit_1.value,
            PhdHeaderCols.bool_param_3.value: PhdwinPTEEnum.affect_econ_limit_3.value,
            PhdHeaderCols.real_param_0.value: PhdwinPTEEnum.cap.value,
            PhdHeaderCols.real_param_1.value: PhdwinPTEEnum.depth.value,
            PhdHeaderCols.bool_param_2.value: PhdwinPTEEnum.deduct_sev_tax.value
        },
        inplace=True,
    )

    if lsg:
        df.columns = format_well_header_col(df.columns)

    return df


def import_external_a_file(file_names, folder_name):
    file_dict = {}
    for file in file_names:
        success = True
        if file.endswith('.A'):
            try:
                processed_a_file = process_a_file(file, folder_name)
            except Exception:
                success = False
            if success:
                file_dict[file.rstrip('.A')] = processed_a_file
    return file_dict


def process_a_file(file, folder_name):
    df = pd.read_csv(FileDir.base.value + folder_name + f'/{file}', header=None, engine="python")
    return df


def process_external_file_as_sidefile(df):
    return_array = []
    for idx, row in df.iterrows():
        try:
            raw_string = str(row.values[-1]).replace('\t', ' ')
            str_ls = raw_string.split()
            keyword = str_ls[1]
            expression = ' '.join(str_ls[2:])
        except Exception:
            continue
        return_array.append([None, None, None, keyword, expression, ''])

    return np.array(return_array)


def process_external_file_as_lookup(df):
    return_array = []
    linetype = 0
    for idx, row in df.iterrows():
        try:
            raw_string = str(row.values[-1]).replace('\t', ' ')
            str_ls = raw_string.split()
            keyword = str_ls[1]
            expression_ls = str_ls[2:]
            expression_ls += [''] * (8 - len(expression_ls))
        except Exception:
            continue
        sequence = None
        if any(item in ['N', 'R', 'M'] for item in expression_ls):
            linetype, sequence = 1, 1
        return_array.append(['CC', linetype, sequence, keyword] + expression_ls)
    return np.array(return_array)


def link_model_lines_to_whole_df(df, mpv_df, msg_df):
    '''
    Inputs:
        df (Pandas dataframe): LPV dataframe containing price, tax and expense data
        mpv_df (Pandas dataframe): MPV dataframe containing certain price, tax and expense parameters
                                    e.g calculate using WI
        msg_df (Pandas dataframe): MSG dataframe containing the length and sequence of each model

    Output:
        Pandas Dataframe that modifies the df with other model options and length and sequence of model

    '''
    temp_ls = []
    for index, row_selected in df.iterrows():
        date1 = row_selected[PhdHeaderCols.date1.value]
        temp_msg_df = msg_df.loc[msg_df[PhdHeaderCols.type_mpv_id_key.value] == row_selected[
            PhdHeaderCols.type_mod_pointer_key.value]]
        temp_msg_df = temp_msg_df.sort_values(PhdHeaderCols.sequence.value, ascending=True)
        temp_msg_df = temp_msg_df.set_index(PhdHeaderCols.sequence.value)

        for index_seq, row_tempmsg in temp_msg_df.iterrows():
            length = temp_msg_df.iloc[index_seq - 1][PhdHeaderCols.length.value]

            if any(item in str(row_selected[PhdHeaderCols.date1.value]) for item in STATIC_PHDWIN_DATES_DICT):
                value = next(item for item in STATIC_PHDWIN_DATES_DICT
                             if item in str(row_selected[PhdHeaderCols.date1.value]))
                if length != 65535:
                    row_selected[PhdHeaderCols.date2.value] = f'{value}_{length}'
                else:
                    row_selected[PhdHeaderCols.date2.value] = f'{value}_{MAX_ALLOWABLE_MONTHS}'

            else:
                # 65535 indicate. date2 = Asof Date + Maxecoyears in TIT.
                if length == 65535:
                    date2 = pd.to_datetime(PHDWIN_ECON_LIMIT)
                else:
                    date2 = pd.to_datetime(date1) + pd.DateOffset(months=length, days=-1)
                    # the same date as date2
                    date1 = date2 + pd.DateOffset(days=1)

                # copy the datetime format to anther new column
                row_selected[PhdHeaderCols.date2.value] = row_selected[PhdHeaderCols.date1.value]
                row_selected[PhdHeaderCols.date2.value] = date2
            row_selected[PhdHeaderCols.value.value] = temp_msg_df.iloc[index_seq - 1][PhdHeaderCols.value.value]
            row_selected[PhdwinPTEEnum.ad_val_tax.value] = temp_msg_df.iloc[index_seq - 1][PhdHeaderCols.value2.value]

            # get boolparam and realparam from MPV, which overwrite the boolparam and realparam from LPV
            temp_mpv_df = mpv_df.loc[mpv_df[PhdHeaderCols.type_mpv_id_key.value] == row_selected[
                PhdHeaderCols.type_mod_pointer_key.value]]
            temp_mpv_df = temp_mpv_df.reset_index(drop=True)

            column_name = PhdHeaderCols.bool_param_0.value
            if temp_mpv_df.shape[0] != 0:
                for i in range(10):
                    column_name = update_param_col_name(column_name, i)
                    row_selected[column_name] = temp_mpv_df.at[0, column_name]

            # 8/2 2019 new logic when import Price model (for differential)
            # Realparam[3] (Differential Percentage) and Realparam[4] (Differential Dollar)
            # Always import from LPV talbe
            column_name = PhdHeaderCols.real_param_0.value
            if temp_mpv_df.shape[0] != 0:
                for i in range(2):
                    column_name = update_param_col_name(column_name, i)
                    row_selected[column_name] = temp_mpv_df.at[0, column_name]
            temp_ls.append(row_selected.values.tolist())

            row_selected[PhdHeaderCols.date1.value] = date1

    columns = get_phdwin_expense_price_columns_from_row(row_selected.index)

    df = pd.DataFrame.from_records(temp_ls, columns=columns)

    return df


def update_param_col_name(column, i):
    '''
    Input:
    column (str): Name of column to modify e.g. 'Boolparam[0]'
    i (int): Index to update name with e.g. 1

    Output: Modified Column name e.g. 'Boolparam[0]' ==> 'Boolparam[1]'
    '''
    column = list(column)
    column[-2] = str(i)
    return ''.join(column)


def get_phdwin_expense_price_columns_from_row(indices):
    '''
    Input:
    indices (Pandas Index Object): Column names for PHDWin Economic Dataframe

    Output:
    Correct format for column names for PHDWin Economic Dataframe
    '''
    if len(indices) < 49:
        return list(indices) + [PhdHeaderCols.date2.value, PhdHeaderCols.value.value, PhdwinPTEEnum.ad_val_tax.value]
    return indices


def create_phdwin_date_column(years, months, days):
    '''
    Inputs:
    years (list): list of years
    months (list): list of months
    days (list): list of days

    Output:
    date (str): Datetime format string with date in order of passed by year, month, day value in list
    '''
    date = [
        years[i] if any(item in str(years[i]) for item in STATIC_PHDWIN_DATES_DICT) else datetime.datetime(
            int(years[i]), int(months[i]), int(days[i])).strftime(CCSchemaEnum.ymd_date_dash_format.value)
        for i in range(len(years))
    ]

    return date


def convert_year_month_day_phdwin_column_to_date(df):
    '''
    Input:
    df (Pandas Dataframe): Dataframe containing columns start_year, start_month, start_day, end_year, end_month, end_day

    Output:
    df (Pandas Dataframe): Updated Dataframe with corresponding start_date and end_date
    '''
    start_years = list(df[PhdHeaderCols.start_year.name])
    start_months = list(df[PhdHeaderCols.start_month.name])
    start_days = list(df[PhdHeaderCols.start_day.name])

    end_years = list(df[PhdHeaderCols.end_year.name])
    end_months = list(df[PhdHeaderCols.end_month.name])
    end_days = list(df[PhdHeaderCols.end_day.name])

    df[CCSchemaEnum.start_date.value] = create_phdwin_date_column(start_years, start_months, start_days)
    df[CCSchemaEnum.end_date.value] = create_phdwin_date_column(end_years, end_months, end_days)

    return df


def add_model_unitstr_from_mpv(df, key_dict):
    '''
    Inputs:
    df (Pandas dataframe): Formatted PHDWin Economic Dataframe (Price, Tax and Expense)
    key_dict (dictionary): Dictionary match model name and product name with unit

    Output:
    df (Pandas dataframe): Updated dataframe with unit column
    '''

    df[PhdHeaderCols.model_product_key.value] = (df[PhdHeaderCols.model_name.value.lower()].astype(str).values + '_'
                                                 + df[PhdHeaderCols.product_name.value.lower()].astype(str).values)
    df[PhdHeaderCols.model_unit.value] = df[PhdHeaderCols.model_product_key.value].map(key_dict)

    return df


def add_btu_from_ecf(df, main_ecf_df):
    '''
    Inputs:
    df (Pandas dataframe): Formatted PHDWin Economic Dataframe (Price, Tax and Expense)
    main_ecf_df (Pandas dataframe): Pandas Dataframe with BTU column and corresponding Lease Id

    Output:
    df (Pandas dataframe): Updated dataframe with corresponding BTU for each lease id in original dataframe
    '''
    ecf_df = main_ecf_df.copy()
    btu_dict = pd.Series(ecf_df[PhdwinPTEEnum.btu.value].values,
                         index=ecf_df[PhdHeaderCols.lse_id.value].astype(str)).to_dict()

    df[PhdwinPTEEnum.btu.value.lower()] = df[PhdHeaderCols.lse_id.name].astype(str).map(btu_dict)

    return df


def create_date_general_options_default_model(compare_and_save_into_self_data_list, get_default_format,
                                              general_option_data_list, dates_data_list, projects_dic):
    general_option_default_document = get_default_format('general_options')
    dates_default_document = get_default_format(CCSchemaEnum.dates.value)
    for document in [general_option_default_document, dates_default_document]:
        document[CCSchemaEnum.created.value] = datetime.datetime.now()
        document[CCSchemaEnum.updated.value] = datetime.datetime.now()
        document[CCSchemaEnum.wells.value] = set()
        document[CCSchemaEnum.wells.value].add(None)
    compare_and_save_into_self_data_list(general_option_default_document,
                                         general_option_data_list,
                                         projects_dic,
                                         model_name='ARIES_CC_GENERAL_OPTIONS',
                                         aries=True)
    compare_and_save_into_self_data_list(dates_default_document,
                                         dates_data_list,
                                         projects_dic,
                                         model_name='ARIES_CC_DATES_MODEL',
                                         aries=True)


def check_for_null_values_in_expression(expression, use_shrink=False):
    for i in range(len(expression)):
        if str(expression[i]) == 'nan' or str(expression[i]).strip() == '':
            if use_shrink:
                expression[i] = '1'
            else:
                expression[i] = '0'
    return expression


# TODO: It is not necessary to return the input parameters keyword and ignore_list again
def check_if_line_to_be_ignored(keyword, ls_expression, ignore_list):
    if keyword in ignore_list:
        return ignore_list, True, ls_expression
    return ignore_list, False, ls_expression


def get_price_unit_of_last_segment(last_segment):
    try:
        key = next(unit for unit in PRICE_UNITS if unit in last_segment)
        return last_segment[key]
    except StopIteration:
        return None


def get_overlayed_key(economic_df, keyword: str):
    """

    Args:
        economic_df: Dataframe from which the overlay is being applied
        keyword: Keyword of the current overlay

    Returns:
        Unit of the keyword that is being updated after applying the overlay
    """
    overlayed_row = economic_df[(economic_df[EconHeaderEnum.keyword.value] == keyword)
                                & (economic_df[EconHeaderEnum.sequence.value] != EconEnum.overlay_sequence.value)]

    if overlayed_row.empty:
        return '%', 'pct_of_revenue'

    overlayed_unit_str = overlayed_row['ls_expression'].iloc[-1]
    overlayed_unit = overlayed_unit_str[2]

    if overlayed_unit in CC_ARIES_DATE_EXPENSE_DICT:
        return overlayed_unit, CC_ARIES_DATE_EXPENSE_DICT[overlayed_unit][0]

    if overlayed_unit in CC_ARIES_FRAC_EXPENSE_DICT:
        return overlayed_unit, CC_ARIES_FRAC_EXPENSE_DICT[overlayed_unit][0]

    return overlayed_unit, None


def update_tax_obj_from_aries_unit(  # noqa (C901)
        value, unit, keyword, obj, sequence, main_tax_unit, phase_tax_unit_dict):
    phase = str(keyword.split('/')[-1]).lower()
    if 'STD' in keyword:
        obj[PriceEnum.pct_of_revenue.value] = 0
        if PhaseEnum.gas.value in keyword.lower():
            obj[PriceEnum.dollar_per_mcf.value] = value
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = PriceEnum.dollar_per_mcf.value
            else:
                phase_tax_unit_dict[phase] = PriceEnum.dollar_per_mcf.value
        elif PhaseEnum.oil.value in keyword.lower() or PhaseEnum.ngl.value in keyword.lower(
        ) or PhaseEnum.aries_condensate.value in keyword.lower():
            obj[PriceEnum.dollar_per_bbl.value] = value
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = PriceEnum.dollar_per_bbl.value
            else:
                phase_tax_unit_dict[phase] = PriceEnum.dollar_per_bbl.value
    elif unit in CC_ARIES_DATE_EXPENSE_DICT:
        key = CC_ARIES_DATE_EXPENSE_DICT[unit][0]
        multiplier = CC_ARIES_DATE_EXPENSE_DICT[unit][1]
        obj[PriceEnum.pct_of_revenue.value] = 0
        if unit == UnitEnum.dollar_per_year.value:
            obj[key] = value * multiplier
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = key
            else:
                phase_tax_unit_dict[phase] = key
        elif unit == UnitEnum.dollar_per_mcf.value:
            if value < 5 and PhaseEnum.gas.value in keyword.lower():
                obj[key] = value * multiplier
                if sequence == EconEnum.overlay_sequence.value:
                    main_tax_unit[phase] = key
                else:
                    phase_tax_unit_dict[phase] = key
            else:
                obj[PriceEnum.dollar_per_month.value] = value * multiplier
                if sequence == EconEnum.overlay_sequence.value:
                    main_tax_unit[phase] = PriceEnum.dollar_per_month.value
                else:
                    phase_tax_unit_dict[phase] = PriceEnum.dollar_per_month.value
        elif unit == UnitEnum.dollar_per_bbl.value and EconEnum.atx.value not in keyword:
            obj[key] = value * multiplier
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = key
            else:
                phase_tax_unit_dict[phase] = key
    elif unit in CC_ARIES_FRAC_EXPENSE_DICT:
        key = CC_ARIES_FRAC_EXPENSE_DICT[unit][0]
        multiplier = CC_ARIES_FRAC_EXPENSE_DICT[unit][1]
        if phase == PhaseEnum.gas.value:
            obj[PriceEnum.dollar_per_mcf.value] = 0
        elif 'ATX' in keyword:
            obj[PriceEnum.dollar_per_month.value] = 0
        else:
            obj[PriceEnum.dollar_per_bbl.value] = 0
        obj[key] = value * multiplier
        if sequence == EconEnum.overlay_sequence.value:
            main_tax_unit[phase] = key
        else:
            phase_tax_unit_dict[phase] = key
    elif unit in [UnitEnum.dollar_sign.value, UnitEnum.dollar_per_unit.value]:
        obj[PriceEnum.pct_of_revenue.value] = 0
        if PhaseEnum.gas.value in keyword.lower():
            obj[PriceEnum.dollar_per_mcf.value] = value
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = PriceEnum.dollar_per_mcf.value
            else:
                phase_tax_unit_dict[phase] = PriceEnum.dollar_per_mcf.value
        elif PhaseEnum.oil.value in keyword.lower() or PhaseEnum.ngl.value in keyword.lower(
        ) or PhaseEnum.aries_condensate.value in keyword.lower():
            obj[PriceEnum.dollar_per_bbl.value] = value
            if sequence == EconEnum.overlay_sequence.value:
                main_tax_unit[phase] = PriceEnum.dollar_per_bbl.value
            else:
                phase_tax_unit_dict[phase] = PriceEnum.dollar_per_bbl.value

    return obj, main_tax_unit, phase_tax_unit_dict


def format_aries_segment_date(date_value, base_date):
    if any(sign in str(date_value) for sign in ['+', '-']) and pd.isnull(pd.to_datetime(date_value, errors='coerce')):
        used_sign = next(sign for sign in ['+', '-'] if sign in date_value)
        date, offset = date_value.split(used_sign)
        offset = int(float(offset))
        date = process_ad(date, base_date)
        if used_sign == '+':
            date += pd.DateOffset(days=offset)
        else:
            date -= pd.DateOffset(days=offset)
        return date
    elif '.' in str(date_value):
        day, month, year = get_day_month_year_from_decimal_date(date_value, ad=True)
        month = month if day <= 15 else month + 1
        return pd.to_datetime(f'{year}/{month}')
    else:
        return process_ad(date_value, base_date)


def handle_stx_keyword(keyword, expression):
    # for std and stx
    expression_keyword = []
    unit, unit_index = next(
        (value, expression.index(value)) for value in expression
        if value in [UnitEnum.perc_sign.value, UnitEnum.dollar_sign.value, UnitEnum.dollar_per_unit.value])

    try:
        date_time = expression[unit_index + 1]
    except IndexError:
        date_time = 'TO'
    try:
        date_criteria = expression[unit_index + 2]
    except IndexError:
        date_criteria = 'LIFE'
    if date_criteria not in date_unit_list:
        date_time = 'TO'
        date_criteria = 'LIFE'

    if date_criteria is not None and date_time is not None:
        try:
            stx_oil = aries_cc_round(float(expression[0]))
            expression_keyword.append(
                (f'{keyword}/{PhaseEnum.oil.value}',
                 [stx_oil, 'X', unit, date_time, date_criteria, UnitEnum.perc_compound_escalation.value, '0']))
        except (ValueError, TypeError):
            pass

        try:
            stx_gas = aries_cc_round(float(expression[1]))
            expression_keyword.append(
                (f'{keyword}/{PhaseEnum.gas.value}',
                 [stx_gas, 'X', unit, date_time, date_criteria, UnitEnum.perc_compound_escalation.value, '0']))
        except (ValueError, TypeError):
            pass

        try:
            stx_ngl = aries_cc_round(float(expression[2]))
            expression_keyword.append(
                (f'{keyword}/{PhaseEnum.ngl.value}',
                 [stx_ngl, 'X', unit, date_time, date_criteria, UnitEnum.perc_compound_escalation.value, '0']))
        except (ValueError, TypeError):
            pass

    return expression_keyword


def handle_shortened_aries_tax_syntax(expression):
    if len(expression) == 3:
        # ex: [1500 X $/M], need to be corrected to [1500 X $/M TO LIFE PC 0]
        expression += ['TO', UnitEnum.life.value, UnitEnum.perc_compound_escalation.value, '0']

    if len(expression) == 1 or len(expression) == 2:
        if len(expression) == 1:
            full_expression = [
                expression[0], 'X', UnitEnum.perc_sign.value, 'TO', UnitEnum.life.value,
                UnitEnum.perc_compound_escalation.value, '0'
            ]
        else:
            full_expression = [
                expression[0], 'X', expression[1], 'TO', UnitEnum.life.value, UnitEnum.perc_compound_escalation.value,
                '0'
            ]
        expression = full_expression[:]
    return expression


def check_for_aries_escalation(expression):
    try:
        escalation_unit = expression[-2]
    except IndexError:
        return False
    for escalation_syntax in ARIES_ESCALATION_SYNTAX:
        if escalation_syntax in escalation_unit:
            return True
    return False


def fill_escalation_row_gaps(prev_end_date, start_date, escalation_segment_param, property_id, scenario, keyword, cont):
    if (property_id, scenario, keyword, cont) in escalation_segment_param:
        escalation_document = escalation_segment_param[(property_id, scenario, keyword, cont)]
        use_end_date = pd.to_datetime(start_date) + pd.DateOffset(months=-1)
        if use_end_date > pd.to_datetime(prev_end_date):
            escalation_obj = {
                CCSchemaEnum.dates.value: {
                    CCSchemaEnum.start_date.value:
                    pd.to_datetime(prev_end_date).strftime(CCSchemaEnum.mdy_date_slash_format.value),
                    CCSchemaEnum.end_date.value:
                    use_end_date.strftime(CCSchemaEnum.mdy_date_slash_format.value)
                },
                EconEnum.pct_per_year.value: 0
            }
            escalation_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
                EconEnum.rows.value].append(escalation_obj)


def get_price_unit_key_from_phase(phase):
    return price_unit_for_phase_dict[phase]


CC_ARIES_PRICE_UNIT_DICT = {
    UnitEnum.dollar_per_mcf.value: PriceEnum.dollar_per_mcf.value,
    UnitEnum.dollar_per_bbl.value: PriceEnum.dollar_per_bbl.value
}

CC_ARIES_DIFF_UNIT_DICT = {
    UnitEnum.dollar_per_bbl.value: PriceEnum.dollar_per_bbl.value,
    UnitEnum.dollar_per_mcf.value: PriceEnum.dollar_per_mcf.value,
    UnitEnum.perc_sign.value: PriceEnum.pct_of_base_price.value,
    UnitEnum.frac.value: PriceEnum.pct_of_base_price.value
}

OVERLAY_OWNERSHIP_DICT = {
    OverlayEnum.wi.value: EconEnum.w_interest.value,
    OverlayEnum.nri.value: EconEnum.net_interest.value,
    OverlayEnum.lease_net_gas.value: EconEnum.net_interest.value,
    OverlayEnum.net_gas.value: EconEnum.net_interest.value,
    OverlayEnum.net_oil.value: EconEnum.net_interest.value,
    OverlayEnum.net_ngl.value: EconEnum.net_interest.value,
    OverlayEnum.net_cnd.value: EconEnum.net_interest.value
}

STATIC_PHDWIN_DATES_DICT = {
    EconEnum.fpd.value: {
        EconEnum.fpd_offset.value: {
            CCSchemaEnum.start.value: '',
            CCSchemaEnum.end.value: '',
            EconEnum.period.value: ''
        }
    },
    EconEnum.asof.value: {
        EconEnum.asof_offset.value: {
            CCSchemaEnum.start.value: '',
            CCSchemaEnum.end.value: '',
            EconEnum.period.value: ''
        }
    }
}


def get_new_fixed_assignment_dic():
    return copy.deepcopy(FIXED_EXPENSE_CATEGORY)


def get_qend_k(k, qi, start_idx, max_date_index):
    q_end = ((max_date_index - start_idx) * k) + qi
    return q_end


def handle_adx_linear_ratio(q_start, q_end, k, doc, expression, start_idx, end_idx, max_date_index):
    try:
        date_unit = expression[4]
    except IndexError:
        date_unit = None
    if date_unit in ['ADX', 'MOX']:
        q_end = get_qend_k(k, q_start, start_idx, max_date_index)
        end_idx = max_date_index
        doc[CCSchemaEnum.end_date.value] = None
    return q_end, end_idx


def convert_cumulative_from_unit(expression):
    multiplier = 1
    if str(expression[4]).strip() in cumulative_unit_dic:
        multiplier = cumulative_unit_dic[str(expression[4]).strip()][1]
    return aries_cc_round(float(expression[3]) * multiplier)


def get_max_date_index(life, base_date):
    try:
        life = int(float(life))
    except ValueError:
        life = 100
    base_date = pd.to_datetime(base_date)
    end_date = base_date + pd.DateOffset(years=life)
    if pd.isnull(end_date):
        max_date_index = (np.datetime64(pd.to_datetime(pd.Timestamp.max), 'D')
                          - np.datetime64('1900-01-01')).astype(int).item()
    else:
        max_date_index = (np.datetime64(end_date, 'D') - np.datetime64('1900-01-01')).astype(int).item()

    return max_date_index


def get_aries_number_of_year_between(latest_date, earlier_date):
    def move_date_based_on_condition(date):
        if date.day > 15 or date.day == 1:
            return date + pd.offsets.MonthBegin(0)
        else:
            return date + pd.offsets.MonthBegin(-1)

    latest_date = pd.to_datetime(latest_date, errors='coerce')
    earlier_date = pd.to_datetime(earlier_date, errors='coerce')

    if not (pd.isnull(latest_date) or pd.isnull(earlier_date)):
        latest_date = move_date_based_on_condition(latest_date)
        earlier_date = move_date_based_on_condition(earlier_date)
        date_diff = relativedelta.relativedelta(latest_date, earlier_date)

        return date_diff.years + round(date_diff.months / 12, 4) + MAX_WELL_LIFE_NUDGE


def calculate_life_based_on_base_date(asof_date, base_date, life):
    date_diff = get_aries_number_of_year_between(asof_date, base_date)
    if date_diff is not None and date_diff > 0:
        life -= date_diff
    return life


def process_date_settings_for_data_list(document, aries):
    dates_1_life = aries_cc_round(document[EconEnum.econ_function.value]['dates_setting']['max_well_life'])
    dates_1_base_date = (document[EconEnum.econ_function.value]['dates_setting'].get('base_date'))
    as_of_date = document[EconEnum.econ_function.value]['dates_setting']['as_of_date'].get('date')
    if aries and dates_1_base_date is not None and as_of_date is not None:
        document[EconEnum.econ_function.value]['dates_setting']['max_well_life'] = calculate_life_based_on_base_date(
            as_of_date, dates_1_base_date, dates_1_life)
    dates_1_life = aries_cc_round(document[EconEnum.econ_function.value]['dates_setting']['max_well_life'])
    dates_model_id = document[CCSchemaEnum._id.value]
    if dates_1_base_date is None or dates_1_base_date == "":
        dates_1_base_date = DEFAULT_BASE_DATE
    if as_of_date is None or as_of_date == "":
        as_of_date = DEFAULT_BASE_DATE
        if aries:
            document[EconEnum.econ_function.value]['dates_setting']['as_of_date'] = {'date': DEFAULT_BASE_DATE}

    return document, dates_1_life, dates_1_base_date, as_of_date, dates_model_id


def format_model_index(model_index):
    if len(str(model_index)) < NUM_TRAILING_ZEROS + 1:
        added_zero = (NUM_TRAILING_ZEROS + 1) - len(str(model_index))
        return (added_zero * '0') + str(model_index)
    return model_index


def name_and_save_model_for_data_list(document, model_name, max_idx, data_ls, projects_dic, batch_number,
                                      general_options_model_id, dates_model_id, dates_1_life, dates_1_base_date,
                                      as_of_date, add_options, aries):
    model_index = max_idx + 1
    for _id in projects_dic:
        # create models number same as projects number
        document[CCSchemaEnum.project.value] = _id
        # check if model is an overlay model
        if document[CCSchemaEnum.name.value] is None:
            document[CCSchemaEnum.name.value] = ''
        if 'OL' in document[CCSchemaEnum.name.value]:
            # get unique overlay model
            check_for_previous_overlay_model(document, data_ls)
        elif document[CCSchemaEnum.assumption_key.value] == EconEnum.reserves_category.value:
            document = name_reserves_model(document)
        else:
            if model_name is not None:
                model_index = format_model_index(model_index)
                document[CCSchemaEnum.name.value] = f'{model_name}_{model_index}'
            else:
                document[CCSchemaEnum.name.value] = 'bh' + str(batch_number) + '_' + document[
                    CCSchemaEnum.assumption_key.value] + '_' + str(model_index)

        document[CCSchemaEnum._id.value] = ObjectId()

        if aries:
            if document[CCSchemaEnum.name.value] == 'ARIES_CC_GENERAL_OPTIONS_0001':
                general_options_model_id = document[CCSchemaEnum._id.value]
        else:
            if document[CCSchemaEnum.name.value] == 'PHD_CC_ECON_SETTINGS':
                general_options_model_id = document[CCSchemaEnum._id.value]

        if document[CCSchemaEnum.name.value] == 'ARIES_CC_DATES_MODEL_0001':
            (document, dates_1_life, dates_1_base_date, as_of_date,
             dates_model_id) = process_date_settings_for_data_list(document, aries)

        document = add_options(document)
        # temp add user objectid
        data_ls.append(copy.deepcopy(document))  # important to copy the document to avoid missing import some model!!!

    return general_options_model_id, dates_model_id, dates_1_life, dates_1_base_date, as_of_date


def update_asof_default_aries(document):
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value]:
        document[EconEnum.options.value][EconEnum.prod_vs_fit_model.value][EconEnum.replace_actual.value][
            EconEnum.sub_items.value][phase] = copy.deepcopy(DEFAULT_ASOF_OPTION)
        document[EconEnum.econ_function.value][EconEnum.prod_vs_fit_model.value][
            EconEnum.replace_actual.value][phase] = copy.deepcopy(DEFAULT_ARIES_ASOF_ECON)
    return document


def get_max_cap(rows):
    max_cap = -1
    for segment in rows:
        if str(EconEnum.overlay_sequence.value) not in segment:
            try:
                cap_value = float(segment['cap'])
            except (ValueError, TypeError):
                cap_value = -1
            if cap_value > max_cap:
                max_cap = cap_value
    if max_cap != -1:
        # check if max_cap is less than any of the expense/price escalation values
        unit_key = get_unit_key_and_clean_row_for_taxes(rows)
        for segment in rows:
            try:
                value = float(segment[unit_key])
            except (ValueError, TypeError):
                value = 0
            max_cap = value if value > max_cap else max_cap
    return max_cap


def check_for_single_lse(section_economic_df, expression_index, keyword_mark_index, property_id, scenario, log_report):
    # check economic df for single lse when date criteria is not TO LIFE
    lse_df = section_economic_df[section_economic_df[:, keyword_mark_index] == 'LSE']
    has_single_lse, expression = False, None
    if lse_df.shape[0] == 1:
        single_lse_expression = lse_df[-1, expression_index].split()
        if UnitEnum.life.value not in single_lse_expression or len(single_lse_expression) < 5:
            has_single_lse = True
            expression = single_lse_expression
            try:
                date_unit_list_no_life = date_unit_list[:-1]
                criteria, criteria_index = next((item, single_lse_expression.index(item))
                                                for item in single_lse_expression if item in date_unit_list_no_life)
                single_lse_expression[criteria_index - 1], single_lse_expression[criteria_index] = 'TO', 'LIFE'
            except StopIteration:
                single_lse_expression.extend(['TO', 'LIFE'])
        single_lse_expression = ' '.join(single_lse_expression)
        lse_index = np.argwhere(section_economic_df[:, keyword_mark_index] == 'LSE').flatten()[-1]
        section_economic_df[lse_index, expression_index] = single_lse_expression

    if has_single_lse:
        log_report.log_error(aries_row=expression,
                             message=ErrorMsgEnum.single_lse.value,
                             scenario=scenario,
                             well=property_id,
                             model=ErrorMsgEnum.ownership.value,
                             section=EconHeaderEnum.own_section_key.value,
                             severity=ErrorMsgSeverityEnum.warn.value)
    return section_economic_df


def get_date_unit_key(expression):
    try:
        date_unit_index = [index for index, unit in enumerate(expression) if unit in date_list][0]
    except IndexError:
        date_unit_index = None
    return date_unit_index


def check_for_inconsistent_date(expression, *args, **kwargs):
    # handle inconsistent date definitions and set date unit to AD
    unit_key_index = get_date_unit_key(expression)
    if unit_key_index is not None and expression[unit_key_index] != 'AD':
        if pd.notnull(pd.to_datetime(str(expression[unit_key_index - 1]), errors='coerce')):
            expression[unit_key_index] = 'AD'
    return expression
