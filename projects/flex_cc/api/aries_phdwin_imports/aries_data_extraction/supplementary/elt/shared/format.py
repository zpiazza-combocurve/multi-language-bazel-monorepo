import pandas as pd

from api.aries_phdwin_imports.combine_rows import get_unit_key_and_clean_row_for_taxes


def get_elt_unit_value(rows):
    unit_key = get_unit_key_and_clean_row_for_taxes(rows)
    if unit_key is not None:
        if len(rows) == 1:
            unit_value = rows[0][unit_key]
        else:
            unit_value = []
            for row in rows:
                unit_value.append(row[unit_key])
        return unit_value, unit_key
    return None, None


def get_elt_period_value(rows, criteria):
    if criteria == 'entire_well_life':
        return 'Flat'
    elif criteria == 'dates':
        if len(rows) == 1:
            return pd.to_datetime(rows[0][criteria]['start_date']).strftime('%m/%Y')
        else:
            return [pd.to_datetime(row[criteria]['start_date']).strftime('%m/%Y') for row in rows]
    elif 'offset_to' in criteria:
        if len(rows) == 1:
            return rows[0][criteria]['period']
        else:
            return [row[criteria]['period'] for row in rows]
    elif 'rate' in criteria:
        if len(rows) == 1:
            return rows[0][criteria]['start']
        else:
            return [row[criteria]['start'] for row in rows]


def clean_reference_doc(reference_doc):
    for row in reference_doc['rows']:
        if 'escalation_model' in row:
            del row['escalation_model']
