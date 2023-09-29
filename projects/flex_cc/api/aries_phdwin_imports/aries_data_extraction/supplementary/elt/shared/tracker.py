import numpy as np
from api.aries_phdwin_imports.aries_import_helpers import get_header_index


def create_tracker_row(index_distance, indices, elt_identifier, economic_df):
    index_distance += 1
    keyword_index, expression_index = indices
    n = economic_df.shape[1]
    tracker_row = np.zeros((1, n), dtype=object)
    tracker_row[tracker_row == 0] = ""
    tracker_row[0, keyword_index] = 'TRACKER'
    tracker_row[0, expression_index] = f"{elt_identifier[0]}-{elt_identifier[1]}-{elt_identifier[2]}"

    return tracker_row, index_distance


def add_start_and_remove_tracker(df, header_cols, elt_data_dict):
    keyword_index, expression_index = get_header_index(['KEYWORD', 'EXPRESSION'], header_cols)

    for elt_identifier, elt_dict in elt_data_dict.items():
        unique_identifier = f"{elt_identifier[0]}-{elt_identifier[1]}-{elt_identifier[2]}"
        tracking_index = np.argwhere(df[:, expression_index] == unique_identifier).flatten()
        if len(tracking_index) > 0:
            for i in range(tracking_index[-1] - 1, -1, -1):
                if df[i, keyword_index] == 'START':
                    elt_array_data = elt_dict.get('data')
                    if type(elt_array_data) is list:
                        for idx, array in enumerate(elt_array_data):
                            if array is None:
                                continue
                            elt_array_data[idx] = np.concatenate((df[i, :].reshape(1, -1), array), axis=0)
                    elif elt_array_data is not None:
                        elt_dict['data'] = np.concatenate((df[i, :].reshape(1, -1), elt_array_data), axis=0)
                    break

    return df[df[:, expression_index] != 'TRACKER']
