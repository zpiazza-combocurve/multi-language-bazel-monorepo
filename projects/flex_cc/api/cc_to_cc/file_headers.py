from enum import Enum
from combocurve.science.network_module.nodes.shared.utils import (
    NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY, FACILITY_EDGES_KEY, WELL_GROUP_KEY, WELL_GROUP_WELLS_KEY,
    DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY, OIL_TANK_KEY, FLARE_KEY, COMBUSTION_KEY, PNEUMATIC_DEVICE_KEY,
    PNEUMATIC_PUMP_KEY, CENTRIFUGAL_COMPRESSOR_KEY, RECIPROCATING_COMPRESSOR_KEY, ATMOSPHERE_KEY, CAPTURE_KEY,
    ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY, ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY)

MODEL_TYPE_UNIQUE = 'unique'
MODEL_TYPE_PROJECT = 'project'
MODEL_TYPE_LOOKUP = 'lookup'
MODEL_TYPE_NOT_ASSIGNED = 'not assigned'

INPT_ID = 'INPT ID'
INCREMENTAL_INDEX = 'Incremental Index'

PRICING_KEY = 'pricing'
DIFFERENTIALS_KEY = 'differentials'
PROD_TAX_KEY = 'production_taxes'
RISKING_KEY = 'risking'
OWNERSHIP_KEY = 'ownership_reversion'
ESCALATION_KEY = 'escalation'
CAPEX_KEY = 'capex'
EXPENSES_KEY = 'expenses'
FLUID_MODEL_KEY = 'fluid_model'
EMISSION_KEY = 'emission'

FIXED_HEADER = [
    'Index',
    'API 14',
    INPT_ID,
    'Chosen ID',
    #
    'Project Name',
    'Scenario Name',
    'Qualifier Name',
    'Created At',
    #
    'Well Name',
    INCREMENTAL_INDEX,
    'Well Number',
    'State',
    'County/Parish',
    'Type Curve Area',
]

CARBON_IMPORT_KEYS = [
    NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY, FACILITY_EDGES_KEY, WELL_GROUP_KEY, WELL_GROUP_WELLS_KEY,
    DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY, OIL_TANK_KEY, FLARE_KEY, COMBUSTION_KEY, PNEUMATIC_DEVICE_KEY,
    PNEUMATIC_PUMP_KEY, CENTRIFUGAL_COMPRESSOR_KEY, RECIPROCATING_COMPRESSOR_KEY, ATMOSPHERE_KEY, CAPTURE_KEY,
    ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY, ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY
]

EMPTY_CARBON_EXPORT_DICT = {key: [] for key in CARBON_IMPORT_KEYS}

FLUID_MODEL_NODE_KEYS = [WELL_GROUP_KEY, OIL_TANK_KEY, PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY, CUSTOM_CALCULATION_KEY]


