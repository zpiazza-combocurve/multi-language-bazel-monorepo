import numpy as np
import pandas as pd
from api.aries_phdwin_imports.helpers import calculate_phdwin_date


def process_lpv_df(df, lease_id_to_exclsum_dic, idc_df):

    df['Exclsum'] = df['Lse Id'].map(lease_id_to_exclsum_dic)
    df = df.loc[(df['Exclsum'] == 0)]
    del df['Exclsum']

    idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
    idc_df['Idval'] = idc_df['Idval'].apply(lambda x: str(x).strip())
    lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
    df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

    # creat new columns as key in LPV df
    df['Type Str'] = df['Type'].astype(str)
    df['Modpointer Str'] = df['Modpointer'].astype(str)
    df['Type_Modpointer_asKey'] = df['Type Str'].values + '_' + df['Modpointer Str'].values

    return df


def get_model_link_from_mpv(df):

    df['Type Str'] = df['Type'].astype(str)
    df['MpvId Str'] = df['Mpv Id'].astype(str)
    df['Type_MpvId_asKey'] = df['Type Str'].values + '_' + df['MpvId Str'].values

    # create Modelname Productname Unitstr dic
    df['Modelname'] = df['Modelname'].apply(lambda x: str(x).strip())
    df['Productname'] = df['Productname'].apply(lambda x: str(x).strip())
    df['Unitstr'] = df['Unitstr'].apply(lambda x: str(x).strip())
    df['Modelname Str'] = df['Modelname'].astype(str)
    df['Productname Str'] = df['Productname'].astype(str)
    df['Modelname_Productname_asKey'] = df['Modelname Str'].values + '_' + df['Productname Str'].values
    modelname_productname_askey_unitstr_dict = pd.Series(df['Unitstr'].values,
                                                         index=df['Modelname_Productname_asKey']).to_dict()
    return df, modelname_productname_askey_unitstr_dict


def map_model_into_lpv(df, mpv_df, get_dictionary, merge_two_dicts):

    type_mpvid_askey_modelname_dict = pd.Series(mpv_df['Modelname'].values, index=mpv_df['Type_MpvId_asKey']).to_dict()
    type_mpvid_askey_startdate_dict = pd.Series(mpv_df['Startdate'].values, index=mpv_df['Type_MpvId_asKey']).to_dict()
    type_mpvid_askey_currency_dict = pd.Series(mpv_df['Currency'].values, index=mpv_df['Type_MpvId_asKey']).to_dict()
    type_mpvid_askey_unitid_dict = pd.Series(mpv_df['Unitid'].values, index=mpv_df['Type_MpvId_asKey']).to_dict()
    type_mpvid_askey_unitstr_dict = pd.Series(mpv_df['Unitstr'].values, index=mpv_df['Type_MpvId_asKey']).to_dict()
    type_mpvid_askey_productname_dict = pd.Series(mpv_df['Productname'].values,
                                                  index=mpv_df['Type_MpvId_asKey']).to_dict()

    # add key value pair, 65534: 'current' to Seq_Abbrev_dict
    df["Modelname"] = df["Type_Modpointer_asKey"].map(type_mpvid_askey_modelname_dict)
    df["Startdate"] = df["Type_Modpointer_asKey"].map(type_mpvid_askey_startdate_dict)
    df["Currency"] = df["Type_Modpointer_asKey"].map(type_mpvid_askey_currency_dict)
    df["Unitid"] = df["Type_Modpointer_asKey"].map(type_mpvid_askey_unitid_dict)

    # use default unit for no model case
    df["Unitstr"] = df["Type_Modpointer_asKey"].map(
        merge_two_dicts(type_mpvid_askey_unitstr_dict, get_dictionary('LSG_productcode_unitstr')))
    df["Productname"] = df["Type_Modpointer_asKey"].map(type_mpvid_askey_productname_dict)

    # get Type name from self constructed dictionary
    df['Type Name'] = df["Type"].map(get_dictionary('Type'))

    # strip all string in whole dataframe
    df = df.applymap(lambda x: str(x.strip() if type(x) is str else x))
    # replace nan in df to '', empty string
    df = df.replace(np.nan, '', regex=True)

    return df


