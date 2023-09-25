// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

async function up({ db }) {
	const forecastIds = (await db.collection('forecasts').find({}, { _id: 1 }).toArray()).map(({ _id }) => _id);
	const existingForecastIdsSet = new Set(forecastIds.map((id) => id.toString()));

	const buildUpdates = (batch) =>
		batch
			.map(({ _id, comparisonIds }) => {
				const forecastIdsToRemove = [];

				[('manual', 'view', 'diagnostics')].forEach((type) => {
					if (comparisonIds && comparisonIds[type] && comparisonIds[type].ids) {
						comparisonIds[type].ids.forEach((id) => {
							if (!existingForecastIdsSet.has(id.toString())) {
								forecastIdsToRemove.push(id);
							}
						});
					}
				});

				if (forecastIdsToRemove.length === 0) {
					return undefined;
				}

				return {
					updateOne: {
						filter: { _id },
						update: {
							$pull: {
								'comparisonIds.view.ids': { $in: forecastIdsToRemove },
								'comparisonIds.manual.ids': { $in: forecastIdsToRemove },
								'comparisonIds.diagnostics.ids': { $in: forecastIdsToRemove },
							},
							$unset: {
								...forecastIdsToRemove.reduce(
									(acc, val) => ({
										...acc,
										[`comparisonIds.view.resolutions.${val}`]: '',
										[`comparisonIds.manual.resolutions.${val}`]: '',
										[`comparisonIds.diagnostics.resolutions.${val}`]: '',
									}),
									{}
								),
							},
						},
					},
				};
			})
			.filter(Boolean);

	const batchUpdateUp = createBatchBulkUpdate({
		collection: 'forecasts',
		selection: { comparisonIds: 1 },
		query: {},
		buildUpdates,
	});

	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
