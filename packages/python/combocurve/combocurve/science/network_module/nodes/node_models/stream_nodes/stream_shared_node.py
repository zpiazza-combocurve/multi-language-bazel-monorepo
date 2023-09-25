from combocurve.science.network_module.nodes.shared.shared_node import SharedNode
from combocurve.science.network_module.nodes.shared.helper import apply_time_series_allocation
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager
from combocurve.science.network_module.nodes.shared.type_hints import EdgeDataMap, Edge


class StreamSharedNode(SharedNode):
    def __init__(self, node_id, params):
        super().__init__(node_id, params)
        self.fluid_model = False
        if self.params and self.params.get('fluid_model', None):
            self.fluid_model = self.params['fluid_model']['econ_function']

    def calculate_output_edges_and_emission(self, input_edges: list[Edge], output_edges: list[Edge],
                                            edge_data_map: EdgeDataMap, network_nodes_map: dict,
                                            well_info: dict) -> EdgeDataMap:
        gas_input_edge_ids = [edge['id'] for edge in input_edges if edge['by'] == 'gas']
        gas_input_datas = [
            edge_data_map.get(edge_id) for edge_id in gas_input_edge_ids if edge_data_map.get(edge_id) is not None
        ]

        if len(gas_input_datas) == 0:
            return {}

        total_gas_per_fluid = fluid_model_manager.sum_input_for_the_same_port(gas_input_datas)

        output_edge_data: EdgeDataMap = {}

        for output_edge in output_edges:
            output_edge_data[output_edge['id']] = {
                fluid_model_key: {
                    'value':
                    apply_time_series_allocation(fluid_model_value['date'], fluid_model_value['value'],
                                                 output_edge['params'], well_info['date_dict']),
                    'date':
                    fluid_model_value['date']
                }
                for fluid_model_key, fluid_model_value in total_gas_per_fluid.items()
            }
        return output_edge_data
