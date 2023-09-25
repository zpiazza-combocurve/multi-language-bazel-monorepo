// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { down, up } = require('./20230718162116-add-regressiontype.js');

const ADDED_REGRESSION_TYPE = 'rate';

let tcCollection;
let fitCollection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	tcCollection = db.collection('type-curves');
	fitCollection = db.collection('type-curve-fits');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

const tcDoc = {
	_id: 'type-curve-doc',
};

const tcFitDoc1 = {
	_id: 'type-curve-fit-oil',
	phase: 'oil',
};

const tcFitDoc2 = {
	_id: 'type-curve-fit-gas',
	phase: 'gas',
};

const tcFitDoc3 = {
	_id: 'type-curve-fit-water',
	phase: 'water',
};

const tcDownDoc = {
	_id: 'type-curve-doc-down',
	regressionType: 'rate',
};

const tcFitDownDoc = {
	_id: 'type-curve-fit-doc-down',
	regressionType: 'rate',
};

describe('adding regressionType to existing documents', () => {
	test('adds regressionType to type-curve docs', async () => {
		await tcCollection.insertOne(tcDoc);

		await up({ db });

		const doc = await tcCollection.findOne({ _id: tcDoc._id });

		expect(doc.regressionType).toStrictEqual(ADDED_REGRESSION_TYPE);

		await tcCollection.deleteOne({ _id: tcDoc._id });
	});

	test('adds regressionType to type-curve-fit docs', async () => {
		await fitCollection.insertOne(tcFitDoc1);
		await fitCollection.insertOne(tcFitDoc2);
		await fitCollection.insertOne(tcFitDoc3);

		await up({ db });

		const oilDoc = await fitCollection.findOne({ _id: tcFitDoc1._id });
		const gasDoc = await fitCollection.findOne({ _id: tcFitDoc2._id });
		const waterDoc = await fitCollection.findOne({ _id: tcFitDoc3._id });

		expect(oilDoc.regressionType).toStrictEqual(ADDED_REGRESSION_TYPE);
		expect(gasDoc.regressionType).toStrictEqual(ADDED_REGRESSION_TYPE);
		expect(waterDoc.regressionType).toStrictEqual(ADDED_REGRESSION_TYPE);
		expect(oilDoc.phase).toStrictEqual(tcFitDoc1.phase);
		expect(gasDoc.phase).toStrictEqual(tcFitDoc2.phase);
		expect(waterDoc.phase).toStrictEqual(tcFitDoc3.phase);

		await fitCollection.deleteOne({ _id: tcFitDoc1._id });
		await fitCollection.deleteOne({ _id: tcFitDoc2._id });
		await fitCollection.deleteOne({ _id: tcFitDoc3._id });
	});

	test('removes regressionType when reverting migration', async () => {
		await tcCollection.insertOne(tcDownDoc);
		await fitCollection.insertOne(tcFitDownDoc);

		await down({ db });

		const downTcDoc = await tcCollection.findOne({ _id: tcDownDoc._id });
		const downFitDoc = await fitCollection.findOne({ _id: tcFitDownDoc._id });

		expect(downTcDoc).not.toHaveProperty('regressionType');
		expect(downFitDoc).not.toHaveProperty('regressionType');

		await tcCollection.deleteOne({ _id: tcDownDoc._id });
		await fitCollection.deleteOne({ _id: tcFitDownDoc._id });
	});
});
