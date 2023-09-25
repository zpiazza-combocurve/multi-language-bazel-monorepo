import numpy as np
import pandas as pd

from combocurve.science.econ.econ_use_forecast.adjust_forecast import adjust_forecast_start
from combocurve.services.cc_to_aries.general_functions import has_forecast, index_to_py_date
from combocurve.services.cc_to_aries.query_helper import ALL_PHASES, get_pct_key_by_phase
from combocurve.services.cc_to_phdwin.helpers import (ALL_CC_UNIT_DEFAULT_VALUE_DICT, convert_flat_criteria_to_date,
                                                      convert_offset_rows_to_date, fill_in_with_default_assumptions,
                                                      get_key_well_properties, get_unit_from_rows,
                                                      update_export_progress)
from combocurve.utils.constants import DAYS_IN_MONTH, DAYS_IN_YEAR

FORECAST_HEADERS = [
    'PHDWIN Id', 'Field', 'Case', 'Well', 'Reservoir', 'Product', 'Units', 'Segment', 'ProjType', 'StartDate', 'BegCum',
    'Qi', 'NFactor', 'Decl', 'DeclMin', 'EndDate', 'Qf', 'Volume', 'EndCum', 'SolveFor'
]

RECOGNIZED_CC_PHDWIN_NGL_CRITERIA = [
    'dates', 'entire_well_life', 'offset_to_fpd', 'offset_to_as_of_date', 'offset_to_first_segment',
    'offset_to_discount_date', 'offset_to_end_history'
]

UNIT_CONVERSION_DICT = {
    "gas/oil": ("GOR", 'Mcf/bbl'),
    "oil/gas": ("Yield", 'bbl/Mcf'),
    "water/gas": ("WGR", 'bbl/Mcf'),
    "water/oil": ("WOR", 'bbl/bbl')
}

beg_cum = 0
end_cum = 0
volume = None
well = None
reservoir = None
# random comment to force redeploy


def create_phdwin_forecast_table(context,
                                 notification_id,
                                 user_id,
                                 date_dict,
                                 well_order_list,
                                 well_data_list,
                                 progress_range,
                                 user_key=None,
                                 error_log=None,
                                 use_asof_reference=False):

    no_wells = len(well_order_list)
    forecast_table = []
    for index, well_order in enumerate(well_order_list):
        try:
            # update progress (make a shared function)
            update_export_progress(context, progress_range, no_wells, index, user_id, notification_id)

            # get well and assumption property
            well_data = well_data_list[well_order]
            forecast_data = well_data['forecast_data']

            assumptions = well_data['assumptions']
            pct_key = well_data['p_series']
            well_header = well_data['well']

            # fill in default assumption if assumption is missing
            fill_in_with_default_assumptions(assumptions)

            assumption = assumptions.get('stream_properties')

            key_well_header_props = get_key_well_properties(well_header, date_dict, user_key)
            (chosen_id, user_chosen_identifier, county, well_name, state, field, well_date_dict) = key_well_header_props

            schedule = well_data.get('schedule')
            if schedule and schedule.get('FPD'):
                forecast_data = adjust_forecast_start(forecast_data, schedule['FPD'])

            if not has_forecast(forecast_data):
                continue

            pct_key = 'P50' if pct_key not in ['P10', 'P50', 'P90', 'best'] else pct_key
            pct_key_by_phase = get_pct_key_by_phase(pct_key, forecast_data)
            last_gas_segment = None
            for phase in ALL_PHASES:
                phase_forecast_data = forecast_data.get(phase)
                if phase_forecast_data is None:
                    continue
                has_ratio = phase_forecast_data.get('forecastType') == 'ratio'

                if has_ratio:
                    segments = phase_forecast_data['ratio']['segments']
                else:
                    pct_key = pct_key_by_phase.get(phase)
                    segments = phase_forecast_data['P_dict'][pct_key]['segments']
                last_gas_segment = segments[-1] if phase == 'gas' else last_gas_segment
                for segment_id, segment in enumerate(segments):
                    start_date, end_date, valid = get_phdwin_forecast_dates(segment)

                    if not valid:
                        continue

                    qi, qf, valid = get_flow_rates(segment, has_ratio)

                    if not valid:
                        continue

                    b, d, decl_min, proj_type = get_phdwin_curve_parameters(segment, has_ratio=has_ratio)

                    product, unit, valid = get_unit_product(phase_forecast_data, phase, has_ratio=has_ratio)

                    if not valid:
                        continue
                    solve_for = 'Qf;Vol' if d >= 0 else 'De;Vol'
                    row = [
                        user_chosen_identifier, field, well_name, well, reservoir, product, unit, segment_id + 1,
                        proj_type, start_date, beg_cum, qi, b, d, decl_min, end_date, qf, volume, end_cum, solve_for
                    ]

                    forecast_table.append(row)

            forecast_table = add_ngl_yield([user_chosen_identifier, field, well_name], forecast_table, assumption,
                                           well_date_dict, last_gas_segment)
        except Exception:
            error_log.log_error(well_name=well_name, chosen_id=chosen_id, assumption='Forecast')

    forecast_df = pd.DataFrame(forecast_table, columns=FORECAST_HEADERS)

    return (forecast_df, )


