import pandas as pd
import datetime

from pandas.tseries.offsets import MonthBegin, MonthEnd
from combocurve.shared.aries_import_enums import PhaseEnum, CCSchemaEnum, EconEnum, PriceEnum, ForecastEnum
from bson.objectid import ObjectId
from combocurve.utils.constants import DAYS_IN_MONTH
from combocurve.science.core_function.helper import check_leap_year

MIN_VALUE = -999999999


def convert_dash_date_to_datetime(date):
    year, month, day = date.split('-')
    return datetime.date(int(year), int(month), int(day))


def process_tax_row_combination(tax_rows):
    has_rate_cut_off = any('rate' in key for key in tax_rows[-1])
    if len(tax_rows) > 1 and not has_rate_cut_off:
        tax_keys = get_two_tax_keys(tax_rows[-1])
        new_tax_rows = []
        for tax_key in tax_keys:
            sev_tax_rows_copy = copy_rows(tax_rows)
            for sev_tax_row_copy in sev_tax_rows_copy:
                del sev_tax_row_copy[tax_key]
            new_tax_rows.append(sum_rows(sev_tax_rows_copy))
        # combine the two new combined rows to form a single object
        tax_rows = combine_tax_obj_rows(new_tax_rows[0], new_tax_rows[1])
    return tax_rows


def combine_tax_rows(tax_default_document):
    for type_tax_rows in [EconEnum.sev_tax.value, EconEnum.adval_tax.value]:
        if type_tax_rows == EconEnum.sev_tax.value:
            for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                sev_tax_rows = copy_rows(tax_default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value]
                                         [phase][EconEnum.rows.value])
                tax_default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                    EconEnum.rows.value] = process_tax_row_combination(sev_tax_rows)
        else:
            adval_tax_rows = copy_rows(
                tax_default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value])
            tax_default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                EconEnum.rows.value] = process_tax_row_combination(adval_tax_rows)

    return tax_default_document


def combine_differential_rows(default_document):
    # loop through phases
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        for differential_cat in [PriceEnum.diff_1.value, PriceEnum.diff_2.value]:
            differential_rows = copy_rows(default_document[EconEnum.econ_function.value][PriceEnum.diff.value]
                                          [differential_cat][phase][EconEnum.rows.value])
            if len(differential_rows) > 1:
                new_combined_rows = sum_rows(differential_rows)
                default_document[EconEnum.econ_function.value][PriceEnum.diff.value][differential_cat][phase][
                    EconEnum.rows.value] = new_combined_rows

    return default_document


def combine_price_rows(default_document, well_id, scenario, scenarios_dic, scenarios_id, escalation_data_list,
                       compare_escalation_and_save_into_self_data_list, user_id):
    # loop through phases
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        price_rows = copy_rows(
            default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][EconEnum.rows.value])
        new_combined_rows, unique_escalation_default_document = merge_econ_and_escalation_rows(
            price_rows, well_id, scenario, scenarios_dic, scenarios_id, user_id, escalation_data_list,
            compare_escalation_and_save_into_self_data_list)
        if new_combined_rows is not None:
            default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][
                EconEnum.rows.value] = new_combined_rows
        if unique_escalation_default_document is not None:
            default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][
                EconEnum.escalation_model.value] = unique_escalation_default_document
        else:
            default_document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][
                EconEnum.escalation_model.value] = 'none'

    return default_document


def combine_variable_expense_rows(default_document, well_id, scenario, scenarios_dic, scenarios_id,
                                  escalation_data_list, compare_escalation_and_save_into_self_data_list, user_id):
    #loop through phases
    for phase in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
            PhaseEnum.water.value
    ]:
        if phase != PhaseEnum.water.value:
            for category in variable_expenses_category:
                variable_expense_rows = copy_rows(default_document[EconEnum.econ_function.value][EconEnum.var_exp.value]
                                                  [phase][category][EconEnum.rows.value])
                new_combined_rows, unique_escalation_default_document = merge_econ_and_escalation_rows(
                    variable_expense_rows, well_id, scenario, scenarios_dic, scenarios_id, user_id,
                    escalation_data_list, compare_escalation_and_save_into_self_data_list)
                if new_combined_rows is not None:
                    default_document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                        EconEnum.rows.value] = new_combined_rows
                    cap = get_max_cap(new_combined_rows)
                    default_document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                        EconEnum.cap.value] = cap
                if unique_escalation_default_document is not None:
                    default_document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                        EconEnum.escalation_model.value] = unique_escalation_default_document
                else:
                    default_document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                        EconEnum.escalation_model.value] = 'none'
        else:
            water_disposal_rows = copy_rows(
                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value])
            new_combined_rows, unique_escalation_default_document = merge_econ_and_escalation_rows(
                water_disposal_rows, well_id, scenario, scenarios_dic, scenarios_id, user_id, escalation_data_list,
                compare_escalation_and_save_into_self_data_list)
            if new_combined_rows is not None:
                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                    EconEnum.rows.value] = new_combined_rows
                cap = get_max_cap(new_combined_rows)
                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.cap.value] = cap
            if unique_escalation_default_document is not None:
                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                    EconEnum.escalation_model.value] = unique_escalation_default_document
            else:
                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                    EconEnum.escalation_model.value] = 'none'

    return default_document


def merge_econ_and_escalation_rows(econ_rows, well_id, scenario, scenarios_dic, scenarios_id, user_id,
                                   escalation_data_list, compare_escalation_and_save_into_self_data_list):
    delete_esc_rows = False
    new_combined_rows = None
    unique_escalation_default_document = None
    has_rate_cut_off = any('rate' in key for key in econ_rows[-1])
    esc_econ_rows = copy_rows(econ_rows)
    if len(econ_rows) > 1 and not has_rate_cut_off:
        new_combined_rows = sum_rows(econ_rows)
    else:
        delete_esc_rows = True
    combined_escalation_rows = None
    escalation_rows = []
    frequency, calculation = None, None
    for rows in esc_econ_rows:
        if EconEnum.escalation_model.value not in rows:
            continue
        if str(EconEnum.overlay_sequence.value) in rows:
            escalation_rows += ['none']
        elif rows[EconEnum.escalation_model.value] != 'none':
            esc_row = rows[EconEnum.escalation_model.value][EconEnum.econ_function.value][
                EconEnum.escalation_model.value][
                    EconEnum.rows.value] if rows[EconEnum.escalation_model.value][EconEnum.econ_function.value][
                        EconEnum.escalation_model.value][EconEnum.rows.value] != 'none' else list('none')
            if 'none' not in esc_row:
                try:
                    frequency = rows[EconEnum.escalation_model.value][EconEnum.econ_function.value][
                        EconEnum.escalation_model.value][EconEnum.esc_frequency.value]
                    calculation = rows[EconEnum.escalation_model.value][EconEnum.econ_function.value][
                        EconEnum.escalation_model.value][EconEnum.esc_calc_method.value]
                except IndexError:
                    frequency, calculation = None, None
            escalation_rows += esc_row
        else:
            escalation_rows += ['none']

    if 'none' in escalation_rows:
        if escalation_rows.index('none') != len(escalation_rows) - 1 or escalation_rows.count('none') > 1:
            escalation_rows = []
        else:
            escalation_rows.pop(-1)

    if len(escalation_rows) != 0:
        combined_escalation_rows = sum_rows(escalation_rows, esc=True)
    else:
        combined_escalation_rows = None

    if combined_escalation_rows:
        unique_escalation_default_document = add_escalation_document_to_data_list(
            combined_escalation_rows, calculation, frequency, scenario, well_id, scenarios_id, scenarios_dic,
            escalation_data_list, compare_escalation_and_save_into_self_data_list, user_id)

    if delete_esc_rows:
        for row in econ_rows:
            if EconEnum.escalation_model.value in row:
                row[EconEnum.escalation_model.value] = 'none'
        new_combined_rows = econ_rows

    return new_combined_rows, unique_escalation_default_document


