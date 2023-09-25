import itertools
import pandas as pd

from combocurve.science.econ.embedded_lookup_table.expense_conversion import ExpenseConverter
from combocurve.services.cc_to_phdwin.helpers import (ALL_CC_UNIT_DEFAULT_VALUE_DICT, convert_flat_criteria_to_date,
                                                      convert_offset_rows_to_date, fill_in_with_default_assumptions,
                                                      get_btu_value, get_key_well_properties, get_model_date_reference,
                                                      get_truncated_name, get_unit_from_rows,
                                                      update_assumption_name_if_appropriate, update_export_progress)
from combocurve.shared.combine_rows import sum_rows

RECOGNIZED_CC_PHDWIN_EXPENSE_CRITERIA = [
    'dates', 'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_first_segment',
    'offset_to_discount_date', 'offset_to_end_history'
]

CC_CRITERIA_IN_PHDWIN = [
    'dates', 'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_first_segment',
    'offset_to_end_history'
]

PHDWIN_EXPENSE_PHD_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Product(Key)', 'Type(Key)', 'Date(Key)',
    'Model', 'Cost', 'Affect ECL'
]
PHDWIN_EXPENSE_MOD_COLUMNS = [
    'Type(Key)', 'Product Name(Key)', 'Model Name(Key)', 'Model Id(Key)', 'Date(Key)', 'Segment', 'Currency', 'Units',
    'Cap Value', 'Total Depth Link', 'Prior to State Tax', 'Prior to Local Tax', 'Affect Econ Limit',
    'Contribute to AB GCA', 'Cost'
]

DEFAULT_BASE_MODEL_LENGTH_FOR_EXPENSE = 12


def create_phdwin_expense_table(context,
                                notification_id,
                                user_id,
                                date_dict,
                                well_order_list,
                                well_data_list,
                                progress_range,
                                user_key=None,
                                use_asof_reference=False,
                                error_log=None):
    # initialize model tables and phd table (referencing models)
    mod_expense_table = []
    phd_expense_table = []
    referenced_model_names_dict = {}
    truncation_model_name_dict = {}
    unreferenced_model_names = []

    expense_converter = ExpenseConverter()
    no_wells = len(well_order_list)
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]

            assumptions = well_data['assumptions']

            well_header = well_data['well']

            # not being used here
            # schedule = well_data.get('schedule')

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            btu_value = get_btu_value(assumptions)

            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            expense_assumption = assumptions.get('expenses')
            assumption_name = expense_assumption.get('name')

            if assumption_name is None:
                continue

            assumption_name = get_truncated_name(truncation_model_name_dict,
                                                 assumption_name,
                                                 max_length=DEFAULT_BASE_MODEL_LENGTH_FOR_EXPENSE)

            # check if a model has already been created and can be referenced immediately
            if assumption_name in referenced_model_names_dict:
                create_full_phd_row((well_name, state, county, field, user_chosen_identifier), phd_expense_table,
                                    assumption_name, referenced_model_names_dict)
                continue

            # get fixed, variable and water expense document
            (fixed_expense, variable_expense, water_disposal,
             _) = expense_converter.incorporate_embedded(expense_assumption)

            assumption_name = update_assumption_name_if_appropriate(assumption_name, unreferenced_model_names)
            # process fixed expense
            valid_model = process_phdwin_fixed_expense(
                (user_chosen_identifier, well_name, state, county, field), fixed_expense, mod_expense_table,
                phd_expense_table, well_date_dict, unreferenced_model_names, assumption_name, use_asof_reference)

            # process variable expense
            valid_model = process_phdwin_variable_expense((user_chosen_identifier, well_name, state, county, field),
                                                          variable_expense,
                                                          mod_expense_table,
                                                          phd_expense_table,
                                                          well_date_dict,
                                                          unreferenced_model_names,
                                                          assumption_name,
                                                          use_asof_reference,
                                                          valid_model,
                                                          btu_value=btu_value)

            # process water disposal
            valid_model = process_phdwin_water_disposal_expense(
                (user_chosen_identifier, well_name, state, county, field), water_disposal, mod_expense_table,
                phd_expense_table, well_date_dict, unreferenced_model_names, assumption_name, use_asof_reference,
                valid_model)

            if valid_model:
                update_reference_model_names_dict(referenced_model_names_dict, assumption_name, phd_expense_table)
            else:
                unreferenced_model_names.append(assumption_name)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='Expenses', name=assumption_name)

    mod_expense_table = pd.DataFrame(mod_expense_table, columns=PHDWIN_EXPENSE_MOD_COLUMNS)
    phd_expense_table = pd.DataFrame(phd_expense_table, columns=PHDWIN_EXPENSE_PHD_COLUMNS)

    return mod_expense_table, phd_expense_table


