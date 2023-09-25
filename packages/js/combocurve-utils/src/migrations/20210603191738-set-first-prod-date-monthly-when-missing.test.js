// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210603191738-set-first-prod-date-monthly-when-missing');

let db;
let client;
let mongod;

const wellsBefore = [
	{ _id: new ObjectId('123456789012345678900001'), has_monthly: false, first_prod_date_monthly_calc: null },
	{
		_id: new ObjectId('123456789012345678900002'),
		has_monthly: true,
		first_prod_date_monthly_calc: new Date('2000-01-15'),
	},
	{ _id: new ObjectId('123456789012345678900003'), has_monthly: true, first_prod_date_monthly_calc: null },
	{ _id: new ObjectId('123456789012345678900004'), has_monthly: true, first_prod_date_monthly_calc: null },
	{ _id: new ObjectId('123456789012345678900005'), has_monthly: true, first_prod_date_monthly_calc: null },
];
const wellsAfter = [
	{ _id: new ObjectId('123456789012345678900001'), has_monthly: false, first_prod_date_monthly_calc: null },
	{
		_id: new ObjectId('123456789012345678900002'),
		has_monthly: true,
		first_prod_date_monthly_calc: new Date('2000-01-15'),
	},
	{
		_id: new ObjectId('123456789012345678900003'),
		has_monthly: true,
		first_prod_date_monthly_calc: new Date('2000-01-15'),
	},
	{
		_id: new ObjectId('123456789012345678900004'),
		has_monthly: true,
		first_prod_date_monthly_calc: new Date('2021-02-15'),
	},
	{
		_id: new ObjectId('123456789012345678900005'),
		has_monthly: true,
		first_prod_date_monthly_calc: new Date('1990-06-15'),
	},
];
const monthlyProdData = [
	{
		well: new ObjectId('123456789012345678900002'),
		startIndex: 36538,
		index: [36538, null, null, null, null, null, null, null, null, null, null, null],
	},
	{
		well: new ObjectId('123456789012345678900003'),
		startIndex: 36538,
		index: [36538, null, null, null, null, null, null, null, null, null, null, null],
	},
	{
		well: new ObjectId('123456789012345678900004'),
		startIndex: 44209,
		index: [null, 44240, 44268, 44299, 44329, null, null, null, null, null, null, null],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 32886,
		index: [null, null, null, null, null, 33037, 33067, 33098, 33129, 33159, 33190, 33220],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33251,
		index: [33251, 33282, 33310, 33341, 33371, 33402, 33432, 33463, 33494, 33524, 33555, 33585],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33616,
		index: [33616, 33647, 33676, 33707, 33737, 33768, 33798, 33829, 33860, null, null, null],
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210603191738-set-first-prod-date-monthly-when-missing', () => {
	let wellsCollection;

	beforeAll(async () => {
		wellsCollection = db.collection('wells');
		await wellsCollection.insertMany(wellsBefore);
		await db.collection('monthly-productions').insertMany(monthlyProdData);
	});

	test('up', async () => {
		await up({ db });

		const result = await wellsCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(wellsAfter);
	});

	test('idempotency', async () => {
		await up({ db });
		await up({ db });

		const result = await wellsCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(wellsAfter);
	});
});
