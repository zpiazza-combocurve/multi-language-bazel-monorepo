import io
import textwrap

from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME

INSTRUCTION_FILE_LINK = 'https://bit.ly/30Lzalq'


def create_master_imp(df):
    '''
    ac_property df as input, use the header in df to create master imp file
    '''
    f = io.StringIO(newline='\r\n')

    default_string = '''\
    ;
      TABLE=M
    ;
      LOOKUP = M.PROPNUM
      DATE = MM/LL/YYYY
      DELIMITER = COMMA
      SKIPLINES = 1
      CREATE = YES
    ;
    '''
    f.write(textwrap.dedent(default_string))

    for idx in range(len(df.columns)):
        f.write('  M.' + str(df.columns[idx]) + ' = ' + str(idx + 1) + '\r\n')

    f.write(';\r\n')

    return f


def create_prod_imp(df, prod_type, cc_forecast=False):
    f = io.StringIO(newline='\r\n')
    day_value = 'DD' if prod_type == 'D' else 'LL'
    table = f'{prod_type}P' if not cc_forecast else 'CC'
    default_string = f'''\
    ;
      TABLE=M
      TABLE={table}
    ;
      LOOKUP = M.PROPNUM
      DATE = MM/{day_value}/YYYY
      DELIMITER = COMMA
      SKIPLINES = 1
      CREATE = NO
    ;
    '''
    f.write(textwrap.dedent(default_string))

    for idx in range(len(df.columns)):
        if df.columns[idx] == 'PROPNUM':
            f.write('  M.' + str(df.columns[idx]) + ' = ' + str(idx + 1) + '\r\n')
        else:
            f.write(f'  {table}.' + str(df.columns[idx]) + ' = ' + str(idx + 1) + '\r\n')

    f.write(';\r\n')

    return f


def get_format(row, section_col_index):
    '''
    get KEYWORD, EXPRESSION, QUALIFIER into format s1(12), s(70), s3(12)
    '''
    qualifier_col_index = section_col_index + 2
    keyword_col_index = section_col_index + 3
    expression_col_index = section_col_index + 4

    s1 = '  ' + row[keyword_col_index]
    if len(s1) < 12:
        s1 += ' ' * (12 - len(s1))
    s2 = row[expression_col_index]
    if len(s2) < 70:
        s2 += ' ' * (70 - len(s2))
    s3 = row[qualifier_col_index]
    if len(s3) < 12:
        s3 += ' ' * (12 - len(s3))
    return s1, s2, s3


def convert_economic_to_txt(context, df, user_id, notification_id, progress_range):
    '''
    convert df to aries txt format
    '''
    f = io.StringIO()

    section_key = {
        2: 'MISCELLANEOUS',
        4: 'PRODUCTION',
        5: 'PRICES',
        6: 'COSTS',
        7: 'OWNERSHIP',
        8: 'INVESTMENT',
        9: 'OVERLAY',
    }

    total_prog_start = progress_range[0]
    total_prog_end = progress_range[1]

    section_col_index = df.columns.get_loc('SECTION')
    df_group_by_well = df.groupby(by=df.PROPNUM)  # group by index (propnum)
    number_of_wells = len(df_group_by_well)

    index = 0
    for propnum, one_well_econ in df_group_by_well:
        f.write(str(propnum) + '\r\n')
        well_list = one_well_econ.to_numpy()

        for section in section_key:
            f.write(' ' + str(section_key[section]) + '\r\n')
            section_list = well_list[well_list[:, section_col_index] == section]
            for row in section_list:
                s1, s2, s3 = get_format(row, section_col_index)
                f.write(s1 + s2 + s3 + '\r\n')

        if (index + 1) % 50 == 0:
            well_prog = total_prog_start + round((total_prog_end - total_prog_start) * (index + 1) / number_of_wells)
            context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
                '_id': notification_id,
                'progress': well_prog
            })

        index += 1

    return f


def build_intro_html_file():
    f = io.StringIO(newline='\r\n')

    intro_string = f'''\
    <html>
    <head><title>Aries Export Instruction</title></head>
    <body>
    You can check the instructions <a href={INSTRUCTION_FILE_LINK}>here</a>.
    </body>
    </html>
    '''

    f.write(textwrap.dedent(intro_string))

    return f
