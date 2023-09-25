// // This migration was reverted and rewritten as: 20200828212215-add-missing-chosenid-for-created-wells-without-period.js
// /*
// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const $set = {
// 	chosenID: '$inptID',
// 	chosenKeyID: 'inptID',
// 	dataPool: 'internal',
// 	dataSource: 'other',
// };

// const batchUpdateUp = createBatchUpdate({
// 	collection: 'wells',
// 	query: { generic: true, chosenID: { $eq: null } },
// 	update: [{ $set }],
// });

// const downQuery = { generic: true, $expr: { $eq: ['$inptID', '$chosenID'] } };
// const batchUpdateDown = createBatchUpdate({
// 	collection: 'wells',
// 	query: downQuery,
// 	update: { $unset: { chosenID: '', chosenKeyID: '' } },
// });

// const up = ({ db }) => batchUpdateUp({ db });

// const down = ({ db }) => batchUpdateDown({ db });
// */

// const up = () => Promise.resolve();

// const down = () => Promise.resolve();

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
