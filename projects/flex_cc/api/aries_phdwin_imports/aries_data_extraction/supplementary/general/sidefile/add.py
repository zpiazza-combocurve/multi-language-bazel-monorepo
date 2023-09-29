import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import (convert_array_column_dtype_to_int, fetch_value,
                                                           get_header_index)
from api.aries_phdwin_imports.helpers import check_for_required_cols

from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.process.process import (
    process_and_store_cc_elt_doc_for_sidefile)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.helpers import (
    get_proper_qualifier_for_add_ons)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.sidefile.helpers import (
    process_sidefile_sequence, SIDEFILE_REQUIRED_COLS)

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg


def add(aries_extract, economic_df, header_cols, property_id, scenario, ls_scenarios_id, elt_data_dict):
    '''
    add AC_SIDEFILE expression to economic_df
    '''
    propnum_index, qualifier_index, section_index, keyword_index, expression_index = get_header_index(
        ['PROPNUM', 'QUALIFIER', 'SECTION', 'KEYWORD', 'EXPRESSION'], header_cols)

    # get rows where keyword is SIDEFILE
    ls_index = list(np.argwhere(economic_df[:, keyword_index] == 'SIDEFILE').flatten())

    # get sidefile columns and capitalize
    sidefile_array = np.array(aries_extract.AR_SIDEFILE_df)
    sidefile_header_cols = aries_extract.AR_SIDEFILE_df.columns
    sidefile_header_cols = [str(header).upper() for header in sidefile_header_cols]

    column_correct, problem_column = check_for_required_cols(sidefile_header_cols, SIDEFILE_REQUIRED_COLS)
    if not column_correct:
        message = format_error_msg(ErrorMsgEnum.class2_msg.value, problem_column, ErrorMsgEnum.ar_sidefile.value)
        aries_extract.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.error.value)
        return

    # get index for selected columns
    filename_index, owner_index = get_header_index(['FILENAME', 'OWNER'], sidefile_header_cols)

    index_distance = 0
    for index in ls_index:
        columns = sidefile_header_cols + ['PROPNUM', 'QUALIFIER']
        index += index_distance
        sidefile_expression = fetch_value(economic_df[index, expression_index].split(' ')[0], property_id,
                                          aries_extract.at_symbol_mapping_dic, aries_extract.CUSTOM_TABLE_dict)
        sidefile_model_name = f'SFILE({sidefile_expression})'
        sidefile_expression = str(sidefile_expression).strip().upper()
        match_column = np.char.upper(np.char.strip(sidefile_array[:, filename_index].astype(str)))
        selected_ar_sidefile_df = sidefile_array[np.argwhere(match_column == sidefile_expression).flatten(), :]
        if selected_ar_sidefile_df.size != 0:
            # remove fileowner and owner columns
            selected_ar_sidefile_df = np.delete(selected_ar_sidefile_df, [filename_index, owner_index], axis=1)
            columns.remove('FILENAME')
            columns.remove('OWNER')

            # create propnum and qualifier index
            propnum = economic_df[index, propnum_index]
            selected_ar_sidefile_df = np.c_[selected_ar_sidefile_df,
                                            np.repeat(propnum, selected_ar_sidefile_df.shape[0])]
            qualifier = get_proper_qualifier_for_add_ons(economic_df, index, section_index, qualifier_index,
                                                         sidefile_model_name)

            selected_ar_sidefile_df = np.c_[selected_ar_sidefile_df,
                                            np.repeat(qualifier, selected_ar_sidefile_df.shape[0])]

            # get index of economic columns
            sel_index = []
            for i in range(len(header_cols)):
                for j in range(len(columns)):
                    if columns[j] == header_cols[i]:
                        sel_index.append(j)
                        break

            columns = [columns[index] for index in sel_index]
            selected_ar_sidefile_df = selected_ar_sidefile_df[:, sel_index]
            sequence_index = header_cols.index('SEQUENCE')

            sidefile_sequence_array = process_sidefile_sequence(economic_df, selected_ar_sidefile_df, index,
                                                                sequence_index)
            selected_ar_sidefile_df = np.c_[selected_ar_sidefile_df, sidefile_sequence_array]
            selected_ar_sidefile_df[:, sequence_index] = [economic_df[index, sequence_index]
                                                          ] * selected_ar_sidefile_df.shape[0]

            # select only rows with original section
            selected_ar_sidefile_df = selected_ar_sidefile_df[selected_ar_sidefile_df[:, section_index].astype(str) ==
                                                              str(economic_df[index, section_index])]
            # add elt if any
            well_identifier = (ls_scenarios_id[-1], property_id, sidefile_expression)
            sidefile_section = economic_df[index, section_index]

            try:
                is_elt = False
                if aries_extract.create_elts:
                    (economic_df, is_elt, selected_ar_sidefile_df,
                     index_distance) = process_and_store_cc_elt_doc_for_sidefile(aries_extract, economic_df,
                                                                                 np.copy(selected_ar_sidefile_df),
                                                                                 elt_data_dict, well_identifier,
                                                                                 sidefile_section, index, keyword_index,
                                                                                 expression_index, header_cols,
                                                                                 index_distance, property_id, scenario)
            except Exception:
                aries_extract.log_report.log_error(message=ErrorMsgEnum.elt_sidefile_error.value,
                                                   scenario=scenario,
                                                   well=property_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)

            # if not elt, join sidefile dataframe here
            if not is_elt:
                # if no elt, join "flattened" sidefile to economic df
                index_distance += (selected_ar_sidefile_df.shape[0] - 1)
                economic_df = np.concatenate((economic_df[:index, :], selected_ar_sidefile_df, economic_df[index + 1:]),
                                             axis=0)
        else:
            index_distance -= 1
            economic_df = np.concatenate((economic_df[:index, :], economic_df[index + 1:]), axis=0)
        economic_df = convert_array_column_dtype_to_int(economic_df, section_index, initial=True)
    return economic_df
