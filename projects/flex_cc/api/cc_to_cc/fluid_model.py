import numpy as np
from copy import deepcopy

from api.cc_to_cc.helper import number_validation, get_phase_name, standard_date_str
from api.cc_to_cc.file_headers import (get_assumption_empty_row, fill_in_model_type_and_name, ColumnName,
                                       FLUID_MODEL_KEY, FLUID_MODEL_COMPONENTS)
from api.cc_to_cc.type_hints import FluidModel, FluidModelExportRow, FluidModelEconFunction, ErrorRecord
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT, PhaseEnum

FLUID_MODEL_PHASES = [
    PhaseEnum.oil.value, PhaseEnum.gas.value, 'water', PhaseEnum.ngl.value, PhaseEnum.drip_condensate.value
]


def fluid_model_export(model: FluidModel) -> list[FluidModelExportRow]:
    rows = []

    econ_function = model['econ_function']

    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    common_row = get_assumption_empty_row(FLUID_MODEL_KEY)

    common_row[ColumnName.updatedAt.value] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    for phase, phase_dict in econ_function.items():
        phase_row = deepcopy(common_row)
        phase_row.update({
            ColumnName.phase.value: get_phase_name(phase),
            ColumnName.criteria.value: CRITERIA_MAP_DICT.get(phase_dict['criteria'], 'flat'),
        })

        for component, comp_dict in phase_dict['composition'].items():
            phase_row[component] = comp_dict['percentage']

        rows.append(phase_row)

    return rows


def fluid_model_import(model_array: np.ndarray, header: list) -> tuple[FluidModelEconFunction, list[ErrorRecord]]:
    econ_model = deepcopy(getattr(NetworkDefaults, FLUID_MODEL_KEY))
    error_list = []

    phase_col_idx = header.index('Phase')

    phase_list = np.array([x.strip() if x is not None else x for x in model_array[:, phase_col_idx]])

    for i in range(len(phase_list)):
        this_phase = phase_list[i]

        if this_phase not in FLUID_MODEL_PHASES:
            error_list.append({'error_message': 'Wrong or missing Phase', 'row_index': i})

    for phase in FLUID_MODEL_PHASES:
        if phase not in phase_list:
            continue
        else:
            one_phase_list = model_array[phase_list == phase]
            row_index = np.where(phase_list == phase)[0]
            if len(one_phase_list) > 1:
                for i in range(1, len(one_phase_list)):
                    error_list.append({'error_message': f'Duplicated row of {phase} Phase', 'row_index': row_index[i]})
            phase_row_dict = dict(zip(header, one_phase_list[0]))
            first_row_index = row_index[0]
            phase_model = phase if phase != 'drip cond' else 'drip_condensate'

            for component in FLUID_MODEL_COMPONENTS:
                comp_pct = number_validation(
                    error_list=error_list,
                    input_dict=phase_row_dict,
                    input_key=component,
                    required=False,
                    row_index=first_row_index,
                    min_value=0,
                    max_value=100,
                )
                econ_model[phase_model]['composition'][component]['percentage'] = comp_pct if comp_pct else 0

    return econ_model, error_list
