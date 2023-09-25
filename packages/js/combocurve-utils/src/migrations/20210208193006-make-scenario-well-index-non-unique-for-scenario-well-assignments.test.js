// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { BulkWriteError, ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210208193006-make-scenario-well-index-non-unique-for-scenario-well-assignments');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('scenario-well-assignments');

	// initial state
	await collection.createIndex(
		{
			scenario: 1,
			well: 1,
		},
		{
			name: 'scenario_1_well_1',
			unique: true,
		}
	);
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210208193006-make-scenario-well-index-non-unique-for-scenario-well-assignments', () => {
	const scenarioId = new ObjectId();

	beforeEach(async () => {
		await collection.insert({
			scenario: scenarioId,
			name: 'unique-name',
		});
	});

	describe('up', () => {
		test('throws mongo error', async () => {
			await expect(
				collection.insert({
					scenario: scenarioId,
					name: 'unique-name',
				})
			).rejects.toThrow(BulkWriteError);
		});

		test('it works', async () => {
			await up({ db });
			await up({ db });

			await collection.insert({
				scenario: scenarioId,
				name: 'unique-name',
			});

			const count = await collection.count({
				scenario: scenarioId,
				name: 'unique-name',
			});

			expect(count).toEqual(2);
		});
	});

	describe('down', () => {
		test('throws mongo error', async () => {
			await up({ db });
			await down({ db });
			await down({ db });

			await expect(
				collection.insert({
					scenario: scenarioId,
					name: 'unique-name',
				})
			).rejects.toThrow(BulkWriteError);
		});
	});
});
