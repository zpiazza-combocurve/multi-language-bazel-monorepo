// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const fixedExpOption = {
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
	stop_at_econ_limit: {
		label: 'Yes',
		value: 'yes',
	},
	expense_before_fpd: {
		label: 'No',
		value: 'no',
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
	row_view: {
		headers: {
			fixed_expense: '$/Month',
			criteria: {
				label: 'Flat',
				value: 'entire_well_life',
			},
		},
		rows: [
			{
				fixed_expense: 0,
				criteria: 'Flat',
			},
		],
	},
	rate_type: {
		label: 'Gross Well Head',
		value: 'gross_well_head',
	},
	rows_calculation_method: {
		label: 'Non Monotonic',
		value: 'non_monotonic',
	},
};
const fixedExpEconFunction = {
	description: '',
	escalation_model: 'none',
	calculation: 'wi',
	affect_econ_limit: 'yes',
	stop_at_econ_limit: 'yes',
	expense_before_fpd: 'no',
	deduct_before_severance_tax: 'no',
	deduct_before_ad_val_tax: 'no',
	cap: '',
	deal_terms: 1,
	rows: [
		{
			fixed_expense: 0,
			entire_well_life: 'Flat',
		},
	],
	rate_type: 'gross_well_head',
	rows_calculation_method: 'non_monotonic',
};

async function up({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'expenses', 'options.fixed_expenses.other_monthly_cost_3': { $exists: false } },
		update: [
			{
				$set: {
					'options.fixed_expenses.other_monthly_cost_3.subItems': { $literal: fixedExpOption },
					'options.fixed_expenses.other_monthly_cost_4.subItems': { $literal: fixedExpOption },
					'options.fixed_expenses.other_monthly_cost_5.subItems': { $literal: fixedExpOption },
					'options.fixed_expenses.other_monthly_cost_6.subItems': { $literal: fixedExpOption },
					'options.fixed_expenses.other_monthly_cost_7.subItems': { $literal: fixedExpOption },
					'options.fixed_expenses.other_monthly_cost_8.subItems': { $literal: fixedExpOption },

					'econ_function.fixed_expenses.other_monthly_cost_3': { $literal: fixedExpEconFunction },
					'econ_function.fixed_expenses.other_monthly_cost_4': { $literal: fixedExpEconFunction },
					'econ_function.fixed_expenses.other_monthly_cost_5': { $literal: fixedExpEconFunction },
					'econ_function.fixed_expenses.other_monthly_cost_6': { $literal: fixedExpEconFunction },
					'econ_function.fixed_expenses.other_monthly_cost_7': { $literal: fixedExpEconFunction },
					'econ_function.fixed_expenses.other_monthly_cost_8': { $literal: fixedExpEconFunction },
				},
			},
		],
	});

	await batchUpdate({ db });
}

async function down({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'expenses', 'options.fixed_expenses.other_monthly_cost_3': { $exists: true } },
		update: [
			{
				$unset: [
					'options.fixed_expenses.other_monthly_cost_3',
					'options.fixed_expenses.other_monthly_cost_4',
					'options.fixed_expenses.other_monthly_cost_5',
					'options.fixed_expenses.other_monthly_cost_6',
					'options.fixed_expenses.other_monthly_cost_7',
					'options.fixed_expenses.other_monthly_cost_8',

					'econ_function.fixed_expenses.other_monthly_cost_3',
					'econ_function.fixed_expenses.other_monthly_cost_4',
					'econ_function.fixed_expenses.other_monthly_cost_5',
					'econ_function.fixed_expenses.other_monthly_cost_6',
					'econ_function.fixed_expenses.other_monthly_cost_7',
					'econ_function.fixed_expenses.other_monthly_cost_8',
				],
			},
		],
	});

	await batchUpdate({ db });
}

module.exports = { up, down, fixedExpOption, fixedExpEconFunction, uses: ['mongodb'] };
