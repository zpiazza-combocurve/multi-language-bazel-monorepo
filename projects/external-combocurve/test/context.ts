import { BigQuery } from '@google-cloud/bigquery';
import { Connection } from 'mongoose';

import { createBQLabels, ITenantBigQueryLabels } from '@src/bigQuery';
import { createHeaders, ITenantHeaders } from '@src/headers';
import { IModelSet, registerModels } from '@src/api/v1/model-set';
import config from '@src/config';
import { EconModelService } from '@src/api/v1/projects/econ-models/service';
import { IBaseContext } from '@src/base-context';
import { ITenantInfo } from '@src/tenant';

jest.mock('@src/helpers/request');

export class TestContext implements IBaseContext {
	readonly headers: ITenantHeaders;
	readonly models: IModelSet;
	readonly tenant: ITenantInfo;
	readonly bigQueryClient?: BigQuery;
	readonly bigQueryLabels: ITenantBigQueryLabels;
	readonly econModelService: EconModelService;

	constructor(tenant: ITenantInfo, connection: Connection) {
		this.headers = createHeaders(tenant);
		this.models = registerModels(connection);
		this.tenant = tenant;
		this.bigQueryClient = new BigQuery({ projectId: config.gcpPrimaryProjectId });
		this.bigQueryLabels = createBQLabels(tenant);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.econModelService = new EconModelService(this);
	}
}