def add_escalation_document_to_data_list(combined_escalation_rows, calculation, frequency, scenario, well_id,
                                         scenarios_id, scenarios_dic, escalation_data_list,
                                         compare_escalation_and_save_into_self_data_list, user_id):
    escalation_default_document = {
        "unique": False,
        "typeCurve": None,
        "wells": set(),
        "name": "",
        "project": "",
        "assumptionKey": "escalation",
        "assumptionName": "Escalation",
        "econ_function": {
            'escalation_model': {
                'escalation_frequency': 'yearly',
                'calculation_method': 'compound',
            }
        },
        "createdBy": user_id,
        "createdAt": datetime.datetime.now(),
        "updatedAt": datetime.datetime.now(),
    }
    escalation_default_document[CCSchemaEnum._id.value] = ObjectId()
    escalation_default_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
        EconEnum.rows.value] = combined_escalation_rows
    if calculation is not None and frequency is not None:
        escalation_default_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
            EconEnum.esc_frequency.value] = frequency
        escalation_default_document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
            EconEnum.esc_calc_method.value] = calculation
    escalation_default_document, all_zero_escalation = check_if_all_escalation_value_are_zeros(
        escalation_default_document, None, None, escalation_naming=True)
    if all_zero_escalation:
        escalation_default_document[EconEnum.econ_function.value] = {
            "escalation_model": {
                "escalation_frequency": "monthly",
                "calculation_method": "compound",
                "rows": [{
                    "pct_per_year": 0,
                    "entire_well_life": "Flat"
                }]
            }
        }
    for _id in scenarios_id:
        if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
            escalation_default_document[CCSchemaEnum.wells.value].add((_id, well_id))
        unique_escalation_default_document = compare_escalation_and_save_into_self_data_list(
            escalation_default_document, escalation_data_list)
    try:
        rows = copy_rows(unique_escalation_default_document[EconEnum.econ_function.value][
            EconEnum.escalation_model.value][EconEnum.rows.value])
    except KeyError:
        rows = []
    if len(rows) > 0:
        return unique_escalation_default_document


def combine_fixed_expense_rows(default_document, well_id, scenario, scenarios_dic, scenarios_id, escalation_data_list,
                               compare_escalation_and_save_into_self_data_list, user_id):
    #loop through phases
    for category in FIXED_EXPENSE_CATEGORY:
        fixed_expense_rows = copy_rows(
            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][EconEnum.rows.value])
        new_combined_rows, unique_escalation_default_document = merge_econ_and_escalation_rows(
            fixed_expense_rows, well_id, scenario, scenarios_dic, scenarios_id, user_id, escalation_data_list,
            compare_escalation_and_save_into_self_data_list)
        if new_combined_rows is not None:
            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                EconEnum.rows.value] = new_combined_rows
            cap = get_max_cap(new_combined_rows)
            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                EconEnum.cap.value] = cap
        if unique_escalation_default_document is not None:
            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                EconEnum.escalation_model.value] = unique_escalation_default_document
        else:
            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                EconEnum.escalation_model.value] = 'none'

    return default_document


def process_expense_override(expense_rows, overlay_dict, original_rows):
    new_expense_rows = None
    try:
        if EconEnum.entire_well_life.value not in expense_rows:
            if any(str(EconEnum.overlay_sequence.value) in row for row in expense_rows):
                original_rows = remove_sequence_from_rows(original_rows, inplace=True)
                overlay_dict_key = next(row for row in expense_rows if str(EconEnum.overlay_sequence.value) in row)
                overlay_obj = overlay_dict[overlay_dict_key]
                if any(type(fixed_expense_row) == dict for fixed_expense_row in expense_rows):
                    rep_expense_row = next(expense_row for expense_row in expense_rows if type(expense_row) == dict)
                    exist_key = next(key for key in rep_expense_row if key in EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS)
                    override_key = next(key for key in overlay_obj[-1] if key in EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS)
                    if exist_key != override_key:
                        return None, False
                k_index = 0
                for obj in overlay_obj:
                    obj[str(EconEnum.overlay_sequence.value)] = True
                    expense_rows.insert(k_index, obj)
                    k_index += 1
                while overlay_dict_key in expense_rows:
                    expense_rows.remove(overlay_dict_key)

                new_expense_rows = sum_rows(expense_rows, override=True)
    except Exception:
        new_expense_rows = None

    return new_expense_rows, False


