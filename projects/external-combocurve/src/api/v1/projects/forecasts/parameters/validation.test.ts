import { Connection } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { ForecastSegment } from '@src/models/forecast-data';
import { getMemoryMongoUri } from '@src/test/setup';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { checkValidPhase, checkValidSeries, checkWellId, parseForecastParameters } from './validation';
import { ForecastParameterService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: ForecastParameterService;
let context: ApiContextV1;

describe('v1/projects/:projectId/forecasts/parameters', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();
		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ForecastParameterService(context);
	});
	afterAll(async () => {
		await connection.close();
	});
	const errorAggregator = new ValidationErrorAggregator();
	describe('validation parsePostForecastParameters', () => {
		it('should return valid ApiForecastSegmentInput array', async () => {
			const input = [
				{
					segmentType: 'arps',
					startDate: '2022-07-28',
					endDate: '2027-07-14T00:00:00.000Z',
					qStart: 497.54078888022735,
					qEnd: 169.84640487327286,
					diEffSec: 0.2708,
					b: 0.9,
					targetDSwEffSec: null,
					flatValue: null,
					slope: null,
				},
				{
					segmentType: 'arps_modified',
					startDate: '2022-07-28',
					endDate: '2027-07-14',
					qStart: 497.54078888022735,
					qEnd: 169.84640487327286,
					diEffSec: 0.2708,
					b: 0.9,
					targetDSwEffSec: 0.06,
					flatValue: null,
					slope: null,
				},
			];

			const output = [
				{
					b: 0.9,
					c: undefined,
					D_eff: 0.2708,
					end_idx: 46580,
					k: undefined,
					name: 'arps',
					q_end: 169.84640487327286,
					q_start: 497.54078888022735,
					start_idx: 44768,
					target_D_eff_sw: undefined,
				},
				{
					b: 0.9,
					c: undefined,
					D_eff: 0.2708,
					end_idx: 46580,
					k: undefined,
					name: 'arps_modified',
					q_end: 169.84640487327286,
					q_start: 497.54078888022735,
					start_idx: 44768,
					target_D_eff_sw: 0.06,
				},
			] as ForecastSegment[];

			expect(parseForecastParameters(input, service, errorAggregator)).toStrictEqual(output);
		});
	});
	describe('path variable validation', () => {
		it('should send error to ValidationErrorAggregator if wellId is not ObjectId', async () => {
			const wellId = '1234567890';
			const errorAggregator = new ValidationErrorAggregator();
			const value = checkWellId(wellId, errorAggregator);
			expect(value).toBeUndefined();
			expect(errorAggregator.getErrorEntries()).toHaveLength(1);
			expect(errorAggregator.getErrorEntries()[0]).toMatchObject(
				expect.objectContaining({
					name: 'TypeError',
					message: '`1234567890` is not a valid ObjectId',
					location: 'request parameters',
				}),
			);
		});

		it('should send error to ValidationErrorAggregator if phase not correct phase', async () => {
			const phase = 'wind';
			const errorAggregator = new ValidationErrorAggregator();
			checkValidPhase(phase, errorAggregator);
			expect(errorAggregator.getErrorEntries()).toHaveLength(1);
			expect(errorAggregator.getErrorEntries()[0]).toMatchObject(
				expect.objectContaining({
					name: 'TypeError',
					message: '`wind` is not a valid phase',
					location: 'request parameters',
				}),
			);
		});

		it('should send error to ValidationErrorAggregator if series is not correct', async () => {
			const series = 'worst';
			const errorAggregator = new ValidationErrorAggregator();
			checkValidSeries(series, errorAggregator);
			expect(errorAggregator.getErrorEntries()).toHaveLength(1);
			expect(errorAggregator.getErrorEntries()[0]).toMatchObject(
				expect.objectContaining({
					name: 'TypeError',
					message: "`worst` is not a valid series. Only 'best' is currently supported",
					location: 'request parameters',
				}),
			);
		});
	});
});
