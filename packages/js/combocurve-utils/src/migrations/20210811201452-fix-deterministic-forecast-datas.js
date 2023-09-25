// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUpRatio = createBatchUpdate({
	collection: 'deterministic-forecast-datas',
	query: { forecastType: 'ratio', 'ratio.segments.0': { $exists: false } },
	update: { $set: { forecastType: 'not_forecasted' } },
});

const batchUpdateUpRate = createBatchUpdate({
	collection: 'deterministic-forecast-datas',
	query: { forecastType: 'rate', 'P_dict.best.segments.0': { $exists: false } },
	update: { $set: { forecastType: 'not_forecasted' } },
});

async function up({ db }) {
	await batchUpdateUpRatio({ db });
	await batchUpdateUpRate({ db });
}

module.exports = { up, uses: ['mongodb'] };
