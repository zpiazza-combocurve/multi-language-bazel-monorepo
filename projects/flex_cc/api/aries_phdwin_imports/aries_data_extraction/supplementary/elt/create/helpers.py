from bson import ObjectId

from .....combine_rows import all_equal, FIXED_EXPENSE_CATEGORY, sum_rows, variable_expenses_category
from .....helpers import check_and_remove_well_from_previous_model, get_well_doc_overlay
from combocurve.shared.aries_import_enums import EconEnum, PhaseEnum
from ...elt.shared.format import clean_reference_doc


def update_elt_doc_project(
    document,
    lines,
    is_lookup,
    elt_details,
    elt_doc,
    elt_type,
    project_id,
    elt_data_list,
    elt_info_dict,
):
    document, elt_id, created = add_document_to_elt_data_list(document, lines, elt_info_dict, elt_details[2], elt_type,
                                                              project_id)
    if created:
        elt_data_list.append(document)
    elt_doc['data'] = elt_id

    return document['name']


def add_document_to_elt_data_list(document, lines, elt_info_dict, name, elt_type, project_id):
    """
        Add a new document to the ELT data list and update the elt_info_dict.

        Parameters:
        document (dict): A dictionary containing the document to be added to the ELT data list.
        lines (list): A list of strings representing the lines of the document.
        elt_info_dict (dict): A dictionary containing the information of the existing ELT elements.
        name (str): A string representing the name of the ELT element.
        elt_type (str): A string representing the type of the ELT element.
        project_id (ObjectId): An ObjectId representing the ID of the project.

        Returns:
        tuple: A tuple containing the updated document dictionary and the ObjectId of the new ELT element.

    """
    elt_id = None
    lines, rules, configuration = get_key_elt_objects(lines)
    created = False

    if len(lines) == 0:
        return document, elt_id, created

    if name in elt_info_dict:
        allocated_name = None
        for idx, stored_line in enumerate(elt_info_dict[name]['stored_lines']):
            stored_rules = elt_info_dict[name]['stored_rules'][idx]
            stored_configuration = elt_info_dict[name]['stored_configurations'][idx]
            if (check_if_two_lines_are_equal(lines, stored_line) and check_if_two_rules_are_equal(rules, stored_rules)
                    and all_equal([configuration, stored_configuration])):
                allocated_name = name if idx == 0 else f'{name}_{idx}'
                elt_id = elt_info_dict[name]['_ids'][idx]
                document['_id'] = elt_id
                break
        if allocated_name is None:
            created_idx = len(elt_info_dict[name]['stored_lines'])
            elt_info_dict[name]['stored_lines'].append(lines)
            elt_info_dict[name]['stored_rules'].append(rules)
            elt_info_dict[name]['stored_configurations'].append(configuration)

            allocated_name = f'{name}_{created_idx}'
            elt_id = ObjectId()
            document['_id'] = elt_id
            elt_info_dict[name]['_ids'].append(document['_id'])
            created = True
        document['name'] = allocated_name
    else:
        elt_id = ObjectId()
        elt_info_dict[name] = {
            'stored_lines': [lines],
            'stored_rules': [rules],
            'stored_configurations': [configuration],
            '_ids': [elt_id]
        }
        document['name'] = name
        document['_id'] = elt_info_dict[name]['_ids'][-1]
        created = True

    document['assumptionKey'] = elt_type
    document['project'] = project_id
    document['lines'] = lines
    document['rules'] = rules
    document['configuration'] = configuration

    return document, elt_id, created


def get_key_elt_objects(lines):
    default_configuration = {"caseInsensitiveMatching": True, "selectedHeaders": [], "selectedHeadersMatchBehavior": {}}
    if type(lines) is dict:
        # please do not change this order, take a good look at it and see why
        rules = lines.get('rules', [])
        configuration = lines.get('configuration', default_configuration)
        lines = lines.get('lines', [])

    else:
        rules, configuration = [], default_configuration

    return lines, rules, configuration


def check_if_two_lines_are_equal(list1, list2):
    """
    Compares two lists of lists of dictionaries and returns True if they contain the same data regardless of order.

    Args:
        list1 (list): First list of lists of dictionaries.
        list2 (list): Second list of lists of dictionaries.

    Returns:
        bool: True if the two lists contain the same data, False otherwise.
    """
    if len(list1) != len(list2):
        return False

    # Flatten the lists and convert each dictionary to a frozenset of its items
    # to ignore the order of keys within the dictionaries
    flat_list1 = [
        frozenset(process_line_dictionary(dictionary).items()) for ls in list1 for dictionary in ls
        if 'lookup' not in dictionary
    ]
    flat_list2 = [
        frozenset(process_line_dictionary(dictionary).items()) for ls in list2 for dictionary in ls
        if 'lookup' not in dictionary
    ]

    # Convert the lists to sets and compare them
    set1 = set(flat_list1)
    set2 = set(flat_list2)

    return set1 == set2


