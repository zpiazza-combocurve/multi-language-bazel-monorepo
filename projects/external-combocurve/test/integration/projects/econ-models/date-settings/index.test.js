const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createDateSettingsPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { testDeleteMethod } = require('../../../helpers/test/delete-methods');

const dateSettings_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/date-settings', () => {
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

	test('Post and get non unique date-settings', async () => {
		const dateSettings = createDateSettingsPayload(dateSettings_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dateSettings.length);
		const dateSettingsResponse = await Promise.all(
			dateSettings.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/date-settings?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < dateSettingsResponse.length; index++) {
			expect(dateSettingsResponse[index].status).toBe(200);
			expect(dateSettingsResponse[index].body[0]).toMatchObject(dateSettings[index]);
		}

		expect(dateSettingsResponse.length).toBe(dateSettings.length);
	});

	test('Post and get unique date-settings', async () => {
		const dateSettings = createDateSettingsPayload(dateSettings_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dateSettings.length);

		const reservesCategoryResponse = await Promise.all(
			dateSettings.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/date-settings?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(dateSettings[index]);
		}

		expect(reservesCategoryResponse.length).toBe(dateSettings.length);
	});

	test('HEAD date-settings', async () => {
		const dateSettings = createDateSettingsPayload(dateSettings_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dateSettings.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/date-settings`,
			config.headers,
			dateSettings_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE date-settings', async () => {
		const dateSettings = createDateSettingsPayload(1, { unique: false });
		const createResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);
		let response = await app.get(`/v1/projects/${project.id}/econ-models/date-settings`).set(config.headers);

		const dateSettingsModelId = response.body[0].id;
		expect(createResponse.status).toBe(207);

		expect(createResponse.body.successCount).toBe(dateSettings.length);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(dateSettings.length);

		await testDeleteMethod(
			app,
			`/v1/projects/${project.id}/econ-models/date-settings/${dateSettingsModelId}`,
			config.headers,
			1,
		);
	});

	test('PUT Upsert date-settings', async () => {
		const dateSettings = createDateSettingsPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/date-settings`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		dateSettings[0].unique = true;
		dateSettings[0].scenario = scenario.id;
		dateSettings[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/date-settings`)
			.send(dateSettings)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/date-settings`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(dateSettings.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(dateSettings.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(dateSettings.length);
	});
});
