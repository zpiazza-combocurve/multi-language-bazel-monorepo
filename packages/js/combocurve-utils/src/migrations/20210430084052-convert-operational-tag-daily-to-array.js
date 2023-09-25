// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdate = createBatchUpdate({
	collection: 'daily-productions',
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
					{ $ifNull: ['$operational_tag.12', null] },
					{ $ifNull: ['$operational_tag.13', null] },
					{ $ifNull: ['$operational_tag.14', null] },
					{ $ifNull: ['$operational_tag.15', null] },
					{ $ifNull: ['$operational_tag.16', null] },
					{ $ifNull: ['$operational_tag.17', null] },
					{ $ifNull: ['$operational_tag.18', null] },
					{ $ifNull: ['$operational_tag.19', null] },
					{ $ifNull: ['$operational_tag.20', null] },
					{ $ifNull: ['$operational_tag.21', null] },
					{ $ifNull: ['$operational_tag.22', null] },
					{ $ifNull: ['$operational_tag.23', null] },
					{ $ifNull: ['$operational_tag.24', null] },
					{ $ifNull: ['$operational_tag.25', null] },
					{ $ifNull: ['$operational_tag.26', null] },
					{ $ifNull: ['$operational_tag.27', null] },
					{ $ifNull: ['$operational_tag.28', null] },
					{ $ifNull: ['$operational_tag.29', null] },
					{ $ifNull: ['$operational_tag.30', null] },
				],
			},
		},
	],
});

async function up({ db }) {
	await batchUpdate({ db });
}

module.exports = { up, uses: ['mongodb'] };
