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
import { IDepreciation } from '@src/models/econ/depreciation';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ApiDepreciation,
	READ_RECORD_LIMIT,
	toDepreciation,
	WRITE_RECORD_LIMIT,
} from './fields/depreciation-econ-function';
import { DepreciationCollisionError, DepreciationNotFoundError, DuplicateDepreciationError } from './validation';
import {
	getDepreciation,
	getDepreciationById,
	getDepreciationHead,
	postDepreciation,
	putDepreciation,
} from './controllers';
import { ApiDepreciationEconFunction } from './fields/depreciation';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getDepreciationArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidDepreciationModel = (): {
	depreciation: ApiDepreciationEconFunction;
} => ({
	depreciation: {
		modelType: 'depreciation',
		taxCredit: 30,
		tcjaBonus: true,
		bonusDepreciation: [
			{
				tangibleBonusDepreciation: 0,
				intangibleBonusDepreciation: 4,
			},
		],
		depreciation: [
			{
				tanFactor: 3,
				intanFactor: 3,
			},
			{
				tanFactor: 3,
				intanFactor: 3,
			},
		],
	},
});

const getDepreciationArrayWithPayload = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		...getValidDepreciationModel(),
	}));

const getCreatedStatus = ({ name }: ApiDepreciation) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiDepreciation) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/Depreciation/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getDepreciationHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/Depreciation';

		res.locals = {
			service: {
				getDepreciationsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDepreciationHead, READ_RECORD_LIMIT);
	});

	it('getDepreciationHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/Depreciation`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getDepreciationsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getDepreciationsCount: getDepreciationsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getDepreciationHead(req, res);
		expect(getDepreciationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getDepreciationHead(req, res);
		expect(getDepreciationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getDepreciationHead(req, res);
		expect(getDepreciationsCount).toHaveBeenLastCalledWith({}, project);
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
		await getDepreciationHead(req, res);
		expect(getDepreciationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getDepreciationHead(req, res);
		expect(getDepreciationsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getDepreciationsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getDepreciationHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getDepreciationsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getDepreciation throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/Depreciation`;

		res.locals = {
			service: {
				getDepreciation: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDepreciation, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getDepreciation(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getDepreciation(req, res)).rejects.toThrow(ValidationError);
	});

	it('getDepreciation runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/Depreciation`;

		req.originalUrl = originalUrl;

		let result: ApiDepreciation[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const service = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getDepreciations: service,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getDepreciationArray(3);
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDepreciationArray(3));

		result = getDepreciationArray(25);
		hasNext = true;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDepreciationArray(25));

		req.query = { skip: '25' };
		result = getDepreciationArray(25);
		hasNext = true;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDepreciationArray(25));

		req.query = { skip: '30', take: '10' };
		result = getDepreciationArray(5);
		hasNext = false;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getDepreciationArray(5);
		hasNext = false;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { name: ['default1'] }, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
		result = getDepreciationArray(5);
		hasNext = false;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(
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
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getDepreciationArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getDepreciationArray(15);
		hasNext = true;
		cursor = null;
		await getDepreciation(req, res);
		expect(service).toHaveBeenLastCalledWith(0, 10, { name: 1 }, { name: ['default1'] }, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	it('getDepreciationById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getDepreciationById(req, res)).rejects.toThrow(DepreciationNotFoundError);
	});

	it('postDepreciation causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (Depreciation: Array<IDepreciation | undefined>) => ({
					results: Depreciation.map((r) => r && getCreatedStatus(toDepreciation(r, project._id))),
				}),
				checkWells: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				checkScenarios: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postDepreciation(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postDepreciation(req, res);
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
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `depreciation`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postDepreciation(req, res);
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
						message: 'Missing required field: `depreciation`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getDepreciationArrayWithPayload(1, { name, unique: false }),
			...getDepreciationArrayWithPayload(1, { name, unique: false }),
		];
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateDepreciationError.name,
					`More than one Depreciation model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateDepreciationError.name,
					`More than one Depreciation model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getDepreciationArrayWithPayload(1, { name, unique: false });
		names = [name];
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DepreciationCollisionError.name,
					`Depreciation model with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postDepreciation runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((Depreciation: Array<IDepreciation | undefined>) => ({
			results: Depreciation.map((r) => r && getCreatedStatus(toDepreciation(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				checkScenarios: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getDepreciationArrayWithPayload(1, { name, unique: false })[0] };
		const dataApi = {
			...getDepreciationArrayWithPayload(1, { name, unique: false })[0],
		} as ApiDepreciation;
		req.body = data;
		await postDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDepreciationArrayWithPayload(10, { unique: false });
		await postDepreciation(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDepreciationArrayWithPayload(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putDepreciation causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (Depreciation: Array<IDepreciation | undefined>) => ({
					results: Depreciation.map((r) => r && getOkStatus(toDepreciation(r, project._id))),
				}),
				checkWells: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				checkScenarios: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Depreciation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putDepreciation(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putDepreciation(req, res);
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
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `depreciation`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putDepreciation(req, res);
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
						message: 'Missing required field: `depreciation`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getDepreciationArrayWithPayload(1, { name, unique: false }),
			...getDepreciationArrayWithPayload(1, { name, unique: false }),
		];
		await putDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateDepreciationError.name,
					`More than one Depreciation model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateDepreciationError.name,
					`More than one Depreciation model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putDepreciation runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((Depreciation: Array<IDepreciation | undefined>) => ({
			results: Depreciation.map((r) => r && getOkStatus(toDepreciation(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
				checkScenarios: jest.fn((Depreciation: Array<IDepreciation | undefined>) => Depreciation),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getDepreciationArrayWithPayload(1, { unique: false })[0] };
		const dataApi = {
			...getDepreciationArrayWithPayload(1, { unique: false })[0],
		} as ApiDepreciation;
		req.body = data;
		await putDepreciation(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDepreciationArrayWithPayload(10, { unique: false });
		await putDepreciation(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDepreciationArrayWithPayload(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
