// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210811202909-fix-forecast-datas');

let db;
let client;
let mongod;

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('./20210811202909-fix-forecast-datas', () => {
	let forecastDatasCollection;

	beforeAll(async () => {
		forecastDatasCollection = db.collection('forecast-datas');

		await forecastDatasCollection.insertMany([
			{
				name: 'forecast 1',
				forecastType: 'rate',
				P_dict: {
					best: {
						segments: ['something'],
					},
					P10: {
						segments: [],
					},
				},
			},
			{
				name: 'forecast 2',
				forecastType: 'rate',
				P_dict: {
					best: {
						segments: [],
					},
					P10: {
						segments: [],
					},
					P50: {
						segments: [],
					},
					P90: {
						segments: [],
					},
				},
			},
			{
				name: 'forecast 3',
				forecastType: 'rate',
				P_dict: {
					P10: {
						segments: ['something'],
					},
					P50: {
						segments: ['something'],
					},
					P90: {
						segments: ['something'],
					},
					best: {
						segments: ['something'],
					},
				},
			},
		]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const forecast1 = await forecastDatasCollection.findOne({ name: 'forecast 1' });
		expect(forecast1.forecastType).toEqual('rate');

		const forecast2 = await forecastDatasCollection.findOne({ name: 'forecast 2' });
		expect(forecast2.forecastType).toEqual('not_forecasted');

		const forecast3 = await forecastDatasCollection.findOne({ name: 'forecast 3' });
		expect(forecast3.forecastType).toEqual('rate');
		expect(forecast3.P_dict.best.segments[0]).toEqual('something');
	});
});
