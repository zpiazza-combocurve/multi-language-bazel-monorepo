// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const batchUpdate = createBatchUpdate({
// 	collection: 'forecasts',
// 	query: { type: { $exists: false } },
// 	update: { $set: { type: 'probabilistic' } },
// });

// async function up({ db }) {
// 	await batchUpdate({ db });
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
