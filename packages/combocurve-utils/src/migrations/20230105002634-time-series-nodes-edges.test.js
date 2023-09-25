// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20230105002634-time-series-nodes-edges.js');

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

const PRE_MIGRATION_NODE_PNEUMATIC_DEVICE = {
	type: 'pneumatic_device',
	params: {
		count: 1,
		runtime: 2,
		device_type: 'high_bleed',
	},
};
const POST_MIGRATION_NODE_PNEUMATIC_DEVICE = {
	type: 'pneumatic_device',
	description: '',
	params: {
		time_series: {
			assigning_mode: 'facility',
			criteria: 'entire_well_life',
			rows: [
				{
					period: 'Flat',
					count: 1,
					runtime: 2,
					device_type: 'high_bleed',
				},
			],
		},
	},
};
const PRE_MIGRATION_NODE_COMBUSTION = {
	type: 'combustion',
	params: {
		combustion_data: {
			fuel_type: 'distillate_fuel_oil_number_2',
			consumption_rate: 12,
		},
	},
};
const POST_MIGRATION_NODE_COMBUSTION = {
	type: 'combustion',
	description: '',
	params: {
		time_series: {
			assigning_mode: 'facility',
			criteria: 'entire_well_life',
			fuel_type: 'distillate_fuel_oil_number_2',
			rows: [
				{
					period: 'Flat',
					consumption_rate: 12,
				},
			],
		},
	},
};

const PRE_MIGRATION_EDGE = {
	allocation_ratio: 3,
};
const POST_MIGRATION_EDGE = {
	params: {
		time_series: {
			criteria: 'entire_well_life',
			rows: [
				{
					period: 'Flat',
					allocation: 3,
				},
			],
		},
	},
};

describe('time-series-nodes-edges', () => {
	test('up', async () => {
		const networkId = new ObjectId();
		const facilityId = new ObjectId();

		await Promise.all([
			db.collection('networks').insertMany([
				{
					_id: networkId,
					nodes: [],
					edges: [PRE_MIGRATION_EDGE],
				},
			]),
			db.collection('facilities').insertMany([
				{
					_id: facilityId,
					nodes: [PRE_MIGRATION_NODE_PNEUMATIC_DEVICE, PRE_MIGRATION_NODE_COMBUSTION],
					edges: [PRE_MIGRATION_EDGE],
				},
			]),
		]);

		await up({ db });
		await up({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });
		const facility = await db.collection('facilities').findOne({ _id: facilityId });

		expect(network.edges[0]).toStrictEqual(POST_MIGRATION_EDGE);
		expect(facility.nodes[0]).toStrictEqual(POST_MIGRATION_NODE_PNEUMATIC_DEVICE);
		expect(facility.nodes[1]).toStrictEqual(POST_MIGRATION_NODE_COMBUSTION);
		expect(facility.edges[0]).toStrictEqual(POST_MIGRATION_EDGE);
	});

	test('down', async () => {
		const networkId = new ObjectId();
		const facilityId = new ObjectId();

		await Promise.all([
			db.collection('networks').insertMany([
				{
					_id: networkId,
					nodes: [],
					edges: [POST_MIGRATION_EDGE],
				},
			]),
			db.collection('facilities').insertMany([
				{
					_id: facilityId,
					nodes: [POST_MIGRATION_NODE_PNEUMATIC_DEVICE, POST_MIGRATION_NODE_COMBUSTION],
					edges: [POST_MIGRATION_EDGE],
				},
			]),
		]);

		await down({ db });
		await down({ db }); // test idempotence

		const network = await db.collection('networks').findOne({ _id: networkId });
		const facility = await db.collection('facilities').findOne({ _id: facilityId });

		expect(network.edges[0]).toStrictEqual(PRE_MIGRATION_EDGE);
		expect(facility.nodes[0]).toStrictEqual(PRE_MIGRATION_NODE_PNEUMATIC_DEVICE);
		expect(facility.nodes[1]).toStrictEqual(PRE_MIGRATION_NODE_COMBUSTION);
		expect(facility.edges[0]).toStrictEqual(PRE_MIGRATION_EDGE);
	});
});
