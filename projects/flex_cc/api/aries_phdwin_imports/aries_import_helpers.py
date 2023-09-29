import copy
import datetime
import re
import numpy as np
import pandas as pd

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.combine_rows import (get_two_tax_keys, get_unit_key_and_clean_row_for_taxes,
                                                   shift_datetime_date, aries_cc_round, variable_expenses_category)

from combocurve.shared.aries_import_enums import (ARIES_FILES_LABEL, CCSchemaEnum, FileDir, WellHeaderEnum,
                                                  EconHeaderEnum, EconEnum, PhaseEnum, OverlayEnum, UnitEnum,
                                                  OperatorEnum, PriceEnum)
from typing import List, Dict

NUM_SCEN_QUALIFIERS = 10
LARGE_SEQUENCE_VALUE = 1000000
MONTHS_IN_YEAR = 12
LARGE_NEGATIVE_START_VALUE = -100_000_000

OPC_PHASE_AVAILABILITY = {
    PhaseEnum.oil.value: [EconEnum.opc.value, EconEnum.gathering.value, EconEnum.market.value, EconEnum.other.value],
    PhaseEnum.gas.value: [EconEnum.opc.value, EconEnum.other.value],
    PhaseEnum.ngl.value: [
        EconEnum.opc.value, EconEnum.gathering.value, EconEnum.transport.value, EconEnum.market.value,
        EconEnum.other.value
    ],
    PhaseEnum.condensate.value: [
        EconEnum.opc.value, EconEnum.gathering.value, EconEnum.transport.value, EconEnum.market.value,
        EconEnum.other.value
    ]
}

ACCEPTABLE_SHRINK_KEYWORDS_BY_PHASE = {
    OverlayEnum.sales_oil.value: [OverlayEnum.sales_oil.value, OverlayEnum.gross_oil.value],
    OverlayEnum.sales_gas.value: [OverlayEnum.sales_gas.value],
    OverlayEnum.lease_net_gas: [OverlayEnum.lease_net_gas.value],
    OverlayEnum.net_oil.value: [OverlayEnum.net_oil.value],
    OverlayEnum.net_gas.value: [OverlayEnum.net_gas.value],
}

FORECAST_TO_OVERLAY_DICT = {
    OverlayEnum.gross_oil.value: PhaseEnum.oil.value,
    OverlayEnum.gross_gas.value: PhaseEnum.gas.value,
    OverlayEnum.gross_wtr.value: PhaseEnum.aries_water.value,
    OverlayEnum.gross_wtr_2.value: PhaseEnum.aries_water.value,
    OverlayEnum.gross_ngl.value: PhaseEnum.ngl.value,
    OverlayEnum.gross_cnd.value: PhaseEnum.aries_condensate.value
}

CC_ARIES_OVERLAY_PRICE_DICT = {
    'S/195': PhaseEnum.oil.value,
    'S/196': PhaseEnum.gas.value,
    'S/197': PhaseEnum.condensate.value,
    'S/199': PhaseEnum.ngl.value
}

keyword_section_dict = {
    EconEnum.aban_exp.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.atx.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.atx_per_t.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.stx.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.lse.value: EconHeaderEnum.own_section_key.value,
    EconEnum.own.value: EconHeaderEnum.own_section_key.value,
    EconEnum.net.value: EconHeaderEnum.own_section_key.value,
    PhaseEnum.oil.value.upper(): EconHeaderEnum.forecast_section_key.value,
    PhaseEnum.gas.value.upper(): EconHeaderEnum.forecast_section_key.value,
    PhaseEnum.aries_water.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.cumm.value: EconHeaderEnum.forecast_section_key.value,
    OverlayEnum.load.value: EconHeaderEnum.overlay_section_key.value,
    EconEnum.loss.value: EconHeaderEnum.misc_section_key.value,
    EconEnum.eloss.value: EconHeaderEnum.misc_section_key.value,
    UnitEnum.life.value: EconHeaderEnum.misc_section_key.value,
    EconEnum.opnet.value: EconHeaderEnum.misc_section_key.value
}

per_keyword_section_dict = {
    EconEnum.liquid_trans_cost_per.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.stx_per.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.price_per.value: EconHeaderEnum.price_section_key.value,
    EconEnum.paj_per.value: EconHeaderEnum.price_section_key.value,
    EconEnum.pad_per.value: EconHeaderEnum.price_section_key.value,
    EconEnum.curtail_per.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.multiplier_for.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.oil_ratio.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.gas_ratio.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.water_ratio.value: EconHeaderEnum.forecast_section_key.value,
    EconEnum.opc_per.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.ga_per.value: EconHeaderEnum.tax_expense_section_key.value,
    EconEnum.oh_per.value: EconHeaderEnum.tax_expense_section_key.value
}

REVENUE_BASED_VAR_EXPENSE_KEY_DICT = {
    'GTC/REV': 'pct_of_gas_rev',
    'TRC/REV': 'pct_of_gas_rev',
    'CMP/REV': 'pct_of_gas_rev',
    'LTC/REV': 'pct_of_oil_rev',
    'GPC/REV': 'pct_of_ngl_rev'
}

VAR_EXPENSE_PHASE_DICT = {
    ('GTC/REV', 'TRC/REV', 'CMP/REV', 'GPC/REV', 'GTC/GAS', 'TRC/GAS', 'CMP/GAS', 'GPC/GAS'): PhaseEnum.gas.value,
    ('LTC/REV', 'LTC/OIL'): PhaseEnum.oil.value
}

FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT = {
    EconEnum.monthly_cost.value: set(),
    EconEnum.other_cost_1.value: set(),
    EconEnum.other_cost_2.value: set(),
    EconEnum.other_cost_3.value: set(),
    EconEnum.other_cost_4.value: set(),
    EconEnum.other_cost_5.value: set(),
    EconEnum.other_cost_6.value: set(),
    EconEnum.other_cost_7.value: set(),
    EconEnum.other_cost_8.value: set()
}

ERROR_MSG_SECTION_DICT = {
    4: ErrorMsgEnum.forecast_stream.value,
    5: ErrorMsgEnum.price_diff.value,
    6: ErrorMsgEnum.tax_expense.value,
    7: ErrorMsgEnum.ownership.value,
    8: ErrorMsgEnum.capex.value,
    9: ErrorMsgEnum.overlay.value
}

date_unit_list = [
    UnitEnum.ad.value, UnitEnum.month.value, UnitEnum.months.value, UnitEnum.incr_month.value,
    UnitEnum.incr_months.value, UnitEnum.incr_year.value, UnitEnum.incr_years.value, UnitEnum.year.value,
    UnitEnum.years.value, UnitEnum.life.value
]

