// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'forecasts',
	query: {
		$or: [
			{ 'comparisonIds.view': { $type: 'array' } },
			{ 'comparisonIds.manual': { $type: 'array' } },
			{ 'comparisonIds.diagnostics': { $type: 'array' } },
		],
	},
	update: { $unset: { comparisonIds: '' } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
