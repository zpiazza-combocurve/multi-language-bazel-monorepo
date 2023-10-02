const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../../config');
const { connectToDb } = require('../../../database');
const { get_next_page_url } = require('../../../helpers/pagination');
const {
	createProjectsPayload,
	createWellsDbPayload,
	createForecastPayload,
	createForecastDataPayload,
} = require('../../../../helpers/data-generator');
const { testHeadMethod } = require('../../../helpers/test/head-methods');

const { toApiAriesForecastData } = require('./fields');

const WELLS_COUNT = 10;

/**
 * @type {request.SuperTest<supertest.Test>}
 */
let app;
let connection;
let project;
let forecast;
let forecastData;
let ariesForecast;
let ariesForecastMap;
const baseAriesForecastData = [
	{
		PROPNUM: 'RETTIG, MABEL',
		'WELL NAME': 'RETTIG, MABEL',
		'WELL NUMBER': 'L 57',
		'INPT ID': 'cVybC0ryC8',
		API10: '5798712728',
		API12: '579871272859',
		API14: '57987127285998',
		'CHOSEN ID': '52741549868274',
		'ARIES ID': null,
		'PHDWIN ID': null,
		SECTION: 4,
		SEQUENCE: 10,
		QUALIFIER: 'CC_QUAL',
		KEYWORD: 'START',
		EXPRESSION: '05/2017',
	},
	{
		PROPNUM: 'RETTIG, MABEL',
		'WELL NAME': 'RETTIG, MABEL',
		'WELL NUMBER': 'L 57',
		'INPT ID': 'cVybC0ryC8',
		API10: '5798712728',
		API12: '579871272859',
		API14: '57987127285998',
		'CHOSEN ID': '52741549868274',
		'ARIES ID': null,
		'PHDWIN ID': null,
		SECTION: 4,
		SEQUENCE: 20,
		QUALIFIER: 'CC_QUAL',
		KEYWORD: 'GAS',
		EXPRESSION: '978.0 X M/M 0.345 YRS B/0.5 99.9602',
	},
];

