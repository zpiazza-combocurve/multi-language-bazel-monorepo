import numpy as np
import pandas as pd

from combocurve.science.econ.econ_calculations.discount import (get_num_period, get_cum_days, irr, npv)

MAX_IRR = 1E12
NA_STR = 'N/A'


def round_w_zero(num, decimals=0):
    return format(num, f',.{decimals}f')


def blank_line(line_len):
    return ' ' * line_len


def add_col_interval(row_str, interval_len):
    return row_str + ' ' * interval_len


def str_align_center(input_str, total_len, rest_char=' '):
    if len(input_str) > total_len:
        input_str = input_str[:total_len]

    return input_str.center(total_len, rest_char)


def str_align_right(input_str, total_len, rest_char=' '):
    if len(input_str) > total_len:
        input_str = input_str[:total_len]

    return input_str.rjust(total_len, rest_char)


def str_align_left(input_str, total_len, rest_char=' '):
    if len(input_str) > total_len:
        input_str = input_str[:total_len]

    return input_str.ljust(total_len, rest_char)


def get_aries_date(cc_date_str):
    if '/' in cc_date_str:
        return cc_date_str

    cc_date_str_list = cc_date_str.split('-')
    return cc_date_str_list[1] + '/' + cc_date_str_list[2] + '/' + cc_date_str_list[0]


def datetime_to_str(input_datetime):
    if type(input_datetime) == str and '/' in input_datetime:
        return input_datetime
    return input_datetime.strftime('%m/%d/%Y')


def cal_payout_duration(cf):
    payout_index = np.cumsum(cf) > 0
    if np.sum(payout_index) > 0:
        payout_duration = round_w_zero(np.argmax(payout_index) + 1, 2)
    else:
        payout_duration = NA_STR

    return payout_duration


def cal_net_over_inv(net_cf, inv_cf):
    cum_net = sum(net_cf)
    cum_inv = sum(inv_cf)

    if cum_inv == 0:
        return NA_STR
    else:
        return round_w_zero(cum_net / cum_inv + 1, 2)


def cal_disc_net_over_inv(net_cf, inv_cf, dates, disc_date, discount_table):
    disc_rate = discount_table['first_discount'] / 100
    cash_accrual_time = discount_table['cash_accrual_time']
    disc_method = discount_table['discount_method']

    op_cf = net_cf + inv_cf

    num_period = get_num_period(disc_method)
    discount_index, discount_cum_days = get_cum_days(dates, disc_date, cash_accrual_time)

    cum_disc_op_cf = npv(disc_rate, op_cf, num_period, discount_index, discount_cum_days)
    cum_disc_inv_cf = npv(disc_rate, inv_cf, num_period, discount_index, discount_cum_days)

    if cum_disc_inv_cf == 0:
        disc_net_over_inv = NA_STR
    else:
        disc_net_over_inv = round_w_zero(cum_disc_op_cf / cum_disc_inv_cf, 2)

    return disc_net_over_inv


def cal_group_irr(cf, dates, discount_table):
    cash_accrual_time = discount_table['cash_accrual_time']
    disc_method = discount_table['discount_method']
    disc_date = dates[0]

    num_period = get_num_period(disc_method)
    discount_index, discount_cum_days = get_cum_days(dates, disc_date, cash_accrual_time)

    irr_yearly = irr(cf, num_period, discount_index, discount_cum_days)

    if irr_yearly:
        return round_w_zero(irr_yearly * 100, 2)
    else:
        return NA_STR


def adjust_reserves_group_order(group_list):
    '''
    sort groups based on res cat model
    '''
    cat_list = ['proved', 'probable', 'possible', 'c1', 'c2', 'c3']
    sub_cat_list = [
        'producing',
        'non_producing',
        'shut_in',
        'temp_aband',
        'p&a',
        'behind_pipe',
        'injection',
        'undeveloped',
        'need_workover',
    ]
    complete_group_list = ['all wells']
    for c in cat_list:
        complete_group_list.append(c)
        for s_c in sub_cat_list:
            complete_group_list.append(f'{c}, {s_c}')
    complete_group_list.append('uncategorized')

    sorted_group_list = []
    for g in complete_group_list:
        if g in group_list:
            sorted_group_list.append(g)

    return sorted_group_list


def adjust_well_header_group_order(unique_groups):
    '''
    sort groups based on alphabet order
    '''
    sorted_groups = ['all wells'] + sorted([i for i in unique_groups if i != 'all wells'])

    return sorted_groups


def get_one_liner_value(one_liner_dict, field_key, decimals=0):
    if field_key in one_liner_dict:
        field_value = one_liner_dict[field_key]
        if pd.isnull(field_value):
            return NA_STR
        elif type(field_value) == str:
            return field_value
        else:
            return round_w_zero(field_value, decimals)
    else:
        return NA_STR


def update_progress_by_page(start_prog, end_prog, cur_page, total_pages, notify_progress):
    prog = start_prog + round((end_prog - start_prog) * cur_page / total_pages)
    notify_progress(prog)


def add_operating_cash_flow_col(df):
    df['operating_cash_flow'] = (df['total_revenue'] - df['total_expense'] - df['total_severance_tax']
                                 - df['ad_valorem_tax'] + df['net_profit'])
