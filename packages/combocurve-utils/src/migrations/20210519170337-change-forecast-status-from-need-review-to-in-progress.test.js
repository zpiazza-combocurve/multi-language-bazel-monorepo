// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210519170337-change-forecast-status-from-need-review-to-in-progress');

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

test('20210519170337-change-forecast-status-from-need-review-to-in-progress', async () => {
	let forecastDatas;
	let deterministicForecastDatas;

	await db.collection('forecast-datas').insertMany([
		{
			status: 'need_review',
		},
		{
			status: 'approved',
		},
	]);

	await db.collection('deterministic-forecast-datas').insertMany([
		{
			status: 'need_review',
		},
		{
			status: 'approved',
		},
	]);

	await up({ db });

	forecastDatas = await db.collection('forecast-datas').find({ status: 'in_progress' }).toArray();
	deterministicForecastDatas = await db
		.collection('deterministic-forecast-datas')
		.find({ status: 'in_progress' })
		.toArray();

	expect(forecastDatas.length).toEqual(1);
	expect(deterministicForecastDatas.length).toEqual(1);

	await down({ db });

	forecastDatas = await db.collection('forecast-datas').find({ status: 'in_progress' }).toArray();
	deterministicForecastDatas = await db
		.collection('deterministic-forecast-datas')
		.find({ status: 'in_progress' })
		.toArray();

	expect(forecastDatas.length).toEqual(0);
	expect(deterministicForecastDatas.length).toEqual(0);
});
