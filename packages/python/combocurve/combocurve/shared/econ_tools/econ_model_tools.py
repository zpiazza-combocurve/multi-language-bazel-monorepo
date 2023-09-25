from enum import Enum

from combocurve.science.econ.schemas.compositional_economics import Compositional


class PhaseEnum(Enum):
    oil = 'oil'
    gas = 'gas'
    ngl = 'ngl'
    drip_condensate = 'drip cond'


class PhaseKeyEnum(Enum):
    oil = 'oil'
    gas = 'gas'
    ngl = 'ngl'
    drip_condensate = 'drip_condensate'
    water = 'water'


class UnitKeyEnum(Enum):
    UNIT_COST = 'unit_cost'
    PRICE = 'price'
    DOLLAR_PER_BBL = 'dollar_per_bbl'
    DOLLAR_PER_MMBTU = 'dollar_per_mmbtu'
    DOLLAR_PER_MCF = 'dollar_per_mcf'
    DOLLAR_PER_GAL = 'dollar_per_gal'
    DOLLAR_PER_BOE = 'dollar_per_boe'
    DOLLAR_PER_MONTH = 'dollar_per_month'
    FIXED_EXPENSE = 'fixed_expense'
    FIXED_EXPENSE_PER_WELL = 'fixed_expense_per_well'
    PCT_OF_OIL_PRICE = 'pct_of_oil_price'
    PCT_OF_BASE_PRICE = 'pct_of_base_price'
    PCT_OF_REVENUE = 'pct_of_revenue'
    PCT_OF_OIL_REV = 'pct_of_oil_rev'
    PCT_OF_GAS_REV = 'pct_of_gas_rev'
    PCT_OF_NGL_REV = 'pct_of_ngl_rev'
    PCT_OF_DRIP_CONDENSATE_REV = 'pct_of_drip_condensate_rev'
    PCT_OF_TOTAL_REV = 'pct_of_total_rev'
    MULTIPLIER = 'multiplier'
    DOLLAR_PER_YEAR = 'dollar_per_year'
    PCT_PER_YEAR = 'pct_per_year'
    CARBON_EXPENSE = 'carbon_expense'
    PERCENTAGE = 'percentage'
    COUNT = 'count'


class CriteriaEnum(Enum):
    entire_well_life = 'flat'
    offset_to_fpd = 'fpd'
    offset_to_as_of_date = 'as of'
    offset_to_discount_date = 'disc date'
    offset_to_first_segment = 'maj seg'
    offset_to_end_history = 'end hist'
    dates = 'dates'
    oil_rate = 'oil rate'
    gas_rate = 'gas rate'
    water_rate = 'water rate'
    total_fluid_rate = 'total fluid'
    seasonal = 'seasonal'
    month_period = 'month period'
    schedule_end = 'schedule end'
    schedule_start = 'schedule start'


class OwnershipEnum(Enum):
    OWNERSHIP = 'ownership'
    INITIAL_OWNERSHIP = 'initial_ownership'
    PAYOUT_WITH_INVESTMENT = 'payout_with_investment'
    PAYOUT_WITHOUT_INVESTMENT = 'payout_without_investment'

    WI = 'working_interest'
    NRI = 'net_revenue_interest'
    LEASE_NRI = 'lease_net_revenue_interest'
    NPI = 'net_profit_interest'
    NPI_TYPE = 'net_profit_interest_type'

    ORIGINAL_OWNERSHIP = 'original_ownership'


# Dictionaries

UNIT_MAP = {
    UnitKeyEnum.UNIT_COST.value: '$/bbl',  # keep unit_cost for old version of exp model
    UnitKeyEnum.PRICE.value: '$/bbl',
    UnitKeyEnum.DOLLAR_PER_BBL.value: '$/bbl',
    UnitKeyEnum.DOLLAR_PER_MMBTU.value: '$/mmbtu',
    UnitKeyEnum.DOLLAR_PER_MCF.value: '$/mcf',
    UnitKeyEnum.DOLLAR_PER_GAL.value: '$/gal',
    UnitKeyEnum.DOLLAR_PER_BOE.value: '$/boe',
    UnitKeyEnum.DOLLAR_PER_MONTH.value: '$/month',
    UnitKeyEnum.FIXED_EXPENSE.value: '$/month',
    UnitKeyEnum.FIXED_EXPENSE_PER_WELL.value: '$/well/month',
    UnitKeyEnum.PCT_OF_OIL_PRICE.value: '% of oil price',
    UnitKeyEnum.PCT_OF_BASE_PRICE.value: '% base price rem',
    UnitKeyEnum.PCT_OF_REVENUE.value: '% of rev',
    UnitKeyEnum.PCT_OF_OIL_REV.value: '% of oil rev',
    UnitKeyEnum.PCT_OF_GAS_REV.value: '% of gas rev',
    UnitKeyEnum.PCT_OF_NGL_REV.value: '% of ngl rev',
    UnitKeyEnum.PCT_OF_DRIP_CONDENSATE_REV.value: '% of drip cond rev',
    UnitKeyEnum.PCT_OF_TOTAL_REV.value: '% of total rev',
    UnitKeyEnum.MULTIPLIER.value: '%',
    UnitKeyEnum.DOLLAR_PER_YEAR.value: '$/Year',
    UnitKeyEnum.PCT_PER_YEAR.value: '%/Year (APY)',
    UnitKeyEnum.CARBON_EXPENSE.value: '$/MT',
    UnitKeyEnum.PERCENTAGE.value: '%',  # for well stream in risking model, first row has no unit, after first row is %
    UnitKeyEnum.COUNT.value: '',
}

