"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tests_1 = require("@combocurve/shared/tests");
const mongoose_1 = require("mongoose");
const forecasts_json_1 = __importDefault(require("../../tests/fixtures/forecasts.json"));
const forecast_1 = require("../entities/forecast");
const forecasts_1 = require("./forecasts");
const { ObjectId } = mongoose_1.Types;
let service;
const testDbManager = (0, tests_1.setupTestDbManager)();
beforeAll(async () => {
    service = new forecasts_1.ForecastService(testDbManager.context);
    await testDbManager.context.models.ForecastModel.insertMany(forecasts_json_1.default.map((f) => new testDbManager.context.models.ForecastModel(f)));
});
describe('shared/services/forecast', () => {
    test('addWellsToForecast', async () => {
        const probabilisticForecast = (await testDbManager.context.models.ForecastModel.findOne({ type: forecast_1.FORECAST_TYPES.Probabilistic }))?.toObject();
        const deterministicForecast = (await testDbManager.context.models.ForecastModel.findOne({ type: forecast_1.FORECAST_TYPES.Deterministic }))?.toObject();
        const newWellIds = [ObjectId(), ObjectId()];
        probabilisticForecast.wells.push(...newWellIds);
        const deterministicNewWells = [ObjectId(), ...newWellIds];
        deterministicForecast.wells.push(...deterministicNewWells);
        const getForecastWellQuery = (forecastId, wellsToInclude) => ({
            forecast: forecastId,
            well: { $in: wellsToInclude },
        });
        await expect(service.addWellsToForecast(probabilisticForecast._id, probabilisticForecast.wells)).resolves.toStrictEqual({
            message: `Successfully Added ${newWellIds.length} well(s) To Forecast`,
            wellsIds: probabilisticForecast.wells.map((wellId) => wellId.toString()),
        });
        const probabilisticForecastWellAssignments = await testDbManager.context.models.ForecastWellAssignmentModel.countDocuments(getForecastWellQuery(probabilisticForecast._id, newWellIds));
        expect(probabilisticForecastWellAssignments).toBe(newWellIds.length);
        const probabilisticForecastData = await testDbManager.context.models.ForecastDataModel.countDocuments(getForecastWellQuery(probabilisticForecast._id, newWellIds));
        const probabilisticForecastDataSaved = newWellIds.length * forecast_1.FORECAST_BASE_PHASES.length;
        expect(probabilisticForecastData).toBe(probabilisticForecastDataSaved);
        await expect(service.addWellsToForecast(deterministicForecast._id, deterministicForecast.wells)).resolves.toStrictEqual({
            message: `Successfully Added ${deterministicNewWells.length} well(s) To Forecast`,
            wellsIds: deterministicForecast.wells.map((y) => y.toString()),
        });
        const deterministicForecastWellAssignments = await testDbManager.context.models.ForecastWellAssignmentModel.countDocuments(getForecastWellQuery(deterministicForecast._id, deterministicNewWells));
        expect(deterministicForecastWellAssignments).toBe(deterministicNewWells.length);
        const deterministicForecastData = await testDbManager.context.models.DeterministicForecastDataModel.countDocuments(getForecastWellQuery(deterministicForecast._id, deterministicNewWells));
        const deterministicForecastDataSaved = deterministicNewWells.length * forecast_1.FORECAST_BASE_PHASES.length;
        expect(deterministicForecastData).toBe(deterministicForecastDataSaved);
        const maxWellsIdsInForecast = [...Array(forecasts_1.MAX_WELLS_IN_FORECAST)].map((y) => ObjectId());
        probabilisticForecast.wells.push(...maxWellsIdsInForecast);
        await expect(service.addWellsToForecast(probabilisticForecast._id, probabilisticForecast.wells)).resolves.toStrictEqual({
            message: `Wells Added Exceed ${forecasts_1.MAX_WELLS_IN_FORECAST} Well Forecast Limit`,
            wellsIds: [],
        });
    });
});
