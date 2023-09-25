// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down, defaultDiffOptions, defaultDiffEconFunction } = require('./20210323145237-multiple-differentials');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210323145237-multiple-differentials', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'differentials',
			options: { differentials: defaultDiffOptions },
			econ_function: { differentials: defaultDiffEconFunction },
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.differentials).toStrictEqual({
			differentials_1: { subItems: defaultDiffOptions },
			differentials_2: { subItems: defaultDiffOptions },
		});
		expect(doc.econ_function.differentials).toStrictEqual({
			differentials_1: defaultDiffEconFunction,
			differentials_2: defaultDiffEconFunction,
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'differentials',
			options: {
				differentials: {
					differentials_1: { subItems: defaultDiffOptions },
					differentials_2: { subItems: defaultDiffOptions },
				},
			},
			econ_function: {
				differentials: {
					differentials_1: defaultDiffEconFunction,
					differentials_2: defaultDiffEconFunction,
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.differentials).toStrictEqual(defaultDiffOptions);
		expect(doc.econ_function.differentials).toStrictEqual(defaultDiffEconFunction);
	});
});
