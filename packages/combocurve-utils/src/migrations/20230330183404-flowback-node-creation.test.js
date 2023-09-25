// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

const {
	up,
	down,
	DEFAULT_EDGE_PARAMS,
	DEFAULT_WELL_GROUP_NODE_FLARE_PARAMS,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./20230330183404-flowback-node-creation');

let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

const WELL_GROUP_ID_1 = 'f73c09a0-d5ea-40fa-8ccb-98e19d66ff40';
const WELL_GROUP_ID_2 = 'f73c09a0-d5ea-40fa-8ccb-98e19d66ff41';
const FLOWBACK_ID_1 = '56b2e5be-3795-409a-82b8-5bb14da5d9b5';
const FLOWBACK_ID_2 = '56b2e5be-3795-409a-82b8-5bb14da5d9b6';
const FLARE_ID = '50cde589-438f-4bc2-886e-ee4b041c9b20';
const ATMOSPHERE_ID = '50cde589-438f-4bc2-886e-ee4b041c9b21';
const WELL_TO_FLOWBACK_ID_1 = '50cde589-438f-4bc2-886e-ee4b041edge1';
const WELL_TO_FLOWBACK_ID_2 = '50cde589-438f-4bc2-886e-ee4b041edge2';
const FLOWBACK_TO_ATMOSPHERE = '50cde589-438f-4bc2-886e-ee4b041atmosphere';
const FLOWBACK_TO_FLARE = '50cde589-438f-4bc2-886e-ee4b041flare';

const getPreMigrationWellGroup = (emissionType, id) => ({
	id,
	type: 'well_group',
	name: 'Well Group',
	shape: {
		position: {
			x: 646,
			y: 814,
		},
	},
	params: {
		wells: [new ObjectId('607ee10676a3d4296e474823'), new ObjectId('607ee10676a3d4296e474824')],
		fluid_model: null,
		flowback: {
			emission_type: emissionType,
			flowback_rate: 123,
			start_criteria: 'FPD',
			start_criteria_option: null,
			start_value: 123,
			end_criteria: 'duration',
			end_criteria_option: null,
			end_value: 123,
			flare_efficiency: 123,
			flare_unlit: 123,
			flare_fuel_hhv: 0.001235,
			...(emissionType === 'vented' && DEFAULT_WELL_GROUP_NODE_FLARE_PARAMS),
		},
	},
	description: '',
});

const getPostMigrationWellGroupNode = (id) => ({
	id,
	type: 'well_group',
	name: 'Well Group',
	shape: {
		position: {
			x: 646,
			y: 814,
		},
	},
	params: {
		wells: [new ObjectId('607ee10676a3d4296e474823'), new ObjectId('607ee10676a3d4296e474824')],
		fluid_model: null,
	},
	description: '',
});

const getFlowbackNode = (id) => ({
	id,
	type: 'flowback',
	name: 'Flowback',
	shape: {
		position: {
			x: 846,
			y: 1014,
		},
	},
	params: {
		time_series: {
			rows: [
				{
					start_date_window: 'Start',
					flowback_rate: 123,
					start_criteria: 'FPD',
					start_criteria_option: null,
					start_value: 123,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 123,
				},
			],
		},
	},
	description: '',
});

const ATMOSPHERE_NODE = {
	shape: {
		position: {
			x: 1046,
			y: 1014,
		},
	},
	id: ATMOSPHERE_ID,
	type: 'atmosphere',
	name: 'Atmosphere',
	params: {
		emission_type: 'vented',
	},
	description: '',
};

const FLARE_NODE = {
	shape: {
		position: {
			x: 1046,
			y: 1014,
		},
	},
	id: FLARE_ID,
	type: 'flare',
	name: 'Flare',
	params: {
		fuel_hhv: {
			value: 0.001235,
			unit: 'MMBtu/scf',
		},
		pct_flare_efficiency: 123,
		pct_flare_unlit: 123,
	},
	description: '',
};

const getWellGroupToFlowbackEdge = (id, from, to) => ({
	id,
	by: 'gas',
	from,
	fromHandle: 'gas',
	to,
	toHandle: 'gas',
	shape: {
		vertices: [],
	},
	params: DEFAULT_EDGE_PARAMS,
	name: '',
});

const getFlowbackToEmissionEdge = (id, from, to) => ({
	id,
	by: 'gas',
	from,
	fromHandle: 'gas',
	to,
	toHandle: 'gas',
	shape: {
		vertices: [],
	},
	params: DEFAULT_EDGE_PARAMS,
	name: '',
});

describe('carbon-node-edges-time-series-migration', () => {
	test('up', async () => {
		const networkId = new ObjectId();

		await db.collection('networks').insertMany([
			{
				_id: networkId,
				nodes: [
					getPreMigrationWellGroup('vented', WELL_GROUP_ID_1),
					getPreMigrationWellGroup('flare', WELL_GROUP_ID_2),
				],
				edges: [],
			},
		]);

		await up({ db });
		await up({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });

		// Testing the nodes
		const [wellGroup1, wellGroup2, flowback1, atmosphere, flowback2, flare] = network.nodes;
		expect(network.nodes.length).toBe(6);
		expect(network.nodes).toStrictEqual([
			getPostMigrationWellGroupNode(WELL_GROUP_ID_1),
			getPostMigrationWellGroupNode(WELL_GROUP_ID_2),
			{ ...getFlowbackNode(FLOWBACK_ID_1), id: flowback1.id },
			{ ...ATMOSPHERE_NODE, id: atmosphere.id },
			{ ...getFlowbackNode(FLOWBACK_ID_2), id: flowback2.id },
			{ ...FLARE_NODE, id: flare.id },
		]);

		// Testing the edges
		const [flowbackEdge1, atmosphereEdge, flowbackEdge2, flareEdge] = network.edges;
		expect(network.edges.length).toBe(4);
		expect(network.edges).toStrictEqual([
			getWellGroupToFlowbackEdge(flowbackEdge1.id, wellGroup1.id, flowback1.id),
			getFlowbackToEmissionEdge(atmosphereEdge.id, flowback1.id, atmosphere.id),
			getWellGroupToFlowbackEdge(flowbackEdge2.id, wellGroup2.id, flowback2.id),
			getFlowbackToEmissionEdge(flareEdge.id, flowback2.id, flare.id),
		]);
	});

	test('down', async () => {
		const networkId = new ObjectId();
		await db.collection('networks').insertMany([
			{
				_id: networkId,
				nodes: [
					getPostMigrationWellGroupNode(WELL_GROUP_ID_1),
					getPostMigrationWellGroupNode(WELL_GROUP_ID_2),
					getFlowbackNode(FLOWBACK_ID_1),
					getFlowbackNode(FLOWBACK_ID_2),
					ATMOSPHERE_NODE,
					FLARE_NODE,
				],
				edges: [
					getWellGroupToFlowbackEdge(WELL_TO_FLOWBACK_ID_1, WELL_GROUP_ID_1, FLOWBACK_ID_1),
					getFlowbackToEmissionEdge(FLOWBACK_TO_ATMOSPHERE, FLOWBACK_ID_1, ATMOSPHERE_ID),
					getWellGroupToFlowbackEdge(WELL_TO_FLOWBACK_ID_2, WELL_GROUP_ID_2, FLOWBACK_ID_2),
					getFlowbackToEmissionEdge(FLOWBACK_TO_FLARE, FLOWBACK_ID_2, FLARE_ID),
				],
			},
		]);

		await down({ db });
		await down({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });
		expect(network.nodes.length).toBe(2);
		expect(network.nodes).toStrictEqual([
			getPreMigrationWellGroup('vented', WELL_GROUP_ID_1),
			getPreMigrationWellGroup('flare', WELL_GROUP_ID_2),
		]);
		expect(network.edges.length).toBe(0);
	});
});
