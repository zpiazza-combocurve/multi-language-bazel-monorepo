import numpy as np

from combocurve.shared.aries_import_enums import EconHeaderEnum

SIDEFILE_REQUIRED_COLS = [
    EconHeaderEnum.file_name.value, EconHeaderEnum.section.value, EconHeaderEnum.initial_keyword.value,
    EconHeaderEnum.expression.value, EconHeaderEnum.owner.value
]


def process_sidefile_sequence(economic_df, sidefile_df, index, sequence_index):
    try:
        econ_sequence = float(economic_df[index, sequence_index])
    except (ValueError, TypeError):
        econ_sequence = None

    if econ_sequence is not None:
        ls = []
        for item in sidefile_df[:, sequence_index]:
            try:
                item = round(float(item) + econ_sequence, 4)
            except (ValueError, TypeError):
                item = None
            ls.append(item)
    else:
        return sidefile_df[:, sequence_index]

    return np.array(ls)
