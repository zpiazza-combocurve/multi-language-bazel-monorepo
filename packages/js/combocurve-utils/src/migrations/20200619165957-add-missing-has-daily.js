// const { Limiter, asyncSeries, log, paginator } = require('../services/helpers/utilities');

// const limiter = new Limiter({ bucketSize: 1, dispatchesPerSecond: 4 });

// const PAGE_SIZE = 300;

// const paginate = paginator(PAGE_SIZE);

// async function up({ db }) {
// 	const dbWells = db.collection('wells');

// 	const noHasDailyIds = await limiter.next(() => dbWells.distinct('_id', { has_daily: { $eq: null } }));
// 	const pages = paginate(noHasDailyIds);
// 	let batchProgress = 0;
// 	let totalProgress = 0;

// 	await asyncSeries(pages, async (wellIds) => {
// 		log(`Migrating: Batch ${batchProgress + 1} / ${pages.length} (${totalProgress} / ${noHasDailyIds.length}) ...`);
// 		const result = await limiter.next(() =>
// 			dbWells.updateMany({ _id: { $in: wellIds }, has_daily: { $eq: null } }, { $set: { has_daily: false } })
// 		);
// 		batchProgress += 1;
// 		totalProgress += wellIds.length;
// 		log(`Updated: ${result.modifiedCount}`);
// 	});
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
