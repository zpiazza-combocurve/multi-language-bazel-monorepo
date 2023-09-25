import copy
import decimal
from datetime import datetime
import numpy as np
import pandas as pd
import polars as pl
from joblib import Parallel, delayed
from combocurve.shared.parquet_types import (MAX_NUMERIC_DIGIT, to_date, build_pyarrow_schema, df_to_parquet,
                                             table_to_parquet)
from combocurve.services.econ.econ_output_fields import (WELL_HEADER_NAME_MAP)
from combocurve.services.scenario_well_assignments_service import QUALIFIER_FIELDS
from combocurve.services.econ.econ_big_query_schema import (MONTHLY_SCHEMA, ONE_LINER_SCHEMA, AGGREGATION_SCHEMA,
                                                            WELL_HEADER_SCHEMA, METADATA_SCHEMA)

MONTHLY_TABLE_NAME = 'econ_v2_monthly'
ONE_LINER_TABLE_NAME = 'econ_v2_one_liner'
METADATA_TABLE_NAME = 'econ_v2_metadata'
WELL_HEADER_TABLE_NAME = 'econ_v2_wells'
AGGREGATION_TABLE_NAME = 'econ_v2_aggregation'

FILE_TYPE = 'parquet'

RUN_DATA_FIELDS = [
    'run_date', 'run_id', 'project_id', 'user_id', 'scenario_id', 'project_name', 'scenario_name', 'user_name',
    'general_options_name'
]

TIMESTAMP_COLS = ['created_at', 'run_at', 'inserted_at']
BOOLEAN_COLS = ['generic', 'has_daily', 'has_monthly']

# TODO: add 'network', 'emission' qualifier field to Econ Big Query table
QUALIFIER_FIELDS = copy.deepcopy(QUALIFIER_FIELDS)
QUALIFIER_FIELDS.remove('network')
QUALIFIER_FIELDS.remove('emission')


def _get_qualifier_names(combo):
    qualifier_names = {
        f'{column}_qualifier': combo['qualifiers'].get(column, {'name': ''})['name']
        for column in QUALIFIER_FIELDS
    }
    '''
    we didn't remove the pricing_differentials_qualifier column in bigquery and this column is required,
    keep this until updating bigquery and possibly forever if updating bigquery does not make sense
    '''
    return qualifier_names


def _get_error_message(output):
    error = output.get('error')
    if error:
        return error['message'] if error.get('expected') else 'Unexpected Error'
    return None


def _build_metadata_column(run_data):
    run_data = {key: run_data.get(key) for key in RUN_DATA_FIELDS}

    metadata_column = {
        **run_data,
        'created_at': datetime.utcnow(),
        'schema_version': 3,
        # TODO: add custom well header label map
    }

    return metadata_column


def _build_well_header_base_columns(well_header, run_data, well_fields):
    run_data = {key: run_data.get(key) for key in RUN_DATA_FIELDS}
    fields = list(map(lambda col: well_header.get(well_fields[col]), list(well_fields.keys())))
    headers = dict(zip(list(well_fields.keys()), fields))
    headers.update({
        'run_id': run_data['run_id'],
        'run_date': run_data['run_date'],
        'well_id': str(well_header['_id']),
        'created_at': datetime.utcnow(),
    })

    return headers


def build_monthly_one_liner_base_columns(output, combo, run_data):
    run_data = {key: run_data.get(key) for key in RUN_DATA_FIELDS}
    run_id = run_data['run_id']

    qualifiers = _get_qualifier_names(combo)
    combo_name = combo['name']

    well_id = str(output['well']['_id'])
    reserves_category = output['reserves_category']
    incremental_name = output['incremental_name']
    incremental_index = output['incremental_index']
    combo_well_id = '{}.{}.{}'.format(run_id, combo_name, well_id)
    combo_well_incremental_id = '{}.{}.{}.{}'.format(run_id, combo_name, well_id, incremental_index)

    base_columns = {
        'run_id': run_id,
        'run_date': run_data['run_date'],
        **reserves_category,
        **qualifiers,
        'combo_name': combo_name,
        'well_id': well_id,
        'combo_well_id': combo_well_id,
        'combo_well_incremental_id': combo_well_incremental_id,
        'created_at': datetime.utcnow(),
        'error': _get_error_message(output),
        'warning': output.get('warning'),
        'incremental_name': incremental_name,
        'incremental_index': incremental_index,
        'well_index': output['well_index'],
    }

    return base_columns


