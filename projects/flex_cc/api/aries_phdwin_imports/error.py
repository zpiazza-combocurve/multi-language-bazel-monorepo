import io
import csv
import pandas as pd
from combocurve.shared.aries_import_enums import ErrorColumn, PhdwinErrorColumn, PhdwinModelEnum
from combocurve.utils.exceptions import get_exception_info
from enum import Enum

ERROR_DEFAULT_DATE = pd.to_datetime('01/2023')


class ErrorReport:
    def __init__(self, headers=[header.value for header in (ErrorColumn)], live=True):
        # error buffer
        self.assumption_error_list = io.StringIO()
        self.csv_writer = csv.writer(self.assumption_error_list, quoting=csv.QUOTE_NONNUMERIC)
        self.csv_writer.writerow(headers)
        self.has_error = False

    def log_error(self,
                  aries_row=None,
                  message=None,
                  model=None,
                  well=None,
                  scenario=None,
                  severity=None,
                  section=None):
        self.has_error = True
        self.csv_writer.writerow([scenario, well, section, model, message, aries_row, severity])


class PhdwinErrorReport(ErrorReport):
    def __init__(self, debug=False):
        super().__init__(headers=[header.value for header in (PhdwinErrorColumn)])
        self.debug_error_log = []
        self.debug = debug

    def log_error(self, message=None, model=None, well=None, severity=None, exception=None):
        self.has_error = True
        self.csv_writer.writerow([well, model, message, severity])
        if self.debug and exception is not None:
            self.debug_error_log.append(get_exception_info(exception))

    def output_debug_error(self):
        if len(self.debug_error_log) == 0:
            print('No Errors Encountered')  # noqa (T001)
        else:
            for idx, error_msg in enumerate(self.debug_error_log):
                print(f'Error {idx+1}')  # noqa (T001)
                print(error_msg)  # noqa (T001)


