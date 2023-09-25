// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { v4: uuidv4 } = require('uuid');

const FLOWBACK_NODE_OFFSET = {
	x: 200,
	y: 200,
};

const EMISSION_NODE_OFFSET = {
	x: 400,
	y: 200,
};

const DEFAULT_FLARE_NODE_PARAMS = {
	fuel_hhv: { value: 0.001235, unit: 'MMBtu/scf' },
	pct_flare_efficiency: 98,
	pct_flare_unlit: 0,
};

const DEFAULT_EDGE_PARAMS = {
	time_series: {
		criteria: 'entire_well_life',
		rows: [
			{
				period: 'Flat',
				allocation: 100,
			},
		],
	},
};

const DEFAULT_WELL_GROUP_NODE_FLARE_PARAMS = {
	flare_efficiency: 98,
	flare_fuel_hhv: 0.001235,
	flare_unlit: 0,
};

const flareNodeToWellGroupFlareParams = (params) => ({
	flare_efficiency: params.pct_flare_efficiency,
	flare_fuel_hhv: params.fuel_hhv.value,
	flare_unlit: params.pct_flare_unlit,
});

const wellGroupNodeToFlareNodeFlareParams = (params) => ({
	pct_flare_efficiency: params.flare_efficiency,
	fuel_hhv: {
		value: params.flare_fuel_hhv,
		unit: 'MMBtu/scf',
	},
	pct_flare_unlit: params.flare_unlit,
});

const DEFAULT_ATMOSPHERE_PARAMS = { emission_type: 'vented' };

const NAME_MAPS = {
	flare: 'Flare',
	vented: 'Atmosphere',
};

