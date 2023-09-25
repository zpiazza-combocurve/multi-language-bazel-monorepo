import datetime
import numpy as np
import pandas as pd
import polars as pl
from bson import ObjectId
from collections import defaultdict
from copy import deepcopy
from combocurve.shared.parquet_types import build_pyarrow_schema
from combocurve.science.network_module.network import FIRST_PRODUCTION_DATE_STR, CUT_OFF_DATE_STR
from combocurve.science.network_module.nodes.node_class_map import FACILITY_ONLY_NODES
from combocurve.science.network_module.facility_emission import (facility_emission, make_virtual_facility_id,
                                                                 get_node_id_from_virtual_facility_id)
from combocurve.science.network_module.nodes.shared.helper import generate_edges_by_from
from combocurve.services.carbon.carbon_output_helper import (add_row_id_inserted_at_to_df,
                                                             append_run_and_row_info_to_df, append_unit_and_scope_to_df,
                                                             process_date_cols)
from combocurve.services.carbon.carbon_schemas import GHG_REPORT_SCHEMA, GHG_WELL_HEADER_SCHEMA, MONTHLY_POLARDF_SCHEMA
from combocurve.services.econ.econ_output_service import (get_schema, process_output_type, FILE_TYPE, get_header_rows,
                                                          get_well_header_mongo_names)

GHG_REPORT_TABLE_NAME = 'ghg_report'
GHG_WELL_HEADER_TABLE_NAME = 'ghg_wells'


def _keep_relevant_wells_in_well_group(assignment_df, networks_map):
    '''
    Parameters
        assignment_df: has all combo_name and incremental_index
        networks_map: key by network id
    Returns:
        Nested Dict: {'combo_name': {'network_id': {**network_data}}}, where well_group in network_data['nodes'], will
                     have one more field 'well_incremental_index' that has wells + incremental_index that's in
    '''
    unique_combo_names = np.unique(assignment_df['combo_name'])
    combo_networks_map = {}
    for combo_name in unique_combo_names:
        combo_assignment_df = assignment_df.loc[assignment_df['combo_name'] == combo_name, :]
        valid_df_networks = combo_assignment_df.loc[
            combo_assignment_df.apply(lambda x: type(x['network']) is ObjectId, axis=1), 'network']
        relavant_network_ids = np.unique(valid_df_networks)

        ## {network_id: {well_id: [incremental_id]}}
        this_combo_network_well_incremental_index = defaultdict(lambda: defaultdict(list))

        for i in range(combo_assignment_df.shape[0]):
            this_row = combo_assignment_df.iloc[i, :]
            well_id = this_row['well']
            incremental_index = this_row['incremental_index']
            network_id = this_row['network']
            if network_id:
                this_combo_network_well_incremental_index[network_id][well_id] += [incremental_index]

        this_networks_map = {}

        for network_id in relavant_network_ids:
            network_data = deepcopy(networks_map[network_id])
            this_well_id_incremental_index_map = this_combo_network_well_incremental_index[network_id]
            assignment_well_id_set = set(this_well_id_incremental_index_map)
            for node in network_data['nodes']:
                if node['type'] == 'well_group':
                    overlapping_well_set = set(node['params']['wells']).intersection(assignment_well_id_set)
                    node['params']['well_incremental_index'] = []
                    for well in overlapping_well_set:
                        node['params']['well_incremental_index'] += [
                            (well, incremental_index) for incremental_index in this_well_id_incremental_index_map[well]
                        ]

            this_networks_map[network_id] = network_data

        combo_networks_map[combo_name] = this_networks_map

    return combo_networks_map


def _check_custom_node_has_no_input(custom_calculation_node):
    num_custom_inputs = sum(list(map(lambda x: x['assign'], custom_calculation_node['params']['inputs'])))
    return num_custom_inputs == 0


