import { Connection } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { ForecastType } from '@src/models/forecasts';
import { getMemoryMongoUri } from '@src/test/setup';

import { getForecastDataModel } from './context';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

jest.mock('@src/api/v1/context');

let mongoUri: string;
let connection: Connection;
let context: ApiContextV1;

describe('helpers/context/getForecastDataModel', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});
	afterAll(async () => {
		await connection.close();
	});

	it.each([
		['deterministic' as ForecastType, 'deterministic-forecast-datas'],
		['probabilistic' as ForecastType, 'forecast-datas'],
	])('shouldReturnCorrectModel', (forecastType: ForecastType, modelName: string) => {
		const result = getForecastDataModel(context, forecastType);

		expect(result.modelName).toBe(modelName);
	});
});
