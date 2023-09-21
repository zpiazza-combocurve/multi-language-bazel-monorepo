import { Phase } from '@/forecasts/forecast-form/automatic-form/types';

export type Align = 'align' | 'noalign';
export type BKey = 'average' | 'max' | 'min' | 'median' | 'colAverage' | 'colMedian';
export type DailyRange = {
	[alignType in Align]: Array<number>;
};
export type FitResolution = 'monthly' | 'daily';
export type Mode = 'fit' | 'manual' | 'normalization' | 'view';
export type PhaseType = 'rate' | 'ratio';
export type FitPhaseTypes = { [x in Phase]: PhaseType };
export type PhaseSeries = 'best' | 'P10' | 'P50' | 'P90';

export interface Multiplier {
	eur: number | null;
	qPeak: number | null;
	_id: string;
}

// as part of the rework, these interfaces should be more strictly defined
export interface FitInitType {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}
export interface RawBackgroundDataType {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}

export interface CalculatedBackgroundDataType {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}

export interface SinglePhaseData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	alignMonthlyTargetPhaseData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	cumData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	eurData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	noalignMonthlyTargetProdData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	prodData: any;
}

export type PhaseData = {
	[key in Phase]: SinglePhaseData | null;
};

export type WellsByPhaseObject = Record<Phase, Array<string>>;
