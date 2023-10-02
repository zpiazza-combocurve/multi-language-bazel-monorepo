const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../../../config');
const { connectToDb } = require('../../../../database');
const {
	createEconMonthlyPayload,
	createEconRunPayload,
	createProjectsPayload,
	createScenarioPayload,
} = require('../../../../../helpers/data-generator');
const { getTenantInfo } = require('../../../../tenant');
const { initBigQueryClient } = require('../../../../bigQuery');
const { toApiEconRun } = require('../../../../econ-runs/fields');
const { toApiProject } = require('../../../fields');
const { toApiScenario } = require('../../fields');
const { toBigQueryDate } = require('../../../../../helpers/dates');

const {
	toApiEconMonthly,
	toEconMonthlyTableSchema,
	toWellHeaderTableSchema,
	toMetadataTableSchema,
} = require('./fields');

const ECON_MONTHLIES_COUNT = 2;
const ECON_MONTHLY_TABLE_NAME = 'econ_v2_monthly';
const ECON_WELL_HEADER_TABLE = 'econ_v2_wells';
const METADATA_TABLE = 'econ_v2_metadata';

/** @type { request.SuperTest<request.Test } */
let app;
let bigQueryClient;
let connection;
let bigQueryDataset;
/** @type {any[]} */
let econMonthlies;
let econRun;
let project;
let scenario;
let tenantInfo;

describe('/v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs/{econRunId}/monthly-exports', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		tenantInfo = await getTenantInfo();
		bigQueryClient = initBigQueryClient();
		bigQueryDataset = bigQueryClient.dataset(tenantInfo.bigQueryDataset);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create scenario in db scoped to this project
		[scenario] = createScenarioPayload(1, { project: ObjectId(project.id) });
		await connection.collection('scenarios').insertOne(scenario);
		scenario = toApiScenario(scenario);

		// Create econ run scoped to this project and scenario in db
		[econRun] = createEconRunPayload(1, {
			project: ObjectId(project.id),
			scenario: ObjectId(scenario.id),
		});
		await connection.collection('econ-runs').insertOne(econRun);
		econRun = toApiEconRun(econRun);

		// Create econ monthly scoped to this project, scenario and econ run in db
		econMonthlies = createEconMonthlyPayload(ECON_MONTHLIES_COUNT, {
			project_id: project.id,
			run_id: econRun.id,
			run_date: toBigQueryDate(new Date(econRun.runDate)),
			scenario_id: scenario.id,
		});
		await bigQueryDataset.table(ECON_MONTHLY_TABLE_NAME).insert(econMonthlies.map(toEconMonthlyTableSchema));
		await bigQueryDataset.table(ECON_WELL_HEADER_TABLE).insert(econMonthlies.map(toWellHeaderTableSchema));
		// Metadata should be specified only once if the econ run has multiple monthly exports
		await bigQueryDataset.table(METADATA_TABLE).insert(toMetadataTableSchema(econMonthlies[0]));
		econMonthlies = econMonthlies.map(toApiEconMonthly);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get monthly export', async () => {
		const monthlyExportsResponse = await Promise.all(
			econMonthlies.map(
				async (m) =>
					await app
						.post(
							`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?well=${m.well}`,
						)
						.set(config.headers),
			),
		);

		for (let index = 0; index < monthlyExportsResponse.length; index++) {
			expect(monthlyExportsResponse[index].status).toBe(200);
			expect(monthlyExportsResponse[index].body.id).toBeTruthy();
			expect(typeof monthlyExportsResponse[index].body.id).toBe('string');
		}

		expect(monthlyExportsResponse.length).toBe(econMonthlies.length);

		const monthlyExportJobs = monthlyExportsResponse.map((me) => me.body);

		const monthlyExportResultsResponse = await Promise.all(
			monthlyExportJobs.map(
				async (me) =>
					await app
						.get(
							`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${me.id}?take=2`,
						)
						.set(config.headers),
			),
		);

		for (let index = 0; index < monthlyExportResultsResponse.length; index++) {
			expect(monthlyExportResultsResponse[index].status).toBe(200);
			expect(monthlyExportResultsResponse[index].body.status).toBe('completed');
			expect(monthlyExportResultsResponse[index].body.results.length).toBe(1);
			expect(monthlyExportResultsResponse[index].body.results[0]).toEqual(econMonthlies[index]);
		}
	});

	test('Get monthly export filter date relative comparison', async () => {
		let createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		let getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(1);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[lt]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(0);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[le]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(1);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[ge]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(ECON_MONTHLIES_COUNT);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[gt]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(ECON_MONTHLIES_COUNT - 1);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[gt]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(0);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[ge]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(1);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[le]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(ECON_MONTHLIES_COUNT);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[lt]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(200);
		expect(typeof createResponse?.body?.id).toBe('string');

		getMonthlyExportResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports/${
					createResponse.body.id
				}?take=${econMonthlies.length + 1}`,
			)
			.set(config.headers);
		expect(getMonthlyExportResponse.status).toBe(200);
		expect(getMonthlyExportResponse.body.status).toBe('completed');
		expect(getMonthlyExportResponse.body.results.length).toBe(ECON_MONTHLIES_COUNT - 1);

		createResponse = await app
			.post(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${
					econRun.id
				}/monthly-exports?date[unknown]=${econMonthlies[ECON_MONTHLIES_COUNT - 1].date}`,
			)
			.set(config.headers);
		expect(createResponse.status).toBe(400);
	});

	test('Count monthly export filter date relative comparison', async () => {
		let response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe('1');

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[lt]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe('0');

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[le]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe('1');

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[ge]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe(`${ECON_MONTHLIES_COUNT}`);

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[gt]=${econMonthlies[0].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe(`${ECON_MONTHLIES_COUNT - 1}`);

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[gt]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe('0');

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[ge]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe('1');

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[le]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe(`${ECON_MONTHLIES_COUNT}`);

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/monthly-exports?date[lt]=${
					econMonthlies[ECON_MONTHLIES_COUNT - 1].date
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.headers['x-query-count']).toBe(`${ECON_MONTHLIES_COUNT - 1}`);

		response = await app
			.head(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${
					econRun.id
				}/monthly-exports?date[unknown]=${econMonthlies[ECON_MONTHLIES_COUNT - 1].date}`,
			)
			.set(config.headers);
		expect(response.status).toBe(400);
	});
});
