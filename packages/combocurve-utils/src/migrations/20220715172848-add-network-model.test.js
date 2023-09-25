// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down, defaultScenarioNetwork, defaultNetworkAssign } = require('./20220715172848-add-network-model');

let scenarioCollection;
let assignmentCollection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	scenarioCollection = db.collection('scenarios');
	assignmentCollection = db.collection('scenario-well-assignments');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

const scenarioOld = {
	_id: new ObjectId(),
	columns: {
		dates: {},
	},
};

const scenarioNew = {
	_id: new ObjectId(),
	columns: {
		dates: {},
		network: defaultScenarioNetwork,
	},
};

const assignmentOld = {
	_id: new ObjectId(),
	dates: {},
};

const assignmentNew = {
	_id: new ObjectId(),
	dates: {},
	network: defaultNetworkAssign,
};

describe('ghg-migration', () => {
	// 1: test for abandonment or salvage capex
	test('up', async () => {
		await scenarioCollection.insertMany([scenarioOld, scenarioNew]);
		await assignmentCollection.insertMany([assignmentOld, assignmentNew]);

		await up({ db });
		await up({ db }); // test idempotence

		const scenario1 = await scenarioCollection.findOne({ _id: scenarioOld._id });
		const scenario2 = await scenarioCollection.findOne({ _id: scenarioNew._id });

		const assignment1 = await assignmentCollection.findOne({ _id: assignmentOld._id });
		const assignment2 = await assignmentCollection.findOne({ _id: assignmentNew._id });

		expect(scenario1.columns.network.activeQualifier).toStrictEqual('default');
		expect(scenario1.columns.network.qualifiers.default.name).toStrictEqual('Default');
		expect(scenario2).toStrictEqual(scenarioNew);

		expect(scenario1.columns.network.activeQualifier).toStrictEqual('default');
		expect(scenario1.columns.network.qualifiers.default.name).toStrictEqual('Default');

		expect(assignment1.network).toStrictEqual(defaultNetworkAssign);
		expect(assignment2).toStrictEqual(assignmentNew);
	});

	test('down', async () => {
		await scenarioCollection.insertMany([scenarioOld, scenarioNew]);
		await assignmentCollection.insertMany([assignmentOld, assignmentNew]);

		await down({ db });
		await down({ db }); // test idempotence

		const scenario1 = await scenarioCollection.findOne({ _id: scenarioOld._id });
		const scenario2 = await scenarioCollection.findOne({ _id: scenarioNew._id });

		const assignment1 = await assignmentCollection.findOne({ _id: assignmentOld._id });
		const assignment2 = await assignmentCollection.findOne({ _id: assignmentNew._id });

		expect(scenario2.columns).toStrictEqual({ dates: {} });
		expect(scenario1).toStrictEqual(scenario1);

		expect(assignment2.network).toBeFalsy();
		expect(assignment1).toStrictEqual(assignment1);
	});
});
