import numpy as np

from ..process.helpers import (add_last_start_row_to_elt_df, get_all_lookup_configurations, split_elt_from_sidefile,
                               split_valid_elt_df_from_lookup)
from ..shared.tracker import create_tracker_row


def process_and_store_cc_elt_doc_for_sidefile(aries_extract, economic_df, sidefile_df, elt_data_dict, well_identifier,
                                              section, economic_index, keyword_index, expression_index, headers,
                                              index_distance, property_id, scenario):
    """
        Process and store an extractable element (elt) document from the given sidefile dataframe, and update the
        corresponding economic dataframe and elt data dictionary.

        Args:
        - economic_df (numpy array): A numpy array representing the economic data of a well.
        - sidefile_df (pandas dataframe): A pandas dataframe containing the sidefile data of a well.
        - elt_data_dict (dictionary): A dictionary containing the elt data of a well.
        - well_identifier (tuple): A unique identifier for the well (scenario_id, property_id, sidefile_name).
        - section (str): The section where the elt document was found.
        - economic_index (int): The index of the start of the economic data in the well's numpy array.
        - keyword_index (int): The index of the keyword in array.
        - headers (list of str): all headers in array.
        - index_distance (int): The length of sidefile.
        - nest_count (int): The number of nested tables in the elt document.

        Returns:
        - is_elt (bool): A boolean indicating whether the given sidefile dataframe contained an elt document.
        - new_selected_ar_sidefile (numpy array): A numpy array containing the remaining data in the sidefile dataframe
                                                after the elt document has been extracted.
        - index_distance (int): The updated distance between the start of the elt document and the
                                 start of the economic data.
    """

    new_selected_ar_sidefile, elt_df, is_elt, elt_type = split_elt_from_sidefile(aries_extract, property_id, scenario,
                                                                                 sidefile_df, section, keyword_index)

    if is_elt:
        # check that there is an non-elt-document
        # if there exist a document, append to the economic df
        # remove distance of sidefile keyword row
        index_distance -= 1
        tracker_row, index_distance = create_tracker_row(index_distance, (keyword_index, expression_index),
                                                         well_identifier, economic_df)
        if new_selected_ar_sidefile is not None:
            index_distance += new_selected_ar_sidefile.shape[0]
            economic_df = np.concatenate((economic_df[:economic_index, :], tracker_row, new_selected_ar_sidefile,
                                          economic_df[economic_index + 1:]),
                                         axis=0)
        else:
            economic_df = np.concatenate(
                (economic_df[:economic_index, :], tracker_row, economic_df[economic_index + 1:]), axis=0)

        # add the previous start in econ df to elt docs to match start
        elt_df = add_last_start_row_to_elt_df(elt_df, economic_df[:economic_index, :], economic_index, keyword_index)

        # add elt document with identifier as key and the elt data as value
        elt_data_dict[well_identifier] = {'data': elt_df, 'headers': headers, 'lookup_data': None, 'type': elt_type}

    return economic_df, is_elt, new_selected_ar_sidefile, index_distance


def process_and_store_cc_elt_doc_for_lookup(aries_extract, economic_df, elt_data_dict, header_cols, lookup_df,
                                            lookup_columns, economic_index, location_indices, ls_expression,
                                            property_id, scenario, ls_scenarios_id):
    (name_index, section_index, linetype_index, propnum_index, sequence_index, sequence_economic_index, keyword_index,
     qualifier_index) = location_indices

    # get section of lookup
    try:
        lookup_section = int(float(economic_df[economic_index, section_index]))
    except (ValueError, TypeError):
        lookup_section = None

    # extract valid elt lookup dataframe from dataframe
    elt_df = None
    updated_lookup_df, elt_df = split_valid_elt_df_from_lookup(aries_extract, np.copy(lookup_df), lookup_section,
                                                               linetype_index, sequence_index, property_id, scenario)
    add_elt = False
    well_identifier = None
    if elt_df is not None and elt_df.size != 0:
        well_econ_indices = (propnum_index, section_index, keyword_index, sequence_economic_index, qualifier_index)
        lookup_indices = (name_index, sequence_index, linetype_index)

        valid, well_identifier, embedded_start_row = get_all_lookup_configurations(
            aries_extract, economic_df, elt_df, elt_data_dict, ls_expression, lookup_columns, header_cols,
            economic_index, lookup_indices, well_econ_indices, lookup_section, property_id, scenario, ls_scenarios_id)
        add_elt = True
        if not valid:
            updated_lookup_df = lookup_df
            elt_df = None
            add_elt = False

    return updated_lookup_df, (add_elt, well_identifier, embedded_start_row)
