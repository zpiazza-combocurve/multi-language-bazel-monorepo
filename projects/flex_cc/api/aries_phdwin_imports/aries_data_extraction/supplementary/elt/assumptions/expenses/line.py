import uuid

from api.aries_phdwin_imports.combine_rows import get_criteria
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.format import (clean_reference_doc,
                                                                                            get_elt_period_value,
                                                                                            get_elt_unit_value)
from api.aries_phdwin_imports.aries_import_helpers import FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT

from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.assumptions.general import (
    create_conditions_from_lines)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.configurations import (
    create_elt_configurations)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.general import (compare_docs_for_elt,
                                                                                             get_shared_keys)
from api.aries_phdwin_imports.aries_data_extraction.supplementary.elt.shared.rules import create_rules_doc
from combocurve.shared.aries_import_enums import PhaseEnum


def create_document_line(document, default_document, first_key, category):
    line = []
    has_rows = False
    if document == default_document:
        return line, has_rows

    for key, value in document.items():
        if key == 'rows':
            criteria = get_criteria(value[0])
            if criteria is not None:
                has_rows = True
                line.append({'key': 'criteria', 'value': criteria})
                period = get_elt_period_value(value, criteria)
                line.append({'key': 'period', 'value': period})
            unit_value, unit = get_elt_unit_value(value)
            if unit_value or unit is None:
                line.append({'key': 'value', 'value': unit_value})
                line.append({'key': 'unit', 'value': unit})
        elif key == 'escalation_model':
            if type(document['escalation_model']) is dict:
                escalation_id = str(document['escalation_model'].get('_id', 'none'))
                line.append({'key': key, 'value': escalation_id})
        elif value != default_document[key]:
            line.append({'key': key, 'value': value})

    if has_rows:
        line.append({'key': 'key', 'value': first_key})
        if category is not None:
            line.append({'key': 'category', 'value': category})

    return line, has_rows


def create_lines(default_document, get_default_format):
    lines = []
    expense_default_document = get_default_format('expense')

    if default_document is None:
        # TODO: add error msg
        return []

    for expense_type in default_document['econ_function']:
        if expense_type == 'variable_expenses':
            for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                for category in ['gathering', 'processing', 'transportation', 'marketing', 'other']:
                    reference_doc = expense_default_document['econ_function'][expense_type][phase][category]
                    clean_reference_doc(reference_doc)
                    line, has_rows = create_document_line(
                        default_document['econ_function'][expense_type][phase][category], reference_doc, phase,
                        category)
                    if len(line) > 0 and has_rows:
                        lines.append(line)
        elif expense_type == 'fixed_expenses':
            for category in FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT:
                reference_doc = expense_default_document['econ_function'][expense_type][category]
                clean_reference_doc(reference_doc)
                line, has_rows = create_document_line(default_document['econ_function'][expense_type][category],
                                                      reference_doc, expense_type, None)
                if len(line) > 0 and has_rows:
                    lines.append(line)
        elif expense_type == 'water_disposal':
            reference_doc = expense_default_document['econ_function'][expense_type]
            clean_reference_doc(reference_doc)
            line, has_rows = create_document_line(default_document['econ_function'][expense_type], reference_doc,
                                                  expense_type, None)
            if len(line) > 0 and has_rows:
                lines.append(line)
    return lines


def create_lines_and_conditions(default_documents, lookup_criteria, project_custom_header_alias, get_default_format):
    expense_default_document = get_default_format('expense')
    condition_doc = {}
    lines = []
    configuration = create_elt_configurations(lookup_criteria, project_custom_header_alias)
    if all(default_documents) is None:
        return

    for document in default_documents:
        if document is not None:
            rep_document = document
            break

    for expense_type in rep_document['econ_function']:
        if expense_type == 'variable_expenses':
            for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                for category in ['gathering', 'processing', 'transportation', 'marketing', 'other']:
                    reference_doc = expense_default_document['econ_function'][expense_type][phase][category]
                    clean_reference_doc(reference_doc)
                    all_econ = [reference_doc]
                    for document in default_documents:
                        if document is None:
                            continue
                        all_econ.append(document['econ_function'][expense_type][phase][category])
                    valid = create_line_conditions_by_category(all_econ,
                                                               lookup_criteria,
                                                               condition_doc,
                                                               lines,
                                                               expense_type,
                                                               phase=phase,
                                                               category=category)
                    if not valid:
                        return
        elif expense_type == 'fixed_expenses':
            for category in FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT:
                reference_doc = expense_default_document['econ_function'][expense_type][category]
                clean_reference_doc(reference_doc)
                all_econ = [reference_doc]
                for document in default_documents:
                    if document is None:
                        continue
                    all_econ.append(document['econ_function'][expense_type][category])
                valid = create_line_conditions_by_category(all_econ, lookup_criteria, condition_doc, lines,
                                                           expense_type)
                if not valid:
                    return
        elif expense_type == 'water_disposal':
            reference_doc = expense_default_document['econ_function'][expense_type]
            clean_reference_doc(reference_doc)
            all_econ = [reference_doc]
            for document in default_documents:
                if document is None:
                    continue
                all_econ.append(document['econ_function'][expense_type])
            valid = create_line_conditions_by_category(all_econ, lookup_criteria, condition_doc, lines, expense_type)
            if not valid:
                return
    rules = create_rules_doc(condition_doc, project_custom_header_alias)

    return {'lines': lines, 'rules': rules, 'configuration': configuration}


