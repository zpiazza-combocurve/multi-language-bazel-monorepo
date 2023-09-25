// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210415202936-initialize-operational-tag-daily');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('daily-productions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210415202936-initialize-operational-tag-daily', () => {
	test('up', async () => {
		const existingDailyProduction1RightOperationalTagId = new ObjectId();
		const existingDailyProduction2NoOperationalTagId = new ObjectId();

		const defaultOperationalTagArr = Array(31).fill(null);

		const operationalTagArrProd1 = Array(31).fill(null);
		operationalTagArrProd1[4] = 5;

		await collection.insert({
			_id: existingDailyProduction1RightOperationalTagId,
			operational_tag: operationalTagArrProd1,
		});

		await collection.insert({
			_id: existingDailyProduction2NoOperationalTagId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingDailyProduction1RightOperationalTagId });
		expect(docProd1.operational_tag).toEqual(operationalTagArrProd1);

		const docProd2 = await collection.findOne({ _id: existingDailyProduction2NoOperationalTagId });
		expect(docProd2.operational_tag).toEqual(defaultOperationalTagArr);
	});
});
