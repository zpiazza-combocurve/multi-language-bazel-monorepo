import logging
import datetime
from google.cloud import bigquery


def _log_error(message, error):
    logging.error(message, extra={'metadata': {'error': str(error)}})


class BigQueryClient(object):
    # docs: https://googleapis.dev/python/bigquery/latest/reference.html
    def __init__(self, project_id):
        self.client = bigquery.Client(project_id)
        self.project_id = project_id

    def table_path(self, dataset_id, table_name):
        return f'{self.project_id}.{dataset_id}.{table_name}'

    def get_table(self, table_path):
        return self.client.get_table(table_path)

    def get_query_df(self, query):
        query_result = self.query_rows(query)
        df = query_result.to_arrow(create_bqstorage_client=True).to_pandas()
        return df

    def append_query_result_to_table(self, query, table_path):
        job_config = bigquery.QueryJobConfig(destination=table_path, write_disposition='WRITE_APPEND')
        try:
            query_job = self.client.query(query, job_config=job_config)  # Make an API request.
            query_job.result()  # Wait for the job to complete.
        except Exception as e:
            _log_error('BigQuery load job error', query_job.errors)
            raise e

    def load_rows_from_csv(self, dataset_id, table_name, uri):
        dataset_ref = self.client.dataset(dataset_id)
        table_ref = dataset_ref.table(table_name)

        job_config = bigquery.LoadJobConfig()
        job_config.skip_leading_rows = 1
        job_config.source_format = bigquery.SourceFormat.CSV

        load_job = self.client.load_table_from_uri(uri, table_ref, job_config=job_config)

        try:
            load_job.result()
        except Exception as e:
            _log_error('BigQuery load job error', load_job.errors)
            raise e

    def insert_rows_df(self, table, df, auto_row_ids=False):
        '''
            Inserts rows from a dataframe to the given table using BigQuery stream insert API

            The BigQuery client by default adds `insertId` to all rows to enable Best Effort De-duplication. This
            method disables that behavior by default since it has a toll in the insert quota limits:
            https://cloud.google.com/bigquery/streaming-data-into-bigquery#disabling_best_effort_de-duplication
        '''
        row_ids = None if auto_row_ids else [None] * len(df)
        result = self.client.insert_rows_from_dataframe(table, df, row_ids=row_ids)
        if len(result) > 0 and len(result[0]) > 0:
            raise Exception(f'Failed to insert rows to BigQuery: {result}')

    def insert_rows(self, table, rows, auto_row_ids=False):
        '''
            Inserts a batch of rows to the given table using BigQuery stream insert API
        '''
        row_ids = None if auto_row_ids else [None] * len(rows)
        result = self.client.insert_rows(table, rows, row_ids=row_ids)
        if len(result) > 0:
            sample_error = result[0]['errors'][0]
            field = sample_error['location']
            message = sample_error['message']
            raise Exception(f'Failed to insert rows to BigQuery: {field}: {message}')

    def load_batch_result_from_storage(self, table_path, schema, uri):

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.PARQUET,
            schema=schema,
        )

        load_job = self.client.load_table_from_uri(uri, table_path, job_config=job_config)  # Make an API request.
        try:
            return load_job.result()
        except Exception as e:
            logging.error('Failed to load batch results to BigQuery', extra={'metadata': {
                'error': load_job.errors,
            }})
            raise e

    def query_rows(self, query):
        query_job = self.client.query(query)
        rows = query_job.result()
        return rows

    def drop_table(self, dataset_id, table_name):
        path = self.table_path(dataset_id, table_name)
        query = f'DROP TABLE `{path}`'
        query_job = self.client.query(query)
        query_job.result()

    def save_query_result_to_table(self, dataset_id, query, destination_table_name, write_disposition='WRITE_EMPTY'):
        table_ref = self.table_path(dataset_id, destination_table_name)
        query_job_config = bigquery.QueryJobConfig(destination=table_ref, write_disposition=write_disposition)
        query_job = self.client.query(query, job_config=query_job_config)
        query_job.result()

    def export_table_to_storage(self, dataset_id, table_name, destination_uri, print_header=False):
        extract_job_config = bigquery.job.ExtractJobConfig(print_header=print_header)
        table_ref = self.table_path(dataset_id, table_name)
        extract_job = self.client.extract_table(table_ref, destination_uri, job_config=extract_job_config)
        extract_job.result()

    def export_csv(self, query, destination_uri):
        query_prefix = f"EXPORT DATA OPTIONS( uri='{destination_uri}', format='CSV', overwrite=TRUE, header=FALSE, field_delimiter=',') AS "  # noqa E501
        query = query_prefix + query
        query_job = self.client.query(query)
        query_job.result()

    def create_table(self, schema, table_id, expiration_time=None):
        table = bigquery.Table(table_id, schema=schema)
        if expiration_time:
            table.expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expiration_time)
        table = self.client.create_table(table)
        return table

    def delete_table(self, table_id):
        self.client.delete_table(table_id, not_found_ok=True)
