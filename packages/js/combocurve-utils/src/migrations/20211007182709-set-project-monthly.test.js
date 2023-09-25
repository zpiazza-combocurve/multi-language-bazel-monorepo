// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20211007182709-set-project-monthly');

let db;
let client;
let mongod;

const wells = [
	{ _id: new ObjectId('123456789012345678900001'), project: new ObjectId('223456789012345678900001') },
	{ _id: new ObjectId('123456789012345678900002'), project: new ObjectId('223456789012345678900002') },
	{ _id: new ObjectId('123456789012345678900003'), project: null },
	{ _id: new ObjectId('123456789012345678900004'), project: new ObjectId('223456789012345678900001') },
	{ _id: new ObjectId('123456789012345678900005'), project: new ObjectId('223456789012345678900003') },
	{ _id: new ObjectId('123456789012345678900006') },
];
const monthlyProdDataBefore = [
	{
		_id: new ObjectId('323456789012345678900001'),
		well: new ObjectId('123456789012345678900001'),
		startIndex: 36538,
	},
	{
		_id: new ObjectId('323456789012345678900002'),
		well: new ObjectId('123456789012345678900003'),
		startIndex: 36538,
	},
	{
		_id: new ObjectId('323456789012345678900003'),
		well: new ObjectId('123456789012345678900004'),
		startIndex: 44209,
	},
	{
		_id: new ObjectId('323456789012345678900004'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 32886,
	},
	{
		_id: new ObjectId('323456789012345678900005'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33251,
	},
	{
		_id: new ObjectId('323456789012345678900006'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33616,
	},
	{
		_id: new ObjectId('323456789012345678900007'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33616,
		project: null,
	},
	{
		_id: new ObjectId('323456789012345678900008'),
		well: new ObjectId('123456789012345678900003'),
		startIndex: 33616,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900009'),
		well: new ObjectId('123456789012345678900000'),
		startIndex: 33616,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900010'),
		well: new ObjectId('123456789012345678900000'),
		startIndex: 33616,
		project: null,
	},
	{
		_id: new ObjectId('323456789012345678900011'),
		well: new ObjectId('123456789012345678900006'),
		startIndex: 33616,
	},
];

const monthlyProdDataAfter = [
	{
		_id: new ObjectId('323456789012345678900001'),
		well: new ObjectId('123456789012345678900001'),
		startIndex: 36538,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900002'),
		well: new ObjectId('123456789012345678900003'),
		startIndex: 36538,
	},
	{
		_id: new ObjectId('323456789012345678900003'),
		well: new ObjectId('123456789012345678900004'),
		startIndex: 44209,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900004'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 32886,
		project: new ObjectId('223456789012345678900003'),
	},
	{
		_id: new ObjectId('323456789012345678900005'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33251,
		project: new ObjectId('223456789012345678900003'),
	},
	{
		_id: new ObjectId('323456789012345678900006'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33616,
		project: new ObjectId('223456789012345678900003'),
	},
	{
		_id: new ObjectId('323456789012345678900007'),
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33616,
		project: null,
	},
	{
		_id: new ObjectId('323456789012345678900008'),
		well: new ObjectId('123456789012345678900003'),
		startIndex: 33616,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900009'),
		well: new ObjectId('123456789012345678900000'),
		startIndex: 33616,
		project: new ObjectId('223456789012345678900001'),
	},
	{
		_id: new ObjectId('323456789012345678900010'),
		well: new ObjectId('123456789012345678900000'),
		startIndex: 33616,
		project: null,
	},
	{
		_id: new ObjectId('323456789012345678900011'),
		well: new ObjectId('123456789012345678900006'),
		startIndex: 33616,
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20211007182709-set-project-monthly', () => {
	let monthlyProdCollection;

	beforeAll(async () => {
		monthlyProdCollection = db.collection('monthly-productions');
		await db.collection('wells').insertMany(wells);
		await monthlyProdCollection.insertMany(monthlyProdDataBefore);
	});

	test('up', async () => {
		await up({ db });

		const result = await monthlyProdCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(monthlyProdDataAfter);
	});

	test('idempotency', async () => {
		await up({ db });
		await up({ db });

		const result = await monthlyProdCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(monthlyProdDataAfter);
	});
});
