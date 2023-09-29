import copy
import numpy as np
from api.cc_to_cc.helper import (selection_validation, number_validation, str_to_display, row_view_process,
                                 multi_line_to_rows, esca_depre_validation, equals_to_default, RATE_TYPE_OPTIONS,
                                 ROWS_CALCULATION_METHOD_OPTIONS, standard_date_str)

from api.cc_to_cc.file_headers import (
    ColumnName,
    get_assumption_empty_row,
    fill_in_model_type_and_name,
    EXPENSES_KEY,
)

from combocurve.science.econ.default_econ_assumptions import get_default, KEY_MAP
from combocurve.shared.econ_tools.econ_model_tools import (
    CRITERIA_MAP_DICT,
    RATE_BASED_ROW_KEYS,
    UnitKeyEnum,
    UNIT_MAP,
    EXP_UNIT_KEYS,
    EXP_PCT_REV_KEYS,
    FIXED_EXP_KEYS,
)

CAT_MAP_DICT = {
    'gathering': 'g&p',
    'processing': 'opc',
    'transportation': 'trn',
    'marketing': 'mkt',
    'other': 'other',
    **{key: f'fixed{i+1}'
       for i, key in enumerate(FIXED_EXP_KEYS)}
}

EXP_UNIT_MAP = {key: UNIT_MAP[key] for key in EXP_UNIT_KEYS}

PCT_REV_UNITS = [EXP_UNIT_MAP[k] for k in EXP_PCT_REV_KEYS]
OIL_UNITS = [EXP_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], *PCT_REV_UNITS]
GAS_UNITS = [
    EXP_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MMBTU.value],
    EXP_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MCF.value],
    *PCT_REV_UNITS,
]

BASE_EXP_ROW = {
    'escalation_model': 'none',
    'calculation': '',
    'affect_econ_limit': '',
    'deduct_before_severance_tax': '',
    'deduct_before_ad_val_tax': '',
    'cap': '',
    'deal_terms': '',
    ColumnName.rate_type.name: '',
    ColumnName.rows_calculation_method.name: '',
    'rows': []
}

CALCULATION_MAP = {
    'wi': 'wi',
    'nri': 'nri',
    'lease_nri': 'lease_nri',
    'one_minus_wi': '1-wi',
    'one_minus_nri': '1-nri',
    'one_minus_lease_nri': '1-lease_nri',
    'wi_minus_one': 'wi-1',
    'nri_minus_one': 'nri-1',
    'lease_nri_minus_one': 'lease_nri-1',
    '100_pct_wi': '100% wi'
}


def fill_in_common(csv_row, exp_dict, exp_option_dict, esca_id_to_name):
    escalation_id = exp_option_dict['escalation_model']['value'] if type(
        exp_option_dict['escalation_model']) == dict else None
    csv_row['Escalation'] = esca_id_to_name.get(escalation_id, 'None')

    csv_row['Calculation'] = CALCULATION_MAP[exp_dict['calculation']]
    csv_row['Affect Econ Limit'] = exp_dict['affect_econ_limit']
    csv_row['Deduct bef Sev Tax'] = exp_dict['deduct_before_severance_tax']
    csv_row['Deduct bef Ad Val Tax'] = exp_dict['deduct_before_ad_val_tax']
    csv_row['Cap'] = exp_dict['cap']
    csv_row['Paying WI / Earning WI'] = exp_dict['deal_terms']

    row_keys = list(exp_dict['rows'][0].keys())
    if set(row_keys) & set(RATE_BASED_ROW_KEYS):
        csv_row[ColumnName.rate_type.value] = exp_dict.get(ColumnName.rate_type.name,
                                                           RATE_TYPE_OPTIONS[0]).replace('_', ' ')
        csv_row[ColumnName.rows_calculation_method.value] = exp_dict.get(ColumnName.rows_calculation_method.name,
                                                                         ROWS_CALCULATION_METHOD_OPTIONS[0]).replace(
                                                                             '_', ' ')


