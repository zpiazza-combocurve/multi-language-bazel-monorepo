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
import { IFluidModel } from '@src/models/econ/fluid-model';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiFluidModel, READ_RECORD_LIMIT, toFluidModel, WRITE_RECORD_LIMIT } from './fields/fluid-model';
import { DuplicateFluidModelError, FluidModelCollisionError, FluidModelNotFoundError } from './validation';
import { getFluidModelById, getFluidModels, getFluidModelsHead, postFluidModels, putFluidModels } from './controllers';
import { ApiFluidModelEconFunction } from './fields/fluid-model-econ-function';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const defaultFluidModel: ApiFluidModelEconFunction = {
	oil: {
		composition: {
			N2: {
				percentage: 100,
			},
			CO2: {
				percentage: 2,
			},
			C1: {
				percentage: 3,
			},
			C2: {
				percentage: 4,
			},
			C3: {
				percentage: 5,
			},
			iC4: {
				percentage: 6,
			},
			nC4: {
				percentage: 7,
			},
			iC5: {
				percentage: 8,
			},
			nC5: {
				percentage: 9,
			},
			iC6: {
				percentage: 10,
			},
			nC6: {
				percentage: 11,
			},
			C7: {
				percentage: 12,
			},
			C8: {
				percentage: 13,
			},
			C9: {
				percentage: 14,
			},
			C10Plus: {
				percentage: 15,
			},
			H2S: {
				percentage: 16,
			},
			H2: {
				percentage: 17,
			},
			H2O: {
				percentage: 18,
			},
			He: {
				percentage: 19,
			},
			O2: {
				percentage: 20,
			},
		},
		criteria: 'flat',
	},
	gas: {
		composition: {
			N2: {
				percentage: 0,
			},
			CO2: {
				percentage: 0,
			},
			C1: {
				percentage: 0,
			},
			C2: {
				percentage: 0,
			},
			C3: {
				percentage: 0,
			},
			iC4: {
				percentage: 0,
			},
			nC4: {
				percentage: 0,
			},
			iC5: {
				percentage: 0,
			},
			nC5: {
				percentage: 0,
			},
			iC6: {
				percentage: 0,
			},
			nC6: {
				percentage: 0,
			},
			C7: {
				percentage: 0,
			},
			C8: {
				percentage: 0,
			},
			C9: {
				percentage: 0,
			},
			C10Plus: {
				percentage: 0,
			},
			H2S: {
				percentage: 0,
			},
			H2: {
				percentage: 0,
			},
			H2O: {
				percentage: 0,
			},
			He: {
				percentage: 0,
			},
			O2: {
				percentage: 0,
			},
		},
		criteria: 'flat',
	},
	water: {
		composition: {
			N2: {
				percentage: 0,
			},
			CO2: {
				percentage: 0,
			},
			C1: {
				percentage: 0,
			},
			C2: {
				percentage: 0,
			},
			C3: {
				percentage: 0,
			},
			iC4: {
				percentage: 0,
			},
			nC4: {
				percentage: 0,
			},
			iC5: {
				percentage: 0,
			},
			nC5: {
				percentage: 0,
			},
			iC6: {
				percentage: 0,
			},
			nC6: {
				percentage: 0,
			},
			C7: {
				percentage: 0,
			},
			C8: {
				percentage: 0,
			},
			C9: {
				percentage: 0,
			},
			C10Plus: {
				percentage: 0,
			},
			H2S: {
				percentage: 0,
			},
			H2: {
				percentage: 0,
			},
			H2O: {
				percentage: 0,
			},
			He: {
				percentage: 0,
			},
			O2: {
				percentage: 0,
			},
		},
		criteria: 'flat',
	},
	ngl: {
		composition: {
			N2: {
				percentage: 0,
			},
			CO2: {
				percentage: 0,
			},
			C1: {
				percentage: 0,
			},
			C2: {
				percentage: 0,
			},
			C3: {
				percentage: 0,
			},
			iC4: {
				percentage: 0,
			},
			nC4: {
				percentage: 0,
			},
			iC5: {
				percentage: 0,
			},
			nC5: {
				percentage: 0,
			},
			iC6: {
				percentage: 0,
			},
			nC6: {
				percentage: 0,
			},
			C7: {
				percentage: 0,
			},
			C8: {
				percentage: 0,
			},
			C9: {
				percentage: 0,
			},
			C10Plus: {
				percentage: 0,
			},
			H2S: {
				percentage: 0,
			},
			H2: {
				percentage: 0,
			},
			H2O: {
				percentage: 0,
			},
			He: {
				percentage: 0,
			},
			O2: {
				percentage: 0,
			},
		},
		criteria: 'flat',
	},
	dripCondensate: {
		composition: {
			N2: {
				percentage: 0,
			},
			CO2: {
				percentage: 0,
			},
			C1: {
				percentage: 0,
			},
			C2: {
				percentage: 0,
			},
			C3: {
				percentage: 0,
			},
			iC4: {
				percentage: 0,
			},
			nC4: {
				percentage: 0,
			},
			iC5: {
				percentage: 0,
			},
			nC5: {
				percentage: 0,
			},
			iC6: {
				percentage: 0,
			},
			nC6: {
				percentage: 0,
			},
			C7: {
				percentage: 0,
			},
			C8: {
				percentage: 0,
			},
			C9: {
				percentage: 0,
			},
			C10Plus: {
				percentage: 99,
			},
			H2S: {
				percentage: 0,
			},
			H2: {
				percentage: 0,
			},
			H2O: {
				percentage: 0,
			},
			He: {
				percentage: 0,
			},
			O2: {
				percentage: 0,
			},
		},
		criteria: 'flat',
	},
};

const getFluidModelArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique,
		fluidModel: cloneDeep(defaultFluidModel),
	}));

