const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createDifferentialsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

const DIFFERENTIALS_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/differentials', () => {
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

	test('Post and get non unique differentials', async () => {
		const differentials = createDifferentialsPayload(DIFFERENTIALS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/differentials`)
			.send(differentials)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(differentials.length);
		const differentialResponse = await Promise.all(
			differentials.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/differentials?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < differentialResponse.length; index++) {
			expect(differentialResponse[index].status).toBe(200);
			expect(differentialResponse[index].body[0]).toMatchObject(differentials[index]);
		}

		expect(differentialResponse.length).toBe(differentials.length);
	});

	test('Post and get unique differentials', async () => {
		const differentials = createDifferentialsPayload(DIFFERENTIALS_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/differentials`)
			.send(differentials)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(differentials.length);

		const reservesCategoryResponse = await Promise.all(
			differentials.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/differentials?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(differentials[index]);
		}

		expect(reservesCategoryResponse.length).toBe(differentials.length);
	});

	test('HEAD differentials', async () => {
		const differentials = createDifferentialsPayload(DIFFERENTIALS_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/differentials`)
			.send(differentials)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(differentials.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/differentials`,
			config.headers,
			DIFFERENTIALS_COUNT,
			{
				unique: false,
			},
		);
	});

	test('PUT Upsert differentials', async () => {
		const differentials = createDifferentialsPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/differentials`)
			.send(differentials)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/differentials`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		differentials[0].unique = true;
		differentials[0].scenario = scenario.id;
		differentials[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/differentials`)
			.send(differentials)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/differentials`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(differentials.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(differentials.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(differentials.length);
	});
});
