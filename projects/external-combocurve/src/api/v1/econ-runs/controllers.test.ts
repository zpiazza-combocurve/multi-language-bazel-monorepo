import { Types } from 'mongoose';

import { ApiEconRun, READ_RECORD_LIMIT } from '@src/api/v1/econ-runs/fields';
import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateDate, generateEnum, generateObjectId } from '@src/helpers/test/data-generation';
import { ECON_RUN_STATUS } from '@src/models/econ/econ-runs';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../pagination';
import { EconRunNotFoundError } from '../projects/scenarios/econ-runs/validation';

import { getEconRunById, getEconRuns, getEconRunsHead } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getEconRunsArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		runDate: generateDate(i + 1),
		status: generateEnum(i, ECON_RUN_STATUS),
	}));

describe('v1/econ-runs/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getEconRunsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'econ-runs';

		res.locals = {
			service: {
				getEconRunsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEconRunsHead, READ_RECORD_LIMIT);
	});

	test('getEconRunsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const originalUrl = 'econ-runs';

		req.originalUrl = originalUrl;

		let count = 0;

		const getEconRunsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getEconRunsCount,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEconRunsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getEconRunsHead(req, res);
		expect(getEconRunsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getEconRunsHead(req, res);
		expect(getEconRunsCount).toHaveBeenLastCalledWith({});
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
		await getEconRunsHead(req, res);
		expect(getEconRunsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getEconRunsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', a: 'b' };
		count = 35;
		await expect(getEconRunsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getEconRunsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getEconRuns throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'econ-runs';

		res.locals = {
			service: {
				getEconRuns: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEconRuns, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['runDate'] };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=runDate' };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>runDate' };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+runDate' };
		await expect(getEconRuns(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getEconRuns(req, res)).rejects.toThrow(ValidationError);
	});

	test('getEconRuns runs correctly', async () => {
		const { req, res } = mockExpress();

		const originalUrl = 'econ-runs';

		req.originalUrl = originalUrl;

		let result: ApiEconRun[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEconRun = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getEconRuns: serviceEconRun,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getEconRunsArray(3);
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunsArray(3));

		result = getEconRunsArray(25);
		hasNext = true;
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunsArray(25));

		req.query = { skip: '25' };
		result = getEconRunsArray(25);
		hasNext = true;
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunsArray(25));

		req.query = { skip: '30', take: '10' };
		result = getEconRunsArray(5);
		hasNext = false;
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		const serviceCallTimes = serviceEconRun.mock.calls.length;
		req.query = { skip: '30', take: '10', a: 'b' };
		result = getEconRunsArray(5);
		hasNext = false;
		await expect(getEconRuns(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceEconRun.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', sort: '-runDate' };
		result = getEconRunsArray(5);
		hasNext = false;
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(30, 10, { runDate: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, null, null, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getEconRunsArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', sort: '+runDate' };
		result = getEconRunsArray(15);
		hasNext = true;
		cursor = null;
		await getEconRuns(req, res);
		expect(serviceEconRun).toHaveBeenLastCalledWith(0, 10, { runDate: 1 }, {}, null, null, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	test('getEconRunById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
		};

		res.sendStatus = jest.fn();

		await expect(getEconRunById(req, res)).rejects.toThrow(EconRunNotFoundError);
	});
});
