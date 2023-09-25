import pandas as pd
import numpy as np
import re
import calendar
import copy
import datetime
from bson import ObjectId
from dateutil.relativedelta import relativedelta
from math import ceil
import warnings
from combocurve.science.econ.general_functions import py_date_to_index

from combocurve.services.cc_to_aries.general_functions import has_forecast, truncate_inpt_id, index_to_py_date
from combocurve.services.cc_to_aries.construct_ac_df import combine_str
from combocurve.services.cc_to_aries.query_helper import (
    ALL_PHASES,
    get_pct_key_by_phase,
    get_main_phase,
    get_end_of_historic_production,
    get_fsg,
    process_dates_setting,
    has_segments,
)
from combocurve.services.cc_to_aries.construct_ac_setupdata import get_base_date
from combocurve.services.econ.econ_input_batch import run_econ_for_independent_well
from combocurve.shared.np_helpers import get_well_order_by_names

from combocurve.shared.econ_tools.process_shut_in import process_shut_in
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.shared.econ_tools.econ_model_tools import RATE_BASED_ROW_KEYS, UNIT_MAP, REVERSION_KEYS
from combocurve.shared.forecast_tools.forecast_segments_check import SegNames

from combocurve.science.econ.pre_process import PreProcess, schedule_idx_to_dates
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (pred_arps, pred_arps_modified, arps_D_2_D_eff, pred_linear,
                                                             linear_k_2_D_eff, pred_exp, arps_get_D_delta)
from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.science.econ.econ_use_forecast.use_forecast import (get_fpd_from_source, generate_forecast_volumes,
                                                                    WellHeaderError)
from combocurve.science.econ.econ_use_forecast.adjust_forecast import adjust_forecast_start
from combocurve.services.cc_to_aries.aries_export_state import UserWorkStream
from combocurve.services.display_templates.display_templates_service import DisplayTemplatesService
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.constants import DAYS_IN_YEAR, DAYS_IN_MONTH, USER_NOTIFICATION_UPDATE_EVENT_NAME
from combocurve.utils.units import get_multiplier
from itertools import groupby

CC_BASE_DATE = np.datetime64('1900-01-01')

DEFAULT_FPD = datetime.date(2020, 1, 1)

WELL_HEADER_CONVERSION_KEY = 'well_headers_source_conversion'

AC_ECONOMIC_HEADERS = [
    'PROPNUM', 'WELL NAME', 'WELL NUMBER', 'INPT ID', 'API10', 'API12', 'API14', 'CHOSEN ID', 'ARIES ID', 'PHDWIN ID',
    'SECTION', 'SEQUENCE', 'QUALIFIER', 'KEYWORD', 'EXPRESSION'
]
PHASE_STREAM_CONV_DICT = {'P09': '370', 'P10': '370', 'P11': '370', 'P12': '374', 'P13': '374', 'P14': '374'}

AR_SIDEFILE_HEADERS = ['FILENAME', 'SECTION', 'SEQUENCE', 'KEYWORD', 'EXPRESSION']
AR_LOOKUP_HEADERS = [
    'NAME', 'LINETYPE', 'SEQUENCE', *[f'VAR{i}' for i in range(8)], 'OWNER', *[f'VAR{i}' for i in range(8, 31)]
]
AR_ENDDATE_HEADERS = ['DBSKEY', 'RECORD_CODE', 'LIFE']
MINIMUM_FORECAST_START_DATE = '2000-01-01'
MAX_WELL_HEADER_LENGTH_FOR_LOOKUP_REF = 5
MAX_ARIES_FORECAST_RUN_YRS = 100
MAX_LOAD_ROW = 900
MAX_ROW_LEN = 15
ARIES_ID_INDEX = 0
SECTION_INDEX = 10
SEQ_INDEX = 11
LL_NUM_CREATED_SEGMENTS = 6
UL_NUM_CREATED_SEGMENTS = 10
NEAR_ZERO_RATE = '0.000000001'
ROUND_DIGIT = 4
LEN_MODEL_IDX = 5
VALID_B_DIGITS_IN_NEAR_DEFF_CASES = 2
NEAR_ZERO_B_VAL_IN_NEAR_DEFF_CASES = 0.01
MINIMUM_DEFF_VALUE = 0.01
ROUND_DIGIT_OWN = 8
NEAR_ZERO_B_VALUE = 0.0001
MAX_PREV_YEAR_LOAD = 10
MAX_SIDEFILE_NAME_LEN = 20
TRUNCATED_SIDEFILE_NAME_LEN = 10
NUM_TRAILING_ZEROS = 3
PHASE_TEXT_LIM = 6
MAX_LIST_MODE_CHAR_LEN = 56
TEXT = 'TEXT'
ERROR = 'ERROR'
MONTHS_IN_YEAR = 12
DATE_LIMIT_FOR_SHIFT = 15
ROWS_CALC_METHOD = 'rows_calculation_method'
RATE_TYPE = 'rate_type'
GROSS_WELL_HEAD = 'gross_well_head'
NON_MONOTONIC = 'non_monotonic'
SIDEFILE = 'SIDEFILE'

KEYWORD_DICT = {'oil': 'OIL', 'gas': 'GAS', 'water': 'WTR'}
UNIT_DICT = {
    'oil': {
        'per_day': 'B/D',
        'per_month': 'B/M',
    },
    'gas': {
        'per_day': 'M/D',
        'per_month': 'M/M',
    },
    'water': {
        'per_day': 'B/D',
        'per_month': 'B/M',
    },
    'gas/oil': {
        'cc_db': 'mcf/bbl',
        'cc_front': 'mcf/bbl',  # we use mcf/bbl instead of cf/bbl due to Aires has no cf
        'aries': 'M/B'
    },
    'gas/water': {
        'cc_db': 'mcf/bbl',
        'cc_front': 'mcf/bbl',
        'aries': 'M/B'
    },
    'oil/gas': {
        'cc_db': 'bbl/mcf',
        'cc_front': 'bbl/mmcf',
        'aries': 'B/MM'
    },
    'oil/water': {
        'cc_db': 'bbl/bbl',
        'cc_front': 'bbl/bbl',
        'aries': 'B/B'
    },
    'water/gas': {
        'cc_db': 'bbl/mcf',
        'cc_front': 'bbl/mmcf',
        'aries': 'B/MM'
    },
    'water/oil': {
        'cc_db': 'bbl/bbl',
        'cc_front': 'bbl/bbl',
        'aries': 'B/B'
    },
}

BEHAVIOR_CC_TO_ARIES = {'regular': 'M', 'match': 'M', 'ratio': 'R', 'interpolation': 'I'}


class AriesStartLog():
    def __init__(self):
        self.current_start = None
        self.use_incremental = False
        self.zero_expense_workstream = set()

    def add_start_and_update_current_start(self,
                                           incoming_start,
                                           rows_list,
                                           date_dict,
                                           criteria=None,
                                           fpd=False,
                                           ecl_links=False):
        if incoming_start == self.current_start or incoming_start == 'RATE':
            return rows_list
        elif ecl_links:
            link_id = generate_ecl_id(incoming_start, ecl_links)
            fpd_date = ecl_links.get(link_id, {'fpd_date': None}).get('fpd_date', None)
            fpd_date = fpd_date.strftime('%m/%Y')
            return rows_list + [['TEXT', 'Start generated from linked eco limit in CC.'], ['START', fpd_date]]
        else:
            self.current_start = incoming_start
            use_macro, macro = check_if_macro_rqd(incoming_start, date_dict, criteria, fpd)
            if use_macro:
                self.use_incremental = True
                return rows_list + [['START', f'@M.{macro}']]
            else:
                self.use_incremental = False
                return rows_list + [['START', incoming_start]]

    def add_expense_workstream_to_zero(self, keyword):
        if keyword != '"':
            self.zero_expense_workstream.add(keyword)


def check_if_macro_rqd(incoming_start, date_dict, criteria, fpd):
    def get_date(date):
        if pd.isnull(pd.to_datetime(date, errors="coerce")):
            return None
        year, month, _ = date.split('-')
        return datetime.date(int(float(year)), int(float(month)), 1)

    use_macro, macro = False, None
    # handle for forecast import
    if date_dict is None:
        return use_macro, macro
    if any(
            get_date(date) == pd.to_datetime(incoming_start, errors='coerce') and offset == criteria
            for offset, date in date_dict.items()):
        macro = next(
            OFFSET_MACRO_DICT.get(offset) for offset, date in date_dict.items()
            if get_date(date) == pd.to_datetime(incoming_start, errors='coerce') and offset == criteria)
        if macro is not None:
            use_macro = True
    elif fpd and get_date(date_dict['offset_to_fpd']) == pd.to_datetime(incoming_start, errors='coerce'):
        macro = 'FIRST_PROD_DATE'
        use_macro = True
    return use_macro, macro


def to_date(input_date):
    if isinstance(input_date, str):
        ret_date = datetime.datetime.strptime(input_date, '%Y-%m-%d').date()
    elif isinstance(input_date, datetime.date):
        ret_date = input_date
    return ret_date


def add_change_point(input_str, change_point, change_criteria):
    return input_str.replace('TO LIFE', str(change_point) + ' ' + str(change_criteria))


def offset_cc_date_by_month_year(date, years=0, months=0):
    year, month, day = date.split('-')
    year = int(year)
    month = int(month)

    shift_year = months // 12
    shift_month = months % 12

    if month + shift_month > 12:
        month = (month + shift_month) - 12
        shift_year += 1
    else:
        month += shift_month
    year = year + years + shift_year
    month = f'0{month}' if len(str(month)) == 1 else month

    return f'{year}-{month}-{day}'


def cc_date_to_aries_date(cc_date, date_dict=None):
    if date_dict:
        # base_date is the minimum date than can be set
        if np.datetime64(date_dict['base_date']) > np.datetime64(cc_date):
            cc_date = date_dict['base_date']
        aries_max_date = offset_cc_date_by_month_year(date_dict['base_date'], years=100)
        if np.datetime64(cc_date) > np.datetime64(aries_max_date):
            # print(cc_date, aries_max_date, np.datetime64(cc_date) > np.datetime64(aries_max_date))
            cc_date = aries_max_date
    # input is string with format: 'yyyy-mm-dd'
    if not isinstance(cc_date, str):
        aries_date = str(cc_date)
    else:
        aries_date = cc_date
    aries_date_list = aries_date.split('-')
    return aries_date_list[1] + '/' + aries_date_list[0]


def list_to_expression(input_list):
    return ' '.join([str(i) for i in input_list])


def get_phase_keyword(phase):
    if phase == 'water':
        phase_keyword = 'WTR'
    elif phase == 'drip_condensate':
        phase_keyword = 'CND'
    else:
        phase_keyword = str(phase).upper()
    return phase_keyword


def format_digits(num):
    num = float(num)
    return np.format_float_positional(round(num, ROUND_DIGIT_OWN), trim='-')


def add_warnings_for_aries_unsupported_rev(warning_ret, rev, criteria, threshold, rev_key_sets):
    """Checks for revision exports not supported in Aries. Inserts a warning line when found.

    Args:
        warning_ret (list): Ownership output for warning rows related to reversion
        rev (_type_): Current revnue being worked
        criteria (_type_): keyword for this reversion
        threshold (_type_): value assigned to this reversion
        rev_key_sets (_type_): list of revision keywords split by category

    Returns:
        Boolean: True/False if current revision is to be skipped
    """
    skip_rev = False

    if criteria in rev_key_sets['INVESTMENT']:
        balance = rev['balance']
        if criteria == 'irr':
            warning_ret.append([ERROR, 'LOOK HERE!'])
            warning_ret.append([TEXT, "ARIES DOES NOT SUPPORT IRR REVERSION"])
            skip_rev = True
        elif criteria == 'roi_undisc':
            if balance == 'net':
                warning_ret.append([ERROR, 'LOOK HERE!'])
                warning_ret.append([TEXT, "ARIES DOES NOT SUPPORT NET PAYOUT REVERSION"])
                skip_rev = True
            if threshold != 1:
                warning_ret.append([ERROR, 'LOOK HERE!'])
                warning_ret.append([TEXT, "ARIES ONLY SUPPORTS 1X PAYOUT REVERSION"])
    elif criteria in rev_key_sets['CASH_FLOW']:
        balance = rev['balance']
        include_npi = rev['include_net_profit_interest']
        if balance == 'net':
            if criteria == 'payout_without_investment':
                if include_npi != 'yes':
                    warning_ret.append([ERROR, 'LOOK HERE!'])
                    warning_ret.append([TEXT, "ARIES DOESN'T SUPPORT NET PAYOUT REVERSION W/O INVESTMENT AND W/O NPI "])
                    skip_rev = True
            else:
                warning_ret.append([ERROR, 'LOOK HERE!'])
                warning_ret.append([TEXT, "ARIES DOESN'T SUPPORT NET PAYOUT REVERSION W/INVESTMENT"])
                skip_rev = True
    elif criteria in rev_key_sets['VOLUME']:
        balance = rev['balance']
        if balance == 'net':
            warning_ret.append([ERROR, 'LOOK HERE!'])
            warning_ret.append([TEXT, "NET CUM VOLUME REVERSION NOT SUPPORTED IN ARIES"])
            skip_rev = True
        else:
            if criteria == 'well_head_boe_cum':
                warning_ret.append([ERROR, 'LOOK HERE!'])
                warning_ret.append([TEXT, "CUMULATIVE BOE REVERSION NOT SUPPOERTED IN ARIES"])
                skip_rev = True
    return skip_rev


def pull_expense_ownership(revision):
    """Extract ownership values from current revision

    Args:
        revision (_type_): Current revision with values to extract

    Returns:
        Double: Lease Working Interest
        Double: Net Oil Interest
        Double: Net Gas Interest
        Double: Lease Net Profit Interest

    """

    # LSE/WI
    lse_wi = revision['working_interest']
    # NET/OIL
    if revision['oil_ownership']['net_revenue_interest'] == '':
        net_oil = revision['original_ownership']['net_revenue_interest']
    else:
        net_oil = revision['oil_ownership']['net_revenue_interest']
    # NET/GAS
    if revision['gas_ownership']['net_revenue_interest'] == '':
        net_gas = revision['original_ownership']['net_revenue_interest']
    else:
        net_gas = revision['gas_ownership']['net_revenue_interest']
    # LSE/NPI
    lse_npi = revision['net_profit_interest']

    return lse_wi, net_oil, net_gas, lse_npi


def process_rev_criteria(warning_ret, rev, criteria, threshold, rev_key_sets, date_dict):
    """Process revision to extract keyword and threshold

    Args:
        warning_ret (list): Ownership output for warning rows related to reversion
        rev (_type_): Current Revision being processed
        criteria (_type_): Type of revision
        threshold (_type_): Revision threshold
        rev_key_sets (_type_): list of revision keywords split by category
        date_dict (_type_): date dictionary for revisions using date

    Returns:
        Boolean: check for skip revision
        String: keyword value for revision
        String: threshold value for revision
    """
    keyword = ''

    if criteria in rev_key_sets['CASH_FLOW']:
        # Aries use M$ for dollar unit, so we need to divide by 1000
        threshold = threshold / 1000
        this_balance = rev['balance']
        this_include_npi = rev['include_net_profit_interest']
        if this_balance == 'net':
            if criteria == 'payout_without_investment':
                if this_include_npi == 'yes':
                    keyword = 'M$N'
                else:
                    # holder for Net Payout, W/O Investment, W/O NPI reversion implementation
                    pass
            else:
                # holder for Net Payout, W/Investment reversion implementation
                pass
        else:
            if criteria == 'payout_with_investment':
                if this_include_npi == 'yes':
                    keyword = 'M$/749'
                else:
                    keyword = 'M$/748'
            else:
                if this_include_npi == 'yes':
                    keyword = 'M$/746'
                else:
                    keyword = 'M$/747'
    elif criteria in rev_key_sets['DATE']:
        if criteria == 'date':
            threshold = cc_date_to_aries_date(threshold, date_dict)
            keyword = 'AD'
        else:
            this_offset_date = to_date(date_dict[criteria])
            this_absolute_date = this_offset_date + relativedelta(months=threshold - 1)
            threshold = cc_date_to_aries_date(str(this_absolute_date), date_dict)
            keyword = 'AD'
    elif criteria in rev_key_sets['VOLUME']:
        this_balance = rev['balance']
        if this_balance == 'net':
            # holder for Net Cum Volume reversion implementation
            pass
        else:
            if criteria == 'well_head_oil_cum':
                keyword = 'BBL'
            elif criteria == 'well_head_gas_cum':
                keyword = 'MCF'
            elif criteria == 'well_head_boe_cum':
                # holder for cumulative BOE reversion implementation
                pass
    elif criteria in rev_key_sets['INVESTMENT']:
        if criteria == 'roi_undisc':
            keyword = 'PAYOUT'
            # PAYOUT 0 = trigger when gross income before NPI equals investment
            # PAYOUT 1 = trigger when gross income after NPI equals investment

            if rev['include_net_profit_interest'] == 'yes':
                threshold = '1'
            else:
                threshold = '0'
    return threshold, keyword


######## ownership_reversion conversion (section 7 in Aries)
def ownership_reversion_conv(ownership_reversion_econ, date_dict, aries_start_log, user_work_stream=None):  # noqa: C901
    '''
    Aries Format for LSE and NET
    LSE(OWN): WI ROY ORRI NPI % ChangePoint ChangeUnits
    NET: LSE/WI NET/OIL NET/GAS LSE/NPI % ReversionPoint ReversionUnits
    '''
    ownership_ret = []
    warning_ret = []
    incoming_start = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
    ownership_ret = aries_start_log.add_start_and_update_current_start(incoming_start, ownership_ret, date_dict)

    # grouping for processing revision types
    cf_rev_key_list = {'payout_with_investment', 'payout_without_investment'}
    date_rev_key_set = {
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'date'
    }
    volume_rev_key_set = {'well_head_oil_cum', 'well_head_gas_cum', 'well_head_boe_cum'}
    inv_rev_key_set = {'roi_undisc', 'irr'}

    rev_key_sets = {
        'CASH_FLOW': cf_rev_key_list,
        'DATE': date_rev_key_set,
        'VOLUME': volume_rev_key_set,
        'INVESTMENT': inv_rev_key_set
    }

    initial_ownership = ownership_reversion_econ['ownership']['initial_ownership']
    npi_type = initial_ownership['net_profit_interest_type']

    if npi_type == 'expense':

        lse_wi, net_oil, net_gas, lse_npi = pull_expense_ownership(initial_ownership)
        ownership_ret.append([
            'NET',
            list_to_expression([
                format_digits(lse_wi),
                format_digits(net_oil),
                format_digits(net_gas),
                format_digits(lse_npi), '% TO LIFE'
            ])
        ])

        # reversion
        for key in REVERSION_KEYS:
            rev = ownership_reversion_econ['ownership'].get(key, EconModelDefaults.no_reversion)
            if 'no_reversion' in rev.keys():
                continue

            criteria = list((cf_rev_key_list | date_rev_key_set | volume_rev_key_set | inv_rev_key_set)
                            & set(rev.keys()))[0]
            threshold = rev[criteria]

            skip_rev = add_warnings_for_aries_unsupported_rev(warning_ret, rev, criteria, threshold, rev_key_sets)

            if skip_rev:
                continue

            rev_lse_wi, rev_net_oil, rev_net_gas, rev_lse_npi = pull_expense_ownership(rev)

            threshold, this_keyword = process_rev_criteria(warning_ret, rev, criteria, threshold, rev_key_sets,
                                                           date_dict)

            ownership_ret[-1][-1] = add_change_point(ownership_ret[-1][-1], threshold, this_keyword)
            ownership_ret.append([
                '"',
                list_to_expression([
                    format_digits(rev_lse_wi),
                    format_digits(rev_net_oil),
                    format_digits(rev_net_gas),
                    format_digits(rev_lse_npi), '% TO LIFE'
                ])
            ])

    elif npi_type == 'revenue':
        '''
        Note:
        1. doesn't work for modified phase ownership for now (don't know the syntax of Aries).
        2. I don't know how Aries take care of the LSE/WI with OWN/WI as 0,
        it can be considered as 100 or as the real value (might be less than 100),
        but in CC the NPI is calculated based on the value of WI (can be manually input as 100) right now.
        '''
        # WI
        wi = initial_ownership['working_interest']
        # ROY
        roy = 100 - initial_ownership['original_ownership']['lease_net_revenue_interest']
        # ORRI
        orri = 0
        # NPI
        npi = initial_ownership['net_profit_interest']
        #
        ownership_ret.append([
            'LSE',
            list_to_expression(
                [format_digits(wi),
                 format_digits(roy),
                 format_digits(orri),
                 format_digits(npi), '% TO LIFE'])
        ])
        ownership_ret.append(['OWN', '0 0 0 100 % TO LIFE'])

        return warning_ret + ownership_ret

    return warning_ret + ownership_ret


######## capex conversion (section 8 in Aries)
## transform drilling cost model to the format of other_capex.
def get_schedule_idx(schedule, schedule_key, model_category):
    schedule_key_map = {'schedule_start': model_category + 'WorkStart', 'schedule_end': model_category + 'WorkEnd'}
    schedule_date_idx = schedule.get(schedule_key_map[schedule_key])
    if schedule_date_idx:
        return schedule_date_idx
    else:
        if model_category == 'drill':
            schedule_label = 'Drilling ' + schedule_key.split('_')[-1]
        else:
            schedule_label = 'Completion ' + schedule_key.split('_')[-1]
        error_message = f'{schedule_label} is used but can not get from schedule'
        warnings.warn(error_message)
        return None


##
def check_well_header(key, well_header_info):
    if key in well_header_info.keys():
        ret_number = well_header_info[key]
        if (type(ret_number) not in [int, float]) or (ret_number < 0):
            ret_number = 0
    else:
        ret_number = 0
    return ret_number


def process_capex_cost_model(other_capex_rows, capex_econ, well_header, schedule):
    ## drilling and completion cost model process
    # vertical_depth
    vertical_depth = check_well_header('true_vertical_depth', well_header)
    # lateral_length
    lateral_length = check_well_header('perf_lateral_length', well_header)
    # total_prop_weight
    total_prop_weight = check_well_header('total_prop_weight', well_header)
    #

    if 'drilling_cost' in capex_econ.keys() and len(capex_econ['drilling_cost']) > 0:
        drilling_cost = capex_econ['drilling_cost']
        drilling_cost_list = PreProcess.drilling_cost_pre(
            drilling_cost,
            vertical_depth,
            lateral_length,
            schedule,
        )
        other_capex_rows = np.append(drilling_cost_list, other_capex_rows)

    if 'completion_cost' in capex_econ.keys() and len(capex_econ['completion_cost']) > 0:
        completion_cost = capex_econ['completion_cost']
        completion_cost_list = PreProcess.completion_cost_pre(
            completion_cost,
            vertical_depth,
            lateral_length,
            total_prop_weight,
            schedule,
        )
        other_capex_rows = np.append(completion_cost_list, other_capex_rows)

    return other_capex_rows


def update_capex_point_unit_for_lookup_criteria(point_unit: str) -> str:
    use = '?'
    category = 'date_unit'
    new_point_unit = f'{use}~{point_unit}~{category}'
    return new_point_unit


def get_capex_offset_date_from_external_source(capex_doc, criteria, well_header, schedule_dates):
    if schedule_dates is not None:
        offset_date = schedule_dates.get(capex_doc[criteria])
        use_text = 'SCHEDULE'
    else:
        offset_date = well_header.get(str(capex_doc[criteria]).replace("offset_to_", ""))
        use_text = 'HEADER'
    return offset_date, use_text


def process_capex_by_prod_rate(capex_ret, one_capex, this_criteria, lookup=False):
    # initiate default values
    inv_point = 0
    point_unit = ''

    criteria_value = one_capex.get('criteria_value', '')
    if this_criteria in ['oil_rate', 'gas_rate']:
        point_unit = 'BPD' if this_criteria == 'oil_rate' else 'MPD'
        if lookup and criteria_value.startswith('?'):
            inv_point = criteria_value
            if one_capex.get('lookup_criteria', False):
                point_unit = update_capex_point_unit_for_lookup_criteria(point_unit)
        else:
            inv_point = format_digits(one_capex[this_criteria])
    else:
        point_unit = 'BPD'
        if lookup and criteria_value.startswith('?'):
            inv_point = criteria_value
            if one_capex.get('lookup_criteria', False):
                point_unit = update_capex_point_unit_for_lookup_criteria(point_unit)
        else:
            inv_point = format_digits(one_capex[this_criteria])
        formated_criteria_name = ' '.join(str(this_criteria).split('_')).upper()
        error_row = [TEXT, f'NO ARIES ANALOG FOR {formated_criteria_name} USING OIL RATE']
        capex_ret.append([ERROR, 'LOOK HERE!'])
        capex_ret.append(error_row)

    return inv_point, point_unit


def process_capex_by_offset(one_capex, date_dict, this_criteria, well_header, lookup=False):
    inv_point = ''
    point_unit = 'AD'
    formatted_name = OFFSET_LOOKUP_DICT.get(this_criteria)

    # add formatted date to well header
    if formatted_name not in well_header:
        well_header[formatted_name] = pd.to_datetime(date_dict[this_criteria]).strftime('%m/%Y')

    criteria_value = one_capex.get('criteria_value', '')

    if lookup and criteria_value.startswith('?'):
        use, value, category = criteria_value.split('~')
        sign = '-' if float(value) < 0 else '+'
        value = int(abs(float(value)))
        inv_point = f'@M.{formatted_name}{sign}{value}'
        inv_point = f'{use}~{inv_point}~{category}'
        if one_capex.get('lookup_criteria', False):
            point_unit = update_capex_point_unit_for_lookup_criteria(point_unit)
    else:
        days = float(one_capex[this_criteria])
        sign = '-' if days < 0 else '+'
        days = int(abs(days))
        inv_point = f'@M.{formatted_name}{sign}{days}'

    return well_header, inv_point, point_unit


def process_capex_by_date(one_capex, date_dict, this_criteria, lookup=False):
    inv_point = 0
    point_unit = 'AD'
    criteria_value = one_capex.get('criteria_value', '')
    if lookup and criteria_value.startswith('?'):
        use, value, category = criteria_value.split('~')
        value = (pd.to_datetime(value)).strftime('%Y-%m-%d')
        value = cc_date_to_aries_date(value, date_dict)
        inv_point = f'{use}~{value}~{category}'
        if one_capex.get('lookup_criteria', False):
            point_unit = update_capex_point_unit_for_lookup_criteria(point_unit)
    elif lookup:
        inv_point = cc_date_to_aries_date(one_capex[this_criteria].get('start_date'), date_dict)
    else:
        inv_point = cc_date_to_aries_date(one_capex[this_criteria], date_dict)

    return inv_point, point_unit


def process_naming_of_reference(well_header, original_criteria_name, ref_name_dict):
    # check if length of potential header name is greater than ARIES Character limit
    if len(original_criteria_name) > 10:
        # shorten name to the first 5 chars and remove any trailing underscores
        reformated_criteria_name = original_criteria_name[:5].strip('_')
        # initialize max index to 1
        use_name = ref_name_dict.get(original_criteria_name)
        if use_name is not None:
            return use_name
        max_idx = 0
        # loop through all the well headers
        # if the well header name is already in the well_header dict
        # find the highest suffix for it
        for item in ref_name_dict.values():
            # split the header name on the last underscore
            # if the item has no underscore ignore it, as it has obviously (lol) not been used before
            split_header = item.rsplit('_', 1)
            if len(split_header) > 1:
                # check that the value after the underscore is a numeric value
                try:
                    current_idx = int(float(split_header[1]))
                except ValueError:
                    continue
                if str(reformated_criteria_name).strip().lower() == str(split_header[0]).strip().lower():
                    if current_idx > max_idx:
                        max_idx = current_idx
        max_idx += 1
        # get the use index
        use_idx = format_model_index(max_idx)
        # get the appropriate name
        reformated_criteria_name = f'{reformated_criteria_name}_{use_idx}'
        ref_name_dict[original_criteria_name] = reformated_criteria_name

        # if the original name is in the well header and no changes were made in the previous process
        # this shows that this is the first time and the original value should be removed
        if str(original_criteria_name).strip().lower() in well_header and max_idx == 1:
            del well_header[str(original_criteria_name.strip().lower())]

        return reformated_criteria_name
    return original_criteria_name


def get_capex_absolute_date(reformated_criteria_name, sign, value):
    if value != 0:
        this_absolute_date = f'@M.{reformated_criteria_name}{sign}{value}'
    else:
        this_absolute_date = f'@M.{reformated_criteria_name}'

    return this_absolute_date


def process_capex_from_external_source(one_capex,
                                       capex_ret,
                                       this_criteria,
                                       date_dict,
                                       ref_name_dict,
                                       well_header,
                                       schedule_dates=None,
                                       lookup=False):
    this_offset_date, use_text = get_capex_offset_date_from_external_source(one_capex, this_criteria, well_header,
                                                                            schedule_dates)
    formated_criteria_name = one_capex[this_criteria].replace("offset_to_", "").upper().replace("_", " ")
    if this_offset_date is None or not isinstance(this_offset_date, datetime.date):
        if this_offset_date is None:
            error_row = [TEXT, f'NO {formated_criteria_name} IN {use_text}, USING ASOF DATE']
        else:
            error_row = [TEXT, f'{formated_criteria_name} NOT A VALID DATE, USING ASOF DATE']
        capex_ret.append(error_row)
        this_offset_date = pd.to_datetime(date_dict.get('offset_to_as_of_date'))
        this_offset_date = pd.to_datetime(this_offset_date)
        this_offset_date = datetime.date(this_offset_date.year, this_offset_date.month, this_offset_date.day)

    reformated_criteria_name = formated_criteria_name.replace(' ', '_')
    reformated_criteria_name = process_naming_of_reference(well_header, reformated_criteria_name, ref_name_dict)
    well_header[str(reformated_criteria_name).lower()] = this_offset_date.strftime('%m/%Y')

    # assign default return values
    this_absolute_date = ''
    point_unit = 'AD'

    criteria_value = one_capex.get('criteria_value', '')
    if lookup and criteria_value.startswith('?'):
        use, value, category = criteria_value.split('~')
        sign = '-' if float(value) < 0 else '+'
        value = int(abs(float(value)))
        this_absolute_date = get_capex_absolute_date(reformated_criteria_name, sign, value)
        this_absolute_date = f'{use}~{this_absolute_date}~{category}'
        if one_capex.get('lookup_criteria', False):
            point_unit = update_capex_point_unit_for_lookup_criteria(point_unit)
    else:
        criteria_value = one_capex[one_capex[this_criteria]]
        criteria_value = float(criteria_value)
        sign = '-' if criteria_value < 0 else '+'
        criteria_value = int(abs(criteria_value))
        this_absolute_date = get_capex_absolute_date(reformated_criteria_name, sign, criteria_value)

    return well_header, this_absolute_date, point_unit


def process_capex_keyword(description, category):
    keyword = 'DRILL' if 'drill' in str(description).lower() else 'CAPITAL'
    if category in ABAN_SALV_DICT:
        keyword = ABAN_SALV_DICT.get(category)[0]
    return keyword


def get_capex_keyword(capex_row, lookup):
    description = capex_row.get('description', '')
    category = capex_row['category']

    if lookup and description.startswith('?'):
        use, keyword, category = description.split('~')
        keyword = process_capex_keyword(description, category)
        keyword = f'{use}~{keyword}~{category}'
    else:
        keyword = process_capex_keyword(description, category)

    return keyword


def process_capex_calculation(one_capex, lookup):
    n_g = ''
    calculation = one_capex['calculation']
    if lookup and calculation.startswith('?'):
        use, calc, category = calculation.split('~')
        calc_mode = 'G' if calc == 'gross' else 'N'
        n_g = f'{use}~{calc_mode}~{category}'
    else:
        n_g = 'G' if calculation == 'gross' else 'N'
    return n_g


def add_row_data_for_headers_schedule_criteria_option(document, lookups, line_dict):
    criteria_option = get_elt_value(line_dict, 'criteria_option')
    criteria_from_option = get_elt_value(line_dict, 'criteria_from_option')
    criteria_value = line_dict.get('criteria_value')
    add_criteria_from_option = '-criteria_from_option' not in str(criteria_from_option)
    add_criteria_value = '-criteria_value' not in str(criteria_value)

    if add_criteria_from_option:
        document['rows'][-1][criteria_option] = criteria_from_option
        if add_criteria_value:
            document['rows'][-1][criteria_from_option] = criteria_value
        else:
            document['rows'][-1][criteria_from_option] = ''
            lookups['rows'][-1].add(criteria_value)
    else:
        document['rows'][-1][criteria_option] = ''
        lookups['rows'][-1].add(criteria_from_option)

        document['rows'][-1]['criteria_from_option'] = ''
        lookups['rows'][-1].add(criteria_value)
    add_row_data_for_lookup_values(document, lookups, line_dict)


def add_row_data_for_date_criteria_option(document, lookups, line_dict):
    criteria_option = get_elt_value(line_dict, 'criteria_option')
    criteria_value = line_dict.get('criteria_value')
    add_criteria_value = '-criteria_value' not in str(criteria_value)

    if add_criteria_value:
        start_date = (pd.to_datetime(criteria_value)).strftime('%Y-%m-%d')
        end_date = 'Econ Limit'
        document['rows'][-1][criteria_option] = {'start_date': start_date, 'end_date': end_date}
    else:
        document['rows'][-1][criteria_option] = ''
        lookups['rows'][-1].add(criteria_value)
    add_row_data_for_lookup_values(document, lookups, line_dict)


def add_row_data_for_offset_criteria_option(document, lookups, line_dict):
    criteria_option = get_elt_value(line_dict, 'criteria_option')
    criteria_value = line_dict.get('criteria_value')
    add_criteria_value = '-criteria_value' not in str(criteria_value)

    if add_criteria_value:
        document['rows'][-1][criteria_option] = criteria_value
    else:
        document['rows'][-1][criteria_option] = ''
        lookups['rows'][-1].add(criteria_value)
    add_row_data_for_lookup_values(document, lookups, line_dict)


def add_row_data_for_rate_criteria_option(document, lookups, line_dict):
    criteria_option = get_elt_value(line_dict, 'criteria_option')
    criteria_value = line_dict.get('criteria_value')
    add_criteria_value = '-criteria_value' not in str(criteria_value)
    if add_criteria_value:
        document['rows'][-1][criteria_option] = criteria_value
    else:
        document['rows'][-1][criteria_option] = ''
        lookups['rows'][-1].add(criteria_value)
    add_row_data_for_lookup_values(document, lookups, line_dict)


