import pandas as pd

from combocurve.services.cc_to_phdwin.helpers import (fill_in_with_default_assumptions, get_btu_value, GALS_IN_BBL,
                                                      get_key_well_properties, get_unit_from_rows,
                                                      update_export_progress)

DIFF_PHD_COLUMNS = [
    'Case Name', 'State', 'County', 'Field', 'Unique Id', 'PHDWIN Id(Key)', 'Diff%[CONDENSATE]', 'Diff%[GAS]',
    'Diff%[NGL]', 'Diff%[OIL]', 'Diff Value[CONDENSATE]', 'Diff Value[GAS]', 'Diff Value[NGL]', 'Diff Value[OIL]'
]


def create_phdwin_differential_table(context,
                                     notification_id,
                                     user_id,
                                     date_dict,
                                     well_order_list,
                                     well_data_list,
                                     progress_range,
                                     error_log=None,
                                     user_key=None,
                                     use_asof_reference=False):
    phd_table = []
    no_wells = len(well_order_list)
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]

            assumptions = well_data['assumptions']

            well_header = well_data['well']

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            btu_value = get_btu_value(assumptions)
            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)

            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            assumption = assumptions.get('differentials')
            assumption_name = assumption.get('name')

            if assumption_name is None:
                continue

            diff_value_by_phase = {
                'oil': {
                    '$': None,
                    '%': None
                },
                'gas': {
                    '$': None,
                    '%': None
                },
                'ngl': {
                    '$': None,
                    '%': None
                },
                'drip_condensate': {
                    '$': None,
                    '%': None
                },
            }

            for i in range(1, 4):
                differential_type = f'differentials_{i}'
                differential_econ = assumption['differentials'][differential_type]
                for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                    phase_differentials = differential_econ[phase]
                    rows = phase_differentials['rows']
                    unit = get_unit_from_rows(rows)
                    default_value = 100 if unit == 'pct_of_base_price' else 0

                    if len(rows) == 1 and rows[0][unit] == default_value:
                        continue
                    add_value_to_differential_dict(diff_value_by_phase, rows[-1], phase, unit, btu_value=btu_value)

            for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                if diff_value_by_phase[phase]['%'] is not None:
                    diff_value_by_phase[phase]['%'] = (diff_value_by_phase[phase]['%'] - 1) * 100
            values = [
                diff_value_by_phase.get('drip_condensate', {}).get('%'),
                diff_value_by_phase.get('gas', {}).get('%'),
                diff_value_by_phase.get('ngl', {}).get('%'),
                diff_value_by_phase.get('oil', {}).get('%'),
                diff_value_by_phase.get('drip_condensate', {}).get('$'),
                diff_value_by_phase.get('gas', {}).get('$'),
                diff_value_by_phase.get('ngl', {}).get('$'),
                diff_value_by_phase.get('oil', {}).get('$')
            ]
            if all(value is None for value in values):
                continue
            phd_table.append([well_name, state, county, field, None, user_chosen_identifier, *values])
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='Differentials')

    phd_table = pd.DataFrame(phd_table, columns=DIFF_PHD_COLUMNS)

    return (phd_table, )


def add_value_to_differential_dict(diff_value_by_phase, row, phase, unit, btu_value=1):
    if unit == 'pct_of_base_price':
        value = row[unit] / 100
        if diff_value_by_phase[phase]['%'] is None:
            diff_value_by_phase[phase]['%'] = value
        else:
            if diff_value_by_phase[phase]['%'] == 0:
                diff_value_by_phase[phase]['%'] = value
            else:
                diff_value_by_phase[phase]['%'] *= value
    elif unit == 'dollar_per_mmbtu':
        value = row[unit] / btu_value
        if diff_value_by_phase[phase]['$'] is None:
            diff_value_by_phase[phase]['$'] = value
        else:
            diff_value_by_phase[phase]['$'] += value
    elif unit == 'dollar_per_gal':
        value = row[unit] / GALS_IN_BBL
        if diff_value_by_phase[phase]['$'] is None:
            diff_value_by_phase[phase]['$'] = value
        else:
            diff_value_by_phase[phase]['$'] += value
    else:
        value = row[unit]
        if diff_value_by_phase[phase]['$'] is None:
            diff_value_by_phase[phase]['$'] = value
        else:
            diff_value_by_phase[phase]['$'] += value
