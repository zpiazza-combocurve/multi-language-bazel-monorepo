import { Connection } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { ForecastSegment } from '@src/models/forecast-data';
import { getMemoryMongoUri } from '@src/test/setup';

import { ApiForecastSegmentInput } from './fields';
import { ForecastParameterService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: ForecastParameterService;
let context: ApiContextV1;
jest.mock('@src/helpers/cloud-caller');

describe('v1/projects/:projectId/forecasts/parameters/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();
		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ForecastParameterService(context);
	});

	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();
	});

	afterAll(async () => {
		await connection.close();
	});
	describe('ForecastParameterService.toDbForecastSegment', () => {
		it('should return valid ForecastSegment array', async () => {
			const apiForecastSegmentInput = [
				{
					segmentType: 'arps',
					startDate: '2022-07-28',
					endDate: '2027-07-14',
					qStart: 497.54078888022735,
					qEnd: 169.84640487327286,
					diEffSec: 0.2708,
					b: 1.3,
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
				},
			] as ApiForecastSegmentInput[];

			const dbForecastSegment = [
				{
					b: 1.3,
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

			expect(service.toDbForecastSegment(apiForecastSegmentInput)).toStrictEqual(dbForecastSegment);
		});
	});
	describe('ForecastParameterService.createSegment', () => {
		it('should return valid SuccessResponse', async () => {
			const dbSegments = [
				{
					b: 0.9,
					c: undefined,
					D_eff: undefined,
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
					D_eff: undefined,
					end_idx: 46580,
					k: undefined,
					name: 'arps_modified',
					q_end: 169.84640487327286,
					q_start: 497.54078888022735,
					start_idx: 44768,
					target_D_eff_sw: 0.06,
				},
			] as ForecastSegment[];
			const forecastId = '62befdc048cddf001246d674';
			const wellId = '5e272d80b78910dd2a1eccc0';
			const phase = 'oil';
			const series = 'best';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(callCloudFunction as any).mockImplementation(() => ({
				status: 'Created',
				segmentsCount: 2,
				id: '62befdc348cddf001246d676',
			}));
			await expect(service.createSegments(dbSegments, forecastId, wellId, phase, series)).resolves.toStrictEqual({
				status: 'Created',
				segmentsCount: 2,
				id: '62befdc348cddf001246d676',
			});
			expect(callCloudFunction).toHaveBeenCalled();
			expect(callCloudFunction).toHaveBeenLastCalledWith({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/post`,
				body: { segments: dbSegments },
				headers: context.headers,
			});
		});
	});

	describe('ForecastParameterService.replaceSegments', () => {
		it('should return valid SuccessResponse', async () => {
			const dbSegments = [
				{
					b: 0.9,
					c: undefined,
					D_eff: undefined,
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
					D_eff: undefined,
					end_idx: 46580,
					k: undefined,
					name: 'arps_modified',
					q_end: 169.84640487327286,
					q_start: 497.54078888022735,
					start_idx: 44768,
					target_D_eff_sw: 0.06,
				},
			] as ForecastSegment[];
			const forecastId = '62befdc048cddf001246d674';
			const wellId = '5e272d80b78910dd2a1eccc0';
			const phase = 'oil';
			const series = 'best';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(callCloudFunction as any).mockImplementation(() => ({
				status: 'Created',
				segmentsCount: 2,
				id: '62befdc348cddf001246d676',
			}));
			await expect(service.replaceSegments(dbSegments, forecastId, wellId, phase, series)).resolves.toStrictEqual(
				{
					status: 'Created',
					segmentsCount: 2,
					id: '62befdc348cddf001246d676',
				},
			);
			expect(callCloudFunction).toHaveBeenCalled();
			expect(callCloudFunction).toHaveBeenLastCalledWith({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/put`,
				body: { segments: dbSegments },
				headers: context.headers,
			});
		});
	});

	describe('ForecastParameterService.deleteSegments', () => {
		it('should return valid SuccessResponse', async () => {
			const forecastId = '62befdc048cddf001246d674';
			const wellId = '5e272d80b78910dd2a1eccc0';
			const phase = 'oil';
			const series = 'best';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(callCloudFunction as any).mockImplementation(() => ({
				errors: [],
				deleteCount: 2,
			}));
			await expect(service.deleteSegments(forecastId, wellId, phase, series)).resolves.toStrictEqual({
				errors: [],
				deleteCount: 2,
			});
			expect(callCloudFunction).toHaveBeenCalled();
			expect(callCloudFunction).toHaveBeenLastCalledWith({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/delete`,
				headers: context.headers,
			});
		});
	});
});
