// const { ignoreCollectionNotFound } = require('../services/helpers/mongo');

// async function up({ db }) {
// 	await ignoreCollectionNotFound(() => db.collection('umbrellas').drop());
// 	await ignoreCollectionNotFound(() => db.collection('umbrella-datas').drop());
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
