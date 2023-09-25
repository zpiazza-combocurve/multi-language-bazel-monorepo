// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchDelete } = require('./batch-deleter');

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

describe('batch-deleter', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection(COLLECTION_NAME);
		await collection.insertMany(createDummyDocuments());
	});
	test('createBatchDelete()', async () => {
		const batchDelete = createBatchDelete({
			collection: COLLECTION_NAME,
			query: { even: false },
			batchSize: 10,
		});
		const beforeCount = await collection.countDocuments({ even: false });
		expect(beforeCount).toEqual(total / 2);

		await batchDelete({ db });

		const afterCount = await collection.countDocuments({ even: false });
		expect(afterCount).toEqual(0);
	});
});
