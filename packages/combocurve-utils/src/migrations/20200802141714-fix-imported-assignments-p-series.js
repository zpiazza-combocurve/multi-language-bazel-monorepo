// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// // field mapping was generated using the following snippet:
// /*
// const { range } = require('combocurve-utils/collections');

// const MAX_QUALIFIERS = 10;
// const qualifierKeys = ['default', ...range(MAX_QUALIFIERS).map(i => `qualifier${i + 1}`)];
// const createMapping = () =>
// 	qualifierKeys.reduce((accumulator, qualifierKey) => {
// 		const path = `forecast_p_series.${qualifierKey}`;
// 		const oldPath = `${path}.percentile`;
// 		return {
// 			...accumulator,
// 			[path]: `$${oldPath}`,
// 		};
//     }, {});
// const $set = createMapping()
// */

// const $set = {
// 	'forecast_p_series.default': '$forecast_p_series.default.percentile',
// 	'forecast_p_series.qualifier1': '$forecast_p_series.qualifier1.percentile',
// 	'forecast_p_series.qualifier2': '$forecast_p_series.qualifier2.percentile',
// 	'forecast_p_series.qualifier3': '$forecast_p_series.qualifier3.percentile',
// 	'forecast_p_series.qualifier4': '$forecast_p_series.qualifier4.percentile',
// 	'forecast_p_series.qualifier5': '$forecast_p_series.qualifier5.percentile',
// 	'forecast_p_series.qualifier6': '$forecast_p_series.qualifier6.percentile',
// 	'forecast_p_series.qualifier7': '$forecast_p_series.qualifier7.percentile',
// 	'forecast_p_series.qualifier8': '$forecast_p_series.qualifier8.percentile',
// 	'forecast_p_series.qualifier9': '$forecast_p_series.qualifier9.percentile',
// 	'forecast_p_series.qualifier10': '$forecast_p_series.qualifier10.percentile',
// };

// const batchUpdate = createBatchUpdate({
// 	collection: 'scenario-well-assignments',
// 	query: { 'forecast_p_series.default': { $type: 'object' } },
// 	update: [{ $set }],
// });

// const up = ({ db }) => batchUpdate({ db });

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
