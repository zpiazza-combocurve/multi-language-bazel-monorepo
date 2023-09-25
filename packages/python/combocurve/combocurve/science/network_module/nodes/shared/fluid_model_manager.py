from typing import Union, List
from bson import ObjectId

from combocurve.science.network_module.nodes.shared.type_hints import EdgeDataMap
from combocurve.science.network_module.nodes.shared.helper import sum_stream_date_and_value_for_2
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults

DEFAULT_STR = 'default'


class _FluidModelManager:
    def __init__(self):
        self.fluid_models = {DEFAULT_STR: NetworkDefaults.fluid_model}

    def reset(self):
        self.fluid_models = {DEFAULT_STR: NetworkDefaults.fluid_model}

    def process_node(self, node_doc: dict):
        ## TODO: maybe split this function into each node
        if node_doc['type'] == 'well_group' and self.get_fluid_model_id(
                node_doc['params'].get('fluid_model')) != DEFAULT_STR:
            self.add(node_doc['params'].get('fluid_model'))
            return

        if node_doc['type'] == 'oil_tank' and self.get_fluid_model_id(
                node_doc['params'].get('output_gas_fluid_model')) != DEFAULT_STR:
            self.add(node_doc['params'].get('output_gas_fluid_model'))
            return

        if node_doc['type'] == 'custom_calculation' and self.get_fluid_model_id(
                node_doc['params'].get('fluid_model')) != DEFAULT_STR:
            self.add(node_doc['params'].get('fluid_model'))
            return

    def add(self, fluid_model_doc: dict):
        model_id = fluid_model_doc['_id']
        if model_id not in self.fluid_models:
            self.fluid_models[model_id] = fluid_model_doc['econ_function']

    def get_fluid_model_id(self, fluid_model_doc: Union[None, dict] = None) -> Union[str, ObjectId]:
        if fluid_model_doc and fluid_model_doc.get('_id'):
            return fluid_model_doc['_id']

        return DEFAULT_STR

    def get_fluid_model(self, fluid_model_id: Union[None, ObjectId] = None) -> dict:
        if fluid_model_id not in self.fluid_models:
            raise Exception('not a valid fluid model')

        return self.fluid_models[fluid_model_id]

    def sum_input_for_the_same_port(self, input_edge_datas: List[EdgeDataMap]) -> EdgeDataMap:
        ret: EdgeDataMap = {}
        for edge_data in input_edge_datas:
            for fluid_model_id, date_and_value in edge_data.items():
                ## TODO: use sum_stream_date_and_value_for_more
                ret[fluid_model_id] = sum_stream_date_and_value_for_2(date_and_value, ret.get(fluid_model_id))

        return ret


fluid_model_manager = _FluidModelManager()
