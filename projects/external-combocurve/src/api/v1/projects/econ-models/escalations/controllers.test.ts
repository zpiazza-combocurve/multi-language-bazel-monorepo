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
import { IEscalation } from '@src/models/econ/escalations';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiEscalation, READ_RECORD_LIMIT, toEscalation, WRITE_RECORD_LIMIT } from './fields/escalations';
import { DuplicateEscalationError, EscalationCollisionError, EscalationNotFoundError } from './validation';
import { getEscalationById, getEscalations, getEscalationsHead, postEscalations, putEscalations } from './controllers';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getEscalationArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getCreatedStatus = ({ name }: ApiEscalation) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiEscalation) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/escalations/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getEscalationsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/escalations';

		res.locals = {
			service: {
				getEscalationsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEscalationsHead, READ_RECORD_LIMIT);
	});

	it('getEscalationsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/escalations`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getEscalationsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getEscalationsCount: getEscalationsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getEscalationsHead(req, res);
		expect(getEscalationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getEscalationsHead(req, res);
		expect(getEscalationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getEscalationsHead(req, res);
		expect(getEscalationsCount).toHaveBeenLastCalledWith({}, project);
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
		await getEscalationsHead(req, res);
		expect(getEscalationsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getEscalationsHead(req, res);
		expect(getEscalationsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getEscalationsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getEscalationsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getEscalationsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getEscalations throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/escalations`;

		res.locals = {
			service: {
				getEscalations: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEscalations, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getEscalations(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getEscalations(req, res)).rejects.toThrow(ValidationError);
	});

	it('getEscalations runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/escalations`;

		req.originalUrl = originalUrl;

		let result: ApiEscalation[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getEscalations: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getEscalationArray(3);
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEscalationArray(3));

		result = getEscalationArray(25);
		hasNext = true;
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEscalationArray(25));

		req.query = { skip: '25' };
		result = getEscalationArray(25);
		hasNext = true;
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEscalationArray(25));

		req.query = { skip: '30', take: '10' };
		result = getEscalationArray(5);
		hasNext = false;
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getEscalationArray(5);
		hasNext = false;
		await getEscalations(req, res);
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
		result = getEscalationArray(5);
		hasNext = false;
		await getEscalations(req, res);
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
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getEscalationArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getEscalations(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getEscalationArray(15);
		hasNext = true;
		cursor = null;
		await getEscalations(req, res);
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

	it('getEscalationById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getEscalationById(req, res)).rejects.toThrow(EscalationNotFoundError);
	});

	it('postEscalations causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (escalations: Array<IEscalation | undefined>) => ({
					results: escalations.map((r) => r && getCreatedStatus(toEscalation(r, project._id))),
				}),
				checkWells: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				checkScenarios: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postEscalations(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', unique: false, a: 'b' };
		await postEscalations(req, res);
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

		req.body = { name: 'test', unique: false, a: 'b' };
		await postEscalations(req, res);
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

		req.body = { name: 'test', unique: false, a: 'b' };
		await postEscalations(req, res);
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

		req.body = {};
		await postEscalations(req, res);
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
			...getEscalationArray(1, { name, unique: false }),
			...getEscalationArray(1, { name, unique: false }),
		];
		await postEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateEscalationError.name,
					`More than one escalation model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateEscalationError.name,
					`More than one escalation model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getEscalationArray(1, { name, unique: false });
		names = [name];
		await postEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					EscalationCollisionError.name,
					`Escalation with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postEscalations runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((escalations: Array<IEscalation | undefined>) => ({
			results: escalations.map((r) => r && getCreatedStatus(toEscalation(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				checkScenarios: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getEscalationArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getEscalationArray(1, { name, unique: false })[0],
		} as ApiEscalation;
		req.body = data;
		await postEscalations(req, res);
		expect(create).toHaveBeenLastCalledWith([toEscalation(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getEscalationArray(10, { unique: false });
		await postEscalations(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getEscalationArray(10, { unique: false }).map((r) => toEscalation(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getEscalationArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putEscalations causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (escalations: Array<IEscalation | undefined>) => ({
					results: escalations.map((r) => r && getOkStatus(toEscalation(r, project._id))),
				}),
				checkWells: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				checkScenarios: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid escalation model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putEscalations(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test' };
		req.body = { name: 'test' };
		await putEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
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

		req.body = { name: 'test', unique: false, a: 'b' };
		await putEscalations(req, res);
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

		req.body = {};
		await putEscalations(req, res);
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
			...getEscalationArray(1, { name, unique: false }),
			...getEscalationArray(1, { name, unique: false }),
		];
		await putEscalations(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateEscalationError.name,
					`More than one escalation model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateEscalationError.name,
					`More than one escalation model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putEscalations runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((escalations: Array<IEscalation | undefined>) => ({
			results: escalations.map((r) => r && getOkStatus(toEscalation(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
				checkScenarios: jest.fn((escalations: Array<IEscalation | undefined>) => escalations),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getEscalationArray(1, { unique: false })[0] };
		const dataApi = {
			...getEscalationArray(1, { unique: false })[0],
		} as ApiEscalation;
		req.body = data;
		await putEscalations(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toEscalation(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getEscalationArray(10, { unique: false });
		await putEscalations(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getEscalationArray(10, { unique: false }).map((r) => toEscalation(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getEscalationArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
