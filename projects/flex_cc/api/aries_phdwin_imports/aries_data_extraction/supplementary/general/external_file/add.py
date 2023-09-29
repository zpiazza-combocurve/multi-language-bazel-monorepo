import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import (convert_array_column_dtype_to_int, fetch_value,
                                                           get_header_index)
from api.aries_phdwin_imports.helpers import check_for_required_cols, ECON_COLS, str_join

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.helpers import (
    get_proper_qualifier_for_add_ons)

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.helpers import (
    clean_match_column, clean_match_value, LOOKUP_REQUIRED_COLS, update_lookup_table_name)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.format import (
    process_lookup_interpolation_criterion)

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.sidefile.helpers import SIDEFILE_REQUIRED_COLS

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.external_file.helpers import (
    process_external_file_as_lookup, process_external_file_as_sidefile)


def add(aries_extract, economic_df, header_cols, property_id, scenario):  # noqa (C901)
    '''
    add AC_SIDEFILE expression to economic_df
    '''
    (propnum_index, section_index, sequence_economic_index, qualifier_index, keyword_index,
     expression_index) = get_header_index(ECON_COLS, header_cols)

    # get rows where keyword is SIDEFILE
    ls_index = list(np.argwhere(economic_df[:, keyword_index] == 'FILE').flatten())

    index_distance = 0
    for index in ls_index:
        index += index_distance
        # expression line with more than item shows that external file should be treated as lookup
        if len(economic_df[index, expression_index].split(' ')) > 1:
            external_header_cols = [
                'NAME', 'LINETYPE', 'SEQUENCE', 'VAR0', 'VAR1', 'VAR2', 'VAR3', 'VAR4', 'VAR5', 'VAR6', 'VAR7', 'OWNER'
            ]
            columns = external_header_cols[:]
            column_correct, problem_column = check_for_required_cols(external_header_cols, LOOKUP_REQUIRED_COLS)
            if not column_correct:
                message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column,
                                           ErrorMsgEnum.external_file.value)
                aries_extract.log_report.log_error(aries_row=tuple(external_header_cols),
                                                   message=message,
                                                   severity=ErrorMsgSeverityEnum.error.value)

            name_index, linetype_index, sequence_index, owner_index = get_header_index(
                LOOKUP_REQUIRED_COLS, external_header_cols)
            expression_ls = str(economic_df[index, expression_index]).split(' ')
            lookup_table_name = expression_ls[0].rstrip('.A')
            lookup_table_model_name = f'LU({lookup_table_name})'
            if lookup_table_name in aries_extract.external_file_dict:
                selected_ar_file_df = process_external_file_as_lookup(
                    aries_extract.external_file_dict[lookup_table_name])
                selected_ar_file_df = np.delete(selected_ar_file_df, owner_index, axis=1)
                columns.remove('OWNER')

                sel_index = []
                for i in range(selected_ar_file_df.shape[1]):
                    try:
                        # check for empty columns (where all columns are 'nan')
                        check = np.all(np.isnan(selected_ar_file_df[:, i].astype(float)))
                    # if value in column cannot be converted to nan, column is not empty
                    except ValueError:
                        check = False
                    if not check:
                        sel_index.append(i)

                # select only index that have values
                selected_ar_file_df = selected_ar_file_df[:, sel_index]
                columns = list(np.array(columns)[sel_index])
                selected_ar_file_df = np.where(selected_ar_file_df.astype(str) == 'nan', '', selected_ar_file_df)
                var_index = 3
                value_selected_ar_file_df = np.copy(selected_ar_file_df)

                try:
                    for matched_key in expression_ls[1:]:
                        criterion = selected_ar_file_df[np.argwhere(
                            ((selected_ar_file_df[:, linetype_index] == 1) &
                             (selected_ar_file_df[:, sequence_index] == 1))).flatten(), var_index][0]

                        # check for matches in lookup table
                        if criterion == 'M':
                            match_value = str(
                                fetch_value(matched_key,
                                            property_id,
                                            aries_extract.at_symbol_mapping_dic,
                                            aries_extract.CUSTOM_TABLE_dict,
                                            lookup=True)).strip().upper()
                            match_value = clean_match_value(match_value)
                            lookup_table_model_name = update_lookup_table_name(lookup_table_model_name, match_value,
                                                                               criterion)

                            match_column = clean_match_column(value_selected_ar_file_df[:, var_index])
                            if len(np.argwhere(match_column == match_value).flatten()) != 0 or np.array_equiv(
                                    value_selected_ar_file_df, selected_ar_file_df):
                                value_selected_ar_file_df = value_selected_ar_file_df[np.argwhere(
                                    match_column == match_value).flatten()]
                            var_index += 1
                        # check for ratios in lookup table and multiply ratio by lookup value
                        elif criterion == 'R':
                            ratio = float(
                                fetch_value(matched_key,
                                            property_id,
                                            aries_extract.at_symbol_mapping_dic,
                                            aries_extract.CUSTOM_TABLE_dict,
                                            lookup=True)) / float(value_selected_ar_file_df[0, var_index])
                            lookup_table_model_name = update_lookup_table_name(lookup_table_model_name, ratio,
                                                                               criterion)
                            for pos, value in enumerate(value_selected_ar_file_df[0, var_index + 1:]):
                                criterion = selected_ar_file_df[np.argwhere(
                                    ((selected_ar_file_df[:, linetype_index] == 1) &
                                     (selected_ar_file_df[:, sequence_index] == 1))).flatten(), var_index + 1 + pos]
                                criterion = criterion[0]
                                # only apply ratio to Numerical value
                                if criterion == 'N':
                                    try:
                                        value = float(value) * ratio
                                    except ValueError:
                                        pass
                                    value_selected_ar_file_df[0, var_index + 1 + pos] = str(value)
                            var_index += 1
                        elif criterion == 'I':
                            # process lookup interpolation
                            (value_selected_arlookup_df,
                             lookup_table_model_name) = process_lookup_interpolation_criterion(
                                 matched_key, value_selected_ar_file_df, selected_ar_file_df, var_index, linetype_index,
                                 sequence_index, lookup_table_model_name, property_id, scenario,
                                 aries_extract.at_symbol_mapping_dic, aries_extract.CUSTOM_TABLE_dict,
                                 aries_extract.log_report)
                            var_index += 1

                except Exception:
                    message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(expression_ls))
                    aries_extract.log_report.log_error(message=message,
                                                       scenario=scenario,
                                                       well=property_id,
                                                       model=ErrorMsgEnum.external_file.value,
                                                       severity=ErrorMsgSeverityEnum.error.value)

                if value_selected_ar_file_df.size == 0:
                    continue

                selected_ar_file_df = np.transpose(selected_ar_file_df)
                for i in range(selected_ar_file_df.shape[1]):
                    question_mark_ls_index = np.array(columns)[np.argwhere(selected_ar_file_df[:, i] == '?').flatten()]
                    for question_mark_index in question_mark_ls_index:
                        selected_ar_file_df[columns.index(question_mark_index),
                                            i] = value_selected_ar_file_df[0, var_index]
                        if var_index < (len(columns) - 1):
                            var_index += 1

                selected_ar_file_df = np.transpose(selected_ar_file_df)

                linetype_index = columns.index('LINETYPE')
                selected_ar_file_df = selected_ar_file_df[np.argwhere(
                    selected_ar_file_df[:, linetype_index] == 0).flatten(), :]

                if selected_ar_file_df.size != 0:
                    index_distance += (selected_ar_file_df.shape[0] - 1)

                    selected_ar_file_df = np.delete(selected_ar_file_df, [name_index, linetype_index, sequence_index],
                                                    axis=1)
                    columns.remove('NAME')
                    columns.remove('LINETYPE')
                    columns.remove('SEQUENCE')
                    columns += ['PROPNUM', 'SECTION', 'SEQUENCE', 'QUALIFIER']
                    qualifier = get_proper_qualifier_for_add_ons(economic_df, index, section_index, qualifier_index,
                                                                 lookup_table_model_name)
                    selected_ar_file_df = np.c_[selected_ar_file_df,
                                                np.repeat(economic_df[index,
                                                                      propnum_index], selected_ar_file_df.shape[0])]
                    selected_ar_file_df = np.c_[selected_ar_file_df,
                                                np.repeat(economic_df[index,
                                                                      section_index], selected_ar_file_df.shape[0])]
                    selected_ar_file_df = np.c_[selected_ar_file_df,
                                                np.repeat(economic_df[
                                                    index, sequence_economic_index], selected_ar_file_df.shape[0])]
                    selected_ar_file_df = np.c_[selected_ar_file_df, np.repeat(qualifier, selected_ar_file_df.shape[0])]

                    # 8 variables are used for keyword(0) and expression(1-7)
                    n_var = 8
                    for i in range(n_var):
                        try:
                            var_col_name = 'VAR' + str(i)
                            var_index = columns.index(var_col_name)
                            selected_ar_file_df[:, var_index] = selected_ar_file_df[:, var_index].astype(str)
                        except (ValueError, IndexError):
                            pass

                    # first variable (0) does not form expression
                    try:
                        var1_index = columns.index('VAR1')
                        expression_col = [
                            selected_ar_file_df[j, var1_index] + ' ' for j in range(selected_ar_file_df.shape[0])
                        ]
                        for i in range(2, n_var):
                            var_col_name = 'VAR' + str(i)
                            var_index = columns.index(var_col_name)
                            expression_col = [
                                expression_col[j] + selected_ar_file_df[j, var_index] + ' '
                                for j in range(len(expression_col))
                            ]
                    except (KeyError, ValueError, IndexError):
                        pass

                    expression_col = [str(expression).strip() for expression in expression_col]
                    selected_ar_file_df = np.c_[selected_ar_file_df, np.array(expression_col)]
                    columns.append('EXPRESSION')
                    var0_index = columns.index('VAR0')
                    columns[var0_index] = 'KEYWORD'

                    sel_index = []
                    for i in range(len(header_cols)):
                        for j in range(len(columns)):
                            if columns[j] == header_cols[i]:
                                sel_index.append(j)
                                break
                    selected_ar_file_df = selected_ar_file_df[:, sel_index]
                    sequence_index = header_cols.index('SEQUENCE')
                    selected_ar_file_df = np.c_[selected_ar_file_df, selected_ar_file_df[:, sequence_index]]
                    selected_ar_file_df[:, sequence_index] = [economic_df[index, sequence_index]
                                                              ] * selected_ar_file_df.shape[0]
                    try:
                        economic_df = np.concatenate(
                            (economic_df[:index, :], selected_ar_file_df, economic_df[index + 1:, :]), axis=0)
                    except Exception:
                        message = message = format_error_msg(ErrorMsgEnum.lookup1_msg.value, expression_ls[0])
                        aries_extract.log_report.log_error(message=message,
                                                           scenario=scenario,
                                                           well=property_id,
                                                           severity=ErrorMsgSeverityEnum.error.value)

                else:
                    index_distance -= 1
                    economic_df = np.concatenate((economic_df[:index, :], economic_df[index + 1:, :]), axis=0)
        else:
            external_header_cols = ["FILENAME", "SECTION", "SEQUENCE", "KEYWORD", "EXPRESSION", "OWNER"]
            columns = external_header_cols + ['PROPNUM', 'QUALIFIER']
            column_correct, problem_column = check_for_required_cols(external_header_cols, SIDEFILE_REQUIRED_COLS)
            if not column_correct:
                message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column,
                                           ErrorMsgEnum.external_file.value)
                aries_extract.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.error.value)
                return
            # get index for selected columns
            filename_index, owner_index = get_header_index(['FILENAME', 'OWNER'], external_header_cols)
            file_expression = fetch_value(economic_df[index, expression_index].split(' ')[0], property_id,
                                          aries_extract.at_symbol_mapping_dic,
                                          aries_extract.CUSTOM_TABLE_dict).split('/')[0].rstrip('.A')
            file_model_name = f'EXT.F({file_expression})'

            if file_expression in aries_extract.external_file_dict:
                selected_ar_file_df = process_external_file_as_sidefile(
                    aries_extract.external_file_dict[file_expression])
                if selected_ar_file_df.size != 0:
                    index_distance += (selected_ar_file_df.shape[0] - 1)
                    # remove fileowner and owner columns
                    selected_ar_file_df = np.delete(selected_ar_file_df, [filename_index, owner_index], axis=1)
                    columns.remove('FILENAME')
                    columns.remove('OWNER')

                    # create propnum and qualifier index
                    propnum = economic_df[index, propnum_index]
                    selected_ar_file_df = np.c_[selected_ar_file_df, np.repeat(propnum, selected_ar_file_df.shape[0])]
                    qualifier = get_proper_qualifier_for_add_ons(economic_df, index, section_index, qualifier_index,
                                                                 file_model_name)
                    qualifier = economic_df[index, qualifier_index]
                    selected_ar_file_df = np.c_[selected_ar_file_df, np.repeat(qualifier, selected_ar_file_df.shape[0])]

                    # get index of economic columns
                    sel_index = []
                    for i in range(len(header_cols)):
                        for j in range(len(columns)):
                            if columns[j] == header_cols[i]:
                                sel_index.append(j)
                                break

                    columns = [columns[index] for index in sel_index]
                    selected_ar_file_df = selected_ar_file_df[:, sel_index]
                    sequence_index = header_cols.index('SEQUENCE')
                    section_index = header_cols.index('SECTION')

                    selected_ar_file_df = np.c_[selected_ar_file_df, selected_ar_file_df[:, sequence_index]]
                    selected_ar_file_df[:, sequence_index] = [economic_df[index, sequence_index]
                                                              ] * selected_ar_file_df.shape[0]
                    selected_ar_file_df[:, section_index] = [economic_df[index, section_index]
                                                             ] * selected_ar_file_df.shape[0]
                    economic_df = np.concatenate((economic_df[:index, :], selected_ar_file_df, economic_df[index + 1:]),
                                                 axis=0)
                else:
                    index_distance -= 1
                    economic_df = np.concatenate((economic_df[:index, :], economic_df[index + 1:]), axis=0)
        economic_df = convert_array_column_dtype_to_int(economic_df, section_index, initial=True)
    return economic_df
