// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20230206203422-drilling-completion-nodes');

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

const WELL_GROUP_ID = 'f73c09a0-d5ea-40fa-8ccb-98e19d66ff40';
const DRILLING_ID = '56b2e5be-3795-409a-82b8-5bb14da5d9b5';
const COMPLETION_ID = '50cde589-438f-4bc2-886e-ee4b041c9b20';

const PRE_MIGRATION_NODE_WELL_GROUP = {
	id: WELL_GROUP_ID,
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
		drilling: {
			fuel_type: 'distillate_fuel_oil_number_1',
			consumption_rate: 12,
			start_criteria: 'FPD',
			start_criteria_option: null,
			start_value: 0,
			end_criteria: 'duration',
			end_criteria_option: null,
			end_value: 0,
		},
		completion: {
			fuel_type: 'mixed_industrial_sector',
			consumption_rate: 123,
			start_criteria: 'schedule',
			start_criteria_option: 'offset_to_pad_preparation_mob_start',
			start_value: null,
			end_criteria: 'duration',
			end_criteria_option: null,
			end_value: 0,
		},
		flowback: {
			emission_type: 'vented',
			flowback_rate: 0,
			start_criteria: 'FPD',
			start_criteria_option: null,
			start_value: 0,
			end_criteria: 'duration',
			end_criteria_option: null,
			end_value: 0,
			flare_efficiency: 0,
			flare_unlit: 0,
			flare_fuel_hhv: 0.001235,
		},
	},
	description: '',
};

const POST_MIGRATION_NODE_WELL_GROUP = {
	id: WELL_GROUP_ID,
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
			emission_type: 'vented',
			flowback_rate: 0,
			start_criteria: 'FPD',
			start_criteria_option: null,
			start_value: 0,
			end_criteria: 'duration',
			end_criteria_option: null,
			end_value: 0,
			flare_efficiency: 0,
			flare_unlit: 0,
			flare_fuel_hhv: 0.001235,
		},
	},
	description: '',
};

const DRILLING_NODE = {
	id: DRILLING_ID,
	type: 'drilling',
	name: 'Drilling',
	shape: {
		position: {
			x: 466,
			y: 884,
		},
	},
	params: {
		time_series: {
			fuel_type: 'distillate_fuel_oil_number_1',
			rows: [
				{
					start_date_window: 'Start',
					consumption_rate: 12,
					start_criteria: 'FPD',
					start_criteria_option: null,
					start_value: 0,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 0,
				},
			],
		},
	},
	description: '',
};

const COMPLETION_NODE = {
	id: COMPLETION_ID,
	type: 'completion',
	name: 'Completion',
	shape: {
		position: {
			x: 466,
			y: 744,
		},
	},
	params: {
		time_series: {
			fuel_type: 'mixed_industrial_sector',
			rows: [
				{
					start_date_window: 'Start',
					consumption_rate: 123,
					start_criteria: 'schedule',
					start_criteria_option: 'offset_to_pad_preparation_mob_start',
					start_value: null,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 0,
				},
			],
		},
	},
	description: '',
};

const DRILLING_EDGE = {
	id: 'c28d508a-c8be-4030-b23c-2e05f157b884',
	by: 'development',
	from: DRILLING_ID,
	to: WELL_GROUP_ID,
	shape: {
		vertices: [],
	},
	name: '',
};

const COMPLETION_EDGE = {
	id: 'c28d508a-c8be-4030-b23c-2e05f157b887',
	by: 'development',
	from: COMPLETION_ID,
	to: WELL_GROUP_ID,
	shape: {
		vertices: [],
	},
	name: '',
};

describe('carbon-node-edges-time-series-migration', () => {
	test('up', async () => {
		const networkId = new ObjectId();

		await db.collection('networks').insertMany([
			{
				_id: networkId,
				nodes: [PRE_MIGRATION_NODE_WELL_GROUP],
				edges: [],
			},
		]);

		await up({ db });
		await up({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });

		expect(network.nodes.length).toBe(3);
		const [, drilling, completion] = network.nodes;
		expect(network.nodes).toStrictEqual([
			POST_MIGRATION_NODE_WELL_GROUP,
			{ ...DRILLING_NODE, id: drilling.id },
			{ ...COMPLETION_NODE, id: completion.id },
		]);
	});

	test('down', async () => {
		const networkId = new ObjectId();
		await db.collection('networks').insertMany([
			{
				_id: networkId,
				nodes: [POST_MIGRATION_NODE_WELL_GROUP, COMPLETION_NODE, DRILLING_NODE],
				edges: [COMPLETION_EDGE, DRILLING_EDGE],
			},
		]);

		await down({ db });
		await down({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });
		expect(network.nodes.length).toBe(1);
		expect(network.nodes[0]).toStrictEqual(PRE_MIGRATION_NODE_WELL_GROUP);
	});
});
