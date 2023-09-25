from copy import deepcopy

from combocurve.science.network_module.nodes.node_models.stream_nodes.stream_shared_node import StreamSharedNode
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.helper import (apply_time_series_allocation,
                                                                   sum_stream_date_and_value_for_more)
from combocurve.science.network_module.nodes.shared.type_hints import Stream, Edge, EdgeDataMap
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager


class OilTank(StreamSharedNode):
    node_type = 'oil_tank'

    def __init__(self, node_id, params):
        super().__init__(node_id, params)
        self.fluid_model_id = fluid_model_manager.get_fluid_model_id(self.params['output_gas_fluid_model'])

    # example of generate more than 1 output key
    def generate_output_stream(self, edge: Edge, input_stream: Stream, well_info: dict):
        ret = deepcopy(input_stream)
        date_dict = well_info['date_dict']
        if edge['by'] == 'gas':
            ret['value'] = apply_time_series_allocation(input_stream['date'],
                                                        input_stream['value'] * self.params['oil_to_gas_ratio'],
                                                        edge['params'], date_dict)
        elif edge['by'] == 'oil':
            ret['value'] = apply_time_series_allocation(input_stream['date'], input_stream['value'], edge['params'],
                                                        date_dict)
        ## TODO: rename this field
        if self.params['output_gas_fluid_model']:
            fluid_model = self.params['output_gas_fluid_model']['econ_function']
        else:
            fluid_model = NetworkDefaults.fluid_model
        ret['fluid_model'] = fluid_model[edge['by']]['composition']
        return ret

    def calculate_output_edges_and_emission(self, input_edges, output_edges, edge_data_map, network_nodes_map,
                                            well_info) -> EdgeDataMap:
        oil_input_edge_ids = [edge['id'] for edge in input_edges if edge['by'] == 'oil']
        oil_input_datas = [
            edge_data_map.get(edge_id) for edge_id in oil_input_edge_ids if edge_data_map.get(edge_id) is not None
        ]
        if len(oil_input_datas) == 0:
            return {}

        total_oil_per_fluid = fluid_model_manager.sum_input_for_the_same_port(oil_input_datas)
        total_oil = sum_stream_date_and_value_for_more(
            [date_and_value for date_and_value in total_oil_per_fluid.values()])

        output_edge_data: EdgeDataMap = {}

        date_arr = total_oil['date']
        total_oil_value_arr = total_oil['value']
        for output_edge in output_edges:
            if output_edge['by'] == 'gas':
                values = self.params['oil_to_gas_ratio'] * total_oil_value_arr
            elif output_edge['by'] == 'oil':
                values = total_oil_value_arr
            else:
                raise Exception('not a valid edge')

            output_edge_data[output_edge['id']] = {
                self.fluid_model_id: {
                    'value': apply_time_series_allocation(date_arr, values, output_edge['params'],
                                                          well_info['date_dict']),
                    'date': date_arr
                }
            }
        return output_edge_data
