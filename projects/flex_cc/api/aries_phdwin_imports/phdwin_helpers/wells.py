import numpy as np
import pandas as pd
from bson.objectid import ObjectId
from combocurve.shared.helpers import gen_inpt_id
from api.aries_phdwin_imports.helpers import format_well_header_col
from api.aries_phdwin_imports.phdwin_helpers.general import convert_well_headers_date
from api.aries_phdwin_imports.phdwin_helpers.prod_data import (get_phdwin_well_daily_data_import,
                                                               get_phdwin_well_monthly_data_import)


def get_well_and_prod_date(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df, dat_df, tst_df, context, user_id,
                           socket_name):
    (well_df, lease_id_to_eop_dic,
     lease_id_to_sop_dic) = get_phdwin_well_header_import(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df)
    context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {'progress': 70})
    daily_df, daily_start_date_dict, daily_end_date_dict = get_phdwin_well_daily_data_import(
        tst_df, act_df, idc_df, lease_id_to_eop_dic, lease_id_to_sop_dic)
    context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {'progress': 80})
    monthly_df, well_count_df, monthly_start_date_dict, monthly_end_date_dict = get_phdwin_well_monthly_data_import(
        dat_df, act_df, idc_df)
    context.pusher.trigger_user_channel(context.subdomain, user_id, socket_name, {'progress': 90})
    return (well_df, daily_df, monthly_df, well_count_df, daily_start_date_dict, daily_end_date_dict,
            monthly_start_date_dict, monthly_end_date_dict)


def get_phdwin_well_header_import(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df):
    props = process_phdwin_well_header_tables(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df)
    df = props[0]
    lease_id_to_eop_dic, lease_id_to_sop_dic = props[3:5]
    df.columns = format_well_header_col(df.columns)

    df.rename(columns=CC_PHDWIN_TABLE_NAME, inplace=True)

    df['first_prod_date'] = df.apply(lambda x: convert_well_headers_date(x['first_prod_date']), axis=1)

    df['chosenID'] = df['phdwin_id']
    df['phdwin_id'] = df['lease_number']

    return df, lease_id_to_eop_dic, lease_id_to_sop_dic


def process_phdwin_well_header_tables(act_df, idc_df, pnf_df, zon_df, vol_df, cla_df, cat_df):
    df = act_df

    sop_act_df = act_df.loc[act_df['Sop'] != 0]
    eop_act_df = act_df.loc[act_df['Eop'] != 0]
    sop_act_dict = {sop_act_df.loc[i, 'Lse Id']: sop_act_df.loc[i, 'Sop'] for i in sop_act_df.index}
    eop_act_dict = {eop_act_df.loc[i, 'Lse Id']: eop_act_df.loc[i, 'Eop'] for i in eop_act_df.index}

    # filter out wells Exclcash is 0
    df = df.loc[(df['Exclsum'] == 0)]

    # prepare well senario assignment forecast dict
    lse_id_to_curarcseq_dic = create_lseid_to_curarcseq_dic(df)

    # update well header data with PHDWIN ID and API 14 gotten from IDC dataframe
    df = update_phdwin_id_and_api_14(df, idc_df)

    # filter well header columns
    df = df.filter(items=REQUIRED_PHDWIN_WELL_HEADERS)

    # rename the well header columns
    df.rename(columns=PHDWIN_CC_WH_MAPPING_DICT, inplace=True)

    # update well header data with Primary Product gotten from PNF dataframe
    df, major_phase_dict = update_primary_product_on_well_header(df, pnf_df)

    # update the well header info for date columns
    df = process_phdwin_well_header_date_columns(df)

    # create self.lease_id_to_eop_dic and self.lease_id_to_sop_dic
    lease_id_to_eop_dic, lease_id_to_sop_dic = get_lease_id_to_start_end_prod_date(df)

    # update well header data with zone date(thickness, upper perforation etc. ) from ZON and VOL dataframe
    df = update_well_header_info_with_zone_info(df, zon_df, vol_df)

    # update well header data with reserve information from CLA and CAT dataframe
    df, reserve_class = update_well_header_with_reserve_info(df, cla_df, cat_df)

    return (df, lse_id_to_curarcseq_dic, major_phase_dict, lease_id_to_eop_dic, lease_id_to_sop_dic, reserve_class,
            sop_act_dict, eop_act_dict)


def delete_created_phdwin_wells(db, wells_dic):
    query = {'_id': {'$in': [ObjectId(id) for id in wells_dic]}}
    db['wells'].delete_many(query)


