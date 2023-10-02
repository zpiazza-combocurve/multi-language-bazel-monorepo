import { IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { ITypeCurveVolumeFitPhase, TypeCurveVolumeFit } from '@src/models/type-curve';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { TypeCurveVolumeFitField } from './type-curve-volume-fits';

export type TypeCurveRepWellPhaseField<T> = IField<ITypeCurveVolumeFitPhase, T>;

type Phases = 'gas' | 'oil' | 'water';
const typeCurveRepPhaseWellWriteDbField = <
	K extends keyof ITypeCurveVolumeFitPhase,
	TParsed = ITypeCurveVolumeFitPhase[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ITypeCurveVolumeFitPhase, K, TParsed>(key, definition, options);
export const API_TYPE_CURVE_VOLUME_FITS_PHASE = {
	best: typeCurveRepPhaseWellWriteDbField('best', NUMBER_FIELD),
	p10: typeCurveRepPhaseWellWriteDbField('p10', NUMBER_FIELD),
	p50: typeCurveRepPhaseWellWriteDbField('p50', NUMBER_FIELD),
	p90: typeCurveRepPhaseWellWriteDbField('p90', NUMBER_FIELD),
};

export type ApiTypeCurveVolumeFitsPhaseKey = keyof typeof API_TYPE_CURVE_VOLUME_FITS_PHASE;

type TypeOfTypeCurveRepWellPhaseField<FT> = FT extends TypeCurveRepWellPhaseField<infer T> ? T : never;

export type ApiTypeCurveVolumeFitsPhase = {
	[key in ApiTypeCurveVolumeFitsPhaseKey]?: TypeOfTypeCurveRepWellPhaseField<
		(typeof API_TYPE_CURVE_VOLUME_FITS_PHASE)[key]
	>;
};

export const typeCurveVolumeFitsPhaseFields = (
	phase: Phases,
): TypeCurveVolumeFitField<ApiTypeCurveVolumeFitsPhase> => ({
	type: OpenApiDataType.object,
	properties: API_TYPE_CURVE_VOLUME_FITS_PHASE,
	read: (typeCurveVolumeFit) => toApiTypeCurveRepPhaseWell(typeCurveVolumeFit, phase),
});

export const toApiTypeCurveRepPhaseWell = (
	typeCurveVolumeFit: TypeCurveVolumeFit,
	phase: Phases,
): ApiTypeCurveVolumeFitsPhase => {
	const apiTypeCurveFitVolume = {} as Record<string, number | null>;

	const mappedHash = Object.entries(typeCurveVolumeFit).reduce((prev, [prop, value]) => {
		const phaseWithoutUnit = prop.split(' ').slice(0, 2).join('');
		const propName = phaseWithoutUnit.toLocaleLowerCase();

		return { ...prev, [propName]: value };
	}, {}) as Record<string, null | number | string>;
	Object.entries(API_TYPE_CURVE_VOLUME_FITS_PHASE).forEach(([field]) => {
		const keyToLookUp = `${phase}${field}`;
		const value = mappedHash[keyToLookUp];
		apiTypeCurveFitVolume[field] = value === '' ? null : Number(value);
	});
	return apiTypeCurveFitVolume as ApiTypeCurveVolumeFitsPhase;
};
