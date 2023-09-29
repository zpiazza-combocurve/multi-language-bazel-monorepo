import logging
import numpy as np
import pandas as pd
import datetime
import copy
import os
import re
from pytz import timezone
from typing import Optional
from api.cc_to_cc.file_headers import ColumnName
from combocurve.utils.exceptions import get_exception_info
from combocurve.shared.econ_tools.econ_model_tools import (CRITERIA_MAP_DICT, UNIT_MAP, RATE_BASED_ROW_KEYS,
                                                           CriteriaEnum, UnitKeyEnum)
from combocurve.science.network_module.nodes.shared.utils import (NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY,
                                                                  FACILITY_EDGES_KEY, WELL_GROUP_WELLS_KEY)
from combocurve.science.network_module.parser.parser import Parser
from combocurve.science.network_module.parser.lexer import Lexer

SEASONAL_MONTHS = {'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'}

standard_date_str = '%m/%d/%Y %H:%M:%S'


class ValueError(Exception):
    expected = True


def error_check_decorator(func):
    def inner(**kwargs):
        error_list = kwargs['error_list']
        try:
            return func(**kwargs)
        except Exception as e:
            error = get_exception_info(e)
            error_row_index = 0
            if error['expected']:
                error_message = error['message']
                if len(e.args) > 1:
                    error_row_index = e.args[1]['row_index']
            else:
                error_message = 'Unexpected Error'
                logging.error(error_message, extra={'metadata': {'error': error}})

            error_list.append({'error_message': error_message, 'row_index': error_row_index})

    return inner


@error_check_decorator
def number_validation(error_list, input_dict, input_key, required=True, row_index=0, min_value=None, max_value=None):
    error_details = {'row_index': row_index}
    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)
    if input_dict[input_key] == '' or input_dict[input_key] is None:
        if required:
            raise ValueError(f'{input_key} is required', error_details)
        else:
            return ''
    try:
        min_value_error_message = f'{input_key} value is less than {min_value}'
        max_value_error_message = f'{input_key} value is greater than {max_value}'

        value = float(input_dict[input_key])

        if min_value is not None or max_value is not None:
            if min_value is not None and value < min_value:
                raise ValueError(min_value_error_message, error_details)
            if max_value is not None and value > max_value:
                raise ValueError(max_value_error_message, error_details)

        # if import 0 as 0.0, it will not be recognized as unique model when export again
        return int(value) if int(value) == value else value
    except Exception as e:
        if e.args[0] in [min_value_error_message, max_value_error_message]:
            raise e
        raise ValueError(f'Wrong value type in {input_key}', error_details)


@error_check_decorator
def date_validation(error_list, input_dict, input_key, row_index=0):
    error_details = {'row_index': row_index}
    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)
    if isinstance(input_dict[input_key], (int, float)):
        try:
            return str(np.datetime64('1899-12-30') + int(input_dict[input_key]))
        except Exception:
            raise ValueError(f'Wrong Date format in {input_key}', error_details)
    else:
        try:
            return str(pd.to_datetime(input_dict[input_key]).date())
        except Exception:
            raise ValueError(f'Wrong Date format in {input_key}', error_details)


@error_check_decorator
def selection_validation(error_list, input_dict, input_key, options, default_option=None, row_index=0):
    error_details = {'row_index': row_index}
    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)

    selection_value = input_dict[input_key]

    options_clean = [to_std_str(s) for s in options]
    options_clean_map = dict(zip(options_clean, options))

    if isinstance(selection_value, str):
        selection_value_clean = to_std_str(selection_value)
        if selection_value_clean in options_clean:
            return options_clean_map[selection_value_clean]

    if default_option is None:
        raise ValueError(f'Wrong or missing {input_key}', error_details)
    else:
        return default_option


@error_check_decorator
def esca_depre_validation(error_list, input_dict, input_key, name_dict, row_index=0):
    error_details = {'row_index': row_index}
    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)

    # trim leading and ending space in case user put them unintentionally
    model_name = str(input_dict[input_key]).strip()

    if model_name in name_dict.keys():
        return str(name_dict[model_name]['_id'])
    elif model_name.lower() == 'none' or model_name == '' or model_name is None:
        return 'none'
    else:
        raise ValueError(f'{input_key} model not found', error_details)


@error_check_decorator
def inpt_id_selection(error_list, input_dict, input_key, row_index=0):
    error_details = {'row_index': row_index}

    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)

    if input_dict[input_key] == '' or input_dict[input_key] is None:
        raise ValueError(f'{input_key} is required', error_details)

    return input_dict[input_key]


