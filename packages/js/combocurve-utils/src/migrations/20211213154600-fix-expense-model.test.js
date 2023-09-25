// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20211213154600-fix-expense-model');

let db;
let client;
let mongod;

const d1 = {
	name: 'expense_1',
	assumptionKey: 'expenses',
	econ_function: {
		variable_expenses: {
			drip_condensate: {
				other: {
					rows: [
						{
							dollar_per_bbl: 0,
							dates: {
								start_date: 'NaN-NaN-NaN',
								end_date: 'NaN-NaN-NaN',
							},
						},
					],
				},
			},
		},
	},
	options: {
		variable_expenses: {
			drip_condensate: {
				subItems: {
					other: {
						subItems: {
							row_view: {
								headers: {
									unit_cost: {
										label: '$/BBL',
										value: 'dollar_per_bbl',
									},
									criteria: {
										label: 'Dates',
										value: 'dates',
									},
								},
								rows: [
									{
										unit_cost: 0,
										criteria: 'Entire Well Life',
									},
								],
							},
						},
					},
				},
			},
		},
	},
};

const d2 = {
	name: 'expense_2',
	assumptionKey: 'expenses',
	econ_function: {
		variable_expenses: {
			drip_condensate: {
				other: {
					rows: [
						{
							cap: '',
							escalation_model: 'none',
							dollar_per_bbl: 0,
							entire_well_life: 'Entire Well Life',
						},
					],
				},
			},
		},
	},
	options: {
		variable_expenses: {
			drip_condensate: {
				subItems: {
					other: {
						subItems: {
							row_view: {
								headers: {
									unit_cost: {
										label: '$/BBL',
										value: 'dollar_per_bbl',
									},
									criteria: {
										label: 'Dates',
										value: 'dates',
									},
								},
								rows: [
									{
										unit_cost: 0,
										criteria: 'Entire Well Life',
									},
								],
							},
						},
					},
				},
			},
		},
	},
};

const optionsCriteria = {
	label: 'Flat',
	value: 'entire_well_life',
};

const econRows = [
	{
		dollar_per_bbl: 0,
		entire_well_life: 'Flat',
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210811201452-fix-deterministic-forecast-datas', () => {
	let assumptionsCollection;
	beforeAll(async () => {
		assumptionsCollection = db.collection('assumptions');

		await assumptionsCollection.insertMany([d1, d2]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const exp1 = await assumptionsCollection.findOne({ name: 'expense_1' });
		const exp2 = await assumptionsCollection.findOne({ name: 'expense_2' });

		expect(
			exp1.options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.headers.criteria
		).toEqual(optionsCriteria);
		expect(
			exp2.options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.headers.criteria
		).toEqual(optionsCriteria);
		expect(exp1.econ_function.variable_expenses.drip_condensate.other.rows).toEqual(econRows);
		expect(exp2.econ_function.variable_expenses.drip_condensate.other.rows).toEqual(econRows);
	});
});
