import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateBoolean, generateDate, generateEnum, generateObjectId } from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { FORECAST_DATA_STATUS } from '@src/models/forecast-data';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiForecastData, READ_RECORD_LIMIT } from './fields/forecast-outputs';
import { getForecastData, getForecastDataById, getForecastDataHead } from './controllers';
import { ForecastDataNotFoundError } from './validation';

import { mockExpress } from '@test/express-mocks';

const getForecastDataArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		forecasted: generateBoolean(i),
		runDate: generateDate(i + 1),
		status: generateEnum(i, FORECAST_DATA_STATUS),
		well: generateObjectId(i),
	}));

describe('v1/projects/:projectId/forecasts/:forecastId/outputs/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getForecastDataHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/forecasts/5e272dec4b97ed00132f2273/outputs';

		res.locals = {
			service: {
				getForecastDataCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getForecastDataHead, READ_RECORD_LIMIT);
	});

	test('getForecastDataHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/outputs`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getForecastDataCount = jest.fn(() => count);

		res.locals = {
			service: {
				getForecastDataCount,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getForecastDataHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getForecastDataHead(req, res);
		expect(getForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getForecastDataHead(req, res);
		expect(getForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getForecastDataHead(req, res);
		expect(getForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3' };
		count = 35;
		await getForecastDataHead(req, res);
		expect(getForecastDataCount).toHaveBeenLastCalledWith(
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

		const serviceCallTimes = getForecastDataCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', a: 'b' };
		count = 35;
		await expect(getForecastDataHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getForecastDataCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getForecastData throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		req.originalUrl = `projects/${project._id}/forecasts/${forecast.id}/outputs`;

		res.locals = {
			service: {
				getForecastData: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getForecastData, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['runDate'] };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=runDate' };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>runDate' };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+runDate' };
		await expect(getForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getForecastData(req, res)).rejects.toThrow(ValidationError);
	});

	test('getForecastData runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/outputs`;

		req.originalUrl = originalUrl;

		let result: ApiForecastData[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceForecastData = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getForecastData: serviceForecastData,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		req.query = { skip: '0' };
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		req.query = { skip: '0' };
		result = getForecastDataArray(3);
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastDataArray(3));

		req.query = { skip: '0' };
		result = getForecastDataArray(25);
		hasNext = true;
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastDataArray(25));

		req.query = { skip: '25' };
		result = getForecastDataArray(25);
		hasNext = true;
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastDataArray(25));

		req.query = { skip: '30', take: '10' };
		result = getForecastDataArray(5);
		hasNext = false;
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3' };
		result = getForecastDataArray(5);
		hasNext = false;
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		const serviceCallTimes = serviceForecastData.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', a: 'b' };
		result = getForecastDataArray(5);
		hasNext = false;
		await expect(getForecastData(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceForecastData.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '-runDate' };
		result = getForecastDataArray(5);
		hasNext = false;
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ runDate: -1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = {};
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		req.query = { take: '10' };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ id: -1 },
			{},
			project,
			forecast,
			'123456789012345678901234',
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		req.query = { take: '10' };
		result = getForecastDataArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, forecast, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '+id' };
		result = getForecastDataArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getForecastData(req, res);
		expect(serviceForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ id: 1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});
	});

	test('getForecastDataById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: Types.ObjectId(),
			forecast: { id: Types.ObjectId(), type: 'probabilistic' },
		};

		res.sendStatus = jest.fn();

		await expect(getForecastDataById(req, res)).rejects.toThrow(ForecastDataNotFoundError);
	});
});
