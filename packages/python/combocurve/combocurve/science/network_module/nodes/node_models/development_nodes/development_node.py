from combocurve.science.network_module.default_network_assumptions import EmissionFactorDefaults
from combocurve.science.network_module.nodes.node_models.development_nodes.development_helper import (
    get_month_map, expand_ghg_data_dict_to_list, choose_start_date_window_params)

_MIN_DATE_IDX = -100000


class DevelopmentSharedNode:
    def __init__(self, node_id, params):
        self.id = node_id
        self.params = params

    def _row_development_emission(self, row_params, well_id_str: str, date_dict, schedule_dates, header_dates):
        """Calculates combustion emissions from drilling or completion
        TODO: update documentation here

        Requires starting and ending references relative to well (i.e. FPD)
        Does not require time series data from well

        Arguments:
            well_id (str): well id to reference param data from self.params

        Requires:
            params:
                fuel_type (str): type of fuel used, which determines which emission factors to use
                consumption_rate (num): volume of fuel used per day
                start_criteria (str): date to reference (default 'duration' but could be 'FPD' or date from schedule)
                start_value (num): number of days in relation to start_criteria to start time series
                end_criteria (str): date to reference (default 'duration' but could be 'FPD' or date from schedule)
                end_value (num): number of days in relation to end_criteria to end time series

        Returns:
            combustion_data (list): List of rows that match output of network.calculate_one_well
                'well_id_str',
                'node_id',
                'node_type',
                'emission_type',
                'product',
                'value',
                'date'
        """

        fuel_type = self.params['time_series']['fuel_type']
        consumption_rate = row_params['consumption_rate']  # fuel unit/day (i.e. gal/D, )
        combustion_data = {'CO2': [], 'C1': [], 'N2O': []}
        fuel_volume_monthly = {'fuel': []}
        if consumption_rate > 0:
            month_map = get_month_map(row_params, date_dict, schedule_dates, header_dates)
            if fuel_type in EmissionFactorDefaults.electricity:
                emission_type = 'electricity'
                emission_factors = EmissionFactorDefaults.electricity[fuel_type]
            else:
                emission_type = 'combustion'
                emission_factors = EmissionFactorDefaults.combustion[fuel_type]
            hhv = emission_factors['hhv']['multiplier']

            for month in month_map:
                fuel_volume_monthly['fuel'] += [{
                    'well_id': well_id_str,
                    'node_id': self.id,
                    'node_type': self.node_type,
                    'emission_type': emission_type,
                    'product_type': 'fuel',
                    'product': fuel_type,
                    'value': float(consumption_rate * month_map[month]),
                    'date': month
                }]
                for ghg in combustion_data:
                    combustion_data[ghg] += [{
                        'well_id':
                        well_id_str,
                        'node_id':
                        self.id,
                        'node_type':
                        self.node_type,
                        'emission_type':
                        emission_type,
                        'product_type':
                        'ghg',
                        'product':
                        ghg,
                        'value':
                        float(consumption_rate * hhv * emission_factors[ghg]['multiplier'] * month_map[month]),
                        'date':
                        month
                    }]

        return expand_ghg_data_dict_to_list({**fuel_volume_monthly, **combustion_data})

    def calculate_development_emission(self, well_id_str: str, well_info: dict):
        time_series = self.params['time_series']
        rows = time_series['rows']

        matched_row_params, schedule_dates, header_dates = choose_start_date_window_params(rows, well_info)

        if matched_row_params is None:
            return []

        return self._row_development_emission(matched_row_params, well_id_str, well_info['date_dict'], schedule_dates,
                                              header_dates)