def override_expense_overlay(default_document, property_id, scenario, overlay_dict, log_report, get_default_format):
    expense_default_document = get_default_format('expense')
    for expense_type in [EconEnum.variable_expense.value, EconEnum.fixed_expense.value]:
        try:
            if expense_type == EconEnum.fixed_expense.value:
                for category in FIXED_EXPENSE_CATEGORY:
                    fixed_expense_rows = copy_rows(default_document[EconEnum.econ_function.value][
                        EconEnum.fixed_expense.value][category][EconEnum.rows.value])
                    new_fixed_expense_rows, restore = process_expense_override(
                        fixed_expense_rows, overlay_dict, default_document[EconEnum.econ_function.value][
                            EconEnum.fixed_expense.value][category][EconEnum.rows.value])
                    if new_fixed_expense_rows is not None:
                        default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                            EconEnum.rows.value] = new_fixed_expense_rows
                    else:
                        if restore:
                            default_rows = expense_default_document[EconEnum.econ_function.value][
                                EconEnum.fixed_expense.value][category][EconEnum.rows.value]
                            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                                EconEnum.rows.value] = default_rows
                        else:
                            rows = default_document[EconEnum.econ_function.value][
                                EconEnum.fixed_expense.value][category][EconEnum.rows.value]
                            rows = remove_sequence_from_rows(rows, inplace=True)
                            default_document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                                EconEnum.rows.value] = rows
            else:
                for phase in [
                        PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
                        PhaseEnum.water.value
                ]:
                    if phase != PhaseEnum.water.value:
                        for category in variable_expenses_category:
                            variable_expense_rows = copy_rows(default_document[EconEnum.econ_function.value][
                                EconEnum.var_exp.value][phase][category][EconEnum.rows.value])
                            new_variable_expense_rows, restore = process_expense_override(
                                variable_expense_rows, overlay_dict, default_document[EconEnum.econ_function.value][
                                    EconEnum.var_exp.value][phase][category][EconEnum.rows.value])
                            if new_variable_expense_rows is not None:
                                default_document[EconEnum.econ_function.value][EconEnum.variable_expense.value][phase][
                                    category][EconEnum.rows.value] = new_variable_expense_rows
                            else:
                                if restore:
                                    default_rows = expense_default_document[EconEnum.econ_function.value][
                                        EconEnum.variable_expense.value][phase][category][EconEnum.rows.value]
                                    default_document[EconEnum.econ_function.value][EconEnum.variable_expense.value][
                                        phase][category][EconEnum.rows.value] = default_rows
                                else:
                                    rows = default_document[EconEnum.econ_function.value][
                                        EconEnum.variable_expense.value][phase][category][EconEnum.rows.value]
                                    rows = remove_sequence_from_rows(rows, inplace=True)
                                    default_document[EconEnum.econ_function.value][
                                        EconEnum.variable_expense.value][phase][category][EconEnum.rows.value] = rows

                    else:
                        water_disposal_rows = copy_rows(default_document[EconEnum.econ_function.value][
                            EconEnum.water_disposal.value][EconEnum.rows.value])
                        new_water_disposal_rows, restore = process_expense_override(
                            water_disposal_rows, overlay_dict, default_document[EconEnum.econ_function.value][
                                EconEnum.water_disposal.value][EconEnum.rows.value])
                        if new_water_disposal_rows is not None:
                            default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                                EconEnum.rows.value] = new_water_disposal_rows
                        else:
                            if restore:
                                default_rows = expense_default_document[EconEnum.econ_function.value][
                                    EconEnum.water_disposal.value][EconEnum.rows.value]
                                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                                    EconEnum.rows.value] = default_rows
                            else:
                                rows = default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                                    EconEnum.rows.value]
                                rows = remove_sequence_from_rows(rows, inplace=True)
                                default_document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                                    EconEnum.rows.value] = rows
        except Exception:
            pass

    return default_document


def copy_dictionary_local(orig_dict):
    copy_dict = {}
    for key in orig_dict:
        if type(orig_dict[key]) == dict:
            copy_dict[key] = dict(orig_dict[key])
        else:
            copy_dict[key] = orig_dict[key]
    return copy_dict


def copy_rows(rows):
    return [copy_dictionary_local(row) if type(row) == dict else row for row in rows]


def check_for_rate_cut_off(rows):
    has_rate_cut_off = False
    for row in rows:
        if str(EconEnum.overlay_sequence.value) in row or EconEnum.entire_well_life in row:
            continue
        else:
            if any('rate' in key for key in row):
                has_rate_cut_off = True
                break

    return has_rate_cut_off


def standardize_tax_units(document, phase_tax_unit_dict, use_std_dict, overlay_dict):
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        # copy tax rows for selected phase
        dict_phase = PhaseEnum.aries_condensate.value if phase == PhaseEnum.condensate.value else phase
        if use_std_dict.get(dict_phase):
            continue
        sev_tax_rows = copy_rows(
            document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value])
        # check that length of severance tax row is greater than 1, else standardization is pointless
        if len(sev_tax_rows) > 1:
            # create blank keys, incase all rows are invalid
            tax_keys = None
            # loop through the severance tax rows
            phase_key = PhaseEnum.aries_condensate.value if phase == PhaseEnum.condensate.value else phase
            main_key = phase_tax_unit_dict[phase_key]
            if main_key is None:
                continue
            has_rate_cut_off = check_for_rate_cut_off(sev_tax_rows)
            if has_rate_cut_off:
                continue
            for row in sev_tax_rows[::-1]:
                # ignore overlay sequence keys and entire well life if present
                if str(EconEnum.overlay_sequence.value) in row or EconEnum.entire_well_life in row:
                    continue
                # get the two tax keys, the last non zero tax_keys is what will eventually be used (ARIES)
                tax_keys = get_two_tax_keys(row)
                zero_key = tax_keys[tax_keys.index(main_key) - 1]
                break
            if tax_keys is not None:
                # loop through severance tax again
                for row in sev_tax_rows:
                    if str(EconEnum.overlay_sequence.value) in row or EconEnum.entire_well_life in row:
                        continue
                    # get the two tax keys of again from the top
                    # match with last keys using this function
                    # current_tax_keys = get_two_tax_keys(row)
                    row = process_uniform_tax_units(row, zero_key, main_key)
            if main_key is not None:
                phase_key = PhaseEnum.aries_condensate.value if phase == PhaseEnum.condensate.value else phase
                for override_key in overlay_dict:
                    # find key matching with override for this phase
                    if f'STX/{str(phase_key).upper()}-{EconEnum.overlay_sequence.value}' in override_key:
                        override_rows = overlay_dict[override_key]
                        for override_row in override_rows:
                            # get the two tax keys of again from the top
                            # match with last keys using this function
                            # current_tax_keys = get_two_tax_keys(override_row)
                            override_row = process_uniform_tax_units(override_row, zero_key, main_key)
        # update document
        document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value] = sev_tax_rows
    return document


def process_uniform_tax_units(row, zero_key, main_key):
    current_tax_keys = get_two_tax_keys(row)
    current_main_key = None
    for key in current_tax_keys:
        if row[key] != 0:
            current_main_key = key
            break
    if current_main_key is not None:
        current_zero_key = current_tax_keys[current_tax_keys.index(current_main_key) - 1]
        multiplier = 1
        if main_key == PriceEnum.pct_of_revenue.value:
            multiplier = 100
        if current_main_key != main_key:
            row[main_key] = aries_cc_round(float(row[current_main_key]) * multiplier)
            del row[current_main_key]
        temp_tax_keys = get_two_tax_keys(row)
        if len(temp_tax_keys) == 2:
            if current_zero_key != zero_key:
                row[zero_key] = row[current_zero_key]
                del row[current_zero_key]
        else:
            row[zero_key] = 0
    else:
        for key in current_tax_keys:
            if key in row:
                del row[key]
        row[main_key] = 0
        row[zero_key] = 0
    return row


