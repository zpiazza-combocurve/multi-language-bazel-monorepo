import numpy as np
import pandas as pd

from api.aries_phdwin_imports.helpers import format_well_header_col, monthly_phd_well_format
from combocurve.shared.phdwin_import_constants import PhdHeaderCols, monthly_import_header_format

MAX_DAYS_HANDLED = np.datetime64('2262-04-11') - np.datetime64('1800-12-28')


def get_phdwin_well_daily_data_import(df, act_df, idc_df, lease_id_to_eop_dic, lease_id_to_sop_dic):
    df, daily_start_date_dict, daily_end_date_dict = process_phdwin_daily_data(df, act_df, idc_df)

    if df is None:
        df = pd.DataFrame([], columns=DAILY_PROD_COLUMNS)
        df.rename(columns=LSE_CONV_DICT, inplace=True)
        df.columns = format_well_header_col(df.columns, make_upper_case=True)
        df.columns = [str(column).lower() for column in df.columns]
        return df, {}, {}
    else:
        df = df.filter(items=DAILY_PROD_COLUMNS + ['np_date'])
        df = remove_date_after_eop_before_sop(df, lease_id_to_eop_dic, lease_id_to_sop_dic)
        df.columns = format_well_header_col(df.columns)
        df.sort_values(by=['lse_id', 'date'], inplace=True, ignore_index=True)
        df.rename(columns=LSE_CONV_DICT, inplace=True)
        df.columns = format_well_header_col(df.columns)
        df['date'] = df['np_date'].astype(str)
        del df['np_date']
        df = df[df['date'].notna()]
        return df, daily_start_date_dict, daily_end_date_dict


def get_phdwin_well_monthly_data_import(df, act_df, idc_df):
    df = process_phdwin_monthly_data(df, act_df, idc_df)

    if df is None:
        df = pd.DataFrame([], columns=monthly_import_header_format)
        well_count_df = pd.DataFrame([], columns=['lse_id', 'date', 'count'])
        df.rename(columns=LSE_CONV_DICT, inplace=True)
        df.column = format_well_header_col(df.columns)
        return df, well_count_df, {}, {}
    else:
        df.columns = format_well_header_col(df.columns)
        df, well_count_df, monthly_start_date_dict, monthly_end_date_dict = monthly_phd_well_format(df)
        well_count_df = well_count_df[well_count_df['count'] != 0]
        well_count_df.sort_values(by=['lse_id', 'date'], ignore_index=True, inplace=True)
        well_count_df.reset_index(drop=True, inplace=True)
        df.rename(columns=LSE_CONV_DICT, inplace=True)
        df.columns = format_well_header_col(df.columns)
        df = df[df['date'].notna()]
        return df, well_count_df, monthly_start_date_dict, monthly_end_date_dict


def process_phdwin_daily_data(df, act_df, idc_df):
    if df.empty:
        return None, {}, {}

    df = remove_rows_by_exclsum(df, act_df)

    # sum up different zone that every well will only have 1 zone production data
    df = df.groupby(['Lse Id', 'Tdate'], as_index=False).sum(numeric_only=True)

    if df.empty:
        return None, {}, {}

    # add phdwin id column
    df = add_phdwin_id_column(df, idc_df)

    df['np_date'] = pd.to_numeric(df['Tdate'], errors='coerce').replace(np.nan, 0).astype(int)
    df = df[df['np_date'] < MAX_DAYS_HANDLED]
    df['np_date'] = (df['np_date'].values + np.datetime64('1800-12-28'))
    df['Tdate'] = pd.to_datetime(df['np_date'])
    # extract the needed feature from raw file
    df = df.filter(items=REQUIRED_PHD_DAILY_COLUMNS + ['np_date'])

    # rename columns to CC equivalent
    df.rename(columns=PHD_CC_MONTHLY_RENAME_DICT, inplace=True)

    # add lease name to dataframe
    df = add_lse_name_to_column(df, act_df)

    # set hours on to None and shut in Casing Pressure (available column in CC)
    df['Hours_on'] = np.nan
    df['shut_in_csg_pressure'] = np.nan

    # get year, month, day
    df['Year'] = df['Tdate'].dt.year
    df['Month'] = df['Tdate'].dt.month
    df['Day'] = df['Tdate'].dt.day

    # format date column to y-m-d format
    df['Date'] = df['Tdate']

    daily_prod_start_dict, daily_prod_end_dict = get_start_end_daily_prod(df)

    return df, daily_prod_start_dict, daily_prod_end_dict


def get_start_end_daily_prod(df):
    daily_prod_start_dict, daily_prod_end_dict = {}, {}
    lse_ids = df['Lse Id'].unique()
    for lse_id in lse_ids:
        try:
            selected_df = df[df['Lse Id'] == lse_id]
            if not pd.isnull(selected_df.Date.min()):
                daily_prod_start_dict[str(lse_id)] = selected_df.Date.min().strftime('%Y-%m-%d')
            if not pd.isnull(selected_df.Date.max()):
                daily_prod_end_dict[str(lse_id)] = selected_df.Date.max().strftime('%Y-%m-%d')
        except Exception:
            pass
    return daily_prod_start_dict, daily_prod_end_dict


