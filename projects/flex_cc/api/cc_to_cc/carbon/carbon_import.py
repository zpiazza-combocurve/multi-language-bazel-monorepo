import datetime
import pandas as pd
from bson import ObjectId
from functools import partial
from pymongo import UpdateOne
from api.cc_to_cc.carbon.network import network_edges_import
from api.cc_to_cc.carbon.facility import facility_import, facility_edges_import
from api.cc_to_cc.carbon.combustion import combustion_import
from api.cc_to_cc.carbon.pneumatic_compressor import pneumatic_compressor_import
from api.cc_to_cc.carbon.well_group import well_group_import
from api.cc_to_cc.carbon.oil_tank import oil_tank_import
from api.cc_to_cc.carbon.flare import flare_import
from api.cc_to_cc.carbon.development_node import development_node_import
from api.cc_to_cc.carbon.stream_shared_node import stream_shared_node_import
from api.cc_to_cc.carbon.custom_calculation import custom_calculation_import

from api.cc_to_cc.helper import (str_to_display, display_to_str, selection_validation, log_missing_field,
                                 log_duplicated_row, update_facility_name)
from api.cc_to_cc.file_headers import (get_assumption_empty_row, ColumnName)
from combocurve.science.network_module.nodes.shared.utils import (
    NODE_OPTIONS, NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY, FACILITY_EDGES_KEY, WELL_GROUP_KEY,
    WELL_GROUP_WELLS_KEY, DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY, OIL_TANK_KEY, FLARE_KEY, COMBUSTION_KEY,
    PNEUMATIC_DEVICE_KEY, PNEUMATIC_PUMP_KEY, CENTRIFUGAL_COMPRESSOR_KEY, RECIPROCATING_COMPRESSOR_KEY, ATMOSPHERE_KEY,
    CAPTURE_KEY, ECON_OUTPUT_KEY, LIQUIDS_UNLOADING_KEY, ASSOCIATED_GAS_KEY, CUSTOM_CALCULATION_KEY)

IMPORT_NODES_FUNC_DICT = {
    FACILITY_KEY: facility_import,
    DRILLING_KEY: partial(development_node_import, DRILLING_KEY),
    COMPLETION_KEY: partial(development_node_import, COMPLETION_KEY),
    FLOWBACK_KEY: partial(development_node_import, FLOWBACK_KEY),
    OIL_TANK_KEY: oil_tank_import,
    FLARE_KEY: flare_import,
    COMBUSTION_KEY: combustion_import,
    PNEUMATIC_DEVICE_KEY: partial(pneumatic_compressor_import, PNEUMATIC_DEVICE_KEY),
    PNEUMATIC_PUMP_KEY: partial(pneumatic_compressor_import, PNEUMATIC_PUMP_KEY),
    CENTRIFUGAL_COMPRESSOR_KEY: partial(pneumatic_compressor_import, CENTRIFUGAL_COMPRESSOR_KEY),
    RECIPROCATING_COMPRESSOR_KEY: partial(pneumatic_compressor_import, RECIPROCATING_COMPRESSOR_KEY),
    ATMOSPHERE_KEY: partial(stream_shared_node_import, ATMOSPHERE_KEY),
    CAPTURE_KEY: partial(stream_shared_node_import, CAPTURE_KEY),
    ECON_OUTPUT_KEY: partial(stream_shared_node_import, ECON_OUTPUT_KEY),
    LIQUIDS_UNLOADING_KEY: partial(stream_shared_node_import, LIQUIDS_UNLOADING_KEY),
    ASSOCIATED_GAS_KEY: partial(stream_shared_node_import, ASSOCIATED_GAS_KEY),
    CUSTOM_CALCULATION_KEY: custom_calculation_import,
}


def create_carbon_document(model_name: str, project_id: str, doc_type: str) -> dict:
    """ Initialize a network or facility document and populate with name and project id.
    """
    return {
        'name':
        model_name,
        'project':
        ObjectId(project_id),
        'fluidModels':
        set(),
        'nodes': [],
        'edges': [],
        **({
            'inputs': [],
            'outputs': [],
        } if doc_type == FACILITY_KEY else {
               'wells': set(),  # noqa: E126
               'facilities': set(),
           }),  # noqa: E121
    }