def create_line_conditions_by_category(all_econ,
                                       lookup_criteria,
                                       condition_doc,
                                       lines,
                                       expense_type,
                                       phase=None,
                                       category=None):
    lookup_econ = compare_docs_for_elt(all_econ)
    valid = True
    if len(lookup_econ) > 0:
        shared_keys = get_shared_keys(lookup_econ)
        if phase is not None:
            line = [{'key': 'key', 'value': phase}, {'key': 'category', 'value': category}]
        else:
            line = [{'key': 'key', 'value': expense_type}]
        for key in lookup_econ[0]:
            if key in shared_keys:
                if key == 'rows':
                    create_row_non_lookup_line(line, lookup_econ[0])
                elif key == 'escalation_model':
                    if type(lookup_econ[0].get(key)) is dict:
                        line.append({'key': key, 'value': str(lookup_econ[0].get(key).get('_id', 'none'))})
                else:
                    line.append({'key': key, 'value': lookup_econ[0].get(key, '')})
            else:
                if key == 'rows':
                    create_row_lookup_line(line, lookup_econ[0])
                elif key == 'escalation_model':
                    # DOES NOT HANDLE ESCALATION LOOKUP
                    continue
                else:
                    line.append({'key': key, 'lookup': f'{str(uuid.uuid4().hex)}-{key}'})
        if not any(row['key'] == 'criteria' for row in line):
            line.append({'key': 'criteria', 'value': 'entire_well_life'})

        if not any(row['key'] == 'period' for row in line):
            line.append({'key': 'period', 'value': 'Flat'})

        if not (phase is None or phase in [PhaseEnum.ngl.value, PhaseEnum.condensate.value]):
            update_shrinkage_condition_for_line(line, all_econ[1])

        lines.append(line)
        valid = create_conditions_from_lines(lookup_econ, lookup_criteria, condition_doc, line)
    return valid


def create_row_non_lookup_line(line, doc):
    criteria = get_criteria(doc['rows'][0])
    period = get_elt_period_value(doc['rows'], criteria)
    unit_value, unit = get_elt_unit_value(doc['rows'])
    line.append({'key': 'criteria', 'value': criteria})
    line.append({'key': 'period', 'value': period})
    line.append({'key': 'unit', 'value': unit})
    line.append({'key': 'value', 'value': unit_value})


def create_row_lookup_line(line, doc):
    criteria = get_criteria(doc['rows'][0])
    period = get_elt_period_value(doc['rows'], criteria)
    line.append({'key': 'criteria', 'value': criteria})
    line.append({'key': 'period', 'value': period})
    line.append({'key': 'unit', 'lookup': f'{str(uuid.uuid4().hex)}-unit'})
    line.append({'key': 'value', 'lookup': f'{str(uuid.uuid4().hex)}-value'})


def update_shrinkage_condition_for_line(line, doc):
    """
    Updates the shrinkage condition for a given line in a document.

    Parameters:
        line (list[dict]): The line to update, represented as a list of dictionaries.
        doc (dict): The document containing the shrinkage condition.

    Returns:
        None

    Description:
        This function checks if the 'shrinkage_condition' key is present in the 'line' list of dictionaries. If the key
        is not found, a new dictionary containing the 'shrinkage_condition' key and its corresponding value from the
        'doc' dictionary is appended to the 'line' list.

        If the 'shrinkage_condition' key is already present in the 'line' list, no action is taken.

        Example usage:
        >>> line = [{'key': 'some_key', 'value': 'some_value'}]
        >>> doc = {'shrinkage_condition': 'unshrunk'}
        >>> update_shrinkage_condition_for_line(line, doc)
        >>> print(line)
        [{'key': 'some_key', 'value': 'some_value'}, {'key': 'shrinkage_condition', 'value': 'unshrunk'}]
    """
    if not any(row['key'] == 'shrinkage_condition' for row in line):
        line.append({'key': 'shrinkage_condition', 'value': doc.get('shrinkage_condition', 'unshrunk')})
