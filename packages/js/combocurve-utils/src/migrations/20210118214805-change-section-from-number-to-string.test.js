// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210118214805-change-section-from-number-to-string');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('wells');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210118214805-change-section-from-number-to-string', () => {
	describe('up', () => {
		test('if field exists', async () => {
			await collection.insertOne({
				section: 25,
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(doc.section).toEqual('25');
		});

		test('if field is null', async () => {
			await collection.insertOne({
				section: null,
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(doc.section).toEqual(null);
		});

		test('if field does not exist', async () => {
			await collection.insertOne({});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(doc.section).toEqual(undefined);
		});
	});

	test('down', async () => {
		await collection.insertOne({
			section: '35',
		});
		await down({ db });
		await down({ db }); // test idempotence
		const doc = await collection.findOne();
		expect(doc.section).toEqual(35);
	});
});