function getNewNodesAndEdges(wellGroupNode) {
	const newFlowbackNodeParams = wellGroupNode?.params?.flowback;
	if (newFlowbackNodeParams) {
		const newFlowbackNodeId = uuidv4();
		const newEmissionNodeId = uuidv4();
		const newFlowbackNode = {
			description: '',
			shape: {
				position: {
					x: wellGroupNode.shape.position.x + FLOWBACK_NODE_OFFSET.x,
					y: wellGroupNode.shape.position.y + FLOWBACK_NODE_OFFSET.y,
				},
			},
			id: newFlowbackNodeId,
			type: 'flowback',
			name: 'Flowback',
			params: {
				time_series: {
					rows: [
						{
							start_date_window: 'Start',
							flowback_rate: newFlowbackNodeParams.flowback_rate,
							start_criteria: newFlowbackNodeParams.start_criteria,
							start_criteria_option: newFlowbackNodeParams.start_criteria_option,
							start_value: newFlowbackNodeParams.start_value,
							end_criteria: newFlowbackNodeParams.end_criteria,
							end_criteria_option: newFlowbackNodeParams.end_criteria_option,
							end_value: newFlowbackNodeParams.end_value,
						},
					],
				},
			},
		};

		const newEmissionNodeParams = {
			flare: wellGroupNodeToFlareNodeFlareParams(newFlowbackNodeParams) ?? DEFAULT_FLARE_NODE_PARAMS,
			vented: DEFAULT_ATMOSPHERE_PARAMS,
		};

		const newEmissionNode = {
			description: '',
			shape: {
				position: {
					x: wellGroupNode.shape.position.x + EMISSION_NODE_OFFSET.x,
					y: wellGroupNode.shape.position.y + EMISSION_NODE_OFFSET.y,
				},
			},
			id: newEmissionNodeId,
			type: newFlowbackNodeParams.emission_type === 'vented' ? 'atmosphere' : 'flare',
			name: NAME_MAPS[newFlowbackNodeParams.emission_type],
			params: newEmissionNodeParams[newFlowbackNodeParams.emission_type],
		};

		const newWellToFlowbackEdge = {
			id: uuidv4(),
			by: 'gas',
			from: wellGroupNode.id,
			fromHandle: 'gas',
			to: newFlowbackNodeId,
			toHandle: 'gas',
			shape: {
				vertices: [],
			},
			params: DEFAULT_EDGE_PARAMS,
			name: '',
		};

		const newFlowbackToEmissionEdge = {
			id: uuidv4(),
			by: 'gas',
			from: newFlowbackNodeId,
			fromHandle: 'gas',
			to: newEmissionNodeId,
			toHandle: 'gas',
			shape: {
				vertices: [],
			},
			params: DEFAULT_EDGE_PARAMS,
			name: '',
		};

		return {
			nodes: [newFlowbackNode, newEmissionNode],
			edges: [newWellToFlowbackEdge, newFlowbackToEmissionEdge],
		};
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
					const generatedNodesAndEdges = getNewNodesAndEdges(node);
					if (generatedNodesAndEdges) {
						newNodes.push(...generatedNodesAndEdges.nodes);
						newEdges.push(...generatedNodesAndEdges.edges);
					}
					return {
						...node,
						params: {
							..._.omit(node.params, 'flowback'),
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

function downProcessNetwork(networkDoc) {
	const nodeArrayToDict = _.keyBy(networkDoc.nodes, 'id');
	const wellGroupToFlowbackEdges = [];
	const nodesToDelete = [];
	const edgesToDelete = [];
	// First move all emissions data to flowback nodes
	for (const edge of networkDoc.edges) {
		if (nodeArrayToDict[edge.from].type === 'flowback' || nodeArrayToDict[edge.to].type === 'flowback') {
			// Mark edges for deletion
			edgesToDelete.push(edge.id);
		}
		if (nodeArrayToDict[edge.from].type === 'flowback') {
			nodeArrayToDict[edge.from].params = {
				...nodeArrayToDict[edge.from].params,
				emissionsData: {
					...nodeArrayToDict[edge.to].params,
					emission_type: nodeArrayToDict[edge.to].params.emission_type === 'vented' ? 'vented' : 'flare',
				},
			};
			// Mark flowback and emission nodes for deletion
			nodesToDelete.push(...[edge.from, edge.to]);
		} else if (nodeArrayToDict[edge.to].type === 'flowback') {
			// To prevent a second iteration, we store the edges that will be used next
			wellGroupToFlowbackEdges.push(edge);
		}
	}
	// Then move flowback data to well_group nodes
	for (const edge of wellGroupToFlowbackEdges) {
		const flowbackNode = nodeArrayToDict[edge.to];
		nodeArrayToDict[edge.from].params = {
			...nodeArrayToDict[edge.from].params,
			flowback: {
				..._.omit(flowbackNode.params.time_series.rows[0], 'start_date_window'),
				...DEFAULT_WELL_GROUP_NODE_FLARE_PARAMS,
				...(flowbackNode.params.emissionsData.emission_type === 'flare' &&
					flareNodeToWellGroupFlareParams(flowbackNode.params.emissionsData)),
				emission_type: flowbackNode.params.emissionsData.emission_type === 'vented' ? 'vented' : 'flare',
			},
		};
	}
	const nodeDictToArray = _.values(nodeArrayToDict);
	return {
		...networkDoc,
		nodes: nodeDictToArray.filter((node) => !nodesToDelete.includes(node.id)),
		edges: networkDoc.edges.filter((edge) => !edgesToDelete.includes(edge.id)),
	};
}

async function down({ db }) {
	const collection = db.collection('networks');
	const affectedNetworks = await collection
		.find({
			'nodes.type': {
				$in: ['flowback'],
			},
		})
		.toArray();

	const updatedNetworks = affectedNetworks.map(downProcessNetwork);

	if (updatedNetworks.length === 0) return; // NOTE passing an empty array to bulkWrite will throw an error
	const bulkUpdateNetworks = updatedNetworks.map((network) => ({
		updateOne: {
			filter: { _id: network._id },
			update: { $set: network },
		},
	}));
	await collection.bulkWrite(bulkUpdateNetworks);
}

module.exports = {
	up,
	down,
	DEFAULT_EDGE_PARAMS,
	DEFAULT_WELL_GROUP_NODE_FLARE_PARAMS,
	uses: ['mongodb'],
};
