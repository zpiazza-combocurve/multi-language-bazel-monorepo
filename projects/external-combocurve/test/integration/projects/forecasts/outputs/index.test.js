const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../../config');
const { connectToDb } = require('../../../database');
const {
	createTypeCurvePayload,
	createDeterministicForecastDataPayload,
	createProjectsPayload,
	createForecastDataPayload,
	createForecastPayload,
} = require('../../../../helpers/data-generator');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { toApiProject } = require('../../fields');
const { toApiForecast } = require('../fields');

const { toApiForecastData } = require('./fields');

const FORECAST_DATA_COUNT = 3;
const DETERMINISTIC_FORECAST_DATA_COUNT = 2;

let app;
let connection;
let typeCurve;
let deterministicForecast;
let probabilisticForecast;
let deterministicForecastData;
let forecastData;
let project;

function removeUndefinedField(obj) {
	return JSON.parse(JSON.stringify(obj));
}

describe('/v1/projects/{projectId}/forecasts/{forecastId}/outputs', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create type curve scoped to this project in db
		[typeCurve] = createTypeCurvePayload(1, { project: ObjectId(project.id) });
		await connection.collection('type-curves').insertOne(typeCurve);

		// Create probabilistic forecast in db scoped to this project
		[probabilisticForecast] = createForecastPayload(1, { project: ObjectId(project.id), type: 'probabilistic' });
		await connection.collection('forecasts').insertOne(probabilisticForecast);
		probabilisticForecast = toApiForecast(probabilisticForecast);

		// Create forecast data scoped to this project and forecast in db
		forecastData = createForecastDataPayload(FORECAST_DATA_COUNT, {
			project: ObjectId(project.id),
			forecast: ObjectId(probabilisticForecast.id),
			typeCurve: ObjectId(typeCurve._id),
		});
		await connection.collection('forecast-datas').insertMany(forecastData);
		forecastData = forecastData.map((fd) =>
			toApiForecastData(
				{
					...fd,
					typeCurveData: {
						name: typeCurve.name,
						tcType: typeCurve.tcType,
					},
				},
				'probabilistic',
			),
		);

		// Create deterministic forecast in db scoped to this project
		[deterministicForecast] = createForecastPayload(1, { project: ObjectId(project.id), type: 'deterministic' });
		await connection.collection('forecasts').insertOne(deterministicForecast);
		deterministicForecast = toApiForecast(deterministicForecast);

		// Create deterministic forecast data scoped to this project and forecast in db
		deterministicForecastData = createDeterministicForecastDataPayload(DETERMINISTIC_FORECAST_DATA_COUNT, {
			project: ObjectId(project.id),
			forecast: ObjectId(deterministicForecast.id),
		});
		await connection.collection('deterministic-forecast-datas').insertMany(deterministicForecastData);
		deterministicForecastData = deterministicForecastData.map((df) => toApiForecastData(df, 'deterministic'));
	});

	afterAll(() => {
		connection.close();
	});

	test('Get forecast data probabilistic', async () => {
		const forecastDataResponse = await Promise.all(
			forecastData.map(
				async (f) =>
					await app
						.get(`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/outputs?well=${f.well}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < forecastDataResponse.length; index++) {
			expect(forecastDataResponse[index].status).toBe(200);
			expect(forecastDataResponse[index].body[0]).toEqual(removeUndefinedField(forecastData[index]));
		}

		expect(forecastDataResponse.length).toBe(forecastData.length);
	});

	test('Get forecast data deterministic', async () => {
		const deterministicForecastDataResponse = await Promise.all(
			deterministicForecastData.map(
				async (f) =>
					await app
						.get(`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/outputs?well=${f.well}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < deterministicForecastDataResponse.length; index++) {
			expect(deterministicForecastDataResponse[index].status).toBe(200);
			expect(deterministicForecastDataResponse[index].body[0]).toEqual(
				removeUndefinedField(deterministicForecastData[index]),
			);
		}

		expect(deterministicForecastDataResponse.length).toBe(deterministicForecastData.length);
	});

	test('Get forecast data by id probabilistic', async () => {
		const [forecastDatum] = forecastData;

		const forecastDatumResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/outputs/${forecastDatum.id}`)
			.set(config.headers);

		expect(forecastDatumResponse.status).toBe(200);
		expect(forecastDatumResponse.body).toEqual(removeUndefinedField(forecastDatum));
	});

	test('Get forecast data by id deterministic', async () => {
		const [deterministicForecastDatum] = deterministicForecastData;

		const deterministicForecastDatumResponse = await app
			.get(
				`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/outputs/${deterministicForecastDatum.id}`,
			)
			.set(config.headers);

		expect(deterministicForecastDatumResponse.status).toBe(200);
		expect(deterministicForecastDatumResponse.body).toEqual(removeUndefinedField(deterministicForecastDatum));
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD forecast data probabilistic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/outputs`,
			config.headers,
			FORECAST_DATA_COUNT,
		);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD forecast data deterministic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/outputs`,
			config.headers,
			DETERMINISTIC_FORECAST_DATA_COUNT,
		);
	});
});
