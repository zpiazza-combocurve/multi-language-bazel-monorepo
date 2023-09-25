import pandas as pd
import numpy as np
import datetime

from combocurve.services.cc_to_aries.general_functions import truncate_inpt_id
from combocurve.shared.np_helpers import get_well_order_by_names

pd.set_option('display.max_rows', 1000)
pd.set_option('display.max_columns', 200)

cc_base_date = np.datetime64('1900-01-01')

AC_DAILY_HEADERS = ['PROPNUM', 'D_DATE', 'OIL', 'GAS', 'WATER']
AC_PRODUCT_HEADERS = ['PROPNUM', 'P_DATE', 'OIL', 'GAS', 'WATER']
CC_FORECAST_HEADERS = ['PROPNUM', 'C_DATE', 'OIL', 'GAS', 'WATER']
AC_PROPERTY_HEADERS = [
    'DBSKEY',  # areis
    'PROPNUM',  # areis
    'SEQNUM',  # areis
    'API14',
    'INPTID',
    'CHOSENID',
    'WELL_NAME',
    'WELL_NUMBER',
    'RSV_CAT',  # areis
    'CC_MODEL_RESOURCE_CLASS',
    'CC_MODEL_CATEGORY',
    'CC_MODEL_SUB_CATEGORY',
    'STATE',
    'COUNTY',
    'CURRENT_OPERATOR',
    'CURRENT_OPERATOR_ALIAS',
    'TYPE_CURVE_AREA',
    'MAJOR',  # areis primary_product in cc
    #
    'BASIN',
    'PAD_NAME',
    'HOLE_DIRECTION',
    'LANDING_ZONE',
    'TARGET_FORMATION',
    'FIRST_PROD_DATE',
    'DISCOUNT_DATE',
    'END_HIST_PROD_DATE',
    'MAJOR_SEG_START',
    'SURFACELATITUDE',
    'SURFACELONGITUDE',
    'TOELATITUDE',
    'TOELONGITUDE',
    'PERF_LATERAL_LENGTH',
    'TOTAL_PROPPANT_PER_PERFORATED_INTERVAL',
    'TOTAL_FLUID_PER_PERFORATED_INTERVAL',
    'TRUE_VERTICAL_DEPTH',
    'HZ_WELL_SPACING_SAME_ZONE',
    'VT_WELL_SPACING_SAME_ZONE',
    'STAGE_SPACING',
    'TOTAL_STAGE_COUNT',
    'WELL_TYPE',
    'STATUS',
    'OIL_GATHERER',
    'GAS_GATHERER',
    'NGL_GATHERER',
    'SHRINK',
    'UNSHRUNK_BTU'
]

OFFSET_MACRO_DICT = {
    'offset_to_fpd': 'FIRST_PROD_DATE',
    'offset_to_discount_date': 'DISCOUNT_DATE',
    'offset_to_first_segment': 'MAJOR_SEG_START',
    'offset_to_end_history': 'END_HIST_PROD_DATE'
}


class ExportToAriesError(Exception):
    expected = True


def raise_selected_id_error():
    error_message = 'The selected ID can not be used as a unique ID'
    raise ExportToAriesError(error_message)


def validate_unique_id_list(id_list):
    # ids should be string so far
    cleaned_id_list = [i for i in id_list if (i is not None) and (str(i) != 'nan')]
    cleaned_id_set = set(cleaned_id_list)
    if len(cleaned_id_set) != len(id_list):
        raise_selected_id_error()


def combine_str(well_name_str, well_number_str):
    if well_name_str not in ['None', 'nan']:
        if well_number_str not in ['None', 'nan']:
            return f'{well_name_str} {well_number_str}'
        else:
            return well_name_str
    else:
        if well_number_str not in ['None', 'nan']:
            return well_number_str
        else:
            raise_selected_id_error()


def combine_well_name_well_number(well_header_df):
    if 'well_name' not in well_header_df and 'well_number' not in well_header_df:
        raise_selected_id_error()

    row_num = len(well_header_df)
    well_name_list = well_header_df['well_name'].astype(
        str).to_list() if 'well_name' in well_header_df else ['nan'] * row_num
    well_number_list = well_header_df['well_number'].astype(
        str).to_list() if 'well_number' in well_header_df else ['nan'] * row_num

    well_name_well_number_list = []
    for i in range(row_num):
        this_well_name = well_name_list[i]
        this_well_number = well_number_list[i]
        well_name_well_number_list.append(combine_str(this_well_name, this_well_number))

    return well_name_well_number_list