SHRINKAGE_KEYS = ['391', '392', '815', '816']

DEFAULT_TAX_EXPENSE_OBJ = {'cap': '', 'dates': {'start_date': '', 'end_date': ''}}

DEFAULT_PRICE_OBJ = {
    'cap': '',
    "dates": {
        "start_date": "2019-1-23",
        "end_date": "Econ Limit"
    },
    'escalation_model': 'none'
}

DEFAULT_BASE_DATE = '2021-01-01'
FORECAST_DEFAULT_BASE_DATE = '1900-01-01'
DEFAULT_DIFFERENTIAL_OBJ = {'cap': '', "dates": {"start_date": "2019-1-23", "end_date": "Econ Limit"}}

overlay_ignore_keywords = [PhaseEnum.ngl_yield.value, OverlayEnum.load.value.lower()]

FIXED_EXPENSE_KEYWORD_PER_WELL = ['OPC/OGW', 'OH/W', 'OPC/OWL', 'OPC/GWL', 'OPC/W', 'GA/W', 'OPC/INJ']
FIXED_EXPENSE_KEYWORD_TOTAL = [
    'OPC/T', 'OH/T', 'GPC/T', 'WRK', 'WRK/T', 'GA/T', 'GTC/T', 'CMP/T', 'LTC/T', 'TRC/T', 'FTC/T'
]

ZERO_ESC = 'Zero Escalation'

MAX_SIDEFILE_LOOKUP_LAYERS = 5

YIELD_TAX_STREAM_CONV_DICT = {'S/63': 'STD/NGL', 'S/61': 'STD/CND'}


def update_well_count_document_with_major_phase_well(aries_extract, risking_default_document, major_phase,
                                                     well_keyword_processed):
    def get_earliest_start_date_from_well_count_dict():
        try:
            earliest_start_date = min([
                value[0]['dates']['start_date'] for key, value in aries_extract.well_count_by_phase_obj_dict.items()
                if len(value) > 0
            ])
        except (TypeError, ValueError):
            earliest_start_date = pd.to_datetime(aries_extract.dates_1_base_date).strftime(
                CCSchemaEnum.ymd_date_dash_format.value)
        return earliest_start_date

    if well_keyword_processed:
        return risking_default_document

    use_major_phase = str(major_phase).lower()

    if use_major_phase in aries_extract.well_count_by_phase_obj_dict and len(
            aries_extract.well_count_by_phase_obj_dict[use_major_phase]) == 0:
        earliest_start_date = get_earliest_start_date_from_well_count_dict()
        new_obj = {
            CCSchemaEnum.dates.value: {
                CCSchemaEnum.start_date.value: earliest_start_date,
                CCSchemaEnum.end_date.value: 'Econ Limit'
            },
            'count': 1
        }
        aries_extract.well_count_by_phase_obj_dict[use_major_phase].append(new_obj)
        if use_major_phase in aries_extract.default_well_count_for_major_phase:
            aries_extract.default_well_count_for_major_phase[use_major_phase] = True
        risking_default_document[EconEnum.econ_function.value]['risking_model']['well_stream']['rows'].append(new_obj)

    return risking_default_document


def check_if_to_store_in_expense_hold(obj, keyword, hold_expense_doc, mismatch_found):
    """
    Store expense objects in temporary document if there is unit mismatch
    Objects will be used if a spare space is found in ComboCurve
    """
    store_in_hold = False
    if mismatch_found:
        if keyword in hold_expense_doc:
            hold_expense_doc[keyword].append(obj)
        else:
            hold_expense_doc[keyword] = [obj]
        store_in_hold = True
    return store_in_hold


def atx_std_handle(keyword, ignore_list, document):
    if keyword in [EconEnum.atx.value, EconEnum.atx_per_t.value]:
        row = document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value][-1]
        tax_keys = get_two_tax_keys(row)
        if any(row[key] != 0 for key in tax_keys):
            if keyword == EconEnum.atx.value:
                ignore_list.append(EconEnum.atx_per_t.value)
            elif keyword == EconEnum.atx_per_t.value:
                ignore_list.append(EconEnum.atx.value)

    return ignore_list


def update_use_std_dict(keyword, use_std_dict):
    if keyword == 'STD':
        for key in use_std_dict:
            use_std_dict[key] = True
    elif 'STD' in keyword:
        phase = str(keyword.split('/')[-1]).lower()
        if phase in use_std_dict:
            use_std_dict[phase] = True

    return use_std_dict


def stop_at_first_price_model(keyword, original_keyword, multiple_price_dict, phase_usage_ls, document):
    phase_original = str(keyword).split('/')[-1]
    phase = phase_original.lower(
    ) if phase_original.lower() != PhaseEnum.aries_condensate.value else PhaseEnum.condensate.value
    change_name = multiple_price_dict.get(phase)
    if change_name is None:
        return keyword
    if change_name:
        return f'PAJ/{phase_original}'
    rows = document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][EconEnum.rows.value]
    if len(rows) > 1:
        if original_keyword in phase_usage_ls and 'PRI' in original_keyword:
            multiple_price_dict[phase] = True
            return f'PAJ/{phase_original}'
        else:
            return keyword
    else:
        return keyword


def convert_array_column_dtype_to_int(df, index, initial=False):
    sections = []
    for value in list(df[:, index]):
        try:
            new_value = int(float(value))
            if initial:
                new_value = str(new_value)
            sections.append(new_value)
        except (TypeError, ValueError):
            sections.append(value)
    df[:, index] = sections
    return df


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


def order_df_based_on_section_and_sequence(economic_df, header_cols):
    current_header_cols = header_cols[:economic_df.shape[1]]
    df = pd.DataFrame(economic_df, columns=current_header_cols)
    df[EconHeaderEnum.section.value] = convert_pd_series_to_int(df[EconHeaderEnum.section.value])
    df[EconHeaderEnum.sequence.value] = convert_pd_series_to_int(df[EconHeaderEnum.sequence.value])
    df[EconHeaderEnum.extracted_sequence.value] = convert_pd_series_to_int(df[EconHeaderEnum.extracted_sequence.value])
    return np.array(
        df.sort_values(
            by=[EconHeaderEnum.section.value, EconHeaderEnum.sequence.value, EconHeaderEnum.extracted_sequence.value]))


def check_shrink_operation_in_expression(expression, shrink):
    expression = str(expression)
    expression = expression.replace('/SHRINK', f'/{shrink}')
    return expression


