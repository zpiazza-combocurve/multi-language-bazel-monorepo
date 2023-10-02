import { Connection, Types } from 'mongoose';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { FLUID_MODEL_KEY, IFluidModel } from '@src/models/econ/fluid-model';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IRecordStatus } from '@src/api/v1/multi-status';

import { BaseProjectResolved } from '../../fields';

import { FluidModelService } from './service';
import { toApiFluidModel } from './fields/fluid-model';

import assumptions from '@test/fixtures/assumptions.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/request');

const assumptionKey = FLUID_MODEL_KEY;

let mongoUri: string;
let connection: Connection;
let service: FluidModelService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/econ-models/fluid-models/service', () => {
	beforeAll(async () => {
		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(await getMemoryMongoUri());
		context = new TestContext(info, connection) as ApiContextV1;
		service = new FluidModelService(context);

		await context.models.AssumptionModel.bulkWrite(
			assumptions.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});

	afterAll(async () => {
		await connection.close();
	});

	test('getFluidModels', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });

		await expect(service.getFluidModels(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter });
		await expect(service.getFluidModels(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getFluidModels(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getFluidModels(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ name: 'test1', assumptionKey, ...projectScopeFilter });
		await expect(service.getFluidModels(0, count + 1, {}, { name: ['test1'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ unique: true, assumptionKey, ...projectScopeFilter });
		await expect(service.getFluidModels(0, count + 1, {}, { unique: ['true'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getFluidModels(0, 1, { id: 1 }, { notFluidModelField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiFluidModel(r as IFluidModel)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getFluidModelsCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getFluidModelsCount({}, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			name: 'test1',
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getFluidModelsCount({ name: ['test1'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			unique: true,
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getFluidModelsCount({ unique: ['true'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getFluidModelsCount({ notForecastField: ['test'] }, project)).resolves.toBe(count);
	});

	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const fluidModels = (await context.models.AssumptionModel.findOne({
			_id: '6491f7b4592fda5dedc019eb',
			...projectScopeFilter,
		})) as IFluidModel;
		await expect(service.getById(Types.ObjectId('6491f7b4592fda5dedc019eb'), project)).resolves.toStrictEqual(
			toApiFluidModel(fluidModels),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	test('create', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272d39b78910dd2a1bd7d5') };
		projectScopeFilter = { project: project._id };

		let result = await service.create([]);
		expect(result).toStrictEqual({ results: [] });

		let fluidModels = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let creates: Array<IFluidModel | undefined> = fluidModels.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IFluidModel,
		);

		result = await service.create(creates);

		expect(result).toStrictEqual({
			results: fluidModels.map(({ name }) => ({
				status: 'Created',
				code: CREATED,
				name,
			})),
		});

		fluidModels = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		creates = fluidModels.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IFluidModel,
		);
		creates.splice(-1, 0, undefined);

		result = await service.create(creates);

		const expectResults: Array<IRecordStatus | undefined> = fluidModels.map(({ name }) => ({
			status: 'Created',
			code: CREATED,
			name,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('upsert', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272d39b78910dd2a1bd7d5') };
		projectScopeFilter = { project: project._id };

		let result = await service.upsert([], project._id);
		expect(result).toStrictEqual({ results: [] });

		let fluidModels = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let fluidModelsWithoutId: Array<IFluidModel | undefined> = fluidModels.map(
			(r) => omit(r, '_id') as IFluidModel,
		);

		result = await service.upsert(fluidModelsWithoutId, project._id);

		expect(result).toStrictEqual({
			results: fluidModels.map(({ name }) => ({
				status: 'OK',
				code: OK,
				name,
			})),
		});

		fluidModels = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		fluidModelsWithoutId = fluidModels.map((r) => omit(r, '_id') as IFluidModel);
		fluidModelsWithoutId.splice(-1, 0, undefined);

		result = await service.upsert(fluidModelsWithoutId, project._id);

		const expectResults: Array<IRecordStatus | undefined> = fluidModels.map(({ name }) => ({
			status: 'OK',
			code: OK,
			name,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});
});
