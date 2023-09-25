// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20230321185122-tc-normalization-normalizationtype');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('type-curve-normalizations');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('document-adjustment', () => {
	test('no steps case', async () => {
		await collection.insertOne({
			typeCurve: '123',
			phase: 'oil',
		});

		await up({ db });
		await up({ db });
		const doc = await collection.findOne({ typeCurve: '123' });

		expect(doc.steps).toStrictEqual(undefined);

		await collection.deleteOne({ typeCurve: '123' });
	});

	test('null normalizationType', async () => {
		await collection.insertOne({
			typeCurve: '123',
			phase: 'oil',
			steps: { normalizationType: null },
		});

		await up({ db });
		await up({ db });
		const doc = await collection.findOne({ typeCurve: '123' });

		expect(doc.steps.normalizationType).toStrictEqual('eur');

		await collection.deleteOne({ typeCurve: '123' });
	});

	test('no_normalization normalizationType', async () => {
		await collection.insertOne({
			typeCurve: '123',
			phase: 'oil',
			steps: { normalizationType: 'no_normalization' },
		});

		await up({ db });
		await up({ db });
		const doc = await collection.findOne({ typeCurve: '123' });

		expect(doc.steps.normalizationType).toStrictEqual('eur');

		await collection.deleteOne({ typeCurve: '123' });
	});
});
