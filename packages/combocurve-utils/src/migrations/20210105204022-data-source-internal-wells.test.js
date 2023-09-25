// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210105204022-data-source-internal-wells');

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

const initialWells = [
	{ well_name: 'well1', dataPool: 'internal', dataSource: 'other', chosenID: '12345' },
	{ well_name: 'well2', dataPool: 'external', dataSource: 'other', chosenID: '1234' },
];

const finalWells = [
	{ well_name: 'well1', dataPool: 'internal', dataSource: 'internal', chosenID: '12345' },
	{ well_name: 'well2', dataPool: 'external', dataSource: 'other', chosenID: '1234' },
];

describe('20210105204022-data-source-internal-wells', () => {
	let wellsCollection;

	const check = async (expectedWells) => {
		const wells = await wellsCollection.find().sort({ well_name: 1 }).toArray();
		expect(wells).toEqual(expectedWells.map(expect.objectContaining));
	};

	beforeAll(async () => {
		wellsCollection = db.collection('wells');
		await wellsCollection.insertMany(initialWells);
	});

	test('up', async () => {
		await up({ db });
		await check(finalWells);

		await up({ db }); // test idempotence
		await check(finalWells);
	});

	test('down', async () => {
		await up({ db });
		await down({ db });
		await check(initialWells);

		await down({ db }); // test idempotence
		await check(initialWells);
	});
});
