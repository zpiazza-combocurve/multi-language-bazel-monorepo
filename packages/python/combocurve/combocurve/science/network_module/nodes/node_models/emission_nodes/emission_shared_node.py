from typing import List
from combocurve.science.network_module.nodes.shared.type_hints import (Edge, EdgeDataMap, StreamDataPerFluidModel)


class EmissionSharedNode:
    multiplier = 1

    def __init__(self, node_id, params):
        self.id = node_id
        self.params = params

    def generate_final_emission_data(self, well_data: dict, well_info: dict, facility_id: str = None) -> list:
        ## emission is stored at previous nodes
        return []

    def calculate_output_edges_and_emission(self, input_edges: List[Edge], output_edges: List[Edge],
                                            edge_data_map: EdgeDataMap, network_nodes_map: dict,
                                            well_info: dict) -> EdgeDataMap:

        for input_edge in input_edges:
            input_node_id = input_edge['from']
            input_edge_id = input_edge['id']

            input_node = network_nodes_map[input_node_id]
            input_edge_data: StreamDataPerFluidModel = edge_data_map.get(input_edge_id)

            if input_edge_data is not None:
                self._add_emission_from_input_edge_to_input_node(input_node, input_edge, input_edge_data, well_info)

        return {}

    def _add_emission_from_input_edge_to_input_node(self, input_node: object, input_edge: Edge,
                                                    input_edge_data: StreamDataPerFluidModel, well_info: dict) -> None:
        '''
        Add emission to input node.
        Process through all fluid models in a input_edge data, calculate emission and add to input node

        Args:
            input_node: the node input_edge connects from
            input_edge: input edge
            input_edge_data: the per fluid data stored for this input edge
            well_info: well information

        Returns:
            None
        '''

        input_port = input_edge['fromHandle']
        if input_node.node_type == 'facility':
            input_node, input_port = input_node.get_output_node_and_port(input_edge)

        well_id = well_info['well_id']
        product_key = input_node.get_storage_key(well_id, self.emission_type, 'product', input_edge['by'], input_port)
        for fluid_model_id, fluid_model_value in input_edge_data.items():
            this_date_arr = fluid_model_value['date']
            this_value_arr = fluid_model_value['value']

            input_node.add_to_local_storage_new(product_key, {
                'date': this_date_arr,
                'value': self.multiplier * this_value_arr
            })

            this_emission = self.calculate_emission(this_value_arr, fluid_model_id)
            for emission_product, emission_product_value in this_emission.items():
                storage_key = input_node.get_storage_key(well_id, self.emission_type, 'ghg', emission_product,
                                                         input_port)

                input_node.add_to_local_storage_new(storage_key, {
                    'date': this_date_arr,
                    'value': emission_product_value
                })