def combine_variable_expense_rows(nri_rows, opc_rows, other_rows):
    model_dict = {}

    if len(nri_rows) > 0:
        nri_rows = list(itertools.chain(*nri_rows))
        nri_rows = sum_rows(nri_rows)
        model_dict['TRAN'] = nri_rows

    if len(opc_rows) > 0:
        opc_rows = list(itertools.chain(*opc_rows))
        opc_rows = sum_rows(opc_rows)
        model_dict['OP'] = opc_rows

    if len(other_rows) > 0:
        other_rows = list(itertools.chain(*other_rows))
        other_rows = sum_rows(other_rows)
        model_dict['OTHER'] = other_rows

    return model_dict


def get_appropriate_criteria_reference(criterias, valid_model, use_asof):
    criterias_that_can_create_valid_models = ['entire_well_life', 'dates']
    if use_asof:
        criterias_that_can_create_valid_models.append('offset_to_as_of_date')
    unique_criterias = list(set(criterias))
    if len(unique_criterias) > 1:
        criteria = 'dates'
        if not (len(unique_criterias) == 2 and all(criteria in criterias_that_can_create_valid_models
                                                   for criteria in unique_criterias)):
            valid_model = False

    else:
        criteria = unique_criterias[0]

    return criteria, valid_model


def place_variable_expense_row_in_appropriate_phd_category(rows, calculation, category, criteria, nri_rows, opc_rows,
                                                           other_rows, used_category_dict, used_criteria_dict, idx):
    if len(rows) > 0:
        if calculation == 'nri':
            nri_rows.append(rows)
            used_category_dict['TRAN'].append((category, idx))
            used_criteria_dict['TRAN'].append(criteria)
        elif category == 'processing':
            opc_rows.append(rows)
            used_category_dict['OP'].append((category, idx))
            used_criteria_dict['OP'].append(criteria)
        else:
            other_rows.append(rows)
            used_category_dict['OTHER'].append((category, idx))
            used_criteria_dict['OTHER'].append(criteria)


def generate_phdwin_variable_expense_model_rows(props, rows, type, phase, criteria, unreferenced_model_names,
                                                option_dict):
    assumption_name, user_chosen_identifier, well_name, state, county, field = props
    currency = '$'
    # TODO: Update arguments in use
    phase = phase if phase != 'drip_condensate' else 'condensate'
    units = 'Mcf' if phase == 'gas' else 'bbl'
    total_depth_link = 0
    cap = option_dict.get('cap')
    deduct_sev_tax = None if option_dict.get('deduct_before_severance_tax') == 'no' else option_dict.get(
        'deduct_before_severance_tax')
    deduct_adval_tax = None if option_dict.get('deduct_before_ad_val_tax') == 'no' else option_dict.get(
        'deduct_before_ad_val_tax')
    affect_econ_limit = None if option_dict.get('affect_econ_limit') == 'no' else option_dict.get('affect_econ_limit')

    use_assumption_name = None
    model_rows = []
    for idx, row in enumerate(rows):
        date_ref = get_model_date_reference(rows, idx, criteria)

        unit = get_unit_from_rows(rows)
        value = row[unit]
        use_assumption_name = f'{assumption_name}-{type}' if type == 'OTHER' else assumption_name
        model_rows.append([
            str(type).upper(),
            str(phase).upper(), use_assumption_name, None, date_ref, idx + 1, currency, units, cap, total_depth_link,
            deduct_sev_tax, deduct_adval_tax, affect_econ_limit, None, value
        ])
    phd_row = create_phd_row((well_name, state, county, field, user_chosen_identifier),
                             phase,
                             use_assumption_name,
                             affect_econ_limit,
                             variable=True,
                             type=type)

    return model_rows, phd_row