def add_row_data_for_capex_criteria_option(document, lookups, line_dict):
    criteria_option = get_elt_value(line_dict, 'criteria_option')
    lookup_criteria_option = True if '-criteria_option' in criteria_option else False

    if lookup_criteria_option:
        document['rows'][-1]['lookup_criteria'] = True
        document['rows'][-1]['criteria_option'] = ''
        document['rows'][-1]['criteria_from_option'] = ''
        document['rows'][-1]['criteria_value'] = ''
        lookups['rows'][-1].add(criteria_option)
        lookups['rows'][-1].add(line_dict.get('criteria_from_option'))
        lookups['rows'][-1].add(line_dict.get('criteria_value'))
        add_row_data_for_lookup_values(document, lookups, line_dict)
    else:
        document['rows'][-1]['lookup_criteria'] = False
        if criteria_option != 'entire_well_life':
            if criteria_option == 'date':
                add_row_data_for_date_criteria_option(document, lookups, line_dict)
            elif 'offset_' in str(criteria_option):
                add_row_data_for_offset_criteria_option(document, lookups, line_dict)
            elif 'rate' in str(criteria_option):
                add_row_data_for_rate_criteria_option(document, lookups, line_dict)
            elif criteria_option == 'fromHeaders' or criteria_option == 'fromSchedule':
                add_row_data_for_headers_schedule_criteria_option(document, lookups, line_dict)
        else:
            document['rows'][-1]['entire_well_life'] = 'Flat'
            add_row_data_for_lookup_values(document, lookups, line_dict)


def add_row_data_for_lookup_values(document, lookups, line_dict):
    tangible = line_dict.get('tangible')
    intangible = line_dict.get('intangible')
    calc = line_dict.get('calculation')
    description = line_dict.get('description')
    add_tangible = '-tangible' not in str(tangible)
    add_intangible = '-intangible' not in str(intangible)
    add_calc = '-calculation' not in str(calc)
    add_description = '-description' not in str(description)

    if add_tangible:
        document['rows'][-1]['tangible'] = float(tangible)
    else:
        document['rows'][-1]['tangible'] = 0
        lookups['rows'][-1].add(tangible)
    if add_intangible:
        document['rows'][-1]['intangible'] = float(intangible)
    else:
        document['rows'][-1]['intangible'] = 0
        lookups['rows'][-1].add(intangible)
    if add_calc:
        document['rows'][-1]['calculation'] = str(calc)
    else:
        document['rows'][-1]['calculation'] = ''
        lookups['rows'][-1].add(calc)
    if add_description:
        document['rows'][-1]['description'] = str(description)
    else:
        document['rows'][-1]['description'] = ''
        lookups['rows'][-1].add(description)


def add_line_to_default_capex_doc(default_capex_doc, capex_lookup_reference_dict, line_dict):
    keys_to_ignore = [
        'description', 'tangible', 'intangible', 'calculation', 'criteria_from_option', 'criteria_value',
        'capex_expense', 'after_econ_limit', 'escalation_start_option', 'escalation_start_value'
    ]

    document = default_capex_doc['other_capex']
    document['rows'].append({})
    lookups = capex_lookup_reference_dict['other_capex']
    lookups['rows'].append(set())

    for key, value in line_dict.items():
        if key == 'criteria_option':
            add_row_data_for_capex_criteria_option(document, lookups, line_dict)
        elif key in keys_to_ignore:
            continue
        else:
            if value is None:
                continue
            if '-' in str(value):
                lookups['rows'][-1].add(value)
                continue
            else:
                document['rows'][-1][key] = get_elt_value(line_dict, key)
                continue


def update_lookup_values_combo_in_capex_document(document, lookup_code, lookup_values_dict):
    if lookup_code in lookup_values_dict:
        value = lookup_values_dict.get(lookup_code)
        value = re.sub(r'\s', '', str(value)) if type(value) == list else value
        key = str(lookup_code).split('-')[-1]
        if key == 'tangible':
            value = 0 if value is None else value
            document[key] = f'?~{value}~{key}'
        elif key == 'intangible':
            value = 0 if value is None else value
            document[key] = f'?~{value}~{key}'
        elif key == 'criteria_value':
            value = 0 if value is None else value
            document[key] = f'?~{value}~{key}'
        elif key == 'calculation':
            value = 'gross' if value is None else value
            document[key] = f'?~{value}~{key}'
        elif key == 'description':
            value = 'CAPITAL' if value is None else value
            document[key] = f'?~{value}~{key}'
        else:
            document[key] = value
    return document


def add_rules_to_capex_document(default_capex_doc, capex_lookup_ref_dict, table, behavior):
    rules = table.get('rules', [])
    lookup_combined_dict = {}
    to_sort_key = [key for key, value in behavior.items() if value == 'interpolation']
    final_tuples = []
    if rules:
        for rule in rules:
            use_default_doc = copy.deepcopy(default_capex_doc)
            conditions = rule.get('conditions')

            children_keys = {}
            max_children = 0
            # pull children values into dict for cooresponding key to process
            for condition in conditions:
                children_keys[condition.get('key')] = condition.get('childrenValues', [])
                child_length = len(children_keys[condition.get('key')])
                max_children = child_length if child_length > max_children else max_children

            lookup_values = rule.get('values')
            lookup_values_dict = {}

            # CC has blanks for children values
            if max_children > 0:
                # update blank values for condition children with parent value
                fill_in_rule_children_headers(max_children, children_keys, conditions)

            # update blank values for value children with parent value
            fill_in_value_children_headers(max_children, lookup_values, lookup_values_dict)

            # If interpolation column found, sort rows by interpolation column
            if len(to_sort_key) > 0:
                sort_interpolate_elt(conditions, to_sort_key, children_keys, lookup_values_dict)

            # create list of header tuples in the same order as behavior
            parent_key = {}
            for condition in conditions:
                parent_key[condition.get('key')] = condition.get('value')
            final_key = tuple(parent_key.get(key) for key in behavior)
            final_tuples = [final_key]
            for i in range(max_children):
                final_tuples += [tuple(children_keys[key][i] for key in behavior)]

            rows = capex_lookup_ref_dict['other_capex']['rows']
            for i, row in enumerate(rows):
                for lookup_code in row:
                    use_default_doc['other_capex']['rows'][i] = update_lookup_values_combo_in_capex_document(
                        use_default_doc['other_capex']['rows'][i], lookup_code, lookup_values_dict)

            lookup_combined_dict[final_key] = use_default_doc, final_tuples
    else:
        lookup_combined_dict[None] = default_capex_doc, final_tuples

    return lookup_combined_dict


def update_lookup_combined_dict_for_criteria_option(lookup_combined_dict):
    for document in lookup_combined_dict.values():
        other_capex_rows = document[0]['other_capex']['rows']
        for one_capex in other_capex_rows:
            if 'criteria_option' in one_capex.keys():
                this_criteria = one_capex.get('criteria_option')
                if one_capex.get('criteria_from_option') == '':
                    one_capex[this_criteria] = ''
                else:
                    from_this_criteria = one_capex.get('criteria_from_option')
                    one_capex[this_criteria] = from_this_criteria
                    one_capex[from_this_criteria] = ''
            elif 'criteria_from_option' in one_capex.keys():
                key = [str(key) for key in list(one_capex.keys()) if str(key).startswith('from')][0]
                if one_capex[key] == '':
                    from_this_criteria = one_capex.get('criteria_from_option')
                    one_capex[key] = from_this_criteria
                    one_capex[from_this_criteria] = ''


def create_capex_document_from_lookup_docs(table, behavior):
    capex_lookup_reference_dict = get_default('capex')
    default_capex_doc = get_default('capex')
    lines = table.get('lines', [])
    invalid = any(criteria not in ['regular', 'match', 'ratio', 'interpolation']
                  for criteria in table.get('configuration', {}).get('selectedHeadersMatchBehavior', {}).values())
    if invalid:
        return {}, False
    for line in lines:
        line_dict = {item.get('key'): (item.get('value', item.get('lookup'))) for item in line}
        add_line_to_default_capex_doc(default_capex_doc, capex_lookup_reference_dict, line_dict)

    lookup_combined_dict = add_rules_to_capex_document(default_capex_doc, capex_lookup_reference_dict, table, behavior)

    update_lookup_combined_dict_for_criteria_option(lookup_combined_dict)

    return lookup_combined_dict, True


def create_aries_rows_for_all_capex_lookup_cases(capex_lookup_docs, date_dict, well_headers, schedule, ref_name_dict,
                                                 cut_off_and_major, cutoff_changed):
    (case_lookup_dict, case_category_dict, case_value_dict) = {}, {}, {}
    for case, (document, headers) in capex_lookup_docs.items():
        original_rows, cutoff_changed, _ = capex_conv(document,
                                                      date_dict,
                                                      well_headers,
                                                      schedule,
                                                      ref_name_dict,
                                                      lookup=True,
                                                      cut_off_and_major=cut_off_and_major,
                                                      cutoff_changed=cutoff_changed)
        if len(original_rows) == 0:
            continue

        values = []
        categories = []
        lookup_rows = []
        list_in_values = False
        for row in original_rows:
            expression = row[1]
            keyword = row[0]
            # evaluate keyword row
            if keyword.startswith('?'):
                use, value, category = keyword.split('~')
                values.append(value)
                categories.append(category)
                keyword = use
            elif keyword in [TEXT, ERROR]:
                lookup_rows.append(row)
                continue
            row[0] = keyword
            # evaluate expression row
            expression_items = str(expression).split()
            for i, expression_item in enumerate(expression_items):
                if expression_item.startswith('?'):
                    use, value, category = expression_item.split('~')
                    list_in_values = value[0] == '[' and value[-1] == ']'
                    values.append(value)
                    categories.append(category)
                    expression_items[i] = use
            new_expression = ' '.join([str(item) for item in expression_items])
            row[1] = new_expression

            lookup_row = copy.deepcopy(row)
            #if keyword not in [TEXT, ERROR]:
            lookup_rows.append(lookup_row)
    # transpose values if [] found in value
        if list_in_values:
            transformed_values = np.transpose([re.sub(r'[\[,\]]+', ' ', val).strip().split()
                                               for val in values]).tolist()
            for idx, header in enumerate(headers):
                case_value_dict[header] = transformed_values[idx]
                case_category_dict[header] = copy.deepcopy(categories)
                case_lookup_dict[header] = lookup_rows
        else:
            case_value_dict[case] = values
            case_category_dict[case] = categories
            case_lookup_dict[case] = lookup_rows

    return (case_lookup_dict, case_category_dict, case_value_dict), cutoff_changed


def process_lookup_table_from_capex_doc(
    context,
    capex_ret,
    capex_econ,
    assump_key,
    date_dict,
    well_headers,
    schedule,
    ref_name_dict,
    mapping,
    lookup_table_dict,
    sidefile_doc,
    lookup_name_alias_dict,
    cut_off_and_major,
    cutoff_changed,
):
    # initiate list for all non overlay capex keywords that are used
    all_keywords_in_initial_aries_rows = set()
    # add keywords created from the non-lookup capex keywords
    all_keywords_in_initial_aries_rows = update_keyword_set_for_lookup(capex_ret, all_keywords_in_initial_aries_rows)
    # get the embedded lookup tables assigned to this capex document
    embedded_lookup_tables = get_embedded_lookup_table(context, capex_econ)

    # loop through each embedded lookup table
    for table in embedded_lookup_tables:
        # get the lookup name, get the headers used to build the table, get the correspending macro references
        name, configuration, behavior, macro_expression = get_lookup_table_properties(table, well_headers, mapping)

        # get the CC Capex document for each build case for current embedded lookup table
        capex_lookup_docs, valid = create_capex_document_from_lookup_docs(table, behavior)

        if not valid:
            capex_ret += [[TEXT, 'EXPORT DOES NOT CURRENTLY HANDLE CHOSEN LOOKUP CRITERIA']]
            continue

        if len(capex_lookup_docs) == 1 and list(capex_lookup_docs.keys())[0] is None:
            document = capex_lookup_docs[None]
            original_rows, cutoff_changed, _ = capex_conv(document[0],
                                                          date_dict,
                                                          well_headers,
                                                          schedule,
                                                          ref_name_dict,
                                                          lookup=True,
                                                          cut_off_and_major=cut_off_and_major,
                                                          cutoff_changed=cutoff_changed)
            sidefile_name, _ = add_lookup_as_sidefile(name, original_rows, [], sidefile_doc, assumption_code='INV')

            capex_ret += [['SIDEFILE', sidefile_name]]
            continue

        # get the appropriate lookup name to be used
        clean_lookup_name = get_appropriate_lookup_name_for_case(name, assump_key, lookup_name_alias_dict)

        # get the associated ARIES rows for each case
        all_cases, cutoff_changed = create_aries_rows_for_all_capex_lookup_cases(capex_lookup_docs, date_dict,
                                                                                 well_headers, schedule, ref_name_dict,
                                                                                 cut_off_and_major, cutoff_changed)

        if all_cases is None:
            continue

        # associated rows are split into:
        # lookup rows: containing values to be used for non-sidefile lookup rows
        # list rows: containing values with list methods rows associated with case
        # value and type per case

        (case_lookup_dict, case_category_dict, case_value_dict) = all_cases

        # initiate lookup rows
        final_lookup_rows = []
        idx = 0

        # add the non sidefile rows to the lookup rows
        final_lookup_rows, idx, errors = add_non_sidefile_lookup_rows(final_lookup_rows, clean_lookup_name,
                                                                      case_lookup_dict,
                                                                      all_keywords_in_initial_aries_rows, idx)

        # add the category and line type for the lookup rows
        final_lookup_rows = add_category_and_line_type_for_non_interacting_lookup(final_lookup_rows, clean_lookup_name,
                                                                                  case_category_dict, case_value_dict,
                                                                                  configuration, behavior)

        # add lookup rows to lookup table dict if it did not already exist
        use_lookup_name = update_lookup_table_dict_if_necessary(clean_lookup_name, final_lookup_rows, lookup_table_dict)

        # add in errors to capex_return output
        capex_ret += errors
        # add LOOKUP line ARIES capex rows
        capex_ret += [['LOOKUP', f'{use_lookup_name} {macro_expression}']]

    return capex_ret, cutoff_changed


def add_abandonment_value_line(capex_line: dict, capex_ret: list):
    """Extract abandonment values from capex line. Format into aries capex syntax and add to capex_ret list

    Args:
        capex_line (dict): dictionary of capex line data to be extracted
        capex_ret (list): list of capex rows to be returned
    """
    tang_amt = capex_line['tangible']
    intang_amt = capex_line['intangible']
    tangible = False
    if capex_line.get('calculation', 'gross') == 'gross':
        calculation_type = 'G'
    else:
        calculation_type = 'N'
    if tang_amt != 0:
        amount = tang_amt
        tangible = True
    elif intang_amt != 0:
        amount = intang_amt
    else:
        amount = 0
    set_keyword = ABAN_SALV_DICT.get(capex_line['category'])[0]
    if set_keyword == 'SALV':
        amount *= -1
    # Example output: [ 'ABDN', '0 ?~[50,250,500]~intangible TO LIFE PC 0']
    if tangible:
        abandonment_line = [set_keyword, list_to_expression([amount, 0, calculation_type, 'TO', 'LIFE', 'PC 0'])]
    else:
        abandonment_line = [set_keyword, list_to_expression([0, amount, calculation_type, 'TO', 'LIFE', 'PC 0'])]

    capex_ret.append(abandonment_line)


def capex_conv(capex_econ,
               date_dict,
               well_header,
               schedule,
               ref_name_dict,
               lookup=False,
               cut_off_and_major=None,
               cutoff_changed=False):
    other_capex_rows = copy.deepcopy(capex_econ['other_capex']['rows'])

    other_capex_rows = process_capex_cost_model(other_capex_rows, capex_econ, well_header, schedule)

    #
    criteria_list = [
        'date', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_econ_limit', 'fromSchedule', 'fromHeaders', 'oil_rate', 'gas_rate', 'water_rate', 'total_fluid_rate'
    ]
    capex_ret = []

    schedule_dates = schedule_idx_to_dates(schedule)
    cut_off_and_major_list = []
    for one_capex in other_capex_rows:

        if (one_capex['category'] in ABAN_SALV_DICT and 'offset_to_econ_limit' in one_capex):
            if lookup:
                try:
                    # offset_to_econ_limit not 0 indicates abandonment date needs to be updated
                    # and line needs to be written to expense instead of capex
                    if float(one_capex['offset_to_econ_limit']) != 0:
                        # pull new abandonment offset and return if it has changed
                        cut_off_and_major_list, cutoff_changed = process_capex_abandonment_delay([one_capex],
                                                                                                 cut_off_and_major,
                                                                                                 cutoff_changed)
                        # currently disabled. Enable by deleting 'cutoff_changed = False'
                        # ToDo: create lookup table in Exepnse section for abandonment offset
                        cutoff_changed = False
                        capex_ret.append([TEXT, 'DELAYED ABANDONMENT NOT SUPPORTED IN ELT EXPORT.'])
                except ValueError:
                    # indicates line uses lookup for offset value, log error.'
                    # ToDo: create dates lookup table by offset value in section 2
                    capex_ret.append([TEXT, 'EXPORT DOES NOT HANDLE LOOKUP OFFSET FOR ABAN'])
                    continue
                # generate abandonment line for capex section and append to capex_ret
                add_abandonment_value_line(one_capex, capex_ret)
                continue
            else:
                if one_capex.get('offset_to_econ_limit') != 0:
                    continue

        capex_keyword = get_capex_keyword(one_capex, lookup)
        tang_amt = one_capex['tangible']
        intang_amt = one_capex['intangible']
        n_g = process_capex_calculation(one_capex, lookup)
        #
        this_escalation = one_capex.get('escalation_model')
        if this_escalation != 'none':
            warnings.warn('Escalation model of CAPEX can not be brought to Aries for now.')
        this_depreciation = one_capex.get('depreciation_model')
        if this_depreciation != 'none':
            warnings.warn('Depreciation model of CPEX can not be brought to Aries for now.')
        this_deal_term = one_capex.get('deal_terms')
        if this_deal_term not in [1, '']:
            warnings.warn('Deal Term information of CPEX can not be brought to Aries.')
        #
        this_criteria = list(set(criteria_list) & set(one_capex.keys()))[0]
        #
        if this_criteria == 'date':
            inv_point, point_unit = process_capex_by_date(one_capex, date_dict, this_criteria, lookup)
        elif this_criteria == 'offset_to_econ_limit':
            inv_point, point_unit = 'TO', 'LIFE'
        elif 'rate' in this_criteria:
            inv_point, point_unit = process_capex_by_prod_rate(capex_ret, one_capex, this_criteria, lookup)
        elif this_criteria == 'fromHeaders' or this_criteria == 'fromSchedule':
            well_header, inv_point, point_unit = process_capex_from_external_source(one_capex,
                                                                                    capex_ret,
                                                                                    this_criteria,
                                                                                    date_dict,
                                                                                    ref_name_dict,
                                                                                    well_header,
                                                                                    schedule_dates=schedule_dates,
                                                                                    lookup=lookup)
        else:
            well_header, inv_point, point_unit = process_capex_by_offset(one_capex, date_dict, this_criteria,
                                                                         well_header, lookup)

        try:
            tang_amt = format_digits(tang_amt)
        except (ValueError, TypeError):
            tang_amt = tang_amt if lookup else 'X'
        try:
            intang_amt = format_digits(intang_amt)
        except (ValueError, TypeError):
            intang_amt = intang_amt if lookup else 'X'

        capex_ret.append(
            [capex_keyword,
             list_to_expression([tang_amt, intang_amt, n_g, inv_point, point_unit, 'PC 0'])])
    return capex_ret, cutoff_changed, cut_off_and_major_list


######## risking conversion (section 9 in Aries)
PHASE_TO_STREAM_NUMBER = {
    'oil': '370',
    'gas': '371',
    'ngl': '374',
    'drip_condensate': '372',
    'water': '376',
}


def risking_conv(risking_econ, date_dict, aries_start_log, user_worker_stream=None):
    risking_ret = []
    criteria_list = [
        'offset_to_fpd',
        'offset_to_as_of_date',
        'offset_to_discount_date',
        'offset_to_first_segment',
        'offset_to_end_history',
        'dates',
        'entire_well_life',
        'seasonal',
    ]
    risk_yield = risking_econ['risking_model'].get('risk_ngl_drip_cond_via_gas_risk', 'yes') == 'yes'
    use_gas = False
    count = 0
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate', 'water']:
        rows = risking_econ['risking_model'][phase]['rows']

        # a phase is considered unsed used if it has its default value as 100 and has only one time
        # it indicates a 100% multiplier for the entirety of the case and is ARIES default
        unused_condition = (rows[0]['multiplier'] == 100 and len(rows) == 1)

        # yield should be risked if a gas line has been defined (use_gas), the phase being considered is a yield
        # and the risk_yield with gas option is selected
        risk_condition_met = (use_gas and phase in ['ngl', 'drip_condensate'] and risk_yield)

        # if a phase is unsed and does not meet the risk condition, then phase should be ignored
        skip_rows = unused_condition and not risk_condition_met

        if skip_rows:
            continue

        row_keys = list(rows[0].keys())
        criteria = list(set(row_keys) & set(criteria_list))[0]
        if criteria == 'entire_well_life':
            incoming_start = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
        elif criteria == 'dates':
            incoming_start = cc_date_to_aries_date(rows[0]['dates']['start_date'], date_dict)
        elif criteria == 'seasonal':
            risking_ret += [['TEXT', 'EXPORT CANNOT MODEL SEASONAL RISKING']]
            continue
        else:
            incoming_start = cc_date_to_aries_date(date_dict[criteria], date_dict)

        risking_ret = aries_start_log.add_start_and_update_current_start(incoming_start,
                                                                         risking_ret,
                                                                         date_dict,
                                                                         criteria=criteria)
        use_gas = phase == 'gas' if not use_gas else use_gas

        for idx, row in enumerate(rows):

            if idx == 0:
                phase_key = get_phase_keyword(phase)
                keyword = f'MUL/{phase_key}'
            else:
                keyword = '"'

            # limit_value, limit_unit
            limit_value, limit_unit = get_limit_value_and_unit(criteria, row, rows, idx, date_dict)

            value = row['multiplier'] / 100

            if phase_key in ['CND', 'NGL'] and keyword != '"' and use_gas and risk_yield:
                if count < 1:
                    risking_ret += [[TEXT, 'RISK_NGL_DRIP_COND_VIA_GAS_RISK SELECTED']]
                    count += 1
                if len(risking_econ['risking_model']['gas']['rows']) > 1:
                    if [TEXT, 'ONLY FIRST GAS SEGMENT USED'] not in risking_ret:
                        risking_ret += [[TEXT, 'ONLY FIRST GAS SEGMENT USED']]
                gas_value = risking_econ['risking_model']['gas']['rows'][0]['multiplier'] / 100
                value = float(value) * float(gas_value)

            risking_ret += [[
                keyword,
                list_to_expression([format_digits(value), 'X', 'FRAC', limit_value, limit_unit, 'PC 0'])
            ]]

    return risking_ret


######## general functions for price, tax and expense
def criteria_process(unit_econ, criteria_list, tax=False):
    rows = unit_econ['rows']
    key_list = rows[0].keys()
    criteria_key = list(set(criteria_list) & set(key_list))[0]
    unit_key_list = [unit for unit in key_list if unit != criteria_key and unit not in ['cap', 'escalation_model']]
    if len(unit_key_list) == 1 and not tax:
        unit_key = unit_key_list[0]
        return criteria_key, unit_key
    return criteria_key, unit_key_list


def format_initial_price(row, unit_key, mult):
    if type(row[unit_key]) in [int, float]:
        initial_price = format_digits(row[unit_key] * mult)
    elif '@M.' in row[unit_key]:
        # special case for handling @M.Shrink
        if mult == 1:
            initial_price = row[unit_key]
        else:
            initial_price = row[unit_key] + '*' + str(mult)
    elif str(row[unit_key]).startswith('?'):
        initial_price = row[unit_key]
    else:
        initial_price = 0
    return initial_price


def rows_to_formula_method(ret_list, rows, aries_start_log, incoming_start, criteria_key, unit_key, unit, mult, keyword,
                           cap, date_dict, ngl_as_pct_oil, differential_overlay, expense_category, non_monotonic,
                           not_gross_well_head):
    use_macro_reference = criteria_key in OFFSET_MACRO_DICT
    ret_list = aries_start_log.add_start_and_update_current_start(incoming_start,
                                                                  ret_list,
                                                                  date_dict,
                                                                  criteria=criteria_key,
                                                                  fpd=use_macro_reference)

    # check for rate based rows
    # for rate based rows we loop from last to first
    differential_perm_keyword = None
    rows = get_loop_rows(rows, criteria_key)
    for idx, row in enumerate(rows):

        initial_price = format_initial_price(row, unit_key, mult)

        # limit_value, limit_unit
        limit_value, limit_unit = get_limit_value_and_unit(criteria_key,
                                                           row,
                                                           rows,
                                                           idx,
                                                           date_dict,
                                                           use_incremental=aries_start_log.use_incremental)

        if idx > 0:
            keyword = '"'
        ret_list = check_for_water_rate_cut_off(ret_list, limit_unit, keyword, criteria_key)

        ret_list = check_for_monotonic_and_gross_well_head(ret_list, keyword, criteria_key, non_monotonic,
                                                           not_gross_well_head)

        if cap == 'flat_zero':
            if expense_category is not None and keyword != '"':
                # add explanatory text
                classification = 'FIXED' if 'FIXED' in expense_category else 'VARIABLE'
                ret_list += [[TEXT, f'REPRESENTS {expense_category.upper()} EXPENSES ({classification})']]
            ret_list = ret_list + [[
                keyword, list_to_expression([initial_price, 'X', unit, limit_value, limit_unit, 'FLAT 0'])
            ]]
        elif keyword in UNHANDLEABLE_KEY_NAMES_DICT:
            unhandleable_key_name = UNHANDLEABLE_KEY_NAMES_DICT.get(keyword)
            input_text = f'NO ARIES ANALOG FOR {unhandleable_key_name}'
            if [ERROR, input_text] not in ret_list:
                ret_list += [[ERROR, input_text]]
            break
        elif cap == 'lin_time':
            ret_list = ret_list + [[
                keyword, list_to_expression([initial_price, 'X', unit, limit_value, limit_unit, 'LIN TIME'])
            ]]
        elif ngl_as_pct_oil:
            ret_list = process_ngl_as_pct_oil_to_data_list(ret_list, keyword, initial_price, limit_value, limit_unit)
        elif differential_overlay:
            ret_list, differential_perm_keyword = process_percentage_differential_to_data_list(
                ret_list, differential_perm_keyword, keyword, initial_price, limit_value, limit_unit)
        else:
            if cap == '' or cap == 'X':
                max_price = 'X'
            else:
                max_price = format_digits(cap * mult)
            if expense_category is not None and keyword != '"':
                classification = 'FIXED' if 'FIXED' in expense_category else 'VARIABLE'
                ret_list += [[TEXT, f'REPRESENTS {expense_category.upper()} EXPENSES ({classification})']]
            ret_list = ret_list + [[
                keyword, list_to_expression([initial_price, max_price, unit, limit_value, limit_unit, 'PC 0'])
            ]]

    return ret_list


def process_ngl_as_pct_oil_to_data_list(ret_list, keyword, initial_price, limit_value, limit_unit):
    warning_text = 'CONFIRM THAT STREAM 199 REPRESENTS NGL PRICE IN YOUR ARIES SETTINGS'
    text_warning = keyword != '"'
    use_keyword = 'S/199' if keyword != '"' else keyword
    if text_warning:
        if [TEXT, warning_text] not in ret_list:
            ret_list += [[TEXT, warning_text]]
    ret_list += [[
        use_keyword,
        list_to_expression(
            [format_digits(float(initial_price) / 100), 'X', 'FRAC', limit_value, limit_unit, 'MUL', '195'])
    ]]

    return ret_list


def process_percentage_differential_to_data_list(ret_list, differential_perm_keyword, keyword, initial_price,
                                                 limit_value, limit_unit):
    text_warning = False
    if keyword != '"':
        differential_keyword = DIFFERENTIAL_OVERLAY_DICT.get(keyword)
        differential_perm_keyword = differential_keyword
        if differential_keyword == 'S/199':
            warning_text = 'CONFIRM THAT STREAM 199 REPRESENTS NGL PRICE IN YOUR ARIES SETTINGS'
            text_warning = True
    else:
        differential_keyword = '"'
    if differential_keyword is not None:
        if text_warning:
            if [TEXT, warning_text] not in ret_list:
                ret_list = ret_list + [[TEXT, warning_text]]
        if differential_keyword != '"':
            ret_list = ret_list + [[TEXT, 'PRICE STREAM MULTIPLIER USED FOR % DIFF.']]
        ret_list = ret_list + [[
            differential_keyword,
            list_to_expression([
                format_digits(float(initial_price) / 100), 'X', 'FRAC', limit_value, limit_unit, 'MUL',
                differential_perm_keyword
            ])
        ]]
    return ret_list, differential_perm_keyword


def get_loop_rows(rows, criteria):
    loop_rows = copy.deepcopy(rows)
    if criteria in RATE_BASED_ROW_KEYS:
        loop_rows = loop_rows[::-1]
    return loop_rows


def check_for_water_rate_cut_off(ret_list, limit_unit, keyword, criteria):
    if criteria in ['water_rate', 'total_fluid_rate'] and keyword != '"':
        ret_list += [[ERROR, 'LOOK HERE!']]
        key_name = str(criteria).replace('_', ' ').upper()
        ret_list += [[TEXT, f'{key_name} CUT OFF NOT HANDLED IN ARIES ({keyword.upper()})']]
    if limit_unit in ['MPD', 'BPD'] and keyword != '"':
        ret_list += [[TEXT, f'RATE CUT OFF WILL NOT WORK FOR PHASE SCH. WITH RATIO ({keyword.upper()})']]
    return ret_list


def check_for_monotonic_and_gross_well_head(ret_list, keyword, criteria, non_monotonic, not_gross_well_head):
    append_list = []
    if criteria in RATE_BASED_ROW_KEYS and keyword != '"':
        if non_monotonic:
            append_list.append([TEXT, f'NON MONOTONIC SELECTED ({keyword.upper()})'])
            append_list.append([TEXT, f'MAY NOT BE ACCURATE IF RATE SURGES BACK UP ({keyword.upper()})'])
        if not_gross_well_head:
            append_list = []
            append_list.append([ERROR, 'LOOK HERE!'])
            append_list.append([TEXT, f'CAN ONLY HANDLE GROSS WELL HEAD VOLUME CUT-OFF FOR EXPORT ({keyword.upper()})'])
    ret_list += append_list
    return ret_list


def get_limit_value_and_unit(criteria_key, row, rows, idx, date_dict, use_incremental=False):
    if criteria_key == 'entire_well_life':
        limit_value = 'TO'
        limit_unit = 'LIFE'
    elif criteria_key == 'dates':
        if row['dates']['end_date'] == 'Econ Limit' or idx == len(rows) - 1:
            limit_value = 'TO'
            limit_unit = 'LIFE'
        else:
            # for dates, cc's cut off is included, add 1 month to get aries cut off
            cc_cut_off_date = row['dates']['end_date']
            aries_cut_off_date = np.datetime64(cc_cut_off_date, 'M') + 1
            limit_value = cc_date_to_aries_date(aries_cut_off_date, date_dict)
            limit_unit = 'AD'
    # rate cut off
    elif criteria_key in RATE_BASED_ROW_KEYS:
        if criteria_key == 'oil_rate':
            limit_unit = 'BPD'
        elif criteria_key == 'gas_rate':
            limit_unit = 'MPD'
        else:
            limit_unit = 'BPD'
        limit_value = row[criteria_key]['start']
    else:
        if idx == len(rows) - 1:
            limit_value = 'TO'
            limit_unit = 'LIFE'
        else:
            if use_incremental:
                limit_value = row[criteria_key]['end']
            else:
                # for offset, cc's cut off is included, add 1 month to get aries cut off
                this_offset_date = to_date(date_dict[criteria_key])
                this_absolute_date = this_offset_date + relativedelta(months=row[criteria_key]['end'])
                limit_value = cc_date_to_aries_date(this_absolute_date, date_dict)
            limit_unit = 'MO' if use_incremental else 'AD'
    return limit_value, limit_unit


def append_to_list_method_rows(list_method_rows, incoming_start, initial_price, number_of_month, end_of_lm):
    cur_row = list_method_rows[-1]

    if len(cur_row) > 0 and cur_row[-1] == '#':
        list_method_rows.append([])
        cur_row = list_method_rows[-1]

    if len(cur_row) == 0:
        if len(list_method_rows) == 1:
            cur_row.append(incoming_start)
        else:
            cur_row.append('X')
    if number_of_month > 1:
        cur_row.append(f'{number_of_month}*{initial_price}')
    else:
        cur_row.append(str(initial_price))

    # check if current_row has reached the character limit (+ 2 signifies space for ' #' in case that limit is reached)
    char_limit_reached = True if (len(list_to_expression(cur_row)) + 2) >= MAX_LIST_MODE_CHAR_LEN else False

    # if the limit is reached remove the just appended item (as it broke the character limit)
    # add it to a new row , and end the current row with a hash
    # if this is the last item add a hash to the newly created row to close the row
    if char_limit_reached:
        new_row = ['X', cur_row.pop()]
        cur_row.append('#')
        if end_of_lm:
            new_row.append('#')
        list_method_rows.append(new_row)

    elif len(cur_row) == 6 or end_of_lm:
        cur_row.append('#')

    return list_method_rows


def process_incoming_start(incoming_start, fpd, criteria_key, date_dict):
    if any(
            pd.to_datetime(incoming_start, errors='coerce') == pd.to_datetime(date_dict[key], errors='coerce')
            for key in date_dict):
        date_key = next(
            key for key in date_dict
            if pd.to_datetime(incoming_start, errors='coerce') == pd.to_datetime(date_dict[key], errors='coerce')
            for key in date_dict)
        if date_key == criteria_key and date_key in OFFSET_MACRO_DICT:
            return f'@M.{OFFSET_MACRO_DICT.get(date_key)}'
        return incoming_start
    elif fpd and pd.to_datetime(incoming_start, errors='coerce') == pd.to_datetime(date_dict['offset_to_fpd'],
                                                                                   errors='coerce'):
        return '@M.FIRST_PROD_DATE'
    else:
        return incoming_start


