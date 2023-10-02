import { Connection, Types } from 'mongoose';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { IStreamProperties, STREAM_PROPERTIES_KEY } from '@src/models/econ/stream-properties';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IRecordStatus } from '@src/api/v1/multi-status';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { BaseProjectResolved } from '../../fields';

import { StreamPropertiesService } from './service';
import { toApiStreamProperties } from './fields/stream-properties';

import assumptions from '@test/fixtures/assumptions.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/request');

const assumptionKey = STREAM_PROPERTIES_KEY;

let mongoUri: string;
let connection: Connection;
let service: StreamPropertiesService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/econ-models/stream-properties/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new StreamPropertiesService(context);

		await context.models.AssumptionModel.bulkWrite(
			assumptions.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);
	});
	beforeEach(() => {
		postApi.mockClear();
	});
	afterAll(async () => {
		await connection.close();
	});

	test('getStreamProperties', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });

		await expect(service.getStreamProperties(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter });
		await expect(service.getStreamProperties(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getStreamProperties(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getStreamProperties(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ name: 'test1', assumptionKey, ...projectScopeFilter });
		await expect(
			service.getStreamProperties(0, count + 1, {}, { name: ['test1'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ unique: true, assumptionKey, ...projectScopeFilter });
		await expect(
			service.getStreamProperties(0, count + 1, {}, { unique: ['true'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getStreamProperties(0, 1, { id: 1 }, { notEscalationField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiStreamProperties(r as IStreamProperties)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getStreamPropertiesCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getStreamPropertiesCount({}, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			name: 'test1',
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getStreamPropertiesCount({ name: ['test1'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			unique: true,
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getStreamPropertiesCount({ unique: ['true'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getStreamPropertiesCount({ notForecastField: ['test'] }, project)).resolves.toBe(count);
	});

	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const streamProperties = (await context.models.AssumptionModel.findOne({
			_id: '644aeeba4696d100213da759',
			...projectScopeFilter,
		})) as IStreamProperties;
		await expect(service.getById(Types.ObjectId('644aeeba4696d100213da759'), project)).resolves.toStrictEqual(
			toApiStreamProperties(streamProperties),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	test('create', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let result = await service.create([]);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let streamProperties = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let creates: Array<IStreamProperties | undefined> = streamProperties.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IStreamProperties,
		);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: streamProperties.map(({ econ_function }) => econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: streamProperties.map(({ name }) => ({
				status: 'Created',
				code: CREATED,
				name,
			})),
		});

		streamProperties = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		creates = streamProperties.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IStreamProperties,
		);
		creates.splice(-1, 0, undefined);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: streamProperties.map(({ econ_function }) => econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = streamProperties.map(({ name }) => ({
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
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let result = await service.upsert([], project._id);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let streamProperties = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let streamPropertiesWithoutId: Array<IStreamProperties | undefined> = streamProperties.map(
			(r) => omit(r, '_id') as IStreamProperties,
		);

		result = await service.upsert(streamPropertiesWithoutId, project._id);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: streamProperties.map(({ econ_function }) => econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: streamProperties.map(({ name }) => ({
				status: 'OK',
				code: OK,
				name,
			})),
		});

		streamProperties = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		streamPropertiesWithoutId = streamProperties.map((r) => omit(r, '_id') as IStreamProperties);
		streamPropertiesWithoutId.splice(-1, 0, undefined);

		result = await service.upsert(streamPropertiesWithoutId, project._id);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: streamProperties.map(({ econ_function }) => econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = streamProperties.map(({ name }) => ({
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
