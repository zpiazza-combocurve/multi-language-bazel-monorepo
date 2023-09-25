// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const TIME_SERIES_NODES = [
	'pneumatic_device',
	'pneumatic_pump',
	'reciprocating_compressor',
	'centrifugal_compressor',
	'combustion',
];

const batchUpNodes = createBatchUpdate({
	collection: 'facilities',
	query: { 'nodes.type': { $in: TIME_SERIES_NODES } },
	update: [
		{
			$set: {
				nodes: {
					$map: {
						input: '$nodes',
						as: 'node',
						in: {
							$cond: {
								if: {
									$and: [
										{ $eq: [{ $type: '$$node.params.time_series' }, 'missing'] },
										{ $in: ['$$node.type', TIME_SERIES_NODES] },
									],
								},
								then: {
									$mergeObjects: [
										'$$node',
										{
											params: {
												$mergeObjects: [
													'$$node.params',
													{
														time_series: {
															assigning_mode: 'facility',
															criteria: 'entire_well_life',
															fuel_type: '$$node.params.combustion_data.fuel_type',
															rows: [
																{
																	period: 'Flat',
																	count: '$$node.params.count',
																	runtime: '$$node.params.runtime',
																	device_type: '$$node.params.device_type',
																	consumption_rate:
																		'$$node.params.combustion_data.consumption_rate',
																},
															],
														},
													},
												],
											},
										},
									],
								},
								else: '$$node',
							},
						},
					},
				},
			},
		},
		{
			$unset: [
				'nodes.params.device_type',
				'nodes.params.count',
				'nodes.params.runtime',
				'nodes.params.combustion_data',
			],
		},
	],
});

const batchDownNodes = createBatchUpdate({
	collection: 'facilities',
	query: { 'nodes.type': { $in: TIME_SERIES_NODES } },
	update: [
		{
			$set: {
				nodes: {
					$map: {
						input: '$nodes',
						as: 'node',
						in: {
							$cond: {
								if: {
									$and: [
										{ $ne: [{ $type: '$$node.params.time_series' }, 'missing'] },
										{ $in: ['$$node.type', TIME_SERIES_NODES] },
									],
								},
								then: {
									$mergeObjects: [
										'$$node',
										{
											$let: {
												vars: {
													first: {
														$arrayElemAt: ['$$node.params.time_series.rows', 0],
													},
												},
												in: {
													params: {
														$mergeObjects: [
															'$$node.params',
															{
																count: '$$first.count',
																device_type: '$$first.device_type',
																runtime: '$$first.runtime',
															},
															{
																$cond: {
																	if: { $eq: ['$$node.type', 'combustion'] },
																	then: {
																		combustion_data: {
																			consumption_rate:
																				'$$first.consumption_rate',
																			fuel_type:
																				'$$node.params.time_series.fuel_type',
																		},
																	},
																	else: {},
																},
															},
														],
													},
												},
											},
										},
									],
								},
								else: '$$node',
							},
						},
					},
				},
			},
		},
		{
			$unset: ['nodes.params.time_series'],
		},
	],
});

function batchUpDescription(collection, params) {
	return createBatchUpdate({
		collection,
		query: {},
		update: [
			{
				$set: {
					nodes: {
						$map: {
							input: '$nodes',
							as: 'node',
							in: {
								$mergeObjects: ['$$node', { description: '' }],
							},
						},
					},
				},
			},
		],
	})(params);
}

function batchDownDescription(collection, params) {
	return createBatchUpdate({
		collection,
		query: {},
		update: [
			{
				$unset: ['nodes.description'],
			},
		],
	})(params);
}

function batchUpEdges(collection, params) {
	return createBatchUpdate({
		collection,
		update: [
			{
				$set: {
					edges: {
						$map: {
							input: '$edges',
							as: 'edge',
							in: {
								$cond: {
									if: { $ne: ['$$edge.allocation_ratio', null] },
									then: {
										$mergeObjects: [
											'$$edge',
											{
												params: {
													$ifNull: [
														'$$edge.params',
														{
															time_series: {
																criteria: 'entire_well_life',
																rows: [
																	{
																		period: 'Flat',
																		allocation: '$$edge.allocation_ratio',
																	},
																],
															},
														},
													],
												},
											},
										],
									},
									else: '$$edge',
								},
							},
						},
					},
				},
			},
			{
				$unset: ['edges.allocation_ratio'],
			},
		],
	})(params);
}

function batchDownEdges(collection, params) {
	return createBatchUpdate({
		collection,
		update: [
			{
				$set: {
					edges: {
						$map: {
							input: '$edges',
							as: 'edge',
							in: {
								$cond: {
									if: { $ne: ['$$edge.allocation_ratio', null] },
									then: {
										$mergeObjects: [
											'$$edge',
											{
												$let: {
													vars: {
														first: {
															$arrayElemAt: ['$$edge.params.time_series.rows', 0],
														},
													},
													in: {
														allocation_ratio: '$$first.allocation',
													},
												},
											},
										],
									},
									else: '$$edge',
								},
							},
						},
					},
				},
			},
			{
				$unset: ['edges.params'],
			},
		],
	})(params);
}

async function up({ db }) {
	await batchUpDescription('networks', { db });
	await batchUpDescription('facilities', { db });
	await batchUpEdges('networks', { db });
	await batchUpEdges('facilities', { db });
	await batchUpNodes({ db });
}

async function down({ db }) {
	await batchDownDescription('networks', { db });
	await batchDownDescription('facilities', { db });
	await batchDownEdges('networks', { db });
	await batchDownEdges('facilities', { db });
	await batchDownNodes({ db });
}

module.exports = { up, down, TIME_SERIES_NODES, uses: ['mongodb'] };
