// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchInsertFromAggregation, createBatchInsertFromQuery } = require('./batch-inserter');

let db;
let client;
let mongod;

const total = 100;

const createDummyDocuments = () =>
	new Array(total).fill(null).map((_, index) => ({ foo: 'bar', index, even: index % 2 === 0 }));

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

const COLLECTION_NAME = 'batch-inserter-test-collections';

describe('batch-inserter', () => {
	let collection;

	beforeEach(async () => {
		collection = db.collection(COLLECTION_NAME);
		await collection.deleteMany({});
		await collection.insertMany(createDummyDocuments());
	});
	test('createBatchInsertFromQuery()', async () => {
		const batchCreate = createBatchInsertFromQuery({
			collection: COLLECTION_NAME,
			query: { even: false },
			buildDocs: (batch) => batch.map(({ foo }) => ({ foo, even: true })),
			batchSize: 10,
		});
		const beforeCount = await collection.countDocuments({ even: true });
		expect(beforeCount).toEqual(total / 2);

		await batchCreate({ db });

		const afterCount = await collection.countDocuments({ even: true });
		expect(afterCount).toEqual(total);
	});
	test('createBatchInsertFromAggregation()', async () => {
		const batchCreate = createBatchInsertFromAggregation({
			collection: COLLECTION_NAME,
			pipeline: [{ $match: { even: false } }],
			buildDocs: (batch) => batch.map(({ foo }) => ({ foo, even: true })),
			batchSize: 10,
		});
		const beforeCount = await collection.countDocuments({ even: true });
		expect(beforeCount).toEqual(total / 2);

		await batchCreate({ db });

		const afterCount = await collection.countDocuments({ even: true });
		expect(afterCount).toEqual(total);
	});
});
