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
import { IPricing } from '@src/models/econ/pricing';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiPricing, READ_RECORD_LIMIT, toPricing, WRITE_RECORD_LIMIT } from './fields/pricing';
import { DuplicatePricingError, PricingCollisionError, PricingNotFoundError } from './validation';
import { getPricingById, getPricingHead, getPricings, postPricings, putPricings } from './controllers';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getEscalationArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidPricingModel = () => ({
	oil: {
		cap: 89,
		escalationModel: 'none',
		rows: [
			{
				entireWellLife: 'Flat',
				price: 10000000,
			},
		],
	},
	gas: {
		cap: 89,
		escalationModel: 'none',
		rows: [
			{
				dollarPerMmbtu: 0,
				entireWellLife: 'Flat',
			},
		],
	},
	ngl: {
		cap: 89,
		escalationModel: 'none',
		rows: [
			{
				pctOfOilPrice: 100,
				entireWellLife: 'Flat',
			},
		],
	},
	dripCondensate: {
		cap: 78,
		escalationModel: 'none',
		rows: [
			{
				entireWellLife: 'Flat',
				dollarPerBbl: 0,
			},
		],
	},
});

const getPricingArrayWithPayload = (
	n = 1,
	{ name, unique, priceModel }: { name?: string; unique?: boolean; priceModel?: Record<string, unknown> } = {},
) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		priceModel: priceModel ?? getValidPricingModel(),
	}));

const getCreatedStatus = ({ name }: ApiPricing) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiPricing) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/pricing/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getPricingHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/escalations';

		res.locals = {
			service: {
				getPricingsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getPricingHead, READ_RECORD_LIMIT);
	});

	it('getPricingHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/pricing`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getPricingsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getPricingsCount: getPricingsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getPricingHead(req, res);
		expect(getPricingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getPricingHead(req, res);
		expect(getPricingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getPricingHead(req, res);
		expect(getPricingsCount).toHaveBeenLastCalledWith({}, project);
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
		await getPricingHead(req, res);
		expect(getPricingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getPricingHead(req, res);
		expect(getPricingsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getPricingsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getPricingHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getPricingsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getPricings throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/pricing`;

		res.locals = {
			service: {
				getPricings: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getPricings, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getPricings(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getPricings(req, res)).rejects.toThrow(ValidationError);
	});

	it('getPricings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/pricing`;

		req.originalUrl = originalUrl;

		let result: ApiPricing[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getPricings: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getPricings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getEscalationArray(3);
		await getPricings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEscalationArray(3));

		result = getEscalationArray(25);
		hasNext = true;
		await getPricings(req, res);
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
		await getPricings(req, res);
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
		await getPricings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getEscalationArray(5);
		hasNext = false;
		await getPricings(req, res);
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
		await getPricings(req, res);
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
		await getPricings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getEscalationArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getPricings(req, res);
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
		await getPricings(req, res);
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

	it('getPricingById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getPricingById(req, res)).rejects.toThrow(PricingNotFoundError);
	});

	it('postPricings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (pricing: Array<IPricing | undefined>) => ({
					results: pricing.map((r) => r && getCreatedStatus(toPricing(r, project._id))),
				}),
				checkWells: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				checkScenarios: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postPricings(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test' };
		req.body = { name: 'test' };
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `priceModel`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postPricings(req, res);
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
						message: 'Missing required field: `priceModel`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() }),
			...getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() }),
		];
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicatePricingError.name,
					`More than one Pricing data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicatePricingError.name,
					`More than one Pricing data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() });
		names = [name];
		await postPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					PricingCollisionError.name,
					`Pricing with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postPricings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((pricing: Array<IPricing | undefined>) => ({
			results: pricing.map((r) => r && getCreatedStatus(toPricing(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				checkScenarios: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = {
			...getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() })[0],
		};
		const dataApi = {
			...getPricingArrayWithPayload(1, { name, unique: false })[0],
		} as ApiPricing;
		req.body = data;
		await postPricings(req, res);
		const toPRicingObj = toPricing(dataApi, project._id);
		expect(create).toHaveBeenLastCalledWith([toPRicingObj]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() });
		await postPricings(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() }).map((r) =>
				toPricing(r, project._id),
			),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getPricingArrayWithPayload(1).map(getCreatedStatus),
			successCount: 1,
			failedCount: 0,
		});
	});

	it('putPricings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (pricing: Array<IPricing | undefined>) => ({
					results: pricing.map((r) => r && getOkStatus(toPricing(r, project._id))),
				}),
				checkWells: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				checkScenarios: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Pricing model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putPricings(req, res)).rejects.toThrow(RecordCountError);
		req.body = { name: 'test', a: 'b' };
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: FieldNameError.name,
						message: '`a` is not a valid field name',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `priceModel`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putPricings(req, res);
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
						message: 'Missing required field: `priceModel`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [
			...getPricingArrayWithPayload(1, { name: 'test', unique: false, priceModel: getValidPricingModel() }),
		];
		req.body[0].a = 'test';
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(FieldNameError.name, `\`a\` is not a valid field name`, '[0]')],

			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() }),
			...getPricingArrayWithPayload(1, { name, unique: false, priceModel: getValidPricingModel() }),
		];
		await putPricings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicatePricingError.name,
					`More than one Pricing data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicatePricingError.name,
					`More than one Pricing data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putPricings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((pricing: Array<IPricing | undefined>) => ({
			results: pricing.map((r) => r && getOkStatus(toPricing(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
				checkScenarios: jest.fn((pricing: Array<IPricing | undefined>) => pricing),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = {
			...getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() })[0],
		};
		const dataApi = {
			...getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() })[0],
		} as ApiPricing;
		req.body = data;
		await putPricings(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toPricing(data, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() });
		await putPricings(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getPricingArrayWithPayload(1, { unique: false, priceModel: getValidPricingModel() }).map((r) =>
				toPricing(r, project._id),
			),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getPricingArrayWithPayload(1).map(getOkStatus),
			successCount: 1,
			failedCount: 0,
		});
	});
});
