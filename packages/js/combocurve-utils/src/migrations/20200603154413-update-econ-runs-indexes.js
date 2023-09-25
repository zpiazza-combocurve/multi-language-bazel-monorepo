// const OLD_USER_INDEX = 'user_1';
// const NEW_SCENARIO_USER_INDEX = 'scenario_1_user_1';

// async function up({ db }) {
// 	const econRuns = db.collection('econ-runs');
// 	await econRuns.dropIndex(OLD_USER_INDEX);
// 	await econRuns.createIndex({ scenario: 1, user: 1 }, { name: NEW_SCENARIO_USER_INDEX, unique: true });
// }

// async function down({ db }) {
// 	const econRuns = db.collection('econ-runs');
// 	await econRuns.createIndex({ user: 1 }, { name: OLD_USER_INDEX, unique: true });
// 	await econRuns.dropIndex(NEW_SCENARIO_USER_INDEX);
// }

// module.exports = { up, down, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
