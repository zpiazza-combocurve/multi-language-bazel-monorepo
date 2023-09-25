// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const carbonExpenseOption = {
	category: {
		label: 'CO2e',
		value: 'co2e',
	},
	co2e: {
		subItems: {
			description: '',
			escalation_model: {
				label: 'None',
				value: 'none',
			},
			calculation: {
				label: 'WI',
				value: 'wi',
			},
			affect_econ_limit: {
				label: 'Yes',
				value: 'yes',
			},
			deduct_before_severance_tax: {
				label: 'No',
				value: 'no',
			},
			deduct_before_ad_val_tax: {
				label: 'No',
				value: 'no',
			},
			cap: '',
			deal_terms: 1,
			rate_type: {
				label: 'Gross Well Head',
				value: 'gross_well_head',
			},
			rows_calculation_method: {
				label: 'Non Monotonic',
				value: 'non_monotonic',
			},
			row_view: {
				headers: {
					carbon_expense: { $literal: '$/MT' },
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						carbon_expense: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	co2: {
		subItems: {
			description: '',
			escalation_model: {
				label: 'None',
				value: 'none',
			},
			calculation: {
				label: 'WI',
				value: 'wi',
			},
			affect_econ_limit: {
				label: 'Yes',
				value: 'yes',
			},
			deduct_before_severance_tax: {
				label: 'No',
				value: 'no',
			},
			deduct_before_ad_val_tax: {
				label: 'No',
				value: 'no',
			},
			cap: '',
			deal_terms: 1,
			rate_type: {
				label: 'Gross Well Head',
				value: 'gross_well_head',
			},
			rows_calculation_method: {
				label: 'Non Monotonic',
				value: 'non_monotonic',
			},
			row_view: {
				headers: {
					carbon_expense: { $literal: '$/MT' },
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						carbon_expense: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	ch4: {
		subItems: {
			description: '',
			escalation_model: {
				label: 'None',
				value: 'none',
			},
			calculation: {
				label: 'WI',
				value: 'wi',
			},
			affect_econ_limit: {
				label: 'Yes',
				value: 'yes',
			},
			deduct_before_severance_tax: {
				label: 'No',
				value: 'no',
			},
			deduct_before_ad_val_tax: {
				label: 'No',
				value: 'no',
			},
			cap: '',
			deal_terms: 1,
			rate_type: {
				label: 'Gross Well Head',
				value: 'gross_well_head',
			},
			rows_calculation_method: {
				label: 'Non Monotonic',
				value: 'non_monotonic',
			},
			row_view: {
				headers: {
					carbon_expense: { $literal: '$/MT' },
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						carbon_expense: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	n2o: {
		subItems: {
			description: '',
			escalation_model: {
				label: 'None',
				value: 'none',
			},
			calculation: {
				label: 'WI',
				value: 'wi',
			},
			affect_econ_limit: {
				label: 'Yes',
				value: 'yes',
			},
			deduct_before_severance_tax: {
				label: 'No',
				value: 'no',
			},
			deduct_before_ad_val_tax: {
				label: 'No',
				value: 'no',
			},
			cap: '',
			deal_terms: 1,
			rate_type: {
				label: 'Gross Well Head',
				value: 'gross_well_head',
			},
			rows_calculation_method: {
				label: 'Non Monotonic',
				value: 'non_monotonic',
			},
			row_view: {
				headers: {
					carbon_expense: { $literal: '$/MT' },
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						carbon_expense: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
};

const carbonExpenseEconFunction = {
	category: 'co2e',
	co2e: {
		description: '',
		escalation_model: 'none',
		calculation: 'wi',
		affect_econ_limit: 'yes',
		deduct_before_severance_tax: 'no',
		deduct_before_ad_val_tax: 'no',
		cap: '',
		deal_terms: 1,
		rate_type: 'gross_well_head',
		rows_calculation_method: 'non_monotonic',
		rows: [
			{
				carbon_expense: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	co2: {
		description: '',
		escalation_model: 'none',
		calculation: 'wi',
		affect_econ_limit: 'yes',
		deduct_before_severance_tax: 'no',
		deduct_before_ad_val_tax: 'no',
		cap: '',
		deal_terms: 1,
		rate_type: 'gross_well_head',
		rows_calculation_method: 'non_monotonic',
		rows: [
			{
				carbon_expense: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	ch4: {
		description: '',
		escalation_model: 'none',
		calculation: 'wi',
		affect_econ_limit: 'yes',
		deduct_before_severance_tax: 'no',
		deduct_before_ad_val_tax: 'no',
		cap: '',
		deal_terms: 1,
		rate_type: 'gross_well_head',
		rows_calculation_method: 'non_monotonic',
		rows: [
			{
				carbon_expense: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	n2o: {
		description: '',
		escalation_model: 'none',
		calculation: 'wi',
		affect_econ_limit: 'yes',
		deduct_before_severance_tax: 'no',
		deduct_before_ad_val_tax: 'no',
		cap: '',
		deal_terms: 1,
		rate_type: 'gross_well_head',
		rows_calculation_method: 'non_monotonic',
		rows: [
			{
				carbon_expense: 0,
				entire_well_life: 'Flat',
			},
		],
	},
};

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'expenses',
		'econ_function.carbon_expenses': { $exists: false },
	},
	update: [
		{
			$set: {
				'options.carbon_expenses': carbonExpenseOption,
				'econ_function.carbon_expenses': carbonExpenseEconFunction,
			},
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'expenses',
		'econ_function.carbon_expenses': { $exists: true },
	},
	update: [
		{
			$unset: ['options.carbon_expenses', 'econ_function.carbon_expenses'],
		},
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, uses: ['mongodb'], carbonExpenseOption, carbonExpenseEconFunction };