class ColumnName(Enum):
    # shared
    model_type = 'Model Type'
    model_name = 'Model Name'
    new_model_name = 'New Name'
    createdAt = 'Created At'  # noqa N815
    createdBy = 'Created By'  # noqa N815
    updatedAt = 'Last Update'  # noqa N815, keep it here due to we need it for the field name in db
    updatedBy = 'Updated By'  # noqa N815
    #
    phase = 'Phase'
    key = 'Key'
    criteria = 'Criteria'
    criteria_start = 'Criteria Start'
    criteria_end = 'Criteria End'
    value = 'Value'
    value1 = 'Value 1'
    value2 = 'Value 2'
    period = 'Period'
    unit = 'Unit'
    unit1 = 'Unit 1'
    unit2 = 'Unit 2'
    cap = 'Cap'
    escalation_model = 'Escalation'
    escalation_model_1 = 'Escalation 1'
    escalation_model_2 = 'Escalation 2'
    calculation = 'Calculation'
    description = 'Description'
    deduct_severance_tax = 'Deduct Severance Tax'
    start_date = "Start Date"
    production_taxes_state = "Production Taxes State"
    volume_multiplier = 'Volume Multiplier %'
    scale_post_shut_in_factor = 'Scale Post Shut-in Factor'
    fixed_expense = 'Fixed Expense'
    capex = 'CAPEX'
    # dates
    max_well_life = 'Max Econ Life (Years)'
    as_of_date = 'As of Date'
    discount_date = 'Discount Date'
    cash_flow_prior_to_as_of_date = 'CF Prior To As Of Date'
    production_data_resolution = 'Prod Data Resolution'
    fpd_source_hierarchy = 'FPD source hierarchy'
    first_fpd_source = '1st FPD Source'
    second_fpd_source = '2nd FPD Source'
    third_fpd_source = '3rd FPD Source'
    fourth_fpd_source = '4th FPD Source'
    use_forecast_schedule_when_no_prod = 'Use Forecast/Schedule When No Prod'
    cut_off_criteria = 'Cut Off Criteria'
    cut_off_value = 'Cut Off Value'
    include_capex = 'Include CAPEX'
    discount = 'Discount'
    econ_limit_delay = 'Econ Limit Delay'
    side_phase_end = 'Align Dependent Phases'
    min_cut_off_criteria = 'Min Life Criteria'
    min_cut_off_value = 'Min Life Value'
    capex_offset_to_ecl = 'Trigger ECL CAPEX (Unecon)'
    consecutive_negative = 'Tolerant Negative CF'
    # rate rows
    rate_type = 'Rate Type'
    rows_calculation_method = 'Rate Rows Calculation Method'
    # expense
    shrinkage_condition = 'Shrinkage Condition'
    affect_econ_limit = 'Affect Econ Limit'
    deduct_before_severance_tax = 'Deduct bef Sev Tax'
    deduct_before_ad_val_tax = 'Deduct bef Ad Val Tax'
    stop_at_econ_limit = 'Stop at Econ Limit'
    expense_before_fpd = 'Expense bef FPD'
    deal_terms = 'Paying WI ÷ Earning WI'
    embedded_lookup_table = 'Embedded Lookup Table'
    # escalation
    escalation_frequency = 'Escalation Frequency'
    calculation_method = 'Calculation Method'
    # capex
    category = 'Category'
    escalation_start = 'Escalation Start'
    escalation_start_criteria = 'Escalation Start Criteria'
    escalation_start_value = 'Escalation Start Value (Days/Date)'
    # risking
    risk_prod = 'Risk Hist Prod'
    risk_ngl_drip_cond_via_gas_risk = 'Risk NGL & Drip Cond via Gas Risk'
    scale_post_shut_in_end_criteria = 'Scale Post Shut-In End Criteria'
    scale_post_shut_in_end = 'Scale Post Shut-In End'
    # repeating rows
    repeat_range_of_dates = 'Repeat Range Of Dates'
    total_occurrences = 'Total Occurrences'
    # ownership
    reversion_tied_to = 'Reversion Tied To'
    # fluid model
    N2 = 'N2'
    CO2 = 'CO2'
    C1 = 'C1'
    C2 = 'C2'
    C3 = 'C3'
    iC4 = 'iC4'  # noqa N815
    nC4 = 'nC4'  # noqa N815
    iC5 = 'iC5'  # noqa N815
    nC5 = 'nC5'  # noqa N815
    iC6 = 'iC6'  # noqa N815
    nC6 = 'nC6'  # noqa N815
    C7 = 'C7'
    C8 = 'C8'
    C9 = 'C9'
    C10plus = 'C10+'
    H2S = 'H2S'
    H2 = 'H2'
    H2O = 'H2O'
    He = 'He'
    O2 = 'O2'
    # emission
    CO2e = 'CO2e'
    CH4 = 'CH4'
    N2O = 'N2O'
    selected = 'Selected'

    ## carbon headers
    # well ids
    well_name = 'Well Name'
    well_number = 'Well Number'
    inptID = 'INPT ID'  # noqa N815, keep it here due to we need it for the field name in db
    chosenID = 'Chosen ID'  # noqa N815, keep it here due to we need it for the field name in db
    api10 = 'API 10'
    api12 = 'API 12'
    api14 = 'API 14'
    aries_id = 'Aries ID'
    phdwin_id = 'PHDwin ID'
    # network & facility
    node_id = 'Node ID'
    network_name = 'Network Name'
    new_network_name = 'New Network Name'
    facility_name = 'Facility Name'
    new_facility_name = 'New Facility Name'
    model_id = 'Model ID'
    node_type = 'Node Type'
    # edges
    edge_id = 'Edge ID'
    edge_name = 'Edge Name'
    edge_type = 'Type'
    from_node_id = 'From Node ID'
    from_port_id = 'From Port ID'
    to_node_id = 'To Node ID'
    to_port_id = 'To Port ID'
    allocation = 'Allocation'
    # nodes
    well_group_id = 'Well Group Model ID'
    wells = 'Wells'
    fluid_model = 'Fluid Model'
    fuel_type = 'Fuel Type'
    start_date_window = 'Start Date Window'
    consumption_rate = 'Consumption Rate'
    flowback_rate = 'Flowback Rate (MCF/D)'
    start_criteria = 'Start Criteria'
    start_criteria_option = 'Start Criteria Option'
    start_value = 'Start Value'
    end_criteria = 'End Criteria'
    end_criteria_option = 'End Criteria Option'
    end_value = 'End Value'
    flash_gas_ratio = 'Flash Gas Ratio (MCF/BBL)'
    pct_flare_efficiency = 'Flare Efficency (%)'
    pct_flare_unlit = 'Flare Unlit (%)'
    fuel_hhv = 'Fuel HHV (MMBtu/scf)'
    count = 'Count'
    runtime = 'Runtime (HR/Y)'
    device_type = 'Device Type'
    inputs = 'Input'
    outputs = 'Output'
    formula = 'Formula'
    emission_type = 'Emission Type'


