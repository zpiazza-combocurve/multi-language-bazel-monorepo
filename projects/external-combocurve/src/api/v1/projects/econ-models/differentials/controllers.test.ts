/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
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
import { IDifferentials } from '@src/models/econ/differentials';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiDifferentials, READ_RECORD_LIMIT, toDifferentials, WRITE_RECORD_LIMIT } from './fields/differentials';
import { DifferentialsCollisionError, DifferentialsNotFoundError, DuplicateDifferentialsError } from './validation';
import {
	getDifferentialById,
	getDifferentials,
	getDifferentialsHead,
	postDifferentials,
	putDifferentials,
} from './controllers';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;
interface CustomRequest extends Request {
	originalUrl: string;
}

interface CustomResponse extends Response {
	locals: {
		service: {
			getDifferentials: jest.Mock;
			getDifferentialsCount: jest.Mock;
			getById: jest.Mock;
		};
		project: {
			_id: Types.ObjectId;
		};
	};
	set: jest.Mock;
}

const getTestDifferentials = () => ({
	firstDifferential: {
		oil: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		gas: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerMmbtu: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		ngl: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		dripCondensate: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
	},
	secondDifferential: {
		oil: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		gas: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerMmbtu: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		ngl: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		dripCondensate: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
	},
	thirdDifferential: {
		oil: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		gas: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerMmbtu: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		ngl: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		dripCondensate: {
			escalationModel: 'none',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
	},
});

const getDifferentialsArray = (
	n = 1,
	{ name, unique, differentials }: { name?: string; unique?: boolean; differentials?: Record<string, unknown> } = {},
) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		differentials: differentials ?? getTestDifferentials(),
	}));

