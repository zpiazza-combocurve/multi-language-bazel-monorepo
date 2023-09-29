import pandas as pd
import uuid
from bson import ObjectId
from copy import deepcopy
from typing import Optional
from api.cc_to_cc.file_headers import get_assumption_empty_row, ColumnName
from api.cc_to_cc.helper import (generate_export_id, str_to_display, selection_validation, date_validation,
                                 number_validation, str_or_none, common_edge_export, common_edge_import,
                                 date_str_format_change, log_missing_field, log_duplicated_row, add_user_name_to_export,
                                 standard_date_str)
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT
from combocurve.science.network_module.default_network_assumptions import NetworkDefaults
from combocurve.science.network_module.nodes.shared.utils import (FACILITY_KEY, FACILITY_EDGES_KEY,
                                                                  CUSTOM_CALCULATION_KEY, NODE_OPTIONS, NODE_PORTS,
                                                                  EDGE_OPTIONS)

criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}


def facility_export(model: dict, facility_rows: list, model_id_dict: dict) -> tuple[list, dict, str]:
    """ Writes each node in a facility document to a dict and appends it to a list of dicts that will be written to an
    Excel sheet. Function is called in carbon_export.
    """
    export_rows = []
    node_id_dict = {}  # internal_node_id: export_node_id {'node':'{facility_name}_{node_type}_{node_index}'
    node_index = 1
    facility_name = model['name']
    nodes = model['nodes']
    common_row = get_assumption_empty_row(FACILITY_KEY)
    created_at_str = model[ColumnName.createdAt.name].strftime(standard_date_str)
    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)
    common_row.update({
        ColumnName.createdAt.value: created_at_str,
        ColumnName.updatedAt.value: last_update_str,
        ColumnName.facility_name.value: facility_name,
    })
    add_user_name_to_export(common_row, model)

    for node in nodes:
        node_type = node['type'].replace('_', ' ')  # replace underscores with spaces for legibility in model IDs
        export_node_id = generate_export_id(facility_name, node_type, str(node_index))
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

    return export_rows, node_id_dict, facility_name