def override_tax_overlay(default_document, property_id, scenario, overlay_dict, date_dict, log_report,
                         get_default_format):
    # loop through each relevant phase
    tax_default_document = get_default_format('tax')
    for tax_type in [EconEnum.sev_tax.value, EconEnum.adval_tax.value]:
        try:
            if tax_type == EconEnum.sev_tax.value:
                for phase in [
                        PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value
                ]:
                    # copy tax rows for selected phase
                    sev_tax_rows = copy_rows(default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value]
                                             [phase][EconEnum.rows.value])
                    new_tax_rows, restore = process_tax_override(
                        sev_tax_rows, overlay_dict, default_document[EconEnum.econ_function.value][
                            EconEnum.sev_tax.value][phase][EconEnum.rows.value], date_dict)
                    if new_tax_rows is not None:
                        default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                            EconEnum.rows.value] = new_tax_rows
                    else:
                        if restore:
                            default_rows = tax_default_document[EconEnum.econ_function.value][
                                EconEnum.sev_tax.value][phase][EconEnum.rows.value]
                            default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                                EconEnum.rows.value] = default_rows
                        rows = default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                            EconEnum.rows.value]
                        rows = remove_sequence_from_rows(rows, inplace=True)
                        default_document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][
                            EconEnum.rows.value] = rows

            else:
                adval_tax_rows = copy_rows(
                    default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value])
                new_tax_rows, restore = process_tax_override(
                    adval_tax_rows, overlay_dict,
                    default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value],
                    date_dict)
                if new_tax_rows is not None:
                    default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                        EconEnum.rows.value] = new_tax_rows
                else:
                    if restore:
                        default_rows = tax_default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                            EconEnum.rows.value]
                        default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                            EconEnum.rows.value] = default_rows
                    else:
                        rows = default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                            EconEnum.rows.value]
                        rows = remove_sequence_from_rows(rows, inplace=True)
                        default_document[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                            EconEnum.rows.value] = rows
        except Exception:
            pass

    return default_document


def unify_criteria_for_original_and_override(tax_rows, overlay_obj, date_dict):
    override_asof, override_fpd, override_dates = False, False, False
    for obj in overlay_obj:
        if any('offset_to_as_of_date' in key for key in obj):
            override_asof = True
        elif any('offset_to_fpd' in key for key in obj):
            override_fpd = True
        elif any(CCSchemaEnum.dates.value in key for key in obj):
            override_dates = True
    asof, fpd, dates = False, False, False
    for obj in tax_rows:
        if any('offset_to_as_of_date' in key for key in obj):
            asof = True
        elif any('offset_to_fpd' in key for key in obj):
            fpd = True
        elif any(CCSchemaEnum.dates.value in key for key in obj):
            dates = True

    override_criteria = [override_asof, override_fpd, override_dates]
    original_criteria = [asof, fpd, dates]
    unify = False
    for i in range(3):
        if override_criteria[i] != original_criteria[i]:
            unify = True
            break

    if unify:
        if not override_dates:
            overlay_obj = convert_offset_criteria_in_rows_to_dates(overlay_obj, override_asof, override_fpd, date_dict)
        if not dates:
            tax_rows = convert_offset_criteria_in_rows_to_dates(tax_rows, asof, fpd, date_dict)

    return tax_rows, overlay_obj


def convert_offset_criteria_in_rows_to_dates(rows, asof, fpd, date_dict):
    if asof:
        ref_date = date_dict['asof']
        key = 'offset_to_as_of_date'
    if fpd:
        ref_date = date_dict['fpd']
        key = 'offset_to_fpd'
    for obj in rows:
        if str(EconEnum.overlay_sequence.value) in obj:
            continue
        if obj[key][CCSchemaEnum.end.value] != EconEnum.econ_limit.value:
            start_shift = obj[key][CCSchemaEnum.start.value] - 1
            end_shift = obj[key][CCSchemaEnum.end.value]
            start_date = pd.to_datetime(ref_date) + pd.DateOffset(months=start_shift)
            end_date = start_date + pd.DateOffset(months=end_shift, days=-1)
            obj[CCSchemaEnum.dates.value] = {
                CCSchemaEnum.start_date.value: start_date.strftime(CCSchemaEnum.ymd_date_dash_format.value),
                CCSchemaEnum.end_date.value: end_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
            }
            del obj[key]
        else:
            start_shift = obj[key][CCSchemaEnum.start.value] - 1
            start_date = pd.to_datetime(ref_date) + pd.DateOffset(months=start_shift)
            end_date = EconEnum.econ_limit.value
            obj[CCSchemaEnum.dates.value] = {
                CCSchemaEnum.start_date.value: start_date.strftime(CCSchemaEnum.ymd_date_dash_format.value),
                CCSchemaEnum.end_date.value: EconEnum.econ_limit.value
            }
            del obj[key]
    return rows


def process_tax_override(tax_rows, overlay_dict, original_rows, date_dict):
    new_tax_rows = None
    tax_keys = None
    try:
        if EconEnum.entire_well_life.value not in tax_rows:
            # check if -9999 in any item in the row (-9999 signifies that an Override is present in that model)
            if any(str(EconEnum.overlay_sequence.value) in row for row in tax_rows):
                original_rows = remove_sequence_from_rows(original_rows, inplace=True)
                # obtain the key from the row e.g: STX/OIL--9999
                overlay_dict_key = next(row for row in tax_rows if str(EconEnum.overlay_sequence.value) in row)
                # get the overriding objects from the overlay object dictionary
                overlay_obj = overlay_dict[overlay_dict_key]

                try:
                    tax_rows, overlay_obj = unify_criteria_for_original_and_override(tax_rows, overlay_obj, date_dict)
                except (KeyError, IndexError, TypeError):
                    pass

                # find a row that is a dictionary to find an object with a representative keys e.g dollar_per_month
                if any(type(tax_row) == dict for tax_row in tax_rows):
                    rep_tax_row = next(tax_row for tax_row in tax_rows if type(tax_row) == dict)
                else:
                    rep_tax_row = None
                # get the two tax keys
                if rep_tax_row is not None:
                    tax_keys = get_two_tax_keys(rep_tax_row)
                    # get the two tax keys
                    override_tax_keys = get_two_tax_keys(overlay_obj[-1])

                    tax_rows, overlay_obj, tax_keys, override_tax_keys = get_best_two_tax_keys(
                        tax_rows, overlay_obj, tax_keys, override_tax_keys)
                    if tax_rows is None or overlay_obj is None:
                        return None, False
                else:
                    tax_keys = get_two_tax_keys(overlay_obj[-1])

                k_index = 0
                # loop through all the overlay objects
                for obj in overlay_obj:
                    # add a marker in object to let sum_rows function know that this object is to override
                    obj[str(EconEnum.overlay_sequence.value)] = True
                    # insert object to front of line (REQUIRED TO AVOID ERRORS)
                    tax_rows.insert(k_index, obj)
                    k_index += 1
                # remove the overlay dict key from the tax_rows i.e remove STX/OIL--9999 from the rows
                while overlay_dict_key in tax_rows:
                    tax_rows.remove(overlay_dict_key)
                main_override_key = overlay_dict_key.split('-')[-1]
                new_tax_rows = []
                # loop through the tax_keys, delete each of the tax keys from the original (since there are two)
                # sum_rows functions can only handle one (to ensure accuracy)
                # append the two new combined rows to new_tax_rows
                for tax_key in tax_keys:
                    tax_rows_copy = copy_rows(tax_rows)
                    if tax_key == main_override_key:
                        true_key = False
                    else:
                        true_key = True
                    for tax_row_copy in tax_rows_copy:
                        del tax_row_copy[tax_key]
                    new_tax_rows.append(sum_rows(tax_rows_copy, true_key=true_key, override=True))
                # combine the two new combined rows to form a single object
                new_tax_rows = combine_tax_obj_rows(new_tax_rows[0], new_tax_rows[1])
    except Exception:
        new_tax_rows = None
    return new_tax_rows, False