drilling_completion_cols = [
    ColumnName.createdAt.value,
    ColumnName.createdBy.value,
    ColumnName.model_id.value,
    ColumnName.model_type.value,
    ColumnName.model_name.value,
    ColumnName.description.value,
    ColumnName.fuel_type.value,
    ColumnName.start_date_window.value,
    ColumnName.consumption_rate.value,
    ColumnName.start_criteria.value,
    ColumnName.start_criteria_option.value,
    ColumnName.start_value.value,
    ColumnName.end_criteria.value,
    ColumnName.end_criteria_option.value,
    ColumnName.end_value.value,
    ColumnName.updatedAt.value,
    ColumnName.updatedBy.value,
]
compressor_cols = [
    ColumnName.createdAt.value,
    ColumnName.createdBy.value,
    ColumnName.model_id.value,
    ColumnName.model_type.value,
    ColumnName.model_name.value,
    ColumnName.description.value,
    ColumnName.criteria.value,
    ColumnName.period.value,
    ColumnName.count.value,
    ColumnName.runtime.value,
    ColumnName.updatedAt.value,
    ColumnName.updatedBy.value,
]
shared_node_cols = [
    ColumnName.createdAt.value,
    ColumnName.createdBy.value,
    ColumnName.model_id.value,
    ColumnName.model_type.value,
    ColumnName.model_name.value,
    ColumnName.description.value,
    ColumnName.updatedAt.value,
    ColumnName.updatedBy.value,
]

FLUID_MODEL_COMPONENTS = [
    ColumnName.N2.value,
    ColumnName.CO2.value,
    ColumnName.C1.value,
    ColumnName.C2.value,
    ColumnName.C3.value,
    ColumnName.iC4.value,
    ColumnName.nC4.value,
    ColumnName.iC5.value,
    ColumnName.nC5.value,
    ColumnName.iC6.value,
    ColumnName.nC6.value,
    ColumnName.C7.value,
    ColumnName.C8.value,
    ColumnName.C9.value,
    ColumnName.C10plus.value,
    ColumnName.H2S.value,
    ColumnName.H2.value,
    ColumnName.H2O.value,
    ColumnName.He.value,
    ColumnName.O2.value,
]