def create_lseid_to_curarcseq_dic(df):
    return pd.Series(df['Curarcseq'].values, index=df['Lse Id']).to_dict()


def update_phdwin_id_and_api_14(df, idc_df):
    idc_api_df = idc_df.loc[((idc_df['Lblnum'] == 2) | (idc_df['Lblnum'] == 8))]
    idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]

    idc_api_df['Idval'] = idc_api_df['Idval'].apply(lambda x: x.strip())
    idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
    lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
    lseid_idval_api_dict = pd.Series(idc_api_df['Idval'].values, index=idc_api_df['Lse Id']).to_dict()
    df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)
    df["api14"] = df["Lse Id"].map(lseid_idval_api_dict)

    return df


def update_primary_product_on_well_header(df, pnf_df):
    productcode_descr_dict = pd.Series(pnf_df['Descr'].values, index=pnf_df['Productcode']).to_dict()

    df["Primary Product"] = df["Primary Product"].map(productcode_descr_dict)

    return df, pd.Series(df['Primary Product'].values, index=df['Lse Id']).to_dict()


def get_lease_id_to_start_end_prod_date(df):
    eop_df = df[df['End Prod Year'] != 0]
    sop_df = df[df['First Prod Year'] != 0]
    return (pd.Series(eop_df['End Prod Date'].values, index=eop_df['Lse Id']).to_dict(),
            pd.Series(sop_df['First Prod Date'].values, index=sop_df['Lse Id']).to_dict())


def process_phdwin_well_header_date_columns(df):
    for ref in ['First Prod', 'End Prod']:
        date_ref = f'{ref} Date'
        df[date_ref] = pd.to_numeric(df[date_ref], errors='coerce').replace(np.nan, 0).astype(int)
        df[date_ref] = (df[date_ref].values + np.datetime64('1800-12-28'))
        # set row where Date > 2262-04-11,
        # then give date = 2262-04-11 as the max date python can handle
        df.loc[df[date_ref] >= np.datetime64('2262-04-11'), [date_ref]] = np.datetime64('2262-04-11')

        for idx, date_comp in enumerate(['Year', 'Month', 'Day']):
            df[f'{ref} {date_comp}'] = df[date_ref].astype(str).str.split('-').str[idx].astype(int)

    df['First Prod Date'] = df['First Prod Date'].astype(str)
    df['End Prod Date'] = df['End Prod Date'].astype(str)

    # set row where year == 1800, then year, month, day = 0 (3 columns), since from source Sop and Eop have no data
    df.loc[df['First Prod Year'] == 1800, ['First Prod Year', 'First Prod Month', 'First Prod Day']] = 0
    df.loc[df['End Prod Year'] == 1800, ['End Prod Year', 'End Prod Month', 'End Prod Day']] = 0

    return df


def update_well_header_info_with_zone_info(df, zon_df, vol_df):
    lseid_lperf_dict = pd.Series(zon_df['Lperf'].values, index=zon_df['Lse Id']).to_dict()
    lseid_uperf_dict = pd.Series(zon_df['Uperf'].values, index=zon_df['Lse Id']).to_dict()
    lseid_zonnum_dict = pd.Series(zon_df['Zonnum'].values, index=zon_df['Lse Id']).to_dict()
    lseid_thickness_dict = pd.Series(vol_df['Thickness'].values, index=vol_df['Lse Id']).to_dict()
    df["Upper Perforation"] = df["Lse Id"].map(lseid_lperf_dict)
    df["Lower Perforation"] = df["Lse Id"].map(lseid_uperf_dict)
    df["Landing Zone"] = df["Lse Id"].map(lseid_zonnum_dict)
    df["Formation Thickness Mean"] = df["Lse Id"].map(lseid_thickness_dict)

    return df


def update_well_header_with_reserve_info(df, cla_df, cat_df):
    claid_name_dict = pd.Series(cla_df['Name'].values, index=cla_df['Cla Id']).to_dict()
    catid_name_dict = pd.Series(cat_df['Name'].values, index=cat_df['Cat Id']).to_dict()
    df["Reserves Class Name"] = df["Reserves Class"].map(claid_name_dict)
    df["Reserves Sub-Category Name"] = df["Reserves Sub-Category"].map(catid_name_dict)

    return (df.applymap(lambda x: x.strip() if type(x) is str else x),
            df[['phdwin_id', 'Lse Id', 'Reserves Class Name', 'Reserves Sub-Category Name']])


