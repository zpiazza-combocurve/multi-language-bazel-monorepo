import numpy as np
from typing import List
from combocurve.science.network_module.nodes.shared.shared_node import SharedNode
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager

from bson import ObjectId
from combocurve.science.network_module.nodes.shared.type_hints import (Edge, MonthlyFrequencyDatetime64dNDArray,
                                                                       Float64NDArray, EdgeDataMap,
                                                                       StreamDataPerFluidModel)

from combocurve.science.network_module.nodes.shared.helper import apply_time_series_allocation


class WellGroup(SharedNode):
    node_type = 'well_group'

    def __init__(self, node_id: str, params: dict):
        super().__init__(node_id, params)  ## call SharedNode.__init__() to get self.storage
        self.fluid_model_id = fluid_model_manager.get_fluid_model_id(self.params['fluid_model'])

    def check_if_well_is_contained(self, well_id: ObjectId) -> bool:
        return well_id in self.params['wells']

    def calculate_output_edges_and_emission(self, input_edges: List[Edge], output_edges: List[Edge],
                                            edge_data_map: EdgeDataMap, network_nodes_map: dict,
                                            well_info: dict) -> EdgeDataMap:
        well_data = well_info['well_data']
        output_edge_data: EdgeDataMap = {}
        for output_edge in output_edges:
            if output_edge['by'] != 'link':
                date_arr: MonthlyFrequencyDatetime64dNDArray = well_data['date']
                value_arr: Float64NDArray = np.array(well_data[output_edge['by']], dtype=np.float64)

                stream_data: StreamDataPerFluidModel = {
                    self.fluid_model_id: {
                        'date':
                        date_arr,
                        'value':
                        apply_time_series_allocation(date_arr, value_arr, output_edge['params'], well_info['date_dict'])
                    }
                }

                output_edge_data[output_edge['id']] = stream_data

        return output_edge_data
