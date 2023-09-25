// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210709160348-remove-mappings-project');

let db;
let client;
let mongod;

const mappingsBefore = [
	{ _id: new ObjectId('123456789012345678900001') },
	{ _id: new ObjectId('123456789012345678900002'), project: new ObjectId('123456789012345678901002') },
	{ _id: new ObjectId('123456789012345678900003'), project: null },
	{
		_id: new ObjectId('123456789012345678900004'),
		project: new ObjectId('123456789012345678901002'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
	},
	{
		_id: new ObjectId('123456789012345678900005'),
		project: new ObjectId('123456789012345678901002'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
	{
		_id: new ObjectId('123456789012345678900006'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
	{
		_id: new ObjectId('123456789012345678900007'),
		project: null,
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
];
const mappingsAfter = [
	{ _id: new ObjectId('123456789012345678900001') },
	{ _id: new ObjectId('123456789012345678900002') },
	{ _id: new ObjectId('123456789012345678900003') },
	{
		_id: new ObjectId('123456789012345678900004'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
	},
	{
		_id: new ObjectId('123456789012345678900005'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
	{
		_id: new ObjectId('123456789012345678900006'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
	{
		_id: new ObjectId('123456789012345678900007'),
		mappings: [
			['a', 'b'],
			['c', 'd'],
		],
		dataSource: 'di',
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210709160348-remove-mappings-project', () => {
	let mappingsCollection;

	beforeAll(async () => {
		mappingsCollection = db.collection('file-import-mappings');
		await mappingsCollection.insertMany(mappingsBefore);
	});

	test('up', async () => {
		await up({ db });

		const result = await mappingsCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(mappingsAfter);
	});

	test('idempotency', async () => {
		await up({ db });
		await up({ db });

		const result = await mappingsCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(mappingsAfter);
	});
});
