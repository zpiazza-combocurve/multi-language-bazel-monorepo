import pandas as pd

from operator import itemgetter

from api.aries_phdwin_imports.combine_rows import get_criteria, get_unit_key_and_clean_row_for_taxes
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.format import get_elt_unit_value

AND_SEPARATOR = '**&**'

PERC_SEPARATOR = '*%%*'


def create_conditions_from_lines(lookup_econ, criteria_data, condition_doc, lines, capex=False):  # noqa (C901)
    has_ratio = False
    # has_interpolation = False
    max_period = get_period_length(lines)
    for idx, doc in enumerate(lookup_econ):
        conditions = []
        for criteria_idx, criteria_ls in enumerate(criteria_data[idx][:-1]):
            criterion, variable_criteria, column_name = itemgetter('criterion', 'variable', 'column_name')(criteria_ls)
            if criterion == 'R':
                has_ratio = True
                ratio_idx = criteria_idx

            if criterion == 'I':
                pass
                # has_interpolation = True
                # interpolation_idx = criteria_idx

            conditions.append(f'{column_name}{PERC_SEPARATOR}{variable_criteria}')
        condition_key = AND_SEPARATOR.join(conditions)
        rules_values = []

        for key_value in lines:
            if 'lookup' in key_value:
                lookup_identifier = key_value['lookup']
                search_string = lookup_identifier.split('-')[-1]
                if search_string in ['unit', 'value']:
                    if search_string == 'unit':
                        rules_values.append({
                            'childrenValues': [],
                            "key": lookup_identifier,
                            'value': get_unit_key_and_clean_row_for_taxes(doc.get('rows'))
                        })

                    elif search_string == 'value':
                        elt_values = get_elt_unit_value(doc.get('rows'))[0]
                        value_length = len(elt_values) if type(elt_values) is list else 1
                        if value_length != max_period:
                            return False

                        if has_ratio:
                            variable_criteria, current_criteria = itemgetter('variable',
                                                                             'current')(criteria_data[idx][ratio_idx])
                            elt_values = get_original_ratio_values(elt_values, current_criteria, variable_criteria)
                        rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": elt_values})
                elif search_string == 'criteria_from_option':
                    rules_values.append({'childrenValues': [], "key": lookup_identifier})
                elif search_string == 'criteria_option':
                    criteria = get_criteria(doc['rows'][0])
                    rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": criteria})
                elif search_string == 'criteria_value':
                    criteria = get_criteria(doc['rows'][0])
                    formated_date = pd.to_datetime(doc['rows'][0][criteria]).strftime(
                        '%m/%d/%Y') if 'date' in criteria else doc['rows'][0][criteria]
                    rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": formated_date})
                elif search_string == 'escalation_start_value':
                    if doc['rows'][0].get('escalation_start') is dict and 'date' in doc['rows'][0].get(
                            'escalation_start'):
                        esc_start = doc['rows'][0].get('escalation_start').get('date')
                        rules_values.append({
                            'childrenValues': [],
                            "key": lookup_identifier,
                            "value": pd.to_datetime(esc_start).strftime('%m/%d/%Y')
                        })
                    else:
                        rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": 0})
                elif search_string == 'escalation_start_option':
                    if doc['rows'][0].get('escalation_start') is dict and 'date' in doc['rows'][0].get(
                            'escalation_start'):
                        rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": 'date'})
                    else:
                        rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": 'as_of_date'})
                elif search_string == 'escalation_model':
                    if type(doc['rows'][0].get(search_string)) is dict:
                        escalation_id = str(doc['rows'][0].get(search_string).get('_id', 'none'))
                        rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": escalation_id})
                else:
                    if capex:
                        line_value = doc['rows'][0].get(search_string)
                    else:
                        line_value = doc.get(search_string)
                    if search_string == 'cap':
                        if has_ratio:
                            variable_criteria, current_criteria = itemgetter('variable',
                                                                             'current')(criteria_data[idx][ratio_idx])
                            elt_values = get_original_ratio_values(line_value, current_criteria, variable_criteria)
                    rules_values.append({'childrenValues': [], "key": lookup_identifier, "value": line_value})

        if condition_key in condition_doc:
            condition_doc[condition_key] = [*condition_doc[condition_key], *rules_values]
        else:
            condition_doc[condition_key] = rules_values

    return True


def get_original_ratio_values(values, numerator, denominator, cap=False):
    """
        Divides each value in the provided list by a given numerator divided by a denominator.

       Args:
          values (list/numeric value): A list of numeric values or a single numeric value.
           numerator (numeric value): The numerator used in the division calculation.
          denominator (numeric value): The denominator used in the division calculation.

        Returns:
            A list of values where each value has been divided by the result of the division of the numerator
            by the denominator,
            or a single value if only one value was passed in.
            If a value in the list cannot be divided because it is not numeric, it is replaced with None.
    """

    # Check if the values parameter is a list

    try:
        numerator = float(numerator)
        denominator = float(denominator)
    except (TypeError, ValueError):
        return values

    if isinstance(values, list):
        # Divide each value in the list by the numerator/denominator ratio
        result = []
        for value in values:
            if isinstance(value, (int, float)):
                result.append(round(value / (numerator / denominator), 2))
            else:
                result.append(None)
        return result
    else:
        # If the values parameter is not a list, assume it's a single value
        if isinstance(values, (int, float)):
            return round(values / (numerator / denominator), 2)
        else:
            if cap:
                return ""


def get_period_length(ls):
    """
    Get the length of the period from a list of items.

    This function iterates through the provided list and looks for an item with the key 'period'. If found, it retrieves
    the associated value, which represents the period length. The length is determined based on the value being a list
    or a single element. If the 'period' item is not found, the default period length is assumed to be 1.

    Args:
        ls (list): A list of items.

    Returns:
        int: The length of the period.

    Example:
        items = [
            {'key': 'name', 'value': 'John'},
            {'key': 'age', 'value': 30},
            {'key': 'period', 'value': [1, 2, 3, 4, 5]}
        ]
        period_length = get_period_length(items)

        # Output:
        period_length = 5

    Note:
        The function assumes that the provided list contains dictionaries as items, where each dictionary has a 'key'
        and 'value' pair. The 'value' associated with the 'period' key determines the length of the period. If the
        'value' is a list, the length of the list is considered as the period length. If the 'value' is not a list,
        the default period length of 1 is returned.

    """
    max_period = 1
    for item in ls:
        if item.get('key') == 'period':
            max_period = len(item.get('value')) if type(item.get('value')) is list else 1
            break
    return max_period
