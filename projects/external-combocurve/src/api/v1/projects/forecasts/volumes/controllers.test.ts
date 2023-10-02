import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateEnum, generateObjectId } from '@src/helpers/test/data-generation';
import { testForecastVolumeSkipAndTakeErrors, testSkipAndTakeErrors } from '@src/helpers/test/controller';
import { CursorType } from '@src/api/v1/pagination';
import { FORECAST_RESOLUTION } from '@src/models/forecast-volume';

import { ApiForecastVolumes, READ_RECORD_LIMIT } from './fields/forecast-volumes';
import { getForecastVolumes, getForecastVolumesHead } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getForecastVolumesArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		project: generateObjectId(i),
		forecast: generateObjectId(i),
		well: generateObjectId(i),
		resolution: generateEnum(i, FORECAST_RESOLUTION),
		phases: [],
	}));

describe('v1/projects/:projectId/forecasts/:forecastId/volumes/controllers getForecastVolumesHead', () => {
	const initializeGetForecastVolumesCount = (count: number) => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/daily-volumes`;

		req.originalUrl = originalUrl;

		const getForecastVolumesCount = jest.fn(() => count);

		res.locals = {
			service: {
				getForecastVolumesCount,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		return { req, res, originalUrl, project, forecast, getForecastVolumesCount };
	};

	test('throws skip take validation errors', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/forecasts/5e272dec4b97ed00132f2273/volumes';

		res.locals = {
			service: {
				getForecastVolumesCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getForecastVolumesHead, READ_RECORD_LIMIT);

		expect.assertions(10);
	});

	test('when zero count returned should return links', async () => {
		const { req, res, originalUrl, project, forecast, getForecastVolumesCount } =
			initializeGetForecastVolumesCount(0);

		await getForecastVolumesHead(req, res);

		expect(getForecastVolumesCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();
	});

	test('when multiple pages no skip no take should return links', async () => {
		const { req, res, originalUrl, project, forecast, getForecastVolumesCount } =
			initializeGetForecastVolumesCount(51);

		await getForecastVolumesHead(req, res);

		expect(getForecastVolumesCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});
	});

	test('when multiple pages with skip no take should return links', async () => {
		const { req, res, originalUrl, project, forecast, getForecastVolumesCount } =
			initializeGetForecastVolumesCount(51);

		req.query = { skip: '25' };

		await getForecastVolumesHead(req, res);

		expect(getForecastVolumesCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});
	});

	test('when multiple pages with skip and take should return links', async () => {
		const { req, res, originalUrl, project, forecast, getForecastVolumesCount } =
			initializeGetForecastVolumesCount(35);

		req.query = { skip: '30', take: '10' };

		await getForecastVolumesHead(req, res);

		expect(getForecastVolumesCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});

	test('when multiple pages with skip take and filter should return links', async () => {
		const { req, res, originalUrl, project, forecast, getForecastVolumesCount } =
			initializeGetForecastVolumesCount(35);

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3' };

		await getForecastVolumesHead(req, res);

		expect(getForecastVolumesCount).toHaveBeenLastCalledWith(
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});

	test('when multiple pages with invalid filter should throw error', async () => {
		const { req, res, getForecastVolumesCount } = initializeGetForecastVolumesCount(35);

		const serviceCallTimes = getForecastVolumesCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', a: 'b' };

		await expect(getForecastVolumesHead(req, res)).rejects.toThrow(FieldNameFilterError);

		// Service should not be called when validation failure is encountered
		expect(getForecastVolumesCount.mock.calls.length).toBe(serviceCallTimes);
	});
});

describe('v1/projects/:projectId/forecasts/:forecastId/volumes/controllers getForecastVolumes', () => {
	const initializeGetForecastVolumes = (
		result: Array<ApiForecastVolumes> = [],
		hasNext = false,
		cursor: CursorType | null = null,
	) => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/volumes`;

		req.originalUrl = originalUrl;

		const serviceForecastData = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getForecastVolumes: serviceForecastData,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		return { req, res, originalUrl, project, forecast, getForecastVolumes, serviceForecastData };
	};

	test('throws skip take validation errors', async () => {
		const { req, res } = initializeGetForecastVolumes();

		await testForecastVolumeSkipAndTakeErrors(req, res, getForecastVolumes, READ_RECORD_LIMIT);

		expect.assertions(10);
	});

	it.each([
		['a'],
		['35'],
		['=well'],
		['<well'],
		['>well'],
		['+well'],
		['<=well'],
		['>=well'],
		['<>=well'],
		['project'],
		['forecast'],
		['resolution'],
		['phases'],
	])('when invalid sort throws validation errors', async (sortValue: string) => {
		const { req, res } = initializeGetForecastVolumes();

		req.query = { sort: [sortValue] };
		await expect(getForecastVolumes(req, res, FORECAST_RESOLUTION[0])).rejects.toThrow(TypeError);
	});

	test('when skip and cursor parameter throws validation errors', async () => {
		const { req, res } = initializeGetForecastVolumes();

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getForecastVolumes(req, res, FORECAST_RESOLUTION[0])).rejects.toThrow(ValidationError);
	});

	test('when no results found and no skip no take no filter should call service and return empty result', async () => {
		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes();

		req.query = { skip: '0' };
		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);
	});

	test('when has single page of results found and no skip no take no filter should call service and return results', async () => {
		const expectedResult = getForecastVolumesArray(3);

		const { req, res, project, forecast, originalUrl, serviceForecastData } =
			initializeGetForecastVolumes(expectedResult);

		req.query = { skip: '0' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(expectedResult);
	});

	test('when has multiple pages of results found and no skip no take no filter should call service and return results', async () => {
		const expectedResult = getForecastVolumesArray(25);

		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			expectedResult,
			true,
		);

		req.query = { skip: '0' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(expectedResult);
	});

	test('when has multiple pages of results found with skip first page and no take no filter should call service and return results', async () => {
		const expectedResult = getForecastVolumesArray(25);

		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			expectedResult,
			true,
		);

		req.query = { skip: '25' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			25,
			25,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(expectedResult);
	});

	test('when has multiple pages of results found with skip first page and take partial page no filter should call service and return results', async () => {
		const expectedResult = getForecastVolumesArray(5);

		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			expectedResult,
			false,
		);

		req.query = { skip: '30', take: '10' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(expectedResult);
	});

	test('when has well filter should call service and return results', async () => {
		const expectedResult = getForecastVolumesArray(5);

		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			expectedResult,
			false,
		);

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: 1 },
			undefined,
			undefined,
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(expectedResult);
	});

	test('when has invalid filter should not call service', async () => {
		const expectedResult = getForecastVolumesArray(5);

		const { req, res, serviceForecastData } = initializeGetForecastVolumes(expectedResult, false);

		const serviceCallTimes = serviceForecastData.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', a: 'b' };

		await expect(getForecastVolumes(req, res, FORECAST_RESOLUTION[0])).rejects.toThrow(FieldNameFilterError);

		// Service should not be called when validation failure is encountered
		expect(serviceForecastData.mock.calls.length).toBe(serviceCallTimes);
	});

	test('when no results with cursor pagination should call service and return empty result', async () => {
		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			[],
			false,
			Types.ObjectId(),
		);

		req.query = {};

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);
	});

	test('when no results with cursor pagination and take should call service and return empty result', async () => {
		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			[],
			false,
			Types.ObjectId(),
		);

		req.query = { take: '10' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);
	});

	test('when no results with cursor pagination take and cursor parameter should call service and return empty result', async () => {
		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			[],
			false,
			Types.ObjectId(),
		);

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			'123456789012345678901234',
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);
	});

	test('when has results with cursor pagination and take should call service and return result', async () => {
		const cursor = Types.ObjectId();
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const { req, res, project, forecast, originalUrl, serviceForecastData } = initializeGetForecastVolumes(
			getForecastVolumesArray(15),
			true,
			cursor,
		);

		req.query = { take: '10' };

		await getForecastVolumes(req, res, FORECAST_RESOLUTION[0]);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			FORECAST_RESOLUTION[0],
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
	});
});