def get_selected_id_list(well_header_df, selected_id_key):
    if selected_id_key == 'well_name_well_number':
        selected_id_list = combine_well_name_well_number(well_header_df)
    else:
        if selected_id_key in well_header_df:
            selected_id_list = well_header_df[selected_id_key].str.replace('INPT.', '', regex=False)
            selected_id_list = selected_id_list.str.replace('INPT', '', regex=False).to_list()
        else:
            raise_selected_id_error()

    validate_unique_id_list(selected_id_list)

    return selected_id_list


def update_primary_product_if_na(well_data, selected_id_key, econ_df, econ_headers):
    '''
    Update Well header with Primary Product, if non is assigned in CC
    '''
    # format selected_id key to remove space, underscore, bracket and dashes to unify with AC ECON DF HEADERS
    formated_selected_id_key = selected_id_key.replace(' ', '').replace('_',
                                                                        '').replace('-',
                                                                                    '').replace('(',
                                                                                                '').replace(')',
                                                                                                            '').lower()
    # get section and keyword index
    try:
        section_index = econ_headers.index('section')
        keyword_index = econ_headers.index('keyword')
    except ValueError:
        section_index = None
        keyword_index = None

    # if the selected id key is not well_name and well number
    if selected_id_key != 'well_name_well_number':
        # get the identifier for the well
        identifier = well_data['well'].get(selected_id_key, '')
        # if the selected_id key is inpt ID, truncate the inptID from the name
        if selected_id_key == 'inptID':
            identifier = truncate_inpt_id(identifier)
        # get the index for the selected id key in econ header list
        try:
            header_index = econ_headers.index(formated_selected_id_key)
        except ValueError:
            header_index = None
        # check if primary product has a value, if it doesn't and either of the header_index, section_index or
        # header index is not None
        if not well_data['well'].get('primary_product') and (header_index is not None and section_index is not None
                                                             and keyword_index is not None):
            # search for section 4 for the well
            selected_forecast_section = econ_df[(econ_df[:, header_index] == identifier)]
            # loop through all the keywords in the forecast section
            # the phase first seen in the df is set as the primary product
            for forecast_keyword in selected_forecast_section[:, keyword_index]:
                if str(forecast_keyword).lower() in ['oil', 'gas']:
                    well_data['well']['primary_product'] = str(forecast_keyword).upper()
                    break
    # if its well name well number
    else:
        # get well_name
        well_name = str(well_data['well'].get('well_name', '')).strip()
        # get well number
        well_number = str(well_data['well'].get('well_number', '')).strip()
        # get header_index for well name
        header_index_1 = econ_headers.index('wellname')
        # get header_index for well number
        header_index_2 = econ_headers.index('wellnumber')
        # check if primary product has a value, if it doesn't and either of the well_name header_index,
        # well_number header_index, section_index or header index is not None
        if not well_data['well'].get('primary_product') and (header_index_1 is not None and header_index_2 is not None
                                                             and section_index is not None
                                                             and keyword_index is not None):
            # search for section 4 for the well
            selected_forecast_section = econ_df[(econ_df[:, header_index_1] == well_name)
                                                & (econ_df[:, header_index_2] == well_number)]
            # loop through all the keywords in the forecast section
            # the phase first seen in the df is set as the primary product
            for forecast_keyword in selected_forecast_section[:, keyword_index]:
                if str(forecast_keyword).lower() in ['oil', 'gas']:
                    well_data['well']['primary_product'] = str(forecast_keyword).upper()
                    break


def add_columns_for_macro(df, macro_dict):
    map_dict = {}
    for date_type, column_name in OFFSET_MACRO_DICT.items():
        well_mapping_dict = {}
        for identifier, date_dict in macro_dict.items():
            date = pd.to_datetime(date_dict[date_type], errors='coerce')
            if pd.isnull(date):
                well_mapping_dict[identifier] = date_dict[date_type]
            else:
                well_mapping_dict[identifier] = date.strftime('%m/%Y')
        map_dict[column_name] = well_mapping_dict

    for column_name, well_date_dict in map_dict.items():
        df[column_name] = df['PROPNUM'].map(well_date_dict)
        df[column_name].fillna('')

    return df


