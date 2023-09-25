from combocurve.science.network_module.default_network_assumptions import EmissionFactorDefaults
from combocurve.science.network_module.nodes.shared.helper import (yearly_emission_to_monthly_per_well_emission,
                                                                   parse_criteria_dates, get_dates_time_series)
from combocurve.science.network_module.nodes.shared.type_hints import MonthlyFrequencyDatetime64mNDArray, Int32NDArray
from combocurve.shared.econ_tools.econ_model_tools import CriteriaEnum


def calculate_combustion(node_data: dict, well_count_arr: Int32NDArray,
                         date: MonthlyFrequencyDatetime64mNDArray) -> dict:
    """Calculates emissions from combustion engine node.

    Does not require inputs from well

    Arguments:
        node_data: params stored in a node, {'params': {'time_series': {'criteria': str, 'fuel_type': str, 'rows': []}}}
        well_count_arr: number of active wells at each time_stamp for this facility
        date: an array of date that is the same length as well_count_arr
    Returns:
        A time series of per well emission from overall_min_date to overall_max_date
    """
    params = node_data['params']

    time_series = params['time_series']

    criteria = time_series['criteria']
    rows = time_series['rows']
    periods = [_row['period'] for _row in rows]
    consumption_rates = [_row.get('consumption_rate') for _row in rows]

    fuel_type = time_series['fuel_type']

    if fuel_type in EmissionFactorDefaults.electricity:
        # emission_type = 'electricity'
        emission_factors = EmissionFactorDefaults.electricity[fuel_type]
    else:
        # emission_type = 'combustion'
        emission_factors = EmissionFactorDefaults.combustion[fuel_type]
    hhv = emission_factors['hhv']['multiplier']

    if criteria == CriteriaEnum.entire_well_life.name:
        first_consumption_rate = consumption_rates[0]

        yearly_emission = {
            product: first_consumption_rate * hhv * emission_factors[product]['multiplier']
            for product in ['CO2', 'C1', 'N2O']
        }
        # add fuel volumes to output
        yearly_emission[fuel_type] = first_consumption_rate
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)

    if criteria == CriteriaEnum.dates.name:
        np_dates = parse_criteria_dates(periods)

        time_series_consumption_rate = get_dates_time_series(date, np_dates, consumption_rates)
        ## NOTE: yearly emission here is actually a time series with monthly frequency
        yearly_emission = {
            product: time_series_consumption_rate * hhv * emission_factors[product]['multiplier']
            for product in ['CO2', 'C1', 'N2O']
        }
        # add fuel volumes to output
        yearly_emission[fuel_type] = time_series_consumption_rate
        return yearly_emission_to_monthly_per_well_emission(yearly_emission, well_count_arr)

    return {}
