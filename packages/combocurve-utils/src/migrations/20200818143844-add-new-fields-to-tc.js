// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const $set = {
// 	tcType: 'rate',
// 	basePhase: null,
// 	phaseType: { oil: 'rate', gas: 'rate', water: 'rate' },
// };

// const batchUpdate = createBatchUpdate({
// 	collection: 'type-curves',
// 	query: {
// 		tcType: { $exists: false },
// 	},
// 	update: [{ $set }],
// });

// async function up({ db }) {
// 	await batchUpdate({ db });
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
