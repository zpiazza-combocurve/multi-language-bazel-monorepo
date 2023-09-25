import io
import csv
import numpy as np
from bson import ObjectId
from enum import Enum
from combocurve.shared.parquet_types import to_date
from combocurve.services.econ.econ_output_service import (MONTHLY_TABLE_NAME, ONE_LINER_TABLE_NAME,
                                                          WELL_HEADER_TABLE_NAME, METADATA_TABLE_NAME,
                                                          AGGREGATION_TABLE_NAME)
from combocurve.services.econ.econ_columns import QUALIFIER_NAME_HEADER, WELL_COUNT_HEADER

from combocurve.services.econ.econ_result_aggregation import (save_grouped_sums_to_bq, get_all_wells_sum_df,
                                                              get_flat_query_result)
from combocurve.science.econ.get_nested_econ_result import get_nested_output
from combocurve.science.econ.post_process import PostProcess
from combocurve.science.econ.big_query import get_db_bq_key_map, ECON_RES_CAT, SQL_RESERVED_WORDS

from combocurve.utils import storage

DEFAULT_GROUP_BY_COLS = []

# well limit for cumulative columns calculation
WELL_MONTHLY_CSV_LIMIT = 100
WELL_YEARLY_CSV_LIMIT = 100

WELL_COUNT_KEYS = list(WELL_COUNT_HEADER.keys())
TABLE_MAPPING = {
    'monthly': MONTHLY_TABLE_NAME,
    'one-liner': ONE_LINER_TABLE_NAME,
    'aggregation': AGGREGATION_TABLE_NAME,
    'well-header': WELL_HEADER_TABLE_NAME,
    'meta-data': METADATA_TABLE_NAME
}


class EconFiles(Enum):
    WELL_MONTHLY_CSV = 'econFiles.byWellMonthlyCsv'


def get_econ_batch_prefix(run_id):
    return f'econ-runs/{run_id}'


def get_group_by_cols(run):
    group_by_cols = run['outputParams'].get('headersArr', DEFAULT_GROUP_BY_COLS)
    db_to_bq_key = get_db_bq_key_map()
    group_by_cols = [db_to_bq_key.get(col, col) for col in group_by_cols]
    group_by_cols = ['`' + col + '`' if col in SQL_RESERVED_WORDS else col for col in group_by_cols]
    is_res_cat = group_by_cols == ['res_cat']
    if is_res_cat:
        group_by_cols = ECON_RES_CAT
    return is_res_cat, group_by_cols


