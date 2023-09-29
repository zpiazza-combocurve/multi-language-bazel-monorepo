import copy
import datetime

from .....aries_import_helpers import get_model_name_from_qualifiers
from .....error import ErrorMsgEnum, ErrorMsgSeverityEnum
from .....helpers import check_and_remove_well_from_previous_model, get_well_doc_overlay

from ...elt.assumptions.capex.line import create_lines as create_capex_lines
from ...elt.assumptions.capex.line import create_lines_and_conditions as create_capex_lines_and_condtions

from ...elt.assumptions.expenses.line import create_lines as create_expense_lines
from ...elt.assumptions.expenses.line import create_lines_and_conditions as create_expense_lines_and_condtions

from ...elt.create.helpers import apply_late_elt_rollback, update_elt_doc_project, update_doc_with_elt_id


def convert_cc_base_document_to_cc_elt_document(aries_extract):
    # elt_info_dict is used in storing information related to each sidefile/lookup name
    # {model_name: {'elt_name': '_ids': [], 'stored_lines': []}, ...}, ...}
    # each elt_name can be used multiple times if a reference data is used
    # list stores all the ids and lines of each name
    elt_info_dict = {}

    try:
        key_ls = list(aries_extract.elt_data_dict.keys())
        aries_extract.pending_elt_doc = None
        aries_extract.pending_elt_name = ""
        aries_extract.flattened_elt_case = None
        for idx, (key, value) in enumerate(aries_extract.elt_data_dict.items()):
            current_scenario_well_elt_type = (key[1], value.get('type'))
            if idx != len(key_ls) - 1:
                next_scenario_well_elt_type = (key_ls[idx + 1][1],
                                               aries_extract.elt_data_dict[key_ls[idx + 1]].get('type'))
            else:
                next_scenario_well_elt_type = None

            aries_extract.scenario_well_end = current_scenario_well_elt_type != next_scenario_well_elt_type
            format_elt_doc_to_list_and_assign(aries_extract, elt_info_dict, key, value)
    except Exception:
        message = ErrorMsgEnum.generate_all_elt_errors.value
        aries_extract.log_report.log_error(message=message, severity=ErrorMsgSeverityEnum.error.value)


def format_elt_doc_to_list_and_assign(aries_extract, elt_info_dict, key, value):
    data = value['data']
    # if no data ignore
    if data is None:
        return

    elt_type = value['type']
    lookup_criteria_data = value.get('lookup_data')
    is_lookup = lookup_criteria_data is not None
    default_document = aries_extract.get_default_format('embedded-lookup-tables')

    assumption_name_to_elt_props = {
        'expenses': {
            'data_list': aries_extract.expense_data_list,
            'create_line_func': create_expense_lines,
            'create_line_condition_func': create_expense_lines_and_condtions,
            'default_format': 'expense'
        },
        'capex': {
            'data_list': aries_extract.capex_data_list,
            'create_line_func': create_capex_lines,
            'create_line_condition_func': create_capex_lines_and_condtions,
            'default_format': 'capex'
        }
    }
    # create
    if elt_type not in elt_info_dict:
        elt_info_dict[elt_type] = {}

    if elt_type in assumption_name_to_elt_props:
        data_list = assumption_name_to_elt_props[elt_type]['data_list']
        create_line_func = assumption_name_to_elt_props[elt_type]['create_line_func']
        if is_lookup:
            case_index = value.get('case_index')
            if case_index is not None:
                aries_extract.flattened_elt_case = data[case_index]
            try:
                aries_extract.update_custom_project_header_dict(lookup_criteria_data, key[1])
                lines = assumption_name_to_elt_props[elt_type]['create_line_condition_func'](
                    data, lookup_criteria_data, aries_extract.project_customer_header_alias,
                    aries_extract.get_default_format)
            except Exception:
                apply_late_elt_rollback(aries_extract, data_list, key, elt_type)
                return

            if lines is None:
                if aries_extract.flattened_elt_case is not None:
                    apply_late_elt_rollback(aries_extract, data_list, key, elt_type)
                return
        else:
            lines = create_line_func(data, aries_extract.get_default_format)
        elt_name = update_elt_doc_project(default_document, lines, is_lookup, key, value, elt_type,
                                          aries_extract.project_id, aries_extract.elt_data_list,
                                          elt_info_dict[elt_type])

        original_doc = get_well_doc_overlay(data_list, key[1], [key[0]])
        elt_id = value.get('data')
        if elt_id is None:
            return

        # signifies that this doc does not exist in the model data list
        if original_doc is None:
            # check if a doc has already been created for this specifically for ELT
            # if it has already been created
            # the pending_elt_doc will not be None
            # therefore if the pending_elt_doc is None creating a new doc specifically for this scenario wells elt
            if aries_extract.pending_elt_doc is None:
                default_document = aries_extract.get_default_format(
                    assumption_name_to_elt_props[elt_type]['default_format'])
                default_document['wells'].add((key[0], key[1]))
                if elt_type == 'capex':
                    default_document['econ_function']['other_capex']['rows'].pop(0)
                default_document['createdAt'] = datetime.datetime.now()
                default_document['updatedAt'] = datetime.datetime.now()
                default_document['embeddedLookupTables'] = [elt_id]
                aries_extract.pending_elt_doc = default_document
                aries_extract.pending_elt_name = get_model_name_from_qualifiers("", elt_name,
                                                                                aries_extract.pending_elt_name, {})
            else:
                # if not add the elt_id to the created doc
                aries_extract.pending_elt_doc['embeddedLookupTables'].append(elt_id)
                aries_extract.pending_elt_name = get_model_name_from_qualifiers("", elt_name,
                                                                                aries_extract.pending_elt_name, {})

            # if this is the last id for this scenario_well
            # copy the doc from the pending_elt_doc and compare and save
            if aries_extract.scenario_well_end and aries_extract.pending_elt_doc is not None:
                default_document = copy.deepcopy(aries_extract.pending_elt_doc)
                aries_extract.compare_and_save_into_self_data_list(default_document,
                                                                   data_list,
                                                                   aries_extract.projects_dic,
                                                                   aries_extract.pending_elt_name,
                                                                   aries=True)
                aries_extract.pending_elt_doc = None
                aries_extract.pending_elt_name = ""

        else:
            # if the doc exists in the model data list
            update_doc_with_elt_id(original_doc, elt_id)
            check_and_remove_well_from_previous_model(data_list, [(key[1], None)], key[1], None, [key[0]])
            original_doc['createdAt'] = datetime.datetime.now()
            original_doc['updatedAt'] = datetime.datetime.now()
            original_doc['wells'] = set()
            original_doc['wells'].add((key[0], key[1]))
            aries_extract.compare_and_save_into_self_data_list(original_doc,
                                                               data_list,
                                                               aries_extract.projects_dic,
                                                               f"{original_doc['name']}*&*{elt_name}",
                                                               aries=True)
