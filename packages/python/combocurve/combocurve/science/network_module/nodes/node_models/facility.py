import numpy as np
from collections import defaultdict
from typing import List

from combocurve.science.network_module.nodes.shared.helper import (generate_edges_by_from, generate_edges_by_to,
                                                                   sort_network_nodes)
from combocurve.science.network_module.nodes.node_class_map import NODE_CLASS_MAP
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager

from combocurve.science.network_module.nodes.shared.type_hints import Edge, BaseNode, EdgeDataMap

## The following function is a HACK, remove it we make sure using uuid in network/facility
from copy import deepcopy


def update_params_make_node_and_edge_id_unique_in_facility(facility_id, params) -> dict:
    copied_params = deepcopy(params)
    for node in copied_params['nodes']:
        node['id'] = f'{facility_id}_{node["id"]}'

    for edge in copied_params['edges']:
        edge['id'] = f'{facility_id}_{edge["id"]}'
        edge['from'] = f'{facility_id}_{edge["from"]}'
        edge['to'] = f'{facility_id}_{edge["to"]}'

    for input_edge in copied_params['inputs']:
        input_edge['to'] = f'{facility_id}_{input_edge["to"]}'

    for output_edge in copied_params['outputs']:
        output_edge['from'] = f'{facility_id}_{output_edge["from"]}'

    return copied_params


