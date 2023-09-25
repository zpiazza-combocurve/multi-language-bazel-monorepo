// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
const {
	up,
	down,
	defaultRateTypeValue,
	defaultCalculationMethodValue,
	defaultRateType,
	defaultCalculationMethod,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./20210514221600-econ-rate-based-rows');

let collection;
let db;
let mongod;
let client;

const expenses = {
	assumptionKey: 'expenses',
	options: {
		variable_expenses: {
			oil: {
				subItems: {
					gathering: {
						subItems: {},
					},
					processing: {
						subItems: {},
					},
					transportation: {
						subItems: {},
					},
					marketing: {
						subItems: {},
					},
					other: {
						subItems: {},
					},
				},
			},
			gas: {
				subItems: {
					gathering: {
						subItems: {},
					},
					processing: {
						subItems: {},
					},
					transportation: {
						subItems: {},
					},
					marketing: {
						subItems: {},
					},
					other: {
						subItems: {},
					},
				},
			},
			ngl: {
				subItems: {
					gathering: {
						subItems: {},
					},
					processing: {
						subItems: {},
					},
					transportation: {
						subItems: {},
					},
					marketing: {
						subItems: {},
					},
					other: {
						subItems: {},
					},
				},
			},
			drip_condensate: {
				subItems: {
					gathering: {
						subItems: {},
					},
					processing: {
						subItems: {},
					},
					transportation: {
						subItems: {},
					},
					marketing: {
						subItems: {},
					},
					other: {
						subItems: {},
					},
				},
			},
		},
		fixed_expenses: {
			monthly_well_cost: {
				subItems: {},
			},
			other_monthly_cost_1: {
				subItems: {},
			},
			other_monthly_cost_2: {
				subItems: {},
			},
		},
		water_disposal: {},
	},
	econ_function: {
		variable_expenses: {
			oil: {
				gathering: {},
				processing: {},
				transportation: {},
				marketing: {},
				other: {},
			},
			gas: {
				gathering: {},
				processing: {},
				transportation: {},
				marketing: {},
				other: {},
			},
			ngl: {
				gathering: {},
				processing: {},
				transportation: {},
				marketing: {},
				other: {},
			},
			drip_condensate: {
				gathering: {},
				processing: {},
				transportation: {},
				marketing: {},
				other: {},
			},
		},
		fixed_expenses: {
			monthly_well_cost: {},
			other_monthly_cost_1: {},
			other_monthly_cost_2: {},
		},
		water_disposal: {},
	},
};
const productionTaxes = {
	assumptionKey: 'production_taxes',
	options: {
		ad_valorem_tax: {},
		severance_tax: {},
	},
	econ_function: {
		ad_valorem_tax: {},
		severance_tax: {},
	},
};
const streamProperties = {
	assumptionKey: 'stream_properties',
	options: {
		yields: {},
		shrinkage: {},
		loss_flare: {},
	},
	econ_function: {
		yields: {},
		shrinkage: {},
		loss_flare: {},
	},
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210514221600-econ-rate-based-rows', () => {
	test('up', async () => {
		await collection.insertMany([expenses, productionTaxes, streamProperties]);
		await up({ db });
		await up({ db }); // test idempotence

		const expensesDoc = await collection.findOne({ assumptionKey: 'expenses' });
		const productionTaxesDoc = await collection.findOne({ assumptionKey: 'production_taxes' });
		const streamPropertiesDoc = await collection.findOne({ assumptionKey: 'stream_properties' });

		const variableExpensesPhase = ['oil', 'gas', 'ngl', 'drip_condensate'];
		const variableExpensesCategory = ['gathering', 'processing', 'transportation', 'marketing', 'other'];

		variableExpensesPhase.forEach((phase) => {
			variableExpensesCategory.forEach((category) => {
				expect(
					expensesDoc.options.variable_expenses[phase].subItems[category].subItems.rate_type
				).toStrictEqual(defaultRateType);
				expect(
					expensesDoc.options.variable_expenses[phase].subItems[category].subItems.rows_calculation_method
				).toStrictEqual(defaultCalculationMethod);

				expect(expensesDoc.econ_function.variable_expenses[phase][category].rate_type).toStrictEqual(
					defaultRateTypeValue
				);
				expect(
					expensesDoc.econ_function.variable_expenses[phase][category].rows_calculation_method
				).toStrictEqual(defaultCalculationMethodValue);
			});
		});

		const fixedExpensesCategory = ['monthly_well_cost', 'other_monthly_cost_1', 'other_monthly_cost_2'];

		fixedExpensesCategory.forEach((category) => {
			expect(expensesDoc.options.fixed_expenses[category].subItems.rate_type).toStrictEqual(defaultRateType);
			expect(expensesDoc.options.fixed_expenses[category].subItems.rows_calculation_method).toStrictEqual(
				defaultCalculationMethod
			);

			expect(expensesDoc.econ_function.fixed_expenses[category].rate_type).toStrictEqual(defaultRateTypeValue);
			expect(expensesDoc.econ_function.fixed_expenses[category].rows_calculation_method).toStrictEqual(
				defaultCalculationMethodValue
			);
		});

		expect(expensesDoc.options.water_disposal.rate_type).toStrictEqual(defaultRateType);
		expect(expensesDoc.options.water_disposal.rows_calculation_method).toStrictEqual(defaultCalculationMethod);

		expect(expensesDoc.econ_function.water_disposal.rate_type).toStrictEqual(defaultRateTypeValue);
		expect(expensesDoc.econ_function.water_disposal.rows_calculation_method).toStrictEqual(
			defaultCalculationMethodValue
		);

		const productionTaxesKey = ['severance_tax', 'ad_valorem_tax'];

		productionTaxesKey.forEach((key) => {
			expect(productionTaxesDoc.options[key].rate_type).toStrictEqual(defaultRateType);
			expect(productionTaxesDoc.options[key].rows_calculation_method).toStrictEqual(defaultCalculationMethod);

			expect(productionTaxesDoc.econ_function[key].rate_type).toStrictEqual(defaultRateTypeValue);
			expect(productionTaxesDoc.econ_function[key].rows_calculation_method).toStrictEqual(
				defaultCalculationMethodValue
			);
		});

		const streamPropertiesKey = ['yields', 'shrinkage', 'loss_flare'];

		streamPropertiesKey.forEach((key) => {
			expect(streamPropertiesDoc.options[key].rate_type).toStrictEqual(defaultRateType);
			expect(streamPropertiesDoc.options[key].rows_calculation_method).toStrictEqual(defaultCalculationMethod);

			expect(streamPropertiesDoc.econ_function[key].rate_type).toStrictEqual(defaultRateTypeValue);
			expect(streamPropertiesDoc.econ_function[key].rows_calculation_method).toStrictEqual(
				defaultCalculationMethodValue
			);
		});
	});

	test('down', async () => {
		await collection.insertMany([expenses, productionTaxes, streamProperties]);
		await up({ db });

		await down({ db });
		await down({ db }); // test idempotence

		const expensesDoc = await collection.findOne({ assumptionKey: 'expenses' });
		const productionTaxesDoc = await collection.findOne({ assumptionKey: 'production_taxes' });
		const streamPropertiesDoc = await collection.findOne({ assumptionKey: 'stream_properties' });

		const variableExpensesPhase = ['oil', 'gas', 'ngl', 'drip_condensate'];
		const variableExpensesCategory = ['gathering', 'processing', 'transportation', 'marketing', 'other'];

		variableExpensesPhase.forEach((phase) => {
			variableExpensesCategory.forEach((category) => {
				expect(expensesDoc.options.variable_expenses[phase].subItems[category].subItems).not.toHaveProperty(
					'rate_type'
				);
				expect(expensesDoc.options.variable_expenses[phase].subItems[category].subItems).not.toHaveProperty(
					'rows_calculation_method'
				);

				expect(expensesDoc.econ_function.variable_expenses[phase][category]).not.toHaveProperty('rate_type');
				expect(expensesDoc.econ_function.variable_expenses[phase][category]).not.toHaveProperty(
					'rows_calculation_method'
				);
			});
		});

		const fixedExpensesCategory = ['monthly_well_cost', 'other_monthly_cost_1', 'other_monthly_cost_2'];

		fixedExpensesCategory.forEach((category) => {
			expect(expensesDoc.options.fixed_expenses[category].subItems).not.toHaveProperty('rate_type');
			expect(expensesDoc.options.fixed_expenses[category].subItems).not.toHaveProperty('rows_calculation_method');

			expect(expensesDoc.econ_function.fixed_expenses[category]).not.toHaveProperty('rate_type');
			expect(expensesDoc.econ_function.fixed_expenses[category]).not.toHaveProperty('rows_calculation_method');
		});

		expect(expensesDoc.options.water_disposal).not.toHaveProperty('rate_type');
		expect(expensesDoc.options.water_disposal).not.toHaveProperty('rows_calculation_method');

		expect(expensesDoc.econ_function.water_disposal).not.toHaveProperty('rate_type');
		expect(expensesDoc.econ_function.water_disposal).not.toHaveProperty('rows_calculation_method');

		const productionTaxesKey = ['severance_tax', 'ad_valorem_tax'];

		productionTaxesKey.forEach((key) => {
			expect(productionTaxesDoc.options[key]).not.toHaveProperty('rate_type');
			expect(productionTaxesDoc.options[key]).not.toHaveProperty('rows_calculation_method');

			expect(productionTaxesDoc.econ_function[key]).not.toHaveProperty('rate_type');
			expect(productionTaxesDoc.econ_function[key]).not.toHaveProperty('rows_calculation_method');
		});

		const streamPropertiesKey = ['yields', 'shrinkage', 'loss_flare'];

		streamPropertiesKey.forEach((key) => {
			expect(streamPropertiesDoc.options[key]).not.toHaveProperty('rate_type');
			expect(streamPropertiesDoc.options[key]).not.toHaveProperty('rows_calculation_method');

			expect(streamPropertiesDoc.econ_function[key]).not.toHaveProperty('rate_type');
			expect(streamPropertiesDoc.econ_function[key]).not.toHaveProperty('rows_calculation_method');
		});
	});
});
