// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const addRegressionType = async ({ db }) => {
	// batchUpdate type curve documents
	await createBatchUpdate({
		collection: 'type-curves',
		query: {},
		update: [
			{
				$set: {
					regressionType: 'rate',
				},
			},
		],
	})({ db });

	// batchUpdate tc-fit documents
	await createBatchUpdate({
		collection: 'type-curve-fits',
		query: {},
		update: [
			{
				$set: {
					regressionType: 'rate',
				},
			},
		],
	})({ db });
};

const removeRegressionType = async ({ db }) => {
	// batchUpdate type curve documents
	await createBatchUpdate({
		collection: 'type-curves',
		query: {},
		update: [
			{
				$unset: 'regressionType',
			},
		],
	})({ db });

	// batchUpdate tc-fit documents
	await createBatchUpdate({
		collection: 'type-curve-fits',
		query: {},
		update: [
			{
				$unset: 'regressionType',
			},
		],
	})({ db });
};

async function up({ db }) {
	await addRegressionType({ db });
}

async function down({ db }) {
	await removeRegressionType({ db });
}

module.exports = { down, up, uses: ['mongodb'] };
