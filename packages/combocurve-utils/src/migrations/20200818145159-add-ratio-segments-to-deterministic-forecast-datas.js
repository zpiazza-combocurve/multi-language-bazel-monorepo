// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const $set = { 'ratio.segments': [] };

// const batchUpdate = createBatchUpdate({
// 	collection: 'deterministic-forecast-datas',
// 	query: { 'ratio.segments': { $exists: false } },
// 	update: [{ $set }],
// });

// async function up({ db }) {
// 	await batchUpdate({ db });
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