def rows_to_list_method(ret_list, rows, incoming_start, criteria_key, unit_key, unit, mult, keyword, cap, date_dict,
                        overlay, expense_category, fpd, user_work_stream):
    modifier = None
    list_method_rows = [[]]
    incoming_start = process_incoming_start(incoming_start, fpd, criteria_key, date_dict)
    for idx, row in enumerate(rows):
        # split function by numbers and non-numbers to process @M.SHRINK*value
        split_term = str(row[unit_key]).split('*')
        if len(split_term) > 1:
            # assumes number value is at end of unit_key values
            initial_price = format_digits(split_term[-1])
            # modifier to be added to stream instead of on every list value
            modifier = str(list_to_expression(split_term[:-1])) + '*'
        else:
            if type(row[unit_key]) in [int, float]:
                initial_price = round(row[unit_key] * mult, ROUND_DIGIT)
            elif str(row[unit_key]).startswith('?'):
                initial_price = row[unit_key]
            else:
                initial_price = 0

        if idx == len(rows) - 1:
            # last row (to econ limit)
            limit_value = 'TO'
            limit_unit = 'LIFE'
            if cap == 'flat_zero':
                last_row = [
                    '"',
                    list_to_expression([initial_price, initial_price, unit, limit_value, limit_unit, 'FLAT 0'])
                ]
            elif cap == 'lin_time':
                last_syntax, unit = ('', 'FRAC') if overlay else ('LIN TIME', unit)
                last_row = [
                    '"',
                    list_to_expression([initial_price, initial_price, unit, limit_value, limit_unit, last_syntax])
                ]
            else:
                if cap == '' or cap == 'X':
                    max_price = 'X'
                else:
                    max_price = round(cap * mult, ROUND_DIGIT)

                last_row = ['"', list_to_expression([initial_price, max_price, unit, limit_value, limit_unit, 'PC 0'])]

            # add all rows to ret_list
            for idx, lm_row in enumerate(list_method_rows):
                if idx == 0:
                    section_keyword = keyword
                else:
                    section_keyword = '"'
                if overlay:
                    section_keyword = '"'
                ret_list.append([section_keyword, list_to_expression(lm_row)])

            ret_list.append(last_row)
            if overlay:
                work_stream = user_work_stream.get_overlay_work_stream(type="ngl_overlay")
                ret_list.insert(0, [f'S/{work_stream}', f'0 X FRAC {incoming_start} AD'])
                ret_list.insert(0, [TEXT, 'ARIES LIST METHOD USED FOR SCHEDULING NGL YIELD'])
                ret_list.append(['S/374', f'S/371 X FRAC TO LIFE MUL S/{work_stream}'])
                # modifier holds @M.SHRINK* if present in list
                if modifier is not None:
                    ret_list.append(['S/374', str(modifier) + '0.001 X FRAC TO LIFE MUL S/374'])
                else:
                    ret_list.append(['S/374', '0.001 X FRAC TO LIFE MUL S/374'])
            if expense_category is not None:
                classification = 'FIXED' if 'FIXED' in expense_category else 'VARIABLE'
                ret_list.insert(0, [TEXT, f'REPRESENTS {expense_category.upper()} EXPENSES ({classification})'])

        else:
            if criteria_key == 'dates':
                start_date = row['dates']['start_date']
                end_date = row['dates']['end_date']
                number_of_month = int(
                    round((pd.to_datetime(end_date) - pd.to_datetime(start_date)).days / DAYS_IN_MONTH))
                number_of_month = number_of_month if number_of_month != 0 else 1
            else:
                number_of_month = int(row[criteria_key]['period'])

        if idx == len(rows) - 2:
            end_of_lm = True
        else:
            end_of_lm = False

        append_to_list_method_rows(list_method_rows, incoming_start, initial_price, number_of_month, end_of_lm)

    return ret_list


def process_rows(ret_list,
                 rows,
                 criteria_key,
                 unit_key,
                 unit,
                 mult,
                 keyword,
                 cap,
                 date_dict,
                 aries_start_log,
                 user_work_stream,
                 expense_category=None,
                 fpd=False,
                 ngl_as_pct_oil=False,
                 differential_overlay=False,
                 overlay=False,
                 yield_=False,
                 non_monotonic=True,
                 not_gross_well_head=False):
    # skip rows if criteria is entire_well_life and value doesn't have a number
    if criteria_key == 'entire_well_life':
        flat_row = rows[0]
        flat_value = flat_row[unit_key]
        # considers case of '@M.SHRINK * value
        if not any(char.isdigit() for char in str(flat_value)):
            flat_value = 0
        if flat_value == 0:
            return ret_list

    # add start
    if criteria_key == 'entire_well_life':
        incoming_start = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
        if fpd:
            ret_list += [[TEXT, 'NO EXPENSE BEFORE FPD SELECTED IN CC']]
            if pd.to_datetime(date_dict['offset_to_fpd'], errors='coerce') > pd.to_datetime(incoming_start):
                incoming_start = cc_date_to_aries_date(date_dict['offset_to_fpd'], date_dict)
    elif criteria_key in RATE_BASED_ROW_KEYS:
        incoming_start = 'RATE'
    elif criteria_key == 'dates':
        incoming_start = cc_date_to_aries_date(rows[0]['dates']['start_date'], date_dict)
        if fpd:
            ret_list += [[TEXT, 'NO EXPENSE BEFORE FPD SELECTED IN CC']]
            if pd.to_datetime(date_dict['offset_to_fpd'], errors='coerce') > pd.to_datetime(incoming_start):
                incoming_start = cc_date_to_aries_date(date_dict['offset_to_fpd'], date_dict)
                rows = check_row_for_fpd(rows, rows[0]['dates']['start_date'], date_dict['offset_to_fpd'], criteria_key)
    else:
        incoming_start = cc_date_to_aries_date(date_dict[criteria_key], date_dict)
        if fpd and criteria_key == 'offset_to_as_of_date':
            ret_list += [[TEXT, 'NO EXPENSE BEFORE FPD SELECTED IN CC']]
            aries_start_log.add_expense_workstream_to_zero(keyword)
            if pd.to_datetime(date_dict['offset_to_fpd'], errors='coerce') > pd.to_datetime(incoming_start):
                incoming_start = cc_date_to_aries_date(date_dict['offset_to_fpd'], date_dict)
                rows = check_row_for_fpd(rows, date_dict['offset_to_as_of_date'], date_dict['offset_to_fpd'],
                                         criteria_key)

    # process rows
    row_len = len(rows)
    if row_len <= MAX_ROW_LEN or criteria_key in RATE_BASED_ROW_KEYS:
        if not overlay:
            ret_list = rows_to_formula_method(ret_list, rows, aries_start_log, incoming_start, criteria_key, unit_key,
                                              unit, mult, keyword, cap, date_dict, ngl_as_pct_oil, differential_overlay,
                                              expense_category, non_monotonic, not_gross_well_head)
    else:
        if overlay or not yield_:
            ret_list = rows_to_list_method(ret_list, rows, incoming_start, criteria_key, unit_key, unit, mult, keyword,
                                           cap, date_dict, overlay, expense_category, fpd, user_work_stream)

    return ret_list


def check_row_for_fpd(rows, ref_date, fpd_date, criteria_key):
    if len(rows) == 1:
        return rows
    del_index = 0
    # check for criteria (asof date offset or dates)
    if criteria_key == 'offset_to_as_of_date':
        # check only required if FIRST PRODUCTION date comes after ASOF date
        if pd.to_datetime(fpd_date) > pd.to_datetime(ref_date):
            # find monthly difference between first production date and asof date
            offset = round((pd.to_datetime(fpd_date) - pd.to_datetime(ref_date)).days / DAYS_IN_MONTH)
            for row in rows:
                # ignore last row
                if row[criteria_key]['end'] != 'Econ Limit':
                    # offset ends by difference between fpd and asof
                    # if the end of period is less than difference ignore those rows as the rows occur before FP
                    end = copy.deepcopy(row[criteria_key]['end'])
                    end -= offset
                    if end <= 0:
                        del_index += 1
    else:
        for row in rows:
            row_end_date = row['dates']['end_date']
            if row_end_date != 'Econ Limit':
                # if first production date is greater than end date ignore the row as the row occurs before FP
                if pd.to_datetime(fpd_date) >= pd.to_datetime(row_end_date):
                    del_index += 1
    return rows[del_index:]


######## pricing_differential conversion (section 5 in Aries)
PRI_DIFF_CRITERIAS = [
    'entire_well_life',
    'offset_to_as_of_date',
    'dates',
]


def pricing_conv(pri_econ, date_dict, aries_start_log, user_work_stream=None):
    price = pri_econ['price_model']
    pri_ret = []

    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        phase_keyword = get_phase_keyword(phase)

        this_price = price[phase]

        # cap
        this_cap = this_price['cap']

        # escalation
        this_escalation = this_price['escalation_model']
        if this_escalation != 'none':
            warnings.warn('Escalation of Price Model can not be brought to Aries.')

        # rows
        price_criteria_key, price_unit_key = criteria_process(this_price, PRI_DIFF_CRITERIAS)
        ngl_as_pct_oil = False
        if price_unit_key == 'pct_of_oil_price':
            # only take the first segment
            price_unit = 'FRAC'
            price_mult = 1
            ngl_as_pct_oil = True
        elif price_unit_key == 'price' or price_unit_key == 'dollar_per_bbl':
            price_unit = '$/B'
            price_mult = 1
        elif price_unit_key == 'dollar_per_mcf' or price_unit_key == 'dollar_per_mmbtu':
            # btu will be processed in section 2 (micellaneous)
            price_unit = '$/M'
            price_mult = 1
        elif price_unit_key == 'dollar_per_gal':
            price_unit = '$/B'
            price_mult = 42

        pri_ret = process_rows(pri_ret,
                               this_price['rows'],
                               price_criteria_key,
                               price_unit_key,
                               price_unit,
                               price_mult,
                               'PRI/' + phase_keyword,
                               this_cap,
                               date_dict,
                               aries_start_log,
                               user_work_stream,
                               ngl_as_pct_oil=ngl_as_pct_oil)

    return pri_ret


def differentials_conv(diff_econ, date_dict, aries_start_log, user_work_stream=None):
    all_diff = diff_econ['differentials']
    diff_ret = []

    for diff_key, diff in all_diff.items():
        for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
            overlay = False
            phase_keyword = get_phase_keyword(phase)

            this_diff = diff[phase]

            diff_criteria_key, diff_unit_key = criteria_process(this_diff, PRI_DIFF_CRITERIAS)

            if diff_unit_key == 'dollar_per_bbl':
                diff_unit = '$/B'
                diff_mult = 1
            elif diff_unit_key == 'dollar_per_mcf' or diff_unit_key == 'dollar_per_mmbtu':
                # btu will be processed in section 2 (micellaneous)
                diff_unit = '$/M'
                diff_mult = 1
            elif diff_unit_key == 'dollar_per_gal':
                diff_unit = '$/B'
                diff_mult = 42
            elif diff_unit_key == 'pct_of_base_price':
                if len(this_diff['rows']) > MAX_ROW_LEN:
                    this_diff['rows'] = [this_diff['rows'][0]]
                diff_unit = '%'
                diff_mult = 1
                overlay = True

            diff_ret = process_rows(diff_ret,
                                    this_diff['rows'],
                                    diff_criteria_key,
                                    diff_unit_key,
                                    diff_unit,
                                    diff_mult,
                                    'PAJ/' + phase_keyword,
                                    '',
                                    date_dict,
                                    aries_start_log,
                                    user_work_stream,
                                    differential_overlay=overlay)

    return diff_ret


######## production_taxes and expenses (section 6 in Aries)
#### production_taxes
def production_taxes_conv(prod_tax_econ, date_dict, aries_start_log, user_work_stream=None):
    prod_tax_ret = []

    ad_tax = prod_tax_econ['ad_valorem_tax']
    se_tax = prod_tax_econ['severance_tax']

    criteria_list = [
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'dates', 'entire_well_life'
    ]
    criteria_list = criteria_list + RATE_BASED_ROW_KEYS

    # ad_valorem tax, based on $/month or % of revenue
    ded_sev_tax = ad_tax['deduct_severance_tax']

    not_gross_well_head = ad_tax.get(RATE_TYPE, GROSS_WELL_HEAD) != GROSS_WELL_HEAD
    non_monotonic = ad_tax.get(ROWS_CALC_METHOD, NON_MONOTONIC) == NON_MONOTONIC

    if ded_sev_tax == 'no':
        warnings.warn("Aries must deduct Severance Tax when calculating Ad Valorem Tax.")
    ad_calculation = ad_tax['calculation']
    if ad_calculation == 'nri':
        warnings.warn("Aries calculate Ad Valorem Tax based on WI not NRI.")

    # rows
    ad_criteria_key, ad_unit_key_list = criteria_process(ad_tax, criteria_list, tax=True)

    for ad_unit_key in ad_unit_key_list:
        if ad_unit_key == 'pct_of_revenue':
            prod_tax_ret = process_rows(prod_tax_ret,
                                        ad_tax['rows'],
                                        ad_criteria_key,
                                        ad_unit_key,
                                        '%',
                                        1,
                                        'ATX',
                                        'flat_zero',
                                        date_dict,
                                        aries_start_log,
                                        user_work_stream,
                                        not_gross_well_head=not_gross_well_head,
                                        non_monotonic=non_monotonic)
        elif ad_unit_key == 'dollar_per_month':
            prod_tax_ret = process_rows(prod_tax_ret,
                                        ad_tax['rows'],
                                        ad_criteria_key,
                                        ad_unit_key,
                                        '$/M',
                                        1,
                                        'ATX/T',
                                        'flat_zero',
                                        date_dict,
                                        aries_start_log,
                                        user_work_stream,
                                        not_gross_well_head=not_gross_well_head,
                                        non_monotonic=non_monotonic)
        else:
            warnings.warn("Aries can only calculate Ad Valorem Tax base on '$/Month' and '% of Revenue'.")

    # severance tax
    se_calculation = se_tax['calculation']
    not_gross_well_head = se_tax.get(RATE_TYPE, GROSS_WELL_HEAD) != GROSS_WELL_HEAD
    non_monotonic = se_tax.get(ROWS_CALC_METHOD, NON_MONOTONIC) == NON_MONOTONIC
    if se_calculation == 'nri':
        warnings.warn("Aries calculate Severance Tax based on WI not NRI.")
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        phase_keyword = get_phase_keyword(phase)

        # rows
        se_phase_criteria_key, se_phase_unit_key_list = criteria_process(se_tax[phase], criteria_list, tax=True)
        for se_phase_unit_key in se_phase_unit_key_list:
            if se_phase_unit_key == 'pct_of_revenue':
                prod_tax_ret = process_rows(prod_tax_ret,
                                            se_tax[phase]['rows'],
                                            se_phase_criteria_key,
                                            se_phase_unit_key,
                                            '%',
                                            1,
                                            'STX/' + phase_keyword,
                                            'flat_zero',
                                            date_dict,
                                            aries_start_log,
                                            user_work_stream,
                                            non_monotonic=non_monotonic,
                                            not_gross_well_head=not_gross_well_head)
            elif se_phase_unit_key == 'dollar_per_bbl':
                if phase_keyword in NGL_CND_SEV_TAX_CODE_DICT:
                    econ_keyword = f'S/{NGL_CND_SEV_TAX_CODE_DICT[phase_keyword]}'
                else:
                    econ_keyword = 'STD/' + phase_keyword
                prod_tax_ret = process_rows(prod_tax_ret,
                                            se_tax[phase]['rows'],
                                            se_phase_criteria_key,
                                            se_phase_unit_key,
                                            '$/B',
                                            1,
                                            econ_keyword,
                                            'flat_zero',
                                            date_dict,
                                            aries_start_log,
                                            user_work_stream,
                                            non_monotonic=non_monotonic,
                                            not_gross_well_head=not_gross_well_head)
            elif se_phase_unit_key == 'dollar_per_mcf':
                prod_tax_ret = process_rows(prod_tax_ret,
                                            se_tax[phase]['rows'],
                                            se_phase_criteria_key,
                                            se_phase_unit_key,
                                            '$/M',
                                            1,
                                            'STD/' + phase_keyword,
                                            'flat_zero',
                                            date_dict,
                                            aries_start_log,
                                            user_work_stream,
                                            non_monotonic=non_monotonic,
                                            not_gross_well_head=not_gross_well_head)
            elif se_phase_unit_key == 'dollar_per_month':
                text = f'$/MO SEV TAX FOR {phase_keyword} MOVED TO ATX/T (NRI BASED CALC)'
                prod_tax_ret += [[TEXT, text]]
                prod_tax_ret = process_rows(prod_tax_ret,
                                            se_tax[phase]['rows'],
                                            se_phase_criteria_key,
                                            se_phase_unit_key,
                                            '$/M',
                                            1,
                                            'ATX/T',
                                            'flat_zero',
                                            date_dict,
                                            aries_start_log,
                                            user_work_stream,
                                            non_monotonic=non_monotonic,
                                            not_gross_well_head=not_gross_well_head)
            else:
                warnings.warn("Aries can only calculate Severance Tax base on '$/unit' and '% of Revenue'.")

    return prod_tax_ret


#### expenses
## expense warnings
def expense_warnings(expense_unit_econ):
    #
    expense_unit_keys = expense_unit_econ.keys()
    # escalation
    if 'escalation_model' in expense_unit_keys and expense_unit_econ['escalation_model'] != 'none':
        warnings.warn('Escalation model of Expenses can not be brought to Aries for now.')
    # deal_terms
    if 'deal_terms' in expense_unit_keys and expense_unit_econ['deal_terms'] not in [1, '']:
        warnings.warn('Deal Term information of Expenses can not be brought to Aries.')
    # shrinkage_condition
    if 'shrinkage_condition' in expense_unit_keys and expense_unit_econ['shrinkage_condition'] == 'unshrunk':
        warnings.warn('Shrinkage Condition of Variable Expense for Oil and Gas need to be Shrunk in Aries.')
    # calculation
    if 'calculation' in expense_unit_keys and expense_unit_econ['calculation'] == 'nri':
        warnings.warn('Aries calculate Expenses based on WI not NRI.')
    # affect_econ_limit
    if 'affect_econ_limit' in expense_unit_keys and expense_unit_econ['affect_econ_limit'] == 'no':
        warnings.warn('Expenses will affect Econ Limit in Aries')
    # deduct_before_severance_tax
    if 'deduct_before_severance_tax' in expense_unit_keys and expense_unit_econ['deduct_before_severance_tax'] == 'yes':
        warnings.warn('Expenses can not be deducted before Severance Tax in Aries')
    # deduct_before_ad_val_tax
    if 'deduct_before_ad_val_tax' in expense_unit_keys and expense_unit_econ['deduct_before_ad_val_tax'] == 'yes':
        warnings.warn('Expenses can not be deducted before Ad Valorem Tax in Aries')
    # stop_at_econ_limit
    if 'stop_at_econ_limit' in expense_unit_keys and expense_unit_econ['stop_at_econ_limit'] == 'no':
        warnings.warn('Fixed Expenses need to stop at Econ Limit in Aries')
    # expense_before_fpd
    if 'expense_before_fpd' in expense_unit_keys and expense_unit_econ['expense_before_fpd'] == 'yes':
        warnings.warn('Fixed Expenses need to start from FPD in Aries')


def process_var_expense_keyword(category, unit, unit_key, phase, phase_keyword):
    keyword = None
    keyword, unit = process_var_rev_expense_keyword(keyword, category, unit, unit_key)
    if keyword is None:
        keyword = process_var_phase_expense_keyword(keyword, phase, phase_keyword, category, unit_key)
    return keyword, unit


def process_var_rev_expense_keyword(keyword, category, unit, unit_key):
    keyword = VAR_REV_EXPENSE_KEYWORD_DICT.get((unit_key, category))
    if keyword is not None:
        unit = '%'
    return keyword, unit


def process_var_phase_expense_keyword(keyword, phase, phase_keyword, category, unit_key):  # noqa (C901)
    if category == 'gathering':
        if phase in ['gas']:
            keyword = f'GPC/{phase_keyword}'
        elif phase == 'oil':
            keyword = 'OPC/P09'
        elif phase == 'ngl':
            keyword = f'GPC/{phase_keyword}'
        elif phase == 'drip_condensate':
            keyword = f'OPC/{phase_keyword}'
    elif category == 'processing':
        keyword = f'OPC/{phase_keyword}'
    elif category == 'transportation':
        if phase == 'oil':
            keyword = 'LTC/OIL'
        elif phase == 'gas':
            keyword = f'GTC/{phase_keyword}'
        elif phase == 'ngl':
            keyword = 'OPC/P12'
        elif phase == 'drip_condensate':
            keyword = f'OPC/{phase_keyword}'
    elif category == 'marketing':
        if phase == 'gas':
            keyword = f'TRC/{phase_keyword}'
        elif phase == 'oil':
            keyword = 'OPC/P10'
        elif phase == 'ngl':
            keyword = 'OPC/P13'
        elif phase == 'drip_condensate':
            keyword = f'OPC/{phase_keyword}'
    elif category == 'other':
        if phase == 'gas':
            keyword = f'CMP/{phase_keyword}'
        elif phase == 'oil':
            keyword = 'OPC/P11'
        elif phase == 'ngl':
            keyword = 'OPC/P14'
        elif phase == 'drip_condensate':
            keyword = f'OPC/{phase_keyword}'
    if unit_key in UNHANDLEABLE_REVENUE_BASED_KEYS:
        keyword = UNHANDLEABLE_REVENUE_BASED_KEYS.get(unit_key)
    return keyword


def all_equal(iterable):
    g = groupby(iterable)
    return next(g, True) and not next(g, False)


def segment_created_aries_rows(copy_original_rows):
    rows_segment = None
    segmented_rows = []
    previous_keyword = None
    current_keyword = None
    for row in copy_original_rows:
        keyword = row[0]
        current_keyword = keyword if keyword != '"' else current_keyword
        new_row = current_keyword != previous_keyword
        if new_row:
            if rows_segment is not None:
                segmented_rows.append(rows_segment)
            rows_segment = []
            rows_segment.append(row)
        else:
            rows_segment.append(row)
        previous_keyword = current_keyword
    if rows_segment:
        segmented_rows.append(rows_segment)

    return segmented_rows


def update_keyword_set_for_lookup(econ_rows, keyword_set):
    for row in econ_rows:
        if row[0] in ['START', TEXT, ERROR, '"']:
            continue
        keyword_set.add(row[0])

    return keyword_set


def get_embedded_lookup_table(context, econ):
    embedded_ids = econ.get('embedded', [])
    embedded_hash = {
        embed['_id']: embed
        for embed in context.embedded_lookup_tables_collection.find({'_id': {
            '$in': embedded_ids
        }})
    }
    embedded_lookup_tables = [
        embedded_hash[embedded_id] for embedded_id in embedded_ids if embedded_id in embedded_hash
    ]

    return embedded_lookup_tables


def edit_configuration_names(well_headers, configuration, mapping):
    """Generate truncated names for headers if needed

    Args:
        well_headers (dict): list of headers in well_headers
        configuration (list): list of ELT headers
        mapping (dict): dict of custom headers in mapping

    Returns:
        list: truncated header names
    """
    formated_item = []
    for item in configuration:
        if item == 'PRIMARY_PRODUCT':
            formated_item.append(item)
            continue
        # check if item has already been mapped
        if item in mapping:
            formated_name = mapping.get(item)
            existing_header = well_headers.get(item, '')
            if existing_header != '':
                well_headers[formated_name] = existing_header
        else:
            # if item hasn't been mapped, create a truncated name and add to mapping
            formated_name = str(item[:MAX_WELL_HEADER_LENGTH_FOR_LOOKUP_REF]).strip('_')
            if formated_name != item:
                if formated_name in mapping.values():
                    idx = 2
                    while f'{formated_name}_{idx}' in mapping.values():
                        idx += 1
                    formated_name = f'{formated_name}_{idx}'
                well_headers[formated_name] = well_headers.get(item)
                mapping[item] = formated_name

        formated_item.append(formated_name)

    return formated_item


def get_lookup_table_properties(table, well_headers, mapping):
    name = table.get('name')
    configuration = table.get('configuration').get('selectedHeaders')
    configuration_behavior = table.get('configuration').get('selectedHeadersMatchBehavior',
                                                            {header: 'regular'
                                                             for header in configuration})

    # pull match columns first then update rest of columns back in
    match_first_configuration = {
        key: configuration_behavior[key]
        for key in configuration_behavior if configuration_behavior[key] == 'regular'
    }
    match_first_configuration.update(configuration_behavior)
    configuration = list(match_first_configuration.keys())
    edited_configuration = edit_configuration_names(well_headers, configuration, mapping)

    lookup_expression = ' '.join([
        f'@M.{str(item).upper()}' if str(item).upper() != 'PRIMARY_PRODUCT' else '@M.MAJOR'
        for item in edited_configuration
    ])

    return name, configuration, match_first_configuration, lookup_expression


def get_appropriate_lookup_name_for_case(name, assump_key, lookup_name_alias_dict):
    formatted_name = re.sub(r'[_:*$%@&()-/\s]+', '', str(name))
    clean_lookup_name = f'{str(assump_key).upper()[:3]}{formatted_name[:12]}'
    model_idx = 0
    for alias in lookup_name_alias_dict.values():
        formatted_alias = str(alias).rsplit('_', 1)[0]
        if str(formatted_alias).casefold() == str(clean_lookup_name).casefold():
            if int(float(str(alias).rsplit('_', 1)[1])) > model_idx:
                model_idx = int(float(str(alias).rsplit('_', 1)[1]))
    model_idx += 1
    model_idx = format_model_index(model_idx)
    clean_lookup_name = f'{clean_lookup_name}_{model_idx}'.upper()
    lookup_name_alias_dict[name] = clean_lookup_name

    return clean_lookup_name


def create_aries_rows_for_all_lookup_cases(expense_lookup_docs, date_dict, user_work_stream, phase_workstream):
    (case_lookup_dict, case_full_dict, case_category_dict, case_value_dict, case_overlay_dict) = {}, {}, {}, {}, {}
    # for case, document, headers in expense_lookup_docs.items():
    for case in expense_lookup_docs:
        document, headers = expense_lookup_docs[case]
        aries_start_log = AriesStartLog()
        capex_doc = {'other_capex': {'rows': []}}
        original_rows = expenses_conv(document,
                                      capex_doc,
                                      date_dict,
                                      aries_start_log,
                                      phase_workstream=phase_workstream,
                                      lookup=True)
        if len(original_rows) == 0:
            continue
        overlay_rows = expenses_overlay_conv(document,
                                             date_dict,
                                             aries_start_log,
                                             user_work_stream=user_work_stream,
                                             lookup=True)

        case_overlay_dict[case] = overlay_rows
        list_in_values = False
        values = []
        categories = []
        lookup_rows = []
        full_rows = []
        for row in original_rows:
            expression = row[1]
            keyword = row[0]
            expression_items = str(expression).split()
            full_expression_items = copy.deepcopy(expression_items)
            if expression.endswith('#'):
                for i, expression_item in enumerate(expression_items):
                    if expression_item.startswith('?'):
                        expression_multiplier = expression_item.split('*')
                        if len(expression_multiplier) > 1:
                            _, value, _ = expression_multiplier[0].split('~')
                            expression_multiplier[0] = value
                            values.append('*'.join(expression_multiplier[:-1]))
                            expression_items[i] = '?'
                        else:
                            _, value, _ = expression_item.split('~')
                            values.append(value)
                            expression_items[i] = '?'
                new_expression = ' '.join([str(item) for item in expression_items])
                row[1] = new_expression
                lookup_rows.append(copy.deepcopy(row))
                full_rows.append(row)
            else:
                for i, expression_item in enumerate(expression_items):
                    if expression_item.startswith('?'):
                        use, value, category = expression_item.split('~')
                        list_in_values = value[0] == '[' and value[-1] == ']'
                        values.append(value)
                        categories.append(category)
                        expression_items[i] = use
                        full_expression_items[i] = value
                new_expression = ' '.join([str(item) for item in expression_items])
                full_expression = ' '.join([str(item) for item in full_expression_items])
                row[1] = new_expression
                lookup_row = copy.deepcopy(row)
                if keyword not in [TEXT, ERROR]:
                    lookup_rows.append(lookup_row)
                row[1] = full_expression
                full_row = copy.deepcopy(row)
                if keyword not in [TEXT, ERROR]:
                    full_rows.append(full_row)

        case_lookup_dict[case] = lookup_rows
        case_full_dict[case] = full_rows
        if list_in_values:
            # indicates interpolation time series which requires transposing of values
            transformed_values = np.transpose([re.sub(r'[\[,\]]+', ' ', val).strip().split()
                                               for val in values]).tolist()
            for idx, header in enumerate(headers):
                case_value_dict[header] = transformed_values[idx]
                case_category_dict[header] = copy.deepcopy(categories)
                case_overlay_dict[header] = overlay_rows
        elif len(headers) > 1:
            for idx, header in enumerate(headers):
                case_value_dict[header] = [values[idx]]
                case_category_dict[header] = [categories[idx]]
                case_overlay_dict[header] = overlay_rows
        else:
            case_value_dict[case] = values
            case_category_dict[case] = categories

    return (case_lookup_dict, case_full_dict, case_category_dict, case_value_dict, case_overlay_dict)


def add_non_sidefile_lookup_rows(final_lookup_rows, name, case_lookup_dict, all_keywords_in_initial_aries_rows, idx):
    errors = []
    for lookup_rows in case_lookup_dict.values():
        for lookup_row in lookup_rows:
            if lookup_row[0] in [TEXT, ERROR]:
                errors.append(lookup_row)
                continue
            final_lookup_rows.append([name, 0, idx, lookup_row[0], *lookup_row[1].split(' ')])
            idx += 1
            if lookup_row[0] not in ['START', '"']:
                all_keywords_in_initial_aries_rows.add(lookup_row[0])
        break

    return final_lookup_rows, idx, errors


def add_sidefile_lookup_rows(final_lookup_rows, name, case_overlay_dict, case_category_dict, case_value_dict,
                             sidefile_doc, idx):
    # add overlay sidefile to lookup and add the sidefile rows into the sidefile doc
    if any(len(rows) > 0 for rows in case_overlay_dict.values()):
        final_lookup_rows.append([name, 0, idx, 'SIDEFILE', '?'])
        add_expense_lookup_sidefile(name,
                                    case_overlay_dict,
                                    sidefile_doc,
                                    case_category_dict,
                                    case_value_dict,
                                    list=False)
        idx += 1

    return final_lookup_rows


def create_behavior_list(configuration: list, behavior_dict: dict):
    """Convert behavior types into Aries format

    Args:
        configuration (list): configuration order of columns
        behavior_dict (dict): dictionary of conversions

    Returns:
        _type_: list of Aries header types
    """
    # convert configuration list into Aries equavalent
    aries_behavior = [BEHAVIOR_CC_TO_ARIES[behavior_dict[item]] for item in configuration]
    return aries_behavior


def add_category_and_line_type_for_non_interacting_lookup(final_lookup_rows, name, case_category_dict, case_value_dict,
                                                          configuration, behavior):
    category_type = []
    for case, category in case_category_dict.items():
        final_lookup_rows.append(
            [name, 1, 0, *[str(item).upper() for item in configuration], *[str(item).upper() for item in category]])
        for item in category:
            if item == 'unit' or 'OL_LU' in str(item):
                category_type.append('L')
            elif item in ['description', 'calculation', 'date_unit']:
                category_type.append('T')
            elif item in ['criteria_value']:
                category_type.append('C')
            else:
                category_type.append('N')
        match_ls = create_behavior_list(configuration, behavior)
        final_lookup_rows.append([name, 1, 1, *match_ls, *category_type])
        break

    # add LINETYPE 3 (cases and their values)
    idx = 0
    for case, value in case_value_dict.items():
        final_lookup_rows.append([name, 3, idx, *[str(item).upper() for item in case], *value])
        idx += 1

    return final_lookup_rows


def update_lookup_table_dict_if_necessary(name, final_lookup_rows, lookup_table_dict):
    use_lookup_name = name
    create_new_lookup = True
    for lookup_name, created_lookup_rows in lookup_table_dict.items():
        if all_equal([[row[1:] for row in created_lookup_rows], [row[1:] for row in final_lookup_rows]]):
            use_lookup_name = lookup_name
            create_new_lookup = False
            break

    if create_new_lookup:
        lookup_table_dict[use_lookup_name] = final_lookup_rows

    return use_lookup_name


def create_sidefiles_for_interacting_lookups(case_full_dict, case_overlay_dict, sidefile_doc, count, aries_start_log,
                                             user_work_stream):
    case_value_dict = {}
    for case, original_rows in case_full_dict.items():
        sidefile_rows = []
        segmented_original_rows = segment_created_aries_rows(original_rows)
        segmented_overlay_rows = segment_created_aries_rows(case_overlay_dict[case])
        combined_original_and_overlay_rows = combine_original_and_overlay_rows_for_lookup(
            segmented_original_rows, segmented_overlay_rows, count, aries_start_log, user_work_stream)

        for idx, row in enumerate(combined_original_and_overlay_rows):
            sidefile_rows.append([None, None, None, None, None, None, None, None, None, None, 9, idx + 1, None, *row])

        use_created = False
        lookup_config = re.sub(r'[_:*$%@&()-/\s]+', '', ''.join([str(item).upper() for item in case]))[:10]
        lookup_config = f'CCELT{lookup_config}'
        for created_sidefile_name, created_sidefile_rows in sidefile_doc.items():
            same_sidefile_rows = all_equal([created_sidefile_rows, sidefile_rows])
            if same_sidefile_rows:
                case_value_dict[case] = [created_sidefile_name]
                use_created = True
                break
        if not use_created:
            model_idx = 0
            for use_name in sidefile_doc:
                if str(use_name).rsplit('_', 1)[0] == lookup_config:
                    if int(float(str(use_name).rsplit('_', 1)[1])) > model_idx:
                        model_idx = int(float(str(use_name).rsplit('_', 1)[1]))
            model_idx += 1
            model_idx = format_model_index(model_idx)
            lookup_config = f'{lookup_config}_{model_idx}'.upper()
            case_value_dict[case] = [lookup_config]
            sidefile_doc[lookup_config] = sidefile_rows

    return case_value_dict


def add_category_and_line_type_for_interacting_lookup(final_lookup_rows, case_value_dict, name, configuration,
                                                      behavior):
    match_ls = create_behavior_list(configuration, behavior)
    final_lookup_rows.append([name, 0, 0, 'SIDEFILE', '?'])
    final_lookup_rows.append([name, 1, 0, *[str(item).upper() for item in configuration], 'EXPENSE_LOOKUP'])
    final_lookup_rows.append([name, 1, 1, *match_ls, 'L'])

    idx = 0
    for case, value in case_value_dict.items():
        final_lookup_rows.append([name, 3, idx, *[str(item).upper() for item in case], *value])
        idx += 1

    return final_lookup_rows


