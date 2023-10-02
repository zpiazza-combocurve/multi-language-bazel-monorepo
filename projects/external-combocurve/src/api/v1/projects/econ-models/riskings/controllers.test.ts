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
import { IRisking } from '@src/models/econ/riskings';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiRisking, READ_RECORD_LIMIT, toRisking, WRITE_RECORD_LIMIT } from './fields/risking';
import { DuplicateRiskingError, RiskingCollisionError, RiskingNotFoundError } from './validation';
import { getRiskingById, getRiskings, getRiskingsHead, postRiskings, putRiskings } from './controllers';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getRiskingArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		risking: {
			riskProd: true,
			riskNglDripCondViaGasRisk: true,
			oil: {
				rows: [
					{
						multiplier: 100,
						entireWellLife: 'Flat',
					},
				],
			},
			gas: {
				rows: [
					{
						multiplier: 100,
						entireWellLife: 'Flat',
					},
				],
			},
			ngl: {
				rows: [
					{
						multiplier: 100,
						entireWellLife: 'Flat',
					},
				],
			},
			dripCondensate: {
				rows: [
					{
						multiplier: 100,
						entireWellLife: 'Flat',
					},
				],
			},
			water: {
				rows: [
					{
						multiplier: 100,
						entireWellLife: 'Flat',
					},
				],
			},
		},
		shutIn: {
			rows: [
				{
					phase: 'all',
					dates: {
						startDate: '2023-04-01',
						endDate: '2023-04-11',
					},
					repeatRangeOfDates: 'no_repeat',
					totalOccurrences: 1,
					unit: 'day',
					multiplier: 1,
					scalePostShutInEndCriteria: 'dates',
					scalePostShutInEnd: '2023-04-12',
					fixedExpense: true,
					capex: true,
				},
			],
		},
	}));

const getCreatedStatus = ({ name }: ApiRisking) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiRisking) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/riskings/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getRiskingsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/riskings';

		res.locals = {
			service: {
				getRiskingsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getRiskingsHead, READ_RECORD_LIMIT);
	});

	it('getRiskingsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/riskings`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getRiskingsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getRiskingsCount: getRiskingsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getRiskingsHead(req, res);
		expect(getRiskingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getRiskingsHead(req, res);
		expect(getRiskingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getRiskingsHead(req, res);
		expect(getRiskingsCount).toHaveBeenLastCalledWith({}, project);
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
		await getRiskingsHead(req, res);
		expect(getRiskingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getRiskingsHead(req, res);
		expect(getRiskingsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getRiskingsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getRiskingsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getRiskingsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getRiskings throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/riskings`;

		res.locals = {
			service: {
				getRiskings: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getRiskings, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getRiskings(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getRiskings(req, res)).rejects.toThrow(ValidationError);
	});

	it('getRiskings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/riskings`;

		req.originalUrl = originalUrl;

		let result: ApiRisking[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceRisking = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getRiskings: serviceRisking,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getRiskingArray(3);
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getRiskingArray(3));

		result = getRiskingArray(25);
		hasNext = true;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getRiskingArray(25));

		req.query = { skip: '25' };
		result = getRiskingArray(25);
		hasNext = true;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getRiskingArray(25));

		req.query = { skip: '30', take: '10' };
		result = getRiskingArray(5);
		hasNext = false;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getRiskingArray(5);
		hasNext = false;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { name: ['default1'] }, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
		result = getRiskingArray(5);
		hasNext = false;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(
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
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getRiskingArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getRiskingArray(15);
		hasNext = true;
		cursor = null;
		await getRiskings(req, res);
		expect(serviceRisking).toHaveBeenLastCalledWith(0, 10, { name: 1 }, { name: ['default1'] }, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	it('getRiskingById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getRiskingById(req, res)).rejects.toThrow(RiskingNotFoundError);
	});

	it('postRiskings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (riskings: Array<IRisking | undefined>) => ({
					results: riskings.map((r) => r && getCreatedStatus(toRisking(r, project._id))),
				}),
				checkWells: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				checkScenarios: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postRiskings(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postRiskings(req, res);
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
						message: 'Missing required field: `risking`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `shutIn`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postRiskings(req, res);
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
						message: 'Missing required field: `risking`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `shutIn`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [...getRiskingArray(1, { name, unique: false }), ...getRiskingArray(1, { name, unique: false })];
		await postRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateRiskingError.name,
					`More than one risking model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateRiskingError.name,
					`More than one risking model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getRiskingArray(1, { name, unique: false });
		names = [name];
		await postRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					RiskingCollisionError.name,
					`Risking with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postRiskings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((riskings: Array<IRisking | undefined>) => ({
			results: riskings.map((r) => r && getCreatedStatus(toRisking(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				checkScenarios: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getRiskingArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getRiskingArray(1, { name, unique: false })[0],
		} as ApiRisking;
		req.body = data;
		await postRiskings(req, res);
		expect(create).toHaveBeenLastCalledWith([toRisking(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getRiskingArray(10, { unique: false });
		await postRiskings(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getRiskingArray(10, { unique: false }).map((r) => toRisking(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getRiskingArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putRiskings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (riskings: Array<IRisking | undefined>) => ({
					results: riskings.map((r) => r && getOkStatus(toRisking(r, project._id))),
				}),
				checkWells: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				checkScenarios: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid risking model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putRiskings(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putRiskings(req, res);
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
						message: 'Missing required field: `risking`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `shutIn`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putRiskings(req, res);
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
						message: 'Missing required field: `risking`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `shutIn`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [...getRiskingArray(1, { name, unique: false }), ...getRiskingArray(1, { name, unique: false })];
		await putRiskings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateRiskingError.name,
					`More than one risking model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateRiskingError.name,
					`More than one risking model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putRiskings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((riskings: Array<IRisking | undefined>) => ({
			results: riskings.map((r) => r && getOkStatus(toRisking(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
				checkScenarios: jest.fn((riskings: Array<IRisking | undefined>) => riskings),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getRiskingArray(1, { unique: false })[0] };
		const dataApi = {
			...getRiskingArray(1, { unique: false })[0],
		} as ApiRisking;
		req.body = data;
		await putRiskings(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toRisking(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getRiskingArray(10, { unique: false });
		await putRiskings(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getRiskingArray(10, { unique: false }).map((r) => toRisking(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getRiskingArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
