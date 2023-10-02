import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateNumber, generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { MultipleValidationError } from '@src/api/v1/multi-error';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiAriesForecastData, READ_RECORD_LIMIT } from './fields';
import { getAriesForecastData, getAriesForecastDataHead } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getAriesForecastDataArray = (n = 1): ApiAriesForecastData[] =>
	[...Array(n).keys()].map((i) => ({
		well: generateObjectId(i),
		forecast: [
			{
				PROPNUM: generateString(i),
				'WELL NAME': generateString(i),
				'INPT ID': generateString(i),
				API10: generateString(i),
				API12: generateString(i),
				API14: generateString(i),
				'ARIES ID': generateString(i),
				'PHDWIN ID': generateString(i),
				'CHOSEN ID': generateString(i),
				SECTION: generateNumber(i),
				SEQUENCE: i,
				QUALIFIER: generateString(i),
				KEYWORD: generateString(i),
				EXPRESSION: generateString(i),
			},
		],
	}));

describe('v1/projects/:projectId/forecasts/:forecastId/aries/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getAriesForecastDataHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/forecasts/5e272dec4b97ed00132f2273/aries';

		res.locals = {
			service: {
				getAriesForecastDataCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getAriesForecastDataHead, READ_RECORD_LIMIT);
	});
	test('getAriesForecastDataHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/aries`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getAriesForecastDataCount = jest.fn(() => count);

		res.locals = {
			service: {
				getAriesForecastDataCount,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getAriesForecastDataHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getAriesForecastDataHead(req, res);
		expect(getAriesForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getAriesForecastDataHead(req, res);
		expect(getAriesForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
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
		await getAriesForecastDataHead(req, res);
		expect(getAriesForecastDataCount).toHaveBeenLastCalledWith({}, project, forecast);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3' };
		count = 35;
		await getAriesForecastDataHead(req, res);
		expect(getAriesForecastDataCount).toHaveBeenLastCalledWith(
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

		const serviceCallTimes = getAriesForecastDataCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', pSeries: 'P50', a: 'b' };
		count = 35;
		await expect(getAriesForecastDataHead(req, res)).rejects.toThrow(MultipleValidationError);
		// Service must not be called
		expect(getAriesForecastDataCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getAriesForecastData throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		req.originalUrl = `projects/${project._id}/forecasts/${forecast.id}/aries`;

		res.locals = {
			service: {
				getAriesForecastData: () => ({ result: [], hasNext: false }),
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getAriesForecastData, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['runDate'] };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=runDate' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>runDate' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+runDate' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getAriesForecastData(req, res)).rejects.toThrow(ValidationError);
	});

	test('getAriesForecastData runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const forecast = { id: Types.ObjectId('5e272dec4b97ed00132f2273'), type: 'probabilistic' };

		const originalUrl = `projects/${project._id}/forecasts/${forecast.id}/aries`;

		req.originalUrl = originalUrl;

		let result: ApiAriesForecastData[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceAriesForecastData = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getAriesForecastData: serviceAriesForecastData,
			},
			project,
			forecast,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getAriesForecastDataArray(3);
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getAriesForecastDataArray(3));

		result = getAriesForecastDataArray(25);
		hasNext = true;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			25,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getAriesForecastDataArray(25));

		req.query = { skip: '25' };
		result = getAriesForecastDataArray(25);
		hasNext = true;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			25,
			25,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getAriesForecastDataArray(25));

		req.query = { skip: '30', take: '10' };
		result = getAriesForecastDataArray(5);
		hasNext = false;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', pSeries: 'P50' };
		result = getAriesForecastDataArray(5);
		hasNext = false;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'], pSeries: ['P50'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		const serviceCallTimes = serviceAriesForecastData.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '5e272d7ab78910dd2a1dfdc3', a: 'b' };
		result = getAriesForecastDataArray(5);
		hasNext = false;
		cursor = null;
		await expect(getAriesForecastData(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceAriesForecastData.mock.calls.length).toBe(serviceCallTimes);

		req.query = {
			skip: '30',
			take: '10',
			well: '5e272d7ab78910dd2a1dfdc3',
			endingCondition: 'years',
			sort: '-well',
		};
		result = getAriesForecastDataArray(5);
		hasNext = false;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'], endingCondition: ['years'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: -1 },
			{},
			project,
			forecast,
			'123456789012345678901234',
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getAriesForecastDataArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: -1 },
			{},
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '+well' };
		result = getAriesForecastDataArray(15);
		hasNext = true;
		cursor = null;
		await getAriesForecastData(req, res);
		expect(serviceAriesForecastData).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			project,
			forecast,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});
});
