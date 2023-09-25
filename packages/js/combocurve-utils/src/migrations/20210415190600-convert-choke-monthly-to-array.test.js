// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210415190600-convert-choke-monthly-to-array');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('monthly-productions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210415190600-convert-choke-monthly-to-array', () => {
	test('up', async () => {
		const existingMonthlyProduction1InvalidChokeId = new ObjectId();
		const existingMonthlyProduction2RightChokeId = new ObjectId();
		const existingMonthlyProduction3NoChokeId = new ObjectId();

		const chokeObjProd1 = {
			0: 1,
			3: 4,
			1: 2,
		};
		const chokeArrProd1 = Array(12).fill(null);
		Object.entries(chokeObjProd1).forEach(([i, v]) => {
			chokeArrProd1[i] = v;
		});

		await collection.insert({
			_id: existingMonthlyProduction1InvalidChokeId,
			choke: chokeObjProd1,
		});

		const chokeArrProd2 = Array(12).fill(null);
		chokeArrProd2[4] = 5;

		await collection.insert({
			_id: existingMonthlyProduction2RightChokeId,
			choke: chokeArrProd2,
		});

		await collection.insert({
			_id: existingMonthlyProduction3NoChokeId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingMonthlyProduction1InvalidChokeId });
		expect(docProd1.choke).toEqual(chokeArrProd1);

		const docProd2 = await collection.findOne({ _id: existingMonthlyProduction2RightChokeId });
		expect(docProd2.choke).toEqual(chokeArrProd2);

		const docProd3 = await collection.findOne({ _id: existingMonthlyProduction3NoChokeId });
		expect(docProd3.choke).toBeUndefined();
	});
});
