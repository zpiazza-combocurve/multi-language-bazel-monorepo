import pandas as pd
import uuid
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from api.cc_to_cc.helper import (generate_export_id, str_to_display, selection_validation, date_validation,
                                 number_validation, common_edge_export, common_edge_import, date_str_format_change,
                                 log_missing_field, log_duplicated_row, add_user_name_to_export, standard_date_str)
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import (NETWORK_KEY, NETWORK_EDGES_KEY, FACILITY_KEY,
                                                                  CUSTOM_CALCULATION_KEY, NODE_OPTIONS, NODE_PORTS,
                                                                  EDGE_OPTIONS)

criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}


def network_export(model: dict, model_rows: list, model_id_dict: dict) -> tuple[list, dict]:
    """ Writes each node in a network document to a dict and appends it to a list of dicts that will be written to an
    Excel sheet. Function is called in carbon_export.
    """
    export_rows = []
    node_id_dict = {}
    node_index = 1
    network_name = model['name']
    nodes = model['nodes']
    common_row = get_assumption_empty_row(NETWORK_KEY)
    created_at_str = model[ColumnName.createdAt.name].strftime(standard_date_str)
    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)
    common_row.update({
        ColumnName.createdAt.value: created_at_str,
        ColumnName.updatedAt.value: last_update_str,
        ColumnName.network_name.value: network_name,
    })
    add_user_name_to_export(common_row, model)

    for node in nodes:
        node_type = node['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
        export_node_id = generate_export_id(network_name, node_type, str(node_index))
        internal_node_id = node['id']
        node_row = deepcopy(common_row)
        node_row.update({
            ColumnName.node_id.value: export_node_id,
            ColumnName.node_type.value: str_to_display(node_type),
            ColumnName.model_id.value: model_id_dict[internal_node_id],
        })
        export_rows.append(node_row)
        node_index += 1
        node_id_dict.update({internal_node_id: export_node_id})

    return export_rows, node_id_dict


def network_edges_export(model: dict, node_id_dict: dict, port_id_dict: dict) -> list:
    """ Writes each edge in a network document to a dict and appends it to a list of dicts that will be written to an
    Excel sheet. Function is called in carbon_export.
    """
    rows = []
    edge_index = 1
    network_name = model['name']
    edges = model['edges']
    common_row = get_assumption_empty_row(NETWORK_EDGES_KEY)
    common_row.update({ColumnName.network_name.value: network_name})

    for edge in edges:
        edge_type = edge['by']
        from_node_id = edge['from']
        to_node_id = edge['to']
        edge_row = deepcopy(common_row)
        # dev edges do not have fromHandle or toHandle so return edge_type to mimic the behavior or link/stream edges
        from_port_id = edge.get('fromHandle', edge_type)
        to_port_id = edge.get('toHandle', edge_type)
        # only edges connected to/from facility ports will have an edge id instead of the edge type in the handle
        edge_row.update({
            ColumnName.from_port_id.value: port_id_dict.get(from_node_id, {}).get(from_port_id, ''),
            ColumnName.to_port_id.value: port_id_dict.get(to_node_id, {}).get(to_port_id, ''),
            ColumnName.edge_id.value: generate_export_id(network_name, edge_type, str(edge_index)),
        })
        # update edge_row with common edge fields
        common_edge_export(node_id_dict, edge, edge_row)
        edge_criteria = edge.get('params', {}).get('time_series', {}).get('criteria', None)
        if edge_criteria:
            edge_row.update({ColumnName.criteria.value: str_to_display(CRITERIA_MAP_DICT[edge_criteria], '_')})
            for row in edge['params']['time_series']['rows']:
                one_edge_row = deepcopy(edge_row)
                one_edge_row.update({
                    ColumnName.period.value: row['period'],
                    ColumnName.allocation.value: row.get('allocation', ''),
                })
                rows.append(one_edge_row)
        else:
            # link or development edge
            rows.append(edge_row)
        edge_index += 1

    return rows


def _get_facility_port_types(end: str, node: str, facility_name_to_doc_map: dict, fac_id_dict: dict,
                             port_id: str) -> tuple[list, str]:
    """ Helper function to handle the various cases of port types for a facility node. Returns a list of port types and
    an error message if applicable. Port type options:
    * Empty list [] if:
        * facility did not import successfully
        * port_id is missing in import sheet
        * port_id does not match any edge ids for the facility node
    * ['link'] if facility has no input ports
    * ['gas' | 'oil' | 'water'] if port_id matches the edge id of an input/output edge on the Facility Edges sheet
    """
    error_message = ''
    facility_name = fac_id_dict[node]
    facility_doc = facility_name_to_doc_map.get(facility_name)
    if facility_doc is None:
        error_message = f'Facility {facility_name} did not import successfully'
        port_types = []
    elif end == 'from':
        port_types = [v['by'] for v in facility_doc['outputs'] if v['id'] == port_id]
        if port_id is None:
            error_message = 'Wrong or missing From Port ID'
    else:
        input_ports = facility_doc['inputs']
        if len(input_ports) > 0:
            if port_id is None:
                error_message = 'Wrong or missing To Port ID'
            port_types = [v['by'] for v in facility_doc['inputs'] if v['id'] == port_id]
        else:
            port_types = ['link']
    return port_types, error_message


def _check_edge_type(edge_type: str, facility_name_to_doc_map: dict, fac_id_dict: dict, from_node: str,
                     from_type: Optional[str], to_node: str, to_type: Optional[str], to_port_id: Optional[str],
                     from_port_id: Optional[str], from_custom_ports: list, to_custom_ports: list) -> str:
    """ Helper function for network_edges_import. Checks if the edge type is supported by the from and to nodes.
    """
    error_message_list = []
    from_to_keys = {
        'from': {
            'node': from_node,
            'node_type': from_type,
            'connection': 'output',
            'port_id': from_port_id,
            'custom_ports': from_custom_ports,
        },
        'to': {
            'node': to_node,
            'node_type': to_type,
            'connection': 'input',
            'port_id': to_port_id,
            'custom_ports': to_custom_ports,
        },
    }

    for end in ['from', 'to']:
        node = from_to_keys[end]['node']
        node_type = from_to_keys[end]['node_type']
        connection = from_to_keys[end]['connection']
        connections = connection + 's'
        port_id = from_to_keys[end]['port_id']
        custom_ports = from_to_keys[end]['custom_ports']
        if node_type not in NODE_OPTIONS[NETWORK_KEY]:
            if node_type is None:
                error_message_list.append(f'Wrong or missing {str_to_display(end)} Node ID')
            else:
                error_message_list.append(f"{str_to_display(node_type,'_')} node not supported in Network")
        if node_type == FACILITY_KEY:
            port_types, facility_error_message = _get_facility_port_types(end, node, facility_name_to_doc_map,
                                                                          fac_id_dict, port_id)
            error_message_list.append(facility_error_message) if facility_error_message else None
        elif node_type == CUSTOM_CALCULATION_KEY:
            port_types = custom_ports
            potential_port_types = NODE_PORTS.get(node_type, {}).get(connections, [])
        else:
            port_types = NODE_PORTS.get(node_type, {}).get(connections, [])

        if len(error_message_list) > 0:
            if end == 'from':
                continue
            else:
                return '. '.join(error_message_list)

        if edge_type not in port_types:
            if node_type == FACILITY_KEY and (port_id is not None or ('link' in port_types and end == 'to')):
                # only add error message if port_id exists. Already handle missing port id above
                error_message_list.append(
                    f"Cannot connect {str_to_display(edge_type,'_')} {connection} edge to this port")
            elif node_type == CUSTOM_CALCULATION_KEY and edge_type in potential_port_types:
                error_message_list.append(
                    f"{str_to_display(edge_type,'_')} {str_to_display(connection)} is not assigned for this node")
            else:
                error_message_list.append(' '.join([
                    f"{str_to_display(node_type,'_')} node does not support {str_to_display(edge_type,'_')}",
                    f'{connection} edge'
                ]))

    return '. '.join(error_message_list)


def network_edges_import(edge_df: pd.DataFrame, one_col_dict: dict, node_id_dict: dict, port_id_dict: dict,
                         custom_node_ports_dict: dict, error_list: list, fac_id_dict: dict,
                         fac_in_net_df: pd.DataFrame) -> list:
    """ Transforms a DataFrame for all edges to be imported in a given network into a list of dicts for each edge.
    Function is called in carbon_import.
    """
    edges = []
    # get list of edges to import
    edge_id_field = ColumnName.edge_id.value
    edge_list = edge_df[edge_id_field].unique()
    facility_name_to_doc_map = fac_in_net_df.set_index('name').to_dict('index')
    for edge in edge_list:
        if edge is None:
            one_edge_df = edge_df.loc[edge_df[edge_id_field].isnull(), :]
            log_missing_field(
                error_list=error_list,
                input_df=one_edge_df,
                field=edge_id_field,
            )
        else:
            one_edge_df = edge_df.loc[edge_df[edge_id_field] == edge, :]
        n_rows = one_edge_df.shape[0]
        first_row = one_edge_df.iloc[0, :]
        first_row_dict = dict(first_row)
        row_index = int(first_row.name)
        edge_type = selection_validation(
            error_list=error_list,
            input_dict=first_row_dict,
            input_key=ColumnName.edge_type.value,
            options=EDGE_OPTIONS[NETWORK_KEY],
            row_index=row_index,
        )
        # name = first_row[ColumnName.edge_name.value] name field is not set in network edges right now

        from_node = first_row[ColumnName.from_node_id.value]
        from_type = one_col_dict.get(from_node)

        to_node = first_row[ColumnName.to_node_id.value]
        to_type = one_col_dict.get(to_node)
        to_port_id = port_id_dict.get(first_row[ColumnName.to_port_id.value])
        from_port_id = port_id_dict.get(first_row[ColumnName.from_port_id.value])
        if edge_type:
            from_custom_ports = custom_node_ports_dict.get(from_node, {}).get('outputs', [])
            to_custom_ports = custom_node_ports_dict.get(to_node, {}).get('inputs', [])
            if to_custom_ports == []:
                to_custom_ports = ['link']
            error_message = _check_edge_type(edge_type, facility_name_to_doc_map, fac_id_dict, from_node, from_type,
                                             to_node, to_type, to_port_id, from_port_id, from_custom_ports,
                                             to_custom_ports)
            if error_message:
                error_list += [{'error_message': error_message, 'row_index': int(first_row.name)}]

        if edge_type == 'development':
            document = deepcopy(NetworkDefaults.dev_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.update({'id': str(uuid.uuid4())})
            document.pop('description')  # 'description' not included on development edges
            # document['name'] = str_or_none(name)
        elif edge_type == 'link':
            to_facility_name = fac_id_dict.get(to_node)
            document = deepcopy(NetworkDefaults.link_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.update({
                'id': str(uuid.uuid4()),
                'fromHandle': edge_type,
                'toHandle': edge_type,
                'toFacilityObjectId': str(facility_name_to_doc_map.get(to_facility_name, {}).get('_id', ''))
            })
            document.pop('description')  # 'description' not included on link edges
            if to_type == CUSTOM_CALCULATION_KEY:
                document.pop('toFacilityObjectId')
            # document['name'] = str_or_none(name)
        else:
            document = deepcopy(NetworkDefaults.stream_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.update({
                'id':
                str(uuid.uuid4()),
                'toHandle':
                to_port_id
                if to_port_id else edge_type if to_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type),
                'fromHandle':
                from_port_id
                if from_port_id else edge_type if from_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type)
            })
            # document['name'] = str_or_none(name)
            criteria = selection_validation(
                error_list=error_list,
                input_dict=first_row_dict,
                input_key=ColumnName.criteria.value,
                options=['flat', 'dates'],
                row_index=row_index,
            )
            document['params']['time_series']['criteria'] = criteria_map_dict_rev.get(criteria)
            if criteria:
                document['params']['time_series']['rows'] = [
                    _get_time_series_row(error_list, first_row, row_index, criteria)
                ]
                if criteria == 'flat':
                    if n_rows > 1:
                        log_duplicated_row(
                            error_list=error_list,
                            input_df=one_edge_df.tail(-1),
                            field='flat',
                            field_type='flat',
                        )
                elif criteria == 'dates' and n_rows > 1:
                    for idx, row in one_edge_df.iloc[1:].iterrows():
                        row_doc = _get_time_series_row(error_list, row, idx, criteria)
                        document['params']['time_series']['rows'].append(row_doc)

        edges.append(document)

    return edges


def _get_time_series_row(error_list: list, row: pd.Series, row_index: int, criteria: str) -> dict:
    """ Helper function for network_edges_import. Returns a dict representing a single row of the time series.
    """
    row_dict = dict(row)
    one_row = {}
    if criteria == 'dates':
        date_str = date_validation(
            error_list=error_list,
            input_dict=row_dict,
            input_key=ColumnName.period.value,
            row_index=row_index,
        )
        one_row['period'] = date_str_format_change(date_str) if date_str else date_str
    elif criteria == 'flat':
        one_row['period'] = 'Flat'
    one_row['allocation'] = number_validation(
        error_list=error_list,
        input_dict=row_dict,
        input_key=ColumnName.allocation.value,
        row_index=row_index,
    )
    return one_row
