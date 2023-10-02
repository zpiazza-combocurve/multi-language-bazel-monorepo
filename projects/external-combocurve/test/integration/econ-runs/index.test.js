const { formatISO } = require('date-fns');
const { keyBy, random } = require('lodash');
const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../config');
const { connectToDb } = require('../database');
const {
	createProjectsPayload,
	createScenarioPayload,
	createEconRunPayload,
	createTagsPayload,
} = require('../../helpers/data-generator');
const { testHeadMethod } = require('../helpers/test/head-methods');
const { toApiProject } = require('../projects/fields');
const { toApiScenario } = require('../projects/scenarios/fields');

const { toApiEconRun } = require('./fields');

const ECON_RUN_COUNT = 2;

let app;
let connection;
let scenarios;
let econRuns;
/** @type {any[]} */
let project;

describe('/v1/econ-runs', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create scenario in db scoped to this project
		scenarios = createScenarioPayload(ECON_RUN_COUNT, { project: ObjectId(project.id) });
		await connection.collection('scenarios').insertMany(scenarios);
		scenarios = scenarios.map(toApiScenario);

		// Create tags in db
		const tags = createTagsPayload(ECON_RUN_COUNT);
		await connection.collection('tags').insertMany(tags);

		// Create econ run scoped to this project and scenario` in db
		econRuns = createEconRunPayload(2, {
			project: ObjectId(project.id),
		}).map((r, i) => ({ ...r, scenario: ObjectId(scenarios[i].id) }));

		econRuns = [
			{ ...econRuns[0], tags: tags.map((tag) => tag._id) },
			...econRuns.slice(1).map((econRun) => ({
				...econRun,
				tags: random(1) === 1 ? [tags[random(ECON_RUN_COUNT - 1)]._id.toString()] : [],
			})),
		];
		await connection.collection('econ-runs').insertMany(econRuns);

		const tagsMap = keyBy(tags, (t) => t._id.toString());
		econRuns = econRuns.map((run) => toApiEconRun(run, tagsMap));
	});

	afterAll(() => {
		connection.close();
	});

	test('Get econ runs', async () => {
		const econRunsResponse = await Promise.all(
			econRuns.map(async (r) => await app.get(`/v1/econ-runs?scenario=${r.scenario}`).set(config.headers)),
		);

		for (let index = 0; index < econRunsResponse.length; index++) {
			expect(econRunsResponse[index].status).toBe(200);
			expect(econRunsResponse[index].body.length).toBe(1);
			expect(econRunsResponse[index].body[0]).toMatchObject(econRuns[index]);
		}

		expect(econRunsResponse.length).toBe(econRuns.length);
	});

	test('Get econ runs filter runDate less than or equal comparison', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[le]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT);
	});

	test('Get econ runs filter runDate less than or equal comparison 2/2', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[le]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);
	});

	test('Get econ runs filter runDate comparison unknown', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[unknown]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(400);
	});

	test('Get econ runs filter runDate less than comparison 1/2', async () => {
		let response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[lt]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);

		response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[lt]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT - 1);
	});

	test('Get econ runs filter runDate less than comparison 2/2', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[lt]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT - 1);
	});

	test('Get econ runs filter runDate greater or equal than comparison 1/2', async () => {
		let response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[ge]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT);
	});

	test('Get econ runs filter runDate greater or equal than comparison 2/2', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[ge]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);
	});

	test('Get econ runs filter runDate greater than comparison 1/3', async () => {
		const response = await app
			.get(
				`/v1/econ-runs?project=${project.id}&runDate[gt]=${formatISO(new Date(econRuns[0].runDate), {
					representation: 'date',
				})}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(2);
	});

	test('Get econ runs filter runDate greater than comparison 2/3', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[gt]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT - 1);
	});

	test('Get econ runs filter runDate greater than comparison 3/3', async () => {
		const response = await app
			.get(`/v1/econ-runs?project=${project.id}&runDate[gt]=${econRuns[ECON_RUN_COUNT - 1].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	test('Get econ run by id', async () => {
		const [econRun] = econRuns;

		const econRunResponse = await app.get(`/v1/econ-runs/${econRun.id}`).set(config.headers);

		expect(econRunResponse.status).toBe(200);
		expect(econRunResponse.body).toEqual(econRun);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD econ-runs', async () => {
		await testHeadMethod(app, `/v1/econ-runs`, config.headers, ECON_RUN_COUNT, { project: project.id });
	});
});