const getCreatedStatus = ({ name }: ApiDifferentials) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiDifferentials) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/differentials/controllers', () => {
	describe('getDifferentialsHead', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let project: { _id: Types.ObjectId };
		let originalUrl: string;
		let getDifferentialsCount: jest.Mock<any, any>;

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

			originalUrl = `projects/${project._id}/econ-models/differentials`;
			req.originalUrl = originalUrl;

			getDifferentialsCount = jest.fn();

			res.locals = {
				service: {
					getDifferentialsCount: getDifferentialsCount,
					getDifferentials: getDifferentialsCount,
					getById: jest.fn(),
				},
				project,
			};
			res.set = jest.fn(() => res);
		});

		it('should throw validation error when skip and take are invalid', async () => {
			getDifferentialsCount.mockReturnValue(0);

			await testSkipAndTakeErrors(req, res, getDifferentialsHead, READ_RECORD_LIMIT);

			expect(res.set).not.toHaveBeenCalled();
		});

		it('runs correctly with no query and count 0', async () => {
			getDifferentialsCount.mockReturnValue(0);

			await getDifferentialsHead(req, res);

			expect(getDifferentialsCount).toHaveBeenLastCalledWith({}, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
				'X-Query-Count': '0',
			});
		});

		it('runs correctly with no query and count 51', async () => {
			getDifferentialsCount.mockReturnValue(51);

			await getDifferentialsHead(req, res);

			expect(getDifferentialsCount).toHaveBeenLastCalledWith({}, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
				'X-Query-Count': '51',
			});
		});

		it('runs correctly with skip 25 and count 51', async () => {
			req.query = { skip: '25' };
			getDifferentialsCount.mockReturnValue(51);

			await getDifferentialsHead(req, res);

			expect(getDifferentialsCount).toHaveBeenLastCalledWith({}, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
				'X-Query-Count': '51',
			});
		});

		it('runs correctly with skip 30, take 10, and count 35', async () => {
			req.query = { skip: '30', take: '10' };
			getDifferentialsCount.mockReturnValue(35);

			await getDifferentialsHead(req, res);

			expect(getDifferentialsCount).toHaveBeenLastCalledWith({}, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
				'X-Query-Count': '35',
			});
		});

		it('runs correctly with skip 30, take 10, name default1, and count 35', async () => {
			req.query = { skip: '30', take: '10', name: 'default1' };
			getDifferentialsCount.mockReturnValue(35);

			await getDifferentialsHead(req, res);

			expect(getDifferentialsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
				'X-Query-Count': '35',
			});
		});

		it('throws an error with skip 30, take 10, name test, a b, and count 35', async () => {
			req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
			getDifferentialsCount.mockReturnValue(35);

			const serviceCallTimes = getDifferentialsCount.mock.calls.length;

			await expect(getDifferentialsHead(req, res)).rejects.toThrow(FieldNameFilterError);

			expect(getDifferentialsCount.mock.calls.length).toBe(serviceCallTimes);
		});
	});

	describe('getDifferentials', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let project: { _id: Types.ObjectId };
		let result: ApiDifferentials[];
		let hasNext: boolean;
		let cursor: CursorType | null;
		let serviceDifferential: jest.Mock;
		let originalUrl: string;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			originalUrl = `projects/${project._id}/econ-models/differentials`;
			req.originalUrl = originalUrl;

			result = [];
			hasNext = false;
			cursor = null;

			serviceDifferential = jest.fn(() => ({ result, hasNext, cursor }));

			res.locals = {
				service: {
					getDifferentials: serviceDifferential,
					getDifferentialsCount: jest.fn(),
					getById: jest.fn(),
				},
				project,
			};
			res.set = jest.fn(() => res);
			res.json = jest.fn();
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('getDifferentials throws validation error for skip and take', async () => {
			getDifferentials(req, res);
			testSkipAndTakeErrors(req, res, getDifferentials, READ_RECORD_LIMIT);
			expect(res.set).not.toHaveBeenCalled();
		});

		const invalidSortValues = [['a'], ['name'], '35', 'a', '=name', '>name', '-+name'];

		invalidSortValues.forEach((sortValue) => {
			it(`getDifferentials throws validation error for sort value "${JSON.stringify(sortValue)}"`, async () => {
				req.query = { sort: sortValue };
				await expect(getDifferentials(req, res)).rejects.toThrow(TypeError);
			});
		});

		it('getDifferentials throws validation error for skip and cursor', async () => {
			req.query = { skip: '10', cursor: '123456789012345678901234' };
			await expect(getDifferentials(req, res)).rejects.toThrow(ValidationError);
		});

		// Basic functionality test
		it('returns empty array when no differentials are found', async () => {
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith([]);
		});

		// Result size tests
		it('returns array of 3 differentials when 3 are found', async () => {
			result = getDifferentialsArray(3);
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getDifferentialsArray(3));
		});

		it('returns array of 25 differentials and hasNext is true', async () => {
			result = getDifferentialsArray(25);
			hasNext = true;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getDifferentialsArray(25));
		});

		// Pagination tests
		it('returns correct pagination links when only skip is provided', async () => {
			req.query = { skip: '25' };
			result = getDifferentialsArray(25);
			hasNext = true;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getDifferentialsArray(25));
		});

		it('returns correct pagination links when skip and take are provided', async () => {
			req.query = { skip: '30', take: '10' };
			result = getDifferentialsArray(5);
			hasNext = false;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
			});
		});

		// Filtering tests
		it('filters by name when name is provided', async () => {
			req.query = { skip: '30', take: '10', name: 'default1' };
			result = getDifferentialsArray(5);
			hasNext = false;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(
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
		});

		it('filters by name and unique when name and unique are provided', async () => {
			req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
			result = getDifferentialsArray(5);
			hasNext = false;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(
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
		});

		// Sorting tests
		it('sorts by name ascending when sort is +name', async () => {
			req.query = { take: '10', name: 'default1', sort: '+name' };
			result = getDifferentialsArray(15);
			hasNext = true;
			cursor = null;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(
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

		it('sorts by name descending when sort is -name', async () => {
			req.query = { take: '10', name: 'default1', sort: '-name' };
			result = getDifferentialsArray(15);
			hasNext = true;
			cursor = null;
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(
				0,
				10,
				{ name: -1 },
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

		// Cursor tests
		it('creates a cursor when skip is omitted', async () => {
			req.query = { take: '10' };
			result = getDifferentialsArray(15);
			hasNext = true;
			cursor = Types.ObjectId();
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
			});
		});

		it('can paginate by cursor when cursor is provided', async () => {
			req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
			result = [];
			hasNext = false;
			cursor = Types.ObjectId();
			await getDifferentials(req, res);
			expect(serviceDifferential).toHaveBeenLastCalledWith(
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
		});
	});

	describe('getDifferentialById', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let mockDifferential: ApiDifferentials;

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			mockDifferential = {
				id: Types.ObjectId(),
				name: 'default',
				unique: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			res.locals = {
				service: {
					getDifferentials: jest.fn(),
					getDifferentialsCount: jest.fn(),
					getById: jest.fn(),
				},
				project: { _id: Types.ObjectId() },
			};

			res.sendStatus = jest.fn();
			res.json = jest.fn();
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('throws DifferentialsNotFoundError when differential is not found', async () => {
			req.params = { id: Types.ObjectId().toString() };
			res.locals.service.getById.mockImplementation(() => null);

			await expect(getDifferentialById(req, res)).rejects.toThrow(DifferentialsNotFoundError);
		});

		it('returns differential when found', async () => {
			req.params = { id: Types.ObjectId().toString() };
			res.locals.service.getById.mockImplementation(() => mockDifferential);

			await getDifferentialById(req, res);

			expect(res.json).toHaveBeenCalledWith(mockDifferential);
		});

		it('throws an error when differential ID is invalid', async () => {
			req.params = { id: 'invalid_id' };

			await expect(getDifferentialById(req, res)).rejects.toThrow(TypeError);
		});
	});

	describe('postDifferentials', () => {
		const setupTest = () => {
			const { req, res } = mockExpress();

			const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			const names: string[] = [];
			const create = jest.fn((differentials: Array<IDifferentials | undefined>) => ({
				results: differentials.map((r) => r && getCreatedStatus(toDifferentials(r, project._id))),
			}));

			res.locals = {
				service: {
					create,
					checkWells: jest.fn((differentials: Array<IDifferentials | undefined>) => differentials),
					checkScenarios: jest.fn((differentials: Array<IDifferentials | undefined>) => differentials),
					getExistingNames: jest.fn(() => names),
				},
				project,
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			return { req, res, names, project, create };
		};

		it('returns an error for invalid differentials model data structure (number)', async () => {
			const { req, res } = setupTest();
			req.body = 1;
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for invalid differentials model data structure (empty array)', async () => {
			const { req, res } = setupTest();
			req.body = [[]];
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for invalid differentials model data structure (boolean)', async () => {
			const { req, res } = setupTest();
			req.body = [true];
			req.body = [true];
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('throws an error when record count exceeds the limit', async () => {
			const { req, res } = setupTest();
			req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
			await expect(postDifferentials(req, res)).rejects.toThrow(RecordCountError);
		});

		it('returns an error for invalid field name', async () => {
			const { req, res } = setupTest();
			const differentials = getTestDifferentials();
			const name = 'test';
			req.body = { name: name, differentials, unique: false, a: 'b' };
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getMultiErrorStatus([
						{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					]),
				],
				successCount: 0,
				failedCount: 1,
				generalErrors: undefined,
			});
		});

		it('returns an error for missing required fields', async () => {
			const { req, res } = setupTest();
			req.body = {};
			await postDifferentials(req, res);
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
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `differentials`',
							location: '[0]',
						},
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for duplicate differentials', async () => {
			const { req, res } = setupTest();
			const differentials = getTestDifferentials();
			const name = 'test';
			req.body = [
				...getDifferentialsArray(1, { name: name, unique: false, differentials: differentials }),
				...getDifferentialsArray(1, { name: name, unique: false, differentials: differentials }),
			];
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						DuplicateDifferentialsError.name,
						`More than one differentials model data supplied with name \`${name}\``,
						'[0], [1]',
					),
					getErrorStatus(
						DuplicateDifferentialsError.name,
						`More than one differentials model data supplied with name \`${name}\``,
						'[0], [1]',
					),
				],
				successCount: 0,
				failedCount: 2,
			});
		});

		it('returns an error for differentials collision', async () => {
			const { req, res, project } = setupTest();
			const name = 'test';
			req.body = getDifferentialsArray(1, { name, unique: false });
			res.locals.service.getExistingNames.mockReturnValue([name]);
			// names = [name];
			await postDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						DifferentialsCollisionError.name,
						`Differentials model with name \`${name}\` already exists in project \`${project._id}\``,
						'[0]',
					),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns a successful response for single differential input', async () => {
			const { req, res, project, create } = setupTest();
			const name = 'test';
			const data = { ...getDifferentialsArray(1, { name, unique: false })[0] };
			const dataApi = {
				...getDifferentialsArray(1, { name, unique: false })[0],
			} as ApiDifferentials;
			req.body = data;
			await postDifferentials(req, res);
			expect(create).toHaveBeenLastCalledWith([toDifferentials(dataApi, project._id)]);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [getCreatedStatus(dataApi)],
				successCount: 1,
				failedCount: 0,
			});
		});

		it('returns a successful response for multiple differentials input', async () => {
			const { req, res, project, create } = setupTest();
			req.body = getDifferentialsArray(10, { unique: false });
			await postDifferentials(req, res);
			expect(create).toHaveBeenLastCalledWith(
				getDifferentialsArray(10, { unique: false }).map((r) => toDifferentials(r, project._id)),
			);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: getDifferentialsArray(10).map(getCreatedStatus),
				successCount: 10,
				failedCount: 0,
			});
		});
	});

	describe('putDifferentials', () => {
		const setupTest = () => {
			const { req, res } = mockExpress();

			const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

			const upsert = jest.fn((differentials: Array<IDifferentials | undefined>) => ({
				results: differentials.map((r) => r && getOkStatus(toDifferentials(r, project._id))),
			}));

			res.locals = {
				service: {
					upsert,
					checkWells: jest.fn((differentials: Array<IDifferentials | undefined>) => differentials),
					checkScenarios: jest.fn((differentials: Array<IDifferentials | undefined>) => differentials),
				},
				project,
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			return { req, res, project, upsert };
		};

		it('returns validation error for invalid input: number', async () => {
			const { req, res } = setupTest();
			req.body = 1;
			await putDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for invalid input: empty array', async () => {
			const { req, res } = setupTest();
			req.body = [[]];
			await putDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for invalid input: boolean', async () => {
			const { req, res } = setupTest();
			req.body = [true];
			await putDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid differentials model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for exceeding write record limit', async () => {
			const { req, res } = setupTest();
			req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
			await expect(putDifferentials(req, res)).rejects.toThrow(RecordCountError);
		});

		it('returns validation error for invalid field name', async () => {
			const { req, res } = setupTest();
			const differentials = getTestDifferentials();
			req.body = { name: 'test', unique: false, differentials: differentials, a: 'b' };
			await putDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getMultiErrorStatus([
						{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for missing required fields', async () => {
			const { req, res } = setupTest();
			req.body = {};
			await putDifferentials(req, res);
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
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `differentials`',
							location: '[0]',
						},
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for duplicate differentials', async () => {
			const { req, res } = setupTest();
			const name = 'test';
			req.body = [
				...getDifferentialsArray(1, { name, unique: false }),
				...getDifferentialsArray(1, { name, unique: false }),
			];
			await putDifferentials(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						DuplicateDifferentialsError.name,
						`More than one differentials model data supplied with name \`${name}\``,
						'[0], [1]',
					),
					getErrorStatus(
						DuplicateDifferentialsError.name,
						`More than one differentials model data supplied with name \`${name}\``,
						'[0], [1]',
					),
				],
				successCount: 0,
				failedCount: 2,
			});
		});

		it('runs correctly with single differential', async () => {
			const { req, res, project, upsert } = setupTest();
			const data = { ...getDifferentialsArray(1, { unique: false })[0] };
			const dataApi = {
				...getDifferentialsArray(1, { unique: false })[0],
			} as ApiDifferentials;
			req.body = data;
			await putDifferentials(req, res);
			expect(upsert).toHaveBeenLastCalledWith([toDifferentials(dataApi, project._id)], project._id);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [getOkStatus(dataApi)],
				successCount: 1,
				failedCount: 0,
			});
		});

		it('runs correctly with multiple differentials', async () => {
			const { req, res, project, upsert } = setupTest();
			req.body = getDifferentialsArray(10, { unique: false });
			await putDifferentials(req, res);
			expect(upsert).toHaveBeenLastCalledWith(
				getDifferentialsArray(10, { unique: false }).map((r) => toDifferentials(r, project._id)),
				project._id,
			);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: getDifferentialsArray(10).map(getOkStatus),
				successCount: 10,
				failedCount: 0,
			});
		});
	});
});
