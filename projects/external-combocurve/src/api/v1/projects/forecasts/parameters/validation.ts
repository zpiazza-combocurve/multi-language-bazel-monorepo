import { Types } from 'mongoose';

import { BASE_PHASES, ForecastSegment, P_SERIES } from '@src/models/forecast-data';
import { isNil, notNil, removeNilProperties } from '@src/helpers/typing';
import {
	isNumber,
	isObject,
	isValidIso8601Date,
	parseObjectId,
	RequestStructureError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';

import { ValidationErrorAggregator } from '../../../multi-error';

import { API_SEGMENT_TYPE_MAP, ApiForecastSegmentInput } from './fields';
import { ForecastParameterService } from './service';

export class UnknownSegmentTypeError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, UnknownSegmentTypeError.name, statusCode);
	}
}

export const checkWellId = (
	wellId: string | undefined,
	errorAggregator: ValidationErrorAggregator,
): Types.ObjectId | undefined => errorAggregator.catch(() => parseObjectId(wellId, 'request parameters'));

export const checkValidPhase = (phase: string | undefined, errorAggregator: ValidationErrorAggregator): void => {
	if (isNil(phase) || (BASE_PHASES as unknown as Array<string>).includes(phase) === false) {
		errorAggregator.catch(() => {
			throw new TypeError(`\`${phase}\` is not a valid phase`, 'request parameters');
		});
	}
};

export const checkValidSeries = (series: string | undefined, errorAggregator: ValidationErrorAggregator): void => {
	//TODO: HG - If we find that we want to support other series, we can remove this check.
	errorAggregator.catch(() => {
		if (series !== 'best') {
			throw new TypeError(
				`\`${series}\` is not a valid series. Only 'best' is currently supported`,
				'request parameters',
			);
		}
		if ((P_SERIES as unknown as Array<string>).includes(series) === false) {
			throw new TypeError(`\`${series}\` is not a valid series`, 'request parameters');
		}
	});
};

export const parseForecastParameters = (
	data: unknown[],
	service: ForecastParameterService,
	errorAggregator: ValidationErrorAggregator,
): ForecastSegment[] => {
	const validSegmentsStructure = data.map((segment: unknown, index) => {
		if (!isObject(segment)) {
			errorAggregator.catch(() => {
				throw new RequestStructureError('Invalid segment data structure', `[${index}]`);
			});
		} else {
			if (isNil(segment.segmentType)) {
				errorAggregator.catch(() => {
					throw new RequestStructureError('segmentType is required', `[${index}]`);
				});
			}

			if (isNil(segment.startDate)) {
				errorAggregator.catch(() => {
					throw new RequestStructureError('startDate is required', `[${index}]`);
				});
			}
			if (isNil(segment.endDate)) {
				errorAggregator.catch(() => {
					throw new RequestStructureError('endDate is required', `[${index}]`);
				});
			}
		}
		return removeNilProperties(segment as ApiForecastSegmentInput);
	});
	const nonNilSegments = validSegmentsStructure.filter(notNil);
	const validApiSegments = validateSegments(nonNilSegments, errorAggregator).filter(notNil);
	const dbSegments = service.toDbForecastSegment(validApiSegments);
	return dbSegments;
};

export const validateNumberFields = (
	propertyName: string,
	propertyValue: string | number | undefined,
	index: number,
): void => {
	if (!isNumber(propertyValue)) {
		throw new RequestStructureError(`${propertyName} must be a number`, `[${index}]`);
	}
};

export const validateDateFields = (
	propertyName: string,
	propertyValue: string | number | undefined,
	index: number,
): void => {
	if (!isValidIso8601Date(propertyValue)) {
		throw new RequestStructureError(`${propertyName} is not in the correct ISO 8601 format`, `[${index}]`);
	}
};

export const checkMissingFields = (
	propertiesToCheck: string[],
	requiredProperties: string[],
	segment: ApiForecastSegmentInput,
	index: number,
): void => {
	const missingRequiredFields = requiredProperties.filter((p) => !propertiesToCheck.includes(p));
	if (missingRequiredFields.length) {
		throw new RequestStructureError(
			`Missing required segment parameter(s): ${missingRequiredFields} for the ${segment.segmentType} segment`,
			`[${index}]`,
		);
	}
};

export const checkExtraneousFields = (
	propertiesToCheck: string[],
	requiredProperties: string[],
	segment: ApiForecastSegmentInput,
	index: number,
): void => {
	const extraneousFields = propertiesToCheck.filter((p) => !requiredProperties.includes(p));
	if (extraneousFields.length) {
		throw new RequestStructureError(
			`Incorrect segment parameter(s): ${extraneousFields} provided for the ${segment.segmentType} segment`,
			`[${index}]`,
		);
	}
};

const validateSegments = (
	segmentsToValidate: ApiForecastSegmentInput[],
	errorAggregator: ValidationErrorAggregator,
) => {
	return segmentsToValidate.map((segment, index) => {
		const requiredSegmentParameters = API_SEGMENT_TYPE_MAP[segment.segmentType];
		if (!requiredSegmentParameters) {
			errorAggregator.catch(() => {
				throw new UnknownSegmentTypeError(`Unknown segment type: "${segment.segmentType}" at index ${index}`);
			});
		} else {
			requiredSegmentParameters.validateSegmentProperties(segment, errorAggregator, index);
		}
		return segment;
	});
};
