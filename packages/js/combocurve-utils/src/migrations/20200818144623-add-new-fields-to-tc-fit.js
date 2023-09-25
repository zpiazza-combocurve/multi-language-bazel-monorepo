// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const $set = {
// 	fitType: 'rate',
// 	ratio_P_dict: {
// 		P10: { segments: [], diagnostics: null, basePhase: null, x: 'time' },
// 		P50: { segments: [], diagnostics: null, basePhase: null, x: 'time' },
// 		P90: { segments: [], diagnostics: null, basePhase: null, x: 'time' },
// 		best: { segments: [], diagnostics: null, basePhase: null, x: 'time' },
// 	},
// };

// const batchUpdate = createBatchUpdate({
// 	collection: 'type-curve-fits',
// 	query: {
// 		fitType: { $exists: false },
// 	},
// 	update: [{ $set }],
// });

// async function up({ db }) {
// 	await batchUpdate({ db });
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
