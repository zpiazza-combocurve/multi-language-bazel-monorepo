// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210415192711-convert-daysOn-monthly-to-array');

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

describe('20210415192711-convert-daysOn-monthly-to-array', () => {
	test('up', async () => {
		const existingMonthlyProduction1InvalidDaysOnId = new ObjectId();
		const existingMonthlyProduction2RightDaysOnId = new ObjectId();
		const existingMonthlyProduction3NoDaysOnId = new ObjectId();

		const daysOnObjProd1 = {
			0: 1,
			3: 4,
			1: 2,
		};
		const daysOnArrProd1 = Array(12).fill(null);
		Object.entries(daysOnObjProd1).forEach(([i, v]) => {
			daysOnArrProd1[i] = v;
		});

		await collection.insert({
			_id: existingMonthlyProduction1InvalidDaysOnId,
			days_on: daysOnObjProd1,
		});

		const daysOnArrProd2 = Array(12).fill(null);
		daysOnArrProd2[4] = 5;

		await collection.insert({
			_id: existingMonthlyProduction2RightDaysOnId,
			days_on: daysOnArrProd2,
		});

		await collection.insert({
			_id: existingMonthlyProduction3NoDaysOnId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingMonthlyProduction1InvalidDaysOnId });
		expect(docProd1.days_on).toEqual(daysOnArrProd1);

		const docProd2 = await collection.findOne({ _id: existingMonthlyProduction2RightDaysOnId });
		expect(docProd2.days_on).toEqual(daysOnArrProd2);

		const docProd3 = await collection.findOne({ _id: existingMonthlyProduction3NoDaysOnId });
		expect(docProd3.days_on).toBeUndefined();
	});
});
