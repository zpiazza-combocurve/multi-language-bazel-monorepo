import { BasePhases, ForecastSegment } from '@src/models/forecast-data';
import { IField } from '@src/api/v1/fields';

import { DATE_FIELD, IFieldDefinition, INTEGER_FIELD, NUMBER_FIELD, STRING_FIELD } from './fields';
import { indexToDate } from './dates';

export interface ApiPDictValue {
	segments: ApiForecastSegment[];
	eur?: number;
}

export interface ApiRatioPDictValue extends ApiPDictValue {
	basePhase?: BasePhases | null;
}

export type ApiForecastSegmentKey = keyof typeof API_FORECAST_SEGMENT_FIELDS;

type TypeOfSegmentField<FT> = FT extends ForecastSegmentField<ForecastSegment, infer T> ? T : never;

export type ApiForecastSegment = {
	[key in ApiForecastSegmentKey]?: TypeOfSegmentField<(typeof API_FORECAST_SEGMENT_FIELDS)[key]>;
};

export type ForecastSegmentField<T extends ForecastSegment, TField> = IField<T, TField>;

const readFieldSegment = <K extends keyof ForecastSegment>(
	key: K,
	definition: IFieldDefinition<ForecastSegment[K]>,
): ForecastSegmentField<ForecastSegment, ForecastSegment[K]> => {
	return {
		...definition,
		read: (forecastSegment) => forecastSegment[key],
	};
};

const numberDateField = <K extends keyof ForecastSegment>(key: K): ForecastSegmentField<ForecastSegment, Date> => ({
	...DATE_FIELD,
	read: (record) => indexToDate((record[key] as number) ?? 0),
});

export const segmentIndexField: ForecastSegmentField<ForecastSegment, number | undefined> = {
	...INTEGER_FIELD,
	read: () => undefined,
};

export const API_FORECAST_SEGMENT_FIELDS = {
	b: readFieldSegment('b', NUMBER_FIELD),
	diEffSec: readFieldSegment('D_eff', NUMBER_FIELD),
	diNominal: readFieldSegment('D', NUMBER_FIELD),
	endDate: numberDateField('end_idx'),
	flatValue: readFieldSegment('c', NUMBER_FIELD),
	qEnd: readFieldSegment('q_end', NUMBER_FIELD),
	qStart: readFieldSegment('q_start', NUMBER_FIELD),
	realizedDSwEffSec: readFieldSegment('realized_D_eff_sw', NUMBER_FIELD),
	segmentIndex: segmentIndexField,
	segmentType: readFieldSegment('name', STRING_FIELD),
	slope: readFieldSegment('k', NUMBER_FIELD),
	startDate: numberDateField('start_idx'),
	swDate: numberDateField('sw_idx'),
	targetDSwEffSec: readFieldSegment('target_D_eff_sw', NUMBER_FIELD),
};

export const toApiForecastSegment = (forecastSegment: ForecastSegment, index: number): ApiForecastSegment => {
	const apiForecastSegment: Record<string, ApiForecastSegment[ApiForecastSegmentKey]> = {};
	Object.entries(API_FORECAST_SEGMENT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecastSegment[field] = read(forecastSegment);
		}
	});
	apiForecastSegment['segmentIndex'] = index + 1;
	return apiForecastSegment;
};
