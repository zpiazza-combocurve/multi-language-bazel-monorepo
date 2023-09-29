import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import fetch_value
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.helpers import (
    update_lookup_table_name)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.helpers import (
    get_proper_qualifier_for_add_ons)

from combocurve.shared.aries_import_enums import EconEnum, EconHeaderEnum


def process_lookup_interpolation_criterion(matched_key, selected_df, df, var_index, linetype_index, sequence_index,
                                           table_name, property_id, scenario, mapping_dic, custom_mapping_dic,
                                           log_report):
    '''
    Process lookup interlopation by interpolating between the lines that provide an upper and lowern  bound in the
    lookup interpolation columns
    '''
    # initially set range found to false
    range_found = False
    # get lookup value
    compare_value = float(fetch_value(matched_key, property_id, mapping_dic, custom_mapping_dic, lookup=True))
    table_name = update_lookup_table_name(table_name, compare_value, 'I')
    # loop through interpolation colume
    for pos, value in enumerate(selected_df[:, var_index]):
        if pos < selected_df.shape[0] - 1:
            # get current value and the next value
            try:
                value = float(value)
                next_value = float(selected_df[pos + 1, var_index])
            except ValueError:
                continue

            # check if the lookup value fall with the current value and next value
            # if so set range_found to true, end loop, select those value, else update error report that range not found
            if (compare_value >= value and next_value >= compare_value):
                range_found = True
                break
    if range_found:
        # calculate the multiplier value from the constant boundaries
        left_hand_side = (compare_value - value) / (next_value - value)
        # get the upper and lower bound for the variable boundaries
        lower_upper_bound = zip(selected_df[pos, var_index + 1:], selected_df[pos + 1, var_index + 1:])

        # loop through the variable boundaries
        for lateral_pos, limits in enumerate(lower_upper_bound):
            select_rows = np.argwhere((df[:, linetype_index] == 1) & (df[:, sequence_index] == 1)).flatten()
            criterion = df[select_rows, var_index + 1 + lateral_pos][0]
            # if the criteria is N interpolate between the variable boundaries and update the lookup line
            if criterion == 'N':
                input_value = round(((float(limits[1]) - float(limits[0])) * left_hand_side) + float(limits[0]), 4)
                # update first line (does not really matter which line is updated, just a placeholder)
                selected_df[0, var_index + 1 + lateral_pos] = str(input_value)
        # select only first line and convert to 2D array to fit format
        selected_df = selected_df[0, :].reshape(1, selected_df.shape[1])
    # appropriate range is not found zero out all numeric values and add error report
    else:
        if not (selected_df.shape[0] == 1 and compare_value == float(selected_df[0, var_index])):
            for lateral_pos in range(len(selected_df[0, var_index + 1:])):
                select_rows = np.argwhere((df[:, linetype_index] == 1) & (df[:, sequence_index] == 1)).flatten()
                criterion = df[select_rows, var_index + 1 + lateral_pos][0]
                if criterion == 'N':
                    selected_df[0, var_index + 1 + lateral_pos] = '0'
            selected_df = selected_df[0, :].reshape(1, selected_df.shape[1])
            message = format_error_msg(ErrorMsgEnum.lookup_interpolation_error.value, table_name)
            log_report.log_error(message=message,
                                 scenario=scenario,
                                 well=property_id,
                                 model=ErrorMsgEnum.lookup.value,
                                 severity=ErrorMsgSeverityEnum.warn.value)
    return selected_df, table_name


def process_lookup_ratio_criterion(matched_key, value_selected_arlookup_df, selected_arlookup_df, var_index,
                                   linetype_index, sequence_index, lookup_table_model_name, property_id, scenario,
                                   at_symbol_mapping_dic, custom_table_dict):
    ratio = float(fetch_value(matched_key, property_id, at_symbol_mapping_dic, custom_table_dict, lookup=True)) / float(
        value_selected_arlookup_df[0, var_index])
    for pos, value in enumerate(value_selected_arlookup_df[0, var_index + 1:]):
        criterion = selected_arlookup_df[np.argwhere(((selected_arlookup_df[:, linetype_index] == 1) &
                                                      (selected_arlookup_df[:, sequence_index] == 1))).flatten(),
                                         var_index + 1 + pos][0]
        # only apply ratio to Numerical value
        if criterion == 'N':
            try:
                value = float(value) * ratio
            except ValueError:
                pass
            value_selected_arlookup_df[0, var_index + 1 + pos] = str(value)
    lookup_table_model_name = update_lookup_table_name(lookup_table_model_name, ratio, criterion)

    return value_selected_arlookup_df, lookup_table_model_name


