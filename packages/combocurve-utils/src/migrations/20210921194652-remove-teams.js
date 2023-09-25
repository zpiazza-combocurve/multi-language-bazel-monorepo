// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreCollectionNotFound } = require('../services/helpers/mongo');

async function up({ db }) {
	const teamsCollection = db.collection('teams');

	await ignoreCollectionNotFound(() => teamsCollection.remove({}));
}

module.exports = { up, uses: ['mongodb'] };
