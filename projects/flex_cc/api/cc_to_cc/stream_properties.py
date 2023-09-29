import copy
import numpy as np
from api.cc_to_cc.helper import (first_available_value, number_validation, selection_validation, multi_line_row_view,
                                 multi_line_to_rows, equals_to_default, RATE_TYPE_OPTIONS,
                                 ROWS_CALCULATION_METHOD_OPTIONS, standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT

from combocurve.shared.econ_tools.econ_model_tools import RATE_BASED_ROW_KEYS

KEY_MAP_DICT = {
    'yields': 'yields',
    'shrinkage': 'shrinkage',
    'loss_flare': 'loss & flare',
    'btu_content': 'btu',
}

CAT_MAP_DICT = {
    'ngl': 'ngl',
    'drip_condensate': 'drip cond',
    'oil': 'oil',
    'gas': 'gas',
    'oil_loss': 'oil loss',
    'gas_loss': 'gas loss',
    'gas_flare': 'gas flare',
    'unshrunk_gas': 'unshrunk gas',
    'shrunk_gas': 'shrunk gas',
}


def stream_properties_export(model, include_default=False):
    row_list = []

    default_sp = get_default('stream_properties')
    last_update_str = model['updatedAt'].strftime(standard_date_str)

    # common row
    common_row = get_assumption_empty_row('stream_properties')
    common_row['Last Update'] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    # yields, shrinkage, loss & flare
    for key in ['yields', 'shrinkage', 'loss_flare']:
        econ_dict = model['econ_function'][key]

        if key == 'yields':
            econ_cat_list = ['ngl', 'drip_condensate']
        elif key == 'shrinkage':
            econ_cat_list = ['oil', 'gas']
        else:
            econ_cat_list = ['oil_loss', 'gas_loss', 'gas_flare']

        rate_type = econ_dict.get(ColumnName.rate_type.name, RATE_TYPE_OPTIONS[0]).replace('_', ' ')
        rows_calculation_method = econ_dict.get(ColumnName.rows_calculation_method.name,
                                                ROWS_CALCULATION_METHOD_OPTIONS[0]).replace('_', ' ')

        for cat in econ_cat_list:
            sub_econ_dict = econ_dict[cat]

            if (not include_default) and equals_to_default(sub_econ_dict, default_sp[key][cat]):
                continue

            csv_row = copy.deepcopy(common_row)

            csv_row['Key'] = KEY_MAP_DICT[key]
            csv_row['Category'] = CAT_MAP_DICT[cat]

            if key == 'yields':
                csv_row['Unit'] = 'bbl/mmcf'
            else:
                csv_row['Unit'] = '% remaining'

            row_view = sub_econ_dict['rows']
            row_keys = list(row_view[0].keys())

            if set(row_keys) & set(RATE_BASED_ROW_KEYS):
                csv_row[ColumnName.rate_type.value] = rate_type
                csv_row[ColumnName.rows_calculation_method.value] = rows_calculation_method

            for rk in row_keys:
                if rk in ['yield', 'pct_remaining']:
                    unit_key = rk
                elif rk in ['unshrunk_gas', 'shrunk_gas']:
                    this_shrinkage = rk.split('_')[0]
                    csv_row['Gas Shrinkage Condition'] = this_shrinkage
                else:
                    this_criteria_key = rk
                    this_criteria = CRITERIA_MAP_DICT[rk]
                    csv_row['Criteria'] = this_criteria

            if this_criteria == 'flat':
                csv_row['Value'] = row_view[0][unit_key]
                row_list.append(csv_row)
            else:
                row_list = row_list + multi_line_row_view(
                    csv_row,
                    row_view,
                    [unit_key],
                    this_criteria_key,
                )

    # btu
    btu_content = model['econ_function']['btu_content']
    for btu_cat in btu_content:
        if btu_content[btu_cat] == default_sp['btu_content'][btu_cat]:
            continue
        btu_row = copy.deepcopy(common_row)
        btu_row['Key'] = KEY_MAP_DICT['btu_content']
        btu_row['Category'] = CAT_MAP_DICT[btu_cat]
        btu_row['Unit'] = 'mbtu/mcf'
        btu_row['Value'] = btu_content[btu_cat]
        row_list.append(btu_row)

    return row_list


def stream_properties_import(well_array, header):  # noqa C901
    stream_properties = get_default('stream_properties')
    error_list = []

    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, header.index('Key')]])
    well_cat_list = np.array([x.strip() if x is not None else x for x in well_array[:, header.index('Category')]])

    rate_type_col_idx = header.index(ColumnName.rate_type.value)
    rows_calculation_method_col_idx = header.index(ColumnName.rows_calculation_method.value)

    # check error for key and category column
    for i in range(len(well_key_list)):
        this_key = well_key_list[i]
        this_cat = well_cat_list[i]
        if this_key == 'yields':
            if this_cat not in ['ngl', 'drip cond']:
                error_list.append({'error_message': 'Category can only be ngl or drip cond', 'row_index': i})
        elif this_key == 'shrinkage':
            if this_cat not in ['oil', 'gas']:
                error_list.append({'error_message': 'Category can only be oil or gas', 'row_index': i})
        elif this_key == 'loss & flare':
            if this_cat not in ['oil loss', 'gas loss', 'gas flare']:
                error_list.append({
                    'error_message': 'Category can only be oil loss, gas loss or gas flare',
                    'row_index': i
                })
        elif this_key == 'btu':
            if this_cat not in ['unshrunk gas', 'shrunk gas']:
                error_list.append({'error_message': 'Category can only be shrunk gas or unshrunk gas', 'row_index': i})
        else:
            error_list.append({'error_message': 'Wrong value in Key', 'row_index': i})

    cat_map_dict_rev = {CAT_MAP_DICT[k]: k for k in CAT_MAP_DICT}

    # btu content
    for btu_cat in ['unshrunk gas', 'shrunk gas']:
        if btu_cat not in well_cat_list:
            continue

        btu_list = well_array[well_cat_list == btu_cat]
        btu_list_index = np.where(well_cat_list == btu_cat)[0]

        if len(btu_list) > 1:
            for i in range(1, len(btu_list)):
                error_list.append({'error_message': f'Duplicated {btu_cat} row', 'row_index': btu_list_index[i]})

        btu_dict = dict(zip(header, btu_list[0]))
        btu_econ_key = cat_map_dict_rev[btu_cat]

        stream_properties['btu_content'][btu_econ_key] = number_validation(
            error_list=error_list,
            input_dict=btu_dict,
            input_key='Value',
            row_index=btu_list_index[0],
        )

    # yields, shrinkage, loss & flare
    for key in ['yields', 'shrinkage', 'loss_flare']:
        if key == 'yields':
            cat_list = ['ngl', 'drip cond']
        elif key == 'shrinkage':
            cat_list = ['oil', 'gas']
        else:
            cat_list = ['oil loss', 'gas loss', 'gas flare']

        # rate based row options
        if key in well_key_list:
            key_filter = well_key_list == key.replace('_', ' & ')
            key_array = well_array[key_filter]
            key_index = np.where(key_filter)[0]

            rate_type = first_available_value(key_array[:, rate_type_col_idx])
            stream_properties[key][ColumnName.rate_type.name] = selection_validation(
                error_list=error_list,
                input_dict={
                    ColumnName.rate_type.value: rate_type
                },
                input_key=ColumnName.rate_type.value,
                options=RATE_TYPE_OPTIONS,
                default_option=RATE_TYPE_OPTIONS[0],
                row_index=key_index[0],
            ).replace(' ', '_')

            rows_calculation_method = first_available_value(key_array[:, rows_calculation_method_col_idx])
            stream_properties[key][ColumnName.rows_calculation_method.name] = selection_validation(
                error_list=error_list,
                input_dict={
                    ColumnName.rows_calculation_method.value: rows_calculation_method
                },
                input_key=ColumnName.rows_calculation_method.value,
                options=ROWS_CALCULATION_METHOD_OPTIONS,
                default_option=ROWS_CALCULATION_METHOD_OPTIONS[0],
                row_index=key_index[0],
            ).replace(' ', '_')

        for cat in cat_list:
            if cat not in well_cat_list:
                continue

            cat_filter = well_cat_list == cat
            csv_list = well_array[cat_filter]
            csv_list_index = np.where(cat_filter)[0]

            csv_dict = dict(zip(header, csv_list[0]))

            this_criteria = selection_validation(
                error_list=error_list,
                input_dict=csv_dict,
                input_key='Criteria',
                options=list(CRITERIA_MAP_DICT.values()),
                row_index=csv_list_index[0],
            )
            criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}

            if this_criteria:
                econ_criteria = criteria_map_dict_rev[this_criteria]
            else:
                econ_criteria = None

            if key == 'yields':
                unit_key = 'yield'
            else:
                unit_key = 'pct_remaining'

            # generate row
            if this_criteria == 'flat':
                econ_rows = [{
                    econ_criteria:
                    'Flat',
                    unit_key:
                    number_validation(
                        error_list=error_list,
                        input_dict=csv_dict,
                        input_key='Value',
                        required=True,
                        row_index=csv_list_index[0],
                    ),
                }]
                if len(csv_list) > 1:
                    for i in range(1, len(csv_list)):
                        error_list.append({
                            'error_message': 'Duplicated row of Flat Period',
                            'row_index': csv_list_index[i]
                        })
            else:
                csv_dict_list = [dict(zip(header, val)) for val in csv_list]
                econ_rows = multi_line_to_rows(error_list, csv_dict_list, econ_criteria, unit_key, csv_list_index)

            # add shrinkage condition for yields
            if key == 'yields':
                yield_shrinkage_condition = selection_validation(
                    error_list=error_list,
                    input_dict=csv_dict,
                    input_key='Gas Shrinkage Condition',
                    options=['shrunk', 'unshrunk'],
                    row_index=csv_list_index[0],
                )
                if yield_shrinkage_condition:
                    yield_shrinkage_key = yield_shrinkage_condition + '_gas'
                    for r in econ_rows:
                        r[yield_shrinkage_key] = ''

            econ_cat = cat_map_dict_rev[cat]

            stream_properties[key][econ_cat] = {'rows': econ_rows}

    return stream_properties, error_list
