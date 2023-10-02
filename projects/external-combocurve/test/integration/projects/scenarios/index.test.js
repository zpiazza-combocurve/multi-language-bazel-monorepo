const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../config');
const { connectToDb } = require('../../database');
const { createScenarioPayload, createProjectsPayload } = require('../../../helpers/data-generator');
const { testHeadMethod } = require('../../helpers/test/head-methods');
const { toApiProject } = require('../fields');

const { toApiScenario } = require('./fields');

const SCENARIO_COUNT = 2;

let app;
let connection;
let scenarios;
let project;

describe('/v1/projects/{projectId}/scenarios', () => {
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
		scenarios = createScenarioPayload(SCENARIO_COUNT, { project: ObjectId(project.id) });
		await connection.collection('scenarios').insertMany(scenarios);
		scenarios = scenarios.map(toApiScenario);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get scenarios', async () => {
		const scenariosResponse = await Promise.all(
			scenarios.map(
				async (s) => await app.get(`/v1/projects/${project.id}/scenarios?name=${s.name}`).set(config.headers),
			),
		);

		for (let index = 0; index < scenariosResponse.length; index++) {
			expect(scenariosResponse[index].status).toBe(200);
			expect(scenariosResponse[index].body[0]).toMatchObject(scenarios[index]);
		}

		expect(scenariosResponse.length).toBe(scenarios.length);
	});

	test('Get scenario by id', async () => {
		const [scenario] = scenarios;

		const scenarioResponse = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}`)
			.set(config.headers);

		expect(scenarioResponse.status).toBe(200);
		expect(scenarioResponse.body).toMatchObject(scenario);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD scenarios', async () => {
		await testHeadMethod(app, `/v1/projects/${project.id}/scenarios`, config.headers, SCENARIO_COUNT);
	});

	async function checkScenario(name, id) {
		const scenarioGetResponse = await app.get(`/v1/projects/${project.id}/scenarios/${id}`).set(config.headers);

		expect(scenarioGetResponse.status).toBe(200);
		expect(scenarioGetResponse.body.name).toBe(name);
	}

	function assertMultiStatus(response, statusName) {
		expect(response.status).toBe(207);
		expect(response.body.successCount).toBe(1);
		expect(response.body.results.length).toBe(1);
		expect(response.body.results[0].status).toBe(statusName);
	}

	test('POST, PUT and delete scenario', async () => {
		let name = 'Integration Scenario' + Math.random();

		// Add new one
		const post = await app
			.post(`/v1/projects/${project.id}/scenarios/`)
			.send({
				name: name,
			})
			.set(config.headers);

		assertMultiStatus(post, 'Created');
		checkScenario(name, post.body.results[0].chosenID);

		// Update it
		name = name + ' Updated';

		const id = post.body.results[0].chosenID;
		const put = await app
			.put(`/v1/projects/${project.id}/scenarios/`)
			.send({
				name,
				id,
			})
			.set(config.headers);

		assertMultiStatus(put, 'Updated');
		checkScenario(name, id);

		// Delete it
		const deleteOutput = await app
			.delete(`/v1/projects/${project.id}/scenarios?id=${id}`, {
				name: name + ' Updated',
				id,
			})
			.set(config.headers);

		expect(deleteOutput.status).toBe(204);
		expect(deleteOutput.headers['x-delete-count']).toBe('1');
	});
});
