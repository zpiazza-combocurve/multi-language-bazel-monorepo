import { Connection } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { ITenantInfo } from '@src/tenant';

import { ApiContextV1 } from '../context';

import { TagsService } from './service';
import { toApiTag } from './fields/root-tags';

import { getTenantInfo } from '@test/tenant';
import tags from '@test/fixtures/tags.json';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: TagsService;
let context: ApiContextV1;

class TagTestContext extends TestContext {
	readonly tagService?: TagsService;

	constructor(tenant: ITenantInfo, connection: Connection) {
		super(tenant, connection);
		this.tagService = new TagsService(this as unknown as ApiContextV1);
	}
}

describe('v1/tags/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TagTestContext(info, connection) as ApiContextV1;
		service = new TagsService(context);

		await context.models.TagModel.bulkWrite(
			tags.map((item) => ({
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
	test('getTags', async () => {
		const count = await context.models.TagModel.countDocuments({});

		await expect(service.getTags(0, 0, { id: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.TagModel.find({});
		await expect(service.getTags(0, count + 1, {}, {})).resolves.toStrictEqual({
			result: results.map(toApiTag),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.TagModel.find({})
			.sort({ name: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getTags(count - 1, 1, { name: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiTag),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.TagModel.find({ name: 'First' });
		await expect(service.getTags(0, count + 1, {}, { name: ['First'] })).resolves.toStrictEqual({
			result: results.map(toApiTag),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.TagModel.find({}).limit(1);
		await expect(service.getTags(0, 1, {}, { notTagField: ['test'] })).resolves.toStrictEqual({
			result: results.map(toApiTag),
			hasNext: true,
			cursor: null,
		});

		results = await context.models.TagModel.find({}).sort({ _id: 1 }).limit(3);
		await expect(service.getTags(0, 3, { id: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiTag),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getTagsCount', async () => {
		let count = await context.models.TagModel.countDocuments({});
		await expect(service.getTagsCount({})).resolves.toBe(count);

		count = await context.models.TagModel.countDocuments({ name: 'First' });
		await expect(service.getTagsCount({ name: ['First'] })).resolves.toBe(count);

		count = await context.models.TagModel.countDocuments({});
		await expect(service.getTagsCount({ notProjectField: ['test'] })).resolves.toBe(count);
	});

	test('getTagIDs WHEN empty input SHOULD return empty array', async () => {
		await expect(service.getTagIDs([])).resolves.toStrictEqual([]);
	});

	test('getTagIDs WHEN valid input SHOULD return mongo tag IDS', async () => {
		// Get all
		const tags = await context.models.TagModel.find({}).exec();
		const names = tags.map((m) => m.name);
		const ids = tags.map((m) => m._id);

		await expect(service.getTagIDs(names)).resolves.toStrictEqual(ids);

		// Just one
		const firstName = names.slice(0, 1);
		const firstID = ids.slice(0, 1);

		await expect(service.getTagIDs(firstName)).resolves.toStrictEqual(firstID);

		// Not Found
		const dummyName = ['not_found_generated'];

		await expect(service.getTagIDs(dummyName)).resolves.toStrictEqual([]);
	});

	test('fillFilterTagIDs', async () => {
		const tags = await context.models.TagModel.find({}).exec();
		const names = tags.map((m) => m.name);
		const ids = tags.map((m) => m._id);

		const filter = {};

		await service.fillFilterTagIDs(names, filter);

		expect(filter).toStrictEqual({
			tags: {
				$in: ids,
			},
		});
	});
});
