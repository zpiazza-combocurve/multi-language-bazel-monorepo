// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210707212516-fix-operational-tags-with-null');

let dailyProductionsCollection;
let monthlyProductionsCollection;
let db;
let mongod;
let client;

beforeAll(async () => {
	({ db, mongod, client } = await setupDb());
	dailyProductionsCollection = db.collection('daily-productions');
	monthlyProductionsCollection = db.collection('monthly-productions');
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210707212516-fix-operational-tags-with-null', () => {
	describe('daily', () => {
		it('works', async () => {
			await dailyProductionsCollection.insertOne({
				operational_tag: ['NULL', 'NULL', 1, null, 'something'],
			});

			await up({ db });
			await up({ db }); // test idempotence

			const document = await dailyProductionsCollection.findOne();

			expect(document.operational_tag).toEqual([null, null, 1, null, 'something']);
		});
	});
	describe('monthly', () => {
		it('works', async () => {
			await monthlyProductionsCollection.insertOne({
				operational_tag: ['NULL', 'NULL', 1, null, 'something'],
			});

			await up({ db });
			await up({ db }); // test idempotence

			const document = await monthlyProductionsCollection.findOne();

			expect(document.operational_tag).toEqual([null, null, 1, null, 'something']);
		});
	});
});
