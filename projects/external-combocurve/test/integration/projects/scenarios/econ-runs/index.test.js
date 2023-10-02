const { formatISO } = require('date-fns');
const { keyBy, random } = require('lodash');
const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../../config');
const { connectToDb } = require('../../../database');
const {
	createProjectsPayload,
	createScenarioPayload,
	createEconRunPayload,
	createTagsPayload,
} = require('../../../../helpers/data-generator');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { toApiProject } = require('../../fields');
const { toApiScenario } = require('../fields');
const { toApiEconRun } = require('../../../econ-runs/fields');

const ECON_RUN_COUNT = 2;

let app;
let connection;
let scenario;
let econRuns;
let project;

describe('/v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs', () => {
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
		[scenario] = createScenarioPayload(1, { project: ObjectId(project.id) });
		await connection.collection('scenarios').insertOne(scenario);
		scenario = toApiScenario(scenario);

		// Create tags in db
		const tags = createTagsPayload(ECON_RUN_COUNT);
		await connection.collection('tags').insertMany(tags);

		// Create econ run scoped to this project and scenario` in db
		econRuns = createEconRunPayload(ECON_RUN_COUNT, {
			project: ObjectId(project.id),
			scenario: ObjectId(scenario.id),
		});

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
			econRuns.map(
				async (r) =>
					await app
						.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate=${r.runDate}`) // TODO change filter
						.set(config.headers),
			),
		);

		for (let index = 0; index < econRunsResponse.length; index++) {
			expect(econRunsResponse[index].status).toBe(200);
			expect(econRunsResponse[index].body[0]).toMatchObject(econRuns[index]);
		}

		expect(econRunsResponse.length).toBe(econRuns.length);
	});

	test('Get econ runs filter runDate relative comparison', async () => {
		let response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[gt]=${formatISO(
					new Date(econRuns[0].runDate),
					{ representation: 'date' },
				)}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(2);

		response = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[lt]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);

		response = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[le]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);

		response = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[ge]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT);

		response = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[gt]=${econRuns[0].runDate}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT - 1);

		response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[gt]=${
					econRuns[ECON_RUN_COUNT - 1].runDate
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);

		response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[ge]=${
					econRuns[ECON_RUN_COUNT - 1].runDate
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);

		response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[le]=${
					econRuns[ECON_RUN_COUNT - 1].runDate
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT);

		response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[lt]=${
					econRuns[ECON_RUN_COUNT - 1].runDate
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(ECON_RUN_COUNT - 1);

		response = await app
			.get(
				`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs?runDate[unknown]=${
					econRuns[ECON_RUN_COUNT - 1].runDate
				}`,
			)
			.set(config.headers);
		expect(response.status).toBe(400);
	});

	test('Get econ run by id', async () => {
		const [econRun] = econRuns;

		const econRunResponse = await app
			.get(`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs/${econRun.id}`)
			.set(config.headers);

		expect(econRunResponse.status).toBe(200);
		expect(econRunResponse.body).toEqual(econRun);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD econ-runs', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/scenarios/${scenario.id}/econ-runs`,
			config.headers,
			ECON_RUN_COUNT,
		);
	});
});
