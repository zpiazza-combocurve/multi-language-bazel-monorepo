// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = createBatchUpdate({
	collection: 'forecast-datas',
	query: {
		'P_dict.P10.segments.0': { $exists: false },
		'P_dict.P50.segments.0': { $exists: false },
		'P_dict.P90.segments.0': { $exists: false },
		'P_dict.best.segments.0': { $exists: false },
	},
	update: { $set: { forecastType: 'not_forecasted', P_dict: {} } },
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
