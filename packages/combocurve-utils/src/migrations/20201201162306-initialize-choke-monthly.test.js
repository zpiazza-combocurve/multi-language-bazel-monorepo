// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20201201162306-initialize-choke-monthly');

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

describe('20201201162306-initialize-choke-monthly', () => {
	test('up', async () => {
		const existingMonthlyProduction1RightChokeId = new ObjectId();
		const existingMonthlyProduction2NoChokeId = new ObjectId();

		const defaultChokeArr = Array(12).fill(null);

		const chokeArrProd1 = Array(12).fill(null);
		chokeArrProd1[4] = 5;

		await collection.insert({
			_id: existingMonthlyProduction1RightChokeId,
			choke: chokeArrProd1,
		});

		await collection.insert({
			_id: existingMonthlyProduction2NoChokeId,
		});

		await up({ db });
		await up({ db }); // test idempotence

		const docProd1 = await collection.findOne({ _id: existingMonthlyProduction1RightChokeId });
		expect(docProd1.choke).toEqual(chokeArrProd1);

		const docProd2 = await collection.findOne({ _id: existingMonthlyProduction2NoChokeId });
		expect(docProd2.choke).toEqual(defaultChokeArr);
	});
});
