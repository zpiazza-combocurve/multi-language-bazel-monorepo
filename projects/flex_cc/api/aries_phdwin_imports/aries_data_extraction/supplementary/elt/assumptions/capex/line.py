import uuid

import pandas as pd

from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.assumptions.general import (
    create_conditions_from_lines)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.configurations import (
    create_elt_configurations)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.general import get_shared_keys
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.rules import create_rules_doc


def create_lines_and_conditions(default_documents, lookup_criteria, project_custom_header_alias, get_default_format):
    default_obj = {
        "category": "other_investment",
        "date": "1800-01-31",
        "tangible": 0,
        "intangible": 0,
        "capex_expense": "capex",
        "after_econ_limit": "no",
        "calculation": "gross",
        "depreciation_model": "none",
        "escalation_model": "none",
        "escalation_start": {
            'as_of_date': 0
        },
        "deal_terms": 1,
        "description": "",
    }

    if all(default_documents) is None:
        return {'lines': [], 'rules': [], 'configuration': {}}

    for document in default_documents:
        if document is not None:
            rep_document = document
            break

    lines = []
    rules = []
    condition_doc = {}

    configuration = create_elt_configurations(lookup_criteria, project_custom_header_alias)

    first_rows = rep_document['econ_function']['other_capex']['rows']

    lookup_line_template = compare_elt_obj(default_obj, first_rows)

    if len(lookup_line_template) > 1:
        for idx, line_template in enumerate(lookup_line_template[1:]):
            all_templates = [line_template] + [
                doc['econ_function']['other_capex']['rows'][idx + 1] for doc in default_documents[1:] if doc is not None
            ]
            shared_keys = get_shared_keys(all_templates)
            line = []
            for key, value in default_obj.items():
                if key in line_template:
                    if key in shared_keys:
                        add_non_lookup_line(line, key, line_template.get(key))
                    else:
                        add_lookup_line(line, key)
                else:
                    add_non_lookup_line(line, key, value)
            if len(line) > 0:
                lines.append(line)
                current_row = [{
                    'rows': [document['econ_function']['other_capex']['rows'][idx + 1]]
                } for document in default_documents if document is not None]
                valid = create_conditions_from_lines(current_row, lookup_criteria, condition_doc, line, capex=True)
                if not valid:
                    return
        rules = create_rules_doc(condition_doc, project_custom_header_alias)

    return {'lines': lines, 'rules': rules, 'configuration': configuration}


def add_lookup_line(line, key):
    """
        Appends a new line to the given list `line` with the specified `key`.
        If the `key` contains any of the criteria identifiers ('offset', 'rate', 'date'),
        separate 'criteria_option', 'criteria_from_option', and 'criteria_value' lines
        are added, each with a unique lookup identifier. Otherwise, a single line is
        added with the specified key and a unique lookup identifier.

        Args:
            line (list): A list of dictionaries representing the lines in the output document.
            key (str): The key of the line to be added.

        Returns:
            None
    """
    if any(criteria_identifier in key for criteria_identifier in ['offset', 'rate', 'date']):
        # formated_date = pd.to_datetime(value).strftime('%m/%d/%Y') if 'date' in key else value
        line.append({'key': 'criteria_option', 'lookup': f'{str(uuid.uuid4().hex)}-criteria_option'})
        line.append({'key': 'criteria_from_option', 'lookup': f'{str(uuid.uuid4().hex)}-criteria_from_option'})
        line.append({'key': 'criteria_value', 'lookup': f'{str(uuid.uuid4().hex)}-criteria_value'})
    elif key == 'escalation_start':
        line.append({'key': 'escalation_start_option', 'value': f'{str(uuid.uuid4().hex)}-escalation_start_option'})
        line.append({'key': 'escalation_start_value', 'value': f'{str(uuid.uuid4().hex)}-escalation_start_value'})
    else:
        line.append({'key': key, 'lookup': f'{str(uuid.uuid4().hex)}-{key}'})


