import copy

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.helpers import format_econ_assumptions

from combocurve.shared.aries_import_enums import EconHeaderEnum


def create_cc_document_from_elt_data(aries_extract, elt_data_dict, ls_scenarios_id, scenario, property_id):
    try:
        for value in elt_data_dict.values():
            data = None
            array_data = value['data']
            elt_type = value['type']
            if elt_type == 'expenses':
                if type(array_data) is list:
                    for idx, array in enumerate(array_data):
                        if array is None:
                            continue
                        backup_data = None
                        data = format_econ_assumptions(array,
                                                       value['headers'],
                                                       ls_scenarios_id,
                                                       scenario,
                                                       property_id,
                                                       aries_extract.tax_expense.model_extraction,
                                                       section=[EconHeaderEnum.tax_expense_section_key.value],
                                                       elt=True)
                        if data is not None:
                            aries_extract.elt_expense_data_list = [data]
                            backup_data = copy.deepcopy(data)
                            try:
                                data = format_econ_assumptions(array,
                                                               value['headers'],
                                                               ls_scenarios_id,
                                                               scenario,
                                                               property_id,
                                                               aries_extract.overlay.model_extraction,
                                                               section=[9],
                                                               elt=True)
                            except Exception:
                                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.overlay.value)
                                aries_extract.log_report.log_error(
                                    message=message,
                                    scenario=scenario,
                                    well=property_id,
                                    model=ErrorMsgEnum.overlay.value,
                                    severity=ErrorMsgSeverityEnum.error.value,
                                )
                        data = backup_data if data is None else data
                        value['data'][idx] = data
                    continue
                else:
                    backup_data = None
                    data = format_econ_assumptions(value['data'],
                                                   value['headers'],
                                                   ls_scenarios_id,
                                                   scenario,
                                                   property_id,
                                                   aries_extract.tax_expense.model_extraction,
                                                   section=[EconHeaderEnum.tax_expense_section_key.value],
                                                   elt=True)
                    if data is not None:
                        aries_extract.elt_expense_data_list = [data]
                        # overlay model extraction
                        backup_data = copy.deepcopy(data)
                        try:
                            data = format_econ_assumptions(value['data'],
                                                           value['headers'],
                                                           ls_scenarios_id,
                                                           scenario,
                                                           property_id,
                                                           aries_extract.overlay.model_extraction,
                                                           section=[9],
                                                           elt=True)
                        except Exception:
                            message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.overlay.value)
                            aries_extract.log_report.log_error(
                                message=message,
                                scenario=scenario,
                                well=property_id,
                                model=ErrorMsgEnum.overlay.value,
                                severity=ErrorMsgSeverityEnum.error.value,
                            )
                        data = backup_data if data is None else data
                    value['data'] = data
                    continue
            elif elt_type == 'capex':
                if type(array_data) is list:
                    for idx, array in enumerate(array_data):
                        data = format_econ_assumptions(array,
                                                       value['headers'],
                                                       ls_scenarios_id,
                                                       scenario,
                                                       property_id,
                                                       aries_extract.capex.model_extraction,
                                                       section=[EconHeaderEnum.capex_section_key.value],
                                                       keyword_mark=['ABAN', 'PLUG', 'SALV'],
                                                       elt=True)
                        value['data'][idx] = data
                    continue
                else:
                    data = format_econ_assumptions(value['data'],
                                                   value['headers'],
                                                   ls_scenarios_id,
                                                   scenario,
                                                   property_id,
                                                   aries_extract.capex.model_extraction,
                                                   section=[EconHeaderEnum.capex_section_key.value],
                                                   keyword_mark=['ABAN', 'PLUG', 'SALV'],
                                                   elt=True)
                    # TODO: if data is None add Error message
                    value['data'] = data
                    continue
            value['data'] = None
        aries_extract.elt_data_dict.update(elt_data_dict)
    except Exception:
        aries_extract.log_report.log_error(
            message=ErrorMsgEnum.error_processing_lookup.value,
            scenario=scenario,
            well=property_id,
            severity=ErrorMsgSeverityEnum.error.value,
        )
