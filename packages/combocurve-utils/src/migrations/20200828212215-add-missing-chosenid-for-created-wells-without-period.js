// const { Limiter, asyncSeries, log, paginator } = require('../services/helpers/utilities');

// const createBatchUpdate = ({ bucketSize = 1, dispatchesPerSecond = 4, pageSize = 500, query }) => {
// 	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });
// 	const paginate = paginator(pageSize);

// 	return async ({ db }) => {
// 		const dbCollection = db.collection('wells');
// 		const targetIds = await dbCollection.distinct('_id', query);
// 		const pages = paginate(targetIds);

// 		let batchProgress = 0;
// 		let totalModified = 0;
// 		log(`Need to update ${targetIds.length} 'wells'`);
// 		await asyncSeries(pages, async (batchIds) => {
// 			const batchDocs = await dbCollection.find({ ...query, _id: { $in: batchIds } }, { inptID: 1 }).toArray();
// 			log(`   Batch ${batchProgress + 1} / ${pages.length} [${batchIds.length}]`);
// 			const updates = batchDocs.map((doc) => ({
// 				updateOne: {
// 					filter: { _id: doc._id },
// 					update: {
// 						$set: {
// 							chosenID: doc.inptID.replace(/[^A-Za-z0-9]/g, ''),
// 							chosenKeyID: 'inptID',
// 							dataPool: 'internal',
// 							dataSource: 'other',
// 						},
// 					},
// 				},
// 			}));
// 			const { modifiedCount } = await limiter.next(() => dbCollection.bulkWrite(updates));
// 			batchProgress += 1;
// 			totalModified += modifiedCount;
// 			log(`   Updated: ${modifiedCount}, Total: ${totalModified} / ${targetIds.length}`);
// 		});
// 	};
// };

// const batchUpdateUp = createBatchUpdate({
// 	query: { generic: true, chosenID: { $eq: null } },
// });

// const up = ({ db }) => batchUpdateUp({ db });

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
