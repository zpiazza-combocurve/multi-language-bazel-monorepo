import { getStringEnumField, IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { TYPE_CURVE_TYPES, TypeCurveData } from '@src/models/forecast-data';
import { IField } from '@src/api/v1/fields';

export type ApiForecastTypeCurveDataKey = keyof typeof API_FORECAST_TYPE_CURVE_DATA;

type TypeOfForecastTypeCurveDataField<FT> = FT extends ForecastTypeCurveDataField<TypeCurveData, infer T> ? T : never;

export type ApiForecastTypeCurveData = {
	[key in ApiForecastTypeCurveDataKey]?: TypeOfForecastTypeCurveDataField<(typeof API_FORECAST_TYPE_CURVE_DATA)[key]>;
};

export type ForecastTypeCurveDataField<T extends TypeCurveData, TField> = IField<T, TField>;

const readFieldTypeCurveData = <K extends keyof TypeCurveData>(
	key: K,
	definition: IFieldDefinition<TypeCurveData[K]>,
): ForecastTypeCurveDataField<TypeCurveData, TypeCurveData[K]> => {
	return {
		...definition,
		read: (typeCurveData) => typeCurveData[key],
	};
};

export const API_FORECAST_TYPE_CURVE_DATA = {
	name: readFieldTypeCurveData('name', STRING_FIELD),
	type: readFieldTypeCurveData('tcType', getStringEnumField(TYPE_CURVE_TYPES)),
};

export const toApiForecastTypeCurveData = (typeCurveData: TypeCurveData): ApiForecastTypeCurveData => {
	const apiForecastTypeCurveData: Record<string, ApiForecastTypeCurveData[ApiForecastTypeCurveDataKey]> = {};
	Object.entries(API_FORECAST_TYPE_CURVE_DATA).forEach(([field, { read }]) => {
		if (read) {
			apiForecastTypeCurveData[field] = read(typeCurveData);
		}
	});
	return apiForecastTypeCurveData;
};
