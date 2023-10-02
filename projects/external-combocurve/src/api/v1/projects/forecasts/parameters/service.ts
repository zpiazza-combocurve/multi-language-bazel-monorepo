import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';
import { notNil } from '@src/helpers/typing';
import { ValidationError } from '@src/helpers/validation';

import { ApiForecastSegmentInput } from './fields';

export interface PostForecastSegmentsResponse {
	errors: ValidationError[];
	segmentsCount: number;
	id: Types.ObjectId;
}

export interface PutForecastSegmentsResponse {
	errors: ValidationError[];
	segmentsCount: number;
	id: Types.ObjectId;
}

export interface DeleteForecastSegmentsResponse {
	errors: ValidationError[];
	deleteCount: number;
}
export class ForecastParameterService extends BaseService<ApiContextV1> {
	static attribute = 'forecastParameterService';
	// TODO: By default, the Date constructor in JavaScript will create a Date object using the local time zone of the computer that's running the code.
	// We need to verify that using the local time zone of the system is the correct behavior.
	toDbForecastSegment = (apiSegments: ApiForecastSegmentInput[]): ForecastSegment[] =>
		apiSegments.map((segment) => {
			return {
				b: segment?.b,
				c: segment?.flatValue,
				D_eff: segment?.diEffSec as number,
				k: segment?.slope,
				end_idx: dateToIndex(new Date(segment.endDate)),
				name: segment?.segmentType,
				q_end: segment?.qEnd,
				q_start: segment?.qStart,
				start_idx: dateToIndex(new Date(segment.startDate)),
				target_D_eff_sw: segment?.targetDSwEffSec,
			};
		});

	async createSegments(
		dbSegments: Array<ForecastSegment>,
		forecastId: string | null = null,
		wellId: string,
		phase: string,
		series: string,
	): Promise<PostForecastSegmentsResponse> {
		let response: PostForecastSegmentsResponse = {
			errors: [],
			segmentsCount: 0,
			id: Types.ObjectId(),
		};
		const nonEmptyDbSegments = dbSegments.filter(notNil);
		if (nonEmptyDbSegments.length) {
			const body = {
				segments: nonEmptyDbSegments,
			};

			response = (await callCloudFunction({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/post`,
				body,
				headers: this.context.headers,
			})) as PostForecastSegmentsResponse;
		}
		return response;
	}

	async deleteSegments(
		forecastId: string,
		wellId: string,
		phase: string,
		series: string,
	): Promise<DeleteForecastSegmentsResponse> {
		let response: DeleteForecastSegmentsResponse = {
			errors: [],
			deleteCount: 0,
		};

		response = (await callCloudFunction({
			fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/delete`,
			headers: this.context.headers,
		})) as DeleteForecastSegmentsResponse;

		return response;
	}

	async replaceSegments(
		dbSegments: Array<ForecastSegment>,
		forecastId: string | null = null,
		wellId: string,
		phase: string,
		series: string,
	): Promise<PutForecastSegmentsResponse> {
		let response: PutForecastSegmentsResponse = {
			errors: [],
			segmentsCount: 0,
			id: Types.ObjectId(),
		};
		const nonEmptyDbSegments = dbSegments.filter(notNil);
		if (nonEmptyDbSegments.length) {
			const body = {
				segments: nonEmptyDbSegments,
			};

			response = (await callCloudFunction({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/parameters/${wellId}/${phase}/${series}/put`,
				body,
				headers: this.context.headers,
			})) as PostForecastSegmentsResponse;
		}
		return response;
	}
}
