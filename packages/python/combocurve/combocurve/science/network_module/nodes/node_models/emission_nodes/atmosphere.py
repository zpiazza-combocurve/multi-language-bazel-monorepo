from combocurve.science.network_module.ghg_units import density_dict
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager
from combocurve.science.network_module.nodes.node_models.emission_nodes.emission_shared_node import EmissionSharedNode


class Atmosphere(EmissionSharedNode):
    node_type = 'atmosphere'
    multiplier = 1
    emission_type = 'vented'

    def calculate_emission(self, value_arr, fluid_model_id):
        fluid_model = fluid_model_manager.get_fluid_model(fluid_model_id)
        gas_composition = fluid_model['gas']['composition']

        return {
            emission_product: self.multiplier * value_arr * gas_composition[emission_product]['percentage'] / 100
            * density_dict[emission_product]['multiplier']
            for emission_product in density_dict if gas_composition[emission_product]['percentage'] > 0
        }