def generate_phdwin_fixed_expense_model_rows(props, rows, criteria, unreferenced_model_names, option_dict):
    assumption_name, user_chosen_identifier, well_name, state, county, field = props

    currency = '$'
    product_name = 'Fixed Cost'
    units = 'case'
    type_key = 'FIXED'
    total_depth_link = 0
    cap = option_dict.get('cap')
    deduct_sev_tax = None if option_dict.get('deduct_before_severance_tax') == 'no' else option_dict.get(
        'deduct_before_severance_tax')
    deduct_adval_tax = None if option_dict.get('deduct_before_ad_val_tax') == 'no' else option_dict.get(
        'deduct_before_ad_val_tax')
    affect_econ_limit = None if option_dict.get('affect_econ_limit') == 'no' else option_dict.get('affect_econ_limit')

    model_rows = []
    for idx, row in enumerate(rows):
        date_ref = get_model_date_reference(rows, idx, criteria)
        value = row['fixed_expense']
        model_rows.append([
            type_key,
            product_name.upper(), assumption_name, None, date_ref, idx + 1, currency, units, cap, total_depth_link,
            deduct_sev_tax, deduct_adval_tax, affect_econ_limit, None, value
        ])

    phd_row = create_phd_row((well_name, state, county, field, user_chosen_identifier), product_name, assumption_name,
                             affect_econ_limit)

    return model_rows, phd_row


def update_reference_model_names_dict(referenced_model_names_dict, assumption_name, phd_expense_table):
    new_phd_rows = []
    for row in phd_expense_table[::-1]:
        if row[-3].split('-OTHER')[0] == assumption_name:
            new_phd_rows.insert(0, [row[-6], row[-5], row[-1]])
        else:
            break
    referenced_model_names_dict[assumption_name] = new_phd_rows


def create_phd_row(props, product_name, assumption_name, affect_econ_limit, variable=False, type=None):
    if variable:
        product_type = VARIABLE_MOD_TO_PHD_MAP.get(type)
    else:
        product_type = product_name
    affect_econ_limit = 'Y' if str(affect_econ_limit).lower().startswith('y') else 'N'
    well_name, state, county, field, user_chosen_identifier = props
    return [
        well_name, state, county, field, None, user_chosen_identifier,
        product_name.upper(), product_type, None, assumption_name, 0, affect_econ_limit
    ]


def create_full_phd_row(props, phd_expense_table, assumption_name, reference_name_dict):
    well_name, state, county, field, user_chosen_identifier = props
    add_rows = reference_name_dict.get(assumption_name)
    if add_rows is not None:
        for row in add_rows:
            use_assumption_name = f'{assumption_name}-OTHER' if row[1] == 'Other Cost' else assumption_name
            phd_expense_table.append([
                well_name, state, county, field, None, user_chosen_identifier, row[0], row[1], None,
                use_assumption_name, 0, row[2]
            ])


def get_expense_phdwin_option_dict(document, category, empty_categories, uncombined_categories):
    current_dict = {}
    if category in empty_categories + uncombined_categories:
        return current_dict, True
    for option in DEFAULT_EXPENSE_PHDWIN_OPTION_DICT:
        option_value = document.get(option)
        option_value = option_value if option_value is not None else DEFAULT_EXPENSE_PHDWIN_OPTION_DICT.get(option)
        current_dict[option] = option_value
    return current_dict, False


def check_for_matching_water_disposal_expense_options(water_disposals):
    compare_dict = {}
    for water_disposal in water_disposals:
        current_dict, ignore = get_expense_phdwin_option_dict(water_disposal, None, [], [])
        if ignore:
            continue
        if compare_dict:
            if compare_dict != current_dict:
                return False
        else:
            compare_dict = current_dict

    return True


def check_for_matching_variable_expense_options(variable_expenses, phase, type, empty_categories, uncombined_categories,
                                                used_category_dict):
    compare_dict = {}
    for category in used_category_dict.get(type, []):
        current_dict, ignore = get_expense_phdwin_option_dict(variable_expenses[category[1]][phase][category[0]],
                                                              category, empty_categories, uncombined_categories)
        if ignore:
            continue
        if compare_dict:
            if compare_dict != current_dict:
                return False
        else:
            compare_dict = current_dict

    return True


def check_for_matching_fixed_expense_options(fixed_expenses, empty_categories, uncombined_categories):
    compare_dict = {}
    for idx, fixed_expense in enumerate(fixed_expenses):
        for category, fixed_exp in fixed_expense.items():
            if type(fixed_exp) != dict:
                continue
            current_dict, ignore = get_expense_phdwin_option_dict(fixed_exp, (category, idx), empty_categories,
                                                                  uncombined_categories)
            if ignore:
                continue
            if compare_dict:
                if compare_dict != current_dict:
                    return False
            else:
                compare_dict = current_dict

    return True


