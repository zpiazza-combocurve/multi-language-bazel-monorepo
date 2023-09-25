// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const normUp = createBatchUpdate({
	collection: 'type-curve-normalizations',
	query: { steps: { $exists: true }, 'steps.normalizationType': { $in: [null, 'no_normalization'] } },
	update: [
		{
			$set: {
				'steps.normalizationType': 'eur',
			},
		},
	],
});

async function up({ db }) {
	await normUp({ db });
}

// NOTE: down is empty since we are replacing values that are invalid with our schema; reverting the migration would not change the outcome
// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
function down() {}

module.exports = { up, down, uses: ['mongodb'] };
