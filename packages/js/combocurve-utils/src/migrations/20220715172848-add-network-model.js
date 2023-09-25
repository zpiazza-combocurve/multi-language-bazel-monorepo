// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultScenarioNetwork = {
	activeQualifier: 'default',
	qualifiers: {
		default: {
			name: 'Default',
			createdAt: new Date(),
		},
	},
};

const defaultNetworkAssign = {
	default: {
		model: null,
		lookup: null,
		tcLookup: null,
	},
};

const batchUpAssignment = createBatchUpdate({
	collection: 'scenario-well-assignments',
	query: {
		network: { $exists: false },
	},
	update: [
		{
			$set: {
				network: defaultNetworkAssign,
			},
		},
	],
});

const batchUpScenario = createBatchUpdate({
	collection: 'scenarios',
	query: {
		'columns.network': { $exists: false },
	},
	update: [
		{
			$set: {
				'columns.network': defaultScenarioNetwork,
			},
		},
	],
});

const batchDownAssignment = createBatchUpdate({
	collection: 'scenario-well-assignments',
	query: {
		network: { $exists: true },
	},
	update: [
		{
			$unset: ['network'],
		},
	],
});

const batchDownScenario = createBatchUpdate({
	collection: 'scenarios',
	query: {
		'columns.network': { $exists: true },
	},
	update: [
		{
			$unset: ['columns.network'],
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

module.exports = { up, down, defaultScenarioNetwork, defaultNetworkAssign, uses: ['mongodb'] };