def get_well_header_list_with_rsv_cat_primary_product(well_data_list, econ_df, selected_id_key):
    well_header_list = []
    econ_headers = [
        str(item).replace(' ', '').replace('_', '').replace('-', '').replace('(', '').replace(')', '').lower()
        for item in econ_df.columns
    ]
    try:
        section_index = econ_headers.index('section')
    except ValueError:
        section_index = None

    econ_df = np.array(econ_df)
    if section_index is not None:
        forecast_econ_df = econ_df[econ_df[:, section_index] == 4]
    for well_data in well_data_list:
        update_primary_product_if_na(well_data, selected_id_key, forecast_econ_df, econ_headers)
        res_cat_dict = well_data['assumptions'].get('reserves_category')
        if res_cat_dict is not None:
            prms_class = res_cat_dict['reserves_category']['prms_resources_class']
            prms_cat = res_cat_dict['reserves_category']['prms_reserves_category']
            prms_sub_cat = res_cat_dict['reserves_category']['prms_reserves_sub_category']
            aries_res_cat = CC_MODEL_ARIES_RSV_CAT_DICT.get((prms_class, prms_cat, prms_sub_cat))
            if aries_res_cat is not None:
                well_data['well']['RSV_CAT'] = aries_res_cat
                well_data['well']['CC_MODEL_RESOURCE_CLASS'] = prms_class.upper()
                well_data['well']['CC_MODEL_CATEGORY'] = prms_cat.upper()
                well_data['well']['CC_MODEL_SUB_CATEGORY'] = prms_sub_cat.upper()
        else:
            well_data['well']['RSV_CAT'] = ''
            well_data['well']['CC_MODEL_RESOURCE_CLASS'] = ''
            well_data['well']['CC_MODEL_CATEGORY'] = ''
            well_data['well']['CC_MODEL_SUB_CATEGORY'] = ''

        well_header_list.append(well_data['well'])

    return well_header_list


## AC_PROPERTY
def get_ac_property(context, well_data_list, economic_df, macro_dict, ac_property_updates, selected_id_key):
    well_header_list = get_well_header_list_with_rsv_cat_primary_product(well_data_list, economic_df, selected_id_key)

    # sort well by name
    well_order_list = get_well_order_by_names([w.get('well_name', '') for w in well_header_list])
    well_header_df = pd.DataFrame(np.array(well_header_list)[well_order_list].tolist())

    if len(list(well_header_df)) == 0:
        raise ExportToAriesError('No well to export')

    selected_id_list = get_selected_id_list(well_header_df, selected_id_key)

    primary_id_to_selected_id_dic = pd.Series(selected_id_list, index=well_header_df['_id']).to_dict()

    well_header_names = list(well_header_df)
    drop_system_headers = ['_id', 'createdAt', 'updatedAt', '_v', '__v']
    drop_other_headers = ['location', 'toeLocation', 'heelLocation']
    well_header_drop = [i for i in well_header_names if i in drop_system_headers + drop_other_headers]
    well_header_df = well_header_df.drop(well_header_drop, axis=1)
    well_header_df = well_header_df.rename(str.upper, axis='columns')

    well_header_df['PROPNUM'] = selected_id_list
    well_header_df['DBSKEY'] = 'B3JER'
    # won't error when column not exists
    well_header_df.rename(columns={'PRIMARY_PRODUCT': 'MAJOR'}, inplace=True)
    well_header_df = add_columns_for_macro(well_header_df, macro_dict)

    # add column is missing
    well_header_df_headers = well_header_df.columns
    use_headers = AC_PROPERTY_HEADERS[:]
    for col_key in use_headers + ac_property_updates:
        if col_key not in well_header_df_headers:
            well_header_df[col_key] = None

    other_headers = list(set(well_header_df_headers) - set(use_headers))
    well_header_df = well_header_df[use_headers + other_headers]
    # adjust column order
    well_header_df = well_header_df.fillna(np.nan).replace([np.nan], [None])
    well_header_df = well_header_df.loc[:, ~well_header_df.columns.duplicated()]
    return well_header_df, primary_id_to_selected_id_dic


