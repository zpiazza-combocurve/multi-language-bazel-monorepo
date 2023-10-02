import bigquery from '@google-cloud/bigquery/build/src/types';

export interface JobGetQueryResult<T> {
	rows: T[];
	resultsMeta: bigquery.IGetQueryResultsResponse;
}
