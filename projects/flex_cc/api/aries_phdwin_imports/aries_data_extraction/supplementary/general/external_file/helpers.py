import numpy as np


def process_external_file_as_lookup(df):
    return_array = []
    linetype = 0
    for idx, row in df.iterrows():
        try:
            raw_string = str(row.values[-1]).replace('\t', ' ')
            str_ls = raw_string.split()
            keyword = str_ls[1]
            expression_ls = str_ls[2:]
            expression_ls += [''] * (8 - len(expression_ls))
        except Exception:
            continue
        sequence = None
        if any(item in ['N', 'R', 'M'] for item in expression_ls):
            linetype, sequence = 1, 1
        return_array.append(['CC', linetype, sequence, keyword] + expression_ls)
    return np.array(return_array)


def process_external_file_as_sidefile(df):
    return_array = []
    for idx, row in df.iterrows():
        try:
            raw_string = str(row.values[-1]).replace('\t', ' ')
            str_ls = raw_string.split()
            keyword = str_ls[1]
            expression = ' '.join(str_ls[2:])
        except Exception:
            continue
        return_array.append([None, None, None, keyword, expression, ''])

    return np.array(return_array)
