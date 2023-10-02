const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createReservesCategoriesPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

const RESERVES_CATEGORY_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/reserves-categories', () => {
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

	test('Post and get non unique reservesCategories', async () => {
		const reservesCategories = createReservesCategoriesPayload(RESERVES_CATEGORY_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/reserves-categories`)
			.send(reservesCategories)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(reservesCategories.length);

		const reservesCategoryResponse = await Promise.all(
			reservesCategories.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/reserves-categories?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(reservesCategories[index]);
		}

		expect(reservesCategoryResponse.length).toBe(reservesCategories.length);
	});

	test('Post and get unique reservesCategories', async () => {
		const reservesCategories = createReservesCategoriesPayload(RESERVES_CATEGORY_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/reserves-categories`)
			.send(reservesCategories)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(reservesCategories.length);

		const reservesCategoryResponse = await Promise.all(
			reservesCategories.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/reserves-categories?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(reservesCategories[index]);
		}

		expect(reservesCategoryResponse.length).toBe(reservesCategories.length);
	});

	test('HEAD reserves-categories', async () => {
		const reservesCategories = createReservesCategoriesPayload(RESERVES_CATEGORY_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/reserves-categories`)
			.send(reservesCategories)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(reservesCategories.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/reserves-categories`,
			config.headers,
			RESERVES_CATEGORY_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE reserves-categories', async () => {
		const reservesCategories = createReservesCategoriesPayload(RESERVES_CATEGORY_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/reserves-categories`)
			.send(reservesCategories)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(reservesCategories.length);

		// Get created reserves-categories
		response = await app.get(`/v1/projects/${project.id}/econ-models/reserves-categories`).set(config.headers);

		expect(response.status).toBe(200);

		// Delete reserves-categories
		response = await app
			.delete(`/v1/projects/${project.id}/econ-models/reserves-categories/${response.body[0].id}`)
			.set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('1');

		// Check if deleted
		response = await app.head(`/v1/projects/${project.id}/econ-models/reserves-categories`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('1');
	});
});
