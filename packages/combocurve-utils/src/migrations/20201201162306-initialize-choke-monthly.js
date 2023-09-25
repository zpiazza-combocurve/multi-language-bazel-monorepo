// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'monthly-productions',
	query: { choke: { $exists: false } },
	update: { $set: { choke: Array(12).fill(null) } },
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
