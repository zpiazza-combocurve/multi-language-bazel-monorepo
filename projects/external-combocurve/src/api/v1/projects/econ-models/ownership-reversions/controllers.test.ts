import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	FieldNameError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { CursorType } from '@src/api/v1/pagination';
import { generateBoolean } from '@src/helpers/test/data-generation';
import { IOwnershipReversions } from '@src/models/econ/ownership-reversions';
import { IReservesCategory } from '@src/models/econ/reserves-categories';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ApiOwnershipReversion,
	READ_RECORD_LIMIT,
	toOwnershipReversion,
	WRITE_RECORD_LIMIT,
} from './fields/ownership-reversions';
import {
	deleteOwnershipReversion,
	getOwnershipReversionById,
	getOwnershipReversions,
	getOwnershipReversionsHead,
	postOwnershipReversions,
	putOwnershipReversions,
} from './controllers';
import {
	DuplicateOwnershipReversionError,
	OwnershipReversionCollisionError,
	OwnershipReversionNotFoundError,
} from './validation';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

const getOwnershipReversionArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getCreatedStatus = ({ name }: ApiOwnershipReversion) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiOwnershipReversion) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/ownership-reversions/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getOwnershipReversionsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/ownership-reversions';

		res.locals = {
			service: {
				getOwnershipReversionsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getOwnershipReversionsHead, READ_RECORD_LIMIT);
	});

	test('getOwnershipReversionsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/ownership-reversions`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getOwnershipReversionsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getOwnershipReversionsCount: getOwnershipReversionsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getOwnershipReversionsHead(req, res);
		expect(getOwnershipReversionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getOwnershipReversionsHead(req, res);
		expect(getOwnershipReversionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getOwnershipReversionsHead(req, res);
		expect(getOwnershipReversionsCount).toHaveBeenLastCalledWith({}, project);
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
		await getOwnershipReversionsHead(req, res);
		expect(getOwnershipReversionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getOwnershipReversionsHead(req, res);
		expect(getOwnershipReversionsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getOwnershipReversionsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getOwnershipReversionsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getOwnershipReversionsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getOwnershipReversions throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/ownership-reversions`;

		res.locals = {
			service: {
				getOwnershipReversions: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getOwnershipReversions, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getOwnershipReversions(req, res)).rejects.toThrow(ValidationError);
	});

	test('getOwnershipReversions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/ownership-reversions`;

		req.originalUrl = originalUrl;

		let result: ApiOwnershipReversion[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceOwnershipReversions = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getOwnershipReversions: serviceOwnershipReversions,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getOwnershipReversionArray(3);
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getOwnershipReversionArray(3));

		result = getOwnershipReversionArray(25);
		hasNext = true;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getOwnershipReversionArray(25));

		req.query = { skip: '25' };
		result = getOwnershipReversionArray(25);
		hasNext = true;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getOwnershipReversionArray(25));

		req.query = { skip: '30', take: '10' };
		result = getOwnershipReversionArray(5);
		hasNext = false;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getOwnershipReversionArray(5);
		hasNext = false;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
		result = getOwnershipReversionArray(5);
		hasNext = false;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(
			30,
			10,
			{ name: -1 },
			{ name: ['default1'], unique: ['false'] },
			project,
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
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(
			0,
			10,
			{ id: -1 },
			{},
			project,
			'123456789012345678901234',
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getOwnershipReversionArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getOwnershipReversionArray(15);
		hasNext = true;
		cursor = null;
		await getOwnershipReversions(req, res);
		expect(serviceOwnershipReversions).toHaveBeenLastCalledWith(
			0,
			10,
			{ name: 1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	test('getOwnershipReversionById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getOwnershipReversionById(req, res)).rejects.toThrow(OwnershipReversionNotFoundError);
	});

	test('postOwnershipReversions causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (ownershipReversion: Array<IOwnershipReversions | undefined>) => ({
					results: ownershipReversion.map((o) => o && getCreatedStatus(toOwnershipReversion(o, project._id))),
				}),
				checkWells: jest.fn(
					(ownershipReversion: Array<IOwnershipReversions | undefined>) => ownershipReversion,
				),
				checkScenarios: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversions data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversions data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversions data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postOwnershipReversions(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getOwnershipReversionArray(1, { name, unique: false }),
			...getOwnershipReversionArray(1, { name, unique: false }),
		];
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateOwnershipReversionError.name,
					`More than one ownership reversion data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateOwnershipReversionError.name,
					`More than one ownership reversion data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getOwnershipReversionArray(1, { name, unique: false });
		names = [name];
		await postOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					OwnershipReversionCollisionError.name,
					`Ownership reversion with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	test('postOwnershipReversions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((ownershipReversions: Array<IReservesCategory | undefined>) => ({
			results: ownershipReversions.map((o) => o && getCreatedStatus(toOwnershipReversion(o, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
				checkScenarios: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getOwnershipReversionArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getOwnershipReversionArray(1, { name, unique: false })[0],
		} as ApiOwnershipReversion;
		req.body = data;
		await postOwnershipReversions(req, res);
		expect(create).toHaveBeenLastCalledWith([toOwnershipReversion(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getOwnershipReversionArray(10, { unique: false });
		await postOwnershipReversions(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getOwnershipReversionArray(10, { unique: false }).map((r) => toOwnershipReversion(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getOwnershipReversionArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('putOwnershipReversions causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (ownershipReversions: Array<IOwnershipReversions | undefined>) => ({
					results: ownershipReversions.map((r) => r && getOkStatus(toOwnershipReversion(r, project._id))),
				}),
				checkWells: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
				checkScenarios: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversion data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversion data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership reversion data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putOwnershipReversions(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getOwnershipReversionArray(1, { name, unique: false }),
			...getOwnershipReversionArray(1, { name, unique: false }),
		];
		await putOwnershipReversions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateOwnershipReversionError.name,
					`More than one ownership reversion data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateOwnershipReversionError.name,
					`More than one ownership reversion data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('putOwnershipReversions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((ownershipReversions: Array<IOwnershipReversions | undefined>) => ({
			results: ownershipReversions.map((o) => o && getOkStatus(toOwnershipReversion(o, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
				checkScenarios: jest.fn(
					(ownershipReversions: Array<IOwnershipReversions | undefined>) => ownershipReversions,
				),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getOwnershipReversionArray(1, { unique: false })[0] };
		const dataApi = {
			...getOwnershipReversionArray(1, { unique: false })[0],
		} as ApiOwnershipReversion;
		req.body = data;
		await putOwnershipReversions(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toOwnershipReversion(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getOwnershipReversionArray(10, { unique: false });
		await putOwnershipReversions(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getOwnershipReversionArray(10, { unique: false }).map((o) => toOwnershipReversion(o, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getOwnershipReversionArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('deleteOwnershipReversions runs correctly', async () => {
		const { req, res } = mockExpress();
		const rawId = Types.ObjectId();
		req.params = { id: rawId.toString() };

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const deleteOwnershipReversionById = jest.fn(() => 1);

		res.locals = {
			service: {
				deleteOwnershipReversionById,
			},
			project,
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		await deleteOwnershipReversion(req, res);
		expect(deleteOwnershipReversionById).toHaveBeenLastCalledWith(rawId, project);
		expect(res.status).toHaveBeenLastCalledWith(NO_CONTENT);
		expect(res.getHeader('X-Delete-Count')).toBe('1');
	});

	test('deleteOwnershipReversions throws validation error on invalid id', async () => {
		const { req, res } = mockExpress();
		req.params = { id: 'asdf' };

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		await expect(deleteOwnershipReversion(req, res)).rejects.toThrow('`asdf` is not a valid ObjectId');
	});
});
