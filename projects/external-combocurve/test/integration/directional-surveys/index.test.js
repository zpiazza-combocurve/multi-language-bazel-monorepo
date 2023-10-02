const request = require('supertest');

const config = require('../config');
const { connectToDb } = require('../database');
const { createWellsPayload, createDirectionalSurveys } = require('../../helpers/data-generator');

let app;
let connection;
let well;

async function createWell() {
	const [wellPayload] = createWellsPayload(1);
	const response = await app.post('/v1/wells').send(wellPayload).set(config.headers);
	[well] = response.body.results;
}

describe('/v1/econ-runs', () => {
	const uri = `/v1/directional-surveys`;

	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		await createWell();
	});

	afterAll(() => {
		connection.close();
	});

	async function post(ds) {
		const response = await app.post(uri).send(ds).set(config.headers);

		expect(response.status).toBe(201);
		expect(response.body.code).toBe(201);
		expect(response.body.status).toBe('created');

		return response.body.chosenID;
	}

	async function put(dsID, payload) {
		const response = await app.put(`${uri}/${dsID}`).send(payload).set(config.headers);

		expect(response.status).toBe(200);
		expect(response.body.code).toBe(200);
		expect(response.body.status).toBe('updated');

		return response.body.chosenID;
	}

	async function getDS(ds, expectedStatus = 200, checkExpected = true, expectedLength = 1) {
		const url = `${uri}?well=${well.id}`;
		const getResponse = await app.get(url).set(config.headers);

		expect(getResponse.status).toBe(expectedStatus);
		expect(getResponse.body.length).toBe(expectedLength);

		if (checkExpected) {
			const getDS = getResponse.body[0];
			expectDSResponse(getDS, ds);
		}

		return expectedLength === 1 ? getResponse.body[0] : undefined;
	}

	function expectDSResponse(got, expected) {
		expect(got.project || '').toStrictEqual('');
		expect(got.measuredDepth).toStrictEqual(expected.measuredDepth);
		expect(got.trueVerticalDepth).toStrictEqual(expected.trueVerticalDepth);
		expect(got.azimuth).toStrictEqual(expected.azimuth);
		expect(got.inclination).toStrictEqual(expected.inclination);
		expect(got.deviationNS).toStrictEqual(expected.deviationNS);
		expect(got.deviationEW).toStrictEqual(expected.deviationEW);
		expect(got.latitude).toStrictEqual(expected.latitude);
		expect(got.longitude).toStrictEqual(expected.longitude);
	}

	test('POST and GET by ID', async () => {
		const ds = createDirectionalSurveys(1, well.chosenID, undefined)[0];

		await post(ds);
		await getDS(ds);
	});

	test('POST many and GET by well', async () => {
		const ds = createDirectionalSurveys(1, well.chosenID, undefined)[0];

		await post(ds);
		let apiDS = await getDS(ds);

		await post(ds);
		apiDS = await getDS(ds);

		const getResponse = await app.get(`${uri}?well=${apiDS.well}`).set(config.headers);

		expect(getResponse.status).toBe(200);

		// When create one DS for a well, it's deleted all of the others
		expect(getResponse.body.length).toBe(1);

		expectDSResponse(getResponse.body[0], ds);
	});

	test('POST, PUT and GET', async () => {
		const ds = createDirectionalSurveys(1, well.chosenID, undefined)[0];

		await post(ds);
		const apiDS = await getDS(ds);

		const updatePayload = {
			spatialDataType: 'WGS84',
			update: {
				measuredDepth: [2],
				trueVerticalDepth: [9],
				azimuth: [9],
				inclination: [9],
				deviationEW: [9],
				deviationNS: [9],
				latitude: [9],
				longitude: [9],
			},
			add: {
				measuredDepth: [10],
				trueVerticalDepth: [10],
				azimuth: [10],
				inclination: [10],
				deviationEW: [10],
				deviationNS: [10],
				latitude: [10],
				longitude: [10],
			},
			remove: [1],
		};

		ds.measuredDepth = [2, 3, 10];
		ds.trueVerticalDepth = [9, 3, 10];
		ds.azimuth = [9, 3, 10];
		ds.inclination = [9, 3, 10];
		ds.deviationEW = [9, 3, 10];
		ds.deviationNS = [9, 3, 10];
		ds.latitude = [9, 3, 10];
		ds.longitude = [9, 3, 10];

		await put(apiDS.id, updatePayload);
		await getDS(ds);
	});

	test('POST, DELETE and GET', async () => {
		const ds = createDirectionalSurveys(1, well.chosenID, undefined)[0];

		await post(ds);
		const apiDS = await getDS(ds);

		const deleteResponse = await app.delete(`${uri}/${apiDS.id}`).set(config.headers);
		expect(deleteResponse.status).toBe(204);

		await getDS(ds, 200, false, 0);
	});
});
