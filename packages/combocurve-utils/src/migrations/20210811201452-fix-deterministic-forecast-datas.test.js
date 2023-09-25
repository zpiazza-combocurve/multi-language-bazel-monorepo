// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210811201452-fix-deterministic-forecast-datas');

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

describe('20210811201452-fix-deterministic-forecast-datas', () => {
	let deterministicForecastDatasCollection;

	beforeAll(async () => {
		deterministicForecastDatasCollection = db.collection('deterministic-forecast-datas');

		await deterministicForecastDatasCollection.insertMany([
			{
				name: 'forecast ratio 1',
				forecastType: 'ratio',
				ratio: {
					segments: [],
				},
			},
			{
				name: 'forecast ratio 2',
				forecastType: 'ratio',
				ratio: {},
			},
			{
				name: 'forecast ratio 3',
				forecastType: 'ratio',
				ratio: {
					segments: ['something'],
				},
			},
			{
				name: 'forecast rate 1',
				forecastType: 'rate',
				P_dict: {
					best: {
						segments: [],
					},
				},
			},
			{
				name: 'forecast rate 2',
				forecastType: 'rate',
				P_dict: {},
			},
			{
				name: 'forecast rate 3',
				forecastType: 'rate',
				P_dict: {
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

		const ratio1 = await deterministicForecastDatasCollection.findOne({ name: 'forecast ratio 1' });
		expect(ratio1.forecastType).toEqual('not_forecasted');

		const ratio2 = await deterministicForecastDatasCollection.findOne({ name: 'forecast ratio 2' });
		expect(ratio2.forecastType).toEqual('not_forecasted');

		const ratio3 = await deterministicForecastDatasCollection.findOne({ name: 'forecast ratio 3' });
		expect(ratio3.forecastType).toEqual('ratio');

		const rate1 = await deterministicForecastDatasCollection.findOne({ name: 'forecast rate 1' });
		expect(rate1.forecastType).toEqual('not_forecasted');

		const rate2 = await deterministicForecastDatasCollection.findOne({ name: 'forecast rate 2' });
		expect(rate2.forecastType).toEqual('not_forecasted');

		const rate3 = await deterministicForecastDatasCollection.findOne({ name: 'forecast rate 3' });
		expect(rate3.forecastType).toEqual('rate');
	});
});
