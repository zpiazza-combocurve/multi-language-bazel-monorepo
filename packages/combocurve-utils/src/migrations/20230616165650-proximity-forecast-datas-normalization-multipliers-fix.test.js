// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20230616165650-proximity-forecast-datas-normalization-multipliers-fix.js');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('proximity-forecast-datas');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

const baseData = {
	forecast: '123',
	phase: 'oil',
};

describe('switching eur and qPeak numbers for normalization_multipliers', () => {
	test('document has misplaced normalization_multipliers', async () => {
		await collection.insertOne({
			...baseData,
			normalization_multipliers: [
				{
					qPeak: 2.1,
					eur: NaN,
				},
				{
					qPeak: 3,
					eur: NaN,
				},
			],
		});
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.normalization_multipliers).toStrictEqual([
			{
				qPeak: NaN,
				eur: 2.1,
			},
			{
				qPeak: NaN,
				eur: 3,
			},
		]);

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('document has correct normalization_multipliers', async () => {
		await collection.insertOne({
			...baseData,
			normalization_multipliers: [
				{
					qPeak: NaN,
					eur: 2.1,
				},
				{
					qPeak: NaN,
					eur: 3,
				},
			],
		});
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.normalization_multipliers).toStrictEqual([
			{
				qPeak: NaN,
				eur: 2.1,
			},
			{
				qPeak: NaN,
				eur: 3,
			},
		]);

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('document has both eur and qPeak normalization_multipliers', async () => {
		await collection.insertOne({
			...baseData,
			normalization_multipliers: [
				{
					qPeak: 1.1,
					eur: 2.1,
				},
				{
					qPeak: 1.2,
					eur: 3,
				},
			],
		});
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.normalization_multipliers).toStrictEqual([
			{
				qPeak: 1.1,
				eur: 2.1,
			},
			{
				qPeak: 1.2,
				eur: 3,
			},
		]);

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('document has no eur and qPeak normalization_multipliers', async () => {
		await collection.insertOne({
			...baseData,
			normalization_multipliers: [
				{
					qPeak: null,
					eur: NaN,
				},
				{
					qPeak: null,
					eur: NaN,
				},
			],
		});
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.normalization_multipliers).toStrictEqual([
			{
				qPeak: NaN,
				eur: 1,
			},
			{
				qPeak: NaN,
				eur: 1,
			},
		]);

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('document has no normalization_multipliers', async () => {
		await collection.insertOne({
			...baseData,
		});
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.normalization_multipliers).toStrictEqual();

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('idempotency', async () => {
		await collection.insertOne({
			...baseData,
			normalization_multipliers: [
				{
					qPeak: 2.1,
					eur: NaN,
				},
				{
					qPeak: 3,
					eur: NaN,
				},
			],
		});
		await collection.insertOne({
			...baseData,
			forecast: '345',
			normalization_multipliers: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
		});

		// test idempotency
		await up({ db });
		await up({ db });

		const doc1 = await collection.findOne({ forecast: baseData.forecast });
		const doc2 = await collection.findOne({ forecast: '345' });

		expect(doc1.normalization_multipliers).toStrictEqual([
			{
				qPeak: NaN,
				eur: 2.1,
			},
			{
				qPeak: NaN,
				eur: 3,
			},
		]);
		expect(doc2.normalization_multipliers).toStrictEqual([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]);

		await collection.deleteOne({ forecast: baseData.forecast });
	});
});
