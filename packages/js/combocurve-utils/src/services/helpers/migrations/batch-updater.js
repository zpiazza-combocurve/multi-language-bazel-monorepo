// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Limiter, asyncSeries, log, paginator } = require('../utilities');

const createBatchUpdate = ({
	bucketSize = 1,
	collection: collectionName,
	dispatchesPerSecond = 4,
	pageSize = 1000,
	query,
	update,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });
	const paginate = paginator(pageSize);

	return async ({ db }) => {
		const dbCollection = db.collection(collectionName);
		const targetIds = await dbCollection.distinct('_id', query);
		const pages = paginate(targetIds);

		let batchProgress = 0;
		let totalModified = 0;
		log(`Need to update ${targetIds.length} '${collectionName}'`);
		await asyncSeries(pages, async (batchIds) => {
			log(`   Batch ${batchProgress + 1} / ${pages.length} [${batchIds.length}]`);
			const { modifiedCount } = await limiter.next(() =>
				dbCollection.updateMany({ ...query, _id: { $in: batchIds } }, update)
			);
			batchProgress += 1;
			totalModified += modifiedCount;
			log(`   Updated: ${modifiedCount}, Total: ${totalModified} / ${targetIds.length}`);
		});
	};
};

module.exports = { createBatchUpdate };
