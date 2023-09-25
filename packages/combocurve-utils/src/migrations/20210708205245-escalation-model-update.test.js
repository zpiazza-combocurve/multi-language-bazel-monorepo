// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
const {
	up,
	down,
	EscalationFrequency,
	CalculationMethod,
	pctPerYear,
	dollarPerYear,
	pctPerMonth,
	dollarPerMonth,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./20210708205245-escalation-model-update');

let collection;
let db;
let mongod;
let client;

const escalation1 = {
	assumptionNumber: 1,
	assumptionKey: 'escalation',
	options: {
		escalation_model: {
			row_view: {
				headers: {
					escalation_value: dollarPerMonth,
					criteria: {
						label: 'Month Period',
						value: 'month_period',
					},
				},
				rows: [
					{
						escalation_value: 1,
						criteria: {
							start: 1,
							end: 12,
							period: 12,
						},
					},
					{
						escalation_value: 1.5,
						criteria: {
							start: 13,
							end: 24,
							period: 12,
						},
					},
				],
			},
		},
	},
	econ_function: {
		escalation_model: {
			rows: [
				{
					dollar_per_month: 1,
					month_period: {
						start: 1,
						end: 12,
						period: 12,
					},
				},
				{
					dollar_per_month: 1.5,
					month_period: {
						start: 13,
						end: 24,
						period: 12,
					},
				},
			],
		},
	},
};

const escalation2 = {
	assumptionNumber: 2,
	assumptionKey: 'escalation',
	options: {
		escalation_model: {
			row_view: {
				headers: {
					escalation_value: pctPerMonth,
					criteria: {
						label: 'Entire Well Life',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						escalation_value: 0.5,
						criteria: 'Entire Well Life',
					},
				],
			},
		},
	},
	econ_function: {
		escalation_model: {
			rows: [
				{
					pct_per_month: 0.5,
					entire_well_life: 'Entire Well Life',
				},
			],
		},
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

describe('20210331000407-update-cutoff', () => {
	test('works', async () => {
		await collection.insertMany([escalation1, escalation2]);

		await up({ db });
		await up({ db }); // test idempotence

		let esca1 = await collection.findOne({ assumptionNumber: 1 });
		let esca2 = await collection.findOne({ assumptionNumber: 2 });

		expect(esca1.options.escalation_model.escalation_frequency).toStrictEqual(EscalationFrequency);
		expect(esca1.options.escalation_model.calculation_method).toStrictEqual(CalculationMethod);
		expect(esca2.options.escalation_model.escalation_frequency).toStrictEqual(EscalationFrequency);
		expect(esca2.options.escalation_model.calculation_method).toStrictEqual(CalculationMethod);

		expect(esca1.econ_function.escalation_model.escalation_frequency).toEqual('constant');
		expect(esca1.econ_function.escalation_model.calculation_method).toEqual('compound');
		expect(esca2.econ_function.escalation_model.escalation_frequency).toEqual('constant');
		expect(esca2.econ_function.escalation_model.calculation_method).toEqual('compound');

		if (escalation1.options.escalation_model.row_view.headers.escalation_value.value === 'pct_per_month') {
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(esca1.options.escalation_model.row_view.headers.escalation_value).toEqual(pctPerYear);
		} else {
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(esca1.options.escalation_model.row_view.headers.escalation_value).toEqual(dollarPerYear);
		}

		if (escalation2.options.escalation_model.row_view.headers.escalation_value.value === 'pct_per_month') {
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(esca2.options.escalation_model.row_view.headers.escalation_value).toEqual(pctPerYear);
		} else {
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(esca2.options.escalation_model.row_view.headers.escalation_value).toEqual(dollarPerYear);
		}

		esca1.options.escalation_model.row_view.rows.forEach((row, i) => {
			expect(row).toHaveProperty(
				'escalation_value',
				escalation1.options.escalation_model.row_view.rows[i].escalation_value * 12
			);
		});

		esca2.options.escalation_model.row_view.rows.forEach((row, i) => {
			expect(row).toHaveProperty(
				'escalation_value',
				escalation2.options.escalation_model.row_view.rows[i].escalation_value * 12
			);
		});

		await down({ db });
		await down({ db }); // test idempotence

		esca1 = await collection.findOne({ assumptionNumber: 1 });
		esca2 = await collection.findOne({ assumptionNumber: 2 });

		expect(esca1).toEqual(escalation1);
		expect(esca2).toEqual(escalation2);
	});
});
