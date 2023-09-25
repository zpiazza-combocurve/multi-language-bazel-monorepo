// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Types } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { entries, flatMap, groupBy, intersection, keyBy, keys, map, uniq } = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const { ObjectId } = Types;

const buildUpdates = async (batch, db) => {
	const forecastCollection = db.collection('forecasts');

	const forecastDocGroups = groupBy(batch, 'forecast');
	const dbForecasts = await forecastCollection
		.find(
			{
				_id: { $in: map(uniq(keys(forecastDocGroups)), (key) => new ObjectId(key)) },
			},
			'_id wells'
		)
		.toArray();

	if (dbForecasts && dbForecasts.length) {
		const forecasts = keyBy(dbForecasts, (doc) => doc._id.toString());

		const batches = flatMap(entries(forecastDocGroups), ([forecastId, docGroup]) => {
			if (forecasts[forecastId]) {
				const { wells: wellsInForecast } = forecasts[forecastId];
				return map(docGroup, (doc) => {
					const { _id, bucket } = doc;

					// only allow IDs that are part of the parent forecast document. the mismatch was due to project well removal not removing from the buckets
					const validIds = intersection(
						map(bucket, (wellId) => wellId.toString()),
						map(wellsInForecast, (wellId) => wellId.toString())
					);

					// ensure all values are ObjectIds; shouldn't be needed, just in case
					const validObjectIds = map(validIds, (id) => new ObjectId(id));
					return {
						updateOne: {
							filter: { _id: new ObjectId(_id) },
							update: {
								$set: {
									bucket: validObjectIds,
								},
							},
						},
					};
				});
			}

			// if forecast with forecastId no longer exists, return empty array. resolved by flattening
			return [];
		});

		return batches;
	}

	return [];
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'forecast-buckets',
	query: {},
	buildUpdates,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
