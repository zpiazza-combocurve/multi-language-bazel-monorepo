const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createFluidModelsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { testDeleteMethod } = require('../../../helpers/test/delete-methods');

const productionTaxes_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/fluid-Models', () => {
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

	test('Post and get non unique fluidModels', async () => {
		const payload = createFluidModelsPayload(productionTaxes_COUNT, { unique: false });

		let postResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);

		expect(postResponse.status).toBe(207);

		expect(postResponse.body.successCount).toBe(payload.length);

		const getResponse = await Promise.all(
			payload.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/fluid-models?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < getResponse.length; index++) {
			expect(getResponse[index].status).toBe(200);
			expect(getResponse[index].body[0]).toMatchObject(payload[index]);
		}

		expect(getResponse.length).toBe(payload.length);
	});

	test('Post and get unique fluidModels', async () => {
		const payload = createFluidModelsPayload(productionTaxes_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let postResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);

		expect(postResponse.status).toBe(207);

		expect(postResponse.body.successCount).toBe(payload.length);

		const getResponse = await Promise.all(
			payload.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/fluid-models?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < getResponse.length; index++) {
			expect(getResponse[index].status).toBe(200);
			expect(getResponse[index].body[0]).toMatchObject(payload[index]);
		}

		expect(getResponse.length).toBe(payload.length);
	});

	test('HEAD productionTaxes', async () => {
		const payload = createFluidModelsPayload(productionTaxes_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(payload.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/fluid-models`,
			config.headers,
			productionTaxes_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE fluidModels', async () => {
		const payload = createFluidModelsPayload(1, { unique: false });
		const createResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);
		let response = await app.get(`/v1/projects/${project.id}/econ-models/fluid-models`).set(config.headers);

		const modelId = response.body[0].id;
		expect(createResponse.status).toBe(207);

		expect(createResponse.body.successCount).toBe(payload.length);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(payload.length);

		await testDeleteMethod(
			app,
			`/v1/projects/${project.id}/econ-models/fluid-models/${modelId}`,
			config.headers,
			1,
		);
	});

	test('PUT Upsert fluidModels', async () => {
		const payload = createFluidModelsPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/fluid-models`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		payload[0].unique = true;
		payload[0].scenario = scenario.id;
		payload[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/fluid-models`)
			.send(payload)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/fluid-models`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(payload.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(payload.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(payload.length);
	});
});
