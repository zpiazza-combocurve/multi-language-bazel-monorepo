import { Connection, Types } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { ValidationError } from '@src/helpers/validation';

import { ApiContextV1 } from '../context';

import { WellCommentService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wellComments from '@test/fixtures/well-comments.json';

let mongoUri: string;
let connection: Connection;
let service: WellCommentService;
let context: ApiContextV1;

describe('v1/well-comments/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new WellCommentService(context);

		await context.models.WellCommentBucketModel.bulkWrite(
			wellComments.map((item) => ({
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
	test('getWellComments', async () => {
		await expect(service.getWellComments(0, 0, { well: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		await expect(service.getWellComments(0, 1, { _id: -1 }, {})).resolves.toStrictEqual({
			result: [
				{
					commentedAt: new Date('2020-05-27T17:52:28.791Z'),
					commentedBy: Types.ObjectId('5f51a46dd1986a0012058e01'),
					forecast: null,
					project: Types.ObjectId('6064c19e2c3fc60012909a50'),
					text: 'test1',
					well: Types.ObjectId('5ea75f66a89f032e0f9aefdc'),
				},
			],
			hasNext: true,
			cursor: null,
		});

		await expect(
			service.getWellComments(0, 1, { commentedAt: 1 }, { commentedAt: [{ gt: '2020-06-26T17:52:28.791Z' }] }),
		).resolves.toStrictEqual({
			result: [
				{
					commentedAt: new Date('2020-06-27T17:52:28.791Z'),
					commentedBy: Types.ObjectId('5f51a46dd1986a0012058e01'),
					forecast: null,
					project: Types.ObjectId('6064c19e2c3fc60012909a50'),
					text: 'test2',
					well: Types.ObjectId('5ea75f66a89f032e0f9aefdc'),
				},
			],
			hasNext: true,
			cursor: null,
		});

		await expect(service.getWellComments(0, 1, { id: -1 }, {}, undefined)).resolves.toStrictEqual({
			result: [
				{
					commentedAt: new Date('2021-06-27T17:52:28.791Z'),
					commentedBy: Types.ObjectId('5f51a46dd1986a0012058e01'),
					forecast: Types.ObjectId('60a6c4a13f40ab00125086a7'),
					project: Types.ObjectId('6064c19e2c3fc60012909a50'),
					text: 'test1',
					well: Types.ObjectId('5ea75f66a89f032e0f9aefdc'),
				},
			],
			hasNext: true,
			cursor: '60b035eeb2202b8d93338f26+0',
		});

		await expect(
			service.getWellComments(0, 1, { id: -1 }, {}, '60afdc5db2202b8d9328ec04+1'),
		).resolves.toStrictEqual({
			result: [
				{
					commentedAt: new Date('2020-07-27T17:52:28.791Z'),
					commentedBy: Types.ObjectId('5f51a46dd1986a0012058e01'),
					forecast: null,
					project: Types.ObjectId('6064c19e2c3fc60012909a50'),
					text: 'test3',
					well: Types.ObjectId('5ea75f66a89f032e0f9aefdc'),
				},
			],
			hasNext: false,
			cursor: '60afdc5db2202b8d9328ec04+2',
		});

		await expect(service.getWellComments(0, 1, { id: -1 }, {}, 'invalidcursor')).rejects.toThrow(ValidationError);
	});
	test('getWellCommentsCount', async () => {
		const result = await context.models.WellCommentBucketModel.aggregate([
			{ $group: { _id: null, count: { $sum: '$count' } } },
		]);
		await expect(service.getWellCommentsCount({})).resolves.toBe(result[0].count);

		await expect(service.getWellCommentsCount({ well: ['5ea75f66a89f032e0f9aefdc'] })).resolves.toBe(4);
		await expect(service.getWellCommentsCount({ forecast: ['60a6c4a13f40ab00125086a7'] })).resolves.toBe(1);
	});
});
