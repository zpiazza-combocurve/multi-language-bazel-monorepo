// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUp = (collectionName) => {
	return createBatchUpdate({
		collection: collectionName,
		query: { visibility: { $exists: true } },
		update: { $unset: { visibility: '' } },
	});
};

const typeCurvesBatchUpdateUp = batchUpdateUp('type-curves');

const scenariosBatchUpdateUp = batchUpdateUp('scenarios');

const projectsBatchUpdateUp = batchUpdateUp('projects');

const forecastsBatchUpdateUp = batchUpdateUp('forecasts');

const assumptionsBatchUpdateUp = batchUpdateUp('assumptions');

const archivedProjectsBatchUpdateUp = batchUpdateUp('archived-projects');

async function up({ db }) {
	await typeCurvesBatchUpdateUp({ db });
	await scenariosBatchUpdateUp({ db });
	await projectsBatchUpdateUp({ db });
	await forecastsBatchUpdateUp({ db });
	await assumptionsBatchUpdateUp({ db });
	await archivedProjectsBatchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
