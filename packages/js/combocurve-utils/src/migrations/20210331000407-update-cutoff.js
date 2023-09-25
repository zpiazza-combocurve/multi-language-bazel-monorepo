// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'dates', 'options.cut_off.include_capex': { $exists: false } },
	update: [
		{
			$set: {
				'options.cut_off.include_capex': {
					label: 'No',
					value: 'no',
				},
				'options.cut_off.discount': 0,
				'options.cut_off.econ_limit_delay': 0,
				'econ_function.cut_off.include_capex': 'no',
				'econ_function.cut_off.discount': 0,
				'econ_function.cut_off.econ_limit_delay': 0,
			},
		},
	],
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

const batchUpdateDown = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'dates', 'options.cut_off.include_capex': { $exists: true } },
	update: [
		{
			$unset: [
				'options.cut_off.include_capex',
				'options.cut_off.discount',
				'options.cut_off.econ_limit_delay',
				'econ_function.cut_off.include_capex',
				'econ_function.cut_off.discount',
				'econ_function.cut_off.econ_limit_delay',
			],
		},
	],
});

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