def add_ngl_yield(props, table, assumption, well_date_dict, end_segment):
    rows = assumption['yields']['ngl']['rows']
    if len(rows) > 0:
        if any(key in RECOGNIZED_CC_PHDWIN_NGL_CRITERIA for key in rows[0]):
            # get the criteria used by this category
            criteria = next(key for key in rows[0] if key in RECOGNIZED_CC_PHDWIN_NGL_CRITERIA)
            unit = get_unit_from_rows(rows)

            default_value = ALL_CC_UNIT_DEFAULT_VALUE_DICT.get(unit, 0)
            # if a flat CC model is used convert it to dates if its value has been change from its default

            if len(rows) == 1 and rows[0][unit] == default_value:
                return table

            # convert all offsets to date
            if 'offset_to' in criteria:
                rows = convert_offset_rows_to_date(rows, criteria, unit, well_date_dict)
            elif criteria == 'entire_well_life':
                rows = convert_flat_criteria_to_date(rows, unit, well_date_dict)

            table = convert_rows_to_forecast_lines(props, table, rows, end_segment)

    return table


def convert_rows_to_forecast_lines(props, table, rows, end_segment):
    unit = 'bbl/MMcf'
    proj_type = 'LinTime'
    product = 'NGL Yield'

    for segment_id, row in enumerate(rows):
        start_date = pd.to_datetime(row['dates']['start_date']).strftime('%m/%d/%Y')
        end_date = get_ngl_end_date(row, end_segment)

        qi = row['yield']
        qf = qi

        b = 0
        d = 0
        decl_min = 0
        solve_for = 'Qf;Vol'
        row = [
            *props, well, reservoir, product, unit, segment_id + 1, proj_type, start_date, beg_cum, qi, b, d, decl_min,
            end_date, qf, volume, end_cum, solve_for
        ]

        table.append(row)

    return table


def get_ngl_end_date(row, end_segment):
    end_date = row['dates']['end_date']
    end_date = None if end_date == 'Econ Limit' else pd.to_datetime(row['dates']['end_date']).strftime('%m/%d/%Y')
    if end_date is None and end_segment is not None:
        end_idx = end_segment.get('end_idx')
        if end_idx is not None:
            end_date = index_to_py_date(end_idx).strftime('%m/%d/%Y')
    return end_date


def get_phdwin_forecast_dates(segment):
    start_idx = segment.get('start_idx')
    if start_idx is None:
        return None, None, False
    start_date = index_to_py_date(start_idx).strftime('%m/%d/%Y')
    end_idx = segment.get('end_idx')
    if end_idx is None:
        return None, None, False
    end_date = index_to_py_date(end_idx).strftime('%m/%d/%Y')
    return start_date, end_date, True


def get_unit_product(phase_forecast, phase, has_ratio=False):
    if has_ratio:
        base_phase = phase_forecast['ratio']['basePhase']

        if base_phase == 'water':
            return None, None, False

        correct_unit = f'{phase}/{base_phase}'
        product, unit = UNIT_CONVERSION_DICT.get(correct_unit)
        return product, unit, True

    unit = 'Mcf' if phase == 'gas' else 'bbl'

    return phase, unit, True


def get_phdwin_curve_parameters(segment, has_ratio=False):
    proj_type = 'Arps'
    b = segment.get('b', 0)
    realized_D_eff_sw = segment.get('realized_D_eff_sw')
    if b != 0 and realized_D_eff_sw is not None:
        decl_min = (1 - np.exp((1 - (1 - realized_D_eff_sw)**-b) / b)) * 100
    else:
        decl_min = None

    if has_ratio and segment.get('name') == 'linear':
        d = segment.get('k', 0)
        d = (-d * DAYS_IN_YEAR**2) / 12
        proj_type = 'LinTime'
    else:
        d = segment.get('D', 0)
        d = (1 - np.exp(-d * DAYS_IN_YEAR)) * 100

    return b, d, decl_min, proj_type


def get_flow_rates(segment, has_ratio):
    qi = segment.get('q_start')
    if qi is None:
        return None, None, False

    if not has_ratio:
        qi *= DAYS_IN_MONTH
    qi = round(qi, 4)

    qf = segment.get('q_end')
    if qf is None:
        return qi, qf, True

    if not has_ratio:
        qf *= DAYS_IN_MONTH
    qf = round(qf, 4)

    return qi, qf, True
