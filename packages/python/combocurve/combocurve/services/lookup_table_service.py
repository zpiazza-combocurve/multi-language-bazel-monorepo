from enum import Enum
import copy
import logging
from bisect import bisect
from typing import Any, Set, List, Dict, Union, Optional
from .scenario_well_assignments_service import QUALIFIER_FIELDS
from copy import deepcopy
import datetime

FE_TO_BE_MAP = {
    'Shrunk': 'shrunk',
    'Unshrunk': 'unshrunk',
    'WI': 'wi',
    'NRI': 'nri',
    'Lease NRI': 'lease_nri',
    '1 - WI': 'one_minus_wi',
    '1 - NRI': 'one_minus_nri',
    '1 - Lease NRI': 'one_minus_lease_nri',
    'WI - 1': 'wi_minus_one',
    'NRI - 1': 'nri_minus_one',
    'Lease NRI - 1': 'lease_nri_minus_one',
    '100% WI': '100_pct_wi',
    'None': 'none'
}

TC_LOOKUP = 'tcLookup'


class Operators(Enum):
    EQUAL = 'equal'
    NOT_EQUAL = 'not_equal'
    GREATER_THAN = 'greater_than'
    GREATER_THAN_EQUAL = 'greater_than_equal'
    LESS_THAN = 'less_than'
    LESS_THAN_EQUAL = 'less_than_equal'
    IN = 'in'
    NOT_IN = 'not_in'

    @classmethod
    def values(cls):
        return list(map(lambda c: c.value, cls))


_EVALUATORS = {
    Operators.EQUAL: lambda x, y: x == y,
    Operators.NOT_EQUAL: lambda x, y: x != y,
    Operators.LESS_THAN: lambda x, y: x < y,
    Operators.LESS_THAN_EQUAL: lambda x, y: x <= y,
    Operators.GREATER_THAN: lambda x, y: x > y,
    Operators.GREATER_THAN_EQUAL: lambda x, y: x >= y,
    Operators.IN: lambda x, y: x in y,
    Operators.NOT_IN: lambda x, y: x not in y,
}


