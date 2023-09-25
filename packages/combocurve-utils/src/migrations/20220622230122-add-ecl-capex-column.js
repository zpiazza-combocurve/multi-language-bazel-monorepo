// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'capex',
		'options.other_capex.row_view.headers.after_econ_limit': { $exists: false },
	},
	update: [
		{
			$set: {
				'options.other_capex.row_view.headers.after_econ_limit': 'Appear After Econ Limit',
				'options.other_capex.row_view.rows': {
					$map: {
						input: '$options.other_capex.row_view.rows',
						as: 'a',
						in: {
							$cond: {
								if: {
									$or: [
										{ $in: ['$$a.category.value', ['salvage', 'abandonment']] },
										{ $eq: ['$$a.criteria.criteria.value', 'offset_to_econ_limit'] },
									],
								},
								then: {
									$mergeObjects: [
										{
											after_econ_limit: {
												label: 'Yes',
												value: 'yes',
												na: 'yes',
											},
										},
										'$$a',
									],
								},
								else: {
									$mergeObjects: [
										{
											after_econ_limit: {
												label: 'Yes',
												value: 'yes',
											},
										},
										'$$a',
									],
								},
							},
						},
					},
				},
				'econ_function.other_capex.rows': {
					$map: {
						input: '$econ_function.other_capex.rows',
						as: 'b',
						in: {
							$mergeObjects: [
								{
									after_econ_limit: 'yes',
								},
								'$$b',
							],
						},
					},
				},
			},
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'capex',
		'options.other_capex.row_view.headers.after_econ_limit': { $exists: true },
	},
	update: [
		{
			$unset: [
				'options.other_capex.row_view.headers.after_econ_limit',
				'options.other_capex.row_view.rows.after_econ_limit',
				'econ_function.other_capex.rows.after_econ_limit',
			],
		},
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
