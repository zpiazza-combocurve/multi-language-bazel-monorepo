import { DATE_FIELD, IFieldDefinition } from '@src/helpers/fields';
import { IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { TypeCurveVolumeFit } from '@src/models/type-curve';

import { ApiTypeCurveVolumeFitsPhase, typeCurveVolumeFitsPhaseFields } from './type-curve-volume-fits-phase';

export type WellsRepVolumeFitQuery = {
	skip?: number;
	limit?: number;
};
export type TypeCurveVolumeFitField<T> = IField<TypeCurveVolumeFit, T>;

const typeCurveVolumeWriteDbField = <K extends keyof TypeCurveVolumeFit, TParsed = TypeCurveVolumeFit[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<TypeCurveVolumeFit, K, TParsed>(key, definition, options);

export const API_TYPE_CURVE_VOLUME_FIT = {
	date: typeCurveVolumeWriteDbField('Date', DATE_FIELD),
	gas: typeCurveVolumeFitsPhaseFields('gas'),
	oil: typeCurveVolumeFitsPhaseFields('oil'),
	water: typeCurveVolumeFitsPhaseFields('water'),
};

type TypeOfTypeCurveVolumeFitField<FT> = FT extends TypeCurveVolumeFitField<infer T> ? T : never;
export type TypeCurveVolumeFitKey = keyof typeof API_TYPE_CURVE_VOLUME_FIT;

export type ApiTypeCurveVolumeFit = {
	[key in TypeCurveVolumeFitKey]?: TypeOfTypeCurveVolumeFitField<(typeof API_TYPE_CURVE_VOLUME_FIT)[key]>;
};

export const toApiTypeCurveVolumeFit = (typeCurveFitVolume: TypeCurveVolumeFit): ApiTypeCurveVolumeFit => {
	const apiTypeCurveVolumeFit: Record<string, string | Date | ApiTypeCurveVolumeFitsPhase> = {};
	Object.entries(API_TYPE_CURVE_VOLUME_FIT).forEach(([field, { read }]) => {
		if (field === 'date') {
			apiTypeCurveVolumeFit[field] = new Date(typeCurveFitVolume['Date']).toISOString().split('T')[0];
		} else if (read) {
			apiTypeCurveVolumeFit[field] = read(typeCurveFitVolume);
		}
	});
	return apiTypeCurveVolumeFit;
};
