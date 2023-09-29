import numpy as np

from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName, ESCALATION_KEY
from combocurve.science.econ.default_econ_assumptions import get_default
from api.cc_to_cc.helper import (row_view_process, selection_validation, number_validation, multi_line_to_rows,
                                 standard_date_str)
from combocurve.shared.econ_tools.econ_model_tools import CriteriaEnum, CRITERIA_MAP_DICT, UNIT_MAP, UnitKeyEnum

ESCALATION_FREQUENCY_MAPPER = {'monthly': 'Monthly', 'yearly': 'Yearly', 'constant': 'Constant'}

CALCULATION_METHOD_MAPPER = {'simple': 'Simple', 'compound': 'Compound'}


def escalation_export(model):
    econ_dict = model['econ_function'][ColumnName.escalation_model.name]

    # common row
    common_row = get_assumption_empty_row(ESCALATION_KEY)
    common_row[ColumnName.updatedAt.value] = model[ColumnName.updatedAt.name].strftime(standard_date_str)
    common_row[ColumnName.key.value] = ESCALATION_KEY
    common_row = fill_in_model_type_and_name(common_row, model)
    common_row[ColumnName.escalation_frequency.value] = ESCALATION_FREQUENCY_MAPPER.get(
        econ_dict.get(ColumnName.escalation_frequency.name))
    common_row[ColumnName.calculation_method.value] = CALCULATION_METHOD_MAPPER.get(
        econ_dict.get(ColumnName.calculation_method.name))

    # csv rows
    return row_view_process(common_row, econ_dict)


def escalation_import(well_array, header):
    econ_function = get_default(ESCALATION_KEY)
    error_list = []

    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, header.index('Key')]])
    for i in range(len(well_key_list)):
        if well_key_list[i] != ESCALATION_KEY:
            error_list.append({
                'error_message': f'Key can only be {ESCALATION_KEY}',
                'row_index': i,
            })

    # if escalation row exist
    is_escalation_row = well_key_list == ESCALATION_KEY
    if sum(is_escalation_row) == 0:
        return econ_function, error_list

    # get first row to fetch common rows
    first_escalation_row_idx = np.where(is_escalation_row)[0][0]
    first_escalation_row = dict(zip(header, well_array[first_escalation_row_idx]))

    econ_function[ColumnName.escalation_model.name][ColumnName.escalation_frequency.name] = selection_validation(
        error_list=error_list,
        input_dict=first_escalation_row,
        input_key=ColumnName.escalation_frequency.value,
        options=ESCALATION_FREQUENCY_MAPPER.keys(),
        row_index=first_escalation_row_idx,
    )

    econ_function[ColumnName.escalation_model.name][ColumnName.calculation_method.name] = selection_validation(
        error_list=error_list,
        input_dict=first_escalation_row,
        input_key=ColumnName.calculation_method.value,
        options=CALCULATION_METHOD_MAPPER.keys(),
        row_index=first_escalation_row_idx,
    )

    # fetch criteria rows
    escalation_list = well_array[is_escalation_row]
    escalation_list_index = np.where(is_escalation_row)[0]
    criteria_map_dict_rev = {CRITERIA_MAP_DICT[i]: i for i in CRITERIA_MAP_DICT}
    unit_map_dict_rev = {UNIT_MAP[i]: i for i in UNIT_MAP}

    criteria = selection_validation(
        error_list=error_list,
        input_dict=first_escalation_row,
        input_key=ColumnName.criteria.value,
        options=[CriteriaEnum.month_period.value, CriteriaEnum.entire_well_life.value, CriteriaEnum.dates.value],
        row_index=first_escalation_row_idx,
    )

    unit = selection_validation(
        error_list=error_list,
        input_dict=first_escalation_row,
        input_key=ColumnName.unit.value,
        options=[UNIT_MAP[item] for item in [UnitKeyEnum.DOLLAR_PER_YEAR.value, UnitKeyEnum.PCT_PER_YEAR.value]],
        row_index=first_escalation_row_idx,
    )

    econ_criteria = criteria_map_dict_rev.get(criteria)
    econ_unit = unit_map_dict_rev.get(unit)

    if criteria == CriteriaEnum.entire_well_life.value:
        if len(escalation_list) > 1:
            for i in range(1, len(escalation_list)):
                error_list.append({
                    'error_message': 'Duplicated row of Flat Period',
                    'row_index': escalation_list_index[i]
                })
            rows = []
        else:
            rows = [{
                econ_criteria:
                'Flat',
                econ_unit:
                number_validation(
                    error_list=error_list,
                    input_dict=first_escalation_row,
                    input_key=ColumnName.value.value,
                    required=True,
                    row_index=first_escalation_row_idx,
                )
            }]
    else:
        escalation_dict_list = [dict(zip(header, p)) for p in escalation_list]
        rows = multi_line_to_rows(error_list, escalation_dict_list, econ_criteria, econ_unit, escalation_list_index)

    econ_function[ColumnName.escalation_model.name]['rows'] = rows

    return econ_function, error_list
