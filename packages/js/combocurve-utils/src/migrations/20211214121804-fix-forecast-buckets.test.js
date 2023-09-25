// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20211214121804-fix-forecast-buckets');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

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

describe('20211214121804-fix-forecast-buckets', () => {
	let forecastCollection;
	let forecastBucketCollection;

	let forecastId;
	let bucketId1;
	let bucketId2;
	let deadBucketId;
	const forecastWellIds = Array(5)
		.fill(null)
		.map(() => new ObjectId());

	beforeAll(async () => {
		forecastCollection = db.collection('forecasts');
		forecastBucketCollection = db.collection('forecast-buckets');

		forecastId = new ObjectId();
		bucketId1 = new ObjectId();
		bucketId2 = new ObjectId();
		deadBucketId = new ObjectId();

		await forecastCollection.insertOne({ _id: forecastId, wells: forecastWellIds });

		await forecastBucketCollection.insertOne({
			_id: bucketId1,
			forecast: forecastId,
			bucket: [...forecastWellIds, new ObjectId()],
		});
		await forecastBucketCollection.insertOne({
			_id: bucketId2,
			forecast: forecastId,
			bucket: [forecastWellIds[0], new ObjectId(), forecastWellIds[2].toString(), forecastWellIds[1]],
		});
		await forecastBucketCollection.insertOne({
			_id: deadBucketId,
			forecast: new ObjectId(),
			bucket: [...forecastWellIds],
		});
	});

	afterAll(async () => {
		await forecastCollection.deleteOne({ _id: forecastId });
		await forecastBucketCollection.deleteMany({ _id: { $in: [bucketId1, bucketId2] } });
	});

	test('up', async () => {
		await up({ db });

		let bucketDoc1 = await forecastBucketCollection.findOne({ _id: bucketId1 });
		let bucketDoc2 = await forecastBucketCollection.findOne({ _id: bucketId2 });
		let deadBucketDoc = await forecastBucketCollection.findOne({ _id: deadBucketId });

		let bucket1Wells = bucketDoc1.bucket;
		let bucket2Wells = bucketDoc2.bucket;
		let deadBucketWells = deadBucketDoc.bucket;

		// test for correct number of wellIds
		expect(bucket1Wells.length).toEqual(forecastWellIds.length);
		expect(bucket2Wells.length).toEqual(3);

		// test to see if all wellIds are part of the parent array
		expect(forecastWellIds).toEqual(expect.arrayContaining(bucket1Wells));
		expect(forecastWellIds).toEqual(expect.arrayContaining(bucket2Wells));

		// dead bucket should remain unchanged
		expect(deadBucketWells.length).toEqual(forecastWellIds.length);
		expect(forecastWellIds).toEqual(expect.arrayContaining(deadBucketWells));

		// run again to check for idempotence
		await up({ db });

		bucketDoc1 = await forecastBucketCollection.findOne({ _id: bucketId1 });
		bucketDoc2 = await forecastBucketCollection.findOne({ _id: bucketId2 });
		deadBucketDoc = await forecastBucketCollection.findOne({ _id: deadBucketId });

		bucket1Wells = bucketDoc1.bucket;
		bucket2Wells = bucketDoc2.bucket;
		deadBucketWells = deadBucketDoc.bucket;

		// test for correct number of wellIds
		expect(bucket1Wells.length).toEqual(forecastWellIds.length);
		expect(bucket2Wells.length).toEqual(3);

		// test to see if all wellIds are part of the parent array
		expect(forecastWellIds).toEqual(expect.arrayContaining(bucket1Wells));
		expect(forecastWellIds).toEqual(expect.arrayContaining(bucket2Wells));

		// dead bucket should remain unchanged
		expect(deadBucketWells.length).toEqual(forecastWellIds.length);
		expect(forecastWellIds).toEqual(expect.arrayContaining(deadBucketWells));
	});
});
