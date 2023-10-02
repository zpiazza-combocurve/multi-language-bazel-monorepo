import { Connection, Types } from 'mongoose';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { EMISSIONS_KEY, IEmission } from '@src/models/econ/emissions';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IRecordStatus } from '@src/api/v1/multi-status';

import { BaseProjectResolved } from '../../fields';

import { EmissionService } from './service';
import { toApiEmission } from './fields/emission';

import assumptions from '@test/fixtures/assumptions.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

const { CREATED, OK } = StatusCodes;
jest.mock('@src/helpers/request');

const assumptionKey = EMISSIONS_KEY;

let mongoUri: string;
let connection: Connection;
let service: EmissionService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/econ-models/emissions/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new EmissionService(context);

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

	test('getEmissions', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });

		await expect(service.getEmissions(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter });
		await expect(service.getEmissions(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getEmissions(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getEmissions(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ name: 'test1', assumptionKey, ...projectScopeFilter });
		await expect(service.getEmissions(0, count + 1, {}, { name: ['test1'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ unique: true, assumptionKey, ...projectScopeFilter });
		await expect(service.getEmissions(0, count + 1, {}, { unique: ['true'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getEmissions(0, 1, { id: 1 }, { notEmissionField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiEmission(r as IEmission)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getEmissionsCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getEmissionsCount({}, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			name: 'test1',
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getEmissionsCount({ name: ['test1'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			unique: true,
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getEmissionsCount({ unique: ['true'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getEmissionsCount({ notForecastField: ['test'] }, project)).resolves.toBe(count);
	});

	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const emissions = (await context.models.AssumptionModel.findOne({
			_id: '6499c39b3cd8638918067456',
			...projectScopeFilter,
		})) as IEmission;
		await expect(service.getById(Types.ObjectId('6499c39b3cd8638918067456'), project)).resolves.toStrictEqual(
			toApiEmission(emissions),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	test('create', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('64c3f25ad932aaaabc355f4e') };
		projectScopeFilter = { project: project._id };

		let result = await service.create([]);
		expect(result).toStrictEqual({ results: [] });

		let emissions = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let creates: Array<IEmission | undefined> = emissions.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IEmission,
		);

		result = await service.create(creates);

		expect(result).toStrictEqual({
			results: emissions.map(({ name }) => ({
				status: 'Created',
				code: CREATED,
				name,
			})),
		});

		emissions = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		creates = emissions.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IEmission,
		);
		creates.splice(-1, 0, undefined);

		result = await service.create(creates);

		const expectResults: Array<IRecordStatus | undefined> = emissions.map(({ name }) => ({
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
		project = { name: 'Test Project', _id: Types.ObjectId('64c3f25ad932aaaabc355f4e') };
		projectScopeFilter = { project: project._id };

		let result = await service.upsert([], project._id);
		expect(result).toStrictEqual({ results: [] });

		let emissions = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let emissionsWithoutId: Array<IEmission | undefined> = emissions.map((r) => omit(r, '_id') as IEmission);

		result = await service.upsert(emissionsWithoutId, project._id);

		expect(result).toStrictEqual({
			results: emissions.map(({ name }) => ({
				status: 'OK',
				code: OK,
				name,
			})),
		});

		emissions = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		emissionsWithoutId = emissions.map((r) => omit(r, '_id') as IEmission);
		emissionsWithoutId.splice(-1, 0, undefined);

		result = await service.upsert(emissionsWithoutId, project._id);

		const expectResults: Array<IRecordStatus | undefined> = emissions.map(({ name }) => ({
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
