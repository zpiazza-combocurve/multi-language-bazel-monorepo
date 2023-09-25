import polars as pl
import numpy as np
from datetime import date

from combocurve.science.econ.general_functions import get_py_date
from combocurve.services.econ.econ_aggregation import group_numeric_cols

COMBO_NAME = 'combo_name'
ECON_GROUP = 'econ_group'
GROUP_KEY = 'group'
GROSS_CALCULATION = '100_pct_wi'


def filter_group_df(pl_df, combo_name, econ_group):
    return pl_df.filter((pl_df[COMBO_NAME] == combo_name) & (pl_df[ECON_GROUP] == econ_group))


def cut_group_df(group_df, min_date=None, max_date=None):
    new_df = group_df
    date_array = np.array(group_df['date'].str.strptime(pl.Date, fmt='%Y-%m-%d'), dtype=date)
    if min_date:
        new_df = new_df.filter(date_array >= min_date)
        date_array = np.array(new_df['date'].str.strptime(pl.Date, fmt='%Y-%m-%d'), dtype=date)

    if max_date:
        new_df = new_df.filter(date_array <= max_date)
    return new_df


def great_empty_df(group_df, date_array):
    base_row = group_df[0]
    for c in group_df.columns:
        if c in group_numeric_cols:
            base_row[0, c] = 0

    extend_df = base_row[[0] * len(date_array)]
    extend_df = extend_df.with_column(pl.Series(name="date", values=date_array))

    return extend_df


def extend_group_df(group_df, start_date=None, end_date=None):
    '''
    extend group_df to start from start_date
    '''
    if start_date:
        group_df_start_date = get_py_date(group_df['date'][0])
        start_date_m = np.datetime64(start_date, 'M')
        df_start_date_m = np.datetime64(group_df_start_date, 'M')

        if start_date_m < df_start_date_m:
            date_array = (np.arange(
                (df_start_date_m - start_date_m).astype(int)) + start_date_m).astype('datetime64[D]').astype('str')
            extend_df = great_empty_df(group_df, date_array)
            # append before group_df
            group_df = extend_df.vstack(group_df)

    if end_date:
        group_df_end_date = get_py_date(group_df['date'][-1])
        end_date_m = np.datetime64(end_date, 'M')
        df_end_date_m = np.datetime64(group_df_end_date, 'M')

        if end_date_m > df_end_date_m:
            date_array = (np.arange(
                (end_date_m - df_end_date_m).astype(int)) + df_end_date_m + 1).astype('datetime64[D]').astype('str')
            extend_df = great_empty_df(group_df, date_array)
            # append after group_df
            group_df = group_df.vstack(extend_df)

    return group_df
