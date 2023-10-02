const { add, formatISO, sub } = require('date-fns');
const request = require('supertest');

const { createDailyProductionsPayload, createWellsPayload } = require('../../helpers/data-generator');
const { expectToBeCloseTimestamp, splitTimestamp } = require('../helpers/timestamp');
const config = require('../config');
const { testHeadMethod } = require('../helpers/test/head-methods');

const DAILY_PRODUCTION_COUNT = 2;

let app;
let well;

const createWellDailyProductions = (wellId) =>
	createDailyProductionsPayload(DAILY_PRODUCTION_COUNT, {
		well: wellId,
	});

describe('daily-productions test', () => {
	beforeAll(() => {
		app = request(config.apiUrl);
	});
	beforeEach(async () => {
		const [wellPayload] = createWellsPayload(1);

		const response = await app.post('/v1/wells').send(wellPayload).set(config.headers);

		const [postedWell] = response.body.results;

		well = postedWell;
	});

	test('Post and get dailyProductions using wellId', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		response = await app.get(`/v1/daily-productions?well=${well.id}`).set(config.headers);

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

	test('Get dailyProductions filter createdAt returns http 200 response', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		const postedDate = new Date();

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		response = await app
			.get(
				`/v1/daily-productions?well=${well.id}&createdAt[lt]=${formatISO(sub(postedDate, { hours: 1 }), {
					representation: 'complete',
				})}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	test('Get dailyProductions filter createdAt returns correct number of record', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		const postedDate = new Date();

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		response = await app
			.get(
				`/v1/daily-productions?well=${well.id}&createdAt[le]=${formatISO(add(postedDate, { hours: 1 }), {
					representation: 'complete',
				})}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(DAILY_PRODUCTION_COUNT);
	});

	test('Get dailyProductions filter updatedAt greater than returns correct number of records', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		const postedDate = new Date();

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		response = await app
			.get(
				`/v1/daily-productions?well=${well.id}&updatedAt[gt]=${formatISO(sub(postedDate, { hours: 1 }), {
					representation: 'complete',
				})}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(DAILY_PRODUCTION_COUNT);
	});

	test('Get dailyProductions filter updatedAt greater than or equal returns correct number of records', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		const postedDate = new Date();

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		response = await app
			.get(
				`/v1/daily-productions?well=${well.id}&updatedAt[ge]=${formatISO(add(postedDate, { hours: 1 }), {
					representation: 'complete',
				})}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	test('Get dailyProductions filter by date less than', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);
		expect(response.status).toBe(207);

		dailyProductions.sort((d) => d.date);

		const expectedDailies = dailyProductions.map((d) => ({ ...d, date: d.date.toJSON() }));

		response = await app
			.get(
				`/v1/daily-productions?well=${well.id}&date[lt]=${dailyProductions[
					DAILY_PRODUCTION_COUNT - 1
				].date.toJSON()}`,
			)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(dailyProductions.length - 1);

		let received = splitTimestamp(response.body.sort((d) => d.date));
		expect(received.map((d) => d.withoutTimestamp)).toEqual(expectedDailies.slice(0, DAILY_PRODUCTION_COUNT - 1));
	});

	test('Get dailyProductions filter by date greater than', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);
		expect(response.status).toBe(207);

		dailyProductions.sort((d) => d.date);

		const expectedDailies = dailyProductions.map((d) => ({ ...d, date: d.date.toJSON() }));

		response = await app
			.get(`/v1/daily-productions?well=${well.id}&date[gt]=${dailyProductions[0].date.toJSON()}`)
			.set(config.headers);
		expect(response.status).toBe(200);
		expect(response.body.length).toBe(dailyProductions.length - 1);

		let received = splitTimestamp(response.body.sort((d) => d.date));
		expect(received.map((d) => d.withoutTimestamp)).toEqual(expectedDailies.slice(1));
	});

	test('Post and get single dailyProduction using wellId', async () => {
		const [dailyProduction] = createDailyProductionsPayload(1, {
			well: well.id,
		});

		let response = await app.post('/v1/daily-productions').send(dailyProduction).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(1);

		response = await app.get(`/v1/daily-productions?well=${well.id}`).set(config.headers);

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

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		response = await app.get(`/v1/daily-productions?well=${well.id}`).set(config.headers);

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

		let response = await app.post('/v1/daily-productions').send(dailyProduction).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(1);

		response = await app.get(`/v1/daily-productions?well=${well.id}`).set(config.headers);

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

	test('HEAD daily-productions', async () => {
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		await testHeadMethod(app, `/v1/daily-productions`, config.headers, DAILY_PRODUCTION_COUNT, { well: well.id });
	});

	test('DELETE daily-productions', async () => {
		// Insert daily productions
		const dailyProductions = createWellDailyProductions(well.id);

		let response = await app.post('/v1/daily-productions').send(dailyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(dailyProductions.length);

		const postedDailyProds = response.body.results;

		expect(postedDailyProds.length).toBe(dailyProductions.length);

		// Count daily-productions
		response = await app.head(`/v1/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		const expectCount = response.headers['x-query-count'];

		// Delete daily-productions
		response = await app.delete(`/v1/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe(expectCount);

		// Check if deleted
		response = await app.head(`/v1/daily-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');
	});
});
