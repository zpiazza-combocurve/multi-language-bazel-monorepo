// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const econComboSettings = require('../../tests/fixtures/econ-combo-settings.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210505164823-split-pricing-and-differentials-in-econ-combo-setting');

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

describe('20210505164823-split-pricing-and-differentials-in-econ-combo-setting.test', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('econ-combo-settings');
		await collection.insertMany(econComboSettings);
	});

	test('up', async () => {
		await up({ db });

		const { combos } = await collection.findOne({ _id: '5fca4a0ed12962b544fcb6bf' });
		combos.forEach((combo) => {
			const { pricing_differentials, pricing, differentials } = combo.qualifiers;
			if (pricing_differentials) {
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(pricing).toStrictEqual(pricing_differentials);
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(differentials).toStrictEqual(pricing_differentials);
			} else {
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(pricing).toBe(undefined);
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(differentials).toBe(undefined);
			}
		});
	});

	test('down', async () => {
		await up({ db });
		await down({ db });

		const result = await collection
			.find({
				'combos.qualifiers.pricing_differentials': { $exists: true },
				$or: [
					{ 'combos.qualifiers.pricing': { $exists: true } },
					{ 'combos.qualifiers.differentials': { $exists: true } },
				],
			})
			.toArray();
		expect(result).toStrictEqual([]);
	});
});
