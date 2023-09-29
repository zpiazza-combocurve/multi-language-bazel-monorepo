import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import fetch_value

from ...general.lookup.helpers import clean_match_column, get_criterion_and_column_name

from ...general.lookup.format import (create_expression_columns_in_lookup_df, fill_missing_values_on_lookup_rows,
                                      filter_lookup_df, filter_for_lookup_columns_to_match_econ,
                                      link_lookup_sequence_to_econ_sequence, preprocess_lookup_df,
                                      process_lookup_interpolation_criterion, process_lookup_ratio_criterion)

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum


def add_last_start_row_to_elt_df(elt_file, df, embedded_start_date, economic_index, keyword_index, lookup=False):

    try:
        embedded_start_date = next(elt_file[i, :] for i in range(elt_file.shape[0] - 1, -1, -1)
                                   if elt_file[i, keyword_index] == 'START')
    except StopIteration:
        pass

    for i in range(economic_index - 1, -1, -1):
        if df[i, keyword_index] == 'START':
            return np.concatenate((df[i, :].reshape(1, -1), elt_file), axis=0), embedded_start_date
    return elt_file, embedded_start_date


def split_elt_from_sidefile(aries_extract, property_id, scenario, selected_ar_sidefile, section, keyword_index):
    is_elt = False
    elt_type, elt_file = None, None
    new_selected_ar_sidefile = selected_ar_sidefile

    try:
        formated_section = int(float(section))
    except (ValueError, TypeError):
        formated_section = None

    if formated_section == 6:
        mask = create_removal_mask_for_decoupling_elt(
            selected_ar_sidefile[:, keyword_index],
            removed_items=['ATX', 'STX', 'STD', 'S/61', 'S/63', 'ABAN', 'PLUG', 'SALV'])
        if any(mask):
            elt_type = 'expenses'
            elt_file = selected_ar_sidefile[mask]
            nested_elt = is_elt_nested(elt_file, keyword_index)

            if nested_elt or all(elt_file[:, keyword_index] == 'START'):
                if nested_elt:
                    log_nested_error(aries_extract, property_id, scenario)
                return new_selected_ar_sidefile, None, False, None
            new_selected_ar_sidefile = selected_ar_sidefile[[not elem for elem in mask]]
            is_elt = True
    elif formated_section == 8:
        elt_type = 'capex'
        elt_file = selected_ar_sidefile
        nested_elt = is_elt_nested(elt_file, keyword_index)
        if nested_elt or all(elt_file[:, keyword_index] == 'START'):
            if nested_elt:
                log_nested_error(aries_extract, property_id, scenario)
            return new_selected_ar_sidefile, None, False, None
        new_selected_ar_sidefile = None
        is_elt = True

    return new_selected_ar_sidefile, elt_file, is_elt, elt_type


def create_removal_mask_for_decoupling_elt(keywords, removed_items=[]):
    delete = False
    mask = []
    for keyword in keywords:
        if delete and (keyword == '"' or any(item in keyword for item in removed_items)):
            mask.append(False)
        elif any(item in keyword for item in removed_items):
            mask.append(False)
            delete = True
        else:
            delete = False
            mask.append(True)
    return mask


def split_valid_elt_df_from_lookup(aries_extract, selected_arlookup_df, lookup_section, line_type_index, sequence_index,
                                   property_id, scenario):
    rollback_selected_ar_lookup_df = np.copy(selected_arlookup_df)
    new_arlookup_df = selected_arlookup_df
    elt_arlookup_df = None
    if lookup_section == 6:
        lookup_econ_df, lookup_criteria_df, lookup_value_df = split_lookup_df(selected_arlookup_df, line_type_index)
        split_index = get_split_index(lookup_criteria_df, sequence_index)
        new_arlookup_df, elt_arlookup_df = decouple_lookups_for_elt(
            lookup_econ_df,
            lookup_criteria_df,
            lookup_value_df,
            split_index,
            removed_items=['ATX', 'STX', 'STD', 'S/61', 'S/63', 'ABAN', 'PLUG', 'SALV'])
        is_valid = get_lookup_validity(aries_extract, property_id, scenario,
                                       elt_arlookup_df[elt_arlookup_df[:, line_type_index] == 0])
        if not is_valid:
            elt_arlookup_df = None
            new_arlookup_df = rollback_selected_ar_lookup_df
    elif lookup_section == 8:
        elt_arlookup_df = new_arlookup_df
        new_arlookup_df = None
        # Capex can lookup any value
        is_valid = get_lookup_validity(aries_extract,
                                       property_id,
                                       scenario,
                                       elt_arlookup_df[elt_arlookup_df[:, line_type_index] == 0],
                                       capex=True)
        if not is_valid:
            elt_arlookup_df = None
            new_arlookup_df = rollback_selected_ar_lookup_df

    return new_arlookup_df, elt_arlookup_df


