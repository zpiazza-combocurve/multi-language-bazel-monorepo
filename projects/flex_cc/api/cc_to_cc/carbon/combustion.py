import pandas as pd
import uuid
from copy import deepcopy
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, selection_validation,
                                 date_validation, number_validation, date_str_format_change, str_to_display,
                                 log_duplicated_row)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT
from combocurve.science.network_module.ghg_units import fuel_types, fuel_types_rev
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import COMBUSTION_KEY

criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}


def combustion_export(model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single combustion node into a list of dicts that can be written to an Excel sheet.
    Function is called in carbon_export.
    """
    export_rows = []
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(COMBUSTION_KEY)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)

    common_row[ColumnName.fuel_type.value] = fuel_types[model['params']['time_series']['fuel_type']]['label']
    criteria = CRITERIA_MAP_DICT[model['params']['time_series']['criteria']]
    common_row[ColumnName.criteria.value] = str_to_display(criteria, '_')
    for row in model['params']['time_series']['rows']:
        one_row = deepcopy(common_row)
        one_row[ColumnName.period.value] = row['period']
        one_row[ColumnName.consumption_rate.value] = row['consumption_rate']
        export_rows.append(one_row)

    return export_rows, model_id


def combustion_import(node_df: pd.DataFrame, fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                      error_list: list) -> tuple[dict, str, None]:
    """ Transforms a DataFrame for a single combustion node into a nested dict that can be upserted in a mongo doc.
    Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, COMBUSTION_KEY))
    document['id'] = str(uuid.uuid4())
    n_rows = node_df.shape[0]
    first_row = node_df.iloc[0, :]
    first_row_dict = dict(first_row)  # convert from pandas Series to dict for input to validation function
    row_index = int(first_row.name)
    # update document with common node fields
    common_node_import(COMBUSTION_KEY, first_row, document, shape_multipliers)

    fuel_type = selection_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.fuel_type.value,
        options=list(fuel_types_rev.keys()),
        row_index=row_index,
    )
    document['params']['time_series']['fuel_type'] = fuel_types_rev.get(fuel_type, '')
    criteria = selection_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key=ColumnName.criteria.value,
        options=['flat', 'dates'],
        row_index=row_index,
    )
    document['params']['time_series']['criteria'] = criteria_map_dict_rev.get(criteria)
    if criteria:
        document['params']['time_series']['rows'] = [_get_time_series_row(error_list, first_row, row_index, criteria)]
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
                row_doc = _get_time_series_row(error_list, row, idx, criteria)
                document['params']['time_series']['rows'].append(row_doc)

    return document, document['id'], fluid_model_id


def _get_time_series_row(error_list: list, row: pd.Series, row_index: int, criteria: str) -> dict:
    """ Helper function for combustion_import. Returns a dict representing a single row of the time series.
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
    one_row['consumption_rate'] = number_validation(
        error_list=error_list,
        input_dict=row_dict,
        input_key=ColumnName.consumption_rate.value,
        row_index=row_index,
    )

    return one_row