describe('/v1/projects/{projectId}/forecasts/{forecastId}/aries', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);

		//Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);

		//create wells in db scoped to this project
		const wells = createWellsDbPayload(WELLS_COUNT, { project: ObjectId(project._id) });
		await connection.collection('wells').insertMany(wells);

		// Create forecast in db scoped to this project
		[forecast] = createForecastPayload(1, {
			project: ObjectId(project._id),
			wells: wells.map(({ _id }) => _id),
		});
		await connection.collection('forecasts').insertOne(forecast);

		// Create forecast data scoped to this project and forecast in db
		forecastData = forecast.wells.map((id) => {
			const [doc] = createForecastDataPayload(1, {
				project: ObjectId(project._id),
				forecast: ObjectId(forecast._id),
				well: ObjectId(id),
			});
			return doc;
		});
		await connection.collection('forecast-datas').insertMany(forecastData);

		ariesForecast = wells.map((well) => ({
			well: well._id,
			forecast: baseAriesForecastData.map((d) => ({
				...d,
				API10: well.api10,
				API12: well.api12,
				API14: well.api14,
				'CHOSEN ID': well.chosenID,
				PROPNUM: well.well_name,
				'WELL NAME': well.well_name,
			})),
		}));
		ariesForecast = ariesForecast.map(toApiAriesForecastData);
		ariesForecastMap = ariesForecast.reduce((acc, curr) => {
			acc[curr.well] = curr;
			return acc;
		}, {});
	});

	afterAll(() => {
		connection.close();
	});

	it('contains correct record count for ARIES Forecast data by well', async () => {
		const ariesForecastDataResponse = await Promise.all(
			forecast.wells.map(
				async (well) =>
					await app
						.get(
							`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?well=${well}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false&forecastStartToLatestProd=false&forecastHistoryMatch=false`,
						)
						.set(config.headers),
			),
		);

		expect(ariesForecastDataResponse.length).toBe(ariesForecast.length);
	});

	it('returns 200 status code for ARIES Forecast data by well', async () => {
		const ariesForecastDataResponse = await Promise.all(
			forecast.wells.map(
				async (well) =>
					await app
						.get(
							`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?well=${well}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false&forecastStartToLatestProd=false&forecastHistoryMatch=false`,
						)
						.set(config.headers),
			),
		);

		for (let index = 0; index < ariesForecastDataResponse.length; index++) {
			expect(ariesForecastDataResponse[index].status).toBe(200);
		}
	});

	it('returns expected objects for ARIES Forecast data by well', async () => {
		const ariesForecastDataResponse = await Promise.all(
			forecast.wells.map(
				async (well) =>
					await app
						.get(
							`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?well=${well}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false&forecastStartToLatestProd=false&forecastHistoryMatch=false`,
						)
						.set(config.headers),
			),
		);

		for (let index = 0; index < ariesForecastDataResponse.length; index++) {
			expect(ariesForecastDataResponse[index].body[0]).toMatchObject(ariesForecast[index]);
		}
	});

	it('contains correct record count for aries forecast data', async () => {
		const ariesForecastDataResponse = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		expect(ariesForecastDataResponse.body.length).toBe(ariesForecast.length);
	});

	it('returns 200 status code for ARIES Forecast data', async () => {
		const ariesForecastDataResponse = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		expect(ariesForecastDataResponse.status).toBe(200);
	});

	it('returns expected objects for ARIES Forecast data', async () => {
		const ariesForecastDataResponse = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		for (let index = 0; index < ariesForecastDataResponse.body.length; index++) {
			expect(ariesForecastDataResponse.body[index]).toMatchObject(
				ariesForecastMap[ariesForecastDataResponse.body[index].well],
			);
		}
	});

	it('contains cursor when iterating over aries forecast data using cursor', async () => {
		const ariesForecastDataResponseExceptLast = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?take=${
					WELLS_COUNT - 1
				}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		const nextPage = get_next_page_url(ariesForecastDataResponseExceptLast.headers);
		const relativeNextPage = nextPage?.substring(config.apiUrl.length);

		expect(relativeNextPage).toBeTruthy();
		expect(relativeNextPage).toMatch(/^\//g);
		expect(relativeNextPage).toContain('cursor=');

		const nextPageResponse = await app.get(relativeNextPage).set(config.headers);

		expect(nextPageResponse.status).toBe(200);
		expect(nextPageResponse.body.length).toBe(1);
	});

	it('returns 200 status code when iterating over aries forecast data using cursor', async () => {
		const ariesForecastDataResponseExceptLast = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?take=${
					WELLS_COUNT - 1
				}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		const nextPage = get_next_page_url(ariesForecastDataResponseExceptLast.headers);
		const relativeNextPage = nextPage?.substring(config.apiUrl.length);

		const nextPageResponse = await app.get(relativeNextPage).set(config.headers);

		expect(nextPageResponse.status).toBe(200);
		expect(nextPageResponse.body.length).toBe(1);
	});

	it('returns correct record count when iterating over aries forecast data using cursor', async () => {
		const ariesForecastDataResponseExceptLast = await app
			.get(
				`/v1/projects/${project._id}/forecasts/${forecast._id}/aries?take=${
					WELLS_COUNT - 1
				}&pSeries=best&selectedIdKey=well_name&endingCondition=years&forecastUnit=per_month&toLife=yes&dataResolution=monthly&includeZeroForecast=false`,
			)
			.set(config.headers);

		const nextPage = get_next_page_url(ariesForecastDataResponseExceptLast.headers);
		const relativeNextPage = nextPage?.substring(config.apiUrl.length);

		const nextPageResponse = await app.get(relativeNextPage).set(config.headers);

		expect(nextPageResponse.status).toBe(200);
		expect(nextPageResponse.body.length).toBe(1);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD aries forecast data', async () => {
		await testHeadMethod(
			app,
			`/v1/projects/${project._id}/forecasts/${forecast._id}/aries`,
			config.headers,
			WELLS_COUNT,
		);
	});
});
