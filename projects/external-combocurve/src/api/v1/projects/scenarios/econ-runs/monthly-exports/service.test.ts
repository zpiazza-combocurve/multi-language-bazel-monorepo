import { Connection, Types } from 'mongoose';
import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';

import { buildWhereWithNamedParameters, table } from '@src/helpers/sql';
import { ApiContextV1 } from '@src/api/v1/context';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IBQFilters } from '@src/helpers/bq-queries';
import { IEconMonthly } from '@src/models/econ/econ-monthly';
import { IEconRun } from '@src/models/econ/econ-runs';
import { JobGetQueryResult } from '@src/api/v1/bigQuery';

import { COUNT_QUERY, SELECT_QUERY } from './queries';
import { ECON_MONTHLY_TABLE, EconMonthlyService } from './service';
import { toApiMonthlyExport } from './fields';

import econMonthly from '@test/fixtures/monthly-exports.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: EconMonthlyService;
let context: ApiContextV1;
let mockProject: BaseProjectResolved;
let econMonthlyPath: string;
let mockScenarioId: Types.ObjectId;
let mockEconRun: Pick<IEconRun, 'id' | 'runDate'>;
let scopeFilter: {
	project_id: IBQFilters<string>;
	scenario_id: IBQFilters<string>;
	run_id: IBQFilters<string>;
	run_date: IBQFilters<Date>;
};
let mockExportId: string;
let mockDatasetId: string;
let mockTableId: string;

let mockQueryResult: unknown[];
let mockGetQueryResultsResult: unknown[];
let mockGetQueryResultsResultRows: number;

const mockGetBQLabels = jest.fn(() => ({
	...context.bigQueryLabels,
	'service-name': EconMonthlyService.attribute.toLowerCase(),
	'service-params': crypto
		.createHash('md5')
		.update(`${mockProject._id}|${mockScenarioId}|${mockEconRun.id}`)
		.digest('hex'),
}));
const { BigQuery: mockBigQuery, BigQueryDate: mockBigQueryDate } = jest.requireActual('@google-cloud/bigquery');

jest.mock('@google-cloud/bigquery', () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...(jest.requireActual('@google-cloud/bigquery') as any),
	BigQuery: jest.fn(() => ({
		dataset: () => ({
			table: () => ({
				getRows: ({ startIndex, maxResults }: { startIndex: number; maxResults: number }) => [
					mockGetQueryResultsResult.slice(startIndex, startIndex + maxResults),
					{},
					{
						totalRows: mockGetQueryResultsResultRows,
						jobComplete: true,
					},
				],
			}),
		}),
		job: () => ({
			get: () =>
				Promise.resolve([
					{
						id: mockExportId,
						metadata: {
							configuration: {
								query: {
									destinationTable: {
										datasetId: mockDatasetId,
										tableId: mockTableId,
									},
									queryParameters: [
										{
											...mockBigQuery.valueToQueryParameter_(mockProject._id.toString()),
											name: 'project_id',
										},
										{
											...mockBigQuery.valueToQueryParameter_(mockScenarioId.toString()),
											name: 'scenario_id',
										},
										{
											...mockBigQuery.valueToQueryParameter_(mockEconRun.id.toString()),
											name: 'run_id',
										},
										{
											...mockBigQuery.valueToQueryParameter_(
												new mockBigQueryDate(mockEconRun.runDate.toISOString().split('T')[0]),
											),
											name: 'run_date',
										},
									],
								},
								labels: mockGetBQLabels(),
							},
						},
					},
				]),
		}),
		query: () => [mockQueryResult],
	})),
}));

BigQuery.valueToQueryParameter_ = mockBigQuery.valueToQueryParameter_;

const mockRowsResponse = (rows: IEconMonthly[]): JobGetQueryResult<IEconMonthly> => ({
	rows,
	resultsMeta: { totalRows: rows.length.toString(), jobComplete: true },
});

