import { BigQuery } from '@google-cloud/bigquery';

// docs: https://googleapis.dev/nodejs/bigquery/latest/BigQuery.html
export const initBigQueryClient = (projectId: string) => new BigQuery({ projectId });
