// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'wells',
	query: { dataPool: 'internal', dataSource: 'other' },
	update: { $set: { dataSource: 'internal' } },
});

const batchUpdateDown = createBatchUpdate({
	collection: 'wells',
	query: { dataSource: 'internal' },
	update: { $set: { dataPool: 'internal', dataSource: 'other' } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
