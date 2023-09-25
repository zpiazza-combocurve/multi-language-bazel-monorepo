// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210401154409-remove-invalid-comparisonids');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('forecasts');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210401154409-remove-invalid-comparisonids', () => {
	test('up', async () => {
		const id1 = new ObjectId();
		const id2 = new ObjectId();

		await collection.insert({
			_id: id1,
			comparisonIds: {
				view: [new ObjectId(), new ObjectId()],
				manual: [new ObjectId(), new ObjectId()],
				diagnostics: [new ObjectId(), new ObjectId()],
			},
		});

		await collection.insert({
			_id: id2,
			comparisonIds: {
				view: {
					ids: [new ObjectId(), new ObjectId()],
				},
				manual: {
					ids: [new ObjectId(), new ObjectId()],
				},
				diagnostics: {
					ids: [new ObjectId(), new ObjectId()],
				},
			},
		});

		await up({ db });
		await up({ db }); // test idempotence

		const doc1 = await collection.findOne({ _id: id1 });
		const doc2 = await collection.findOne({ _id: id2 });

		expect(doc1).not.toHaveProperty('comparisonIds');
		expect(doc2).toHaveProperty('comparisonIds.view.ids');
	});
});
