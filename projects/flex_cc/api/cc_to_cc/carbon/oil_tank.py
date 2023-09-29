import pandas as pd
import uuid
from bson import ObjectId
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, number_validation,
                                 log_duplicated_row)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import OIL_TANK_KEY


def oil_tank_export(model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single oil_tank node into a list of dicts that can be written to an Excel sheet.
    Function is called in carbon_export.
    """
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    fluid_model = model['params']['output_gas_fluid_model']
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(OIL_TANK_KEY)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    common_row[ColumnName.fluid_model.value] = fluid_model['name'] if fluid_model else ''
    common_row[ColumnName.flash_gas_ratio.value] = model['params']['oil_to_gas_ratio']

    return [common_row], model_id


def oil_tank_import(node_df: pd.DataFrame, fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                    error_list: list) -> tuple[dict, str, Optional[ObjectId]]:
    """ Transforms a DataFrame for a single oil_tank node into a nested dict that can be upserted in a mongo doc.
    Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, OIL_TANK_KEY))
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
    common_node_import(OIL_TANK_KEY, first_row, document, shape_multipliers)

    fluid_model_name = first_row[ColumnName.fluid_model.value]
    if fluid_model_name:
        fluid_model = fluid_model_df.loc[fluid_model_df['name'] == str(fluid_model_name), '_id']
        if fluid_model.empty:
            # fluid model not in project
            error_list.append({
                'error_message': f'Fluid Model {fluid_model_name} not in project!',
                'row_index': int(node_df.index[0])
            })

        else:
            fluid_model_id = ObjectId(fluid_model.values[0])
    document['params']['output_gas_fluid_model'] = fluid_model_id
    document['params']['oil_to_gas_ratio'] = number_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.flash_gas_ratio.value,
        row_index=row_index,
    )

    return document, document['id'], fluid_model_id
