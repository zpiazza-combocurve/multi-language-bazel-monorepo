import pandas as pd

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.science.econ.econ_use_forecast.adjust_forecast import adjust_forecast_start
from combocurve.science.econ.econ_use_forecast.use_forecast import (get_fpd_from_source, WellHeaderError)
from combocurve.services.cc_to_aries.construct_ac_economic import DEFAULT_FPD
from combocurve.services.cc_to_aries.query_helper import (get_end_of_historic_production, get_fsg, get_main_phase,
                                                          get_pct_key_by_phase, process_dates_setting)
from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.constants import DAYS_IN_MONTH, USER_NOTIFICATION_UPDATE_EVENT_NAME

ALL_CC_UNIT_DEFAULT_VALUE_DICT = {
    'unit_cost': 0,
    'fixed_expense': 0,
    'yield': 0,
    'price': 0,
    'pct_per_year': 0,
    'pct_of_revenue': 0,
    'dollar_per_year': 0,
    'dollar_per_boe': 0,
    'dollar_per_bbl': 0,
    'dollar_per_mcf': 0,
    'dollar_per_gal': 0,
    'dollar_per_mmbtu': 0,
    'pct_of_oil_price': 100,
    'pct_of_oil_rev': 0,
    'pct_of_gas_rev': 0,
    'pct_of_ngl_rev': 0,
    'pct_remaining': 100,
    'multiplier': 100,
    'pct_remaining': 100,
    'pct_of_base_price': 100,
    'dollar_per_month': 0
}

CC_CRITERIA_TO_PHDWIN_CRITERIA_DICT = {
    'offset_to_as_of_date': 'AsOf',
    'offset_to_fpd': 'FirstProd',
    'offset_to_first_segment': 'MajSeg1',
    'offset_to_end_history': 'EndHist',
}

GALS_IN_BBL = 42
DEFAULT_BASE_LENGTH_FOR_MODEL = 18
EXPORT_DECIMAL_LIMIT = 4


def round_to_limit(value):
    try:
        value = round(float(value), EXPORT_DECIMAL_LIMIT)
    except (ValueError, TypeError):
        value = 0
    return value


def get_model_date_reference(rows, idx, criteria, shrink=False):
    first_start_date = pd.to_datetime(rows[0]['dates']['start_date'])
    date_ref = None
    match_offset = 'offset_to_as_of_date' if shrink else 'offset_to'
    if match_offset in criteria:
        date_ref = CC_CRITERIA_TO_PHDWIN_CRITERIA_DICT.get(criteria)
        if date_ref is None:
            date_ref = pd.to_datetime(rows[idx]['dates']['start_date']).strftime('%m/%Y')
        else:
            if idx != 0:
                period = int(
                    round((pd.to_datetime(rows[idx]['dates']['start_date']) - first_start_date).days / DAYS_IN_MONTH))
                date_ref = f'{date_ref}+{period}'

    else:
        date_ref = pd.to_datetime(rows[idx]['dates']['start_date']).strftime('%m/%Y')

    return date_ref


def update_assumption_name_if_appropriate(assumption_name, unreferenced_model_names):
    max_index = 0
    has_base = False
    for item in unreferenced_model_names:
        has_base = item == assumption_name
        name_details = item.rsplit('_', 1)
        if len(name_details) == 2:
            name, index = name_details
            try:
                index = int(float(index))
            except ValueError:
                index = None
            if index is not None and name == assumption_name and index > max_index:
                max_index = index
    if max_index > 0 or has_base:
        assumption_name = f'{assumption_name}_{max_index+1}'

    return assumption_name


def get_truncated_name(truncation_model_name_dict, assumption_name, max_length=DEFAULT_BASE_LENGTH_FOR_MODEL):
    if assumption_name in truncation_model_name_dict:
        use_assumption_name = truncation_model_name_dict.get(assumption_name)
    else:
        trunc_assumption_name = "-".join(str(assumption_name).split()).upper()[:max_length]
        use_assumption_name = update_truncation_model_dict(trunc_assumption_name, assumption_name,
                                                           truncation_model_name_dict)

    return use_assumption_name


def update_truncation_model_dict(name, full_name, model_name_dict):
    max_idx = 0
    for value in model_name_dict.values():
        trunc_name, current_idx = str(value).rsplit('_T', 1)
        current_idx = int(float(current_idx))
        if trunc_name == name and current_idx > max_idx:
            max_idx = current_idx
    max_idx += 1
    new_name = f'{name}_T{max_idx}'
    model_name_dict[full_name] = new_name
    return new_name


def convert_flat_criteria_to_date(rows, unit, date_dict):
    asof_date = date_dict.get('offset_to_as_of_date')
    value = rows[0][unit]
    return [{'dates': {'start_date': asof_date, 'end_date': 'Econ Limit'}, unit: value}]


