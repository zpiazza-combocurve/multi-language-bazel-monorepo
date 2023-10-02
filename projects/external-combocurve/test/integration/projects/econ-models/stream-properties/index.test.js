const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const { connectToDb } = require('../../../database');
const config = require('../../../config');
const {
	createScenarioPayload,
	createProjectsPayload,
	createStreamPropertiesPayload,
	createWellsDbPayload,
} = require('../../../../helpers/data-generator');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../../scenarios/fields');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { testDeleteMethod } = require('../../../helpers/test/delete-methods');

const STREAM_PROPERTIES_COUNT = 2;

let app;
let connection;
let scenario;
let well;
let project;

describe('/v1/projects/{projectId}/econ-models/stream-properties', () => {
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

	test('Post and get non unique stream-properties', async () => {
		const streamProperties = createStreamPropertiesPayload(STREAM_PROPERTIES_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(streamProperties.length);
		const streamPropertiesResponse = await Promise.all(
			streamProperties.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/stream-properties?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < streamPropertiesResponse.length; index++) {
			expect(streamPropertiesResponse[index].status).toBe(200);
			expect(streamPropertiesResponse[index].body[0]).toMatchObject(streamProperties[index]);
		}

		expect(streamPropertiesResponse.length).toBe(streamProperties.length);
	});

	test('Post and get unique stream-properties', async () => {
		const streamProperties = createStreamPropertiesPayload(STREAM_PROPERTIES_COUNT, {
			unique: true,
			scenario: scenario.id,
			well: well._id.toString(),
		});

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(streamProperties.length);

		const reservesCategoryResponse = await Promise.all(
			streamProperties.map(
				async (rc) =>
					await app
						.get(`/v1/projects/${project.id}/econ-models/stream-properties?name=${rc.name}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < reservesCategoryResponse.length; index++) {
			expect(reservesCategoryResponse[index].status).toBe(200);
			expect(reservesCategoryResponse[index].body[0]).toMatchObject(streamProperties[index]);
		}

		expect(reservesCategoryResponse.length).toBe(streamProperties.length);
	});

	test('HEAD stream-properties', async () => {
		const streamProperties = createStreamPropertiesPayload(STREAM_PROPERTIES_COUNT, { unique: false });

		let response = await app
			.post(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(streamProperties.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/econ-models/stream-properties`,
			config.headers,
			STREAM_PROPERTIES_COUNT,
			{
				unique: false,
			},
		);
	});

	test('DELETE stream-properties', async () => {
		const streamProperties = createStreamPropertiesPayload(1, { unique: false });
		const createResponse = await app
			.post(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);
		let response = await app.get(`/v1/projects/${project.id}/econ-models/stream-properties`).set(config.headers);

		const streamPropertiesModelId = response.body[0].id;
		expect(createResponse.status).toBe(207);

		expect(createResponse.body.successCount).toBe(streamProperties.length);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(streamProperties.length);

		await testDeleteMethod(
			app,
			`/v1/projects/${project.id}/econ-models/stream-properties/${streamPropertiesModelId}`,
			config.headers,
			1,
		);
	});

	test('PUT Upsert stream-properties', async () => {
		const streamProperties = createStreamPropertiesPayload(1, { unique: false });
		const createPutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);
		let getResponse = await app.get(`/v1/projects/${project.id}/econ-models/stream-properties`).set(config.headers);

		expect(getResponse.body[0].unique).toBe(false);
		expect(getResponse.body[0].scenario).toBe(undefined);
		expect(getResponse.body[0].well).toBe(undefined);
		streamProperties[0].unique = true;
		streamProperties[0].scenario = scenario.id;
		streamProperties[0].well = well._id.toString();

		const updatePutResponse = await app
			.put(`/v1/projects/${project.id}/econ-models/stream-properties`)
			.send(streamProperties)
			.set(config.headers);

		getResponse = await app.get(`/v1/projects/${project.id}/econ-models/stream-properties`).set(config.headers);

		expect(getResponse.status).toBe(200);

		expect(getResponse.body.length).toBe(streamProperties.length);
		expect(getResponse.body[0].unique).toBe(true);
		expect(getResponse.body[0].scenario).toBe(scenario.id);
		expect(getResponse.body[0].well).toBe(well._id.toString());

		expect(updatePutResponse.status).toBe(207);

		expect(updatePutResponse.body.successCount).toBe(streamProperties.length);

		expect(createPutResponse.status).toBe(207);

		expect(createPutResponse.body.successCount).toBe(streamProperties.length);
	});
});
