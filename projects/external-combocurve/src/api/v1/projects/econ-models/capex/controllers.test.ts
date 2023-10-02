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
import { ICapex } from '@src/models/econ/capex';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiCapex, READ_RECORD_LIMIT, toCapex, WRITE_RECORD_LIMIT } from './fields/capex';
import { CapexCollisionError, CapexNotFoundError, DuplicateCapexError } from './validation';
import { getCapex, getCapexById, getCapexHead, postCapex, putCapex } from './controllers';
import { ApiCompletionCostEconFunction } from './fields/completion-cost';
import { ApiDrillingCostEconFunction } from './fields/drilling-cost';
import { ApiOtherCapexEconFunction } from './fields/other-capex';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getCapexArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidCapexModel = (): {
	otherCapex: ApiOtherCapexEconFunction;
	drillingCost: ApiDrillingCostEconFunction;
	completionCost: ApiCompletionCostEconFunction;
} => ({
	otherCapex: {
		rows: [
			{
				category: 'other_investment',
				description: 'R Api Desc',
				tangible: 5,
				intangible: 10,
				capexExpense: 'capex',
				afterEconLimit: true,
				calculation: 'gross',
				escalationModel: 'none',
				escalationStart: {
					fpd: 10,
				},
				depreciationModel: 'none',
				dealTerms: 1,
				offsetToFpd: -120,
			},
		],
	},
	drillingCost: {
		dollarPerFtOfVertical: 25,
		dollarPerFtOfHorizontal: 1,
		fixedCost: 88,
		tangiblePct: 26,
		calculation: 'net',
		escalationModel: '642f2f56670d176d8558ef7b',
		depreciationModel: '643c2c55ecea760012942188',
		dealTerms: 445,
		rows: [
			{
				pctOfTotalCost: 25,
				scheduleEnd: 10,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 20,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 30,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 40,
			},
		],
	},
	completionCost: {
		dollarPerFtOfVertical: 32,
		dollarPerFtOfHorizontal: [
			{
				propLl: 222,
				unitCost: 14,
			},
			{
				propLl: 77,
				unitCost: 15,
			},
		],
		fixedCost: 225,
		tangiblePct: 80,
		calculation: 'net',
		escalationModel: '62fbcecfcab9dfc5b88427c4',
		depreciationModel: '643c83a9caa3710012596294',
		dealTerms: 3,
		rows: [
			{
				pctOfTotalCost: 50,
				offsetToAsOf: 10,
			},
			{
				pctOfTotalCost: 50,
				offsetToAsOf: 100,
			},
		],
	},
});

const getCapexArrayWithPayload = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		...getValidCapexModel(),
	}));

const getCreatedStatus = ({ name }: ApiCapex) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiCapex) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/Capex/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getCapexHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/Capex';

		res.locals = {
			service: {
				getCapexCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getCapexHead, READ_RECORD_LIMIT);
	});

	it('getCapexHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/Capex`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getCapexCount = jest.fn(() => count);

		res.locals = {
			service: {
				getCapexCount: getCapexCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getCapexHead(req, res);
		expect(getCapexCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getCapexHead(req, res);
		expect(getCapexCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getCapexHead(req, res);
		expect(getCapexCount).toHaveBeenLastCalledWith({}, project);
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
		await getCapexHead(req, res);
		expect(getCapexCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getCapexHead(req, res);
		expect(getCapexCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getCapexCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getCapexHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getCapexCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getCapex throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/Capex`;

		res.locals = {
			service: {
				getCapex: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getCapex, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getCapex(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getCapex(req, res)).rejects.toThrow(ValidationError);
	});

	it('getCapex runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/Capex`;

		req.originalUrl = originalUrl;

		let result: ApiCapex[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getCapex: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getCapexArray(3);
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getCapexArray(3));

		result = getCapexArray(25);
		hasNext = true;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getCapexArray(25));

		req.query = { skip: '25' };
		result = getCapexArray(25);
		hasNext = true;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getCapexArray(25));

		req.query = { skip: '30', take: '10' };
		result = getCapexArray(5);
		hasNext = false;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getCapexArray(5);
		hasNext = false;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
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
		result = getCapexArray(5);
		hasNext = false;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
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
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getCapexArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getCapexArray(15);
		hasNext = true;
		cursor = null;
		await getCapex(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
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

	it('getCapexById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getCapexById(req, res)).rejects.toThrow(CapexNotFoundError);
	});

	it('postCapex causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (Capex: Array<ICapex | undefined>) => ({
					results: Capex.map((r) => r && getCreatedStatus(toCapex(r, project._id))),
				}),
				checkWells: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				checkScenarios: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postCapex(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postCapex(req, res);
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
						message: 'Missing required field: `otherCapex`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postCapex(req, res);
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
						message: 'Missing required field: `otherCapex`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getCapexArrayWithPayload(1, { name, unique: false }),
			...getCapexArrayWithPayload(1, { name, unique: false }),
		];
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateCapexError.name,
					`More than one Capex model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateCapexError.name,
					`More than one Capex model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getCapexArrayWithPayload(1, { name, unique: false });
		names = [name];
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					CapexCollisionError.name,
					`Capex model with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postCapex runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((Capex: Array<ICapex | undefined>) => ({
			results: Capex.map((r) => r && getCreatedStatus(toCapex(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				checkScenarios: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getCapexArrayWithPayload(1, { name, unique: false })[0] };
		const dataApi = {
			...getCapexArrayWithPayload(1, { name, unique: false })[0],
		} as ApiCapex;
		req.body = data;
		await postCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getCapexArrayWithPayload(10, { unique: false });
		await postCapex(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getCapexArrayWithPayload(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putCapex causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (Capex: Array<ICapex | undefined>) => ({
					results: Capex.map((r) => r && getOkStatus(toCapex(r, project._id))),
				}),
				checkWells: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				checkScenarios: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Capex model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putCapex(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putCapex(req, res);
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
						message: 'Missing required field: `otherCapex`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putCapex(req, res);
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
						message: 'Missing required field: `otherCapex`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getCapexArrayWithPayload(1, { name, unique: false }),
			...getCapexArrayWithPayload(1, { name, unique: false }),
		];
		await putCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateCapexError.name,
					`More than one Capex model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateCapexError.name,
					`More than one Capex model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putCapex runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((Capex: Array<ICapex | undefined>) => ({
			results: Capex.map((r) => r && getOkStatus(toCapex(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
				checkScenarios: jest.fn((Capex: Array<ICapex | undefined>) => Capex),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getCapexArrayWithPayload(1, { unique: false })[0] };
		const dataApi = {
			...getCapexArrayWithPayload(1, { unique: false })[0],
		} as ApiCapex;
		req.body = data;
		await putCapex(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getCapexArrayWithPayload(10, { unique: false });
		await putCapex(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getCapexArrayWithPayload(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
