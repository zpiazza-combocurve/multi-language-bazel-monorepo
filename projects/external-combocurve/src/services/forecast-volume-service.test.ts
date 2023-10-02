import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseForecastResolved } from '@src/api/v1/projects/forecasts/fields';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { connectToDb } from '@src/database';
import { dateToIdxParser } from '@src/api/v1/query';
import { ForecastType } from '@src/models/forecasts';
import { ForecastVolumeService } from '@src/services/forecast-volume-service';
import { getMemoryMongoUri } from '@src/test/setup';
import { IForecastData } from '@src/models/forecast-data';

import { dailyVolumes as deterministicForecastDailyVolumes } from '@test/fixtures/forecast-segment-volumes/deterministic/daily-volumes';
import { monthlyVolumes as deterministicForecastMonthlyVolumes } from '@test/fixtures/forecast-segment-volumes/deterministic/monthly-volumes';
import deterministicForecastOutputs from '@test/fixtures/forecast-segment-volumes/deterministic/deterministic-forecast-outputs.json';
import { getTenantInfo } from '@test/tenant';
import { dailyVolumes as probabilisticForecastDailyVolumes } from '@test/fixtures/forecast-segment-volumes/probabilistic/daily-volumes';
import { monthlyVolumes as probabilisticForecastMonthlyVolumes } from '@test/fixtures/forecast-segment-volumes/probabilistic/monthly-volumes';
import probabilisticForecastOutputs from '@test/fixtures/forecast-segment-volumes/probabilistic/probabilistic-forecast-outputs.json';
import { monthlyVolumes as ratioForecastMonthlyVolumes } from '@test/fixtures/forecast-segment-volumes/ratio/monthly-volumes';
import ratioForecastOutputs from '@test/fixtures/forecast-segment-volumes/ratio/deterministic-forecast-outputs.json';
import ratioForecastOutputsWithInvalidBasePhase from '@test/fixtures/forecast-segment-volumes/ratio/deterministic-forecast-outputs-with-invalid-base-phase.json';
import { monthlyVolumes as ratioForecastWithInvalidBasePhaseMonthlyVolumes } from '@test/fixtures/forecast-segment-volumes/ratio/monthly-volumes-with-invalid-base-phase';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: ForecastVolumeService;
let context: ApiContextV1;

const projectId = '62fc0449133c6c001360278f';
const deterministicForecastId = '63c71b71dc737200134c804c';
const probabilisticForecastId = '63c72016dc737200134ca1f7';
const ratioForecastId = '64148ebe4506d000126c6e2a';
const ratioForecastWithInvalidBasePhaseId = '64148ebe4506d000126c6e2b';
const deterministicWellId = '62fc044e65e00505b9f5430e';
const probabilisticWellId = '62fc044e65e00505b9f5430e';

function GetTestValues(
	projectId: string,
	forecastId: string,
	forecastType: ForecastType,
	wellId?: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): { project: BaseProjectResolved; forecast: BaseForecastResolved; countPipeline: any } {
	const project = { name: 'Test Project', _id: Types.ObjectId(projectId) };
	const forecast = {
		name: 'Test Forecast',
		id: Types.ObjectId(forecastId),
		type: forecastType,
	};

	const countPipeline = [
		{
			$match: wellId
				? { well: Types.ObjectId(wellId), project: project._id, forecast: forecast.id }
				: { project: project._id, forecast: forecast.id },
		},
		{
			$group: {
				_id: '$well',
			},
		},
		{ $count: 'count' },
	];

	return { project, forecast, countPipeline };
}

