// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const normUp = (document) => {
	const set = document?.normalization_multipliers?.map((element) => ({
		qPeak: isNaN(element?.qPeak) ? null : element?.qPeak,
		eur: isNaN(element?.eur) ? 1 : element?.eur,
	}));

	return {
		updateOne: {
			filter: { _id: document._id },
			update: {
				$set: { normalization_multipliers: set },
			},
		},
	};
};

async function up({ db }) {
	await createBatchBulkUpdate({
		collection: 'proximity-forecast-datas',
		query: {
			$or: [{ 'normalization_multipliers.qPeak': NaN }, { 'normalization_multipliers.eur': NaN }],
		},
		buildUpdates: (batch) => batch.map((doc) => normUp(doc)),
	})({ db });
}

// NOTE: down is empty since we are replacing values that are invalid with our schema; reverting the migration would not change the outcome
// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up, uses: ['mongodb'] };