def move_start_to_fpd(rows, date_dict):
    start_date_moved = False
    formated_fpd = pd.to_datetime(date_dict['offset_to_fpd'])
    idx = 0
    for idx, row in enumerate(rows):
        formated_start_date = pd.to_datetime(row['dates']['start_date'])
        formated_end_date = pd.to_datetime(row['dates']['end_date'], errors="coerce")
        if formated_start_date < formated_fpd:
            if row['dates']['end_date'] == 'Econ Limit' or formated_fpd < formated_end_date:
                row['dates']['start_date'] = formated_fpd.strftime('%Y-%m-%d')
                start_date_moved = True
                break
            else:
                continue
        else:
            break

    return rows[idx:], start_date_moved


def validate_and_standardize_rows(rows,
                                  category,
                                  use_asof_reference,
                                  empty_categories,
                                  date_dict,
                                  idx,
                                  btu_value=1,
                                  move_to_fpd=False):
    # initialize value for rows validity for export
    valid = False
    # initialize boolean for if the category can be treated as a cc model for export
    can_be_referenced = True
    # initialize value for tracking  number of categories not used
    criteria = None
    # check if length of rows is greater than 0
    if len(rows) > 0:
        # check if the criteria is among the criterias than can be exported to phdwin
        if any(key in RECOGNIZED_CC_PHDWIN_EXPENSE_CRITERIA for key in rows[0]):
            # if so it is cansidered valid
            valid = True
            # get the criteria used by this category
            criteria = next(key for key in rows[0] if key in RECOGNIZED_CC_PHDWIN_EXPENSE_CRITERIA)
            unit = get_unit_from_rows(rows)

            default_value = ALL_CC_UNIT_DEFAULT_VALUE_DICT.get(unit, 0)
            # if a flat CC model is used convert it to dates if its value has been change from its default
            if criteria == 'entire_well_life' and rows[0][unit] != default_value:
                rows = convert_flat_criteria_to_date(rows, unit, date_dict)

            # check if category is empty
            if len(rows) == 1 and rows[0][unit] == default_value:
                rows = []
                empty_categories.append((category, idx))

            # add error message here
            if unit not in ['dollar_per_mcf', 'dollar_per_bbl', 'fixed_expense', 'dollar_per_mmbtu']:
                rows = []
                empty_categories.append((category, idx))

            if unit == 'dollar_per_mmbtu':
                for row in rows:
                    row['dollar_per_mcf'] = row['dollar_per_mmbtu'] * (1 / btu_value)
                    del row['dollar_per_mmbtu']

            # check if category meets the requirement for model
            can_be_referenced = criteria in CC_CRITERIA_IN_PHDWIN
            if criteria == 'offset_to_as_of_date' and not use_asof_reference:
                can_be_referenced = False

            # convert all offsets to date
            if 'offset_to' in criteria:
                rows = convert_offset_rows_to_date(rows, criteria, unit, date_dict)

            if move_to_fpd:
                rows, start_date_moved = move_start_to_fpd(rows, date_dict)
                can_be_referenced = False if start_date_moved else can_be_referenced

    return rows, valid, criteria, can_be_referenced, empty_categories