CRITERIA_MAP_DICT = {
    CriteriaEnum.entire_well_life.name: CriteriaEnum.entire_well_life.value,
    CriteriaEnum.offset_to_fpd.name: CriteriaEnum.offset_to_fpd.value,
    CriteriaEnum.offset_to_as_of_date.name: CriteriaEnum.offset_to_as_of_date.value,
    CriteriaEnum.offset_to_discount_date.name: CriteriaEnum.offset_to_discount_date.value,
    CriteriaEnum.offset_to_first_segment.name: CriteriaEnum.offset_to_first_segment.value,
    CriteriaEnum.offset_to_end_history.name: CriteriaEnum.offset_to_end_history.value,
    CriteriaEnum.dates.name: CriteriaEnum.dates.value,
    CriteriaEnum.oil_rate.name: CriteriaEnum.oil_rate.value,
    CriteriaEnum.gas_rate.name: CriteriaEnum.gas_rate.value,
    CriteriaEnum.water_rate.name: CriteriaEnum.water_rate.value,
    CriteriaEnum.total_fluid_rate.name: CriteriaEnum.total_fluid_rate.value,
    CriteriaEnum.seasonal.name: CriteriaEnum.seasonal.value,
    CriteriaEnum.month_period.name: CriteriaEnum.month_period.value
}

BYPRODUCT_PARENT_MAP = {
    PhaseKeyEnum.ngl.value: PhaseKeyEnum.gas.value,
    PhaseKeyEnum.drip_condensate.value: PhaseKeyEnum.gas.value,
}

COMPOSITIONAL_BYPRODUCT_PARENT_MAP = {compositional.value: PhaseKeyEnum.gas.value for compositional in Compositional}

# Lists

ALL_PHASES = [PhaseKeyEnum.oil.value, PhaseKeyEnum.gas.value, PhaseKeyEnum.water.value]
BYPRODUCTS = [PhaseKeyEnum.ngl.value, PhaseKeyEnum.drip_condensate.value]
COMPOSITIONAL_BYPRODUCTS = [compositional.value for compositional in Compositional]

RATE_BASED_ROW_KEYS = [
    CriteriaEnum.oil_rate.name,
    CriteriaEnum.gas_rate.name,
    CriteriaEnum.water_rate.name,
    CriteriaEnum.total_fluid_rate.name,
]

EXP_PCT_REV_KEYS = [
    UnitKeyEnum.PCT_OF_OIL_REV.value,
    UnitKeyEnum.PCT_OF_GAS_REV.value,
    UnitKeyEnum.PCT_OF_NGL_REV.value,
    UnitKeyEnum.PCT_OF_DRIP_CONDENSATE_REV.value,
    UnitKeyEnum.PCT_OF_TOTAL_REV.value,
]

EXP_UNIT_KEYS = [
    UnitKeyEnum.DOLLAR_PER_BBL.value,
    UnitKeyEnum.DOLLAR_PER_MMBTU.value,
    UnitKeyEnum.DOLLAR_PER_MCF.value,
    UnitKeyEnum.FIXED_EXPENSE.value,
    UnitKeyEnum.FIXED_EXPENSE_PER_WELL.value,
    UnitKeyEnum.PCT_OF_OIL_REV.value,
    UnitKeyEnum.PCT_OF_GAS_REV.value,
    UnitKeyEnum.PCT_OF_NGL_REV.value,
    UnitKeyEnum.PCT_OF_DRIP_CONDENSATE_REV.value,
    UnitKeyEnum.PCT_OF_TOTAL_REV.value,
    UnitKeyEnum.CARBON_EXPENSE.value,
]

REVERSION_KEYS = [
    'first_reversion', 'second_reversion', 'third_reversion', 'fourth_reversion', 'fifth_reversion', 'sixth_reversion',
    'seventh_reversion', 'eighth_reversion', 'ninth_reversion', 'tenth_reversion'
]

FIXED_EXP_KEYS = [
    'monthly_well_cost', 'other_monthly_cost_1', 'other_monthly_cost_2', 'other_monthly_cost_3', 'other_monthly_cost_4',
    'other_monthly_cost_5', 'other_monthly_cost_6', 'other_monthly_cost_7', 'other_monthly_cost_8'
]