def process_lookup_table_from_expense_doc(context, expense_ret, exp_econ, assump_key, date_dict, well_headers, mapping,
                                          lookup_table_dict, sidefile_doc, lookup_name_alias_dict, lookup_overlay_rows,
                                          user_work_stream, phase_workstream, original_aries_start_log):

    # initiate list for all non overlay expense keywords that are used
    all_keywords_in_initial_aries_rows = set()
    # add keywords created from the non-lookup expense keywords
    all_keywords_in_initial_aries_rows = update_keyword_set_for_lookup(expense_ret, all_keywords_in_initial_aries_rows)

    # get the embedded lookup tables assigned to this expense document
    embedded_lookup_tables = get_embedded_lookup_table(context, exp_econ)

    # loop through each embedded lookup table
    for table_count, table in enumerate(embedded_lookup_tables):
        if table_count == 2:
            expense_ret += [[TEXT, 'MAX LIMIT OF LOOKUP TABLE IN MODEL REACHED']]
        # get the lookup name, get the headers used to build the table, get the correspending macro references
        name, configuration, behavior, macro_expression = get_lookup_table_properties(table, well_headers, mapping)

        # get the CC Expense document for each build case for current embedded lookup table
        expense_lookup_docs, valid = create_expense_document_from_lookup_docs(table, behavior)

        if not valid:
            expense_ret += [[TEXT, 'EXPORT DOES NOT CURRENTLY HANDLE CHOSEN LOOKUP CRITERIA']]
            continue

        # check if the lookup can be treated as a sidefile
        if len(expense_lookup_docs) == 1 and list(expense_lookup_docs.keys())[0] is None:
            document = expense_lookup_docs[None]
            capex_doc = {'other_capex': {'rows': []}}
            original_rows = expenses_conv(document,
                                          capex_doc,
                                          date_dict,
                                          AriesStartLog(),
                                          phase_workstream=phase_workstream,
                                          lookup=True)
            overlay_rows = expenses_overlay_conv(document,
                                                 date_dict,
                                                 AriesStartLog(),
                                                 user_work_stream=user_work_stream,
                                                 lookup=True)
            sidefile_name, overlay_present = add_lookup_as_sidefile(name,
                                                                    original_rows,
                                                                    overlay_rows,
                                                                    sidefile_doc,
                                                                    assumption_code='EXP')
            expense_ret += [['SIDEFILE', sidefile_name]]
            if overlay_present:
                lookup_overlay_rows += [['SIDEFILE', sidefile_name]]
            continue

        # get the appropriate lookup name to be used
        clean_lookup_name = get_appropriate_lookup_name_for_case(name, assump_key, lookup_name_alias_dict)

        # get the associated ARIES rows for each case
        all_cases = create_aries_rows_for_all_lookup_cases(expense_lookup_docs, date_dict, user_work_stream,
                                                           phase_workstream)

        if all_cases is None:
            continue

        # associated rows are split into:
        # lookup rows: containing values to be used for non-sidefile lookup rows
        # list rows: containing values with list methods rows associated with case
        # overlay rows: containing all the overlay rows associated with case
        # full rows: containing all the rows with their actual values associated with case
        # value and type per case

        (case_lookup_dict, case_full_dict, case_category_dict, case_value_dict, case_overlay_dict) = all_cases

        # initiate all the list for keywords in lookup non-overlay rows
        all_keywords_in_lookup_row = set()

        # add all keywords in lookup non-overlay rows
        for rows in case_lookup_dict.values():
            all_keywords_in_lookup_row = update_keyword_set_for_lookup(rows, all_keywords_in_lookup_row)

        # check if to create a typical lookup or lookup that references a sidefille
        # if all the rows of the lookup dict are the same (same template)
        # and non-overlay expense keyword in case does not exist in list of all non-overlay expense keyword
        construct_lookup = all_equal(case_lookup_dict.values()) and len(
            all_keywords_in_lookup_row.intersection(all_keywords_in_initial_aries_rows)) == 0

        # initiate lookup rows
        final_lookup_rows = []
        idx = 0
        if construct_lookup:
            # add the non sidefile rows to the lookup rows
            final_lookup_rows, idx, errors = add_non_sidefile_lookup_rows(final_lookup_rows, clean_lookup_name,
                                                                          case_lookup_dict,
                                                                          all_keywords_in_initial_aries_rows, idx)

            # add the sidefile rows to the lookup rows
            final_lookup_rows = add_sidefile_lookup_rows(final_lookup_rows, clean_lookup_name, case_overlay_dict,
                                                         case_category_dict, case_value_dict, sidefile_doc, idx)

            # add the category and line type for the lookup rows
            final_lookup_rows = add_category_and_line_type_for_non_interacting_lookup(
                final_lookup_rows, clean_lookup_name, case_category_dict, case_value_dict, configuration, behavior)

            # add lookup rows to lookup table dict if it did not already exist
            use_lookup_name = update_lookup_table_dict_if_necessary(clean_lookup_name, final_lookup_rows,
                                                                    lookup_table_dict)

            # add LOOKUP line ARIES expense rows
            expense_ret += errors
            expense_ret += [['LOOKUP', f'{use_lookup_name} {macro_expression}']]
            if any(created_overlay_rows for created_overlay_rows in case_overlay_dict.values()):
                lookup_overlay_rows += [['LOOKUP', f'{use_lookup_name} {macro_expression}']]
        else:
            # create the sidefile for interacting lookups
            case_value_dict = create_sidefiles_for_interacting_lookups(case_full_dict, case_overlay_dict, sidefile_doc,
                                                                       table_count, original_aries_start_log,
                                                                       user_work_stream)

            # add the category and linetype for interacting lookup
            final_lookup_rows = add_category_and_line_type_for_interacting_lookup(final_lookup_rows, case_value_dict,
                                                                                  clean_lookup_name, configuration,
                                                                                  behavior)

            # add lookup rows to lookup table dict if it did not already exist
            use_lookup_name = update_lookup_table_dict_if_necessary(clean_lookup_name, final_lookup_rows,
                                                                    lookup_table_dict)

            # add LOOKUP line to EXPENSE OVERLAY LOOKUP ROWS
            lookup_overlay_rows += [['LOOKUP', f'{use_lookup_name} {macro_expression}']]

    return expense_ret

    # TODO: Add better handle for expense before fpd (@M.FIRST_PROD_DATE) TO @M.FIRST_PROD_DATE AD


def add_lookup_as_sidefile(name, normal_rows, overlay_rows, sidefile_doc, assumption_code=None):

    sidefile_name = f'{assumption_code}LU{str(name).upper()[:10]}'
    section = 6
    sequence = 0
    new_sidefile = []
    overlay_present = False
    for row in normal_rows:
        new_sidefile.append(
            [None, None, None, None, None, None, None, None, None, None, section, sequence + 1, None, *row])
        sequence += 1

    section = 9
    for row in overlay_rows:
        overlay_present = True
        new_sidefile.append(
            [None, None, None, None, None, None, None, None, None, None, section, sequence + 1, None, *row])
        sequence += 1

    use_sidefile_name = add_lookup_sidefile_to_sidefile_document(new_sidefile, sidefile_name, sidefile_doc)

    return use_sidefile_name, overlay_present


def add_expense_lookup_sidefile(formatted_name,
                                case_sidefile_dict,
                                sidefile_doc,
                                case_category_dict,
                                case_value_dict,
                                list=True):

    for case, lm_sidefile in case_sidefile_dict.items():
        mod = 'LM' if list else 'OL'
        section = 6 if list else 9
        sidefile_name = f'CCELT{formatted_name[:10]}'
        new_sidefile = [[
            None, None, None, None, None, None, None, None, None, None, 6, 1, None, *[TEXT, 'PLACEHOLDER']
        ]]
        sequence = 1
        for row in lm_sidefile:
            new_sidefile.append(
                [None, None, None, None, None, None, None, None, None, None, section, sequence + 1, None, *row])
            sequence += 1
        new_sidefile.append([
            None, None, None, None, None, None, None, None, None, None, section, sequence + 1, None,
            *[TEXT, 'PLACEHOLDER']
        ])
        use_sidefile_name = add_lookup_sidefile_to_sidefile_document(new_sidefile, sidefile_name, sidefile_doc)
        case_value_dict[case].append(use_sidefile_name)
        case_category_dict[case].append(f'EXPENSE_{mod}_LU')


def add_lookup_sidefile_to_sidefile_document(new_sidefile, sidefile_name, sidefile_doc):
    for created_sidefile_name, sidefile_rows in sidefile_doc.items():
        if all_equal([sidefile_rows, new_sidefile]):
            return created_sidefile_name

    model_idx = 0
    for use_name in sidefile_doc:
        if str(use_name).rsplit('_', 1)[0] == sidefile_name:
            if int(float(str(use_name).rsplit('_', 1)[1])) > model_idx:
                model_idx = int(float(str(use_name).rsplit('_', 1)[1]))
    model_idx += 1
    model_idx = format_model_index(model_idx)
    sidefile_name = f'{sidefile_name}_{model_idx}'.upper()
    sidefile_doc[sidefile_name] = new_sidefile
    return sidefile_name


def add_row_data_for_date_criteria(period, expense_doc, lookups, criteria, unit, value, add_value):
    if type(period) is list:
        for i in range(len(period)):
            if i < len(period) - 1:
                start_date = pd.to_datetime(period[i]).strftime('%Y-%m-%d')
                end_date = (pd.to_datetime(period[i + 1]) + pd.DateOffset(days=-1)).strftime('%Y-%m-%d')
            else:
                start_date = (pd.to_datetime(end_date) + pd.DateOffset(days=1)).strftime('%Y-%m-%d')
                end_date = 'Econ Limit'
            expense_doc['rows'].append({criteria: {'start_date': start_date, 'end_date': end_date}})
            if add_value:
                expense_doc['rows'][-1][unit] = float(value[i])
            else:
                expense_doc['rows'][-1][unit] = 0
                lookups.add(value)
    else:
        start_date = (pd.to_datetime(period)).strftime('%Y-%m-%d')
        end_date = 'Econ Limit'
        expense_doc['rows'].append({criteria: {'start_date': start_date, 'end_date': end_date}})
        if add_value:
            expense_doc['rows'][-1][unit] = float(value)
        else:
            expense_doc['rows'][-1][unit] = 0
            lookups.add(value)

    return expense_doc, lookups


def add_row_data_for_offset_criteria(period, expense_doc, lookups, criteria, unit, value, add_value):
    if type(period) is list:
        start = 1
        for idx, current_period in enumerate(period):
            if len(period) == idx - 1:
                expense_doc['rows'].append({criteria: {'start': start, 'end': 'Econ Limit', 'period': current_period}})
            else:
                end = start + current_period - 1 if idx < len(period) - 1 else 'Econ Limit'
                expense_doc['rows'].append({criteria: {'start': start, 'end': end, 'period': current_period}})
                start = end + 1 if end != 'Econ Limit' else None
            if add_value:
                expense_doc['rows'][-1][unit] = float(value[idx])
            else:
                expense_doc['rows'][-1][unit] = 0
                lookups.add(value)
    else:
        expense_doc['rows'].append({criteria: {'start': 1, 'end': 'Econ Limit', 'period': 1200}})
        if add_value:
            expense_doc['rows'][-1][unit] = float(value)
        else:
            expense_doc['rows'][-1][unit] = 0
            lookups.add(value)
    return expense_doc, lookups


def add_row_data_for_rate_criteria(period, expense_doc, lookups, criteria, unit, value, add_value):
    if type(period) is list:
        for idx, current_rate in enumerate(period):
            if len(period) == idx - 1:
                expense_doc['rows'].append({criteria: {'start': current_rate, 'end': 'inf'}})
            else:
                expense_doc['rows'].append({criteria: {
                    'start': current_rate,
                    'end': period[idx + 1],
                }})
            if add_value:
                expense_doc['rows'][-1][unit] = float(value[idx])
            else:
                expense_doc['rows'][-1][unit] = 0
                lookups.add(value)
    else:
        expense_doc['rows'].append({criteria: {'start': period, 'end': 'inf'}})
        if add_value:
            expense_doc['rows'][-1][unit] = float(value)
        else:
            expense_doc['rows'][-1][unit] = 0
            lookups.add(value)
    return expense_doc, lookups


def get_elt_value(dictionary, key, default=None):
    value = dictionary.get(key, default)
    if type(value) is list:
        value = value[0] if len(value) > 0 else None
    return value


def add_row_data_for_criteria(expense_doc, use_dict, default_unit, lookups):

    criteria = get_elt_value(use_dict, 'criteria')
    period = use_dict.get('period')
    value = use_dict.get('value')
    unit = get_elt_value(use_dict, 'unit')
    unit = default_unit if not unit or '-' in str(unit) else unit
    add_value = '-' not in str(value)
    if criteria != 'entire_well_life':
        expense_doc['rows'] = []
        if criteria == 'dates':
            expense_doc, lookups = add_row_data_for_date_criteria(period, expense_doc, lookups, criteria, unit, value,
                                                                  add_value)
        elif 'offset_' in str(criteria):
            expense_doc, lookups = add_row_data_for_offset_criteria(period, expense_doc, lookups, criteria, unit, value,
                                                                    add_value)
        elif 'rate' in str(criteria):
            expense_doc, lookups = add_row_data_for_rate_criteria(period, expense_doc, lookups, criteria, unit, value,
                                                                  add_value)
    else:
        if add_value:
            expense_doc['rows'][-1][unit] = float(value)
        else:
            lookups.add(value)


def add_line_to_default_doc(document,
                            line_dict,
                            default_unit,
                            lookups,
                            keys_to_ignore=['category', 'key', 'period', 'unit', 'value', 'escalation_model']):
    for key, value in line_dict.items():
        if key == 'criteria':
            add_row_data_for_criteria(document, line_dict, default_unit, lookups)
        elif key in keys_to_ignore:
            continue
        else:
            if type(value) is list:
                value = value[0] if len(value) > 0 else None
            if value is None:
                continue
            if '-' in str(value):
                lookups.add(value)
                continue
            else:
                document[key] = value


def add_line_to_expense_default_doc(default_expense_doc, expense_lookup_reference_dict, line_dict, expense_type, phase,
                                    fixed_expense_count):
    if expense_type == 'variable_expenses':
        category = get_elt_value(line_dict, 'category', default='processing')
        default_unit = 'dollar_per_bbl' if phase != 'gas' else 'dollar_per_mcf'
        add_line_to_default_doc(default_expense_doc[expense_type][phase][category], line_dict, default_unit,
                                expense_lookup_reference_dict[expense_type][phase][category])
    elif expense_type == 'fixed_expenses':
        default_unit = 'fixed_expense'
        add_line_to_default_doc(
            default_expense_doc[expense_type][FIXED_EXPENSE_TYPE_DICT[str(fixed_expense_count)]], line_dict,
            default_unit,
            expense_lookup_reference_dict[expense_type][FIXED_EXPENSE_TYPE_DICT[str(fixed_expense_count)]])
        fixed_expense_count += 1
    else:
        default_unit = 'dollar_per_bbl'
        add_line_to_default_doc(default_expense_doc[expense_type], line_dict, default_unit,
                                expense_lookup_reference_dict[expense_type])

    return default_expense_doc, fixed_expense_count


def get_expense_type_and_phase_from_lookup_line_dict(line_dict):
    expense_type = get_elt_value(line_dict, 'key')

    phase = None
    if expense_type in ['oil', 'gas', 'ngl', 'drip_condensate']:
        expense_type = 'variable_expenses'
        phase = get_elt_value(line_dict, 'key')

    return expense_type, phase


def get_expense_lookup_reference_dict():
    return {
        'variable_expenses': {
            'oil': {
                'gathering': set(),
                'processing': set(),
                'transportation': set(),
                'marketing': set(),
                'other': set()
            },
            'gas': {
                'gathering': set(),
                'processing': set(),
                'transportation': set(),
                'marketing': set(),
                'other': set()
            },
            'ngl': {
                'gathering': set(),
                'processing': set(),
                'transportation': set(),
                'marketing': set(),
                'other': set()
            },
            'drip_condensate': {
                'gathering': set(),
                'processing': set(),
                'transportation': set(),
                'marketing': set(),
                'other': set()
            }
        },
        'fixed_expenses': {
            'monthly_well_cost': set(),
            'other_monthly_cost_1': set(),
            'other_monthly_cost_2': set(),
            'other_monthly_cost_3': set(),
            'other_monthly_cost_4': set(),
            'other_monthly_cost_5': set(),
            'other_monthly_cost_6': set(),
            'other_monthly_cost_7': set(),
            'other_monthly_cost_8': set(),
        },
        'water_disposal': set()
    }


def create_expense_document_from_lookup_docs(table, behavior):
    expense_lookup_reference_dict = get_expense_lookup_reference_dict()
    fixed_expense_count = 0
    default_expense_doc = get_default('expenses')
    lines = table.get('lines', [])
    invalid = any(criteria not in ['regular', 'match', 'ratio', 'interpolation']
                  for criteria in table.get('configuration', {}).get('selectedHeadersMatchBehavior', {}).values())
    if invalid:
        return {}, False
    for line in lines:
        line_dict = {item.get('key'): (item.get('value', item.get('lookup'))) for item in line}

        expense_type, phase = get_expense_type_and_phase_from_lookup_line_dict(line_dict)

        if expense_type not in expense_lookup_reference_dict:
            continue

        default_expense_doc, fixed_expense_count = add_line_to_expense_default_doc(default_expense_doc,
                                                                                   expense_lookup_reference_dict,
                                                                                   line_dict, expense_type, phase,
                                                                                   fixed_expense_count)

    lookup_combined_dict = add_rules_to_expense_document(default_expense_doc, expense_lookup_reference_dict, table,
                                                         behavior)

    return lookup_combined_dict, True


def sort_interpolate_elt(conditions, to_sort_key, children_keys, lookup_values_dict):
    """Rearrange data values based on interpolate column

    Args:
        conditions (dict): dict containing ELT info for conditions
        to_sort_key (list): list of columns with Interpolate column
        children_keys (dict): dict containing list of children for each condition
        lookup_values_dict (dict): dict containing list of children for each lookup
    """

    header_indexes = {}
    for idx, condition in enumerate(conditions):
        header_indexes[condition.get('key')] = idx
    interpolation_col = header_indexes.get(to_sort_key[0])
    interpolation_doc = conditions[interpolation_col]
    value_list = [interpolation_doc.get('value', ''), *children_keys.get(to_sort_key[0])]

    # sorts value_list and created a list indicating original row
    value_list, row_order = zip(*sorted(zip(value_list, range(len(value_list)))))
    # store resorted values back into corresponding variables
    conditions[interpolation_col]['value'] = value_list[0]
    children_keys[to_sort_key[0]] = value_list[1:] if len(value_list) > 1 else []

    # re-arrange all values in rule lookup value to match new sort order
    for line in lookup_values_dict:
        sorted_kids = []
        for order in row_order:
            sorted_kids.append(lookup_values_dict[line][order])
        lookup_values_dict[line] = sorted_kids


def fill_in_value_children_headers(max_children, lookup_values, lookup_values_dict):
    for lookup_value in lookup_values:
        if lookup_value.get('value') is not None:
            temp_list = [lookup_value.get('value')] + [values for values in lookup_value.get('childrenValues', [])]

            # children values will be blank for match headers, repeat first value for each index
            if len(temp_list) < max_children + 1:
                lookup_values_dict[lookup_value['key']] = [lookup_value.get('value')] * (max_children + 1)
            else:
                lookup_values_dict[lookup_value['key']] = temp_list


def fill_in_rule_children_headers(max_children, children_keys, conditions):
    for index, key in enumerate(children_keys):
        if len(children_keys[key]) < max_children:
            children_keys[key] = [conditions[index].get('value')] * max_children


def add_rules_to_expense_document(default_expense_doc, lookup_ref_dict, table, behavior):
    rules = table.get('rules', [])
    lookup_combined_dict = {}
    final_tuples = []
    # interpolation columns need values sorted in ascending order, pull column
    to_sort_key = [key for key, value in behavior.items() if value == 'interpolation']

    if rules:
        for rule in rules:
            use_default_doc = copy.deepcopy(default_expense_doc)
            conditions = rule.get('conditions')

            children_keys = {}
            max_children = 0
            # pull children values into dict for cooresponding key to process
            for condition in conditions:
                children_keys[condition.get('key')] = condition.get('childrenValues', [])
                child_length = len(children_keys[condition.get('key')])
                max_children = child_length if child_length > max_children else max_children

            lookup_values = rule.get('values')
            lookup_values_dict = {}

            # CC has blanks for children values
            if max_children > 0:
                # update blank values for condition children with parent value
                fill_in_rule_children_headers(max_children, children_keys, conditions)

            # update blank values for value children with parent value
            fill_in_value_children_headers(max_children, lookup_values, lookup_values_dict)

            # If interpolation column found, sort rows by interpolation column
            if len(to_sort_key) > 0:
                sort_interpolate_elt(conditions, to_sort_key, children_keys, lookup_values_dict)

            # create list of header tuples in the same order as behavior
            parent_key = {}
            for condition in conditions:
                parent_key[condition.get('key')] = condition.get('value')
            final_key = tuple(parent_key.get(key) for key in behavior)
            final_tuples = [final_key]
            for i in range(max_children):
                final_tuples += [tuple(children_keys[key][i] for key in behavior)]

            for expense_category in lookup_ref_dict:
                if expense_category == 'variable_expenses':
                    for phase in lookup_ref_dict[expense_category]:
                        for phase_category in lookup_ref_dict[expense_category][phase]:
                            for lookup_code in lookup_ref_dict[expense_category][phase][phase_category]:
                                use_default_doc[expense_category][phase][
                                    phase_category] = update_lookup_values_combo_in_document(
                                        use_default_doc[expense_category],
                                        use_default_doc[expense_category][phase][phase_category], lookup_code,
                                        lookup_values_dict, phase, phase_category)

                elif expense_category == 'fixed_expenses':
                    for category in lookup_ref_dict[expense_category]:
                        for lookup_code in lookup_ref_dict[expense_category][category]:
                            use_default_doc[expense_category][category] = update_lookup_values_combo_in_document(
                                use_default_doc[expense_category],
                                use_default_doc[expense_category][category],
                                lookup_code,
                                lookup_values_dict,
                                None,
                                category,
                                var=False)
                else:
                    for lookup_code in lookup_ref_dict[expense_category]:
                        use_default_doc[expense_category] = update_lookup_values_combo_in_document(
                            use_default_doc[expense_category],
                            use_default_doc[expense_category],
                            lookup_code,
                            lookup_values_dict,
                            None,
                            None,
                            water=True)
            # use first row header as dict key for rules doc
            lookup_combined_dict[final_key] = (use_default_doc, final_tuples)
    else:
        lookup_combined_dict[None] = (default_expense_doc, final_tuples)

    return lookup_combined_dict


def update_lookup_values_combo_in_document(full_document,
                                           document,
                                           lookup_code,
                                           lookup_values_dict,
                                           phase,
                                           phase_category,
                                           var=True,
                                           water=False):
    if lookup_code in lookup_values_dict:
        value = lookup_values_dict.get(lookup_code)
        key = str(lookup_code).split('-')[-1]
        if key == 'value':
            unit_key = get_expense_unit_key(full_document, phase, phase_category, var=var, water=water)
            if type(value) is list:
                # interpolate times series data needs to be transposed to match data format of other methods
                if type(value[0]) is list:
                    value = np.transpose(value).tolist()
                else:
                    value = [value]
                for idx, unit_value in enumerate(value):
                    unit_value = 0 if unit_value is None else unit_value
                    unit_value = re.sub(r'\s', '', str(unit_value))
                    document['rows'][idx][unit_key] = f'?~{unit_value}~{key}'

            else:
                value = 0 if value is None else value
                document['rows'][0][unit_key] = f'?~{value}~{key}'
        elif key == 'unit':
            unit_key = get_expense_unit_key(full_document, phase, phase_category, var=var, water=water)
            if type(value) is list:
                value = value[0] if len(value) > 0 else ''
            if unit_key == value:
                pass
            else:
                document['lookup_unit'] = True
                for row in document['rows']:
                    row[value] = row.pop(unit_key)
        elif key == 'cap':
            if type(value) is list:
                value = value[0] if len(value) > 0 else ''
            document[key] = f'?~{value}~{key}'
        else:
            if type(value) is list:
                value = value[0] if len(value) > 0 else ''
            document[key] = value
    return document


##
def expenses_conv(exp_econ,
                  capex_econ,
                  date_dict,
                  aries_start_log,
                  user_work_stream=None,
                  lookup=False,
                  phase_workstream=set()):  # noqa: C901
    criteria_list = [
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'dates', 'entire_well_life'
    ]

    criteria_list = criteria_list + RATE_BASED_ROW_KEYS

    exp_ret = []

    var_exp = exp_econ['variable_expenses']
    fixed_exp = exp_econ['fixed_expenses']
    water_disp = exp_econ['water_disposal']

    # variable_expenses
    '''
    oil: gathering (OPC/OIL), transportation (LTC/OIL, which will also apply for ngl transportation)
    gas: processing (OPC/GAS), gathering (GPC/GAS), transportation (GTC/GAS), marketing (TRC/GAS), other (CMP/GAS)
    ngl: processing (OPC/NGL), gathering (GPC/NGL)
    drip_condensate:  processing (OPC/CND)
    gas expense based on mmbtu is not included right now (all gas expense use unit $/mcf),
    Aries doesn't have this functionality.
    '''
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        phase_keyword = get_phase_keyword(phase)

        # TODO: handle unit based on % of rev
        # unit
        if phase in ['oil', 'ngl', 'drip_condensate']:
            phase_unit = '$/B'
        else:
            phase_unit = '$/M'

        for category in ['processing', 'gathering', 'transportation', 'marketing', 'other']:
            this_var_exp = var_exp[phase][category]
            not_gross_well_head = False
            non_monotonic = False
            not_gross_well_head = this_var_exp.get(RATE_TYPE, GROSS_WELL_HEAD) != GROSS_WELL_HEAD
            non_monotonic = this_var_exp.get(ROWS_CALC_METHOD, NON_MONOTONIC) == NON_MONOTONIC

            # warnings
            expense_warnings(this_var_exp)

            # cap
            this_var_cap = this_var_exp['cap']

            # rows
            this_var_criteria_key, this_var_unit_key = criteria_process(this_var_exp, criteria_list)

            # get expense keyword and unit
            exp_keyword, phase_unit = process_var_expense_keyword(category, phase_unit, this_var_unit_key, phase,
                                                                  phase_keyword)
            if this_var_exp.get('lookup_unit', False):
                phase_unit = f'?~{phase_unit}~unit'

            # append unshrunk/shrunk ratio to gas expense when conditions met
            if this_var_exp.get(
                    'shrinkage_condition', '') == 'unshrunk' and 'dollar_per_mmbtu' in this_var_exp['rows'][0] and len(
                        this_var_exp['rows']) == 1 and not (this_var_exp['rows'][0]['dollar_per_mmbtu'] == 0):
                this_var_exp['rows'][0]['dollar_per_mmbtu'] = '@M.UNSHRUNK_BTU*' + str(
                    this_var_exp['rows'][0]['dollar_per_mmbtu'])

            if exp_keyword is not None:
                update_phase_workstream(phase_workstream, exp_keyword, this_var_unit_key, this_var_exp['rows'])
                exp_ret = process_rows(exp_ret,
                                       this_var_exp['rows'],
                                       this_var_criteria_key,
                                       this_var_unit_key,
                                       phase_unit,
                                       1,
                                       exp_keyword,
                                       this_var_cap,
                                       date_dict,
                                       aries_start_log,
                                       user_work_stream,
                                       expense_category=category,
                                       not_gross_well_head=not_gross_well_head,
                                       non_monotonic=non_monotonic)

    # fixed_expenses
    use_oh = False
    for key in fixed_exp:
        this_fixed_exp = fixed_exp[key]
        # warnings
        expense_warnings(this_fixed_exp)
        # cap
        fixed_cap = this_fixed_exp['cap']

        # expense before fpd
        fpd = False
        not_gross_well_head = False
        non_monotonic = False
        fpd = this_fixed_exp['expense_before_fpd'] == 'no'
        not_affect_econ = this_fixed_exp['affect_econ_limit'] == 'no'
        not_gross_well_head = this_fixed_exp.get(RATE_TYPE, GROSS_WELL_HEAD) != GROSS_WELL_HEAD
        non_monotonic = this_fixed_exp.get(ROWS_CALC_METHOD, NON_MONOTONIC) == NON_MONOTONIC

        # rows
        fixed_criteria_key, fixed_unit_key = criteria_process(this_fixed_exp, criteria_list)
        # set keyword to OH/T when affect econ limit is set to no (this should only be allowed once)
        fixed_keyword = FIXED_EXPENSE_KEYWORD_DICT[key][0] if not not_affect_econ and not use_oh else 'OH/T'
        if fixed_keyword == 'OH/T' and not use_oh and not lookup:
            use_oh = True

        fixed_unit = '?~$/M~unit' if this_var_exp.get('lookup_unit', False) else '$/M'
        exp_ret = process_rows(exp_ret,
                               this_fixed_exp['rows'],
                               fixed_criteria_key,
                               fixed_unit_key,
                               fixed_unit,
                               1,
                               fixed_keyword,
                               fixed_cap,
                               date_dict,
                               aries_start_log,
                               user_work_stream,
                               expense_category=get_fixed_expense_category_name(key),
                               fpd=fpd,
                               not_gross_well_head=not_gross_well_head,
                               non_monotonic=non_monotonic)

    # water_disposal
    expense_warnings(water_disp)
    # cap
    water_disp_cap = water_disp['cap']

    not_gross_well_head = False
    non_monotonic = False
    not_gross_well_head = this_var_exp.get(RATE_TYPE, GROSS_WELL_HEAD) != GROSS_WELL_HEAD
    non_monotonic = this_var_exp.get(ROWS_CALC_METHOD, NON_MONOTONIC) == NON_MONOTONIC

    # rows
    water_disp_criteria_key, water_disp_unit_key = criteria_process(water_disp, criteria_list)
    water_disposal_unit = '?~$/B~unit' if this_var_exp.get('lookup_unit', False) else '$/B'
    exp_ret = process_rows(exp_ret,
                           water_disp['rows'],
                           water_disp_criteria_key,
                           water_disp_unit_key,
                           water_disposal_unit,
                           1,
                           'OPC/WTR',
                           water_disp_cap,
                           date_dict,
                           aries_start_log,
                           user_work_stream,
                           not_gross_well_head=not_gross_well_head,
                           non_monotonic=non_monotonic)
    ### todo
    other_capex_rows = copy.deepcopy(capex_econ['other_capex']['rows'])
    for one_capex in other_capex_rows:
        if (one_capex['category'] in ABAN_SALV_DICT and 'offset_to_econ_limit' in one_capex
                and one_capex['offset_to_econ_limit'] != 0):
            tang_amt = one_capex['tangible']
            intang_amt = one_capex['intangible']
            if tang_amt != 0:
                amount = tang_amt
            elif intang_amt != 0:
                amount = intang_amt
            else:
                amount = 0
            set_keyword = ABAN_SALV_DICT.get(one_capex['category'])[1]
            if set_keyword == 'SALV':
                amount *= -1
            exp_ret.append([set_keyword, list_to_expression([amount, 'X', 'M$', 'TO', 'LIFE', 'PC 0'])])
    return exp_ret


def get_min_life_from_min_cut_off_dict(cut_off, asof_date, eoh_date):
    min_cut_off = cut_off['min_cut_off']
    if 'as_of' in min_cut_off:
        date = min_cut_off['as_of']
    elif 'date' in min_cut_off:
        date = cc_date_to_aries_date(min_cut_off['date'])
    elif 'end_hist' in min_cut_off:
        aries_eoh_date = cc_date_to_aries_date(str(eoh_date))
        if pd.to_datetime(aries_eoh_date) > pd.to_datetime(asof_date):
            date = aries_eoh_date
        else:
            date = '0'
    else:
        date = '0'
    return date


def check_no_cutoff(cut_off):
    """
    Summary:
        If no_cut_off is in the cut_off dictionary,
        return a new dictionary with only no_cut_off, min_cut_off, and side_end_phase

    Args:
        cut_off (dictionary): dictionary containing all cutoff settings
    """
    if 'no_cut_off' in cut_off:
        no_cut_off = {
            'no_cut_off': cut_off.get('no_cut_off', ''),
            'min_cut_off': cut_off.get('min_cut_off', ''),
            'side_end_phase': cut_off.get('side_end_phase', '')
        }

        return no_cut_off
    return cut_off


def get_cut_off_and_major_list(original_list, cut_off, asof_date, eoh_date, max_well_life):
    cut_off_and_major_list = []

    cut_off = check_no_cutoff(cut_off)

    if any(key in CUT_OFF_SYNTAX_DICT for key in cut_off):
        cut_off_criteria = next(key for key in cut_off if key in CUT_OFF_SYNTAX_DICT)
        aries_cut_off_criteria = CUT_OFF_SYNTAX_DICT[cut_off_criteria]
        if 'min_cut_off' in cut_off:
            date = get_min_life_from_min_cut_off_dict(cut_off, asof_date, eoh_date)
        else:
            date = '0'
        if 'discount' in cut_off:
            discount = cut_off['discount'] / 100
        else:
            discount = '0'

        if 'econ_limit_delay' in cut_off:
            el_delay = cut_off['econ_limit_delay']
        else:
            el_delay = '0'

        if 'capex_offset_to_ecl' in cut_off:
            trigger = True if cut_off['capex_offset_to_ecl'] == 'yes' else False
        else:
            trigger = False

        if trigger and (float(el_delay) != 0 or str(date) != '0'):
            aries_cut_off_criteria = 'OPINC'

        if trigger and aries_cut_off_criteria == 'OPINC' and float(el_delay) == 0 and date == '0':
            el_delay = '1'

        if 'include_capex' in cut_off:
            include_capex = True if cut_off['include_capex'] == 'yes' else False
        else:
            include_capex = False
        if float(discount) == 0 and aries_cut_off_criteria == 'PMAX':
            discount = '0.001'
        if include_capex:
            if aries_cut_off_criteria in ['PMAX', 'OK']:
                cut_off_and_major_list.append(
                    ['ELOSS', f'{aries_cut_off_criteria} {el_delay} 0 {format_digits(discount)} {date}'])
            else:
                cut_off_and_major_list.append([TEXT, 'CAPEX WILL NOT BE INCLUDED'])
                cut_off_and_major_list.append(
                    ['ELOSS', f'{aries_cut_off_criteria} {el_delay} 0 {format_digits(discount)} {date}'])
        else:
            if aries_cut_off_criteria in ['PMAX']:
                if discount == '0.001':
                    el_delay = '1' if float(el_delay) == 0 and trigger and date == '0' else el_delay
                    cut_off_and_major_list.append(['ELOSS', f'OPINC {el_delay} 0 {format_digits(discount)} {date}'])
                else:
                    cut_off_and_major_list.append([TEXT, 'ARIES WILL INCLUDE CAPEX IN ECON LIMIT CALC.'])
                    cut_off_and_major_list.append(
                        ['ELOSS', f'{aries_cut_off_criteria} {el_delay} 0 {format_digits(discount)} {date}'])
            else:
                cut_off_and_major_list.append(
                    ['ELOSS', f'{aries_cut_off_criteria} {el_delay} 0 {format_digits(discount)} {date}'])
    else:
        if 'first_negative_cash_flow' in cut_off:
            if 'min_cut_off' in cut_off and 'econ_limit_delay' in cut_off:
                min_cut_off = cut_off['min_cut_off']
                el_delay = cut_off['econ_limit_delay']

                if 'none' in min_cut_off and el_delay == 0:
                    cut_off_and_major_list.append([TEXT, 'FIRST NEGATIVE CASH FLOW AND PMAX MAY NOT MATCH'])
                    cut_off_and_major_list.append(['ELOSS', 'PMAX'])
                else:
                    min_life = get_min_life_from_min_cut_off_dict(cut_off, asof_date, eoh_date)
                    cut_off_and_major_list.append([TEXT, 'FIRST NEG. CASH FLOW AND OPINC MAY NOT MATCH'])
                    cut_off_and_major_list.append(['ELOSS', f'OPINC {el_delay} 0 0 {min_life}'])
        elif 'date' in cut_off:
            original_list = update_life_with_date_cutoff(original_list, max_well_life, asof_date, eoh_date, cut_off)
        else:
            if any('_rate' in key for key in cut_off):
                rate_key = next(key for key in cut_off if '_rate' in key)
                if cut_off[rate_key] == 1e-20:
                    cut_off_and_major_list.append(['ELOSS', 'OK'])
                else:
                    cut_off_and_major_list.append([TEXT, 'RATE CUT-OFF NOT IN ARIES, USING PMAX'])
                    cut_off_and_major_list.append(['ELOSS', 'PMAX'])
            else:
                cut_off_and_major_list.append([TEXT, 'RATE CUT-OFF NOT IN ARIES, USING PMAX'])
                cut_off_and_major_list.append(['ELOSS', 'PMAX'])

    return cut_off_and_major_list