def add_non_lookup_line(line, key, value):
    """
        Appends a new line to the given list `line` with the specified `key` and `value`.
        If the `key` contains any of the criteria identifiers ('offset', 'rate', 'date'),
        the `value` is formatted accordingly and added as separate 'criteria_option'
        and 'criteria_value' lines. Otherwise, the `key` and `value` are added as a
        single line with the specified keys.

        Args:
            line (list): A list of dictionaries representing the lines in the output document.
            key (str): The key of the line to be added.
            value (str): The value of the line to be added.

        Returns:
            None
    """
    if any(criteria_identifier in key for criteria_identifier in ['offset', 'rate', 'date']):
        formated_date = pd.to_datetime(value).strftime('%m/%d/%Y') if 'date' in key else value
        line.append({'key': 'criteria_option', 'value': key})
        line.append({'key': 'criteria_value', 'value': formated_date})
    elif key == 'escalation_model':
        if type(value) is dict:
            escalation_id = str(value.get('_id'))
            line.append({'key': key, 'value': escalation_id})
        else:
            line.append({'key': key, 'value': "none"})
    elif key == 'escalation_start':
        if type(value) is dict and 'date' in value:
            # ONLY HANDLE DATE FOR NOW IN ARIES IMPORT (need to add more criteria)
            line.append({'key': 'escalation_start_option', 'value': 'date'})
            line.append({
                'key': 'escalation_start_value',
                'value': pd.to_datetime(value.get('date')).strftime('%m/%d/%Y')
            })
        else:
            line.append({'key': 'escalation_start_option', 'value': 'as_of_date'})
            line.append({'key': 'escalation_start_value', 'value': 0})

    else:
        line.append({'key': key, 'value': value})


def compare_elt_obj(ref_dict, dict_list):
    """
    Accepts a reference dictionary and a list of dictionaries as input. Each dictionary is
    compared with the reference dictionary. Any key in the reference dictionary that has a
    different value in a dictionary in the list is kept, while the others are removed.
    Each dictionary is treated independently, meaning that a key in one dictionary can be kept
    while it is deleted in another.

    Args:
    - ref_dict (dict): A dictionary representing the reference dictionary.
    - dict_list (list): A list of dictionaries to compare against the reference dictionary.

    Returns:
    - A new list of dictionaries that consist of the original dictionaries with only the keys
    that were identified to have changed.
    """
    result = []
    for dictionary in dict_list:
        new_dict = {}
        for key in ref_dict:
            if key in dictionary and ref_dict[key] != dictionary[key]:
                new_dict[key] = dictionary[key]
        if new_dict:
            result.append(new_dict)
    return result


def create_lines(default_document, get_default_format):
    lines = []
    default_obj = {
        "category": "other_investment",
        "date": "1800-01-31",
        "tangible": 0,
        "intangible": 0,
        "capex_expense": "capex",
        "after_econ_limit": "no",
        "calculation": "gross",
        "depreciation_model": "none",
        "escalation_model": "none",
        "deal_terms": 1,
        "description": "",
    }
    if default_document is None:
        return lines

    for row in default_document['econ_function']['other_capex']['rows']:
        line = []
        for key, value in row.items():
            if any(criteria_identifier in key for criteria_identifier in ['offset', 'rate', 'date']):
                formated_date = pd.to_datetime(value).strftime('%m/%d/%Y') if 'date' in key else value
                line.append({'key': 'criteria_option', 'value': key})
                line.append({'key': 'criteria_value', 'value': formated_date})
            elif key == 'escalation_model':
                if type(value) is dict:
                    line.append({'key': key, 'value': str(value.get('_id', 'none'))})
            elif value != default_obj.get(key):
                line.append({'key': key, 'value': value})
        if len(line) > 0:
            line.append({'key': 'escalation_start_value', 'value': 0})
            lines.append(line)

    return lines
