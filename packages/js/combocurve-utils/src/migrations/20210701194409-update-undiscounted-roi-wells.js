// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const INITIAL_SCHEMA_VERSION = 1;

const batchUpdateUp = createBatchUpdate({
	collection: 'wells',
	query: { schemaVersion: { $exists: false } },
	update: [
		{
			$set: {
				undiscounted_roi: { $multiply: ['$undiscounted_roi', 0.01] },
				schemaVersion: INITIAL_SCHEMA_VERSION,
			},
		},
	],
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

const batchUpdateDown = createBatchUpdate({
	collection: 'wells',
	query: { schemaVersion: { $eq: INITIAL_SCHEMA_VERSION } },
	update: [
		{
			$set: {
				undiscounted_roi: { $multiply: ['$undiscounted_roi', 100] },
			},
		},
		{
			$unset: 'schemaVersion',
		},
	],
});

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
