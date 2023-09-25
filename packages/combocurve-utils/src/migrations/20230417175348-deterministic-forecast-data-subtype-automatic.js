// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const runUp = createBatchUpdate({
	collection: 'deterministic-forecast-datas',
	query: { forecastSubType: 'auto' },
	update: [
		{
			$set: {
				forecastSubType: 'automatic',
			},
		},
	],
});

async function up({ db }) {
	await runUp({ db });
}

// NOTE: down is empty since we are replacing values that are invalid with our schema; reverting the migration would not change the outcome
// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
function down() {}

module.exports = { up, down, uses: ['mongodb'] };
