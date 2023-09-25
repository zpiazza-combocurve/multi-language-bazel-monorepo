// const { get, groupBy } = require('../collections');

// const { paginator, asyncSeries, log } = require('../services/helpers/utilities');
// const { Limiter } = require('../services/helpers/utilities');

// const PAGE_SIZE = 200;

// const paginate = paginator(PAGE_SIZE);

// const limiter = new Limiter({ bucketSize: 1, dispatchesPerSecond: 4 });

// const QUALIFIER_FIELDS = [
// 	'forecast',
// 	'forecast_p_series',
// 	'schedule',
// 	'capex',
// 	'dates',
// 	'depreciation',
// 	'escalation',
// 	'expenses',
// 	'ownership_reversion',
// 	'pricing_differentials',
// 	'production_taxes',
// 	'production_vs_fit',
// 	'reserves_category',
// 	'risking',
// 	'stream_properties',
// ];

// const QUALIFIER_KEY_BASE = 'qualifier';

// async function up({ db }) {
// 	const dbScenarios = db.collection('scenarios');
// 	const dbAssignments = db.collection('scenario-well-assignments');
// 	const dbUmbrellas = db.collection('umbrellas');
// 	const dbUmbrellaDatas = db.collection('umbrella-datas');

// 	const allScenarioIds = await limiter.next(() => dbScenarios.distinct('_id', { schemaVersion: { $exists: false } }));

// 	/** migrate assignments */
// 	let progress = 0;

// 	await asyncSeries(allScenarioIds, async (scenarioId) => {
// 		const scenario = await limiter.next(() => dbScenarios.findOne({ _id: scenarioId }));
// 		if (!scenario) {
// 			// deleted while running migration
// 			progress += 1;
// 			return;
// 		}
// 		log(`Migrating: "${scenario.name}" (${progress + 1} / ${allScenarioIds.length})`);
// 		const umbrellas = await limiter.next(() => dbUmbrellas.find({ scenario: scenarioId }).toArray());

// 		const umbrellasByColumn = groupBy(umbrellas, 'column');
// 		const umbrellaToQualifierKey = umbrellas.reduce((accumulator, umbrella) => {
// 			const qualifierIndex = umbrellasByColumn[umbrella.column].indexOf(umbrella);
// 			const qualifierKey = `${QUALIFIER_KEY_BASE}${qualifierIndex + 1}`;
// 			return { ...accumulator, [umbrella._id.toString()]: qualifierKey };
// 		}, {});

// 		const oldAssignmentWellIds = await dbAssignments.distinct('well', {
// 			scenario: scenarioId,
// 			schemaVersion: { $exists: false },
// 		});
// 		const pages = paginate(oldAssignmentWellIds);
// 		const totalWells = oldAssignmentWellIds.length;
// 		let wellProgress = 0;

// 		await asyncSeries(pages, async (pageWellIds) => {
// 			const assignments = await limiter.next(() =>
// 				dbAssignments
// 					.find({
// 						scenario: scenarioId,
// 						well: { $in: pageWellIds },
// 						schemaVersion: { $exists: false },
// 					})
// 					.toArray()
// 			);
// 			const umbrellaDatas = await limiter.next(() =>
// 				dbUmbrellaDatas
// 					.find({
// 						scenario: scenarioId,
// 						well: { $in: pageWellIds },
// 					})
// 					.toArray()
// 			);
// 			const datasByColumn = groupBy(umbrellaDatas, 'column');

// 			const buildValue = (assignment, field) => {
// 				const fieldPath = field === 'forecast_p_series' ? 'forecast_p_series.percentile' : field;
// 				const datasByUmbrella = groupBy(datasByColumn[field] || [], 'umbrella');
// 				const qualifierValues = (umbrellasByColumn[field] || []).reduce(
// 					(accumulator, u) => ({
// 						...accumulator,
// 						[umbrellaToQualifierKey[u._id.toString()]]: get(
// 							(datasByUmbrella[u._id.toString()] || []).find(
// 								({ well }) => well.toString() === assignment.well.toString()
// 							),
// 							`value.${fieldPath}`,
// 							null
// 						),
// 					}),
// 					{}
// 				);
// 				return {
// 					...qualifierValues,
// 					default: get(assignment, fieldPath) || null,
// 				};
// 			};
// 			const updates = assignments.map((assign) => ({
// 				updateOne: {
// 					filter: { _id: assign._id },
// 					update: {
// 						$set: QUALIFIER_FIELDS.reduce(
// 							(accumulator, field) => ({
// 								...accumulator,
// 								[field]: buildValue(assign, field),
// 							}),
// 							{ schemaVersion: 2 }
// 						),
// 					},
// 				},
// 			}));

// 			if (updates.length > 0) {
// 				// this check is in case wells have been removed from scenario after migration started
// 				// needed since empty bulkWrite would fail
// 				await limiter.next(() => dbAssignments.bulkWrite(updates));
// 			}

// 			wellProgress += pageWellIds.length;
// 			log(`	Processed: ${wellProgress} / ${totalWells} assignments`);
// 		});

// 		/** migrate scenarios */

// 		const columns = QUALIFIER_FIELDS.reduce((accumulator, field) => {
// 			const activeUmbrella = scenario.activeUmbrellas && scenario.activeUmbrellas[field];
// 			return {
// 				...accumulator,
// 				[field]: {
// 					qualifiers: (umbrellasByColumn[field] || []).reduce(
// 						(prev, { _id, name, createdAt }) => ({
// 							...prev,
// 							[umbrellaToQualifierKey[_id.toString()]]: { name, createdAt },
// 						}),
// 						{ default: { name: 'Default' } }
// 					),
// 					activeQualifier: activeUmbrella ? umbrellaToQualifierKey[activeUmbrella] : 'default',
// 				},
// 			};
// 		}, {});
// 		const $set = { columns, schemaVersion: 2 };
// 		await limiter.next(() => dbScenarios.updateOne({ _id: scenarioId }, { $set }));
// 		progress += 1;
// 	});
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
