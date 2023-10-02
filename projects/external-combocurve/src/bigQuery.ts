import { BigQuery } from '@google-cloud/bigquery';

import { ITenantInfo } from './tenant';

export const initBigQueryClient = (projectId: string): BigQuery => new BigQuery({ projectId });

export interface ITenantBigQueryLabels {
	tenant: string;
}

export const createBQLabels = (tenant: ITenantInfo): ITenantBigQueryLabels => {
	const { name } = tenant;
	return Object.freeze({
		tenant: name,
	});
};
