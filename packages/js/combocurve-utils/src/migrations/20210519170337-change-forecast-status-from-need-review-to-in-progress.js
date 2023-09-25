// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateForecastDatasUp = createBatchUpdate({
	collection: 'forecast-datas',
	query: { status: 'need_review' },
	update: { $set: { status: 'in_progress' } },
});

const batchUpdateDeterministicForecastDatasUp = createBatchUpdate({
	collection: 'deterministic-forecast-datas',
	query: { status: 'need_review' },
	update: { $set: { status: 'in_progress' } },
});

const batchUpdateForecastDatasDown = createBatchUpdate({
	collection: 'forecast-datas',
	query: { status: 'in_progress' },
	update: { $set: { status: 'need_review' } },
});

const batchUpdateDeterministicForecastDatasDown = createBatchUpdate({
	collection: 'deterministic-forecast-datas',
	query: { status: 'in_progress' },
	update: { $set: { status: 'need_review' } },
});

async function up({ db }) {
	await batchUpdateForecastDatasUp({ db });
	await batchUpdateDeterministicForecastDatasUp({ db });
}

async function down({ db }) {
	await batchUpdateForecastDatasDown({ db });
	await batchUpdateDeterministicForecastDatasDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
