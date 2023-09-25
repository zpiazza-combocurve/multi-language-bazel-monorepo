// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210430084052-convert-operational-tag-daily-to-array');

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

describe('20210430084052-convert-operational-tag-daily-to-array', () => {
	test('up', async () => {
		const existingDailyProduction1InvalidOperationalTagId = new ObjectId();
		const existingDailyProduction2RightOperationalTagId = new ObjectId();
		const existingDailyProduction3NoOperationalTagId = new ObjectId();

		const operationalTagObjProd1 = {
			0: 1,
			3: 4,
			1: 2,
		};
		const operationalTagArrProd1 = Array(31).fill(null);
		Object.entries(operationalTagObjProd1).forEach(([i, v]) => {
			operationalTagArrProd1[i] = v;
		});

		await collection.insert({
			_id: existingDailyProduction1InvalidOperationalTagId,
			operational_tag: operationalTagObjProd1,
		});

		const operationalTagArrProd2 = Array(31).fill(null);
		operationalTagArrProd2[4] = 5;

		await collection.insert({
			_id: existingDailyProduction2RightOperationalTagId,
			operational_tag: operationalTagArrProd2,
		});

		await collection.insert({
			_id: existingDailyProduction3NoOperationalTagId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingDailyProduction1InvalidOperationalTagId });
		expect(docProd1.operational_tag).toEqual(operationalTagArrProd1);

		const docProd2 = await collection.findOne({ _id: existingDailyProduction2RightOperationalTagId });
		expect(docProd2.operational_tag).toEqual(operationalTagArrProd2);

		const docProd3 = await collection.findOne({ _id: existingDailyProduction3NoOperationalTagId });
		expect(docProd3.operational_tag).toBeUndefined();
	});
});
