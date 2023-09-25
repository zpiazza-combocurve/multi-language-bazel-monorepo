// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchDelete } = require('../services/helpers/migrations/batch-deleter');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { log } = require('../services/helpers/utilities');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreIndexNotFound } = require('../services/helpers/mongo');

const PRICING_DIFFERENTIALS_KEY = 'pricing_differentials';
const PRICING_KEY = 'pricing';
const DIFFERENTIALS_KEY = 'differentials';

const typeCurveBatchUpdateUp = createBatchUpdate({
	collection: 'type-curves',
	query: { 'assumptions.pricing_differentials': { $exists: true } },
	update: {
		$unset: {
			'assumptions.pricing_differentials': '',
		},
	},
});

const typeCurveUmbrellaBatchUpdateUp = createBatchDelete({
	collection: 'type-curves-umbrellas',
	query: { column: `assumptions.${PRICING_DIFFERENTIALS_KEY}` },
});

const scenarioWellAssBatchUpdateUp = createBatchUpdate({
	collection: 'scenario-well-assignments',
	query: { pricing_differentials: { $exists: true } },
	update: {
		$unset: {
			pricing_differentials: '',
		},
	},
});

const lookupTablesBatchUpdateUp = createBatchUpdate({
	collection: 'lookup-tables',
	query: { 'rules.pricing_differentials': { $exists: true } },
	update: {
		$unset: {
			'rules.$[].pricing_differentials': '',
		},
	},
});

const scenariosBatchUpdateUp = createBatchUpdate({
	collection: 'scenarios',
	query: { 'columns.pricing_differentials': { $exists: true } },
	update: {
		$unset: {
			'columns.pricing_differentials': '',
		},
	},
});

const removeOriginalIdBatchUpdateUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		$and: [{ $or: [{ assumptionKey: PRICING_KEY }, { assumptionKey: DIFFERENTIALS_KEY }] }],
	},
	update: {
		$unset: {
			originalId: '',
		},
	},
});

const assumptionsBatchUpdateUp = createBatchDelete({
	collection: 'assumptions',
	query: { assumptionKey: PRICING_DIFFERENTIALS_KEY },
});

async function up({ db }) {
	log('Type Curve update');
	await typeCurveBatchUpdateUp({ db });

	log('Type Curve Umbrellas update');
	await typeCurveUmbrellaBatchUpdateUp({ db });

	log('Scenario Well Assignments update');
	await scenarioWellAssBatchUpdateUp({ db });

	log('Lookup Tables update');
	await lookupTablesBatchUpdateUp({ db });

	log('Scenarios update');
	await scenariosBatchUpdateUp({ db });

	log('Remove original Id from assumptions');
	await removeOriginalIdBatchUpdateUp({ db });

	log('Assumptions update');
	await assumptionsBatchUpdateUp({ db });

	const assumption = db.collection('assumptions');
	await ignoreIndexNotFound(() => assumption.dropIndex('originalId'));
}

module.exports = { up, uses: ['mongodb'] };
