import datetime
import itertools
import os
from pytz import timezone

from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME

import numpy as np
import pandas as pd
from bson import ObjectId
from fpdf import FPDF

from combocurve.shared.env import GCP_PRIMARY_PROJECT_ID
from combocurve.shared.date import py_date_change_time_zone
from combocurve.shared.econ_report.econ_report_query import (
    UNDISC_CF_KEY,
    DISC_CF_KEY,
    TOTAL_CAPEX_KEY,
    GROSS_WELL_COUNT_KEY,
    MONTHLY_COLS,
    DATE_KEY,
    AGGREGATION_GROUP,
    SPECIAL_COL_DICT,
    get_one_liner_query_by_well,
    get_one_liner_query_agg_well_head,
    get_monthly_query_str,
    get_yearly_query_str,
    get_run_data,
    unit_to_multiplier,
)
from combocurve.shared.econ_report.econ_report_tools import (
    round_w_zero,
    blank_line,
    add_col_interval,
    str_align_center,
    str_align_right,
    str_align_left,
    get_aries_date,
    datetime_to_str,
    cal_payout_duration,
    cal_net_over_inv,
    cal_disc_net_over_inv,
    cal_group_irr,
    get_one_liner_value,
    adjust_reserves_group_order,
    adjust_well_header_group_order,
    update_progress_by_page,
    add_operating_cash_flow_col,
)
from combocurve.shared.np_helpers import get_well_order_by_names
from combocurve.services.econ.econ_file_service import get_group_by_cols


class EconPdfError(Exception):
    expected = True


AGGREGATE = 'aggregation'

YEAR = 'year'

GROSS_OIL_LABEL = 'GROSS OIL'
GROSS_GAS_LABEL = 'GROSS GAS'
GROSS_BOE_LABEL = 'GROSS BOE'

NET_OIL_LABEL = 'NET OIL'
NET_GAS_LABEL = 'NET GAS'
NET_NGL_LABEL = 'NET NGL'

OIL_LABEL = 'OIL'
GAS_LABEL = 'GAS'
NGL_LABEL = 'NGL'

TOTAL_LABEL = 'TOTAL'

WELL_HEAD_VOLUME_CATEGORY = 'WH VOL'
SALSE_VOLUME_CATEGORY = 'SALES VOL'
REVENUE_CATEGORY = 'REVENUE'
PRICE_CATEGORY = 'PRICE'
TAXES_CATEGORY = 'TAX'
EXPENSE_CATEGORY = 'EXPENSE'
INVESTMENT_CATEGORY = 'CAPEX'
CASH_FLOW_CATEGORY = 'CASH FLOW'

DATE_COL = {
    'label': '--END--',
    'category': 'YEAR',
    'unit': '',
}

REPORT_TITLE = 'ECONOMIC CASH FLOW SUMMARY'

INC_IDX = 'incremental_index'

