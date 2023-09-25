// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUp = createBatchUpdate({
	collection: 'embedded-lookup-tables',
	query: {
		assumptionKey: 'expenses',
	},
	update: [
		{
			$set: {
				lines: {
					$map: {
						input: '$lines',
						as: 'line',
						in: {
							$cond: {
								if: {
									$and: [
										{
											$not: {
												$in: [
													'unit',
													{
														$map: {
															input: '$$line',
															as: 'line',
															in: '$$line.key',
														},
													},
												],
											},
										},
										{
											$or: [
												{
													$in: [
														'ngl',
														{
															$map: {
																input: '$$line',
																as: 'line',
																in: '$$line.value',
															},
														},
													],
												},
												{
													$in: [
														'drip_condensate',
														{
															$map: {
																input: '$$line',
																as: 'line',
																in: '$$line.value',
															},
														},
													],
												},
											],
										},
									],
								},
								then: {
									$concatArrays: [
										'$$line',
										[
											{
												key: 'unit',
												value: 'dollar_per_bbl',
											},
										],
									],
								},
								else: '$$line',
							},
						},
					},
				},
			},
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'embedded-lookup-tables',
	query: {
		assumptionKey: 'expenses',
	},
	update: [
		{
			$set: {
				lines: {
					$map: {
						input: '$lines',
						as: 'line',
						in: {
							$filter: {
								input: '$$line',
								as: 'line',
								cond: {
									$ne: ['$$line.key', 'unit'],
								},
							},
						},
					},
				},
			},
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
