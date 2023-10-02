const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createActualForecastPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

let app;
let connection;
let scenario;
let well;
let project;

async function createProject() {
	[project] = createProjectsPayload(1);
	await connection.collection('projects').insertOne(project);
	project = toApiProject(project);
}

async function createScenario() {
	let scenarios = createScenarioPayload(1, { project: ObjectId(project.id) });
	await connection.collection('scenarios').insertMany(scenarios);
	scenarios = scenarios.map(toApiScenario);
	[scenario] = scenarios;
}

async function createWell() {
	const wells = createWellsDbPayload(1, { project: ObjectId(project._id) });
	await connection.collection('wells').insertMany(wells);
	[well] = wells;
}

describe('/v1/projects/{projectId}/econ-models/actual-forecast', () => {
	let url;

	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		await createProject();
		await createScenario();
		await createWell();

		url = `/v1/projects/${project.id}/econ-models/actual-forecast`;
	});

	afterAll(() => {
		connection.close();
	});

	function expectActualModel(got, expected) {
		expect(got.name).toBe(expected.name);
		expect(got.unique).toBe(expected.unique);
		expect(got.actualOrForecast).toMatchObject(expected.actualOrForecast);
	}

	test('POST and GET non unique', async () => {
		const models = createActualForecastPayload(2, { unique: false });

		// POST
		let createResponse = await app.post(url).send(models).set(config.headers);

		expect(createResponse.status).toBe(207);
		expect(createResponse.body.successCount).toBe(models.length);

		// GET
		const getResponses = await Promise.all(
			models.map(async (rc) => await app.get(`${url}?name=${rc.name}`).set(config.headers)),
		);

		expect(getResponses.length).toBe(models.length);

		for (let index = 0; index < getResponses.length; index++) {
			expect(getResponses[index].status).toBe(200);
			expectActualModel(getResponses[index].body[0], models[index]);
		}
	});

	test('POST and GET unique', async () => {
		const models = createActualForecastPayload(2, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		// POST
		let response = await app.post(url).send(models).set(config.headers);

		expect(response.status).toBe(207);
		expect(response.body.successCount).toBe(models.length);

		// GET
		const getResponses = await Promise.all(
			models.map(async (rc) => await app.get(`${url}?name=${rc.name}`).set(config.headers)),
		);

		expect(getResponses.length).toBe(models.length);

		for (let index = 0; index < getResponses.length; index++) {
			expect(getResponses[index].status).toBe(200);
			expectActualModel(getResponses[index].body[0], models[index]);
		}
	});

	test('POST and count HEAD', async () => {
		// POST
		const models = createActualForecastPayload(2, { unique: false });
		let response = await app.post(url).send(models).set(config.headers);

		expect(response.status).toBe(207);
		expect(response.body.successCount).toBe(models.length);

		// HEAD
		await testHeadMethod(app, url, config.headers, 2, {
			unique: false,
		});
	});

	test('PUT upsert', async () => {
		const models = createActualForecastPayload(1, { unique: false });

		// PUT (inserting)
		const createPutResponse = await app.put(url).send(models).set(config.headers);

		expect(createPutResponse.status).toBe(207);
		expect(createPutResponse.body.successCount).toBe(models.length);

		// GET checking
		const firstGet = await app.get(url).set(config.headers);
		let getModel = firstGet.body[0];

		expect(getModel.unique).toBe(false);
		expect(getModel.scenario).toBe(undefined);
		expect(getModel.well).toBe(undefined);

		// PUT (updating)
		models[0].unique = true;
		models[0].scenario = scenario.id;
		models[0].well = well._id.toString();

		const updatePutResponse = await app.put(url).send(models).set(config.headers);

		expect(updatePutResponse.status).toBe(207);
		expect(updatePutResponse.body.successCount).toBe(models.length);

		// GET checking
		const seccondGet = await app.get(url).set(config.headers);
		getModel = seccondGet.body[0];

		expect(seccondGet.status).toBe(200);
		expect(seccondGet.body.length).toBe(models.length);

		expect(getModel.unique).toBe(true);
		expect(getModel.scenario).toBe(scenario.id);
		expect(getModel.well).toBe(well._id.toString());
	});
});
