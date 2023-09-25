// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const typeCurves = require('../../tests/fixtures/type-curves.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const pricingDifferentials = require('../../tests/fixtures/pricing-differentials-assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210110152058-add-pricing-and-differentials-to-type-curves');

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

describe('20210110152058-add-pricing-and-differentials-to-type-curves', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('type-curves');
		await db.collection('assumptions').insertMany([...assumptions, ...pricingDifferentials]);
		await collection.insertMany(typeCurves);
	});

	test('up', async () => {
		await up({ db });

		const result = await collection
			.find({ _id: { $in: ['5e41b49612f61e0012dfa852', '5e471774f41ba0814821e3bd'] } })
			.toArray();

		let [
			{
				assumptions: { pricing, differentials },
			},
		] = result.filter((doc) => doc._id === '5e41b49612f61e0012dfa852');
		expect(pricing).toBe('5f2c8e40c7002d044b7391b4');
		expect(differentials).toBe('5f3b0b9b552cd446ead2437d');

		[
			{
				assumptions: { pricing, differentials },
			},
		] = result.filter((doc) => doc._id === '5e471774f41ba0814821e3bd');
		expect(pricing).toBe(null);
		expect(differentials).toBe(null);
	});

	test('down', async () => {
		await down({ db });

		const result = await collection.find({}).toArray();

		result.forEach((tc) => {
			const {
				assumptions: { pricing, differentials },
			} = tc;
			expect(pricing).toBe(undefined);
			expect(differentials).toBe(undefined);
		});
	});
});
