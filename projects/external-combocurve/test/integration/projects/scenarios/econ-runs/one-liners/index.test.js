const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../../../config');
const { connectToDb } = require('../../../../database');
const {
	createEconRunPayload,
	createOneLinerPayload,
	createProjectsPayload,
	createScenarioPayload,
} = require('../../../../../helpers/data-generator');
const { testHeadMethod } = require('../../../../helpers/test/head-methods');
const { toApiProject } = require('../../../fields');
const { toApiScenario } = require('../../fields');
const { toApiEconRun } = require('../../../../econ-runs/fields');

const { toApiOneLiner } = require('./fields');

const ONE_LINERS_COUNT = 2;

let app;
let connection;
let econRun;
let oneLiners;
let project;
let scenario;

describe('/v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs/{econRunId}/one-liners', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
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

		// Create one liners scoped to this project, scenario and econ run in db
		oneLiners = createOneLinerPayload(ONE_LINERS_COUNT, {
			project: ObjectId(project.id),
			run: ObjectId(econRun.id),
			scenario: ObjectId(scenario.id),
		});
		await connection.collection('econ-runs-datas').insertMany(oneLiners);
		oneLiners = oneLiners.map(toApiOneLiner);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get one liners', async () => {
		const oneLinersResponse = await Promise.all(
			oneLiners.map(
				async (ol) =>
					await app
						.get(
							`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/one-liners?well=${ol.well}`,
						)
						.set(config.headers),
			),
		);

		for (let index = 0; index < oneLinersResponse.length; index++) {
			expect(oneLinersResponse[index].status).toBe(200);
			expect(oneLinersResponse[index].body[0]).toEqual(oneLiners[index]);
		}

		expect(oneLinersResponse.length).toBe(oneLiners.length);
	});

	test('Get one liner by id', async () => {
		const [oneLiner] = oneLiners;

		const oneLinerResponse = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/one-liners/${oneLiner.id}`,
			)
			.set(config.headers);

		expect(oneLinerResponse.status).toBe(200);
		expect(oneLinerResponse.body).toEqual(oneLiner);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD one-liners', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}/one-liners`,
			config.headers,
			ONE_LINERS_COUNT,
		);
	});
});