def update_life_with_date_cutoff(original_list, max_well_life, asof_date, eoh_date, cut_off):
    '''
    original_list (list): List of all ARIES lines prior to function update
    max_well_life (float or None): Max Economic life of well
    asof_date (str): ASOF date or effective date
    cut_off (dict): Dictionary containing Econ cut-off information
    '''
    # check if asof date value is present
    if asof_date:
        # find years between date cut off and asof date
        new_life = get_life_of_well_based_on_date_cut_off(cut_off, asof_date, eoh_date)
    # check if max well life is not None
    if max_well_life is not None:
        # if new life is positive and less than the original max well life, process to update LIFE line and add
        # text message for user
        if new_life < max_well_life and new_life > 0:
            for idx, aries_line in enumerate(original_list):
                if 'LIFE' in aries_line:
                    life_idx = idx
                    break
            original_list[life_idx] = ['LIFE', f'{new_life} EFF']
            original_list.insert(life_idx, [TEXT, 'DATE CUTOFF SHORTER THAN MAX ECON LIFE'])
            original_list.append(['ELOSS', 'OK'])
    return original_list


def get_life_of_well_based_on_date_cut_off(cut_off, asof_date, eoh_date):
    new_life = round(float((pd.to_datetime(cut_off['date']) - pd.to_datetime(asof_date)).days / DAYS_IN_YEAR), 4)
    # get_min_cut_off
    if 'min_cut_off' in cut_off:
        min_life = get_min_life_from_min_cut_off_dict(cut_off, asof_date, eoh_date)
        if min_life == '0':
            pass
        elif pd.isnull(pd.to_datetime(str(min_life), errors='coerce')):
            month_shift = round(float(min_life) / MONTHS_IN_YEAR, 4)
            if month_shift > new_life:
                new_life = month_shift
        else:
            min_life_yr = round(float((pd.to_datetime(min_life) - pd.to_datetime(asof_date)).days / DAYS_IN_YEAR), 4)
            if min_life_yr > new_life:
                new_life = min_life_yr
    return new_life


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


def process_opnet_lnri(ownership_reversion_econ, cut_off, cut_off_and_major_list):
    use_opnet = False
    orri_detected = False
    reversion_detected = False
    if 'capex_offset_to_ecl' in cut_off:
        trigger = True if cut_off['capex_offset_to_ecl'] == 'yes' else False
    else:
        trigger = False
    initial_ownership = ownership_reversion_econ['ownership']['initial_ownership']
    wi = initial_ownership['working_interest']
    nri = initial_ownership['original_ownership']['net_revenue_interest']
    lnri = initial_ownership['original_ownership']['lease_net_revenue_interest']
    # assume true before checks
    calc_lnri_and_given_lnri_near_equal = True
    if wi == 0:
        use_opnet = True
        orri_detected = True
    else:
        calc_lnri_and_given_lnri_near_equal = check_near_equality(nri / wi, lnri / 100)
    if not calc_lnri_and_given_lnri_near_equal:
        use_opnet = True
    for key in ownership_reversion_econ['ownership']:
        if key != 'initial_ownership':
            if 'no_reversion' in ownership_reversion_econ['ownership'][key]:
                break
            reversion_detected = True
            wi = ownership_reversion_econ['ownership'][key]['working_interest']
            nri = ownership_reversion_econ['ownership'][key]['original_ownership']['net_revenue_interest']
            lnri = ownership_reversion_econ['ownership'][key]['original_ownership']['lease_net_revenue_interest']
            # assume true before check
            calc_lnri_and_given_lnri_near_equal = True
            if wi == 0:
                use_opnet = True
                orri_detected = True
            else:
                calc_lnri_and_given_lnri_near_equal = check_near_equality(nri / wi, lnri / 100)
            # if at any point in time the calculated lnri is not equal to the given lnri, it uses opnet
            if not calc_lnri_and_given_lnri_near_equal:
                use_opnet = True
    if use_opnet:
        cut_off_and_major_list = add_opnet_lines(cut_off_and_major_list, lnri, reversion_detected, orri_detected,
                                                 trigger)
    return cut_off_and_major_list


def add_opnet_lines(cut_off_and_major_list, lnri, reversion_detected, orri_detected, trigger):
    new_cut_off_and_major_list = []
    for ls in cut_off_and_major_list:
        if 'ELOSS' in ls:
            if reversion_detected:
                new_cut_off_and_major_list.append([TEXT, 'REV. DETECTED, LAST REV. LNRI USED'])
            if orri_detected:
                new_cut_off_and_major_list.append([TEXT, 'ORRI DETECTED'])
            # extra fail safe for cutoff keyword check
            try:
                cutoff_keyword = ls[1].split()[0]
            except IndexError:
                cutoff_keyword = None
            if cutoff_keyword not in ['OPINC', 'OK']:
                new_cut_off_and_major_list.append([TEXT, 'OPNET ONLY WORKS WITH OPINC'])
                if trigger:
                    new_cut_off_and_major_list.append(['ELOSS', 'OPINC 1 0 0 0'])
                else:
                    new_cut_off_and_major_list.append(['ELOSS', 'OPINC'])
            else:
                new_cut_off_and_major_list.append(ls)
        elif TEXT not in ls:
            new_cut_off_and_major_list.append(ls)
    try:
        lnri = format_digits(lnri)
    except ValueError:
        pass
    new_cut_off_and_major_list.append(['OPNET', f'{lnri} {lnri} {lnri}'])
    return new_cut_off_and_major_list


def process_capex_abandonment_delay(other_capex_rows, cut_off_and_major_list, cutoff_changed=False):
    abandon_salvage_idx = None
    offset_different = False
    for one_capex in other_capex_rows:
        if (one_capex['category'] in ABAN_SALV_DICT and 'offset_to_econ_limit' in one_capex
                and one_capex['offset_to_econ_limit'] != 0):
            offset = one_capex['offset_to_econ_limit']
            set_keyword = ABAN_SALV_DICT.get(one_capex['category'])[-1]
            offset_mo = round(float(offset) / DAYS_IN_MONTH, ROUND_DIGIT) if offset != 0 else None
            offset_line = [set_keyword, f'{offset_mo} MOS']
            if offset_mo is not None:
                if cut_off_and_major_list != [[]] and cut_off_and_major_list != []:
                    if any(set_keyword == row[0] for row in cut_off_and_major_list):
                        abandon_salvage_idx = next(idx for idx, row in enumerate(cut_off_and_major_list)
                                                   if row[0] == set_keyword)
                        # check if incoming offset is different from existing offset
                        offset_different = cut_off_and_major_list[abandon_salvage_idx] != offset_line
                        cut_off_and_major_list[abandon_salvage_idx] = offset_line
                    else:
                        cut_off_and_major_list.append(offset_line)
                        cutoff_changed = True
                else:
                    cut_off_and_major_list.append(offset_line)
                    cutoff_changed = True
    # report error if multiple different offsets are detected
    if abandon_salvage_idx is not None and offset_different:
        cut_off_and_major_list.insert(abandon_salvage_idx, [ERROR, f'MULTIPLE {set_keyword} DELAYS DETECTED'])
        cutoff_changed = True
    return cut_off_and_major_list, cutoff_changed


def add_major_keyword_if_necessary(cut_off_and_major_list, main_phase, cut_off):
    set_major = False
    if 'side_phase_end' in cut_off:
        set_major = True if cut_off['side_phase_end'] == 'yes' else False
    # major
    if set_major and main_phase is not None:
        cut_off_and_major_list.append(['MAJOR', main_phase.upper()])

    return cut_off_and_major_list


def generate_ecl_id(parent_id, ecl_links):
    """Create ID for ECL link based off inptID if ID doesn't already exist.

    Args:
        parent_id (str): INPT id of well the end date comes from
        ecl_links (dict): dictionary of ecl well info with link_id as the key
    """
    # create initial link_id
    link_id = 'C' + parent_id[-3:]
    num = 1
    format_num = f'{num:04d}'
    # check if ID already exists in ecl_links
    if link_id + format_num in ecl_links:
        match_found = ecl_links.get(link_id + format_num, {'parent_id': None}).get('parent_id') == parent_id

        # increment num until match is found or unused ID is found
        while not match_found:
            num += 1
            format_num = f'{num:04d}'
            next_id = ecl_links.get(link_id + format_num, {'parent_id': None}).get('parent_id')
            match_found = next_id == parent_id or next_id is None

    return link_id + format_num


######## dates and stream_properties conversion (section 2 in Aries)
#### dates (section 2)
def dates_conv(context, dates_econ, ownership_reversion_econ, capex_econ, well_header, production_data, forecast_data,
               pct_key_by_phase, min_base_date, project_id, scenario_id, well_id_link, combos, ecl_links):
    # date_dict
    dates_setting = dates_econ['dates_setting']

    ## main phase
    main_phase = get_main_phase(forecast_data, well_header, pct_key_by_phase)

    ## real_fpd
    miss_fpd = False
    uses_linked_ecl = False
    try:
        real_fpd, uses_linked_ecl = get_fpd_from_source(dates_setting, well_header, production_data, forecast_data,
                                                        pct_key_by_phase)
    except WellHeaderError:
        real_fpd = DEFAULT_FPD
        miss_fpd = True

    # Linked well's INPT ID will be stored in uses_linked_ecl if present
    if uses_linked_ecl:

        link_id = generate_ecl_id(uses_linked_ecl, ecl_links)
        assignment_link = False
        # if link already created, add well to list
        if link_id in ecl_links:
            ecl_link = ecl_links.get(link_id)
            ecl_link.get('wells').append(well_header.get('inptID'))
            real_fpd = ecl_link.get('fpd_date')
        else:
            # find assignment link for given INPT well ID
            for well in well_id_link:
                if well_id_link[well]['inpt_id'] == uses_linked_ecl:
                    assignment_link = well_id_link[well]['assignment_id']
                    break
            if assignment_link:
                well_econ, error_message = run_econ_for_independent_well(context, project_id, ObjectId(scenario_id),
                                                                         assignment_link, combos)
                real_fpd = well_econ.get('cut_off_date')
                ecl_links[link_id] = {
                    'parent_id': uses_linked_ecl,
                    'fpd_date': real_fpd,
                    'wells': [well_header.get('inptID')],
                }
                # use inptID as ecl keyword

            else:
                # log error message for missing assignment link to targeted well
                real_fpd = DEFAULT_FPD
                miss_fpd = True

    ## fsg
    fsd = get_fsg(forecast_data, main_phase, real_fpd, pct_key_by_phase)

    ##
    as_of_date, discount_date, _ = process_dates_setting(dates_setting, real_fpd, fsd)

    # will be update in subsequent function
    eoh_date = get_end_of_historic_production(as_of_date, main_phase, production_data)

    ##
    if min_base_date is None:
        base_date = pd.to_datetime(get_base_date(as_of_date, min_base_date)).strftime('%Y-%m-%d')
    else:
        base_date = min_base_date

    date_dict = {
        'offset_to_fpd': str(real_fpd),
        'offset_to_as_of_date': str(as_of_date),
        'offset_to_first_segment': str(fsd),
        'offset_to_discount_date': str(discount_date),
        'offset_to_end_history': str(eoh_date),
    }

    date_dict['base_date'] = update_base_date_from_well_dates(date_dict, base_date)

    cut_off_and_major_list = []

    if miss_fpd:
        cut_off_and_major_list.append(['TEXT', 'CC_ERROR: NO FPD'])

    # well life
    try:
        max_well_life = float(dates_econ['dates_setting']['max_well_life'])
    except ValueError:
        max_well_life = None

    if max_well_life is not None:
        cut_off_and_major_list.append(['LIFE', f'{format_digits(max_well_life)} EFF'])

    # process cutoff
    cut_off = dates_econ['cut_off']
    cut_off_and_major_list = add_major_keyword_if_necessary(cut_off_and_major_list, main_phase, cut_off)
    append_ls = get_cut_off_and_major_list(cut_off_and_major_list, cut_off, as_of_date, eoh_date, max_well_life)
    if len(append_ls) > 0:
        for ls in append_ls:
            cut_off_and_major_list.append(ls)

    # apply opnet if condition is met
    cut_off_and_major_list = process_opnet_lnri(ownership_reversion_econ, cut_off, cut_off_and_major_list)

    other_capex_rows = copy.deepcopy(capex_econ['other_capex']['rows'])

    # process capex abandonment delay into section 2
    cut_off_and_major_list, _ = process_capex_abandonment_delay(other_capex_rows, cut_off_and_major_list)

    return date_dict, cut_off_and_major_list, main_phase, min_base_date, uses_linked_ecl, ecl_links


def update_base_date_from_well_dates(date_dict, base_date):
    for date in date_dict.values():
        if pd.to_datetime(date, errors='coerce') < pd.to_datetime(base_date, errors='coerce'):
            base_date = date
    return base_date


#### stram_properties (section 2)
def get_gas_loss_flare_mul(loss_flare):
    gas_loss = loss_flare['gas_loss']['rows'][0]['pct_remaining'] / 100
    gas_flare = loss_flare['gas_flare']['rows'][0]['pct_remaining'] / 100
    gas_loss_flare_mul = gas_loss * gas_flare
    return gas_loss_flare_mul


def btu_shrink_conv(this_assump_econ, btu_bool, well_header, cut_off_and_major):
    shrink_btu_ret = []
    ## btu content
    shrink_rows = this_assump_econ['shrinkage']['gas']['rows']
    output_line = []
    shrink_count = len(shrink_rows)
    # store shrink into master table and link to well
    if shrink_count == 1 and shrink_rows[0]['pct_remaining'] != 100:
        shrink = format_digits(shrink_rows[0]['pct_remaining'] / 100)
        output_line = ['SHRINK', '@M.SHRINK']
        shrink_btu_ret.append(output_line)
        cut_off_and_major.append(output_line)
        well_header['SHRINK'] = shrink
    if btu_bool is True:
        shrunk_gas_btu = this_assump_econ['btu_content']['shrunk_gas']
        output_line = ['BTU', list_to_expression([str(shrunk_gas_btu / 1000)])]
        shrink_btu_ret.append(output_line)
        cut_off_and_major.append(output_line)
        well_header['UNSHRUNK_BTU'] = this_assump_econ['btu_content']['unshrunk_gas'] / 1000
    return shrink_btu_ret


def production_taxes_overlay_conv(prod_tax_econ, date_dict, aries_start_log, user_work_stream=None):
    ret_list = []
    ad_tax = prod_tax_econ['ad_valorem_tax']
    se_tax = prod_tax_econ['severance_tax']

    ret_list = handle_deduct_severance_tax(ret_list, ad_tax, se_tax, date_dict, aries_start_log)
    # ret_list = handle_wi_tax(ret_list, ad_tax, se_tax)

    return ret_list


def handle_wi_tax(ret_list, ad_tax, se_tax):
    if ad_tax['calculation'] == 'wi':
        text = 'CC TO ARIES DOES NOT HANDLE ADVAL TAX CALCULATION BASED ON WI'
        ret_list += [[TEXT, text]]
    if se_tax['calculation'] == 'wi':
        text = 'CC TO ARIES DOES NOT HANDLE SEV. TAX CALCULATION BASED ON WI'
        ret_list += [[TEXT, text]]
    return ret_list


def check_invalid_key_for_deduct_sev_tax(tax_unit_key_list, tax):
    not_found = True
    for tax_unit_key in tax_unit_key_list:
        if tax_unit_key in ['dollar_per_month', 'dollar_per_boe']:
            rows = tax['rows']
            for row in rows:
                if row[tax_unit_key] != 0:
                    not_found = False
                    break
    return not_found


def check_for_atx_total(ad_tax, se_tax, criteria_list):
    handled = True
    ad_criteria_key, ad_unit_key_list = criteria_process(ad_tax, criteria_list, tax=True)
    handled = check_invalid_key_for_deduct_sev_tax(ad_unit_key_list, ad_tax)
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        se_phase_criteria_key, se_phase_unit_key_list = criteria_process(se_tax[phase], criteria_list, tax=True)
        handled = check_invalid_key_for_deduct_sev_tax(se_phase_unit_key_list, se_tax[phase])
        if not handled:
            break
    return handled


def handle_deduct_severance_tax(ret_list, ad_tax, se_tax, date_dict, aries_start_log):
    handled = True
    criteria_list = [
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'dates', 'entire_well_life'
    ]
    criteria_list += RATE_BASED_ROW_KEYS

    # rows
    ad_criteria_key, ad_unit_key_list = criteria_process(ad_tax, criteria_list, tax=True)
    handled = check_for_atx_total(ad_tax, se_tax, criteria_list)

    if handled and 'pct_of_revenue' in ad_unit_key_list and ad_tax['deduct_severance_tax'] == 'no':
        rows = ad_tax['rows']
        try:
            first_pct_rev = rows[0]['pct_of_revenue']
        except (ValueError, TypeError):
            first_pct_rev = 0
        if not (first_pct_rev == 0 and len(rows) == 1):
            row_keys = list(rows[0].keys())
            criteria = list(set(row_keys) & set(criteria_list))[0]
            if criteria == 'entire_well_life':
                incoming_start = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
            elif criteria == 'dates':
                incoming_start = cc_date_to_aries_date(rows[0]['dates']['start_date'], date_dict)
            elif criteria in RATE_BASED_ROW_KEYS:
                incoming_start = 'RATE'
            else:
                incoming_start = cc_date_to_aries_date(date_dict[criteria], date_dict)
            ret_list = aries_start_log.add_start_and_update_current_start(incoming_start,
                                                                          ret_list,
                                                                          date_dict,
                                                                          criteria=criteria)
            text = 'SEVERANCE TAX NOT DEDUCTED BEFORE AD VAL TAX CALC.'
            ret_list += [[TEXT, text]]
            rows = get_loop_rows(rows, criteria)
            for idx, row in enumerate(rows):
                if idx == 0:
                    keyword = 'S/1064'
                else:
                    keyword = '"'
                # limit_value, limit_unit
                limit_value, limit_unit = get_limit_value_and_unit(criteria, row, rows, idx, date_dict)
                if limit_unit in ['MPD', 'BPD', 'WTR']:
                    ret_list += [[TEXT, 'CANNOT COMBINE RATE CUT OFF WITH NO SEV. TAX DEDUCT BEFORE ADVAL TAX DEDUCT']]
                    ret_list += [[TEXT, 'SEV TAX WILL BE DEDUCTED BEFORE ADVAL TAX DEDUCT']]
                    break
                ret_list = check_for_water_rate_cut_off(ret_list, limit_unit, keyword, criteria)

                try:
                    value = float(row['pct_of_revenue']) / 100
                except (ValueError, TypeError):
                    value = 0
                ret_list += [[
                    keyword,
                    list_to_expression([format_digits(value), 'X', 'FRAC', limit_value, limit_unit, 'MUL', 'S/861'])
                ]]
    return ret_list


def expenses_overlay_conv(exp_econ, date_dict, aries_start_log, user_work_stream=None, lookup=False):
    shared_fixed_expense_usage = {
        ('other_monthly_cost_1', 'gathering'): False,
        ('other_monthly_cost_2', 'transportation'): False,
        ('other_monthly_cost_4', 'marketing'): False,
        ('other_monthly_cost_6', 'other'): False,
    }

    ret_list = []
    var_exp = exp_econ['variable_expenses']
    fixed_exp = exp_econ['fixed_expenses']

    ret_list = check_rev_expense_combination_keyword_error(ret_list, var_exp)
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        ret_list = check_phase_expense_combination_keyword_error(ret_list, var_exp, phase)

        for category in ['processing', 'gathering', 'transportation', 'marketing', 'other']:
            ret_list = check_deal_term_use(ret_list, var_exp, phase, category, lookup, user_work_stream)
            ret_list = check_calc_nri_use(ret_list, var_exp, phase, category, lookup, user_work_stream)
            if phase in ['oil', 'gas']:
                ret_list = check_shrunk_use(ret_list, var_exp, phase, category, usage=shared_fixed_expense_usage)

    phase = None
    use_oh = False
    for fixed_category in FIXED_EXPENSE_KEYWORD_DICT:
        # use OH/T stream number if affect_econ_limit is set to NO
        # stream key is set to use_category and used to get the stream from the dictionary
        use_category = fixed_category
        if fixed_exp[fixed_category]['affect_econ_limit'] == 'no' and not use_oh and not lookup:
            use_category = 'other_cost'
            use_oh = True
        ret_list = check_deal_term_use(ret_list,
                                       fixed_exp,
                                       phase,
                                       fixed_category,
                                       lookup,
                                       user_work_stream,
                                       var=False,
                                       use_category=use_category)
        ret_list = check_calc_nri_use(ret_list,
                                      fixed_exp,
                                      phase,
                                      fixed_category,
                                      lookup,
                                      user_work_stream,
                                      var=False,
                                      use_category=use_category)
    ret_list = add_ret_list_for_shared_variable_and_fixed_expense(ret_list, fixed_exp, shared_fixed_expense_usage)

    return ret_list


def check_rev_expense_combination_keyword_error(ret_list, exp, var=True):
    # loop through the expense options currently handled in overlay
    for expense_options in ['deal_terms', 'calculation']:
        current_rev_error_expense_check = copy.deepcopy(REV_ERROR_EXPENSE_CHECK)
        for criteria_unit_key in ['pct_of_oil_rev', 'pct_of_gas_rev', 'pct_of_ngl_rev']:
            for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                for category in ['processing', 'gathering', 'transportation', 'marketing', 'other']:
                    unit_key = get_expense_unit_key(exp, phase, category, var=var)
                    if unit_key != criteria_unit_key:
                        continue
                    else:
                        if not (len(exp[phase][category]['rows']) == 1
                                and exp[phase][category]['rows'][-1][unit_key] == 0):
                            keyword = VAR_REV_EXPENSE_KEYWORD_DICT.get((criteria_unit_key, category))
                            if keyword is None:
                                continue
                            else:
                                standard_value = current_rev_error_expense_check.get(keyword)
                                if standard_value is None:
                                    current_rev_error_expense_check[keyword] = exp[phase][category][expense_options]
                                else:
                                    if standard_value != exp[phase][category][expense_options]:
                                        # get expense option name to be used for report
                                        options_name = EXPENSE_OPTIONS_NAME_CONVERSION.get(expense_options)
                                        # get revenue type name
                                        revenue_name = REV_UNIT_NAME_CONVERSION.get(criteria_unit_key)
                                        input_text = f'{revenue_name} HAS DIFFERENT SELECTION FOR {options_name}'
                                        if [ERROR, input_text] not in ret_list:
                                            ret_list += [[ERROR, input_text]]
                                        break
    return ret_list


def add_ret_list_for_shared_variable_and_fixed_expense(ret_list, fixed_exp, shared_fixed_expense_usage):
    use_oh = False
    # if the affect econ limit is set to no, ignore this check
    for category, is_used in shared_fixed_expense_usage.items():
        if not use_oh and fixed_exp[category[0]]['affect_econ_limit'] == 'no':
            use_oh = True
            continue
        rows = fixed_exp[category[0]]['rows']
        unit_key = get_expense_unit_key(fixed_exp, None, category[0], var=False)
        if (not (len(rows) == 1 and rows[0][unit_key] == 0)) and is_used:
            keyword = ARIES_EXPENSE_STREAM_CODE.get(('gas', category[-1]))[-1]
            sum_keyword = ARIES_EXPENSE_STREAM_CODE.get(category[0])
            ret_list += [[
                f'S/{keyword}',
                list_to_expression([f'S/{sum_keyword}', 'X', 'FRAC', 'TO', 'LIFE', 'PLUS', f'S/{keyword}'])
            ]]
    return ret_list


def check_phase_expense_combination_keyword_error(ret_list, exp, phase, var=True):
    # loop through the expense options currently handled in overlay
    for expense_options in ['deal_terms', 'shrinkage_condition', 'calculation']:
        # loop through the various categories to be checked according to the phase
        if expense_options == 'shrinkage_condition' and phase in ['ngl', 'drip_condensate']:
            continue
        for category in EXPENSE_ERROR_CHECK_DICT.get(phase):
            # get the unit key for processing and other category
            unit_key = get_expense_unit_key(exp, phase, category, var=var)
            processing_unit_key = get_expense_unit_key(exp, phase, 'processing', var=var)
            # check if the processing category and the select category have beeen altered from default
            if (not (len(exp[phase][category]['rows']) == 1 and exp[phase][category]['rows'][-1][unit_key] == 0)) and (
                    not (len(exp[phase]['processing']['rows']) == 1
                         and exp[phase]['processing']['rows'][-1][processing_unit_key] == 0)) and 'rev' not in unit_key:
                # check if processing and selected category are the same
                #special handle for deal terms due to optional nature
                exp[phase][category][expense_options] = 1 if (
                    expense_options == 'deal_terms'
                    and exp[phase][category][expense_options] == '') else exp[phase][category][expense_options]
                exp[phase]['processing'][expense_options] = 1 if (
                    expense_options == 'deal_terms'
                    and exp[phase]['processing'][expense_options] == '') else exp[phase]['processing'][expense_options]
                if exp[phase][category][expense_options] != exp[phase]['processing'][expense_options]:
                    # get expense option name to be used for report
                    options_name = EXPENSE_OPTIONS_NAME_CONVERSION.get(expense_options)
                    # get category name to be used for report
                    category_name = CATEGORY_NAME_CONVERSION.get(category)
                    # add explanatory text
                    ret_list += [[ERROR, f'{options_name} FOR G & P used for {category_name} ({phase.upper()})']]
                    # make ARIES run break so that user can see the issue
                    error_text = (f'NO EXCLUSIVE STREAM FOR {category_name} EXP. for {phase.upper()[:PHASE_TEXT_LIM]}')
                    ret_list += [[ERROR, error_text]]
    return ret_list


def check_deal_term_use(ret_list, exp, phase, category, lookup, user_work_stream, var=True, use_category=None):
    unit_key = get_expense_unit_key(exp, phase, category, var=var)
    if unit_key is not None:
        if var:
            if not (len(exp[phase][category]['rows']) == 1 and exp[phase][category]['rows'][-1][unit_key] == 0):
                try:
                    deal_term_value = float(exp[phase][category]['deal_terms'])
                except (ValueError, TypeError):
                    deal_term_value = 1
                if deal_term_value != 1:
                    stream_code = ARIES_EXPENSE_STREAM_CODE.get((phase, category))
                    if 'rev' in unit_key:
                        stream_code = ARIES_REV_EXPENSE_STREAM_CODE.get((unit_key, category))
                    if stream_code is not None:
                        keyword = f'S/{stream_code[0]}'
                        text = f'PAYING WI ÷ EARNING WI {category.upper()} EXPENSE ({phase.upper()})'
                        input = [keyword, f'{format_digits(deal_term_value)} X FRAC TO LIFE MUL {keyword}']
                        if input not in ret_list:
                            ret_list += [[TEXT, text]]
                            ret_list += [input]
        else:
            if not (len(exp[category]['rows']) == 1 and exp[category]['rows'][-1][unit_key] == 0):
                try:
                    deal_term_value = float(exp[category]['deal_terms'])
                except (ValueError, TypeError):
                    deal_term_value = 1
                if deal_term_value != 1:
                    stream_code = ARIES_EXPENSE_STREAM_CODE.get(use_category)
                    if stream_code is not None:
                        text = f'PAYING WI ÷ EARNING WI {category.upper()} (FIXED)'
                        keyword = f'S/{stream_code}'
                        input = [keyword, f'{format_digits(deal_term_value)} X FRAC TO LIFE MUL {keyword}']
                        if input not in ret_list:
                            text = f'PAYING WI ÷ EARNING WI {category.upper()} (FIXED)'
                            ret_list += [[TEXT, text]]
                            ret_list += [input]

    return ret_list


def check_shrunk_use(ret_list, exp, phase, category, usage={}):
    unit_key = get_expense_unit_key(exp, phase, category)
    if unit_key is not None:
        if not (len(exp[phase][category]['rows']) == 1
                and exp[phase][category]['rows'][-1][unit_key] == 0) and 'rev' not in unit_key:
            if exp[phase][category]['shrinkage_condition'] == 'unshrunk':
                stream_code = ARIES_EXPENSE_STREAM_CODE.get((phase, category))
                if stream_code is not None:
                    fore_keyword = f'S/{stream_code[0]}'
                    keyword = f'S/{stream_code[1]}'
                    text = f'UNSHRUNK VALUE SELECTED IN {category.upper()} EXPENSE ({phase.upper()})'
                    if phase == 'gas':
                        rear_keyword = 'S/371'
                    else:
                        rear_keyword = 'S/370'
                    input = [keyword, f'{fore_keyword} X FRAC TO LIFE MUL {rear_keyword}']
                    if input not in ret_list:
                        ret_list += [[TEXT, text]]
                        ret_list += [input]
                        update_shared_expense_keyword_dict(category, phase, usage)

    return ret_list


def check_calc_nri_use(ret_list, exp, phase, category, lookup, user_work_stream, var=True, use_category=None):
    unit_key = get_expense_unit_key(exp, phase, category, var=var)
    if unit_key is not None:
        if var:
            if not (len(exp[phase][category]['rows']) == 1 and exp[phase][category]['rows'][-1][unit_key] == 0):
                if exp[phase][category]['calculation'] in EXPENSE_CALC_OPTION_STREAM_DICT:
                    calc_method = exp[phase][category]['calculation']
                    stream_code = ARIES_EXPENSE_STREAM_CODE.get((phase, category))
                    ret_list = add_calc_options_line(ret_list, stream_code, category, calc_method, unit_key, phase,
                                                     lookup, user_work_stream)
        else:
            if not (len(exp[category]['rows']) == 1 and exp[category]['rows'][-1][unit_key] == 0):
                if exp[category]['calculation'] in EXPENSE_CALC_OPTION_STREAM_DICT:
                    calc_method = exp[category]['calculation']
                    stream_code = ARIES_EXPENSE_STREAM_CODE.get(use_category)
                    ret_list = add_calc_options_line(ret_list,
                                                     stream_code,
                                                     category,
                                                     calc_method,
                                                     unit_key,
                                                     phase,
                                                     lookup,
                                                     user_work_stream,
                                                     fixed=True)

    return ret_list


def get_expense_overlay_keywords_and_expense_type(stream_code, category, unit_key, phase, fixed):
    keyword, rear_keyword, expense_type = None, None, None
    expense_type = '(FIXED)' if fixed else ''
    if fixed and stream_code is not None:
        keyword = f'S/{stream_code}'
        rear_keyword = 'S/145'
    elif not fixed:
        if 'rev' in unit_key:
            stream_code = ARIES_REV_EXPENSE_STREAM_CODE.get((unit_key, category))
        if stream_code is not None:
            if stream_code[0] == 256:
                keyword = 'S/1022'
            else:
                keyword = f'S/{stream_code[0]}'
            if phase == 'gas':
                rear_keyword = 'S/146'
            elif keyword == 'S/1022':
                rear_keyword = 'S/819'
            else:
                rear_keyword = 'S/145'
    return keyword, rear_keyword, expense_type


def update_shared_expense_keyword_dict(category, phase, usage_dict):
    if phase == 'gas' and usage_dict:
        if any(key[-1] == category for key in usage_dict):
            update_key = next(key for key in usage_dict if key[-1] == category)
            usage_dict[update_key] = True


def get_expense_stream_keyword(user_work_stream, phase, category, count):
    workstream_keyword = user_work_stream.get_expense_work_stream(phase, category, count)
    if workstream_keyword is None:
        return [[TEXT, 'TOO MANY LOOKUPS IN MODEL']], False
    else:
        return f'S/{workstream_keyword}', True


def add_calc_options_line(ret_list,
                          stream_code,
                          category,
                          calc_method,
                          unit_key,
                          phase,
                          lookup,
                          user_work_stream,
                          fixed=False):
    keyword, rear_keyword, expense_type = get_expense_overlay_keywords_and_expense_type(
        stream_code, category, unit_key, phase, fixed)
    fore_keyword = keyword
    if keyword is not None and rear_keyword is not None and expense_type is not None:
        work_stream = user_work_stream.get_overlay_work_stream(type=calc_method)
        if work_stream is None:
            ret_list += [[ERROR, 'OUT OF USER WORK STREAMS']]
            return ret_list
        phase_keyword = get_phase_keyword(phase)
        if calc_method == 'nri':
            text = f'NRI BASED CALCULATION SELECTED IN {category.upper()} {expense_type} ({phase_keyword})'
            input = [keyword, f'{fore_keyword} X FRAC TO LIFE MUL {rear_keyword}']
            if input not in ret_list:
                ret_list += [[TEXT, text]]
                ret_list += [input]
        elif calc_method == '100_pct_wi':
            text = f'100% WI BASED CALCULATION SELECTED IN {category.upper()} ({phase_keyword})'
            input = [keyword, f'{fore_keyword} X FRAC TO LIFE DIV S/95']
            if input not in ret_list:
                ret_list += [[TEXT, text]]
                ret_list += [input]
        elif calc_method == 'one_minus_nri':
            text = f'(1 - NRI) BASED CALCULATION SELECTED IN {category.upper()} {expense_type} ({phase_keyword})'
            rear_keyword = 'S/145' if rear_keyword == 'S/819' else rear_keyword
            stream_math_lines = [[f'S/{work_stream}', f'1 X FRAC TO LIFE MINUS {rear_keyword}'],
                                 [f'S/{work_stream}', f'S/{work_stream} X FRAC TO LIFE DIV S/95']]
            input = [keyword, f'{fore_keyword} X FRAC TO LIFE MUL S/{work_stream}']
            if input not in ret_list:
                ret_list = [*ret_list, [TEXT, text], *stream_math_lines, input]
        elif calc_method == 'one_minus_wi':
            text = f'(1 - WI) BASED CALCULATION SELECTED IN {category.upper()} ({phase_keyword})'
            input = [keyword, f'{fore_keyword} X FRAC TO LIFE MUL S/{work_stream}']
            if input not in ret_list:
                ret_list += [[TEXT, text]]
                ret_list.append([f'S/{work_stream}', '1 X FRAC TO LIFE MINUS S/95'])
                ret_list += [input]
        elif calc_method == 'wi_minus_1':
            text = f'(WI - 1) BASED CALCULATION SELECTED IN {category.upper()} ({phase_keyword})'
            input = [keyword, f'{fore_keyword} X FRAC TO LIFE MUL S/{work_stream}']
            if input not in ret_list:
                ret_list += [[TEXT, text]]
                ret_list.append([f'S/{work_stream}', 'S/95 X FRAC TO LIFE MINUS 1'])
                ret_list += [input]
        elif calc_method == 'nri_minus_1':
            text = f'(NRI - 1) BASED CALCULATION SELECTED IN {category.upper()}  {expense_type} ({phase_keyword})'
            input = [keyword, [f'{fore_keyword} X FRAC TO LIFE MUL S/{work_stream}']]
            if input not in ret_list:
                rear_keyword = 'S/145' if rear_keyword == 'S/819' else rear_keyword
                ret_list += [[TEXT, text]]
                ret_list.append([f'S/{work_stream}', f'{rear_keyword} X FRAC TO LIFE MINUS 1'])
                ret_list.append([f'S/{work_stream}', f'S/{work_stream} X FRAC TO LIFE DIV S/95'])
                ret_list += [input]

    return ret_list


