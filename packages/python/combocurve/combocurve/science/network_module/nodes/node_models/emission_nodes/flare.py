import numpy as np
from collections import defaultdict

from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager
from combocurve.science.network_module.nodes.node_models.emission_nodes.emission_shared_node import EmissionSharedNode
from combocurve.science.network_module.ghg_units import flare_dict, carbon_number_dict


class Flare(EmissionSharedNode):
    node_type = 'flare'
    emission_type = 'flare'
    multiplier = 1

    def calculate_emission(self, value_arr, fluid_model_id):
        ## Note: this input is called output_stream, but it's the output stream of previous node not the flare node
        ## overwrite the default emission calculation in flare
        ## this function will not be called inside Flare node, because once a node is connected to flare,
        # we want to assign emission to the incoming node
        pct_flare_efficiency = self.params['pct_flare_efficiency'] / 100
        pct_flare_unlit = self.params['pct_flare_unlit'] / 100
        fuel_hhv = self.params['fuel_hhv']
        # convert fuel_hhv from MMBtu/scf (default) to MMBtu/mcf to match gas volumes stored in db
        # TODO use a conversion function
        # fuel_hhv['value'] *= 1000 <- this causes the value to increase with every pass through network
        fluid_model = fluid_model_manager.get_fluid_model(fluid_model_id)
        gas_composition = gas_composition = fluid_model['gas']['composition']

        input_emission_table = defaultdict(lambda: np.zeros(value_arr.shape, dtype=float))
        for key in gas_composition:
            if gas_composition[key]['percentage'] > 0:
                input_emission_table[key] = value_arr * gas_composition[key]['percentage'] / 100

        CO2 = input_emission_table['CO2']
        for key in carbon_number_dict:
            if key in input_emission_table:
                CO2 += pct_flare_efficiency * (1
                                               - pct_flare_unlit) * input_emission_table[key] * carbon_number_dict[key]

        emission_dict = {
            'CO2': CO2,
            'C1': input_emission_table['C1'] * (pct_flare_unlit + (1 - pct_flare_efficiency) * (1 - pct_flare_unlit)),
            'N2O': value_arr * fuel_hhv['value'] * 1000
        }
        return {key: value * flare_dict[key]['multiplier'] for key, value in emission_dict.items()}