## AC_PRODUCT, AC_DAILY
def get_aries_production(well_ids, monthly_daily_dict, daily_monthly, primary_id_to_selected_id_dic, file_foramt):
    prod_dict = monthly_daily_dict[daily_monthly]

    if daily_monthly == 'daily':
        col_names = AC_DAILY_HEADERS
    elif daily_monthly == 'monthly':
        col_names = AC_PRODUCT_HEADERS

    if len(list(prod_dict)) == 0:
        return pd.DataFrame(columns=col_names)

    prod_list = []

    for well_id in prod_dict:
        well_prod_dict = prod_dict[well_id]

        well_prod_index = well_prod_dict['index']

        if len(well_prod_index) == 0 or well_id not in well_ids:
            continue

        propnum = primary_id_to_selected_id_dic.get(well_id)

        propnum_list = [propnum] * len(well_prod_index)

        np_date_list = np.datetime64('1900-01-01') + well_prod_index

        if daily_monthly == 'monthly':
            np_date_list = (np_date_list.astype('datetime64[M]')
                            + np.timedelta64(1, 'M')).astype('datetime64[D]') - np.timedelta64(1, 'D')

        date_list = (np_date_list).astype(datetime.date)

        if file_foramt == 'accdb':
            str_format = '%Y-%m-%d'
        else:
            str_format = '%m/%d/%Y'
        date_list = [d.strftime(str_format) for d in date_list]

        oil_list = [0 if i is None else i for i in well_prod_dict['oil']]
        gas_list = [0 if i is None else i for i in well_prod_dict['gas']]
        water_list = [0 if i is None else i for i in well_prod_dict['water']]
        well_array = np.array([propnum_list, date_list, oil_list, gas_list, water_list], dtype=object).transpose()
        prod_list += well_array.tolist()

    formated_well_months_df = pd.DataFrame.from_records(prod_list, columns=col_names)

    return formated_well_months_df


def process_cc_forecast_volumes(cc_forecast_volumes, file_format):
    str_date_format = '%Y-%m-%d' if file_format == 'accdb' else '%m/%d/%Y'
    cc_forecast_volume_table = []
    columns = ['PROPNUM', 'C_DATE', 'OIL', 'GAS', 'WATER']
    if cc_forecast_volumes:
        for propnum in cc_forecast_volumes:
            if all(cc_forecast_volumes[propnum].get(phase) is None for phase in ['oil', 'gas', 'water']):
                continue

            dates = []
            for phase in ['oil', 'gas', 'water']:
                phase_value = cc_forecast_volumes[propnum].get(phase)
                if phase_value is not None:
                    dates += list(phase_value[:, 1])
            unique_dates = np.unique(np.array(dates))
            for unique_date in unique_dates:
                pd_unique_date = pd.to_datetime(unique_date, errors='coerce')
                if pd.isnull(pd_unique_date):
                    continue
                pd_unique_date = pd_unique_date.strftime(str_date_format)
                row = [propnum, pd_unique_date]
                for phase in ['oil', 'gas', 'water']:
                    phase_value = cc_forecast_volumes[propnum].get(phase)
                    if phase_value is not None:
                        selected_phase_value = phase_value[np.argwhere(phase_value[:, 1] == unique_date).flatten(), :]
                        if selected_phase_value.size == 0:
                            row.append(None)
                        else:
                            row.append(selected_phase_value[0, 0])
                    else:
                        row.append(None)
                cc_forecast_volume_table.append(row)

    cc_forecast_volume_df = pd.DataFrame(cc_forecast_volume_table, columns=columns)
    cc_forecast_volume_df['TEMP'] = pd.to_datetime(cc_forecast_volume_df['C_DATE'].astype(str), errors='coerce')
    cc_forecast_volume_df.sort_values(by='TEMP', inplace=True)
    cc_forecast_volume_df.drop(['TEMP'], axis=1, inplace=True)

    return cc_forecast_volume_df


