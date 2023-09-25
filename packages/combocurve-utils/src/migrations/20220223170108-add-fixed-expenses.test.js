// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down, fixedExpOption, fixedExpEconFunction } = require('./20220223170108-add-fixed-expenses');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20220223170108-add-fixed-expenses', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'expenses',
			options: {
				fixed_expenses: {
					monthly_well_cost: { subItems: fixedExpOption },
					other_monthly_cost_1: { subItems: fixedExpOption },
					other_monthly_cost_2: { subItems: fixedExpOption },
				},
			},
			econ_function: {
				fixed_expenses: {
					monthly_well_cost: fixedExpEconFunction,
					other_monthly_cost_1: fixedExpEconFunction,
					other_monthly_cost_2: fixedExpEconFunction,
				},
			},
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.fixed_expenses).toStrictEqual({
			monthly_well_cost: { subItems: fixedExpOption },
			other_monthly_cost_1: { subItems: fixedExpOption },
			other_monthly_cost_2: { subItems: fixedExpOption },
			other_monthly_cost_3: { subItems: fixedExpOption },
			other_monthly_cost_4: { subItems: fixedExpOption },
			other_monthly_cost_5: { subItems: fixedExpOption },
			other_monthly_cost_6: { subItems: fixedExpOption },
			other_monthly_cost_7: { subItems: fixedExpOption },
			other_monthly_cost_8: { subItems: fixedExpOption },
		});
		expect(doc.econ_function.fixed_expenses).toStrictEqual({
			monthly_well_cost: fixedExpEconFunction,
			other_monthly_cost_1: fixedExpEconFunction,
			other_monthly_cost_2: fixedExpEconFunction,
			other_monthly_cost_3: fixedExpEconFunction,
			other_monthly_cost_4: fixedExpEconFunction,
			other_monthly_cost_5: fixedExpEconFunction,
			other_monthly_cost_6: fixedExpEconFunction,
			other_monthly_cost_7: fixedExpEconFunction,
			other_monthly_cost_8: fixedExpEconFunction,
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'expenses',
			options: {
				fixed_expenses: {
					monthly_well_cost: { subItems: fixedExpOption },
					other_monthly_cost_1: { subItems: fixedExpOption },
					other_monthly_cost_2: { subItems: fixedExpOption },
					other_monthly_cost_3: { subItems: fixedExpOption },
					other_monthly_cost_4: { subItems: fixedExpOption },
					other_monthly_cost_5: { subItems: fixedExpOption },
					other_monthly_cost_6: { subItems: fixedExpOption },
					other_monthly_cost_7: { subItems: fixedExpOption },
					other_monthly_cost_8: { subItems: fixedExpOption },
				},
			},
			econ_function: {
				fixed_expenses: {
					monthly_well_cost: fixedExpEconFunction,
					other_monthly_cost_1: fixedExpEconFunction,
					other_monthly_cost_2: fixedExpEconFunction,
					other_monthly_cost_3: fixedExpEconFunction,
					other_monthly_cost_4: fixedExpEconFunction,
					other_monthly_cost_5: fixedExpEconFunction,
					other_monthly_cost_6: fixedExpEconFunction,
					other_monthly_cost_7: fixedExpEconFunction,
					other_monthly_cost_8: fixedExpEconFunction,
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.fixed_expenses).toStrictEqual({
			monthly_well_cost: { subItems: fixedExpOption },
			other_monthly_cost_1: { subItems: fixedExpOption },
			other_monthly_cost_2: { subItems: fixedExpOption },
		});
		expect(doc.econ_function.fixed_expenses).toStrictEqual({
			monthly_well_cost: fixedExpEconFunction,
			other_monthly_cost_1: fixedExpEconFunction,
			other_monthly_cost_2: fixedExpEconFunction,
		});
	});
});
