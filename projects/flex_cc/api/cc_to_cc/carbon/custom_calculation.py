import pandas as pd
import uuid
from bson import ObjectId
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.helper import (get_node_model_id, common_node_export, common_node_import, selection_validation,
                                 str_to_display, log_duplicated_row, display_to_str, formula_validation)
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import (CUSTOM_CALCULATION_KEY, CUSTOM_NODE_OPTIONS,
                                                                  EMISSION_CATEGORIES, EMISSION_TYPES)

emission_categories_rev = {v: k for k, v in EMISSION_CATEGORIES.items()}
emission_types_rev = {v: k for k, v in EMISSION_TYPES.items()}


def custom_calculation_export(model: dict, model_rows: list) -> tuple[list, str]:
    """ Flattens the nested dict of a single custom calculation node into a list of dicts that can be
    written to an Excel sheet. Function is called in carbon_export.
    """
    export_rows = []
    node_type = model['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
    model_id = get_node_model_id(node_type, model_rows)
    fluid_model = model['params']['fluid_model']
    active_formula = model['params']['active_formula']
    # formula_dict = {'Gas': 'Gas*1'), prepends a space if first character is @ to avoid Excel invalid formula error
    formula_dict = {
        row['output']: row['formula'] if row['formula'][0] != '@' else f" {row['formula']}"
        for row in model['params']['formula'][active_formula]
    }
    common_row = get_assumption_empty_row(CUSTOM_CALCULATION_KEY)
    # update common_row dict with common node fields
    common_node_export(common_row, model, model_id)
    common_row.update({ColumnName.fluid_model.value: fluid_model['name'] if fluid_model else ''})
    for row in model['params']['inputs']:
        if row['assign']:
            one_row = deepcopy(common_row)
            one_row[ColumnName.inputs.value] = row['name']
            export_rows.append(one_row)
    for row in model['params']['outputs']:
        key = row['name']
        one_row = deepcopy(common_row)
        one_row.update({
            ColumnName.outputs.value: key,
            ColumnName.category.value: EMISSION_CATEGORIES.get(row['category'], ''),
            ColumnName.emission_type.value: str_to_display(row['emission_type'], '_') if key != 'Gas' else '',
            ColumnName.formula.value: formula_dict.get(key, '')
        })
        export_rows.append(one_row)
    return export_rows, model_id


def custom_calculation_import(node_df: pd.DataFrame, fluid_model_df: pd.DataFrame, shape_multipliers: dict,
                              error_list: list) -> tuple[dict, str, Optional[ObjectId]]:
    """ Transforms a DataFrame for a single custom_calculation node into a nested dict that can be upserted in a mongo
    doc. Function is called in carbon_import.
    """
    fluid_model_id = None
    document = deepcopy(getattr(NetworkDefaults, CUSTOM_CALCULATION_KEY))
    valid_stream_inputs = {}
    co2e_assigned = False
    ghg_assigned = False
    input_stream_assigned = False

    document['id'] = str(uuid.uuid4())
    first_row = node_df.iloc[0, :]
    # update document with common node fields
    common_node_import(CUSTOM_CALCULATION_KEY, first_row, document, shape_multipliers)

    fluid_model_name = first_row[ColumnName.fluid_model.value]
    if fluid_model_name:
        fluid_model = fluid_model_df.loc[fluid_model_df['name'] == str(fluid_model_name), '_id']
        if fluid_model.empty:
            # fluid model not in project
            error_list.append({
                'error_message': f'Fluid Model {fluid_model_name} not in project!',
                'row_index': int(node_df.index[0])
            })

        else:
            fluid_model_id = ObjectId(fluid_model.values[0])
    document['params']['fluid_model'] = fluid_model_id

    for key in [ColumnName.inputs, ColumnName.outputs]:
        default_io = document['params'][key.name]
        # map input or output dict to its index by its name {'Oil': 0, 'Gas': 1, 'Water': 2}
        io_map = {default_io[i]['name']: i for i in range(len(default_io))}
        col = f'std_{key.value}'
        node_df[col] = node_df[key.value].apply(display_to_str)
        io_df = node_df.loc[node_df[col].notnull()]
        if not io_df.empty:
            duplicate_df = io_df.loc[io_df.duplicated(subset=[col])]
            if not duplicate_df.empty:
                for field in duplicate_df[col].unique():
                    log_duplicated_row(
                        error_list=error_list,
                        input_df=duplicate_df.loc[duplicate_df[col] == field, :],
                        field=field,
                        field_type=f'custom_{key.value.lower()}',
                    )

            for idx, row in io_df.iterrows():
                row_dict = dict(row)
                io_field = selection_validation(
                    error_list=error_list,
                    input_dict=row_dict,
                    input_key=key.value,
                    options=CUSTOM_NODE_OPTIONS[key.name],
                    row_index=idx,
                )

                if io_field is not None:
                    # find the index of dict in the default_io list that matches the io_field name, e.g. 'Gas'
                    io_idx = io_map[io_field]
                    if key == ColumnName.outputs:

                        category = selection_validation(
                            error_list=error_list,
                            input_dict=row_dict,
                            input_key=ColumnName.category.value,
                            options=list(emission_categories_rev.keys()),
                            row_index=idx,
                        )
                        emission_type = selection_validation(
                            error_list=error_list,
                            input_dict=row_dict,
                            input_key=ColumnName.emission_type.value,
                            options=list(emission_types_rev.keys()),
                            row_index=idx,
                        ) if io_field != 'Gas' else ''
                        document['params'][key.name][io_idx].update({
                            'category':
                            emission_categories_rev.get(category, CUSTOM_CALCULATION_KEY),
                            'emission_type':
                            emission_types_rev.get(emission_type, 'N/A' if io_field == 'Gas' else 'vented'),
                        })
                        formula = formula_validation(
                            error_list=error_list,
                            input_dict=row_dict,
                            input_key=ColumnName.formula.value,
                            stream_inputs=valid_stream_inputs,
                            functions=CUSTOM_NODE_OPTIONS['functions'] if valid_stream_inputs else {},
                            row_index=idx,
                        )
                        if formula is not None:
                            document['params']['formula']['simple'].append({
                                'output': io_field,
                                'formula': formula.strip()
                            })
                            if io_field == 'Gas' and not input_stream_assigned:
                                error_list.append({
                                    'error_message': 'Cannot use Gas Output without an Input stream',
                                    'row_index': idx,
                                })
                            document['params'][key.name][io_idx].update({'assign': True})
                            if io_field == 'CO2e':
                                co2e_assigned = True
                                if ghg_assigned:
                                    error_list.append({
                                        'error_message': 'Cannot use CO2e in the same node as CO2, CH4, or N2O',
                                        'row_index': idx,
                                    })
                            elif io_field in ['CO2', 'CH4', 'N2O']:
                                ghg_assigned = True
                                if co2e_assigned:
                                    error_list.append({
                                        'error_message': f'Cannot use {io_field} in the same node as CO2e',
                                        'row_index': idx,
                                    })
                    else:
                        document['params'][key.name][io_idx].update({'assign': True})
                        # keep track of valid stream inputs for formula validation but only need the dict keys
                        valid_stream_inputs.update({io_field: {}})
                        input_stream_assigned = True

    return document, document['id'], fluid_model_id