describe('v1/projects/:projectId/forecasts/:forecastId/volumes/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ForecastVolumeService(context);

		await context.models.ProbabilisticForecastDataModel.bulkWrite(
			probabilisticForecastOutputs.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.DeterministicForecastDataModel.bulkWrite(
			deterministicForecastOutputs.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.DeterministicForecastDataModel.bulkWrite(
			ratioForecastOutputs.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.DeterministicForecastDataModel.bulkWrite(
			ratioForecastOutputsWithInvalidBasePhase.map((item) => ({
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

	test('getForecastVolumesCount deterministic with no filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const countResult = await context.models.DeterministicForecastDataModel.aggregate<{ count: number }>(
			countPipeline,
		);

		await expect(service.getForecastVolumesCount({}, project, forecast)).resolves.toBe(countResult[0].count);
	});

	test('getForecastVolumesCount deterministic with well filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(
			projectId,
			deterministicForecastId,
			'deterministic',
			deterministicWellId,
		);

		const countResult = await context.models.DeterministicForecastDataModel.aggregate<{ count: number }>([
			...countPipeline,
		]);

		await expect(service.getForecastVolumesCount({ well: [deterministicWellId] }, project, forecast)).resolves.toBe(
			countResult[0].count,
		);
	});

	test('getForecastVolumesCount deterministic with invalid filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const countResult = await context.models.DeterministicForecastDataModel.aggregate<{ count: number }>(
			countPipeline,
		);

		await expect(
			service.getForecastVolumesCount({ notForecastDataField: ['test'] }, project, forecast),
		).resolves.toBe(countResult[0].count);
	});

	test('getForecastVolumesCount probabilistic with no filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');

		const countResult = await context.models.ProbabilisticForecastDataModel.aggregate<{ count: number }>(
			countPipeline,
		);

		await expect(service.getForecastVolumesCount({}, project, forecast)).resolves.toBe(countResult[0].count);
	});

	test('getForecastVolumesCount probabilistic with well filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(
			projectId,
			probabilisticForecastId,
			'probabilistic',
			probabilisticWellId,
		);

		const countResult = await context.models.ProbabilisticForecastDataModel.aggregate<{ count: number }>([
			...countPipeline,
		]);

		await expect(service.getForecastVolumesCount({ well: [probabilisticWellId] }, project, forecast)).resolves.toBe(
			countResult[0].count,
		);
	});

	test('getForecastVolumesCount probabilistic with invalid filter should return count', async () => {
		const { project, forecast, countPipeline } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');

		const countResult = await context.models.ProbabilisticForecastDataModel.aggregate<{ count: number }>(
			countPipeline,
		);

		await expect(
			service.getForecastVolumesCount({ notForecastDataField: ['test'] }, project, forecast),
		).resolves.toBe(countResult[0].count);
	});

	test('getForecastVolumes deterministic daily with no filter should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const expectedResults = deterministicForecastDailyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result).toEqual(expectedResults);
	});

	test('getForecastVolumes deterministic daily with only startIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetStartIdx = 44360; // The start_idx you want to filter by

		const expectedResults = deterministicForecastDailyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx, //startDate
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes deterministic daily with only endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetEndIdx = 65179; // The start_idx you want to filter by

		const expectedResults = deterministicForecastDailyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			targetEndIdx,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes deterministic daily with both startIdx and endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetStartIdx = 44360;
		const targetEndIdx = 65179;

		const expectedResults = deterministicForecastDailyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx,
			targetEndIdx,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes deterministic daily with mismatched segment ends should return end padded volumes', async () => {
		const outputs = deterministicForecastOutputs.filter(
			(x) => x.description == 'this wells oil segment ends before the 5 year cutoff (2024-11-19)',
		);

		const output = outputs.filter((x) => x.phase == 'oil')[0];

		const { project, forecast } = GetTestValues(output.project, output.forecast, 'deterministic');

		const expectedResults = deterministicForecastDailyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result).toEqual(expectedResults);

		const oilPhase = response.result[0].phases?.filter((x) => x.phase == 'oil')[0];
		const bestOilSeries = oilPhase?.series?.filter((x) => x.series == 'best')[0];
		const oilVolumes = bestOilSeries?.volumes ?? [];

		const firstOilSegmentStartIndex = service.getFirstSegmentStartIndex(outputs as unknown as IForecastData[]);
		const lastOilSegmentEndIndex = output.P_dict.best.segments[output.P_dict.best.segments.length - 1].end_idx;

		const firstPaddingIndex = lastOilSegmentEndIndex - firstOilSegmentStartIndex + 1;

		// the volume directly before our padding should not be zero
		expect(oilVolumes[firstPaddingIndex - 1]).toBeGreaterThan(0);

		// all volumes after the last oil segment index should be zero
		for (let i = firstPaddingIndex; i < oilVolumes.length; i++) {
			expect(oilVolumes[i]).toBe(0);
		}
	});

	test('getForecastVolumes deterministic monthly with no filter should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const expectedResults = deterministicForecastMonthlyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result).toEqual(expectedResults);
	});

	test('getForecastVolumes deterministic monthly with only startIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetStartIdx = 44360; // The start_idx you want to filter by

		const expectedResults = deterministicForecastMonthlyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx, //startDate
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes deterministic monthly with only endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetEndIdx = 65179; // The start_idx you want to filter by

		const expectedResults = deterministicForecastMonthlyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes deterministic monthly with both startIdx and endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const targetStartIdx = 44360;
		const targetEndIdx = 65179;

		const expectedResults = deterministicForecastMonthlyVolumes.filter(
			(x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString(),
		);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(expectedResults.length);
	});

	test('getForecastVolumes probabilistic daily with no filter should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result).toEqual(probabilisticForecastDailyVolumes);
	});

	test('getForecastVolumes probabilistic daily with only startIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetStartIdx = 44390; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx, //startDate
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(probabilisticForecastDailyVolumes.length);
	});

	test('getForecastVolumes probabilistic daily with only endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetEndIdx = 66214; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			targetEndIdx,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(probabilisticForecastDailyVolumes.length);
	});

	test('getForecastVolumes probabilistic daily with both startIdx and endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetStartIdx = 44390;
		const targetEndIdx = 66214;

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx,
			targetEndIdx,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toEqual(probabilisticForecastDailyVolumes.length);
	});

	test('getForecastVolumes probabilistic monthly with no filter should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result).toEqual(probabilisticForecastMonthlyVolumes);
	});

	test('getForecastVolumes probabilistic monthly with only startIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetStartIdx = 44390; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx, //startDate
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(probabilisticForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes probabilistic monthly with only endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetEndIdx = 66214; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(probabilisticForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes probabilistic monthly with both startIdx and endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, probabilisticForecastId, 'probabilistic');
		const targetStartIdx = 44390;
		const targetEndIdx = 66214;

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(probabilisticForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes ratio monthly with no filter should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, ratioForecastId, 'deterministic');

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result).toEqual(ratioForecastMonthlyVolumes);
	});

	test('getForecastVolumes ratio monthly with only startIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, ratioForecastId, 'deterministic');
		const targetStartIdx = 43659; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx, //startDate
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(ratioForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes ratio monthly with only endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, ratioForecastId, 'deterministic');
		const targetEndIdx = 65544; // The start_idx you want to filter by

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(ratioForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes ratio monthly with both startIdx and endIdx should return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, ratioForecastId, 'deterministic');
		const targetStartIdx = 43750;
		const targetEndIdx = 65200;

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			targetStartIdx,
			targetEndIdx,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result.length).toEqual(ratioForecastMonthlyVolumes.length);
	});

	test('getForecastVolumes ratio monthly with invalid base phase with no series data', async () => {
		const { project, forecast } = GetTestValues(projectId, ratioForecastWithInvalidBasePhaseId, 'deterministic');

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'monthly',
		);

		expect(response.result).toEqual(ratioForecastWithInvalidBasePhaseMonthlyVolumes);
	});

	test('getForecastVolumes with take 0 should not return volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const response = await service.getForecastVolumes(
			0,
			0,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response).toEqual({
			cursor: null,
			hasNext: true,
			result: [],
		});
	});

	test('getForecastVolumes with skip 0 take 1 should return volumes with cursor', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const expectedResults = deterministicForecastDailyVolumes.slice(0, 1);
		const expectedCursor = expectedResults[0].well;

		const response = await service.getForecastVolumes(
			0,
			expectedResults.length,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response).toEqual({
			cursor: expectedCursor,
			hasNext: true,
			result: expectedResults,
		});
	});

	test('getForecastVolumes with skip 1 take 1 should return volumes with cursor', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const expectedResults = deterministicForecastDailyVolumes.slice(1, 2);
		const expectedCursor = expectedResults[0].well;

		const response = await service.getForecastVolumes(
			1,
			expectedResults.length,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response).toEqual({
			cursor: expectedCursor,
			hasNext: true,
			result: expectedResults,
		});
	});

	test('getForecastVolumes with cursor should return volumes with cursor', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const cursor = deterministicForecastDailyVolumes[1].well.toHexString();
		const expectedResults = deterministicForecastDailyVolumes.slice(2, 3);
		const expectedCursor = expectedResults[0].well;

		const response = await service.getForecastVolumes(
			0,
			expectedResults.length,
			{ well: 1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
			cursor,
		);

		expect(response).toEqual({
			cursor: expectedCursor,
			hasNext: false,
			result: expectedResults,
		});
	});

	test('getForecastVolumes with reverse sort by well should return sorted volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		// stored daily volume literal is sorted by well by default
		const expectedResults = deterministicForecastDailyVolumes
			.filter((x) => x.forecast.toString() == forecast.id && x.project.toString() == project._id.toString())
			.reverse();

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: -1 },
			undefined,
			undefined,
			{},
			project,
			forecast,
			'daily',
		);

		expect(response.result).toEqual(expectedResults);
	});

	test('getForecastVolumes with well filter should return filtered volumes', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');

		const expectedResults = deterministicForecastDailyVolumes.slice(0, 1);

		const response = await service.getForecastVolumes(
			0,
			200,
			{ well: 1 },
			undefined,
			undefined,
			{ well: [expectedResults[0].well.toHexString()] },
			project,
			forecast,
			'daily',
		);

		expect(response.result.length).toBe(1);

		expect(response.result).toEqual(expectedResults);
	});

	test('getForecastVolumes daily should throw an error when startDate param greater than is after endDate param', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const startDate = dateToIdxParser('2020-01-01');
		const endDate = dateToIdxParser('2019-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, startDate, endDate, {}, project, forecast, 'daily'),
		).rejects.toThrow();
	});

	test('getForecastVolumes monthly should throw an error when startDate param greater than is after endDate param', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const startDate = dateToIdxParser('2020-01-01');
		const endDate = dateToIdxParser('2019-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, startDate, endDate, {}, project, forecast, 'monthly'),
		).rejects.toThrow();
	});

	test('getForecastVolumes daily should throw an error when startDate query param was the only date params set and is after the last segment ends', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const startDate = dateToIdxParser('2099-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, startDate, undefined, {}, project, forecast, 'daily'),
		).rejects.toThrow();
	});

	test('getForecastVolumes monthly should throw an error when startDate query param was the only date params set and is after the last segment ends', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const startDate = dateToIdxParser('2099-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, startDate, undefined, {}, project, forecast, 'monthly'),
		).rejects.toThrow();
	});

	test('getForecastVolumes daily should throw an error when endDate query param was the only date params set and is before the first segment starts', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const endDate = dateToIdxParser('1998-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, undefined, endDate, {}, project, forecast, 'daily'),
		).rejects.toThrow();
	});

	test('getForecastVolumes monthly should throw an error when endDate query param was the only date params set and is before the first segment starts', async () => {
		const { project, forecast } = GetTestValues(projectId, deterministicForecastId, 'deterministic');
		const endDate = dateToIdxParser('1998-01-01');
		await expect(
			service.getForecastVolumes(0, 200, { well: 1 }, undefined, endDate, {}, project, forecast, 'monthly'),
		).rejects.toThrow();
	});
});
