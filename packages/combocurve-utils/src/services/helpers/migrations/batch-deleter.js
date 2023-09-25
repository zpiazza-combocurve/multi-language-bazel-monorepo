// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { batchQuery } = require('./batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Limiter } = require('../utilities');

const createBatchDelete = ({
	query,
	collection: collectionName,
	batchSize = 5000,
	bucketSize = 1,
	dispatchesPerSecond = 4,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collection = db.collection(collectionName);

		await batchQuery({ collection, query, selection: { _id: 1 }, batchSize }, async (batch) => {
			const ids = batch.map(({ _id }) => _id);
			await limiter.next(() => collection.deleteMany({ _id: { $in: ids } }));
		});
	};
};

module.exports = { createBatchDelete };
