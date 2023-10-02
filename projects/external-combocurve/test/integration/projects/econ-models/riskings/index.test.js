const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createRiskingsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

const RISKINGS_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/riskings', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create scenarios scoped to this project in db
		let scenarios = createScenarioPayload(1, { project: ObjectId(project.id) });
		await connection.collection('scenarios').insertMany(scenarios);
		scenarios = scenarios.map(toApiScenario);
		[scenario] = scenarios;

		//create wells in db scoped to this project
		const wells = createWellsDbPayload(1, { project: ObjectId(project._id) });
		await connection.collection('wells').insertMany(wells);
		[well] = wells;
	});

	afterAll(() => {
		connection.close();
	});

	test('Post and get non unique riskings', async () => {
		const riskings = createRiskingsPayload(RISKINGS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/riskings`)
			.send(riskings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(riskings.length);
		const riskingResponse = await Promise.all(
			riskings.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/riskings?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < riskingResponse.length; index++) {
			expect(riskingResponse[index].status).toBe(200);
			expect(riskingResponse[index].body[0]).toMatchObject(riskings[index]);
		}

		expect(riskingResponse.length).toBe(riskings.length);
	});

	test('Post and get unique riskings', async () => {
		const riskings = createRiskingsPayload(RISKINGS_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/riskings`)
			.send(riskings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(riskings.length);

		const reservesCategoryResponse = await Promise.all(
			riskings.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/riskings?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(riskings[index]);
		}

		expect(reservesCategoryResponse.length).toBe(riskings.length);
	});

	test('HEAD riskings', async () => {
		const riskings = createRiskingsPayload(RISKINGS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/riskings`)
			.send(riskings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(riskings.length);

		await testHeadMethod(app, `/v1/projects/${project.id}/econ-models/riskings`, config.headers, RISKINGS_COUNT, {
			unique: false,
		});
	});

	test('PUT Upsert riskings', async () => {
		const riskings = createRiskingsPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/riskings`)
			.send(riskings)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/riskings`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		riskings[0].unique = true;
		riskings[0].scenario = scenario.id;
		riskings[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/riskings`)
			.send(riskings)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/riskings`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(riskings.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(riskings.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(riskings.length);
	});
});
