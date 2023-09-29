import copy
import numpy as np
from api.cc_to_cc.helper import (selection_validation, number_validation, str_to_display, row_view_process,
                                 multi_line_to_rows, esca_depre_validation, get_phase_name, equals_to_default,
                                 standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName, PRICING_KEY

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.econ_tools.econ_model_tools import UnitKeyEnum, PhaseEnum, UNIT_MAP

PRICE_MODEL_KEY = 'price_model'

PRICING_PHASES = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.drip_condensate.value]

CRITERIA_MAP_DICT = {'entire_well_life': 'flat', 'offset_to_as_of_date': 'as of', 'dates': 'dates'}

PRICE_UNIT_KEYS = [
    UnitKeyEnum.DOLLAR_PER_BBL.value,
    UnitKeyEnum.DOLLAR_PER_MMBTU.value,
    UnitKeyEnum.DOLLAR_PER_MCF.value,
    UnitKeyEnum.DOLLAR_PER_GAL.value,
    UnitKeyEnum.PCT_OF_OIL_PRICE.value,
]

PRI_UNIT_MAP = {key: UNIT_MAP[key] for key in PRICE_UNIT_KEYS}


def pricing_export(model, esca_id_to_name, include_default=True):
    default_expense = get_default(PRICING_KEY)

    rows = []

    econ_function = model['econ_function']

    pricing = econ_function[PRICE_MODEL_KEY]
    pricing_options = model['options'][PRICE_MODEL_KEY]

    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    common_row = get_assumption_empty_row(PRICING_KEY)

    common_row[ColumnName.updatedAt.value] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    for phase in pricing:
        phase_price = pricing[phase]
        phase_price_options = pricing_options[phase]['subItems']

        if (not include_default) and equals_to_default(phase_price, default_expense[PRICE_MODEL_KEY][phase]):
            continue

        price_row = copy.deepcopy(common_row)
        price_row[ColumnName.phase.value] = get_phase_name(phase)
        price_row[ColumnName.cap.value] = phase_price[ColumnName.cap.name]

        escalation_id = phase_price_options[ColumnName.escalation_model.name]['value']
        price_row[ColumnName.escalation_model.value] = esca_id_to_name.get(escalation_id, 'None')

        price_rows = row_view_process(price_row, phase_price)

        rows += price_rows

    return rows


def pricing_import(well_array, header, esca_name_dict):
    pricing = get_default('pricing')
    error_list = []

    phase_col_idx = header.index('Phase')

    well_phase_list = np.array([x.strip() if x is not None else x for x in well_array[:, phase_col_idx]])

    for i in range(len(well_phase_list)):
        this_phase = well_phase_list[i]

        if this_phase not in PRICING_PHASES:
            error_list.append({'error_message': 'Wrong value of Phase', 'row_index': i})

    for phase in PRICING_PHASES:
        phase_model = phase if phase != 'drip cond' else 'drip_condensate'
        if phase not in well_phase_list:
            continue
        else:
            pricing_list = well_array[well_phase_list == phase]
            row_index = np.where(well_phase_list == phase)[0]

            pricing_row_dict = dict(zip(header, pricing_list[0]))
            first_row_index = row_index[0]
            phase_dict = {}

            phase_dict['cap'] = number_validation(
                error_list=error_list,
                input_dict=pricing_row_dict,
                input_key='Cap',
                required=False,
                row_index=first_row_index,
            )

            phase_dict['escalation_model'] = esca_depre_validation(
                error_list=error_list,
                input_dict=pricing_row_dict,
                input_key='Escalation',
                name_dict=esca_name_dict,
                row_index=first_row_index,
            )

            criteria = selection_validation(
                error_list=error_list,
                input_dict=pricing_row_dict,
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
                input_dict=pricing_row_dict,
                input_key='Unit',
                options=list(PRI_UNIT_MAP.values()),
                row_index=first_row_index,
            )

            unit_map_dict_rev = {PRI_UNIT_MAP[k]: k for k in PRI_UNIT_MAP}

            oil_unit_check = phase == PhaseEnum.oil.value and unit != PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value]
            gas_unit_check = phase == PhaseEnum.gas.value and unit not in [
                PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MMBTU.value], PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MCF.value]
            ]
            ngl_unit_check = phase == PhaseEnum.ngl.value and unit not in [
                PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value],
                PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_GAL.value],
                PRI_UNIT_MAP[UnitKeyEnum.PCT_OF_OIL_PRICE.value],
            ]
            drip_cond_unit_check = phase == PhaseEnum.drip_condensate.value and unit not in [
                PRI_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], PRI_UNIT_MAP[UnitKeyEnum.PCT_OF_OIL_PRICE.value]
            ]

            if (unit not in unit_map_dict_rev.keys() or oil_unit_check or gas_unit_check or ngl_unit_check
                    or drip_cond_unit_check):
                error_list.append({
                    'error_message': f'Unit of {str_to_display(phase)} is Invalid!',
                    'row_index': first_row_index
                })
                econ_unit = None
            else:
                econ_unit = 'price' if phase == 'oil' else unit_map_dict_rev[unit]

            if criteria == 'flat':
                rows = [{
                    econ_criteria:
                    'Flat',
                    econ_unit:
                    number_validation(
                        error_list=error_list,
                        input_dict=pricing_row_dict,
                        input_key='Value',
                        required=True,
                        row_index=first_row_index,
                    )
                }]
                if len(pricing_list) > 1:
                    for i in range(1, len(pricing_list)):
                        error_list.append({'error_message': 'Duplicated row of Flat Period', 'row_index': row_index[i]})
            else:
                pricing_dict_list = [dict(zip(header, p)) for p in pricing_list]
                rows = multi_line_to_rows(error_list, pricing_dict_list, econ_criteria, econ_unit, row_index)

            phase_dict['rows'] = rows
            pricing['price_model'][phase_model] = phase_dict

    return pricing, error_list
