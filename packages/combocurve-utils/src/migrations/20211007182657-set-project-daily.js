// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const getUpdate = (doc) => {
	const { _id, project } = doc;

	return {
		updateMany: {
			filter: { well: _id, project: { $exists: false } },
			update: { $set: { project } },
		},
	};
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'wells',
	selection: { project: 1 },
	batchSize: 1000,
	query: { project: { $ne: null } },
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)),
	toWriteCollection: 'daily-productions',
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