def fill_missing_values_on_lookup_rows(selected_arlookup_df, value_selected_arlookup_df, columns, var_index):
    selected_arlookup_df = np.transpose(selected_arlookup_df)
    for i in range(selected_arlookup_df.shape[1]):
        question_mark_ls_index = np.array(columns)[np.argwhere(selected_arlookup_df[:, i] == '?').flatten()]
        for question_mark_index in question_mark_ls_index:
            selected_arlookup_df[columns.index(question_mark_index), i] = value_selected_arlookup_df[0, var_index]
            if var_index < (len(columns) - 1):
                var_index += 1

    selected_arlookup_df = np.transpose(selected_arlookup_df)

    return selected_arlookup_df, var_index


def filter_lookup_df(selected_arlookup_df, columns):
    linetype_index = columns.index('LINETYPE')
    selected_arlookup_df = selected_arlookup_df[np.argwhere(selected_arlookup_df[:, linetype_index] == 0).flatten(), :]
    return selected_arlookup_df, linetype_index


def preprocess_lookup_df(selected_arlookup_df, economic_df, columns, index, lookup_table_model_name, lookup_indices,
                         well_indices):

    name_index, sequence_index, linetype_index = lookup_indices
    propnum_index, section_index, sequence_economic_index, qualifier_index = well_indices

    selected_arlookup_df = np.delete(selected_arlookup_df, [name_index, linetype_index, sequence_index], axis=1)
    columns.remove('NAME')
    columns.remove('LINETYPE')
    columns.remove('SEQUENCE')
    columns += ['PROPNUM', 'SECTION', 'SEQUENCE', 'QUALIFIER']
    qualifier = get_proper_qualifier_for_add_ons(economic_df, index, section_index, qualifier_index,
                                                 lookup_table_model_name)
    selected_arlookup_df = np.c_[selected_arlookup_df,
                                 np.repeat(economic_df[index, propnum_index], selected_arlookup_df.shape[0])]
    selected_arlookup_df = np.c_[selected_arlookup_df,
                                 np.repeat(economic_df[index, section_index], selected_arlookup_df.shape[0])]
    selected_arlookup_df = np.c_[selected_arlookup_df,
                                 np.repeat(economic_df[index, sequence_economic_index], selected_arlookup_df.shape[0])]
    selected_arlookup_df = np.c_[selected_arlookup_df, np.repeat(qualifier, selected_arlookup_df.shape[0])]

    # 8 variables are used for keyword(0) and expression(1-7)
    n_var = 8
    for i in range(n_var):
        try:
            var_col_name = 'VAR' + str(i)
            var_index = columns.index(var_col_name)
            selected_arlookup_df[:, var_index] = selected_arlookup_df[:, var_index].astype(str)
        except (ValueError, IndexError):
            pass

    return selected_arlookup_df


def create_expression_columns_in_lookup_df(selected_arlookup_df, columns):
    try:
        var1_index = columns.index('VAR1')
        expression_col = [selected_arlookup_df[j, var1_index] + ' ' for j in range(selected_arlookup_df.shape[0])]
        n_var = 8
        for i in range(2, n_var):
            var_col_name = 'VAR' + str(i)
            var_index = columns.index(var_col_name)
            expression_col = [
                expression_col[j] + selected_arlookup_df[j, var_index] + ' ' for j in range(len(expression_col))
            ]
    except (KeyError, ValueError, IndexError):
        pass

    expression_col = [str(expression).strip() for expression in expression_col]
    selected_arlookup_df = np.c_[selected_arlookup_df, np.array(expression_col)]
    columns.append('EXPRESSION')
    var0_index = columns.index('VAR0')
    columns[var0_index] = 'KEYWORD'

    return selected_arlookup_df


def filter_for_lookup_columns_to_match_econ(selected_arlookup_df, columns, header_cols):
    sel_index = []
    for i in range(len(header_cols)):
        for j in range(len(columns)):
            if columns[j] == header_cols[i]:
                sel_index.append(j)
                break
    selected_arlookup_df = selected_arlookup_df[:, sel_index]

    return selected_arlookup_df


def link_lookup_sequence_to_econ_sequence(selected_arlookup_df, economic_df, index, header_cols):
    sequence_index = header_cols.index('SEQUENCE')
    selected_arlookup_df = np.c_[selected_arlookup_df, selected_arlookup_df[:, sequence_index]]
    selected_arlookup_df[:, sequence_index] = [economic_df[index, sequence_index]] * selected_arlookup_df.shape[0]

    return selected_arlookup_df


def remove_duplicate_lookup(df, index, header_cols):
    expression_index = header_cols.index(EconHeaderEnum.expression.value)
    check_list = []
    non_duplicate_lookup_df = []
    for i in range(df.shape[0]):
        if df[i, index] == EconEnum.lookup.value:
            if df[i, expression_index] in check_list:
                continue
            check_list.append(df[i, expression_index])
        non_duplicate_lookup_df.append(list(df[i, :]))
    return np.array(non_duplicate_lookup_df, dtype='object')
