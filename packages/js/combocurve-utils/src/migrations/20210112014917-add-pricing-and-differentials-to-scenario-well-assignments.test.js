// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const scenarioWellAssignments = require('../../tests/fixtures/scenario-well-assignments.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const pricingDifferentials = require('../../tests/fixtures/pricing-differentials-assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210112014917-add-pricing-and-differentials-to-scenario-well-assignments');

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

describe('20210112014917-add-pricing-and-differentials-to-scenario-well-assignments', () => {
	let collection;

	beforeAll(async () => {
		collection = db.collection('scenario-well-assignments');
		await db.collection('assumptions').insertMany([...assumptions, ...pricingDifferentials]);
		await collection.insertMany(scenarioWellAssignments);
	});

	test('up', async () => {
		await up({ db });

		const result = await collection
			.find({ _id: { $in: ['5e274b0c4b97ed0013323c32', '5e274b0c4b97ed0013323c26'] } })
			.toArray();

		const [{ pricing: pricing1, differentials: differentials1 }] = result.filter(
			(doc) => doc._id === '5e274b0c4b97ed0013323c32'
		);
		expect(pricing1).toStrictEqual({
			default: { model: '5f2c8e40c7002d044b7391b4', lookup: '5e274b0c4b97ed0013323c23' },
		});
		expect(differentials1).toStrictEqual({
			default: { model: '5f3b0b9b552cd446ead2437d', lookup: '5e274b0c4b97ed0013323c23' },
		});

		result
			.filter(({ _id }) => ['5e274b0c4b97ed0013323c26', '602d8166e149671da338cd21'].includes(_id))
			.forEach(({ pricing: pricing2, differentials: differentials2 }) => {
				expect(pricing2).toStrictEqual({
					default: {
						model: null,
					},
				});
				expect(differentials2).toStrictEqual({
					default: {
						model: null,
					},
				});
			});
	});

	test('down', async () => {
		await up({ db });
		await down({ db });

		const result = await collection
			.find({ $or: [{ pricing: { $exists: true } }, { differentials: { $exists: true } }] })
			.toArray();
		expect(result).toStrictEqual([]);
	});
});
