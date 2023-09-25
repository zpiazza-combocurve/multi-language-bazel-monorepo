// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20220622230122-add-ecl-capex-column');

let collection;
let db;
let mongod;
let client;

const defaultDownHeader = {
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
};

const defaultUpHeader = {
	category: 'Category',
	description: 'Description',
	tangible: 'Tangible',
	intangible: 'Intangible',
	criteria: 'Criteria',
	capex_expense: 'CAPEX/Expense',
	after_econ_limit: 'Appear After Econ Limit',
	calculation: 'Calculation',
	escalation_model: 'Escalation',
	depreciation_model: 'Depreciation',
	deal_terms: 'Paying WI ÷ Earning WI',
};

const exampleDownEconFunction_1 = {
	category: 'abandonment',
	description: '',
	tangible: 20,
	intangible: 10,
	date: '2064-11-01',
	capex_expense: 'capex',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpEconFunction_1 = {
	category: 'abandonment',
	description: '',
	tangible: 20,
	intangible: 10,
	date: '2064-11-01',
	capex_expense: 'capex',
	after_econ_limit: 'yes',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpRow_1 = {
	category: {
		label: 'Abandonment',
		value: 'abandonment',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Date',
			value: 'date',
			fieldType: 'date',
			valType: 'datetime',
		},
		value: '2064/11/01',
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	after_econ_limit: {
		label: 'Yes',
		value: 'yes',
		na: 'yes',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

const exampleDownRow_1 = {
	category: {
		label: 'Abandonment',
		value: 'abandonment',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Date',
			value: 'date',
			fieldType: 'date',
			valType: 'datetime',
		},
		value: '2064/11/01',
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

const exampleDownEconFunction_2 = {
	category: 'drilling',
	description: '',
	tangible: 20,
	intangible: 10,
	offset_to_econ_limit: 60,
	capex_expense: 'capex',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpEconFunction_2 = {
	category: 'drilling',
	description: '',
	tangible: 20,
	intangible: 10,
	offset_to_econ_limit: 60,
	capex_expense: 'capex',
	after_econ_limit: 'yes',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpRow_2 = {
	category: {
		label: 'Drilling',
		value: 'drilling',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Econ Limit',
			value: 'offset_to_econ_limit',
			fieldType: 'number',
			valType: 'days',
			min: -20000,
			max: 20000,
			Default: 0,
		},
		value: 60,
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	after_econ_limit: {
		label: 'Yes',
		value: 'yes',
		na: 'yes',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

const exampleDownRow_2 = {
	category: {
		label: 'Drilling',
		value: 'drilling',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Econ Limit',
			value: 'offset_to_econ_limit',
			fieldType: 'number',
			valType: 'days',
			min: -20000,
			max: 20000,
			Default: 0,
		},
		value: 60,
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

const exampleDownEconFunction_3 = {
	category: 'drilling',
	description: '',
	tangible: 20,
	intangible: 10,
	date: '2064-11-01',
	capex_expense: 'capex',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpEconFunction_3 = {
	category: 'drilling',
	description: '',
	tangible: 20,
	intangible: 10,
	date: '2064-11-01',
	capex_expense: 'capex',
	after_econ_limit: 'yes',
	calculation: 'gross',
	escalation_model: 'none',
	depreciation_model: 'none',
	deal_terms: 1,
};

const exampleUpRow_3 = {
	category: {
		label: 'Drilling',
		value: 'drilling',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Date',
			value: 'date',
			fieldType: 'date',
			valType: 'datetime',
		},
		value: '2064/11/01',
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	after_econ_limit: {
		label: 'Yes',
		value: 'yes',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

const exampleDownRow_3 = {
	category: {
		label: 'Drilling',
		value: 'drilling',
		disabled: false,
	},
	description: '',
	tangible: 20,
	intangible: 10,
	criteria: {
		criteria: {
			required: true,
			label: 'Date',
			value: 'date',
			fieldType: 'date',
			valType: 'datetime',
		},
		value: '2064/11/01',
	},
	capex_expense: {
		label: 'CAPEX',
		value: 'capex',
	},
	calculation: {
		label: 'Gross',
		value: 'gross',
	},
	escalation_model: {
		label: 'None',
		value: 'none',
	},
	depreciation_model: {
		label: 'None',
		value: 'none',
	},
	deal_terms: 1,
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('ecl-capex', () => {
	// 1: test for abandonment or salvage capex
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'capex',
			options: {
				other_capex: {
					row_view: {
						headers: defaultDownHeader,
						rows: [exampleDownRow_1, exampleDownRow_2, exampleDownRow_3],
					},
				},
			},
			econ_function: {
				other_capex: {
					rows: [exampleDownEconFunction_1, exampleDownEconFunction_2, exampleDownEconFunction_3],
				},
			},
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.other_capex.row_view).toStrictEqual({
			headers: defaultUpHeader,
			rows: [exampleUpRow_1, exampleUpRow_2, exampleUpRow_3],
		});

		expect(doc.econ_function.other_capex).toStrictEqual({
			rows: [exampleUpEconFunction_1, exampleUpEconFunction_2, exampleUpEconFunction_3],
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'capex',
			options: {
				other_capex: {
					row_view: {
						headers: defaultUpHeader,
						rows: [exampleUpRow_1, exampleUpRow_2, exampleUpRow_3],
					},
				},
			},
			econ_function: {
				other_capex: {
					rows: [exampleUpEconFunction_1, exampleUpEconFunction_2, exampleUpEconFunction_3],
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.other_capex.row_view).toStrictEqual({
			headers: defaultDownHeader,
			rows: [exampleDownRow_1, exampleDownRow_2, exampleDownRow_3],
		});

		expect(doc.econ_function.other_capex).toStrictEqual({
			rows: [exampleDownEconFunction_1, exampleDownEconFunction_2, exampleDownEconFunction_3],
		});
	});
});
