import numpy as np

from api.aries_phdwin_imports.aries_import_helpers import (change_double_quote_to_previous_keyword,
                                                           convert_array_column_dtype_to_int, get_header_index,
                                                           order_df_based_on_section_and_sequence)

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum

ELT_REQUIRES_OVERLAY = ['expenses']


def clean_elt_docs(aries_extract, elt_data_dict, property_id, scenario):
    try:
        for value in elt_data_dict.values():
            array_data = value['data']
            if type(array_data) is list:
                for idx, array in enumerate(array_data):
                    array = order_df_based_on_section_and_sequence(array, value['headers'])
                    array, value['headers'] = change_double_quote_to_previous_keyword(array, value['headers'])
                    section_index = get_header_index(['SECTION'], value['headers'])
                    array = convert_array_column_dtype_to_int(array, section_index)
                    value['data'][idx] = np.copy(array)
            else:
                value['data'] = order_df_based_on_section_and_sequence(value['data'], value['headers'])
                value['data'], value['headers'] = change_double_quote_to_previous_keyword(
                    value['data'], value['headers'])
                section_index = get_header_index(['SECTION'], value['headers'])
                value['data'] = convert_array_column_dtype_to_int(value['data'], section_index)
    except Exception:
        elt_data_dict = {}
        message = ErrorMsgEnum.error_processing_lookup.value
        aries_extract.log_report.log_error(message=message,
                                           scenario=scenario,
                                           well=property_id,
                                           severity=ErrorMsgSeverityEnum.error.value)


def add_abandon_line_for_capex_elt(elt_data_dict, df, header_cols):
    keyword_index = get_header_index(['KEYWORD'], header_cols)
    abandon_rows = df[(df[:, keyword_index] == 'ABANDON') | (df[:, keyword_index] == 'SALVAGE')]
    if abandon_rows.size == 0:
        return
    for value in elt_data_dict.values():
        elt_type = value.get('type')
        if elt_type == 'capex':
            array_data = value.get('data')
            if array_data is None:
                continue
            if type(array_data) is list:
                for idx, array in enumerate(array_data):
                    array_data[idx] = np.concatenate((abandon_rows, array), axis=0)
            else:
                value['data'] = np.concatenate((abandon_rows, array_data), axis=0)


def add_overlay_to_elt_data(aries_extract, property_id, scenario, elt_data_dict, overlay_df):
    try:
        for value in elt_data_dict.values():
            array_data = value['data']
            if value['type'] in ELT_REQUIRES_OVERLAY:
                if type(array_data) is list:
                    for idx, array in enumerate(array_data):
                        value['data'][idx] = np.concatenate((np.copy(array), overlay_df), axis=0)
                else:
                    value['data'] = np.concatenate((value['data'], overlay_df), axis=0)
    except Exception:
        aries_extract.log_report.log_error(
            message=ErrorMsgEnum.error_processing_lookup.value,
            scenario=scenario,
            well=property_id,
            severity=ErrorMsgSeverityEnum.error.value,
        )
