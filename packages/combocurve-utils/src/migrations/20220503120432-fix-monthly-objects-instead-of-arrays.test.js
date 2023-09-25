jest.setTimeout(30000);
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20220503120432-fix-monthly-objects-instead-of-arrays');

let db;
let client;
let mongod;

const monthlyBefore = [
	{
		_id: new ObjectId('111111111111111111111111'),
		project: new ObjectId('999999999999999999999999'),
		well: new ObjectId('555555555555555555555555'),
		startIndex: 43099,
		first_production_index: 8,
		index: [null, null, null, null, null, null, null, null, 43356, 43386, 43417, 43447],
		oil: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			107.937012381632,
			12849.3101295031,
			14171.8346897508,
			12831.4993285152,
		],
		gas: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			676.451125749827,
			31128.1361573027,
			54030.3284576423,
			58353.5438908484,
		],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		water: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			25629.0177880256,
			32329.8897678666,
			11924.2458158752,
			7166.35829176084,
		],
		days_on: [null, null, null, null, null, null, null, null, null, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, 1, 2, 3, 4],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
	},
	{
		_id: new ObjectId('222222222222222222222222'),
		project: null,
		well: new ObjectId('666666666666666666666666'),
		startIndex: 43099,
		first_production_index: 8,
		index: [null, null, null, null, null, null, null, null, 43356, 43386, 43417, 43447],
		oil: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			107.937012381632,
			12849.3101295031,
			14171.8346897508,
			12831.4993285152,
		],
		gas: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			676.451125749827,
			31128.1361573027,
			54030.3284576423,
			58353.5438908484,
		],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		water: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			25629.0177880256,
			32329.8897678666,
			11924.2458158752,
			7166.35829176084,
		],
		days_on: [null, null, null, null, null, null, null, null, null, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: { 9: 123.456 },
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: { 10: 12345.6789 },
		customNumber1: { 10: 12345.6789, 11: 98765.4321 },
	},
];
const monthlyAfter = [
	{
		_id: new ObjectId('111111111111111111111111'),
		project: new ObjectId('999999999999999999999999'),
		well: new ObjectId('555555555555555555555555'),
		startIndex: 43099,
		first_production_index: 8,
		index: [null, null, null, null, null, null, null, null, 43356, 43386, 43417, 43447],
		oil: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			107.937012381632,
			12849.3101295031,
			14171.8346897508,
			12831.4993285152,
		],
		gas: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			676.451125749827,
			31128.1361573027,
			54030.3284576423,
			58353.5438908484,
		],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		water: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			25629.0177880256,
			32329.8897678666,
			11924.2458158752,
			7166.35829176084,
		],
		days_on: [null, null, null, null, null, null, null, null, null, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, 1, 2, 3, 4],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
	},
	{
		_id: new ObjectId('222222222222222222222222'),
		project: null,
		well: new ObjectId('666666666666666666666666'),
		startIndex: 43099,
		first_production_index: 8,
		index: [null, null, null, null, null, null, null, null, 43356, 43386, 43417, 43447],
		oil: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			107.937012381632,
			12849.3101295031,
			14171.8346897508,
			12831.4993285152,
		],
		gas: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			676.451125749827,
			31128.1361573027,
			54030.3284576423,
			58353.5438908484,
		],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		water: [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			25629.0177880256,
			32329.8897678666,
			11924.2458158752,
			7166.35829176084,
		],
		days_on: [null, null, null, null, null, null, null, null, null, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, 123.456, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, 12345.6789, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, 12345.6789, 98765.4321],
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20220503120432-fix-monthly-objects-instead-of-arrays', () => {
	let monthlyProductionCollection;

	beforeAll(async () => {
		monthlyProductionCollection = db.collection('monthly-productions');
		await monthlyProductionCollection.insertMany(monthlyBefore);
	});

	test('up', async () => {
		await up({ db });

		const result = await monthlyProductionCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(monthlyAfter);
	});

	test('idempotency', async () => {
		await up({ db });
		await up({ db });

		const result = await monthlyProductionCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(monthlyAfter);
	});
});