def add_product_and_filter_by_current_arcseq(df, act_df):
    # prepare maping dictionary (Lse_Id, Curarcseq(Arcseq), Major Phase(Productcode))
    # for FOR table Segmentdate[0] or Segmentend[0], maping logic copy from capex_date
    lseid_curarcseq_dict = pd.Series(act_df['Curarcseq'].values, index=act_df['Lse Id']).to_dict()
    lseid_major_phase_dict = pd.Series(act_df['Major Phase'].values, index=act_df['Lse Id']).to_dict()

    df['Curarcseq'] = df['Lse Id'].map(lseid_curarcseq_dict)
    df['Major Phase'] = df['Lse Id'].map(lseid_major_phase_dict)
    df['Minor Phase'] = df['Major Phase']
    df.loc[df['Major Phase'] == 1, 'Minor Phase'] = 2
    df.loc[df['Major Phase'] == 2, 'Minor Phase'] = 1

    # chnage type to int32
    df['Curarcseq'].fillna(0, inplace=True)
    df['Major Phase'].fillna(0, inplace=True)
    df['Minor Phase'].fillna(0, inplace=True)
    df['Curarcseq'] = df['Curarcseq'].astype('int32')
    df['Major Phase'] = df['Major Phase'].astype('int32')
    df['Minor Phase'] = df['Minor Phase'].astype('int32')

    df['Lse Id str'] = df['Lse Id'].astype(str)
    df['Curarcseq str'] = df['Curarcseq'].astype(str)
    df['Major Phase str'] = df['Major Phase'].astype(str)
    df['Minor Phase str'] = df['Minor Phase'].astype(str)
    df['Id_Curarcseq'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values
    df['Id_Curarcseq_Major_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
        'Major Phase str'].values
    df['Id_Curarcseq_Minor_Phase'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
        'Minor Phase str'].values

    # for MSC update date by phase or productcode use
    df['Productcode str'] = df['Productcode'].astype(str)
    df['Id_Curarcseq_Gas'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_1'
    df['Id_Curarcseq_Oil'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_2'
    df['Id_Curarcseq_Productcode'] = df['Lse Id str'].values + '_' + df['Curarcseq str'].values + '_' + df[
        'Productcode str'].values

    return df


def process_msg_df(msg_df):
    msg_df['Type Str'] = msg_df['Type'].astype(str)
    msg_df['MpvId Str'] = msg_df['Mpv Id'].astype(str)
    msg_df['Type_MpvId_asKey'] = msg_df['Type Str'].values + '_' + msg_df['MpvId Str'].values

    return msg_df


def get_valid_lsg_df(selected_df, selected_lsg_processed_df):
    drop_index = []
    temp_ls = []
    for index, row_selected in selected_df.iterrows():
        # LSG type and productcode select

        # new logic 2/6/2019, if type and productcode exist in LSG,
        # then overwrite the type and productcode in MSG(LPV)

        temp_selected_lsg_processed_df = selected_lsg_processed_df.loc[selected_lsg_processed_df['type'].astype(str) ==
                                                                       str(row_selected['Type'])]
        temp_selected_lsg_processed_df = temp_selected_lsg_processed_df.loc[
            temp_selected_lsg_processed_df['productcode'].astype(str) == str(row_selected['Productcode'])]

        if not temp_selected_lsg_processed_df.empty:
            temp_selected_lsg_processed_df = temp_selected_lsg_processed_df[[
                not value for value in get_valid_lsg_row_array(temp_selected_lsg_processed_df)
            ]]

            temp_ls += temp_selected_lsg_processed_df.values.tolist()
            if row_selected['Modpointer'] == 0:
                drop_index.append(index)

    lsg_prices_taxes_expense_df = pd.DataFrame.from_records(temp_ls, columns=temp_selected_lsg_processed_df.columns)

    # process start and end date
    lsg_prices_taxes_expense_df['start_date'] = lsg_prices_taxes_expense_df['start_year'].astype(int).astype(
        str) + '-' + lsg_prices_taxes_expense_df['start_month'].astype(int).astype(
            str) + '-' + lsg_prices_taxes_expense_df['start_day'].astype(int).astype(str)
    lsg_prices_taxes_expense_df['end_date'] = lsg_prices_taxes_expense_df['end_year'].astype(int).astype(
        str) + '-' + lsg_prices_taxes_expense_df['end_month'].astype(int).astype(
            str) + '-' + lsg_prices_taxes_expense_df['end_day'].astype(int).astype(str)

    # delete those row which is appear in LSG table (which means data in LSG will overwrite data in LPV(MSG))
    selected_df = selected_df.drop(drop_index)

    # if selected_df is empty, just skip it! (no startdate)
    selected_df = selected_df.loc[selected_df['Startdate'] != '']

    return selected_df, lsg_prices_taxes_expense_df


def get_valid_lsg_row_array(df):
    validity_array = np.array(df.shape[0] * [True])
    for column in ['value', 'ad_val_tax']:
        validity_array = np.array(df[column].astype(float) == 0) & validity_array

    return validity_array


def add_custom_dates_to_df(  # noqa (C901)
        df, property_id, asof_date, id_arcseq_productcode_segmentdate0_dict, id_arcseq_segmentdate0_dict,
        id_arcseq_productcode_segmentend0_dict, monthly_start_date, monthly_end_date, lease_id_to_sop_dic):
    for index, row in df.iterrows():
        # need to add logic to handle startdate column in LPV
        # (same lse_id, type, productcode both in LPV (filter out) and LSG)
        # ex: 0(asof), -1(asof), -2(majseg1), -3(minseg1), -4(prodseg1 == seg1),
        #    -5(majdecl1 == segmentend[0]), -6(starthist == 1st of production),
        #    -7(endhist == last date of production), -8(firstprod == sop in ACT)

        try:
            row_start_date = int(float(row['Startdate']))
        except ValueError:
            row_start_date = row['Startdate']

        if row_start_date == 0 or row_start_date == -1:
            #### get date from asofday from .TIT.csv
            df.at[index, 'date1'] = asof_date

        elif row_start_date == -2:
            # majseg1 (lse_id, arcseq, productcode -> segmentdate[0])
            try:
                df.at[index, 'date1'] = id_arcseq_productcode_segmentdate0_dict[df.at[index,
                                                                                      'Id_Curarcseq_Major_Phase']]
            except Exception:
                df.at[index, 'date1'] = asof_date

        elif row_start_date == -3:
            # minseg1 (lse_id, arcseq, productcode-reversed -> segmentdate[0])
            try:
                df.at[index, 'date1'] = id_arcseq_productcode_segmentdate0_dict[df.at[index,
                                                                                      'Id_Curarcseq_Minor_Phase']]
            except Exception:
                df.at[index, 'date1'] = asof_date

        elif row_start_date == -4:
            try:
                # prodseg1 (lse_id, arcseq -> segmentdate[0])
                df.at[index, 'date1'] = id_arcseq_segmentdate0_dict[df.at[index, 'Id_Curarcseq']]
            except Exception:
                df.at[index, 'date1'] = asof_date

        elif row_start_date == -5:
            # majdecl1 (lse_id, arcseq, productcode -> segmentend[0])
            # possiblely happand Out of bounds nanosecond timestamp: 2270-06-16 00:00:00,
            # since pd.Timestamp.max is 2262-04-11 23:47:16.854775807
            # but in correct setting, if there is mutiple segment, segmentend[0] should be fine,
            # which means the date should not be too large
            # therefore, currectly no need to handle this potential bug
            try:
                df.at[index, 'date1'] = id_arcseq_productcode_segmentdate0_dict[df.at[index,
                                                                                      'Id_Curarcseq_Major_Phase']]
            except Exception:
                df.at[index, 'date1'] = asof_date

        elif row_start_date == -6:
            # starthist (1st date of daily production)
            # get the 1st date from all type from TST (daily production)
            try:
                df.at[index, 'date1'] = monthly_start_date
            except Exception:
                pass

        elif row_start_date == -7:
            # endhist (last date of daily production)
            # get the last date from all type from TST (daily production)
            try:
                df.at[index, 'date1'] = monthly_end_date

            except Exception:
                pass

        elif row_start_date == -8:
            # firstproductiondate
            use_date = [value for key, value in lease_id_to_sop_dic.items() if str(key) == str(property_id)]
            if len(use_date) > 0:
                df.at[index, 'date1'] = calculate_phdwin_date(use_date[-1])
    return df