def get_expense_unit_key(expense_dict, phase, category, var=True, water=False):
    if var:
        if water:
            rows = expense_dict['rows']
        else:
            rows = expense_dict[phase][category]['rows']
    else:
        rows = expense_dict[category]['rows']

    first_row_keys = list(rows[0].keys())
    unit_key = list(set(UNIT_MAP.keys()).intersection(first_row_keys))[0]

    return unit_key


def get_fixed_expense_category_name(key):
    if key == 'monthly_well_cost':
        return 'FIXED 1'
    else:
        fixed_no = key.split('other_monthly_cost_')[-1]
        fixed_no = int(float(fixed_no) + 1)
        return f'FIXED {fixed_no}'


def combine_original_and_overlay_rows_for_lookup(segmented_original_rows, segmented_overlay_rows, count,
                                                 aries_start_log, user_work_stream):
    for original_rows in segmented_original_rows:
        keyword = original_rows[0][0]
        if keyword == 'START':
            continue
        use_keyword = keyword

        phase_category = get_phase_category_from_keyword(use_keyword)
        if phase_category is None:
            continue
        phase, category = phase_category
        work_stream, available = get_expense_stream_keyword(user_work_stream, phase, category, count)

        if not available:
            continue
        aries_start_log.add_expense_workstream_to_zero(work_stream)
        phase_text = 'FIXED' if phase is None else str(phase).upper()[:8]
        for row in original_rows:
            row[0] = work_stream if row[0] != '"' else row[0]
            row[1] = row[1].replace('PC 0', '')

        original_rows.insert(0, [TEXT, f'MODELING {work_stream} AS {phase_text} EXPENSE ({category.upper()})'])

        use_stream = KEYWORD_STREAM_DICT.get(use_keyword, 'none')

        has_cost_stream = False
        has_calc_cost_stream = False
        for overlay_rows in segmented_overlay_rows:
            apply_cost_stream = False
            apply_calc_cost_stream = False
            for row in overlay_rows:
                if row[0] == 'START':
                    continue
                if row[0] == f'S/{use_stream}':
                    has_cost_stream = True
                    apply_cost_stream = True
                    break
                if row[0] == f'S/{CALC_COST_STREAM_DICT.get(use_stream)}':
                    has_calc_cost_stream = True
                    apply_cost_stream = True
                    apply_calc_cost_stream = True
                    calc_cost_stream = f'S/{CALC_COST_STREAM_DICT.get(use_stream)}'
                    break

            if apply_cost_stream:
                for row in overlay_rows:
                    row[0] = row[0].replace(f'S/{use_stream}', work_stream)
                    row[1] = row[1].replace(f'S/{use_stream}', work_stream)
                    original_rows.append(row)
            if apply_calc_cost_stream:
                for row in overlay_rows:
                    row[0] = row[0].replace(calc_cost_stream, work_stream)
                original_rows.append([f'{calc_cost_stream}', f'{work_stream} X FRAC TO LIFE PLUS {calc_cost_stream}'])

        add_cost_stream_sum = False if has_calc_cost_stream and not has_cost_stream else True
        if add_cost_stream_sum:
            original_rows.append([f'S/{use_stream}', f'S/{use_stream} X FRAC TO LIFE PLUS {work_stream}'])

    return [row for original_rows in segmented_original_rows for row in original_rows]


KEYWORD_STREAM_DICT = {
    'OPC/T': 267,
    'GPC/T': 285,
    'GTC/T': 276,
    'LTC/T': 273,
    'CMP/T': 279,
    'WRK/T': 295,
    'TRC/T': 282,
    'GA/T': 306,
    'FTC/T': 336,
    'GPC/GAS': 286,
    'OPC/OIL': 252,
    'OPC/P09': 260,
    'OPC/P10': 261,
    'OPC/P11': 262,
    'OPC/P12': 263,
    'OPC/P13': 264,
    'OPC/P14': 265,
    'OPC/GAS': 253,
    'OPC/CND': 254,
    'OPC/NGL': 256,
    'OPC/WTR': 258,
    'LTC/OIL': 274,
    'GTC/GAS': 277,
    'TRC/GAS': 283,
    'CMP/GAS': 280,
    'GPC/REV': 287,
    'TRC/REV': 284,
    'CMP/REV': 281,
    'LTC/REV': 275,
    'GTC/REV': 278
}

ARIES_EXPENSE_STREAM_CODE = {
    ('gas', 'processing'): (253, 687),
    ('gas', 'gathering'): (286, 711),
    ('gas', 'transportation'): (277, 708),
    ('gas', 'other'): (280, 709),
    ('gas', 'marketing'): (283, 710),
    ('oil', 'processing'): (252, 686),
    ('oil', 'gathering'): (260, 694),
    ('oil', 'transportation'): (274, 707),
    ('oil', 'marketing'): (261, 695),
    ('oil', 'other'): (262, 696),
    ('ngl', 'processing'): (256, 690),
    ('ngl', 'gathering'): (266, 700),
    ('ngl', 'transportation'): (263, 697),
    ('ngl', 'marketing'): (264, 698),
    ('ngl', 'other'): (265, 699),
    ('drip_condensate', 'gathering'): (254, 688),
    ('drip_condensate', 'processing'): (254, 688),
    ('drip_condensate', 'transportation'): (254, 688),
    ('drip_condensate', 'other'): (254, 688),
    ('drip_condensate', 'marketing'): (254, 688),
    'monthly_well_cost': 267,
    'other_monthly_cost_1': 285,
    'other_monthly_cost_2': 276,
    'other_monthly_cost_3': 273,
    'other_monthly_cost_4': 279,
    'other_monthly_cost_5': 295,
    'other_monthly_cost_6': 282,
    'other_monthly_cost_7': 306,
    'other_monthly_cost_8': 336,
    'other_cost': 316,
}

FIXED_EXPENSE_TYPE_DICT = {
    '0': 'monthly_well_cost',
    '1': 'other_monthly_cost_1',
    '2': 'other_monthly_cost_2',
    '3': 'other_monthly_cost_3',
    '4': 'other_monthly_cost_4',
    '5': 'other_monthly_cost_5',
    '6': 'other_monthly_cost_6',
    '7': 'other_monthly_cost_7',
    '8': 'other_monthly_cost_8',
}

CALC_COST_STREAM_DICT = {
    253: 687,
    286: 711,
    277: 708,
    280: 709,
    283: 710,
    252: 686,
    260: 694,
    261: 695,
    262: 696,
    266: 700,
    263: 697,
    264: 698,
    265: 699,
    274: 707,
    256: 1022,
    254: 688,
    267: None,
    285: None,
    276: None,
    273: None,
    279: None,
    295: None,
    282: None,
    306: None,
    336: None,
    316: None
}


def get_phase_category_from_keyword(keyword):
    phase_category_keyword_dict = {
        'GPC/GAS': ('gas', 'gathering'),
        'OPC/GAS': ('gas', 'processing'),
        'GTC/GAS': ('gas', 'transportation'),
        'TRC/GAS': ('gas', 'marketing'),
        'CMP/GAS': ('gas', 'other'),
        'OPC/P09': ('oil', 'gathering'),
        'OPC/OIL': ('oil', 'processing'),
        'LTC/OIL': ('oil', 'transportation'),
        'OPC/P10': ('oil', 'marketing'),
        'OPC/P11': ('oil', 'other'),
        'GPC/NGL': ('ngl', 'gathering'),
        'OPC/NGL': ('ngl', 'processing'),
        'OPC/P12': ('ngl', 'transportation'),
        'OPC/P13': ('ngl', 'marketing'),
        'OPC/P14': ('ngl', 'other'),
        'OPC/T': (None, 'monthly_well_cost'),
        'GPC/T': (None, 'other_monthly_cost_1'),
        'GTC/T': (None, 'other_monthly_cost_2'),
        'LTC/T': (None, 'other_monthly_cost_3'),
        'CMP/T': (None, 'other_monthly_cost_4'),
        'WRK/T': (None, 'other_monthly_cost_5'),
        'TRC/T': (None, 'other_monthly_cost_6'),
        'GA/T': (None, 'other_monthly_cost_7'),
        'FTC/T': (None, 'other_monthly_cost_8')
    }
    return phase_category_keyword_dict.get(keyword)


FIXED_EXPENSE_KEYWORD_DICT = {
    'monthly_well_cost': ('OPC/T', 267),
    'other_monthly_cost_1': ('GPC/T', 285),
    'other_monthly_cost_2': ('GTC/T', 276),
    'other_monthly_cost_3': ('LTC/T', 273),
    'other_monthly_cost_4': ('CMP/T', 279),
    'other_monthly_cost_5': ('WRK/T', 295),
    'other_monthly_cost_6': ('TRC/T', 282),
    'other_monthly_cost_7': ('GA/T', 306),
    'other_monthly_cost_8': ('FTC/T', 336),
}

EXPENSE_CALC_OPTION_STREAM_DICT = {
    'nri': None,
    'one_minus_nri': None,
    'one_minus_wi': None,
    'wi_minus_1': None,
    'nri_minus_1': None,
    '100_pct_wi': None,
}

ARIES_REV_EXPENSE_STREAM_CODE = {
    ('pct_of_gas_rev', 'gathering'): (284, ),
    ('pct_of_gas_rev', 'processing'): (281, ),
    ('pct_of_gas_rev', 'transportation'): (278, ),
    ('pct_of_gas_rev', 'other'): (281, ),
    ('pct_of_gas_rev', 'marketing'): (284, ),
    ('pct_of_oil_rev', 'gathering'): (275, ),
    ('pct_of_oil_rev', 'transportation'): (275, ),
    ('pct_of_oil_rev', 'marketing'): (275, ),
    ('pct_of_oil_rev', 'processing'): (275, ),
    ('pct_of_oil_rev', 'other'): (275, ),
    ('pct_of_ngl_rev', 'gathering'): (287, ),
    ('pct_of_ngl_rev', 'processing'): (287, ),
    ('pct_of_ngl_rev', 'transportation'): (287, ),
    ('pct_of_ngl_rev', 'marketing'): (287, ),
    ('pct_of_ngl_rev', 'other'): (287, )
}

VAR_REV_EXPENSE_KEYWORD_DICT = {
    ('pct_of_oil_rev', 'gathering'): 'LTC/REV',
    ('pct_of_oil_rev', 'processing'): 'LTC/REV',
    ('pct_of_oil_rev', 'transportation'): 'LTC/REV',
    ('pct_of_oil_rev', 'marketing'): 'LTC/REV',
    ('pct_of_oil_rev', 'other'): 'LTC/REV',
    ('pct_of_gas_rev', 'gathering'): 'TRC/REV',
    ('pct_of_gas_rev', 'processing'): 'CMP/REV',
    ('pct_of_gas_rev', 'transportation'): 'GTC/REV',
    ('pct_of_gas_rev', 'marketing'): 'TRC/REV',
    ('pct_of_gas_rev', 'other'): 'CMP/REV',
    ('pct_of_ngl_rev', 'gathering'): 'GPC/REV',
    ('pct_of_ngl_rev', 'processing'): 'GPC/REV',
    ('pct_of_ngl_rev', 'transportation'): 'GPC/REV',
    ('pct_of_ngl_rev', 'marketing'): 'GPC/REV',
    ('pct_of_ngl_rev', 'other'): 'GPC/REV',
}

REV_ERROR_EXPENSE_CHECK = {'LTC/REV': None, 'GTC/REV': None, 'CMP/REV': None, 'TRC/REV': None, 'GPC/REV': None}

UNHANDLEABLE_REVENUE_BASED_KEYS = {'pct_of_total_rev': 'TOTAL_REV', 'pct_of_drip_condensate_rev': 'CND_REV'}

UNHANDLEABLE_KEY_NAMES_DICT = {'TOTAL_REV': 'TOTAL REVENUE', 'CND_REV': 'DRIP CONDENSATE REVENUE'}

REV_UNIT_NAME_CONVERSION = {
    'pct_of_oil_rev': '% OF OIL REV.',
    'pct_of_gas_rev': '% OF GAS REV.',
    'pct_of_ngl_rev': '% OF NGL REV.'
}

EXPENSE_ERROR_CHECK_DICT = {
    'oil': [],
    'ngl': [],
    'drip_condensate': ['gathering', 'marketing', 'transportation', 'other'],
    'gas': []
}

EXPENSE_OPTIONS_NAME_CONVERSION = {
    'deal_terms': 'P/E WI',
    'shrinkage_condition': 'SHRINKAGE CONDT',
    'calculation': 'CALC. TYPE (WI, NRI, etc.)'
}

OFFSET_MACRO_DICT = {
    'offset_to_fpd': 'FIRST_PROD_DATE',
    'offset_to_discount_date': 'DISCOUNT_DATE',
    'offset_to_first_segment': 'MAJOR_SEG_START',
    'offset_to_end_history': 'END_HIST_PROD_DATE',
}

OFFSET_LOOKUP_DICT = {
    'offset_to_fpd': 'FPD',
    'offset_to_discount_date': 'DISC',
    'offset_to_first_segment': 'MAJ_SEG',
    'offset_to_end_history': 'END_HIST',
    'offset_to_as_of_date': 'AS_OF'
}

CUT_OFF_SYNTAX_DICT = {'max_cum_cash_flow': 'PMAX', 'last_positive_cash_flow': 'OPINC', 'no_cut_off': 'OK'}

DEFAULT_PHASE_START_DATE_DICT = {'oil': None, 'gas': None, 'water': None}

ABAN_SALV_DICT = {'abandonment': ('ABDN', 'ABAN', 'ABANDON'), 'salvage': ('SALV', 'SALV', 'SALVAGE')}


def production_vs_fit_conv(this_econ, date_dict, aries_setting, user_work_stream=None):
    ret_list = []
    replace_econ = this_econ['production_vs_fit_model']['replace_actual']
    include_production = aries_setting.get('include_production', [])
    file_format = aries_setting.get('file_format', 'csv')
    for phase in ['oil', 'gas', 'water']:
        ret_list = update_econ_row_prod_vs_fit(ret_list, replace_econ, phase, date_dict)

    if ret_list and 'monthly' not in include_production and file_format == 'accdb':
        ret_list += [[TEXT, 'LOAD lines require Monthly Prod export from CC']]
    return ret_list


def update_econ_row_prod_vs_fit(ret_list, replace_econ, phase, date_dict):
    # if the first production date is more than 10 years before the asof date, use 10years before the asof date
    # as the load date, far dates lead to error in ARIES (e.g if first production date is 01/01/2000 and asof date
    #  is 01/01/2021, use 01/01/2011 as start) far off loads cause large data error)
    fpd = pd.to_datetime(date_dict['offset_to_fpd'], errors='coerce')
    least_acceptable_load_date = pd.to_datetime(
        date_dict['offset_to_as_of_date']) - pd.DateOffset(years=MAX_PREV_YEAR_LOAD)
    if fpd < least_acceptable_load_date:
        given_start_date = least_acceptable_load_date.strftime('%Y-%m-%d')
        start_date = cc_date_to_aries_date(given_start_date, date_dict)
    else:
        start_date = cc_date_to_aries_date(date_dict['offset_to_fpd'], date_dict)
    date = None
    if 'date' in replace_econ[phase]:
        date = cc_date_to_aries_date(replace_econ[phase]['date'], date_dict)
    elif 'never' in replace_econ[phase]:
        date = 'X'
    if date is not None:
        phase_alias = phase if phase != 'water' else 'wtr'
        ret_list += [['LOAD', f'MP.{phase.upper()} {phase_alias.upper()} {start_date} {date} #']]
    return ret_list


def stream_properties_conv(stream_prop_econ, date_dict, aries_start_log, user_work_stream=None):
    ret_list = []
    criteria_list = [
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'dates', 'entire_well_life'
    ]
    criteria_list.extend(RATE_BASED_ROW_KEYS)

    shrunk_ngl, shrunk_cnd, use_ngl_yield, use_cnd_yield = get_ngl_cnd_shrunk_usage(stream_prop_econ)
    for phase in ['oil', 'gas']:
        for key in ['shrinkage', 'loss_flare']:
            if key == 'shrinkage':
                rows_ls = [stream_prop_econ[key][phase]['rows']]
            else:
                rows_ls = [stream_prop_econ[key][f'{phase}_loss']['rows']]
                if phase == 'gas':
                    rows_ls.append(stream_prop_econ[key][f'{phase}_flare']['rows'])

            # ignore single line gas shrinkage to be handled with the shrink keyword
            if key == 'shrinkage' and phase == 'gas' and len(rows_ls[-1]) == 1:
                continue

            for idx, rows in enumerate(rows_ls):
                loss_type = key.split('_')[idx]
                if not (rows[0]['pct_remaining'] == 100 and len(rows) == 1):
                    row_keys = list(rows[0].keys())
                    criteria = list(set(row_keys) & set(criteria_list))[0]
                    if criteria == 'entire_well_life':
                        incoming_start = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
                    elif criteria == 'dates':
                        incoming_start = cc_date_to_aries_date(rows[0]['dates']['start_date'], date_dict)
                    elif criteria in RATE_BASED_ROW_KEYS:
                        incoming_start = 'RATE'
                    else:
                        incoming_start = cc_date_to_aries_date(date_dict[criteria], date_dict)
                    ret_list = aries_start_log.add_start_and_update_current_start(incoming_start,
                                                                                  ret_list,
                                                                                  date_dict,
                                                                                  criteria=criteria)
                    text = 'MULTIPLIER VALUE = {} {}'.format(phase.upper(), loss_type.upper())
                    ret_list += [[TEXT, text]]
                    value_ls = []

                    rows = get_loop_rows(rows, criteria)
                    for idx, row in enumerate(rows):
                        if idx == 0:
                            keyword = GROSS_KEY_DICT[(phase, key)]
                        else:
                            keyword = '"'
                        # limit_value, limit_unit
                        limit_value, limit_unit = get_limit_value_and_unit(criteria, row, rows, idx, date_dict)
                        ret_list = check_for_water_rate_cut_off(ret_list, limit_unit, keyword, criteria)

                        value = row['pct_remaining'] / 100
                        ret_list += [[
                            keyword,
                            list_to_expression([
                                format_digits(value), 'X', 'FRAC', limit_value, limit_unit, 'MUL',
                                GROSS_KEY_DICT[(phase, key)]
                            ])
                        ]]
                        value_ls.append((value, keyword, limit_value, limit_unit))
                        # add items to list based on yield and shrunk use
                    ret_list = add_shrunk_and_yield_cnd_aries_line(ret_list, phase, loss_type, value_ls, use_ngl_yield,
                                                                   use_cnd_yield, shrunk_ngl, shrunk_cnd)

    return ret_list


def get_ngl_cnd_shrunk_usage(stream_prop_econ):
    shrunk_ngl, shrunk_cnd = False, False
    use_ngl_yield, use_cnd_yield = False, False
    row_keys_ngl = stream_prop_econ['yields']['ngl']['rows'][-1]
    row_keys_cnd = stream_prop_econ['yields']['drip_condensate']['rows'][-1]
    shrunk_key_ngl = next(key for key in row_keys_ngl if 'shrunk' in key)
    shrunk_key_cnd = next(key for key in row_keys_cnd if 'shrunk' in key)

    if shrunk_key_ngl == 'shrunk_gas':
        shrunk_ngl = True
    if shrunk_key_cnd == 'shrunk_gas':
        shrunk_cnd = True
    if not (len(stream_prop_econ['yields']['ngl']['rows']) == 1
            and stream_prop_econ['yields']['ngl']['rows'][0]['yield'] == 0):
        use_ngl_yield = True
    if not (len(stream_prop_econ['yields']['drip_condensate']['rows']) == 1
            and stream_prop_econ['yields']['drip_condensate']['rows'][0]['yield'] == 0):
        use_cnd_yield = True
    return shrunk_ngl, shrunk_cnd, use_ngl_yield, use_cnd_yield


def add_shrunk_and_yield_cnd_aries_line(ret_list, phase, loss_type, value_ls, use_ngl_yield, use_cnd_yield, shrunk_ngl,
                                        shrunk_cnd):
    text_ls = []
    if phase == 'gas':
        for idx, yield_bools in enumerate([(use_ngl_yield, shrunk_ngl), (use_cnd_yield, shrunk_cnd)]):
            for value in value_ls:
                limit_value = value[2]
                limit_unit = value[3]
                use_yield, shrunk = yield_bools
                if idx == 0:
                    mul_phase = 'S/395'
                else:
                    mul_phase = 'S/393'
                if loss_type in ['loss', 'flare']:
                    if use_yield:
                        if value[1] == '"':
                            p_keyword = value[1]
                        else:
                            p_keyword = mul_phase
                        text = f'GAS {loss_type.upper()} IS NOT USED IN NGL YIELD'
                        if text not in text_ls:
                            ret_list += [[TEXT, text]]
                            text_ls.append(text)
                        ret_list += [[
                            p_keyword,
                            list_to_expression([value[0], 'X', 'FRAC', limit_value, limit_unit, 'MUL', mul_phase])
                        ]]
                else:
                    if shrunk and use_yield:
                        if value[1] == '"':
                            p_keyword = value[1]
                        else:
                            p_keyword = mul_phase
                        text = 'SHRUNK GAS IS SELECTED IN CC YIELD'
                        if text not in text_ls:
                            ret_list += [[TEXT, text]]
                            text_ls.append(text)
                        ret_list += [[
                            p_keyword,
                            list_to_expression([value[0], 'X', 'FRAC', limit_value, limit_unit, 'MUL', mul_phase])
                        ]]

    return ret_list


######## forecast conversion (section 4 in Aries)
## yields
def yield_conv(yields_econ, date_dict, aries_start_log, shrink_count, well_header, overlay, user_work_stream=None):
    yield_ret = []
    #
    criteria_list = [
        'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_discount_date', 'offset_to_first_segment',
        'offset_to_end_history', 'dates', 'entire_well_life'
    ]
    criteria_list = criteria_list + RATE_BASED_ROW_KEYS

    for phase in ['ngl', 'drip_condensate']:
        phase_yield = yields_econ[phase]
        rows = phase_yield['rows']
        for r in rows:
            r['yield'] = r['yield']
        row_keys = list(rows[0].keys())
        this_criteria = list(set(row_keys) & set(criteria_list))[0]

        if phase == 'ngl':
            keyword = 'NGL/GAS'
        else:
            keyword = 'CND/GAS'

        yield_ret = process_shrunk_yield(rows, shrink_count, well_header, yield_ret, overlay)

        yield_ret = process_rows(yield_ret,
                                 rows,
                                 this_criteria,
                                 'yield',
                                 'B/MM',
                                 1,
                                 keyword,
                                 'lin_time',
                                 date_dict,
                                 aries_start_log,
                                 user_work_stream,
                                 yield_=True,
                                 overlay=overlay)

    return yield_ret


def process_shrunk_yield(rows, shrink_count, well_header, yield_ret, overlay):
    # Modifies the Yield value within the current row when processing a shrunk yield

    # Handle normal shrink and yield
    if rows[0].get('shrunk_gas', '') != 'Shrunk Gas':
        pass
    # Handle shrink and yield with 1 row
    elif shrink_count == 1:
        for r in rows:
            # round shrink values to 8th decimal to account for Aries 20 character limit
            # well_header will not have a shrink if CC value is 100%
            if type(r['yield']) in [int, float]:
                if well_header.get('SHRINK', '') == '':
                    r['yield'] = str(format_digits(r['yield']))
                else:
                    r['yield'] = '@M.SHRINK*' + str(format_digits(r['yield']))
        if not overlay:
            yield_ret.insert(0, [TEXT, 'Applied SHRINK factor to yield to copy functionality of CC.'])

    # Handle shrink and yield with multiple rows
    elif shrink_count > 1:
        if not overlay:
            yield_ret.insert(0, [TEXT, 'ERROR: CAN NOT HANDLE MUL SHRINK SEG FOR SHRUNK YIELD.'])

    return yield_ret


def cc_index_to_aries_date(cc_index, date_dict=None, cut_off=False):
    if cut_off is False:
        cc_date = CC_BASE_DATE + int(cc_index)
    else:
        cc_date = (CC_BASE_DATE + int(cc_index)).astype('datetime64[M]') + 1
    return cc_date_to_aries_date(cc_date, date_dict)


def get_cums_from_production(forecast_seg_by_phase, production_dict):
    '''
    get accumulation volum from monthly, daily production data
    '''
    data_resolution = production_dict['data_resolution']
    phase_freq = production_dict['phase_freq']

    cums_ls = []

    for phase in ['OIL', 'GAS', 'CND', 'SGS', 'NGL', 'WATER']:
        if phase in ['CND', 'SGS', 'NGL']:
            cums_ls.append(0)
            continue

        phase_key = phase.lower()
        forecast_segments = forecast_seg_by_phase[phase_key]

        if not forecast_segments:
            cums_ls.append(0)
            continue

        forecast_start_index = int(forecast_segments[0]['start_idx'])

        this_phase_freq = phase_freq.get(phase.lower())

        used_prod = None
        if data_resolution == 'same_as_forecast':
            used_prod = production_dict.get(f'{this_phase_freq}_dict')
        else:
            used_prod = production_dict.get(f'{data_resolution}_dict')

        if used_prod:
            index_flag = np.array(used_prod['index']) < forecast_start_index
            phase_cum = sum(filter(None, np.array(used_prod[phase_key])[index_flag]))
            cums_ls.append(format_digits(phase_cum / 1000))
        else:
            cums_ls.append(0)

    return cums_ls


def validate_cums_ls(cums_ls):
    sum = 0.0
    for value in cums_ls:
        sum += float(value)
    return sum == 0.0


def seg_cut_off_logic(segment, seg_end, date_dict, seg_idx):
    if seg_end == 'absolute_date':
        cutoff = cc_index_to_aries_date(segment['end_idx'], date_dict, cut_off=True)
        cutoff_unit = 'AD'
    elif seg_end == 'months':
        num_of_days = int(segment['end_idx'] - segment['start_idx']) + 1
        cutoff = round(num_of_days / DAYS_IN_MONTH, ROUND_DIGIT)
        if seg_idx == 0:
            cutoff_unit = 'MOS'
        else:
            cutoff_unit = 'IMO'

    else:
        num_of_days = int(segment['end_idx'] - segment['start_idx']) + 1
        cutoff = round(num_of_days / DAYS_IN_YEAR, ROUND_DIGIT)
        if seg_idx == 0:
            cutoff_unit = 'YRS'
        else:
            cutoff_unit = 'IYR'

    return cutoff, cutoff_unit


def check_for_valid_export_segments(segments):
    invalid, cannot_approximate = False, False
    num_of_invalid_segments = 0
    for i, segment in enumerate(segments):
        segment_name = segment['name']
        if segment_name not in [
                SegNames.exp_inc.value, SegNames.exp_dec.value, SegNames.flat.value, SegNames.linear.value,
                SegNames.empty.value
        ]:
            invalid = True
            num_of_invalid_segments += 1

    return invalid, cannot_approximate, num_of_invalid_segments


def get_q_by_unit(segment, q_key, forecast_unit=None, multiplier=None):
    q = segment[q_key]

    if forecast_unit == 'per_month':
        q *= DAYS_IN_MONTH

    if multiplier is not None:
        q *= multiplier

    q = max(q, 0.01)  # if q less than 0.01, set it to be 0.01

    return round(q, ROUND_DIGIT)


def process_approximated_ratio_segments(segments, segment, new_segment, keyword, aries_unit, seg_end, base_segments,
                                        date_dict, idx, var_idx, num_approx):

    multi_seg = MultipleSegments()

    cutoff, cutoff_unit = seg_cut_off_logic(new_segment, seg_end, date_dict, idx)

    initial_rate, final_rate = multi_seg.predict([new_segment.get('start_idx'), new_segment.get('end_idx')], [segment])

    if not (var_idx == 0 and idx == 0):
        keyword = '"'
        cutoff_unit = f'I{cutoff_unit[:-1]}' if cutoff_unit in ['MOS', 'YRS'] else cutoff_unit

    if cutoff != 0:
        this_seg = [
            keyword,
            [
                round(float(initial_rate), 2),
                round(float(final_rate), 2), aries_unit, cutoff, cutoff_unit, 'LOG', 'TIME'
            ]
        ]

        segments.append(this_seg)
        num_approx += 1
    return segments, num_approx


def approximate_aries_ratio_forecast(segments, forecast_data, segment, keyword, pct_key, aries_unit, date_dict, seg_end,
                                     idx, num_of_approx_segment, max_num_segments):
    base_phase = str(keyword.split('/')[-1]).lower()
    base_phase = base_phase if base_phase != 'wtr' else 'water'
    pct_key = pct_key.get(base_phase)

    base_segments = forecast_data[base_phase]['P_dict'][pct_key]['segments']
    new_segment = copy.deepcopy(segment)
    initial_end_idx = new_segment.get('end_idx')
    # intialize the number of created approximate segments for this run
    num_approx = 0

    for k in range(max_num_segments):
        if k == 0:
            if new_segment['start_idx'] + (int(DAYS_IN_YEAR / 2) * (2**k)) < (initial_end_idx) + 1:
                new_segment['end_idx'] = new_segment['start_idx'] + (int(DAYS_IN_YEAR / 2) * (2**k))
            else:
                new_segment['end_idx'] = initial_end_idx
                segments, num_approx = process_approximated_ratio_segments(segments, segment, new_segment, keyword,
                                                                           aries_unit, seg_end, base_segments,
                                                                           date_dict, idx, k, num_approx)
                break
        elif k < max_num_segments - 1:
            new_segment['start_idx'] = new_segment['end_idx'] + 1
            if new_segment['start_idx'] + (int(DAYS_IN_YEAR / 2) * (2**k)) < initial_end_idx + 1:
                new_segment['end_idx'] = new_segment['start_idx'] + (int(DAYS_IN_YEAR / 2) * (2**k))
            else:
                new_segment['end_idx'] = initial_end_idx
                segments, num_approx = process_approximated_ratio_segments(segments, segment, new_segment, keyword,
                                                                           aries_unit, seg_end, base_segments,
                                                                           date_dict, idx, k, num_approx)
                break
        else:
            new_segment['start_idx'] = new_segment['end_idx'] + 1
            new_segment['end_idx'] = initial_end_idx

        segments, num_approx = process_approximated_ratio_segments(segments, segment, new_segment, keyword, aries_unit,
                                                                   seg_end, base_segments, date_dict, idx, k,
                                                                   num_approx)

    # subtract the number of created approx segments from the num_of_approx_segment left
    num_of_approx_segment -= num_approx
    return segments, num_of_approx_segment


def process_ratio_segments(forecast_segments,
                           forecast_data,
                           pct_key,
                           date_dict,
                           phase_unit,
                           phase_keyword,
                           seg_end,
                           include_zero_forecast,
                           forecast_months=None,
                           phase_forecast=None):

    cc_db = phase_unit['cc_db']
    cc_front = phase_unit['cc_front']
    aries_unit = phase_unit['aries']
    multiplier = get_multiplier(cc_db, cc_front)

    processed_segments = []
    forecast_volumes = None
    invalid, cannot_approximate, num_of_invalid_segments = check_for_valid_export_segments(forecast_segments)

    # get number of created segments based on the number of invalid segments (if <= 2 use 6 else 8)
    max_num_of_approx_segment = LL_NUM_CREATED_SEGMENTS if num_of_invalid_segments <= 2 else UL_NUM_CREATED_SEGMENTS
    original_phase_key = phase_keyword

    if invalid:
        use_text = ERROR if cannot_approximate else TEXT
        processed_segments.append([use_text, [f'SEGMENT(S) IN {phase_keyword} FORECAST NOT VALID']])
        if not cannot_approximate:
            processed_segments.append([TEXT, ['SEGMENT(S) WILL BE APPROXIMATED, VALUES MAY NOT BE EXACT']])

    # set the initial number of approximated segments
    num_approx_segment = max_num_of_approx_segment
    # initialize the number of rows that have been broken than to multi-segments
    rows_approximated = 0
    for i, segment in enumerate(forecast_segments):
        segment_name = segment['name']

        if segment_name not in [
                SegNames.exp_inc.value, SegNames.exp_dec.value, SegNames.flat.value, SegNames.linear.value,
                SegNames.empty.value
        ]:
            if not cannot_approximate:
                # if this is the last row, use all the allocated segments left to approximated,
                #  else stick to alloted quota
                if rows_approximated + 1 == num_of_invalid_segments:
                    max_num_segments = num_approx_segment
                else:
                    max_num_segments = int(max_num_of_approx_segment / num_of_invalid_segments)
                processed_segments, num_approx_segment = approximate_aries_ratio_forecast(
                    processed_segments, forecast_data, segment, phase_keyword, pct_key, aries_unit, date_dict, seg_end,
                    i, num_approx_segment, max_num_segments)
                rows_approximated += 1
            else:
                processed_segments.append(
                    [TEXT, [f'{original_phase_key} SEGMENT {i+1} ({segment_name}) CANNOT BE EXPORTED']])
            continue

        if i > 0:
            phase_keyword = '"'
        if invalid and cannot_approximate:
            phase_keyword = f'*{phase_keyword}'

        cutoff, cutoff_unit = seg_cut_off_logic(segment, seg_end, date_dict, i)

        initial_rate = get_q_by_unit(segment, 'q_start', multiplier=multiplier)
        final_rate = get_q_by_unit(segment, 'q_end', multiplier=multiplier)

        if segment_name in [SegNames.exp_inc.value, SegNames.exp_dec.value]:
            decline_method = 'LOG'
            decline_rate = 'TIME'
        elif segment_name in [SegNames.flat.value, SegNames.linear.value]:
            decline_method = 'LIN'
            decline_rate = 'TIME'
        elif segment_name == SegNames.empty.value:
            if include_zero_forecast or len(forecast_segments) > 1:
                initial_rate = NEAR_ZERO_RATE
                final_rate = NEAR_ZERO_RATE
                decline_method = 'LIN'
                decline_rate = 'TIME'
            else:
                continue

        this_seg = [
            phase_keyword, [initial_rate, final_rate, aries_unit, cutoff, cutoff_unit, decline_method, decline_rate]
        ]

        processed_segments.append(this_seg)

        processed_segments, forecast_volumes = get_forecast_volumes_for_load_table(
            str(original_phase_key).split('/')[0],
            processed_segments,
            forecast_segments,
            forecast_months=forecast_months,
            phase_forecast_data=phase_forecast,
        )

    return processed_segments, forecast_volumes


def get_valid_decline_rate(decline_rate, cutoff='EXP'):
    '''
    Get the valid effectove decline value that does not cause an error in ARIES
    Ignore cases when the decline rate is to be calculated by aries ('X')
    '''
    if cutoff == 'EXP' and decline_rate != 'X':
        try:
            decline_rate = decline_rate if round(decline_rate,
                                                 VALID_B_DIGITS_IN_NEAR_DEFF_CASES) != 0 else MINIMUM_DEFF_VALUE
            decline_rate = 99.999 if float(decline_rate) == 100 else decline_rate
        except (ValueError, TypeError):
            pass
    return decline_rate


