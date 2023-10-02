import { Connection, Types } from 'mongoose';
import { cloneDeep } from 'lodash';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IForecast } from '@src/models/forecasts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { defaultSettings, SELECTED_ID_KEY } from './fields';
import { AriesForecastDataService } from './service';

import duplicateSelectedIdForecasts from '@test/fixtures/aries-export/duplicate-selected-id/forecasts.json';
import duplicateSelectedIdForecastWells from '@test/fixtures/aries-export/duplicate-selected-id/wells.json';
import forecasts from '@test/fixtures/forecasts.json';
import { getTenantInfo } from '@test/tenant';
import missingSelectedIdForecasts from '@test/fixtures/aries-export/missing-selected-id/forecasts.json';
import missingSelectedIdForecastWells from '@test/fixtures/aries-export/missing-selected-id/wells.json';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: AriesForecastDataService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let forecast: BaseForecastResolved;
let scopeFilter;

describe('v1/projects/:projectId/forecasts/:forecastId/aries/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new AriesForecastDataService(context);

		await context.models.ForecastModel.bulkWrite(
			forecasts.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.ForecastModel.bulkWrite(
			duplicateSelectedIdForecasts.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.ForecastModel.bulkWrite(
			missingSelectedIdForecasts.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.WellModel.bulkWrite(
			duplicateSelectedIdForecastWells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.WellModel.bulkWrite(
			missingSelectedIdForecastWells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);
	});

	beforeEach(() => {
		postApi.mockClear();
	});

	afterAll(async () => {
		await connection.close();
	});

	test('getAriesForecastData', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'probabilistic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };

		service.getAriesData = jest.fn(async () => []);

		await expect(service.getAriesForecastData(0, 0, { well: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: [],
			hasNext: false,
			cursor: null,
		});

		await service.getAriesForecastData(
			0,
			0,
			{ well: 1 },
			{ pSeries: ['P50'], endingCondition: ['absolute_date'] },
			project,
			forecast,
		);
		const forecastDoc = await context.models.ForecastModel.findOne({ ...scopeFilter });
		const wells = await context.models.WellModel.find({
			_id: { $in: forecastDoc ? forecastDoc.wells : [] },
		}).distinct('_id');
		expect(service.getAriesData).toHaveBeenCalledWith(forecast.id, wells, {
			...cloneDeep(defaultSettings),
			pSeries: 'P50',
			endingCondition: 'absolute_date',
		});
	});

	test('getAriesForecastData with duplicate selected ids', async () => {
		SELECTED_ID_KEY.forEach(async (selectedIdKey) => {
			const dbForecast = (forecast = duplicateSelectedIdForecasts[0] as unknown as IForecast);

			forecast = { name: dbForecast.name, id: dbForecast._id.toString(), type: dbForecast.type };
			project = { name: 'Test Project', _id: dbForecast.project };

			const expectedErrorMessage = `One or more Wells in this Forecast have missing or duplicate values for: ${selectedIdKey}`;

			service.getAriesData = jest.fn(async () => []);
			await expect(async () => {
				await service.getAriesForecastData(0, 100, {}, { selectedIdKey: [selectedIdKey] }, project, forecast);
			}).rejects.toThrow(expectedErrorMessage);
		});
	});

	test('getAriesForecastData with missing selected ids', async () => {
		SELECTED_ID_KEY.forEach(async (selectedIdKey) => {
			const dbForecast = (forecast = missingSelectedIdForecasts[0] as unknown as IForecast);

			forecast = { name: dbForecast.name, id: dbForecast._id.toString(), type: dbForecast.type };
			project = { name: 'Test Project', _id: dbForecast.project };

			const expectedErrorMessage = `One or more Wells in this Forecast have missing or duplicate values for: ${selectedIdKey}`;

			service.getAriesData = jest.fn(async () => []);
			await expect(async () => {
				await service.getAriesForecastData(0, 100, {}, { selectedIdKey: [selectedIdKey] }, project, forecast);
			}).rejects.toThrow(expectedErrorMessage);
		});
	});

	test('getAriesForecastsCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'probabilistic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };
		let forecastDoc = await context.models.ForecastModel.findOne({ ...scopeFilter });
		let count = await context.models.WellModel.countDocuments({
			_id: { $in: forecastDoc ? forecastDoc.wells : [] },
		});
		await expect(service.getAriesForecastDataCount({}, project, forecast)).resolves.toBe(count);

		const well = '5e272d7ab78910dd2a1dfdc3';
		count = await context.models.WellModel.countDocuments({ _id: well });
		await expect(
			service.getAriesForecastDataCount({ well: ['5e272d7ab78910dd2a1dfdc3'] }, project, forecast),
		).resolves.toBe(count);

		forecastDoc = await context.models.ForecastModel.findOne({ ...scopeFilter });
		count = await context.models.WellModel.countDocuments({ _id: { $in: forecastDoc ? forecastDoc.wells : [] } });
		await expect(
			service.getAriesForecastDataCount({ notForecastDataField: ['test'] }, project, forecast),
		).resolves.toBe(count);
	});
});