def get_model_name_from_qualifiers(keyword, qualifier, model_name, document):
    qualifier = str(qualifier).upper()
    if keyword == 'START':
        return model_name
    if qualifier == '':
        qualifier = f'ARIES_CC_{document[CCSchemaEnum.assumption_key.value].upper()}'
    model_sub_names = model_name.split('*&*')
    if qualifier not in model_sub_names:
        model_sub_names.append(qualifier)
        if '' in model_sub_names:
            model_sub_names.remove('')
        model_sub_names.sort()
        model_name = '*&*'.join(model_sub_names)
    return model_name


def get_fixed_cost_name_if_section_full(keyword, expense_assignment):
    fixed_cost_name = None
    for key in expense_assignment:
        if any(item in FIXED_EXPENSE_KEYWORD_TOTAL
               for item in expense_assignment[key]) and keyword in FIXED_EXPENSE_KEYWORD_TOTAL:
            fixed_cost_name = key
        elif any(item in FIXED_EXPENSE_KEYWORD_PER_WELL
                 for item in expense_assignment[key]) and keyword in FIXED_EXPENSE_KEYWORD_PER_WELL:
            fixed_cost_name = key
    if fixed_cost_name is None:
        fixed_cost_name = list(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT.keys())[-1]
    return fixed_cost_name


def get_fixed_cost_name_from_assignment_dict(keyword, fixed_exp_assignment):
    slot_full = True
    return_key = list(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT.keys())[-1]
    for key in fixed_exp_assignment:
        if keyword in fixed_exp_assignment[key]:
            return_key = key
            slot_full = False
            continue
    return return_key, slot_full


def clean_operation_syntax(df, operation_syntax):
    df = df.reset_index(drop=True)
    column_headers = df.columns
    new_operation_syntax = []
    for item in operation_syntax:
        if str(item).lstrip('(').upper() in column_headers:
            value = df.at[0, str(item).lstrip('(').upper()]
            new_item = str(item).replace(str(item).lstrip('('), str(value))
            new_operation_syntax.append(new_item)
        elif str(item).rstrip(')').upper() in column_headers:
            value = df.at[0, str(item).rstrip(')').upper()]
            new_item = str(item).replace(str(item).rstrip(')'), str(value))
            new_operation_syntax.append(new_item)
        else:
            new_operation_syntax.append(item)
    return new_operation_syntax


def split_string(str_):
    return re.split(' +', str_.replace(',', ' ').strip())


def get_max_eco_year_from_frame_string(line):
    max_eco_year = 0
    try:
        frame_str = str(line).split()[1:]
        frame_str = [str(item).strip() for item in frame_str]
        frame_str = str_join(frame_str)
        frame_str_list = split_string(frame_str)

        for item in frame_str_list:
            max_eco_year += eval(item.strip())
        max_eco_year /= MONTHS_IN_YEAR
        max_eco_year = aries_cc_round(max_eco_year)
    except (ValueError, NameError, IndexError):
        max_eco_year = 0

    return max_eco_year


def update_corptax(general_option_default_document, row, setupname_corptax_ac_setupdata_df):
    if not setupname_corptax_ac_setupdata_df.empty:
        line = setupname_corptax_ac_setupdata_df.loc[setupname_corptax_ac_setupdata_df['LINENUMBER'] == 40]['LINE']
        format_line = line.values[-1]
        value = split_string(str(format_line))[1]
        if value.startswith('S/'):
            try:
                value = float(value.split('S/')[-1])
            except ValueError:
                value = None

            if value is not None and EconHeaderEnum.varates.value in row.index:
                sec_name = str(row.VARATES).strip().upper()
                var_rate_rows = setupname_corptax_ac_setupdata_df.loc[
                    (setupname_corptax_ac_setupdata_df['SECTYPE'].astype(str).str.upper() == 'VARATES')
                    & (setupname_corptax_ac_setupdata_df['SECNAME'].astype(str).str.upper() == sec_name)]['LINE'].values
                select_row = None
                for row in var_rate_rows:
                    rate_ls = split_string(str(row))
                    try:
                        stream = float(rate_ls[0])
                    except ValueError:
                        stream = None
                    if value == stream:
                        select_row = rate_ls
                        break
                if select_row is not None and len(select_row) > 0:
                    general_option_default_document = update_variable_rate(general_option_default_document, select_row)
        else:
            try:
                value = float(value)
            except (ValueError, TypeError):
                value = None
            if value is not None:
                value *= 100
                value = aries_cc_round(value)
                general_option_default_document['econ_function']['income_tax']['federal_income_tax']['rows'][-1][
                    'multiplier'] = value
    return general_option_default_document


def update_variable_rate(document, select_row):
    obj = {
        CCSchemaEnum.dates.value: {
            CCSchemaEnum.start_date.value: None,
            CCSchemaEnum.end_date.value: None
        },
        EconEnum.multiplier.value: 0
    }
    total_months = 0
    add_obj = False
    new_rows = []
    for idx, item in enumerate(select_row[1:]):
        add_obj = True
        if idx == 0:
            start_date = pd.to_datetime(item).strftime(CCSchemaEnum.ymd_date_dash_format.value)
        else:
            months, multiplier = item.split('*')
            try:
                months = float(months)
                multiplier = float(multiplier)
            except ValueError:
                add_obj = False
                break
            use_obj = copy.deepcopy(obj)
            total_months += months
            use_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = start_date
            use_obj[EconEnum.multiplier.value] = multiplier * 100
            if total_months >= 1200:
                end_date = EconEnum.econ_limit.value
                use_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = end_date
                new_rows.append(use_obj)
                break
            else:
                end_date = (pd.to_datetime(start_date) + pd.DateOffset(months=int(months), days=-1)).strftime(
                    CCSchemaEnum.ymd_date_dash_format.value)
            use_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = end_date
            new_rows.append(use_obj)
            start_date = (pd.to_datetime(end_date) + pd.DateOffset(days=1)).strftime(
                CCSchemaEnum.ymd_date_dash_format.value)
    if add_obj:
        try:
            end_date = new_rows[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]
        except (KeyError, IndexError):
            end_date = EconEnum.econ_limit.value
        if end_date != EconEnum.econ_limit.value:
            start_date = (pd.to_datetime(end_date) + pd.DateOffset(days=1)).strftime(
                CCSchemaEnum.ymd_date_dash_format.value)
            use_obj = copy.deepcopy(obj)
            use_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = start_date
            use_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = EconEnum.econ_limit.value
            use_obj[EconEnum.multiplier.value] = 0
            new_rows.append(use_obj)
        document['econ_function']['income_tax']['federal_income_tax']['rows'] = new_rows

    return document


