/* eslint-disable @typescript-eslint/no-unused-vars */
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';

interface TypeCurveNormalization {
	_id: string;
	phase: string;
	typeCurve: string;
	steps: { normalizationType: string; eur: TypeCurveStep; qPeak: TypeCurveStep };
	createdAt: string;
	updatedAt: string;
}

export interface TypeCurveHeaders {
	first_prod_date?: Date | null;
	perf_lateral_length?: number | null;
	true_vertical_depth?: number | null;
	total_prop_weight?: number | null;
}

export interface TypeCurve extends Inpt.TypeCurve {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeUmbrellas?: Record<string, any>;
	forecastSeries?: string;
	forecastType?: string;
	headers?: TypeCurveHeaders;
	name: string;
	normalizations: Record<Phase, TypeCurveNormalization | undefined>;
	pSeries?: { percentile: string };
	regressionType?: 'rate' | 'cum';
	resolutionPreference?: string;
	wellValidationCriteria?: string;
}

export interface TypeCurveWellData {
	well_id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	header: Record<string, any>;
	rep: Record<Phase, boolean>;
	forecast_info: Record<Phase, { forecast_data_freq: string; forecast_type: string; has_forecast: boolean }>;
	data_info: Record<Phase, { has_dail: boolean; has_monthly: boolean; has_data: boolean }>;
	assignment: Record<Phase, boolean>;
	valid: Record<Phase, boolean>;
	monthly_production: Record<
		Phase,
		{ index: number[]; value: number[]; align_offset: number; cumsum_multiplier: number }
	>;
	daily_production: Record<
		Phase,
		{ index: number[]; value: number[]; align_offset: number; cumsum_multiplier: number }
	>;
	eur: Record<Phase, number>;
	peak_rate: Record<Phase, number>;
}

export interface TypeCurveWellHeaders {
	_id: string;
	perf_lateral_length?: number;
	well_name: string;
}

namespace TypeCurveStep {
	namespace Base {
		namespace Axis {
			interface Chain {
				op: string;
				opFeature: string;
			}
		}
		interface Axis {
			startFeature: string;
			opChain: Axis.Chain[];
		}
	}
	interface Base {
		x: Base.Axis;
		y: Base.Axis;
	}
}

export interface TypeCurveStep {
	key: string;
	name: string;
	type: string;
	target: Record<string, number>;
	base: TypeCurveStep.Base;
	rangeStart: number;
	rangeEnd: number;
	diverged?: boolean;
}

export interface TypeCurveNormalizationTemplate {
	bases: TypeCurveStep.Base[];
}

export interface TypeCurveNormalizationData {
	_id: string;
	fit: boolean[];
	normalize: boolean[];
	multipliers: number[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headers: { _id: string } & Record<string, any>;
	normalization: string;
	phase: string;
	well: string;
	typeCurve: string;
}
