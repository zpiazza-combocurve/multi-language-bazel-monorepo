import { isEmpty, pickBy } from 'lodash';

import { API_FORECAST_SEGMENT_FIELDS, ApiPDictValue, toApiForecastSegment } from '@src/helpers/segments';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { ITypeCurveFit, TYPE_CURVE_FIT_ALIGN, TYPE_CURVE_FIT_TYPE } from '@src/models/type-curve';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { PSeries } from '@src/models/forecast-data';

import API_RATIO_PDICT_FIELDS, { ApiRatioPDict, toApiRatioPDict } from './ratio-pdict';

type ITypeCurveFitField<T> = IField<ITypeCurveFit, T>;

const readTypeCurveFitField = <K extends keyof ITypeCurveFit, TParsed = ITypeCurveFit[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<ITypeCurveFit, K, TParsed>(key, definition, options);

const getPDictValue = (serie: PSeries): ITypeCurveFitField<ApiPDictValue | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: {
			segments: {
				type: OpenApiDataType.array,
				items: { type: OpenApiDataType.object, properties: API_FORECAST_SEGMENT_FIELDS },
			},
		},
		read: (typeCurveFit) => {
			const segments = typeCurveFit?.P_dict?.[serie]?.segments;
			if (!segments?.length || segments.length === 0) {
				return undefined;
			}
			return {
				segments: segments.map(toApiForecastSegment),
			};
		},
	};
};

const getRatioPDict = (): ITypeCurveFitField<ApiRatioPDict | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: API_RATIO_PDICT_FIELDS,
		read: (typeCurveFit) => {
			const ratio = typeCurveFit?.ratio_P_dict && toApiRatioPDict(typeCurveFit.ratio_P_dict);
			const ratioWithoutUndefined = pickBy(ratio, (val) => val !== undefined);
			return isEmpty(ratioWithoutUndefined) ? undefined : ratioWithoutUndefined;
		},
	};
};

const API_TYPE_CURVE_FIT_FIELDS = {
	align: readTypeCurveFitField('align', getStringEnumField(TYPE_CURVE_FIT_ALIGN)),
	best: getPDictValue('best'),
	type: readTypeCurveFitField('fitType', getStringEnumField(TYPE_CURVE_FIT_TYPE)),
	p10: getPDictValue('P10'),
	p50: getPDictValue('P50'),
	p90: getPDictValue('P90'),
	ratio: getRatioPDict(),
};

export default API_TYPE_CURVE_FIT_FIELDS;

export type ApiTypeCurveFitKey = keyof typeof API_TYPE_CURVE_FIT_FIELDS;

type TypeOfField<FT> = FT extends ITypeCurveFitField<infer T> ? T : never;

export type ApiTypeCurveFit = { [key in ApiTypeCurveFitKey]?: TypeOfField<(typeof API_TYPE_CURVE_FIT_FIELDS)[key]> };

export const toApiTypeCurveFit = (typeCurveFit: ITypeCurveFit): ApiTypeCurveFit => {
	const apiTypeCurveFit: Record<string, ApiTypeCurveFit[ApiTypeCurveFitKey]> = {};
	Object.entries(API_TYPE_CURVE_FIT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiTypeCurveFit[field] = read(typeCurveFit);
		}
	});
	return apiTypeCurveFit;
};