def decouple_lookups_for_elt(table_array, criteria_array, value_array, split_index, removed_items=[]):
    question_mark_counts, start_indices = find_appropriate_lookup_rows_for_elt(table_array, removed_items)

    table_array_1, table_array_2 = split_lookup_table_row_wise(table_array, question_mark_counts, start_indices)

    value_array_1, criteria_array_1, value_array_2, criteria_array_2 = split_value_array_column_wise(
        value_array, criteria_array, split_index, question_mark_counts, start_indices)

    to_use_lookup_df, elt_lookup_df = np.concatenate((table_array_1, criteria_array_1, value_array_1),
                                                     axis=0), np.concatenate(
                                                         (table_array_2, criteria_array_2, value_array_2), axis=0)

    return to_use_lookup_df, elt_lookup_df


def find_appropriate_lookup_rows_for_elt(table_array, items_to_remove):
    result = []
    # identify the index of all rows that have '?'
    question_marks = np.where(table_array == '?')[0]

    # loop through each row
    remove_streak = False
    start_indices = []
    for i, row in enumerate(table_array):
        keyword = row[3]
        # check if keyword is invalid and should be decoupled
        if keyword == 'START':
            count_question_marks = list(np.where(question_marks == i)[0])
            if len(count_question_marks) > 0:
                start_indices.append([i, count_question_marks])
            else:
                start_indices.append([i, None])

        if any(item in keyword for item in items_to_remove) or (remove_streak and keyword == '"'):
            remove_streak = True
            # check for '?' in row
            count_question_marks = list(np.where(question_marks == i)[0])
            # if at least 1 '?' in row
            if len(count_question_marks) > 0:
                result.append([i, count_question_marks])
            else:
                result.append([i, None])
        else:
            remove_streak = False

    return result, start_indices


def split_value_array_column_wise(value_array, criteria_array, split_index, question_mark_counts, start_indices):
    array_1_indices, array_2_indices = [], []
    all_question_mark_loc = [
        item + split_index for row in question_mark_counts if row[1] is not None for item in row[1]
    ]

    start_question_mark_loc = [item + split_index for row in start_indices if row[1] is not None for item in row[1]]

    array_width = value_array.shape[1]
    for index in range(array_width):
        if index < split_index:
            array_1_indices.append(index)
            array_2_indices.append(index)

        else:
            if index in all_question_mark_loc:
                array_1_indices.append(index)
            else:
                array_2_indices.append(index)
                if index in start_question_mark_loc:
                    array_1_indices.append(index)

    value_array_1, value_array_2 = create_valid_split_array_from_indices(value_array, array_1_indices, array_2_indices,
                                                                         array_width)
    criteria_array_1, criteria_array_2 = create_valid_split_array_from_indices(criteria_array, array_1_indices,
                                                                               array_2_indices, array_width)

    return value_array_1, criteria_array_1, value_array_2, criteria_array_2