class ProbCapexFields(Enum):
    prob_capex = 'Probabilistic CAPEX'
    distribution_type = 'Distribution Type'
    trial_number = 'Trial #'
    value_m_dollar = 'Value ($M)'
    seed = 'Seed'
    error_message = 'Error Message'


ASSUMP_HEADER = {
    'ownership_reversion': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        'Key',
        'Reversion Type',
        'Reversion Value',
        'WI %',
        'NRI %',
        'Lease NRI %',
        ColumnName.reversion_tied_to.value,
        'Balance',
        'Include NPI',
        'NPI Type',
        'NPI %',
        'Oil NRI %',
        'Gas NRI %',
        'NGL NRI %',
        'Drip Cond. NRI %',
        ColumnName.updatedAt.value,
    ],
    'reserves_category': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        'PRMS Class',
        'PRMS Category',
        'PRMS Sub Category',
        ColumnName.updatedAt.value,
    ],
    'expenses': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.embedded_lookup_table.value,
        'Key',
        'Category',
        'Criteria',
        'Value',
        'Period',
        'Unit',
        'Description',
        'Shrinkage Condition',
        'Escalation',
        'Calculation',
        'Affect Econ Limit',
        'Deduct bef Sev Tax',
        'Deduct bef Ad Val Tax',
        'Stop at Econ Limit',
        'Expense bef FPD',
        'Cap',
        'Paying WI / Earning WI',
        ColumnName.rate_type.value,
        ColumnName.rows_calculation_method.value,
        ColumnName.updatedAt.value,
    ],
    'capex': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.embedded_lookup_table.value,
        'Category',
        'Description',
        'Tangible (M$)',
        'Intangible (M$)',
        'Criteria',
        'From Schedule',
        'From Headers',
        'Value',
        'CAPEX or Expense',
        'Appear After Econ Limit',
        'Calculation',
        'Escalation',
        ColumnName.escalation_start_criteria.value,
        ColumnName.escalation_start_value.value,
        'Depreciation',
        'Paying WI / Earning WI',
        ColumnName.updatedAt.value,
    ],
    'stream_properties': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        'Key',
        'Category',
        'Criteria',
        'Value',
        'Period',
        'Unit',
        'Gas Shrinkage Condition',
        ColumnName.rate_type.value,
        ColumnName.rows_calculation_method.value,
        ColumnName.updatedAt.value,
    ],
    'dates': [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.max_well_life.value,
        ColumnName.as_of_date.value,
        ColumnName.discount_date.value,
        ColumnName.cash_flow_prior_to_as_of_date.value,
        ColumnName.production_data_resolution.value,
        ColumnName.first_fpd_source.value,
        ColumnName.second_fpd_source.value,
        ColumnName.third_fpd_source.value,
        ColumnName.fourth_fpd_source.value,
        ColumnName.use_forecast_schedule_when_no_prod.value,
        ColumnName.cut_off_criteria.value,
        ColumnName.cut_off_value.value,
        ColumnName.side_phase_end.value,
        ColumnName.min_cut_off_criteria.value,
        ColumnName.min_cut_off_value.value,
        ColumnName.include_capex.value,
        ColumnName.discount.value,
        ColumnName.econ_limit_delay.value,
        ColumnName.capex_offset_to_ecl.value,
        ColumnName.consecutive_negative.value,
        ColumnName.updatedAt.value,
    ],
    PRICING_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.phase.value,
        ColumnName.criteria.value,
        ColumnName.value.value,
        ColumnName.period.value,
        ColumnName.unit.value,
        ColumnName.cap.value,
        ColumnName.escalation_model.value,
        ColumnName.updatedAt.value,
    ],
    DIFFERENTIALS_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.key.value,
        ColumnName.phase.value,
        ColumnName.criteria.value,
        ColumnName.value.value,
        ColumnName.period.value,
        ColumnName.unit.value,
        ColumnName.escalation_model.value,
        ColumnName.updatedAt.value,
    ],
    PROD_TAX_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.production_taxes_state.value,
        ColumnName.key.value,
        ColumnName.phase.value,
        ColumnName.criteria.value,
        ColumnName.value1.value,
        ColumnName.unit1.value,
        ColumnName.escalation_model_1.value,
        ColumnName.value2.value,
        ColumnName.unit2.value,
        ColumnName.escalation_model_2.value,
        ColumnName.period.value,
        ColumnName.shrinkage_condition.value,
        ColumnName.calculation.value,
        ColumnName.deduct_severance_tax.value,
        ColumnName.start_date.value,
        ColumnName.rate_type.value,
        ColumnName.rows_calculation_method.value,
        ColumnName.updatedAt.value,
    ],
    RISKING_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.key.value,
        ColumnName.phase.value,
        # begin risking columns
        ColumnName.risk_prod.value,
        ColumnName.risk_ngl_drip_cond_via_gas_risk.value,
        ColumnName.value.value,
        ColumnName.period.value,
        # begin shut-in columns
        ColumnName.criteria.value,
        ColumnName.criteria_start.value,
        ColumnName.criteria_end.value,
        ColumnName.repeat_range_of_dates.value,
        ColumnName.total_occurrences.value,
        ColumnName.unit.value,
        ColumnName.scale_post_shut_in_factor.value,
        ColumnName.scale_post_shut_in_end_criteria.value,
        ColumnName.scale_post_shut_in_end.value,
        ColumnName.fixed_expense.value,
        ColumnName.capex.value,
        ColumnName.updatedAt.value,
    ],
    ESCALATION_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.key.value,
        ColumnName.escalation_frequency.value,
        ColumnName.calculation_method.value,
        ColumnName.criteria.value,
        ColumnName.value.value,
        ColumnName.period.value,
        ColumnName.unit.value,
        ColumnName.updatedAt.value,
    ],
    FLUID_MODEL_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.phase.value,
        ColumnName.criteria.value,
        *FLUID_MODEL_COMPONENTS,
        ColumnName.updatedAt.value,
    ],
    EMISSION_KEY: [
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.selected.value,
        ColumnName.category.value,
        ColumnName.CO2e.value,
        ColumnName.CO2.value,
        ColumnName.CH4.value,
        ColumnName.N2O.value,
        ColumnName.unit.value,
        ColumnName.escalation_model.value,
        ColumnName.updatedAt.value,
    ],
    NETWORK_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.node_id.value,
        ColumnName.network_name.value,
        ColumnName.node_type.value,
        ColumnName.model_id.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    FACILITY_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.node_id.value,
        ColumnName.facility_name.value,
        ColumnName.node_type.value,
        ColumnName.model_id.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    NETWORK_EDGES_KEY: [
        ColumnName.edge_id.value,
        ColumnName.network_name.value,
        ColumnName.description.value,
        ColumnName.edge_type.value,
        ColumnName.from_node_id.value,
        ColumnName.from_port_id.value,
        ColumnName.to_node_id.value,
        ColumnName.to_port_id.value,
        ColumnName.criteria.value,
        ColumnName.period.value,
        ColumnName.allocation.value,
    ],
    FACILITY_EDGES_KEY: [
        ColumnName.edge_id.value,
        ColumnName.facility_name.value,
        ColumnName.edge_name.value,
        ColumnName.description.value,
        ColumnName.edge_type.value,
        ColumnName.from_node_id.value,
        ColumnName.to_node_id.value,
        ColumnName.criteria.value,
        ColumnName.period.value,
        ColumnName.allocation.value,
    ],
    WELL_GROUP_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.wells.value,
        ColumnName.fluid_model.value,
        ColumnName.description.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    WELL_GROUP_WELLS_KEY: [
        ColumnName.well_group_id.value,
        ColumnName.well_name.value,
        ColumnName.well_number.value,
        ColumnName.inptID.value,
        ColumnName.chosenID.value,
        ColumnName.api10.value,
        ColumnName.api12.value,
        ColumnName.api14.value,
        ColumnName.aries_id.value,
        ColumnName.phdwin_id.value,
    ],
    DRILLING_KEY:
    drilling_completion_cols,
    COMPLETION_KEY:
    drilling_completion_cols,
    FLOWBACK_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.flowback_rate.value,
        ColumnName.start_criteria.value,
        ColumnName.start_criteria_option.value,
        ColumnName.start_value.value,
        ColumnName.end_criteria.value,
        ColumnName.end_criteria_option.value,
        ColumnName.end_value.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    OIL_TANK_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.fluid_model.value,
        ColumnName.flash_gas_ratio.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    FLARE_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.pct_flare_efficiency.value,
        ColumnName.pct_flare_unlit.value,
        ColumnName.fuel_hhv.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    COMBUSTION_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.fuel_type.value,
        ColumnName.criteria.value,
        ColumnName.period.value,
        ColumnName.consumption_rate.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    PNEUMATIC_DEVICE_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.fluid_model.value,
        ColumnName.criteria.value,
        ColumnName.period.value,
        ColumnName.count.value,
        ColumnName.runtime.value,
        ColumnName.device_type.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    PNEUMATIC_PUMP_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.fluid_model.value,
        ColumnName.criteria.value,
        ColumnName.period.value,
        ColumnName.count.value,
        ColumnName.runtime.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ],
    CENTRIFUGAL_COMPRESSOR_KEY:
    compressor_cols,
    RECIPROCATING_COMPRESSOR_KEY:
    compressor_cols,
    ATMOSPHERE_KEY:
    shared_node_cols,
    CAPTURE_KEY:
    shared_node_cols,
    ECON_OUTPUT_KEY:
    shared_node_cols,
    LIQUIDS_UNLOADING_KEY:
    shared_node_cols,
    ASSOCIATED_GAS_KEY:
    shared_node_cols,
    CUSTOM_CALCULATION_KEY: [
        ColumnName.createdAt.value,
        ColumnName.createdBy.value,
        ColumnName.model_id.value,
        ColumnName.model_type.value,
        ColumnName.model_name.value,
        ColumnName.description.value,
        ColumnName.fluid_model.value,
        ColumnName.inputs.value,
        ColumnName.outputs.value,
        ColumnName.formula.value,
        ColumnName.emission_type.value,
        ColumnName.category.value,
        ColumnName.updatedAt.value,
        ColumnName.updatedBy.value,
    ]
}


