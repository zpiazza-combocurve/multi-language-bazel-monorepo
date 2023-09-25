import datetime
from bson import ObjectId
from collections import defaultdict
from typing import List, Dict

from combocurve.science.network_module.nodes.shared.type_hints import EdgeDataMap, Edge
from combocurve.science.network_module.nodes.node_class_map import NODE_CLASS_MAP
from combocurve.science.network_module.nodes.node_models.facility import Facility
from combocurve.science.network_module.nodes.shared.helper import (generate_edges_by_from, generate_edges_by_to,
                                                                   sort_network_nodes)
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager

WELL_GROUP = 'well_group'
DEVELOPMENT = 'development'

FIRST_PRODUCTION_DATE_STR = 'first_production_date'
CUT_OFF_DATE_STR = 'cut_off_date'


class Network:
    def __init__(self, network_doc: dict):
        node_docs = network_doc['nodes']

        ## define nodes
        self.nodes = []
        self.nodes_map = {}

        fluid_model_manager.reset()

        for node_doc in node_docs:
            node_id = node_doc['id']
            node_params = node_doc['params']
            if node_doc['type'] == 'facility':
                this_node = Facility(node_id, node_params)
            else:
                this_node = NODE_CLASS_MAP[node_doc['type']](node_id, node_params)

            self.nodes += [this_node]
            self.nodes_map[node_id] = this_node

            fluid_model_manager.process_node(node_doc)

        ## define edges
        self.edges: List[Edge] = network_doc['edges']
        self.edges_map: Dict[str, Edge] = {edge['id']: edge for edge in self.edges}
        self.edge_data_map: EdgeDataMap = {}

        self.edges_by_from = generate_edges_by_from(self.edges)
        self.edges_by_to = generate_edges_by_to(self.edges)

    def _preprocess_network_data_for_one_well(self, well_id_str: str) -> tuple[list[str], list[str]]:
        ## get relevant well_groups
        relevant_well_group_ids = [
            node.id for node in self.nodes
            if node.node_type == WELL_GROUP and node.check_if_well_is_contained(ObjectId(well_id_str))
        ]

        ## get relevant connections between dev and well_group nodes
        relevant_dev_well_group_map = defaultdict(list)
        for edge in self.edges:
            if edge['by'] == DEVELOPMENT and edge['to'] in relevant_well_group_ids:
                relevant_dev_well_group_map[edge['from']].append(edge['to'])

        ## get order of node calculation
        edges_without_link_edge = [edge for edge in self.edges if edge['by'] != 'link']
        sorted_node_ids = sort_network_nodes(relevant_well_group_ids, edges_without_link_edge)

        return sorted_node_ids, relevant_dev_well_group_map

    def calculate_one_well(self, well_info: dict) -> list[dict]:
        well_id_str: str = well_info['well_id']
        well_data = well_info['well_data']
        ## preprocessing
        sorted_node_ids, relevant_dev_well_group_map = self._preprocess_network_data_for_one_well(well_id_str)

        ## calculate edge and emission
        for node_id in sorted_node_ids:
            node = self.nodes_map[node_id]
            input_edges = self.edges_by_to[node_id]
            output_edges = self.edges_by_from[node_id]

            ## TODO: Add this function to all nodes
            output_edge_data = node.calculate_output_edges_and_emission(input_edges, output_edges, self.edge_data_map,
                                                                        self.nodes_map, well_info)

            self.edge_data_map.update(output_edge_data)

        ## save emission data
        emission = self._initiate_emission(well_info)

        for node in self.nodes:
            if node.node_type == 'facility':
                for child_node in node.nodes:
                    emission += child_node.generate_final_emission_data(well_data, well_info, node.id)
            elif node.node_type in ['drilling', 'completion']:
                if node.id in relevant_dev_well_group_map:
                    n_well_groups = len(relevant_dev_well_group_map[node.id])
                    emission += node.calculate_development_emission(well_id_str, well_info) * n_well_groups
                    # note: duplicated emissions are pointing to the same dicts, so updating the values in one of these
                    # lists of dicts will update the values in any duplicated dicts.
            else:
                emission += node.generate_final_emission_data(well_data, well_info)

        return emission

    def _initiate_emission(self, well_info: dict) -> List:
        '''
        Initiate the emission array, contains the wells start and end date, will use this in the aggregation

        Args:
            well_info: well information

        Returns:
            emission data: emission data that contains well's start and end date
        '''
        well_id_str: str = well_info['well_id']
        date_dict = well_info['date_dict']
        unecon_bool = well_info['unecon_bool']
        ret = [{
            'well_id': well_id_str,
            'node_id': None,
            'node_type': None,
            'emission_type': None,
            'product_type': None,
            'product': date,
            'value': None,
            'date': date_dict[date]
        } for date in [FIRST_PRODUCTION_DATE_STR, CUT_OFF_DATE_STR]]

        if unecon_bool:
            # update the cut_off_date to one month before As Of so facility device emissions are not assigned
            ret[1]['date'] -= datetime.timedelta(days=31)

        return ret
