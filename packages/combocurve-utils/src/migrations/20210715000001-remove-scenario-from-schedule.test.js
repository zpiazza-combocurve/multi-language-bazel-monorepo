// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210715000001-remove-scenario-from-schedule');

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

describe('20210715000001-remove-scenario-from-schedule', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('schedules');
		await collection.insertMany([
			{
				_id: '5e41b49612f61e0012dfa851',
				scenario: '5e41b49612f61e0012dfa854',
				scenarioExpireAt: '2020-02-10T19:52:54.159Z',
			},
			{
				_id: '5e41b49612f61e0012dfa852',
				scenario: '5e41b49612f61e0012dfa855',
			},
			{
				_id: '5e41b49612f61e0012dfa853',
				scenarioExpireAt: '2020-02-10T19:52:54.159Z',
			},
		]);
	});

	test('up', async () => {
		await up({ db });

		expect(await collection.find({ scenario: { $exists: true } }).toArray()).toStrictEqual([]);
		expect(await collection.find({ scenarioExpireAt: { $exists: true } }).toArray()).toStrictEqual([]);
	});
});
