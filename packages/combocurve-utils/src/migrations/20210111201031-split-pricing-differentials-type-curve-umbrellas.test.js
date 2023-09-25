// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const typeCurveUmbrellas = require('../../tests/fixtures/type-curve-umbrellas.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const pricingDifferentials = require('../../tests/fixtures/pricing-differentials-assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210111201031-split-pricing-differentials-type-curve-umbrellas');

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

describe('20210111201031-split-pricing-differentials-type-curve-umbrellas', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('type-curves-umbrellas');
		await db.collection('assumptions').insertMany([...assumptions, ...pricingDifferentials]);
		await collection.insertMany(typeCurveUmbrellas);
	});

	test('up', async () => {
		await up({ db });

		const tcUmbrella = await collection.findOne({ _id: '5ebc868b63f4dc4248c78460' });
		delete tcUmbrella._id;

		let result = await collection.findOne({ value: '5f3b0b9b552cd446ead2437d' });
		delete result._id;
		expect(result).toStrictEqual({
			...tcUmbrella,
			column: 'assumptions.differentials',
			value: '5f3b0b9b552cd446ead2437d',
		});

		result = await collection.findOne({ value: '5f2c8e40c7002d044b7391b4' });
		delete result._id;
		expect(result).toStrictEqual({
			...tcUmbrella,
			column: 'assumptions.pricing',
			value: '5f2c8e40c7002d044b7391b4',
		});
	});

	test('down', async () => {
		await up({ db });
		await down({ db });

		const results = await collection
			.find({
				column: { $in: ['assumptions.pricing', 'assumptions.differentials'] },
			})
			.toArray();

		expect(results).toStrictEqual([]);
	});
});
