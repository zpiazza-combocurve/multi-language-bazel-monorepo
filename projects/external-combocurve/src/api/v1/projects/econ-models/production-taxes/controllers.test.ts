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
import { IProductionTaxes } from '@src/models/econ/production-taxes';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ApiProductionTaxes,
	READ_RECORD_LIMIT,
	toProductionTaxes,
	WRITE_RECORD_LIMIT,
} from './fields/production-taxes';
import {
	DuplicateProductionTaxesError,
	ProductionTaxesCollisionError,
	ProductionTaxesNotFoundError,
} from './validation';
import {
	getProductionTaxes,
	getProductionTaxesById,
	getProductionTaxesHead,
	postProductionTaxes,
	putProductionTaxes,
} from './controllers';
import { ApiAdValoremEconFunction } from './fields/production-taxes-advalorem-econ-function';
import { ApiSeveranceTaxEconFunction } from './fields/production-taxes-severance-tax-econ-function';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS, OK, CREATED } = StatusCodes;

const getProductionTaxesArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidProductionTaxesModel = (): {
	adValoremTax: ApiAdValoremEconFunction;
	severanceTax: ApiSeveranceTaxEconFunction;
} => ({
	adValoremTax: {
		deductSeveranceTax: false,
		shrinkageCondition: 'shrunk',
		calculation: 'nri',
		rateType: 'gross_well_head',
		rowsCalculationMethod: 'non_monotonic',
		escalationModel: {
			escalationModel1: 'none',
			escalationModel2: '62fbcecfcab9dfc5b88427cd',
		},
		rows: [
			{
				entireWellLife: 'Flat',
				pctOfRevenue: 0,
				dollarPerBoe: 0,
			},
		],
	},
	severanceTax: {
		state: 'alabama',
		shrinkageCondition: 'shrunk',
		calculation: 'nri',
		rateType: 'gross_well_head',
		rowsCalculationMethod: 'non_monotonic',
		oil: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427c4',
				escalationModel2: '62fbcecfcab9dfc5b88427c4',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		gas: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427cf',
				escalationModel2: '62fbcecfcab9dfc5b88427c4',
			},
			rows: [
				{
					dollarPerMcf: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		ngl: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427c4',
				escalationModel2: '62fbcecfcab9dfc5b88427cd',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		dripCondensate: {
			escalationModel: {
				escalationModel1: '642f2f56670d176d8558ef7b',
				escalationModel2: '642f2f56670d176d8558ef7b',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
	},
});

const getProductionTaxesArrayWithPayload = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		...getValidProductionTaxesModel(),
	}));