def process_irregular_price_expression(keyword, ls_expression, well_id, scenario, error_report):
    price_unit = None
    phase = str(keyword).split('/')[-1].lower()
    if phase not in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.aries_condensate.value]:
        phase = None
    if any(item in date_unit_list for item in ls_expression):
        date_unit_index = next(idx for idx, item in enumerate(ls_expression) if item in date_unit_list)
        date_value_index = date_unit_index - 1

        try:
            date_value = ls_expression[date_value_index]
            date_unit = ls_expression[date_unit_index]
        except (IndexError, TypeError):
            date_value, date_unit = None, None

        if date_value is not None and date_unit is not None and phase is not None:
            price_unit = '$/B' if phase != PhaseEnum.gas.value else '$/M'
            ls_expression = [
                ls_expression[0], 'X', price_unit, date_value, date_unit, UnitEnum.perc_compound_escalation.value, '0'
            ]
            error_report.log_error(aries_row=str_join(ls_expression),
                                   message=ErrorMsgEnum.missing_price_unit.value,
                                   scenario=scenario,
                                   well=well_id,
                                   model=ErrorMsgEnum.price.value,
                                   section=EconHeaderEnum.price_section_key.value,
                                   severity=ErrorMsgSeverityEnum.warn.value)

    return keyword, ls_expression, price_unit


def validate_ngl_price_document(default_document, price_obj):
    unit_key = get_unit_key_and_clean_row_for_taxes([price_obj])
    if unit_key == PriceEnum.pct_of_oil_price.value:
        default_document[EconEnum.econ_function.value][EconEnum.price_model.value][PhaseEnum.ngl.value][
            EconEnum.rows.value] = default_document[EconEnum.econ_function.value][EconEnum.price_model.value][
                PhaseEnum.ngl.value][EconEnum.rows.value][:1]


def fetch_value(string, property_id, mapping_dic, custom_mapping_dic, lookup=False):
    """Handles @Macro even if there are nested macros up to 3 childs

    Args:
        string:
        property_id:
        mapping_dic:
        custom_mapping_dic:
        lookup:

    Returns:

    """
    value = fetch_nested_macro(string, property_id, mapping_dic, custom_mapping_dic, lookup=lookup)

    if '@' in str(value):
        depth_count = 0
        while '@' in str(value) and depth_count < 3:
            value = fetch_nested_macro(value, property_id, mapping_dic, custom_mapping_dic, lookup=lookup)
            depth_count += 1

    return value


def fetch_nested_macro(string, property_id, mapping_dic, custom_mapping_dic, lookup=False):
    if '@' in str(string).upper():
        # can handle multiplier values in expression
        # handle some user error
        # handle miss type '/' for '.'
        operation_syntax = ''
        key = string.split('.')[0]  # @M
        key = key.split('@')[-1]
        if len(string.split('.', 1)) > 1:
            string_values = string.split('.', 1)[1]  # .split('*')[0]  # DIFF_AREA
        else:
            return string
        # delineates operators
        syntax_list = re.split('([-|+|*|/|^])', string_values)
        if key == 'M':
            df = mapping_dic[FileDir.m.value][0].copy()  # self.AC_PROPERTY_df
        elif key in custom_mapping_dic:
            df = custom_mapping_dic[key.split('@')[-1]]
        else:
            return 'nan'

        if len(syntax_list) > 1:
            column_name = syntax_list[0]
            syntax_list[1:] = clean_operation_syntax(
                df.loc[df[WellHeaderEnum.propnum.value].astype(str) == property_id], syntax_list[1:])
            operation_syntax = ''.join(syntax_list[1:])
        else:
            column_name = syntax_list[0]

        df = df.loc[df[WellHeaderEnum.propnum.value].astype(str) == property_id]  # get specific property_id
        df = df.reset_index(drop=True)
        returned_prop_value = df.at[0, str(column_name).upper()]
        if not pd.isnull(pd.to_datetime(str(returned_prop_value), errors="coerce")) and ('+' in operation_syntax
                                                                                         or '-' in operation_syntax):
            date = pd.to_datetime(returned_prop_value)
            try:
                value = int(float(syntax_list[-1]))
            except ValueError:
                value = 0
            if '+' in operation_syntax:
                date += pd.DateOffset(days=value)
            elif '-' in operation_syntax:
                date -= pd.DateOffset(days=value)
            date = date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
            return date
        operation_syntax = str(returned_prop_value).strip() + operation_syntax
        if len(syntax_list) > 1:
            try:
                operation_syntax = operation_syntax.replace('^', '**')
                returned_value = str(eval(str(operation_syntax)))
            except NameError:
                returned_value = returned_prop_value
        else:
            returned_value = returned_prop_value

        if lookup:
            try:
                returned_value = int(returned_value)
            except ValueError:
                pass
        return returned_value
    else:
        return string


def extract_df_row_value(row, indices, df):
    if len(indices) == 1:
        return df[row, indices[-1]]
    return (df[row, index] for index in indices)


def get_expression(row, df, header_cols, mapping_dic, custom_mapping_dic):
    headers = get_header_index([EconHeaderEnum.propnum.value, EconHeaderEnum.expression.value], header_cols)
    propnum, expression = extract_df_row_value(row, headers, df)

    ls_expression = [
        fetch_value(string, propnum, mapping_dic, custom_mapping_dic) for string in expression.strip().split(' ')
    ]

    return ls_expression


def get_header_index_dict(headers: List, header_cols: List[str]) -> Dict[str, int]:
    return {header: header_cols.index(header) for header in headers}


def get_header_index(headers, header_cols):
    if len(headers) == 1:
        return header_cols.index(headers[0])
    returned_index = [header_cols.index(header) for header in headers]
    return returned_index


def format_start_date(start_date, dates_1_base_date, format=False):
    if start_date is None:
        start_date = format_bad_date(dates_1_base_date)
        return start_date.strftime('%m/%Y')
    if '/' in str(start_date) and not format:
        return start_date
    start_date = pd.to_datetime(start_date, errors='coerce')
    if pd.isnull(start_date):
        start_date = format_bad_date(dates_1_base_date)

    start_date = start_date.strftime('%m/%Y')
    return start_date


def format_bad_date(base_date):
    try:
        start_date = convert_str_date_to_datetime_format(base_date)
    except Exception:
        start_date = convert_str_date_to_datetime_format(DEFAULT_BASE_DATE)
    return start_date


