// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20221021183621-rename-completions-in-networks');

let collection;
let db;
let mongod;
let client;

const nodesNew = [
	{
		name: 'Well Group',
		params: {
			drilling: {
				fuel_type: 'Distillate Fuel Oil No. 2',
				consumption_rate: 0,
				start_criteria: 'FPD',
				start_value: 0,
				end_criteria: 'duration',
				end_value: 0,
			},
			completion: {
				fuel_type: 'Distillate Fuel Oil No. 2',
				consumption_rate: 0,
				start_criteria: 'FPD',
				start_value: 0,
				end_criteria: 'duration',
				end_value: 0,
			},
		},
	},
	{
		name: 'Atmosphere',
		params: {
			emission_type: 'vented',
		},
	},
];

const nodesOld = [
	{
		name: 'Well Group',
		params: {
			drilling: {
				fuel_type: 'Distillate Fuel Oil No. 2',
				consumption_rate: 0,
				start_criteria: 'FPD',
				start_value: 0,
				end_criteria: 'duration',
				end_value: 0,
			},
			completions: {
				fuel_type: 'Distillate Fuel Oil No. 2',
				consumption_rate: 0,
				start_criteria: 'FPD',
				start_value: 0,
				end_criteria: 'duration',
				end_value: 0,
			},
		},
	},
	{
		name: 'Atmosphere',
		params: {
			emission_type: 'vented',
		},
	},
];

const networkOld = {
	_id: new ObjectId(),
	name: 'Old Network',
	nodes: nodesOld,
};

const networkNew = {
	_id: new ObjectId(),
	name: 'New Network',
	nodes: nodesNew,
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('networks');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('completions-migration', () => {
	test('up', async () => {
		await collection.insertMany([networkOld, networkNew]);

		await up({ db });
		await up({ db }); // test idempotence

		const network1 = await collection.findOne({ _id: networkOld._id });
		const network2 = await collection.findOne({ _id: networkNew._id });

		// nodes in network1 should be updated to new node params
		expect(network1.nodes).toStrictEqual(nodesNew);
		// network2 should be unchanged because it doesn't have a 'completions' param
		expect(network2).toStrictEqual(networkNew);
	});

	test('down', async () => {
		await collection.insertMany([networkOld, networkNew]);

		await down({ db });
		await down({ db }); // test idempotence

		const network1 = await collection.findOne({ _id: networkOld._id });
		const network2 = await collection.findOne({ _id: networkNew._id });

		// network1 should be unchanged because it doesn't have a 'completion' param
		expect(network1).toStrictEqual(networkOld);
		// nodes in network2 should match the old node params
		expect(network2.nodes).toStrictEqual(nodesOld);
	});
});
