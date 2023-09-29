import copy
import numpy as np
from api.cc_to_cc.helper import (selection_validation, number_validation, str_to_display, row_view_process,
                                 multi_line_to_rows, get_phase_name, equals_to_default, esca_depre_validation,
                                 standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName,\
    DIFFERENTIALS_KEY

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.econ_tools.econ_model_tools import UnitKeyEnum, PhaseEnum, UNIT_MAP

DIFFERENTIALS_KEYS = ['differentials_1', 'differentials_2', 'differentials_3']
DIFFERENTIALS_PHASES = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.drip_condensate.value]

CRITERIA_MAP_DICT = {'entire_well_life': 'flat', 'offset_to_as_of_date': 'as of', 'dates': 'dates'}

DIFF_UNIT_KEYS = [
    UnitKeyEnum.DOLLAR_PER_BBL.value,
    UnitKeyEnum.DOLLAR_PER_MMBTU.value,
    UnitKeyEnum.DOLLAR_PER_MCF.value,
    UnitKeyEnum.DOLLAR_PER_GAL.value,
    UnitKeyEnum.PCT_OF_BASE_PRICE.value,
]

DIFF_UNIT_MAP = {key: UNIT_MAP[key] for key in DIFF_UNIT_KEYS}


def differentials_export(model, esca_id_to_name, include_default):
    default_expense = get_default(DIFFERENTIALS_KEY)

    rows = []

    econ_function = model['econ_function']

    differentials = econ_function[DIFFERENTIALS_KEY]

    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    common_row = get_assumption_empty_row(DIFFERENTIALS_KEY)

    common_row[ColumnName.updatedAt.value] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    for diff_key in differentials:
        for phase in differentials[diff_key]:
            phase_diff = differentials[diff_key][phase]

            if (not include_default) and equals_to_default(phase_diff,
                                                           default_expense[DIFFERENTIALS_KEY][diff_key][phase]):
                continue

            diff_row = copy.deepcopy(common_row)
            diff_row[ColumnName.key.value] = diff_key
            diff_row[ColumnName.phase.value] = get_phase_name(phase)

            escalation_id = differentials[diff_key][phase].get(ColumnName.escalation_model.name, 'None')
            diff_row[ColumnName.escalation_model.value] = esca_id_to_name.get(escalation_id, 'None')

            diff_rows = row_view_process(diff_row, phase_diff)

            rows += diff_rows

    return rows


def differentials_import(well_array, header, esca_name_dict):
    differentials = get_default('differentials')
    error_list = []

    key_col_idx = header.index('Key')
    phase_col_idx = header.index('Phase')

    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, key_col_idx]])
    well_phase_list = np.array([x.strip() if x is not None else x for x in well_array[:, phase_col_idx]])

    for i in range(len(well_phase_list)):
        this_phase = well_phase_list[i]
        this_key = well_key_list[i]

        if this_key not in DIFFERENTIALS_KEYS:
            error_list.append({'error_message': 'Wrong value of Key', 'row_index': i})

        if this_phase not in DIFFERENTIALS_PHASES:
            error_list.append({'error_message': 'Wrong value of Phase', 'row_index': i})

    for key in DIFFERENTIALS_KEYS:
        if key not in well_key_list:
            continue

        one_diff_phase_list = well_phase_list[well_key_list == key]

        for phase in DIFFERENTIALS_PHASES:
            one_diff_phase_idx = (well_key_list == key) & (well_phase_list == phase)

            if phase not in one_diff_phase_list:
                continue

            phase_model = phase if phase != PhaseEnum.drip_condensate.value else PhaseEnum.drip_condensate.name

            differentials_list = well_array[one_diff_phase_idx]
            row_index = np.where(one_diff_phase_idx)[0]

            differentials_row_dict = dict(zip(header, differentials_list[0]))
            first_row_index = row_index[0]
            phase_dict = {}

            phase_dict['escalation_model'] = esca_depre_validation(
                error_list=error_list,
                input_dict=differentials_row_dict,
                input_key='Escalation',
                name_dict=esca_name_dict,
                row_index=first_row_index,
            )

            criteria = selection_validation(
                error_list=error_list,
                input_dict=differentials_row_dict,
                input_key='Criteria',
                options=list(CRITERIA_MAP_DICT.values()),
                row_index=first_row_index,
            )

            criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}
            if criteria:
                econ_criteria = criteria_map_dict_rev[criteria]
            else:
                econ_criteria = None

            unit = selection_validation(
                error_list=error_list,
                input_dict=differentials_row_dict,
                input_key='Unit',
                options=list(DIFF_UNIT_MAP.values()),
                row_index=first_row_index,
            )

            unit_map_dict_rev = {DIFF_UNIT_MAP[k]: k for k in DIFF_UNIT_MAP}

            oil_unit_check = phase == PhaseEnum.oil.value and unit not in [
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], DIFF_UNIT_MAP[UnitKeyEnum.PCT_OF_BASE_PRICE.value]
            ]
            gas_unit_check = phase == PhaseEnum.gas.value and unit not in [
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MMBTU.value],
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MCF.value],
                DIFF_UNIT_MAP[UnitKeyEnum.PCT_OF_BASE_PRICE.value],
            ]
            ngl_unit_check = phase == PhaseEnum.ngl.value and unit not in [
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value],
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_GAL.value],
                DIFF_UNIT_MAP[UnitKeyEnum.PCT_OF_BASE_PRICE.value],
            ]
            drip_cond_unit_check = phase == PhaseEnum.drip_condensate.value and unit not in [
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value],
                DIFF_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_GAL.value],
                DIFF_UNIT_MAP[UnitKeyEnum.PCT_OF_BASE_PRICE.value],
            ]

            if (unit not in unit_map_dict_rev.keys() or oil_unit_check or gas_unit_check or ngl_unit_check
                    or drip_cond_unit_check):
                error_list.append({
                    'error_message': f'Unit of {str_to_display(phase)} is Invalid!',
                    'row_index': first_row_index
                })
                econ_unit = None
            else:
                econ_unit = unit_map_dict_rev[unit]

            if criteria == 'flat':
                rows = [{
                    econ_criteria:
                    'Flat',
                    econ_unit:
                    number_validation(
                        error_list=error_list,
                        input_dict=differentials_row_dict,
                        input_key='Value',
                        required=True,
                        row_index=first_row_index,
                    )
                }]
                if len(differentials_list) > 1:
                    for i in range(1, len(differentials_list)):
                        error_list.append({'error_message': 'Duplicated row of Flat Period', 'row_index': row_index[i]})
            else:
                differentials_dict_list = [dict(zip(header, p)) for p in differentials_list]
                rows = multi_line_to_rows(error_list, differentials_dict_list, econ_criteria, econ_unit, row_index)

            phase_dict['rows'] = rows
            differentials['differentials'][key][phase_model] = phase_dict

    return differentials, error_list
