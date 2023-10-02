const request = require('supertest');

const {
	createMonthlyProductionsPayload,
	createProjectsPayload,
	createWellsPayload,
} = require('../../../helpers/data-generator');
const { expectToBeCloseTimestamp, splitTimestamp } = require('../../helpers/timestamp');
const config = require('../../config');
const { connectToDb } = require('../../database');
const { toApiProject } = require('../fields');
const { testHeadMethod } = require('../../helpers/test/head-methods');

const MONTHLY_PRODUCTION_COUNT = 2;

let app;
let connection;
let project;
let well;

describe('/v1/projects/{projectId}/monthly-productions', () => {
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

	afterEach(async () => {
		await app.delete(`/v1/monthly-productions?well=${well.id}`).set(config.headers);
		await app.delete(`/v1/wells/${well.id}`).set(config.headers);
		await connection.collection('projects').deleteOne(project);
	});

	test('Post monthlyProductions using wellId', async () => {
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(monthlyProductions.length);

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(monthlyProductions.length);

		let expectedMonthlies = monthlyProductions.map((m) => ({ ...m, date: new Date(m.date) }));
		expectedMonthlies.forEach((m) => m.date.setUTCDate(15));
		expectedMonthlies = expectedMonthlies.map((m) => ({ ...m, date: m.date.toJSON() }));

		const received = splitTimestamp(response.body.sort((m) => m.date));

		expect(received.map((m) => m.withoutTimestamp)).toEqual(expectedMonthlies.sort((m) => m.date));

		received.forEach((element) => {
			expectToBeCloseTimestamp(element.timestamp);
		});
	});

	test('Post single monthlyProduction using wellId', async () => {
		const [monthlyProduction] = createMonthlyProductionsPayload(1, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProduction)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(1);

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(1);

		let expectedMonthly = { ...monthlyProduction, date: new Date(monthlyProduction.date) };
		expectedMonthly.date.setUTCDate(15);
		expectedMonthly = { ...expectedMonthly, date: expectedMonthly.date.toJSON() };

		const received = splitTimestamp(response.body);

		expect(received[0].withoutTimestamp).toEqual(expectedMonthly);

		expectToBeCloseTimestamp(received[0].timestamp);
	});

	test('Post monthlyProductions using dataSource and chosenID', async () => {
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(monthlyProductions.length);

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(monthlyProductions.length);

		let expectedMonthlies = monthlyProductions.map((m) => ({
			...m,
			date: new Date(m.date),
			well: well.id,
			dataSource: undefined,
			chosenID: undefined,
		}));
		expectedMonthlies.forEach((m) => m.date.setUTCDate(15));
		expectedMonthlies = expectedMonthlies.map((m) => ({ ...m, date: m.date.toJSON() }));

		const received = splitTimestamp(response.body.sort((m) => m.date));

		expect(received.map((m) => m.withoutTimestamp)).toEqual(expectedMonthlies.sort((d) => d.date));

		received.forEach((element) => {
			expectToBeCloseTimestamp(element.timestamp);
		});
	});

	test('Post single monthlyProduction using dataSource and chosenID', async () => {
		const [monthlyProduction] = createMonthlyProductionsPayload(1, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProduction)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(1);

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(1);

		let expectedMonthly = {
			...monthlyProduction,
			date: new Date(monthlyProduction.date),
			well: well.id,
			dataSource: undefined,
			chosenID: undefined,
		};
		expectedMonthly.date.setUTCDate(15);
		expectedMonthly = { ...expectedMonthly, date: expectedMonthly.date.toJSON() };

		const received = splitTimestamp(response.body);

		expect(received[0].withoutTimestamp).toEqual(expectedMonthly);

		expectToBeCloseTimestamp(received[0].timestamp);
	});

	test('PUT monthly-productions', async () => {
		const monthlyProduction = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProduction)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(MONTHLY_PRODUCTION_COUNT);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(MONTHLY_PRODUCTION_COUNT);

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);
		const createdMonthlyProduction = response.body;

		let updatedMonthlyProduction = createdMonthlyProduction.map((monthlyProduction, index) => ({
			...monthlyProduction,
			operationalTag: `Updated Test Tag - ${index}`,
			water: 44522,
		}));

		let updatedResponse = await app
			.put(`/v1/projects/${project.id}/monthly-productions`)
			.send(updatedMonthlyProduction)
			.set(config.headers);

		expect(updatedResponse.status).toBe(207);

		expect(updatedResponse.body.successCount).toBe(MONTHLY_PRODUCTION_COUNT);

		updatedMonthlyProduction = splitTimestamp(updatedMonthlyProduction).map(({ withoutTimestamp }) => {
			const monthlyProductionWithDate = {
				...withoutTimestamp,
				date: new Date(withoutTimestamp.date),
			};
			return monthlyProductionWithDate;
		});

		response = await app.get(`/v1/projects/${project.id}/monthly-productions?well=${well.id}`).set(config.headers);

		const responseWithoutTimeStamp = splitTimestamp(response.body).map(({ withoutTimestamp }) => {
			const monthlyProductionWithDate = {
				...withoutTimestamp,
				date: new Date(withoutTimestamp.date),
			};
			return monthlyProductionWithDate;
		});

		expect(responseWithoutTimeStamp.map((m) => m)).toEqual(updatedMonthlyProduction.sort((m) => m.date));
	});

	test('HEAD monthlyProduction should return correct count', async () => {
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app
			.post(`/v1/projects/${project.id}/monthly-productions`)
			.send(monthlyProductions)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/monthly-productions`,
			config.headers,
			MONTHLY_PRODUCTION_COUNT,
		);
	});
});
