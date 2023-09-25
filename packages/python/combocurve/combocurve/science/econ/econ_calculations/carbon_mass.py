from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.general_functions import adjust_array_zero
import numpy as np


class CarbonMass(EconCalculation):
    def __init__(self, date_dict, carbon_production):
        self.date_dict = date_dict
        self.carbon_production = carbon_production

    def result(self, t_all, ownership_dict_by_phase):
        carbon_mass_dict = self._carbon_adjust_mass(self.carbon_production, self.date_dict, t_all)
        carbon_ownership_mass_dict = self._get_carbon_ownership_mass(carbon_mass_dict, ownership_dict_by_phase)

        return {'carbon_ownership_mass_dict': carbon_ownership_mass_dict}

    def _get_carbon_ownership_mass(self, carbon_mass_dict, ownership_dict):
        ownership = ownership_dict['original']
        return {
            phase: {own: ownership[own] * carbon_mass_dict[phase]
                    for own in ownership}
            for phase in carbon_mass_dict
        }

    def _carbon_adjust_mass(self, carbon_production, date_dict, return_t):
        if carbon_production is None:
            return {
                'co2e': np.zeros(len(return_t)),
                'co2': np.zeros(len(return_t)),
                'ch4': np.zeros(len(return_t)),
                'n2o': np.zeros(len(return_t))
            }

        carbon_t = (carbon_production['dates'] - np.datetime64(date_dict['first_production_date'], 'M')).astype(int)

        carbon_adjust_mass = {}
        for comp in carbon_production:
            if comp == 'dates':
                continue
            carbon_adjust_mass[comp] = adjust_array_zero(carbon_production[comp], carbon_t, return_t)

        return carbon_adjust_mass