def get_max_cap(rows):
    max_cap = MIN_VALUE
    for row in rows:
        cap = row.get(EconEnum.cap.value)
        try:
            cap = float(cap)
        except (ValueError, TypeError):
            cap = None

        if cap is not None and cap > max_cap:
            max_cap = cap
    return max_cap if max_cap != MIN_VALUE else ''


def get_best_two_tax_keys(existing_objs, override_objs, existing_keys, override_keys):  # noqa (C901)
    non_zero_exist_key = None
    all_zero_exist_key = None
    for key in existing_keys:
        if non_zero_exist_key is not None:
            break
        for obj in existing_objs:
            if str(EconEnum.overlay_sequence.value) in obj:
                continue
            elif obj[key] != 0:
                non_zero_exist_key = key
                break
            all_zero_exist_key = key
    new_keys = list(set(override_keys) - set(existing_keys))
    for obj in existing_objs:
        if str(all_zero_exist_key) in obj and len(new_keys) > 0 and type(obj) == dict:
            del obj[all_zero_exist_key]
            obj[new_keys[-1]] = 0
    if non_zero_exist_key in override_keys:
        zero_exist_key = existing_keys[abs(existing_keys.index(non_zero_exist_key) - 1)]
        for obj in existing_objs:
            if str(zero_exist_key) in obj and type(obj) == dict:
                del obj[zero_exist_key]
                obj[override_keys[abs(override_keys.index(non_zero_exist_key) - 1)]] = 0
        return existing_objs, override_objs, override_keys, override_keys
    elif non_zero_exist_key is not None:
        all_zero_override_key = None
        for key in override_keys:
            if all_zero_override_key is not None:
                break
            for obj in override_objs:
                if obj[key] != 0:
                    break
                if key in existing_keys and key != all_zero_exist_key:
                    continue
                all_zero_override_key = key
        for obj in override_objs:
            if str(all_zero_override_key) in obj and type(obj) == dict:
                del obj[all_zero_override_key]
                obj[non_zero_exist_key] = 0
        override_keys[override_keys.index(all_zero_override_key)] = non_zero_exist_key
        return existing_objs, override_objs, override_keys, override_keys
    else:
        return None, None, None, None


def get_two_tax_keys(row):
    tax_keys = []
    for key in row:
        if key in TAX_KEYS and len(tax_keys) < 2:
            tax_keys.append(key)
    return tax_keys


TAX_KEYS = [
    PriceEnum.pct_of_revenue.value, PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_month.value,
    PriceEnum.dollar_per_boe.value, PriceEnum.dollar_per_bbl.value
]


def combine_tax_obj_rows(first_tax_combined_rows, second_tax_combined_rows):
    if len(first_tax_combined_rows) != len(second_tax_combined_rows):
        if len(first_tax_combined_rows) != 0 and len(second_tax_combined_rows) != 0:
            if len(first_tax_combined_rows) > len(second_tax_combined_rows):
                first_tax_combined_rows, second_tax_combined_rows = merge_to_equal_tax_obj(
                    first_tax_combined_rows, second_tax_combined_rows)
            else:
                second_tax_combined_rows, first_tax_combined_rows = merge_to_equal_tax_obj(
                    second_tax_combined_rows, first_tax_combined_rows)
        else:
            return None
    n = len(first_tax_combined_rows)
    for i in range(n):
        first_tax_combined_rows[i].update(second_tax_combined_rows[i])
    return first_tax_combined_rows


def merge_to_equal_tax_obj(first_objs, second_objs):
    second_key_value = None
    if any(key in TAX_KEYS for key in second_objs[-1]):
        second_key = next(key for key in second_objs[-1] if key in TAX_KEYS)
        second_key_value = second_objs[-1][second_key]
    if any(key in TAX_KEYS for key in first_objs[-1]):
        first_key = next(key for key in first_objs[-1] if key in TAX_KEYS)
        first_key_value = first_objs[-1][first_key]
    if second_key_value is not None and first_key_value is not None:
        new_objs = copy_rows(first_objs)
        for obj in new_objs:
            if first_key in obj:
                del obj[first_key]
                obj[second_key] = second_key_value
        second_objs = new_objs
    return first_objs, second_objs


def combine_ngl_yield_rows(document, condensate=False):
    if condensate:
        phase = PhaseEnum.condensate.value
    else:
        phase = PhaseEnum.ngl.value
    yield_rows = copy_rows(
        document[EconEnum.econ_function.value][ForecastEnum.yields.value][phase][EconEnum.rows.value])
    if len(yield_rows) > 1:
        for row in yield_rows:
            del row[ForecastEnum.unshrunk_gas.name]
        new_combined_rows = sum_rows(yield_rows, yield_=True)
        if new_combined_rows is not None:
            for row in new_combined_rows:
                row[ForecastEnum.unshrunk_gas.name] = ForecastEnum.unshrunk_gas.value
                document[EconEnum.econ_function.value][ForecastEnum.yields.value][PhaseEnum.ngl.value][
                    EconEnum.rows.value] = new_combined_rows
            return document
        else:
            return document
    return document


def combine_risking_rows(document):
    for phase in [
            PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.water.value,
            PhaseEnum.condensate.value
    ]:
        risking_rows = copy_rows(
            document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][EconEnum.rows.value])

        if len(risking_rows) > 1:
            new_combined_rows = sum_rows(risking_rows, risk=True)

            if new_combined_rows is not None:
                document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                    EconEnum.rows.value] = new_combined_rows

    return document


def get_unit_key_and_clean_row_for_taxes(rows):
    unit_key = None
    for key in rows[-1]:
        if key in EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS:
            unit_key = key
            break
    # for row in rows:
    #     if unit_key in row:
    #         continue
    #     else:
    #         while any(key in row for key in EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS):
    #             non_key = next(key for key in EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS if key in row)
    #             del row[non_key]
    #         row[unit_key] = 0
    return unit_key


