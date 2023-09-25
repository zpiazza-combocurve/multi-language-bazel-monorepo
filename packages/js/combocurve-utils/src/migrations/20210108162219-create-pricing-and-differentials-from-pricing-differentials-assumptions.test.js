// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
const {
	up,
	down,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./20210108162219-create-pricing-and-differentials-from-pricing-differentials-assumptions');

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

describe('20210108162219-create-pricing-and-differentials-from-pricing-differentials-assumptions', () => {
	let collection;
	let assumption;

	beforeAll(async () => {
		collection = db.collection('assumptions');
		[assumption] = assumptions.filter(({ assumptionKey }) => assumptionKey === 'pricing_differentials');
		await collection.insertOne(assumption);
	});

	test('up', async () => {
		await up({ db });
		await up({ db }); // test idempotence

		const { _id, options, econ_function, ...rest } = assumption;
		let result = await collection.findOne({ originalId: _id, assumptionKey: 'pricing' });
		delete result._id;

		expect(result).toStrictEqual({
			...rest,
			originalId: _id,
			assumptionName: 'Pricing',
			assumptionKey: 'pricing',
			options: { price_model: options.price_model, breakeven: options.breakeven },
			econ_function: { price_model: econ_function.price_model, breakeven: econ_function.breakeven },
			copiedFrom: null,
		});

		result = await collection.findOne({ originalId: _id, assumptionKey: 'differentials' });
		delete result._id;

		expect(result).toStrictEqual({
			...rest,
			originalId: _id,
			assumptionName: 'Differentials',
			assumptionKey: 'differentials',
			options: { differentials: options.differentials },
			econ_function: { differentials: econ_function.differentials },
			copiedFrom: null,
		});
	});

	test('down', async () => {
		await up({ db });
		await down({ db });

		const results = await collection
			.find({
				assumptionKey: { $in: ['pricing', 'differentials'] },
			})
			.toArray();

		expect(results).toStrictEqual([]);
	});
});
