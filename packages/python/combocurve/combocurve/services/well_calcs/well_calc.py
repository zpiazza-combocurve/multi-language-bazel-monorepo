import numpy as np
import pandas as pd
from combocurve.services.well_calcs.unitconversion import UnitConversion
from combocurve.services.well_calcs.well_calc_setting import current_unit, target_unit, written_fields
from combocurve.services.data_import.import_service import ImportService
from combocurve.services.data_import.import_data import DataSettings
from combocurve.shared.date import datetime_from_index


def _get_boe_gor_mmcfge(input_dict, prefix):
    calcs = {}
    calcs[prefix + '_boe'] = input_dict[prefix + '_gas'] / 6 + input_dict[prefix + '_oil']

    if input_dict[prefix + '_oil'] == 0:
        calcs[prefix + '_gor'] = None
    else:
        calcs[prefix + '_gor'] = input_dict[prefix + '_gas'] / input_dict[prefix + '_oil']

    calcs[prefix + "_mmcfge"] = (input_dict[prefix + '_gas'] + input_dict[prefix + '_oil'] * 6) / 1000
    return calcs


def well_calc(input_item):
    production_data = input_item['production_data']
    headers = input_item['headers']
    production_df = pd.DataFrame({
        'index': np.array(production_data['index'], dtype=int),
        'oil': np.array(production_data['oil'], dtype=float),
        'gas': np.array(production_data['gas'], dtype=float),
        'water': np.array(production_data['water'], dtype=float)
    })

    calcs = {}

    # get cum
    for phase in ['oil', 'gas', 'water']:
        calcs['cum_' + phase] = np.nansum(production_df[phase])

    calcs.update(_get_boe_gor_mmcfge(calcs, 'cum'))
    # get first
    for first in [6, 12]:
        this_prefix = 'first_{}'.format(first)
        for phase in ['oil', 'gas', 'water']:
            calcs[this_prefix + '_' + phase] = np.nansum(production_df[phase].iloc[:first])

        calcs.update(_get_boe_gor_mmcfge(calcs, this_prefix))

    # get last 12 months
    for phase in ['oil', 'gas', 'water']:
        calcs['last_12_' + phase] = np.nansum(production_df[phase].iloc[(-12):])

    calcs.update(_get_boe_gor_mmcfge(calcs, 'last_12'))

    # get last month
    for phase in ['oil', 'gas', 'water']:
        calcs['last_month_' + phase] = np.nansum(production_df[phase].iloc[(-1):])

    calcs.update(_get_boe_gor_mmcfge(calcs, 'last_month'))

    # get per perforated_interval
    if headers['perf_lateral_length'] is None or headers['perf_lateral_length'] == 0:
        for item in ['cum', 'first_6', 'first_12', 'last_12', 'last_month']:
            for phase in ['oil', 'gas', 'water', 'boe', 'gor', 'mmcfge']:
                this_prefix = item + '_' + phase
                calcs[this_prefix + '_per_perforated_interval'] = None
    else:
        for item in ['cum', 'first_6', 'first_12', 'last_12', 'last_month']:
            for phase in ['oil', 'gas', 'water', 'boe', 'gor', 'mmcfge']:
                this_prefix = item + '_' + phase

                calcs[this_prefix
                      + '_per_perforated_interval'] = calcs[this_prefix] / headers['perf_lateral_length'] if calcs[
                          this_prefix] is not None else None

    ret = {}

    # get Months produced (count of prod months)
    months_produced = np.nansum(
        np.nansum([production_df['oil'], production_df['gas'], production_df['water']], axis=0) > 0)
    ret['month_produced'] = int(months_produced)

    unit_convertor = UnitConversion()
    for field in written_fields:
        orig_num = calcs[field]
        if orig_num is None:
            target_num = None
        else:
            target_num = unit_convertor.convert(orig_num, current_unit[field], target_unit[field])
        ret[field] = target_num

    return ret


def data_import_well_calc(daily_production, monthly_production, headers):
    """
    takes in the daily and monthly_production as well as well headers and
    returns a dictionary of the following:

    - For both daily and month production...
        - Boolean for whether or not it has the data for the frequency.
        - If data exists for frequency then get start and end data production
          dates.
    - Lat/Long cordinates for well (surface, heel, and toe).

    """

    daily_index = daily_production.get("index", [])
    monthly_index = monthly_production.get("index", [])
    result = {}

    for freq_name, freq_index in [("monthly", monthly_index), ("daily", daily_index)]:
        has_data = len(freq_index) > 0
        result[f"has_{freq_name}"] = has_data
        result[f"first_prod_date_{freq_name}_calc"] = datetime_from_index(freq_index[0]) if has_data else None
        result[f"last_prod_date_{freq_name}"] = datetime_from_index(freq_index[-1]) if has_data else None

    coordinates = ImportService.get_coordinates(headers, DataSettings(headers.get('dataSource'),
                                                                      headers.get('project')))
    result.update(coordinates)
    return result