CC_MODEL_ARIES_RSV_CAT_DICT = {
    ('reserves', 'proved', 'producing'): '1PDP',
    ('reserves', 'proved', 'non_producing'): '2PNP',
    ('reserves', 'proved', 'undeveloped'): '3PUD',
    ('reserves', 'proved', 'behind_pipe'): '1PBP',
    ('reserves', 'proved', 'shut_in'): '2DSI',
    ('reserves', 'proved', 'injection'): '0INJ',
    ('reserves', 'proved', 'p&a'): '2DPA',
    ('reserves', 'probable', 'producing'): '1PDP',
    ('reserves', 'probable', 'non_producing'): '4PNP',
    ('reserves', 'probable', 'undeveloped'): '4PRB',
    ('reserves', 'probable', 'behind_pipe'): '4PBP',
    ('reserves', 'probable', 'shut_in'): '2DSI',
    ('reserves', 'probable', 'injection'): '0INJ',
    ('reserves', 'probable', 'p&a'): '2DPA',
    ('reserves', 'possible', 'producing'): '1PDP',
    ('reserves', 'possible', 'non_producing'): '5PNP',
    ('reserves', 'possible', 'undeveloped'): '5POS',
    ('reserves', 'possible', 'behind_pipe'): '5PBP',
    ('reserves', 'possible', 'shut_in'): '2DSI',
    ('reserves', 'possible', 'injection'): '0INJ',
    ('reserves', 'possible', 'p&a'): '2DPA',
    ('reserves', 'c1', 'producing'): '1PDP',
    ('reserves', 'c1', 'non_producing'): '6CNP',
    ('reserves', 'c1', 'undeveloped'): '6C1',
    ('reserves', 'c1', 'behind_pipe'): '6CBP',
    ('reserves', 'c1', 'shut_in'): '2DSI',
    ('reserves', 'c1', 'injection'): '0INJ',
    ('reserves', 'c1', 'p&a'): '2DPA',
    ('reserves', 'c2', 'producing'): '1PDP',
    ('reserves', 'c2', 'non_producing'): '6CNP',
    ('reserves', 'c2', 'undeveloped'): '6C2',
    ('reserves', 'c2', 'behind_pipe'): '6CBP',
    ('reserves', 'c2', 'shut_in'): '2DSI',
    ('reserves', 'c2', 'injection'): '0INJ',
    ('reserves', 'c2', 'p&a'): '2DPA',
    ('reserves', 'c3', 'producing'): '1PDP',
    ('reserves', 'c3', 'non_producing'): '6CNP',
    ('reserves', 'c3', 'undeveloped'): '6C3',
    ('reserves', 'c3', 'behind_pipe'): '6CBP',
    ('reserves', 'c3', 'shut_in'): '2DSI',
    ('reserves', 'c3', 'injection'): '0INJ',
    ('reserves', 'c3', 'p&a'): '2DPA',
    ('contingent', 'proved', 'producing'): '1PDP',
    ('contingent', 'proved', 'non_producing'): '6C',
    ('contingent', 'proved', 'undeveloped'): '6C',
    ('contingent', 'proved', 'behind_pipe'): '6CBP',
    ('contingent', 'proved', 'shut_in'): '2DSI',
    ('contingent', 'proved', 'injection'): '0INJ',
    ('contingent', 'proved', 'p&a'): '2DPA',
    ('contingent', 'probable', 'producing'): '1PDP',
    ('contingent', 'probable', 'non_producing'): '6C',
    ('contingent', 'probable', 'undeveloped'): '6C',
    ('contingent', 'probable', 'behind_pipe'): '6CBP',
    ('contingent', 'probable', 'shut_in'): '2DSI',
    ('contingent', 'probable', 'injection'): '0INJ',
    ('contingent', 'probable', 'p&a'): '2DPA',
    ('contingent', 'possible', 'producing'): '1PDP',
    ('contingent', 'possible', 'non_producing'): '6C',
    ('contingent', 'possible', 'undeveloped'): '6C',
    ('contingent', 'possible', 'behind_pipe'): '6CBP',
    ('contingent', 'possible', 'shut_in'): '2DSI',
    ('contingent', 'possible', 'injection'): '0INJ',
    ('contingent', 'possible', 'p&a'): '2DPA',
    ('contingent', 'c1', 'producing'): '1PDP',
    ('contingent', 'c1', 'non_producing'): '6C1',
    ('contingent', 'c1', 'undeveloped'): '6C1',
    ('contingent', 'c1', 'behind_pipe'): '6CBP',
    ('contingent', 'c1', 'shut_in'): '2DSI',
    ('contingent', 'c1', 'injection'): '0INJ',
    ('contingent', 'c1', 'p&a'): '2DPA',
    ('contingent', 'c2', 'producing'): '1PDP',
    ('contingent', 'c2', 'non_producing'): '6C2',
    ('contingent', 'c2', 'undeveloped'): '6C2',
    ('contingent', 'c2', 'behind_pipe'): '6CBP',
    ('contingent', 'c2', 'shut_in'): '2DSI',
    ('contingent', 'c2', 'injection'): '0INJ',
    ('contingent', 'c2', 'p&a'): '2DPA',
    ('contingent', 'c3', 'producing'): '1PDP',
    ('contingent', 'c3', 'non_producing'): '6C3',
    ('contingent', 'c3', 'undeveloped'): '6C3',
    ('contingent', 'c3', 'behind_pipe'): '6CBP',
    ('contingent', 'c3', 'shut_in'): '2DSI',
    ('contingent', 'c3', 'injection'): '0INJ',
    ('contingent', 'c3', 'p&a'): '2DPA',
    ('prospective', 'proved', 'producing'): '1PDP',
    ('prospective', 'proved', 'non_producing'): '7U',
    ('prospective', 'proved', 'undeveloped'): '7U',
    ('prospective', 'proved', 'behind_pipe'): '7BP1',
    ('prospective', 'proved', 'shut_in'): '2DSI',
    ('prospective', 'proved', 'injection'): '0INJ',
    ('prospective', 'proved', 'p&a'): '2DPA',
    ('prospective', 'probable', 'producing'): '1PDP',
    ('prospective', 'probable', 'non_producing'): '7U',
    ('prospective', 'probable', 'undeveloped'): '7U',
    ('prospective', 'probable', 'behind_pipe'): '7BP2',
    ('prospective', 'probable', 'shut_in'): '2DSI',
    ('prospective', 'probable', 'injection'): '0INJ',
    ('prospective', 'probable', 'p&a'): '2DPA',
    ('prospective', 'possible', 'producing'): '1PDP',
    ('prospective', 'possible', 'non_producing'): '7U',
    ('prospective', 'possible', 'undeveloped'): '7U',
    ('prospective', 'possible', 'behind_pipe'): '7BP3',
    ('prospective', 'possible', 'shut_in'): '2DSI',
    ('prospective', 'possible', 'injection'): '0INJ',
    ('prospective', 'possible', 'p&a'): '2DPA',
    ('prospective', 'c1', 'producing'): '1PDP',
    ('prospective', 'c1', 'non_producing'): '7U',
    ('prospective', 'c1', 'undeveloped'): '7U',
    ('prospective', 'c1', 'behind_pipe'): '7BP1',
    ('prospective', 'c1', 'shut_in'): '2DSI',
    ('prospective', 'c1', 'injection'): '0INJ',
    ('prospective', 'c1', 'p&a'): '2DPA',
    ('prospective', 'c2', 'producing'): '1PDP',
    ('prospective', 'c2', 'non_producing'): '7U',
    ('prospective', 'c2', 'undeveloped'): '7U',
    ('prospective', 'c2', 'behind_pipe'): '7BP2',
    ('prospective', 'c2', 'shut_in'): '2DSI',
    ('prospective', 'c2', 'injection'): '0INJ',
    ('prospective', 'c2', 'p&a'): '2DPA',
    ('prospective', 'c3', 'producing'): '1PDP',
    ('prospective', 'c3', 'non_producing'): '7U',
    ('prospective', 'c3', 'undeveloped'): '7U',
    ('prospective', 'c3', 'behind_pipe'): '7BP3',
    ('prospective', 'c3', 'shut_in'): '2DSI',
    ('prospective', 'c3', 'injection'): '0INJ',
    ('prospective', 'c3', 'p&a'): '2DPA'
}
