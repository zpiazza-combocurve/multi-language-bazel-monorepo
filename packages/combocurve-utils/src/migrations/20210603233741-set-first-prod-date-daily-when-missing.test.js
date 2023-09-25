// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210603233741-set-first-prod-date-daily-when-missing');

let db;
let client;
let mongod;

const wellsBefore = [
	{ _id: new ObjectId('123456789012345678900001'), has_daily: false, first_prod_date_daily_calc: null },
	{
		_id: new ObjectId('123456789012345678900002'),
		has_daily: true,
		first_prod_date_daily_calc: new Date('2000-01-01'),
	},
	{ _id: new ObjectId('123456789012345678900003'), has_daily: true, first_prod_date_daily_calc: null },
	{ _id: new ObjectId('123456789012345678900004'), has_daily: true, first_prod_date_daily_calc: null },
	{ _id: new ObjectId('123456789012345678900005'), has_daily: true, first_prod_date_daily_calc: null },
];
const wellsAfter = [
	{ _id: new ObjectId('123456789012345678900001'), has_daily: false, first_prod_date_daily_calc: null },
	{
		_id: new ObjectId('123456789012345678900002'),
		has_daily: true,
		first_prod_date_daily_calc: new Date('2000-01-01'),
	},
	{
		_id: new ObjectId('123456789012345678900003'),
		has_daily: true,
		first_prod_date_daily_calc: new Date('2000-01-01'),
	},
	{
		_id: new ObjectId('123456789012345678900004'),
		has_daily: true,
		first_prod_date_daily_calc: new Date('2021-02-10'),
	},
	{
		_id: new ObjectId('123456789012345678900005'),
		has_daily: true,
		first_prod_date_daily_calc: new Date('1990-06-20'),
	},
];
const dailyProdData = [
	{
		well: new ObjectId('123456789012345678900002'),
		startIndex: 36524,
		index: [
			36524,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
		],
	},
	{
		well: new ObjectId('123456789012345678900003'),
		startIndex: 36524,
		index: [
			36524,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
		],
	},
	{
		well: new ObjectId('123456789012345678900004'),
		startIndex: 44226,
		index: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			44235,
			44236,
			44237,
			44238,
			44239,
			44240,
			44241,
			44242,
			44243,
			44244,
			44245,
			44246,
			44247,
			44248,
			44249,
			44250,
			null,
			null,
			null,
			null,
			null,
			null,
		],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33023,
		index: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			33042,
			33043,
			33044,
			33045,
			33046,
			33047,
			33048,
			33049,
			33050,
			33051,
			33052,
			null,
		],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33053,
		index: [
			33053, 33054, 33055, 33056, 33057, 33058, 33059, 33060, 33061, 33062, 33063, 33064, 33065, 33066, 33067,
			33068, 33069, 33070, 33071, 33072, 33073, 33074, 33075, 33076, 33077, 33078, 33079, 33080, 33081, 33082,
			33083,
		],
	},
	{
		well: new ObjectId('123456789012345678900005'),
		startIndex: 33084,
		index: [
			33084,
			33085,
			33086,
			33087,
			33088,
			33089,
			33090,
			33091,
			33092,
			33093,
			33094,
			33095,
			33096,
			33097,
			33098,
			33099,
			33100,
			33101,
			33102,
			33103,
			33104,
			33105,
			33106,
			33107,
			33108,
			33109,
			null,
			null,
			null,
			null,
			null,
		],
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210603233741-set-first-prod-date-daily-when-missing', () => {
	let wellsCollection;

	beforeAll(async () => {
		wellsCollection = db.collection('wells');
		await wellsCollection.insertMany(wellsBefore);
		await db.collection('daily-productions').insertMany(dailyProdData);
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
