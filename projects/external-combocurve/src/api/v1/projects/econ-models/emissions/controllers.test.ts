import { cloneDeep } from 'lodash';
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
import { IEmission } from '@src/models/econ/emissions';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiEmission, READ_RECORD_LIMIT, toEmission, WRITE_RECORD_LIMIT } from './fields/emission';
import { DuplicateEmissionError, EmissionCollisionError, EmissionNotFoundError } from './validation';
import { getEmissionById, getEmissions, getEmissionsHead, postEmissions, putEmissions } from './controllers';
import { ApiEmissionEconFunction } from './fields/emission-econ-function';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const defaultEmission: ApiEmissionEconFunction = {
	rows: [
		{
			selected: true,
			category: 'associated_gas',
			co2e: 1,
			co2: 0,
			ch4: 0,
			n2o: 0,
			unit: 'mt_per_mbbl',
			escalationModel: 'none',
		},
	],
};

const getEmissionArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique,
		emissions: cloneDeep(defaultEmission),
	}));

const getCreatedStatus = ({ name }: ApiEmission) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiEmission) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/emissions/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getEmissionsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/emissions';

		res.locals = {
			service: {
				getEmissionsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEmissionsHead, READ_RECORD_LIMIT);
	});

	it('getEmissionsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/emissions`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getEmissionsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getEmissionsCount: getEmissionsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getEmissionsHead(req, res);
		expect(getEmissionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getEmissionsHead(req, res);
		expect(getEmissionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getEmissionsHead(req, res);
		expect(getEmissionsCount).toHaveBeenLastCalledWith({}, project);
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
		await getEmissionsHead(req, res);
		expect(getEmissionsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getEmissionsHead(req, res);
		expect(getEmissionsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getEmissionsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getEmissionsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getEmissionsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getEmissions throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/emissions`;

		res.locals = {
			service: {
				getEmissions: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEmissions, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getEmissions(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getEmissions(req, res)).rejects.toThrow(ValidationError);
	});

	it('getEmissions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/emissions`;

		req.originalUrl = originalUrl;

		let result: ApiEmission[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEmission = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getEmissions: serviceEmission,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getEmissionArray(3);
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEmissionArray(3));

		result = getEmissionArray(25);
		hasNext = true;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEmissionArray(25));

		req.query = { skip: '25' };
		result = getEmissionArray(25);
		hasNext = true;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEmissionArray(25));

		req.query = { skip: '30', take: '10' };
		result = getEmissionArray(5);
		hasNext = false;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getEmissionArray(5);
		hasNext = false;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(
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
		result = getEmissionArray(5);
		hasNext = false;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(
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
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getEmissionArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getEmissionArray(15);
		hasNext = true;
		cursor = null;
		await getEmissions(req, res);
		expect(serviceEmission).toHaveBeenLastCalledWith(
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

	it('getEmissionById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getEmissionById(req, res)).rejects.toThrow(EmissionNotFoundError);
	});

	it('postEmissions causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (emissions: Array<IEmission | undefined>) => ({
					results: emissions.map((r) => r && getCreatedStatus(toEmission(r, project._id))),
				}),
				checkWells: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				checkScenarios: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postEmissions(req, res)).rejects.toThrow(RecordCountError);

		req.body = [...getEmissionArray(1, { unique: false })];
		req.body[0].a = 'b';
		await postEmissions(req, res);
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

		req.body = [...getEmissionArray(1)];
		req.body[0].name = undefined;
		req.body[0].unique = undefined;
		await postEmissions(req, res);
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
		req.body = [...getEmissionArray(1, { name, unique: false }), ...getEmissionArray(1, { name, unique: false })];
		await postEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateEmissionError.name,
					`More than one Emission model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateEmissionError.name,
					`More than one Emission model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getEmissionArray(1, { name, unique: false });
		names = [name];
		await postEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					EmissionCollisionError.name,
					`Emission Model with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postEmissions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((emissions: Array<IEmission | undefined>) => ({
			results: emissions.map((r) => r && getCreatedStatus(toEmission(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				checkScenarios: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getEmissionArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getEmissionArray(1, { name, unique: false })[0],
		} as ApiEmission;
		req.body = data;
		await postEmissions(req, res);
		expect(create).toHaveBeenLastCalledWith([toEmission(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getEmissionArray(10, { unique: false });
		await postEmissions(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getEmissionArray(10, { unique: false }).map((r) => toEmission(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getEmissionArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putEmissions causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (emissions: Array<IEmission | undefined>) => ({
					results: emissions.map((r) => r && getOkStatus(toEmission(r, project._id))),
				}),
				checkWells: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				checkScenarios: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Emission model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putEmissions(req, res)).rejects.toThrow(RecordCountError);

		req.body = [...getEmissionArray(1)];
		await putEmissions(req, res);
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

		req.body = [...getEmissionArray(1, { unique: false })];
		req.body[0].a = 'b';
		await putEmissions(req, res);
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

		req.body = [...getEmissionArray(1)];
		req.body[0].name = undefined;
		req.body[0].unique = undefined;
		await putEmissions(req, res);
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
		req.body = [...getEmissionArray(1, { name, unique: false }), ...getEmissionArray(1, { name, unique: false })];
		await putEmissions(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateEmissionError.name,
					`More than one Emission model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateEmissionError.name,
					`More than one Emission model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putEmissions runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((emissions: Array<IEmission | undefined>) => ({
			results: emissions.map((r) => r && getOkStatus(toEmission(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
				checkScenarios: jest.fn((emissions: Array<IEmission | undefined>) => emissions),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getEmissionArray(1, { unique: false })[0] };
		const dataApi = {
			...getEmissionArray(1, { unique: false })[0],
		} as ApiEmission;
		req.body = data;
		await putEmissions(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toEmission(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getEmissionArray(10, { unique: false });
		await putEmissions(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getEmissionArray(10, { unique: false }).map((r) => toEmission(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getEmissionArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