def process_phdwin_fixed_expense(props, fixed_expenses, mod_expense_table, phd_expense_table, well_date_dict,
                                 unreferenced_model_names, assumption_name, use_asof_reference):
    user_chosen_identifier, well_name, state, county, field = props
    valid_model = True

    # initialize the storage
    combined_fixed_expense_rows = []
    uncombined_categories = []
    criterias = []
    empty_categories = []
    used_categories = []

    for idx, fixed_expense in enumerate(fixed_expenses):
        # loop through all fixed expense
        for key in fixed_expense:
            # get row from fixed expense
            if type(fixed_expense[key]) != dict:
                continue
            rows = fixed_expense[key].get('rows', [])
            move_to_fpd = fixed_expense[key].get('expense_before_fpd') == 'no'

            # check that the rows can be converted and/or can be referenced to another well
            rows, valid, criteria, can_be_referenced, empty_categories = validate_and_standardize_rows(
                rows, key, use_asof_reference, empty_categories, well_date_dict, idx, move_to_fpd=move_to_fpd)
            valid_model = valid_model and can_be_referenced

            # if valid store the criteria and row and category
            if valid and len(rows) != 0:
                criterias.append(criteria)
                combined_fixed_expense_rows.append(rows)
                used_categories.append((key, idx))
            else:
                # if row is not add the category to the uncombined categories
                uncombined_categories.append((key, idx))

    # combine all rows to a single row
    combined_fixed_expense_rows = list(itertools.chain(*combined_fixed_expense_rows))
    # get the number of categories valid to be used
    no_used_categories = len(used_categories)

    # if at lease one category is used continue process
    if no_used_categories > 0 and len(combined_fixed_expense_rows) > 0:
        # sum all the rows, if they come from multiple sources
        combined_fixed_expense_rows = sum_rows(combined_fixed_expense_rows)

        # get the appropriate criteria
        criteria, valid_model = get_appropriate_criteria_reference(criterias, valid_model, use_asof_reference)

        # check that the options are matched
        matched = True if no_used_categories == 1 else check_for_matching_fixed_expense_options(
            fixed_expenses, empty_categories, uncombined_categories)

        # get the options to be used among the shared categories
        option_dict, _ = get_expense_phdwin_option_dict(
            fixed_expenses[used_categories[0][1]][used_categories[0][0]], used_categories[0][0], empty_categories,
            uncombined_categories) if matched else (DEFAULT_EXPENSE_PHDWIN_OPTION_DICT, None)

        # create mod and reference phd rows
        model_row, phd_row = generate_phdwin_fixed_expense_model_rows(
            (assumption_name, user_chosen_identifier, well_name, state, county, field), combined_fixed_expense_rows,
            criteria, unreferenced_model_names, option_dict)

        # add mod and phd row to mod and phd expense table
        mod_expense_table += model_row
        phd_expense_table.append(phd_row)

    return valid_model


def process_phdwin_variable_expense(props,
                                    variable_expenses,
                                    mod_expense_table,
                                    phd_expense_table,
                                    well_date_dict,
                                    unreferenced_model_names,
                                    assumption_name,
                                    use_asof_reference,
                                    valid_model,
                                    btu_value=1):
    user_chosen_identifier, well_name, state, county, field = props
    used_category_phase_dict = {
        'oil': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'gas': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'ngl': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'drip_condensate': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        }
    }
    used_criteria_phase_dict = {
        'oil': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'gas': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'ngl': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        },
        'drip_condensate': {
            'TRAN': [],
            'OP': [],
            'OTHER': []
        }
    }

    uncombined_categories_dict = {'oil': [], 'gas': [], 'ngl': [], 'drip_condensate': []}
    empty_categories_dict = {'oil': [], 'gas': [], 'ngl': [], 'drip_condensate': []}

    phdwin_expense_allocation_dict = {
        'oil': [[], [], []],
        'gas': [[], [], []],
        'ngl': [[], [], []],
        'drip_condensate': [[], [], []]
    }

    # loop through all the phases
    for idx, variable_expense in enumerate(variable_expenses):
        for phase in variable_expense:
            if phase not in ['oil', 'gas', 'ngl', 'drip_condensate']:
                continue

            empty_categories = empty_categories_dict.get(phase)
            uncombined_categories = uncombined_categories_dict.get(phase)
            used_category_dict = used_category_phase_dict.get(phase)
            used_criteria_dict = used_criteria_phase_dict.get(phase)
            nri_rows, opc_rows, other_rows = phdwin_expense_allocation_dict.get(phase)

            phase_expense = variable_expense[phase]
            # loop through category in each phase expense
            for category in phase_expense:
                if category not in ['gathering', 'processing', 'transportation', 'marketing', 'other']:
                    continue
                # get rows and calculation
                rows = phase_expense[category].get('rows', [])
                calculation = phase_expense[category].get('calculation')

                # check that the rows can be converted and/or can be referenced to another well
                rows, valid, criteria, can_be_referenced, empty_categories = validate_and_standardize_rows(
                    rows, category, use_asof_reference, empty_categories, well_date_dict, idx, btu_value=btu_value)
                valid_model = valid_model and can_be_referenced

                # if valid add the row to it appropriate category
                # nri goes to TRAN
                # opc goes to OP
                # rest goes to OTHER
                if valid:
                    place_variable_expense_row_in_appropriate_phd_category(rows, calculation, category, criteria,
                                                                           nri_rows, opc_rows, other_rows,
                                                                           used_category_dict, used_criteria_dict, idx)
                else:
                    uncombined_categories.append((category, idx))

    # sum the rows for each category
    model_dict = combine_variable_expense_rows(nri_rows, opc_rows, other_rows)

    for phase in phdwin_expense_allocation_dict:
        nri_rows, opc_rows, other_rows = phdwin_expense_allocation_dict.get(phase)
        model_dict = combine_variable_expense_rows(nri_rows, opc_rows, other_rows)
        used_category_dict = used_category_phase_dict.get(phase)
        used_criteria_dict = used_criteria_phase_dict.get(phase)
        empty_categories = empty_categories_dict.get(phase)
        uncombined_categories = uncombined_categories_dict.get(phase)

        # for each created categories create the appriopriate mod and phd row
        for type, cc_var_row in model_dict.items():
            # check that the category is not empty
            if len(cc_var_row) == 0 or len(used_category_dict[type]) == 0:
                continue

            # get the appropriate criteria or if the criteria can be referenced
            criteria, valid_model = get_appropriate_criteria_reference(used_criteria_dict[type], valid_model,
                                                                       use_asof_reference)

            # check that options for the combined categories match
            matched = check_for_matching_variable_expense_options(variable_expenses, phase, type, empty_categories,
                                                                  uncombined_categories, used_category_dict)

            # get the option dict for the category
            option_dict, _ = get_expense_phdwin_option_dict(
                variable_expenses[used_category_dict[type][0][1]][phase][used_category_dict[type][0][0]],
                used_category_dict[type][0], empty_categories,
                uncombined_categories) if matched else (DEFAULT_EXPENSE_PHDWIN_OPTION_DICT, None)

            # create mod and phd row for the variable expense
            model_row, phd_row = generate_phdwin_variable_expense_model_rows(
                (assumption_name, user_chosen_identifier, well_name, state, county, field), cc_var_row, type, phase,
                criteria, unreferenced_model_names, option_dict)

            # add mod row and phd row to their respective table
            mod_expense_table += model_row
            phd_expense_table.append(phd_row)
    return valid_model


