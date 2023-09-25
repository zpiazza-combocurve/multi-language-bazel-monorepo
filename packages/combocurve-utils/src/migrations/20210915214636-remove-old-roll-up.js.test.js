// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210915214636-remove-old-roll-up');

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

describe('20210915214636-remove-old-roll-up', () => {
	let scenRollUpRunsCollection;
	let forecastRollUpRunsCollection;

	beforeAll(async () => {
		scenRollUpRunsCollection = db.collection('scen-roll-up-runs');
		forecastRollUpRunsCollection = db.collection('forecast-roll-up-runs');

		await scenRollUpRunsCollection.insertMany([
			{
				name: 'scenario 1',
			},
			{
				name: 'scenario 2',
			},
		]);
		await forecastRollUpRunsCollection.insertMany([
			{
				name: 'forecast 1',
			},
			{
				name: 'forecast 2',
			},
		]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const scenRollUpCount = await scenRollUpRunsCollection.count({});
		const forecastRollUpCount = await forecastRollUpRunsCollection.count({});

		expect(scenRollUpCount).toEqual(0);
		expect(forecastRollUpCount).toEqual(0);
	});
});
