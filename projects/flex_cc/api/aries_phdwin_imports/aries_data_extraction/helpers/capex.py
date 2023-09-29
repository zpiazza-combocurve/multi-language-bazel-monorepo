import numpy as np
import pandas as pd
from api.aries_phdwin_imports.aries_import_helpers import fetch_value, get_model_name_from_qualifiers
from api.aries_phdwin_imports.helpers import cumulative_unit_dic
from combocurve.shared.aries_import_enums import (CCSchemaEnum, EconHeaderEnum, EconEnum, UnitEnum)
from combocurve.utils.constants import DAYS_IN_YEAR, DAYS_IN_MONTH


def get_capex_escalation_start(capex_obj, start_date, ls_expression, custom_escalation):
    try:
        escalation_crit = ls_expression[-2]
        custom_esc_name = ls_expression[-1]
    except IndexError:
        escalation_crit = None
        custom_esc_name = None
    if escalation_crit is not None and custom_esc_name is not None:
        if custom_esc_name in custom_escalation:
            if custom_escalation[custom_esc_name]['start_type'] == '1':
                capex_obj['escalation_start'] = {
                    'date':
                    pd.to_datetime(custom_escalation[custom_esc_name]['date']).strftime(
                        CCSchemaEnum.ymd_date_dash_format.value)
                }
                return capex_obj
    capex_obj['escalation_start'] = {
        'date': pd.to_datetime(start_date).strftime(CCSchemaEnum.ymd_date_dash_format.value)
    }
    return capex_obj


def update_capex_cum_obj(obj, start_date, expression):
    unit = expression[4]
    key = cumulative_unit_dic[unit][0]
    multiplier = cumulative_unit_dic[unit][1]
    value = float(expression[3])

    obj[CCSchemaEnum.start.value] = start_date
    obj[key] = value * multiplier

    return obj


def update_offset_if_delay_present(obj, keyword, section, abandon_delay_days, abandon_delay_date, salvage_delay_days,
                                   salvage_delay_date):
    if keyword in ['ABAN']:
        if abandon_delay_days is not None:
            obj[EconEnum.econ_limit_offset.value] = abandon_delay_days
        elif not pd.isnull(abandon_delay_date):
            obj[CCSchemaEnum.date.value] = obj.pop(EconEnum.econ_limit_offset.value)
            obj[CCSchemaEnum.date.value] = abandon_delay_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
    elif keyword in ['SALV'] and section == EconHeaderEnum.tax_expense_section_key.value:
        if salvage_delay_days is not None:
            obj[EconEnum.econ_limit_offset.value] = salvage_delay_days
        elif not pd.isnull(salvage_delay_date):
            obj[CCSchemaEnum.date.value] = obj.pop(EconEnum.econ_limit_offset.value)
            obj[CCSchemaEnum.date.value] = salvage_delay_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
    return obj


def get_capex_delay_days_and_date(df, keyword_index, property_id, expression_index, mapping_dic, custom_mapping_dic):
    abandon_delay_days, abandon_delay_date, salvage_delay_days, salvage_delay_date = [None, None, None, None]
    abandon_section = df[np.argwhere((df[:, keyword_index] == 'ABANDON')).flatten(), :]
    salvage_section = df[np.argwhere((df[:, keyword_index] == 'SALVAGE')).flatten(), :]

    if abandon_section.size != 0:
        abandon_expression = abandon_section[-1, expression_index].split(' ')
        abandon_delay_days, abandon_delay_date = convert_aban_exp_to_day(abandon_expression, property_id, mapping_dic,
                                                                         custom_mapping_dic)

    if salvage_section.size != 0:
        salvage_expression = salvage_section[-1, expression_index].split(' ')
        salvage_delay_days, salvage_delay_date = convert_aban_exp_to_day(salvage_expression, property_id, mapping_dic,
                                                                         custom_mapping_dic)

    return abandon_delay_days, abandon_delay_date, salvage_delay_days, salvage_delay_date


def convert_aban_exp_to_day(expression, property_id, mapping_dic, custom_mapping_dic):
    unit = fetch_value(expression[-1], property_id, mapping_dic, custom_mapping_dic)
    value = fetch_value(expression[0], property_id, mapping_dic, custom_mapping_dic)

    if unit == UnitEnum.months.value or unit == UnitEnum.month.value:
        return int(float(value) * DAYS_IN_MONTH), None

    elif unit == UnitEnum.years.value or unit == UnitEnum.year.value:
        return int(float(value) * DAYS_IN_YEAR), None

    elif unit == UnitEnum.ad.value:
        return None, pd.to_datetime(value, errors='coerce')

    else:
        return None, None


def process_delay_day_for_misassignment(skip_error_msg, ls_expression, keyword, property_id, qualifier,
                                        capex_model_name, document, mapping_dic, custom_mapping_dic):
    try:
        delay_days, delay_date = convert_aban_exp_to_day(ls_expression, property_id, mapping_dic, custom_mapping_dic)
    except (ValueError, IndexError):
        delay_days = None
        delay_date = None
    if delay_days is not None or delay_date is not None:
        capex_model_name = get_model_name_from_qualifiers(keyword, qualifier, capex_model_name, document)
        skip_error_msg = True
    return delay_days, delay_date, capex_model_name, skip_error_msg


def check_if_aban_salv_keyword_present(abandon_delay_days, abandon_delay_date, salvage_delay_days, salvage_delay_date,
                                       keyword, property_id, ls_expression, qualifier, capex_model_name, document,
                                       mapping_dic, custom_mapping_dic):
    skip_error_msg = False
    if keyword in ['ABAN', 'SALV']:
        if keyword == 'ABAN':
            delay_days, delay_date, capex_model_name, skip_error_msg = process_delay_day_for_misassignment(
                skip_error_msg, ls_expression, keyword, property_id, qualifier, capex_model_name, document, mapping_dic,
                custom_mapping_dic)
            return delay_days, delay_date, salvage_delay_days, salvage_delay_date, capex_model_name, skip_error_msg
        else:
            delay_days, delay_date, capex_model_name, skip_error_msg = process_delay_day_for_misassignment(
                skip_error_msg, ls_expression, keyword, property_id, qualifier, capex_model_name, document, mapping_dic,
                custom_mapping_dic)
            return abandon_delay_days, abandon_delay_date, delay_days, delay_date, capex_model_name, skip_error_msg
