// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'econ-combo-settings',
	query: { 'combos.qualifiers.pricing_differentials': { $exists: true } },
	update: {
		$unset: {
			'combos.$[].qualifiers.pricing_differentials': '',
		},
	},
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
