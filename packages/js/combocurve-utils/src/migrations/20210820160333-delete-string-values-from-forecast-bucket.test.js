// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210820160333-delete-string-values-from-forecast-bucket');

let db;
let client;
let mongod;

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210820160333-delete-string-values-from-forecast-bucket', () => {
	let forecastBucketsCollection;

	beforeAll(async () => {
		forecastBucketsCollection = db.collection('forecast-buckets');

		await forecastBucketsCollection.insertMany([
			{
				name: 'bucket 1',
			},
			{
				name: 'bucket 2',
				bucket: [],
			},
			{
				name: 'bucket 3',
				bucket: [new ObjectId().toString(), new ObjectId().toString(), new ObjectId().toString()],
			},
			{
				name: 'bucket 4',
				bucket: [new ObjectId(), new ObjectId().toString()],
			},
			{
				name: 'bucket 5',
				bucket: [new ObjectId(), new ObjectId()],
			},
		]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const bucket1 = await forecastBucketsCollection.findOne({ name: 'bucket 1' });
		expect(bucket1).toEqual({ _id: expect.any(ObjectId), name: 'bucket 1' });

		const bucket2 = await forecastBucketsCollection.findOne({ name: 'bucket 2' });
		expect(bucket2).toEqual({ _id: expect.any(ObjectId), name: 'bucket 2', bucket: [] });

		const bucket3 = await forecastBucketsCollection.findOne({ name: 'bucket 3' });
		expect(bucket3).toEqual({ _id: expect.any(ObjectId), name: 'bucket 3', bucket: [] });

		const bucket4 = await forecastBucketsCollection.findOne({ name: 'bucket 4' });
		expect(bucket4).toEqual({
			_id: expect.any(ObjectId),
			name: 'bucket 4',
			bucket: [expect.any(ObjectId)],
		});

		const bucket5 = await forecastBucketsCollection.findOne({ name: 'bucket 5' });
		expect(bucket5).toEqual({
			_id: expect.any(ObjectId),
			name: 'bucket 5',
			bucket: [expect.any(ObjectId), expect.any(ObjectId)],
		});
	});
});
