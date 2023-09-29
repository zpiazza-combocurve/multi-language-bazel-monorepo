import numpy as np

from ...elt.shared.tracker import create_tracker_row

from combocurve.shared.aries_import_enums import EconHeaderEnum

ECON_COLS = [
    EconHeaderEnum.propnum.value, EconHeaderEnum.section.value, EconHeaderEnum.sequence.value,
    EconHeaderEnum.qualifier.value, EconHeaderEnum.initial_keyword.value, EconHeaderEnum.expression.value
]

LOOKUP_REQUIRED_COLS = [
    EconHeaderEnum.name.value, EconHeaderEnum.linetype.value, EconHeaderEnum.sequence.value, EconHeaderEnum.owner.value
]


def rollback_lookup(economic_df,
                    index,
                    index_distance,
                    elt=False,
                    elt_start_row=None,
                    elt_identifier=None,
                    indices=None):
    index_distance -= 1
    if elt:
        tracker_row, index_distance = create_tracker_row(index_distance, indices, elt_identifier, economic_df)
        if elt_start_row is not None:
            index_distance += 1
            economic_df = np.concatenate(
                (economic_df[:index, :], elt_start_row.reshape(1, -1), tracker_row, economic_df[index + 1:, :]), axis=0)
        else:
            economic_df = np.concatenate((economic_df[:index, :], tracker_row, economic_df[index + 1:, :]), axis=0)
    else:
        if elt_start_row is not None:
            index_distance += 1
            economic_df = np.concatenate(
                (economic_df[:index, :], elt_start_row.reshape(1, -1), economic_df[index + 1:, :]), axis=0)
        else:
            economic_df = np.concatenate((economic_df[:index, :], economic_df[index + 1:, :]), axis=0)

    return economic_df, index_distance


def get_criterion_and_column_name(df, linetype_index, sequence_index, var_index):
    criterion = df[np.argwhere(((df[:, linetype_index] == 1) & (df[:, sequence_index] == 1))).flatten(), var_index][0]
    column_name = df[np.argwhere(((df[:, linetype_index] == 1) & (df[:, sequence_index] == 0))).flatten(), var_index][0]

    return criterion, column_name


def clean_match_column(original_column):
    new_array = []
    for item in original_column:
        item = str(item).upper().strip()
        try:
            float(item)
            item = item.split('.0')
            new_array.append(item[0])
        except (ValueError, TypeError):
            new_array.append(item)
    return np.array(new_array)


def clean_match_value(match_value):
    try:
        float(match_value)
        match_value = match_value.split('.0')[0]
    except ValueError:
        return match_value
    return match_value


def update_lookup_table_name(name, key, criteria):
    '''
    Update lookup table name based on selection criterian in ARIES
    '''
    return f'{name}@{criteria}:{key}'
