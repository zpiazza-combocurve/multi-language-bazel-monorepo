import pandas as pd

from combocurve.services.cc_to_phdwin.helpers import (ALL_CC_UNIT_DEFAULT_VALUE_DICT, GALS_IN_BBL,
                                                      convert_flat_criteria_to_date, convert_offset_rows_to_date,
                                                      fill_in_with_default_assumptions, get_key_well_properties,
                                                      get_model_date_reference, get_truncated_name, get_unit_from_rows,
                                                      update_assumption_name_if_appropriate, update_export_progress)
from combocurve.shared.combine_rows import sum_rows

CC_UNIT_TO_PHDWIN_UNIT = {'dollar_per_bbl': 'bbl', 'dollar_per_mmbtu': 'MMBtu', 'dollar_per_mcf': 'mcf'}

PHDWIN_PRICE_MOD_COLUMNS = [
    'Product Name(Key)', 'Model Name(Key)', 'Model Id(Key)', 'Date(Key)', 'Segment', 'Currency', 'Units', 'Cap Value',
    'Gravity Link', 'Price'
]

PHDWIN_PRICE_PHD_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Type(Key)', 'Product(Key)', 'Date(Key)',
    'Model', 'Price'
]

RECOGNIZED_CC_PHDWIN_PRICE_CRITERIA = ['dates', 'offset_to_as_of_date', 'entire_well_life']


def create_phdwin_pricing_table(  # noqa (C901)
        context,
        notification_id,
        user_id,
        date_dict,
        well_order_list,
        well_data_list,
        progress_range,
        error_log=None,
        user_key=None,
        use_asof_reference=False):
    mod_table = []
    phd_table = []
    truncation_model_name_dict = {}
    referenced_model_names_dict = {}
    unreferenced_model_names = []

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
            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            # get assumption document
            assumption = assumptions.get('pricing')
            # get assumption name
            assumption_name = assumption.get('name')
            if assumption_name is None:
                continue

            assumption_name = get_truncated_name(truncation_model_name_dict, assumption_name)

            # check if a model has already been created and can be referenced immediately
            if assumption_name in referenced_model_names_dict:
                add_rows = referenced_model_names_dict.get(assumption_name)
                for product in add_rows:
                    phd_table.append([
                        well_name, state, county, field, None, user_chosen_identifier, 'Price', product, None,
                        assumption_name, 0
                    ])
                continue
            assumption_name = update_assumption_name_if_appropriate(assumption_name, unreferenced_model_names)

            valid_model = True
            can_be_referenced = True
            standard_oil_rows = None
            for phase in ['gas', 'oil', 'ngl', 'drip_condensate']:
                # loop through all phase
                phase_econ = assumption['price_model'][phase]
                rows = phase_econ['rows']
                valid_model = valid_model and can_be_referenced
                if len(rows) > 0:
                    if any(key in RECOGNIZED_CC_PHDWIN_PRICE_CRITERIA for key in rows[0]):
                        # get the criteria used by this category
                        criteria = next(key for key in rows[0] if key in RECOGNIZED_CC_PHDWIN_PRICE_CRITERIA)
                        unit = get_unit_from_rows(rows)

                        default_value = ALL_CC_UNIT_DEFAULT_VALUE_DICT.get(unit, 0)
                        # if a flat CC model is used convert it to dates if its value has been change from its default

                        if len(rows) == 1 and rows[0][unit] == default_value:
                            continue

                        if criteria == 'offset_to_as_of_date' and not use_asof_reference:
                            can_be_referenced = False

                        # convert all offsets to date
                        if 'offset_to' in criteria:
                            rows = convert_offset_rows_to_date(rows, criteria, unit, well_date_dict)
                        elif criteria == 'entire_well_life':
                            rows = convert_flat_criteria_to_date(rows, unit, well_date_dict)
                        standard_oil_rows = rows[:] if phase == 'oil' else standard_oil_rows

                        if unit == 'pct_of_oil_price':
                            start_date = pd.to_datetime(rows[0]['dates']['start_date'])
                            for row in rows:
                                row['price'] = row.pop(unit)
                            if standard_oil_rows is None:
                                continue
                            for oil_row in standard_oil_rows:
                                rows.append(oil_row)
                            rows = sum_rows(rows, risk=True, risk_overlay=True)
                            rows = [row for row in rows if pd.to_datetime(row['dates']['start_date']) >= start_date]
                            unit = 'price'
                        elif unit == 'dollar_per_gal':
                            for row in rows:
                                row[unit] *= GALS_IN_BBL
                        cap = phase_econ.get('cap')

                        mod_rows, phd_row = convert_phase_rows_to_phdwin_lines(
                            [well_name, state, county, field, None, user_chosen_identifier], rows, assumption_name,
                            criteria, unit, phase, cap)

                        mod_table = [*mod_table, *mod_rows]
                        phd_table.append(phd_row)

            if valid_model:
                new_phd_rows = []
                for row in phd_table[::-1]:
                    if row[-2] == assumption_name:
                        new_phd_rows.insert(0, row[-4])
                    else:
                        break
                referenced_model_names_dict[assumption_name] = new_phd_rows
            else:
                unreferenced_model_names.append(assumption_name)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='Pricing', name=assumption_name)

    mod_table = pd.DataFrame(mod_table, columns=PHDWIN_PRICE_MOD_COLUMNS)
    phd_table = pd.DataFrame(phd_table, columns=PHDWIN_PRICE_PHD_COLUMNS)

    return mod_table, phd_table


def convert_phase_rows_to_phdwin_lines(props, rows, assumption_name, criteria, unit, phase, cap):
    mod_rows = []
    phdwin_unit = CC_UNIT_TO_PHDWIN_UNIT.get(unit, 'bbl')
    for idx, row in enumerate(rows):
        date_ref = get_model_date_reference(rows, idx, criteria)

        value = row[unit]
        phase_key = 'CONDENSATE' if phase == 'drip_condensate' else phase.upper()
        mod_rows.append([phase_key, assumption_name, None, date_ref, idx + 1, '$', phdwin_unit, cap, None, value])

    phd_row = [*props, 'Price', phase_key, None, assumption_name, 0]

    return mod_rows, phd_row