def process_phdwin_water_disposal_expense(props, water_disposals, mod_expense_table, phd_expense_table, well_date_dict,
                                          unreferenced_model_names, assumption_name, use_asof_reference, valid_model):
    user_chosen_identifier, well_name, state, county, field = props

    # initialize storage
    uncombined_categories = []
    empty_categories = []
    combined_water_disposal_rows = []

    # get water disposal rows
    for idx, water_disposal in enumerate(water_disposals):
        if type(water_disposal) != dict:
            continue
        rows = water_disposal.get('rows', [])

        # check that the rows can be converted and/or can be referenced to another well
        rows, valid, criteria, can_be_referenced, empty_categories = validate_and_standardize_rows(
            rows, "", use_asof_reference, empty_categories, well_date_dict, idx)
        valid_model = valid_model and can_be_referenced
        combined_water_disposal_rows.append(rows)

    rows = list(itertools.chain(*combined_water_disposal_rows))

    if len(rows) > 1:
        rows = sum_rows(rows)

    # check that row contains something
    if valid and len(rows) > 0:
        # get the options dict of the water disposal document
        matched = check_for_matching_water_disposal_expense_options(water_disposals)
        option_dict, _ = get_expense_phdwin_option_dict(
            water_disposal, None, empty_categories,
            uncombined_categories) if matched else (DEFAULT_EXPENSE_PHDWIN_OPTION_DICT, None)

        # create mod and phd row for the water disposal
        model_row, phd_row = generate_phdwin_variable_expense_model_rows(
            (assumption_name, user_chosen_identifier, well_name, state, county, field), rows, 'OP', 'water', criteria,
            unreferenced_model_names, option_dict)

        # add mod row and phd row to their respective table
        mod_expense_table += model_row
        phd_expense_table.append(phd_row)

    return valid_model


DEFAULT_EXPENSE_PHDWIN_OPTION_DICT = {
    'deal_terms': 1,
    'cap': '',
    'deduct_before_severance_tax': None,
    'deduct_before_ad_val_tax': None,
    'affect_econ_limit': 'yes',
}

VARIABLE_MOD_TO_PHD_MAP = {'OP': 'Op Cost', 'TRAN': 'Tran Cost', 'OTHER': 'Other Cost'}