def convert_str_date_to_datetime_format(date, format=CCSchemaEnum.ymd_date_dash_format.value):
    if format == CCSchemaEnum.ymd_date_dash_format.value:
        year, month, day = date.split('-')
        year, month, day = int(float(year)), int(float(month)), int(float(day))

        return datetime.date(year, month, day)
    elif format == '%m/%Y':
        month, year = date.split('/')
        month, year = int(float(month)), int(float(year))

        return datetime.date(year, month, 1)
    elif format == '%m/%d/%Y':
        month, day, year = date.split('/')
        month, day, year = int(float(month)), int(float(day)), int(float(year))

        return datetime.date(year, month, day)


def clean_overlay_keyword(keyword):
    # overlay keys comes in different format (mostly S/YYY, 'LOAD' and YYY)
    # get key from any of the formats
    keyword = str(keyword)
    if keyword.lower() in overlay_ignore_keywords:
        return keyword
    qualifier = keyword.split('/')
    if len(qualifier) == 2:
        if qualifier[0] != 'S':
            return None
    return qualifier[-1]


def get_last_segment_from_overlay_override(last_segment, tax_expense_overlay_dict):
    try:
        if last_segment in tax_expense_overlay_dict:
            segment_ls = tax_expense_overlay_dict.get(last_segment)
            if len(segment_ls) > 0:
                last_segment = segment_ls[-1]
    except TypeError:
        return last_segment

    return last_segment


def process_list_start_date_and_get_end_date(start_date, shift_month, shift_year, forecast=False):
    date_format = '%m/%d/%Y' if forecast else CCSchemaEnum.ymd_date_dash_format.value
    delineator = '/' if forecast else '-'
    start_date = start_date.strftime(date_format)

    if forecast:
        start_month, start_day, start_year = start_date.split(delineator)
    else:
        start_year, start_month, start_day = start_date.split(delineator)
    end_date = shift_datetime_date(datetime.date(int(float(start_year)), int(float(start_month)),
                                                 int(float(start_day))),
                                   months=shift_month,
                                   years=shift_year,
                                   days=-1).strftime(date_format)

    return start_date, end_date


def set_overlay_keywords_to_overlay_section(economic_df, header_cols):
    sequence = 0
    section_index, keyword_mark_index, sequence_index, expression_index = get_header_index([
        EconHeaderEnum.section.value, EconHeaderEnum.keyword.value, EconHeaderEnum.sequence.value,
        EconHeaderEnum.expression.value
    ], header_cols)
    for i in range(economic_df.shape[0]):
        keyword = str(economic_df[i, keyword_mark_index])
        expression = str(economic_df[i, expression_index])
        section = economic_df[i, section_index]
        if keyword in YIELD_TAX_STREAM_CONV_DICT:
            economic_df[i, section_index] = 6
            economic_df[i, keyword_mark_index] = YIELD_TAX_STREAM_CONV_DICT.get(keyword)
            sequence += LARGE_SEQUENCE_VALUE
            economic_df[i, sequence_index] = sequence
        elif (keyword.startswith('S/') and section != 9
              and keyword not in CC_ARIES_OVERLAY_PRICE_DICT) or (keyword == OverlayEnum.load.value and section != 9):
            economic_df[i, section_index] = 9
            sequence += LARGE_SEQUENCE_VALUE
            economic_df[i, sequence_index] = sequence
        elif keyword in CC_ARIES_OVERLAY_PRICE_DICT and section == 9:
            economic_df[i, section_index] = 5
            sequence += LARGE_SEQUENCE_VALUE
            economic_df[i, sequence_index] = sequence
        elif (keyword.lower() in [
                PhaseEnum.ngl_yield.value, PhaseEnum.cnd_yield.value, PhaseEnum.aries_condensate.value,
                PhaseEnum.ngl.value
        ] and section == 9) or authenticate_shrinkage_overlay_lines(
                keyword, expression, section) or authenticate_ratio_using_stream(keyword, expression):
            economic_df[i, section_index] = 4
            sequence += LARGE_SEQUENCE_VALUE
            economic_df[i, sequence_index] = sequence

    return economic_df


def handle_forecast_overlay_ratio(keyword, ls_expression):
    try:
        last_key = clean_overlay_keyword(ls_expression[-1])
        if any(float(item) == float(last_key) for item in FORECAST_TO_OVERLAY_DICT):
            ls_expression[-1] = int(float(last_key))
        else:
            return keyword, ls_expression
    except (IndexError, ValueError, TypeError):
        return keyword, ls_expression

    multiplication_string = str_join(ls_expression[-2:])
    for key in FORECAST_TO_OVERLAY_DICT:
        if f'MUL {key}' == str(multiplication_string).strip().upper():
            if keyword in FORECAST_TO_OVERLAY_DICT:
                keyword = FORECAST_TO_OVERLAY_DICT.get(keyword)
            elif clean_overlay_keyword(keyword) in FORECAST_TO_OVERLAY_DICT:
                keyword = FORECAST_TO_OVERLAY_DICT.get(clean_overlay_keyword(keyword))
            keyword = f'{keyword}/{FORECAST_TO_OVERLAY_DICT.get(key)}'
            ls_expression[-2:] = ['LIN', 'TIME']
            break

    return str(keyword).upper(), ls_expression


def authenticate_ratio_using_stream(keyword, expression):
    try:
        overlay_key = str(int(float(clean_overlay_keyword(keyword))))
        ls_expression = str(expression).strip().split()
        last_key = str(int(float(clean_overlay_keyword(ls_expression[-1]))))
        return_bool = ls_expression[
            -2] == 'MUL' and overlay_key in FORECAST_TO_OVERLAY_DICT and last_key in FORECAST_TO_OVERLAY_DICT and str(
                overlay_key) != str(last_key)
        return return_bool
    except (IndexError, ValueError, TypeError):
        return False


def authenticate_shrinkage_overlay_lines(keyword, expression, section):
    try:
        overlay_key = str(int(float(clean_overlay_keyword(keyword))))
        ls_expression = str(expression).strip().split()
        last_key = str(int(float(clean_overlay_keyword(ls_expression[-1]))))
        stream_arithmetic = f'{ls_expression[-2]} {last_key}'
        return (overlay_key in SHRINKAGE_KEYS) and (section == 9) and (check_shrinkage_stream_arithmetic(
            overlay_key, stream_arithmetic))
    except (IndexError, ValueError, TypeError):
        return False


def check_shrinkage_stream_arithmetic(overlay_key, stream_arithmetic):
    if overlay_key in ACCEPTABLE_SHRINK_KEYWORDS_BY_PHASE:
        return any(stream_arithmetic == f'MUL {item}' for item in ACCEPTABLE_SHRINK_KEYWORDS_BY_PHASE[overlay_key])
    return False