def process_phdwin_monthly_data(df, act_df, idc_df):
    if df.empty:
        return None

    # add exclsum column, remove all items with Exclsum field != 0
    df = remove_rows_by_exclsum(df, act_df)

    if df.empty:
        return None

    # filter out rows with Year == 0
    df = df.loc[(df['Year'] != 0)]
    # only import type == 0
    df = df.loc[(df['Type'] == 0)]

    # add phdwin id
    df = add_phdwin_id_column(df, idc_df)

    # extract the needed feature from raw file
    df = df.filter(items=get_required_phdwin_monthly_tables())

    # rename the feature to clear name
    df.rename(columns=get_monthly_table_renaming_dict(), inplace=True)

    # add lease name tp dataframe
    df = add_lse_name_to_column(df, act_df)

    # reorder the columns, set the 'Lse Name' followed the 'Lse Id'
    order = df.columns.tolist()
    order = order[0:1] + order[-1:] + order[1:-1]
    df = df[order]

    return df


def get_required_phdwin_monthly_tables():
    initial_monthly_columns = ['phdwin_id', 'Lse Id', 'Year', 'Prod1td', 'Prod2td', 'Prod3td']

    phdwin_prod_cols = []
    for i in range(1, 5):
        for j in range(12):
            phdwin_prod_cols.append(f'Prod{i}[{j}]')

    return initial_monthly_columns + phdwin_prod_cols


def get_monthly_table_renaming_dict():
    rename_dict = {'Prod1td': 'gastd', 'Prod2td': 'oiltd', 'Prod3td': 'watertd'}
    for i, phase in enumerate(MONTHLY_PHASES):
        for j, month in enumerate(MONTHS):
            rename_dict[f'Prod{i+1}[{j}]'] = f'{phase}{month}'

    return rename_dict


def remove_rows_by_exclsum(df, act_df):
    # add exclsum column, remove all items with Exclsum field != 0
    lease_id_to_exclsum_dic = pd.Series(act_df['Exclsum'].values, index=act_df['Lse Id']).to_dict()
    df['Exclsum'] = df['Lse Id'].map(lease_id_to_exclsum_dic)
    df = df.loc[(df['Exclsum'] == 0)]
    del df['Exclsum']

    return df


def add_phdwin_id_column(df, idc_df):
    idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
    idc_df['Idval'] = idc_df['Idval'].astype(str).str.strip()
    lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
    df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

    return df


def add_lse_name_to_column(df, act_df):
    act_df['Lse Name'] = act_df['Lse Name'].astype(str).str.strip()
    lseid_name_dict = pd.Series(act_df['Lse Name'].values, index=act_df['Lse Id']).to_dict()
    df["Lse Name"] = df["Lse Id"].map(lseid_name_dict)

    return df


def remove_date_after_eop_before_sop(df, lease_id_to_eop_dic, lease_id_to_sop_dic):
    df['SOP'] = df['Lse Id'].map(lease_id_to_sop_dic)
    df['EOP'] = df['Lse Id'].map(lease_id_to_eop_dic)
    df['SOP'] = pd.to_datetime(df['SOP'])
    df['EOP'] = pd.to_datetime(df['EOP'])
    df = df[((df['Date'] >= df['SOP']) & (df['Date'] <= df['EOP']))]
    del df['SOP']
    del df['EOP']

    return df


MONTHLY_PHASES = ['gas', 'oil', 'water', 'wellcount']
MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
    'December'
]
REQUIRED_PHD_DAILY_COLUMNS = [
    'phdwin_id', 'Lse Id', 'Type', 'Tdate', 'Bblday', 'Mcfday', 'Watday', 'Chokesize', 'Ftp', 'Csgpres', 'Bhpz', 'Sitp',
    'Sibhp'
]

PHD_CC_MONTHLY_RENAME_DICT = {
    'Bblday': 'Oil',
    'Mcfday': 'Gas',
    'Watday': 'Water',
    'Chokesize': 'Choke',
    'Ftp': 'flowing_tbg_pressure',
    'Csgpres': 'flowing_csg_pressure',
    'Bhpz': 'flowing_bh_pressure',
    'Sitp': 'shut_in_tbg_pressure',
    'Sibhp': 'shut_in_bh_pressure'
}

LSE_CONV_DICT = {'lse_name': 'lease_name', 'lse_id': 'lease_number'}

DAILY_PROD_COLUMNS = [
    PhdHeaderCols.phdwin_id.value, PhdHeaderCols.lse_id.value, PhdHeaderCols.lse_name.value, PhdHeaderCols.date.value,
    PhdHeaderCols.year.value, PhdHeaderCols.month.value, PhdHeaderCols.day.value, PhdHeaderCols.hours_on.value,
    PhdHeaderCols.oil.value, PhdHeaderCols.gas.value, PhdHeaderCols.water.value, PhdHeaderCols.choke.value,
    PhdHeaderCols.ftp.value, PhdHeaderCols.fcp.value, PhdHeaderCols.fbhp.value, PhdHeaderCols.sitp.value,
    PhdHeaderCols.sibhp.value, PhdHeaderCols.sicp.value
]

SOP_EOP_CONV_DICT = {
    'Sop': 'First Prod Date',
    'Eop': 'End Prod Date',
}
