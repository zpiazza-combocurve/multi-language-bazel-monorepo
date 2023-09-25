// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'daily-productions',
	query: { operational_tag: { $exists: false } },
	update: { $set: { operational_tag: Array(31).fill(null) } },
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
