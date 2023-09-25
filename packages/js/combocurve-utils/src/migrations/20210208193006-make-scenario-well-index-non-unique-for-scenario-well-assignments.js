// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreCollectionNotFound, ignoreIndexNotFound } = require('../services/helpers/mongo');

const SCENARIO_WELL_INDEX = 'scenario_1_well_1';

async function up({ db }) {
	const scenarioWellAssignments = db.collection('scenario-well-assignments');
	await ignoreCollectionNotFound(() =>
		ignoreIndexNotFound(() => scenarioWellAssignments.dropIndex(SCENARIO_WELL_INDEX))
	);
	await ignoreCollectionNotFound(() =>
		scenarioWellAssignments.createIndex({ scenario: 1, well: 1 }, { name: SCENARIO_WELL_INDEX })
	);
}

async function down({ db }) {
	const scenarioWellAssignments = db.collection('scenario-well-assignments');
	await ignoreCollectionNotFound(() =>
		ignoreIndexNotFound(() => scenarioWellAssignments.dropIndex(SCENARIO_WELL_INDEX))
	);
	await ignoreCollectionNotFound(() =>
		scenarioWellAssignments.createIndex({ scenario: 1, well: 1 }, { name: SCENARIO_WELL_INDEX, unique: true })
	);
}

module.exports = { up, down, uses: ['mongodb'] };
