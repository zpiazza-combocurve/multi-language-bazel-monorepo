// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20201201162818-initialize-days_on-monthly');

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

describe('20201201162818-initialize-days_on-monthly', () => {
	test('up', async () => {
		const existingMonthlyProduction1RightDaysOnId = new ObjectId();
		const existingMonthlyProduction2NoDaysOnId = new ObjectId();

		const defaultDaysOnArr = Array(12).fill(null);

		const daysOnArrProd1 = Array(12).fill(null);
		daysOnArrProd1[4] = 5;

		await collection.insert({
			_id: existingMonthlyProduction1RightDaysOnId,
			days_on: daysOnArrProd1,
		});

		await collection.insert({
			_id: existingMonthlyProduction2NoDaysOnId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingMonthlyProduction1RightDaysOnId });
		expect(docProd1.days_on).toEqual(daysOnArrProd1);

		const docProd2 = await collection.findOne({ _id: existingMonthlyProduction2NoDaysOnId });
		expect(docProd2.days_on).toEqual(defaultDaysOnArr);
	});
});
