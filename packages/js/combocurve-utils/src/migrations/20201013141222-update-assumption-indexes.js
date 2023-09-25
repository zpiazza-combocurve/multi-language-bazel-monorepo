// const { ignoreIndexNotFound } = require('../services/helpers/mongo');

// const OLD_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX = 'project_1_name_1';
// const NEW_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX = 'project_1_assumptionKey_1_name_1';

// async function up({ db }) {
// 	const assumptions = db.collection('assumptions');
// 	await ignoreIndexNotFound(() => assumptions.dropIndex(OLD_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX));
// 	await assumptions.createIndex(
// 		{ project: 1, assumptionKey: 1, name: 1 },
// 		{ name: NEW_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX, unique: true }
// 	);
// }

// async function down({ db }) {
// 	const assumptions = db.collection('assumptions');
// 	await assumptions.createIndex(
// 		{ project: 1, name: 1 },
// 		{ name: OLD_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX, unique: true }
// 	);
// 	await ignoreIndexNotFound(() => assumptions.dropIndex(NEW_PROJECT_ASSUMPTION_KEY_NAME_UNIQUE_INDEX));
// }

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