def _get_facility_well_group_connection(network_data):
    ret = {}
    cache = {}
    well_group_datas_map = {}

    edges_by_from = generate_edges_by_from(network_data['edges'])

    def check_if_connected(node_id1, node_id2):
        if node_id1 == node_id2:
            return True
        this_key = (node_id1, node_id2)
        if this_key in cache:
            return cache[this_key]

        edges_from_1 = edges_by_from[node_id1]
        for edge in edges_from_1:
            to = edge['to']
            if check_if_connected(to, node_id2):
                cache[this_key] = True
                return True

        cache[this_key] = False
        return False

    nodes_data = network_data['nodes']
    for node_data in nodes_data:
        node_id = node_data['id']
        node_type = node_data['type']
        if node_type == 'facility':
            facility_id = node_id
            ret[facility_id] = {
                'devices': [
                    facility_node for facility_node in node_data['params']['nodes']
                    if (facility_node['type'] in FACILITY_ONLY_NODES) or
                    (facility_node['type'] == 'custom_calculation' and _check_custom_node_has_no_input(facility_node))
                ],
                'well_groups': []
            }
        elif node_type == 'custom_calculation':
            if _check_custom_node_has_no_input(node_data):
                facility_id = make_virtual_facility_id(node_data)
                ret[facility_id] = {'devices': [node_data], 'well_groups': []}
        elif node_type == 'well_group':
            well_group_datas_map[node_id] = node_data

    for facility_id in ret:
        for well_group_id in well_group_datas_map:
            if check_if_connected(well_group_id, facility_id) or check_if_connected(
                    well_group_id, get_node_id_from_virtual_facility_id(facility_id)):
                ret[facility_id]['well_groups'] += [well_group_datas_map[well_group_id]]

    return ret


