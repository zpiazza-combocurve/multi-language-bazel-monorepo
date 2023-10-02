const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createOwnershipReversionsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

const OWNERSHIP_REVERSION_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/ownership-reversions', () => {
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

	test('Post and get non unique ownershipReversions', async () => {
		const ownershipReversions = createOwnershipReversionsPayload(OWNERSHIP_REVERSION_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/ownership-reversions`)
			.send(ownershipReversions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipReversions.length);

		const ownershipReversionResponse = await Promise.all(
			ownershipReversions.map(
				async (or) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/ownership-reversions?name=${or.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < ownershipReversionResponse.length; index++) {
			expect(ownershipReversionResponse[index].status).toBe(200);
			expect(ownershipReversionResponse[index].body[0]).toMatchObject(ownershipReversions[index]);
		}

		expect(ownershipReversionResponse.length).toBe(ownershipReversions.length);
	});

	test('Post and get unique ownershipReversions', async () => {
		const ownershipReversions = createOwnershipReversionsPayload(OWNERSHIP_REVERSION_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/ownership-reversions`)
			.send(ownershipReversions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipReversions.length);

		const ownershipReversionResponse = await Promise.all(
			ownershipReversions.map(
				async (or) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/ownership-reversions?name=${or.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < ownershipReversionResponse.length; index++) {
			expect(ownershipReversionResponse[index].status).toBe(200);
			expect(ownershipReversionResponse[index].body[0]).toMatchObject(ownershipReversions[index]);
		}

		expect(ownershipReversionResponse.length).toBe(ownershipReversions.length);
	});

	test('HEAD ownership-reversions', async () => {
		const ownershipReversions = createOwnershipReversionsPayload(OWNERSHIP_REVERSION_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/ownership-reversions`)
			.send(ownershipReversions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipReversions.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/ownership-reversions`,
			config.headers,
			OWNERSHIP_REVERSION_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE ownership-reversions', async () => {
		const ownershipReversions = createOwnershipReversionsPayload(OWNERSHIP_REVERSION_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/ownership-reversions`)
			.send(ownershipReversions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipReversions.length);

		// Get created ownership reversions
		response = await app.get(`/v1/projects/${project.id}/econ-models/ownership-reversions`).set(config.headers);

		expect(response.status).toBe(200);

		// Delete ownership reversions
		response = await app
			.delete(`/v1/projects/${project.id}/econ-models/ownership-reversions/${response.body[0].id}`)
			.set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('1');

		// Check if deleted
		response = await app.head(`/v1/projects/${project.id}/econ-models/ownership-reversions`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('1');
	});
});