def process_line_dictionary(d):
    return {key: (tuple(value) if type(value) is list else value) for key, value in d.items()}


def update_doc_with_elt_id(document, elt_id):
    if 'embeddedLookupTables' in document:
        if elt_id not in document['embeddedLookupTables']:
            document['embeddedLookupTables'].append(elt_id)
    else:
        document['embeddedLookupTables'] = [elt_id]


def check_if_two_rules_are_equal(rule1, rule2):
    """
        Compares two data structures represented as lists of dictionaries, and returns True if the dictionaries in
        the first data structure are the same as the dictionaries in the second one,
        ignoring the unique identifiers in the "key" field.

        Args:
            data_structure1 (list): First data structure to compare.
            data_structure2 (list): Second data structure to compare.

        Returns:
            bool: True if the dictionaries in the first data structure are the same as the dictionaries
            in the second one, False otherwise.
    """
    # Create a set of values for each unique key in the first data structure
    ### DOES NOT CHECK CHILDREN VALUES!!!!!
    values_dict1 = {}
    for d in rule1:
        for cond in d['conditions']:
            key = cond['key']
            if key not in values_dict1:
                values_dict1[key] = set()
            values_dict1[key].add(cond['operator'])
            values_dict1[key].add(cond['value'])
        for val in d['values']:
            key = val['key'].split('-', 1)[1]  # Extract the string after the first dash
            if key not in values_dict1:
                values_dict1[key] = set()

            if 'value' in val:
                if type(val['value']) is list:
                    values_dict1[key].add(tuple(val['value']))
                else:
                    values_dict1[key].add(val['value'])

    # Create a set of values for each unique key in the second data structure
    values_dict2 = {}
    for d in rule2:
        for cond in d['conditions']:
            key = cond['key']
            if key not in values_dict2:
                values_dict2[key] = set()
            values_dict2[key].add(cond['operator'])
            values_dict2[key].add(cond['value'])
        for val in d['values']:
            key = val['key'].split('-', 1)[1]  # Extract the string after the first dash
            if key not in values_dict2:
                values_dict2[key] = set()

            if 'value' in val:
                if type(val['value']) is list:
                    values_dict2[key].add(tuple(val['value']))
                else:
                    values_dict2[key].add(val['value'])

    # Compare the sets of values for each unique key
    for key in set(values_dict1.keys()) | set(values_dict2.keys()):
        if key not in values_dict1 or key not in values_dict2:
            return False
        values1 = values_dict1[key]
        values2 = values_dict2[key]
        if values1 != values2:
            return False

    return True


def apply_late_elt_rollback(aries_extract, data_list, well_props, elt_type):
    (scenario_id, property_id, document_name) = well_props
    combined_document = None
    created_document = get_well_doc_overlay(data_list, property_id, [scenario_id])
    if created_document is None:
        combined_document = aries_extract.flattened_elt_case
    else:
        if elt_type in elt_type_combination_dict:
            combination_func, default_format_selector = elt_type_combination_dict[elt_type]
            combined_document = combination_func(aries_extract.flattened_elt_case, created_document,
                                                 aries_extract.get_default_format(default_format_selector))
    if combined_document is not None:
        combined_document['wells'] = set()
        combined_document['wells'].add((scenario_id, property_id))
        check_and_remove_well_from_previous_model(data_list, [(property_id, None)], property_id, None, [scenario_id])
        aries_extract.compare_and_save_into_self_data_list(combined_document,
                                                           data_list,
                                                           aries_extract.projects_dic,
                                                           document_name,
                                                           aries=True)


