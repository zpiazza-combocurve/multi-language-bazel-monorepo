/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { DeterministicForecastDataSchema, ForecastDataSchema } from '../schemas';

export const BASE_PHASES = ['oil', 'gas', 'water'] as const;

export type BasePhases = (typeof BASE_PHASES)[number];

export const FORECAST_DATA_STATUS = ['approved', 'rejected', 'in_progress', 'submitted'] as const;

export type ForecastDataStatus = (typeof FORECAST_DATA_STATUS)[number];

export const DETERMINISTIC_FORECAST_DATA_FORECAST_TYPE = ['rate', 'not_forecasted', 'ratio', 'stream_based'] as const;

export type DeterministicForecastDataForecastType = (typeof DETERMINISTIC_FORECAST_DATA_FORECAST_TYPE)[number];

export const P_SERIES = ['P10', 'P50', 'P90', 'best'] as const;

export type PSeries = (typeof P_SERIES)[number];

export const isPSeries = (x: string): x is PSeries => {
	return P_SERIES.includes(x as PSeries);
};

export const TYPE_CURVE_FPD_SOURCES = [
	'first_prod_date',
	'first_prod_date_daily_calc',
	'first_prod_date_monthly_calc',
	'schedule',
	'fixed',
];

export type TypeCurveFpdSources = (typeof TYPE_CURVE_FPD_SOURCES)[number];

export const TYPE_CURVE_TYPES = ['rate', 'ratio'];

export type TypeCurveTypes = (typeof TYPE_CURVE_TYPES)[number];

export interface ForecastSegment {
	b?: number;
	c?: number;
	D?: number;
	D_eff?: number;
	D_exp?: number;
	k?: number;
	end_idx?: number;
	name?: string;
	q_end?: number;
	q_start?: number;
	q_sw?: number;
	realized_D_eff_sw?: number;
	start_idx?: number;
	sw_idx?: number;
	target_D_eff_sw?: number;
}

export interface TypeCurveApplySetting {
	applyNormalization?: boolean;
	fpdSource?: TypeCurveFpdSources;
	riskFactor?: number | null;
}

export interface TypeCurveData {
	name?: string;
	tcType?: TypeCurveTypes;
}

interface IBaseForecastData extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	forecast: Types.ObjectId;
	forecasted: boolean;
	forecastedAt: Date | null;
	forecastedBy: Types.ObjectId | null;
	phase: BasePhases;
	project: Types.ObjectId;
	reviewedAt: Date | null;
	reviewedBy: Types.ObjectId | null;
	runDate: Date | null;
	status: ForecastDataStatus;
	typeCurve?: Types.ObjectId | null;
	typeCurveApplySetting?: TypeCurveApplySetting;
	typeCurveData?: TypeCurveData;
	updatedAt?: Date;
	well?: Types.ObjectId;
	data_freq?: string;
}

export interface PDictValue {
	segments?: ForecastSegment[];
	eur?: number;
}

export type PDict = {
	[key in PSeries]?: PDictValue;
};

export interface RatioPDictValue extends PDictValue {
	basePhase?: BasePhases | null;
	eur?: number;
}

export type RatioPDict = {
	[key in PSeries]?: RatioPDictValue;
};

export interface IDeterministicForecastData extends IBaseForecastData {
	forecastType?: DeterministicForecastDataForecastType;
	P_dict?: {
		best?: {
			segments?: ForecastSegment[];
			eur?: number;
		};
	};
	ratio?: RatioPDictValue;
}

export interface IProbabilisticForecastData extends IBaseForecastData {
	P_dict?: PDict;
}

export type IForecastData = IDeterministicForecastData | IProbabilisticForecastData;

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const isDeterministicForecastData = (x: any): x is IDeterministicForecastData => {
	return x.ratio != undefined;
};

export interface IWellForecastDataGroup {
	_id: Types.ObjectId;
	project: Types.ObjectId;
	forecast: Types.ObjectId;
	well: Types.ObjectId;
	outputs: Array<IForecastData>;
}