# get formatted tuple list
def get_date_value_tuple(rows):
    fpd, asof = False, False
    formatted_tuple_list = []
    unit_key = get_unit_key_and_clean_row_for_taxes(rows)
    for diff_dict in rows:
        if str(EconEnum.overlay_sequence.value) in diff_dict:
            override = True
        else:
            override = False
        if CCSchemaEnum.dates.value in rows[-1]:
            start_date = diff_dict[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]
            end_date = diff_dict[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]
            value = diff_dict[unit_key]
        elif any(criteria in rows[-1] for criteria in [EconEnum.fpd_offset.value, EconEnum.asof_offset.value]):
            date_offset_type = next(criteria for criteria in [EconEnum.fpd_offset.value, EconEnum.asof_offset.value]
                                    if criteria in rows[-1])
            if date_offset_type == EconEnum.fpd_offset.value:
                fpd = True
            elif date_offset_type == EconEnum.asof_offset.value:
                asof = True
            start_date = diff_dict[date_offset_type][CCSchemaEnum.start.value]
            end_date = diff_dict[date_offset_type][CCSchemaEnum.end.value]
            value = diff_dict[unit_key]
        formatted_tuple_list.append((start_date, end_date, value, override))
    return formatted_tuple_list, unit_key, fpd, asof


def get_earliest_and_latest_date_differential(formatted_tuple_list, fpd, asof):
    if fpd or asof:
        earliest_date = formatted_tuple_list[0][0]
        latest_date = formatted_tuple_list[0][1]
    else:
        earliest_date = pd.to_datetime(formatted_tuple_list[0][0], errors='coerce')
        latest_date = pd.to_datetime(formatted_tuple_list[0][1], errors='coerce')

    for tuples in formatted_tuple_list:
        if fpd or asof:
            try:
                if tuples[0] < earliest_date:
                    earliest_date = tuples[0]
                if latest_date == EconEnum.econ_limit.value:
                    if tuples[0] > earliest_date:
                        latest_date = tuples[0]
                    if tuples[1] > earliest_date:
                        latest_date = tuples[1]
                else:
                    if tuples[0] > latest_date:
                        latest_date = tuples[0]
                    if tuples[1] > latest_date:
                        latest_date = tuples[1]
            except TypeError:
                pass
        else:
            if pd.to_datetime(tuples[0], errors='coerce') < earliest_date:
                earliest_date = pd.to_datetime(tuples[0], errors='coerce')
            if pd.to_datetime(tuples[0], errors='coerce') > pd.to_datetime(
                    latest_date, errors='coerce') or (not pd.isnull(pd.to_datetime(tuples[0], errors='coerce'))
                                                      and pd.isnull(pd.to_datetime(latest_date, errors='coerce'))):
                latest_date = pd.to_datetime(tuples[0], errors='coerce')
            if pd.to_datetime(tuples[1], errors='coerce') > pd.to_datetime(
                    latest_date, errors='coerce') or (not pd.isnull(pd.to_datetime(tuples[1], errors='coerce'))
                                                      and pd.isnull(pd.to_datetime(latest_date, errors='coerce'))):
                latest_date = pd.to_datetime(tuples[1], errors='coerce')
    no_months = get_number_of_months(earliest_date, latest_date, fpd, asof)

    return earliest_date, no_months


def get_number_of_months(earliest_date, latest_date, fpd, asof):
    if fpd or asof:
        try:
            no_months = latest_date - earliest_date + 1
        except Exception:
            no_months = 0
    else:
        try:
            no_months = round((latest_date - earliest_date).days / DAYS_IN_MONTH)
        except Exception:
            no_months = 0
    return no_months


def combine_differential_rows_in_models_new(  # noqa (C901)
        formatted_tuple_list, earliest_date, no_months, key, fpd, asof, yield_, esc, true_key):
    override_value = None
    new_date_list = []
    econ_limit = False
    if not fpd and not asof:
        earliest_date = datetime.date(int(earliest_date.year), int(earliest_date.month), int(earliest_date.day))
    for offset in range(no_months + 1):
        value = 0
        override_value_present = False
        for tuples in formatted_tuple_list:
            if fpd or asof:
                formatted_start_date = tuples[0]
            else:
                year, month, day = tuples[0].split('-')
                formatted_start_date = datetime.date(int(year), int(month), int(day))  # pd.to_datetime(tuples[0])
            end_date = tuples[1]
            current_value = tuples[2]
            if end_date == EconEnum.econ_limit.value:
                econ_limit = True
            else:
                econ_limit = False
            if not econ_limit and not fpd and not asof:
                year, month, day = tuples[1].split('-')
                formatted_end_date = datetime.date(int(year), int(month), int(day))
            if fpd or asof:
                current_date = earliest_date + offset
            else:
                current_date = get_current_date(earliest_date, offset)
            if fpd or asof:
                if (current_date >= formatted_start_date and end_date == EconEnum.econ_limit.value):
                    if tuples[3]:
                        override_value_present = True
                        if true_key:
                            override_value = current_value
                        else:
                            override_value = 0
                    else:
                        value += current_value
                elif (current_date >= formatted_start_date and current_date <= end_date):
                    if tuples[3]:
                        override_value_present = True
                        if true_key:
                            override_value = current_value
                        else:
                            override_value = 0
                    else:
                        value += current_value
            else:
                if not econ_limit:
                    if (current_date >= formatted_start_date and current_date <= formatted_end_date):
                        if tuples[3]:
                            override_value_present = True
                            if true_key:
                                override_value = current_value
                            else:
                                override_value = 0
                        else:
                            value += current_value
                else:
                    if current_date >= formatted_start_date:
                        if tuples[3]:
                            override_value_present = True
                            if true_key:
                                override_value = current_value
                            else:
                                override_value = 0
                        else:
                            value += current_value
        if override_value_present:
            new_date_list.append((current_date, aries_cc_round(override_value)))
        else:
            new_date_list.append((current_date, aries_cc_round(value)))
    combined_rows = combine_rows_with_econ(new_date_list, econ_limit, key, fpd, asof, yield_, esc)

    return combined_rows