def get_well_header_selected_df(df, property_id):
    selected_df = df.loc[df['Lse Id'] == property_id]

    # sort each well by Tdate
    selected_df = selected_df.sort_values('Country')
    selected_df.columns = format_well_header_col(selected_df.columns)

    # creat inptID for each id
    selected_df['inptID'] = gen_inpt_id()

    return selected_df


def pull_incremental_from_econ(econ_df, parent_incremental_dict):
    """
    Input(s): econ_df (dataframe): Economic dataframe containing incremental settings
              parent_incremental_dict (dictionary): stores all incremental lease numbers and its parent lease number,
                                                    parent lease numbers as key and the incremental lease numbers list
                                                    is the value

    Description: Check Econ df for Code4 and Code7 indicating incremental relationships.
                 Code4 stores the parent relationship.
                 Code7 stores the child relationship.
                 If a well has no parent and a child, store into incremental dictionary
    """

    # filter to wells that have a child incremental, but no parent
    parent_wells = pd.DataFrame(econ_df.loc[(econ_df['Codes[4]'] == 0) & (econ_df['Codes[7]'] != 0)])

    # add all filtered wells to parent incremental dictionary
    for index, well in parent_wells.iterrows():
        parent = str(well['Lse Id'])
        child = str(int(well['Codes[7]']))
        if parent in parent_incremental_dict:
            parent_incremental_dict[parent] += [child]
        else:
            parent_incremental_dict[parent] = [child]


INCREMENTAL_IDENTIFIER = "{incr}"

PHDWIN_CC_WH_MAPPING_DICT = {
    'Fld': 'Field',
    'Well': 'Well Name',
    'Rsv Class': 'Reserves Class',
    'Pdp Category': 'Reserves Sub-Category',
    'Major Phase': 'Primary Product',
    'Lat': 'Surface Latitude(WGS84)',
    'Long': 'Surface Longitude(WGS84)',
    'Oper': 'Current Operator',
    'Sop': 'First Prod Date',
    'Eop': 'End Prod Date',
    'Acre Space': 'Acre Spacing',
    'Td': 'TVD',
    'Reservoir': 'Landing Zone',
    'Rec No': 'Identifier',
    'Curarcseq': 'Eco Options',
    'Tubingid': 'Tubing ID'
}

REQUIRED_PHDWIN_WELL_HEADERS = [
    'phdwin_id', 'api14', 'Rec No', 'Lse Id', 'Curarcseq', 'Country', 'Fld', 'Lse Name', 'Well', 'Rsv Class',
    'Pdp Category', 'Location', 'Major Phase', 'Lat', 'Long', 'Oper', 'County', 'State', 'Sop', 'Eop', 'Acre Space',
    'Td', 'Reservior', 'Tubingid', 'Exclsum', 'Exclcash', 'Exclvol', 'Casetype'
]

PHDWIN_HEADER_FILE_MAPPING = {
    'chosenID': 'chosenID',
    'phdwin_id': 'phdwin_id',
    'well_name': 'well_name',
    'lease_name': 'lse_name',
    'api14': 'api14',
    'lease_number': 'lease_number',
    'country': 'country',
    'field': 'field',
    'primary_product': 'primary_product',
    'surfaceLatitude': 'surfaceLatitude',
    'surfaceLongitude': 'surfaceLongitude',
    'current_operator': 'current_operator',
    'county': 'county',
    'state': 'state',
    'first_prod_date': 'first_prod_date',
    'acre_spacing': 'acre_spacing',
    'true_vertical_depth': 'true_vertical_depth',
    'landing_zone': 'landing_zone',
    'prms_reserves_category': 'prms_reserves_category',
    'prms_reserves_sub_category': 'prms_reserves_sub_category',
}

PHDWIN_DAILY_PROD_FILE_MAPPING = {'oil': 'Oil', 'gas': 'Gas', 'water': 'Water', 'date': 'Date', 'chosenID': 'phdwin_id'}

PHDWIN_MONTHLY_PROD_FILE_MAPPING = {
    'oil': 'oil',
    'gas': 'gas',
    'water': 'water',
    'date': 'date',
    'chosenID': 'phdwin_id'
}

CC_PHDWIN_TABLE_NAME = {
    'well_name': 'lse_name',
    'lse_name': 'well_name',
    'lse_id': 'lease_number',
    'reserves_class_name': 'prms_reserves_category',
    'reserves_sub_category_name': 'prms_reserves_sub_category',
    'tvd': 'true_vertical_depth',
    'surface_latitude_wgs84': 'surfaceLatitude',
    'surface_longitude_wgs84': 'surfaceLongitude',
}
