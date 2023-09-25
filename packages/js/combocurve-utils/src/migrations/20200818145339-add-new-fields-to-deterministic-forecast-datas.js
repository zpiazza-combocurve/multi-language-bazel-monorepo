// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const $set = { 'ratio.diagnostics': null };
// const $unset = { 'ratio.targetPhase': '', 'ratio.enabled': '' };

// const batchUpdate = createBatchUpdate({
// 	collection: 'deterministic-forecast-datas',
// 	query: { 'ratio.diagnostics': { $exists: false } },
// 	update: { $set, $unset },
// });

// async function up({ db }) {
// 	await batchUpdate({ db });
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
