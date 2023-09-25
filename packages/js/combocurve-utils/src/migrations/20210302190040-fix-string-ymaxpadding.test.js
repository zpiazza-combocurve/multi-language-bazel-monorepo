// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210302190040-fix-string-ymaxpadding');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('forecast-configurations');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210302190040-fix-string-ymaxpadding', () => {
	describe('up', () => {
		test('if field is string', async () => {
			await collection.insert({
				deterministicGridChart: {
					configurations: {
						'20201002t171636m440txc9f': { configuration: { graphSettings: { yMaxPadding: '50' } } },
					},
				},
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(
				doc.deterministicGridChart.configurations['20201002t171636m440txc9f'].configuration.graphSettings
					.yMaxPadding
			).toEqual(50);
		});

		test('if field is number', async () => {
			await collection.insert({
				deterministicGridChart: {
					configurations: {
						'20201002t171636m440txc9f': { configuration: { graphSettings: { yMaxPadding: 50 } } },
					},
				},
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(
				doc.deterministicGridChart.configurations['20201002t171636m440txc9f'].configuration.graphSettings
					.yMaxPadding
			).toEqual(50);
		});

		test('if no config', async () => {
			await collection.insert({
				deterministicGridChart: {
					configurations: {},
				},
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(doc.deterministicGridChart.configurations).toEqual({});
		});

		test('if multiple configs', async () => {
			await collection.insert({
				deterministicGridChart: {
					configurations: {
						'20201002t171636m440txc9f': { configuration: { graphSettings: { yMaxPadding: '10' } } },
						'20201028t185704m2459rage': { configuration: { graphSettings: { yMaxPadding: '20' } } },
						'20201029t000334m821tpwiw': { configuration: { graphSettings: { yMaxPadding: '50' } } },
						'20201201t201952m5299g8s9': { configuration: { graphSettings: { yMaxPadding: '100' } } },
					},
				},
				comparisonGridChart: {
					configurations: {
						'20201106t181223m690n0ec9': { configuration: { graphSettings: { yMaxPadding: '10' } } },
						'20201106t181243m204qz46s': { configuration: { graphSettings: { yMaxPadding: 20 } } },
						'20210223t210331m305psu75': { configuration: { graphSettings: { yMaxPadding: '50' } } },
					},
				},
			});
			await up({ db });
			await up({ db }); // test idempotence
			const doc = await collection.findOne();
			expect(
				doc.deterministicGridChart.configurations['20201002t171636m440txc9f'].configuration.graphSettings
					.yMaxPadding
			).toEqual(10);
			expect(
				doc.deterministicGridChart.configurations['20201028t185704m2459rage'].configuration.graphSettings
					.yMaxPadding
			).toEqual(20);
			expect(
				doc.deterministicGridChart.configurations['20201029t000334m821tpwiw'].configuration.graphSettings
					.yMaxPadding
			).toEqual(50);
			expect(
				doc.deterministicGridChart.configurations['20201201t201952m5299g8s9'].configuration.graphSettings
					.yMaxPadding
			).toEqual(100);
			expect(
				doc.comparisonGridChart.configurations['20201106t181223m690n0ec9'].configuration.graphSettings
					.yMaxPadding
			).toEqual(10);
			expect(
				doc.comparisonGridChart.configurations['20201106t181243m204qz46s'].configuration.graphSettings
					.yMaxPadding
			).toEqual(20);
			expect(
				doc.comparisonGridChart.configurations['20210223t210331m305psu75'].configuration.graphSettings
					.yMaxPadding
			).toEqual(50);
		});
	});
});
