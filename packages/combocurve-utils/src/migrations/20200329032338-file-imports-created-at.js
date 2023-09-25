// const { asyncSeries, log } = require('../services/helpers/utilities');
// const { Limiter } = require('../services/helpers/utilities');

// const limiter = new Limiter({ bucketSize: 1, dispatchesPerSecond: 4 });

// const FALLBACK_DATE = new Date(Date.UTC(2020, 0, 1, 0, 1, 0));

// const getImportDate = (document) => document.events && document.events[0] && document.events[0].date;

// async function up({ db }) {
// 	const dbFileImports = db.collection('file-imports');

// 	const allIds = await limiter.next(() => dbFileImports.distinct('_id', { createdAt: { $exists: false } }));
// 	let progress = 0;

// 	await asyncSeries(allIds, async (importId) => {
// 		const document = await limiter.next(() =>
// 			dbFileImports.findOne({ _id: importId }, { projection: { description: 1, events: 1 } })
// 		);
// 		if (!document) {
// 			// deleted while running migration
// 			progress += 1;
// 			return;
// 		}
// 		log(`Migrating: "${document.description}" (${progress + 1} / ${allIds.length})`);
// 		const createdAt = getImportDate(document) || FALLBACK_DATE;
// 		await limiter.next(() => dbFileImports.updateOne({ _id: importId }, { $set: { createdAt } }));

// 		progress += 1;
// 	});
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