def get_section_from_keyword(keyword):
    if keyword in keyword_section_dict:
        return keyword_section_dict[keyword]
    elif keyword.startswith('S/'):
        return EconHeaderEnum.overlay_section_key.value
    elif any(value in keyword for value in per_keyword_section_dict):
        return per_keyword_section_dict[next(value for value in per_keyword_section_dict if value in keyword)]
    else:
        return None


def str_join(expression):
    try:
        return ' '.join([str(value) for value in expression])
    except TypeError:
        return None


def check_if_overlay_operation_process(expression):
    overlay_operation_process = False
    if len(expression) > 5:
        for operation in OperatorEnum:
            sign = operation.value
            if sign in str_join(expression[-2:]):
                overlay_operation_process = True
    return overlay_operation_process


def handle_overlay_override(economic_df, header_cols):
    section_index, keyword_mark_index, sequence_index = get_header_index(
        [EconHeaderEnum.section.value, EconHeaderEnum.keyword.value, EconHeaderEnum.sequence.value], header_cols)
    for i in range(economic_df.shape[0]):
        if economic_df[i, section_index] == 9:
            recognized_section = get_section_from_keyword(economic_df[i, keyword_mark_index])
            if recognized_section in [6]:
                economic_df[i, section_index] = recognized_section
                economic_df[i, sequence_index] = EconEnum.overlay_sequence.value
    return economic_df


def get_major_phase(section_economic_df, forecast_df, keyword_mark_index, expression_index, property_id,
                    at_symbol_mapping_dic, custom_table_dict, error_report):
    phase_list = ['GAS', 'OIL']
    major_phase = None
    if 'MAJOR' in section_economic_df[:, keyword_mark_index]:
        major_phase_string = section_economic_df[section_economic_df[:,
                                                                     keyword_mark_index] == 'MAJOR'][-1,
                                                                                                     expression_index]
        try:
            major_phase_string = fetch_value(major_phase_string, property_id, at_symbol_mapping_dic, custom_table_dict)
        except Exception:
            error_report.log_error(aries_row=major_phase_string,
                                   message=ErrorMsgEnum.fetch_value_error_msg.value,
                                   well=property_id,
                                   model=ErrorMsgEnum.ownership.value,
                                   severity=ErrorMsgSeverityEnum.error.value)
        major_phase = str(major_phase_string).strip().upper()
    if major_phase not in phase_list:
        if forecast_df.size != 0:
            for phase in forecast_df[:, keyword_mark_index]:
                if str(phase).strip() in phase_list:
                    major_phase = phase
                    break

    if major_phase is not None:
        major_phase = major_phase.strip()

    return major_phase


def format_base_date(base_date):
    base_date = pd.to_datetime(base_date, errors='coerce')

    if pd.isnull(base_date):
        return DEFAULT_BASE_DATE
    else:
        return base_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)


def set_risk_start_date_to_base_date(document, base_date):
    base_date = format_base_date(base_date)

    for phase in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.water.value,
            PhaseEnum.condensate.value, 'well_stream'
    ]:
        rows = document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][EconEnum.rows.value]

        row = rows[0]
        key = get_unit_key_and_clean_row_for_taxes(rows)
        if CCSchemaEnum.dates.value in row:
            if len(rows) > 1 and phase != 'well_stream':
                row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = base_date
            elif len(rows) == 1:
                if (phase == 'well_stream' and row[key] == 1) or phase != 'well_stream':
                    rows[0] = {key: row[key], 'entire_well_life': 'Flat'}

    return document


def set_price_start_date_to_base_date(document, base_date, phase_list=[]):
    base_date = format_base_date(base_date)
    all_phase_docs = document[EconEnum.econ_function.value][EconEnum.price_model.value]

    for phase in all_phase_docs:
        if phase in phase_list:
            continue
        row = all_phase_docs[phase][EconEnum.rows.value][0]
        if CCSchemaEnum.dates.value in row:
            row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = base_date
            escalation_doc = row.get(EconEnum.escalation_model.value)
        set_escalation_doc_to_base_date(escalation_doc, base_date)

    return document


def set_diff_start_date_to_base_date(document, base_date):
    base_date = format_base_date(base_date)
    all_diff_docs = document[EconEnum.econ_function.value][EconEnum.differentials.value]

    for diff_doc in all_diff_docs.values():
        for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
            row = diff_doc[phase][EconEnum.rows.value][0]
            if CCSchemaEnum.dates.value in row:
                row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = base_date
    return document