def expenses_export(model, esca_id_to_name, df_project_elt, include_default=True):
    default_expense = get_default(EXPENSES_KEY)

    row_list = []

    variable_expenses = model['econ_function']['variable_expenses']
    fixed_expenses = model['econ_function']['fixed_expenses']
    water_disposal = model['econ_function']['water_disposal']
    carbon_expenses = model['econ_function']['carbon_expenses']

    variable_expenses_option = model['options']['variable_expenses']
    fixed_expenses_option = model['options']['fixed_expenses']
    water_disposal_option = model['options']['water_disposal']
    carbon_expenses_options = model['options']['carbon_expenses']
    embedded_lookup_tables = model.get('embeddedLookupTables', [])

    last_update_str = model['updatedAt'].strftime(standard_date_str)

    common_row = get_assumption_empty_row('expenses')
    common_row['Last Update'] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    # variable expenses
    for phase in variable_expenses:
        phase_var_exp = variable_expenses[phase]
        for cat in phase_var_exp:
            expense = phase_var_exp[cat]

            if (not include_default) and equals_to_default(expense, default_expense['variable_expenses'][phase][cat],
                                                           KEY_MAP):
                continue

            var_csv_row = copy.deepcopy(common_row)
            var_csv_row.update({
                'Key': phase if phase != 'drip_condensate' else 'drip cond',
                'Category': CAT_MAP_DICT[cat],
                'Description': expense['description'],
                'Shrinkage Condition': expense['shrinkage_condition'] if phase in ['oil', 'gas'] else '',
            })

            expense_option = variable_expenses_option[phase]['subItems'][cat]['subItems']
            fill_in_common(var_csv_row, expense, expense_option, esca_id_to_name)

            var_splited_list = row_view_process(var_csv_row, expense)
            row_list += var_splited_list

    # fixed expenses
    for cat in fixed_expenses:
        this_fixed_exp = fixed_expenses[cat]

        if (not include_default) and equals_to_default(this_fixed_exp, default_expense['fixed_expenses'][cat]):
            continue

        fixed_csv_row = copy.deepcopy(common_row)
        fixed_csv_row.update({
            'Key': 'fixed',
            'Category': CAT_MAP_DICT[cat],
            'Description': this_fixed_exp['description'],
            'Stop at Econ Limit': this_fixed_exp['stop_at_econ_limit'],
            'Expense bef FPD': this_fixed_exp['expense_before_fpd'],
        })

        this_fixed_option = fixed_expenses_option[cat]['subItems']
        fill_in_common(fixed_csv_row, this_fixed_exp, this_fixed_option, esca_id_to_name)

        fixed_splited_list = row_view_process(fixed_csv_row, this_fixed_exp)
        row_list += fixed_splited_list

    # water disposal
    if include_default or not equals_to_default(water_disposal, default_expense['water_disposal'], KEY_MAP):
        water_csv_row = copy.deepcopy(common_row)

        water_csv_row['Key'] = 'water'

        fill_in_common(water_csv_row, water_disposal, water_disposal_option, esca_id_to_name)

        water_splited_list = row_view_process(water_csv_row, water_disposal)
        row_list += water_splited_list

    # carbon expenses
    for phase in carbon_expenses:
        if phase == 'category':
            continue
        this_exp = carbon_expenses[phase]
        if (not include_default) and equals_to_default(this_exp, default_expense['carbon_expenses'][phase], KEY_MAP):
            continue

        carbon_csv_row = copy.deepcopy(common_row)
        carbon_csv_row.update({
            'Key': phase,
            'Category': carbon_expenses['category'],
            'Description': this_exp['description']
        })

        fill_in_common(carbon_csv_row, this_exp, carbon_expenses_options[phase]['subItems'], esca_id_to_name)
        carbon_splited_list = row_view_process(carbon_csv_row, this_exp)
        row_list += carbon_splited_list

    # embedded_lookup_tables
    for elt_id in embedded_lookup_tables:
        if not df_project_elt.loc[df_project_elt['id'] == elt_id].empty:
            elt_name = df_project_elt.loc[df_project_elt['id'] == elt_id, 'name'].iloc[0]
        else:
            continue
        elt_row = copy.deepcopy(common_row)
        elt_row[ColumnName.embedded_lookup_table.value] = elt_name
        row_list.append(elt_row)

    return row_list