const getCreatedStatus = ({ name }: ApiFluidModel) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiFluidModel) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/fluid-models/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getFluidModelsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/fluid-models';

		res.locals = {
			service: {
				getFluidModelsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getFluidModelsHead, READ_RECORD_LIMIT);
	});

	it('getFluidModelsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/fluid-models`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getFluidModelsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getFluidModelsCount: getFluidModelsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getFluidModelsHead(req, res);
		expect(getFluidModelsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getFluidModelsHead(req, res);
		expect(getFluidModelsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getFluidModelsHead(req, res);
		expect(getFluidModelsCount).toHaveBeenLastCalledWith({}, project);
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
		await getFluidModelsHead(req, res);
		expect(getFluidModelsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getFluidModelsHead(req, res);
		expect(getFluidModelsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getFluidModelsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getFluidModelsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getFluidModelsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getFluidModels throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/fluid-models`;

		res.locals = {
			service: {
				getFluidModels: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getFluidModels, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getFluidModels(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getFluidModels(req, res)).rejects.toThrow(ValidationError);
	});

	it('getFluidModels runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/fluid-models`;

		req.originalUrl = originalUrl;

		let result: ApiFluidModel[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceFluidModel = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getFluidModels: serviceFluidModel,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getFluidModelArray(3);
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getFluidModelArray(3));

		result = getFluidModelArray(25);
		hasNext = true;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getFluidModelArray(25));

		req.query = { skip: '25' };
		result = getFluidModelArray(25);
		hasNext = true;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getFluidModelArray(25));

		req.query = { skip: '30', take: '10' };
		result = getFluidModelArray(5);
		hasNext = false;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getFluidModelArray(5);
		hasNext = false;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(
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
		result = getFluidModelArray(5);
		hasNext = false;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(
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
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getFluidModelArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getFluidModelArray(15);
		hasNext = true;
		cursor = null;
		await getFluidModels(req, res);
		expect(serviceFluidModel).toHaveBeenLastCalledWith(
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

	it('getFluidModelById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getFluidModelById(req, res)).rejects.toThrow(FluidModelNotFoundError);
	});

	it('postFluidModels causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (fluidModels: Array<IFluidModel | undefined>) => ({
					results: fluidModels.map((r) => r && getCreatedStatus(toFluidModel(r, project._id))),
				}),
				checkWells: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				checkScenarios: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postFluidModels(req, res)).rejects.toThrow(RecordCountError);

		req.body = [...getFluidModelArray(1, { unique: false })];
		req.body[0].a = 'b';
		await postFluidModels(req, res);
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

		req.body = [...getFluidModelArray(1)];
		req.body[0].name = undefined;
		req.body[0].unique = undefined;
		await postFluidModels(req, res);
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
			...getFluidModelArray(1, { name, unique: false }),
			...getFluidModelArray(1, { name, unique: false }),
		];
		await postFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateFluidModelError.name,
					`More than one fluidModel model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateFluidModelError.name,
					`More than one fluidModel model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getFluidModelArray(1, { name, unique: false });
		names = [name];
		await postFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					FluidModelCollisionError.name,
					`Fluid Model with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postFluidModels runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((fluidModels: Array<IFluidModel | undefined>) => ({
			results: fluidModels.map((r) => r && getCreatedStatus(toFluidModel(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				checkScenarios: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getFluidModelArray(1, { name, unique: false })[0] };
		const dataApi = {
			...getFluidModelArray(1, { name, unique: false })[0],
		} as ApiFluidModel;
		req.body = data;
		await postFluidModels(req, res);
		expect(create).toHaveBeenLastCalledWith([toFluidModel(dataApi, project._id)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getFluidModelArray(10, { unique: false });
		await postFluidModels(req, res);
		expect(create).toHaveBeenLastCalledWith(
			getFluidModelArray(10, { unique: false }).map((r) => toFluidModel(r, project._id)),
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getFluidModelArray(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putFluidModels causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (fluidModels: Array<IFluidModel | undefined>) => ({
					results: fluidModels.map((r) => r && getOkStatus(toFluidModel(r, project._id))),
				}),
				checkWells: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				checkScenarios: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid fluid model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putFluidModels(req, res)).rejects.toThrow(RecordCountError);

		req.body = [...getFluidModelArray(1)];
		await putFluidModels(req, res);
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

		req.body = [...getFluidModelArray(1, { unique: false })];
		req.body[0].a = 'b';
		await putFluidModels(req, res);
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

		req.body = [...getFluidModelArray(1)];
		req.body[0].name = undefined;
		req.body[0].unique = undefined;
		await putFluidModels(req, res);
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
			...getFluidModelArray(1, { name, unique: false }),
			...getFluidModelArray(1, { name, unique: false }),
		];
		await putFluidModels(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateFluidModelError.name,
					`More than one fluidModel model data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateFluidModelError.name,
					`More than one fluidModel model data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putFluidModels runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((fluidModels: Array<IFluidModel | undefined>) => ({
			results: fluidModels.map((r) => r && getOkStatus(toFluidModel(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
				checkScenarios: jest.fn((fluidModels: Array<IFluidModel | undefined>) => fluidModels),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getFluidModelArray(1, { unique: false })[0] };
		const dataApi = {
			...getFluidModelArray(1, { unique: false })[0],
		} as ApiFluidModel;
		req.body = data;
		await putFluidModels(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toFluidModel(dataApi, project._id)], project._id);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getFluidModelArray(10, { unique: false });
		await putFluidModels(req, res);
		expect(upsert).toHaveBeenLastCalledWith(
			getFluidModelArray(10, { unique: false }).map((r) => toFluidModel(r, project._id)),
			project._id,
		);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getFluidModelArray(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
