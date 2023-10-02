const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createEscalationsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { testDeleteMethod } = require('../../../helpers/test/delete-methods');

const ESCALATIONS_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/escalations', () => {
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

	test('Post and get non unique escalations', async () => {
		const escalations = createEscalationsPayload(ESCALATIONS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(escalations.length);
		const escalationsResponse = await Promise.all(
			escalations.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/escalations?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < escalationsResponse.length; index++) {
			expect(escalationsResponse[index].status).toBe(200);
			expect(escalationsResponse[index].body[0]).toMatchObject(escalations[index]);
		}

		expect(escalationsResponse.length).toBe(escalations.length);
	});

	test('Post and get unique escalations', async () => {
		const escalations = createEscalationsPayload(ESCALATIONS_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(escalations.length);

		const reservesCategoryResponse = await Promise.all(
			escalations.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/escalations?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(escalations[index]);
		}

		expect(reservesCategoryResponse.length).toBe(escalations.length);
	});

	test('HEAD escalations', async () => {
		const escalations = createEscalationsPayload(ESCALATIONS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(escalations.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/escalations`,
			config.headers,
			ESCALATIONS_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE escalations', async () => {
		const escalations = createEscalationsPayload(1, { unique: false });
		const createResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);
		let response = await app.get(`/v1/projects/${project.id}/econ-models/escalations`).set(config.headers);

		const escalationsModelId = response.body[0].id;
		expect(createResponse.status).toBe(207);

		expect(createResponse.body.successCount).toBe(escalations.length);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(escalations.length);

		await testDeleteMethod(
			app,
			`/v1/projects/${project.id}/econ-models/escalations/${escalationsModelId}`,
			config.headers,
			1,
		);
	});

	test('PUT Upsert escalations', async () => {
		const escalations = createEscalationsPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/escalations`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		escalations[0].unique = true;
		escalations[0].scenario = scenario.id;
		escalations[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/escalations`)
			.send(escalations)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/escalations`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(escalations.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(escalations.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(escalations.length);
	});
});
