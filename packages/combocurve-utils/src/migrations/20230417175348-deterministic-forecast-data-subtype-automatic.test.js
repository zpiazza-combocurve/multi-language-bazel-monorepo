// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20230417175348-deterministic-forecast-data-subtype-automatic');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('deterministic-forecast-datas');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

const baseData = {
	forecast: '123',
	phase: 'oil',
};

describe('changing auto to automatic for forecastSubType', () => {
	test('document has auto as forecastSubType', async () => {
		await collection.insertOne({ ...baseData, forecastSubType: 'auto' });
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.forecastSubType).toStrictEqual('automatic');

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('document has different starting forecastSubType', async () => {
		await collection.insertOne({ ...baseData, forecastSubType: 'manual' });
		await up({ db });

		const doc = await collection.findOne({ forecast: baseData.forecast });

		expect(doc.forecastSubType).toStrictEqual('manual');

		await collection.deleteOne({ forecast: baseData.forecast });
	});

	test('idempotency', async () => {
		await collection.insertOne({ ...baseData, forecastSubType: 'auto' });
		await collection.insertOne({ ...baseData, forecast: '345', forecastSubType: 'flat/zero' });

		// test idempotency
		await up({ db });
		await up({ db });

		const doc1 = await collection.findOne({ forecast: baseData.forecast });
		const doc2 = await collection.findOne({ forecast: '345' });

		expect(doc1.forecastSubType).toStrictEqual('automatic');
		expect(doc2.forecastSubType).toStrictEqual('flat/zero');

		await collection.deleteOne({ forecast: baseData.forecast });
	});
});