def set_escalation_doc_to_base_date(escalation_doc, base_date):
    if escalation_doc != 'none' and escalation_doc is not None:
        rows = escalation_doc[EconEnum.econ_function.value][EconEnum.escalation_model.value][EconEnum.rows.value]
        row = rows[0]
        if CCSchemaEnum.dates.value in row:
            new_row = copy.deepcopy(row)
            unit_key = get_unit_key_and_clean_row_for_taxes([new_row])
            new_row[unit_key] = 0

            if pd.to_datetime(new_row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]) > pd.to_datetime(
                    new_row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value], errors='coerce'):
                row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = base_date
                row[unit_key] = 0
                return

            if pd.to_datetime(
                    new_row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]) > pd.to_datetime(base_date):
                new_row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = base_date
                new_row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = (
                    convert_str_date_to_datetime_format(row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    + datetime.timedelta(days=-1)).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                rows.insert(0, new_row)


def not_first_price_obj(document, expression, keyword, dollar_diff_oil_1, dollar_diff_oil_2, pct_diff_oil_1,
                        pct_diff_oil_2):
    phase = keyword.split('/')[-1].lower()

    if phase == PhaseEnum.aries_condensate.value:
        phase = PhaseEnum.condensate.value

    if 'PRI/' in keyword:
        model_name = EconEnum.price_model.value
    elif 'PAD/' in keyword or 'PAJ/' in keyword:
        model_name = EconEnum.differentials.value

    if model_name == EconEnum.price_model:
        if len(document[EconEnum.econ_function.value][model_name][phase][EconEnum.rows.value]) > 1:
            return True
    else:
        last_segment = get_differential_last_segment(expression, keyword, dollar_diff_oil_1, dollar_diff_oil_2,
                                                     pct_diff_oil_1, pct_diff_oil_2)
        if last_segment is not None:
            return True
    return False


def change_double_quote_to_previous_keyword(economic_df, header_cols):
    '''
    change all double quote in KEYWORD column to previous keyword
    '''
    keyword_index = get_header_index([EconHeaderEnum.initial_keyword.value], header_cols)
    economic_df = np.c_[economic_df, economic_df[:, keyword_index]]

    if 'keyword_mark' not in header_cols:
        header_cols.append('keyword_mark')
    keyword_mark_val = ''
    while '"' in economic_df[:, -1]:
        for idx, value in enumerate(economic_df[:, -1]):
            if value.startswith('*') or value == 'TEXT':
                continue
            if value != '"':
                keyword_mark_val = value
            economic_df[:, -1][idx] = keyword_mark_val
    return economic_df, header_cols


def add_common_lines(df, header_cols, common_default_lines):
    propnum_index, section_index, qualifier_index, keyword_index = get_header_index([
        EconHeaderEnum.propnum.value, EconHeaderEnum.section.value, EconHeaderEnum.qualifier.value,
        EconHeaderEnum.initial_keyword.value
    ], header_cols)
    if df.size != 0:
        propnum = df[0, propnum_index]
        common_lines = common_default_lines.get(EconHeaderEnum.common.value)
        if common_lines is not None:
            copy_df = np.copy(df)
            header_cols = ['KEYWORD', 'EXPRESSION']
            common_lines = np.array(common_lines)
            common_lines, header_cols = change_double_quote_to_previous_keyword(common_lines, header_cols)
            sequence = LARGE_NEGATIVE_START_VALUE

            for value in common_lines:
                common_keyword = str(value[0])
                common_expression = str(value[1])
                common_keyword_mark = str(value[2])
                if common_keyword.startswith('*'):
                    continue
                if common_keyword_mark not in copy_df[:, keyword_index]:
                    common_section = get_section_from_keyword(common_keyword_mark)
                    section_df = df[df[:, section_index].astype(str) == str(common_section)]
                    if section_df.size != 0:
                        common_qualifier = section_df[-1, qualifier_index]
                    else:
                        common_qualifier = ''
                    sequence += LARGE_SEQUENCE_VALUE
                    row = np.array(
                        [propnum, common_section, sequence, common_qualifier, common_keyword, common_expression, None])
                    df = np.vstack((df, row))
    return df


def get_fixed_expense_name(keyword, original_keyword, fixed_exp_assignment):
    use_key = None
    model_name = EconEnum.fixed_expense.value
    for key in fixed_exp_assignment:
        if keyword in fixed_exp_assignment[key]:
            use_key = key
    if use_key is not None:
        if original_keyword == '"':
            return use_key, model_name, fixed_exp_assignment
        else:
            for key in fixed_exp_assignment:
                if len(fixed_exp_assignment[key]) == 0:
                    fixed_exp_assignment[key].add(keyword)
                    return key, model_name, fixed_exp_assignment
            fixed_cost_name, _ = get_fixed_cost_name_from_assignment_dict(keyword, fixed_exp_assignment)
            return fixed_cost_name, model_name, fixed_exp_assignment
    else:
        if original_keyword != '"':
            for key in fixed_exp_assignment:
                if len(fixed_exp_assignment[key]) == 0:
                    fixed_exp_assignment[key].add(keyword)
                    return key, model_name, fixed_exp_assignment
            return EconEnum.other_cost_8.value, model_name, fixed_exp_assignment


def get_opc_expense_name(keyword, original_keyword, usage_dict, document):
    phase = str(keyword).split('/')[-1].lower()
    phase = phase if phase != PhaseEnum.aries_condensate.value else PhaseEnum.condensate.value
    if phase in OPC_PHASE_AVAILABILITY:
        for category in OPC_PHASE_AVAILABILITY.get(phase):
            if usage_dict.get(phase).get(category):
                continue
            rows = document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][EconEnum.rows.value]
            if len(rows) > 1:
                usage_dict[phase][category] = original_keyword != '"'
            if not usage_dict.get(phase).get(category):
                return category
        return category
    return EconEnum.gathering.value


def get_expense_description_name(keyword, description):
    if str(description) != '':
        description_items = str(description).split('&')
        description_items = [item.strip() for item in description_items]
        if str(keyword).upper() not in description_items:
            description_items.append(str(keyword).upper())
            description = ' & '.join(description_items)
        return description
    else:
        return str(keyword).upper()


def update_scenario_df_if_necessary(df_array, header_cols):
    for i in range(NUM_SCEN_QUALIFIERS):
        if f'QUAL{i}' not in header_cols:
            df_array = np.c_[df_array, np.array([''] * df_array.shape[0])]
            header_cols.append(f'QUAL{i}')
    return df_array, header_cols


def clean_propnum_in_property_df(df):
    propnum_header = None
    for header in df.columns:
        if WellHeaderEnum.propnum.value in header:
            propnum_header = header
            break
    if propnum_header is not None:
        df[propnum_header] = df[propnum_header].astype(str)
        df[propnum_header] = df[propnum_header].map(lambda x: re.sub(r'[_()-/\s]+', '', x))


def get_scenario_array_from_dbs_key(df, scen_header_cols, dbs_list_df, error_report):
    try:
        index = list(scen_header_cols).index('DBSKEY')
    except ValueError:
        index = None

    if index is not None:
        dbs_list_df.columns = [str(column).upper() for column in dbs_list_df.columns]
        if not dbs_list_df.empty and 'DBSKEY' in dbs_list_df.columns:
            match_dbs_key = dbs_list_df.loc[0, 'DBSKEY']
            result = df[df[:, index] == match_dbs_key]
        else:
            dbs_keys = np.unique(df[:, index])
            result = df[df[:, index] == dbs_keys[0]]

            error_report.log_error(message=ErrorMsgEnum.dbslist_key.value, severity=ErrorMsgSeverityEnum.warn.value)

    if result is None or result.size == 0:
        return df
    return result


def create_custom_dict_local(df, file_names, folder_name):
    df.columns = [str(table_name).upper() for table_name in df.columns]
    table_name_alias_dict = {}
    if all(table_name in df.columns for table_name in ['TABLENAME', 'TBL_ALIAS']):
        for idx, row in df.iterrows():
            table_name_alias_dict[str(row.TABLENAME)] = str(row.TBL_ALIAS)

    custom_df_dict = {}
    for file_name in file_names:
        try:
            split_file_name = file_name.split('.csv')[0]
            if split_file_name not in ARIES_FILES_LABEL.values() and split_file_name in table_name_alias_dict:
                custom_df = pd.read_csv(FileDir.base.value + folder_name + f'/{file_name}', engine="python")
                clean_propnum_in_property_df(custom_df)
                custom_df_dict[table_name_alias_dict[split_file_name]] = custom_df
        except Exception:
            continue

    return custom_df_dict


