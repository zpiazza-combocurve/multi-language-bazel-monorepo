import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { RecordCountError } from '@src/helpers/validation';

import { deleteForecastParameters, postForecastParameters, putForecastParameters } from './controllers';
import { DeleteForecastSegmentsResponse, PostForecastSegmentsResponse } from './service';
import { getCreatedResponse, ISuccessResponse } from './multi-status';

import { mockExpress } from '@test/express-mocks';

const { CREATED, NO_CONTENT } = StatusCodes;

describe('v1/projects/:projectId/forecasts/parameters/controllers', () => {
	describe('/POST', () => {
		it('should throw RecordCountError upon empty request body', async () => {
			const { req, res } = mockExpress();
			const wellId = Types.ObjectId().toString();
			const phase = 'oil';
			const series = 'best';
			req.params = { wellId: wellId, phase: phase, series: series };
			req.body = [];

			res.status = jest.fn(() => res);
			res.json = jest.fn();
			await expect(postForecastParameters(req, res)).rejects.toThrow(RecordCountError);
		});

		it('should return a 201 status code', async () => {
			const { req, res } = mockExpress();

			const projectId = Types.ObjectId().toString();
			const forecastId = Types.ObjectId().toString();
			const wellId = Types.ObjectId().toString();
			const forecastDataId = Types.ObjectId().toString();
			const phase = 'oil';
			const series = 'best';

			const expectedResponse: ISuccessResponse = {
				status: 'Created',
				segmentsCount: 2,
				id: forecastDataId,
			};

			const data = [
				{
					segmentType: 'arps',
					startDate: '2022-07-28',
					endDate: '2027-07-14T00:00:00.000Z',
					qStart: 497.54078888022735,
					qEnd: 169.84640487327286,
					diEffSec: 0.2708,
					b: 0.9,
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
			];
			const dbSegments = [
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
			];
			const serviceResponse: PostForecastSegmentsResponse = {
				segmentsCount: dbSegments.length,
				id: Types.ObjectId(forecastDataId),
				errors: [],
			};

			req.params = { wellId: wellId, phase: phase, series: series };
			req.body = data;
			res.locals = {
				service: {
					toDbForecastSegment: () => dbSegments,
					createSegments: () => serviceResponse,
				},
				project: {
					_id: projectId,
				},
				forecast: {
					id: forecastId,
				},
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			await postForecastParameters(req, res);
			const actualResponse = getCreatedResponse(serviceResponse.segmentsCount, serviceResponse.id);
			actualResponse.id = forecastDataId;
			expect(res.status).toHaveBeenCalledWith(CREATED);
			expect(expectedResponse).toMatchObject(actualResponse);
		});
	});

	describe('/PUT', () => {
		it('should throw RecordCountError upon empty request body', async () => {
			const { req, res } = mockExpress();
			const wellId = Types.ObjectId().toString();
			const phase = 'oil';
			const series = 'best';
			req.params = { wellId: wellId, phase: phase, series: series };
			req.body = [];

			res.status = jest.fn(() => res);
			res.json = jest.fn();
			await expect(putForecastParameters(req, res)).rejects.toThrow(RecordCountError);
		});

		it('should return a 201 status code', async () => {
			const { req, res } = mockExpress();

			const projectId = Types.ObjectId().toString();
			const forecastId = Types.ObjectId().toString();
			const wellId = Types.ObjectId().toString();
			const forecastDataId = Types.ObjectId().toString();
			const phase = 'oil';
			const series = 'best';

			const expectedResponse: ISuccessResponse = {
				status: 'Created',
				segmentsCount: 2,
				id: forecastDataId,
			};

			const data = [
				{
					segmentType: 'arps',
					startDate: '2022-07-28',
					endDate: '2027-07-14T00:00:00.000Z',
					qStart: 497.54078888022735,
					qEnd: 169.84640487327286,
					diEffSec: 0.2708,
					b: 0.9,
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
			];
			const dbSegments = [
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
			];
			const serviceResponse: PostForecastSegmentsResponse = {
				segmentsCount: dbSegments.length,
				id: Types.ObjectId(forecastDataId),
				errors: [],
			};

			req.params = { wellId: wellId, phase: phase, series: series };
			req.body = data;
			res.locals = {
				service: {
					toDbForecastSegment: () => dbSegments,
					replaceSegments: () => serviceResponse,
				},
				project: {
					_id: projectId,
				},
				forecast: {
					id: forecastId,
				},
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			await putForecastParameters(req, res);
			const actualResponse = getCreatedResponse(serviceResponse.segmentsCount, serviceResponse.id);
			actualResponse.id = forecastDataId;
			expect(res.status).toHaveBeenCalledWith(CREATED);
			expect(expectedResponse).toMatchObject(actualResponse);
		});
	});

	describe('/DELETE', () => {
		it('should return a 204 status code', async () => {
			const { req, res } = mockExpress();
			const projectId = Types.ObjectId().toString();
			const forecastId = Types.ObjectId().toString();
			const wellId = Types.ObjectId().toString();
			const phase = 'oil';
			const series = 'best';

			const serviceResponse: DeleteForecastSegmentsResponse = {
				errors: [],
				deleteCount: 0,
			};

			req.params = { wellId: wellId, phase: phase, series: series };
			res.locals = {
				service: {
					deleteSegments: () => serviceResponse,
				},
				project: {
					_id: projectId,
				},
				forecast: {
					id: forecastId,
				},
			};
			res.status = jest.fn(() => res);
			res.json = jest.fn();
			req.params = { wellId: wellId, phase: phase, series: series };

			await deleteForecastParameters(req, res);
			expect(res.status).toHaveBeenCalledWith(NO_CONTENT);
		});
	});
});
