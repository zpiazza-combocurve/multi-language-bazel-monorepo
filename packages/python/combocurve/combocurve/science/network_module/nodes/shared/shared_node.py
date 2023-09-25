## main reason for a local storage is for 2 paths can share the same db keys, thus the values should be added up
## example is the path 1-3 and 7-10-3, 3 is used twice, and we want to get the summation of the 2 paths
## NOTE: generate_output_stream always takes 1 input_stream and gives 1 output_stream(decided by edge.by)
from typing import Dict
from combocurve.science.network_module.nodes.shared.type_hints import OptionalStreamDateAndValue
from combocurve.science.network_module.nodes.shared.helper import get_db_node_id, sum_stream_date_and_value_for_2


class SharedNode:
    def __init__(self, node_id: str, params):
        self.id = node_id
        self.params = params
        self.storage: Dict[tuple, OptionalStreamDateAndValue] = {}

    def get_storage_key(self, well_id, emission_type, product_type, product, port):
        ## emission_type = 'vented' | 'combustion' | 'flare'
        ## product = 'oil' | 'gas' | 'water' | ...'fluid_model_keys'
        return (well_id, emission_type, product_type, product, port)

    def add_to_local_storage_new(self, key: tuple, stream_date_and_value: OptionalStreamDateAndValue):
        ## if key exists, then add, if not then create
        ## the stream_value here should be np.ndarray
        self.storage[key] = sum_stream_date_and_value_for_2(stream_date_and_value, self.storage.get(key))

    def generate_final_emission_data(self, well_data: dict, well_info: dict, facility_id: str = None) -> list:
        ret = []

        for (well_id, emission_type, product_type, product, _), date_and_value in self.storage.items():
            date = date_and_value['date']
            value = date_and_value['value']
            ret += [{
                'well_id': well_id,
                'node_id': get_db_node_id(self.id, facility_id),
                'node_type': self.node_type,
                'emission_type': emission_type,
                'product_type': product_type,
                'product': product,
                'value': float(v),
                'date': date[i]
            } for i, v in enumerate(value)]

        return ret
