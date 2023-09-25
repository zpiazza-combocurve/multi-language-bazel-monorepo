import { setupTestDbManager } from '@combocurve/shared/tests';
import { Types } from 'mongoose';

import forecasts from '../../tests/fixtures/forecasts.json';
import { FORECAST_BASE_PHASES, FORECAST_TYPES, ForecastModel } from '../entities/forecast';
import { ForecastService, MAX_WELLS_IN_FORECAST } from './forecasts';

const { ObjectId } = Types;

let service: ForecastService;
const testDbManager = setupTestDbManager();
beforeAll(async () => {
	service = new ForecastService(testDbManager.context);
	await testDbManager.context.models.ForecastModel.insertMany(
		forecasts.map((f) => new testDbManager.context.models.ForecastModel(f))
	);
});

describe('shared/services/forecast', () => {
	test('addWellsToForecast', async () => {
		const probabilisticForecast = (
			await testDbManager.context.models.ForecastModel.findOne({ type: FORECAST_TYPES.Probabilistic })
		)?.toObject() as ForecastModel;
		const deterministicForecast = (
			await testDbManager.context.models.ForecastModel.findOne({ type: FORECAST_TYPES.Deterministic })
		)?.toObject() as ForecastModel;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const newWellIds = [ObjectId(), ObjectId()];
		probabilisticForecast.wells.push(...newWellIds);

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const deterministicNewWells = [ObjectId(), ...newWellIds];
		deterministicForecast.wells.push(...deterministicNewWells);
		const getForecastWellQuery = (forecastId, wellsToInclude) => ({
			forecast: forecastId,
			well: { $in: wellsToInclude },
		});

		await expect(
			service.addWellsToForecast(probabilisticForecast._id, probabilisticForecast.wells)
		).resolves.toStrictEqual({
			message: `Successfully Added ${newWellIds.length} well(s) To Forecast`,
			wellsIds: probabilisticForecast.wells.map((wellId) => wellId.toString()),
		});
		const probabilisticForecastWellAssignments =
			await testDbManager.context.models.ForecastWellAssignmentModel.countDocuments(
				getForecastWellQuery(probabilisticForecast._id, newWellIds)
			);
		expect(probabilisticForecastWellAssignments).toBe(newWellIds.length);

		const probabilisticForecastData = await testDbManager.context.models.ForecastDataModel.countDocuments(
			getForecastWellQuery(probabilisticForecast._id, newWellIds)
		);
		const probabilisticForecastDataSaved = newWellIds.length * FORECAST_BASE_PHASES.length;
		expect(probabilisticForecastData).toBe(probabilisticForecastDataSaved);

		await expect(
			service.addWellsToForecast(deterministicForecast._id, deterministicForecast.wells)
		).resolves.toStrictEqual({
			message: `Successfully Added ${deterministicNewWells.length} well(s) To Forecast`,
			wellsIds: deterministicForecast.wells.map((y) => y.toString()),
		});

		const deterministicForecastWellAssignments =
			await testDbManager.context.models.ForecastWellAssignmentModel.countDocuments(
				getForecastWellQuery(deterministicForecast._id, deterministicNewWells)
			);
		expect(deterministicForecastWellAssignments).toBe(deterministicNewWells.length);

		const deterministicForecastData =
			await testDbManager.context.models.DeterministicForecastDataModel.countDocuments(
				getForecastWellQuery(deterministicForecast._id, deterministicNewWells)
			);
		const deterministicForecastDataSaved = deterministicNewWells.length * FORECAST_BASE_PHASES.length;
		expect(deterministicForecastData).toBe(deterministicForecastDataSaved);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars, new-cap -- TODO eslint fix later
		const maxWellsIdsInForecast = [...Array(MAX_WELLS_IN_FORECAST)].map((y) => ObjectId());
		probabilisticForecast.wells.push(...maxWellsIdsInForecast);

		await expect(
			service.addWellsToForecast(probabilisticForecast._id, probabilisticForecast.wells)
		).resolves.toStrictEqual({
			message: `Wells Added Exceed ${MAX_WELLS_IN_FORECAST} Well Forecast Limit`,
			wellsIds: [],
		});
	});
});
