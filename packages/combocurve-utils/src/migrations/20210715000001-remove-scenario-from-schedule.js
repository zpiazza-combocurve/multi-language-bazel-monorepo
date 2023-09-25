// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'schedules',
	query: { $or: [{ scenario: { $exists: true } }, { scenarioExpireAt: { $exists: true } }] },
	update: { $unset: { scenario: 1, scenarioExpireAt: 1 } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
