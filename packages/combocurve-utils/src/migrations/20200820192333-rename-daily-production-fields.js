// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater');

// const invert = (object) =>
// 	Object.keys(object).reduce((accumulator, key) => ({ ...accumulator, [object[key]]: key }), {});

// const getOr = (mapping) => Object.keys(mapping).map((key) => ({ [key]: { $exists: true } }));

// const upMapping = {
// 	// old: new
// 	shut_in_bh_pressure: 'gas_lift_injection_pressure',
// 	shut_in_csg_pressure: 'flowline_pressure',
// 	shut_in_tbg_pressure: 'vessel_separator_pressure',
// 	flowing_bh_pressure: 'bottom_hole_pressure ',
// 	flowing_csg_pressure: 'casing_head_pressure',
// 	flowing_tbg_pressure: 'tubing_head_pressure',
// };

// async function up({ db }) {
// 	const batchUpdate = createBatchUpdate({
// 		collection: 'daily-productions',
// 		pageSize: 700,
// 		query: { $or: getOr(upMapping) },
// 		update: { $rename: upMapping },
// 	});

// 	await batchUpdate({ db });
// }

// async function down({ db }) {
// 	const downMapping = invert(upMapping);
// 	const batchUpdate = createBatchUpdate({
// 		collection: 'daily-productions',
// 		pageSize: 700,
// 		query: { $or: getOr(downMapping) },
// 		update: { $rename: downMapping },
// 	});

// 	await batchUpdate({ db });
// }

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
