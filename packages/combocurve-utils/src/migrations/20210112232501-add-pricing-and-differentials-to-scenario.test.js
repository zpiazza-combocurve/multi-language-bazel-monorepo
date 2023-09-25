// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const scenarios = require('../../tests/fixtures/scenarios.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210112232501-add-pricing-and-differentials-to-scenario');

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

describe('20210112232501-add-pricing-and-differentials-to-scenario', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('scenarios');
		await collection.insertMany(scenarios);
	});

	test('up', async () => {
		await up({ db });

		const result = await collection.find({}).toArray();

		result.forEach(({ columns }) => {
			const { pricing_differentials, pricing, differentials } = columns;
			expect(pricing).toStrictEqual(pricing_differentials);
			expect(differentials).toStrictEqual(pricing_differentials);
		});
	});

	test('down', async () => {
		await up({ db });
		await down({ db });

		const result = await collection
			.find({ $or: [{ 'columns.pricing': { $exists: true } }, { 'columns.differentials': { $exists: true } }] })
			.toArray();
		expect(result).toStrictEqual([]);
	});
});
