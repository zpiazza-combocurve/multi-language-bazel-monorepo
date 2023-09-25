// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210928193520-type-curve-lookup-tables-risk-factor');

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

describe('20210928193520-type-curve-lookup-tables-risk-factor', () => {
	let forecastLookupTablesCollection;

	beforeAll(async () => {
		forecastLookupTablesCollection = db.collection('forecast-lookup-tables');

		await forecastLookupTablesCollection.insertMany([
			{
				name: 'lookup 1',
				rules: [
					{
						riskFactor: 1,
					},
				],
			},
			{
				name: 'lookup 2',
			},
			{
				name: 'lookup 3',
				rules: [
					{
						applyNormalization: true,
					},
				],
			},
		]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const lookup1 = await forecastLookupTablesCollection.findOne({ name: 'lookup 1' });
		expect(lookup1).toEqual({
			_id: lookup1._id,
			name: 'lookup 1',
			rules: [{ riskFactorWater: 1, riskFactorOil: 1, riskFactorGas: 1 }],
		});

		const lookup2 = await forecastLookupTablesCollection.findOne({ name: 'lookup 2' });
		expect(lookup2).toEqual({
			_id: lookup2._id,
			name: 'lookup 2',
		});

		const lookup3 = await forecastLookupTablesCollection.findOne({ name: 'lookup 3' });
		expect(lookup3).toEqual({
			_id: lookup3._id,
			name: 'lookup 3',
			rules: [{ applyNormalization: true }],
		});
	});
});