def split_lookup_table_row_wise(table_array, question_mark_counts, start_indices):
    if len(question_mark_counts) == 0:
        array_1 = np.empty((0, table_array.shape[1]), dtype=table_array.dtype)
        array_2 = table_array
    else:
        rows_to_keep = [x[0] for x in question_mark_counts]
        start_rows_to_keep = [x[0] for x in start_indices]
        all_rows_to_keep = (start_rows_to_keep + rows_to_keep)
        all_rows_to_keep.sort()
        array_1 = table_array[all_rows_to_keep]
        array_2 = np.delete(table_array, rows_to_keep, axis=0)
    return array_1, array_2


def create_valid_split_array_from_indices(array, array_1_indices, array_2_indices, array_width):
    compliment_array_1 = create_column_fill_in_for_split_elt(len(array_1_indices), array_width, array.shape[0])
    compliment_array_2 = create_column_fill_in_for_split_elt(len(array_2_indices), array_width, array.shape[0])
    array_1 = np.c_[array[:, array_1_indices], compliment_array_1]
    array_2 = np.c_[array[:, array_2_indices], compliment_array_2]

    return array_1, array_2


def create_column_fill_in_for_split_elt(created_array_width, full_array_width, array_length):
    compliment = full_array_width - created_array_width
    compliment_array = np.zeros((array_length, compliment), dtype='object')
    compliment_array[:] = '"'

    return compliment_array


def split_lookup_df(df, index):
    econ_df = df[df[:, index] == 0]
    criteria_df = df[df[:, index] == 1]
    value_df = df[df[:, index] == 3]

    return econ_df, criteria_df, value_df


def get_split_index(df, index):
    split_index = 3
    criterias = df[df[:, index] == 1].flatten()[split_index:]
    for criteria in criterias:
        criteria = str(criteria).strip()
        if criteria not in ['M', 'R', 'I', 'P']:
            return split_index
        split_index += 1
    return split_index


def get_lookup_validity(aries_extract, property_id, scenario, core_lookup_df, capex=False):
    """
        Determines whether a given core lookup dataframe is valid.

        Args:
            core_lookup_df (numpy array): The core lookup dataframe to be checked for validity.
            capex (bool, optional): Indicates whether the lookup is for capital expenditure (capex) or not.
                Defaults to False.

            The function takes in a core_lookup_df numpy array and an optional boolean parameter capex
            (default is False).
            It determines whether the given DataFrame is valid or not based on certain criteria.

            If capex is False, the function checks each row of the array to ensure that any additional criteria
            specified in columns 8 and beyond are not set to '?'. If it finds a '?' in any of these additional criteria,
            it returns False.

            If the DataFrame contains any of the keywords 'SIDEFILE', 'LOOKUP', or 'FILE' in column 3,
            the function returns False.

            If none of the above criteria are met, the function returns True.

        Returns:
            bool: True if the core lookup dataframe is valid, False otherwise.
    """

    if all(core_lookup_df[:, 3] == 'START'):
        return False

    if not capex:
        for core_lookup_row in core_lookup_df:
            if len(core_lookup_row) > 4 and core_lookup_row[3] == 'START' and core_lookup_row[4] == '?':
                aries_extract.log_report.log_error(message=ErrorMsgEnum.lookup_position_error.value,
                                                   scenario=scenario,
                                                   well=property_id,
                                                   severity=ErrorMsgSeverityEnum.warn.value)
                return False
            if len(core_lookup_row) > 7:
                for item in core_lookup_row[7:]:
                    if item == '?':
                        aries_extract.log_report.log_error(message=ErrorMsgEnum.lookup_position_error.value,
                                                           scenario=scenario,
                                                           well=property_id,
                                                           severity=ErrorMsgSeverityEnum.warn.value)
                        return False

    elt_nested = is_elt_nested(core_lookup_df, 3)
    if elt_nested:
        log_nested_error(aries_extract, property_id, scenario)
        return False
    return True


##########
def log_nested_error(aries_extract, property_id, scenario):
    aries_extract.log_report.log_error(message=ErrorMsgEnum.elt_nested.value,
                                       scenario=scenario,
                                       well=property_id,
                                       severity=ErrorMsgSeverityEnum.error.value)


def get_elt_type(section):
    if section == 6:
        elt_type = 'expenses'
    elif section == 8:
        elt_type = 'capex'
    else:
        elt_type = None

    return elt_type