def _build_one_liner_row(output, combo, run_data):
    '''
        Returns a row with the schema for the one-liner table in BigQuery
    '''
    one_liner = {} if 'error' in output else output['all_one_liner']
    base = build_monthly_one_liner_base_columns(output, combo, run_data)

    return {
        **base,
        **({key: item['value']
            for (key, item) in one_liner.items()}),
    }


def _build_monthly_rows(output, combo, run_data):
    '''
        Returns multiple rows with the schema for the monthly table in BigQuery
    '''

    base = build_monthly_one_liner_base_columns(output, combo, run_data)

    if 'error' in output:
        '''
        return a list of dict also make append to whole df work
        '''
        return [base]
    else:
        data = np.array(list(output['all_flat_output'].values()))
        keys = output['all_flat_output'].keys()
        num_rows = data.shape[1]
        records = []
        for row_idx in range(num_rows):
            row_dict = dict(zip(keys, data[:, row_idx]))
            row_dict.update(base)
            records.append(row_dict)

        return records


def to_decimal(x):
    return decimal.Decimal(repr(round(x, MAX_NUMERIC_DIGIT)))


def ts_to_date(x):
    return x.date()


def process_output_type(col, bq_type, write_to_bq=True):
    if col.name in BOOLEAN_COLS:
        return col.astype(bool)
    if col.dtype == '<M8[ns]' and col.name not in TIMESTAMP_COLS:
        # convert false datetime cols to date
        return col.apply(ts_to_date)
    if bq_type == 'DATE':
        return col.apply(to_date)
    elif bq_type == 'INTEGER':
        return col.astype(int)
    elif bq_type == 'FLOAT':
        return col.astype(np.float64)
    elif bq_type == 'NUMERIC':
        return np.where(pd.isna(col), None, col.astype(np.float64).apply(to_decimal))
    elif bq_type == 'STRING':
        return np.where(pd.isna(col), None, col.astype(str))
    return col


def get_one_liner_rows(batch_outputs, run_data):
    rows = []
    for combo in batch_outputs:
        for output in combo['outputs']:
            row = _build_one_liner_row(output, combo['combo'], run_data)
            rows.append(row)
    return rows


def get_monthly_rows(batch_outputs, run_data):
    monthly_rows = []
    for combo in batch_outputs:
        for output in combo['outputs']:
            rows = _build_monthly_rows(output, combo['combo'], run_data)
            '''
            the append method will auto create new column if 'rows' has more columns than 'monthly_rows'
            this can happen for example: the first well error out (less cols) but the second well not (all cols)
            '''
            monthly_rows += rows
    return monthly_rows


def get_header_rows(batch_outputs, run_data, well_header_fields, include_econ_group=False):
    header_rows = []

    well_set = set()  # to record the wells

    for combo in batch_outputs:
        for output in combo['outputs']:
            well_header = output['well']
            well_id = well_header['_id']

            if well_id not in well_set:
                row = _build_well_header_base_columns(well_header, run_data, well_header_fields)
                if include_econ_group:
                    row['econ_group'] = output.get('econ_group')
                header_rows.append(row)
                well_set.add(well_id)
    return header_rows


def get_metadata_rows(run_data):
    metadata_rows = []
    row = _build_metadata_column(run_data)
    metadata_rows.append(row)
    return metadata_rows


def get_well_header_mongo_names(well_header_schema):
    return [
        column if column not in WELL_HEADER_NAME_MAP else WELL_HEADER_NAME_MAP[column] for column in well_header_schema
    ]


def get_schema(bq_schema):
    schema = {}
    for item_dict in bq_schema:
        schema[item_dict['name']] = item_dict['type']
    return schema


BQ_BATCH_ROWS = 250

# NOTE: we got an error when we tried to write about 2000 rows in one request, due to the increased # of columns
# Also there's a 10,485,760 bytes request limit to consider


