import copy
import numpy as np

from api.cc_to_cc.helper import (selection_validation, number_validation, esca_depre_validation, bool_validation,
                                 standard_date_str)
from api.cc_to_cc.file_headers import (get_assumption_empty_row, fill_in_model_type_and_name, ColumnName, EMISSION_KEY)
from api.cc_to_cc.type_hints import EmissionModel, EmissionModelExportRow, EmissionModelEconFunction, ErrorRecord
from combocurve.science.network_module.ghg_units import emission_categories, emission_units, emission_ghgs

EMISSION_ROW_ECON = {
    'selected': '',
    'category': '',
    'co2e': '',
    'co2': '',
    'ch4': '',
    'n2o': '',
    'unit': '',
    'escalation_model': '',
}

emission_categories_rev = {emission_categories[k]: k for k in emission_categories}

emission_units_rev = {emission_units[k]: k for k in emission_units}


def emission_export(model: EmissionModel, esca_id_to_name: dict) -> list[EmissionModelExportRow]:
    rows = []

    econ_function = model['econ_function']

    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    common_row = get_assumption_empty_row(EMISSION_KEY)

    common_row[ColumnName.updatedAt.value] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    for cat_dict in econ_function['table']:
        cat_row = copy.deepcopy(common_row)
        cat_row.update({
            ColumnName.selected.value: cat_dict['selected'],
            ColumnName.category.value: emission_categories.get(cat_dict['category']),
            ColumnName.CO2e.value: cat_dict['co2e'],
            ColumnName.CO2.value: cat_dict['co2'],
            ColumnName.CH4.value: cat_dict['ch4'],
            ColumnName.N2O.value: cat_dict['n2o'],
            ColumnName.unit.value: emission_units.get(cat_dict['unit']),
            ColumnName.escalation_model.value: esca_id_to_name.get(cat_dict['escalation_model']),
        })
        rows.append(cat_row)

    return rows


def emission_import(model_array: np.ndarray, header: list,
                    esca_name_dict: dict) -> tuple[EmissionModelEconFunction, list[ErrorRecord]]:
    econ_model_table = []
    error_list = []

    for row_index, csv_row in enumerate(model_array):
        this_csv_dict = dict(zip(header, csv_row))
        this_emission = copy.deepcopy(EMISSION_ROW_ECON)

        this_emission['selected'] = bool_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Selected',
            row_index=row_index,
        )

        this_emission['category'] = emission_categories_rev.get(
            selection_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Category',
                options=emission_categories_rev,
                row_index=row_index,
            ))
        for ghg_key, ghg_label in emission_ghgs.items():
            this_emission[ghg_key] = number_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key=ghg_label,
                required=True,
                row_index=row_index,
            )
        if this_emission['co2e'] and (this_emission['co2'] or this_emission['ch4'] or this_emission['n2o']):
            error_list.append({
                'error_message': 'CO2e and (CO2, CH4, N2O) can not be used together',
                'row_index': row_index
            })

        this_emission['unit'] = emission_units_rev.get(
            selection_validation(
                error_list=error_list,
                input_dict=this_csv_dict,
                input_key='Unit',
                options=emission_units_rev,
                row_index=row_index,
            ))
        this_emission['escalation_model'] = esca_depre_validation(
            error_list=error_list,
            input_dict=this_csv_dict,
            input_key='Escalation',
            name_dict=esca_name_dict,
            row_index=row_index,
        )

        econ_model_table.append(this_emission)

    return {'table': econ_model_table}, error_list
