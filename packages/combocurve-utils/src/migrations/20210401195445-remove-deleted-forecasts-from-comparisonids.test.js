// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210401195445-remove-deleted-forecasts-from-comparisonids');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('forecasts');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210401195445-remove-deleted-forecasts-from-comparisonids', () => {
	test('up', async () => {
		const existingForecastId = new ObjectId();
		const missingForecastId = new ObjectId();

		await collection.insert({
			_id: existingForecastId,
		});

		await collection.insert({
			comparisonIds: {
				view: {
					ids: [existingForecastId, missingForecastId],
				},
				manual: {
					ids: [existingForecastId, missingForecastId],
				},
				diagnostics: {
					ids: [existingForecastId, missingForecastId],
				},
			},
		});

		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne({ _id: { $ne: existingForecastId } });

		expect(doc.comparisonIds.view.ids).toEqual([existingForecastId]);
		expect(doc.comparisonIds.manual.ids).toEqual([existingForecastId]);
		expect(doc.comparisonIds.diagnostics.ids).toEqual([existingForecastId]);
	});
});
