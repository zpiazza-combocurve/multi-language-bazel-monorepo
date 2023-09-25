import pandas as pd
from bson import ObjectId
from combocurve.utils.constants import DAYS_IN_MONTH

AC_SETUP_DATA_COLUMNS = ['SECNAME', 'SECTYPE', 'LINENUMBER', 'LINE', 'OWNER']
AC_SETUP_COLUMNS = [
    'SETUPNAME', 'DESCRIPTN', 'OWNER', 'PBLIC', 'FRAME', 'PW', 'ESC', 'CAPITAL', 'CORPTAX', 'SSROY', 'SPECIAL',
    'COMLINES', 'DEFLINES', 'VARATES'
]

MONTHLY_DESCR = 'PROVIDES MONTHLY TIME FRAMES'
SET_DESCR = 'PROVIDES YEARLY TIME FRAMES'
SETDATA = 'SETDATA'
CC_ARIES_DEFAULT_BASE_DATE = '01/2000'
NUMBER_OF_DISCOUNT = 15


def get_ac_setup_data(context, general_options_id, base_date):
    '''
    Returns AC_SETUP and AC_SETUPDATA from the given CC general options ID
    '''
    # create blank AC_SETUP df and AC_SETUP DATA df
    ac_setupdata_df = pd.DataFrame([], columns=AC_SETUP_DATA_COLUMNS)
    ac_setup_df = pd.DataFrame([], columns=AC_SETUP_COLUMNS)

    # get general options dictionary
    if general_options_id is not None:
        general_options = context.assumptions_collection.find_one({'_id': ObjectId(general_options_id)})

    if general_options is not None:
        # process general options econ function dict to ac_setup, ac_setupdata df
        ac_setup_df, ac_setupdata_df = process_general_options_and_dates_to_setup_data(
            general_options['econ_function'], base_date)

    return ac_setup_df, ac_setupdata_df


def process_general_options_and_dates_to_setup_data(general_options, base_date):
    # add frame rows with date
    ret_list, base_date = add_frame_lines(general_options, base_date)
    # add PW (discounting settings) rows
    ret_list = add_pw_lines(ret_list, general_options)
    # add corporate tax rows
    ret_list = add_corptax(ret_list, general_options, base_date)

    # convert list to data frame
    ac_setupdata_df = pd.DataFrame(ret_list, columns=AC_SETUP_DATA_COLUMNS)

    # use ac_setup_data df to create ac_setup_df
    ac_setup_df = generate_ac_setup_df(ac_setupdata_df)

    return ac_setup_df, ac_setupdata_df


def generate_ac_setup_df(ac_setupdata_df):
    # check if corptax in ac_setupdata df, if there add the sec name to CORPTAX column
    if 'CORPTAX' in list(ac_setupdata_df['SECTYPE']):
        corptax = 'CC_SETDATA'
    else:
        corptax = ' '
    var_sec_type = 'CC_SETDATA' if 'VARATES' in list(ac_setupdata_df['SECTYPE']) else SETDATA
    ret_list = []
    for setup_name in ['CC_SETDATA', 'CC_MONTHLY']:
        if setup_name == 'CC_MONTHLY':
            descr = MONTHLY_DESCR
        else:
            descr = SET_DESCR
        ret_list.append([
            setup_name, descr, ' ', 'Y', setup_name, 'CC_SETDATA', SETDATA, SETDATA, corptax, ' ', ' ', SETDATA,
            SETDATA, var_sec_type
        ])
    ac_setup_df = pd.DataFrame(ret_list, columns=AC_SETUP_COLUMNS)

    return ac_setup_df


def add_frame_lines(general_options, base_date):
    # get asof date (aggregation date really but for this to work asof must be equal to aggreagation)
    asof_date = pd.to_datetime(general_options['main_options']['aggregation_date']).strftime('%m/%Y')
    # get the base_date ('01/2000') unless asof date is behind that, then its 10 years behind that
    base_date = get_base_date(asof_date, base_date)
    # get number of months between base date to asof date
    no_of_mo_from_base_to_eff = get_number_of_months_from_base_date_to_effective_date(base_date, asof_date)
    # get number of months between asof date and end of that year
    no_of_months_btw_asof_and_eoy = get_no_of_months_between_as_of_date_and_end_of_year(asof_date)
    ret_list = []
    for sec_name in ['CC_SETDATA', 'CC_MONTHLY']:
        for line_num in [1, 4, 2000]:
            if line_num == 1:
                if sec_name == 'CC_MONTHLY':
                    n_frames = 120
                    n_month_frame = 1

                    frame_len = f'{n_frames}*{n_month_frame}'

                    final_frame = 1200 - no_of_mo_from_base_to_eff - n_frames
                    line = f'{base_date} {no_of_mo_from_base_to_eff}, {frame_len}, {final_frame}'

                else:
                    n_frames = (1200 - no_of_mo_from_base_to_eff - no_of_months_btw_asof_and_eoy) // 12
                    n_month_frame = 12

                    frame_len = f'{n_frames}*{n_month_frame}'

                    if no_of_months_btw_asof_and_eoy != 0:
                        line = f'{base_date} {no_of_mo_from_base_to_eff},{no_of_months_btw_asof_and_eoy}, {frame_len}'
                    else:
                        line = f'{base_date} {no_of_mo_from_base_to_eff}, {frame_len}'

            elif line_num == 4:
                line = asof_date
            elif line_num == 2000:
                line = '2 -1 0 0 100'
            ret_list.append([sec_name, 'FRAME', line_num, line, ' '])

    return ret_list, base_date


