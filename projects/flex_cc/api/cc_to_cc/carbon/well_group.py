import pandas as pd
import uuid
from bson import ObjectId
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.helper import get_node_model_id, common_node_export, common_node_import, log_duplicated_row
from api.cc_to_cc.file_headers import (get_assumption_empty_row, ColumnName, CARBON_WELL_HEADERS)
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import WELL_GROUP_KEY, WELL_GROUP_WELLS_KEY


def well_group_export(model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single well_group node into a list of dicts that can be written to an Excel sheet.
    Function is called in carbon_export.
    """
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    fluid_model = model['params']['fluid_model']
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(WELL_GROUP_KEY)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    common_row.update({
        ColumnName.fluid_model.value: fluid_model['name'] if fluid_model else '',
        ColumnName.wells.value: len(model['params']['wells'])
    })

    return [common_row], model_id


def well_group_wells_export(model: dict, model_rows: list, well_group_id: str, wells_map: dict) -> list:
    """ Creates a dict for each well in a well_group node with the well identifiers and appends it to the list of dicts
    that can be written to an Excel sheet. Well identifiers are: inptID, chosenID, api10, api12, api14, aries_id, and
    phdwin_id. Function is called in carbon_export.
    """
    export_rows = []
    common_row = get_assumption_empty_row(WELL_GROUP_WELLS_KEY)
    common_row[ColumnName.well_group_id.value] = well_group_id
    for well_id in model['params']['wells']:
        well_map = wells_map.get(well_id, {})
        one_row = deepcopy(common_row)
        for header in CARBON_WELL_HEADERS:
            col = getattr(ColumnName, header)
            one_row.update({col.value: well_map.get(col.name, '')})
        export_rows.append(one_row)

    return export_rows


def well_group_import(node_df: pd.DataFrame, wells_df: pd.DataFrame, missing_wells_df: pd.DataFrame,
                      fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                      error_dict: dict) -> tuple[dict, str, Optional[ObjectId], list]:
    """ Transforms a DataFrame for a single well_group node into a nested dict that can be upserted in a mongo doc. Also
    adds the wells from the Wells DataFrame to the well_group node document. Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, WELL_GROUP_KEY))
    document['id'] = str(uuid.uuid4())
    first_row = node_df.iloc[0, :]
    # update document with common node fields
    common_node_import(WELL_GROUP_KEY, first_row, document, shape_multipliers)
    model_id = first_row[ColumnName.model_id.value]

    if node_df.shape[0] > 1:
        log_duplicated_row(
            error_list=error_dict[WELL_GROUP_KEY],
            input_df=node_df.tail(-1),
            field=model_id,
            field_type='model_id',
        )
    # check for missing wells for this well group
    if not missing_wells_df.empty:
        for col in missing_wells_df.columns:
            if col != ColumnName.well_group_id.value:
                col_name = getattr(ColumnName, col).value
                for idx, row in missing_wells_df.iterrows():
                    error_dict[WELL_GROUP_WELLS_KEY].append({
                        'error_message': f'Missing {col_name} Well ID or Well not in project!',
                        'row_index': int(idx)
                    })

    # check for duplicated wells in this well group
    duplicated_wells_df = wells_df.loc[wells_df.duplicated()]
    if not duplicated_wells_df.empty:
        for idx, row in duplicated_wells_df.iterrows():
            error_dict[WELL_GROUP_WELLS_KEY].append({
                'error_message': 'Duplicated well in well group node.',
                'row_index': int(idx)
            })
    fluid_model_name = first_row[ColumnName.fluid_model.value]
    if fluid_model_name:
        fluid_model = fluid_model_df.loc[fluid_model_df['name'] == str(fluid_model_name), '_id']
        if fluid_model.empty:
            # fluid model not in project
            error_dict[WELL_GROUP_KEY].append({
                'error_message': f'Fluid Model {fluid_model_name} not in project!',
                'row_index': int(node_df.index[0])
            })
        else:
            fluid_model_id = ObjectId(fluid_model.values[0])

    wells = get_well_group_wells_ids(wells_df)
    document['params']['fluid_model'] = fluid_model_id
    document['params']['wells'] += wells
    return document, document['id'], fluid_model_id, wells


def get_well_group_wells_ids(wells_df: pd.DataFrame) -> list[str]:
    """ Returns a list of well ObjectIds from a DataFrame of wells.
    """
    return wells_df['_id'].tolist()
