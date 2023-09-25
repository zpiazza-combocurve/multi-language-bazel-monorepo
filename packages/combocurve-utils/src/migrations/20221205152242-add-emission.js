// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultScenarioEmission = {
	activeQualifier: 'default',
	qualifiers: {
		default: {
			name: 'Default',
			createdAt: new Date(),
		},
	},
};

const defaultEmissionAssign = {
	default: {
		model: null,
		lookup: null,
		tcLookup: null,
	},
};

const batchUpAssignment = createBatchUpdate({
	collection: 'scenario-well-assignments',
	query: {
		emission: { $exists: false },
	},
	update: [
		{
			$set: {
				emission: defaultEmissionAssign,
			},
		},
	],
});

const batchUpScenario = createBatchUpdate({
	collection: 'scenarios',
	query: {
		'columns.emission': { $exists: false },
	},
	update: [
		{
			$set: {
				'columns.emission': defaultScenarioEmission,
			},
		},
	],
});

const batchDownAssignment = createBatchUpdate({
	collection: 'scenario-well-assignments',
	query: {
		emission: { $exists: true },
	},
	update: [
		{
			$unset: ['emission'],
		},
	],
});

const batchDownScenario = createBatchUpdate({
	collection: 'scenarios',
	query: {
		'columns.emission': { $exists: true },
	},
	update: [
		{
			$unset: ['columns.emission'],
		},
	],
});

async function up({ db }) {
	await batchUpAssignment({ db });
	await batchUpScenario({ db });
}

async function down({ db }) {
	await batchDownAssignment({ db });
	await batchDownScenario({ db });
}

module.exports = { up, down, defaultScenarioEmission, defaultEmissionAssign, uses: ['mongodb'] };
