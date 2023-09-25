// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20220815170419-update-capex-dda-filed-name');

let collection;
let db;
let mongod;
let client;

const upHeaders = {
	category: 'Category',
	description: 'Description',
	tangible: 'Tangible',
	intangible: 'Intangible',
	criteria: 'Criteria',
	capex_expense: 'CAPEX/Expense',
	calculation: 'Calculation',
	escalation_model: 'Escalation',
	depreciation_model: 'DD&A',
	deal_terms: 'Paying WI ÷ Earning WI',
	after_econ_limit: 'Appear After Econ Limit',
};

const downHeaders = {
	category: 'Category',
	description: 'Description',
	tangible: 'Tangible',
	intangible: 'Intangible',
	criteria: 'Criteria',
	capex_expense: 'CAPEX/Expense',
	calculation: 'Calculation',
	escalation_model: 'Escalation',
	depreciation_model: 'Depreciation',
	deal_terms: 'Paying WI ÷ Earning WI',
	after_econ_limit: 'Appear After Econ Limit',
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('update-capex-dda-filed-name', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'capex',
			options: {
				other_capex: {
					row_view: {
						headers: downHeaders,
					},
				},
			},
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.other_capex.row_view).toStrictEqual({
			headers: upHeaders,
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'capex',
			options: {
				other_capex: {
					row_view: {
						headers: downHeaders,
					},
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.other_capex.row_view).toStrictEqual({
			headers: downHeaders,
		});
	});
});
