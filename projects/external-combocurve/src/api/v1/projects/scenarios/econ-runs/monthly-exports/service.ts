import { Job, RowsResponse, Table } from '@google-cloud/bigquery';
import { ApiError } from '@google-cloud/common';
import bigquery from '@google-cloud/bigquery/build/src/types';
import crypto from 'crypto';
import { Types } from 'mongoose';

import { buildWhereWithNamedParameters, table } from '@src/helpers/sql';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { BaseService } from '@src/base-context';
import { buildFibonacciRetry } from '@src/strategies/retry/builder';
import config from '@src/config';
import { IEconMonthly } from '@src/models/econ/econ-monthly';
import { IEconRun } from '@src/models/econ/econ-runs';
import { IPageDataObject } from '@src/api/v1/pagination';
import { ITenantBigQueryLabels } from '@src/bigQuery';
import { notNil } from '@src/helpers/typing';
import { splitPaginatedRequest } from '@src/helpers/request-splitter';
import { validateQueryJob } from '@src/helpers/big-query.validation';

import { ApiJob, ApiMonthlyExport, getCountFilters, getFilters, toApiJob, toApiMonthlyExport } from './fields';
import { COUNT_QUERY, JOIN_MONTHLY_TABLE_QUERY, JOINED_TABLE_NAME, SELECT_QUERY } from './queries';
import { MonthlyExportNotFoundError } from './validation';

export const ECON_MONTHLY_TABLE = 'econ_v2_monthly';
export const ECON_WELL_HEADER_TABLE = 'econ_v2_wells';
export const METADATA_TABLE = 'econ_v2_metadata';

type EconMonthlyExportLabels = ITenantBigQueryLabels & { 'service-name': string; 'service-params': string };

export class EconMonthlyService extends BaseService<ApiContextV1> {
	static attribute = 'econMonthlyService';
	readonly econMonthlyPath: string;
	readonly econWellHeaderPath: string;
	readonly econMetadataPath: string;

	constructor(context: ApiContextV1) {
		super(context);

		const { bigQueryDataset } = this.context.tenant;

		const datasetPath = `${config.gcpPrimaryProjectId}.${bigQueryDataset}`;

		this.econMonthlyPath = `${datasetPath}.${ECON_MONTHLY_TABLE}`;
		this.econWellHeaderPath = `${datasetPath}.${ECON_WELL_HEADER_TABLE}`;
		this.econMetadataPath = `${datasetPath}.${METADATA_TABLE}`;
	}

	protected getBQLabels(
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Readonly<EconMonthlyExportLabels> {
		// label has a length limit of 63 characters https://cloud.google.com/bigquery/docs/labels-intro#requirements
		const serviceParams = crypto
			.createHash('md5')
			.update(`${project._id}|${scenarioId}|${econRun.id}`)
			.digest('hex');

		return Object.freeze({
			...this.context.bigQueryLabels,
			'service-name': EconMonthlyService.attribute.toLowerCase(),
			'service-params': serviceParams,
		});
	}

	async getMonthlyExportById(
		id: string,
		skip: number,
		take: number,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
		concurrency = 0,
	): Promise<IPageDataObject<ApiMonthlyExport>> {
		const jobResponse = await this.context.bigQueryClient
			.job(id)
			.get()
			.catch((err: ApiError) => {
				if (err.code === 404) {
					throw new MonthlyExportNotFoundError(`No monthly export was found with id \`${id}\``);
				}

				throw err;
			});

		const job = jobResponse[0] as Job;

		const bqLabels = this.getBQLabels(project, scenarioId, econRun);

		validateQueryJob(job, bqLabels);

		const { datasetId, tableId } = job.metadata.configuration.query.destinationTable;

		return this.getEconRows(skip, take, concurrency, datasetId, tableId);
	}

	private async getEconRows(skip: number, take: number, concurrency = 0, datasetID: string, tableID: string) {
		const table = this.context.bigQueryClient.dataset(datasetID).table(tableID);

		const requests = this.prepareEconRowsRequest(table, skip, take, concurrency);

		const result = (await Promise.all(requests.map((m) => m.execute())))
			.map((m) => (m.response === undefined ? null : m.response))
			.filter(notNil);

		const rows = result.flatMap((x) => x[0]).filter(notNil) as IEconMonthly[];
		const resultsMeta = result.flatMap((x) => x[2]).slice(-1)[0] as bigquery.IGetQueryResultsResponse;

		return {
			result: toApiMonthlyExport({ rows, resultsMeta }),
			hasNext: resultsMeta?.totalRows != undefined && +resultsMeta.totalRows > skip + take,
		};
	}

	private prepareEconRowsRequest(table: Table, skip: number, take: number, concurrency = 0) {
		const requests = splitPaginatedRequest(
			(splitRequestSkip, splitRequestTake) =>
				table.getRows({ startIndex: splitRequestSkip.toString(), maxResults: splitRequestTake }),
			skip,
			take,
			concurrency > 0 ? concurrency : config.econMonthlyConcurrency,
		);

		const shouldRetryGet = (response: RowsResponse | undefined, error: unknown) => {
			if (response && !error) {
				return false;
			}

			return true;
		};

		return requests.map((m) =>
			buildFibonacciRetry(config.econMonthlyAttempts, config.econMonthlyAttemptDelayMS, m, shouldRetryGet),
		);
	}

	async createMonthlyExport(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Promise<ApiJob> {
		const mappedFilters = getFilters(filters, project, scenarioId, econRun);

		const { whereQuery, params } = buildWhereWithNamedParameters(mappedFilters);

		const joinMonthlyQuery = JOIN_MONTHLY_TABLE_QUERY({
			joinedTableName: table(JOINED_TABLE_NAME),
			monthlyTable: this.econMonthlyPath,
			wellHeaderTable: this.econWellHeaderPath,
			metadataTable: this.econMetadataPath,
		});

		const selectKeys = Object.keys(new IEconMonthly()).join(',');

		const selectQuery = SELECT_QUERY({ selection: selectKeys, table: table(JOINED_TABLE_NAME), where: whereQuery });

		const query = `${joinMonthlyQuery} ${selectQuery}`;

		const bqLabels = this.getBQLabels(project, scenarioId, econRun);

		const job = await this.context.bigQueryClient.createQueryJob({
			query,
			params,
			labels: bqLabels,
		});

		// poll query until complete or until timeout is exceeded to ensure
		// subsequent calls to table.getRows are not executed until query completes
		await job[0].getQueryResults({ maxResults: 1, timeoutMs: 30 * 1000 });

		return toApiJob(job[0]);
	}

	async getEconMonthlyCount(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Promise<number> {
		const mappedFilters = getCountFilters(filters, econRun);

		const { whereQuery, params } = buildWhereWithNamedParameters(mappedFilters);

		const query = COUNT_QUERY({ table: table(this.econMonthlyPath), where: whereQuery });

		const result = await this.context.bigQueryClient.query({ query, params });
		return result?.[0]?.[0]?.count;
	}
}
