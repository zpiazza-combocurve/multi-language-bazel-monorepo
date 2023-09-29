import pandas as pd
import uuid
from copy import deepcopy
from api.cc_to_cc.helper import get_node_model_id, common_node_export, common_node_import, log_duplicated_row
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults


def stream_shared_node_export(node_key: str, model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single stream node into a list of dicts that can be
    written to an Excel sheet. Stream nodes are: associated_gas, atmosphere, capture, econ_output, and
    liquids_unloading. Function is called in carbon_export.
    """
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(node_key)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    return [common_row], model_id


def stream_shared_node_import(node_key: str, node_df: pd.DataFrame, fluid_model_df: pd.DataFrame,
                              shape_multipliers: dict, error_list: list) -> tuple[dict, str, None]:
    """ Transforms a DataFrame for a single node into a nested dict that can be upserted in a mongo doc. Stream nodes
     are: associated_gas, atmosphere, capture, econ_output, and liquids_unloading. Function is called in carbon_import.
    """
    fluid_model = None
    first_row = node_df.iloc[0, :]
    model_id = first_row[ColumnName.model_id.value]

    if node_df.shape[0] > 1:
        log_duplicated_row(
            error_list=error_list,
            input_df=node_df.tail(-1),
            field=model_id,
            field_type='model_id',
        )
    document = deepcopy(getattr(NetworkDefaults, node_key))
    document['id'] = str(uuid.uuid4())
    # update document with common node fields
    common_node_import(node_key, first_row, document, shape_multipliers)

    return document, document['id'], fluid_model
