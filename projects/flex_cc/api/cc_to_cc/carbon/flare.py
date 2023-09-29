import pandas as pd
import uuid
from copy import deepcopy
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, number_validation,
                                 log_duplicated_row)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import FLARE_KEY


def flare_export(model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single flare node into a list of dicts that can be written to an Excel sheet.
    Function is called in carbon_export.
    """
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(FLARE_KEY)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    common_row[ColumnName.pct_flare_efficiency.value] = model['params']['pct_flare_efficiency']
    common_row[ColumnName.pct_flare_unlit.value] = model['params']['pct_flare_unlit']
    common_row[ColumnName.fuel_hhv.value] = model['params']['fuel_hhv']['value']

    return [common_row], model_id


def flare_import(node_df: pd.DataFrame, fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                 error_list: list) -> tuple[dict, str, None]:
    """ Transforms a DataFrame for a single flare node into a nested dict that can be upserted in a mongo doc.
    Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, FLARE_KEY))
    document['id'] = str(uuid.uuid4())
    first_row = node_df.iloc[0, :]
    first_row_dict = dict(first_row)  # convert from pandas Series to dict for input to validation function
    row_index = int(first_row.name)
    model_id = first_row[ColumnName.model_id.value]

    # error for duplicated row
    if node_df.shape[0] > 1:
        log_duplicated_row(
            error_list=error_list,
            input_df=node_df.tail(-1),
            field=model_id,
            field_type='model_id',
        )

    # update document with common node fields
    common_node_import(FLARE_KEY, first_row, document, shape_multipliers)

    document['params'][ColumnName.pct_flare_efficiency.name] = number_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.pct_flare_efficiency.value,
        row_index=row_index,
    )
    document['params'][ColumnName.pct_flare_unlit.name] = number_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.pct_flare_unlit.value,
        row_index=row_index,
    )
    document['params'][ColumnName.fuel_hhv.name]['value'] = number_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.fuel_hhv.value,
        row_index=row_index,
    )

    return document, document['id'], fluid_model_id
