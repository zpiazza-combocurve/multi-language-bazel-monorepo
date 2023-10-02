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
import { IStreamProperties } from '@src/models/econ/stream-properties';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ApiStreamProperties,
	READ_RECORD_LIMIT,
	toStreamProperties,
	WRITE_RECORD_LIMIT,
} from './fields/stream-properties';
import {
	DuplicateStreamPropertiesError,
	StreamPropertiesCollisionError,
	StreamPropertiesNotFoundError,
} from './validation';
import {
	getStreamProperties,
	getStreamPropertiesById,
	getStreamPropertiesHead,
	postStreamProperties,
	putStreamProperties,
} from './controllers';
import { ApiBtuContentEconFunction } from './fields/btu-content-econ-function';
import { ApiLossFlareEconFunction } from './fields/loss-flare-econ-function';
import { ApiShrinkageEconFunction } from './fields/shrinkage-econ-function';
import { ApiYieldsEconFunction } from './fields/yields-econ-function';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;
interface CustomRequest extends Request {
	originalUrl: string;
}

interface CustomResponse extends Response {
	locals: {
		service: {
			getStreamProperties: jest.Mock;
			getStreamPropertiesCount: jest.Mock;
			getById: jest.Mock;
		};
		project: {
			_id: Types.ObjectId;
		};
	};
	set: jest.Mock;
}

const getTestStreamPropertyYieldsInput = () => ({
	rowsCalculationMethod: 'monotonic',
	ngl: {
		rows: [
			{
				yield: 0.000001,
				gasRate: 5,
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: 10,
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: 15,
				shrunkGas: 'Shrunk Gas',
			},
		],
	},
	dripCondensate: {
		rows: [
			{
				yield: 2001,
				offsetToFpd: 99,
				unshrunkGas: 'Unshrunk Gas',
			},
		],
	},
});

const getTestStreamPropertyYieldsOutput = () => ({
	rowsCalculationMethod: 'monotonic',
	ngl: {
		rows: [
			{
				yield: 0.000001,
				gasRate: {
					start: 5,
					end: 10,
				},
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: {
					start: 10,
					end: 15,
				},
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: {
					start: 15,
					end: 'inf',
				},
				shrunkGas: 'Shrunk Gas',
			},
		],
	},
	dripCondensate: {
		rows: [
			{
				yield: 2001,
				offsetToFpd: {
					start: 1,
					end: 99,
					period: 99,
				},
				unshrunkGas: 'Unshrunk Gas',
			},
		],
	},
});

const getTestStreamPropertyShrinkageInput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oil: {
		rows: [
			{
				gasRate: 123132132,
				pctRemaining: 100,
			},
		],
	},
	gas: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

const getTestStreamPropertyShrinkageOutput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oil: {
		rows: [
			{
				gasRate: {
					start: 123132132,
					end: 'inf',
				},
				pctRemaining: 100,
			},
		],
	},
	gas: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

const getTestStreamPropertyLossFlareInput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oilLoss: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
	gasLoss: {
		rows: [
			{
				offsetToFpd: 24,
				pctRemaining: 100,
			},
		],
	},
	gasFlare: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

const getTestStreamPropertyLossFlareOutput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oilLoss: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
	gasLoss: {
		rows: [
			{
				offsetToFpd: {
					start: 1,
					end: 24,
					period: 24,
				},
				pctRemaining: 100,
			},
		],
	},
	gasFlare: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

const getTestStreamPropertyBtuContent = () => ({
	unshrunkGas: 1231.999999999,
	shrunkGas: 999.999,
});

const getStreamPropertiesArray = (
	n = 1,
	{
		name,
		unique,
		yields,
		shrinkage,
		lossFlare,
		btuContent,
	}: {
		name?: string;
		unique?: boolean;
		yields?: Record<string, unknown>;
		shrinkage?: Record<string, unknown>;
		lossFlare?: Record<string, unknown>;
		btuContent?: Record<string, unknown>;
	} = {},
) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		yields: yields ?? (getTestStreamPropertyYieldsInput() as ApiYieldsEconFunction),
		shrinkage: shrinkage ?? (getTestStreamPropertyShrinkageInput() as ApiShrinkageEconFunction),
		lossFlare: lossFlare ?? (getTestStreamPropertyLossFlareInput() as ApiLossFlareEconFunction),
		btuContent: btuContent ?? (getTestStreamPropertyBtuContent() as ApiBtuContentEconFunction),
	}));

