import numpy as np
from combocurve.science.econ.post_process import PostProcess
from combocurve.services.econ.econ_columns import SPECIAL_COL_DICT


class OutputError(Exception):
    expected = True


def date_str_format_change(input_date_str, output_type='D'):
    # input has format '2019-12-06'; output has format '12/06/2019'
    date_list = input_date_str.split('-')
    year = date_list[0]
    month = date_list[1]
    day = date_list[2]
    if output_type == 'D':
        return f'{month}/{day}/{year}'
    elif output_type == 'M':
        return f'{month}/{year}'


def get_year_index(fiscal, date_array):
    year_list = date_array.astype('datetime64[Y]')
    year_month_list = date_array.astype('datetime64[M]')
    year_start = date_array.astype('datetime64[Y]')[0]
    year_end = date_array.astype('datetime64[Y]')[-1]
    num_year = (year_end - year_start).astype('int') + 1

    fiscal_index_dict = {}
    year_str_list = []

    for i in range(num_year + 2):
        this_year_str = (year_start + i - 1).astype('str')

        year_np = np.datetime64(this_year_str)
        #
        pre_year_month_add = year_month_list[0] - np.arange(1, 13)
        later_year_month_add = year_month_list[-1] + np.arange(1, 13)
        #
        year_list_extend = np.concatenate(
            (pre_year_month_add.astype('datetime64[Y]'), year_list, later_year_month_add.astype('datetime64[Y]')))
        year_month_list_extend = np.concatenate((pre_year_month_add, year_month_list, later_year_month_add))
        # backward
        this_fiscal_list = year_month_list_extend[year_list_extend == year_np] - (11 - int(fiscal.split('-')[-1]))
        # foreward
        # this_fiscal_list = year_month_list_extend[year_list_extend == year_np] + int(fiscal.split('-')[0])

        fiscal_index_dict[this_year_str] = (year_month_list >= this_fiscal_list[0]) & (year_month_list <=
                                                                                       this_fiscal_list[-1])
        year_str_list.append(this_year_str)
    return fiscal_index_dict, year_str_list


# inputs are numpy arrays
def get_years_list(date_array,
                   fiscal_index_dict,
                   year_str_list,
                   value_array=None,
                   method=None,
                   this_unit=None,
                   additional={},
                   is_cum=False):
    # date_array is np.array of str
    year_start = date_array.astype('datetime64[Y]')[0]
    year_end = date_array.astype('datetime64[Y]')[-1]
    num_year = (year_end - year_start).astype('int') + 1
    #
    year_list = []
    #
    for i in range(num_year + 2):
        this_year = {}
        this_year['order'] = i
        this_year['year'] = year_str_list[i]
        this_year_index = fiscal_index_dict[this_year['year']]
        #
        if np.sum(this_year_index) == 0:
            continue

        if value_array is None:
            # month
            this_year['months'] = date_array[this_year_index].tolist()
            # toal
            this_year['total'] = 0
        else:
            # month
            this_year['months'] = value_array[this_year_index].tolist()
            # total
            if is_cum is True:
                this_year['total'] = this_year['months'][-1]
            else:
                # mask to get the additional cols for the year
                year_additional = {}
                if len(additional) > 0:
                    for col in additional.keys():
                        year_additional[col] = np.asarray(additional[col])[this_year_index].tolist()
                this_year['total'] = PostProcess.get_total(this_year['months'], method, this_unit, year_additional)
        # append this_year
        year_list.append(this_year)

    return year_list


def get_nested_output(flat_output, nested_output_paras):  # noqa: C901
    if flat_output == {}:
        # empty output
        return []

    #### parse input
    unit_dict = nested_output_paras['unit_dict']
    name_dict = nested_output_paras['name_dict']
    ignore_columns = nested_output_paras['ignore_columns']
    fiscal = nested_output_paras['fiscal']

    #### the dictionary of all columns
    ## construct output
    output = []
    #
    order = 0
    date_array = np.array(flat_output['date'])
    # get fiscal seperation of year
    fiscal_index_dict, year_str_list = get_year_index(fiscal, date_array)
    #
    date_col = {
        'key': 'date',
        'name': 'Date',
        'order': order,
        'total': 0,
        'unit': '',
        'type': 'date',
        'years': get_years_list(date_array, fiscal_index_dict, year_str_list)
    }
    output.append(date_col)
    order += 1
    #
    for col_key in flat_output:
        if col_key == 'date' or col_key in ignore_columns or 'well_count' in col_key:
            continue
        #
        this_unit = unit_dict[col_key]
        this_name = name_dict[col_key]
        this_value_array = np.array(flat_output[col_key])

        # reliance
        method = None
        additional = {}

        if col_key in SPECIAL_COL_DICT.keys():
            method = SPECIAL_COL_DICT[col_key].get('method', 'divide')
            for reliance_key in SPECIAL_COL_DICT[col_key].keys():
                if SPECIAL_COL_DICT[col_key][reliance_key] == method:
                    continue
                elif SPECIAL_COL_DICT[col_key][reliance_key] not in flat_output:
                    continue
                else:
                    additional[reliance_key] = flat_output[SPECIAL_COL_DICT[col_key][reliance_key]]

        is_cum = True if 'cum' in col_key else False
        this_total = this_value_array[-1] if is_cum else PostProcess.get_total(this_value_array, method, this_unit,
                                                                               additional)

        this_monthly_dict = {
            'key':
            col_key,
            'name':
            this_name,
            'order':
            order,
            'unit':
            this_unit,
            'type':
            'number',
            'total':
            this_total,
            'years':
            get_years_list(date_array, fiscal_index_dict, year_str_list, this_value_array, method, this_unit,
                           additional, is_cum)
        }
        output.append(this_monthly_dict)
        order += 1

    return output
