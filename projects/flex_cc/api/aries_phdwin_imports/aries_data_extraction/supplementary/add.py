from api.aries_phdwin_imports.aries_data_extraction.supplementary.helpers import (
    handle_sequence_of_multiple_sidefile_and_lookup, MAX_SIDEFILE_LOOKUP_LAYERS)

from api.aries_phdwin_imports.aries_data_extraction.supplementary.general.lookup.format import remove_duplicate_lookup
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg

from combocurve.shared.aries_import_enums import EconEnum

from .general.sidefile.add import add as add_sidefile
from .general.lookup.add import add as add_lookup
from .general.external_file.add import add as add_external_file

from .elt.shared.tracker import add_start_and_remove_tracker


def add_supplementary_econ_df(aries_extract, df, header_cols, well_id, scenario, ls_scenarios_id, index, elt_data_dict):
    """
        Add supplementary economic data to a DataFrame object.

        Args:
        aries_extract (object): An object containing Aries data.
        df (pandas.DataFrame): A DataFrame object to which the supplementary data will be added.
        header_cols (list):list of column headers.
        well_id (str): The well identifier.
        scenario (str): The scenario identifier.
        ls_scenarios_id (str): scenarios id.
        index (int): The keyword column-index in array.
        elt_data_dict (dict): A dictionary containing Embededded lookup data.

        Returns:
        pandas.DataFrame: A DataFrame object containing the added supplementary data.

        Raises:
        Exception: If an error occurs during data addition.

    """
    if df.size == 0:
        return df

    df = remove_duplicate_lookup(df, index, header_cols)

    sequences = []
    sequence_spacing = 0.0001
    count = 0
    loop_limit = 100
    while (EconEnum.sidefile.value in list(df[:, index]) or EconEnum.lookup.value in list(df[:, index])
           or EconEnum.file.value in list(df[:, index])) and count < MAX_SIDEFILE_LOOKUP_LAYERS:
        if count == loop_limit:
            break

        df, sequences, sequence_spacing = handle_sequence_of_multiple_sidefile_and_lookup(
            df, header_cols, sequences, sequence_spacing)

        if EconEnum.sidefile.value in df[:, index]:
            try:
                df = add_sidefile(aries_extract, df, header_cols, well_id, scenario, ls_scenarios_id, elt_data_dict)
            except Exception:
                aries_extract.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                            ErrorMsgEnum.sidefiles.value),
                                                   scenario=scenario,
                                                   well=well_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)
                break

        df, sequences, sequence_spacing = handle_sequence_of_multiple_sidefile_and_lookup(
            df, header_cols, sequences, sequence_spacing)
        if EconEnum.lookup.value in df[:, index]:
            try:
                df = add_lookup(aries_extract, df, header_cols, well_id, scenario, ls_scenarios_id, elt_data_dict)
            except Exception:
                aries_extract.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                            ErrorMsgEnum.lookups.value),
                                                   scenario=scenario,
                                                   well=well_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)
                break

        if EconEnum.file.value in df[:, index]:
            try:
                df = add_external_file(aries_extract, df, header_cols, well_id, scenario)
            except Exception:
                aries_extract.log_report.log_error(message=format_error_msg(ErrorMsgEnum.class3_msg.value,
                                                                            ErrorMsgEnum.file.value),
                                                   scenario=scenario,
                                                   well=well_id,
                                                   severity=ErrorMsgSeverityEnum.error.value)

        count += 1

    df = add_start_and_remove_tracker(df, header_cols, elt_data_dict)

    return df
