// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

async function up({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'wells',
		query: { section: { $exists: true, $ne: null } },
		update: [{ $set: { section: { $toString: '$section' } } }],
	});

	await batchUpdate({ db });
}

async function down({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'wells',
		query: { section: { $exists: true, $ne: null } },
		update: [{ $set: { section: { $toDouble: '$section' } } }],
	});

	await batchUpdate({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
