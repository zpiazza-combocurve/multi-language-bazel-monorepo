const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const deterministicForecastDailyVolumesImport = require('../../../../fixtures/forecast-segment-volumes/deterministic/daily-volumes');
const deterministicForecastMonthlyVolumesImport = require('../../../../fixtures/forecast-segment-volumes/deterministic/monthly-volumes');
const deterministicForecastOutputs = require('../../../../fixtures/forecast-segment-volumes/deterministic/deterministic-forecast-outputs.json');
const probabilisticForecastDailyVolumesImport = require('../../../../fixtures/forecast-segment-volumes/probabilistic/daily-volumes');
const probabilisticForecastMonthlyVolumesImport = require('../../../../fixtures/forecast-segment-volumes/probabilistic/monthly-volumes');
const probabilisticForecastOutputs = require('../../../../fixtures/forecast-segment-volumes/probabilistic/probabilistic-forecast-outputs.json');
const ratioForecastMonthlyVolumesImport = require('../../../../fixtures/forecast-segment-volumes/ratio/monthly-volumes');
const ratioForecastOutputs = require('../../../../fixtures/forecast-segment-volumes/ratio/deterministic-forecast-outputs.json');
const { testHeadMethod } = require('../../../helpers/test/head-methods');
const { createProjectsPayload, createForecastPayload } = require('../../../../helpers/data-generator');
const { connectToDb } = require('../../../database');
const config = require('../../../config');
const { toApiProject } = require('../../fields');
const { toApiForecast } = require('../fields');

const { toApiForecastVolumes } = require('./fields');

const DETERMINISTIC_FORECAST_VOLUMES_COUNT = 4;
const PROBABILISTIC_FORECAST_VOLUMES_COUNT = 3;
const RATIO_FORECAST_VOLUMES_COUNT = 2;

let app;
let connection;
let deterministicForecast;
let probabilisticForecast;
let ratioForecast;
let deterministicForecastData;
let probabilisticForecastData;
let ratioForecastData;
let project;

describe('/v1/projects/{projectId}/forecasts/{forecastId}/volumes deterministic', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create deterministic forecast in db scoped to this project
		[deterministicForecast] = createForecastPayload(1, { project: ObjectId(project.id), type: 'deterministic' });
		await connection.collection('forecasts').insertOne(deterministicForecast);
		deterministicForecast = toApiForecast(deterministicForecast);

		// Create deterministic forecast data scoped to this project and forecast in db
		// Overwrite object ids on existing data with new ids for testing
		deterministicForecastData = deterministicForecastOutputs.map((x) => {
			x._id = ObjectId();
			x.project = ObjectId(project.id);
			x.forecast = ObjectId(deterministicForecast.id);

			return x;
		});

		await connection.collection('deterministic-forecast-datas').insertMany(deterministicForecastData);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get daily forecast data deterministic', async () => {
		const deterministicForecastDailyVolumes = toApiForecastVolumes(
			deterministicForecastDailyVolumesImport.dailyVolumes,
			project,
			deterministicForecast,
			deterministicForecastData,
		);

		const forecastVolumesResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/daily-volumes`)
			.set(config.headers);

		expect(forecastVolumesResponse.status).toBe(200);
		expect(forecastVolumesResponse.body).toEqual(deterministicForecastDailyVolumes);
	});

	test('HEAD daily forecast data deterministic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/daily-volumes`,
			config.headers,
			DETERMINISTIC_FORECAST_VOLUMES_COUNT,
		);

		expect.assertions(6);
	});

	test('Get monthly forecast data deterministic', async () => {
		const deterministicForecastMonthlyVolumes = toApiForecastVolumes(
			deterministicForecastMonthlyVolumesImport.monthlyVolumes,
			project,
			deterministicForecast,
			deterministicForecastData,
		);

		const forecastVolumesResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/monthly-volumes`)
			.set(config.headers);

		expect(forecastVolumesResponse.status).toBe(200);
		expect(forecastVolumesResponse.body).toEqual(deterministicForecastMonthlyVolumes);
	});

	test('HEAD monthly forecast data deterministic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${deterministicForecast.id}/monthly-volumes`,
			config.headers,
			DETERMINISTIC_FORECAST_VOLUMES_COUNT,
		);

		expect.assertions(6);
	});
});

