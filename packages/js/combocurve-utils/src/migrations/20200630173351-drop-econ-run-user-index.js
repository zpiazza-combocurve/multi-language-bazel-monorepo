// const { ignoreIndexNotFound } = require('../services/helpers/mongo');

// const OLD_USER_INDEX = 'user_1';

// async function up({ db }) {
// 	const econRuns = db.collection('econ-runs');
// 	await ignoreIndexNotFound(() => econRuns.dropIndex(OLD_USER_INDEX));
// }

// async function down({ db }) {
// 	const econRuns = db.collection('econ-runs');
// 	await econRuns.createIndex({ user: 1 }, { name: OLD_USER_INDEX, unique: true });
// }

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
