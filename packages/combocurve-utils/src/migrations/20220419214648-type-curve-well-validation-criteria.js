// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'type-curves',
	query: { wellValidationCriteria: { $exists: false } },
	update: { $set: { wellValidationCriteria: 'must_have_prod_and_forecast' } },
});

const batchUpdateDown = createBatchUpdate({
	collection: 'type-curves',
	query: { wellValidationCriteria: { $exists: true } },
	update: { $unset: { wellValidationCriteria: '' } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
