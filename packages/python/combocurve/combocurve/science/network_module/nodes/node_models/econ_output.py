class EconOutput:
    node_type = 'econ_output'

    def __init__(self, node_id, params):
        self.id = node_id
        self.storage = {}

    def generate_final_emission_data(self, well_data: dict, well_info: dict, facility_id: str = None) -> list:
        ## emission is stored at previous nodes
        return []

    def calculate_output_edges_and_emission(self, input_edges, output_edges, edge_data_map, network_nodes_map,
                                            well_info):
        return {}
