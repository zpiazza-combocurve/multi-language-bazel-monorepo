const request = require('supertest');

const {
	createDailyProductionsPayload,
	createProjectsPayload,
	createWellsPayload,
} = require('../../../helpers/data-generator');
const { expectToBeCloseTimestamp, splitTimestamp } = require('../../helpers/timestamp');
const config = require('../../config');
const { connectToDb } = require('../../database');
const { toApiProject } = require('../fields');
const { testHeadMethod } = require('../../helpers/test/head-methods');

const DAILY_PRODUCTION_COUNT = 2;

let app;
let connection;
let project;
let well;

describe('/v1/projects/{projectId}/daily-productions', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	afterAll(() => {
		connection.close();
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);

		project = toApiProject(project);

		// Create well in project
		const [wellPayload] = createWellsPayload(1);

		const response = await app.post(`/v1/projects/${project.id}/wells`).send(wellPayload).set(config.headers);

		const [postedWell] = response.body.results;

		well = postedWell;
	});

	test('Post and get dailyProductions using wellId', async () => {
		const dailyProductions = createDailyProductionsPayload(DAILY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/daily-productions`)
			.send(dailyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		response = await app.get(`/v1/projects/${project.id}/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(dailyProductions.length);

		const expectedDailies = dailyProductions.map((d) => ({
			...d,
			date: d.date.toJSON(),
		}));

		const received = splitTimestamp(response.body.sort((d) => d.date));

		expect(received.map((d) => d.withoutTimestamp)).toEqual(expectedDailies.sort((d) => d.date));

		received.forEach((element) => {
			expectToBeCloseTimestamp(element.timestamp);
		});
	});

	test('Post and get single dailyProduction using wellId', async () => {
		const [dailyProduction] = createDailyProductionsPayload(1, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/daily-productions`)
			.send(dailyProduction)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(1);

		response = await app.get(`/v1/projects/${project.id}/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(1);

		const expectedDaily = {
			...dailyProduction,
			date: dailyProduction.date.toJSON(),
		};

		const received = splitTimestamp(response.body);

		expect(received[0].withoutTimestamp).toEqual(expectedDaily);

		expectToBeCloseTimestamp(received[0].timestamp);
	});

	test('Post and get dailyProductions using dataSource and chosenID', async () => {
		const dailyProductions = createDailyProductionsPayload(DAILY_PRODUCTION_COUNT, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/daily-productions`)
			.send(dailyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		response = await app.get(`/v1/projects/${project.id}/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(dailyProductions.length);

		const expectedDailies = dailyProductions.map((d) => ({
			...d,
			date: d.date.toJSON(),
			well: well.id,
			dataSource: undefined,
			chosenID: undefined,
		}));

		const received = splitTimestamp(response.body.sort((d) => d.date));

		expect(received.map((d) => d.withoutTimestamp)).toEqual(expectedDailies.sort((d) => d.date));

		received.forEach((element) => {
			expectToBeCloseTimestamp(element.timestamp);
		});
	});

	test('Post and get single dailyProduction using dataSource and chosenID', async () => {
		const [dailyProduction] = createDailyProductionsPayload(1, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/daily-productions`)
			.send(dailyProduction)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(1);

		response = await app.get(`/v1/projects/${project.id}/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(1);

		const expectedDaily = {
			...dailyProduction,
			date: dailyProduction.date.toJSON(),
			well: well.id,
			dataSource: undefined,
			chosenID: undefined,
		};

		const received = splitTimestamp(response.body);

		expect(received[0].withoutTimestamp).toEqual(expectedDaily);

		expectToBeCloseTimestamp(received[0].timestamp);
	});

	test('HEAD dailyProduction should return correct count', async () => {
		const dailyProductions = createDailyProductionsPayload(DAILY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/daily-productions`)
			.send(dailyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/daily-productions`,
			config.headers,
			DAILY_PRODUCTION_COUNT,
		);
	});
});
