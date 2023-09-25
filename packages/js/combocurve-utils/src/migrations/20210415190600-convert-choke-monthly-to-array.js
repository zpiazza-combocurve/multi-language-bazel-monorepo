// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'monthly-productions',
	query: { choke: { $type: 'object' } },
	update: [
		{
			$set: {
				choke: [
					{ $ifNull: ['$choke.0', null] },
					{ $ifNull: ['$choke.1', null] },
					{ $ifNull: ['$choke.2', null] },
					{ $ifNull: ['$choke.3', null] },
					{ $ifNull: ['$choke.4', null] },
					{ $ifNull: ['$choke.5', null] },
					{ $ifNull: ['$choke.6', null] },
					{ $ifNull: ['$choke.7', null] },
					{ $ifNull: ['$choke.8', null] },
					{ $ifNull: ['$choke.9', null] },
					{ $ifNull: ['$choke.10', null] },
					{ $ifNull: ['$choke.11', null] },
				],
			},
		},
	],
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