def initial_embedded_process(lines: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Converts the lines to dictionary with key as line key and value as line value

    Args:
        lines (List[Dict[str, Any]]): The list of lines

    Returns:
        Dict[str, Any]: The dictionary of line key and line value
    """
    lines_dict: Dict[str, Any] = dict()

    for line in lines:
        line_key = line['key']
        line_value = line.get('value', '')

        if line_value == '' and 'lookup' not in line:
            continue

        if isinstance(line_value, (list, dict)):
            # time series will have value as list, escalation field will be dict
            lines_dict[line_key] = line_value
        else:
            # conversion for label to key if value stored label instead of key
            lines_dict[line_key] = FE_TO_BE_MAP.get(line_value, line_value)

    return lines_dict


def expense_lines_processor(lines_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process the expense lines for a given report to get the relevant information
    needed to calculate the expense line

    Args:
        lines_dict: A dictionary containing all the relevant information
                    for the expense line

    Returns:
        A dictionary containing the relevant information for the expense line
    """
    if 'value' not in lines_dict:
        # value can be a list for time series
        if lines_dict.get('period') and isinstance(lines_dict['period'], list):
            lines_dict['value'] = ['0'] * len(lines_dict['period'])
        else:
            lines_dict['value'] = '0'
    if 'unit' not in lines_dict:
        if lines_dict.get('key') == 'gas':
            lines_dict['unit'] = 'dollar_per_mcf'
        elif lines_dict.get('key') in ['oil', 'water_disposal']:
            lines_dict['unit'] = 'dollar_per_bbl'
        elif lines_dict.get('key') == 'fixed_expenses':
            lines_dict['unit'] = 'fixed_expense'
        else:  # carbon expense
            lines_dict['unit'] = 'carbon_expense'


def capex_values_process(lines_dict: Dict) -> None:
    """Process the capex values to make sure they are numbers.

    Args:
        lines_dict (Dict): The lines dict.

    Returns:
        None: None.
    """
    if not isinstance(lines_dict['tangible'], (int, float)):
        lines_dict['tangible'] = 0
    if not isinstance(lines_dict['intangible'], (int, float)):
        lines_dict['intangible'] = 0


def capex_escalation_process(lines_dict: Dict[str, str]) -> Dict[str, str]:
    """Capex escalation process.

    Args:
        lines_dict: Dict of lines.

    Returns:
        Dict of lines with capex escalation.

    """
    if lines_dict['escalation_start_option'] != 'date':
        lines_dict['escalation_start'] = {
            lines_dict['escalation_start_option']: float(lines_dict['escalation_start_value'])
        }
    else:
        lines_dict['escalation_start'] = {lines_dict['escalation_start_option']: lines_dict['escalation_start_value']}

    return lines_dict


def capex_criteria_process(lines_dict: Dict) -> None:
    """Process the capex criteria.

    Args:
        lines_dict (Dict): Lines dictionary.
    """
    criteria_option: str = lines_dict['criteria_option']
    if criteria_option in {'fromSchedule', 'fromHeaders'}:
        lines_dict[criteria_option] = lines_dict['criteria_from_option']
        lines_dict[lines_dict['criteria_from_option']] = float(lines_dict.get('criteria_value', 0))
    elif criteria_option == 'date':
        date = lines_dict['criteria_value'].split('/')
        lines_dict[criteria_option] = f'{date[2]}-{date[0]}-{date[1]}'
    else:
        lines_dict[criteria_option] = float(lines_dict.get('criteria_value', 0))


def capex_remove_unused_keys(lines_dict: Dict) -> None:
    """
    Remove unused keys from a dictionary.

    Args:
        lines_dict: Dictionary to remove keys from.

    Returns:
        None

    """
    for key in ('escalation_start_option', 'escalation_start_value', 'criteria_option', 'criteria_value',
                'criteria_from_option'):
        lines_dict.pop(key, None)


def capex_lines_processor(lines_dict):
    capex_values_process(lines_dict)
    capex_escalation_process(lines_dict)
    capex_criteria_process(lines_dict)
    capex_remove_unused_keys(lines_dict)


def lines_processor(lines, assumption=''):  # noqa: C901
    '''take list of {'key': key, 'value': value} and transform it to a dict of the format {key: value}

        Args:
            lines (list): list of dicts with the format {'key': key, 'value': value}
            add_default (boolean): add default to return dict or not
        Returns:
            dict: dict with the format {key: value}
        '''
    lines_dict = initial_embedded_process(lines)

    if assumption == 'expense':
        expense_lines_processor(lines_dict)
    elif assumption == 'capex':
        capex_lines_processor(lines_dict)
    return lines_dict


def evaluate_rule(well_value, condition_value, operator, is_elu=False):
    '''
    when condition_value is None:
    for model lookup, it means no condition been filled, which always indicate a match
    for ELU, it means not assigned, which only match when the well_value is None (to be consistent with JS side logic)
    '''
    if operator in _EVALUATORS:
        if condition_value is None or condition_value == '':
            if is_elu:
                if (condition_value is None and well_value is None) or well_value == well_value == '':
                    return True
                else:
                    return False
            else:
                return True

        if well_value is None or well_value == '':
            return False

        return _EVALUATORS[operator](well_value, condition_value)

    logging.error('Invalid operator')

    return False


def ratio_interpolation_value(well_headers, ratio_header, ratio_number, rule, interpolation_header,
                              interpolation_boundaries):
    if ratio_header != '':
        rule = ratio_value(well_headers, ratio_header, ratio_number, rule)
    if interpolation_header != '':
        rule = interpolate_value(rule, well_headers, interpolation_header, interpolation_boundaries)
    return rule


def outside_of_interpolation_range(rule: Dict) -> Dict:
    """Set all values to zero if outside of interpolation range.

    Args:
        rule (dict): Rule dictionary.

    Returns:
        dict: Rule dictionary with values set to zero if outside of interpolation range.
    """
    for val in rule['values']:
        value = val['value']
        if not isinstance(value, list):
            val['value'] = value if isinstance(value, str) else 0
        else:
            val['value'] = [0 for _ in range(len(value))]

    return rule


def interpolation_calculation(header_value: float, interpolation_boundaries: List, rule: Dict) -> Dict:
    """Interpolate the values of a rule with the header value

    Args:
        header_value (float): The header value
        interpolation_boundaries (list): The boundaries of the interpolation
        rule (dict): The rule

    Returns:
        dict: The rule with the interpolated values
    """
    # Find the index of the boundary before the header value
    idx = bisect(interpolation_boundaries, header_value)

    # Calculate the interpolation lever
    interpolation_lever = (header_value - interpolation_boundaries[idx - 1]) / (interpolation_boundaries[idx]
                                                                                - interpolation_boundaries[idx - 1])

    # Interpolate the values of each rule
    for val in rule['values']:
        values = [val['value']] + val['childrenValues']
        val['value'] = val['value'] if (
            len(values) <= 1 or
            (isinstance(val['value'], str) and not val['value'].replace('.', '', 1).isnumeric())) else interpolation(
                interpolation_lever, idx, values)

    return rule


def interpolation(interpolation_lever: float, idx: int, value: List) -> List:
    """
    Interpolate the value of the current index according to the previous index.

    Args:
        interpolation_lever (float): The interpolation lever.
        idx (int): The current index.
        value (list): The list of values.

    Returns:
        list: The interpolated value.
    """
    if not isinstance(value[0], list):
        value = [float(num) for num in value]

        value = interpolation_lever * (value[idx] - value[idx - 1]) + value[idx - 1]
    else:
        value = [[float(num) for num in lst] for lst in value]

        value = [
            interpolation_lever * (value[idx][i] - value[idx - 1][i]) + value[idx - 1][i]
            for i in range(len(value[idx]))
        ]

    return value


def interpolate_value(rule, well_headers, interpolation_header, interpolation_boundaries):
    header_value = well_headers[interpolation_header]
    if header_value is None:
        header_value = interpolation_boundaries[0] - 1
    if header_value < interpolation_boundaries[0] or header_value > interpolation_boundaries[-1]:
        return outside_of_interpolation_range(rule)
    else:
        return interpolation_calculation(header_value, interpolation_boundaries, rule)


def ratio_value(well_headers, ratio_header, ratio_number, rule):
    for row in rule['values']:
        if isinstance(row['value'], list):
            row['value'] = [float(value) * well_headers.get(ratio_header, 0) / ratio_number for value in row['value']]
        elif well_headers.get(ratio_header, 0) is not None:
            try:
                row["value"] = (
                    row["value"]
                    if isinstance(row["value"], str)
                    else float(row["value"]) * well_headers.get(ratio_header, 0) / ratio_number
                )
            except ValueError:
                continue
    return rule


# https://combocurve.atlassian.net/wiki/spaces/COMBOCURVE/pages/703627265/Lookup+Tables#Behavior
def evaluate_lookup_table(lookup_table: dict[str, Any], well: dict[str, Any], column: str, lu_type: str):
    '''Produce an assumption from a lookup.

    Evaluates lookups in the scenario table cell by cell. Also used for embedded
    lookup tables, via the `lu_type`. When used in that context, the functionality
    is greatly mutated and undocumented here.

    Args
    ----
      `lookup_table`: A lookup table document from the db.
      `well`: The well headers for the well whose cell is being filled.
        Should include project custom headers as well.
      `column`: The key for the column being filled.
      `lu_type`: Used to mutate functionality for ELTs. available options are
        `'elu'`: Functionality is modified for ELT.
        Anything else: Functionality used for scenario table.

    Returns
    -------
      `Optional[ObjectId]`: When _not_ in ELT mode. The id of the assumption
        if there is a match, or None if there is not match.

      `Tuple[bool, dict[str, Any]]`: When _in_ ELT mode. Documentation needed.
    '''
    case_insensitive_matching = lookup_table.get('configuration', {}).get('caseInsensitiveMatching', False)

    ratio_header = ''
    interpolation_header = ''
    interpolation_boundaries = []
    if lu_type == 'elu':
        for header, behavior in lookup_table['configuration'].get('selectedHeadersMatchBehavior', {}).items():
            if behavior == 'ratio':
                ratio_header = header
            elif behavior == 'interpolation':
                interpolation_header = header

    for rule in lookup_table.get('rules', []):
        if lu_type == 'elu':
            for condition in rule['conditions']:
                ratio_number = condition['value'] if condition['key'] == ratio_header else 1
                if condition['key'] == interpolation_header:
                    interpolation_boundaries = [condition['value']] + condition['childrenValues']

        rule_matches = True

        # scenario lookup conditions is under filter, embedded lookup condition is under root
        conditions = rule.get('conditions', []) if lu_type == 'elu' else rule.get('filter', {}).get('conditions', [])

        for condition in conditions:
            if condition['key'] in (ratio_header, interpolation_header):
                continue
            well_value = well.get(condition['key'])
            condition_value = condition.get('value')

            if case_insensitive_matching:
                well_value = (well_value.lower() if isinstance(well_value, str) else well_value)
                condition_value = (condition_value.lower() if isinstance(condition_value, str) else condition_value)

            rule_matches = rule_matches and evaluate_rule(
                well_value,
                condition_value,
                Operators(condition['operator']),
                lu_type == 'elu',
            )

        if rule_matches:
            if lu_type == 'elu':
                return rule_matches, ratio_interpolation_value(well, ratio_header, ratio_number, rule,
                                                               interpolation_header, interpolation_boundaries)
            if rule.get(column) is not None:
                return rule[column]

    if lu_type == 'elu':
        return True, {'category': [], 'values': []}


class LookupTablesEvaluator:
    def __init__(self, scenario_well_assignments, wells, lookup_tables):
        self.scenario_well_assignments = scenario_well_assignments
        self.wells = wells
        self.lookup_tables = lookup_tables

    def _get_lookup_table_by_id(self, id):
        return self.lookup_tables.get(id)

    def _get_well_by_id(self, id):
        return self.wells[id]

    def _evaluate_lookup_table(self, lookup_table_id, well_id, column, lu_type):
        lookup_table = self._get_lookup_table_by_id(lookup_table_id)
        if not lookup_table:
            return None
        well = self._get_well_by_id(well_id)
        return evaluate_lookup_table(lookup_table, well, column, lu_type)

    def evaluate(self, eval_type_curve_lookup_tables=False, lu_type='lu'):
        # don't mutate the original dictionary
        scenario_well_assignments = copy.deepcopy(self.scenario_well_assignments)

        for scenario_well_assignment in scenario_well_assignments:
            well_id = scenario_well_assignment['well']
            for column in QUALIFIER_FIELDS:
                if column not in scenario_well_assignment:
                    continue

                col_assign = scenario_well_assignment[column]
                if col_assign is None:
                    continue
                else:
                    for qualifier in col_assign:
                        qualifier_dict = col_assign[qualifier]
                        if qualifier_dict is None:
                            scenario_well_assignment[column][qualifier] = None
                        elif 'lookup' in qualifier_dict:
                            scenario_well_assignment[column][qualifier] = self._evaluate_lookup_table(
                                qualifier_dict['lookup'], well_id, column, lu_type)
                        elif 'model' in qualifier_dict:
                            scenario_well_assignment[column][qualifier] = qualifier_dict['model']
                        elif TC_LOOKUP in qualifier_dict:
                            if eval_type_curve_lookup_tables:
                                scenario_well_assignment[column][qualifier] = {
                                    'typeCurve':
                                    self._evaluate_lookup_table(
                                        qualifier_dict[TC_LOOKUP],
                                        well_id,
                                        'typeCurve',
                                        lu_type,
                                    )
                                }
                            else:
                                scenario_well_assignment[column][qualifier] = {TC_LOOKUP: qualifier_dict[TC_LOOKUP]}

                        else:
                            scenario_well_assignment[column][qualifier] = None

        return scenario_well_assignments


class LookupTableService(object):
    def __init__(self, context):
        # lookup_tables_collection
        self.context = context

    def evaluate_scenario_well_assignments(
        self,
        scenario_well_assignments,
        lookup_tables,
        eval_type_curve_lookup_tables=False,
    ):
        wells_mapping = {assignment['well']: assignment['well_header_info'] for assignment in scenario_well_assignments}
        lookup_tables_mapping = {lookup_table['_id']: lookup_table for lookup_table in lookup_tables}

        evaluator = LookupTablesEvaluator(scenario_well_assignments, wells_mapping, lookup_tables_mapping)

        return evaluator.evaluate(eval_type_curve_lookup_tables)

    def batch_get_lookup_tables(self, scenario_well_assignments, include_type_curve_lookup_tables=False):
        unique_ids = set()
        tc_unique_ids = set()

        for scenario_well_assignment in scenario_well_assignments:
            for qualifier_field in QUALIFIER_FIELDS:
                if not scenario_well_assignment.get(qualifier_field):
                    continue

                for qualifier_assignment in scenario_well_assignment[qualifier_field].values():
                    if qualifier_assignment and 'lookup' in qualifier_assignment:
                        unique_ids.add(qualifier_assignment['lookup'])

                for qualifier_assignment in scenario_well_assignment[qualifier_field].values():
                    if qualifier_assignment and TC_LOOKUP in qualifier_assignment:
                        tc_unique_ids.add(qualifier_assignment[TC_LOOKUP])

        lookup_tables = self.context.lookup_tables_collection.find({'_id': {'$in': list(unique_ids)}})
        if include_type_curve_lookup_tables:
            tc_lookup_tables = self.context.forecast_lookup_tables_collection.find(
                {'_id': {
                    '$in': list(tc_unique_ids)
                }})
        else:
            tc_lookup_tables = []

        return [*lookup_tables, *tc_lookup_tables]


class EmbeddedLookupTableService(object):
    def __init__(self, context):
        # lookup_tables_collection
        self.context = context

    def evaluate_scenario_well_assignments(self, well_header, lookup_table, assump):
        wells_mapping = {well_header['_id']: well_header}
        lookup_tables_mapping = {lookup_table.get('_id'): lookup_table}

        evaluator = LookupTablesEvaluator(well_header, wells_mapping, lookup_tables_mapping)

        # extend below return statement to all wells and all assumptions

        return evaluator._evaluate_lookup_table(
            list(lookup_tables_mapping.keys())[0],
            list(wells_mapping.keys())[0],
            assump,
            'elu',
        )

    def validate_strict_string_or_list_of_string_or_none(self, value: Union[None, str, List[str]]) -> None:
        """Validate that value is a string or list of strings or None.

        Parameters
        ----------
        value : str, list of str, or None
            The value to validate.

        Returns
        -------
        None
            If the value is valid.

        Raises
        ------
        ValueError
            If the value is not valid.
        """
        if value is None:
            return None
        if isinstance(value, str):
            return None
        if isinstance(value, list):
            if len(value) == 0:
                return None
            for item in value:
                self.validate_strict_string_or_list_of_string_or_none(item)
            return None
        raise ValueError(f'{value} is not a string or list of strings')

    def validate_strict_numeric_or_list_of_numeric_or_none(
            self, value: Optional[Union[int, float, list[int], list[float]]]) -> None:
        """Validate that value is a numeric or list of numerics or None.

        Parameters
        ----------
        value : int, float, list of int or float, or None
            The value to validate.

        Returns
        -------
        None
            If the value is valid.

        Raises
        ------
        ValueError
            If the value is not valid.
        """
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return None
        if isinstance(value, str):
            if value == '':  # treat empty string as None
                return None
            try:
                float(value)
                return None
            except ValueError:
                raise ValueError(f'{value} is not a numeric or list of numerics')
        if isinstance(value, list):
            for item in value:
                self.validate_strict_numeric_or_list_of_numeric_or_none(item)
            return None
        raise ValueError(f'{value} is not a numeric or list of numerics')

    def validate_string_like_date_or_string_like_numeric_or_none(self, value: Union[str, int, float, None]) -> None:
        """Validate that value is a date or list of dates or None.

        Parameters
        ----------
        value : date, list of date, or None
            The value to validate.

        Returns
        -------
        None
            If the value is valid.

        Raises
        ------
        ValueError
            If the value is not valid.
        """
        if value is None:
            return None
        if isinstance(value, list):
            for item in value:
                return self.validate_string_like_date_or_string_like_numeric_or_none(item)
        if isinstance(value, str):
            if len(value.split('/')) == 3:
                try:
                    datetime.datetime.strptime(value, '%m/%d/%Y')
                    return None
                except ValueError:
                    raise ValueError(f'{value} is not a date or numeric')
            elif len(value.split('/')) == 2:
                try:
                    datetime.datetime.strptime(value, '%m/%Y')
                    return None
                except ValueError:
                    raise ValueError(f'{value} is not a date or numeric')
            else:
                try:
                    float(value)
                    return None
                except ValueError:
                    raise ValueError(f'{value} is not a date or numeric')

        if isinstance(value, (int, float)):
            return None
        raise ValueError(f'{value} is not a date or numeric')

    def validate_capex_embedded_lookup_table(self, lines: List[List[Dict[str, Any]]]) -> None:
        """
        Validate that the values of the capex table are valid.
        The capex embedded lookup table contains the following keys:
            category: A string or list of strings.
            description: A string or list of strings.
            capex_expense: A string or list of strings.
            after_econ_limit: A string or list of strings.
            calculation: A string or list of strings.
            criteria_option: A string or list of strings.
            escalation_start_option: A string or list of strings.
            criteria_from_option: A string or list of strings.
            escalation_model: A string or list of strings.
            depreciation_model: A string or list of strings.
            intangible: A number or list of numbers.
            deal_terms: A number or list of numbers.
            tangible: A number or list of numbers.
            criteria_value: A date or number or list of dates or numbers.
            escalation_start_value: A date or number or list of dates or numbers.
        """
        # These keys should be strings.
        string_keys: Set[str] = {
            'category',
            'description',
            'capex_expense',
            'after_econ_limit',
            'calculation',
            'criteria_option',
            'escalation_start_option',
            'criteria_from_option',
            'escalation_model',
            'depreciation_model',
        }
        # These keys should be numbers.
        numeric_keys: Set[str] = {'intangible', 'deal_terms', 'tangible'}
        # These keys should be dates or numbers.
        date_or_numeric_keys: Set[str] = {'criteria_value', 'escalation_start_value'}
        for line in lines:
            for pair in line:
                if pair['key'] in string_keys and 'value' in pair:
                    self.validate_strict_string_or_list_of_string_or_none(pair['value'])
                elif pair['key'] in numeric_keys and 'value' in pair:
                    self.validate_strict_numeric_or_list_of_numeric_or_none(pair['value'])
                elif pair['key'] in date_or_numeric_keys and 'value' in pair:
                    self.validate_string_like_date_or_string_like_numeric_or_none(pair['value'])

    def validate_expense_embedded_lookup_table(self, lines: List[List[Dict[str, Any]]]) -> None:
        """
        Validate the expense embedded lookup table.
        The expense embedded lookup table contains the following keys:
            key: A string or list of strings.
            category: A string or list of strings.
            calculation: A string or list of strings.
            rows_calculation_method: A string or list of strings.
            criteria: A string or list of strings.
            description: A string or list of strings.
            escalation_model: A string or list of strings.
            rate_type: A string or list of strings.
            stop_at_econ_limit: A string or list of strings.
            deduct_before_ad_val_tax: A string or list of strings.
            deduct_before_severance_tax: A string or list of strings.
            affect_econ_limit: A string or list of strings.
            value: A number or list of numbers.
            cap: A number or list of numbers.
            deal_terms: A number or list of numbers.
            period: A date or number or list of dates or numbers.
        """
        string_keys = {
            'key', 'category', 'calculation', 'rows_calculation_method', 'criteria', 'description', 'escalation_model',
            'rate_type', 'stop_at_econ_limit', 'deduct_before_ad_val_tax', 'deduct_before_severance_tax',
            'affect_econ_limit'
        }
        numeric_keys = {'value', 'cap', 'deal_terms'}
        date_or_numeric_keys = {'period'}
        for line in lines:
            for pair in line:
                if pair['key'] in string_keys and 'value' in pair:
                    self.validate_strict_string_or_list_of_string_or_none(pair['value'])
                elif pair['key'] in numeric_keys and 'value' in pair:
                    self.validate_strict_numeric_or_list_of_numeric_or_none(pair['value'])
                elif pair['key'] in date_or_numeric_keys and pair['value'] != 'Flat' and 'value' in pair:
                    self.validate_string_like_date_or_string_like_numeric_or_none(pair['value'])

    def validate_embedded_lookup_lines(self, lines: List[List[Dict[str, Any]]], assumption_key: str) -> None:
        """Validate embedded lookup table lines.

        Args:
            lines (List[List[Dict[str, Any]]]): Embedded lookup table lines.
            assumption_key (str): Assumption key.
        """
        if assumption_key == 'capex':
            self.validate_capex_embedded_lookup_table(lines)
        elif assumption_key == 'expenses':
            self.validate_expense_embedded_lookup_table(lines)
        else:
            raise ValueError(f'Invalid assumption key: {assumption_key}')

    def query_embedded_lookup_tables(self, batch_input: List[dict]) -> List[dict]:
        """query and return all embedded lookup tables used in batch_input

        Args:
            batch_input: list of input data

        Returns:
            list of embedded lookup tables

        """
        # get all used embedded lookup table keys
        all_embedded_id = []
        for input in batch_input:
            for assumption in input['assumptions'].values():
                all_embedded_id.extend(assumption.get('embedded', []))

        embedded_map = {
            embed['_id']: embed
            for embed in self.context.embedded_lookup_tables_collection.find({'_id': {
                '$in': all_embedded_id
            }})
        }

        return embedded_map

    def substitute_lookup_fields(self, rule, table):
        rule = initial_embedded_process(rule['values'])

        copied_lines = copy.deepcopy(table['lines'])

        for i in range(len(copied_lines))[::-1]:
            for field in copied_lines[i]:
                if 'lookup' in field and field['lookup'] in rule:
                    field['value'] = rule[field['lookup']]
                elif 'lookup' in field and field['lookup'] not in rule and field['key'] != 'criteria_from_option':
                    copied_lines.pop(i)
                    break

        self.validate_embedded_lookup_lines(copied_lines, table['assumptionKey'])
        return copied_lines

    def evaluate_embedded_lookup_tables(self, assumption: dict, this_well_headers: dict, embedded_map: dict) -> None:
        """evaluate embedded lookup tables

        Args:
            assumption (dict): assumption
            this_well_headers (dict): this well headers
            embedded_map (dict): embedded map
        """
        assumption['fetched_embedded'] = []

        # the assigned embedded lookup can be deleted from db
        embedded_lookup_tables = [
            embedded_map[embedded_id] for embedded_id in assumption['embedded'] if embedded_id in embedded_map
        ]

        for table in embedded_lookup_tables:
            # the last variable is assumption_key which is not used for embedded lookup
            rule_matches, rule = self.evaluate_scenario_well_assignments(this_well_headers, deepcopy(table), None)

            if rule_matches:
                assumption['fetched_embedded'].append(self.substitute_lookup_fields(rule, table))

    def fill_in_embedded_lookup(self, batch_input):
        # get all used embedded lookup table keys
        embedded_map = self.query_embedded_lookup_tables(batch_input)

        for one_input in batch_input:
            this_well_headers = one_input['well']
            for assumption in one_input['assumptions'].values():
                if assumption.get('embedded'):
                    self.evaluate_embedded_lookup_tables(assumption, this_well_headers, embedded_map)
