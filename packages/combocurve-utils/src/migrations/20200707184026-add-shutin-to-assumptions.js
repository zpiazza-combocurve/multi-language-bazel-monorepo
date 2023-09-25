// const { Limiter, asyncSeries, log, paginator } = require('../services/helpers/utilities');

// const limiter = new Limiter({ bucketSize: 1, dispatchesPerSecond: 4 });

// const PAGE_SIZE = 300;

// const paginate = paginator(PAGE_SIZE);

// const TARGET_QUERY = {
// 	assumptionKey: 'risking',
// 	'econ_function.shutIn': { $eq: null },
// 	'options.shutIn': { $eq: null },
// };

// const DEFAULT_OPTIONS_SHUT_IN = {
// 	row_view: {
// 		headers: {
// 			phase: 'Phase',
// 			criteria: {
// 				required: true,
// 				label: 'Dates',
// 				value: 'dates',
// 				fieldType: 'date-range-two',
// 				valType: 'datetime',
// 			},
// 			unit: 'Unit',
// 			multiplier: 'Multiplier',
// 			fixed_expense: 'Fixed Expense',
// 			capex: 'CAPEX',
// 		},
// 		rows: [],
// 	},
// };

// const DEFAULT_ECON_FUNCTION_SHUT_IN = {
// 	rows: [],
// };

// async function up({ db }) {
// 	// see: https://mongodb.github.io/node-mongodb-native/3.6/api/Db.html
// 	const dbAssumptions = db.collection('assumptions');

// 	const noShutInIds = await limiter.next(() => dbAssumptions.distinct('_id', TARGET_QUERY));
// 	const pages = paginate(noShutInIds);
// 	let batchProgress = 0;
// 	let totalProgress = 0;

// 	await asyncSeries(pages, async (assumptionIds) => {
// 		log(`Migrating: Batch ${batchProgress + 1} / ${pages.length} (${totalProgress} / ${noShutInIds.length})`);
// 		const result = await limiter.next(() =>
// 			dbAssumptions.updateMany(
// 				{ ...TARGET_QUERY, _id: { $in: noShutInIds } },
// 				{
// 					$set: {
// 						'econ_function.shutIn': DEFAULT_ECON_FUNCTION_SHUT_IN,
// 						'options.shutIn': DEFAULT_OPTIONS_SHUT_IN,
// 					},
// 				}
// 			)
// 		);
// 		batchProgress += 1;
// 		totalProgress += assumptionIds.length;
// 		log(`Updated: ${result.modifiedCount}`);
// 	});
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
