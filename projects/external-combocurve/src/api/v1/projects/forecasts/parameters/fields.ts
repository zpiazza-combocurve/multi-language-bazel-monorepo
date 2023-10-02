import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { checkExtraneousFields, checkMissingFields, validateDateFields, validateNumberFields } from './validation';

export const FORECAST_PARAMETERS_WRITE_RECORD_LIMIT = 25;

export const API_BASE_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate'];

export const API_ARPS_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate', 'qStart', 'qEnd', 'diEffSec', 'b'];

export const API_ARPS_INCLINE_SEGMENT_FIELDS = [
	'segmentType',
	'startDate',
	'endDate',
	'qStart',
	'qEnd',
	'diEffSec',
	'b',
];

export const API_EXP_DECLINE_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate', 'qStart', 'qEnd', 'diEffSec'];

export const API_EXP_INCLINE_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate', 'qStart', 'qEnd', 'diEffSec'];

export const API_FLAT_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate', 'flatValue'];

export const API_LINEAR_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate', 'qStart', 'qEnd', 'slope'];

export const API_MODIFIED_ARPS_SEGMENT_FIELDS = [
	'segmentType',
	'startDate',
	'endDate',
	'qStart',
	'qEnd',
	'diEffSec',
	'b',
	'targetDSwEffSec',
];

export const API_SHUT_IN_PERIOD_SEGMENT_FIELDS = ['segmentType', 'startDate', 'endDate'];

const START_DATE_PROPERTY = 'startDate';
const END_DATE_PROPERTY = 'endDate';
const SEGMENT_TYPE_PROPERTY = 'segmentType';

export const API_FORECAST_SEGMENT_SCHEMA = {
	segmentType: 'string',
	startDate: 'string',
	endDate: 'string',
	qStart: 0,
	qEnd: 0,
	diEffSec: 0,
	b: 0,
	targetDSwEffSec: 0,
	flatValue: 0,
	slope: 0,
	segmentIndex: 0,
};

export type ApiForecastSegmentInput = {
	startDate: string;
	endDate: string;
	qStart?: number;
	qEnd?: number;
	diEffSec?: number;
	b?: number;
	targetDSwEffSec?: number;
	flatValue?: number;
	slope?: number;
	segmentIndex?: number;
	segmentType: string;
	[key: string]: string | number | undefined;
};

interface ISegmentType {
	validateSegmentProperties(
		segment: ApiForecastSegmentInput,
		errorAggregator: ValidationErrorAggregator,
		index: number,
	): void;
	segmentFields: string[];
}

class BaseSegmentType implements ISegmentType {
	constructor(public segmentFields: string[]) {}
	validateSegmentProperties(
		segment: ApiForecastSegmentInput,
		errorAggregator: ValidationErrorAggregator,
		index: number,
	): void {
		const segmentTypeProperties = Object.keys(segment);
		errorAggregator.catch(() => {
			checkExtraneousFields(segmentTypeProperties, this.segmentFields, segment, index);
		});
		errorAggregator.catch(() => {
			checkMissingFields(segmentTypeProperties, this.segmentFields, segment, index);
		});
		for (let i = 0; i < segmentTypeProperties.length; i++) {
			const propertyName = segmentTypeProperties[i];
			const propertyValue = segment[segmentTypeProperties[i]];
			if (propertyName === START_DATE_PROPERTY || propertyName === END_DATE_PROPERTY) {
				errorAggregator.catch(() => {
					validateDateFields(propertyName, propertyValue, index);
				});
			} else if (propertyName !== SEGMENT_TYPE_PROPERTY) {
				errorAggregator.catch(() => {
					validateNumberFields(propertyName, propertyValue, index);
				});
			}
		}
	}
}
class ArpsSegmentType extends BaseSegmentType {
	constructor() {
		super(API_ARPS_SEGMENT_FIELDS);
	}
}

class ArpsInclineSegmentType extends BaseSegmentType {
	constructor() {
		super(API_ARPS_INCLINE_SEGMENT_FIELDS);
	}
}

class ExpDeclineSegmentType extends BaseSegmentType {
	constructor() {
		super(API_EXP_DECLINE_SEGMENT_FIELDS);
	}
}

class ExpInclineSegmentType extends BaseSegmentType {
	constructor() {
		super(API_EXP_INCLINE_SEGMENT_FIELDS);
	}
}

class FlatSegmentType extends BaseSegmentType {
	constructor() {
		super(API_FLAT_SEGMENT_FIELDS);
	}
}

class LinearSegmentType extends BaseSegmentType {
	constructor() {
		super(API_LINEAR_SEGMENT_FIELDS);
	}
}

class ArpsModifiedSegmentType extends BaseSegmentType {
	constructor() {
		super(API_MODIFIED_ARPS_SEGMENT_FIELDS);
	}
}

class ShutInSegmentType extends BaseSegmentType {
	constructor() {
		super(API_SHUT_IN_PERIOD_SEGMENT_FIELDS);
	}
}

export const API_SEGMENT_TYPE_MAP: { [name: string]: ISegmentType } = {
	arps: new ArpsSegmentType(),
	arps_inc: new ArpsInclineSegmentType(),
	exp_dec: new ExpDeclineSegmentType(),
	exp_inc: new ExpInclineSegmentType(),
	flat: new FlatSegmentType(),
	linear: new LinearSegmentType(),
	arps_modified: new ArpsModifiedSegmentType(),
	empty: new ShutInSegmentType(),
};