def get_all_lookup_configurations(aries_extract, economic_df, lookup_df, elt_data_dict, expression_ls, columns,
                                  header_cols, index, lookup_indices, well_econ_indices, section, property_id, scenario,
                                  ls_scenarios_id):

    elt_type = get_elt_type(section)

    _, _, linetype_index = lookup_indices

    value_lookup_df = lookup_df[lookup_df[:, linetype_index] == 3]
    lookup_name = expression_ls[0]
    all_lookup_data = []
    all_criteria_data = []

    embedded_lookup_start_date = None
    for i in range(value_lookup_df.shape[0]):
        case_columns = columns[:]
        case_header_cols = header_cols[:]
        lookup_data = np.copy(lookup_df)
        criteria_data = []

        value_selected_arlookup_df, var_index, restricted_criterion_count = get_value_lookup_df_by_criterion(
            aries_extract, lookup_df, value_lookup_df, criteria_data, expression_ls, property_id, scenario, i,
            lookup_indices)

        max_criterion_count = 1
        if restricted_criterion_count > max_criterion_count:
            return False, None, None

        lookup_data, embedded_lookup_start_date = convert_lookup_data_to_econ_df_format(
            lookup_data, value_selected_arlookup_df, economic_df, var_index, case_columns, case_header_cols, index,
            well_econ_indices, lookup_indices, embedded_lookup_start_date)

        all_lookup_data.append(lookup_data)
        if criteria_data is not None:
            criteria_data.append(value_selected_arlookup_df)
            all_criteria_data.append(criteria_data)
        else:
            all_criteria_data.append(None)

    well_identifier = None
    if len(all_lookup_data) > 0 and elt_type is not None:
        well_identifier = (ls_scenarios_id[-1], property_id, lookup_name)
        elt_data_dict[well_identifier] = {
            'data': all_lookup_data,
            'headers': case_header_cols,
            'lookup_data': all_criteria_data,
            'type': elt_type,
            'case_index': get_index_of_lookup_case(all_criteria_data)
        }

    return True, well_identifier, embedded_lookup_start_date


def get_index_of_lookup_case(criteria_data_ls):
    """
    Returns the index of the first occurrence in the given list `criteria_data_ls` where all the values in the
    `'current'` and `'variable'` keys of each criteria are the same.

    Parameters:
        criteria_data_ls (list): A list of dictionaries representing criteria data. Each dictionary contains the
            keys `'current'` and `'variable'`, with corresponding values representing the current and variable
            criteria, respectively.

    Returns:
        int or None: The index of the first occurrence where all the values in the `'current'` and `'variable'`
        keys of each criteria are the same, or `None` if no match is found.

    Example:
        criteria_data_ls = [
            [{'current': 1, 'variable': 1}, {'current': 'abc', 'variable': 'abc'}, {'current': True, 'variable': True}],
            [{'current': 2, 'variable': 2}, {'current': 'def', 'variable': 'xyz'}, {'current': True, 'variable': True}],
            [{'current': 3, 'variable': 3}, {'current': 'ghi', 'variable': 'ghi'}, {'current': True, 'variable': True}]
        ]
        index = get_index_of_lookup_case(criteria_data_ls)
        print(index)  # Output: 2
    """
    for current_idx, criteria_data in enumerate(criteria_data_ls):
        fixed_criterions, variable_criterions = [], []
        for criteria in criteria_data[:-1]:
            fixed_criterions.append(criteria.get('current'))
            variable_criterions.append(criteria.get('variable'))

        if fixed_criterions == variable_criterions:
            return current_idx


