// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'monthly-productions',
	query: { days_on: { $type: 'object' } },
	update: [
		{
			$set: {
				days_on: [
					{ $ifNull: ['$days_on.0', null] },
					{ $ifNull: ['$days_on.1', null] },
					{ $ifNull: ['$days_on.2', null] },
					{ $ifNull: ['$days_on.3', null] },
					{ $ifNull: ['$days_on.4', null] },
					{ $ifNull: ['$days_on.5', null] },
					{ $ifNull: ['$days_on.6', null] },
					{ $ifNull: ['$days_on.7', null] },
					{ $ifNull: ['$days_on.8', null] },
					{ $ifNull: ['$days_on.9', null] },
					{ $ifNull: ['$days_on.10', null] },
					{ $ifNull: ['$days_on.11', null] },
				],
			},
		},
	],
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
