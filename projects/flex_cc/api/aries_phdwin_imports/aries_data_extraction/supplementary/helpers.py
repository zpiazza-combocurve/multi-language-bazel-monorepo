from api.aries_phdwin_imports.aries_import_helpers import get_header_index

from combocurve.shared.aries_import_enums import EconHeaderEnum

MAX_SIDEFILE_LOOKUP_LAYERS = 5


def handle_sequence_of_multiple_sidefile_and_lookup(df, header_cols, sequences, sequence_spacing):
    keyword_index, sequence_index, section_index = get_header_index(
        [EconHeaderEnum.initial_keyword.value, EconHeaderEnum.sequence.value, EconHeaderEnum.section.value],
        header_cols)
    for select_keyword in ['SIDEFILE', 'LOOKUP']:
        df, sequences, sequence_spacing = update_keyword_sequence(df, sequence_index, section_index, keyword_index,
                                                                  select_keyword, sequences, sequence_spacing)
    return df, sequences, sequence_spacing


def update_keyword_sequence(df, sequence_index, section_index, keyword_index, select_keyword, sequences,
                            sequence_spacing):
    for i in range(df.shape[0]):
        this_sequence = df[i, sequence_index]

        try:
            this_sequence = str(round(float(this_sequence), 4))
        except (ValueError, TypeError):
            continue
        this_section = df[i, section_index]
        this_keyword = df[i, keyword_index]
        this_keyword = str(this_keyword).strip()

        if this_keyword == select_keyword:
            if (str(this_sequence), str(this_section)) not in sequences:
                sequences.append((str(round(float(this_sequence), 4)), str(this_section)))
            else:
                df[i, sequence_index] = str(round(float(this_sequence) + sequence_spacing, 4))
                sequence_spacing += 0.0001
    return df, sequences, sequence_spacing