describe('/v1/projects/{projectId}/forecasts/{forecastId}/volumes probabilistic', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create probabilistic forecast in db scoped to this project
		[probabilisticForecast] = createForecastPayload(1, { project: ObjectId(project.id), type: 'probabilistic' });
		await connection.collection('forecasts').insertOne(probabilisticForecast);
		probabilisticForecast = toApiForecast(probabilisticForecast);

		// Create forecast data scoped to this project and forecast in db
		// Overwrite object ids on existing data with new ids for testing
		probabilisticForecastData = probabilisticForecastOutputs.map((x) => {
			x._id = ObjectId();
			x.project = ObjectId(project.id);
			x.forecast = ObjectId(probabilisticForecast.id);

			return x;
		});

		await connection.collection('forecast-datas').insertMany(probabilisticForecastData);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get daily forecast volumes probabilistic', async () => {
		const probabilisticForecastDailyVolumes = toApiForecastVolumes(
			probabilisticForecastDailyVolumesImport.dailyVolumes,
			project,
			probabilisticForecast,
			probabilisticForecastData,
		);

		const forecastVolumesResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/daily-volumes`)
			.set(config.headers);

		expect(forecastVolumesResponse.status).toBe(200);
		expect(forecastVolumesResponse.body).toEqual(probabilisticForecastDailyVolumes);
	});

	test('HEAD daily forecast data probabilistic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/daily-volumes`,
			config.headers,
			PROBABILISTIC_FORECAST_VOLUMES_COUNT,
		);

		expect.assertions(6);
	});

	test('Get monthly forecast volumes probabilistic', async () => {
		const probabilisticForecastMonthlyVolumes = toApiForecastVolumes(
			probabilisticForecastMonthlyVolumesImport.monthlyVolumes,
			project,
			probabilisticForecast,
			probabilisticForecastData,
		);

		const forecastVolumesResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/monthly-volumes`)
			.set(config.headers);

		expect(forecastVolumesResponse.status).toBe(200);
		expect(forecastVolumesResponse.body).toEqual(probabilisticForecastMonthlyVolumes);
	});

	test('HEAD monthly forecast data probabilistic', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${probabilisticForecast.id}/monthly-volumes`,
			config.headers,
			PROBABILISTIC_FORECAST_VOLUMES_COUNT,
		);

		expect.assertions(6);
	});
});

describe('/v1/projects/{projectId}/forecasts/{forecastId}/volumes ratio', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create deterministic forecast in db scoped to this project
		[ratioForecast] = createForecastPayload(1, { project: ObjectId(project.id), type: 'deterministic' });
		await connection.collection('forecasts').insertOne(ratioForecast);
		ratioForecast = toApiForecast(ratioForecast);

		// Create deterministic forecast data scoped to this project and forecast in db
		// Overwrite object ids on existing data with new ids for testing
		ratioForecastData = ratioForecastOutputs.map((x) => {
			x._id = ObjectId();
			x.project = ObjectId(project.id);
			x.forecast = ObjectId(ratioForecast.id);

			return x;
		});

		await connection.collection('deterministic-forecast-datas').insertMany(ratioForecastData);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get monthly forecast data ratio', async () => {
		const ratioForecastMonthlyVolumes = toApiForecastVolumes(
			ratioForecastMonthlyVolumesImport.monthlyVolumes,
			project,
			ratioForecast,
			ratioForecastData,
		);

		const forecastVolumesResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${ratioForecast.id}/monthly-volumes`)
			.set(config.headers);

		expect(forecastVolumesResponse.status).toBe(200);
		expect(forecastVolumesResponse.body).toEqual(ratioForecastMonthlyVolumes);
	});

	test('HEAD monthly forecast data ratio', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project.id}/forecasts/${ratioForecast.id}/monthly-volumes`,
			config.headers,
			RATIO_FORECAST_VOLUMES_COUNT,
		);

		expect.assertions(6);
	});
});