def get_valid_b_value(b, deff, cutoff_value, cutoff_crit):
    '''
    Get the valid b value that does not cause an error in ARIES
    '''
    if cutoff_crit == 'EXP' and check_near_equality(deff, cutoff_value, tolerance=1) and round(
            b, VALID_B_DIGITS_IN_NEAR_DEFF_CASES) == 0:
        b = NEAR_ZERO_B_VAL_IN_NEAR_DEFF_CASES
    elif b == 0:
        b = NEAR_ZERO_B_VALUE
    return b


def process_ending_rate(segment, forecast_unit, i):
    final_rate = get_q_by_unit(segment, 'q_end', forecast_unit)
    cutoff = 'X'
    if i > 0:
        cutoff_unit = 'IYR'
    else:
        cutoff_unit = 'YRS'

    return final_rate, cutoff, cutoff_unit


def predict_rate(t, segment):
    '''
        Inputs:
            t (int): time to back calculate to in index (days between set day and 1/1/1900)
            segment(dict): dictionary containing parameters to be used for back caclulation
            (decline, b, start time and rate)

        Outputs:
            segment(dict): updated segment with new flow rate, deff, and d
            q (float): back calculated rate
            Deff: new effective decline (require for arps, arps_modified, linear)
    '''
    back_calcd = False
    segment_name = segment.get('name')
    t0 = segment.get('start_idx')
    q0 = segment.get('q_start')
    if segment_name in ['arps_inc', 'arps', 'arps_modified']:
        b = segment.get('b')
        if float(b - int(b)) == 0:
            b += NEAR_ZERO_B_VALUE
        d = segment.get('D')
        decline_multiple = 1 + b * d * (t - t0)
        if decline_multiple >= 0:
            q = pred_arps(t, t0, q0, d, b)
            updated_d = arps_get_D_delta(d, b, (t - t0))
            updated_deff = arps_D_2_D_eff(updated_d, b)
            segment['q_start'] = q
            segment['D'] = updated_d
            segment['D_eff'] = updated_deff
            back_calcd = True
    elif segment_name in ['linear']:
        k = segment.get('k')
        if k * (t - t0) > -q0:
            q = pred_linear(t, q0, t0, k)
            linear_deff = linear_k_2_D_eff(k, q)
            segment['D_eff'] = linear_deff
            segment['q_start'] = q
            back_calcd = True

    elif segment_name in ['exp_dec', 'exp_inc']:
        d = segment.get('D')
        q = pred_exp(t, t0, q0, d)
        segment['q_start'] = q
        back_calcd = True

    return segment, back_calcd


def update_segment_to_start_of_month(segment, date_dict):
    '''
    Input(s):
        segment (dictionary): First Forecast segment dictionary for the phase being considered containing keys such as
                              q_start, q_end, start_idx, end_idx
        date_dict (dictionary): Dictionary containing all the required dates, first_production_date, ASOF date etc.

    Description:
        Updates segment q_start and start_idx in certain conditions.

        Conditions:
        1) If Start date is mid-month and the forecast start date is before the ASOF date, the start_idx is updated
           to the first of the month
        2) If start date is mid-month and forecast start date is after the asof date, the start_idx is updated to the
           first of the next month IFF the start DAY of the forecast is greater than the 15th
           (i.e a 16th of November start date is moved to the 1st of December) and the change in date is reflected in
           q_start

    Output(s):
        segment (dictionary): First Forecast segment dictionary for the phase being considered containing keys such as
                              q_start, q_end, start_idx, end_idx
        return_not_back_calc_text (bool): True if back calculation was attempted but failed, False if back
                                          calculation was not attempted or was attempted and successful
        return_first_of_month (bool): True if back calculation was attempted, False if not
        return_first_of_next_month (bool): True if forward calculation was attempted, False if not

    '''
    # initiate all returned boolean paramaters
    return_not_back_calc_text = False
    return_first_of_month = False
    return_first_of_next_month = False

    # get start idx from forecast segment
    start_idx = segment.get('start_idx')
    segment_name = segment.get('name')

    # check if the forecast start date is ahead of the ASOF date
    # date_dict is None means that the forecast is coming in from the forecast section not the scenario section
    # exports coming from the forecast section do not need to have this comparison as they will always be back-calc
    # if the forecast match button is clicked
    forecast_start_ahead_of_asof = date_dict is not None and pd.to_datetime(
        index_to_py_date(start_idx), errors='coerce') > pd.to_datetime(date_dict.get('offset_to_as_of_date'),
                                                                       errors='coerce')

    if forecast_start_ahead_of_asof:
        # convert the start_idx to a date
        forecast_start_date = index_to_py_date(start_idx)

        # check if the day is greater than 15
        if forecast_start_date.day > DATE_LIMIT_FOR_SHIFT:
            # convert forecast start date to pandas datetime object
            formatted_original_forecast_start_date = pd.to_datetime(forecast_start_date)

            # move start date to first of next month
            formatted_next_month_forecast_start_date = formatted_original_forecast_start_date + pd.offsets.MonthBegin(0)

            # get the number of days between the original forecast start date and first of next month start date
            shift_idx = (formatted_next_month_forecast_start_date - formatted_original_forecast_start_date).days

            # shift the start idx by the difference
            new_idx = start_idx + shift_idx

            # if segment name is accpeted
            if segment_name in ['arps_inc', 'arps', 'arps_modified', 'exp_inc', 'exp_dec', 'linear']:
                # update q_start and start_idx of segment based on the shift
                segment, back_calcd = predict_rate(new_idx, segment)

                # update booleans based on result of calculations
                return_first_of_next_month = True
                return_not_back_calc_text = not back_calcd

        return segment, return_not_back_calc_text, return_first_of_month, return_first_of_next_month

    # if the forecast start date is before ASOF or date_dict is None (i.e. coming from Forecast side)
    # get the days from the first of the month
    shift_idx = int(float(str((CC_BASE_DATE + int(float(start_idx)))).split('-')[-1])) - 1

    # if the shift is greater and 0 and the segment is accpeted
    if shift_idx > 0 and segment_name in ['arps_inc', 'arps', 'arps_modified', 'exp_inc', 'exp_dec', 'linear']:
        # shift the start idx by the difference
        new_idx = start_idx - shift_idx

        # update q_start and start_idx of segment based on the shift
        segment, back_calcd = predict_rate(new_idx, segment)

        # update booleans based on result of calculations
        return_first_of_month = True
        return_not_back_calc_text = not back_calcd

    return segment, return_not_back_calc_text, return_first_of_month, return_first_of_next_month


def truncate_to_decimals(value: float, decimals: int):
    """Truncate value to desired decimals
    Args:
        value (float): value to be truncated
        decimals (int): decimals to keep
    Returns:
        float: truncated value
    """
    factor = 10**decimals
    try:
        int_val = int(value * factor) / factor
    except ValueError:
        int_val = value
    return int_val


def ceiling_to_decimals(value: float, decimals: int):
    """Round up to specified decimal places.

    Args:
        value (float): value to be round up
        decimals (int): decimal to round up to

    Returns:
        float: rounded value
    """
    factor = 10**decimals
    try:
        ceil_val = ceil(value * factor) / factor
    except ValueError:
        ceil_val = value
    return ceil_val


def process_arp_modified(
    processed_segments,
    segment,
    date_dict,
    phase_unit,
    phase_keyword,
    seg_end,
    forecast_unit,
    row_idx,
    forecast_history_match,
    forecast_months,
):
    if row_idx == 0 and forecast_history_match:
        (segment, return_not_back_calc_text, return_first_of_month,
         return_first_of_next_month) = update_segment_to_start_of_month(segment, date_dict)
        if return_first_of_month:
            processed_segments.append([TEXT, 'ARIES FORECAST BEGINS ON THE 1ST'.split()])
            processed_segments.append([TEXT, 'CC FORECAST BEGAN MID MONTH, BACK CALC. RQD'.split()])
        if return_first_of_next_month:
            processed_segments.append([TEXT, FORECAST_MOVE_TO_NEXT_MONTH_TEXT.split()])
        if return_not_back_calc_text:
            processed_segments.append([TEXT, 'COULD NOT BACK CALC. INITIAL RATE TO FIRST OF MONTH'.split()])
    d_sw = segment['realized_D_eff_sw'] if 'realized_D_eff_sw' in segment.keys() else segment['D_eff_sw']
    d_eff = segment['D_eff']
    param_b = round(segment['b'], ROUND_DIGIT)

    sw_idx = int(segment['sw_idx'])
    end_idx = segment['end_idx']
    if sw_idx > end_idx:
        need_exp_seg = False
    else:
        need_exp_seg = True

    # arps
    initial_rate_arps = get_q_by_unit(segment, 'q_start', forecast_unit)

    if need_exp_seg:
        cutoff_arps = truncate_to_decimals(d_sw * 100, ROUND_DIGIT)
        cutoff_unit_arps = 'EXP'
        final_rate_arps = 'X'
    else:
        if seg_end == 'ending_rate':
            final_rate_arps, cutoff_arps, cutoff_unit_arps = process_ending_rate(segment, forecast_unit, row_idx)
        else:
            final_rate_arps = 'X'
            cutoff_arps, cutoff_unit_arps = seg_cut_off_logic(segment, seg_end, date_dict, row_idx)

    decline_rate_arps = ceiling_to_decimals(d_eff * 100, ROUND_DIGIT)
    param_b = get_valid_b_value(param_b, decline_rate_arps, cutoff_arps, cutoff_unit_arps)
    decline_method_arps = 'B/' + str(param_b)
    decline_rate_arps = get_valid_decline_rate(decline_rate_arps)
    cutoff_arps = get_valid_decline_rate(cutoff_arps, cutoff=cutoff_unit_arps)

    this_seg_arps = [
        phase_keyword,
        [
            initial_rate_arps,
            final_rate_arps,
            phase_unit,
            cutoff_arps,
            cutoff_unit_arps,
            decline_method_arps,
            decline_rate_arps,
        ]
    ]
    processed_segments.append(this_seg_arps)
    # exponential
    if need_exp_seg:
        initial_rate_exp = 'X'
        if seg_end == 'ending_rate':
            final_rate_exp = get_q_by_unit(segment, 'q_end', forecast_unit)
            cutoff_exp = 'X'
            cutoff_unit_exp = 'IYR'
        else:
            final_rate_exp = 'X'
            # overwrite the start_idx to be sw_idx
            segment_arps = copy.copy(segment)
            segment_arps['start_idx'] = sw_idx

            # the i+1 is due to this will never be the first segment
            cutoff_exp, cutoff_unit_exp = seg_cut_off_logic(segment_arps, seg_end, date_dict, row_idx + 1)

        decline_method_exp = 'EXP'
        decline_rate_exp = truncate_to_decimals(d_sw * 100, ROUND_DIGIT)
        decline_rate_exp = get_valid_decline_rate(decline_rate_exp)

        this_seg_exp = [
            '"',
            [
                initial_rate_exp, final_rate_exp, phase_unit, cutoff_exp, cutoff_unit_exp, decline_method_exp,
                decline_rate_exp
            ]
        ]
        processed_segments.append(this_seg_exp)


def process_normal_segments(forecast_segments,
                            date_dict,
                            phase_unit,
                            phase_keyword,
                            seg_end,
                            forecast_unit,
                            forecast_history_match,
                            include_zero_forecast,
                            forecast_months=None,
                            phase_forecast=None):
    return_first_of_month = False
    phase = phase_keyword
    processed_segments = []
    initial_forecast_volumes = None
    for i, segment in enumerate(forecast_segments):
        segment_name = segment['name']
        if i > 0:
            phase_keyword = '"'

        ## arps modified
        if segment_name == SegNames.arps_modified.value:
            process_arp_modified(
                processed_segments,
                segment,
                date_dict,
                phase_unit,
                phase_keyword,
                seg_end,
                forecast_unit,
                i,
                forecast_history_match,
                forecast_months,
            )
        else:
            if i == 0 and forecast_history_match:
                (segment, return_not_back_calc_text, return_first_of_month,
                 return_first_of_next_month) = update_segment_to_start_of_month(segment, date_dict)
                if return_first_of_month:
                    processed_segments.append([TEXT, 'ARIES FORECAST BEGINS ON THE 1ST'.split()])
                    processed_segments.append([TEXT, 'CC FORECAST BEGAN MID MONTH, BACK CALC. RQD'.split()])
                if return_first_of_next_month:
                    processed_segments.append([TEXT, 'ARIES FORECAST MOVED TO THE BEGINNING OF NEXT MONTH'.split()])
                if return_not_back_calc_text:
                    processed_segments.append([TEXT, 'COULD NOT BACK CALC. INITIAL RATE TO FIRST OF MONTH'.split()])
            initial_rate = get_q_by_unit(segment, 'q_start', forecast_unit)

            if seg_end == 'ending_rate' and segment_name not in [
                    SegNames.exp_inc.value, SegNames.arps_inc.value, SegNames.flat.value, SegNames.linear.value,
                    SegNames.empty.value
            ]:
                final_rate, cutoff, cutoff_unit = process_ending_rate(segment, forecast_unit, i)
            else:
                final_rate = 'X'
                cutoff, cutoff_unit = seg_cut_off_logic(segment, seg_end, date_dict, i)

            if segment_name in [SegNames.exp_inc.value, SegNames.exp_dec.value]:
                decline_method = 'EXP'
                if segment_name == SegNames.exp_inc.value:
                    # for exp_inc we won't export decline_rate due to it can be very large
                    final_rate = get_q_by_unit(segment, 'q_end', forecast_unit)
                    decline_rate = 'X'
                else:
                    decline_rate = round(segment['D_eff'] * 100, ROUND_DIGIT)
                decline_rate = get_valid_decline_rate(decline_rate)
            elif segment_name in [SegNames.arps.value, SegNames.arps_inc.value]:
                param_b = round(segment['b'], ROUND_DIGIT)
                decline_rate = round(segment['D_eff'] * 100, ROUND_DIGIT)
                param_b = get_valid_b_value(param_b, decline_rate, cutoff, cutoff_unit)
                decline_method = 'B/' + str(param_b) if float(param_b) >= 0 else 'EXP'
                if decline_method == 'EXP':
                    processed_segments.append(['*TEXT', 'ARPS INC. NOT SUPPORTED IN ARIES CONV. TO EXP'.split()])
                    # for arp_inc we won't export decline_rate due to it can be very large
                    final_rate = get_q_by_unit(segment, 'q_end', forecast_unit)
                    decline_rate = 'X'
                decline_rate = get_valid_decline_rate(decline_rate)
            elif segment_name == SegNames.flat.value:
                final_rate = get_q_by_unit(segment, 'q_start', forecast_unit)
                decline_method = 'FLAT'
                decline_rate = 0
            elif segment_name == SegNames.linear.value:
                final_rate = get_q_by_unit(segment, 'q_end', forecast_unit)
                decline_method = 'SPD'
                decline_rate = 'X'
            elif segment_name == SegNames.empty.value:
                if include_zero_forecast or len(forecast_segments) > 1:
                    initial_rate = NEAR_ZERO_RATE
                    final_rate = NEAR_ZERO_RATE
                    decline_method = 'FLAT'
                    decline_rate = 0
                else:
                    continue

            else:
                raise Exception(f'segment_name: {segment_name} not valid')

            this_seg = [
                phase_keyword,
                [initial_rate, final_rate, phase_unit, cutoff, cutoff_unit, decline_method, decline_rate]
            ]
            processed_segments.append(this_seg)

    processed_segments, initial_forecast_volumes = get_forecast_volumes_for_load_table(
        phase,
        processed_segments,
        forecast_segments,
        forecast_months=forecast_months,
        phase_forecast_data=phase_forecast)

    return processed_segments, initial_forecast_volumes


def adjust_phase_order(main_phase, forecast_seg_by_phase):
    phases = ALL_PHASES
    if main_phase:
        main_phase_foreacst = forecast_seg_by_phase.get(main_phase)
        if main_phase_foreacst:
            main_phase_forecast_type = main_phase_foreacst['forecastType']
            if main_phase_forecast_type == 'ratio':
                base_phase = main_phase_foreacst['ratio']['basePhase']
                phases = [*ALL_PHASES]
                phases.insert(0, phases.pop(phases.index(base_phase)))
                phases.insert(1, phases.pop(phases.index(main_phase)))
            else:
                phases = [*ALL_PHASES]
                phases.insert(0, phases.pop(phases.index(main_phase)))

    for phase in ALL_PHASES:
        phase_foreacst = forecast_seg_by_phase.get(phase)
        if phase_foreacst:
            phase_forecast_type = phase_foreacst['forecastType']
            if phase_forecast_type == 'ratio':
                base_phase = phase_foreacst['ratio']['basePhase']
                phase_idx = phases.index(phase)
                base_phase_idx = phases.index(base_phase)
                if base_phase_idx > phase_idx:
                    phases.insert(phase_idx, phases.pop(base_phase_idx))

    return phases


def get_forecast_volumes_and_date(foward_forecast, q0, segment, segment_name, start_idx, end_idx):
    if segment_name in ['arps_inc', 'arps', 'arps_modified']:
        b = segment.get('b')
        if float(b - int(b)) == 0:
            b += NEAR_ZERO_B_VALUE
        d = segment.get('D')
        if segment_name in ['arps_modified']:
            switch_idx = segment.get('sw_idx')
            q_switch = segment.get('q_sw')
            d_exp = segment.get('D_exp')
            for curr_idx in range(int(start_idx), int(end_idx)):
                foward_forecast.append(
                    [curr_idx, pred_arps_modified(curr_idx, start_idx, switch_idx, q0, q_switch, d, b, d_exp)])
        else:
            for curr_idx in range(int(start_idx), int(end_idx)):
                foward_forecast.append([curr_idx, pred_arps(curr_idx, start_idx, q0, d, b)])

    elif segment_name in ['linear']:
        k = segment.get('k')
        for curr_idx in range(int(start_idx), int(end_idx)):
            foward_forecast.append([curr_idx, pred_linear(curr_idx, q0, start_idx, k)])
    elif segment_name in ['exp_dec', 'exp_inc']:
        d = segment.get('D')
        for curr_idx in range(int(start_idx), int(end_idx)):
            foward_forecast.append([curr_idx, pred_exp(curr_idx, start_idx, q0, d)])
    elif segment_name in ['flat']:
        for curr_idx in range(int(start_idx), int(end_idx)):
            foward_forecast.append([curr_idx, q0])
    elif segment_name in ['empty']:
        for curr_idx in range(int(start_idx), int(end_idx)):
            foward_forecast.append([curr_idx, 0])

    return foward_forecast


def get_volumes_by_month(daily_index, forecast_volumes, forecast_month):
    start_idx = daily_index[0]
    end_idx = daily_index[-1]
    start_date = index_to_py_date(start_idx)
    current_date = datetime.date(start_date.year, start_date.month,
                                 calendar.monthrange(start_date.year, start_date.month)[1])
    end_of_month_idx = py_date_to_index(current_date)
    start_of_month_idx = start_idx
    row = []
    full_forecast_volumes = []
    while end_of_month_idx < end_idx:
        month_volume = round(sum(forecast_volumes[(start_of_month_idx - start_idx):(end_of_month_idx - start_idx + 1)]),
                             2)
        row.append(month_volume)
        row.append(current_date.strftime('%m/%d/%Y'))

        current_date = datetime.date(current_date.year, current_date.month, 1) + relativedelta(months=1)
        current_date = datetime.date(current_date.year, current_date.month,
                                     calendar.monthrange(current_date.year, current_date.month)[1])
        start_of_month_idx = end_of_month_idx + 1
        end_of_month_idx = py_date_to_index(current_date)
        full_forecast_volumes.append(row)
        row = []

    month_volume = round(sum(forecast_volumes[(start_of_month_idx - start_idx):]), 2)
    row.append(month_volume)
    row.append(current_date.strftime('%m/%d/%Y'))

    full_forecast_volumes.append(row)

    return np.array(full_forecast_volumes)[:forecast_month, :]


def get_forecast_volume_end_idx(start_idx, end_idx, months=24):
    if months is None:
        return end_idx

    end_date = index_to_py_date(start_idx) + relativedelta(months=months, days=-1)
    user_end_idx = py_date_to_index(end_date)

    if user_end_idx > end_idx:
        return end_idx
    return user_end_idx


def get_forecast_volumes_for_load_table(phase,
                                        processed_segments,
                                        forecast_segments,
                                        forecast_months=None,
                                        phase_forecast_data=None):

    forecast_volumes = None
    if (forecast_months is not None):
        first_start_idx = forecast_segments[0].get('start_idx')
        last_end_idx = forecast_segments[-1].get('end_idx')

        end_idx = get_forecast_volume_end_idx(first_start_idx, last_end_idx, months=forecast_months)

        use_phase = str(PHASE_MAP_DICT.get(str(phase).lower())).lower()
        idx_array = list(range(int(first_start_idx), int(end_idx) + 1))
        forecast_volumes = generate_forecast_volumes(idx_array, phase_forecast_data, use_phase, 'best', None, None,
                                                     None)

        forecast_volumes = get_volumes_by_month(idx_array, forecast_volumes, forecast_months)

        start_date = index_to_py_date(first_start_idx).strftime('%m/%Y')
        if forecast_volumes.shape[0] > 0:
            end_date = (pd.to_datetime(forecast_volumes[-1, 1]) + pd.DateOffset(months=1)).strftime('%m/%Y')

            phase_column = 'WATER' if str(phase).upper() == 'WTR' else phase
            processed_segments.append(
                ['LOAD', f'CC.{str(phase_column).upper()} {str(phase).upper()} {start_date} {end_date} #'.split()])
    return processed_segments, forecast_volumes


def validate_ratio_phase(forecast_data, phase):
    phase_forecast = forecast_data[phase]
    base_phase = phase_forecast['ratio']['basePhase']
    base_phase_forecast = forecast_data.get(base_phase)

    if not base_phase_forecast:
        return False

    if base_phase_forecast['forecastType'] == 'ratio':
        second_base_phase = base_phase_forecast['ratio']['basePhase']
        second_base_phase_forecast = forecast_data.get(second_base_phase)

        if not second_base_phase_forecast:
            return False

        if second_base_phase_forecast['forecastType'] == 'ratio':
            return False
        else:
            return True
    else:
        return True


def get_segments_phase(segments):
    phase = [s for s in segments if s[0] != 'TEXT'][0][0].lower()
    return phase


def processed_segments_to_aries_syntax(processed_segments, forecast_to_life, main_phase):
    phase_forecast_list = []
    phase = get_segments_phase(processed_segments)
    if forecast_to_life == 'yes' and processed_segments and phase != main_phase:
        keyword = processed_segments[-1][0]
        last_segment = processed_segments[-1][1]
        if last_segment[-1] != 'X' and keyword != TEXT:  # skip comment row and row that end condition is calculated
            last_segment[-4] = 'TO'
            last_segment[-3] = 'LIFE'
            if last_segment[1] != 'X' and last_segment[-2] not in ['SPD', 'LIN', 'LOG', 'FLAT']:
                # SPD, LIN, LOG, FLAT need end rate to define the segment
                last_segment[1] = 'X'

    for row in processed_segments:
        phase_forecast_list.append([row[0], list_to_expression(row[1])])

    return phase_forecast_list


def add_cum_row(forecast_ret, production_dict, forecast_seg_by_phase):
    if production_dict:
        cums_ls = get_cums_from_production(forecast_seg_by_phase, production_dict)
        all_zeros = validate_cums_ls(cums_ls)
        if not all_zeros:
            cum_row = ['CUMS', list_to_expression(cums_ls)]
            forecast_ret.insert(0, cum_row)


def process_start_date_for_greater_than_hundred_yr_forecasts(start_date, forecast_segments):
    start_idx = forecast_segments[0].get('start_idx')
    end_idx = forecast_segments[-1].get('end_idx')
    if start_date is not None:
        forecast_start_date = start_date
    else:
        forecast_start_date = index_to_py_date(start_idx)
    if np.datetime64(forecast_start_date) < np.datetime64(MINIMUM_FORECAST_START_DATE):
        duration = ((end_idx - start_idx) + 1) / DAYS_IN_YEAR
        if duration > MAX_ARIES_FORECAST_RUN_YRS:
            new_start_date = index_to_py_date(end_idx - (DAYS_IN_YEAR * MAX_ARIES_FORECAST_RUN_YRS - 1))
            new_start_date = datetime.date(new_start_date.year, 1, 1).strftime('%Y-%m-%d')
            return new_start_date
    return start_date


def check_forecast_start_date_is_not_less_than_min_forecast_date(forecast_segments):
    start_idx = forecast_segments[0].get('start_idx')
    new_start_date = index_to_py_date(start_idx)
    if new_start_date.year < 2000:
        return MINIMUM_FORECAST_START_DATE


def forecast_conv(
    forecast_data,
    pct_key_by_phase,
    aries_start_log,
    date_dict=None,
    production_dict=None,
    start_date_dict=DEFAULT_PHASE_START_DATE_DICT,
    seg_end='years',
    forecast_unit='per_day',
    forecast_to_life='no',
    include_zero_forecast=False,
    output_cums=True,
    forecast_history_match=False,
    same_as_forecasts_months_number=None,
    main_phase=None,
    shut_in=None,
    forecast_only_export=False,
    uses_ecl_link=False,
    ecl_links={},
):
    forecast_months = same_as_forecasts_months_number
    forecast_ret = []
    forecast_seg_by_phase = {p: None for p in ALL_PHASES}
    forecast_by_phase = {p: None for p in ALL_PHASES}
    multi_seg = MultipleSegments()
    if shut_in:
        as_of_date = to_date(date_dict['offset_to_as_of_date'])
        shut_in_params = process_shut_in(shut_in, as_of_date)

    phases = adjust_phase_order(main_phase, forecast_data)
    initial_forecast_volumes_phase = {}
    for phase in phases:
        start_date = start_date_dict.get(phase)
        phase_keyword = KEYWORD_DICT[phase]
        phase_unit = UNIT_DICT[phase][forecast_unit]
        phase_forecast = forecast_data[phase]
        phase_pct_key = pct_key_by_phase[phase]
        #
        if phase_forecast is None:
            continue

        phase_forecast_type = phase_forecast['forecastType']

        if phase_forecast_type == 'ratio' and has_segments(phase_forecast['ratio']):
            base_phase = phase_forecast['ratio']['basePhase']

            if not validate_ratio_phase(forecast_data, phase):
                continue

            base_phase_keyword = KEYWORD_DICT[base_phase]
            phase_keyword = f'{phase_keyword}/{base_phase_keyword}'

            cc_ratio_key = f'{phase}/{base_phase}'
            phase_unit = UNIT_DICT[cc_ratio_key]
            forecast_segments = copy.deepcopy(phase_forecast['ratio']['segments'])

        elif phase_pct_key in phase_forecast['P_dict'] and has_segments(phase_forecast['P_dict'][phase_pct_key]):
            forecast_segments = copy.deepcopy(phase_forecast['P_dict'][phase_pct_key]['segments'])

        else:
            continue

        if forecast_only_export:
            start_date = process_start_date_for_greater_than_hundred_yr_forecasts(start_date, forecast_segments)
            forecast_segments = multi_seg.apply_forecast_start_date(forecast_segments, start_date)
        else:
            start_date = check_forecast_start_date_is_not_less_than_min_forecast_date(forecast_segments)
            if start_date is not None:
                forecast_segments = multi_seg.apply_forecast_start_date(forecast_segments, start_date)

        if shut_in and phase_forecast_type != 'ratio':  # ignore shut in for ratio forecast
            phase_shut_in_params = shut_in_params[phase]
            if len(phase_shut_in_params):
                forecast_segments = multi_seg.apply_shutin(
                    phase_shut_in_params,
                    forecast_segments,
                    {'stack_multiplier': True},
                )
        if forecast_segments:
            forecast_start_index = int(forecast_segments[0]['start_idx'])
        else:
            continue

        forecast_seg_by_phase[phase] = forecast_segments
        forecast_by_phase[phase] = phase_forecast

        if phase_forecast_type == 'ratio':
            processed_segments, initial_forecast_volumes = process_ratio_segments(forecast_segments,
                                                                                  forecast_data,
                                                                                  pct_key_by_phase,
                                                                                  date_dict,
                                                                                  phase_unit,
                                                                                  phase_keyword,
                                                                                  seg_end,
                                                                                  include_zero_forecast,
                                                                                  forecast_months=forecast_months,
                                                                                  phase_forecast=forecast_by_phase)

        else:
            processed_segments, initial_forecast_volumes = process_normal_segments(forecast_segments,
                                                                                   date_dict,
                                                                                   phase_unit,
                                                                                   phase_keyword,
                                                                                   seg_end,
                                                                                   forecast_unit,
                                                                                   forecast_history_match,
                                                                                   include_zero_forecast,
                                                                                   forecast_months=forecast_months,
                                                                                   phase_forecast=forecast_by_phase)
        initial_forecast_volumes_phase[phase] = initial_forecast_volumes

        if processed_segments:
            phase_forecast_list = processed_segments_to_aries_syntax(processed_segments, forecast_to_life, main_phase)

            if [s for s in processed_segments if s[0] not in [TEXT, ERROR, '*OIL']]:
                # only add START when valid segment exits
                start_ad = cc_index_to_aries_date(forecast_start_index, date_dict, cut_off=False)
                move_to_next_month = any(' '.join([str(item) for item in row[-1]]) == FORECAST_MOVE_TO_NEXT_MONTH_TEXT
                                         for row in processed_segments)
                start_ad = ((pd.to_datetime(start_ad)
                             + pd.DateOffset(months=1)).strftime('%m/%Y') if move_to_next_month else start_ad)
                if uses_ecl_link:
                    start_ad = uses_ecl_link
                    forecast_ret = aries_start_log.add_start_and_update_current_start(start_ad,
                                                                                      forecast_ret,
                                                                                      date_dict,
                                                                                      ecl_links=ecl_links)
                else:
                    forecast_ret = aries_start_log.add_start_and_update_current_start(start_ad, forecast_ret, date_dict)

            forecast_ret += phase_forecast_list

    if output_cums:
        add_cum_row(forecast_ret, production_dict, forecast_seg_by_phase)

    if forecast_only_export:
        return forecast_ret
    else:
        return forecast_ret, initial_forecast_volumes_phase


########
##
def need_btu(pri_econ, diff_econ):
    gas_price_key_list = pri_econ['price_model']['gas']['rows'][0].keys()
    gas_diff_key_list = []
    for diff in diff_econ['differentials'].values():
        gas_diff_key_list += diff['gas']['rows'][0].keys()
    if 'dollar_per_mmbtu' in gas_price_key_list:
        if 'dollar_per_mcf' in gas_diff_key_list:
            warnings.warn('Gas Price is based on MMBTU, Gas Differential can not be based on MCF!')
        return True
    elif 'dollar_per_mcf' in gas_price_key_list:
        if 'dollar_per_mmbtu' in gas_diff_key_list:
            warnings.warn('Gas Price is based on MCF, Gas Differential can not be based on MMBTU!')
        return False


##
def get_first_segment(well_header, forecast_data, pct_key):
    if 'primary_product' in well_header.keys() and well_header['primary_product'] is not None:
        main_phase = well_header['primary_product'].lower()
        #
        if main_phase == 'g':
            main_phase = 'gas'
        if main_phase == 'o':
            main_phase = 'oil'
        #
        if main_phase not in forecast_data.keys() or forecast_data[main_phase] == {} or len(
                forecast_data[main_phase]['P_dict']['P50']['segments']) == 0:
            main_phase = ''
    else:
        main_phase = ''
    #
    if main_phase == '':
        if forecast_data['oil'] != {}:
            main_phase = 'oil'
        elif forecast_data['gas'] != {}:
            main_phase = 'gas'
    first_segment_index = int(forecast_data[main_phase]['P_dict'][pct_key]['segments'][0]['start_idx'])
    fsd = str(CC_BASE_DATE + first_segment_index)
    return fsd


ASSUMP_NUM_DICT = {
    'stream_properties': 2,
    'dates': 2,
    'forecast': 4,
    'yield': 4,
    'risking': 4,
    'pricing': 5,
    'differentials': 5,
    'expenses': 6,
    'production_taxes': 6,
    'ownership_reversion': 7,
    'capex': 8,
    'production_vs_fit': 9,
    'stream_properties_overlay': 9,
    'expenses_overlay': 9,
    'production_taxes_overlay': 9,
    'yield_overlay': 9
}

NGL_CND_SEV_TAX_CODE_DICT = {'NGL': '63', 'CND': '61'}

ASSUMP_FUNC_DICT = {
    'pricing': pricing_conv,
    'differentials': differentials_conv,
    'expenses': expenses_conv,
    'production_taxes': production_taxes_conv,
    'production_taxes_overlay': production_taxes_overlay_conv,
    'ownership_reversion': ownership_reversion_conv,
    'risking': risking_conv,
    'production_vs_fit': production_vs_fit_conv,
    'stream_properties_overlay': stream_properties_conv,
    'expenses_overlay': expenses_overlay_conv
}

GROSS_KEY_DICT = {
    ('oil', 'shrinkage'): 'S/391',
    ('oil', 'loss_flare'): 'S/370',
    ('gas', 'shrinkage'): 'S/392',
    ('gas', 'loss_flare'): 'S/371',
    ('gas', 'loss_flare'): 'S/371'
}

PHASE_MAP_DICT = {'oil': 'oil', 'gas': 'gas', 'wtr': 'water'}

DIFFERENTIAL_OVERLAY_DICT = {'PAJ/OIL': 'S/195', 'PAJ/GAS': 'S/196', 'PAJ/CND': 'S/197', 'PAJ/NGL': 'S/199'}

CATEGORY_NAME_CONVERSION = {
    'gathering': 'G & P',
    'processing': 'OPC',
    'transportation': 'TRN',
    'marketing': 'MKT',
    'other': 'other'
}

PARTIAL_KEYWORD_SIDEFILE_LS_DICT = {'dates': ['ELOSS', 'LOSS', 'LIFE']}

SIDEFILE_NAME_CONV_DICT = {
    'dates': 'CUTOFF',
    'risking': 'RISK',
    'pricing': 'PRI',
    'differentials': 'DIFF',
    'expenses': 'EXP',
    'production_taxes': 'PTAX',
    'stream_properties': 'STREAM',
    'yield': 'YIELD',
    'ownership_reversion': 'OWN',
    'capex': 'INV'
}