const getCreatedStatus = ({ name }: ApiStreamProperties) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiStreamProperties) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/stream-properties/controllers', () => {
	describe('getStreamPropertiesHead', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let project: { _id: Types.ObjectId };
		let originalUrl: string;
		let getStreamPropertiesCount: jest.Mock<any, any>;

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

			originalUrl = `projects/${project._id}/econ-models/streamProperties`;
			req.originalUrl = originalUrl;

			getStreamPropertiesCount = jest.fn();

			res.locals = {
				service: {
					getStreamPropertiesCount: getStreamPropertiesCount,
					getStreamProperties: getStreamPropertiesCount,
					getById: jest.fn(),
				},
				project,
			};
			res.set = jest.fn(() => res);
		});

		it('should throw validation error when skip and take are invalid', async () => {
			getStreamPropertiesCount.mockReturnValue(0);

			await testSkipAndTakeErrors(req, res, getStreamPropertiesHead, READ_RECORD_LIMIT);

			expect(res.set).not.toHaveBeenCalled();
		});

		it('runs correctly with no query and count 0', async () => {
			getStreamPropertiesCount.mockReturnValue(0);

			await getStreamPropertiesHead(req, res);

			expect(getStreamPropertiesCount).toHaveBeenLastCalledWith({}, project);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
				'X-Query-Count': '0',
			});
		});

		it('runs correctly with no query and count 51', async () => {
			getStreamPropertiesCount.mockReturnValue(51);

			await getStreamPropertiesHead(req, res);

			expect(getStreamPropertiesCount).toHaveBeenLastCalledWith({}, project);
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
			getStreamPropertiesCount.mockReturnValue(51);

			await getStreamPropertiesHead(req, res);

			expect(getStreamPropertiesCount).toHaveBeenLastCalledWith({}, project);
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
			getStreamPropertiesCount.mockReturnValue(35);

			await getStreamPropertiesHead(req, res);

			expect(getStreamPropertiesCount).toHaveBeenLastCalledWith({}, project);
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
			getStreamPropertiesCount.mockReturnValue(35);

			await getStreamPropertiesHead(req, res);

			expect(getStreamPropertiesCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
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
			getStreamPropertiesCount.mockReturnValue(35);

			const serviceCallTimes = getStreamPropertiesCount.mock.calls.length;

			await expect(getStreamPropertiesHead(req, res)).rejects.toThrow(FieldNameFilterError);

			expect(getStreamPropertiesCount.mock.calls.length).toBe(serviceCallTimes);
		});
	});

	describe('getStreamProperties', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let project: { _id: Types.ObjectId };
		let result: ApiStreamProperties[];
		let hasNext: boolean;
		let cursor: CursorType | null;
		let serviceStreamProperties: jest.Mock;
		let originalUrl: string;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			originalUrl = `projects/${project._id}/econ-models/streamProperties`;
			req.originalUrl = originalUrl;

			result = [];
			hasNext = false;
			cursor = null;

			serviceStreamProperties = jest.fn(() => ({ result, hasNext, cursor }));

			res.locals = {
				service: {
					getStreamProperties: serviceStreamProperties,
					getStreamPropertiesCount: jest.fn(),
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

		it('getStreamProperties throws validation error for skip and take', async () => {
			getStreamProperties(req, res);
			testSkipAndTakeErrors(req, res, getStreamProperties, READ_RECORD_LIMIT);
			expect(res.set).not.toHaveBeenCalled();
		});

		const invalidSortValues = [['a'], ['name'], '35', 'a', '=name', '>name', '-+name'];

		invalidSortValues.forEach((sortValue) => {
			it(`getStreamProperties throws validation error for sort value "${JSON.stringify(
				sortValue,
			)}"`, async () => {
				req.query = { sort: sortValue };
				await expect(getStreamProperties(req, res)).rejects.toThrow(TypeError);
			});
		});

		it('getStreamProperties throws validation error for skip and cursor', async () => {
			req.query = { skip: '10', cursor: '123456789012345678901234' };
			await expect(getStreamProperties(req, res)).rejects.toThrow(ValidationError);
		});

		// Basic functionality test
		it('returns empty array when no Stream Properties are found', async () => {
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith([]);
		});

		// Result size tests
		it('returns array of 3 Stream Properties when 3 are found', async () => {
			result = getStreamPropertiesArray(3);
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getStreamPropertiesArray(3));
		});

		it('returns array of 25 Stream Properties and hasNext is true', async () => {
			result = getStreamPropertiesArray(25);
			hasNext = true;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getStreamPropertiesArray(25));
		});

		// Pagination tests
		it('returns correct pagination links when only skip is provided', async () => {
			req.query = { skip: '25' };
			result = getStreamPropertiesArray(25);
			hasNext = true;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
			});
			expect(res.json).toHaveBeenLastCalledWith(getStreamPropertiesArray(25));
		});

		it('returns correct pagination links when skip and take are provided', async () => {
			req.query = { skip: '30', take: '10' };
			result = getStreamPropertiesArray(5);
			hasNext = false;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
			expect(res.set).toHaveBeenLastCalledWith({
				Link:
					`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
					`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
			});
		});

		// Filtering tests
		it('filters by name when name is provided', async () => {
			req.query = { skip: '30', take: '10', name: 'default1' };
			result = getStreamPropertiesArray(5);
			hasNext = false;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(
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
			result = getStreamPropertiesArray(5);
			hasNext = false;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(
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
			result = getStreamPropertiesArray(15);
			hasNext = true;
			cursor = null;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(
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
			result = getStreamPropertiesArray(15);
			hasNext = true;
			cursor = null;
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(
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
			result = getStreamPropertiesArray(15);
			hasNext = true;
			cursor = Types.ObjectId();
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
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
			await getStreamProperties(req, res);
			expect(serviceStreamProperties).toHaveBeenLastCalledWith(
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

	describe('getStreamPropertiesById', () => {
		let req: CustomRequest;
		let res: CustomResponse;
		let mockStreamProperties: ApiStreamProperties;

		beforeEach(() => {
			const mockReqRes = mockExpress();
			req = mockReqRes.req as CustomRequest;
			res = mockReqRes.res as CustomResponse;

			mockStreamProperties = {
				id: Types.ObjectId(),
				name: 'default',
				unique: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			res.locals = {
				service: {
					getStreamProperties: jest.fn(),
					getStreamPropertiesCount: jest.fn(),
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

		it('throws StreamPropertiesNotFoundError when Stream Properties is not found', async () => {
			req.params = { id: Types.ObjectId().toString() };
			res.locals.service.getById.mockImplementation(() => null);

			await expect(getStreamPropertiesById(req, res)).rejects.toThrow(StreamPropertiesNotFoundError);
		});

		it('returns Stream Properties when found', async () => {
			req.params = { id: Types.ObjectId().toString() };
			res.locals.service.getById.mockImplementation(() => mockStreamProperties);

			await getStreamPropertiesById(req, res);

			expect(res.json).toHaveBeenCalledWith(mockStreamProperties);
		});

		it('throws an error when Stream Properties ID is invalid', async () => {
			req.params = { id: 'invalid_id' };

			await expect(getStreamPropertiesById(req, res)).rejects.toThrow(TypeError);
		});
	});

	describe('postStreamProperties', () => {
		const setupTest = () => {
			const { req, res } = mockExpress();

			const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			const names: string[] = [];
			const create = jest.fn((streamProperties: Array<IStreamProperties | undefined>) => ({
				results: streamProperties.map((r) => r && getCreatedStatus(toStreamProperties(r, project._id))),
			}));

			res.locals = {
				service: {
					create,
					checkWells: jest.fn((streamProperties: Array<IStreamProperties | undefined>) => streamProperties),
					checkScenarios: jest.fn(
						(streamProperties: Array<IStreamProperties | undefined>) => streamProperties,
					),
					getExistingNames: jest.fn(() => names),
				},
				project,
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			return { req, res, names, project, create };
		};

		it('returns an error for invalid Stream Properties model data structure (number)', async () => {
			const { req, res } = setupTest();
			req.body = 1;
			await postStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for invalid Stream Properties model data structure (empty array)', async () => {
			const { req, res } = setupTest();
			req.body = [[]];
			await postStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for invalid Stream Properties model data structure (boolean)', async () => {
			const { req, res } = setupTest();
			req.body = [true];
			req.body = [true];
			await postStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('throws an error when record count exceeds the limit', async () => {
			const { req, res } = setupTest();
			req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
			await expect(postStreamProperties(req, res)).rejects.toThrow(RecordCountError);
		});

		it('returns an error for invalid field name', async () => {
			const { req, res } = setupTest();
			const yields = getTestStreamPropertyYieldsInput();
			const shrinkage = getTestStreamPropertyShrinkageInput();
			const lossFlare = getTestStreamPropertyLossFlareInput();
			const btuContent = getTestStreamPropertyBtuContent();
			const name = 'test';
			req.body = {
				name: name,
				unique: false,
				yields: yields,
				shrinkage: shrinkage,
				lossFlare: lossFlare,
				btuContent: btuContent,
				a: 'b',
			};
			await postStreamProperties(req, res);
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
			await postStreamProperties(req, res);
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
							message: 'Missing required field: `yields`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `shrinkage`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `lossFlare`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `btuContent`',
							location: '[0]',
						},
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for duplicate Stream Properties', async () => {
			const { req, res } = setupTest();
			const name = 'test';
			req.body = [
				{
					name: name,
					unique: false,
					yields: getTestStreamPropertyYieldsInput(),
					shrinkage: getTestStreamPropertyShrinkageInput(),
					lossFlare: getTestStreamPropertyLossFlareInput(),
					btuContent: getTestStreamPropertyBtuContent(),
				},
				{
					name: name,
					unique: false,
					yields: getTestStreamPropertyYieldsInput(),
					shrinkage: getTestStreamPropertyShrinkageInput(),
					lossFlare: getTestStreamPropertyLossFlareInput(),
					btuContent: getTestStreamPropertyBtuContent(),
				},
			];
			await postStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						DuplicateStreamPropertiesError.name,
						`More than one Stream Properties model data supplied with name \`${name}\``,
						'[0], [1]',
					),
					getErrorStatus(
						DuplicateStreamPropertiesError.name,
						`More than one Stream Properties model data supplied with name \`${name}\``,
						'[0], [1]',
					),
				],
				successCount: 0,
				failedCount: 2,
			});
		});

		it('returns an error for Stream Properties collision', async () => {
			const { req, res, project } = setupTest();
			const name = 'test';
			req.body = getStreamPropertiesArray(1, { name, unique: false });
			res.locals.service.getExistingNames.mockReturnValue([name]);
			// names = [name];
			await postStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						StreamPropertiesCollisionError.name,
						`Stream Properties model with name \`${name}\` already exists in project \`${project._id}\``,
						'[0]',
					),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns a successful response for single Stream Properties input', async () => {
			const { req, res, project, create } = setupTest();
			const name = 'test';
			const data = { ...getStreamPropertiesArray(1, { name, unique: false })[0] };
			const dataApi = {
				...getStreamPropertiesArray(1, {
					name,
					unique: false,
					yields: getTestStreamPropertyYieldsOutput(),
					shrinkage: getTestStreamPropertyShrinkageOutput(),
					lossFlare: getTestStreamPropertyLossFlareOutput(),
				})[0],
			} as ApiStreamProperties;
			req.body = data;
			await postStreamProperties(req, res);
			expect(create).toHaveBeenLastCalledWith([toStreamProperties(dataApi, project._id)]);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [getCreatedStatus(dataApi)],
				successCount: 1,
				failedCount: 0,
			});
		});

		it('returns a successful response for multiple Stream Properties input', async () => {
			const { req, res, project, create } = setupTest();
			req.body = getStreamPropertiesArray(10, { unique: false });
			await postStreamProperties(req, res);
			expect(create).toHaveBeenLastCalledWith(
				getStreamPropertiesArray(10, {
					unique: false,
					yields: getTestStreamPropertyYieldsOutput(),
					shrinkage: getTestStreamPropertyShrinkageOutput(),
					lossFlare: getTestStreamPropertyLossFlareOutput(),
				}).map((r) => toStreamProperties(r, project._id)),
			);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: getStreamPropertiesArray(10).map(getCreatedStatus),
				successCount: 10,
				failedCount: 0,
			});
		});
	});

	describe('putStreamProperties', () => {
		const setupTest = () => {
			const { req, res } = mockExpress();

			const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

			const upsert = jest.fn((streamProperties: Array<IStreamProperties | undefined>) => ({
				results: streamProperties.map((r) => r && getOkStatus(toStreamProperties(r, project._id))),
			}));

			res.locals = {
				service: {
					upsert,
					checkWells: jest.fn((streamProperties: Array<IStreamProperties | undefined>) => streamProperties),
					checkScenarios: jest.fn(
						(streamProperties: Array<IStreamProperties | undefined>) => streamProperties,
					),
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
			await putStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for invalid input: empty array', async () => {
			const { req, res } = setupTest();
			req.body = [[]];
			await putStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for invalid input: boolean', async () => {
			const { req, res } = setupTest();
			req.body = [true];
			await putStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(RequestStructureError.name, 'Invalid Stream Properties model data structure', '[0]'),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for exceeding write record limit', async () => {
			const { req, res } = setupTest();
			req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
			await expect(putStreamProperties(req, res)).rejects.toThrow(RecordCountError);
		});

		it('returns validation error for invalid field name', async () => {
			const { req, res } = setupTest();
			const yields = getTestStreamPropertyYieldsInput();
			const shrinkage = getTestStreamPropertyShrinkageInput();
			const lossFlare = getTestStreamPropertyLossFlareInput();
			const btuContent = getTestStreamPropertyBtuContent();
			req.body = {
				name: 'test',
				unique: false,
				yields: yields,
				shrinkage: shrinkage,
				lossFlare: lossFlare,
				btuContent: btuContent,
				a: 'b',
			};
			await putStreamProperties(req, res);
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
			await putStreamProperties(req, res);
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
							message: 'Missing required field: `yields`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `shrinkage`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `lossFlare`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `btuContent`',
							location: '[0]',
						},
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns validation error for duplicate Stream Properties', async () => {
			const { req, res } = setupTest();
			const name = 'test';
			req.body = [
				...getStreamPropertiesArray(1, { name, unique: false }),
				...getStreamPropertiesArray(1, { name, unique: false }),
			];
			await putStreamProperties(req, res);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [
					getErrorStatus(
						DuplicateStreamPropertiesError.name,
						`More than one Stream Properties model data supplied with name \`${name}\``,
						'[0], [1]',
					),
					getErrorStatus(
						DuplicateStreamPropertiesError.name,
						`More than one Stream Properties model data supplied with name \`${name}\``,
						'[0], [1]',
					),
				],
				successCount: 0,
				failedCount: 2,
			});
		});

		it('runs correctly with single Stream Properties', async () => {
			const { req, res, project, upsert } = setupTest();
			const data = { ...getStreamPropertiesArray(1, { unique: false })[0] };
			const dataApi = {
				...getStreamPropertiesArray(1, {
					unique: false,
					yields: getTestStreamPropertyYieldsOutput(),
					shrinkage: getTestStreamPropertyShrinkageOutput(),
					lossFlare: getTestStreamPropertyLossFlareOutput(),
				})[0],
			} as ApiStreamProperties;
			req.body = data;
			await putStreamProperties(req, res);
			expect(upsert).toHaveBeenLastCalledWith([toStreamProperties(dataApi, project._id)], project._id);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: [getOkStatus(dataApi)],
				successCount: 1,
				failedCount: 0,
			});
		});

		it('runs correctly with multiple Stream Properties', async () => {
			const { req, res, project, upsert } = setupTest();
			req.body = getStreamPropertiesArray(10, { unique: false });
			await putStreamProperties(req, res);
			expect(upsert).toHaveBeenLastCalledWith(
				getStreamPropertiesArray(10, {
					unique: false,
					yields: getTestStreamPropertyYieldsOutput(),
					shrinkage: getTestStreamPropertyShrinkageOutput(),
					lossFlare: getTestStreamPropertyLossFlareOutput(),
				}).map((r) => toStreamProperties(r, project._id)),
				project._id,
			);
			expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(res.json).toHaveBeenLastCalledWith({
				results: getStreamPropertiesArray(10).map(getOkStatus),
				successCount: 10,
				failedCount: 0,
			});
		});
	});
});