class Facility:
    node_type = 'facility'

    def __init__(self, node_id: str, params: dict):
        self.id = node_id
        self.params = update_params_make_node_and_edge_id_unique_in_facility(self.id, params)

        node_docs = self.params['nodes']
        self.nodes = []
        self.nodes_map = {}
        for node_doc in node_docs:
            fluid_model_manager.process_node(node_doc)

            if node_doc['type'] in NODE_CLASS_MAP:
                this_node = NODE_CLASS_MAP[node_doc['type']](node_doc['id'], node_doc['params'])
                self.nodes += [this_node]
                self.nodes_map[this_node.id] = this_node

        self.edges = self.params['edges']
        self.edges_map = {edge['id']: edge for edge in self.edges}
        self.edges_by_from = generate_edges_by_from(self.edges)
        self.edges_by_to = generate_edges_by_to(self.edges)
        self.edge_data_map = {}

        self.inputs = self.params['inputs']
        self.input_edges_map = {edge['id']: edge for edge in self.inputs}

        self.outputs = self.params['outputs']
        self.output_edges_map = {edge['id']: edge for edge in self.outputs}

        self.output_node_ids = [output_edge['from'] for output_edge in self.outputs]
        self.output_node_streams = {}

    def _convert_input_edges(self, network_input_edges: List[Edge]):
        """
        update to/toHandle to be the same as facility_input_edge, mimic the behavior of expanding the facility
        NOTE: the converted input edge does not work with self.get_input_node
        """
        converted_input_edges = []
        for network_input_edge in network_input_edges:
            facility_input_edge = self.input_edges_map.get(network_input_edge['toHandle'])
            this_edge = {
                **network_input_edge,
                'to': facility_input_edge['to'],
                'toHandle': facility_input_edge['toHandle'],
            }
            converted_input_edges += [this_edge]

        return converted_input_edges

    def _convert_output_edges(self, network_output_edges: List[Edge]):
        """
        update from/fromHandle to be the same as facility_output_edge, mimic the behavior of expanding the facility
        NOTE: the converted output edge does not work with self.get_output_node
        """
        converted_output_edges = []
        for network_output_edge in network_output_edges:
            facility_output_edge = self.output_edges_map.get(network_output_edge['fromHandle'])
            this_edge = {
                **network_output_edge,
                'from': facility_output_edge['from'],
                'fromHandle': facility_output_edge['fromHandle'],
            }
            converted_output_edges += [this_edge]

        return converted_output_edges

    def _get_input_and_output_nodes(self, input_edges: List[Edge], output_edges: List[Edge],
                                    converted_input_edges: List[Edge], converted_output_edges: List[Edge]):
        converted_input_edges_map = {edge['id']: edge for edge in converted_input_edges}
        converted_output_edges_map = {edge['id']: edge for edge in converted_output_edges}

        input_node_and_input_edges_map = defaultdict(list)
        for input_edge in input_edges:
            input_node_id = self.get_input_node_id(input_edge)
            input_node_and_input_edges_map[input_node_id] += [converted_input_edges_map[input_edge['id']]]

        output_node_and_output_edges_map = defaultdict(list)
        for output_edge in output_edges:
            output_node_id = self.get_output_node_id(output_edge)
            output_node_and_output_edges_map[output_node_id] += [converted_output_edges_map[output_edge['id']]]

        return input_node_and_input_edges_map, output_node_and_output_edges_map

    def calculate_output_edges_and_emission(self, input_edges: List[Edge], output_edges: List[Edge],
                                            network_edge_data_map: EdgeDataMap, network_nodes_map: dict,
                                            well_info: dict) -> EdgeDataMap:
        '''
        Calcualte the output edge data in a facility


        Main idea is to expand facility nodes and edges with external inputs and outputs

        Args:
            input_edges: input edges going into this facility
            output_edges: output_edges leaving from this facility
            network_edge_data_map: the current edge_data_map stored in the network
            network_nodes_map: network nodes, so emission node can be found within this function
            well_info: well information

        Returns:
            output_edge_data: the edge data for the output_edges
        '''
        ## preprocessing
        converted_input_edges, converted_output_edges = self._convert_input_edges(
            input_edges), self._convert_output_edges(output_edges)

        input_node_and_input_edges_map, output_node_and_output_edges_map = self._get_input_and_output_nodes(
            input_edges, output_edges, converted_input_edges, converted_output_edges)

        starting_node_ids = list(np.unique([edge['from'] for edge in converted_input_edges]))
        ##
        sorted_node_ids = sort_network_nodes(starting_node_ids, self.edges + converted_input_edges)

        ##
        output_edge_ids = [edge['id'] for edge in output_edges]
        output_edge_data = {}

        ## calculate edge and emission
        for node_id in sorted_node_ids:
            ## skip the node from outside facility
            if node_id not in starting_node_ids:
                ## expand input_edges and output_edges
                input_edges: List[Edge] = self.edges_by_to[node_id] + input_node_and_input_edges_map[node_id]
                output_edges: List[Edge] = self.edges_by_from[node_id] + output_node_and_output_edges_map[node_id]

                node = self.nodes_map[node_id]

                ## expand the edge_data_map and nodes_map
                node_output_edge_data = node.calculate_output_edges_and_emission(input_edges, output_edges, {
                    **self.edge_data_map,
                    **network_edge_data_map
                }, {
                    **self.nodes_map,
                    **network_nodes_map
                }, well_info)

                edges_in_output = list(node_output_edge_data.keys())
                for edge_id in edges_in_output:
                    if edge_id in output_edge_ids:
                        output_edge_data[edge_id] = node_output_edge_data.pop(edge_id)

                self.edge_data_map.update(node_output_edge_data)

        return output_edge_data

    def get_input_node_id(self, input_edge: Edge) -> str:
        """Method to get the first node in a facility from a given input edge

        This is used in case the previous node is not in the facility and is connected to a flare or atmosphere node.
        Args:
        input_edge: edge that connects to the facility and then to the first node

        Returns:
        first_node_id: string
        """
        first_edge = self.input_edges_map.get(input_edge['toHandle'])
        return first_edge['to']

    def get_output_node_id(self, output_edge: Edge) -> str:
        last_edge = self.output_edges_map.get(output_edge['fromHandle'])
        return last_edge['from']

    def get_output_node(self, output_edge: Edge) -> BaseNode:
        output_node_id = self.get_output_node_id(output_edge)
        return self.nodes_map[output_node_id]

    def get_output_node_and_port(self, output_edge: Edge) -> tuple[BaseNode, str]:
        last_edge = self.output_edges_map.get(output_edge['fromHandle'])
        return self.nodes_map[last_edge['from']], last_edge['fromHandle']