class ErrorMsgEnum(Enum):
    class1_msg = 'Could not extract {}, check {} column in {} table'
    class2_msg = 'Could not find {} column in {} table'
    class3_msg = 'Could not extract {}'
    class4_msg = 'Could not extract {}. Insufficient Parameters!'
    class5_msg = 'Could not extract parameters from {}'
    class6_msg = 'Could not extract {} from {}'
    shrink_message = 'Too many shrinkage syntax to handle'
    null_shrink = 'NULL SHRINK treated as 100%'
    class7_msg = 'Could not import {}'
    class8_msg = 'Could not extract {} from ARIES line with keyword {}'
    class9_msg = 'Could not extract {} from ARIES line with keyword {}. Insufficient Parameters!'
    start_date_error_msg = 'Start Date ({}) invalid!'
    read_start_error_msg = 'Start date ({}) invalid!, start date will be set to base date'
    date_error_msg = 'Date ({}) invalid!'
    end_date_not_ini = 'ENDDATE keyword not initiated in database'
    lookup_interpolation_error = 'Appropriate Range for LOOKUP interpolation ({}) not found'
    invalid_msg = '{} invalid!'
    invalid1_msg = '{} invalid for {}'
    curtailment_error_msg = 'CC does not handle ARIES curtailment'
    list_method_special_error_msg = 'Could not extract Production List'
    failed_to_set_criteria_to_reference = 'Failed to set Criteria to a Reference Date'
    inconsistent_var_exp_unit = (
        'CC does not handle combination of variable expense criteria in the same category, value switched to zero')
    overlay_operations_error = 'Cannot perform overlay Operations on keyword {} in import'
    cc_error_msg = 'CC does not currently handle this ARIES line syntax with keyword {}'
    line_error_msg = 'Could not connect line with previous segment!'
    cut_off_date_error_msg = 'Could not process cut-off date for segment with start date {}'
    lookup_msg = 'Could not extract expression from LOOKUP with name: {}'
    lookup1_msg = 'Could not integrate LOOKUP with name {} into economic assumptions'
    ownership_msg = 'Could not extract ownership parameters from previous line'
    ownership_escalation_error = 'ComboCurve does not currently support Escalation in Ownership'
    lease_nri_unavailable_msg = 'ARIES OPNET (Lease NRI) could not be processed, set to {}%'
    gas_shut_in_warning = 'Gas Shut in will affect yield products such as NGL and Condensate'
    multiple_price_msg = 'Multiple price detected for {}, First price used, subsequent prices set to differential'
    change_b_to_exp = 'ComboCurve DOES NOT handle Arps Incline, since b value near zero, curve type changed to EXP'
    change_b_to_exp_full = 'ComboCurve DOES NOT handle Arps Incline, curve type changed to EXP'
    zero_date_segment_error = 'Zero Duration Forecast detected, segment will last for 2 days'
    differential_model_error_msg = 'Cannot handle number of differential models'
    inconsistent_date_message = 'Inconsistent date scheduling for keyword {}'
    ownership1_msg = 'Could not extract reversion value(s)'
    escalation_msg = "Could not extract Escalation for {} from {}"
    elt_sidefile_error = 'Error creating Embedded Lookup Table from SIDEFILE'
    elt_lookup_error = 'Error creating Embedded Lookup Table from LOOKUP'
    elt_criteria_combination_error = (
        'Combocurve ELT does not support criteria combination used in LOOKUP, will be flattened')
    elt_nested = 'SIDEFILE/LOOKUP contains SIDEFILE/LOOKUP, nested ELT not supported, will be flattened'
    fetch_value_error_msg = "Could not extract value from TABLE"
    missing_price_unit = 'Irregular or Missing unit in Price Syntax'
    default_asof_message_error = 'ASOF and Base Date not Found, ASOF set as 1st of Jan 2021'
    error_processing_lookup = 'Error Processing SIDEFILE/LOOKUPs as ELT'
    generate_all_elt_errors = 'Error generating all Embedded Lookup table'
    scenario_error_msg = 'No scenario imported!'
    external_file = 'EXTERNAL FILES'
    sidefiles = 'SIDEFILES'
    ac_setup_data = 'AC_SETUPDATA'
    ar_sidefile = 'AR_SIDEFILE'
    ac_scenario = 'AC_SCENARIO'
    areenddate = 'AREENDDATE'
    ar_lookup = 'ARLOOKUP'
    lookups = 'LOOKUPS'
    file = ".A FILES"
    lookup = 'LOOKUP'
    keyword = 'KEYWORD'
    expression = 'EXPRESSION'
    keywords = 'keywords'
    ac_economic = 'AC_ECONOMIC'
    ownership = 'OWNERSHIP MODEL'
    ownership_param = 'OWNERSHIP PARAMETERS'
    price_diff_param = 'PRICE/DIFFERENTIALS PARAMETERS'
    price_diff = 'PRICE/DIFFERENTIALS MODEL'
    price = 'PRICE MODEL'
    paj = 'PRICE ADJUSTMENT/DIFFERENTIAL'
    diff = 'DIFFERENTIAL MODEL'
    res_cat = 'RESERVES CATEGORY'
    tax_expense = 'TAX/EXPENSE MODEL'
    tax_expense_param = 'TAX/EXPENSE PARAMETERS'
    tax = 'TAX MODEL'
    expense = 'EXPENSE MODEL'
    stream = 'STREAM PROPERTIES MODEL'
    risk = 'RISKING MODEL'
    capex = 'CAPEX MODEL'
    general = 'GENERAL OPTIONS MODEL'
    dates = 'DATES MODEL'
    rescat = 'RESERVES CATEGORIES'
    default_general_date = 'DEFAULT GENERAL OPTIONS AND DATES MODEL'
    default_pvfit = 'DEFAULT PRODUCTION VS FIT MODEL'
    pvfit = 'PRODUCTION VS FIT MODEL'
    elt = 'EMBEDDED LOOKUP TABLES'
    tangible_capex = 'TANGIBLE CAPEX VALUE'
    intangible_capex = 'INTANGIBLE CAPEX VALUE'
    capex_param = 'CAPEX PARAMETERS'
    forecast_stream = 'FORECAST/STREAM PROPERTIES MODEL'
    forecast = 'FORECAST MODEL'
    forecast_data = 'FORECAST CURVES'
    forecast_stream_param = 'FORECAST/STREAM PROPERTIES PARAMETERS'
    scenario_well = 'WELL ASSIGNMENTS FOR SCENARIOS'
    scenario = 'SCENARIOS'
    overlay = 'OVERLAYS'
    escalation = 'ESCALATION MODEL'
    overlay_param = 'OVERLAY PARAMETERS'
    lease_nri_oil = 'LEASE NRI OIL'
    lease_nri_gas = 'LEASE NRI GAS'
    lease_nri_cnd = 'LEASE NRI CONDENSATE'
    wi = 'WORKING INTEREST'
    nri = 'NET REVENUE INTEREST'
    unit = 'unit'
    value = 'value'
    end_value = 'end value'
    cap = 'PRICE CAP'
    btu = 'BTU'
    shrink = 'SHRINK'
    multiplier = 'phase multiplier'
    flowrate = 'flowrate'
    yield_ = 'yield (NGL/GAS)'
    date = 'date'
    end_date = 'end date'
    project_life = 'PROJECT LIFE'
    project_set = 'PROJECT SETTINGS'
    setup = 'SETUP'
    base_date = 'BASE DATE'
    effective_date = 'EFFECTIVE DATE'
    max_eco_year = 'MAXIMUM ECONOMIC LIFE'
    discount_method = 'DISCOUNT METHOD'
    first_discount = 'FIRST DISCOUNT METHOD'
    discount_table = 'DISCOUNT TABLE'
    cum_value = 'CUMULATIVE VALUE'
    default_lines = 'DEFAULT LINES'
    common_lines = 'COMMON LINES'
    multiple_net_line_error = 'Cannot combine multi-line NET and single line Net'
    overlay_override_message = 'Could not handle using Overlay to Override Model'
    ratio_to_rate_msg = 'Cannot handle combination of rate and ratio in the same Phase, converted {} to rate'
    single_lse = 'Inconsistent LSE/OWN reversion points not currently handled'
    cap_to_value = 'CAP ({}) is lower than SET VALUE ({}). Using CAP as VALUE'
    reversion_on_gross_revenue = 'Reversion on Gross Total Rev. NOT avaialble in CC, switched to PO'
    negative_multiplier = 'Negative multipliers are not currently handled by CC. Defaulted to 100%'
    phase_mismatch = 'Major phase in AC_PROPERTY does not match major in ECONOMICS.'
    dbslist_key = 'Could not find any DBSKEY to use. First unique DBSKEY found on AC_SCENARIO will be used.'