VAR_EXP_KEYS = ['oil', 'gas', 'ngl', 'drip cond']
CARBON_EXP_KEYS = ['co2e', 'co2', 'n2o', 'ch4']

VAR_EXP_CAT = ['g&p', 'opc', 'trn', 'mkt', 'other']
FIXED_EXP_CAT = ['fixed1', 'fixed2', 'fixed3', 'fixed4', 'fixed5', 'fixed6', 'fixed7', 'fixed8', 'fixed9']
CARBON_EXP_CAT = ['co2e', 'co2', 'n2o', 'ch4']


def get_expense_display_name(key, cat=None):
    if key == 'water':
        return 'Water Disposal Expense'

    if key == 'fixed':
        if cat == 'fixed1':
            return 'Fixed Expense 1'
        elif cat == 'fixed2':
            return 'Fixed Expense 2'
        elif cat == 'fixed3':
            return 'Fixed Expense 3'

    if key in VAR_EXP_KEYS:
        if cat == 'other':
            cat_display = 'Other'
        else:
            cat_display = cat.upper()
        key_display = str_to_display(key)
        return f'{key_display} {cat_display} Expense'

    if key in CARBON_EXP_KEYS and cat is not None:
        return f'{key.upper()} {cat.upper()} Expense'


def one_expense_import(error_list, header, expense_list, key, exp_disp_name, row_index, esca_name_dict):

    exp_row_dict = dict(zip(header, expense_list[0]))
    first_row_index = row_index[0]

    ret_dict = copy.deepcopy(BASE_EXP_ROW)

    ## unique columns
    if key in ['oil', 'gas']:
        ret_dict['shrinkage_condition'] = selection_validation(
            error_list=error_list,
            input_dict=exp_row_dict,
            input_key='Shrinkage Condition',
            options=['shrunk', 'unshrunk'],
            row_index=first_row_index,
        )
    elif key == 'fixed':
        ret_dict['stop_at_econ_limit'] = selection_validation(
            error_list=error_list,
            input_dict=exp_row_dict,
            input_key='Stop at Econ Limit',
            options=['yes', 'no'],
            row_index=first_row_index,
        )
        ret_dict['expense_before_fpd'] = selection_validation(
            error_list=error_list,
            input_dict=exp_row_dict,
            input_key='Expense bef FPD',
            options=['yes', 'no'],
            row_index=first_row_index,
        )

    ## common columns
    ret_dict['description'] = exp_row_dict['Description']

    calculation_map_rev = {CALCULATION_MAP[key]: key for key in CALCULATION_MAP}
    calculation = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Calculation',
        options=CALCULATION_MAP.values(),
        row_index=first_row_index,
    )
    if calculation in calculation_map_rev:
        ret_dict['calculation'] = calculation_map_rev[calculation]

    ret_dict['affect_econ_limit'] = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Affect Econ Limit',
        options=['yes', 'no'],
        row_index=first_row_index,
    )
    ret_dict['deduct_before_severance_tax'] = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Deduct bef Sev Tax',
        options=['yes', 'no'],
        row_index=first_row_index,
    )
    ret_dict['deduct_before_ad_val_tax'] = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Deduct bef Ad Val Tax',
        options=['yes', 'no'],
        row_index=first_row_index,
    )
    ret_dict['cap'] = number_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Cap',
        required=False,
        row_index=first_row_index,
    )
    ret_dict['deal_terms'] = number_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Paying WI / Earning WI',
        required=False,
        row_index=first_row_index,
    )

    rate_type = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key=ColumnName.rate_type.value,
        options=RATE_TYPE_OPTIONS,
        default_option=RATE_TYPE_OPTIONS[0],
        row_index=first_row_index,
    )
    ret_dict[ColumnName.rate_type.name] = rate_type.replace(' ', '_')

    rows_calculation_method = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key=ColumnName.rows_calculation_method.value,
        options=ROWS_CALCULATION_METHOD_OPTIONS,
        default_option=ROWS_CALCULATION_METHOD_OPTIONS[0],
        row_index=first_row_index,
    )
    ret_dict[ColumnName.rows_calculation_method.name] = rows_calculation_method.replace(' ', '_')

    ## escalation
    ret_dict['escalation_model'] = esca_depre_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Escalation',
        name_dict=esca_name_dict,
        row_index=first_row_index,
    )
    ## rows
    # criteria
    criteria = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Criteria',
        options=list(CRITERIA_MAP_DICT.values()),
        row_index=first_row_index,
    )
    criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}
    if criteria:
        econ_criteria = criteria_map_dict_rev[criteria]
    else:
        econ_criteria = None
    # unit
    unit = selection_validation(
        error_list=error_list,
        input_dict=exp_row_dict,
        input_key='Unit',
        options=list(EXP_UNIT_MAP.values()),
        row_index=first_row_index,
    )
    unit_map_dict_rev = {EXP_UNIT_MAP[k]: k for k in EXP_UNIT_MAP}
    if ((unit not in unit_map_dict_rev.keys()) or (key == 'gas' and unit not in GAS_UNITS)
            or (key == 'fixed' and unit not in ['$/month', '$/well/month'])
            or (key in ['oil', 'ngl', 'drip cond', 'water'] and unit not in OIL_UNITS)):
        error_list.append({'error_message': f'Unit of {exp_disp_name} is Invalid!', 'row_index': first_row_index})
        econ_unit = None
    else:
        econ_unit = unit_map_dict_rev[unit]
    # value and period
    if criteria == 'flat':
        rows = [{
            econ_criteria:
            'Flat',
            econ_unit:
            number_validation(
                error_list=error_list,
                input_dict=exp_row_dict,
                input_key='Value',
                required=True,
                row_index=first_row_index,
            )
        }]
        if len(expense_list) > 1:
            for i in range(1, len(expense_list)):
                error_list.append({'error_message': 'Duplicated row of Flat Period', 'row_index': row_index[i]})

    else:
        exp_dict_list = [dict(zip(header, exp)) for exp in expense_list]
        rows = multi_line_to_rows(error_list, exp_dict_list, econ_criteria, econ_unit, row_index)

    ret_dict['rows'] = rows

    return ret_dict