# TODO: use kwargs
def combine_expense_document(document_1, document_2, default_document):
    # variable expenses
    # loop through phases
    for phase in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
            PhaseEnum.water.value
    ]:
        if phase != PhaseEnum.water.value:
            for category in variable_expenses_category:
                selected_doc_1 = document_1[EconEnum.econ_function.value][
                    EconEnum.variable_expense.value][phase][category]
                selected_doc_2 = document_2[EconEnum.econ_function.value][
                    EconEnum.variable_expense.value][phase][category]
                selected_doc_default = default_document[EconEnum.econ_function.value][
                    EconEnum.variable_expense.value][phase][category]
                combined_category_doc = create_the_combined_document(selected_doc_1, selected_doc_2,
                                                                     selected_doc_default)
                default_document[EconEnum.econ_function.value][
                    EconEnum.variable_expense.value][phase][category] = combined_category_doc
        else:
            selected_doc_default = default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value]
            selected_doc_1 = document_1[EconEnum.econ_function.value][EconEnum.water_disposal.value]
            selected_doc_2 = document_2[EconEnum.econ_function.value][EconEnum.water_disposal.value]
            combined_category_doc = create_the_combined_document(selected_doc_1, selected_doc_2, selected_doc_default)
            default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value] = combined_category_doc
    for category in FIXED_EXPENSE_CATEGORY:
        selected_doc_default = default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category]
        selected_doc_1 = document_1[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category]
        selected_doc_2 = document_2[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category]
        combined_category_doc = create_the_combined_document(selected_doc_1, selected_doc_2, selected_doc_default)
        default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category] = combined_category_doc

    return default_document


def combine_capex_document(document_1, document_2, default_document):
    for row in document_2[EconEnum.econ_function.value]['other_capex']['rows']:
        document_1[EconEnum.econ_function.value]['other_capex']['rows'].append(row)

    return document_1


def create_the_combined_document(selected_doc_1, selected_doc_2, selected_doc_default):
    created_category, has_row_1, has_row_2 = combine_category_row_document(selected_doc_1, selected_doc_2,
                                                                           selected_doc_default["rows"])
    for key, value in selected_doc_default.items():
        if key not in ['rows', 'escalation_model']:
            update_created_category_row_document(selected_doc_1, selected_doc_2, created_category, has_row_1, has_row_2,
                                                 key, value)
            if selected_doc_1.get(key) == selected_doc_2.get(key):
                if selected_doc_1.get(key) is not None:
                    created_category[key] = selected_doc_1.get(key)
                else:
                    created_category[key] = value
            else:
                if has_row_1 and has_row_2 or not (has_row_1 or has_row_2):
                    created_category[key] = value
                elif has_row_1:
                    created_category[key] = selected_doc_1.get(key)
                elif has_row_2:
                    created_category[key] = selected_doc_2.get(key)
    update_created_category_row_document(selected_doc_1,
                                         selected_doc_2,
                                         created_category,
                                         has_row_1,
                                         has_row_2,
                                         'escalation_model',
                                         'none',
                                         escalation=True)
    return created_category


def update_created_category_row_document(selected_doc_1,
                                         selected_doc_2,
                                         created_category,
                                         has_row_1,
                                         has_row_2,
                                         key,
                                         default_value,
                                         escalation=False):
    values_equal = selected_doc_1.get(key) == selected_doc_2.get(key) if not escalation else compare_escalation(
        selected_doc_1, selected_doc_2)
    if values_equal:
        if selected_doc_1.get(key) is not None:
            created_category[key] = selected_doc_1.get(key)
        else:
            created_category[key] = default_value
    else:
        if has_row_1 and has_row_2 or not (has_row_1 or has_row_2):
            created_category[key] = default_value
        elif has_row_1:
            created_category[key] = selected_doc_1.get(key)
        elif has_row_2:
            created_category[key] = selected_doc_1.get(key)


def compare_escalation(selected_doc_1, selected_doc_2):
    if isinstance(selected_doc_1.get('escalation_model'), type(selected_doc_2.get('escalation_model'))):
        if type(selected_doc_1.get('escalation_model')) is dict:
            return selected_doc_1.get('escalation_model').get(
                EconEnum.econ_function.value) == selected_doc_2.get('escalation_model').get(
                    EconEnum.econ_function.value)
        return True
    return False


def combine_category_row_document(selected_doc_1, selected_doc_2, value):
    created_category = {}
    key = "rows"
    clean_reference_doc({key: value})
    has_row_1, has_row_2 = False, False
    if selected_doc_1.get(key) == value or selected_doc_2.get(key) == value:
        if selected_doc_1.get(key) == value and selected_doc_2.get(key) == value:
            created_category[key] = value
        elif selected_doc_1.get(key) == value:
            has_row_2 = True
            created_category[key] = selected_doc_2.get(key)
        else:
            has_row_1 = True
            created_category[key] = selected_doc_1.get(key)
    else:
        combined_rows = sum_rows([selected_doc_1.get(key, []) + selected_doc_2.get(key, [])])
        if combined_rows:
            has_row_1, has_row_2 = True, True
            created_category[key] = combined_rows
        else:
            created_category[key] = value
    return created_category, has_row_1, has_row_2


# TODO: Add default format selector
elt_type_combination_dict = {
    'expenses': (combine_expense_document, 'expense'),
    'capex': (combine_capex_document, 'capex')
}