@error_check_decorator
def inpt_id_validation(error_list, input_dict, input_key, project_wells_df, row_index=0):
    error_details = {'row_index': row_index}

    inpt_id = input_dict[input_key]
    well_specs = project_wells_df.loc[project_wells_df['inptID'] == inpt_id]
    if len(well_specs) > 0:
        return well_specs.iloc[0]['_id']
    else:
        raise ValueError(f'{input_key}: INPT ID is invalid (The entered INPT ID is not in the project wells)',
                         error_details)


@error_check_decorator
def formula_validation(error_list, input_dict, input_key, stream_inputs, functions, row_index=0):
    error_details = {'row_index': row_index}

    formula = str_or_none(input_dict[input_key], None)
    if formula == '' or formula is None:
        return None
    tokens = Lexer(formula).generate_tokens()
    for token in tokens:
        if not token.is_valid(stream_inputs, functions):
            raise ValueError(f'Invalid value: {token.value} in Formula', error_details)
    try:
        ast = Parser(tokens).parse()
    except Exception as e:
        e.args += (error_details, )
        raise e
    if ast is not None:
        return formula


@error_check_decorator
def bool_validation(error_list, input_dict, input_key, row_index=0):
    error_details = {'row_index': row_index}
    if input_key not in input_dict.keys():
        raise ValueError(f'Missing key: {input_key}', error_details)

    bool_value = input_dict[input_key]
    if isinstance(bool_value, bool):
        return bool_value

    if isinstance(bool_value, str):
        bool_value_clean = bool_value.strip().lower()
        if bool_value_clean in ['true', 'false']:
            return bool_value_clean == 'true'

    raise ValueError(f'Wrong or missing {input_key}', error_details)


def name_generator(time_zone=None):
    n = 1
    while True:
        date = datetime.datetime.now(timezone(time_zone)) if time_zone else datetime.datetime.now()
        yield date.strftime("%m/%d/%y_%H:%M:%S") + f'_{n}'
        n += 1


def memory_usage_psutil():
    # return the memory usage in MB
    import psutil
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / float(2**20)
    return mem


def get_lower_case_array(arr):
    return np.array([str(x).lower() for x in arr if x is not None])


def str_to_display(input_str, original_link=' '):
    return ' '.join([x[0].upper() + x[1:] for x in input_str.split(original_link)])


def display_to_str(input_str, original_link=' '):
    # None will return None
    if input_str:
        return '_'.join(x.lower() for x in input_str.split(original_link))


def date_str_format_change(input_date_str, reverse=False):
    if reverse:
        # input has format '12/06/2019'; output has format '2019-12-06'
        month, day, year = input_date_str.split('/')
        return f'{year}-{month}-{day}'
    else:
        # input has format '2019-12-06'; output has format '12/06/2019'
        year, month, day = input_date_str.split('-')
        return f'{month}/{day}/{year}'


def to_std_str(input_str):
    return re.sub('[^a-zA-Z0-9]+', '', input_str).lower()


def multi_line_row_view(csv_row, row_view, unit_keys, criteria_key):
    row_view_list = []
    for i in range(len(row_view)):
        this_csv_row = copy.deepcopy(csv_row)
        r = row_view[i]

        if len(unit_keys) == 1:
            this_csv_row['Value'] = r[unit_keys[0]]
        else:
            for idx, unit_key in enumerate(unit_keys, start=1):
                this_csv_row[f'Value {idx}'] = r[unit_key]

        if criteria_key == 'dates':
            try:
                this_csv_row['Period'] = date_str_format_change(r[criteria_key]['start_date'])
            except Exception:
                raise ValueError('Wrong format of date exists in econ model rows')
        elif criteria_key in RATE_BASED_ROW_KEYS:
            this_csv_row['Period'] = r[criteria_key]['start']
        elif criteria_key == CriteriaEnum.seasonal.name:
            this_csv_row['Period'] = r[criteria_key]
        else:
            if i < len(row_view) - 1:
                this_csv_row['Period'] = r[criteria_key]['period']
            else:
                this_csv_row['Period'] = 'ecl'

        row_view_list.append(this_csv_row)

    return row_view_list


