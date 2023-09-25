// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUp = createBatchUpdate({
	collection: 'networks',
	query: {
		'nodes.params.completions': { $exists: true },
	},
	update: [
		{
			$set: {
				nodes: {
					$map: {
						input: '$nodes',
						as: 'node',
						in: {
							$mergeObjects: [
								'$$node',
								{
									params: {
										$mergeObjects: [
											'$$node.params',
											{
												completion: '$$node.params.completions',
											},
										],
									},
								},
							],
						},
					},
				},
			},
		},
		{ $unset: 'nodes.params.completions' },
	],
});

const batchDown = createBatchUpdate({
	collection: 'networks',
	query: {
		'nodes.params.completion': { $exists: true },
	},
	update: [
		{
			$set: {
				nodes: {
					$map: {
						input: '$nodes',
						as: 'node',
						in: {
							$mergeObjects: [
								'$$node',
								{
									params: {
										$mergeObjects: [
											'$$node.params',
											{
												completions: '$$node.params.completion',
											},
										],
									},
								},
							],
						},
					},
				},
			},
		},
		{ $unset: 'nodes.params.completion' },
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