class EconFileService(object):
    def __init__(self, context):
        self.context = context
        self.storage_client = self.context.cloud_storage_client.client
        self.bucket_name = self.context.tenant_info['econ_storage_bucket']
        self.bucket = self.storage_client.bucket(self.bucket_name)

    def get_sorted_blob_list(self, bucket, prefix):
        file_blob_list = list(bucket.list_blobs(prefix=prefix))
        file_blob_name_list = [b.name for b in file_blob_list]
        file_ordering = np.argsort(np.array(file_blob_name_list))
        ordered_file_blobs = np.array(file_blob_list)[file_ordering].tolist()
        return ordered_file_blobs

    def load_batch_result_to_bigquery(self, run_id_str, type, file_type):
        '''
        load results of a batch to bigquery table from parquet file on gcs
        deletion of the batch files is handled by some retention / life-clycle policy
        '''
        # load file to bigquery
        bucket_name = self.context.tenant_info['batch_storage_bucket']
        bigquery_dataset = self.context.tenant_info['big_query_dataset']
        folder_path = f'{get_econ_batch_prefix(run_id_str)}/{type}-{file_type}'
        uri = f'gs://{bucket_name}/{folder_path}/*'

        table_name = TABLE_MAPPING[type]

        table_path = self.context.big_query_client.table_path(bigquery_dataset, table_name)
        table = self.context.big_query_client.get_table(table_path)
        self.context.big_query_client.load_batch_result_from_storage(table_path, table.schema, uri)

    def load_bq_to_storage(self, header_list, query, query_result_table_name):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)

        destination_uri = f'gs://{bucket_name}/{query_result_table_name}-data-*.csv'

        self.context.big_query_client.export_csv(
            query,
            destination_uri,
        )

        # header
        header_blob_name = f'{query_result_table_name}-header.csv'
        header_blob = self.upload_header_csv(bucket, header_list, header_blob_name)

        # combine header and query result
        prefix = f'{query_result_table_name}-data'
        content_type = 'application/CSV'
        combined_blob_names = storage.combine_storage_files(
            storage_client,
            bucket,
            prefix,
            '',
            content_type,
            header_blob=header_blob,
            file_extension='.csv',
        )
        # should only generate 1 file due to didn't limit the final file size
        combined_blob_name = combined_blob_names[0]

        return combined_blob_name

    def upload_header_csv(self, bucket, header_list, header_blob_name):
        header_buffer = io.StringIO()
        header_writer = csv.writer(header_buffer, quoting=csv.QUOTE_NONNUMERIC)
        header_writer.writerow(header_list)
        header_blob = bucket.blob(header_blob_name)
        header_blob.upload_from_string(header_buffer.getvalue().encode('utf-8'), content_type='application/CSV')
        return header_blob

    def upload_sum_to_storage(self, query_df, bucket, blob_name):
        csv_str = query_df.to_csv(index=False, header=False)
        blob = bucket.blob(blob_name)
        blob.upload_from_string(csv_str, content_type='application/CSV')
        return blob

    def write_econ_csv_to_storage(self, run_id, file_to_write, name, mongo_name):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(name)
        blob.upload_from_string(file_to_write, content_type='application/csv')

        # insert object id to db
        object_id = self.write_id_to_db(run_id, mongo_name, blob.name)

        return object_id

    def write_id_to_db(self, run_id, mongo_name, file_gcp_name):

        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.get_blob(file_gcp_name)
        # create file document
        object_id = self.context.file_service.create_file(blob)
        self.context.econ_runs_collection.update_one({'_id': ObjectId(run_id)},
                                                     {'$set': {
                                                         mongo_name: ObjectId(object_id)
                                                     }})
        return object_id

    def combine_grouped_sum_in_storage(self, storage_client, bucket, run_id_str, group_header_buffer, sum_blob_list):
        group_header_blob = bucket.blob(f'{get_econ_batch_prefix(run_id_str)}/group-header.csv')
        group_header_blob.upload_from_string(group_header_buffer.getvalue().encode('utf-8'),
                                             content_type='application/CSV')

        group_sum_csv_name = f'{get_econ_batch_prefix(run_id_str)}/grouped_sum.csv'
        all_sum_blob = bucket.blob(group_sum_csv_name)
        all_sum_blob.content_type = 'application/CSV'

        sum_blob_list_adj = [group_header_blob] + sum_blob_list
        all_sum_blob.compose(sum_blob_list_adj)

        with storage_client.batch():
            for blob in sum_blob_list_adj:
                blob.delete()

    def generate_grouped_sum(self, run_id_str):
        run = self.context.econ_runs_collection.find_one({'_id': ObjectId(run_id_str)})

        is_res_cat, group_by_cols = get_group_by_cols(run)

        run_date = run['runDate']
        bq_run_date = to_date(run_date)
        run_date_str = str(bq_run_date)

        save_grouped_sums_to_bq(self.context, run_id_str, run_date_str, group_by_cols, is_res_cat)

        query_df = get_all_wells_sum_df(self.context, run_id_str)

        combo_groups = self.generate_all_well_results(run, query_df)

        return combo_groups

    def generate_one_well_grouped_sum(self, run, df):
        run_id = run['_id']
        run = self.context.econ_runs_collection.find_one({'_id': ObjectId(str(run_id))})

        output_params = run['outputParams']
        columns = output_params['columns']
        column_fields = output_params['columnFields']
        general_options = output_params['generalOptions']

        # find columns to be queried
        (_, _, selected_key_list, additional_key_list, cum_col_keys,
         cum_col_additional_keys) = PostProcess.get_econ_file_header(columns,
                                                                     column_fields,
                                                                     general_options, [],
                                                                     include_cum=True)
        # add cumulative sum columns to the df
        if len(cum_col_keys) > 0:
            for col_key in cum_col_keys:
                col_index = df.columns.get_loc(col_key)
                # calculate the cumsum for a column and insert next to the original column
                cum_sum_by_combo = np.array([])
                for combo in list(set(list(df['combo_name']))):
                    this_combo_col = df[df['combo_name'] == combo][col_key]
                    cum_sum_by_combo = np.append(cum_sum_by_combo, np.cumsum(this_combo_col))
                df.insert(col_index + 1, 'cum_' + col_key, cum_sum_by_combo)
        selected_key_list = list(filter(lambda key: key not in cum_col_additional_keys, selected_key_list))
        required_columns = selected_key_list + ['combo_name', 'date', 'aggregation_group'] + list(
            map(lambda key: 'cum_' + key, cum_col_keys)) + additional_key_list

        selected_df = df.drop(columns=[col for col in df.columns if col not in required_columns])
        return self.generate_all_well_results(run, selected_df)

    # TODO: remove query of run and pass it in from upper level
    def generate_all_well_results(self, run, query_df):
        '''
            generates and returns the nested by-group results and save the df to bigquery, and the by group
            csv files to cloud storage.
        '''
        output_params = run['outputParams']
        combos = output_params['combos']
        output_params = run['outputParams']
        nested_output_paras = PostProcess.get_nested_output_paras(output_params)

        combo_groups = {}

        # constuct name of qualifiers by combo_name
        combo_qualifier_dict = {}
        for combo in combos:
            combo_name = combo['name']
            combo_groups[combo_name] = {}
            qualifiers = {
                header_key: combo['qualifiers'].get(header_key.replace('_qualifier', ''), {'name': ''})['name']
                for header_key in QUALIFIER_NAME_HEADER.keys()
            }
            combo_qualifier_dict[combo_name] = qualifiers

        for combo in combos:
            combo_name = combo['name']
            combo_query_df = query_df[query_df['combo_name'] == combo_name]

            # continue when query result is empty
            if combo_query_df.shape[0] == 0:
                continue

            # construct nested format
            group_dict = get_flat_query_result(combo_query_df)
            for group_key in group_dict.keys():
                nested_output = get_nested_output(group_dict[group_key], nested_output_paras)
                combo_groups[combo_name][group_key] = nested_output

        return combo_groups
