import pandas as pd
import uuid
from copy import deepcopy
from typing import Union, Literal
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, selection_validation,
                                 number_validation, date_validation, date_str_format_change, to_std_str, str_or_none)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from api.cc_to_cc.capex import KEY_TO_CAPEX_SCHEDULE_CRITERIA, KEY_TO_CAPEX_HEADERS_CRITERIA
from combocurve.science.network_module.ghg_units import fuel_types, fuel_types_rev
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import FLOWBACK_KEY

criteria_dict = {'FPD': 'FPD', 'duration': 'Duration', 'headers': 'From Headers', 'schedule': 'From Schedule'}
schedule_header_criteria = {**KEY_TO_CAPEX_SCHEDULE_CRITERIA, **KEY_TO_CAPEX_HEADERS_CRITERIA}
rev_schedule_criteria = {v: k for k, v in KEY_TO_CAPEX_SCHEDULE_CRITERIA.items()}
rev_header_criteria = {v: k for k, v in KEY_TO_CAPEX_HEADERS_CRITERIA.items()}
rev_criteria_dict = {to_std_str(v): k for k, v in criteria_dict.items()}
rev_criteria_options = {'fromheaders': rev_header_criteria, 'fromschedule': rev_schedule_criteria}


def development_node_export(node_key: str, model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single drilling, completion, or flowback node into a list of dicts that can be
    written to an Excel sheet. Function is called in carbon_export.
    """
    export_rows = []
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    common_row = get_assumption_empty_row(node_key)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)
    if node_key == FLOWBACK_KEY:
        rate = ColumnName.flowback_rate
    else:  # node_key is either 'drilling' or 'completion'
        rate = ColumnName.consumption_rate
        common_row[ColumnName.fuel_type.value] = fuel_types[model['params']['time_series']['fuel_type']]['label']
    for row in model['params']['time_series']['rows']:
        one_row = deepcopy(common_row)
        one_row[ColumnName.start_date_window.value] = row['start_date_window']
        one_row[rate.value] = row[rate.name]
        one_row[ColumnName.start_criteria.value] = criteria_dict.get(row['start_criteria'])
        one_row[ColumnName.start_criteria_option.value] = str_or_none(
            schedule_header_criteria.get(row['start_criteria_option']))  # can be string or null
        start_value = row['start_value']  # can be number or null
        one_row[ColumnName.start_value.value] = start_value if start_value is not None else ''
        one_row[ColumnName.end_criteria.value] = criteria_dict.get(row['end_criteria'])
        one_row[ColumnName.end_criteria_option.value] = str_or_none(
            schedule_header_criteria.get(row['end_criteria_option']))  # can be string or null
        end_value = row['end_value']  # can be number or null
        one_row[ColumnName.end_value.value] = end_value if end_value is not None else ''
        export_rows.append(one_row)

    return export_rows, model_id


def development_node_import(node_key: str, node_df: pd.DataFrame, fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                            error_list: list) -> tuple[dict, str, None]:
    """ Transforms a DataFrame for a single drilling, completion, or flowback node into a nested dict that can be
    upserted in a mongo doc. Function is called in carbon_import.
    """
    fluid_model_id = None  # fluid_model not used in development nodes
    document = deepcopy(getattr(NetworkDefaults, node_key))
    document['id'] = str(uuid.uuid4())
    rows = node_df.shape[0]
    first_row = node_df.iloc[0, :]
    first_row_dict = dict(first_row)  # convert from pandas Series to dict for input to validation function
    row_index = int(first_row.name)
    # update document with common node fields
    common_node_import(node_key, first_row, document, shape_multipliers)

    if node_key == FLOWBACK_KEY:
        rate = ColumnName.flowback_rate
    else:  # node_key is either 'drilling' or 'completion'
        rate = ColumnName.consumption_rate
        fuel_type = selection_validation(
            error_list=error_list,
            input_dict=first_row_dict,
            input_key=ColumnName.fuel_type.value,
            options=list(fuel_types_rev.keys()),
            row_index=row_index,
        )
        document['params']['time_series']['fuel_type'] = fuel_types_rev.get(fuel_type, '')
    document['params']['time_series']['rows'] = [_get_time_series_row(rate, error_list, first_row, row_index)]
    if rows > 1:
        for idx, row in node_df.iloc[1:].iterrows():
            row_doc = _get_time_series_row(rate, error_list, row, idx)
            document['params']['time_series']['rows'].append(row_doc)

    return document, document['id'], fluid_model_id


def _get_time_series_row(rate: Union[Literal[ColumnName.consumption_rate], Literal[ColumnName.flowback_rate]],
                         error_list: list, row: pd.Series, row_index: int) -> dict:
    """ Helper function for development_node_import. Returns a dict representing a single row of the time series.
    """
    row_dict = dict(row)
    one_row = {}
    start_date_window_raw = row[ColumnName.start_date_window.value]
    start_date_window = to_std_str(start_date_window_raw) if start_date_window_raw else start_date_window_raw
    if start_date_window is None:
        error_list.append({
            'error_message': f'Missing {ColumnName.start_date_window.value}',
            'row_index': row_index,
        })
    elif start_date_window == 'start':
        one_row['start_date_window'] = 'Start'
    else:
        date_str = date_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.start_date_window.value,
            row_index=row_index,
        )
        one_row['start_date_window'] = date_str_format_change(date_str) if date_str else date_str
    one_row[rate.name] = number_validation(
        error_list=error_list,
        input_dict=row_dict,
        input_key=rate.value,
        row_index=row_index,
    )
    start_criteria_raw = row[ColumnName.start_criteria.value]
    start_criteria = to_std_str(start_criteria_raw) if start_criteria_raw else start_criteria_raw
    if start_criteria is None:
        error_list.append({
            'error_message': f'Missing {ColumnName.start_criteria.value}',
            'row_index': row_index,
        })
    elif start_criteria == 'fpd':
        one_row['start_criteria'] = rev_criteria_dict[start_criteria]
        one_row['start_value'] = number_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.start_value.value,
            row_index=row_index,
        )
        one_row['start_criteria_option'] = None
    elif start_criteria in ['fromheaders', 'fromschedule']:
        one_row['start_criteria'] = rev_criteria_dict[start_criteria]
        one_row['start_value'] = None
        start_criteria_option = selection_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.start_criteria_option.value,
            options=list(rev_criteria_options[start_criteria].keys()),
            row_index=row_index,
        )
        one_row['start_criteria_option'] = rev_criteria_options[start_criteria].get(start_criteria_option)
    else:
        error_list.append({
            'error_message': f'Wrong {ColumnName.start_criteria.value}',
            'row_index': row_index,
        })
    end_criteria_raw = row[ColumnName.end_criteria.value]
    end_criteria = to_std_str(end_criteria_raw) if end_criteria_raw else end_criteria_raw
    if end_criteria is None:
        error_list.append({
            'error_message': f'Missing {ColumnName.end_criteria.value}',
            'row_index': row_index,
        })
    elif end_criteria in ['fpd', 'duration']:
        one_row['end_criteria'] = rev_criteria_dict[end_criteria]
        one_row['end_value'] = number_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.end_value.value,
            row_index=row_index,
        )
        one_row['end_criteria_option'] = None
    elif end_criteria in ['fromheaders', 'fromschedule']:
        one_row['end_criteria'] = rev_criteria_dict[end_criteria]
        one_row['end_value'] = None
        end_criteria_option = selection_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.end_criteria_option.value,
            options=list(rev_criteria_options[end_criteria].keys()),
            row_index=row_index,
        )
        one_row['end_criteria_option'] = rev_criteria_options[end_criteria].get(end_criteria_option)
    else:
        error_list.append({
            'error_message': f'Wrong {ColumnName.end_criteria.value}',
            'row_index': row_index,
        })
    return one_row