def process_assumption(
    context,
    well_id,
    well_header,
    assumptions,
    forecast_data,
    schedule,
    assump_key,
    production_data,
    monthly_daily_dict,
    pct_key_by_phase,
    main_phase,
    aries_start_log,
    date_dict,
    cut_off_and_major,
    aries_setting,
    lookup_table_dict,
    user_work_stream=None,
    ref_name_dict={},
    phase_workstream=set(),
    well_mapping={},
    cc_load_volumes=[],
    sidefile_doc={},
    lookup_name_alias_dict={},
    lookup_overlay_rows=[],
    cutoff_changed=False,
    uses_ecl_link=False,
    ecl_links={},
):
    initial_forecast_volume_phase = None
    if assump_key in ['forecast', 'yield', 'yield_overlay', 'risking']:
        # if forecast overlay, ignore this part of code
        if assump_key in ['forecast', 'yield']:
            ## forecast
            if not has_forecast(forecast_data):
                this_forecast_aries = []
                asof_forecast_start_date = cc_date_to_aries_date(date_dict['offset_to_as_of_date'], date_dict)
                if uses_ecl_link:
                    this_forecast_aries.append(['*START', ecl_links.get(uses_ecl_link)])
                else:
                    this_forecast_aries.append(['*START', asof_forecast_start_date])
                this_forecast_aries.append(['*OIL', '0 X B/M 1200 IMO FLAT 0'])
                this_forecast_aries.append([ERROR, 'LOOK HERE!'])
                this_forecast_aries.append([TEXT, 'FORECAST NOT DETECTED IN CC'])
                this_forecast_aries.append([TEXT, 'UNSTAR THE OIL FORECAST TO ALLOW CASE TO RUN'])
            else:
                production_dict = {
                    'data_resolution': aries_setting['data_resolution'],  # selected data resolution
                    'phase_freq': {
                        phase: production_data[phase]['data_freq'] if production_data[phase] else 'monthly'
                        for phase in production_data
                    },  # forecast data resolution
                    'monthly_dict': monthly_daily_dict['monthly'].get(well_id),
                    'daily_dict': monthly_daily_dict['daily'].get(well_id),
                }

                if assumptions['risking']:
                    shut_in = assumptions['risking'].get('shutIn', None)
                else:
                    shut_in = None

                seg_end = aries_setting['seg_end']
                forecast_unit = aries_setting['forecast_unit']
                forecast_to_life = aries_setting['forecast_to_life']
                include_zero_forecast = aries_setting['include_zero_forecast']
                output_cums = aries_setting['output_cums']
                forecast_history_match = aries_setting['forecast_history_match']
                same_as_forecasts_months_number = aries_setting['same_as_forecasts_months_number']

                this_forecast_aries, initial_forecast_volume_phase = forecast_conv(
                    forecast_data,
                    pct_key_by_phase,
                    aries_start_log,
                    date_dict,
                    production_dict,
                    seg_end=seg_end,
                    forecast_unit=forecast_unit,
                    forecast_to_life=forecast_to_life,
                    include_zero_forecast=include_zero_forecast,
                    output_cums=output_cums,
                    forecast_history_match=forecast_history_match,
                    same_as_forecasts_months_number=same_as_forecasts_months_number,
                    main_phase=main_phase,
                    shut_in=shut_in,
                    uses_ecl_link=uses_ecl_link,
                    ecl_links=ecl_links,
                )
        # apply for both forecast and forecast overlay
        ## yield
        this_yield_econ = assumptions['stream_properties']['yields']
        # set overlay to true if forecast_overlay
        overlay = False
        if 'overlay' in assump_key:
            overlay = True
        shrink_count = len(assumptions['stream_properties']['shrinkage']['gas']['rows'])
        this_yield_aries = yield_conv(this_yield_econ,
                                      date_dict,
                                      aries_start_log,
                                      shrink_count,
                                      well_header,
                                      overlay=overlay)

        if assump_key == 'risking':
            risking_econ = assumptions['risking']
            this_risking_aries = risking_conv(risking_econ, date_dict, aries_start_log)
            this_assump_aries = this_risking_aries
        elif assump_key == 'yield':
            if any(['GAS' in phase_seg[0] for phase_seg in this_forecast_aries]):
                this_assump_aries = this_yield_aries
            else:
                this_assump_aries = []
        elif not overlay:
            this_assump_aries = this_forecast_aries
        else:
            this_assump_aries = this_yield_aries

    else:
        this_assump_econ = assumptions[assump_key.split('_overlay')[0]]

        if assump_key == 'capex':
            this_assump_aries, _, _ = capex_conv(
                this_assump_econ,
                date_dict,
                well_header,
                schedule,
                ref_name_dict,
            )
            this_assump_aries, cutoff_changed = process_lookup_table_from_capex_doc(context,
                                                                                    this_assump_aries,
                                                                                    this_assump_econ,
                                                                                    assump_key,
                                                                                    date_dict,
                                                                                    well_header,
                                                                                    schedule,
                                                                                    ref_name_dict,
                                                                                    well_mapping,
                                                                                    lookup_table_dict,
                                                                                    sidefile_doc,
                                                                                    lookup_name_alias_dict,
                                                                                    cut_off_and_major,
                                                                                    cutoff_changed=cutoff_changed)
        elif assump_key == 'stream_properties':
            pri_econ = assumptions['pricing']
            diff_econ = assumptions['differentials']
            btu_bool = need_btu(pri_econ, diff_econ)
            this_assump_aries = btu_shrink_conv(this_assump_econ, btu_bool, well_header, cut_off_and_major)
        elif assump_key == 'dates':
            this_assump_aries = cut_off_and_major
        elif assump_key == 'expenses':
            capex_econ = assumptions['capex']
            this_assump_aries = ASSUMP_FUNC_DICT[assump_key](this_assump_econ,
                                                             capex_econ,
                                                             date_dict,
                                                             aries_start_log,
                                                             user_work_stream=user_work_stream,
                                                             phase_workstream=phase_workstream)
            this_assump_aries = process_lookup_table_from_expense_doc(context, this_assump_aries, this_assump_econ,
                                                                      assump_key, date_dict, well_header, well_mapping,
                                                                      lookup_table_dict, sidefile_doc,
                                                                      lookup_name_alias_dict, lookup_overlay_rows,
                                                                      user_work_stream, phase_workstream,
                                                                      aries_start_log)
        elif assump_key == 'production_vs_fit':
            this_assump_aries = ASSUMP_FUNC_DICT[assump_key](this_assump_econ,
                                                             date_dict,
                                                             aries_setting,
                                                             user_work_stream=user_work_stream)
            this_assump_aries = process_production_vs_fit(this_assump_aries, cc_load_volumes, production_data)
        else:
            this_assump_aries = ASSUMP_FUNC_DICT[assump_key](this_assump_econ,
                                                             date_dict,
                                                             aries_start_log,
                                                             user_work_stream=user_work_stream)

    return this_assump_aries, initial_forecast_volume_phase, cutoff_changed


def process_production_vs_fit(this_assump_aries, cc_load_volumes, production_data):
    load_full = False
    original_phase_dict = get_number_of_load_rows_per_phase(this_assump_aries, production_data)
    num_load = sum(list(original_phase_dict.values()))
    if num_load >= MAX_LOAD_ROW:
        load_full = True
        this_assump_aries.insert(0, [TEXT, 'TOO MANY ROWS FOR ARIES TO LOAD, PLEASE REVIEW!'])

    if len(cc_load_volumes) == 0:
        return this_assump_aries

    cc_table_phase_dict = get_number_of_load_rows_per_phase(cc_load_volumes, production_data)
    cc_num_load = sum(list(cc_table_phase_dict.values()))

    if cc_num_load == 0:
        return this_assump_aries

    if (cc_num_load + num_load) > MAX_LOAD_ROW and num_load < MAX_LOAD_ROW:
        usable_num_months = int((MAX_LOAD_ROW - num_load) / len(list(cc_table_phase_dict.keys())))

        this_assump_aries.insert(
            0, [TEXT, f'VOLUME LOAD CUT TO {usable_num_months} MONTHS, VOLUMES AVAI. IN CC_FORECAST TABLE'])
        this_assump_aries.insert(0, [TEXT, 'ARIES HAS LIMITS ON LOAD LINES IN OVERLAY SECTION'])

        for row in cc_load_volumes:
            load_expression = str(row[1]).split()
            if not (pd.isnull(pd.to_datetime(load_expression[2], errors='coerce'))
                    and pd.isnull(pd.to_datetime(load_expression[3], errors='coerce'))):
                duration_days = pd.to_datetime(load_expression[3]) - pd.to_datetime(load_expression[2])
                current_duration = int((duration_days / np.timedelta64(1, 'M')) - 1)
                if current_duration > usable_num_months:
                    load_expression[3] = (pd.to_datetime(load_expression[2])
                                          + pd.DateOffset(months=usable_num_months + 1)).strftime('%m/%Y')
            row[1] = ' '.join([str(value) for value in load_expression])

    for row in cc_load_volumes[::-1]:
        if load_full:
            row[0] = f'*{row[0]}'
        this_assump_aries.insert(0, row)
    if load_full:
        this_assump_aries.insert(0, [TEXT, 'LOAD LINES LIMIT MAY HAVE BEEN EXCEEDED, PLEASE REVIEW!'])

    return this_assump_aries


def get_number_of_load_rows_per_phase(rows, production_data):
    phase_dict = {}
    for row in rows:
        if row[0] == 'LOAD':
            load_expression = str(row[1]).split()
            if any(phase in str(load_expression[0]).lower() for phase in ['oil', 'gas', 'water']):
                phase = next(phase for phase in ['oil', 'gas', 'water'] if phase in load_expression[0].lower())

                if load_expression[3] == 'X' and not pd.isnull(pd.to_datetime(load_expression[2], errors='coerce')):
                    formatted_date = pd.to_datetime(load_expression[2])
                    formatted_date = datetime.date(formatted_date.year, formatted_date.month, 15)
                    monthly_prod_index = py_date_to_index(formatted_date)
                    if production_data.get(phase) is not None:
                        index_ls = production_data.get(phase).get('index')
                        if index_ls is not None:
                            if monthly_prod_index in index_ls:
                                phase_dict[phase] = (len(index_ls) - index_ls.index(monthly_prod_index))

                elif not (pd.isnull(pd.to_datetime(load_expression[2], errors='coerce'))
                          and pd.isnull(pd.to_datetime(load_expression[3], errors='coerce'))):
                    phase_dict[phase] = int(((pd.to_datetime(load_expression[3]) - pd.to_datetime(load_expression[2]))
                                             / np.timedelta64(1, 'M')))

    return phase_dict


def set_aries_default_assumptions(assumptions, key):
    if key == 'production_vs_fit':
        for phase in ['oil', 'gas', 'water']:
            assumptions[key]['production_vs_fit_model']['replace_actual'][phase] = {'as_of_date': ''}
    return assumptions


def get_key_sidefile_info(assumptions, this_assump_aries, assump_key, this_seq, use_sidefile, ac_econ_list,
                          sidefile_alias_conv_dict, ar_sidefile_dict, propnum, well_name, well_number, inpt_id, api10,
                          api12, api14, chosen_id, aries_id, phdwin_id):
    sidefile_present = False
    sidefile_seq = this_seq
    if 'forecast' not in assump_key:
        use_key = assump_key.split('_overlay')[0]
        assumption_name = assumptions[use_key].get(
            'name') if use_key != 'yield' else assumptions['stream_properties'].get('name')
        model_unique = assumptions[use_key].get(
            'unique') if use_key != 'yield' else assumptions['stream_properties'].get('unique')
        if not use_sidefile:
            model_unique = True
        clean_assumption_name = re.sub(r'[_:*$%@&()-/\s]+', '', str(assumption_name))
        sidefile_name = f'{SIDEFILE_NAME_CONV_DICT.get(use_key)}_{clean_assumption_name}'.upper()
        if len(sidefile_name) > MAX_SIDEFILE_NAME_LEN:
            if sidefile_name in sidefile_alias_conv_dict:
                sidefile_name = sidefile_alias_conv_dict.get(sidefile_name)
            else:
                reduce_length = (len(sidefile_name) + LEN_MODEL_IDX) - MAX_SIDEFILE_NAME_LEN
                new_sidefile_name = f'{SIDEFILE_NAME_CONV_DICT.get(use_key)}_{clean_assumption_name[:-reduce_length]}'
                model_idx = 0
                for alias in sidefile_alias_conv_dict.values():
                    if str(alias).rsplit('_', 1)[0] == new_sidefile_name:
                        if int(float(str(alias).rsplit('_', 1)[1])) > model_idx:
                            model_idx = int(float(str(alias).rsplit('_', 1)[1]))
                model_idx += 1
                model_idx = format_model_index(model_idx)
                new_sidefile_name = f'{new_sidefile_name}_{model_idx}'.upper()
                sidefile_alias_conv_dict[sidefile_name] = new_sidefile_name
                sidefile_name = new_sidefile_name

        if (use_key in SIDEFILE_NAME_CONV_DICT) and (sidefile_name in ar_sidefile_dict):
            ignore_sidefile_row = False
            # check if a sidefile should be added to overlay, if no section 9 is found in the rows
            # it should be ignored
            if 'overlay' in assump_key and not any(row[SECTION_INDEX] == 9 for row in ar_sidefile_dict[sidefile_name]):
                ignore_sidefile_row = True
            # if a sidefile has all section 9 and is not in the overlay section the sidefile should also be ignored
            elif 'overlay' not in assump_key and all(row[SECTION_INDEX] == 9
                                                     for row in ar_sidefile_dict[sidefile_name]):
                ignore_sidefile_row = True

            if validate_cut_off(this_assump_aries, use_key):
                ignore_sidefile_row = True

            if not ignore_sidefile_row:
                sidefile_seq = ar_sidefile_dict[sidefile_name][-1][SEQ_INDEX]
                if (ac_econ_list[-1][SECTION_INDEX] == ASSUMP_NUM_DICT[assump_key] and sidefile_seq <= this_seq):
                    sidefile_seq = this_seq + 1
                sidefile_row = [
                    propnum, well_name, well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id,
                    ASSUMP_NUM_DICT[assump_key], sidefile_seq, 'CC_QUAL', SIDEFILE, sidefile_name
                ]
                ac_econ_list.append(sidefile_row)
            if use_key not in PARTIAL_KEYWORD_SIDEFILE_LS_DICT:
                sidefile_present = True
    else:
        use_key, assumption_name, sidefile_name, model_unique = None, None, None, None

    return (ac_econ_list, sidefile_alias_conv_dict, use_key, assumption_name, sidefile_name, model_unique,
            sidefile_present, sidefile_seq)


def update_well_sidefile_dict(well_sidefile_dict, ar_sidefile_dict, sidefile_name, use_key, model_unique,
                              assumption_name, ignore_date_sidefile, this_assump_aries):

    if (ar_sidefile_dict.get(sidefile_name)
            is not None) and (use_key in PARTIAL_KEYWORD_SIDEFILE_LS_DICT) and not model_unique and (
                assumption_name is not None) and (len(this_assump_aries) != 0) and not ignore_date_sidefile:
        return well_sidefile_dict, True
    if (well_sidefile_dict.get(sidefile_name)) is None and (
            use_key in SIDEFILE_NAME_CONV_DICT) and not model_unique and (assumption_name is not None) and (
                len(this_assump_aries) != 0) and not ignore_date_sidefile:
        well_sidefile_dict[sidefile_name] = []
    return well_sidefile_dict, False


def convert_sidefile_dict_to_df(ar_sidefile_dict):
    ar_sidefile_ls = []
    for sidefile_name in ar_sidefile_dict:
        for sidefile_row in ar_sidefile_dict[sidefile_name]:
            sidefile_row.insert(0, sidefile_name)
            ar_sidefile_ls.append(sidefile_row)

    ar_sidefile_df = pd.DataFrame(ar_sidefile_ls, columns=['FILENAME'] + AC_ECONOMIC_HEADERS)
    ar_sidefile_df = ar_sidefile_df[AR_SIDEFILE_HEADERS]

    return ar_sidefile_df


def convert_lookup_dict_to_df(lookup_table_dict):
    ar_lookup_ls = []
    for lookup_rows in lookup_table_dict.values():
        for row in lookup_rows:
            full_row = [*row, *[None] * (34 - len(row))]
            full_row.insert(11, None)
            ar_lookup_ls.append(full_row)

    ar_lookup_df = pd.DataFrame(ar_lookup_ls, columns=AR_LOOKUP_HEADERS)

    return ar_lookup_df


def update_partial_sidefile_models(well_sidefile_dict, ac_econ_list, sidefile_name, sidefile_cutoff_detected, use_key,
                                   model_unique, this_full_ac_row, ignore_date_sidefile):

    if not ignore_date_sidefile and (this_full_ac_row[-2]
                                     in PARTIAL_KEYWORD_SIDEFILE_LS_DICT[use_key]) and not model_unique:
        if not sidefile_cutoff_detected and (this_full_ac_row
                                             not in well_sidefile_dict[sidefile_name]) and (sidefile_name
                                                                                            in well_sidefile_dict):
            well_sidefile_dict[sidefile_name].append(this_full_ac_row)
    else:
        if this_full_ac_row not in ac_econ_list:
            ac_econ_list.append(this_full_ac_row)
    return ac_econ_list, well_sidefile_dict


def ignore_aban_keyword_for_expense_sidefiles(well_sidefile_dict, ac_econ_list, sidefile_name, model_unique,
                                              this_full_ac_row, assump_key, this_seq, lookup_overlay_rows, props):
    if this_full_ac_row[-2] not in ['ABAN', 'SALV'] and not model_unique:
        if sidefile_name in well_sidefile_dict:
            well_sidefile_dict[sidefile_name].append(this_full_ac_row)
    else:
        if this_full_ac_row not in ac_econ_list:
            ac_econ_list.append(this_full_ac_row)
    return ac_econ_list, well_sidefile_dict, this_seq


def add_expense_lookup_row(econ_rows, lookup_overlay_rows, assump_key, zero_expense_workstream):
    if assump_key == 'expenses_overlay':
        for expense_workstream in zero_expense_workstream:
            econ_rows.append([expense_workstream, '0 X FRAC @M.FIRST_PROD_DATE AD'])
        for row in lookup_overlay_rows:
            econ_rows.append(row)
    return econ_rows


def update_phase_workstream(phase_workstream, keyword, unit_key, rows):
    if unit_key in ['dollar_per_bbl', 'dollar_per_mcf', 'dollar_per_mmbtu'
                    ] and not (len(rows) == 1 and rows[0][unit_key] == 0):
        phase = str(keyword).split('/')[-1]
        if phase in PHASE_STREAM_CONV_DICT:
            phase_workstream.add(phase)


def add_workstream_phase(econ_rows, phase_workstream, assump_key):
    if assump_key == 'yield_overlay':
        for phase in phase_workstream:
            if phase in PHASE_STREAM_CONV_DICT:
                econ_rows.append([phase, f'1 X FRAC TO LIFE MUL {PHASE_STREAM_CONV_DICT.get(phase)}'])
    return econ_rows


def add_sidefile_row_if_criteria_met(ac_econ_list, assumption_name, sidefile_name, assump_key, model_unique, use_key,
                                     this_assump_aries, this_seq, propnum, well_name, well_number, inpt_id, api10,
                                     api12, api14, chosen_id, aries_id, phdwin_id):
    if (not model_unique and use_key in SIDEFILE_NAME_CONV_DICT and assumption_name is not None
            and len(this_assump_aries) != 0):
        if (use_key
                in PARTIAL_KEYWORD_SIDEFILE_LS_DICT) or (ac_econ_list[-1][SECTION_INDEX] == ASSUMP_NUM_DICT[assump_key]
                                                         and ac_econ_list[-1][SEQ_INDEX] == this_seq):
            this_seq += 1

        sidefile_row = [
            propnum, well_name, well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id,
            ASSUMP_NUM_DICT[assump_key], this_seq, 'CC_QUAL', SIDEFILE, sidefile_name
        ]
        if sidefile_row not in ac_econ_list:
            ac_econ_list.append(sidefile_row)
    return ac_econ_list, this_seq


def add_cutoff_sidefile_row(ar_sidefile_dict, ac_econ_list, sidefile_name, assump_key, this_seq, propnum, well_name,
                            well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id):
    sidefile_seq = ar_sidefile_dict[sidefile_name][-1][SEQ_INDEX]
    if (ac_econ_list[-1][SECTION_INDEX] == ASSUMP_NUM_DICT[assump_key] and sidefile_seq <= this_seq):
        sidefile_seq = this_seq + 1
    sidefile_row = [
        propnum, well_name, well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id,
        ASSUMP_NUM_DICT[assump_key], sidefile_seq, 'CC_QUAL', SIDEFILE, sidefile_name
    ]
    ac_econ_list.append(sidefile_row)

    return ac_econ_list


def reset_start_when_creating_sidefile(aries_start_log, well_sidefile_dict, sidefile_name, sidefile_present, use_key,
                                       model_unique, assumption_name):
    if (well_sidefile_dict.get(sidefile_name)) is None and (
            use_key in SIDEFILE_NAME_CONV_DICT) and not model_unique and (assumption_name
                                                                          is not None) and not sidefile_present:
        aries_start_log.current_start = None

    return aries_start_log


def validate_cut_off(this_assump_aries, use_key):
    ignore_date_sidefile = False
    if use_key == 'dates':
        for row in this_assump_aries:
            if row[-1] == 'OPNET ONLY WORKS WITH OPINC':
                ignore_date_sidefile = True
    return ignore_date_sidefile


def format_model_index(model_index):
    if len(str(model_index)) < NUM_TRAILING_ZEROS + 1:
        added_zero = (NUM_TRAILING_ZEROS + 1) - len(str(model_index))
        return (added_zero * '0') + str(model_index)
    return model_index


def update_cc_forecast_volumes(volumes, propnum, initial_forecast_volume_phase, this_assump_aries, cc_load_volumes):
    if initial_forecast_volume_phase is None or all(value is None for value in initial_forecast_volume_phase.values()):
        return volumes, this_assump_aries, cc_load_volumes
    volumes[propnum] = initial_forecast_volume_phase
    new_this_assump_aries = []
    for row in this_assump_aries:
        if len(row) > 0 and row[0] == 'LOAD':
            cc_load_volumes.append(row)
        else:
            new_this_assump_aries.append(row)

    return volumes, new_this_assump_aries, cc_load_volumes


def get_custom_mappings(dictionary):
    return {key: extract_custom_type(value) for key, value in dictionary.items() if 'custom_' in key}


def extract_custom_type(mapping_value):
    inpt_mapped_value = mapping_value.get('inpt', [None])[0]
    if inpt_mapped_value is not None:
        inpt_mapped_value = '_'.join(inpt_mapped_value.split())
    return inpt_mapped_value


def map_dictionary(dictionary, mapper):
    for key in mapper:
        if key in dictionary:
            dictionary[mapper[key]] = dictionary.pop(key)


def update_abandonment_lines(cutoff_changed, assump_key, ac_econ_list, cut_off_and_major, row_prefix):
    """Find section 2 lines in ac_econ_list and update with new lines from cutoff_and_major.
       Add abandonment line to capex output lines if present in cutoff_and_major.

    Args:
        cutoff_changed(bool): True if cutoff date changed
        assump_key(str): key of current assumption being processed
        ac_econ_list (list[list]): list of lines to be written to Economic table
        cut_off_and_major(list): List of date lines
        row_prefix (list): List of values to be prepended to each line in cut_off_and_major
    """

    this_seq = row_prefix[SEQ_INDEX]
    well_id = row_prefix[ARIES_ID_INDEX]
    if assump_key == 'capex' and cutoff_changed:
        # find start and end index of section 2 lines
        section_2_index = 0
        section_2_end = 0
        start_found = False
        for i, line in enumerate(ac_econ_list):
            if line[ARIES_ID_INDEX] != well_id:
                continue
            if not start_found and line[SECTION_INDEX] == 2:
                section_2_index = i
                start_found = True
            elif start_found and line[SECTION_INDEX] != 2:
                section_2_end = i
                break
        append_rows = []

        # convert cut_off_and_major to output rows for Economic table
        for idx, line in enumerate(cut_off_and_major):
            row_prefix[SEQ_INDEX] = idx
            append_rows.append(row_prefix + line)
        cutoff_changed = False
        this_seq = append_rows[-1][SEQ_INDEX] + 1
        # replace section 2 lines with new lines
        ac_econ_list = ac_econ_list[:section_2_index] + append_rows + ac_econ_list[section_2_index + section_2_end:]
    return ac_econ_list, this_seq, cutoff_changed


def convert_to_aries_date(dte):
    yr = dte.year
    mo = dte.month
    day = dte.day
    return yr * 12 + mo if day > 15 else yr * 12 + mo - 1


def get_ar_enddate(ecl_links):
    end_date_rows = []
    for link in ecl_links:
        linked_wells = ecl_links.get(link)
        fpd = linked_wells.get('fpd_date')
        end_date_rows.append(['B3JER', link, convert_to_aries_date(fpd)])
    end_date_df = pd.DataFrame(end_date_rows, columns=AR_ENDDATE_HEADERS)
    return end_date_df


def get_ac_economic(
    context,
    user_id,
    notification_id,
    progress_range,
    well_data_list,
    monthly_daily_dict,
    aries_setting,
    project_id,
    scenario_id,
    well_id_link,
    combos,
):

    #### batch query
    display_template = DisplayTemplatesService(context)
    all_well_header_mappings = display_template.get_full_source_conversions(WELL_HEADER_CONVERSION_KEY)
    custom_mappings = get_custom_mappings(all_well_header_mappings)
    total_prog_start = progress_range[0]
    total_prog_end = progress_range[1]
    query_prog = round((total_prog_end - total_prog_start) * 0.6 + total_prog_start)
    context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
        '_id': notification_id,
        'progress': query_prog
    })

    #### construct AC_ECONOMIC
    ac_econ_list = []

    # dictionary to store whole export sidefiles
    ar_sidefile_dict = {}
    lookup_table_dict = {}
    lookup_sidefile_dict = {}
    lookup_name_alias_dict = {}
    # used to store sidefile names when values are too long for ARIES
    sidefile_alias_conv_dict = {}
    min_base_date = None
    macro_dict = {}
    cc_forecast_volumes = {}
    ref_name_dict = {}
    ac_property_updates = set()

    # sort well by name
    well_order_list = get_well_order_by_names([w['well'].get('well_name', '') for w in well_data_list])
    use_sidefile = aries_setting['sidefile']

    # dict to hold ecl linked dates as they've been processed
    ecl_links = {}

    ## fill in AC_ECONOMIC
    for index, well_order in enumerate(well_order_list):
        well_data = well_data_list[well_order]

        well_header = well_data['well']
        map_dictionary(well_header, custom_mappings)
        pct_key = well_data['p_series']
        assumptions = well_data['assumptions']
        forecast_data = well_data['forecast_data']
        production_data = well_data['production_data']

        schedule = well_data.get('schedule')
        if schedule and schedule.get('FPD'):
            forecast_data = adjust_forecast_start(forecast_data, schedule['FPD'])

        # fill in default assumption if assumption is missing
        for key in ASSUMPTION_FIELDS:
            if key not in assumptions.keys() and key != 'emission':
                assumptions[key] = get_default(key)
                assumptions = set_aries_default_assumptions(assumptions, key)

        if pct_key not in ['P10', 'P50', 'P90', 'best']:
            pct_key = 'P50'

        well_id = well_header.get('_id')
        aries_id = well_header.get('aries_id')
        phdwin_id = well_header.get('phdwin_id')
        inpt_id = truncate_inpt_id(well_header.get('inptID', ''))
        chosen_id = well_header.get('chosenID')
        api10 = well_header.get('api10')
        api12 = well_header.get('api12')
        api14 = well_header.get('api14')
        well_name = well_header.get('well_name')
        well_number = well_header.get('well_number')

        selected_id_key = aries_setting['selected_id_key']
        if selected_id_key != 'well_name_well_number':
            propnum = truncate_inpt_id(well_header.get(selected_id_key, ''))
        else:
            propnum = combine_str(str(well_name), str(well_number))

        dates = assumptions['dates']
        ownership = assumptions['ownership_reversion']
        capex = assumptions['capex']
        pct_key_by_phase = get_pct_key_by_phase(pct_key, forecast_data)

        date_dict, cut_off_and_major, main_phase, min_base_date, uses_ecl_link, ecl_links = dates_conv(
            context, dates, ownership, capex, well_header, production_data, forecast_data, pct_key_by_phase,
            min_base_date, project_id, scenario_id, well_id_link, combos, ecl_links)
        cutoff_changed = False
        macro_dict[propnum] = {k: v for k, v in date_dict.items() if k in OFFSET_MACRO_DICT}

        prev_sec = None

        aries_start_log = AriesStartLog()
        user_work_stream = UserWorkStream()

        # sidefile parameters for each well, allows for storage of model and model options (overlay) under 1 sidefile
        well_sidefile_dict = {}
        phase_workstream = set()
        cc_load_volumes = []
        lookup_overlay_rows = []
        ## assumptions
        for assump_key in [
                'dates',
                'stream_properties',
                'forecast',
                'yield',
                'risking',
                'pricing',
                'differentials',
                'expenses',
                'production_taxes',
                'ownership_reversion',
                'capex',
                'production_vs_fit',
                'yield_overlay',
                'expenses_overlay',
                'production_taxes_overlay',
                'stream_properties_overlay',
        ]:

            if ASSUMP_NUM_DICT[assump_key] != prev_sec:
                this_seq = 0

            original_well_headers = list(well_header.keys())
            this_assump_aries, initial_forecast_volume_phase, cutoff_changed = process_assumption(
                context,
                well_id,
                well_header,
                assumptions,
                forecast_data,
                schedule,
                assump_key,
                production_data,
                monthly_daily_dict,
                pct_key_by_phase,
                main_phase,
                aries_start_log,
                date_dict,
                cut_off_and_major,
                aries_setting,
                lookup_table_dict,
                user_work_stream=user_work_stream,
                phase_workstream=phase_workstream,
                ref_name_dict=ref_name_dict,
                well_mapping=custom_mappings,
                cc_load_volumes=cc_load_volumes,
                sidefile_doc=lookup_sidefile_dict,
                lookup_name_alias_dict=lookup_name_alias_dict,
                lookup_overlay_rows=lookup_overlay_rows,
                cutoff_changed=cutoff_changed,
                uses_ecl_link=uses_ecl_link,
                ecl_links=ecl_links,
            )
            modified_well_headers = list(well_header.keys())
            added_well_headers = list(set(modified_well_headers) - set(original_well_headers))

            for header in added_well_headers:
                if header not in ['SHRINK', 'UNSHRUNK_BTU']:
                    ac_property_updates.add(header)

            cc_forecast_volumes, this_assump_aries, cc_load_volumes = update_cc_forecast_volumes(
                cc_forecast_volumes, propnum, initial_forecast_volume_phase, this_assump_aries, cc_load_volumes)

            # process information for sidefile name, sequence, model uniqueness and key to use for sfile name conv.
            (ac_econ_list, sidefile_alias_conv_dict, use_key, assumption_name, sidefile_name, model_unique,
             sidefile_present, this_seq) = get_key_sidefile_info(assumptions, this_assump_aries, assump_key, this_seq,
                                                                 use_sidefile, ac_econ_list, sidefile_alias_conv_dict,
                                                                 ar_sidefile_dict, propnum, well_name, well_number,
                                                                 inpt_id, api10, api12, api14, chosen_id, aries_id,
                                                                 phdwin_id)

            aries_start_log = reset_start_when_creating_sidefile(aries_start_log, well_sidefile_dict, sidefile_name,
                                                                 sidefile_present, use_key, model_unique,
                                                                 assumption_name)

            # if a model is detected to be already recorded as a sidefile
            # just add a sidefile row which is done in "get_key_sidefile_info"
            if sidefile_present:
                prev_sec = ASSUMP_NUM_DICT[assump_key]
                continue

            # check if well already has a given sidefile name if so, just update the row, if not create new row
            # also check if a cutoff sidefile is present
            # cutoff sidefile partially uses the dates model, there dates model cannot be completely ignored
            # only for the items used for cutoff (ELOSS and LIFE)
            ignore_date_sidefile = validate_cut_off(this_assump_aries, use_key)
            well_sidefile_dict, sidefile_cutoff_detected = update_well_sidefile_dict(
                well_sidefile_dict, ar_sidefile_dict, sidefile_name, use_key, model_unique, assumption_name,
                ignore_date_sidefile, this_assump_aries)

            this_assump_aries = add_workstream_phase(this_assump_aries, phase_workstream, assump_key)
            this_assump_aries = add_expense_lookup_row(this_assump_aries, lookup_overlay_rows, assump_key,
                                                       aries_start_log.zero_expense_workstream)

            for i in range(len(this_assump_aries)):
                this_seq += 1
                props = [propnum, well_name, well_number, inpt_id, api10, api12, api14, chosen_id, aries_id, phdwin_id]
                this_full_ac_row = [*props, ASSUMP_NUM_DICT[assump_key], this_seq, 'CC_QUAL', *this_assump_aries[i]]

                # as stated dates model behaves differently for sidefiles due to its partial use and is therefore
                # handled differently
                if use_key in PARTIAL_KEYWORD_SIDEFILE_LS_DICT:
                    ac_econ_list, well_sidefile_dict = update_partial_sidefile_models(
                        well_sidefile_dict, ac_econ_list, sidefile_name, sidefile_cutoff_detected, use_key,
                        model_unique, this_full_ac_row, ignore_date_sidefile)
                elif use_key == 'expenses':
                    ac_econ_list, well_sidefile_dict, this_seq = ignore_aban_keyword_for_expense_sidefiles(
                        well_sidefile_dict, ac_econ_list, sidefile_name, model_unique, this_full_ac_row, assump_key,
                        this_seq, lookup_overlay_rows, props)
                else:
                    # replace abandoment line if changed
                    ac_econ_list, this_seq, cutoff_changed = update_abandonment_lines(
                        cutoff_changed, assump_key, ac_econ_list, cut_off_and_major,
                        [*props, ASSUMP_NUM_DICT['dates'], this_seq, 'CC_QUAL'])
                    this_full_ac_row = [*props, ASSUMP_NUM_DICT[assump_key], this_seq, 'CC_QUAL', *this_assump_aries[i]]
                    if model_unique or use_key not in SIDEFILE_NAME_CONV_DICT:
                        ac_econ_list.append(this_full_ac_row)
                    else:
                        if sidefile_name in well_sidefile_dict:
                            well_sidefile_dict[sidefile_name].append(this_full_ac_row)
            #

            # only add sidefile row if no sidefile cutoff has already been detected
            # sidefile cut off detected can only be True for dates models and if the model has been used to create a
            # sidefile cutoff and the models meets the criteria to be used with that sidefile
            # sidefile row is already added in get_key_sidefile_info
            if not sidefile_cutoff_detected and not ignore_date_sidefile:
                ac_econ_list, this_seq = add_sidefile_row_if_criteria_met(ac_econ_list, assumption_name, sidefile_name,
                                                                          assump_key, model_unique, use_key,
                                                                          this_assump_aries, this_seq, propnum,
                                                                          well_name, well_number, inpt_id, api10, api12,
                                                                          api14, chosen_id, aries_id, phdwin_id)

            prev_sec = ASSUMP_NUM_DICT[assump_key]

        # update the ar_sidefile_dict with sidefiles obtained from this well
        for sidefile_name in well_sidefile_dict:
            ar_sidefile_dict[sidefile_name] = well_sidefile_dict[sidefile_name]

        if (index + 1) % 50 == 0:
            well_prog = query_prog + round((total_prog_end - query_prog) * (index + 1) / len(well_data_list))
            context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
                '_id': notification_id,
                'progress': well_prog
            })
    #
    ac_econ_df = pd.DataFrame(ac_econ_list, columns=AC_ECONOMIC_HEADERS)

    ar_sidefile_df = convert_sidefile_dict_to_df({**ar_sidefile_dict, **lookup_sidefile_dict})

    ar_lookup_df = convert_lookup_dict_to_df(lookup_table_dict)

    return ac_econ_df, ar_sidefile_df, ar_lookup_df, macro_dict, min_base_date, cc_forecast_volumes, list(
        ac_property_updates), ecl_links


FORECAST_MOVE_TO_NEXT_MONTH_TEXT = 'ARIES FORECAST MOVED TO THE BEGINNING OF NEXT MONTH'
