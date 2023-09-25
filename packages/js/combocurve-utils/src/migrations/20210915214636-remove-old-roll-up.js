// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreCollectionNotFound } = require('../services/helpers/mongo');

async function up({ db }) {
	const scenRollUpRunsCollection = db.collection('scen-roll-up-runs');
	const forecastRollUpRunsCollection = db.collection('forecast-roll-up-runs');

	await ignoreCollectionNotFound(() => scenRollUpRunsCollection.deleteMany({}));
	await ignoreCollectionNotFound(() => forecastRollUpRunsCollection.deleteMany({}));
}

module.exports = { up, uses: ['mongodb'] };
