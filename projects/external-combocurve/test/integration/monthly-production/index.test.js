const { add, formatISO, sub } = require('date-fns');
const request = require('supertest');

const { createMonthlyProductionsPayload, createWellsPayload } = require('../../helpers/data-generator');
const { expectToBeCloseTimestamp, splitTimestamp } = require('../helpers/timestamp');
const config = require('../config');
const { testHeadMethod } = require('../helpers/test/head-methods');

const MONTHLY_PRODUCTION_COUNT = 2;

let app;
let well;

describe('monthly-productions test', () => {
	beforeAll(() => {
		app = request(config.apiUrl);
	});

	beforeEach(async () => {
		const [wellPayload] = createWellsPayload(1);

		const response = await app.post('/v1/wells').send(wellPayload).set(config.headers);

		const [postedWell] = response.body.results;

		well = postedWell;
	});

	afterEach(async () => {
		await app.delete(`/v1/monthly-productions?well=${well.id}`).set(config.headers);
		await app.delete(`/v1/wells/${well.id}`).set(config.headers);
	});

	test('Post monthlyProductions using wellId', async () => {
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(monthlyProductions.length);

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

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

	describe('Get monthlyProductions filter createdAt and updatedAt relative comparison', () => {
		const postedDate = new Date();

		beforeEach(async () => {
			const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
				well: well.id,
			});

			await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);
		});

		test('createdAt less than', async () => {
			let response = await app
				.get(
					`/v1/monthly-productions?well=${well.id}&createdAt[lt]=${formatISO(sub(postedDate, { hours: 1 }), {
						representation: 'complete',
					})}`,
				)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(0);
		});

		test('createdAt less than or equal', async () => {
			let response = await app
				.get(
					`/v1/monthly-productions?well=${well.id}&createdAt[le]=${formatISO(add(postedDate, { hours: 1 }), {
						representation: 'complete',
					})}`,
				)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(MONTHLY_PRODUCTION_COUNT);
		});

		test('updatedAt greater than', async () => {
			let response = await app
				.get(
					`/v1/monthly-productions?well=${well.id}&updatedAt[gt]=${formatISO(sub(postedDate, { hours: 1 }), {
						representation: 'complete',
					})}`,
				)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(MONTHLY_PRODUCTION_COUNT);
		});

		test('updatedAt greater than or equal', async () => {
			let response = await app
				.get(
					`/v1/monthly-productions?well=${well.id}&updatedAt[ge]=${formatISO(add(postedDate, { hours: 1 }), {
						representation: 'complete',
					})}`,
				)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(0);
		});
	});

	describe('Get monthlyProductions filter by date', () => {
		let monthlyProductions;

		beforeEach(async () => {
			monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
				well: well.id,
			}).sort((m) => m.date);

			await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);
		});

		afterEach(async () => {
			await app.delete(`/v1/monthly-productions?well=${well.id}`).set(config.headers);
		});

		test('date greater than', async () => {
			let expectedMonthlies = monthlyProductions.map((m) => ({ ...m, date: new Date(m.date) }));
			expectedMonthlies.forEach((m) => m.date.setUTCDate(15));
			expectedMonthlies = expectedMonthlies.map((m) => ({ ...m, date: m.date.toJSON() }));

			let response = await app
				.get(`/v1/monthly-productions?well=${well.id}&date[gt]=${monthlyProductions[0].date.toJSON()}`)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(monthlyProductions.length - 1);

			let received = splitTimestamp(response.body.sort((m) => m.date));

			expect(received.map((m) => m.withoutTimestamp)).toEqual(expectedMonthlies.slice(1));
		});

		test('date less than', async () => {
			let expectedMonthlies = monthlyProductions.map((m) => ({ ...m, date: new Date(m.date) }));
			expectedMonthlies.forEach((m) => m.date.setUTCDate(15));
			expectedMonthlies = expectedMonthlies.map((m) => ({ ...m, date: m.date.toJSON() }));

			let response = await app
				.get(
					`/v1/monthly-productions?well=${well.id}&date[lt]=${monthlyProductions[
						MONTHLY_PRODUCTION_COUNT - 1
					].date.toJSON()}`,
				)
				.set(config.headers);

			expect(response.status).toBe(200);
			expect(response.body.length).toBe(monthlyProductions.length - 1);

			let received = splitTimestamp(response.body.sort((m) => m.date));

			expect(received.map((m) => m.withoutTimestamp)).toEqual(
				expectedMonthlies.slice(0, MONTHLY_PRODUCTION_COUNT - 1),
			);
		});
	});

	test('Post single monthlyProduction using wellId', async () => {
		const [monthlyProduction] = createMonthlyProductionsPayload(1, {
			well: well.id,
		});

		let response = await app.post('/v1/monthly-productions').send(monthlyProduction).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(1);

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

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

		let response = await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(monthlyProductions.length);

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

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

		let response = await app.post('/v1/monthly-productions').send(monthlyProduction).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(1);

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

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

	test('HEAD monthly-productions', async () => {
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			well: well.id,
		});

		let response = await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(monthlyProductions.length);

		await testHeadMethod(app, `/v1/monthly-productions`, config.headers, MONTHLY_PRODUCTION_COUNT, {
			well: well.id,
		});
	});

	test('DELETE monthly-productions', async () => {
		// Insert monthly productions
		const monthlyProductions = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app.post('/v1/monthly-productions').send(monthlyProductions).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(monthlyProductions.length);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(monthlyProductions.length);

		// Count monthly-productions
		response = await app.head(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		const expectCount = response.headers['x-query-count'];

		// Delete monthly-productions
		response = await app.delete(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe(expectCount);

		// Check if deleted
		response = await app.head(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');
	});

	test('PUT monthly-productions', async () => {
		const monthlyProduction = createMonthlyProductionsPayload(MONTHLY_PRODUCTION_COUNT, {
			dataSource: well.dataSource,
			chosenID: well.chosenID,
		});

		let response = await app.post('/v1/monthly-productions').send(monthlyProduction).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(MONTHLY_PRODUCTION_COUNT);

		const postedMonthlyProds = response.body.results;

		expect(postedMonthlyProds.length).toBe(MONTHLY_PRODUCTION_COUNT);

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);
		const createdMonthlyProduction = response.body;

		let updatedMonthlyProduction = createdMonthlyProduction.map((monthlyProduction, index) => ({
			...monthlyProduction,
			operationalTag: `Updated Test Tag - ${index}`,
			water: 44522,
		}));

		let updatedResponse = await app
			.put('/v1/monthly-productions')
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

		response = await app.get(`/v1/monthly-productions?well=${well.id}`).set(config.headers);

		const responseWithoutTimeStamp = splitTimestamp(response.body).map(({ withoutTimestamp }) => {
			const monthlyProductionWithDate = {
				...withoutTimestamp,
				date: new Date(withoutTimestamp.date),
			};
			return monthlyProductionWithDate;
		});

		expect(responseWithoutTimeStamp.map((m) => m)).toEqual(updatedMonthlyProduction.sort((m) => m.date));
	});
});
