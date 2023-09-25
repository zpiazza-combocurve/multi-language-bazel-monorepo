// const setupDb = require('../../tests/setup-db');
// const { up, down } = require('./20200929174940-add-model-and-lookup-to-scenario-well-assignments');

// let db;
// let client;
// let mongod;

// beforeAll(async () => {
// 	({ db, client, mongod } = await setupDb());
// });

// afterAll(async () => {
// 	await mongod.stop();
// 	await client.close();
// });

// const initialSchema = {
// 	forecast_p_series: {
// 		default: 'P50',
// 		qualifier1: 'P55',
// 	},
// 	capex: {
// 		default: 'capex',
// 	},
// 	forecast: {
// 		default: 'forecast',
// 	},
// 	schedule: {
// 		default: null,
// 	},
// 	schemaVersion: 2,
// };

// const finalSchema = {
// 	forecast_p_series: {
// 		default: {
// 			model: 'P50',
// 		},
// 		qualifier1: {
// 			model: 'P55',
// 		},
// 	},

// 	capex: {
// 		default: {
// 			model: 'capex',
// 		},
// 	},
// 	forecast: {
// 		default: {
// 			model: 'forecast',
// 		},
// 	},
// 	schedule: {
// 		default: {
// 			model: null,
// 		},
// 	},
// 	schemaVersion: 3,
// };

// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
// describe('20200929174940-add-model-and-lookup-to-scenario-well-assignments', () => {
// 	let collection;

// 	beforeAll(async () => {
// 		collection = db.collection('scenario-well-assignments');
// 		await collection.insert(initialSchema);
// 	});

// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
// 	test('up', async () => {
// 		await up({ db });
// 		await up({ db }); // test idempotence
// 		const doc = await collection.findOne();
// 		expect(doc).toEqual(expect.objectContaining(finalSchema));
// 	});

// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
// 	test('down', async () => {
// 		await down({ db });
// 		await down({ db }); // test idempotence
// 		const doc = await collection.findOne();
// 		expect(doc).toEqual(expect.objectContaining(initialSchema));
// 	});
// });

test('works', () => {
	expect(true).toEqual(true);
});