def add_list_method_special(df, well_id, scenario, forecast_index_list, original_keyword_index, keyword_index,
                            section_index, expression_index, error_report):
    df = np.c_[df, np.array(forecast_index_list)]
    if 'LIST_MODE_EDITOR' in np.char.upper(np.char.strip(
            df[:, expression_index].astype(str))) and EconHeaderEnum.list_method_special_key.value in df[:,
                                                                                                         section_index]:
        # get rows where keyword is LIST_METHOD_EDITOR
        try:
            ls_index = list(
                np.argwhere(
                    np.char.upper(np.char.strip(df[:, expression_index].astype(str))) == 'LIST_MODE_EDITOR').flatten())

            index_distance = 0
            for index in ls_index:
                index += index_distance
                use_keyword = str(df[index, keyword_index]).strip().upper()
                select_index = list(
                    np.argwhere((df[:, section_index] == EconHeaderEnum.list_method_special_key.value) & (
                        np.char.upper(np.char.strip(df[:, keyword_index].astype(str))) == use_keyword)).flatten())
                select_df = df[select_index]
                if select_df.size != 0:
                    start_date, start_index = None, None
                    for i in range(select_df.shape[0]):
                        if 'START' in select_df[i, expression_index]:
                            start_row = select_df[i, expression_index]
                            start_date = str(start_row).strip().split()[-1]
                            start_date = pd.to_datetime(start_date, errors='coerce')
                            if not pd.isnull(start_date):
                                start_date = start_date.strftime('%m/%Y')
                            start_index = i
                        else:
                            if start_index is not None:
                                expression_ls = str(select_df[i, expression_index]).strip().split()
                                select_df[i, original_keyword_index] = expression_ls[0]
                                select_df[i, section_index] = 4
                                if i == start_index + 1:
                                    expression_ls[1] = start_date
                                select_df[i, expression_index] = ' '.join(expression_ls[1:])

                    select_df = select_df[(start_index + 1):, :]
                    index_distance = select_df.shape[0] - 1
                    df = np.concatenate((df[:index, :], select_df, df[index + 1:]), axis=0)
                else:
                    index_distance -= 1
                    df = np.concatenate((df[:index, :], df[index + 1:]), axis=0)
        except (IndexError, TypeError):
            error_report.log_error(message=ErrorMsgEnum.list_method_special_error_msg.value,
                                   scenario=scenario,
                                   section=EconHeaderEnum.forecast_section_key.value,
                                   well=well_id,
                                   severity=ErrorMsgSeverityEnum.error.value)

    return df[df[:, section_index] != 24, :-1], list(df[df[:, section_index] != 24, -1].flatten())


def handle_overlay_expense_sequence(tax_exp_base, keyword, obj):
    if f'{keyword}-{EconEnum.overlay_sequence.value}' in tax_exp_base.tax_expense_overlay_dict:
        if type(obj) is list:
            for row_obj in obj:
                tax_exp_base.tax_expense_overlay_dict[f'{keyword}-{EconEnum.overlay_sequence.value}'].append(row_obj)
        else:
            tax_exp_base.tax_expense_overlay_dict[f'{keyword}-{EconEnum.overlay_sequence.value}'].append(obj)
    else:
        if type(obj) is list:
            tax_exp_base.tax_expense_overlay_dict[f'{keyword}-{EconEnum.overlay_sequence.value}'] = obj
        else:
            tax_exp_base.tax_expense_overlay_dict[f'{keyword}-{EconEnum.overlay_sequence.value}'] = [obj]

    return tax_exp_base


def compare_cap_and_value(segment_obj, log_report, scenario, property_id, section, model_name):
    if type(segment_obj) is list:
        return segment_obj
    is_greater = False
    cap = segment_obj.get('cap')
    try:
        cap = float(cap)
    except (ValueError, TypeError):
        cap = None
    if cap is None:
        return segment_obj
    unit_key = get_unit_key_and_clean_row_for_taxes([segment_obj])
    if unit_key is not None:
        try:
            unit_key_value = float(segment_obj[unit_key])
        except (ValueError, TypeError):
            unit_key_value = None
        if unit_key_value is not None:
            if cap < unit_key_value:
                segment_obj[unit_key] = cap
                is_greater = True
    if is_greater:
        log_report.log_error(message=format_error_msg(ErrorMsgEnum.cap_to_value.value, cap, unit_key_value),
                             scenario=scenario,
                             well=property_id,
                             model=model_name,
                             section=section,
                             severity=ErrorMsgSeverityEnum.warn.value)
    return segment_obj


def get_differential_last_segment(expression, keyword, dollar_diff_1, dollar_diff_2, pct_diff_1, pct_diff_2):
    last_segment = None
    if (expression[2] == UnitEnum.frac.value or expression[2] == UnitEnum.perc_sign.value):
        if 'PAJ' in keyword:
            if len(pct_diff_1) > 0:
                last_segment = pct_diff_1[-1]
        elif 'PAD' in keyword:
            if len(pct_diff_2) > 0:
                last_segment = pct_diff_2[-1]
    else:
        if len(dollar_diff_1) > 0:
            if any('offset_' in key or CCSchemaEnum.dates.value in key for key in dollar_diff_1[-1]):
                criteria_key = next(key for key in dollar_diff_1[-1]
                                    if 'offset_' in key or CCSchemaEnum.dates.value in key)
                if criteria_key == CCSchemaEnum.dates.value:
                    end = CCSchemaEnum.end_date.value
                else:
                    end = CCSchemaEnum.end.value
                if dollar_diff_1[-1][criteria_key][end] != EconEnum.econ_limit.value:
                    last_segment = dollar_diff_1[-1]
                else:
                    if len(dollar_diff_2) > 0:
                        last_segment = dollar_diff_2[-1]
    return last_segment


def check_if_more_than_one_element(default_document, add_zero_to_end_of_row):
    '''
    input: default_document
    outpu: default_document

    note: check if rows is more than 1 element, then pop the 1st one, change the last one to 'Econ Limit'
    '''
    default_document = add_zero_to_end_of_row(default_document)

    return default_document


def add_hold_expense_doc(document, hold_expense_doc):
    for key in hold_expense_doc:
        phase = [dict_value for dict_key, dict_value in VAR_EXPENSE_PHASE_DICT.items() if key in dict_key]
        if len(phase) == 1:
            phase = phase[-1]
            for category in variable_expenses_category:
                sub_doc = document[EconEnum.econ_function.value][EconEnum.variable_expense.value][phase][category]
                rows = sub_doc[EconEnum.rows.value]
                if len(rows) == 1:
                    for hold_row in hold_expense_doc[key]:
                        rows.append(hold_row)
                    sub_doc['description'] = key
                    break
    return document
