import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import (convert_array_column_dtype_to_int, fetch_value,
                                                           get_header_index, str_join)
from api.aries_phdwin_imports.helpers import check_for_required_cols

from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.process.process import (
    process_and_store_cc_elt_doc_for_lookup)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.format import (
    create_expression_columns_in_lookup_df, fill_missing_values_on_lookup_rows, filter_lookup_df,
    filter_for_lookup_columns_to_match_econ, link_lookup_sequence_to_econ_sequence, preprocess_lookup_df,
    process_lookup_interpolation_criterion, process_lookup_ratio_criterion)

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.helpers import (
    clean_match_column, clean_match_value, ECON_COLS, LOOKUP_REQUIRED_COLS, rollback_lookup, update_lookup_table_name)

from ...elt.shared.tracker import create_tracker_row

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg

from combocurve.shared.aries_import_enums import EconHeaderEnum


def add(  # noqa(c901)
        aries_extract, economic_df, header_cols, property_id, scenario, ls_scenarios_id, elt_data_dict):
    '''
    add ARLOOKUP expression to economic_df
    '''
    def get_value_selected_arlookup_df(selected_arlookup_df, expression_ls, linetype_index, sequence_index,
                                       lookup_table_model_name):

        var_index = 3
        value_selected_arlookup_df = np.copy(selected_arlookup_df)
        for matched_key in expression_ls[1:]:
            criterion = selected_arlookup_df[np.argwhere(((selected_arlookup_df[:, linetype_index] == 1) &
                                                          (selected_arlookup_df[:, sequence_index] == 1))).flatten(),
                                             var_index][0]

            # check for matches in lookup table
            if criterion == 'M':
                match_value = str(
                    fetch_value(matched_key,
                                property_id,
                                aries_extract.at_symbol_mapping_dic,
                                aries_extract.CUSTOM_TABLE_dict,
                                lookup=True)).strip().upper()
                match_value = clean_match_value(match_value)
                match_column = clean_match_column(value_selected_arlookup_df[:, var_index])
                if len(np.argwhere(match_column == match_value).flatten()) != 0 or np.array_equiv(
                        value_selected_arlookup_df, selected_arlookup_df):
                    value_selected_arlookup_df = value_selected_arlookup_df[np.argwhere(
                        match_column == match_value).flatten()]
                lookup_table_model_name = update_lookup_table_name(lookup_table_model_name, match_value, criterion)
                var_index += 1
            # check for ratios in lookup table and multiply ratio by lookup value
            elif criterion == 'R':
                value_selected_arlookup_df, lookup_table_model_name = process_lookup_ratio_criterion(
                    matched_key, value_selected_arlookup_df, selected_arlookup_df, var_index, linetype_index,
                    sequence_index, lookup_table_model_name, property_id, scenario, aries_extract.at_symbol_mapping_dic,
                    aries_extract.CUSTOM_TABLE_dict)
                var_index += 1
            elif criterion == 'I':
                # process lookup interpolation
                value_selected_arlookup_df, lookup_table_model_name = process_lookup_interpolation_criterion(
                    matched_key, value_selected_arlookup_df, selected_arlookup_df, var_index, linetype_index,
                    sequence_index, lookup_table_model_name, property_id, scenario, aries_extract.at_symbol_mapping_dic,
                    aries_extract.CUSTOM_TABLE_dict, aries_extract.log_report)
                var_index += 1
            elif criterion == 'P':
                var_index += 1
        return value_selected_arlookup_df, lookup_table_model_name, var_index

    (propnum_index, section_index, sequence_economic_index, qualifier_index, keyword_index,
     expression_index) = get_header_index(ECON_COLS, header_cols)

    ls_index = list(np.argwhere(economic_df[:, keyword_index] == 'LOOKUP').flatten())

    arlookup_df_array = np.array(aries_extract.ARLOOKUP_df)
    lookup_header_cols = aries_extract.ARLOOKUP_df.columns

    lookup_header_cols = [str(header).upper() for header in lookup_header_cols]
    column_correct, problem_column = check_for_required_cols(lookup_header_cols, LOOKUP_REQUIRED_COLS)
    if not column_correct:
        message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column, ErrorMsgEnum.ar_lookup.value)
        aries_extract.log_report.log_error(aries_row=tuple(lookup_header_cols),
                                           message=message,
                                           severity=ErrorMsgSeverityEnum.error.value)

    name_index, linetype_index, sequence_index, owner_index = get_header_index(LOOKUP_REQUIRED_COLS, lookup_header_cols)
    count = 0
    index_distance = 0

    for index in ls_index:
        columns = lookup_header_cols[:]
        index += index_distance
        expression_ls = str(economic_df[index, expression_index]).split(' ')
        lookup_table_name = fetch_value(expression_ls[0], property_id, aries_extract.at_symbol_mapping_dic,
                                        aries_extract.CUSTOM_TABLE_dict)
        lookup_table_model_name = f'LU({lookup_table_name})'
        selected_arlookup_df = arlookup_df_array[np.argwhere(arlookup_df_array[:, 0] == lookup_table_name).flatten(), :]

        selected_arlookup_df = np.delete(selected_arlookup_df, owner_index, axis=1)
        columns.remove('OWNER')
        name_index, linetype_index, sequence_index = get_header_index(
            [EconHeaderEnum.name.value, EconHeaderEnum.linetype.value, EconHeaderEnum.sequence.value], columns)

        sel_index = []
        for i in range(selected_arlookup_df.shape[1]):
            try:
                # check for empty columns (where all columns are 'nan')
                check = np.all(np.isnan(selected_arlookup_df[:, i].astype(float)))
            # if value in column cannot be converted to nan, column is not empty
            except ValueError:
                check = False
            if not check:
                sel_index.append(i)

        # select only index that have values
        selected_arlookup_df = selected_arlookup_df[:, sel_index]
        columns = list(np.array(columns)[sel_index])
        selected_arlookup_df = np.where(selected_arlookup_df.astype(str) == 'nan', '', selected_arlookup_df)

        # update elt processing document if and valid elt dataframe in full dataframe
        # TODO: use dictionary to store list items in lookup dictionary
        location_indices = (name_index, section_index, linetype_index, propnum_index, sequence_index,
                            sequence_economic_index, keyword_index, qualifier_index)

        add_elt = False
        elt_identifier = None
        embedded_start_row = None
        if aries_extract.create_elts:
            try:
                selected_arlookup_df, (add_elt, elt_identifier,
                                       embedded_start_row) = process_and_store_cc_elt_doc_for_lookup(
                                           aries_extract, economic_df, elt_data_dict, header_cols, selected_arlookup_df,
                                           columns, index, location_indices, expression_ls, property_id, scenario,
                                           ls_scenarios_id)
            except Exception:
                aries_extract.log_report.log_error(message=ErrorMsgEnum.elt_lookup_error.value,
                                                   scenario=scenario,
                                                   well=property_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)

        if selected_arlookup_df is None or selected_arlookup_df.size == 0:
            economic_df, index_distance = rollback_lookup(economic_df,
                                                          index,
                                                          index_distance,
                                                          elt=add_elt,
                                                          elt_identifier=elt_identifier,
                                                          elt_start_row=embedded_start_row,
                                                          indices=(keyword_index, expression_index))
            continue
        try:
            value_selected_arlookup_df, lookup_table_model_name, var_index = get_value_selected_arlookup_df(
                selected_arlookup_df, expression_ls, linetype_index, sequence_index, lookup_table_name)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(expression_ls))
            aries_extract.log_report.log_error(message=message,
                                               scenario=scenario,
                                               well=property_id,
                                               model=ErrorMsgEnum.lookup.value,
                                               severity=ErrorMsgSeverityEnum.error.value)

        if value_selected_arlookup_df.size == 0:
            economic_df, index_distance = rollback_lookup(economic_df,
                                                          index,
                                                          index_distance,
                                                          elt=add_elt,
                                                          elt_identifier=elt_identifier,
                                                          elt_start_row=embedded_start_row,
                                                          indices=(keyword_index, expression_index))
            continue

        selected_arlookup_df, var_index = fill_missing_values_on_lookup_rows(selected_arlookup_df,
                                                                             value_selected_arlookup_df, columns,
                                                                             var_index)

        selected_arlookup_df, linetype_index = filter_lookup_df(selected_arlookup_df, columns)

        if selected_arlookup_df.size != 0:
            index_distance += (selected_arlookup_df.shape[0] - 1)

            selected_arlookup_df = preprocess_lookup_df(
                selected_arlookup_df, economic_df, columns, index, lookup_table_model_name,
                (name_index, sequence_index, linetype_index),
                (propnum_index, section_index, sequence_economic_index, qualifier_index))

            # first variable (0) does not form expression
            selected_arlookup_df = create_expression_columns_in_lookup_df(selected_arlookup_df, columns)

            selected_arlookup_df = filter_for_lookup_columns_to_match_econ(selected_arlookup_df, columns, header_cols)

            selected_arlookup_df = link_lookup_sequence_to_econ_sequence(selected_arlookup_df, economic_df, index,
                                                                         header_cols)

            try:
                if add_elt:
                    tracker_row, index_distance = create_tracker_row(index_distance, (keyword_index, expression_index),
                                                                     elt_identifier, economic_df)
                    if embedded_start_row is not None:
                        index_distance += 1
                        economic_df = np.concatenate((economic_df[:index, :], embedded_start_row, tracker_row,
                                                      selected_arlookup_df, economic_df[index + 1:, :]),
                                                     axis=0)
                    else:
                        economic_df = np.concatenate(
                            (economic_df[:index, :], tracker_row, selected_arlookup_df, economic_df[index + 1:, :]),
                            axis=0)
                else:
                    economic_df = np.concatenate(
                        (economic_df[:index, :], selected_arlookup_df, economic_df[index + 1:, :]), axis=0)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.lookup1_msg.value, lookup_table_name)
                aries_extract.log_report.log_error(message=message,
                                                   scenario=scenario,
                                                   well=property_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)

        else:
            economic_df, index_distance = rollback_lookup(economic_df,
                                                          index,
                                                          index_distance,
                                                          elt=False,
                                                          elt_start_row=embedded_start_row,
                                                          elt_identifier=None,
                                                          indices=(keyword_index, expression_index))

        count += 1
        economic_df = convert_array_column_dtype_to_int(economic_df, section_index, initial=True)
    return economic_df
