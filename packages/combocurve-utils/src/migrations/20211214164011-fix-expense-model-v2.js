// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const fixExpense = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'expenses',
		'options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.headers.criteria.value': {
			$in: ['dates', 'offset_to_as_of_date', 'offset_to_fpd'],
		},
		'options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.rows': { $size: 1 },
		'options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.rows.0.unit_cost': 0,
		'options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.rows.0.criteria': {
			$in: ['Entire Well Life', 'Flat'],
		},
	},
	update: {
		$set: {
			'options.variable_expenses.drip_condensate.subItems.other.subItems.row_view.headers.criteria': {
				label: 'Flat',
				value: 'entire_well_life',
			},
			'econ_function.variable_expenses.drip_condensate.other.rows': [
				{
					dollar_per_bbl: 0,
					entire_well_life: 'Flat',
				},
			],
		},
	},
});

async function up({ db }) {
	await fixExpense({ db });
}

module.exports = { up, uses: ['mongodb'] };
