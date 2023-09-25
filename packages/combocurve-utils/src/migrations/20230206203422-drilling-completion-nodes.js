// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { v4: uuidv4 } = require('uuid');

const Y_OFFSET_MAPS = {
	completion: -70,
	drilling: 70,
};

const NAME_MAPS = {
	completion: 'Completion',
	drilling: 'Drilling',
};

function getNewNodeAndEdge(wellGroupNode, node_type) {
	const newNodeParams = wellGroupNode?.params?.[node_type];
	if (newNodeParams) {
		const newNodeId = uuidv4();
		const newNode = {
			shape: {
				position: {
					x: wellGroupNode.shape.position.x - 180,
					y: wellGroupNode.shape.position.y + Y_OFFSET_MAPS[node_type],
				},
			},
			id: newNodeId,
			type: node_type,
			name: NAME_MAPS[node_type],
			params: {
				time_series: {
					fuel_type: newNodeParams.fuel_type,
					rows: [
						{
							start_date_window: 'Start',
							consumption_rate: newNodeParams.consumption_rate,
							start_criteria: newNodeParams.start_criteria,
							start_criteria_option: newNodeParams.start_criteria_option,
							start_value: newNodeParams.start_value,
							end_criteria: newNodeParams.end_criteria,
							end_criteria_option: newNodeParams.end_criteria_option,
							end_value: newNodeParams.end_value,
						},
					],
				},
			},
			description: '',
		};
		const newEdge = {
			id: uuidv4(),
			by: 'development',
			from: newNodeId,
			to: wellGroupNode.id,
			shape: {
				vertices: [],
			},
			name: '',
		};
		return { newNode, newEdge };
	}

	return null;
}

function upProcessNetwork(networkDoc) {
	const newNodes = [];
	const newEdges = [];
	return {
		...networkDoc,
		nodes: networkDoc.nodes
			.map((node) => {
				if (node.type === 'well_group') {
					const completionData = getNewNodeAndEdge(node, 'completion');
					const drillingData = getNewNodeAndEdge(node, 'drilling');
					if (drillingData) {
						newNodes.push(drillingData.newNode);
						newEdges.push(drillingData.newEdge);
					}
					if (completionData) {
						newNodes.push(completionData.newNode);
						newEdges.push(completionData.newEdge);
					}
					return {
						...node,
						params: {
							..._.omit(node.params, ['completion', 'drilling']),
						},
					};
				}
				return node;
			})
			.concat(newNodes),
		edges: networkDoc.edges.concat(newEdges),
	};
}

async function up({ db }) {
	const collection = db.collection('networks');

	const affectedNetworks = await collection
		.find({
			'nodes.type': {
				$in: ['well_group'],
			},
		})
		.toArray();

	const updatedNetworks = affectedNetworks.map(upProcessNetwork);

	if (updatedNetworks.length === 0) return; // NOTE passing an empty array to bulkWrite will throw an error
	const bulkUpdateNetworks = updatedNetworks.map((network) => ({
		updateOne: {
			filter: { _id: network._id },
			update: { $set: network },
		},
	}));
	await collection.bulkWrite(bulkUpdateNetworks);
}

const DEFAULT_COMPLETION_PARAMS = {
	fuel_type: 'distillate_fuel_oil_number_2',
	consumption_rate: 0,
	start_criteria: 'FPD',
	start_criteria_option: null,
	start_value: 0,
	end_criteria: 'duration',
	end_criteria_option: null,
	end_value: 0,
};

const DEFAULT_DRILLING_PARAMS = {
	fuel_type: 'distillate_fuel_oil_number_2',
	consumption_rate: 0,
	start_criteria: 'FPD',
	start_criteria_option: null,
	start_value: 0,
	end_criteria: 'duration',
	end_criteria_option: null,
	end_value: 0,
};

const drillingAndCompletionFilter = (node) => node.type === 'drilling' || node.type === 'completion';
const processNetwork = (network) => {
	const drillingAndCompletionDictionary = _.keyBy(network.nodes.filter(drillingAndCompletionFilter), 'id');

	// Map dev edges to relationships
	let relationshipData = {};
	for (const edge of network.edges) {
		if (edge.by !== 'development') continue;
		const devNodeData = {
			...drillingAndCompletionDictionary[edge.from].params.time_series.rows[0],
			fuel_type: drillingAndCompletionDictionary[edge.from].params.time_series.fuel_type,
		};
		relationshipData[edge.to] ??= {};
		relationshipData[edge.to][
			drillingAndCompletionDictionary[edge.from].type === 'drilling' ? 'drilling' : 'completion'
		] = devNodeData;
	}

	// Process
	return {
		...network,
		nodes: network.nodes
			.filter((node) => !drillingAndCompletionFilter(node))
			.map((node) => {
				if (node.type !== 'well_group') return node;
				if (!relationshipData[node.id]) return node;
				return {
					...node,
					params: {
						...node.params,
						drilling:
							_.omit(relationshipData[node.id].drilling, 'start_date_window') ?? DEFAULT_DRILLING_PARAMS,
						completion:
							_.omit(relationshipData[node.id].completion, 'start_date_window') ??
							DEFAULT_COMPLETION_PARAMS,
					},
				};
			}),
		edges: network.edges.filter((edge) => edge.by !== 'development'),
	};
};
const batchDownNodesAndEdges = async ({ db }) => {
	const collection = db.collection('networks');

	const affectedNetworks = await collection
		.find({
			'nodes.type': {
				$in: ['drilling', 'completion'],
			},
		})
		.toArray();

	const updatedNetworks = affectedNetworks.map(processNetwork);

	if (updatedNetworks.length === 0) return; // NOTE passing an empty array to bulkWrite will throw an error
	const bulkUpdateNetworks = updatedNetworks.map((network) => ({
		updateOne: {
			filter: { _id: network._id },
			update: { $set: network },
		},
	}));
	await collection.bulkWrite(bulkUpdateNetworks);
};

async function down({ db }) {
	/**
	 * TODO: implement down method
	 *
	 * Example: await db.collection('collection-name').updateMany({ some: 'query' }, { $unset: { field: '' } });
	 */
	await batchDownNodesAndEdges({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
