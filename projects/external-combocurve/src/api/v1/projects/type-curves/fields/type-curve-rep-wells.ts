import { IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { ITypeCurveRepWell } from '@src/models/type-curve';

import { typeCurveRepWellPhaseFields } from './type-curve-rep-wells-phase';

export type TypeCurveRepWellField<T> = IField<ITypeCurveRepWell, T>;

const typeCurveRepWellWriteDbField = <K extends keyof ITypeCurveRepWell, TParsed = ITypeCurveRepWell[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ITypeCurveRepWell, K, TParsed>(key, definition, options);

export const API_TYPE_CURVE_REP_WELLS = {
	api14: typeCurveRepWellWriteDbField('api14', STRING_FIELD),
	wellName: typeCurveRepWellWriteDbField('well_name', STRING_FIELD),
	wellNumber: typeCurveRepWellWriteDbField('well_number', STRING_FIELD),
	gas: typeCurveRepWellPhaseFields('gas'),
	oil: typeCurveRepWellPhaseFields('oil'),
	water: typeCurveRepWellPhaseFields('water'),
};

export type ApiTypeCurveRepWellKey = keyof typeof API_TYPE_CURVE_REP_WELLS;

type TypeOfTypeCurveRepWellFField<FT> = FT extends TypeCurveRepWellField<infer T> ? T : never;

export type ApiTypeCurveRepWell = {
	[key in ApiTypeCurveRepWellKey]?: TypeOfTypeCurveRepWellFField<(typeof API_TYPE_CURVE_REP_WELLS)[key]>;
};

export const toApiTypeCurveRepWell = (typeCurveRepWellField: ITypeCurveRepWell): ApiTypeCurveRepWell => {
	const apiTypeCurveRepWellField: Record<string, ApiTypeCurveRepWell[ApiTypeCurveRepWellKey]> = {};
	Object.entries(API_TYPE_CURVE_REP_WELLS).forEach(([field, { read }]) => {
		if (read) {
			apiTypeCurveRepWellField[field] = read(typeCurveRepWellField);
		}
	});
	return apiTypeCurveRepWellField;
};
