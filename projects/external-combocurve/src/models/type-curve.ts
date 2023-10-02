/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';

export { TypeCurveFitSchema, TypeCurveSchema } from '../schemas';

import { BasePhases, PDict, RatioPDict } from './forecast-data';
import { YesNo } from './econ/shared';

export const TYPE_CURVE_FIT_ALIGN = ['align', 'noalign'] as const;

export type TypeCurveFitAlign = (typeof TYPE_CURVE_FIT_ALIGN)[number];

export const TYPE_CURVE_FIT_TYPE = ['rate', 'ratio'] as const;

export type TypeCurveFitType = (typeof TYPE_CURVE_FIT_TYPE)[number];

export const TYPE_CURVE_NORMALIZATION_STEP_TYPE = ['linear', '1_to_1', 'no_normalization', 'power_law_fit'] as const;

export type TypeCurveNormalizationStepType = (typeof TYPE_CURVE_NORMALIZATION_STEP_TYPE)[number];

export interface ITypeCurve extends Document {
	_id: Types.ObjectId;
	fits?: {
		oil?: Types.ObjectId | null;
		gas?: Types.ObjectId | null;
		water?: Types.ObjectId | null;
	};
	forecast?: Types.ObjectId;
	name: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ITypeCurveFit extends Document {
	_id: Types.ObjectId;
	align?: TypeCurveFitAlign;
	fitType?: TypeCurveFitType | null;
	P_dict?: PDict;
	ratio_P_dict?: RatioPDict;
}

interface TypeCurveNormalizationStepLabel {
	startFeature: string;
	opChain: Array<{ op: string; opFeature: string }>;
}

interface TypeCurveNormalizationStep {
	aValue: number;
	base: {
		x: TypeCurveNormalizationStepLabel;
		y: TypeCurveNormalizationStepLabel;
	};
	bValue: number;
	target: {
		[key: string]: number;
	};
	type: TypeCurveNormalizationStepType;
}

export interface ITypeCurveNormalization extends Document {
	_id: Types.ObjectId;
	phase: BasePhases;
	steps: Array<TypeCurveNormalizationStep>;
}

export type ITypeCurve2 = ITypeCurve & {
	fits?: {
		oil?: ITypeCurveFit;
		gas?: ITypeCurveFit;
		water?: ITypeCurveFit;
	};
};

export interface ITypeCurveRepWell {
	api14: string;
	[key: string]: string | ITypeCurveRepWellPhase;
	oil: ITypeCurveRepWellPhase;
	gas: ITypeCurveRepWellPhase;
	water: ITypeCurveRepWellPhase;
	well_name: string;
	well_number: string;
}

export interface ITypeCurveRepWellPhase {
	data_freq: string;
	eur: number;
	'eur/pll': string;
	forecast_type: string;
	has_data: YesNo | string;
	has_forecast: YesNo | string;
	rep: YesNo | string;
	valid: YesNo | string;
}

export interface TypeCurveVolumeFit {
	Date: string;
	gas: ITypeCurveVolumeFitPhase;
	oil: ITypeCurveVolumeFitPhase;
	water: ITypeCurveVolumeFitPhase;
}
export interface ITypeCurveVolumeFitPhase {
	best?: number | string;
	p10?: number | string;
	p50?: number | string;
	p90?: number | string;
}