def convert_lookup_data_to_econ_df_format(lookup_data, value_selected_arlookup_df, economic_df, var_index, case_columns,
                                          case_header_cols, index, well_econ_indices, lookup_indices,
                                          embedded_lookup_start_date):

    (propnum_index, section_index, keyword_index, sequence_economic_index, qualifier_index) = well_econ_indices
    preprocess_econ_indices = (propnum_index, section_index, sequence_economic_index, qualifier_index)

    if value_selected_arlookup_df.size == 0:
        return None, None

    lookup_data, var_index = fill_missing_values_on_lookup_rows(lookup_data, value_selected_arlookup_df, case_columns,
                                                                var_index)

    lookup_data, _ = filter_lookup_df(lookup_data, case_columns)

    if lookup_data.size == 0:
        return None, None

    lookup_data = preprocess_lookup_df(lookup_data, economic_df, case_columns, index, '', lookup_indices,
                                       preprocess_econ_indices)

    lookup_data = create_expression_columns_in_lookup_df(lookup_data, case_columns)

    lookup_data = filter_for_lookup_columns_to_match_econ(lookup_data, case_columns, case_header_cols)

    lookup_data = link_lookup_sequence_to_econ_sequence(lookup_data, economic_df, index, case_header_cols)

    lookup_data, embedded_lookup_start_date = add_last_start_row_to_elt_df(lookup_data, economic_df,
                                                                           embedded_lookup_start_date, index,
                                                                           keyword_index)

    return lookup_data, embedded_lookup_start_date


def get_value_lookup_df_by_criterion(aries_extract, lookup_df, value_lookup_df, criteria_data, expression_ls,
                                     property_id, scenario, i, lookup_indices):
    _, sequence_index, linetype_index = lookup_indices
    value_selected_arlookup_df = np.copy(lookup_df)
    var_index = 3
    restricted_criterion_count = 0
    for matched_key in expression_ls[1:]:
        extracted_key = value_lookup_df[i, var_index]
        match_value = str(
            fetch_value(matched_key,
                        property_id,
                        aries_extract.at_symbol_mapping_dic,
                        aries_extract.CUSTOM_TABLE_dict,
                        lookup=True)).strip().upper()

        criterion, column_name = get_criterion_and_column_name(lookup_df, linetype_index, sequence_index, var_index)

        if criterion == 'M':
            match_column = clean_match_column(value_selected_arlookup_df[:, var_index])
            value_selected_arlookup_df = value_selected_arlookup_df[np.argwhere(
                match_column == extracted_key).flatten()]
            update_criteria_ls_with_doc(criteria_data, criterion, extracted_key, match_value, column_name)
            var_index += 1
        elif criterion == 'R':
            value_selected_arlookup_df, lookup_table_model_name = process_lookup_ratio_criterion(
                matched_key, value_selected_arlookup_df, lookup_df, var_index, linetype_index, sequence_index, '',
                property_id, scenario, aries_extract.at_symbol_mapping_dic, aries_extract.CUSTOM_TABLE_dict)
            update_criteria_ls_with_doc(criteria_data, criterion, extracted_key, match_value, column_name)
            var_index += 1
            restricted_criterion_count += 1
        elif criterion == 'I':
            value_selected_arlookup_df, lookup_table_model_name = process_lookup_interpolation_criterion(
                matched_key, value_selected_arlookup_df, lookup_df, var_index, linetype_index, sequence_index, '',
                property_id, scenario, aries_extract.at_symbol_mapping_dic, aries_extract.CUSTOM_TABLE_dict,
                aries_extract.log_report)
            update_criteria_ls_with_doc(criteria_data, criterion, extracted_key, match_value, column_name)
            var_index += 1
            restricted_criterion_count += 2
        elif criterion == 'P':
            pass

    return value_selected_arlookup_df, var_index, restricted_criterion_count


def update_criteria_ls_with_doc(criteria_data, criterion, extracted_key, match_value, column_name):
    criteria_data.append(create_elt_criteria_document(criterion, extracted_key, match_value, column_name))


def create_elt_criteria_document(criterion, variable_lookup, current_lookup, column_name):
    return {'criterion': criterion, 'variable': variable_lookup, 'current': current_lookup, 'column_name': column_name}


def is_elt_nested(elt_df, keyword_index):
    nested = any(unaccepted_keyword in elt_df[:, keyword_index]
                 for unaccepted_keyword in ['SIDEFILE', 'LOOKUP', 'FILE'])

    return nested