def get_assumption_empty_row(assumption_key):
    return {h: '' for h in ASSUMP_HEADER[assumption_key]}


def fill_in_model_type_and_name(csv_row, model):
    csv_row[ColumnName.model_name.value] = model['name']
    csv_row[ColumnName.model_type.value] = MODEL_TYPE_UNIQUE if model['unique'] else MODEL_TYPE_PROJECT
    return csv_row


OPTIONAL_CARBON_HEADERS = {
    NETWORK_KEY: [ColumnName.model_type.value, ColumnName.model_name.value],
    NETWORK_EDGES_KEY: [ColumnName.model_type.value, ColumnName.model_name.value],
    FACILITY_KEY: [ColumnName.model_type.value, ColumnName.model_name.value],
    FACILITY_EDGES_KEY: [ColumnName.model_type.value, ColumnName.model_name.value],
    WELL_GROUP_KEY: [ColumnName.wells.value],
    WELL_GROUP_WELLS_KEY: [
        ColumnName.model_type.value, ColumnName.model_name.value, ColumnName.well_name.value,
        ColumnName.well_number.value
    ],
}

# headers to include on Wells sheet in network export
CARBON_WELL_HEADERS = [
    ColumnName.well_name.name, ColumnName.well_number.name, ColumnName.inptID.name, ColumnName.chosenID.name,
    ColumnName.api10.name, ColumnName.api12.name, ColumnName.api14.name, ColumnName.aries_id.name,
    ColumnName.phdwin_id.name
]
