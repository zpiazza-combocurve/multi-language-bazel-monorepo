import { Connection } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';

import { ApiContextV1 } from '../context';

import { toApiWellMapping } from './fields';
import { WellMappingService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

let mongoUri: string;
let connection: Connection;
let service: WellMappingService;
let context: ApiContextV1;

describe('v1/wells/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new WellMappingService(context);

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
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

	test('getWellMappings', async () => {
		const count = await context.models.WellModel.countDocuments({});

		await expect(service.getWellMappings({ take: 0, sort: { id: 1 } })).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.WellModel.find().sort({ _id: 1 });
		let cursor = results[results.length - 1]._id;

		await expect(service.getWellMappings({ take: count + 1 })).resolves.toStrictEqual({
			result: results.map(toApiWellMapping),
			hasNext: false,
			cursor: cursor,
		});

		results = await context.models.WellModel.find({ createdAt: new Date('2020-01-21T16:56:24.859Z') }).sort({
			_id: 1,
		});
		cursor = results[results.length - 1]._id;

		await expect(
			service.getWellMappings({
				take: count + 1,
				filters: { createdAt: ['2020-01-21T16:56:24.859Z'] },
			}),
		).resolves.toStrictEqual({
			result: results.map(toApiWellMapping),
			hasNext: false,
			cursor: cursor,
		});

		results = await context.models.WellModel.find({ createdAt: { $gt: new Date('2020-03-01') } })
			.sort({ _id: -1 })
			.limit(1);

		cursor = results[results.length - 1]._id;

		await expect(
			service.getWellMappings({
				take: 1,
				sort: { id: -1 },
				filters: { createdAt: [{ gt: '2020-03-01' }] },
			}),
		).resolves.toStrictEqual({
			result: results.map(toApiWellMapping),
			hasNext: true,
			cursor: cursor,
		});

		const output = service.getWellMappings({ take: 1, filters: { notWellField: ['test'] } });
		results = await context.models.WellModel.find().sort({ id: 1 }).limit(1);
		cursor = results[results.length - 1]._id;

		await expect(output).resolves.toStrictEqual({
			result: results.map(toApiWellMapping),
			hasNext: true,
			cursor: cursor,
		});
	});
});