def multi_line_to_rows(error_list, exp_dict_list, econ_criteria, econ_unit, row_index, econ_unit_2=None):
    rows = []
    current_period_list = []
    for i in range(len(exp_dict_list)):
        exp_row = exp_dict_list[i]
        this_row = {}

        # value
        if econ_unit_2:

            this_value_1 = number_validation(
                error_list=error_list,
                input_dict=exp_row,
                input_key='Value 1',
                required=True,
                row_index=row_index[i],
            )
            this_row[econ_unit] = this_value_1

            if econ_unit_2 != econ_unit:
                this_value_2 = number_validation(
                    error_list=error_list,
                    input_dict=exp_row,
                    input_key='Value 2',
                    required=False,
                    row_index=row_index[i],
                )
                this_row[econ_unit_2] = this_value_2
        else:
            this_value = number_validation(
                error_list=error_list,
                input_dict=exp_row,
                input_key='Value',
                required=True,
                row_index=row_index[i],
            )
            this_row[econ_unit] = this_value

        # period
        if not econ_criteria:
            continue

        if econ_criteria == CriteriaEnum.dates.value:
            this_start_date = date_validation(
                error_list=error_list,
                input_dict=exp_row,
                input_key='Period',
                row_index=row_index[i],
            )
            if i < len(exp_dict_list) - 1:
                next_start_date = date_validation(
                    error_list=[],  # if pass in error_list, we will get duplicated error message
                    input_dict=exp_dict_list[i + 1],
                    input_key='Period',
                    row_index=row_index[i + 1],
                )
                if next_start_date is not None:
                    this_end_date = (np.datetime64(next_start_date).astype(datetime.datetime)
                                     - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
                else:
                    this_end_date = None
            else:
                this_end_date = 'Econ Limit'
            this_row['dates'] = {'start_date': this_start_date, 'end_date': this_end_date}

        elif econ_criteria in RATE_BASED_ROW_KEYS:
            this_start = number_validation(
                error_list=error_list,
                input_dict=exp_row,
                input_key=ColumnName.period.value,
                required=True,
                row_index=row_index[i],
            )
            if i < len(exp_dict_list) - 1:
                # this end is same as next start
                this_end = number_validation(
                    error_list=error_list,
                    input_dict=exp_dict_list[i + 1],
                    input_key=ColumnName.period.value,
                    required=True,
                    row_index=row_index[i],
                )
            else:
                this_end = 'inf'

            this_row[econ_criteria] = {'start': this_start, 'end': this_end}

        elif econ_criteria == CriteriaEnum.seasonal.value:
            month = selection_validation(
                error_list=error_list,
                input_dict=exp_dict_list[i],
                input_key=ColumnName.period.value,
                options=SEASONAL_MONTHS,
                row_index=row_index[i],
            )
            this_row[econ_criteria] = month
        else:
            this_period = exp_row['Period']
            try:
                if i == len(exp_dict_list) - 1 and type(this_period) is str and this_period.strip() == 'ecl':
                    this_period = 1
                else:
                    if int(this_period) == float(this_period):
                        this_period = int(this_period)
                    else:
                        raise Exception()
            except Exception:
                error_list.append({
                    'error_message': 'Wrong value type in Period, need to be an integer',
                    'row_index': row_index[i],
                })
                this_period = 0

            if len(current_period_list) == 0:
                this_start = 1
                this_end = this_period
            else:
                period_sum = sum(current_period_list)
                this_start = period_sum + 1
                this_end = period_sum + this_period
            this_row[econ_criteria] = {'start': this_start, 'end': this_end, 'period': this_period}
            current_period_list.append(this_period)

        rows.append(this_row)

    return rows


def row_view_process(csv_row, econ_rows):
    row_view = econ_rows['rows']
    first_row = row_view[0]

    # process keys
    key_list = list(first_row.keys())

    unit_keys = [k for k in key_list if k in UNIT_MAP]
    if len(unit_keys) == 1:
        csv_row['Unit'] = UNIT_MAP[unit_keys[0]]
    else:
        for idx, unit_key in enumerate(unit_keys, start=1):
            csv_row[f'Unit {idx}'] = UNIT_MAP[unit_key]

    [criteria_key] = [k for k in key_list if k in CRITERIA_MAP_DICT]
    row_criteria = CRITERIA_MAP_DICT[criteria_key]
    csv_row['Criteria'] = row_criteria

    if row_criteria == 'flat':
        if len(unit_keys) == 1:
            csv_row['Value'] = first_row[unit_keys[0]]
        else:
            for idx, unit_key in enumerate(unit_keys, start=1):
                csv_row[f'Value {idx}'] = first_row[unit_key]

        csv_row['Period'] = None
        csv_rows = [csv_row]
    else:
        csv_rows = multi_line_row_view(csv_row, row_view, unit_keys, criteria_key)

        # special handle for risking well stream unit is count
        if len(unit_keys) == 1 and unit_keys[0] == UnitKeyEnum.PERCENTAGE.value:
            csv_rows[0]['Unit'] = ''

    return csv_rows


def get_phase_name(phase):
    return phase if phase != 'drip_condensate' else 'drip cond'


def equals_to_default(model, default_model, key_map={}):
    for key in default_model:
        if key == 'rows':
            # default rows should only have 1 row with flat 0
            if len(model['rows']) != 1:
                return False
            else:
                default_first_row = default_model['rows'][0]
                model_first_row = copy.copy(model['rows'][0])

                if CriteriaEnum.entire_well_life.name not in model_first_row:
                    # default row is always entire_well_life (Flat)
                    return False

                for default_key, default_value in default_first_row.items():
                    if default_key in model_first_row:
                        model_key = default_key
                    elif default_key in key_map:
                        # handle model created in old version of schema by a key map
                        model_key = key_map[default_key]
                    else:
                        model_key = None

                    model_value = model_first_row.get(model_key)

                    if default_key != 'entire_well_life' and model_value != default_value:
                        return False

        elif default_model[key] != model.get(key):
            return False

    return True


def first_available_value(input_list):
    cleaned_list = [i for i in input_list if i not in ['', None, np.nan]]
    return cleaned_list[0] if cleaned_list else None


as_of_date_criteria = {
    "criteria": {
        "label": "As of Date",
        "value": "as_of_date",
        "staticValue": "",
        "fieldType": "static",
        "fieldName": "As of Date"
    },
    "value": "",
    "criteriaHeader": True
}

date_criteria = {
    "criteria": {
        "label": "Date",
        "value": "date",
        'required': True,
        "fieldName": "Date",
        "fieldType": "date",
        "valType": "datetime"
    },
    "value": "",
    "criteriaHeader": True
}

never_criteria = {
    "criteria": {
        "label": "Never",
        "value": "never",
        "staticValue": "",
        "fieldType": "static",
        "fieldName": "Never"
    },
    "value": "",
    "criteriaHeader": True
}

risk_shut_in_option = {
    "row_view": {
        "headers": {
            "phase": "Phase",
            "criteria": {
                "required": True,
                "label": "Dates",
                "value": "dates",
                "fieldType": "date-range-two",
                "valType": "datetime"
            },
            "unit": "Unit",
            "multiplier": "Scale Post Shut-in Factor",
            "fixed_expense": "Fixed Expense",
            "capex": "CAPEX"
        },
        "rows": []
    }
}

RATE_TYPE_OPTIONS = ['gross well head', 'gross sales', 'net sales']
ROWS_CALCULATION_METHOD_OPTIONS = ['non monotonic', 'monotonic']


def db_date_to_str(db_date):
    if type(db_date) is datetime.datetime:
        return db_date.strftime('%m/%d/%Y')
    elif type(db_date) is str and '-' in db_date:
        date_list = db_date.split('-')
        return date_list[1] + '/' + date_list[2] + '/' + date_list[0]
    else:
        return db_date


def is_date(input_date):
    if not input_date:
        return False

    if isinstance(input_date, (int, float)):
        if np.isnan(input_date):
            return False
        else:
            return True
    else:
        try:
            return bool(pd.to_datetime(input_date).date())
        except Exception:
            return False


def str_or_none(input, null_response='') -> Optional[str]:
    # return null_response if input is None otherwise return a string
    if type(input) is str:
        return input
    elif type(input) is int or type(input) is float:
        value = float(input)
        #if import 0 as 0.0, it will not be recognized as unique model when export again
        return str(int(value)) if int(value) == value else str(value)
    # return null_response if input is not a string or a number
    return null_response


def generate_export_id(name: str, node_type: str, index: str) -> str:
    # Used for Node IDs and Edge IDs for networks and facilities
    return "_".join([name, node_type, index])


def get_node_model_id(node_type: str, model_rows: list) -> str:
    # Increments the model index for a given node type. Used for exporting networks or facilities.
    if len(model_rows) == 0:
        return "_".join([node_type, '1'])
    else:
        last_model_idx = model_rows[-1][ColumnName.model_id.value].split("_")[-1]
        model_idx = str(int(last_model_idx) + 1)
        return "_".join([node_type, model_idx])


def common_node_export(common_row: dict, model: dict, model_id: str) -> None:
    # updates common_row dict in place
    created_at_dt = model.get(ColumnName.createdAt.name)
    created_at_str = created_at_dt.strftime(standard_date_str) if created_at_dt else ''
    last_update_dt = model.get(ColumnName.updatedAt.name)
    last_update_str = last_update_dt.strftime(standard_date_str) if last_update_dt else ''
    common_row.update({
        ColumnName.createdAt.value: created_at_str,
        ColumnName.model_id.value: model_id,
        ColumnName.model_type.value: 'unique',
        ColumnName.model_name.value: model['name'],
        ColumnName.description.value: model['description'],
        ColumnName.updatedAt.value: last_update_str,
    })
    add_user_name_to_export(common_row, model)


def common_node_import(node_key: str, first_row: pd.Series, document: dict, shape_multipliers: dict) -> None:
    # updates common_row dict in place
    name = first_row[ColumnName.model_name.value]
    description = first_row[ColumnName.description.value]
    document.update({
        'name': name if name else str_to_display(node_key, '_'),
        'type': node_key,
        'description': str_or_none(description),
        'shape': {
            'position':
            {axis: document['shape']['position'][axis] * shape_multipliers[axis]
             for axis in shape_multipliers}
        }
    })


def add_user_name_to_export(common_row: dict, model: dict) -> None:
    # updates common_row dict in place with user name
    for user in [ColumnName.createdBy, ColumnName.updatedBy]:
        user_dict = model.get(user.name, {})
        user_name = ' '.join([user_dict.get('firstName', ''), user_dict.get('lastName', '')]).strip()
        common_row.update({user.value: user_name})


def common_edge_export(node_id_dict: dict, edge: pd.Series, edge_row: dict) -> None:
    # updates edge_row dict in place
    edge_row.update({
        ColumnName.description.value: edge.get('description', ''),
        ColumnName.edge_type.value: edge['by'],
        ColumnName.from_node_id.value: node_id_dict.get(edge.get('from'), ''),
        ColumnName.to_node_id.value: node_id_dict.get(edge.get('to'), ''),
    })


def common_edge_import(node_id_dict: dict, first_row: pd.Series, document: dict) -> None:
    # updates document dict in place
    description = first_row[ColumnName.description.value]
    document.update({
        'by': first_row[ColumnName.edge_type.value],
        'to': node_id_dict.get(first_row[ColumnName.to_node_id.value]),
        'from': node_id_dict.get(first_row[ColumnName.from_node_id.value]),
        'description': str_or_none(description),
    })


def log_missing_field(error_list: list, input_df: pd.DataFrame, field: str) -> None:
    for i in range(input_df.shape[0]):
        error_list.append({'error_message': f'Missing {field}', 'row_index': int(input_df.index[i])})


custom_field_labels = {
    'gas': 'Gas',
    'oil': 'Oil',
    'water': 'Water',
    'co2e': 'CO2e',
    'co2': 'CO2',
    'ch4': 'CH4',
    'n2o': 'N2O'
}


def log_duplicated_row(error_list: list, input_df: pd.DataFrame, field: str, field_type: str) -> None:
    error_messages = {
        'node_id': f'Duplicated row of {field} Node ID',
        'model_id': f'Duplicated row of {field} Model ID',
        'flat': 'Duplicated row of Flat Criteria',
        'custom_input': f'Duplicated row of {custom_field_labels.get(field,field)} Input',
        'custom_output': f'Duplicated row of {custom_field_labels.get(field,field)} Output',
        'network': f'Network with name {field} already exists in this project',
        'facility': f'Facility with name {field} already exists in this project',
    }
    for i in range(input_df.shape[0]):
        error_list.append({'error_message': error_messages[field_type], 'row_index': int(input_df.index[i])})


def insert_new_name_col(df: pd.DataFrame, model_key: str) -> None:
    # updates df in place for certain model keys with 'New Name', 'New Network Name', or 'New Facility Name' column
    model_name = None
    new_model_name = None
    if model_key == NETWORK_KEY:
        model_name = ColumnName.network_name.value
        new_model_name = ColumnName.new_network_name.value
    elif model_key == FACILITY_KEY:
        model_name = ColumnName.facility_name.value
        new_model_name = ColumnName.new_facility_name.value
    elif model_key not in [NETWORK_EDGES_KEY, FACILITY_EDGES_KEY, WELL_GROUP_WELLS_KEY]:
        model_name = ColumnName.model_name.value
        new_model_name = ColumnName.new_model_name.value
    if model_name and new_model_name:
        model_name_index = df.columns.to_list().index(model_name)
        df.insert(model_name_index + 1, new_model_name, '')


def update_facility_name(name: str, name_map: dict) -> str:
    # updates facility name when the user selected "Create New" for handling duplicate names
    return name_map.get(name, name)