class CarbonService(object):
    '''
    Service for deterministic forecasts. Entry point is 'forecast.'

    Dependencies:
    - Services: production_service, match_eur_service (deprecated)
    - Collections: deterministic_forecast_datas_collection
    '''
    def __init__(self, context):
        self.context = context
        self.ghg_report_schema = get_schema(GHG_REPORT_SCHEMA)
        self.ghg_well_header_schema = get_schema(GHG_WELL_HEADER_SCHEMA)
        self.ghg_well_header_fields = dict(
            zip(list(self.ghg_well_header_schema.keys()), get_well_header_mongo_names(self.ghg_well_header_schema)))

    ## calculation
    def batch_ghg(self, run, params):
        batch_outputs = self.context.econ_service.batch_econ(run, params)
        return batch_outputs

    ## queries
    def _get_report_table_path(self):
        dataset_id = self.context.econ_output_service.get_dataset()
        return self.context.big_query_client.table_path(dataset_id, GHG_REPORT_TABLE_NAME)

    def _get_header_table_path(self):
        dataset_id = self.context.econ_output_service.get_dataset()
        return self.context.big_query_client.table_path(dataset_id, GHG_WELL_HEADER_TABLE_NAME)

    def get_run(self, run_id):
        return self.context.ghg_runs_collection.find_one({'_id': ObjectId(run_id)})

    def get_ghg_assigments(self, ghg_run):
        return self.context.scenario_well_assignments_service.get_assignments_with_combos(
            assignment_ids=ghg_run['scenarioWellAssignments'],
            project_id=None,
            assumption_keys=['network'],
            combos=ghg_run['outputParams']['combos'],
        )

    def convert_to_python_run(self, run):
        return {
            'run_date': run['runDate'],
            'run_at': run['createdAt'],
            'run_id': str(run['_id']),
            'project_id': str(run['project']),
            'user_id': str(run['user']),
            'scenario_id': str(run['scenario']),
        }

    def get_networks_map(self, assignment_df):
        """ Calls get_networks_list, which creates a map (dict) of network model documents with facility and fluid model
        documents from an assignments_df.

        Arguments:
        assignment_df (DataFrame): contains columns for each model assigned in scenario table and rows for each well.
            For this function only the 'network' column is necessary.

        Returns:
        networks_map (dict) of network ids (keys) and carbon network documents (values) from the networks_collection
            Any facilites or fluid models referenced in a network model are also replaced with the documents from the
            facilities_collection and 'assumptions_collection', respectively.
        """
        if 'network' not in assignment_df.columns:
            return {}

        network_assignments = assignment_df['network']
        valid_mask = assignment_df['network'] != 'not_valid'
        if valid_mask.sum() == 0:
            return {}

        unique_network_ids = np.unique(network_assignments[valid_mask]).tolist()
        network_list = self.get_networks_list(unique_network_ids)
        return {v['_id']: v for v in network_list}

    def get_networks_list(self, network_ids: list) -> dict:
        """ Creates a map (dict) of network model documents with facility and fluid model documents

        Arguments:
        network_ids (list): unique list of network_ids

        Returns:
        Map (dict) of network model ids (keys) and network model documents (values) from the networks_collection
            Any facilites or fluid models referenced in a network model are also replaced with the documents from the
            facilities_collection and 'assumptions_collection', respectively.
        """
        network_list = list(self.context.networks_collection.find({'_id': {'$in': network_ids}}))
        facility_set = set()
        fluid_model_id_set = set()
        users_set = set()
        for network in network_list:
            # get the unique fluid model, facility ids, and users from the network model nodes (not facility nodes)
            fluid_model_id_set.update(network.get('fluidModels', []))
            facility_set.update(network.get('facilities', []))
            for user in ['createdBy', 'updatedBy']:
                if user in network:
                    users_set.add(network[user])

        if len(facility_set):
            facilities = list(self.context.facilities_collection.find({'_id': {'$in': list(facility_set)}}))
            facilities_map = defaultdict(dict)
            for facility in facilities:
                facilities_map[facility['_id']] = facility
                # add any fluid model from nodes in facilities and the users
                fluid_model_id_set.update(facility.get('fluidModels', []))
                for user in ['createdBy', 'updatedBy']:
                    if user in facility:
                        users_set.add(facility[user])
            # now that all the unique fluid models and users are identified, get their maps
            fluid_model_map = self._get_fluid_model_map(fluid_model_id_set)
            users_map = self._get_users_map(users_set)
            # assign fluid models to child nodes in facilities and users to the facility
            for facility_id, facility in facilities_map.items():
                self._update_user_fields(facility, users_map)
                for child_node in facilities_map[facility_id].get('nodes', []):
                    child_node['params'] = self._assign_fluid_model(child_node, fluid_model_map)
            for network in network_list:
                self._update_user_fields(network, users_map)
                for node in network.get('nodes', []):
                    # assign fluid model documents to nodes in the network model
                    node['params'] = self._assign_fluid_model(node, fluid_model_map)
                    if node['type'] == 'facility':
                        facility_id = node['params']['facility_id']
                        node['params'] = {**node['params'], **facilities_map[facility_id]}

        else:
            # if there aren't facilities, get the fluid model and user maps and assign them to network model nodes
            fluid_model_map = self._get_fluid_model_map(fluid_model_id_set)
            users_map = self._get_users_map(users_set)
            for network in network_list:
                self._update_user_fields(network, users_map)
                for node in network.get('nodes', []):
                    node['params'] = self._assign_fluid_model(node, fluid_model_map)
        return network_list

    def _get_fluid_model_map(self, fluid_model_id_set):
        """ Create a map of fluid model documents from a set of fluid model ids

        Arguments:
        fluid_model_id_set (set): set of fluid model ids in the assignment_df

        Returns:
        Map (dict) of fluid model ids (keys) and fluid model documents (values) from the assumptions_collection
        """
        fluid_models = list(self.context.assumptions_collection.find({'_id': {'$in': list(fluid_model_id_set)}}))
        return {fluid_model['_id']: fluid_model for fluid_model in fluid_models}

    def _get_users_map(self, user_id_set: set) -> dict:
        """ Create a map of user documents from a set of user ids

        Arguments:
        user_id_set (set): set of user ids in the network and facility documents

        Returns:
        Map (dict) of user ids (keys) and user names (values) from the users_collection
        """
        users = list(
            self.context.users_collection.find({'_id': {
                '$in': list(user_id_set)
            }}, {
                'firstName': True,
                'lastName': True
            }))
        return {user['_id']: user for user in users}

    def _assign_fluid_model(self, node, fluid_model_map):
        """ Update the 'fluid_model' param in the node['params'] to contain the fluid model document

        Arguments:
        node (dict): contains a 'params' key that may or may not contain a 'fluid_model'
        fluid_model_map (dict): map (dict) of fluid model ids (keys) and fluid model documents (values). One document
            will be added to nodes that have a fluid model assigned

        Returns:
        node['params'] (dict): if the node['params'] contained a 'fluid_model' assignment, it is updated with the
            fluid model document. Otherwise it returns the original node['params']
        """
        # TODO update 'output_gas_fluid_model' to 'fluid_model' for consistency
        if node['type'] == 'oil_tank' and node['params'].get('output_gas_fluid_model', None):
            fluid_model_id = node['params']['output_gas_fluid_model']
            node['params']['output_gas_fluid_model'] = fluid_model_map.get(fluid_model_id, None)
        # some nodes do not have params (i.e. associated_gas or liquids_unloading),
        # some have params but not a fluid_model (i.e. flare), and some have a fluid_model param that isn't assigned
        # so check if it is relevant before updating the assignment
        elif node['params'] and node['params'].get('fluid_model', None):
            fluid_model_id = node['params']['fluid_model']
            node['params']['fluid_model'] = fluid_model_map.get(fluid_model_id, None)
        return node['params']

    def _update_user_fields(self, doc: dict, users_map: dict) -> None:
        """ Update the 'createdBy' and 'updatedBy' (if it exists) fields in the network or facility doc to contain the
        user's first and last names. This is used when exporting the network or facility to Excel.

        Arguments:
        doc (dict): contains a 'createdBy' field with an ObjectId and may also contain a 'updatedBy' field
        users_map (dict): maps user ids (keys) to a dict with fields 'firstName' and 'lastName'.

        Returns:
        None: doc is updated in place
        """
        for user in ['createdBy', 'updatedBy']:
            if user in doc:
                doc.update({user: {'id': doc[user], **users_map[doc[user]]}})

    ## prepare output data
    # [{'combo': {'name': '123'}, 'outputs': [{'incremental_index': 0, 'emission_nodes': []}]}]
    def _get_monthly_df(self, run: dict, batch_outputs: list[dict]) -> pl.DataFrame:
        write_list = []
        for combo in batch_outputs:
            combo_name = combo['combo']['name']
            for output in combo['outputs']:
                incremental_index = output['incremental_index']
                emission_data = output.get('emission_nodes', [])
                for row in emission_data:
                    row['combo_name'] = combo_name
                    row['incremental_index'] = incremental_index

                write_list += emission_data

        if len(write_list) > 0:
            monthly_df = pl.from_dicts(write_list, schema=MONTHLY_POLARDF_SCHEMA)
        else:
            monthly_df = pl.DataFrame(columns=MONTHLY_POLARDF_SCHEMA)
        monthly_df = append_run_and_row_info_to_df(monthly_df, run)
        monthly_df = append_unit_and_scope_to_df(monthly_df)
        return monthly_df

    def _get_well_header_df(self, batch_outputs, run_data):
        header_rows = pd.DataFrame(get_header_rows(batch_outputs, run_data,
                                                   self.ghg_well_header_fields)).drop(columns=['run_date'])

        add_row_id_inserted_at_to_df(header_rows)
        header_rows['run_at'] = run_data['run_at']
        return header_rows

    def update_run_status(self, run_id_str):
        run_id = ObjectId(run_id_str)
        update = {'$set': {'status': 'complete'}}
        self.context.ghg_runs_collection.update_one({'_id': run_id}, update)

    #### cloud functions
    ## batch upload
    def write_batch_files_to_cloud(self, run: dict, batch_index: int, batch_outputs: list[dict]) -> pl.DataFrame:
        '''
            write carbon results to cloud storage
            used in batch(async) carbon run or parallel run
        '''
        run_data = self.convert_to_python_run(run)
        # batch_index = params['batch_index'] get batch_index from
        monthly_df = self.write_monthly_as_file(run, batch_index, batch_outputs)
        self.write_well_header_as_file(batch_outputs, batch_index, run_data)
        return monthly_df

    def write_monthly_as_file(self, run: dict, batch_index: int, batch_outputs: list[dict]) -> pl.DataFrame:
        monthly_pldf = self._get_monthly_df(run, batch_outputs)
        if monthly_pldf.shape[0]:
            monthly_pddf_processed = process_date_cols(self.ghg_report_schema, monthly_pldf)
            pa_schema = build_pyarrow_schema(self.ghg_report_schema, monthly_pddf_processed)

            run_id = str(run['_id'])
            file_name = 'ghg-runs/{}/monthly-{}/{:08d}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
            self.context.econ_output_service.upload_parquet_to_batch_bucket(file_name, monthly_pddf_processed,
                                                                            pa_schema)
        return monthly_pldf

    def write_facility_monthly_as_file(self, run: dict, batch_index: int, facility_df: pd.DataFrame):
        pa_schema = build_pyarrow_schema(self.ghg_report_schema, facility_df)
        run_id = str(run['_id'])
        file_name = 'ghg-runs/{}/monthly-{}/{:08d}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.context.econ_output_service.upload_parquet_to_batch_bucket(file_name, facility_df, pa_schema)

    def write_well_header_as_file(self, batch_outputs, batch_index, run_data):
        '''
            Inserts a row for each well in this batch to the econ_one_liner table in BigQuery.
            Each combo will have the same wells, we only need to write the WH once for multiple combo.
            The incremental well will have the same WH with the bsae well, we don't need to write it
            if we already did for the base well.
        '''
        write_to_parquet = True
        header_rows = self._get_well_header_df(batch_outputs, run_data)
        header_rows = header_rows.apply(
            lambda col: process_output_type(col, self.ghg_well_header_schema[col.name], write_to_parquet))
        pa_schema = build_pyarrow_schema(self.ghg_well_header_schema, header_rows)

        run_id = run_data['run_id']
        file_name = 'ghg-runs/{}/well-header-{}/{:08d}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.context.econ_output_service.upload_df_to_batch_bucket(file_name, header_rows, pa_schema)

    ## clean up aggregation
    def load_batch_result_to_bigquery(self, run_id_str):
        '''
        load results of a batch to bigquery table from parquet file on gcs
        deletion of the batch files is handled by some retention / life-clycle policy
        '''
        ## load report file to bigquery
        self._load_file_to_bigquery(run_id_str, f'ghg-runs/{run_id_str}/monthly-{FILE_TYPE}',
                                    self._get_report_table_path())
        ## load well header file to bigquery
        self._load_file_to_bigquery(run_id_str, f'ghg-runs/{run_id_str}/well-header-{FILE_TYPE}',
                                    self._get_header_table_path())

        ### update facility_device_values
        # self._get_facility_device_values(run_id_str)

        ## update run status
        self.update_run_status(run_id_str)

    def _load_file_to_bigquery(self, run_id_str, folder_path, table_path):
        bucket_name = self.context.tenant_info['batch_storage_bucket']
        uri = f'gs://{bucket_name}/{folder_path}/*'
        table = self.context.big_query_client.get_table(table_path)
        self.context.big_query_client.load_batch_result_from_storage(table_path, table.schema, uri)

    def _prepare_facilities(self, ghg_run: dict) -> dict:
        # get_ghg_assignments returns tuple with 2 collections (flat_assignments, project_headers_data)
        # but only first collection is needed
        assignments, _ = self.get_ghg_assigments(ghg_run)
        assignment_df = pd.DataFrame(assignments).fillna('not_valid')
        ## get network models with facility_models and fluid models
        raw_networks_map = self.get_networks_map(assignment_df)

        ## get well_group wells per combo, 2 incremental_index will share the same node
        networks_map = _keep_relevant_wells_in_well_group(assignment_df, raw_networks_map)

        ## narrow down to facility_model with facility_devices

        ## get well_groups that's connected to those facilitys, {facility_id: {devices, well_groups}}
        facility_devices_well_groups_per_combo_per_network = {}

        for combo_name, combo_network_maps in networks_map.items():
            facility_devices_well_groups_per_combo_per_network[combo_name] = {}
            for network_id, network_data in combo_network_maps.items():
                facility_devices_well_groups_per_combo_per_network[combo_name][
                    network_id] = _get_facility_well_group_connection(network_data)

        return facility_devices_well_groups_per_combo_per_network

    def facility_emissions_pipeline(self, ghg_run: dict, batch_df_list: list, n_threads: int) -> list[pd.DataFrame]:
        # once
        facility_devices_well_groups_per_combo_per_network = self._prepare_facilities(ghg_run)

        facility_dfs: list = facility_emission(facility_devices_well_groups_per_combo_per_network, batch_df_list,
                                               n_threads)

        # prepare for storage
        processed_facility_dfs: list = []
        for fac_df in facility_dfs:
            if fac_df is not None and fac_df.shape[0] > 0:
                fac_df = append_run_and_row_info_to_df(fac_df, ghg_run)
                fac_df = append_unit_and_scope_to_df(fac_df)
                facility_pddf_processed: pd.DataFrame = process_date_cols(self.ghg_report_schema, fac_df)
                processed_facility_dfs.append(facility_pddf_processed)
        return processed_facility_dfs

    ## export
    def download_ghg_run_to_csv(self, params):
        run_id = str(params['ghgRun'])
        user_id = str(params['userId'])
        project_id = str(params['project'])

        # timeZone = params['timeZone']

        run = self.get_run(run_id)
        run_at = str(run['createdAt'].date())

        query = ' '.join([
            'SELECT', 'wells.api14, wells.inpt_id, wells.chosen_id, wells.well_name, wells.well_number,',
            'wells.state, wells.county, wells.current_operator, wells.current_operator_alias, wells.type_curve_area,',
            'ghg_report.combo_name, ghg_report.incremental_index,',
            'ghg_report.node_type, ghg_report.emission_type, ghg_report.product_type, ghg_report.product,',
            'ghg_report.date, SUM(ghg_report.value), ghg_report.unit, ghg_report.scope',
            f'FROM `{self._get_report_table_path()}` as ghg_report', 'LEFT JOIN', '(',
            'SELECT run_id, run_at, well_id, api14, inpt_id, chosen_id, well_name, well_number, state, county,',
            'current_operator, current_operator_alias, type_curve_area from', f' `{self._get_header_table_path()}`',
            ') as wells', 'USING (run_id, run_at, well_id)', f'WHERE DATE(run_at) = "{run_at}" AND run_id = "{run_id}"',
            f'AND product NOT IN ("{FIRST_PRODUCTION_DATE_STR}","{CUT_OFF_DATE_STR}")',
            'GROUP BY wells.api14, wells.inpt_id, wells.chosen_id, wells.well_name, wells.well_number, wells.state,',
            'wells.county, wells.current_operator, wells.current_operator_alias, wells.type_curve_area,',
            'ghg_report.combo_name, ghg_report.incremental_index, ghg_report.node_type, ghg_report.emission_type,',
            'ghg_report.product_type, ghg_report.product, ghg_report.date, ghg_report.unit, ghg_report.scope',
            'ORDER BY combo_name, chosen_id, incremental_index, node_type, emission_type, product_type, product, date'
        ])
        well_labels = [
            'API 14', 'INPT ID', 'Chosen ID', 'Well Name', 'Well Number', 'State', 'County', 'Current Operator',
            'Current Operator Alias', 'Type Curve Area'
        ]
        report_labels = [
            'Combo Name', 'Incremental Id', 'Node Type', 'Emission Type', 'Product Type', 'Product', 'Date', 'Value',
            'Unit', 'Scope'
        ]
        all_header_labels = well_labels + report_labels
        # [field['name'] for field in GHG_REPORT_SCHEMA]

        run_date = datetime.datetime.now()
        file_extension = 'csv'
        query_result_table_name = f'ghg-download-{run_date.isoformat()}-{user_id}.{file_extension}'

        gcp_name = self.context.econ_file_service.load_bq_to_storage(all_header_labels, query, query_result_table_name)
        self.context.file_service.create_file_from_gcp_name(gcp_name=gcp_name, user_id=user_id, project_id=project_id)
        return gcp_name

    # import
    def facility_bulk_write(self, command_list):
        return self.context.facilities_collection.bulk_write(command_list)

    def network_bulk_write(self, command_list):
        return self.context.networks_collection.bulk_write(command_list)

    def get_facility_df(self, project_id: str, facility_names: list, projection: dict) -> pd.DataFrame:
        facility_df = pd.DataFrame(
            list(
                self.context.facilities_collection.find(
                    {
                        'project': ObjectId(project_id),
                        'name': {
                            '$in': facility_names
                        },
                    }, {**projection})))
        return facility_df
