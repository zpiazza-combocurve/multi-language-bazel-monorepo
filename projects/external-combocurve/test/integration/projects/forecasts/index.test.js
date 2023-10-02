const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../config');
const { connectToDb } = require('../../database');
const {
	createForecastPayload,
	createProjectsPayload,
	createWellsDbPayload,
} = require('../../../helpers/data-generator');
const { testHeadMethod } = require('../../helpers/test/head-methods');
const { createTagsPayload } = require('../../../helpers/data-generator');
const { toApiProject } = require('../fields');
const { toApiTag } = require('../../tags/fields');

const { toApiForecast } = require('./fields');

const FORECAST_COUNT = 2;
const TAGS_COUNT = 2;

let app;
let connection;
let forecasts;
let project;
let wells;
let tags;

describe('/v1/projects/{projectId}/forecasts', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create Tags in db
		tags = createTagsPayload(TAGS_COUNT);
		await connection.collection('tags').insertMany(tags);

		// Create forecasts scoped to this project in db
		const overrideFields = {
			project: ObjectId(project.id),
			tags: tags.map((m) => ObjectId(m._id)),
		};

		forecasts = createForecastPayload(FORECAST_COUNT, overrideFields);
		await connection.collection('forecasts').insertMany(forecasts);

		forecasts = forecasts.map(toApiForecast);
		tags = tags.map(toApiTag);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get forecasts', async () => {
		const forecastsResponse = await Promise.all(
			forecasts.map(
				async (f) => await app.get(`/v1/projects/${project.id}/forecasts?name=${f.name}`).set(config.headers),
			),
		);

		for (let index = 0; index < forecastsResponse.length; index++) {
			expect(forecastsResponse[index].status).toBe(200);
			expect(forecastsResponse[index].body[0]).toMatchObject(forecasts[index]);
		}

		expect(forecastsResponse.length).toBe(forecasts.length);
	});

	// Tag Filter
	let expectTagResponse = async (tag, status, responseCount) => {
		let response = await app
			.get(`/v1/projects/${project.id}/forecasts?skip=0&take=10&tag=${tag}`)
			.set(config.headers);

		expect(response.status).toBe(status);
		expect(response.body.length).toBe(responseCount);
	};

	test('GET v1/projects/:projectID/forecast?skip=0&take=20tag=<tag[0]> SHOULD found 2', async () =>
		expectTagResponse(tags[0].name, 200, forecasts.length));

	test('GET v1/projects/:projectID/forecast?tag=<tag[1]> SHOULD found 2', async () =>
		expectTagResponse(tags[1].name, 200, forecasts.length));

	test('GET v1/projects/:projectID/forecast?tag=xablau SHOULD found 0', async () =>
		expectTagResponse('not_found_tag', 200, 0));

	test('Get forecast by id', async () => {
		const [forecast] = forecasts;

		const forecastResponse = await app
			.get(`/v1/projects/${project.id}/forecasts/${forecast.id}`)
			.set(config.headers);

		expect(forecastResponse.status).toBe(200);
		expect(forecastResponse.body).toMatchObject(forecast);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD forecasts', async () => {
		await testHeadMethod(app, `/v1/projects/${project.id}/forecasts`, config.headers, FORECAST_COUNT);
	});

	test('add well to forecast', async () => {
		const [forecast] = forecasts;
		wells = createWellsDbPayload(2, { project: ObjectId(project.id) });
		await connection.collection('wells').insertMany(wells);

		await connection.collection('projects').findOneAndUpdate(
			{ _id: ObjectId(project.id) },
			{
				$push: {
					wells: { $each: wells.map(({ _id }) => ObjectId(_id)) },
				},
			},
		);

		project.wells = wells.map(({ _id }) => _id);
		const response = await app
			.post(`/v1/projects/${project.id}/forecasts/${forecast.id}/wells`)
			.send({ wellIds: project.wells })
			.set(config.headers);

		expect(response.status).toBe(207);
		expect(response.body.successCount).toBe(wells.length);
		expect(response.body.failedCount).toBe(0);
	});
});
