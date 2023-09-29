import pandas as pd
import numpy as np

from combocurve.utils.constants import DAYS_IN_YEAR

BASE_PHASE = 'Base Phase'
D_ECL_MAX = 0.9999

phdwin_flow_rate_unit_dict = {
    'scf': 0.001,
    'mcf': 1,
    'mmcf': 1000,
    'bcf': 1000000,
    'tcf': 1000000000,
    'bbl': 1,
    'mbbl': 1000,
    'mmbbl': 1000000,
    'bbbl': 1000000000
}

phdwin_ratio_dict = {'GOR': ('gas', 'oil'), 'Yield': ('oil', 'gas'), 'WOR': ('water', 'oil'), 'WGR': ('water', 'gas')}

phdwin_to_cc_column_name_dict = {
    'Case': 'Well Name',
    'UniqueId': 'Chosen ID',
    'Product': 'Phase',
    'ProjType': 'Segment Type',
    'Segment': 'Segment',
    'StartDate': 'Start Date',
    'EndDate': 'End Date',
    'Qi': 'q Start',
    'Qf': 'q End',
    'NFactor': 'b',
    'Decl': 'Di Eff-Sec',
    'DeclMin': 'Realized D Sw-Eff-Sec',
}


def validate_unit(unit):
    if unit in phdwin_flow_rate_unit_dict:
        return unit
    elif '/' in unit:
        if len(unit.split('/')) == 2:
            if unit.split('/')[0] in phdwin_flow_rate_unit_dict and unit.split('/')[1] in phdwin_flow_rate_unit_dict:
                return unit


def flow_rate_unit_conversion(row):
    unit = row.Units
    unit = str(unit).lower()
    unit = validate_unit(unit)
    if unit is not None:
        if '/' in unit:
            row.Qi = row.Qi * phdwin_flow_rate_unit_dict.get(
                unit.split('/')[0]) * (1 / phdwin_flow_rate_unit_dict.get(unit.split('/')[1]))
            row.Qf = row.Qf * phdwin_flow_rate_unit_dict.get(
                unit.split('/')[0]) * (1 / phdwin_flow_rate_unit_dict.get(unit.split('/')[1]))

        else:
            row.Qi = row.Qi * phdwin_flow_rate_unit_dict.get(unit)
            row.Qf = row.Qf * phdwin_flow_rate_unit_dict.get(unit)
        return row
    return row


def format_phdwin_to_cc_forecast(row):
    try:
        float(row.UniqueId)
        row.UniqueId = str(row.UniqueId).split('.')[0]
    except (ValueError, TypeError):
        row.UniqueId = str(row.UniqueId)

    try:
        row.Qi = float(row.Qi)
        row.Qf = float(row.Qf)
    except (ValueError, TypeError):
        row.Qi = np.nan
        row.Qf = np.nan

    q_invalid = np.isnan(row.Qi) or np.isnan(row.Qf)

    if not q_invalid:
        row = get_phdwin_segment_type(row)
        row = flow_rate_unit_conversion(row)
    else:
        row.ProjType = np.nan

    process_decl(row)

    try:
        if row.ProjType == 'arps_modified':
            value = 1 - float(row.NFactor) * np.log(1 - float(row.DeclMin) / 100)
            row.DeclMin = round(1 - np.power(value, (-1 / float(row.NFactor))), 4)

            row.DeclMin *= 100  # to make it percentage
        else:
            row.DeclMin = np.nan
    except (ValueError, TypeError):
        row.DeclMin = np.nan

    row = update_type_series_by_product(row)

    row = update_rate_if_valid(row, q_invalid)

    row = check_d_switch_value(row)

    return row


def process_decl(row):
    try:
        if (row.ProjType in ['exp_dec', 'exp_inc']) or (float(row.NFactor) == 0
                                                        and row.ProjType in ['arps_modified', 'arps', 'arps_inc']):
            row.Decl = round((float(row.Decl) / 100), 4)
            if float(row.NFactor) == 0:
                row.ProjType = 'exp_dec' if row.Decl >= 0 else 'exp_inc'
        elif row.ProjType in ['arps_modified', 'arps', 'arps_inc']:
            value = 1 - float(row.NFactor) * np.log(1 - float(row.Decl) / 100)
            if value < 0:
                row.Decl = -round(1 - np.power(abs(value), (-1 / float(row.NFactor))), 4)
            else:
                row.Decl = round(1 - np.power(value, (-1 / float(row.NFactor))), 4)
        elif row.ProjType == 'linear':
            row.Decl = get_linear_deff_phdwin_forecast(row)

        if row.Decl == 1:
            row.Decl = D_ECL_MAX

        row.Decl *= 100  # to make it percentage

    except (ValueError, TypeError):
        row.Decl = np.nan


def update_rate_if_valid(row, invalid):
    if row.Type == 'rate' and not invalid:
        row.Qi = row.Qi * (12 / DAYS_IN_YEAR)
        row.Qf = row.Qf * (12 / DAYS_IN_YEAR)
    return row


def check_d_switch_value(row):
    if row.ProjType == 'arps_modified' and (not np.isnan(row.Decl) and not np.isnan(row.DeclMin)):
        if row.DeclMin > row.Decl:
            row.DeclMin = row.Decl
    return row


def update_type_series_by_product(row):
    if row.Product in phdwin_ratio_dict:
        row[BASE_PHASE] = phdwin_ratio_dict.get(row.Product)[1]
        row.Product = phdwin_ratio_dict.get(row.Product)[0]
        row.Type = 'ratio'
        row.Series = 'best'
    elif type(row.Product) == str and row.Product.lower() in ['oil', 'gas', 'water']:
        row.Product = str(row.Product).lower()
        row.Type = 'rate'
        row.Series = 'best'
    else:
        row.Product = np.nan
        row.Type = np.nan
        row.Series = np.nan

    return row


def get_linear_deff_phdwin_forecast(row):
    k = (row.Qf - row.Qi) / (pd.to_datetime(row.EndDate) - pd.to_datetime(row.StartDate)).days

    return (-DAYS_IN_YEAR / row.Qi) * k


def get_phdwin_segment_type(row):
    if row.Qi == row.Qf:
        row.ProjType = 'flat'
    elif row.ProjType == 'LinTime':
        row.ProjType = 'linear'
    elif row.ProjType == 'LinCum':
        pass
    elif row.NFactor == 0 and (row.Qi > row.Qf):
        row.ProjType = 'exp_dec'
    elif (row.Qi < row.Qf) and row.NFactor == 0:
        row.ProjType = 'exp_inc'
    elif (row.Qi < row.Qf):
        row.ProjType = 'arps_inc'
    elif row.DeclMin == 0:
        row.ProjType = 'arps'
    else:
        row.ProjType = 'arps_modified'
    return row


def convert_phdwin_forecast_to_cc(df, chosen_inpt_id_dict):
    df['Type'] = np.nan
    df[BASE_PHASE] = np.nan
    df['Series'] = np.nan

    # pandas uses apply twice when there is just one line in df (Pandas bug)
    if df.shape[0] == 1:
        for index, row in df.iterrows():
            df.iloc[index, :] = format_phdwin_to_cc_forecast(row)
    else:
        df = df.apply(lambda x: format_phdwin_to_cc_forecast(x), axis=1)
    df = df.rename(columns=phdwin_to_cc_column_name_dict)
    df = df[~df.Series.isna()]
    df['INPT ID'] = df['Chosen ID'].apply(lambda x: chosen_inpt_id_dict[x] if x in chosen_inpt_id_dict else x)

    return df
