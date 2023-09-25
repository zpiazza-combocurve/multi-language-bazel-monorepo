// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210701194409-update-undiscounted-roi-wells');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('wells');
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210701194409-update-undiscounted-roi-wells', () => {
	it('works', async () => {
		await collection.insertMany([
			{
				wellNumber: 1,
				undiscounted_roi: 2000,
			},
			{
				wellNumber: 2,
				undiscounted_roi: null,
			},
			{
				wellNumber: 3,
			},
		]);
		await up({ db });
		await up({ db }); // test idempotence

		let well1 = await collection.findOne({ wellNumber: 1 });
		let well2 = await collection.findOne({ wellNumber: 2 });
		let well3 = await collection.findOne({ wellNumber: 3 });

		expect(well1.undiscounted_roi).toEqual(20);
		expect(well1.schemaVersion).toEqual(1);
		expect(well2.undiscounted_roi).toEqual(null);
		expect(well2.schemaVersion).toEqual(1);
		expect(well3.undiscounted_roi).toEqual(null);
		expect(well3.schemaVersion).toEqual(1);

		await down({ db });
		await down({ db }); // test idempotence

		well1 = await collection.findOne({ wellNumber: 1 });
		well2 = await collection.findOne({ wellNumber: 2 });
		well3 = await collection.findOne({ wellNumber: 3 });

		expect(well1.undiscounted_roi).toEqual(2000);
		expect(well1).not.toHaveProperty('schemaVersion');
		expect(well2.undiscounted_roi).toEqual(null);
		expect(well2).not.toHaveProperty('schemaVersion');
		expect(well3.undiscounted_roi).toEqual(null);
		expect(well3).not.toHaveProperty('schemaVersion');
	});
});