def facility_edges_export(model: dict, facility_edge_rows: list, node_id_dict: dict) -> tuple[list, dict]:
    """ Writes each edge in a facility document to a dict and appends it to a list of dicts that will be written to an
    Excel sheet. Function is called in carbon_export.
    """
    export_rows = []
    edge_id_dict = {}
    edge_index = 1
    facility_name = model['name']
    edges = model['inputs'] + model['edges'] + model['outputs']
    common_row = get_assumption_empty_row(FACILITY_EDGES_KEY)
    common_row.update({ColumnName.facility_name.value: facility_name})

    for edge in edges:
        edge_type = edge['by']
        edge_id = generate_export_id(facility_name, edge_type, str(edge_index))
        edge_row = deepcopy(common_row)
        edge_row.update({
            ColumnName.edge_id.value: edge_id,
            ColumnName.edge_name.value: edge.get('name', ''),
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
                export_rows.append(one_edge_row)
        else:
            # edge is an input or output edge
            # update the edge_id_dict with the mapping of the uuid to the human readable edge id
            edge_id_dict.update({edge['id']: edge_id})  # {uuid: '{facility name}_{type}_{edge_index}'}
            export_rows.append(edge_row)

        edge_index += 1

    return export_rows, edge_id_dict


def facility_import(facility_name: str, fac_in_net_df: pd.DataFrame, shape_multipliers: dict, error_list: list,
                    row_index: int) -> tuple[dict, str, Optional[ObjectId]]:
    """ Creates a nested dict for a facility node if the facility model exists in the project. This is called when
    importing a network in carbon_import and a facility node is included in the network. Function is called in
    carbon_import.
    """
    document = deepcopy(getattr(NetworkDefaults, FACILITY_KEY))
    facility_df = fac_in_net_df.loc[fac_in_net_df['name'] == facility_name, '_id']
    if facility_df.empty:
        # facility not in project
        error_list.append({
            'error_message': f'Facility {facility_name} did not import successfully or not in project',
            'row_index': row_index,
        })
        facility_id = None
    else:
        facility_id = ObjectId(facility_df.values[0])
    # description = first_row[ColumnName.description.value] description field is not set in facility nodes right now
    # document['description'] = description
    document.update({
        'id': str(uuid.uuid4()),
        'name': facility_name,
        'type': FACILITY_KEY,
        'params': {
            'facility_id': facility_id,
        },
    })
    for axis in shape_multipliers:
        document['shape']['position'][axis] *= shape_multipliers[axis]

    return document, document['id'], facility_id


def _facility_check_edge_type(edge_type: str, from_type: Optional[str], to_type: Optional[str], from_custom_ports: list,
                              to_custom_ports: list) -> str:
    """ Helper function for facility_edges_import. Checks if the edge type is supported by the from and to nodes.
    """
    error_message_list = []
    from_to_keys = {
        'from': {
            'node_type': from_type,
            'connection': 'output',
            'custom_ports': from_custom_ports,
        },
        'to': {
            'node_type': to_type,
            'connection': 'input',
            'custom_ports': to_custom_ports,
        },
    }

    for end in ['from', 'to']:
        node_type = from_to_keys[end]['node_type']
        connection = from_to_keys[end]['connection']
        connections = connection + 's'
        custom_ports = from_to_keys[end]['custom_ports']
        if node_type not in [*NODE_OPTIONS[FACILITY_KEY], 'input', 'output']:
            if node_type is None:
                error_message_list.append(f'Wrong or missing {str_to_display(end)} Node ID')
            else:
                error_message_list += [f"{str_to_display(node_type,'_')} node not supported in Facility"]
        if node_type == CUSTOM_CALCULATION_KEY:
            port_types = custom_ports
            potential_port_types = NODE_PORTS.get(node_type, {}).get(connections, [])
        else:
            port_types = NODE_PORTS.get(node_type, {}).get(connections, [])
        if edge_type not in port_types and node_type is not None:
            if node_type == CUSTOM_CALCULATION_KEY and edge_type in potential_port_types:
                error_message_list.append(
                    f"{str_to_display(edge_type,'_')} {str_to_display(connection)} is not assigned for this node")
            else:
                error_message_list.append(' '.join([
                    f"{str_to_display(node_type,'_')} node does not support {str_to_display(edge_type,'_')}",
                    f'{connection} edge'
                ]))

    return '. '.join(error_message_list)


def facility_edges_import(edge_df: pd.DataFrame, one_col_dict: dict, node_id_dict: dict, port_id_dict: dict,
                          custom_node_ports_dict: dict, error_list: list) -> tuple[list, list, list, dict]:
    """ Transforms a DataFrame for all edges to be imported in a given facility into a list of dicts for each edge.
    Depending on the edge type, appends each on to the list of edges, inputs, or outputs. Also updates the port_id_dict
    with a mapping of the uuid to the human readable port id for any input or output edges. Function is called in
    carbon_import.
    """
    edges = []
    inputs = []
    outputs = []
    input_edge_shape_multipliers = {'x': 1, 'y': 1}
    output_edge_shape_multipliers = {'x': 1, 'y': 1}
    # get list of edges to import
    edge_id_field = ColumnName.edge_id.value
    edge_list = edge_df[edge_id_field].unique()
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
        edge_id = first_row[edge_id_field]
        name = first_row[ColumnName.edge_name.value]
        edge_type = selection_validation(
            error_list=error_list,
            input_dict=first_row_dict,
            input_key=ColumnName.edge_type.value,
            options=EDGE_OPTIONS[FACILITY_KEY],
            row_index=row_index,
        )
        to_node = first_row[ColumnName.to_node_id.value]
        from_node = first_row[ColumnName.from_node_id.value]
        from_type = one_col_dict.get(from_node)

        to_node = first_row[ColumnName.to_node_id.value]
        to_type = one_col_dict.get(to_node)
        # check if input or output edge
        if not from_node:
            # input edge
            from_type = 'input'
            document = deepcopy(NetworkDefaults.input_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.pop('from')  # 'from' not included on input edges
            document.pop('description')  # 'description' not included on input edges
            document.update({
                'id': str(uuid.uuid4()),
                'toHandle': edge_type if to_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type),
                'name': str_or_none(name),
            })
            for axis in input_edge_shape_multipliers:
                document['shape']['vertices'][0][axis] *= input_edge_shape_multipliers[axis]
            inputs.append(document)
            port_id_dict.update({edge_id: document['id']})
            input_edge_shape_multipliers['y'] += 1
        elif not to_node:
            # output edge
            to_type = 'output'
            document = deepcopy(NetworkDefaults.output_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.pop('to')  # 'to' not included on output edges
            document.pop('description')  # 'description' not included on output edges
            document.update({
                'id':
                str(uuid.uuid4()),
                'fromHandle':
                edge_type if from_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type),
                'name':
                str_or_none(name),
            })
            for axis in output_edge_shape_multipliers:
                document['shape']['vertices'][0][axis] *= output_edge_shape_multipliers[axis]
            outputs.append(document)
            port_id_dict.update({edge_id: document['id']})
            output_edge_shape_multipliers['y'] += 1
        else:
            document = deepcopy(NetworkDefaults.stream_edge)
            # update document with common edge fields
            common_edge_import(node_id_dict, first_row, document)
            document.update({
                'id':
                str(uuid.uuid4()),
                'name':
                str_or_none(name),
                'toHandle':
                edge_type if to_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type),
                'fromHandle':
                edge_type if from_type != CUSTOM_CALCULATION_KEY else str_to_display(edge_type),
            })
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
        if edge_type:
            # check edge type is valid
            from_custom_ports = custom_node_ports_dict.get(from_node, {}).get('outputs', [])
            to_custom_ports = custom_node_ports_dict.get(to_node, {}).get('inputs', [])
            error_message = _facility_check_edge_type(edge_type, from_type, to_type, from_custom_ports, to_custom_ports)
            if error_message:
                error_list += [{'error_message': error_message, 'row_index': int(first_row.name)}]

    return edges, inputs, outputs, port_id_dict


def _get_time_series_row(error_list: list, row: pd.Series, row_index: int, criteria: str) -> dict:
    """ Helper function for facility_edges_import. Returns a dict representing a single row of the time series.
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