def convert_offset_rows_to_date(rows, criteria, unit, date_dict):
    start_date = date_dict.get(criteria)
    if start_date is None:
        return []
    start_date = pd.to_datetime(start_date).strftime('%Y-%m-%d')
    new_rows = []
    for idx, row in enumerate(rows):
        if idx < len(rows) - 1:
            period = row[criteria]['end'] - row[criteria]['start'] + 1
            end_date = (pd.to_datetime(start_date) + pd.DateOffset(months=period, days=-1)).strftime('%Y-%m-%d')
        else:
            end_date = 'Econ Limit'
        new_rows.append({'dates': {'start_date': start_date, 'end_date': end_date}, unit: row[unit]})
        if end_date != 'Econ Limit':
            start_date = (pd.to_datetime(end_date) + pd.DateOffset(days=1)).strftime('%Y-%m-%d')

    return new_rows


def get_btu_value(assumptions):
    stream_prop = assumptions.get('stream_properties')
    shrunk_gas_btu = stream_prop['btu_content']['shrunk_gas'] / 1000
    unshrunk_gas_btu = stream_prop['btu_content']['unshrunk_gas'] / 1000
    btu = shrunk_gas_btu if shrunk_gas_btu != 1 else unshrunk_gas_btu

    return btu


def get_unit_from_rows(rows):
    unit = None
    if len(rows) > 0:
        row = rows[0]
        for key in row:
            if key in ALL_CC_UNIT_DEFAULT_VALUE_DICT:
                unit = key
                break
    return unit


def get_key_well_properties(well_header, date_dict, key):
    chosen_id = well_header.get('inptID')
    user_chosen_identifier = well_header.get(key)
    county = well_header.get('county')
    well_name = well_header.get('well_name')
    state = well_header.get('state')
    field = well_header.get('field')
    well_date_dict = date_dict.get(chosen_id, {})
    return (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict)


def update_export_progress(context, progress_range, no_wells, index, user_id, notification_id):
    current_progress = ((progress_range[1] - progress_range[0]) / no_wells * index) + progress_range[0]
    context.pusher.trigger_user_channel(context.subdomain, user_id, USER_NOTIFICATION_UPDATE_EVENT_NAME, {
        '_id': notification_id,
        'progress': current_progress
    })


def fill_in_with_default_assumptions(assumptions):
    for key in ASSUMPTION_FIELDS:
        if key not in assumptions:
            default_assumption = get_default(key)
            if default_assumption is not None:
                assumptions[key] = default_assumption


def get_date_dict(well_data_list, well_order_list, error_log):
    by_well_date_dict = {}
    previous_asof = None
    use_asof_reference = True

    for well_order in well_order_list:
        well_data = well_data_list[well_order]

        assumptions = well_data['assumptions']
        fill_in_with_default_assumptions(assumptions)
        assumption_name = assumptions.get('dates').get('name')

        if assumption_name is None:
            error_log.log_error(well_name=well_data['well'].get('well_name'),
                                chosen_id=well_data['well'].get('inptID'),
                                assumption='Dates')

        pct_key = well_data['p_series']
        well_header = well_data['well']
        forecast_data = well_data['forecast_data']
        production_data = well_data['production_data']
        schedule = well_data.get('schedule')
        chosen_id = well_header.get('inptID')

        if not production_data:
            production_data = {'oil': None, 'gas': None, 'water': None}

        if schedule and schedule.get('FPD'):
            forecast_data = adjust_forecast_start(forecast_data, schedule['FPD'])

        pct_key = 'P50' if pct_key not in ['P10', 'P50', 'P90', 'best'] else pct_key
        pct_key_by_phase = get_pct_key_by_phase(pct_key, forecast_data)

        dates_setting = assumptions.get('dates').get('dates_setting')

        main_phase = get_main_phase(forecast_data, well_header, pct_key_by_phase)

        ## real_fpd
        try:
            real_fpd, _ = get_fpd_from_source(dates_setting, well_header, production_data, forecast_data,
                                              pct_key_by_phase)
        except WellHeaderError:
            real_fpd = DEFAULT_FPD

        ## fsg
        fsd = get_fsg(forecast_data, main_phase, real_fpd, pct_key_by_phase)

        ##
        as_of_date, discount_date, _ = process_dates_setting(dates_setting, real_fpd, fsd)

        if previous_asof is not None and use_asof_reference and previous_asof != as_of_date:
            use_asof_reference = False
        previous_asof = as_of_date

        # will be update in subsequent function
        eoh_date = get_end_of_historic_production(as_of_date, main_phase, production_data)

        date_dict = {
            'offset_to_fpd': real_fpd.replace(day=1).strftime('%Y-%m-%d'),
            'offset_to_as_of_date': as_of_date.replace(day=1).strftime('%Y-%m-%d'),
            'offset_to_first_segment': fsd.replace(day=1).strftime('%Y-%m-%d'),
            'offset_to_end_history': eoh_date.replace(day=1).strftime('%Y-%m-%d'),
            'offset_to_discount_date': discount_date.replace(day=1).strftime('%Y-%m-%d')
        }

        by_well_date_dict[chosen_id] = date_dict

    return by_well_date_dict, use_asof_reference
