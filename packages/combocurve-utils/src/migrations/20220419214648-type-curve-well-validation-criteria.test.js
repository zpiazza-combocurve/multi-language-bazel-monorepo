// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20220419214648-type-curve-well-validation-criteria');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('type-curves');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20220419214648-type-curve-well-validation-criteria', () => {
	test('up', async () => {
		await collection.insertOne({}); // empty doc

		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.wellValidationCriteria).toEqual('must_have_prod_and_forecast');
	});

	test('down', async () => {
		await collection.insertOne({
			wellValidationCriteria: 'must_have_prod_and_forecast',
		});

		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc).not.toHaveProperty('wellValidationCriteria');
	});
});