def expenses_import(well_array, header, esca_name_dict, df_project_elt):  # noqa C901
    expenses = get_default(EXPENSES_KEY)
    error_list = []

    # handle embedded lookup tables
    embedded_lookup_table_ids = []
    elt_col_idx = header.index(ColumnName.embedded_lookup_table.value)
    elt_rows_idx, = np.where(well_array[:, elt_col_idx] != None)  # noqa E711
    elt_names = well_array[elt_rows_idx, elt_col_idx]
    for name, idx in zip(elt_names, elt_rows_idx):
        if len(np.where(elt_names == name)[0]) > 1:
            error_list.append({'error_message': f'Duplicated embedded lookup table row ({name})', 'row_index': idx})
            continue
        if not df_project_elt.loc[df_project_elt['name'] == name].empty:
            embedded_lookup_table_ids.append(df_project_elt.loc[df_project_elt['name'] == name, 'id'].iloc[0])
        else:
            error_list.append({'error_message': f'Embedded lookup table {name} not in project!', 'row_index': idx})
            continue
    expenses['embeddedLookupTables'] = embedded_lookup_table_ids
    well_array = np.delete(well_array, elt_rows_idx, axis=0)  # drop embedded lookup rows

    cat_map_dict_rev = {CAT_MAP_DICT[k]: k for k in CAT_MAP_DICT}

    key_col_idx = header.index('Key')
    cat_col_idx = header.index('Category')

    # add error message for key and category column
    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, key_col_idx]])
    well_cat_list = np.array([x.strip() if x is not None else x for x in well_array[:, cat_col_idx]])

    for i in range(len(well_key_list)):
        this_key = well_key_list[i]
        this_cat = well_cat_list[i]

        if this_key in VAR_EXP_KEYS:
            if this_cat not in VAR_EXP_CAT:
                error_list.append({'error_message': 'Wrong value of Category for corresponding Key', 'row_index': i})
        elif this_key == 'fixed':
            if this_cat not in FIXED_EXP_CAT:
                error_list.append({'error_message': 'Wrong value of Category for corresponding Key', 'row_index': i})
        elif this_key == 'water':
            if this_cat not in [None, '']:
                error_list.append({'error_message': 'Water do not have category', 'row_index': i})
        elif this_key in CARBON_EXP_KEYS:
            if this_cat not in CARBON_EXP_CAT:
                error_list.append({'error_message': 'Wrong value of Category for corresponding Key', 'row_index': i})
        else:
            error_list.append({'error_message': 'Wrong value of Key', 'row_index': i})

    # variable
    for key in VAR_EXP_KEYS:
        key_econ = key if key != 'drip cond' else 'drip_condensate'
        if key not in well_key_list:
            continue
        else:
            phase_var_exp = well_array[well_key_list == key]
        for cat in VAR_EXP_CAT:
            var_disp_name = get_expense_display_name(key, cat)
            if cat not in phase_var_exp[:, cat_col_idx]:
                continue

            expenses['variable_expenses'][key_econ][cat_map_dict_rev[cat]] = one_expense_import(
                error_list=error_list,
                header=header,
                expense_list=phase_var_exp[phase_var_exp[:, cat_col_idx] == cat],
                key=key,
                exp_disp_name=var_disp_name,
                row_index=np.where((well_key_list == key) & (well_cat_list == cat))[0],
                esca_name_dict=esca_name_dict,
            )

    # fixed
    if 'fixed' in well_key_list:
        for cat in FIXED_EXP_CAT:
            if cat not in well_cat_list:
                continue
            expenses['fixed_expenses'][cat_map_dict_rev[cat]] = one_expense_import(
                error_list=error_list,
                header=header,
                expense_list=well_array[well_cat_list == cat],
                key='fixed',
                exp_disp_name=get_expense_display_name('fixed', cat),
                row_index=np.where(well_cat_list == cat)[0],
                esca_name_dict=esca_name_dict,
            )

    # water
    if 'water' in well_key_list:
        expenses['water_disposal'] = one_expense_import(
            error_list=error_list,
            header=header,
            expense_list=well_array[well_key_list == 'water'],
            key='water',
            exp_disp_name=get_expense_display_name('water'),
            row_index=np.where(well_key_list == 'water')[0],
            esca_name_dict=esca_name_dict,
        )

    # carbon expense
    for key in CARBON_EXP_KEYS:
        if key not in well_key_list:
            continue

        phase_exp = well_array[well_key_list == key]

        for cat in CARBON_EXP_CAT:
            if cat not in phase_exp[:, cat_col_idx]:
                continue

            expenses['carbon_expenses']['category'] = cat
            expenses['carbon_expenses'][key] = one_expense_import(
                error_list=error_list,
                header=header,
                expense_list=phase_exp[phase_exp[:, cat_col_idx] == cat],
                key=key,
                exp_disp_name=get_expense_display_name(key, cat),
                row_index=np.where((well_key_list == key) & (well_cat_list == cat))[0],
                esca_name_dict=esca_name_dict,
            )

    return expenses, error_list
