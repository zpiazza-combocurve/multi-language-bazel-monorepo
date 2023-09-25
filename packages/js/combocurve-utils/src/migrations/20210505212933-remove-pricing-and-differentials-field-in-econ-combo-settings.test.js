// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const econComboSettings = require('../../tests/fixtures/econ-combo-settings.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210505212933-remove-pricing-and-differentials-field-in-econ-combo-settings');

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

describe('20210505212933-remove-pricing-and-differentials-field-in-econ-combo-settings', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('econ-combo-settings');
		await collection.insertMany(econComboSettings);
	});

	test('up', async () => {
		await up({ db });

		const result = await collection
			.find({ 'combos.qualifiers.pricing_differentials': { $exists: true } })
			.toArray();
		expect(result).toStrictEqual([]);
	});
});