def combine_overlay_risking_rows_in_models_new(  # noqa (C901)
        formatted_tuple_list,
        earliest_date,
        no_months,
        key,
        fpd,
        asof,
        yield_,
        esc,
        true_key,
        overlay=False):
    override_value = None
    new_date_list = []
    econ_limit = False
    if not fpd and not asof:
        earliest_date = datetime.date(int(earliest_date.year), int(earliest_date.month), int(earliest_date.day))
    for offset in range(no_months + 1):
        value = 100 if overlay else 0
        value_changed = False
        override_value_present = False
        for tuples in formatted_tuple_list:
            if fpd or asof:
                formatted_start_date = tuples[0]
            else:
                year, month, day = tuples[0].split('-')
                formatted_start_date = datetime.date(int(year), int(month), int(day))  # pd.to_datetime(tuples[0])
            end_date = tuples[1]
            current_value = tuples[2]
            if end_date == EconEnum.econ_limit.value:
                econ_limit = True
            else:
                econ_limit = False
            if not econ_limit and not fpd and not asof:
                year, month, day = tuples[1].split('-')
                formatted_end_date = datetime.date(int(year), int(month), int(day))
            if fpd or asof:
                current_date = earliest_date + offset
            else:
                current_date = get_current_date(earliest_date, offset)
            if fpd or asof:
                if (current_date >= formatted_start_date and end_date == EconEnum.econ_limit.value):
                    if tuples[3]:
                        override_value_present = True
                        if true_key:
                            override_value = current_value
                        else:
                            override_value = 0
                    else:
                        if overlay:
                            value = (current_value * value) / 100
                        else:
                            value += current_value
                            value_changed = True
                elif (current_date >= formatted_start_date and current_date <= end_date):
                    if tuples[3]:
                        override_value_present = True
                        if true_key:
                            override_value = current_value
                        else:
                            override_value = 0
                    else:
                        if overlay:
                            value = (current_value * value) / 100
                        else:
                            value += current_value
                            value_changed = True
            else:
                if not econ_limit:
                    if (current_date >= formatted_start_date and current_date <= formatted_end_date):
                        if tuples[3]:
                            override_value_present = True
                            if true_key:
                                override_value = current_value
                            else:
                                override_value = 0
                        else:
                            if overlay:
                                value = (current_value * value) / 100
                            else:
                                value += current_value
                                value_changed = True
                else:
                    if current_date >= formatted_start_date:
                        if tuples[3]:
                            override_value_present = True
                            if true_key:
                                override_value = current_value
                            else:
                                override_value = 0
                        else:
                            if overlay:
                                value = (current_value * value) / 100
                            else:
                                value += current_value
                                value_changed = True

        if override_value_present:
            new_date_list.append((current_date, aries_cc_round(override_value)))
        else:
            value = 100 if value == 0 and not value_changed else value
            new_date_list.append((current_date, aries_cc_round(value)))
    combined_rows = combine_rows_with_econ(new_date_list, econ_limit, key, fpd, asof, yield_, esc)

    return combined_rows


def get_current_date(earliest_date, offset):
    day = earliest_date.day
    month = earliest_date.month + offset
    offset_year = 0
    while month > 12:
        month -= 12
        offset_year += 1
    year = earliest_date.year + offset_year
    return datetime.date(year, month, day)


def shift_datetime_date(date, months=0, years=0, days=0):
    offset = months + (years * 12)
    day = date.day
    month = date.month + offset
    offset_year = 0
    if month > 0:
        while month > 12:
            month -= 12
            offset_year += 1
    else:
        while month <= 0:
            month += 12
            offset_year -= 1

    year = date.year + offset_year
    year, month, day = get_correct_day(year, month, day)
    return datetime.date(year, month, day) + datetime.timedelta(days=days)


def get_correct_day(year, month, day):
    # get days in given month
    days_in_given_month = DAYS_IN_MONTH_DICT.get(str(month))

    # handle leap year
    if days_in_given_month is not None:
        if month == 2 and check_leap_year(year):
            days_in_given_month = 29

        # get a day
        day = days_in_given_month if day > days_in_given_month else day

    return year, month, day


def combine_rows_with_econ(new_date_list, econ_limit, key, fpd, asof, yield_, esc):
    prev_value = None
    prev_end_date = None
    combined_rows = []
    for date_value in new_date_list:
        current_date = date_value[0]
        current_value = date_value[1]
        if current_value != prev_value:
            if fpd:
                row = {EconEnum.fpd_offset.value: {CCSchemaEnum.start.value: current_date}, key: current_value}
            elif asof:
                row = {EconEnum.asof_offset.value: {CCSchemaEnum.start.value: current_date}, key: current_value}
            else:
                row = {
                    CCSchemaEnum.dates.value: {
                        CCSchemaEnum.start_date.value:
                        (pd.to_datetime(current_date) + MonthBegin(0)).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                    },
                    key: current_value
                }
            if combined_rows:
                if fpd:
                    combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.end.value] = prev_end_date
                    if prev_end_date == EconEnum.econ_limit.value:
                        combined_rows[-1][EconEnum.fpd_offset.value][EconEnum.period.value] = (
                            1200 - combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.start.value]) + 1
                    else:
                        combined_rows[-1][EconEnum.fpd_offset.value][EconEnum.period.value] = (
                            combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.end.value]
                            - combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.start.value]) + 1
                elif asof:
                    combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.end.value] = prev_end_date
                    if prev_end_date == EconEnum.econ_limit.value:
                        combined_rows[-1][EconEnum.asof_offset.value][EconEnum.period.value] = (
                            1200 - combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.start.value]) + 1
                    else:
                        combined_rows[-1][EconEnum.asof_offset.value][EconEnum.period.value] = (
                            combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.end.value]
                            - combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.start.value]) + 1
                else:
                    combined_rows[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = (
                        pd.to_datetime(prev_end_date) + MonthEnd(1)).strftime(CCSchemaEnum.ymd_date_dash_format.value)
            combined_rows.append(row)
            prev_value = current_value
            prev_end_date = current_date
            continue
        prev_value = current_value
        prev_end_date = current_date
    if econ_limit:
        if fpd:
            combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.end.value] = EconEnum.econ_limit.value
            combined_rows[-1][EconEnum.fpd_offset.value][EconEnum.period.value] = (
                1200 - combined_rows[-1][EconEnum.fpd_offset.value][CCSchemaEnum.start.value]) + 1
        elif asof:
            combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.end.value] = EconEnum.econ_limit.value
            combined_rows[-1][EconEnum.asof_offset.value][EconEnum.period.value] = (
                1200 - combined_rows[-1][EconEnum.asof_offset.value][CCSchemaEnum.start.value]) + 1
        else:
            combined_rows[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = EconEnum.econ_limit.value
    if not yield_ and not esc:
        for row in combined_rows:
            row['cap'] = ''

    combined_rows = check_for_incomplete_last_item_in_rows(combined_rows, fpd, asof)

    return combined_rows


def check_for_incomplete_last_item_in_rows(combined_rows, fpd, asof):
    if fpd:
        if CCSchemaEnum.end.value not in combined_rows[-1][EconEnum.fpd_offset.value]:
            combined_rows.pop(-1)
    elif asof:
        if CCSchemaEnum.end.value not in combined_rows[-1][EconEnum.asof_offset.value]:
            combined_rows.pop(-1)
    else:
        if CCSchemaEnum.end_date.value not in combined_rows[-1][CCSchemaEnum.dates.value]:
            combined_rows.pop(-1)
    return combined_rows


def get_earliest_and_latest_date(combined_rows):
    '''
    get earliest_date and latest_date among rows, rows2, row3,... for corresponding model, phase
    '''
    earliest_date = None
    latest_date = None

    for obj in combined_rows:
        if CCSchemaEnum.dates.value in obj:
            if earliest_date is None and latest_date is None:
                try:
                    earliest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    latest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])
                except Exception:
                    pass
            else:
                try:
                    if pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]) < earliest_date:
                        earliest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    if pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]) > latest_date:
                        latest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    if pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]) < earliest_date:
                        earliest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])
                    if pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]) > latest_date:
                        latest_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])
                except Exception:
                    pass
        else:
            continue

    if latest_date is None:
        latest_date = earliest_date

    return earliest_date, latest_date