describe('v1/projects/:projectId/scenarios/:scenarioId/econ-runs/:econRunId/one-liners/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);

		const { bigQueryDataset } = info;
		econMonthlyPath = `${config.gcpPrimaryProjectId}.${bigQueryDataset}.${ECON_MONTHLY_TABLE}`;

		context = new TestContext(info, connection) as ApiContextV1;
		service = new EconMonthlyService(context);
	});
	afterAll(async () => {
		await connection.close();
		jest.clearAllMocks();
	});
	test('getMonthlyExportById', async () => {
		mockProject = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		mockDatasetId = '885d6969-2ee0-4b85-ab8d-607536c8041e';
		mockTableId = '4a2fd1dc-4d45-4126-b5e3-8c93b099c6e2';
		mockScenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		mockEconRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};
		scopeFilter = {
			project_id: { value: mockProject.toString(), operator: '=' },
			scenario_id: { value: mockScenarioId.toString(), operator: '=' },
			run_id: { value: mockEconRun.id, operator: '=' },
			run_date: { value: mockEconRun.runDate, operator: '=' },
		};
		mockExportId = 'b146fd90-6c26-4b3d-aaca-edca322deca1';

		let { whereQuery, params } = buildWhereWithNamedParameters(scopeFilter);
		let query = COUNT_QUERY({ table: table(econMonthlyPath), where: whereQuery });
		mockQueryResult = [{ count: econMonthly.length }];
		const [[{ count }]] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = [];
		mockGetQueryResultsResultRows = econMonthly.length;

		await expect(
			service.getMonthlyExportById(mockExportId, 0, 0, mockProject, mockScenarioId, mockEconRun),
		).resolves.toStrictEqual({
			result: {
				results: [],
				status: 'completed',
			},
			hasNext: true,
		});

		({ whereQuery, params } = buildWhereWithNamedParameters(scopeFilter));
		query = SELECT_QUERY({ selection: '*', table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = econMonthly;
		let [results] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = econMonthly;
		mockGetQueryResultsResultRows = econMonthly.length;

		await expect(
			service.getMonthlyExportById(mockExportId, 0, count + 1, mockProject, mockScenarioId, mockEconRun),
		).resolves.toStrictEqual({
			result: toApiMonthlyExport(mockRowsResponse(results)),
			hasNext: false,
		});

		({ whereQuery, params } = buildWhereWithNamedParameters(scopeFilter));
		query = SELECT_QUERY({ selection: '*', table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = econMonthly.slice(count - 1, count);
		[results] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = econMonthly;
		mockGetQueryResultsResultRows = 1;

		await expect(
			service.getMonthlyExportById(mockExportId, count - 1, 1, mockProject, mockScenarioId, mockEconRun),
		).resolves.toStrictEqual({
			result: toApiMonthlyExport(mockRowsResponse(results)),
			hasNext: false,
		});

		({ whereQuery, params } = buildWhereWithNamedParameters({
			comboName: { value: 'default1', operator: '=' },
			...scopeFilter,
		}));
		query = SELECT_QUERY({ selection: '*', table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = econMonthly.filter((monthly) => monthly.combo_name === 'default1');
		[results] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = econMonthly.filter((monthly) => monthly.combo_name === 'default1');
		mockGetQueryResultsResultRows = mockGetQueryResultsResult.length;

		await expect(
			service.getMonthlyExportById(mockExportId, 0, count + 1, mockProject, mockScenarioId, mockEconRun),
		).resolves.toStrictEqual({
			result: toApiMonthlyExport(mockRowsResponse(results)),
			hasNext: false,
		});

		({ whereQuery, params } = buildWhereWithNamedParameters(scopeFilter));
		query = SELECT_QUERY({ selection: '*', table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = econMonthly.slice(0, 1);
		[results] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = econMonthly.slice(0, 1);
		mockGetQueryResultsResultRows = econMonthly.length;

		await expect(
			service.getMonthlyExportById(mockExportId, 0, 1, mockProject, mockScenarioId, mockEconRun),
		).resolves.toStrictEqual({
			result: toApiMonthlyExport(mockRowsResponse(results)),
			hasNext: true,
		});

		({ whereQuery, params } = buildWhereWithNamedParameters(scopeFilter));
		query = SELECT_QUERY({ selection: '*', table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = econMonthly.slice(econMonthly.length - 1, 1);
		[results] = await context.bigQueryClient.query({ query, params });

		mockGetQueryResultsResult = econMonthly.slice(econMonthly.length - 1, 1);
		mockGetQueryResultsResultRows = econMonthly.length;

		await expect(
			service.getMonthlyExportById(
				mockExportId,
				econMonthly.length - 1,
				1,
				mockProject,
				mockScenarioId,
				mockEconRun,
			),
		).resolves.toStrictEqual({
			result: toApiMonthlyExport(mockRowsResponse(results)),
			hasNext: false,
		});
	});
	test('getEconMonthlyCount', async () => {
		mockProject = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		mockDatasetId = '885d6969-2ee0-4b85-ab8d-607536c8041e';
		mockTableId = '4a2fd1dc-4d45-4126-b5e3-8c93b099c6e2';
		mockScenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		mockEconRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};
		scopeFilter = {
			project_id: { value: mockProject.toString(), operator: '=' },
			scenario_id: { value: mockScenarioId.toString(), operator: '=' },
			run_id: { value: mockEconRun.id, operator: '=' },
			run_date: { value: mockEconRun.runDate, operator: '=' },
		};

		const { whereQuery, params } = buildWhereWithNamedParameters(scopeFilter);

		const query = COUNT_QUERY({ table: table(econMonthlyPath), where: whereQuery });

		mockQueryResult = [{ count: econMonthly.length }];
		let [[{ count }]] = await context.bigQueryClient.query({ query, params });

		await expect(service.getEconMonthlyCount({}, mockProject, mockScenarioId, mockEconRun)).resolves.toBe(count);

		mockQueryResult = [{ count: econMonthly.length }];
		[[{ count }]] = await context.bigQueryClient.query({ query, params });
		await expect(
			service.getEconMonthlyCount({ notEconMonthlyField: ['test'] }, mockProject, mockScenarioId, mockEconRun),
		).resolves.toBe(count);
	});
});