class ErrorMsgSeverityEnum(Enum):
    critical = 'critical'
    warn = 'warning'
    error = 'error'


def format_error_msg(format_type, *args):
    #TODO: return format_type.format(*args)
    if len(args) == 1:
        return format_type.format(args[0])
    elif len(args) == 2:
        return format_type.format(args[0], args[1])
    elif len(args) == 3:
        return format_type.format(args[0], args[1], args[2])
    elif len(args) == 4:
        return format_type.format(args[0], args[1], args[2], args[3])


class PhdwinErrorMessage:
    reserve_cat = 'Could not create Reserves Category Model for well'
    reservoir_props = 'Could not process Reservoir Properties'
    fluid_props = 'Could not process Fluid Properties'
    gas_comp = 'Could not process Gas Composition'
    econ_function = 'Could not process PHDWin Econ. Settings'
    cut_off_risk = 'Could not get cut-off/Risking information'
    ownership = 'Could not process Ownership and Reversion Model'
    capex = 'Could not process CAPEX model'
    incrementals = 'Could not extract Incremental Trees'
    forecast = 'Could not process Forecast Segment(s)'
    ngl_btu = 'Could not extract NGL and/or BTU'
    incremental_failure = 'Failed to create all Incrementals'
    price_expense_tax_shrink_preprocess = 'Preprocess of Price, Tax, Expense and Shrink File Failed'
    segment_extract = 'Error getting dates from Forecasted Segments'
    lsg_process_issue = 'Error Processing Supplementary Price, Tax, Expense and Shrink File'
    btu = 'Error getting BTU value'
    get_asof_date = f'Could not get ASOF date using Default Date {ERROR_DEFAULT_DATE}'
    add_reference_date = 'Could not get Reference Dates e.g First Prod Date'
    link_mod = 'Could not Link Model File to Phd file'
    unexpected = 'Unexpected Error while processing Price, Tax, Expense and Shrink Assumptions'
    formula_evaluation_error = 'Error evaluating PHDWin Forecast Formula'

    def model_fail(self, name):
        return f'{name} Model Import Failed'


PRICE_TAX_EXPENSE_SHRINK_MODEL_NAME = '/'.join([
    PhdwinModelEnum.pricing.value, PhdwinModelEnum.prod_tax.value, PhdwinModelEnum.expenses.value,
    PhdwinModelEnum.stream_props.value
])
