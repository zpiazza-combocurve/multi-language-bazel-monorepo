from functools import partial
from api.cc_to_cc.carbon.network import network_export, network_edges_export
from api.cc_to_cc.carbon.facility import facility_export, facility_edges_export
from api.cc_to_cc.carbon.combustion import combustion_export
from api.cc_to_cc.carbon.pneumatic_compressor import pneumatic_compressor_export
from api.cc_to_cc.carbon.well_group import well_group_export, well_group_wells_export
from api.cc_to_cc.carbon.development_node import development_node_export
from api.cc_to_cc.carbon.oil_tank import oil_tank_export
from api.cc_to_cc.carbon.flare import flare_export
from api.cc_to_cc.carbon.stream_shared_node import stream_shared_node_export
from api.cc_to_cc.carbon.custom_calculation import custom_calculation_export

from combocurve.science.network_module.nodes.shared.utils import (
    NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY, FACILITY_EDGES_KEY, WELL_GROUP_KEY, WELL_GROUP_WELLS_KEY,
    DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY, OIL_TANK_KEY, FLARE_KEY, COMBUSTION_KEY, PNEUMATIC_DEVICE_KEY,
    PNEUMATIC_PUMP_KEY, CENTRIFUGAL_COMPRESSOR_KEY, RECIPROCATING_COMPRESSOR_KEY, ATMOSPHERE_KEY, CAPTURE_KEY,
    ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY, ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY)

EXPORT_NODES_FUNC_DICT = {
    WELL_GROUP_KEY: well_group_export,
    WELL_GROUP_WELLS_KEY: well_group_wells_export,
    DRILLING_KEY: partial(development_node_export, DRILLING_KEY),
    COMPLETION_KEY: partial(development_node_export, COMPLETION_KEY),
    FLOWBACK_KEY: partial(development_node_export, FLOWBACK_KEY),
    OIL_TANK_KEY: oil_tank_export,
    FLARE_KEY: flare_export,
    COMBUSTION_KEY: combustion_export,
    PNEUMATIC_DEVICE_KEY: partial(pneumatic_compressor_export, PNEUMATIC_DEVICE_KEY),
    PNEUMATIC_PUMP_KEY: partial(pneumatic_compressor_export, PNEUMATIC_PUMP_KEY),
    CENTRIFUGAL_COMPRESSOR_KEY: partial(pneumatic_compressor_export, CENTRIFUGAL_COMPRESSOR_KEY),
    RECIPROCATING_COMPRESSOR_KEY: partial(pneumatic_compressor_export, RECIPROCATING_COMPRESSOR_KEY),
    ATMOSPHERE_KEY: partial(stream_shared_node_export, ATMOSPHERE_KEY),
    CAPTURE_KEY: partial(stream_shared_node_export, CAPTURE_KEY),
    ECON_OUTPUT_KEY: partial(stream_shared_node_export, ECON_OUTPUT_KEY),
    LIQUIDS_UNLOADING_KEY: partial(stream_shared_node_export, LIQUIDS_UNLOADING_KEY),
    ASSOCIATED_GAS_KEY: partial(stream_shared_node_export, ASSOCIATED_GAS_KEY),
    CUSTOM_CALCULATION_KEY: custom_calculation_export,
}


def carbon_export(network: dict, export_dict: dict[list], wells_map: dict, facility_set: set) -> tuple[dict, set]:
    """ Handles the export of one network. The steps are:
    * Loop through each node in the network and call the appropriate export function for that node
    * Add the exported node to the export_dict for that node type
    * Call network_export to add all nodes to the network export_dict. This has to be done after all nodes have been
    exported to get the model_ids
    * Call network_edges_export to add all edges to the network_edges export_dict. This has to be done after all nodes
    have been exported to get the mapping from node_id to model_id
    """
    model_id_dict = {}  # maps internal node id to external model id {uuid: node_type_1}
    # map facility port id to external edge id for each facility {internal facility node id: {uuid: external edge id}}
    port_id_dict = {}
    # loop through each node in network and add params to each node key
    nodes = network.get('nodes', [])
    for node in nodes:
        node_id = node['id']
        node_type = node['type']
        if node_type == WELL_GROUP_KEY:
            # update well group and wells lists
            export_node_rows, model_id_dict[node_id] = EXPORT_NODES_FUNC_DICT[node_type](node, export_dict[node_type])
            export_dict[node_type] += export_node_rows
            export_dict[WELL_GROUP_WELLS_KEY] += EXPORT_NODES_FUNC_DICT[WELL_GROUP_WELLS_KEY](
                node, export_dict[WELL_GROUP_WELLS_KEY], model_id_dict[node_id], wells_map)
        elif node_type == FACILITY_KEY:
            # check if facility has already been added to the export
            facility_name = node['params']['name']
            if facility_name in facility_set:
                # update model_id_dict but don't update export_dict
                model_id_dict[node_id] = facility_name
            else:
                # update child node lists
                child_model_id_dict = {}
                child_nodes = node['params']['nodes']
                for child_node in child_nodes:
                    child_node_id = child_node['id']
                    child_node_type = child_node['type']
                    export_child_node_rows, child_model_id_dict[child_node_id] = EXPORT_NODES_FUNC_DICT[
                        child_node_type](child_node, export_dict[child_node_type])
                    export_dict[child_node_type] += export_child_node_rows
                # then update facility list, facility edges list and facility set
                export_facility_rows, child_node_id_dict, model_id_dict[node_id] = facility_export(
                    node['params'], export_dict[node_type], child_model_id_dict)
                export_dict[node_type] += export_facility_rows
                export_facility_edge_rows, port_id_dict[node_id] = facility_edges_export(
                    node['params'], export_dict[FACILITY_EDGES_KEY], child_node_id_dict)
                export_dict[FACILITY_EDGES_KEY] += export_facility_edge_rows
                facility_set.add(facility_name)
        else:
            # update node
            export_node_rows, model_id_dict[node_id] = EXPORT_NODES_FUNC_DICT[node_type](node, export_dict[node_type])
            export_dict[node_type] += export_node_rows
    # update network list
    network_rows, node_id_dict = network_export(network, export_dict[NETWORK_KEY], model_id_dict)
    export_dict[NETWORK_KEY] += network_rows

    # update network edges list
    export_dict[NETWORK_EDGES_KEY] += network_edges_export(network, node_id_dict, port_id_dict)
    return export_dict, facility_set
