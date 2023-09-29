import pandas as pd
import uuid
from bson import ObjectId
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, selection_validation,
                                 date_validation, number_validation, date_str_format_change, str_to_display,
                                 log_duplicated_row)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY

criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}

PNEUMATIC_KEYS = [PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY]


def pneumatic_compressor_export(node_key: str, model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single pneumatic or compressor node into a list of dicts that can be written to
    an Excel sheet. Pneumatic or compressor nodes are: pneumatic_device, pneumatic_pump, reciprocating_compressor, or
    centrifugal_compressor. Function is called in carbon_export.
    """
    export_rows = []
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(node_key)
    if node_key in PNEUMATIC_KEYS:
        fluid_model = model['params']['fluid_model']
        common_row[ColumnName.fluid_model.value] = fluid_model['name'] if fluid_model else ''

    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    criteria = CRITERIA_MAP_DICT[model['params']['time_series']['criteria']]
    common_row[ColumnName.criteria.value] = str_to_display(criteria, '_')
    for row in model['params']['time_series']['rows']:
        one_row = deepcopy(common_row)
        one_row[ColumnName.period.value] = row['period']
        one_row[ColumnName.count.value] = row['count']
        one_row[ColumnName.runtime.value] = row['runtime']
        if node_key == PNEUMATIC_DEVICE_KEY:
            one_row[ColumnName.device_type.value] = str_to_display(row['device_type'], '-')
        export_rows.append(one_row)

    return export_rows, model_id


def pneumatic_compressor_import(node_key: str, node_df: pd.DataFrame, fluid_model_df: pd.DataFrame,
                                shape_multipliers: dict, error_list: list) -> tuple[dict, str, Optional[ObjectId]]:
    """ Transforms a DataFrame for a single pneumatic or compressor node into a nested dict that can be upserted in a
    mongo doc. Pneumatic or compressor nodes are: pneumatic_device, pneumatic_pump, reciprocating_compressor, or
    centrifugal_compressor. Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, node_key))
    document['id'] = str(uuid.uuid4())
    n_rows = node_df.shape[0]
    first_row = node_df.iloc[0, :]
    first_row_dict = dict(first_row)  # convert from pandas Series to dict for input to validation function
    row_index = int(first_row.name)
    # update document with common node fields
    common_node_import(node_key, first_row, document, shape_multipliers)

    if node_key in PNEUMATIC_KEYS:
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
        document['params']['fluid_model'] = fluid_model_id
    criteria = selection_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.criteria.value,
        options=['flat', 'dates'],
        row_index=row_index,
    )
    document['params']['time_series']['criteria'] = criteria_map_dict_rev.get(criteria)
    if criteria:
        document['params']['time_series']['rows'] = [
            _get_time_series_row(error_list, node_key, first_row, row_index, criteria)
        ]
        if criteria == 'flat':
            if n_rows > 1:
                log_duplicated_row(
                    error_list=error_list,
                    input_df=node_df.tail(-1),
                    field='flat',
                    field_type='flat',
                )
        elif criteria == 'dates' and n_rows > 1:
            for idx, row in node_df.iloc[1:].iterrows():
                row_doc = _get_time_series_row(error_list, node_key, row, idx, criteria)
                document['params']['time_series']['rows'].append(row_doc)

    return document, document['id'], fluid_model_id


def _get_time_series_row(error_list: list, node_key: str, row: pd.Series, row_index: int, criteria: str) -> dict:
    """ Helper function for pneumatic_compressor_import. Returns a dict representing a single row of the time series.
    """
    row_dict = dict(row)
    one_row = {}
    if criteria == 'dates':
        date_str = date_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.period.value,
            row_index=row_index,
        )
        one_row['period'] = date_str_format_change(date_str) if date_str else date_str
    elif criteria == 'flat':
        one_row['period'] = 'Flat'
    one_row['count'] = number_validation(
        error_list=error_list,
        input_dict=row_dict,
        input_key=ColumnName.count.value,
        row_index=row_index,
    )
    one_row['runtime'] = number_validation(
        error_list=error_list,
        input_dict=row_dict,
        input_key=ColumnName.runtime.value,
        row_index=row_index,
    )
    if node_key == PNEUMATIC_DEVICE_KEY:
        one_row['device_type'] = selection_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.device_type.value,
            options=['high-bleed', 'intermittent', 'low-bleed'],
            row_index=row_index,
        )
    return one_row
