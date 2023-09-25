// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20211215175344-fix-tc-multipliers');

const wellId1 = new ObjectId();
const wellId2 = new ObjectId();
const wellId3 = new ObjectId();

const typeCurveDocs = [
	{
		_id: 'tc-1',
		wells: [wellId1, wellId2, wellId3],
	},
];

const typeCurveNormalizationDoc = {
	_id: 'tc-norm-1',
	typeCurve: 'tc-1',
	phase: 'oil',
	steps: [
		{
			key: 'normalize',
			multiplier: 2,
		},
	],
};

const typeCurveNormalizationWellDocs = [
	{
		_id: 'tc-norm-well-1',
		well: wellId1,
		multipliers: [3],
		typeCurve: 'tc-1',
		phase: 'oil',
	},
	{
		_id: 'tc-norm-well-2',
		well: wellId2,
		multipliers: [4],
		typeCurve: 'tc-1',
		phase: 'oil',
	},
];

/** @type {import('mongodb').Db} */
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

describe('20211215175344-fix-tc-multipliers', () => {
	test('up', async () => {
		await db.collection('type-curves').insertMany(typeCurveDocs);
		await db.collection('type-curve-normalizations').insertMany([typeCurveNormalizationDoc]);
		await db.collection('type-curve-normalization-wells').insertMany(typeCurveNormalizationWellDocs);

		await up({ db });
		await up({ db });

		const tcnw1 = await db.collection('type-curve-normalization-wells').findOne({ _id: 'tc-norm-well-1' });
		expect(tcnw1.multipliers[0]).toEqual(6);

		const tcnw2 = await db.collection('type-curve-normalization-wells').findOne({ _id: 'tc-norm-well-2' });
		expect(tcnw2.multipliers[0]).toEqual(8);

		const tcnw3 = await db.collection('type-curve-normalization-wells').findOne({ well: wellId3 });
		expect(tcnw3.multipliers[0]).toEqual(2);

		// Delete multiplier
		const tcn1 = await db.collection('type-curve-normalizations').findOne({ _id: 'tc-norm-1' });
		expect(tcn1.steps[0].key).toEqual('normalize');
		expect(tcn1.steps[0]).not.toHaveProperty('multiplier');
	});
});
