// const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

// const OLD_SCHEMA_VERSION = 2;
// const NEW_SCHEMA_VERSION = 3;

// const QUALIFIERS = [
// 	'default',
// 	'qualifier1',
// 	'qualifier2',
// 	'qualifier3',
// 	'qualifier4',
// 	'qualifier5',
// 	'qualifier6',
// 	'qualifier7',
// 	'qualifier8',
// 	'qualifier9',
// 	'qualifier10',
// ];

// const COLUMNS = [
// 	'capex',
// 	'dates',
// 	'expenses',
// 	'ownership_reversion',
// 	'pricing_differentials',
// 	'production_taxes',
// 	'production_vs_fit',
// 	'reserves_category',
// 	'risking',
// 	'stream_properties',
// 	'forecast',
// 	'forecast_p_series',
// 	'schedule',
// ];

// const getQualifiers = (column, suffixFrom, suffixTo) => {
// 	return QUALIFIERS.reduce(
// 		(accumulator, qualifier) => ({
// 			...accumulator,
// 			[`${column}.${qualifier}${suffixFrom}`]: `${column}.${qualifier}${suffixTo}`,
// 		}),
// 		{}
// 	);
// };

// const getRename = (suffixFrom, suffixTo) => {
// 	return COLUMNS.reduce(
// 		(accumulator, field) => ({
// 			...accumulator,
// 			...getQualifiers(field, suffixFrom, suffixTo),
// 		}),
// 		{}
// 	);
// };

// async function rename(db, suffixFrom = '', suffixTo = '', query = {}, schemaVersion) {
// 	const update = {
// 		$rename: getRename(suffixFrom, suffixTo),
// 	};

// 	if (schemaVersion) {
// 		update.$set = { schemaVersion };
// 	}

// 	const batchUpdate = createBatchUpdate({
// 		collection: 'scenario-well-assignments',
// 		pageSize: 5000,
// 		query,
// 		update,
// 	});

// 	await batchUpdate({ db });
// }

// function getOrQuery() {
// 	const $or = [];

// 	COLUMNS.forEach((column) => {
// 		QUALIFIERS.forEach((qualifier) => {
// 			$or.push({ [`${column}.${qualifier}_migration`]: { $exists: true } });
// 		});
// 	});

// 	return { $or };
// }

// async function up({ db }) {
// 	// we need to do it in two steps, otherwise we get a mongo error
// 	// from capex.default to capex.default_migration.model
// 	await rename(
// 		db,
// 		'',
// 		'_migration.model',
// 		{
// 			schemaVersion: { $ne: NEW_SCHEMA_VERSION },
// 		},
// 		NEW_SCHEMA_VERSION
// 	);
// 	// from capex.default_migration to capex.default.model
// 	await rename(db, '_migration', '', getOrQuery());
// }

// async function down({ db }) {
// 	await rename(
// 		db,
// 		'.model',
// 		'_migration',
// 		{
// 			schemaVersion: NEW_SCHEMA_VERSION,
// 		},
// 		OLD_SCHEMA_VERSION
// 	);

// 	await rename(db, '_migration', '', getOrQuery());
// }

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