class EconOutputService(object):
    def __init__(self, context):
        self.context = context

        self.monthly_schema = get_schema(MONTHLY_SCHEMA)
        self.one_liner_schema = get_schema(ONE_LINER_SCHEMA)
        self.aggregation_schema = get_schema(AGGREGATION_SCHEMA)
        self.well_header_schema = get_schema(WELL_HEADER_SCHEMA)
        self.metadata_schema = get_schema(METADATA_SCHEMA)
        self.well_header_fields = dict(
            zip(list(self.well_header_schema.keys()), get_well_header_mongo_names(self.well_header_schema)))

    def get_dataset(self):
        return self.context.tenant_info['big_query_dataset']

    def upload_df_to_batch_bucket(self, file_name, df, pa_schema, chunk_size=None, timeout=60):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['batch_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name, chunk_size=chunk_size)
        str_to_write = df_to_parquet(df, pa_schema)
        # upload as string
        blob.upload_from_string(str_to_write, content_type=f'application/{FILE_TYPE}', timeout=timeout)

    def upload_parquet_to_batch_bucket(self, file_name, df, pa_schema, chunk_size=None, timeout=60):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['batch_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name, chunk_size=chunk_size)
        str_to_write = table_to_parquet(df, pa_schema)
        # upload as string
        blob.upload_from_string(str_to_write, content_type=f'application/{FILE_TYPE}', timeout=timeout)

    def upload_df_to_table(self, df, table_name):
        # write result to big query table
        table_path = self.context.big_query_client.table_path(self.get_dataset(), table_name)
        table_id = self.context.big_query_client.get_table(table_path)
        self.context.big_query_client.insert_rows_df(table_id, df)

    def get_monthly_df(self, batch_outputs, run_data):
        monthly_rows = pd.DataFrame(get_monthly_rows(batch_outputs, run_data))
        monthly_df = monthly_rows.apply(lambda col: process_output_type(col, self.monthly_schema[col.name]))
        return monthly_df

    def get_well_header_df(self, batch_outputs, run_data):
        header_rows = pd.DataFrame(get_header_rows(batch_outputs, run_data, self.well_header_fields))
        well_header_df = header_rows.apply(lambda col: process_output_type(col, self.well_header_schema[col.name]))
        return well_header_df

    def get_one_liner_df(self, batch_outputs, run_data):
        one_liner_rows = pd.DataFrame(get_one_liner_rows(batch_outputs, run_data))
        one_liner_df = one_liner_rows.apply(lambda col: process_output_type(col, self.one_liner_schema[col.name]))
        return one_liner_df

    def get_metadata_df(self, run_data):
        metadata_rows = pd.DataFrame(get_metadata_rows(run_data))
        metadata_df = metadata_rows.apply(lambda col: process_output_type(col, self.metadata_schema[col.name], False))

        return metadata_df

    def get_group_dfs(self, batch_outputs, run_data):

        all_monthly_rows = Parallel(n_jobs=len(batch_outputs))(delayed(get_monthly_rows)(batch_output, run_data)
                                                               for batch_output in batch_outputs)
        flat_monthly_rows = [item for sublist in all_monthly_rows for item in sublist]
        monthly_pldf = pl.from_dicts(flat_monthly_rows, infer_schema_length=len(flat_monthly_rows))

        flat_batch_outputs = [item for sublist in batch_outputs for item in sublist]

        one_liner_rows = get_one_liner_rows(flat_batch_outputs, run_data)
        header_rows = get_header_rows(flat_batch_outputs, run_data, self.well_header_fields, True)
        metadata_rows = get_metadata_rows(run_data)

        one_liner_pldf = pl.from_dicts(one_liner_rows, infer_schema_length=len(one_liner_rows))
        header_pldf = pl.from_dicts(header_rows, infer_schema_length=len(header_rows))
        metadata_pldf = pl.from_dicts(metadata_rows, infer_schema_length=len(metadata_rows))

        return monthly_pldf, header_pldf, one_liner_pldf, metadata_pldf

    def write_metadata(self, run_data):
        '''
        Insert one row for each econ run, this function should not be called in each batch,
        should be called in clean up of cf and in app engine route.
        So we should not put it in write_batch_outputs_cloud in econ_service.
        '''
        metadata_df = self.get_metadata_df(run_data)
        # only one row, always use api insert (sync=True)
        self.upload_df_to_table(metadata_df, METADATA_TABLE_NAME)

    def write_econ_files(self, batch_outputs, batch_index, run_data):

        to_date_v = np.vectorize(to_date)

        run_id = run_data['run_id']
        monthly_rows = pd.DataFrame(get_monthly_rows(batch_outputs, run_data))
        header_rows = pd.DataFrame(get_header_rows(batch_outputs, run_data, self.well_header_fields))
        one_liner_rows = pd.DataFrame(get_one_liner_rows(batch_outputs, run_data))

        monthly_date_cols = [col for col in monthly_rows if self.monthly_schema[col] == 'DATE']
        wh_date_cols = [col for col in header_rows if self.well_header_schema[col] == 'DATE']
        one_line_date_cols = [col for col in one_liner_rows if self.one_liner_schema[col] == 'DATE']

        monthly_rows[monthly_date_cols] = monthly_rows[monthly_date_cols].apply(to_date_v)
        header_rows[wh_date_cols] = header_rows[wh_date_cols].apply(to_date_v)
        one_liner_rows[one_line_date_cols] = one_liner_rows[one_line_date_cols].apply(to_date_v)

        # output one liner
        pa_schema = build_pyarrow_schema(self.one_liner_schema, one_liner_rows)
        file_name = 'econ-runs/{}/one-liner-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, one_liner_rows, pa_schema)

        # output well headers
        pa_schema = build_pyarrow_schema(self.well_header_schema, header_rows)
        file_name = 'econ-runs/{}/well-header-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, header_rows, pa_schema)

        # output monthly
        pa_schema = build_pyarrow_schema(self.monthly_schema, monthly_rows)
        file_name = 'econ-runs/{}/monthly-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, monthly_rows, pa_schema)

    def write_group_econ_files(self, batch_index, run_data, monthly_pldf, header_pldf, one_liner_pldf):

        # convert to pandas dfs and output to gcs
        run_id = run_data['run_id']

        monthly_date_cols = [col for col in monthly_pldf.columns if self.monthly_schema.get(col) == 'DATE']
        wh_date_cols = [col for col in header_pldf.columns if self.well_header_schema.get(col) == 'DATE']
        one_line_date_cols = [col for col in one_liner_pldf.columns if self.one_liner_schema.get(col) == 'DATE']

        monthly_pldf = monthly_pldf.with_columns([pl.col(col).apply(to_date) for col in monthly_date_cols])
        header_pldf = header_pldf.with_columns([pl.col(col).apply(to_date) for col in wh_date_cols])
        one_liner_pldf = one_liner_pldf.with_columns([pl.col(col).apply(to_date) for col in one_line_date_cols])

        monthly_rows = monthly_pldf.to_pandas()
        header_rows = header_pldf.to_pandas()
        one_liner_rows = one_liner_pldf.to_pandas()

        # output monthly
        pa_schema = build_pyarrow_schema(self.monthly_schema, monthly_rows)
        file_name = 'econ-runs/{}/monthly-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, monthly_rows, pa_schema)

        # output one liner
        pa_schema = build_pyarrow_schema(self.one_liner_schema, one_liner_rows)
        file_name = 'econ-runs/{}/one-liner-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, one_liner_rows, pa_schema)

        # output well headers
        pa_schema = build_pyarrow_schema(self.well_header_schema, header_rows)
        file_name = 'econ-runs/{}/well-header-{}/{}.{}'.format(run_id, FILE_TYPE, batch_index, FILE_TYPE)
        self.upload_parquet_to_batch_bucket(file_name, header_rows, pa_schema)

    def write_well_header_to_table(self, batch_outputs, run_data):
        well_header_df = self.get_well_header_df(batch_outputs, run_data)
        self.upload_df_to_table(well_header_df, WELL_HEADER_TABLE_NAME)

    def write_one_liner_to_table(self, batch_outputs, run_data):
        one_liner_df = self.get_one_liner_df(batch_outputs, run_data)
        self.upload_df_to_table(one_liner_df, ONE_LINER_TABLE_NAME)

    def write_monthly_to_table(self, batch_outputs, run_data):
        monthly_df = self.get_monthly_df(batch_outputs, run_data)
        self.upload_df_to_table(monthly_df, MONTHLY_TABLE_NAME)

    def write_aggregation_result_to_table(self, df, run_id, run_date, add_aggregation_group=True):
        # add columns not in df
        df['created_at'] = datetime.utcnow()
        df['run_date'] = run_date
        df['run_id'] = str(run_id)
        if add_aggregation_group:
            df['aggregation_group'] = 'all wells'
        bq_df = df.drop(columns=[col for col in df.columns if col not in self.aggregation_schema])
        bq_df = bq_df.apply(lambda col: process_output_type(col, self.aggregation_schema[col.name]))

        self.upload_df_to_table(bq_df, AGGREGATION_TABLE_NAME)
