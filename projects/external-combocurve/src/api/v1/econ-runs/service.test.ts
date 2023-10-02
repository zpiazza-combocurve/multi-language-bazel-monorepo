import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { EconRunService } from '@src/services/econ-runs-service';
import { getMemoryMongoUri } from '@src/test/setup';
import { IEconRun } from '@src/models/econ/econ-runs';
import { toApiEconRun } from '@src/api/v1/econ-runs/fields';

import econRuns from '@test/fixtures/econ-runs.json';
import { getTenantInfo } from '@test/tenant';
import tags from '@test/fixtures/tags.json';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: EconRunService;
let context: ApiContextV1;

describe('v1/econ-runs/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new EconRunService(context);

		await context.models.EconRunModel.bulkWrite(
			econRuns.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.TagModel.bulkWrite(
			tags.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);
	});
	afterAll(async () => {
		await connection.close();
	});

	test('getEconRuns', async () => {
		const count = await context.models.EconRunModel.countDocuments();

		await expect(service.getEconRuns(0, 0, { id: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.EconRunModel.find().populate('tags');
		await expect(service.getEconRuns(0, count + 1, {}, {})).resolves.toStrictEqual({
			result: results.map(toApiEconRun),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.EconRunModel.find()
			.populate('tags')
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getEconRuns(count - 1, 1, { id: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiEconRun),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.EconRunModel.find()
			.populate('tags')
			.sort({ runDate: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getEconRuns(count - 1, 1, { runDate: -1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiEconRun),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.EconRunModel.find().populate('tags').limit(1);
		await expect(service.getEconRuns(0, 1, {}, { notEconRunField: ['test'] })).resolves.toStrictEqual({
			result: results.map(toApiEconRun),
			hasNext: true,
			cursor: null,
		});

		results = await context.models.EconRunModel.find().populate('tags').limit(1);
		await expect(service.getEconRuns(0, 1, {}, {})).resolves.toStrictEqual({
			result: results.map(toApiEconRun),
			hasNext: true,
			cursor: null,
		});
	});

	test('getEconRunsCount', async () => {
		let count = await context.models.EconRunModel.countDocuments();
		await expect(service.getEconRunsCount({})).resolves.toBe(count);

		count = await context.models.EconRunModel.countDocuments({});
		await expect(service.getEconRunsCount({ notEconRunField: ['test'] })).resolves.toBe(count);
	});

	test('getById', async () => {
		await expect(service.getById(Types.ObjectId(), Types.ObjectId(), Types.ObjectId())).resolves.toBeNull();

		const econRun = (await context.models.EconRunModel.findOne({
			_id: '5f80f287d7e63537b90aa121',
		}).populate('tags')) as IEconRun;
		await expect(service.getById(Types.ObjectId('5f80f287d7e63537b90aa121'))).resolves.toStrictEqual(
			toApiEconRun(econRun),
		);

		await expect(service.getById(Types.ObjectId('5f80f287d7e63537b90aa324'))).resolves.toBeNull();
	});
});
