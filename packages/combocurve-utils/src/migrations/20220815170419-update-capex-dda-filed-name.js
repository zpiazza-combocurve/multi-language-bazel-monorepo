// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'capex',
		'options.other_capex.row_view.headers.depreciation_model': { $in: ['Depreciation'] },
	},
	update: [
		{
			$set: {
				'options.other_capex.row_view.headers.depreciation_model': 'DD&A',
			},
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'capex',
		'options.other_capex.row_view.headers.depreciation_model': { $nin: ['Depreciation'] },
	},
	update: [
		{
			$set: {
				'options.other_capex.row_view.headers.depreciation_model': 'Depreciation',
			},
		},
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
