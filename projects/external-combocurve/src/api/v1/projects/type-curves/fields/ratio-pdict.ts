import { API_FORECAST_SEGMENT_FIELDS, ApiRatioPDictValue, toApiForecastSegment } from '@src/helpers/segments';
import { PSeries, RatioPDict } from '@src/models/forecast-data';
import { IField } from '@src/api/v1/fields';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

type IRatioPDictField<T> = IField<RatioPDict, T>;

const getRatioPDictValue = (serie: PSeries): IRatioPDictField<ApiRatioPDictValue | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: {
			segments: {
				type: OpenApiDataType.array,
				items: { type: OpenApiDataType.object, properties: API_FORECAST_SEGMENT_FIELDS },
			},
			basePhase: {
				type: OpenApiDataType.string,
			},
		},
		read: (ratioPDict) => {
			const segments = ratioPDict?.[serie]?.segments;
			const basePhase = ratioPDict?.[serie]?.basePhase;
			if (!segments?.length || segments.length === 0) {
				return undefined;
			}
			return {
				segments: segments.map(toApiForecastSegment),
				basePhase: basePhase,
			};
		},
	};
};

const API_RATIO_PDICT_FIELDS = {
	best: getRatioPDictValue('best'),
	p10: getRatioPDictValue('P10'),
	p50: getRatioPDictValue('P50'),
	p90: getRatioPDictValue('P90'),
};

export default API_RATIO_PDICT_FIELDS;

export type ApiRatioPDictKey = keyof typeof API_RATIO_PDICT_FIELDS;

type TypeOfField<FT> = FT extends IRatioPDictField<infer T> ? T : never;

export type ApiRatioPDict = { [key in ApiRatioPDictKey]?: TypeOfField<(typeof API_RATIO_PDICT_FIELDS)[key]> };

export const toApiRatioPDict = (ratioPDict: RatioPDict): ApiRatioPDict => {
	const apiRatioPDict: Record<string, ApiRatioPDict[ApiRatioPDictKey]> = {};
	Object.entries(API_RATIO_PDICT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiRatioPDict[field] = read(ratioPDict);
		}
	});
	return apiRatioPDict;
};