const getCreatedStatus = ({ name }: ApiProductionTaxes) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiProductionTaxes) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/production-taxes/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getProductionTaxesHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/production-taxes';

		res.locals = {
			service: {
				getProductionTaxesCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProductionTaxesHead, READ_RECORD_LIMIT);
	});

	it('getProductionTaxesHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/production-taxes`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getProductionTaxesCount = jest.fn(() => count);

		res.locals = {
			service: {
				getProductionTaxesCount: getProductionTaxesCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getProductionTaxesHead(req, res);
		expect(getProductionTaxesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getProductionTaxesHead(req, res);
		expect(getProductionTaxesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getProductionTaxesHead(req, res);
		expect(getProductionTaxesCount).toHaveBeenLastCalledWith({}, project);
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
		await getProductionTaxesHead(req, res);
		expect(getProductionTaxesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getProductionTaxesHead(req, res);
		expect(getProductionTaxesCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getProductionTaxesCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getProductionTaxesHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getProductionTaxesCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getProductionTaxes throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/production-taxes`;

		res.locals = {
			service: {
				getProductionTaxes: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProductionTaxes, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getProductionTaxes(req, res)).rejects.toThrow(ValidationError);
	});

	it('getProductionTaxes runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/production-taxes`;

		req.originalUrl = originalUrl;

		let result: ApiProductionTaxes[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getProductionTaxes: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getProductionTaxesArray(3);
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getProductionTaxesArray(3));

		result = getProductionTaxesArray(25);
		hasNext = true;
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getProductionTaxesArray(25));

		req.query = { skip: '25' };
		result = getProductionTaxesArray(25);
		hasNext = true;
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getProductionTaxesArray(25));

		req.query = { skip: '30', take: '10' };
		result = getProductionTaxesArray(5);
		hasNext = false;
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getProductionTaxesArray(5);
		hasNext = false;
		await getProductionTaxes(req, res);
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
		result = getProductionTaxesArray(5);
		hasNext = false;
		await getProductionTaxes(req, res);
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
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getProductionTaxesArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getProductionTaxes(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getProductionTaxesArray(15);
		hasNext = true;
		cursor = null;
		await getProductionTaxes(req, res);
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

	it('getProductionTaxesById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getProductionTaxesById(req, res)).rejects.toThrow(ProductionTaxesNotFoundError);
	});

	it('postProductionTaxes causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (productionTaxes: Array<IProductionTaxes | undefined>) => ({
					results: productionTaxes.map((r) => r && getCreatedStatus(toProductionTaxes(r, project._id))),
				}),
				checkWells: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				checkScenarios: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postProductionTaxes(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postProductionTaxes(req, res);
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
						message: 'Missing required field: `adValoremTax`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `severanceTax`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postProductionTaxes(req, res);
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
						message: 'Missing required field: `adValoremTax`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `severanceTax`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getProductionTaxesArrayWithPayload(1, { name, unique: false }),
			...getProductionTaxesArrayWithPayload(1, { name, unique: false }),
		];
		await postProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionTaxesError.name,
					`More than one ProductionTaxes data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionTaxesError.name,
					`More than one ProductionTaxes data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getProductionTaxesArrayWithPayload(1, { name, unique: false });
		names = [name];
		await postProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ProductionTaxesCollisionError.name,
					`ProductionTaxes with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postProductionTaxes runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => ({
			results: productionTaxes.map((r) => r && getCreatedStatus(toProductionTaxes(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				checkScenarios: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getProductionTaxesArrayWithPayload(1, { name, unique: false })[0] };
		const dataApi = {
			...getProductionTaxesArrayWithPayload(1, { name, unique: false })[0],
		} as ApiProductionTaxes;
		req.body = data;
		await postProductionTaxes(req, res);
		expect(create).toHaveBeenLastCalledWith([toProductionTaxes(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getProductionTaxesArrayWithPayload(10, { unique: false });
		await postProductionTaxes(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getProductionTaxesArrayWithPayload(10, { unique: false }).map((r) => toProductionTaxes(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getProductionTaxesArrayWithPayload(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putProductionTaxes causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (productionTaxes: Array<IProductionTaxes | undefined>) => ({
					results: productionTaxes.map((r) => r && getOkStatus(toProductionTaxes(r, project._id))),
				}),
				checkWells: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				checkScenarios: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid ProductionTaxes model data structure', '[0]'),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putProductionTaxes(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putProductionTaxes(req, res);
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
						message: 'Missing required field: `adValoremTax`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `severanceTax`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putProductionTaxes(req, res);
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
						message: 'Missing required field: `adValoremTax`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `severanceTax`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getProductionTaxesArrayWithPayload(1, { name, unique: false }),
			...getProductionTaxesArrayWithPayload(1, { name, unique: false }),
		];
		await putProductionTaxes(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionTaxesError.name,
					`More than one ProductionTaxes data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionTaxesError.name,
					`More than one ProductionTaxes data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putProductionTaxes runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => ({
			results: productionTaxes.map((r) => r && getOkStatus(toProductionTaxes(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
				checkScenarios: jest.fn((productionTaxes: Array<IProductionTaxes | undefined>) => productionTaxes),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getProductionTaxesArrayWithPayload(1, { unique: false })[0] };
		const dataApi = {
			...getProductionTaxesArrayWithPayload(1, { unique: false })[0],
		} as ApiProductionTaxes;
		req.body = data;
		await putProductionTaxes(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toProductionTaxes(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getProductionTaxesArrayWithPayload(10, { unique: false });
		await putProductionTaxes(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getProductionTaxesArrayWithPayload(10, { unique: false }).map((r) => toProductionTaxes(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getProductionTaxesArrayWithPayload(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