def _get_model_name(model: str, existing_names: set, collection: str, one_coll_df: pd.DataFrame, new_coll_name: str,
                    error_list: list, coll_w_errors: set, overwrite_models: bool) -> str:
    """ Helper function to get the model name to assign to the new network or facility document. Returns either the
    existing name in the "Network/Facility Name" column or the new name in the "New Network/Facility Name" column if
    that name does not already exist in the project.
    """
    if new_coll_name in one_coll_df.columns:
        new_model_name = one_coll_df[new_coll_name].values[0]
        if new_model_name:
            if new_model_name in existing_names and new_model_name is not model and overwrite_models:
                log_duplicated_row(error_list=error_list,
                                   input_df=one_coll_df,
                                   field=new_model_name,
                                   field_type=collection)
                coll_w_errors.add(new_model_name)
            return new_model_name
    return model


def _adjust_model_name(model_name: str, existing_names: set) -> str:
    """ Helper function to add a suffix to the facility name if it already exists in the project. Only used for facility
    imports when overwrite_models is False.
    """
    idx = 1
    adjusted_name = model_name
    while adjusted_name in existing_names:
        adjusted_name = f'{model_name}_{idx}'
        idx += 1
    return adjusted_name


def carbon_import(  # noqa: C901
        carbon_import_dict: dict,
        user_id: str,
        project_id: str,
        collection: str,
        fluid_model_df: pd.DataFrame,
        carbon_import_errors: dict,
        existing_names: set,
        overwrite_models: bool = True,
        fac_in_net_df=pd.DataFrame(),
        import_wells_df=pd.DataFrame(),
        missing_wells_df=pd.DataFrame(),
        port_id_dict={}) -> tuple[list, dict, set, dict, set]:
    """ Prepares either facility or network documents for import. The steps are:
    * Create a document for each unique facility or network
    * Loop through each node in the facility/network and call the appropriate import function to create a node object
    * Loop through each edge in the facility/network and call the appropriate import function to create an edge object
    * Check if any errors occur during import of nodes/edges and only include the document if there are no errors.
    """
    # collection == 'network' or 'facility'
    bw_list = []
    coll_w_errors = set()
    adj_name_map = {}
    overwritten_facilities = set()

    collection_keys = {
        NETWORK_KEY: {
            'coll_name': ColumnName.network_name.value,
            'new_coll_name': ColumnName.new_network_name.value,
            'edge_key': NETWORK_EDGES_KEY,
        },
        FACILITY_KEY: {
            'coll_name': ColumnName.facility_name.value,
            'new_coll_name': ColumnName.new_facility_name.value,
            'edge_key': FACILITY_EDGES_KEY,
        },
    }

    coll_name = collection_keys[collection]['coll_name']
    new_coll_name = collection_keys[collection]['new_coll_name']
    edge_key = collection_keys[collection]['edge_key']

    collection_df = carbon_import_dict.get(collection, pd.DataFrame())
    edge_df = carbon_import_dict.get(edge_key, pd.DataFrame())
    # get list of facilities/networks to import
    collection_list = collection_df[coll_name].unique().tolist()
    collection_list.remove(None) if None in collection_list else None
    # loop through each unique name in collection
    for model in collection_list:
        one_coll_df = collection_df.loc[collection_df[coll_name] == model, :]
        one_coll_dict = {}  # maps external node_id to node type for edge type validation
        node_id_dict = {}  # maps external node_id to internal node_id
        fac_id_dict = {}  # maps external node_id to facility name for link edges
        custom_node_ports_dict = {}  # maps external node_id to list of assigned ports for custom calculation nodes
        shape_multipliers = {'x': 1, 'y': 1}
        model_name = _get_model_name(model, existing_names, collection, one_coll_df, new_coll_name,
                                     carbon_import_errors[collection], coll_w_errors, overwrite_models)
        if not overwrite_models:
            # only applies to facility imports, networks are always overwritten
            old_model_name = model_name
            model = model_name = _adjust_model_name(model_name, existing_names)
            adj_name_map.update({old_model_name: model_name}) if old_model_name != model_name else None
        elif collection == FACILITY_KEY:
            overwritten_facilities.add(model_name) if model in existing_names else None
        doc = create_carbon_document(model_name, project_id, collection)
        # add nodes
        node_ids = one_coll_df[ColumnName.node_id.value].unique()
        for node_id in node_ids:
            if node_id is None:
                one_node_id_df = one_coll_df.loc[one_coll_df[ColumnName.node_id.value].isnull(), :]
                log_missing_field(
                    error_list=carbon_import_errors[collection],
                    input_df=one_node_id_df,
                    field=ColumnName.node_id.value,
                )
                coll_w_errors.add(model_name)
            else:
                one_node_id_df = one_coll_df.loc[one_coll_df[ColumnName.node_id.value] == node_id, :]
                if one_node_id_df.shape[0] > 1:
                    log_duplicated_row(
                        error_list=carbon_import_errors[collection],
                        input_df=one_node_id_df.tail(-1),
                        field=node_id,
                        field_type='node_id',
                    )
                    coll_w_errors.add(model_name)
                first_row = one_node_id_df.iloc[0, :]
                first_row_dict = dict(first_row)
                row_index = int(first_row.name)
                node_type = display_to_str(
                    selection_validation(
                        error_list=carbon_import_errors[collection],
                        input_dict=first_row_dict,
                        input_key=ColumnName.node_type.value,
                        options=NODE_OPTIONS[collection],
                        row_index=row_index,
                    ))
                one_coll_dict[node_id] = node_type
                n_old_err = 0
                n_new_err = 0
                model_id = first_row[ColumnName.model_id.value]
                if model_id is None:
                    error_message = 'Missing Model ID'
                    carbon_import_errors[collection].append({'error_message': error_message, 'row_index': row_index})
                    coll_w_errors.add(model_name)
                else:
                    model_id = str(model_id)
                    if node_type:
                        n_old_err += len(carbon_import_errors[node_type])
                        if node_type == FACILITY_KEY:
                            node_doc, node_id_dict[node_id], facility_id = facility_import(
                                facility_name=model_id,
                                fac_in_net_df=fac_in_net_df,
                                shape_multipliers=shape_multipliers,
                                error_list=carbon_import_errors[NETWORK_KEY],
                                row_index=row_index,
                            )
                            n_new_err += len(carbon_import_errors[node_type])
                            # need to preserve the external node_id to facility name relationship for link edges
                            fac_id_dict[node_id] = model_id
                            doc['nodes'].append(node_doc)
                            doc['facilities'].add(facility_id)
                            shape_multipliers['x'] += 1
                        else:
                            node_df = carbon_import_dict.get(node_type,
                                                             pd.DataFrame([get_assumption_empty_row(node_type)]))
                            # filter to rows for this model_id
                            one_node_df = node_df.loc[node_df[ColumnName.model_id.value] == model_id, :]
                            if one_node_df.empty:
                                error_message = f"Missing {model_id} Model ID in {str_to_display(node_type,'_')} sheet"
                                carbon_import_errors[collection].append({
                                    'error_message': error_message,
                                    'row_index': row_index
                                })
                                coll_w_errors.add(model_name)
                            else:
                                if node_type == WELL_GROUP_KEY:
                                    # include error list for Wells sheet
                                    n_old_err += len(carbon_import_errors[WELL_GROUP_WELLS_KEY])
                                    # get import wells for this node
                                    one_wg_wells = import_wells_df.loc[
                                        import_wells_df[ColumnName.well_group_id.value] == model_id, :]
                                    missing_wg_wells = missing_wells_df.loc[
                                        missing_wells_df[ColumnName.well_group_id.value] == model_id, :]
                                    node_doc, node_id_dict[node_id], fluid_model, wells = well_group_import(
                                        node_df=one_node_df,
                                        wells_df=one_wg_wells,
                                        missing_wells_df=missing_wg_wells,
                                        fluid_model_df=fluid_model_df,
                                        shape_multipliers=shape_multipliers,
                                        error_dict=carbon_import_errors,
                                    )
                                    doc['wells'].update(wells)
                                    n_new_err += len(carbon_import_errors[WELL_GROUP_WELLS_KEY])
                                else:
                                    node_doc, node_id_dict[node_id], fluid_model = IMPORT_NODES_FUNC_DICT[node_type](
                                        node_df=one_node_df,
                                        fluid_model_df=fluid_model_df,
                                        shape_multipliers=shape_multipliers,
                                        error_list=carbon_import_errors[node_type],
                                    )
                                    if node_type == CUSTOM_CALCULATION_KEY:
                                        # TODO: check both name and by when users can add/rename custom inputs/outputs
                                        custom_node_ports_dict.update({
                                            node_id: {
                                                'inputs':
                                                [inpt['by'] for inpt in node_doc['params']['inputs'] if inpt['assign']],
                                                'outputs': [
                                                    outpt['by'] for outpt in node_doc['params']['outputs']
                                                    if outpt['assign']
                                                ]
                                            }
                                        })
                                shape_multipliers['x'] += 1
                                doc['nodes'].append(node_doc)
                                if fluid_model:
                                    doc['fluidModels'].add(fluid_model)
                        n_new_err += len(carbon_import_errors[node_type])
                    if n_new_err > n_old_err:
                        coll_w_errors.add(model_name)
                    # shape_multipliers['y'] += 1

        # get edges
        n_old_edge_err = len(carbon_import_errors[edge_key])
        if not overwrite_models:
            # TODO: Improve performance of this update. Currently it updates the whole column for each facility
            edge_df[coll_name] = edge_df[coll_name].apply(update_facility_name, name_map=adj_name_map)
        one_coll_edge_df = edge_df.loc[edge_df[coll_name] == model_name, :]
        if not one_coll_edge_df.empty:
            if collection == NETWORK_KEY:
                edges = network_edges_import(
                    one_coll_edge_df,
                    one_coll_dict,
                    node_id_dict,
                    port_id_dict,
                    custom_node_ports_dict,
                    carbon_import_errors[edge_key],
                    fac_id_dict,
                    fac_in_net_df,
                )
            else:
                edges, inputs, outputs, port_id_dict = facility_edges_import(
                    one_coll_edge_df,
                    one_coll_dict,
                    node_id_dict,
                    port_id_dict,
                    custom_node_ports_dict,
                    carbon_import_errors[FACILITY_EDGES_KEY],
                )
                # add input and output edges
                doc.update({'inputs': inputs, 'outputs': outputs})
            # add edges
            doc.update({'edges': edges})
        n_new_edge_err = len(carbon_import_errors[edge_key])
        if n_new_edge_err > n_old_edge_err:
            coll_w_errors.add(model_name)
            continue
        user_object_id = ObjectId(user_id)
        # TODO: add lastUpdatedBy field to mongo schema
        # doc['lastUpdatedBy'] = user_object_id
        now = datetime.datetime.utcnow()
        doc['updatedAt'] = now
        # replace sets with lists
        doc['fluidModels'] = list(doc['fluidModels'])
        if collection == NETWORK_KEY:
            doc['wells'] = list(doc['wells'])
            doc['facilities'] = list(doc['facilities'])
        if model_name not in coll_w_errors:
            if model in existing_names:
                existing_names.remove(model)
            existing_names.add(model_name)
            bw_list.append(
                UpdateOne(
                    filter={
                        'project': ObjectId(project_id),
                        'name': model,
                    },
                    update={
                        '$set': doc,
                        '$setOnInsert': {
                            'createdAt': now,
                            'createdBy': user_object_id,
                            'copiedFrom': None,
                            '_v': 0,
                        }
                    },
                    upsert=True,
                ))

    return bw_list, port_id_dict, coll_w_errors, adj_name_map, overwritten_facilities
