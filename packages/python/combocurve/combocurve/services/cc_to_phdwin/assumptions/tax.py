import pandas as pd

from combocurve.services.cc_to_phdwin.helpers import (CC_CRITERIA_TO_PHDWIN_CRITERIA_DICT,
                                                      convert_flat_criteria_to_date, convert_offset_rows_to_date,
                                                      fill_in_with_default_assumptions, get_key_well_properties,
                                                      get_model_date_reference, get_truncated_name, get_unit_from_rows,
                                                      update_assumption_name_if_appropriate, update_export_progress)

RECOGNIZED_CC_PHDWIN_TAX_CRITERIA = [
    'dates', 'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_first_segment',
    'offset_to_discount_date', 'offset_to_end_history'
]

PHD_TAX_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Type(Key)', 'Product(Key)', 'Date(Key)',
    'Model', 'Value', 'Percent'
]

MOD_TAX_COLUMNS = [
    'Type(Key)', 'Product Name(Key)', 'Model Name(Key)', 'Model Id(Key)', 'Date(Key)', 'Segment', 'State', 'County',
    'Currency', 'Units', 'Tax per', 'Prior to Local Tax', 'Affect Economic Limit', 'Use WI', 'Tax Value', 'Tax Percent'
]


def create_phdwin_tax_table(context,
                            notification_id,
                            user_id,
                            date_dict,
                            well_order_list,
                            well_data_list,
                            progress_range,
                            user_key=None,
                            error_log=None,
                            use_asof_reference=False):
    mod_table = []
    phd_table = []
    referenced_model_names_dict = {}
    unreferenced_model_names = []
    truncation_model_name_dict = {}

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

            # btu_value = get_btu_value(assumptions)

            # get key well properties
            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict = key_well_header_props
            props = [well_name, state, county, field, None, user_chosen_identifier]

            # get assumption document
            assumption = assumptions.get('production_taxes')
            # get assumption name
            assumption_name = assumption.get('name')
            if assumption_name is None:
                continue
            assumption_name = get_truncated_name(truncation_model_name_dict, assumption_name)

            # check if a model has already been created and can be referenced immediately
            if assumption_name in referenced_model_names_dict:
                add_rows = referenced_model_names_dict.get(assumption_name)
                for product in add_rows:
                    tax_type = 'LOCAL' if product == 'COMBINED' else 'STATE'
                    phd_table.append([*props, tax_type, product, None, assumption_name, 0, 0])
                continue

            valid_model = True
            can_be_referenced = True

            assumption_name = update_assumption_name_if_appropriate(assumption_name, unreferenced_model_names)

            for phase in ['gas', 'oil', 'ngl', 'drip_condensate']:
                # loop through all phase
                dollar_unit = 'dollar_per_bbl' if phase != 'gas' else 'dollar_per_mcf'
                phase_econ = assumption['severance_tax'][phase]
                can_be_referenced = convert_phase_econ_to_phdwin_rows(phase_econ, mod_table, phd_table, props,
                                                                      dollar_unit, phase, assumption_name,
                                                                      well_date_dict, use_asof_reference)
                valid_model = valid_model and can_be_referenced

            adval_econ = assumption['ad_valorem_tax']
            can_be_referenced = convert_phase_econ_to_phdwin_rows(adval_econ, mod_table, phd_table, props,
                                                                  'dollar_per_boe', None, assumption_name,
                                                                  well_date_dict, use_asof_reference)
            valid_model = valid_model and can_be_referenced

            update_tax_reference_collections(assumption_name, valid_model, phd_table, referenced_model_names_dict,
                                             unreferenced_model_names)
        except Exception:
            error_log.log_error(well_name=well_name,
                                chosen_id=chosen_id,
                                assumption='Production Taxes',
                                name=assumption_name)

    phd_table = pd.DataFrame(phd_table, columns=PHD_TAX_COLUMNS)
    mod_table = pd.DataFrame(mod_table, columns=MOD_TAX_COLUMNS)

    return mod_table, phd_table


def convert_phase_econ_to_phdwin_rows(econ, mod_table, phd_table, props, value_unit, phase, name, well_date_dict,
                                      use_asof_reference):
    rows = econ.get('rows')
    can_be_referenced = True
    if len(rows) > 0:
        if any(key in RECOGNIZED_CC_PHDWIN_TAX_CRITERIA for key in rows[0]):
            # get the criteria used by this category
            criteria = next(key for key in rows[0] if key in RECOGNIZED_CC_PHDWIN_TAX_CRITERIA)

            if criteria == 'offset_to_as_of_date' and not use_asof_reference:
                can_be_referenced = False

            unit = get_unit_from_rows(rows)
            pct_values = []
            dollar_values = []
            for row in rows:
                if 'pct_of_revenue' in row:
                    pct_values.append(row['pct_of_revenue'])
                else:
                    pct_values.append(0)
                if value_unit in row:
                    dollar_values.append(row[value_unit])
                else:
                    dollar_values.append(0)

            # convert all offsets to date
            if 'offset_to' in criteria:
                rows = convert_offset_rows_to_date(rows, criteria, unit, well_date_dict)
            elif criteria == 'entire_well_life':
                rows = convert_flat_criteria_to_date(rows, unit, well_date_dict)

            can_be_referenced = can_be_referenced and (criteria in CC_CRITERIA_TO_PHDWIN_CRITERIA_DICT
                                                       or criteria in ['dates', 'entire_well_life'])

            phase_unit = 'mcf' if phase == 'gas' else 'bbl'
            tax_state, tax_county = '*', "*"
            use_wi = 'yes' if econ.get('calculation') == 'wi' else None
            product_name = get_tax_product_key(phase)
            tax_type = 'STATE' if phase is not None else 'LOCAL'
            segment = 1
            for pct_value, dollar_value in zip(pct_values, dollar_values):
                date_ref = get_model_date_reference(rows, segment - 1, criteria)
                mod_table.append([
                    tax_type, product_name, name, None, date_ref, segment, tax_state, tax_county, '$', phase_unit,
                    'unit', None, 'yes', use_wi, dollar_value, pct_value
                ])
                segment += 1
            phd_table.append([*props, tax_type, product_name, None, name, 0, 0])

    return can_be_referenced


def update_tax_reference_collections(name, valid_model, phd_table, referenced_model_names_dict,
                                     unreferenced_model_names):
    if valid_model:
        new_phd_rows = []
        for row in phd_table[::-1]:
            if row[-3] == name:
                new_phd_rows.insert(0, row[-5])
            else:
                break
        referenced_model_names_dict[name] = new_phd_rows
    else:
        unreferenced_model_names.append(name)


def get_tax_product_key(phase):
    if phase is None:
        return 'COMBINED'
    elif phase == 'drip_condensate':
        return 'CONDENSATE'
    else:
        return phase.upper()
