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
import { IReservesCategory } from '@src/models/econ/reserves-categories';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ApiReservesCategory,
	READ_RECORD_LIMIT,
	toReservesCategory,
	WRITE_RECORD_LIMIT,
} from './fields/reserves-category';
import {
	deleteReservesCategory,
	getReservesCategories,
	getReservesCategoriesHead,
	getReservesCategoryById,
	postReservesCategories,
	putReservesCategories,
} from './controllers';
import {
	DuplicateReservesCategoryError,
	ReservesCategoryCollisionError,
	ReservesCategoryNotFoundError,
} from './validation';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

const getReserveCategoryArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getCreatedStatus = ({ name }: ApiReservesCategory) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiReservesCategory) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/reserves-categories/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getReservesCategoriesHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/reserves-categories';

		res.locals = {
			service: {
				getReservesCategoriesCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getReservesCategoriesHead, READ_RECORD_LIMIT);
	});

	test('getReservesCategoriesHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/reserves-categories`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getReservesCategoriesCount = jest.fn(() => count);

		res.locals = {
			service: {
				getReservesCategoriesCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getReservesCategoriesHead(req, res);
		expect(getReservesCategoriesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getReservesCategoriesHead(req, res);
		expect(getReservesCategoriesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getReservesCategoriesHead(req, res);
		expect(getReservesCategoriesCount).toHaveBeenLastCalledWith({}, project);
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
		await getReservesCategoriesHead(req, res);
		expect(getReservesCategoriesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getReservesCategoriesHead(req, res);
		expect(getReservesCategoriesCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getReservesCategoriesCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getReservesCategoriesHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getReservesCategoriesCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getReservesCategories throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/reserves-categories`;

		res.locals = {
			service: {
				getReservesCategories: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getReservesCategories, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getReservesCategories(req, res)).rejects.toThrow(ValidationError);
	});

	test('getReservesCategories runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/reserves-categories`;

		req.originalUrl = originalUrl;

		let result: ApiReservesCategory[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceReserveCategory = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getReservesCategories: serviceReserveCategory,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getReserveCategoryArray(3);
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getReserveCategoryArray(3));

		result = getReserveCategoryArray(25);
		hasNext = true;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getReserveCategoryArray(25));

		req.query = { skip: '25' };
		result = getReserveCategoryArray(25);
		hasNext = true;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getReserveCategoryArray(25));

		req.query = { skip: '30', take: '10' };
		result = getReserveCategoryArray(5);
		hasNext = false;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getReserveCategoryArray(5);
		hasNext = false;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(
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
		result = getReserveCategoryArray(5);
		hasNext = false;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(
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
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(
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
		result = getReserveCategoryArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getReserveCategoryArray(15);
		hasNext = true;
		cursor = null;
		await getReservesCategories(req, res);
		expect(serviceReserveCategory).toHaveBeenLastCalledWith(
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

	test('getReservesCategoryById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getReservesCategoryById(req, res)).rejects.toThrow(ReservesCategoryNotFoundError);
	});

	test('postReservesCategories causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (reservesCategories: Array<IReservesCategory | undefined>) => ({
					results: reservesCategories.map((r) => r && getCreatedStatus(toReservesCategory(r, project._id))),
				}),
				checkWells: jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories),
				checkScenarios: jest.fn(
					(reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories,
				),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postReservesCategories(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postReservesCategories(req, res);
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
		await postReservesCategories(req, res);
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
			...getReserveCategoryArray(1, { name, unique: false }),
			...getReserveCategoryArray(1, { name, unique: false }),
		];
		await postReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateReservesCategoryError.name,
					`More than one reserves category data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateReservesCategoryError.name,
					`More than one reserves category data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getReserveCategoryArray(1, { name, unique: false });
		names = [name];
		await postReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ReservesCategoryCollisionError.name,
					`Reserves category with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	test('postReservesCategories runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => ({
			results: reservesCategories.map((r) => r && getCreatedStatus(toReservesCategory(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories),
				checkScenarios: jest.fn(
					(reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories,
				),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getReserveCategoryArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getReserveCategoryArray(1, { name, unique: false })[0],
		} as ApiReservesCategory;
		req.body = data;
		await postReservesCategories(req, res);
		expect(create).toHaveBeenLastCalledWith([toReservesCategory(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getReserveCategoryArray(10, { unique: false });
		await postReservesCategories(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getReserveCategoryArray(10, { unique: false }).map((r) => toReservesCategory(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getReserveCategoryArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('putReservesCategories causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (reservesCategories: Array<IReservesCategory | undefined>) => ({
					results: reservesCategories.map((r) => r && getOkStatus(toReservesCategory(r, project._id))),
				}),
				checkWells: jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories),
				checkScenarios: jest.fn(
					(reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories,
				),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid reserves category data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putReservesCategories(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putReservesCategories(req, res);
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
		await putReservesCategories(req, res);
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
			...getReserveCategoryArray(1, { name, unique: false }),
			...getReserveCategoryArray(1, { name, unique: false }),
		];
		await putReservesCategories(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateReservesCategoryError.name,
					`More than one reserves category data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateReservesCategoryError.name,
					`More than one reserves category data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('putReservesCategories runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => ({
			results: reservesCategories.map((r) => r && getOkStatus(toReservesCategory(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories),
				checkScenarios: jest.fn(
					(reservesCategories: Array<IReservesCategory | undefined>) => reservesCategories,
				),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getReserveCategoryArray(1, { unique: false })[0] };
		const dataApi = {
			...getReserveCategoryArray(1, { unique: false })[0],
		} as ApiReservesCategory;
		req.body = data;
		await putReservesCategories(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toReservesCategory(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getReserveCategoryArray(10, { unique: false });
		await putReservesCategories(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getReserveCategoryArray(10, { unique: false }).map((r) => toReservesCategory(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getReserveCategoryArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('deleteOwnershipReversions runs correctly', async () => {
		const { req, res } = mockExpress();
		const rawId = Types.ObjectId();
		req.params = { id: rawId.toString() };

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const deleteReservesCategoryById = jest.fn(() => 1);

		res.locals = {
			service: {
				deleteReservesCategoryById,
			},
			project,
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		await deleteReservesCategory(req, res);
		expect(deleteReservesCategoryById).toHaveBeenLastCalledWith(rawId, project);
		expect(res.status).toHaveBeenLastCalledWith(NO_CONTENT);
		expect(res.getHeader('X-Delete-Count')).toBe('1');
	});

	test('deleteOwnershipReversions throws validation error on invalid id', async () => {
		const { req, res } = mockExpress();
		req.params = { id: 'asdf' };

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		await expect(deleteReservesCategory(req, res)).rejects.toThrow('`asdf` is not a valid ObjectId');
	});
});
