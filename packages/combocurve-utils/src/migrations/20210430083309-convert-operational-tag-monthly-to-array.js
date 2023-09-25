// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'monthly-productions',
	query: { operational_tag: { $type: 'object' } },
	update: [
		{
			$set: {
				operational_tag: [
					{ $ifNull: ['$operational_tag.0', null] },
					{ $ifNull: ['$operational_tag.1', null] },
					{ $ifNull: ['$operational_tag.2', null] },
					{ $ifNull: ['$operational_tag.3', null] },
					{ $ifNull: ['$operational_tag.4', null] },
					{ $ifNull: ['$operational_tag.5', null] },
					{ $ifNull: ['$operational_tag.6', null] },
					{ $ifNull: ['$operational_tag.7', null] },
					{ $ifNull: ['$operational_tag.8', null] },
					{ $ifNull: ['$operational_tag.9', null] },
					{ $ifNull: ['$operational_tag.10', null] },
					{ $ifNull: ['$operational_tag.11', null] },
				],
			},
		},
	],
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
