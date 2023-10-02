import { BOOLEAN_FIELD, IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { ITypeCurveRepWell, ITypeCurveRepWellPhase } from '@src/models/type-curve';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { TypeCurveRepWellField } from './type-curve-rep-wells';

export type TypeCurveRepWellPhaseField<T> = IField<ITypeCurveRepWellPhase, T>;

type Phases = 'gas' | 'oil' | 'water';
const typeCurveRepPhaseWellWriteDbField = <K extends keyof ITypeCurveRepWellPhase, TParsed = ITypeCurveRepWellPhase[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => ({ ...readWriteDbField<ITypeCurveRepWellPhase, K, TParsed>(key, definition, options), key });
export const API_TYPE_CURVE_REP_WELLS_PHASE = {
	eur: typeCurveRepPhaseWellWriteDbField('eur', NUMBER_FIELD),
	dataFrequency: typeCurveRepPhaseWellWriteDbField('data_freq', NUMBER_FIELD),
	eurPll: typeCurveRepPhaseWellWriteDbField('eur/pll', STRING_FIELD),
	forecastType: typeCurveRepPhaseWellWriteDbField('forecast_type', STRING_FIELD),
	hasData: typeCurveRepPhaseWellWriteDbField('has_data', BOOLEAN_FIELD),
	hasForecast: typeCurveRepPhaseWellWriteDbField('has_forecast', BOOLEAN_FIELD),
	rep: typeCurveRepPhaseWellWriteDbField('rep', BOOLEAN_FIELD),
	valid: typeCurveRepPhaseWellWriteDbField('valid', BOOLEAN_FIELD),
};

export type ApiTypeCurveRepWellPhaseKey = keyof typeof API_TYPE_CURVE_REP_WELLS_PHASE;

type TypeOfTypeCurveRepWellPhaseField<FT> = FT extends TypeCurveRepWellPhaseField<infer T> ? T : never;

export type ApiTypeCurveRepWellPhase = {
	[key in ApiTypeCurveRepWellPhaseKey]?: TypeOfTypeCurveRepWellPhaseField<
		(typeof API_TYPE_CURVE_REP_WELLS_PHASE)[key]
	>;
};

export const typeCurveRepWellPhaseFields = (phase: Phases): TypeCurveRepWellField<ApiTypeCurveRepWellPhase> => ({
	type: OpenApiDataType.object,
	properties: API_TYPE_CURVE_REP_WELLS_PHASE,
	read: (typeCurveWell) => toApiTypeCurveRepPhaseWell(typeCurveWell, phase),
});

export const toApiTypeCurveRepPhaseWell = (
	typeCurveRepWellField: ITypeCurveRepWell,
	phase: Phases,
): ApiTypeCurveRepWellPhase => {
	const apiTypeCurveRepWellField: Record<string, string | number | boolean | ITypeCurveRepWellPhase> = {};
	Object.entries(API_TYPE_CURVE_REP_WELLS_PHASE).forEach(([field, { key }]) => {
		const keyToLookUp = `${phase}_${key}`;
		const value = typeCurveRepWellField[keyToLookUp];
		if (typeof value === 'string' && (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no')) {
			apiTypeCurveRepWellField[field] = value.toLowerCase() === 'yes';
		} else {
			apiTypeCurveRepWellField[field] = value;
		}
	});
	return apiTypeCurveRepWellField;
};
