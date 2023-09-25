jest.setTimeout(30000);
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20220803114735-fix-invalid-monthly-production');

let db;
let client;
let mongod;

const wells = [{ _id: new ObjectId('666666666666666666666666'), project: new ObjectId('999999999999999999999999') }];

const noProdWell = {
	_id: new ObjectId('666666666666666666666666'),
	startIndex: 43113,
	well: new ObjectId(),
	first_production_index: 0,
	index: [43113, 43144, 43172, 43203, 43233, 43264, 43294, 43325, null, null, null, null],
	oil: [989.0, 408.0, 790.0, 878.0, 810.0, 150.0, 0.0, 1289.0, null, null, null, null],
	gas: [2663.0, 768.0, 1331.0, 2100.0, 1570.0, 146.0, 5.0, 3296.0, null, null, null, null],
	water: [88.0, 100.0, 29.0, 115.0, 63.0, 3.0, 0.0, 136.0, null, null, null, null],
	createdAt: new Date('2022-07-13T20:13:10.026+0000'),
	updatedAt: new Date('2022-07-13T20:13:10.026+0000'),
};

const monthlyBefore = [
	{
		_id: new ObjectId('111111111111111111111111'),
		startIndex: 42368,
		well: new ObjectId('666666666666666666666666'),
		project: new ObjectId('999999999999999999999999'),
		first_production_index: 1,
		index: [null, 42413, 42442, 42473, 42503, 42534, 42564, 42595, 42626, null, null, null],
		oil: [null, 5123.0, 5680.0, 4626.0, 4849.0, 4015.0, 3801.0, 3299.0, 2836.0, null, null, null],
		gas: [null, 3469.0, 4379.0, 3023.0, 4297.0, 4713.0, 5459.0, 5536.0, 6404.0, null, null, null],
		water: [null, 562.0, 1547.0, 1043.0, 1112.0, 792.0, 692.0, 567.0, 494.0, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		days_on: [null, 18, 31, 30, 31, 30, 31, 31, 30, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
		createdAt: new Date('2022-07-14T16:52:39.764+0000'),
		updatedAt: new Date('2022-07-14T16:52:42.174+0000'),
	},
	{
		_id: new ObjectId('222222222222222222222222'),
		startIndex: 42382,
		well: new ObjectId('666666666666666666666666'),
		first_production_index: 3,
		index: [null, null, null, 42473, 42503, 42534, 42564, 42595, 42626, 42656, 42687, 42717],
		oil: [null, null, null, 4639.0, 4865.0, 4240.0, 3848.0, 3326.0, 3059.0, 2978.0, 2301.0, 1185.0],
		gas: [null, null, null, 3164.0, 4223.0, 4627.0, 5388.0, 5584.0, 6286.0, 9641.0, 8020.0, 3209.0],
		water: [null, null, null, 1043.0, 1112.0, 792.0, 691.0, 569.0, 494.0, 657.0, 422.0, 232.0],
		createdAt: new Date('2022-07-13T20:13:10.026+0000'),
		updatedAt: new Date('2022-07-13T20:13:10.026+0000'),
	},
	{
		_id: new ObjectId('333333333333333333333333'),
		startIndex: 42734,
		well: new ObjectId('666666666666666666666666'),
		project: new ObjectId('62cf2738c58c89ace4c94d2e'),
		first_production_index: 0,
		index: [42748, 42779, 42807, 42838, 42868, 42899, 42929, 42960, 42991, null, null, null],
		oil: [2696.0, 1628.0, 1571.0, 1366.0, 1395.0, 1037.0, 736.0, 981.0, 1088.0, null, null, null],
		gas: [8384.0, 6951.0, 6483.0, 5716.0, 7397.0, 5668.0, 1951.0, 2298.0, 2766.0, null, null, null],
		water: [465.0, 250.0, 238.0, 249.0, 300.0, 243.0, 69.0, 63.0, 84.0, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		days_on: [29, 28, 31, 28, 30, 28, 31, 21, 21, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
		createdAt: new Date('2022-07-13T16:52:39.765+0000'),
		updatedAt: new Date('2022-07-13T16:52:42.176+0000'),
	},
	{
		_id: new ObjectId('444444444444444444444444'),
		startIndex: 42748,
		well: new ObjectId('666666666666666666666666'),
		first_production_index: 3,
		index: [null, null, null, 42838, 42868, 42899, 42929, 42960, 42991, 43021, 43052, 43082],
		oil: [null, null, null, 1366.0, 1395.0, 1037.0, 736.0, 981.0, 1088.0, 1167.0, 921.0, 979.0],
		gas: [null, null, null, 5716.0, 7397.0, 5668.0, 1951.0, 2298.0, 2776.0, 3209.0, 2136.0, 2606.0],
		water: [null, null, null, 250.0, 300.0, 243.0, 70.0, 63.0, 84.0, 192.0, 55.0, 135.0],
		createdAt: new Date('2022-07-14T20:13:10.026+0000'),
		updatedAt: new Date('2022-07-14T20:13:10.026+0000'),
	},
	{
		_id: new ObjectId('555555555555555555555555'),
		startIndex: 43113,
		well: new ObjectId('666666666666666666666666'),
		first_production_index: 0,
		index: [43113, 43144, 43172, 43203, 43233, 43264, 43294, 43325, null, null, null, null],
		oil: [989.0, 408.0, 790.0, 878.0, 810.0, 150.0, 0.0, 1289.0, null, null, null, null],
		gas: [2663.0, 768.0, 1331.0, 2100.0, 1570.0, 146.0, 5.0, 3296.0, null, null, null, null],
		water: [88.0, 100.0, 29.0, 115.0, 63.0, 3.0, 0.0, 136.0, null, null, null, null],
		createdAt: new Date('2022-07-13T20:13:10.026+0000'),
		updatedAt: new Date('2022-07-13T20:13:10.026+0000'),
	},
	noProdWell,
];
const monthlyAfter = [
	{
		_id: new ObjectId('222222222222222222222222'),
		startIndex: 42368,
		well: new ObjectId('666666666666666666666666'),
		project: new ObjectId('999999999999999999999999'),
		first_production_index: 1,
		index: [null, 42413, 42442, 42473, 42503, 42534, 42564, 42595, 42626, 42656, 42687, 42717],
		oil: [null, 5123.0, 5680.0, 4626.0, 4849.0, 4015.0, 3801.0, 3299.0, 2836.0, 2978.0, 2301.0, 1185.0],
		gas: [null, 3469.0, 4379.0, 3023.0, 4297.0, 4713.0, 5459.0, 5536.0, 6404.0, 9641.0, 8020.0, 3209.0],
		water: [null, 562.0, 1547.0, 1043.0, 1112.0, 792.0, 692.0, 567.0, 494.0, 657.0, 422.0, 232.0],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		days_on: [null, 18, 31, 30, 31, 30, 31, 31, 30, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
		createdAt: expect.any(Date),
		updatedAt: expect.any(Date),
	},
	{
		_id: new ObjectId('444444444444444444444444'),
		startIndex: 42734,
		well: new ObjectId('666666666666666666666666'),
		project: new ObjectId('999999999999999999999999'),
		first_production_index: 0,
		index: [42748, 42779, 42807, 42838, 42868, 42899, 42929, 42960, 42991, 43021, 43052, 43082],
		oil: [2696.0, 1628.0, 1571.0, 1366.0, 1395.0, 1037.0, 736.0, 981.0, 1088.0, 1167.0, 921.0, 979.0],
		gas: [8384.0, 6951.0, 6483.0, 5716.0, 7397.0, 5668.0, 1951.0, 2298.0, 2776.0, 3209.0, 2136.0, 2606.0],
		water: [465.0, 250.0, 238.0, 250.0, 300.0, 243.0, 70.0, 63.0, 84.0, 192.0, 55.0, 135.0],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		days_on: [29, 28, 31, 28, 30, 28, 31, 21, 21, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
		createdAt: expect.any(Date),
		updatedAt: expect.any(Date),
	},
	{
		_id: new ObjectId('555555555555555555555555'),
		startIndex: 43099,
		well: new ObjectId('666666666666666666666666'),
		project: new ObjectId('999999999999999999999999'),
		first_production_index: 0,
		index: [43113, 43144, 43172, 43203, 43233, 43264, 43294, 43325, null, null, null, null],
		oil: [989.0, 408.0, 790.0, 878.0, 810.0, 150.0, 0.0, 1289.0, null, null, null, null],
		gas: [2663.0, 768.0, 1331.0, 2100.0, 1570.0, 146.0, 5.0, 3296.0, null, null, null, null],
		water: [88.0, 100.0, 29.0, 115.0, 63.0, 3.0, 0.0, 136.0, null, null, null, null],
		operational_tag: [null, null, null, null, null, null, null, null, null, null, null, null],
		choke: [null, null, null, null, null, null, null, null, null, null, null, null],
		days_on: [null, null, null, null, null, null, null, null, null, null, null, null],
		gasInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		waterInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		co2Injection: [null, null, null, null, null, null, null, null, null, null, null, null],
		steamInjection: [null, null, null, null, null, null, null, null, null, null, null, null],
		ngl: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber0: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber1: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber2: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber3: [null, null, null, null, null, null, null, null, null, null, null, null],
		customNumber4: [null, null, null, null, null, null, null, null, null, null, null, null],
		createdAt: expect.any(Date),
		updatedAt: expect.any(Date),
	},
	noProdWell,
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20220803114735-fix-invalid-monthly-production', () => {
	let monthlyProductionCollection;

	beforeAll(async () => {
		db.collection('wells').insertMany(wells);
		monthlyProductionCollection = db.collection('monthly-productions');
		await monthlyProductionCollection.insertMany(monthlyBefore);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const result = await monthlyProductionCollection.find({}).sort({ _id: 1 }).toArray();

		expect(result).toEqual(monthlyAfter);
	});
});
