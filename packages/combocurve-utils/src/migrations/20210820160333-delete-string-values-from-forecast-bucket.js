// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'forecast-buckets',
	query: { bucket: { $type: 'string' } },
	update: { $pull: { bucket: { $type: 'string' } } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
