// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { batchQuery, createBatchUpdate, createBatchBulkUpdate } = require('./batch-updater-v2');

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

const COLLECTION_NAME = 'batch-updater-test-collections';

describe('batch-updater-v2', () => {
	let collection;

	beforeEach(async () => {
		collection = db.collection(COLLECTION_NAME);
		await collection.deleteMany({});
		await collection.insertMany(createDummyDocuments());
	});

	test('batchQuery()', async () => {
		const query = { even: true };
		const selection = { index: 1 };
		const batchSize = 10;

		expect.assertions(2 * Math.ceil(total / 2 / batchSize));

		const iterator = (batch) => {
			expect(batch.length).toBeGreaterThan(0);
			expect(batch.length).toBeLessThanOrEqual(batchSize);
		};

		await batchQuery({ collection, query, selection, batchSize }, iterator);
	});
	test('createBatchUpdate()', async () => {
		const update = { $set: { even: false } };
		const batchUpdate = createBatchUpdate({ batchSize: 50, collection: COLLECTION_NAME, update, query: {} });

		const beforeCount = await collection.countDocuments({ even: false });
		expect(beforeCount).toEqual(total / 2);

		await batchUpdate({ db });

		const afterCount = await collection.countDocuments({ even: false });
		expect(afterCount).toEqual(total);
	});
	test('createBatchBulkUpdate()', async () => {
		const batchUpdate = createBatchBulkUpdate({
			collection: COLLECTION_NAME,
			selection: { even: 1 },
			query: {},
			buildUpdates: (batch) =>
				batch.map(({ _id, even }) => ({
					updateOne: {
						filter: { _id },
						update: {
							$set: {
								odd: !even,
							},
						},
					},
				})),
		});

		const beforeCount = await collection.countDocuments({ odd: { $exists: true } });
		expect(beforeCount).toEqual(0);

		await batchUpdate({ db });

		const afterCount = await collection.countDocuments({ odd: false });
		expect(afterCount).toEqual(total / 2);
	});
});
