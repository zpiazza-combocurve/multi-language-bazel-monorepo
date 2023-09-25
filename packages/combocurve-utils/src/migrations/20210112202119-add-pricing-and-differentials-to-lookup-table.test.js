// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const pricingDifferentials = require('../../tests/fixtures/pricing-differentials-assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const lookupTables = require('../../tests/fixtures/lookup-tables.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210112202119-add-pricing-and-differentials-to-lookup-table');

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

describe('20210112202119-add-pricing-and-differentials-to-lookup-table', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('lookup-tables');
		await db.collection('assumptions').insertMany([...assumptions, ...pricingDifferentials]);
		await collection.insertMany(lookupTables);
	});

	test('up', async () => {
		const {
			configuration: { selectedAssumptions: oldSelectedAssumptions },
		} = await collection.findOne({ _id: '5fb32fe8ed079500120914a3' });

		await up({ db });

		const result = await collection.findOne({ _id: '5fb32fe8ed079500120914a3' });

		const {
			rules,
			configuration: { selectedAssumptions: newSelectedAssumptions },
		} = result;
		const resultingSelectedAssumptions = [
			...oldSelectedAssumptions.filter((a) => a !== 'pricing_differentials'),
			'pricing',
			'differentials',
		];
		expect(newSelectedAssumptions).toStrictEqual(resultingSelectedAssumptions);

		rules.forEach((rule) => {
			const { pricing_differentials, pricing, differentials } = rule;
			if (pricing_differentials) {
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(pricing).toBe('5f2c8e40c7002d044b7391b4');
				// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
				expect(differentials).toBe('5f3b0b9b552cd446ead2437d');
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
			.find({ $or: [{ 'rules.pricing': { $exists: true } }, { 'rules.differentials': { $exists: true } }] })
			.toArray();
		expect(result).toStrictEqual([]);
	});
});
