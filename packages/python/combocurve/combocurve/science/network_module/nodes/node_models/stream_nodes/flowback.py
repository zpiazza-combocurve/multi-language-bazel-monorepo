import numpy as np

from combocurve.science.network_module.nodes.shared.helper import apply_time_series_allocation
from combocurve.science.network_module.nodes.node_models.development_nodes.development_helper import (
    get_month_map, choose_start_date_window_params)

from combocurve.science.network_module.nodes.shared.type_hints import EdgeDataMap
from combocurve.science.network_module.nodes.shared.fluid_model_manager import fluid_model_manager
from combocurve.science.network_module.nodes.node_models.stream_nodes.stream_shared_node import StreamSharedNode

CRITERIA = ['start_criteria', 'end_criteria']


class Flowback(StreamSharedNode):
    node_type = 'flowback'

    def calculate_output_edges_and_emission(self, input_edges, output_edges, edge_data_map, network_nodes_map,
                                            well_info) -> EdgeDataMap:
        dates, values = self._get_raw_date_and_value(well_info)
        if dates is None:
            return {}

        by = 'gas'
        gas_input_edge_ids = [edge['id'] for edge in input_edges if edge['by'] == by]
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
                    'value': apply_time_series_allocation(dates, values, output_edge['params'], well_info['date_dict']),
                    'date': dates
                }
                for fluid_model_key, fluid_model_value in total_gas_per_fluid.items()
            }
        return output_edge_data

    def _get_raw_date_and_value(self, well_info):
        time_series = self.params['time_series']
        rows = time_series['rows']

        matched_row_params, schedule_dates, header_dates = choose_start_date_window_params(rows, well_info)

        if matched_row_params is None:
            return None, None

        month_map = get_month_map(matched_row_params, well_info['date_dict'], schedule_dates, header_dates)
        flowback_rate = matched_row_params['flowback_rate']

        output_date_arr = []
        output_value_arr = []
        for month_date_object, value in month_map.items():
            output_date_arr += [month_date_object]
            output_value_arr += [value]

        np_output_dates = np.array(output_date_arr)
        reorder_index = np.argsort(np_output_dates)

        dates = np_output_dates[reorder_index]
        values = flowback_rate * np.array(output_value_arr, dtype=float)[reorder_index]
        return dates, values