BFIT_ECON_COLS = {
    'section1': {
        YEAR: DATE_COL,
        'gross_well_count': {
            'label': 'GROSS',
            'category': 'WELL COUNT',
            'unit': '',
        },
        'gross_oil_well_head_volume': {
            'label': GROSS_OIL_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'gross_gas_well_head_volume': {
            'label': GROSS_GAS_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'gas',
        },
        'gross_boe_well_head_volume': {
            'label': GROSS_BOE_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'net_oil_sales_volume': {
            'label': NET_OIL_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'net_gas_sales_volume': {
            'label': NET_GAS_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'gas',
        },
        'net_ngl_sales_volume': {
            'label': NET_NGL_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'ngl',
        },
        'oil_revenue': {
            'label': OIL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'gas_revenue': {
            'label': GAS_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'ngl_revenue': {
            'label': NGL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'total_revenue': {
            'label': TOTAL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
    },
    'section2': {
        YEAR: DATE_COL,
        'oil_price': {
            'label': OIL_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/BBL',
        },
        'gas_price': {
            'label': GAS_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/MCF',
        },
        'ngl_price': {
            'label': NGL_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/BBL',
        },
        'total_severance_tax': {
            'label': 'SEVERANCE',
            'category': TAXES_CATEGORY,
            'unit_key': 'cash',
        },
        'ad_valorem_tax': {
            'label': 'AD VALOREM',
            'category': TAXES_CATEGORY,
            'unit_key': 'cash',
        },
        'total_expense': {
            'label': TOTAL_LABEL,
            'category': EXPENSE_CATEGORY,
            'unit_key': 'cash',
        },
        'net_profit': {
            'label': 'NET',
            'category': 'PROFIT',
            'unit_key': 'cash',
        },
        'operating_cash_flow': {
            'label': TOTAL_LABEL,
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
        TOTAL_CAPEX_KEY: {
            'label': TOTAL_LABEL,
            'category': INVESTMENT_CATEGORY,
            'unit_key': 'cash',
        },
        UNDISC_CF_KEY: {
            'label': 'BFIT',
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
        DISC_CF_KEY: {
            'label': 'BFIT DISC',
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
    }
}

AFIT_ECON_COLS = {
    'section1': {
        YEAR: DATE_COL,
        'gross_well_count': {
            'label': 'GROSS',
            'category': 'WELL COUNT',
            'unit': '',
        },
        'gross_oil_well_head_volume': {
            'label': GROSS_OIL_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'gross_gas_well_head_volume': {
            'label': GROSS_GAS_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'gas',
        },
        'gross_boe_well_head_volume': {
            'label': GROSS_BOE_LABEL,
            'category': WELL_HEAD_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'net_oil_sales_volume': {
            'label': NET_OIL_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'oil',
        },
        'net_gas_sales_volume': {
            'label': NET_GAS_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'gas',
        },
        'net_ngl_sales_volume': {
            'label': NET_NGL_LABEL,
            'category': SALSE_VOLUME_CATEGORY,
            'unit_key': 'ngl',
        },
        'oil_revenue': {
            'label': OIL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'gas_revenue': {
            'label': GAS_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'ngl_revenue': {
            'label': NGL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
        'total_revenue': {
            'label': TOTAL_LABEL,
            'category': REVENUE_CATEGORY,
            'unit_key': 'cash',
        },
    },
    'section2': {
        YEAR: DATE_COL,
        'oil_price': {
            'label': OIL_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/BBL',
        },
        'gas_price': {
            'label': GAS_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/MCF',
        },
        'ngl_price': {
            'label': NGL_LABEL,
            'category': PRICE_CATEGORY,
            'unit': '$/BBL',
        },
        'total_production_tax': {
            'label': 'TOTAL PROD',
            'category': TAXES_CATEGORY,
            'unit_key': 'cash',
        },
        'total_expense': {
            'label': TOTAL_LABEL,
            'category': EXPENSE_CATEGORY,
            'unit_key': 'cash',
        },
        TOTAL_CAPEX_KEY: {
            'label': TOTAL_LABEL,
            'category': INVESTMENT_CATEGORY,
            'unit_key': 'cash',
        },
        UNDISC_CF_KEY: {
            'label': 'BFIT',
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
        DISC_CF_KEY: {
            'label': 'BFIT DISC',
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
        'total_deductions': {
            'label': 'DD&A',
            'category': 'DEDUCTION',
            'unit_key': 'cash',
        },
        'total_income_tax': {
            'label': 'TOT INCOME',
            'category': TAXES_CATEGORY,
            'unit_key': 'cash',
        },
        'after_income_tax_cash_flow': {
            'label': 'AFIT',
            'category': CASH_FLOW_CATEGORY,
            'unit_key': 'cash',
        },
    }
}

COL_NUMBER = 12
DATE_COL_LEN = 6
OTHER_COL_LEN = 11
COL_INTERVAL_LEN = 2
TOTAL_LEN = DATE_COL_LEN + (COL_NUMBER - 1) * (OTHER_COL_LEN + COL_INTERVAL_LEN)

WELL_INFO_COLON_LEFT = 10

INFO_TOTAL_LEN = 35
INFO_COLON_LEFT = 9
INFO_COLON_RIGHT = 25

METRICS_LEN = 35
PW_LEN = 19
AFIT_PW_NUMBER_LEN = 19
PW_PCT_LEN = 6
PW_INTERVAL_LEN = 2
PW_NUMBER_LEN = 15
ONE_LINER_SEC_INTERVAL = 6

PDF_FONT_SIZE = 7
PDF_W = 3
PDF_H = 3
PDF_MARGIN = 2.5


def generate_title_section(report_info, bfit_report, afit_report, time_zone=None):
    scenario_name = report_info.get('scenario_name', '')
    project_name = report_info.get('project_name', '')
    combo_name = report_info.get('combo_name', '')
    report_type = report_info.get('report_type', '')

    if report_info.get('econ_run_time') and time_zone:
        run_date = py_date_change_time_zone(report_info.get('econ_run_time'), time_zone)
    else:
        run_date = datetime.datetime.now(timezone(time_zone)) if time_zone else datetime.datetime.now()
    date_str = run_date.strftime('%m/%d/%Y')
    time_str = run_date.strftime('%H:%M:%S')

    all_blank_row = blank_line(TOTAL_LEN)

    if report_type == AGGREGATE:
        group_name = report_info['group_name']
        r1 = group_name + ' ' * (TOTAL_LEN - len(group_name) - INFO_TOTAL_LEN) + str_align_left(
            'DATE', INFO_COLON_LEFT) + ': ' + date_str
        r2 = blank_line(TOTAL_LEN - INFO_TOTAL_LEN) + 'TIME' + ' ' * 5 + ': ' + time_str
        r3 = blank_line(TOTAL_LEN - INFO_TOTAL_LEN) + str_align_left(
            'PROJECT', INFO_COLON_LEFT) + ': ' + str_align_left(project_name, INFO_COLON_RIGHT - 1)
        r4 = blank_line(TOTAL_LEN - INFO_TOTAL_LEN) + str_align_left(
            'SCENARIO', INFO_COLON_LEFT) + ': ' + str_align_left(scenario_name, INFO_COLON_RIGHT - 1)
        if combo_name:
            r5 = blank_line(TOTAL_LEN - INFO_TOTAL_LEN) + str_align_left(
                'COMBO', INFO_COLON_LEFT) + ': ' + str_align_left(combo_name, INFO_COLON_RIGHT - 1)
            well_info_rows = [r1, r2, r3, r4, r5]

        else:
            well_info_rows = [r1, r2, r3, r4]
    else:
        api14 = report_info.get('api14', '')
        api14_text = f'{str_align_left("API 14", WELL_INFO_COLON_LEFT)}: {api14}'
        inpt_id = report_info.get('inpt_id', '')
        inpt_id_text = f'{str_align_left("INPT ID", WELL_INFO_COLON_LEFT)}: {inpt_id}'
        well_name = report_info.get('well_name', '')
        well_name_text = f'{str_align_left("WELL NAME", WELL_INFO_COLON_LEFT)}: {well_name}'
        inc_idx = report_info.get(INC_IDX, '0')
        inc_idx_text = f'{str_align_left("INC INDEX", WELL_INFO_COLON_LEFT)}: {inc_idx}'
        group_name = report_info.get('econ_group', None)
        group_name_text = f'{str_align_left("ECON GROUP", WELL_INFO_COLON_LEFT)}: {group_name}'

        r1 = well_name_text + ' ' * (TOTAL_LEN - len(well_name_text) - INFO_TOTAL_LEN) + str_align_left(
            'DATE', INFO_COLON_LEFT) + ': ' + date_str

        r2 = group_name_text + ' ' * (TOTAL_LEN - len(group_name_text)
                                      - INFO_TOTAL_LEN) + 'TIME' + ' ' * 5 + ': ' + time_str

        r3 = api14_text + ' ' * (TOTAL_LEN - len(api14_text) - INFO_TOTAL_LEN) + str_align_left(
            'PROJECT', INFO_COLON_LEFT) + ': ' + str_align_left(project_name, INFO_COLON_RIGHT - 1)
        r4 = inpt_id_text + blank_line(TOTAL_LEN - len(inpt_id_text) - INFO_TOTAL_LEN) + str_align_left(
            'SCENARIO', INFO_COLON_LEFT) + ': ' + str_align_left(scenario_name, INFO_COLON_RIGHT - 1)
        r5 = inc_idx_text

        if combo_name:
            r5 = r5 + blank_line(TOTAL_LEN - INFO_TOTAL_LEN - len(r5)) + str_align_left(
                'COMBO', INFO_COLON_LEFT) + ': ' + str_align_left(combo_name, INFO_COLON_RIGHT - 1)
        well_info_rows = [r1, r2, r3, r4, r5]

    if bfit_report == 'yes':
        title = str_align_center(REPORT_TITLE + ' (BFIT)', TOTAL_LEN)
    elif afit_report == 'yes':
        title = str_align_center(REPORT_TITLE + ' (AFIT)', TOTAL_LEN)

    date_rows = []
    if report_type == AGGREGATE:
        general_options = report_info['general_options']
        agg_date_str = get_aries_date(general_options['main_options']['aggregation_date'])
        agg_date_row = str_align_center('AGGREGATION DATE : ' + agg_date_str, TOTAL_LEN)
        date_rows.append(agg_date_row)
    else:
        one_liner = report_info['one_liner']
        as_of_date_str = datetime_to_str(one_liner['as_of_date'])
        as_of_date_row = str_align_center('AS OF DATE : ' + as_of_date_str, TOTAL_LEN)
        discount_date_str = datetime_to_str(one_liner['discount_date'])
        discount_date_row = str_align_center('DISCOUNT DATE : ' + discount_date_str, TOTAL_LEN)
        date_rows += [as_of_date_row, discount_date_row]

    return well_info_rows + [all_blank_row, title, all_blank_row] + date_rows + [all_blank_row, all_blank_row]


def gen_econ_header_list(econ_section, econ_section_keys, unit_dict):
    econ_label_row = ''
    econ_cat_row = ''
    econ_unit_row = ''

    for i, col_key in enumerate(econ_section_keys):
        econ_col = econ_section[col_key]
        col_label = econ_col['label']
        col_cat = econ_col['category']
        if 'unit' in econ_col:
            col_unit = econ_col['unit']
        else:
            col_unit = unit_dict[econ_col['unit_key']]

        col_len = DATE_COL_LEN if col_key == YEAR else OTHER_COL_LEN

        col_label_str = str_align_center(col_label, col_len, ' ')
        col_cat_str = str_align_center(col_cat, col_len, ' ')
        col_unit = str_align_center(col_unit, col_len, '-')

        econ_label_row += col_label_str
        econ_cat_row += col_cat_str
        econ_unit_row += col_unit

        if i != len(econ_section.keys()) - 1:
            econ_label_row = add_col_interval(econ_label_row, COL_INTERVAL_LEN)
            econ_cat_row = add_col_interval(econ_cat_row, COL_INTERVAL_LEN)
            econ_unit_row = add_col_interval(econ_unit_row, COL_INTERVAL_LEN)

    return [econ_label_row, econ_cat_row, econ_unit_row]


def gen_yearly_list(group_df, detail_years, econ_section_keys, s_tot_dict):
    yearly_list = []

    for year_idx, year in enumerate(detail_years, start=1):
        y_row = ''

        for col_idx, col_key in enumerate(econ_section_keys, start=1):
            if col_key == YEAR:
                y_row += str_align_center(str(year), DATE_COL_LEN, ' ')
            elif col_key == 'total_production_tax':
                col_value_1 = group_df.at[year, 'total_severance_tax']
                col_value_2 = group_df.at[year, 'ad_valorem_tax']
                s_tot_dict[col_key] += (col_value_1 + col_value_2)
                col_value_str = round_w_zero(col_value_1 + col_value_2, 3)

                y_row += str_align_right(col_value_str, OTHER_COL_LEN, ' ')
            elif col_key == 'total_income_tax':
                col_value_1 = group_df.at[year, 'state_income_tax']
                col_value_2 = group_df.at[year, 'federal_income_tax']
                s_tot_dict[col_key] += (col_value_1 + col_value_2)
                col_value_str = round_w_zero(col_value_1 + col_value_2, 3)

                y_row += str_align_right(col_value_str, OTHER_COL_LEN, ' ')
            else:
                col_value = group_df.at[year, col_key]
                s_tot_dict[col_key] += col_value
                col_value_str = round_w_zero(col_value, 3)

                y_row += str_align_right(col_value_str, OTHER_COL_LEN, ' ')

            if col_idx != COL_NUMBER:
                y_row = add_col_interval(y_row, COL_INTERVAL_LEN)

        yearly_list.append(y_row)

        rem = len(detail_years) % 5
        if (year_idx + (5 - rem)) % 5 == 0:
            yearly_list.append(blank_line(TOTAL_LEN))

    return yearly_list


def get_tot_price_str(price_list, prod_sum, rev_sum, multiplier):
    if prod_sum == 0:
        if len(price_list) == 0:
            tot_price = 0
        else:
            tot_price = sum(price_list) / len(price_list)
        tot_price_str = round_w_zero(tot_price, 3)
    else:
        tot_price_str = round_w_zero(multiplier * float(rev_sum) / float(prod_sum), 3)

    return tot_price_str


def gen_total_list(group_df, detail_years, remain_years, econ_section_keys, s_tot_dict, unit_dict):
    cur_tot_row = ''
    remain_row = ''
    tot_row = ''

    cash_unit = unit_dict['cash']

    for col_index, col_key in enumerate(econ_section_keys, start=1):
        if col_key == YEAR:
            cur_tot_row += str_align_center('S TOT', DATE_COL_LEN, ' ')
            remain_row += str_align_center('REMAIN', DATE_COL_LEN, ' ')
            tot_row += str_align_center('TOTAL', DATE_COL_LEN, ' ')
        elif col_key == GROSS_WELL_COUNT_KEY:
            cur_tot_row += str_align_right('N/A', OTHER_COL_LEN, ' ')
            remain_row += str_align_right('N/A', OTHER_COL_LEN, ' ')
            tot_row += str_align_right('N/A', OTHER_COL_LEN, ' ')
        else:
            if 'price' in col_key:
                phase = col_key.split('_')[0]
                phase_prod_key = f'net_{phase}_sales_volume'
                pahse_rev_key = f'{phase}_revenue'

                prod_s_tot = s_tot_dict[phase_prod_key]
                rev_s_tot = s_tot_dict[pahse_rev_key]

                prod_rem = sum(group_df[phase_prod_key][group_df.index.isin(remain_years)])
                rev_rem = sum(group_df[pahse_rev_key][group_df.index.isin(remain_years)])

                prod_tot = prod_s_tot + prod_rem
                rev_tot = rev_s_tot + rev_rem

                phase_vol_unit = unit_dict[phase]
                multiplier = unit_to_multiplier(phase_vol_unit) / unit_to_multiplier(cash_unit)

                col_cur_tot_str = get_tot_price_str(group_df[col_key][group_df.index.isin(detail_years)], prod_s_tot,
                                                    rev_s_tot, multiplier)
                col_rem_str = get_tot_price_str(group_df[col_key][group_df.index.isin(remain_years)], prod_rem, rev_rem,
                                                multiplier)
                col_tot_str = get_tot_price_str(group_df[col_key], prod_tot, rev_tot, multiplier)

            elif col_key == 'total_production_tax':
                col_cur_tot = s_tot_dict[col_key]
                col_rem_1 = sum(group_df['total_severance_tax'][group_df.index.isin(remain_years)])
                col_rem_2 = sum(group_df['ad_valorem_tax'][group_df.index.isin(remain_years)])
                col_tot = col_rem_1 + col_rem_2 + col_cur_tot

                col_cur_tot_str = round_w_zero(col_cur_tot, 3)
                col_rem_str = round_w_zero(col_rem_1 + col_rem_2, 3)
                col_tot_str = round_w_zero(col_tot, 3)

            elif col_key == 'total_income_tax':
                col_cur_tot = s_tot_dict[col_key]
                col_rem_1 = sum(group_df['state_income_tax'][group_df.index.isin(remain_years)])
                col_rem_2 = sum(group_df['federal_income_tax'][group_df.index.isin(remain_years)])
                col_tot = col_rem_1 + col_rem_2 + col_cur_tot

                col_cur_tot_str = round_w_zero(col_cur_tot, 3)
                col_rem_str = round_w_zero(col_rem_1 + col_rem_2, 3)
                col_tot_str = round_w_zero(col_tot, 3)

            else:
                col_cur_tot = s_tot_dict[col_key]
                col_rem = sum(group_df[col_key][group_df.index.isin(remain_years)])
                col_tot = col_rem + col_cur_tot

                col_cur_tot_str = round_w_zero(col_cur_tot, 3)
                col_rem_str = round_w_zero(col_rem, 3)
                col_tot_str = round_w_zero(col_tot, 3)

            cur_tot_row += str_align_right(col_cur_tot_str, OTHER_COL_LEN, ' ')
            remain_row += str_align_right(col_rem_str, OTHER_COL_LEN, ' ')
            tot_row += str_align_right(col_tot_str, OTHER_COL_LEN, ' ')

        if col_index != COL_NUMBER:
            cur_tot_row = add_col_interval(cur_tot_row, COL_INTERVAL_LEN)
            remain_row = add_col_interval(remain_row, COL_INTERVAL_LEN)
            tot_row = add_col_interval(tot_row, COL_INTERVAL_LEN)

    return [cur_tot_row, remain_row, tot_row, blank_line(TOTAL_LEN)]


def generate_econ_section(group_df, report_info, bfit_report, afit_report):
    if bfit_report == 'yes':
        unit_dict = report_info['general_options']['reporting_units']

        all_econ_col_keys = list(BFIT_ECON_COLS['section1'].keys()) + list(BFIT_ECON_COLS['section2'].keys())
        s_tot_dict = dict(zip([k for k in all_econ_col_keys if k != YEAR], [0] * (COL_NUMBER * 2 - 2)))

        econ_list = []

        for p_key in BFIT_ECON_COLS:

            econ_section = BFIT_ECON_COLS[p_key]
            econ_section_keys = list(econ_section.keys())

            # header
            econ_header_list = gen_econ_header_list(econ_section, econ_section_keys, unit_dict)
            econ_list += econ_header_list

            years = group_df.index.to_list()

            if len(years) > 15:
                detail_years = years[0:15]
                remain_years = years[15:]
            else:
                detail_years = years
                remain_years = []

            # yearly
            yearly_list = gen_yearly_list(group_df, detail_years, econ_section_keys, s_tot_dict)
            econ_list += yearly_list

            # total
            total_list = gen_total_list(group_df, detail_years, remain_years, econ_section_keys, s_tot_dict, unit_dict)

            econ_list += total_list

        return econ_list

    if afit_report == 'yes':
        unit_dict = report_info['general_options']['reporting_units']

        all_econ_col_keys = list(AFIT_ECON_COLS['section1'].keys()) + list(AFIT_ECON_COLS['section2'].keys())
        s_tot_dict = dict(zip([k for k in all_econ_col_keys if k != YEAR], [0] * (COL_NUMBER * 2 - 2)))

        econ_list = []

        for p_key in AFIT_ECON_COLS:

            econ_section = AFIT_ECON_COLS[p_key]
            econ_section_keys = list(econ_section.keys())

            # header
            econ_header_list = gen_econ_header_list(econ_section, econ_section_keys, unit_dict)
            econ_list += econ_header_list

            years = group_df.index.to_list()

            if len(years) > 15:
                detail_years = years[0:15]
                remain_years = years[15:]
            else:
                detail_years = years
                remain_years = []

            # yearly
            yearly_list = gen_yearly_list(group_df, detail_years, econ_section_keys, s_tot_dict)
            econ_list += yearly_list

            # total
            total_list = gen_total_list(group_df, detail_years, remain_years, econ_section_keys, s_tot_dict, unit_dict)

            econ_list += total_list

        return econ_list


def generate_one_liner_section(monthly_group_df, report_info, bfit_report, afit_report):
    if afit_report == 'yes':
        general_options = report_info['general_options']
        one_liner = report_info['one_liner']
        report_type = report_info['report_type']

        cash_unit = general_options['reporting_units']['cash']
        discount_table = general_options['discount_table']
        primary_discount = discount_table['first_discount']
        discount_rows = discount_table['rows']
        cf_col_dict = {
            DATE_KEY: monthly_group_df[DATE_KEY].to_numpy('str'),
            'total_capex': monthly_group_df[TOTAL_CAPEX_KEY].to_numpy('float'),
            'bfit_undisc_cf': monthly_group_df[UNDISC_CF_KEY].to_numpy('float'),
            'bfit_disc_cf': monthly_group_df[DISC_CF_KEY].to_numpy('float'),
            'afit_undisc_cf': monthly_group_df['after_income_tax_cash_flow'].to_numpy('float'),
            'afit_disc_cf': monthly_group_df['afit_first_discount_cash_flow'].to_numpy('float'),
        }

        bfit_metrics_list = [
            ['BFIT METRICS', ''],
            ['-' * METRICS_LEN, ''],
            ['ECON LIFE, YRS', ''],
            ['PRIMARY DISC %', round_w_zero(primary_discount, 2)],
            ['BFIT UNDISC PAYOUT MO', ''],
            ['BFIT PRIMARY DISC PAYOUT MO', ''],
            ['BFIT UNDISC ROI', ''],
            ['BFIT PRIMARY DISC ROI', ''],
            ['BFIT IRR %', ''],
        ]

        dates = np.array(cf_col_dict[DATE_KEY], dtype='datetime64[D]').astype(datetime.date).tolist()

        if report_type == 'by_well':  # by well one liner metrics
            bfit_metrics_list[2][1] = get_one_liner_value(one_liner, 'well_life', 2)
            bfit_metrics_list[4][1] = get_one_liner_value(one_liner, 'payout_duration', 2)
            bfit_metrics_list[8][1] = get_one_liner_value(one_liner, 'irr', 2)
            bfit_metrics_list.append(['INITIAL W.I., PCT.', get_one_liner_value(one_liner, 'original_wi_oil', 2)])
            # discount payout not included in one liner, need to be calculated
            bfit_metrics_list[5][1] = cal_payout_duration(cf_col_dict['bfit_disc_cf'])
            bfit_metrics_list[6][1] = get_one_liner_value(one_liner, 'undiscounted_roi', 2)
            # discounted roi
            bfit_metrics_list[7][1] = get_one_liner_value(one_liner, 'first_discount_roi', 2)
        else:  # by group one liner metrics
            bfit_metrics_list[2][1] = round_w_zero(len(monthly_group_df[DATE_KEY]) / 12, 2)
            bfit_metrics_list[4][1] = cal_payout_duration(cf_col_dict['bfit_undisc_cf'])
            bfit_metrics_list[8][1] = cal_group_irr(cf_col_dict['bfit_undisc_cf'], dates, discount_table)
            disc_date = dates[0]
            bfit_metrics_list[5][1] = cal_payout_duration(cf_col_dict['bfit_disc_cf'])
            bfit_metrics_list[6][1] = cal_net_over_inv(cf_col_dict['bfit_undisc_cf'], cf_col_dict['total_capex'])
            # discounted roi
            bfit_metrics_list[7][1] = cal_disc_net_over_inv(cf_col_dict['bfit_undisc_cf'], cf_col_dict['total_capex'],
                                                            dates, disc_date, discount_table)

        bfit_pw_list = [
            ['DISC %', f'BFIT DISC CF {cash_unit}'],
            ['-' * PW_PCT_LEN, '-' * PW_NUMBER_LEN],
        ]

        for i, d_r in enumerate(discount_rows, start=1):
            disc_rate = round_w_zero(d_r['discount_table'], 2)
            discount_table_key = f'discount_table_cash_flow_{i}'
            if discount_table_key in one_liner.keys():
                cum_disc_cf = round_w_zero(one_liner[discount_table_key], 3)
            else:
                cum_disc_cf = ''
            bfit_pw_list.append([disc_rate, cum_disc_cf])

        one_liner_interval = ' ' * ONE_LINER_SEC_INTERVAL
        blank_part = ' ' * (TOTAL_LEN - ONE_LINER_SEC_INTERVAL * 4 - METRICS_LEN * 2 - PW_LEN * 2)

        #AFIT
        afit_metrics_list = [
            ['AFIT METRICS', ''],
            ['-' * METRICS_LEN, ''],
            ['ECON LIFE, YRS', ''],
            ['PRIMARY DISC %', round_w_zero(primary_discount, 2)],
            ['AFIT UNDISC PAYOUT MO', ''],
            ['AFIT PRIMARY DISC PAYOUT MO', ''],
            ['AFIT UNDISC ROI', ''],
            ['AFIT PRIMARY DISC ROI', ''],
            ['AFIT IRR %', ''],
        ]

        if report_type == 'by_well':  # by well one liner metrics
            afit_metrics_list[2][1] = get_one_liner_value(one_liner, 'well_life', 2)
            afit_metrics_list[4][1] = get_one_liner_value(one_liner, 'afit_payout_duration', 2)
            afit_metrics_list[8][1] = get_one_liner_value(one_liner, 'afit_irr', 2)
            afit_metrics_list.append(['INITIAL W.I., PCT.', get_one_liner_value(one_liner, 'original_wi_oil', 2)])
            # discount payout not included in one liner, need to be calculated
            afit_metrics_list[5][1] = cal_payout_duration(cf_col_dict['afit_disc_cf'])
            afit_metrics_list[6][1] = get_one_liner_value(one_liner, 'afit_undiscounted_roi', 2)
            # discounted roi
            afit_metrics_list[7][1] = get_one_liner_value(one_liner, 'afit_first_discount_roi', 2)
        else:  # by group one liner metrics
            afit_metrics_list[2][1] = round_w_zero(len(monthly_group_df[DATE_KEY]) / 12, 2)
            afit_metrics_list[4][1] = cal_payout_duration(cf_col_dict['afit_undisc_cf'])
            afit_metrics_list[8][1] = cal_group_irr(cf_col_dict['afit_undisc_cf'], dates, discount_table)
            disc_date = dates[0]
            afit_metrics_list[5][1] = cal_payout_duration(cf_col_dict['afit_disc_cf'])
            afit_metrics_list[6][1] = cal_net_over_inv(cf_col_dict['afit_undisc_cf'], cf_col_dict['total_capex'])
            # discounted roi
            afit_metrics_list[7][1] = cal_disc_net_over_inv(cf_col_dict['afit_undisc_cf'], cf_col_dict['total_capex'],
                                                            dates, disc_date, discount_table)

        afit_pw_list = [
            [f'AFIT DISC CF {cash_unit}'],
            ['-' * AFIT_PW_NUMBER_LEN],
        ]
        if report_type != 'by_well':
            one_liner = report_info['afit_one_liner']

        for i, _ in enumerate(discount_rows, start=1):
            discount_table_key = f'afit_discount_table_cash_flow_{i}'
            if discount_table_key in one_liner.keys():
                cum_disc_cf = round_w_zero(one_liner[discount_table_key], 3)
            else:
                cum_disc_cf = ''
            afit_pw_list.append([cum_disc_cf])

        one_liner_list = []
        for i in range(len(afit_pw_list)):
            if i in range(len(afit_metrics_list)):
                m_label = bfit_metrics_list[i][0]
                m_value = bfit_metrics_list[i][1]
                row_metric_part_1 = m_label + ' ' * (METRICS_LEN - len(m_label) - len(m_value)) + m_value

                m_label = afit_metrics_list[i][0]
                m_value = afit_metrics_list[i][1]
                row_metric_part_2 = m_label + ' ' * (METRICS_LEN - len(m_label) - len(m_value)) + m_value

            else:
                row_metric_part_1 = ' ' * METRICS_LEN
                row_metric_part_2 = ' ' * METRICS_LEN

            row_pw_part_1 = str_align_right(bfit_pw_list[i][0], PW_PCT_LEN,
                                            ' ') + ' ' * PW_INTERVAL_LEN + str_align_right(
                                                bfit_pw_list[i][1], PW_NUMBER_LEN)

            row_pw_part_2 = str_align_right(afit_pw_list[i][0], AFIT_PW_NUMBER_LEN)

            row = blank_part + one_liner_interval + row_metric_part_1 + one_liner_interval + row_metric_part_2
            row = row + one_liner_interval + row_pw_part_1 + ' ' * PW_INTERVAL_LEN + row_pw_part_2

            one_liner_list.append(row)

        return one_liner_list

    if bfit_report == 'yes':
        general_options = report_info['general_options']
        one_liner = report_info['one_liner']
        report_type = report_info['report_type']

        cash_unit = general_options['reporting_units']['cash']
        discount_table = general_options['discount_table']
        primary_discount = discount_table['first_discount']
        discount_rows = discount_table['rows']

        metrics_list = [
            ['METRICS', ''],
            ['-' * METRICS_LEN, ''],
            ['ECON LIFE, YRS', ''],
            ['PRIMARY DISC %', round_w_zero(primary_discount, 2)],
            ['UNDISC PAYOUT, MOS.', ''],
            ['PRIMARY DISC PAYOUT, MOS.', ''],
            ['UNDISC ROI', ''],
            ['PRIMARY DISC ROI', ''],
            ['IRR %', ''],
        ]

        # get cash flow col
        cf_col_dict = {
            DATE_KEY: monthly_group_df[DATE_KEY].to_numpy('str'),
            'total_capex': monthly_group_df[TOTAL_CAPEX_KEY].to_numpy('float'),
            'undisc_cf': monthly_group_df[UNDISC_CF_KEY].to_numpy('float'),
            'disc_cf': monthly_group_df[DISC_CF_KEY].to_numpy('float'),
        }

        dates = np.array(cf_col_dict[DATE_KEY], dtype='datetime64[D]').astype(datetime.date).tolist()

        if report_type == 'by_well':  # by well one liner metrics
            metrics_list[2][1] = get_one_liner_value(one_liner, 'well_life', 2)
            metrics_list[4][1] = get_one_liner_value(one_liner, 'payout_duration', 2)
            metrics_list[8][1] = get_one_liner_value(one_liner, 'irr', 2)
            metrics_list.append(['INITIAL W.I., PCT.', get_one_liner_value(one_liner, 'original_wi_oil', 2)])
            # discount payout not included in one liner, need to be calculated
            metrics_list[5][1] = cal_payout_duration(cf_col_dict['disc_cf'])
            metrics_list[6][1] = get_one_liner_value(one_liner, 'undiscounted_roi', 2)
            # discounted roi
            metrics_list[7][1] = get_one_liner_value(one_liner, 'first_discount_roi', 2)
        else:  # by group one liner metrics
            metrics_list[2][1] = round_w_zero(len(monthly_group_df[DATE_KEY]) / 12, 2)
            metrics_list[4][1] = cal_payout_duration(cf_col_dict['undisc_cf'])
            metrics_list[8][1] = cal_group_irr(cf_col_dict['undisc_cf'], dates, discount_table)
            disc_date = dates[0]
            metrics_list[5][1] = cal_payout_duration(cf_col_dict['disc_cf'])
            metrics_list[6][1] = cal_net_over_inv(cf_col_dict['undisc_cf'], cf_col_dict['total_capex'])
            # discounted roi
            metrics_list[7][1] = cal_disc_net_over_inv(cf_col_dict['undisc_cf'], cf_col_dict['total_capex'], dates,
                                                       disc_date, discount_table)

        pw_list = [
            ['DISC %', f'DISC CF {cash_unit}'],
            ['-' * PW_PCT_LEN, '-' * (PW_NUMBER_LEN)],
        ]

        for i, d_r in enumerate(discount_rows, start=1):
            disc_rate = round_w_zero(d_r['discount_table'], 2)
            discount_table_key = f'discount_table_cash_flow_{i}'
            if discount_table_key in one_liner.keys():
                cum_disc_cf = round_w_zero(one_liner[discount_table_key], 3)
            else:
                cum_disc_cf = ''
            pw_list.append([disc_rate, cum_disc_cf])

        one_liner_interval = ' ' * ONE_LINER_SEC_INTERVAL
        blank_part = ' ' * (TOTAL_LEN - ONE_LINER_SEC_INTERVAL * 3 - METRICS_LEN - PW_LEN + 2)

        one_liner_list = []
        for i in range(len(pw_list)):
            if i in range(len(metrics_list)):
                m_label = metrics_list[i][0]
                m_value = metrics_list[i][1]
                row_metric_part = m_label + ' ' * (METRICS_LEN - len(m_label) - len(m_value)) + m_value
            else:
                row_metric_part = ' ' * METRICS_LEN

            row_pw_part = str_align_right(pw_list[i][0], PW_PCT_LEN, ' ') + ' ' * PW_INTERVAL_LEN + str_align_right(
                pw_list[i][1], PW_NUMBER_LEN, ' ')

            row = blank_part + one_liner_interval + row_metric_part + one_liner_interval + row_pw_part

            one_liner_list.append(row)

        return one_liner_list


def build_one_report_page(group_df, monthly_group_df, report_info, bfit_report, afit_report, time_zone=None):
    # title part
    title_list = generate_title_section(report_info, bfit_report, afit_report, time_zone)

    ## econ part
    econ_list = generate_econ_section(group_df, report_info, bfit_report, afit_report)

    ## one liner part
    one_liner_list = generate_one_liner_section(monthly_group_df, report_info, bfit_report, afit_report)

    econ_report_list = title_list + econ_list + one_liner_list

    return econ_report_list


def econ_run_data_process(econ_run_datas_list, unique_combo_names):
    econ_run_data_by_combo = {}
    for combo_name in unique_combo_names:
        econ_run_data_by_combo[combo_name] = [d for d in econ_run_datas_list if d['comboName'] == combo_name]

    return econ_run_data_by_combo


def get_group_one_liner(combo_run_datas, combo_one_liner_df, group):
    group_one_liner = {}
    group_list = group.split(', ')

    cat = group_list[0]
    cat_list = []
    sub_cat_list = []
    one_liner_array = np.array([])

    for item in combo_run_datas:
        well_res_cat = item['reservesCategory']
        cat_list.append(well_res_cat['econ_prms_reserves_category'])
        sub_cat_list.append(well_res_cat['econ_prms_reserves_sub_category'])

        well_id_str = str(item['well']['_id'])
        this_incremental_index = item['incrementalIndex']

        this_one_liner_data = combo_one_liner_df[(combo_one_liner_df['well_id'] == well_id_str)
                                                 & (combo_one_liner_df[INC_IDX] == this_incremental_index)].to_dict(
                                                     'records')[0]
        one_liner_array = np.append(one_liner_array, [this_one_liner_data])

    cat_array = np.array(cat_list)
    sub_cat_array = np.array(sub_cat_list)

    if len(group_list) == 1:
        if cat == 'all wells':
            group_one_liner_array = one_liner_array
        elif cat == 'uncategorized':
            group_one_liner_array = one_liner_array[cat_array == '']
        else:
            group_one_liner_array = one_liner_array[cat_array == cat]
    else:
        sub_cat = group_list[1]
        group_one_liner_array = one_liner_array[(cat_array == cat) & (sub_cat_array == sub_cat)]

    # discount_table
    for i in range(1, 17):
        field_key = f'discount_table_cash_flow_{i}'
        group_cum_disc_cf = 0
        for well_one_liner in group_one_liner_array:
            if well_one_liner[field_key]:
                group_cum_disc_cf += well_one_liner[field_key]
        group_one_liner[field_key] = group_cum_disc_cf

    afit_group_one_liner = {}
    group_list = group.split(', ')

    cat = group_list[0]
    cat_list = []
    sub_cat_list = []
    one_liner_array = np.array([])

    for item in combo_run_datas:
        well_res_cat = item['reservesCategory']
        cat_list.append(well_res_cat['econ_prms_reserves_category'])
        sub_cat_list.append(well_res_cat['econ_prms_reserves_sub_category'])

        well_id_str = str(item['well']['_id'])
        this_incremental_index = item['incrementalIndex']

        this_one_liner_data = combo_one_liner_df[(combo_one_liner_df['well_id'] == well_id_str)
                                                 & (combo_one_liner_df[INC_IDX] == this_incremental_index)].to_dict(
                                                     'records')[0]
        one_liner_array = np.append(one_liner_array, [this_one_liner_data])

    cat_array = np.array(cat_list)
    sub_cat_array = np.array(sub_cat_list)

    if len(group_list) == 1:
        if cat == 'all wells':
            group_one_liner_array = one_liner_array
        elif cat == 'uncategorized':
            group_one_liner_array = one_liner_array[cat_array == '']
        else:
            group_one_liner_array = one_liner_array[cat_array == cat]
    else:
        sub_cat = group_list[1]
        group_one_liner_array = one_liner_array[(cat_array == cat) & (sub_cat_array == sub_cat)]

    # discount_table
    for i in range(1, 17):
        field_key = f'afit_discount_table_cash_flow_{i}'
        group_cum_disc_cf = 0
        for well_one_liner in group_one_liner_array:
            if well_one_liner[field_key]:
                group_cum_disc_cf += well_one_liner[field_key]
        afit_group_one_liner[field_key] = group_cum_disc_cf

    return group_one_liner, afit_group_one_liner


def get_group_one_liner_wh_agg(combo_one_liner_df, group):
    group_one_liner = {}
    group_df = combo_one_liner_df if group == 'all wells' else combo_one_liner_df[combo_one_liner_df[AGGREGATION_GROUP]
                                                                                  == group.lower()]
    group_list = group_df.to_dict('records')

    for i in range(1, 17):
        field_key = f'discount_table_cash_flow_{i}'
        group_cum_disc_cf = 0

        for r in group_list:
            group_cum_disc_cf += r[field_key] if r[field_key] is not None else 0

        group_one_liner[field_key] = group_cum_disc_cf

    afit_group_one_liner = {}
    afit_group_df = combo_one_liner_df if group == 'all wells' else combo_one_liner_df[
        combo_one_liner_df[AGGREGATION_GROUP] == group.lower()]
    afit_group_list = afit_group_df.to_dict('records')

    for i in range(1, 17):
        afit_field_key = f'afit_discount_table_cash_flow_{i}'
        afit_group_cum_disc_cf = 0

        for r in afit_group_list:
            afit_group_cum_disc_cf += r[afit_field_key] if r[afit_field_key] is not None else 0

        afit_group_one_liner[afit_field_key] = afit_group_cum_disc_cf

    return group_one_liner, afit_group_one_liner


def build_econ_report(context,
                      econ_run_id,
                      report_type,
                      user_id,
                      file_name,
                      notification_id,
                      bfit_report,
                      afit_report,
                      time_zone=None):
    def notify_progress(progress):
        context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
            '_id': notification_id,
            'progress': progress
        })

    econ_run = context.economic_collection.find_one({'_id': ObjectId(econ_run_id)})

    file_string_data = _build_econ_report(context,
                                          econ_run,
                                          report_type,
                                          bfit_report,
                                          afit_report,
                                          notify_progress=notify_progress,
                                          time_zone=time_zone)

    # upload to storage
    content_type = 'application/pdf'
    file_info = {
        'gcpName': f'{econ_run_id}-econ_report-{report_type}-{datetime.datetime.utcnow().isoformat()}.pdf',
        'name': f'{file_name}.pdf',
        'type': content_type
    }

    context.file_service.upload_file_from_string(
        string_data=file_string_data,
        file_data={
            **file_info, 'user': user_id
        },
        project_id=econ_run['project'],
    )

    notify_progress(99)

    return file_info


def build_econ_report_by_well(context, econ_run_id, well_ids, bfit_report, afit_report, time_zone=None):
    econ_run = context.economic_collection.find_one({'_id': ObjectId(econ_run_id)})
    return _build_econ_report(context, econ_run, 'by_well', bfit_report, afit_report, well_ids, time_zone=time_zone)


def _move_font_to_tmp():
    fonts_folder = 'combocurve/assets/fonts'
    font_files = ['consolab.ttf', 'consolab.pkl']
    for f in font_files:
        dest_file_name = f'/tmp/{f}'
        if os.path.exists(dest_file_name):
            continue
        with open(f'{fonts_folder}/{f}', 'rb') as source:
            with open(dest_file_name, 'wb') as dest:
                dest.write(source.read())


def _init_econ_report_pdf():
    _move_font_to_tmp()
    pdf = FPDF()
    pdf.add_font('econ_pdf_font', '', '/tmp/consolab.ttf', uni=True)
    pdf.set_font('econ_pdf_font', size=PDF_FONT_SIZE)
    pdf.set_left_margin(PDF_MARGIN)
    return pdf


def add_page(pdf, econ_report_list):
    pdf.add_page()
    for i, r in enumerate(econ_report_list, start=1):
        pdf.cell(PDF_W, PDF_H, txt=r, ln=1, align='L')


def afit_disabled_report():
    pdf = _init_econ_report_pdf()
    pdf.add_page()
    pdf.cell(0, 0, 'ERROR: ONLY AFIT REPORT GENERATED BUT INCOME TAX DISABLED IN GENERAL OPTIONS', align='C')
    return pdf.output(dest='S').encode('latin-1')


def _build_econ_report(context,
                       econ_run,
                       report_type,
                       bfit_report,
                       afit_report,
                       well_ids=None,
                       notify_progress=lambda x: None,
                       time_zone=None):  # noqa: C901
    is_income_tax = econ_run['outputParams']['generalOptions']['main_options']['income_tax']
    if afit_report == 'yes' and bfit_report == 'yes' and is_income_tax == 'no':
        afit_report = 'no'
    elif afit_report == 'yes' and is_income_tax == 'no':
        return afit_disabled_report()
    elif bfit_report == 'no' and afit_report == 'no':
        bfit_report = 'yes'

    econ_run_id = econ_run['_id']
    run_date = econ_run['runDate'].strftime('%Y-%m-%d')

    agg_by_res_cat, group_by_cols = get_group_by_cols(econ_run)

    notify_progress(2)

    dataset_id = context.tenant_info['big_query_dataset']

    general_options = econ_run['outputParams']['generalOptions']
    reporting_units = general_options['reporting_units']

    yearly_query = get_yearly_query_str(GCP_PRIMARY_PROJECT_ID,
                                        dataset_id,
                                        econ_run_id,
                                        run_date,
                                        report_type,
                                        reporting_units,
                                        well_ids=well_ids)
    yearly_df = context.google_services.bigquery_client.query(yearly_query).result().to_dataframe()
    add_operating_cash_flow_col(yearly_df)

    notify_progress(4)

    monthly_query = get_monthly_query_str(GCP_PRIMARY_PROJECT_ID, dataset_id, econ_run_id, run_date, report_type,
                                          well_ids)
    monthly_df = context.google_services.bigquery_client.query(monthly_query).result().to_dataframe()

    notify_progress(6)

    if report_type != 'by_well' and not agg_by_res_cat:
        one_liner_query = get_one_liner_query_agg_well_head(
            context,
            econ_run_id,
            run_date,
            group_by_cols,
            well_ids,
        )
    else:
        # TODO: make res cat aggregation on bigquery
        one_liner_query = get_one_liner_query_by_well(context, econ_run_id, run_date, well_ids)

    one_liner_df = context.google_services.bigquery_client.query(one_liner_query).result().to_dataframe()

    notify_progress(8)

    scenario_name = context.scenarios_collection.find_one({'_id': econ_run['scenario']})['name']
    project_id = econ_run['project']
    project_name = context.project_collection.find_one({'_id': project_id})['name']

    report_info = {
        'scenario_name': scenario_name,
        'project_name': project_name,
        'general_options': general_options,
        'report_type': report_type,
        'econ_run_time': econ_run.get('runDate'),
    }

    pdf = _init_econ_report_pdf()

    unique_combo_names = np.unique(yearly_df['combo_name'])

    # query run data (one liner)
    run_datas_list = get_run_data(context, econ_run_id, well_ids)
    run_datas_by_combo = econ_run_data_process(run_datas_list, unique_combo_names)

    notify_progress(10)
    cur_page = 1

    econ_runs_data_map = {}
    if report_type == 'by_well':
        for data in run_datas_list:
            if (str(data['comboName']), str(data['well']['_id'])) not in econ_runs_data_map:
                econ_runs_data_map[(str(data['comboName']), str(data['well']['_id']))] = {}
            econ_runs_data_map[(str(data['comboName']), str(data['well']['_id']))][data['incrementalIndex']] = {
                pair['key']: pair['value']
                for pair in data['oneLinerData'].values()
            } if data.get('error') is None else {}

    for combo_name in unique_combo_names:
        report_info['combo_name'] = combo_name
        combo_df = yearly_df[yearly_df['combo_name'] == combo_name]
        combo_monthly_df = monthly_df[(monthly_df['combo_name'] == combo_name)]
        combo_one_liner_df = one_liner_df[one_liner_df['combo_name'] == combo_name]
        combo_one_liner_df = combo_one_liner_df.where(combo_one_liner_df.notnull(), None)

        if report_type == AGGREGATE:
            unique_groups = np.unique(combo_df[AGGREGATION_GROUP])
            if agg_by_res_cat:
                unique_groups = adjust_reserves_group_order(unique_groups)
            else:
                unique_groups = adjust_well_header_group_order(unique_groups)

            total_pages = len(unique_combo_names) * len(unique_groups)

            for group in unique_groups:
                group_df = combo_df[combo_df[AGGREGATION_GROUP] == group]
                group_df = group_df.where(group_df.notnull(), None)
                group_df = group_df.set_index(YEAR)

                monthly_group_df = combo_monthly_df[(combo_monthly_df[AGGREGATION_GROUP] == group)]

                report_info['group_name'] = group.upper().replace('_', ' ')
                if combo_one_liner_df.empty:
                    group_one_liner = {}
                else:
                    if agg_by_res_cat:
                        group_one_liner, afit_group_one_liner = get_group_one_liner(run_datas_by_combo[combo_name],
                                                                                    combo_one_liner_df, group)
                    else:
                        group_one_liner, afit_group_one_liner = get_group_one_liner_wh_agg(combo_one_liner_df, group)
                report_info['one_liner'] = group_one_liner
                report_info['afit_one_liner'] = afit_group_one_liner

                if (bfit_report == 'yes') and (afit_report == 'yes'):
                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, bfit_report, 'no',
                                                             time_zone)

                    add_page(pdf, econ_report_list)

                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, 'no', afit_report,
                                                             time_zone)

                    add_page(pdf, econ_report_list)

                    if cur_page % 50 == 0:
                        update_progress_by_page(5, 95, cur_page, total_pages, notify_progress)
                    cur_page += 1

                else:
                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, bfit_report,
                                                             afit_report, time_zone)

                    add_page(pdf, econ_report_list)

                    if cur_page % 50 == 0:
                        update_progress_by_page(5, 95, cur_page, total_pages, notify_progress)
                    cur_page += 1

                update_progress_by_page(5, 95, cur_page, total_pages, notify_progress)
                cur_page += 1

        elif report_type == 'by_well':
            # sort well by name
            well_name_with_inc = (combo_one_liner_df['well_name'] + combo_one_liner_df[INC_IDX].astype(str)).tolist()
            well_name_with_inc = ['N/A' if type(x) == float else x for x in well_name_with_inc]
            well_order_list = get_well_order_by_names(well_name_with_inc)
            combo_one_liner_df = combo_one_liner_df.iloc[well_order_list]

            well_id_and_inc_idx = list(zip(combo_one_liner_df.well_id, combo_one_liner_df.incremental_index))

            total_pages = len(unique_combo_names) * len(well_id_and_inc_idx)

            for well_id, inc_idx in well_id_and_inc_idx:
                # group_name = 'Grand Total'
                group_df = combo_df[(combo_df['well_id'] == well_id) & (combo_df[INC_IDX] == inc_idx)]
                group_df = group_df.where(group_df.notnull(), None)
                group_df = group_df.set_index(YEAR)

                monthly_group_df = combo_monthly_df[(combo_monthly_df['well_id'] == well_id)
                                                    & (combo_monthly_df[INC_IDX] == inc_idx)]

                report_info['well_id'] = well_id

                well_one_liner = combo_one_liner_df[(combo_one_liner_df['well_id'] == well_id)
                                                    & (combo_one_liner_df[INC_IDX] == inc_idx)].to_dict('records')[0]

                if well_one_liner['error']:
                    continue

                report_info['one_liner'] = {**well_one_liner, **econ_runs_data_map[(combo_name, well_id)][inc_idx]}
                report_info['api14'] = well_one_liner.get('api14', '')
                report_info['inpt_id'] = well_one_liner.get('inpt_id', '')
                report_info['well_name'] = well_one_liner.get('well_name', '')
                report_info['econ_group'] = well_one_liner.get('econ_group', 'N/A')
                report_info[INC_IDX] = str(well_one_liner.get(INC_IDX, 0))

                if inc_idx > 0:
                    # for incremental calculate price by rev / vol doesn't make sense, zero it out for now
                    for col in SPECIAL_COL_DICT.keys():
                        group_df[col] = 0

                if (bfit_report == 'yes') and (afit_report == 'yes'):
                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, bfit_report, 'no',
                                                             time_zone)

                    add_page(pdf, econ_report_list)

                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, 'no', afit_report,
                                                             time_zone)

                    add_page(pdf, econ_report_list)

                    if cur_page % 50 == 0:
                        update_progress_by_page(5, 95, cur_page, total_pages, notify_progress)
                    cur_page += 1

                else:
                    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, bfit_report,
                                                             afit_report, time_zone)

                    add_page(pdf, econ_report_list)

                    if cur_page % 50 == 0:
                        update_progress_by_page(5, 95, cur_page, total_pages, notify_progress)
                    cur_page += 1

    notify_progress(95)

    return pdf.output(dest='S').encode('latin-1')


def get_monthly_yearly_df(nested_monthly):
    yearly_dict = {}
    monthly_dict = {}

    for column in nested_monthly:
        col_key = column['key']
        if col_key in MONTHLY_COLS:
            years = column['years']
            if col_key == DATE_KEY:
                yearly_dict[YEAR] = [y[YEAR] for y in years]
            else:
                yearly_dict[col_key] = [y['total'] for y in years]
        if col_key in [DATE_KEY, TOTAL_CAPEX_KEY, UNDISC_CF_KEY, DISC_CF_KEY]:
            years = column['years']
            monthly_dict[col_key] = list(itertools.chain(*[y['months'] for y in years]))

    yearly_df = pd.DataFrame(yearly_dict).set_index(YEAR)
    yearly_df[GROSS_WELL_COUNT_KEY] = 1
    add_operating_cash_flow_col(yearly_df)

    monthly_df = pd.DataFrame(monthly_dict)

    return yearly_df, monthly_df


def one_well_report(context, report_info, monthly, one_liner, file_name, gcp_name, user_id, project_id, time_zone=None):
    pdf = _init_econ_report_pdf()

    report_info['one_liner'] = {key: one_liner[key]['value'] for key in one_liner}

    pdf_string = b''

    group_df, monthly_group_df = get_monthly_yearly_df(monthly)

    econ_report_list = build_one_report_page(group_df, monthly_group_df, report_info, 'yes', 'no', time_zone)

    pdf.add_page()
    for i, r in enumerate(econ_report_list, start=1):
        pdf.cell(PDF_W, PDF_H, txt=r, ln=1, align='L')

    pdf_string = pdf.output(dest='S').encode('latin-1')

    content_type = 'application/pdf'

    file_info = {'gcpName': gcp_name, 'name': f'{file_name}.pdf', 'type': content_type, 'user': user_id}

    context.file_service.upload_file_from_string(string_data=pdf_string, file_data=file_info, project_id=project_id)

    return file_info


def build_single_well_econ_report(context,
                                  monthly,
                                  one_liner,
                                  user_id,
                                  well_id,
                                  scenario_id,
                                  project_id,
                                  file_name,
                                  time_zone=None,
                                  general_options_id=None):
    scenario = context.scenarios_collection.find_one({'_id': ObjectId(scenario_id)})

    scenario_name = scenario['name']
    project_name = context.project_collection.find_one({'_id': ObjectId(project_id)})['name']
    well_info = context.well_service.get_well(ObjectId(well_id))

    general_options_oid = ObjectId(general_options_id or scenario.get('general_options'))

    if general_options_oid:
        general_options = context.assumptions_collection.find_one({'_id': general_options_oid})['econ_function']
    else:
        raise EconPdfError('Missing General Options')

    report_info = {
        'scenario_name': scenario_name,
        'project_name': project_name,
        'combo_name': 'Default',
        'report_type': 'by_well',
        'inpt_id': well_info.get('inptID', ''),
        'api14': well_info.get('api14', ''),
        'well_name': well_info.get('well_name', ''),
        'general_options': general_options,
        'one_liner': {key: one_liner[key]['value']
                      for key in one_liner},
    }

    gcp_name = f'{user_id}-{well_id}-single-well-econ_report-{datetime.datetime.utcnow().isoformat()}.pdf'

    file_info = one_well_report(context, report_info, monthly, one_liner, file_name, gcp_name, user_id, project_id, time_zone)

    return file_info


def build_tc_econ_report(context, monthly, one_liner, type_curve_id, file_name, user_id, time_zone=None):
    type_curve = context.type_curves_collection.find_one({'_id': ObjectId(type_curve_id)})
    project_id = type_curve['project']
    project_name = context.project_collection.find_one({'_id': ObjectId(project_id)})['name']

    general_options_id = type_curve['assumptions'].get('general_options')
    if general_options_id:
        general_options = context.assumptions_collection.find_one({'_id':
                                                                   ObjectId(general_options_id)})['econ_function']
    else:
        raise EconPdfError('Missing General Options')

    report_info = {
        'project_name': project_name,
        'report_type': 'by_well',
        'well_name': type_curve['name'],
        'general_options': general_options,
        'one_liner': {key: one_liner[key]['value']
                      for key in one_liner},
    }

    type_curve_id = type_curve['_id']
    gcp_name = f'{user_id}-{type_curve_id}-type-curve-econ_report-{datetime.datetime.utcnow().isoformat()}.pdf'

    file_info = one_well_report(context, report_info, monthly, one_liner, file_name, gcp_name, user_id, project_id, time_zone)

    return file_info
