// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20220606225720-income-tax-model-v2');

let collection;
let db;
let mongod;
let client;

const defaultTaxOptions = {
	subItems: {
		row_view: {
			headers: {
				multiplier: 'Multiplier',
				criteria: {
					label: 'Flat',
					value: 'entire_well_life',
				},
			},
			rows: [
				{
					multiplier: 0,
					criteria: 'Flat',
				},
			],
		},
	},
};

const defaultTaxEconFunc = {
	rows: [
		{
			multiplier: 0,
			entire_well_life: 'Flat',
		},
	],
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('tax-model-v2', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'general_options',
			options: {
				income_tax: {
					state_income_tax: 0,
					federal_income_tax: 0,
					omitSection: true,
				},
			},
			econ_function: {
				income_tax: {
					state_income_tax: 0,
					federal_income_tax: 0,
				},
			},
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.income_tax).toStrictEqual({
			state_income_tax: defaultTaxOptions,
			federal_income_tax: defaultTaxOptions,
			omitSection: true,
		});

		expect(doc.econ_function.income_tax).toStrictEqual({
			state_income_tax: defaultTaxEconFunc,
			federal_income_tax: defaultTaxEconFunc,
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'general_options',
			options: {
				income_tax: {
					state_income_tax: defaultTaxOptions,
					federal_income_tax: defaultTaxOptions,
					omitSection: true,
				},
			},
			econ_function: {
				income_tax: {
					state_income_tax: defaultTaxEconFunc,
					federal_income_tax: defaultTaxEconFunc,
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.income_tax).toStrictEqual({
			state_income_tax: 0,
			federal_income_tax: 0,
			omitSection: true,
		});

		expect(doc.econ_function.income_tax).toStrictEqual({
			state_income_tax: 0,
			federal_income_tax: 0,
		});
	});
});
