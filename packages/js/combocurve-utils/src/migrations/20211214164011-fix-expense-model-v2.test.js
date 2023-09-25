// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20211214164011-fix-expense-model-v2');

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

const d3 = {
	name: 'expense_3',
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
										criteria: 'Flat',
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

const d4 = {
	name: 'expense_4',
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
										label: 'FPD',
										value: 'offset_to_fpd',
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

const d5 = {
	name: 'expense_5',
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
										label: 'As Of',
										value: 'offset_to_as_of_date',
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

describe('20211214164011-fix-expense-model-v2.js', () => {
	let assumptionsCollection;
	beforeAll(async () => {
		assumptionsCollection = db.collection('assumptions');
		await assumptionsCollection.insertMany([d1, d2, d3, d4, d5]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const names = ['expense_1', 'expense_2', 'expense_3', 'expense_4', 'expense_5'];

		// eslint-disable-next-line no-restricted-syntax
		for (const modelName of names) {
			// eslint-disable-next-line no-await-in-loop
			const model = await assumptionsCollection.findOne({ name: modelName });
			expect(
				model.options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.headers.criteria
			).toEqual(optionsCriteria);
			expect(model.econ_function.variable_expenses.drip_condensate.other.rows).toEqual(econRows);
		}
	});
});