def add_pw_lines(ret_list, general_options):
    # get discount rows, discount value and discount method
    discount_row, first_discount, discount_method = get_discount_row_and_first_discount(general_options)
    for line_num in [2, 3]:
        if line_num == 2:
            line = f'EFF {first_discount} {discount_method}'
        elif line_num == 3:
            line = discount_row
        ret_list.append(['CC_SETDATA', 'PW', line_num, line, ' '])
    return ret_list


def add_corptax(ret_list, general_options, base_date):
    # check if corp tax if so add, else do nothing to
    if 'rows' in general_options['income_tax']['federal_income_tax']:
        federal_income_tax_rows = general_options['income_tax']['federal_income_tax'].get('rows')
    else:
        federal_income_tax_rows = None
    if federal_income_tax_rows is not None:
        if len(federal_income_tax_rows) == 1 and federal_income_tax_rows[0]['multiplier'] == 0:
            return ret_list
        elif len(federal_income_tax_rows) == 1 and federal_income_tax_rows[0]['multiplier'] != 0:
            try:
                federal_income_tax = round(federal_income_tax_rows[0]['multiplier'] / 100, 4)
            except (ValueError, TypeError):
                return ret_list
            ret_list.append(['CC_SETDATA', 'CORPTAX', 40, f'US {federal_income_tax} 0 0 0 0 0 0 0', ' '])
        else:
            ret_list = update_ret_list_with_var_rates(ret_list, base_date, federal_income_tax_rows)
    return ret_list


def update_ret_list_with_var_rates(ret_list, date, federal_tax_rows):
    criteria_key_dict = {
        'dates': ['start_date', 'end_date'],
        'offset_to_asof_date': ['start', 'end'],
        'offset_to_fpd': ['start', 'end']
    }
    if any(key in criteria_key_dict for key in federal_tax_rows[0]):
        criteria_key = next(key for key in federal_tax_rows[0] if key in criteria_key_dict)
        start_key, end_key = criteria_key_dict.get(criteria_key)

        var_rate_line = [1]
        for idx, row in enumerate(federal_tax_rows):
            start_date = row[criteria_key][start_key]
            end_date = row[criteria_key][end_key]
            if criteria_key == 'dates':
                if idx == 0:
                    var_rate_line.append(pd.to_datetime(start_date).strftime('%m/%Y'))
                if end_date == 'Econ Limit':
                    duration = 1200
                else:
                    duration = int(round((pd.to_datetime(end_date) - pd.to_datetime(start_date)).days / DAYS_IN_MONTH))
            else:
                if idx == 0:
                    var_rate_line.append(pd.to_datetime(date).strftime('%m/%Y'))
                if end_date == 'Econ Limit' or idx == len(federal_tax_rows) - 1:
                    duration = 1200
                else:
                    duration = int(end_date - start_date + 1)
            value = row['multiplier'] / 100
            var_rate_line.append(f'{duration}*{value}')

        ret_list.append(['CC_SETDATA', 'CORPTAX', 40, 'US S/1 0 0 0 0 0 0 0', ' '])
        ret_list.append(['CC_SETDATA', 'VARATES', 70, ' '.join([str(item) for item in var_rate_line]), ' '])

    return ret_list


def get_base_date(date, base_date):
    base_date = date if base_date is None else base_date
    if pd.to_datetime(base_date) <= pd.to_datetime(CC_ARIES_DEFAULT_BASE_DATE):
        return (pd.to_datetime(base_date) - pd.DateOffset(years=10)).strftime('%m/%Y')
    else:
        return CC_ARIES_DEFAULT_BASE_DATE


def process_discount_rows(discount_rows_input):
    '''
    ARIES accept up to 15 discount rate, model in CC may have 16 (created in CC) or 15 (from ARIES import)
    '''
    discount_rows = discount_rows_input[:NUMBER_OF_DISCOUNT]
    if len(discount_rows) < NUMBER_OF_DISCOUNT:
        discount_rows = discount_rows + [discount_rows[-1]] * (NUMBER_OF_DISCOUNT - len(discount_rows))
    return discount_rows


def get_discount_row_and_first_discount(general_options):
    first_discount = int(general_options['discount_table']['first_discount'])
    discount_method = general_options['discount_table']['discount_method']
    discount_method = '365' if discount_method == 'daily' else 'MO'
    discount_rows = []

    processed_discount_rows_input = process_discount_rows(general_options['discount_table']['rows'])
    for table in processed_discount_rows_input:
        discount_rows.append(str(table['discount_table']))
    discount_row = ' '.join(discount_rows)

    return discount_row, first_discount, discount_method


def get_number_of_months_from_base_date_to_effective_date(base_date, asof_date):
    no_of_days = round((pd.to_datetime(asof_date) - pd.to_datetime(base_date)).days / DAYS_IN_MONTH)
    return no_of_days


def get_no_of_months_between_as_of_date_and_end_of_year(date):
    return_value = 13 - pd.to_datetime(date).month
    return_value = 0 if return_value == 12 else return_value
    return return_value