def aries_cc_round(value):
    return round(value, CCSchemaEnum.round_off_value.value)


def remove_sequence_from_rows(rows, inplace=False):
    del_index = []
    for idx, row in enumerate(rows):
        if str(EconEnum.overlay_sequence.value) in row:
            del_index.append(idx)
    rowss = []
    sequence_ls = []
    for idx, row in enumerate(rows):
        if idx in del_index:
            sequence_ls.append(row)
        else:
            rowss.append(row)
    rows = rowss
    if not inplace:
        return rows, sequence_ls
    else:
        return rows


def sum_rows(rows, yield_=False, risk=False, risk_overlay=False, esc=False, override=False, true_key=True):
    # remove seqeunce
    if not override:
        rows, sequence_ls = remove_sequence_from_rows(rows)

    rows, required = check_if_sum_rows_required(rows)
    # if escalation requires combination, ignore it (will lead to wrong mathematical values)
    if required and esc:
        return None
    if not required:
        if not esc:
            for row in rows:
                if EconEnum.escalation_model.value in row:
                    del row[EconEnum.escalation_model.value]
        # add sequence
        if not override:
            rows = add_add_sequence_to_rows(rows, sequence_ls)
        else:
            for row in rows:
                if str(EconEnum.overlay_sequence.value) in row:
                    del row[str(EconEnum.overlay_sequence.value)]
        return rows

    tuple_values_list, unit, fpd, asof = get_date_value_tuple(rows)
    earliest_date, no_of_months = get_earliest_and_latest_date_differential(tuple_values_list, fpd, asof)

    if risk:
        new_combined_rows = combine_overlay_risking_rows_in_models_new(tuple_values_list,
                                                                       earliest_date,
                                                                       no_of_months,
                                                                       unit,
                                                                       fpd,
                                                                       asof,
                                                                       yield_,
                                                                       esc,
                                                                       true_key,
                                                                       overlay=risk_overlay)
    else:
        new_combined_rows = combine_differential_rows_in_models_new(tuple_values_list, earliest_date, no_of_months,
                                                                    unit, fpd, asof, yield_, esc, true_key)
    if not override:
        new_combined_rows = add_add_sequence_to_rows(new_combined_rows, sequence_ls)
    # add sequence
    return new_combined_rows


def add_add_sequence_to_rows(rows, sequence_ls):
    for sequence in sequence_ls:
        rows.append(sequence)
    return rows


def check_if_sum_rows_required(rows):
    required = False
    if any('offset_to_' in criteria for criteria in rows[-1]):
        offset_key = next(key for key in rows[-1] if 'offset_to_' in key)
        for idx, row in enumerate(rows):
            if idx <= len(rows) - 2:
                if row[offset_key][CCSchemaEnum.end.value] != EconEnum.econ_limit.value:
                    if (row[offset_key][CCSchemaEnum.end.value] + 1
                            == rows[idx + 1][offset_key][CCSchemaEnum.start.value]) and (
                                row[offset_key][CCSchemaEnum.end.value] > row[offset_key][CCSchemaEnum.start.value]):
                        continue
                    else:
                        required = True
                        return rows, required
                else:
                    required = True
                    return rows, required

    else:
        for idx, row in enumerate(rows):
            if idx <= len(rows) - 2:
                if row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != EconEnum.econ_limit.value:
                    current_row_start_date = convert_dash_date_to_datetime(
                        row[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    current_row_end_date = convert_dash_date_to_datetime(
                        row[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])
                    current_row_end_date_plus_1 = shift_datetime_date(current_row_end_date, days=1)
                    next_row_start_date = convert_dash_date_to_datetime(
                        rows[idx + 1][CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                    if (current_row_end_date_plus_1
                            == next_row_start_date) and (current_row_end_date > current_row_start_date):
                        continue
                    else:
                        required = True
                        return rows, required
                else:
                    required = True
                    return rows, required
    return rows, required


variable_expenses_category = [
    EconEnum.gathering.value, EconEnum.opc.value, EconEnum.transport.value, EconEnum.market.value, EconEnum.other.value
]

PRICE_UNITS = [
    PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_mmbtu.value, PriceEnum.pct_of_base_price.value,
    PriceEnum.price.value, PriceEnum.dollar_per_bbl.value, PriceEnum.dollar_per_boe.value
]

FIXED_EXPENSE_CATEGORY = {
    EconEnum.monthly_cost.value: None,
    EconEnum.other_cost_1.value: None,
    EconEnum.other_cost_2.value: None,
    EconEnum.other_cost_3.value: None,
    EconEnum.other_cost_4.value: None,
    EconEnum.other_cost_5.value: None,
    EconEnum.other_cost_6.value: None,
    EconEnum.other_cost_7.value: None,
    EconEnum.other_cost_8.value: None
}

EXPENSE_TAX_YIELD_PRICE_DIFF_UNITS = PRICE_UNITS + TAX_KEYS + [
    'unit_cost', 'fixed_expense', 'yield', 'pct_per_year', 'dollar_per_year', 'dollar_per_boe', 'pct_of_oil_price',
    'pct_of_oil_rev', 'pct_of_gas_rev', 'pct_of_ngl_rev', 'pct_remaining', 'multiplier'
]

DAYS_IN_MONTH_DICT = {
    '1': 31,
    '2': 28,
    '3': 31,
    '4': 30,
    '5': 31,
    '6': 30,
    '7': 31,
    '8': 31,
    '9': 30,
    '10': 31,
    '11': 30,
    '12': 31
}


def check_if_all_escalation_value_are_zeros(document, model, calculation, escalation_naming=False):
    for row in document[EconEnum.econ_function.value][EconEnum.escalation_model.value][EconEnum.rows.value]:
        if any('_per_year' in key for key in row):
            esc_key = next(key for key in row if 'per_year' in key)
            if row[esc_key] != 0:
                return document, False
    if not escalation_naming:
        document[EconEnum.econ_function.value][EconEnum.escalation_model.value][EconEnum.esc_frequency.value] = model
        document[EconEnum.econ_function.value][EconEnum.escalation_model.value][
            EconEnum.esc_calc_method.value] = calculation
        if model == 'constant' and esc_key != EconEnum.dollar_per_year.value:
            for row in document[EconEnum.econ_function.value][EconEnum.escalation_model.value][EconEnum.rows.value]:
                del row[esc_key]
                row[EconEnum.dollar_per_year.value] = 0
        elif model != 'constant' and esc_key == EconEnum.dollar_per_year.value:
            for row in document[EconEnum.econ_function.value][EconEnum.escalation_model.value][EconEnum.rows.value]:
                del row[esc_key]
                row[EconEnum.pct_per_year.value] = 0
        return document, True
    else:
        return document, True


FLAT_ESCALATION_ECON_FUNC = {
    "escalation_model": {
        "escalation_frequency": "monthly",
        "calculation_method": "compound",
        "rows": [{
            "pct_per_year": 0,
            "entire_well_life": "Flat"
        }]
    }
}
