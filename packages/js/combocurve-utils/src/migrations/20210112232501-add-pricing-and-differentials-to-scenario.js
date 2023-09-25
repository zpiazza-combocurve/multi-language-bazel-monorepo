// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate, createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const COLLECTION_NAME = 'scenarios';
const PRICING_PATH = 'columns.pricing';
const DIFFERENTIALS_PATH = 'columns.differentials';

const buildUpdates = (batch) =>
	batch.map(({ _id, columns }) => {
		const { pricing_differentials } = columns;
		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: {
						[PRICING_PATH]: pricing_differentials,
						[DIFFERENTIALS_PATH]: pricing_differentials,
					},
				},
			},
		};
	});

const batchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	selection: { columns: 1 },
	query: {},
	buildUpdates,
});

const batchUpdateDown = createBatchUpdate({
	collection: COLLECTION_NAME,
	query: {},
	update: {
		$unset: {
			[PRICING_PATH]: '',
			[DIFFERENTIALS_PATH]: '',
		},
	},
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
